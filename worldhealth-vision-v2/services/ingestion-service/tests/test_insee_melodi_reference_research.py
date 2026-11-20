"""P2C3: fake HTTP bytes for an official endpoint, NEVER official observations.

The test records reproduce documented dimension CODES/JSON SHAPE; all numbers
and response bodies here are TEST FIXTURES. No live Insee GET is made by CI.
"""
from __future__ import annotations

from hashlib import sha256
import json
from pathlib import Path

import httpx
import pytest

from ingestion_service.connectors.insee_melodi_reference_client import (
    API_HOST, API_PATH, DATASET_CODE, GEO_FILTER, SOURCE_CODE, MEASURE_CODE,
    InseeMelodiReferenceResearchClient, capture_private_insee_evidence,
    parse_reference_population,
)
from ingestion_service.source_evidence_store import EvidenceIntegrityError, QuarantinedJsonEvidenceStore


FETCHED_AT = "2026-11-20T00:00:00Z"
DOCUMENTED_API_EXAMPLE = "69294105"  # Historical example, NOT our network verification


def response(
    *, geo="FRANCE-F", measure="PTOT", period="2023", value=DOCUMENTED_API_EXAMPLE,
    status=None, confidential=None, annual="A", georef="2025",
    override: dict | None = None,
) -> bytes:
    dims = {
        "GEO": geo, "GEO_OBJECT": "FRANCE", "GEO_REF": georef, "FREQ": annual,
        "TIME_PERIOD": period, "POPREF_MEASURE": measure,
    }
    row = {"dimensions": dims, "measures": {"OBS_VALUE_NIVEAU": {"value": value}}}
    if status is not None:
        row["OBS_STATUS"] = status
    if confidential is not None:
        row["CONF_STATUS"] = confidential
    if override:
        row.update(override)
    return (json.dumps({"observations": [row]}, sort_keys=True) + "\n").encode()


def parse(raw: bytes):
    return parse_reference_population(
        raw,
        source_url=API_HOST+API_PATH+"?GEO=FRANCE-F&POPREF_MEASURE=PTOT&maxResult=20",
        fetched_at_utc=FETCHED_AT,
    )


def test_documented_historical_dimension_codes_parsed_without_geo_iso3_guess():
    raw = response()
    rows = parse(raw)
    assert len(rows) == 1
    row = rows[0]
    assert row.dataset_code == DATASET_CODE
    assert row.measure_code == MEASURE_CODE
    assert row.geo_filter == GEO_FILTER
    assert row.year == 2023
    assert row.geo_reference == "2025"
    assert row.population_total == int(DOCUMENTED_API_EXAMPLE)
    assert row.population_type == "LEGAL_TOTAL_UNREVIEWED"
    assert row.original_http_sha256 == sha256(raw).hexdigest()
    assert row.raw_response_bytes == raw
    assert row.source_url.startswith(API_HOST)
    assert row.observed_status is None


@pytest.mark.parametrize("change", [
    {"geo": "FRANCE-M"},
    {"geo": "COM-34001"},
    {"geo": "FRANCE-FR"},
    {"measure": "PMUN"},
    {"measure": "PCAP"},
    {"annual": "M"},
    {"period": "2023-Q1"},
    {"period": "20230"},
    {"value": "69,294,105"},
    {"value": "69294105.0"},
    {"value": None},
    {"value": -1},
    {"value": 0},
    {"value": True},
    {"value": 999999999999},
    {"georef": "DEPT"},
    {"status": "C"},
    {"confidential": "C"},
])
def test_rejects_wrong_geography_measure_status_or_value(change):
    with pytest.raises(EvidenceIntegrityError):
        parse(response(**change))


def test_official_melodi_split_national_geo_pair_is_supported_but_not_assumed_iso3():
    # Insee's documented GEO=FRANCE-F GET is flattened as GEO_OBJECT=FRANCE,
    # GEO=F. This is a SOURCE-specific syntax, never a worldwide ISO3 rule.
    exact = parse(response(geo="F"))[0]
    assert exact.geo_filter == "FRANCE-F"
    assert exact.population_type == "LEGAL_TOTAL_UNREVIEWED"
    # A code F without explicit FRANCE national scope must be denied.
    with pytest.raises(EvidenceIntegrityError):
        parse(response(geo="F", override={
            "dimensions": {"GEO": "F", "FREQ": "A", "TIME_PERIOD": "2023",
                           "POPREF_MEASURE": "PTOT", "GEO_REF": "2025"}
        }))
    with pytest.raises(EvidenceIntegrityError):
        parse(response(geo="F", override={
            "dimensions": {"GEO": "F", "GEO_OBJECT": "COM", "FREQ": "A",
                           "TIME_PERIOD": "2023", "POPREF_MEASURE": "PTOT"}
        }))


def test_actual_official_november_2026_melodi_geo_2025_france_f_is_parseable_without_iso3_assumption():
    # Dimension codes observed by a ONE-OFF real provider HTTP GET,
    # GitHub Actions 44773997299. Do not confuse geography 2025 with 2023 period.
    actual_shape = response(override={
        "dimensions": {"GEO": "2025-FRANCE-F", "FREQ": "A",
                       "TIME_PERIOD": "2023", "POPREF_MEASURE": "PTOT"}
    })
    row = parse(actual_shape)[0]
    assert row.geo_reference == "2025"
    assert row.year == 2023
    assert row.geo_filter == "FRANCE-F"
    assert row.population_type == "LEGAL_TOTAL_UNREVIEWED"
    # A similarly prefixed OTHER territory is never national France.
    with pytest.raises(EvidenceIntegrityError):
        parse(response(override={"dimensions": {
            "GEO": "2025-FRANCE-M", "FREQ": "A",
            "TIME_PERIOD": "2023", "POPREF_MEASURE": "PTOT"}}))
    # A contradictory vintage or GEO_OBJECT cannot silently overwrite
    # explicit official geographic scope.
    with pytest.raises(EvidenceIntegrityError):
        parse(response(override={"dimensions": {
            "GEO": "2025-FRANCE-F", "GEO_REF": "2024", "FREQ": "A",
            "TIME_PERIOD": "2023", "POPREF_MEASURE": "PTOT"}}))
    with pytest.raises(EvidenceIntegrityError):
        parse(response(override={"dimensions": {
            "GEO": "2025-FRANCE-F", "GEO_OBJECT": "COM", "FREQ": "A",
            "TIME_PERIOD": "2023", "POPREF_MEASURE": "PTOT"}}))


def test_unrecognized_api_json_and_response_schema_fail_closed():
    for raw in (
        b"", b"not-json", b"\xff",
        b'{"items":[{"value":17}]}',
        b'{"observations":[]}',
        b'{"observations":[42]}',
        response(override={"measures": {"OBS_VALUE_NIVEAU": 17}}),
        response(override={"measures": {"OBS_VALUE_NIVEAU": {"other": 17}}}),
        response(override={"dimensions": []}),
        response(override={"dimensions": {"GEO": "FRANCE-F"}}),
    ):
        with pytest.raises(EvidenceIntegrityError):
            parse(raw)


@pytest.mark.parametrize("url", [
    "https://untrusted.invalid/melodi/data/DS_POPULATIONS_REFERENCE?GEO=FRANCE-F&POPREF_MEASURE=PTOT&maxResult=20",
    "http://api.insee.fr/melodi/data/DS_POPULATIONS_REFERENCE?GEO=FRANCE-F&POPREF_MEASURE=PTOT&maxResult=20",
    "https://api.insee.fr/melodi/data/DS_POPULATIONS_REFERENCE?GEO=FRANCE-M&POPREF_MEASURE=PTOT&maxResult=20",
    "https://api.insee.fr/melodi/data/DS_POPULATIONS_REFERENCE?GEO=FRANCE-F&POPREF_MEASURE=PMUN&maxResult=20",
    "https://api.insee.fr/melodi/data/DS_POPULATIONS_REFERENCE?GEO=FRANCE-F&POPREF_MEASURE=PTOT&maxResult=20&DEBUG=1",
    "https://api.insee.fr/melodi/data/DS_POPULATIONS_REFERENCE?GEO=FRANCE-F&POPREF_MEASURE=PTOT&maxResult=20#fragment",
    "https://api.insee.fr:444/melodi/data/DS_POPULATIONS_REFERENCE?GEO=FRANCE-F&POPREF_MEASURE=PTOT&maxResult=20",
])
def test_cannot_launder_arbitrary_source_url_into_official_insee_provenance(url):
    with pytest.raises(EvidenceIntegrityError):
        parse_reference_population(
            response(), source_url=url, fetched_at_utc=FETCHED_AT,
        )


def test_duplicate_json_keys_and_nonfinite_values_never_normalize_silently():
    from_raw = response()
    with pytest.raises(EvidenceIntegrityError):
        parse(from_raw.replace(b'"observations":', b'"observations":[],"observations":'))
    with pytest.raises(EvidenceIntegrityError):
        parse(from_raw.replace(b'"value": "69294105"', b'"value": NaN'))


def test_multiple_years_sorted_but_duplicate_period_and_partial_pages_refused():
    a = json.loads(response())
    b = json.loads(response(period="2022", value="68000000"))
    combined = {"observations": a["observations"]+b["observations"]}
    rows = parse(json.dumps(combined).encode())
    assert [r.year for r in rows] == [2022, 2023]
    same = {"observations": a["observations"]*2}
    with pytest.raises(EvidenceIntegrityError):
        parse(json.dumps(same).encode())
    partial = {**combined, "next": "http://somewhere.invalid/page2"}
    with pytest.raises(EvidenceIntegrityError):
        parse(json.dumps(partial).encode())
    oversized = {"observations": a["observations"]*21}
    with pytest.raises(EvidenceIntegrityError):
        parse(json.dumps(oversized).encode())


def test_read_only_network_DISABLED_by_default_even_with_fake_transport():
    def handler(request):
        raise AssertionError("Never access any endpoint when allow_live=False")
    client = InseeMelodiReferenceResearchClient(transport=httpx.MockTransport(handler))
    with pytest.raises(PermissionError):
        client.fetch()


def test_explicitly_approved_client_cannot_call_any_other_host_or_dataset():
    called = []
    def handler(req: httpx.Request):
        called.append(str(req.url))
        assert req.method == "GET"
        assert req.url.host == "api.insee.fr"
        assert req.url.path == API_PATH
        assert req.url.params.get("GEO") == GEO_FILTER
        assert req.url.params.get("POPREF_MEASURE") == MEASURE_CODE
        assert req.url.params.get("maxResult") == "20"
        return httpx.Response(200, headers={"Content-Type": "application/json",
                                           "ETag": '"p2c3-test"'}, content=response())
    client = InseeMelodiReferenceResearchClient(
        allow_live=True, transport=httpx.MockTransport(handler),
    )
    rows = client.fetch()
    assert len(called) == 1
    assert rows[0].etag == '"p2c3-test"'
    assert rows[0].population_type == "LEGAL_TOTAL_UNREVIEWED"


@pytest.mark.parametrize("status", [301, 302, 307, 308, 401, 403, 404, 429, 500, 503])
def test_no_redirect_no_quota_bypass_and_no_mirror_fallback(status):
    calls = []
    def handler(req):
        calls.append(req)
        return httpx.Response(status, headers={"Location": "https://mirror.invalid"}, content=b"failure")
    client = InseeMelodiReferenceResearchClient(
        allow_live=True, transport=httpx.MockTransport(handler),
    )
    with pytest.raises(EvidenceIntegrityError):
        client.fetch()
    assert len(calls) == 1


def test_content_type_or_large_body_rejected():
    for content_type, body in [
        ("text/html", b"<html>not the API</html>"),
        ("application/json", b"0" * 500001),
    ]:
        def handler(req):
            return httpx.Response(200, headers={"Content-Type": content_type}, content=body)
        with pytest.raises(EvidenceIntegrityError):
            InseeMelodiReferenceResearchClient(
                allow_live=True, transport=httpx.MockTransport(handler),
            ).fetch()


def test_private_bronze_archive_never_grants_any_publication_or_geo_equivalence(tmp_path: Path):
    raw = response()
    entry = parse(raw)
    manifest = capture_private_insee_evidence(root=tmp_path, rows=entry)
    assert manifest.source_code == SOURCE_CODE
    assert manifest.dataset_code == DATASET_CODE
    assert manifest.notes["licenseReviewStatus"] == "REVIEW_REQUIRED"
    assert manifest.notes["timeseriesPublication"] == "NOT_ATTEMPTED"
    assert manifest.notes["countryMappingStatus"] == "REVIEW_REQUIRED"
    assert manifest.notes["sourceStatus"] == "PRIVATE_RESEARCH_VALIDATION"
    assert manifest.notes["httpBodySha256"] == sha256(raw).hexdigest()
    assert manifest.raw_payload_path.read_bytes() == raw
    archived = QuarantinedJsonEvidenceStore(tmp_path).verify(
        SOURCE_CODE, DATASET_CODE, sha256(raw).hexdigest(),
    )
    assert archived.manifest_path.is_file()
    assert b'"publicationRights":"NOT_GRANTED"' in manifest.normalized_payload_path.read_bytes()
    assert b'"countryIso3Candidate":"FRA"' in manifest.normalized_payload_path.read_bytes()
    assert b'"countryMappingStatus":"REVIEW_REQUIRED"' in manifest.normalized_payload_path.read_bytes()
    # Historical bytes are not rewritten on repeat; idempotent SHA revision.
    again = capture_private_insee_evidence(root=tmp_path, rows=entry)
    assert again.raw_payload_path == manifest.raw_payload_path
    assert list((tmp_path/"insee"/"ds_populations_reference"/"revisions").iterdir()) == [
        tmp_path/"insee"/"ds_populations_reference"/"revisions"/sha256(raw).hexdigest()
    ]
    with pytest.raises(EvidenceIntegrityError):
        capture_private_insee_evidence(root=tmp_path, rows=[
            entry[0], parse(response(period="2022", value="68000000"))[0]
        ])


def test_publication_api_stays_out_of_insee_research_connector():
    # This connector intentionally has no function that can publish or issue a
    # rights signature; guard against accidentally repurposing a research pilot.
    from ingestion_service.connectors import insee_melodi_reference_client as module
    import inspect
    source = inspect.getsource(module)
    assert "/internal/timeseries/" not in source
    assert "X-WHV-Ingestion-Key" not in source
    assert "Ed25519PrivateKey" not in source
    assert '"timeseriesPublication": "NOT_ATTEMPTED"' in source
