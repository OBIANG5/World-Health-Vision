"""DATA-1C-A2B: synthetic-only original-byte witness tests.

The ONLY signer implemented for real IBGE/WDI captures issues
PRIVATE_RESEARCH_VALIDATION, NEVER PUBLIC_API_INGEST. It cannot authorize
commercial use or bypass the receiver's protected research dataset gate.
"""
from __future__ import annotations

import base64
from hashlib import sha256
from pathlib import Path
import json
import shutil

import pytest
from cryptography.hazmat.primitives.asymmetric.ed25519 import Ed25519PrivateKey

from ingestion_service.acquisition_journal import AcquisitionJournal
from ingestion_service.evidence_items_fingerprint import (
    items_sha256, projection_items_from_verified_normalized,
)
from ingestion_service.private_bronze_witness import PrivateBronzeWitness, _signing_payload
from ingestion_service.source_evidence_store import EvidenceIntegrityError, QuarantinedJsonEvidenceStore
from test_ibge_acquisition_composite import capture_population, population_transport

KEY = None


def capture(root):
    evidence = capture_population(root)
    directory = root / "ibge" / "censo2022_4714" / "_acquisitions"
    events = list(directory.iterdir())
    assert len(events) == 1
    return evidence, events[0].name


def witness(root, **kwargs):
    return PrivateBronzeWitness(
        bronze_root=root, signing_key=kwargs.get("key") or Ed25519PrivateKey.generate(),
    )


def token(root):
    evidence, event_id = capture(root)
    signer = Ed25519PrivateKey.generate()
    attestation = witness(root, key=signer).certify_research_only(
        source_code="IBGE", dataset_code="CENSO2022_4714",
        original_http_sha256=evidence.notes["httpBodySha256"],
        acquisition_event_id=event_id,
    )
    return signer, evidence, event_id, attestation


def test_officially_pinned_synthetic_source_creates_cryptographic_research_proof(tmp_path):
    private_key, evidence, event_id, proof = token(tmp_path)
    assert proof["operation"] == "PRIVATE_RESEARCH_VALIDATION"
    assert proof["schema"] == "WORLD_VISION_BRONZE_WITNESS_V2"
    from ingestion_service import semantic_source_replay as replay_source
    assert proof["semanticVerifierVersion"] == replay_source.SEMANTIC_REPLAY_VERSION
    assert proof["semanticVerifierCodeSha256"] == sha256(
        Path(replay_source.__file__).read_bytes()
    ).hexdigest()
    assert proof["acquisitionEventId"] == event_id
    assert proof["sourceCode"] == "IBGE"
    assert proof["datasetCode"] == "CENSO2022_4714"
    assert proof["runKey"] == evidence.run_id
    assert proof["originalHttpSha256"] == sha256(evidence.raw_payload_path.read_bytes()).hexdigest()
    assert proof["normalizedNdjsonSha256"] == sha256(
        evidence.normalized_payload_path.read_bytes()
    ).hexdigest()
    assert proof["manifestSha256"] == sha256(evidence.manifest_path.read_bytes()).hexdigest()
    outcome_path = (
        tmp_path / "ibge" / "censo2022_4714" / "_acquisitions" / event_id / "outcome.json"
    )
    assert proof["acquisitionOutcomeSha256"] == sha256(outcome_path.read_bytes()).hexdigest()
    items = projection_items_from_verified_normalized(
        source_code="IBGE",
        normalized_ndjson=evidence.normalized_payload_path.read_bytes(),
    )
    assert proof["itemsSha256"] == items_sha256(items)
    private_key.public_key().verify(
        base64.b64decode(proof["signatureBase64"]),
        _signing_payload(proof),
    )
    assert proof["expiresAtEpochSec"] - proof["issuedAtEpochSec"] <= 300
    assert "123456789" not in json.dumps(proof)
    assert "original.http.json" not in json.dumps(proof)
    assert "PRIVATE_RESEARCH_VALIDATION" in json.dumps(proof)
    assert not list(tmp_path.rglob("timeseries"))


@pytest.mark.parametrize("field", [
    "sourceCode", "datasetCode", "runKey", "originalHttpSha256",
    "normalizedNdjsonSha256", "manifestSha256", "itemsSha256",
    "acquisitionEventId", "acquisitionOutcomeSha256",
    "operation", "semanticVerifierVersion", "semanticVerifierCodeSha256",
    "issuedAtEpochSec", "expiresAtEpochSec",
])
def test_any_changed_scope_or_content_breaks_witness_signature(tmp_path, field):
    private, _, _, proof = token(tmp_path)
    altered = proof.copy()
    altered[field] = ("0" * 64) if isinstance(proof[field], str) else 1
    with pytest.raises(Exception):
        private.public_key().verify(
            base64.b64decode(proof["signatureBase64"]),
            _signing_payload(altered),
        )


def test_corrupt_original_http_source_refused_even_with_same_declared_sha(tmp_path):
    evidence, event = capture(tmp_path)
    evidence.raw_payload_path.write_bytes(b"not the previously signed HTTP JSON")
    with pytest.raises(EvidenceIntegrityError):
        witness(tmp_path).certify_research_only(
            source_code="IBGE", dataset_code="CENSO2022_4714",
            original_http_sha256=evidence.notes["httpBodySha256"],
            acquisition_event_id=event,
        )


def test_corrupt_normalized_rows_or_manifest_refused(tmp_path):
    evidence, event = capture(tmp_path)
    backup = evidence.normalized_payload_path.read_bytes()
    evidence.normalized_payload_path.write_bytes(backup.replace(b"123456789", b"123456788"))
    with pytest.raises(EvidenceIntegrityError):
        witness(tmp_path).certify_research_only(
            source_code="IBGE", dataset_code="CENSO2022_4714",
            original_http_sha256=evidence.notes["httpBodySha256"],
            acquisition_event_id=event,
        )
    evidence.normalized_payload_path.write_bytes(backup)
    evidence.manifest_path.write_text(evidence.manifest_path.read_text().replace(
        "BRONZE_ONLY_UNREVIEWED", "PUBLIC_APPROVED"
    ))
    with pytest.raises(EvidenceIntegrityError):
        witness(tmp_path).certify_research_only(
            source_code="IBGE", dataset_code="CENSO2022_4714",
            original_http_sha256=evidence.notes["httpBodySha256"],
            acquisition_event_id=event,
        )


def test_journal_failure_and_interruption_cannot_impersonate_success(tmp_path):
    journal = AcquisitionJournal(tmp_path)
    url = ("https://servicodados.ibge.gov.br/api/v3/agregados/"
           "4714/periodos/2022/variaveis/93?localidades=N1%5Ball%5D")
    failed = journal.begin(source_code="IBGE", dataset_code="CENSO2022_4714", source_url=url)
    journal.failure(failed, error=RuntimeError("synthetic failure"))
    interrupted = journal.begin(
        source_code="IBGE", dataset_code="CENSO2022_4714", source_url=url,
    )
    pop = capture_population(tmp_path)
    for event in (failed.event_id, interrupted.event_id):
        with pytest.raises(EvidenceIntegrityError):
            witness(tmp_path).certify_research_only(
                source_code="IBGE", dataset_code="CENSO2022_4714",
                original_http_sha256=pop.notes["httpBodySha256"],
                acquisition_event_id=event,
            )


def test_event_sha_mismatch_or_forged_provider_event_fails_audit(tmp_path):
    evidence, event = capture(tmp_path)
    outcome = (
        tmp_path / "ibge" / "censo2022_4714" / "_acquisitions" / event / "outcome.json"
    )
    outcome.write_text(outcome.read_text().replace(
        evidence.notes["httpBodySha256"], "0" * 64
    ))
    with pytest.raises(EvidenceIntegrityError):
        witness(tmp_path).certify_research_only(
            source_code="IBGE", dataset_code="CENSO2022_4714",
            original_http_sha256=evidence.notes["httpBodySha256"],
            acquisition_event_id=event,
        )


def test_other_source_and_fake_custom_dataset_cannot_be_research_attested(tmp_path):
    evidence, event = capture(tmp_path)
    for source, dataset in (
        ("WORLD_BANK", "CENSO2022_4714"),
        ("IBGE", "UNKNOWN_SOURCE"),
        ("SYNTHETIC", "SYNTHETIC"),
    ):
        with pytest.raises(EvidenceIntegrityError):
            witness(tmp_path).certify_research_only(
                source_code=source, dataset_code=dataset,
                original_http_sha256=evidence.notes["httpBodySha256"],
                acquisition_event_id=event,
            )
    with pytest.raises(EvidenceIntegrityError):
        witness(tmp_path).certify_research_only(
            source_code="IBGE", dataset_code="CENSO2022_4714",
            original_http_sha256=evidence.notes["httpBodySha256"],
            acquisition_event_id=event, lifetime_seconds=86400,
        )


def test_verified_backup_restore_still_attests_exact_original_bytes(tmp_path):
    original, restored = tmp_path / "original", tmp_path / "restored"
    evidence, event = capture(original)
    shutil.copytree(original, restored)
    attestation = witness(restored).certify_research_only(
        source_code="IBGE", dataset_code="CENSO2022_4714",
        original_http_sha256=evidence.notes["httpBodySha256"],
        acquisition_event_id=event,
    )
    assert attestation["normalizedNdjsonSha256"] == evidence.notes["normalizedNdjsonSha256"]
    assert attestation["operation"] == "PRIVATE_RESEARCH_VALIDATION"


def test_item_projection_changes_if_numeric_flag_or_metadata_changes(tmp_path):
    evidence, _ = capture(tmp_path)
    items = projection_items_from_verified_normalized(
        source_code="IBGE", normalized_ndjson=evidence.normalized_payload_path.read_bytes()
    )
    original = items_sha256(items)
    for field, value in (
        ("numericValue", 99.0),
        ("countryIso3", "ARG"),
        ("qualityFlags", ["WRONG_QUALITY"]),
        ("sourceMetadata", {"sourceYear": "2030"}),
    ):
        copy = [{**item} for item in items]
        copy[0][field] = value
        assert items_sha256(copy) != original


def test_projection_rejects_dangerous_unsupported_non_finite_and_duplicate(tmp_path):
    evidence, _ = capture(tmp_path)
    items = projection_items_from_verified_normalized(
        source_code="IBGE", normalized_ndjson=evidence.normalized_payload_path.read_bytes()
    )
    with pytest.raises(EvidenceIntegrityError):
        items_sha256(items + items)
    invalid = [{**items[0], "numericValue": float("nan")}]
    with pytest.raises(EvidenceIntegrityError):
        items_sha256(invalid)
    invalid = [{**items[0], "sourceMetadata": {"unsafe key with spaces": "X"}}]
    with pytest.raises(EvidenceIntegrityError):
        items_sha256(invalid)



def test_cross_language_java_python_projection_vector_is_stable():
    # EXACT same test fixture as Java EvidenceItemsFingerprintTest.java.
    golden = "cd3c0117ff783f8f0c18aa6075eb8062ffb60f68ab44544edc6268ae79a7fb4d"
    fixture = [{
        "indicatorCode": "SYNTH.RIGHTS.GDP", "countryIso3": "FRA",
        "periodGranularity": "ANNUAL", "periodStart": "2024-01-01",
        "periodEnd": "2024-12-31", "periodLabel": "2024",
        "numericValue": 17.0, "textValue": None, "valueStatus": "OBSERVED",
        "sourcePublishedAt": None,
        "sourceMetadata": {
            "sourcePeriodLabel": "2024",
            "sourceYear": "2024",
            "syntheticTestOnly": True,
        },
        "qualityFlags": ["SYNTHETIC_ONLY"],
    }]
    assert items_sha256(fixture) == golden
    fixture[0]["sourceMetadata"]["sourceYear"] = "2025"
    assert items_sha256(fixture) != golden



def test_java_python_witness_signed_payload_immutable_vector():
    # Same fields and unsigned bytes as EvidenceSigningPayloadTest.java.
    synthetic = {
        "schema": "WORLD_VISION_BRONZE_WITNESS_V2",
        "operation": "PRIVATE_RESEARCH_VALIDATION",
        "sourceCode": "IBGE",
        "datasetCode": "CENSO2022_4714",
        "runKey": "sha256-" + "b" * 64,
        "fetchedAtEpochSec": 1795176000,
        "fetchedAtNano": 123456000,
        "originalHttpSha256": "b" * 64,
        "normalizedNdjsonSha256": "c" * 64,
        "manifestSha256": "d" * 64,
        "acquisitionEventId": "e" * 32,
        "acquisitionOutcomeSha256": "f" * 64,
        "itemsSha256": "cd3c0117ff783f8f0c18aa6075eb8062ffb60f68ab44544edc6268ae79a7fb4d",
        "semanticVerifierVersion": "WORLD_VISION_SEMANTIC_POPULATION_REPLAY_V1",
        "semanticVerifierCodeSha256": "9" * 64,
        "issuedAtEpochSec": 1795176000,
        "expiresAtEpochSec": 1795176180,
        "signingPublicKeySha256": "a" * 64,
    }
    digest = sha256(_signing_payload(synthetic)).hexdigest()
    assert digest == "ad6c456304ac78a48209327f056ce4e1fe35b02a693410359fd8a6635014d72d"



def test_wdi_brazil_research_witness_verifies_an_estimate_without_reclassifying_observed(tmp_path):
    # The fake provider bytes and values below are SYNTHETIC (not real WDI).
    from test_ibge_wdi_population_comparability import capture_wdi
    raw = capture_wdi(tmp_path)
    events = list((tmp_path / "world_bank" / "wdi_pop_total_bra_2022" / "_acquisitions").iterdir())
    assert len(events) == 1
    private = Ed25519PrivateKey.generate()
    proof = witness(tmp_path, key=private).certify_research_only(
        source_code="WORLD_BANK", dataset_code="WDI_POP_TOTAL_BRA_2022",
        original_http_sha256=raw.notes["httpBodySha256"],
        acquisition_event_id=events[0].name,
    )
    assert proof["operation"] == "PRIVATE_RESEARCH_VALIDATION"
    assert proof["sourceCode"] == "WORLD_BANK"
    assert proof["datasetCode"] == "WDI_POP_TOTAL_BRA_2022"
    items = projection_items_from_verified_normalized(
        source_code="WORLD_BANK",
        normalized_ndjson=raw.normalized_payload_path.read_bytes(),
    )
    assert items[0]["valueStatus"] == "ESTIMATED"
    assert proof["itemsSha256"] == items_sha256(items)
    private.public_key().verify(
        base64.b64decode(proof["signatureBase64"]), _signing_payload(proof)
    )
    assert "210000000" not in json.dumps(proof)


@pytest.mark.parametrize("dataset", [
    "CENSO2022_4714_METADATA",
    "CENSO2022_4714_PERIODS",
])
def test_metadata_is_never_mistaken_for_a_numeric_timeseries_source(tmp_path, dataset):
    capture_population(tmp_path)
    from test_ibge_acquisition_composite import capture_metadata
    meta = capture_metadata(tmp_path)
    evidence = (
        meta.aggregate_receipt if dataset.endswith("METADATA")
        else meta.periods_receipt
    )
    event = next((tmp_path / "ibge" / dataset.lower() / "_acquisitions").iterdir()).name
    with pytest.raises(EvidenceIntegrityError):
        witness(tmp_path).certify_research_only(
            source_code="IBGE", dataset_code=dataset,
            original_http_sha256=evidence.notes["httpBodySha256"],
            acquisition_event_id=event,
        )
