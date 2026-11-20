"""DATA-1C-A2B2: adversarial independent raw->normalized semantic replay.

Synthetic values only: these are *not* actual IBGE or World Bank data.
Most important regression: a forged value is put in NDJSON at ORIGINAL
capture time, the immutable Bronze manifest and acquisition journal are
fully self-consistent, but the independent semantic verifier still DENIES.
"""
from __future__ import annotations

import json
from pathlib import Path
from hashlib import sha256

import pytest
from cryptography.hazmat.primitives.asymmetric.ed25519 import Ed25519PrivateKey

from ingestion_service.acquisition_journal import AcquisitionJournal
from ingestion_service.private_bronze_witness import PrivateBronzeWitness
from ingestion_service.semantic_source_replay import (
    IBGE_PAIR, WDI_PAIR, SEMANTIC_REPLAY_VERSION,
    verify_original_to_normalized,
)
from ingestion_service.source_evidence_store import (
    EvidenceIntegrityError, QuarantinedJsonEvidenceStore,
)
from test_ibge_acquisition_composite import capture_population
from test_ibge_wdi_population_comparability import capture_wdi


def source_receipt(tmp_path: Path, pair: tuple[str, str]):
    original_root = tmp_path / "original"
    original_root.mkdir()
    receipt = (capture_population(original_root)
               if pair == IBGE_PAIR else capture_wdi(original_root))
    return original_root, receipt


def source_url(pair: tuple[str, str]) -> str:
    if pair == IBGE_PAIR:
        return (
            "https://servicodados.ibge.gov.br"
            "/api/v3/agregados/4714/periodos/2022/variaveis/93"
            "?localidades=N1%5Ball%5D"
        )
    return (
        "https://api.worldbank.org/v2/country/BRA/indicator/SP.POP.TOTL"
        "?date=2022&format=json&source=2"
    )


@pytest.mark.parametrize("pair", [IBGE_PAIR, WDI_PAIR])
def test_clean_private_official_shape_replays_exact_semantics(tmp_path, pair):
    _, manifest = source_receipt(tmp_path, pair)
    result = verify_original_to_normalized(
        source_code=pair[0], dataset_code=pair[1],
        original_http_bytes=manifest.raw_payload_path.read_bytes(),
        normalized_ndjson=manifest.normalized_payload_path.read_bytes(),
    )
    assert result.verifier_version == SEMANTIC_REPLAY_VERSION
    assert result.raw_sha256 == manifest.notes["httpBodySha256"]
    assert result.normalized_sha256 == manifest.notes["normalizedNdjsonSha256"]
    assert len(result.semantic_projection_sha256) == 64
    assert result.observation_count == 1
    assert "123456789" not in repr(result)
    assert "210000000" not in repr(result)


@pytest.mark.parametrize("pair", [IBGE_PAIR, WDI_PAIR])
@pytest.mark.parametrize("mutation", [
    "numericValue", "periodStart", "countryIso3", "indicatorCode",
    "sourceMetadata", "qualityFlags", "valueStatus",
])
def test_self_consistent_forged_bronze_and_success_journal_cannot_get_signed(
        tmp_path, pair, mutation,
):
    _, authentic = source_receipt(tmp_path, pair)
    raw = authentic.raw_payload_path.read_bytes()
    real = json.loads(authentic.normalized_payload_path.read_text())
    # The fabricated normalized value, metadata, etc. arrives BEFORE Bronze
    # calculates its immutable hash; every SHA in the forged manifest matches.
    bad = real.copy()
    switch = {
        "numericValue": ("value", float(real["value"]) + 1.0),
        "periodStart": ("period_start", "2021-01-01"),
        "countryIso3": ("country_iso3", "ARG"),
        "indicatorCode": ("indicator_code", "BAD.FORGED"),
        "sourceMetadata": ("source_metadata", {**real["source_metadata"], "reuseRights": "APPROVED"}),
        "qualityFlags": ("quality_flags", ["FAKE_UNREVIEWED_SOURCE"]),
        "valueStatus": ("value_status", "OBSERVED" if pair == WDI_PAIR else "MIDYEAR_ESTIMATE"),
    }
    field, false_value = switch[mutation]
    bad[field] = false_value

    malicious_root = tmp_path / "self-consistent-false"
    forge = QuarantinedJsonEvidenceStore(malicious_root).capture(
        source_code=pair[0], dataset_code=pair[1],
        raw_response_bytes=raw,
        normalized_records=[bad],
        notes=authentic.notes,
    )
    assert forge.notes["httpBodySha256"] == authentic.notes["httpBodySha256"]
    assert forge.notes["normalizedNdjsonSha256"] != authentic.notes["normalizedNdjsonSha256"]
    # SOURCE STORE CERTIFIES the forged version's byte integrity, and the
    # journal claims a real SUCCESS of this self-consistent version.
    assert QuarantinedJsonEvidenceStore(malicious_root).verify(
        pair[0], pair[1], forge.notes["httpBodySha256"]
    )
    journal = AcquisitionJournal(malicious_root)
    handle = journal.begin(
        source_code=pair[0], dataset_code=pair[1], source_url=source_url(pair),
    )
    journal.success(handle, response_sha256=forge.notes["httpBodySha256"])
    assert journal.audit(*pair)["successCount"] == 1
    # HOWEVER it is still false relative to the original provider HTTP bytes.
    with pytest.raises(EvidenceIntegrityError, match="Normalized statistic disagrees"):
        PrivateBronzeWitness(
            bronze_root=malicious_root, signing_key=Ed25519PrivateKey.generate()
        ).certify_research_only(
            source_code=pair[0], dataset_code=pair[1],
            original_http_sha256=forge.notes["httpBodySha256"],
            acquisition_event_id=handle.event_id,
        )


@pytest.mark.parametrize("pair", [IBGE_PAIR, WDI_PAIR])
def test_source_payload_reflecting_other_year_or_wrong_country_is_denied(tmp_path, pair):
    _, manifest = source_receipt(tmp_path, pair)
    source = json.loads(manifest.raw_payload_path.read_bytes())
    if pair == IBGE_PAIR:
        source[0]["resultados"][0]["series"][0]["serie"] = {"2021": "123456789"}
    else:
        source[1][0]["countryiso3code"] = "ARG"
    changed = json.dumps(source, ensure_ascii=False).encode()
    with pytest.raises(EvidenceIntegrityError):
        verify_original_to_normalized(
            source_code=pair[0], dataset_code=pair[1],
            original_http_bytes=changed,
            normalized_ndjson=manifest.normalized_payload_path.read_bytes(),
        )


def test_replayer_refuses_unreviewed_sources_and_missing_multirow(tmp_path):
    _, manifest = source_receipt(tmp_path, IBGE_PAIR)
    raw = manifest.raw_payload_path.read_bytes()
    normalized = manifest.normalized_payload_path.read_bytes()
    with pytest.raises(EvidenceIntegrityError):
        verify_original_to_normalized(
            source_code="WORLD_BANK", dataset_code="WDI",
            original_http_bytes=raw, normalized_ndjson=normalized,
        )
    with pytest.raises(EvidenceIntegrityError):
        verify_original_to_normalized(
            source_code=IBGE_PAIR[0], dataset_code=IBGE_PAIR[1],
            original_http_bytes=raw, normalized_ndjson=normalized + normalized,
        )


def test_replay_detects_duplicate_provider_json_keys_even_if_original_parser_ignored_them(
        tmp_path,
):
    _, manifest = source_receipt(tmp_path, IBGE_PAIR)
    raw = manifest.raw_payload_path.read_bytes()
    # Duplicate key in official source was never a sound unambiguous source.
    inserted = raw.replace(b'"id": "93"', b'"id": "93", "id": "93"', 1)
    if inserted == raw:
        inserted = raw.replace(b'"id":"93"', b'"id":"93","id":"93"', 1)
    assert inserted != raw
    with pytest.raises(EvidenceIntegrityError):
        verify_original_to_normalized(
            source_code=IBGE_PAIR[0], dataset_code=IBGE_PAIR[1],
            original_http_bytes=inserted,
            normalized_ndjson=manifest.normalized_payload_path.read_bytes(),
        )
