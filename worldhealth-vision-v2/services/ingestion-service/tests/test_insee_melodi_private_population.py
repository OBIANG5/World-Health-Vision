"""P2C3A: entirely OFFLINE tests. Mocked INSEE responses are NOT live data.

No grant signature, no public API ingestion or Vercel deployment occurs here.
The pinned historical value matches an official 2023 published reference, but
the JSON source and HTTP headers below are test fabrications, NOT provenance.
"""
from __future__ import annotations

from copy import deepcopy
from hashlib import sha256
import json

import httpx
import pytest

from ingestion_service.acquisition_journal import AcquisitionJournal
from ingestion_service.bronze_store import BronzeStore
from ingestion_service.connectors.insee_melodi_population_research import (
    DATASET, GEOGRAPHY_FILTER, MEASURE, PINNED_GEO,
    REVIEWED_REFERENCE_PMUN, SOURCE, SOURCE_URL,
    InseePrivatePopulationClient, parse_private_insee_population,
)
from ingestion_service.pipelines.insee_melodi_population_research import (
    InseePrivatePopulationPilot,
)
from ingestion_service.source_evidence_store import EvidenceIntegrityError, QuarantinedJsonEvidenceStore


def fixture_response():
    """Synthetic API shape; a published historical reference for parser QA."""
    return {
        "paging": {"count": 1, "start": 0},
        "observations": [{
            "dimensions": {
                "GEO": PINNED_GEO, "FREQ": "A", "TIME_PERIOD": "2023",
                "POPREF_MEASURE": "PMUN",
            },
            "measures": {"OBS_VALUE_NIVEAU": {"value": REVIEWED_REFERENCE_PMUN}},
            "attributes": {},
        }],
    }


def raw(obj):
    return (json.dumps(obj, ensure_ascii=False, separators=(",", ":")) + "\n").encode()


def mock_transport(obj, *, status=200, content_type="application/json", etag='"synthetic-etag"'):
    def handle(request):
        assert request.method == "GET"
        assert str(request.url) == SOURCE_URL
        assert request.url.host == "api.insee.fr"
        assert request.url.path == "/melodi/data/DS_POPULATIONS_REFERENCE"
        assert request.url.params["GEO"] == GEOGRAPHY_FILTER
        assert request.url.params["POPREF_MEASURE"] == MEASURE
        assert request.url.params["TIME_PERIOD"] == "2023"
        assert request.url.params["maxResult"] == "10"
        return httpx.Response(status, content=raw(obj), headers={
            "content-type": content_type, "etag": etag,
            "last-modified": "Wed, 17 Dec 2025 09:00:00 GMT",
        })
    return httpx.MockTransport(handle)


def capture(root, document=None, **kwargs):
    client = InseePrivatePopulationClient(
        transport=mock_transport(fixture_response() if document is None else document, **kwargs))
    return InseePrivatePopulationPilot(client=client, bronze_store=BronzeStore(root)).capture()


def test_single_pinned_historical_reference_is_quarantined_without_timeseries(tmp_path):
    receipt = capture(tmp_path)
    blob = raw(fixture_response())
    assert receipt.raw_payload_path.read_bytes() == blob
    assert receipt.notes["httpBodySha256"] == sha256(blob).hexdigest()
    assert receipt.notes["licenseReviewStatus"] == "REVIEW_REQUIRED"
    assert receipt.notes["publicationStatus"] == "BRONZE_ONLY_UNREVIEWED"
    assert receipt.notes["timeseriesPublication"] == "NOT_ATTEMPTED"
    assert receipt.notes["geographicScope"].startswith("France hors Mayotte")
    assert receipt.notes["originalMeasure"] == "PMUN"
    assert receipt.notes["referenceYear"] == 2023
    assert receipt.notes["sourcePublishedAtUtc"] is None
    assert "review" in receipt.notes["licenseDocumentationUrl"] or "insee.fr" in receipt.notes["licenseDocumentationUrl"]
    observations = [json.loads(s) for s in receipt.normalized_payload_path.read_text().splitlines()]
    assert len(observations) == 1
    assert observations[0]["value"] == float(REVIEWED_REFERENCE_PMUN)
    assert observations[0]["country_iso3"] == "FRA"
    assert observations[0]["value_status"] == "OFFICIAL_REFERENCE_COUNT_CALCULATED"
    flags = observations[0]["quality_flags"]
    assert "FRANCE_HORS_MAYOTTE_NOT_FULL_FRA" in flags
    assert "INSEE_MUNICIPAL_NOT_TOTAL" in flags
    assert "REUSE_RIGHTS_REVIEW_REQUIRED" in flags
    receipt2 = QuarantinedJsonEvidenceStore(tmp_path).verify(
        SOURCE, DATASET, receipt.notes["httpBodySha256"])
    assert receipt2.run_id == receipt.run_id
    events = AcquisitionJournal(tmp_path).audit(SOURCE, DATASET)
    assert events["successCount"] == 1
    assert events["failureCount"] == 0


def test_exact_bytes_identical_replay_reuses_revision_but_creates_another_fetch_event(tmp_path):
    receipt1 = capture(tmp_path)
    receipt2 = capture(tmp_path)
    assert receipt1.run_id == receipt2.run_id
    assert receipt1.manifest_path == receipt2.manifest_path
    assert len(QuarantinedJsonEvidenceStore(tmp_path).list_verified_revisions(SOURCE, DATASET)) == 1
    events = AcquisitionJournal(tmp_path).audit(SOURCE, DATASET)
    assert events["eventCount"] == 2
    assert events["successCount"] == 2


def test_revised_http_bytes_are_new_audited_revision_even_if_count_unchanged(tmp_path):
    first = capture(tmp_path)
    revised = fixture_response()
    revised["paging"]["retrievedFrom"] = "CI synthetic second byte version"
    second = capture(tmp_path, revised)
    assert first.run_id != second.run_id
    assert first.raw_payload_path.read_bytes() == raw(fixture_response())
    assert len(QuarantinedJsonEvidenceStore(tmp_path).list_verified_revisions(SOURCE, DATASET)) == 2
    assert AcquisitionJournal(tmp_path).audit(SOURCE, DATASET)["successCount"] == 2


@pytest.mark.parametrize("mutation", [
    lambda d: d["observations"][0]["dimensions"].update({"GEO": "2025-FRANCE-M"}),
    lambda d: d["observations"][0]["dimensions"].update({"POPREF_MEASURE": "PTOT"}),
    lambda d: d["observations"][0]["dimensions"].update({"TIME_PERIOD": "2024"}),
    lambda d: d["observations"][0]["dimensions"].update({"FREQ": "M"}),
    lambda d: d["observations"][0]["measures"]["OBS_VALUE_NIVEAU"].update({"value": None}),
    lambda d: d["observations"][0]["measures"]["OBS_VALUE_NIVEAU"].update({"value": 68094281}),
    lambda d: d["observations"][0]["measures"]["OBS_VALUE_NIVEAU"].update({"value": 68_094_280.1}),
    lambda d: d["observations"][0]["attributes"].update({"CONF_STATUS": "C"}),
    lambda d: d["observations"].append(deepcopy(d["observations"][0])),
    lambda d: d.update({"observations": []}),
])
def test_changed_scope_hidden_confidentiality_or_value_fails_closed_and_journal_is_honest(tmp_path, mutation):
    candidate = fixture_response()
    mutation(candidate)
    with pytest.raises(ValueError):
        capture(tmp_path, candidate)
    events = AcquisitionJournal(tmp_path).audit(SOURCE, DATASET)
    assert events["eventCount"] == 1 and events["failureCount"] == 1
    assert events["successCount"] == 0
    assert not QuarantinedJsonEvidenceStore(tmp_path).list_verified_revisions(SOURCE, DATASET)


@pytest.mark.parametrize("status", [301, 429, 500])
def test_redirect_rate_limit_server_error_do_not_create_source_evidence(tmp_path, status):
    with pytest.raises(httpx.HTTPStatusError):
        capture(tmp_path, status=status)
    assert AcquisitionJournal(tmp_path).audit(SOURCE, DATASET)["failureCount"] == 1
    assert not QuarantinedJsonEvidenceStore(tmp_path).list_verified_revisions(SOURCE, DATASET)


def test_non_json_and_oversized_payload_are_refused_before_archive(tmp_path):
    with pytest.raises(ValueError):
        capture(tmp_path, content_type="text/html")
    assert AcquisitionJournal(tmp_path).audit(SOURCE, DATASET)["failureCount"] == 1
    giant = fixture_response()
    giant["syntheticPad"] = "x" * 300_000
    with pytest.raises(ValueError):
        capture(tmp_path, giant)
    assert AcquisitionJournal(tmp_path).audit(SOURCE, DATASET)["failureCount"] == 2
    assert not QuarantinedJsonEvidenceStore(tmp_path).list_verified_revisions(SOURCE, DATASET)


def test_malicious_url_and_unreviewed_dataset_pair_never_become_allowed(tmp_path):
    journal = AcquisitionJournal(tmp_path)
    for url in (
        SOURCE_URL.replace("api.insee.fr", "api.insee.fr.evil.test"),
        SOURCE_URL.replace("TIME_PERIOD=2023", "TIME_PERIOD=2024"),
        SOURCE_URL + "&dataset=ANYTHING",
        SOURCE_URL.replace("GEO=FRANCE-F", "GEO=FRANCE-M"),
        SOURCE_URL.replace("https://", "http://"),
    ):
        with pytest.raises(EvidenceIntegrityError):
            journal.begin(source_code=SOURCE, dataset_code=DATASET, source_url=url)
    with pytest.raises(EvidenceIntegrityError):
        journal.begin(source_code=SOURCE, dataset_code="ARBITRARY", source_url=SOURCE_URL)
    assert not (tmp_path / "insee").exists()


def test_parser_uses_verified_original_bytes_not_client_value_claim():
    fake = fixture_response()
    with pytest.raises(ValueError):
        parse_private_insee_population(fake, original_http_bytes=raw({"observations": []}))
    with pytest.raises(ValueError):
        parse_private_insee_population(fake, original_http_bytes=b'not JSON')
