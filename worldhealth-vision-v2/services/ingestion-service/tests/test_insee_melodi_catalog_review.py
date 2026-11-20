"""P2C3B: real-data-scope-safe metadata contract — all numbers here are TEST ONLY.

The Insee catalog itself says spatial FEHM = France hors Mayotte, while the
data URI filter is GEO=FRANCE-F. We test that this cannot silently become FRA.
This suite DOES NOT create any institution-granted publication permission.
"""
from __future__ import annotations

from dataclasses import replace
from hashlib import sha256
import json
from pathlib import Path

import httpx
import pytest

from ingestion_service.connectors.insee_melodi_catalog_review import (
    CATALOG_URL, CATALOG_PATH, SPATIAL_SCOPE_ID, SPATIAL_SCOPE_LABEL_FR,
    CATALOG_DATASET_CODE, InseeMelodiCatalogResearchClient,
    parse_insee_reference_catalog, validate_population_and_metadata,
    capture_private_insee_catalog,
)
from ingestion_service.connectors.insee_melodi_reference_client import (
    API_HOST, API_PATH, PROBE_PARAMS, parse_reference_population,
    capture_private_insee_evidence,
)
from ingestion_service.source_evidence_store import (
    EvidenceIntegrityError, QuarantinedJsonEvidenceStore,
)


def localized(fr: str, en: str | None = None):
    return [
        {"lang": "fr", "content": fr},
        {"lang": "en", "content": en if en is not None else fr},
    ]


def fake_catalog() -> dict:
    return {
        "identifier": "DS_POPULATIONS_REFERENCE",
        "publisher": {"id": "INSEE", "label": localized("Insee")},
        "spatial": {"id": "FEHM", "label": localized("France hors Mayotte",
                                                   "France excluding Mayotte")},
        "spatialTemporal": "2025-01-01T01:00:00",
        "temporal": {"startPeriod": "2023-01-01T00:00:00",
                     "endPeriod": "2023-01-01T00:00:00"},
        "accrualPeriodicity": {"label": localized("Annuel", "Annual")},
        "accessRights": localized("Public"),
        "confidentialityStatus": localized("Libre", "Free"),
        "statisticalUnit": [{"label": localized("Individu", "Person")}],
        "structure": {"dsd": "DSD_POPULATIONS_REFERENCE"},
        "status": {"id": "publie", "label": localized("Publié", "Completed")},
        "issued": "2025-12-17T08:35:21.000297779",
        "modified": "2025-12-18T12:00:16.299984912",
    }


def canonical(value: dict) -> bytes:
    return (json.dumps(value, sort_keys=True, ensure_ascii=False,
                       separators=(",", ":")) + "\n").encode("utf-8")


def metadata():
    return parse_insee_reference_catalog(canonical(fake_catalog()))


def fake_population():
    payload = {
        "observations": [
            {"dimensions": {"GEO": "2025-FRANCE-F", "FREQ": "A",
                            "TIME_PERIOD": "2023", "POPREF_MEASURE": "PTOT"},
             "measures": {"OBS_VALUE_NIVEAU": {"value": 17.0}}}
        ],
        "paging": {"size": 1}, "publisher": "INSEE",
    }
    url = API_HOST + API_PATH + "?" + "&".join(
        key + "=" + val for key, val in PROBE_PARAMS.items()
    )
    return parse_reference_population(
        canonical(payload), source_url=url, fetched_at_utc="2026-11-20T00:00:00Z")


def test_official_catalog_pins_the_underlying_territory_and_unit():
    b = canonical(fake_catalog())
    x = parse_insee_reference_catalog(b)
    assert x.original_metadata_bytes == b
    assert x.original_http_sha256 == sha256(b).hexdigest()
    assert x.metadata_source_url == CATALOG_URL
    assert x.dataset_code == "DS_POPULATIONS_REFERENCE"
    assert x.publisher_id == "INSEE"
    assert x.spatial_code == SPATIAL_SCOPE_ID == "FEHM"
    assert x.spatial_label_fr == SPATIAL_SCOPE_LABEL_FR == "France hors Mayotte"
    assert x.geographic_vintage == 2025
    assert x.observation_period == 2023
    assert x.statistical_unit_fr == "Individu"
    assert x.access_status_fr == "Public"
    assert x.confidentiality_status_fr == "Libre"
    assert x.public_api_ingest == "NOT_GRANTED"
    assert x.data_reuse_review == "REVIEW_REQUIRED"


def test_catalog_and_observation_must_reconcile_but_not_publish():
    validate_population_and_metadata(fake_population(), metadata())
    with pytest.raises(EvidenceIntegrityError):
        validate_population_and_metadata([], metadata())
    with pytest.raises(EvidenceIntegrityError):
        validate_population_and_metadata(fake_population() * 2, metadata())
    with pytest.raises(EvidenceIntegrityError):
        validate_population_and_metadata(fake_population(), replace(metadata(), geographic_vintage=2026))
    with pytest.raises(EvidenceIntegrityError):
        validate_population_and_metadata(fake_population(), replace(metadata(), observation_period=2022))
    with pytest.raises(EvidenceIntegrityError):
        validate_population_and_metadata(fake_population(), replace(metadata(), spatial_code="FRANCE"))


@pytest.mark.parametrize(("field", "wrong"), [
    ("identifier", "DS_RP_POPULATION_PRINC"),
    ("spatialTemporal", "2026-01-01T01:00:00"),
    ("spatialTemporal", "2025-02-01T01:00:00"),
    ("statisticalUnit", [{"label": localized("Ménages")}]),
    ("confidentialityStatus", localized("Secret")),
    ("accessRights", localized("Restreint")),
    ("status", {"id": "brouillon"}),
    ("publisher", {"id": "UNKNOWN"}),
    ("spatial", {"id": "FRANCE", "label": localized("France")}),
    ("spatial", {"id": "FEHM", "label": localized("France entière")}),
    ("accrualPeriodicity", {"label": localized("Mensuel")}),
    ("structure", {"dsd": "DSD_OTHER"}),
    ("temporal", {"startPeriod": "2022-01-01T00:00:00",
                  "endPeriod": "2023-01-01T00:00:00"}),
    ("issued", "not-a-time"),
    ("modified", "1985-01-01T00:00:00"),
    ("modified", "2025-12-15T00:00:00"),
])
def test_review_gates_block_metadata_changes(field, wrong):
    body = fake_catalog()
    body[field] = wrong
    with pytest.raises(EvidenceIntegrityError):
        parse_insee_reference_catalog(canonical(body))


@pytest.mark.parametrize("broken", [
    b"", b"not JSON", b"\xff", b"[]", b"{}", b'{"identifier":"DS_POPULATIONS_REFERENCE","identifier":"NOT_INSEE"}',
    b'{"number":Infinity}', b" " * 500001,
])
def test_rejects_duplicate_fields_invalid_json_and_overbudget(broken):
    with pytest.raises(EvidenceIntegrityError):
        parse_insee_reference_catalog(broken)


@pytest.mark.parametrize("url", [
    "http://api.insee.fr/melodi/catalog/DS_POPULATIONS_REFERENCE",
    "https://evil.invalid/melodi/catalog/DS_POPULATIONS_REFERENCE",
    "https://api.insee.fr/melodi/catalog/OTHER",
    "https://api.insee.fr/melodi/catalog/DS_POPULATIONS_REFERENCE?geo=ALL",
])
def test_catalog_url_never_generic(url):
    with pytest.raises(EvidenceIntegrityError):
        parse_insee_reference_catalog(canonical(fake_catalog()), source_url=url)


def test_metadata_network_disabled_by_default():
    def handler(_request):
        raise AssertionError("No provider request allowed")
    client = InseeMelodiCatalogResearchClient(transport=httpx.MockTransport(handler))
    with pytest.raises(PermissionError):
        client.fetch()


def test_metadata_fetch_is_one_exact_official_get_without_redirect():
    calls = []
    def handler(request: httpx.Request):
        calls.append(request)
        assert request.method == "GET"
        assert str(request.url) == CATALOG_URL
        return httpx.Response(200, headers={"Content-Type":"application/json"}, content=canonical(fake_catalog()))
    client = InseeMelodiCatalogResearchClient(
        allow_live=True, transport=httpx.MockTransport(handler),
    )
    assert client.fetch().spatial_code == "FEHM"
    assert len(calls) == 1


@pytest.mark.parametrize("status", [301, 302, 307, 429, 500, 502, 503, 404])
def test_catalog_refuses_redirect_and_provider_issues(status):
    calls = []
    def handler(request):
        calls.append(request)
        return httpx.Response(status, headers={"Location":"https://untrusted.invalid/"},
                              content=b"")
    with pytest.raises(EvidenceIntegrityError):
        InseeMelodiCatalogResearchClient(allow_live=True, transport=httpx.MockTransport(handler)).fetch()
    assert len(calls) == 1


def test_original_catalog_bytes_and_observation_have_TWO_linked_private_receipts(tmp_path: Path):
    meta = metadata()
    rows = fake_population()
    # The official catalog is its OWN immutable, content-addressed source.
    r1 = capture_private_insee_catalog(root=tmp_path, metadata=meta)
    assert r1.source_code == "INSEE"
    assert r1.dataset_code == CATALOG_DATASET_CODE
    assert r1.raw_payload_path.read_bytes() == meta.original_metadata_bytes
    assert r1.notes["publicationStatus"] == "BRONZE_ONLY_UNREVIEWED"
    assert r1.notes["geographicScopeStatus"] == "FEHM_VERIFIED_NOT_FRA"
    assert r1.notes["licenseReviewStatus"] == "REVIEW_REQUIRED"
    assert r1.notes["timeseriesPublication"] == "NOT_ATTEMPTED"
    assert r1.notes["providerLicense"] == "NOT_GRANTED"
    assert b'"publicApiIngest":"NOT_GRANTED"' in r1.normalized_payload_path.read_bytes()

    r2 = capture_private_insee_evidence(root=tmp_path, rows=rows, metadata=meta)
    assert r2.notes["catalogHttpBodySha256"] == meta.original_http_sha256
    assert r2.notes["geographicScopeId"] == "FEHM"
    assert r2.notes["geographicScopeStatus"] == "FEHM_VERIFIED_NOT_FRA"
    assert r2.notes["countryMappingStatus"] == "NOT_MAPPED_TO_ISO3"
    assert r2.notes["timeseriesPublication"] == "NOT_ATTEMPTED"
    normalized = r2.normalized_payload_path.read_bytes()
    assert b'"countryIso3Candidate":null' in normalized
    assert b'"geographicScopeId":"FEHM"' in normalized
    assert b'"catalogHttpBodySha256":"' + meta.original_http_sha256.encode() + b'"' in normalized
    archive = QuarantinedJsonEvidenceStore(tmp_path)
    assert archive.verify("INSEE", CATALOG_DATASET_CODE,
                          meta.original_http_sha256).raw_payload_path.read_bytes() == meta.original_metadata_bytes
    assert archive.verify("INSEE", "DS_POPULATIONS_REFERENCE",
                          rows[0].original_http_sha256).raw_payload_path.read_bytes() == rows[0].raw_response_bytes
    # No duplicate raw archive on repeated review; no attempt to turn into a signed permit.
    assert capture_private_insee_evidence(root=tmp_path, rows=rows, metadata=meta).raw_payload_path == r2.raw_payload_path
    assert capture_private_insee_catalog(root=tmp_path, metadata=meta).raw_payload_path == r1.raw_payload_path


def test_modified_catalog_object_cannot_launder_original_bytes(tmp_path: Path):
    with pytest.raises(EvidenceIntegrityError):
        capture_private_insee_catalog(
            root=tmp_path, metadata=replace(metadata(), spatial_code="FRANCE"),
        )
    with pytest.raises(EvidenceIntegrityError):
        capture_private_insee_evidence(
            root=tmp_path, rows=fake_population(),
            metadata=replace(metadata(), publisher_id="FAKE"),
        )


def test_old_probe_without_metadata_is_never_a_country_observation(tmp_path: Path):
    r = capture_private_insee_evidence(root=tmp_path, rows=fake_population())
    assert r.notes["countryMappingStatus"] == "NOT_MAPPED_TO_ISO3"
    assert r.notes["geographicScopeStatus"] == "REVIEW_REQUIRED"
    assert r.notes["catalogHttpBodySha256"] is None
    assert b'"countryIso3Candidate":null' in r.normalized_payload_path.read_bytes()
