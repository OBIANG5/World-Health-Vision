"""Adversarial DATA-1B1 tests. ALL numeric fixtures are SYNTHETIC, not IBGE values."""
import json
from concurrent.futures import ThreadPoolExecutor
from hashlib import sha256

import httpx
import pytest

from ingestion_service.bronze_store import BronzeStore
from ingestion_service.connectors.ibge_national_census_client import IbgeNationalCensusClient
from ingestion_service.pipelines.ibge_national_census import IbgeNationalCensusPilot
from ingestion_service.source_evidence_store import (
    EvidenceIntegrityError,
    QuarantinedJsonEvidenceStore,
)


def fake_payload(value="123456789"):
    return [{
        "id": "93",
        "variavel": "População residente",
        "unidade": "Pessoas",
        "resultados": [{
            "classificacoes": [],
            "series": [{
                "localidade": {"id": "1", "nivel": {"id": "N1", "nome": "Brasil"}, "nome": "Brasil"},
                "serie": {"2022": value},
            }],
        }],
    }]


def body_for(value="123456789", *, spaced=True):
    return json.dumps(
        fake_payload(value), ensure_ascii=False,
        indent=3 if spaced else None,
    ).encode("utf-8")


def capture(tmp_path, body: bytes):
    def respond(request):
        assert request.url.host == "servicodados.ibge.gov.br"
        return httpx.Response(200, content=body, headers={"content-type": "application/json"})
    return IbgeNationalCensusPilot(
        client=IbgeNationalCensusClient(transport=httpx.MockTransport(respond)),
        bronze_store=BronzeStore(tmp_path),
    ).capture_population_2022()


def ledger(tmp_path):
    return QuarantinedJsonEvidenceStore(tmp_path)


def test_preserves_exact_response_bytes_not_reformatted_json(tmp_path):
    raw = body_for()
    manifest = capture(tmp_path, raw)
    assert manifest.raw_payload_path.read_bytes() == raw
    assert manifest.notes["httpBodySha256"] == sha256(raw).hexdigest()
    assert manifest.notes["rawSha256"] != manifest.notes["httpBodySha256"]
    assert manifest.notes["rawBytesLength"] == len(raw)
    assert manifest.notes["evidenceLayoutVersion"] == "DATA-1B1"
    assert manifest.notes["publicationStatus"] == "BRONZE_ONLY_UNREVIEWED"
    assert manifest.notes["licenseReviewStatus"] == "REVIEW_REQUIRED"
    assert manifest.notes["timeseriesPublication"] == "NOT_ATTEMPTED"
    receipt = ledger(tmp_path).verify("IBGE", "CENSO2022_4714", sha256(raw).hexdigest())
    assert receipt.run_id == manifest.run_id
    assert receipt.record_count == 1
    assert receipt.normalized_payload_path.read_text().count("\n") == 1


def test_identical_response_replays_without_overwriting_original_receipt(tmp_path):
    raw = body_for()
    first = capture(tmp_path, raw)
    before = first.manifest_path.read_bytes()
    second = capture(tmp_path, raw)
    assert first.manifest_path == second.manifest_path
    assert first.fetched_at_utc == second.fetched_at_utc
    assert second.manifest_path.read_bytes() == before
    assert len(ledger(tmp_path).list_verified_revisions("IBGE", "CENSO2022_4714")) == 1


def test_revised_source_response_keeps_previous_revision(tmp_path):
    first = capture(tmp_path, body_for("123456789"))
    second = capture(tmp_path, body_for("123456790"))
    assert first.run_id != second.run_id
    revisions = ledger(tmp_path).list_verified_revisions("IBGE", "CENSO2022_4714")
    assert {m.run_id for m in revisions} == {first.run_id, second.run_id}
    assert first.raw_payload_path.read_bytes() == body_for("123456789")
    assert second.raw_payload_path.read_bytes() == body_for("123456790")
    assert len(list(tmp_path.rglob("manifest.json"))) == 2


@pytest.mark.parametrize("filename", ["original.http.json", "observations.ndjson", "manifest.json"])
def test_any_tampering_fails_closed_and_replay_does_not_overwrite(tmp_path, filename):
    raw = body_for()
    manifest = capture(tmp_path, raw)
    path = manifest.manifest_path.parent / filename
    path.write_bytes(path.read_bytes() + b"CORRUPTION")
    with pytest.raises(EvidenceIntegrityError):
        ledger(tmp_path).verify("IBGE", "CENSO2022_4714", sha256(raw).hexdigest())
    with pytest.raises(EvidenceIntegrityError):
        capture(tmp_path, raw)


def test_same_raw_body_with_new_normalization_must_be_explicit_migration(tmp_path):
    raw = body_for()
    canonical = json.dumps(
        json.loads(raw), sort_keys=True, separators=(",", ":"), ensure_ascii=False
    ).encode("utf-8")
    notes = {
        "rawSha256": sha256(canonical).hexdigest(),
        "publicationStatus": "BRONZE_ONLY_UNREVIEWED",
        "licenseReviewStatus": "REVIEW_REQUIRED",
        "timeseriesPublication": "NOT_ATTEMPTED",
    }
    source = ledger(tmp_path)
    source.capture(
        source_code="IBGE", dataset_code="CENSO2022_4714",
        raw_response_bytes=raw, normalized_records=[{"value": 12}], notes=notes,
    )
    with pytest.raises(EvidenceIntegrityError, match="incompatible normalization"):
        source.capture(
            source_code="IBGE", dataset_code="CENSO2022_4714",
            raw_response_bytes=raw, normalized_records=[{"value": 13}], notes=notes,
        )


def test_rejects_publishable_claim_before_any_file_is_written(tmp_path):
    raw = body_for()
    canonical = json.dumps(
        json.loads(raw), sort_keys=True, separators=(",", ":"), ensure_ascii=False
    ).encode("utf-8")
    notes = {
        "rawSha256": sha256(canonical).hexdigest(),
        "publicationStatus": "INGESTED_VERIFIED",  # forbidden before rights review
        "licenseReviewStatus": "APPROVED",
        "timeseriesPublication": "NOT_ATTEMPTED",
    }
    with pytest.raises(EvidenceIntegrityError):
        ledger(tmp_path).capture(
            source_code="IBGE", dataset_code="CENSO2022_4714",
            raw_response_bytes=raw, normalized_records=[{"a": 1}], notes=notes,
        )
    assert not list(tmp_path.rglob("manifest.json"))


def test_invalid_path_code_cannot_escape_private_evidence_root(tmp_path):
    raw = body_for()
    canonical = json.dumps(
        json.loads(raw), sort_keys=True, separators=(",", ":"), ensure_ascii=False
    ).encode("utf-8")
    notes = {
        "rawSha256": sha256(canonical).hexdigest(),
        "publicationStatus": "BRONZE_ONLY_UNREVIEWED",
        "licenseReviewStatus": "REVIEW_REQUIRED",
        "timeseriesPublication": "NOT_ATTEMPTED",
    }
    with pytest.raises(EvidenceIntegrityError):
        ledger(tmp_path).capture(
            source_code="../outside", dataset_code="CENSO2022_4714",
            raw_response_bytes=raw, normalized_records=[{"a": 1}], notes=notes,
        )


def test_staging_directory_is_not_a_published_revision(tmp_path):
    manifest = capture(tmp_path, body_for())
    staging = manifest.manifest_path.parent.parent / ".staging-interrupted"
    staging.mkdir()
    (staging / "original.http.json").write_bytes(b"incomplete")
    revisions = ledger(tmp_path).list_verified_revisions("IBGE", "CENSO2022_4714")
    assert len(revisions) == 1
    assert revisions[0].run_id == manifest.run_id


def test_two_concurrent_identical_captures_converge_on_one_verified_revision(tmp_path):
    raw = body_for()
    with ThreadPoolExecutor(max_workers=4) as pool:
        receipts = list(pool.map(lambda _: capture(tmp_path, raw), range(4)))
    assert len({r.run_id for r in receipts}) == 1
    assert len(list(tmp_path.rglob("manifest.json"))) == 1
    assert ledger(tmp_path).verify(
        "IBGE", "CENSO2022_4714", sha256(raw).hexdigest()
    ).record_count == 1


def test_empty_source_has_no_artificial_coverage(tmp_path):
    assert ledger(tmp_path).list_verified_revisions("IBGE", "CENSO2022_4714") == []
