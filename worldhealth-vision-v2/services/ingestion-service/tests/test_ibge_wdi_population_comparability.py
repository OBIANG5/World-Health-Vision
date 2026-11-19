"""DATA-1B3 adversarial offline research contract tests. ALL numbers SYNTHETIC.

Every WDI and IBGE response here is invented for tests; never interpret as
published Brazil national population or current official World Bank estimates.
"""
from dataclasses import replace
import json

import httpx
import pytest
from pydantic import ValidationError

from ingestion_service.acquisition_journal import AcquisitionJournal
from ingestion_service.bronze_store import BronzeStore
from ingestion_service.connectors.worldbank_population_2022_research import (
    WDI_DATASET, WDI_INDICATOR, WDI_PATH, WDI_URL,
    WdiPopulation2022ResearchClient, parse_wdi_brazil_2022_population,
)
from ingestion_service.pipelines.worldbank_population_2022_research import (
    WdiPopulation2022ResearchPilot,
)
from ingestion_service.population_comparability import (
    ComparableStatus, PopulationMethod, PopulationSourceSpec,
    assess_population_comparability,
)
from ingestion_service.private_population_review import PrivatePopulationReviewStore
from ingestion_service.source_composite_receipt import IbgeCompositeReceiptStore
from ingestion_service.source_evidence_store import EvidenceIntegrityError
from test_ibge_acquisition_composite import capture_population, capture_metadata


# Invented population values are not a purported IBGE/WDI difference.
FAKE_IBGE = 123_456_789
FAKE_WDI = 210_000_000


def wdi_payload(value=FAKE_WDI):
    return [
        {
            "page": 1, "pages": 1, "per_page": 50, "total": 1,
            "sourceid": "2", "lastupdated": "2026-11-19",
        },
        [{
            "indicator": {"id": WDI_INDICATOR, "value": "Population, total"},
            "country": {"id": "BR", "value": "Brazil"},
            "countryiso3code": "BRA",
            "date": "2022", "value": value, "unit": "",
            "obs_status": "", "decimal": 0,
        }],
    ]


def make_transport(*, payload=None, status=200, etag=None, last_modified=None,
                   content_type="application/json", compressed=False):
    def handler(request: httpx.Request):
        assert request.method == "GET"
        assert request.url.scheme == "https"
        assert request.url.host == "api.worldbank.org"
        assert request.url.path == WDI_PATH
        assert request.url.query.decode("ascii") == "date=2022&format=json&source=2"
        assert request.headers["Accept-Encoding"] == "identity"
        headers = {"content-type": content_type}
        if compressed:
            headers["content-encoding"] = "gzip"
        if etag is not None:
            headers["etag"] = etag
        if last_modified is not None:
            headers["last-modified"] = last_modified
        return httpx.Response(
            status,
            stream=httpx.ByteStream(json.dumps(
                wdi_payload() if payload is None else payload, ensure_ascii=False,
                indent=2,
            ).encode("utf-8")),
            headers=headers,
        )
    return httpx.MockTransport(handler)


def capture_wdi(root, *, transport=None):
    return WdiPopulation2022ResearchPilot(
        client=WdiPopulation2022ResearchClient(
            transport=transport or make_transport(),
        ),
        bronze_store=BronzeStore(root),
    ).capture()


def full_pair(root):
    population = capture_population(root)
    ibge_metadata = capture_metadata(root)
    composite = IbgeCompositeReceiptStore(root).create(
        population_sha256=population.notes["httpBodySha256"],
        metadata_sha256=ibge_metadata.aggregate_receipt.notes["httpBodySha256"],
        periods_sha256=ibge_metadata.periods_receipt.notes["httpBodySha256"],
    )
    wdi = capture_wdi(root)
    return composite, wdi


def test_wdi_strict_json_exact_bytes_and_raw_revisions(tmp_path):
    receipt = capture_wdi(
        tmp_path,
        transport=make_transport(etag='"synthetic-wdi-v1"',
                                 last_modified="Thu, 19 Nov 2026 15:00:00 GMT"),
    )
    assert receipt.dataset_code == WDI_DATASET
    assert receipt.source_code == "WORLD_BANK"
    assert receipt.notes["referenceYear"] == 2022
    assert receipt.notes["countryIso3"] == "BRA"
    assert receipt.notes["publicationStatus"] == "BRONZE_ONLY_UNREVIEWED"
    assert receipt.notes["licenseReviewStatus"] == "REVIEW_REQUIRED"
    assert receipt.notes["timeseriesPublication"] == "NOT_ATTEMPTED"
    assert receipt.notes["populationDefinition"] == "DE_FACTO_MIDYEAR_ESTIMATE"
    assert receipt.notes["rawSha256"] != receipt.notes["httpBodySha256"]
    data = json.loads(receipt.raw_payload_path.read_text(encoding="utf-8"))
    assert data[1][0]["value"] == FAKE_WDI
    observation = json.loads(receipt.normalized_payload_path.read_text())
    assert observation["indicator_code"] == WDI_INDICATOR
    assert observation["value_status"] == "MIDYEAR_ESTIMATE"
    assert observation["source_published_at"] is None
    assert observation["source_metadata"]["providerDatasetUpdatedLabel"] == "2026-11-19"
    assert observation["source_metadata"]["providerObservationRevisedAt"] is None
    journal = AcquisitionJournal(tmp_path)
    state = journal.audit("WORLD_BANK", WDI_DATASET)
    assert state["successCount"] == state["eventCount"] == state["versionCount"] == 1
    outcome = next((tmp_path / "world_bank" / WDI_DATASET.lower() / "_acquisitions")
                   .glob("*/outcome.json"))
    recorded = json.loads(outcome.read_text())
    assert recorded["etag"] == '"synthetic-wdi-v1"'
    assert recorded["lastModified"] == "Thu, 19 Nov 2026 15:00:00 GMT"
    assert recorded["responseSha256"] == receipt.notes["httpBodySha256"]


def test_same_wdi_bytes_are_one_revision_but_two_acquisitions(tmp_path):
    first = capture_wdi(tmp_path)
    second = capture_wdi(tmp_path)
    assert first.run_id == second.run_id
    assert first.fetched_at_utc == second.fetched_at_utc
    audits = AcquisitionJournal(tmp_path).audit("WORLD_BANK", WDI_DATASET)
    assert audits["versionCount"] == 1
    assert audits["successCount"] == 2
    assert audits["versions"][0]["successfulFetchCount"] == 2
    assert len(list(tmp_path.rglob("manifest.json"))) == 1


@pytest.mark.parametrize("mutation", [
    lambda p: p[0].update({"pages": 2}),
    lambda p: p[0].update({"sourceid": "3"}),
    lambda p: p[0].update({"total": 0}),
    lambda p: p[1][0].update({"date": "2021"}),
    lambda p: p[1][0].update({"countryiso3code": "ARG"}),
    lambda p: p[1][0]["country"].update({"id": "AR"}),
    lambda p: p[1][0]["indicator"].update({"id": "SP.POP.2222"}),
    lambda p: p[1][0].update({"obs_status": "F"}),
    lambda p: p[1][0].update({"value": None}),
    lambda p: p[1][0].update({"value": "210000000"}),
    lambda p: p[1][0].update({"value": float("inf")}),
    lambda p: p[1][0].update({"value": 1.8}),
    lambda p: p[1][0].update({"value": True}),
    lambda p: p[1].append(p[1][0].copy()),
])
def test_invalid_or_forecast_wdi_never_creates_a_verified_version(tmp_path, mutation):
    payload = wdi_payload()
    mutation(payload)
    with pytest.raises((ValueError, TypeError)):
        capture_wdi(tmp_path, transport=make_transport(payload=payload))
    audit = AcquisitionJournal(tmp_path).audit("WORLD_BANK", WDI_DATASET)
    assert audit["failureCount"] == 1
    assert audit["successCount"] == 0 and audit["versionCount"] == 0
    assert not list(tmp_path.rglob("manifest.json"))


@pytest.mark.parametrize("status,content_type,compressed", [
    (503, "application/json", False),
    (429, "application/json", False),
    (302, "application/json", False),
    (200, "text/html", False),
    (200, "application/json", True),
])
def test_wdi_bad_http_is_journalled_as_failure_without_raw_source_version(
    tmp_path, status, content_type, compressed,
):
    with pytest.raises((ValueError, httpx.HTTPStatusError)):
        capture_wdi(tmp_path, transport=make_transport(
            status=status, content_type=content_type, compressed=compressed,
        ))
    state = AcquisitionJournal(tmp_path).audit("WORLD_BANK", WDI_DATASET)
    assert state["failureCount"] == 1
    assert state["versionCount"] == 0
    outcome = next(tmp_path.rglob("outcome.json"))
    event = json.loads(outcome.read_text())
    assert event["httpStatus"] == (status if status != 200 else None)
    assert event["responseSha256"] is None


def test_wdi_source_url_cannot_be_replaced_by_a_third_party_or_other_year(tmp_path):
    journal = AcquisitionJournal(tmp_path)
    for url in (
        WDI_URL.replace("api.worldbank.org", "evil.test"),
        WDI_URL.replace("2022", "2021"),
        WDI_URL.replace("source=2", "source=3"),
        WDI_URL + "&foo=bar",
        WDI_URL.replace("https", "http"),
        WDI_URL.replace("BRA", "ARG"),
    ):
        with pytest.raises(EvidenceIntegrityError):
            journal.begin(source_code="WORLD_BANK", dataset_code=WDI_DATASET, source_url=url)
    with pytest.raises(EvidenceIntegrityError):
        journal.begin(source_code="WORLD_BANK", dataset_code="UNREVIEWED", source_url=WDI_URL)


def source_spec(*, source="IBGE", country="BRA", year=2022, unit="PERSONS",
                concept="RESIDENT_DE_JURE", instant="2022-07-31_CENSUS",
                method=PopulationMethod.NATIONAL_RESIDENT_CENSUS_WITH_IMPUTATION,
                value=FAKE_IBGE, evidence="VERIFIED_PRIVATE_BRONZE"):
    return PopulationSourceSpec(
        institution_code=source,
        dataset_code="SYNTHETIC_TEST_ONLY",
        indicator_code="SYNTHETIC.TEST.POPULATION",
        country_iso3=country, year=year, unit=unit,
        population_concept=concept, reference_instant=instant,
        method=method, source_data_dependency="UNKNOWN",
        response_sha256="1" * 64, evidence_level=evidence,
        rights_status="REVIEW_REQUIRED",
        method_document_url="https://example.test/synthetic",
        observation_value=value if evidence == "VERIFIED_PRIVATE_BRONZE" else None,
    )


def test_scientific_engine_never_calls_two_equal_values_independent_agreement():
    a = source_spec()
    b = source_spec(
        source="WORLD_BANK", value=FAKE_IBGE,
        concept="DE_FACTO_RESIDENT",
        instant="2022_MIDYEAR_ESTIMATE",
        method=PopulationMethod.INTERNATIONAL_DE_FACTO_MIDYEAR_ESTIMATE,
    )
    report = assess_population_comparability(a, b)
    assert report.status == ComparableStatus.INCOMPATIBLE_POPULATION_CONCEPT
    assert "CENSUS_31_JULY_VS_WDI_MIDYEAR_REFERENCE" in report.reasons
    assert "FIELD_CENSUS_VS_DEMOGRAPHIC_ESTIMATE" in report.reasons
    assert report.numeric_difference_percent is None
    assert report.numeric_delta_persons is None
    assert report.independent_corroboration_established is False
    assert report.commercial_display_authorized is False
    assert report.headline_agreement_or_disagreement is None
    assert str(FAKE_IBGE) not in json.dumps(report.model_dump(mode="json"))


@pytest.mark.parametrize("change,expected", [
    ({"country_iso3": "ARG"}, ComparableStatus.INCOMPATIBLE_COUNTRY),
    ({"year": 2021}, ComparableStatus.INCOMPATIBLE_YEAR),
    ({"unit": "THOUSANDS_OF_PERSONS"}, ComparableStatus.INCOMPATIBLE_UNIT),
    ({"population_concept": "DE_FACTO_RESIDENT"}, ComparableStatus.INCOMPATIBLE_POPULATION_CONCEPT),
    ({"reference_instant": "2022_MIDYEAR_ESTIMATE"}, ComparableStatus.REFERENCE_TIME_AND_METHOD_DIFFER),
])
def test_research_model_rejects_scope_method_and_unit_mismatch(change, expected):
    base = source_spec()
    independent = source_spec(source="WORLD_BANK", value=FAKE_WDI)
    result = assess_population_comparability(base, independent.model_copy(update=change))
    assert result.status == expected
    assert result.numeric_difference_percent is None


def test_unavailable_source_is_not_a_zero_population():
    report = assess_population_comparability(source_spec(), None)
    assert report.status == ComparableStatus.MISSING_SOURCE
    assert report.numeric_delta_persons is None
    with pytest.raises(ValidationError):
        source_spec(evidence="NO_VERIFIED_SOURCE", value=FAKE_IBGE).model_copy(
            update={"evidence_level": "VERIFIED_PRIVATE_BRONZE", "observation_value": None}
        ).model_validate({"evidence_level": "VERIFIED_PRIVATE_BRONZE", "observation_value": None})


def test_private_two_source_review_requires_verified_3_part_ibge_and_wdi(tmp_path):
    ibge, wdi = full_pair(tmp_path)
    store = PrivatePopulationReviewStore(tmp_path)
    result = store.evaluate(
        ibge_composite_sha256=ibge["receiptSha256"],
        wdi_response_sha256=wdi.notes["httpBodySha256"],
    )
    checked = store.verify(result["reviewReceiptSha256"])
    assert checked["sourceCount"] == 2
    assert checked["publicDisplayAuthorised"] is False
    assert result["numericComparison"] == "NOT_COMPUTED"
    assert result["publicDisplayAuthorised"] is False
    report = json.loads((tmp_path / result["relativePath"]).read_text())
    assert report["assessment"]["status"] == "INCOMPATIBLE_POPULATION_CONCEPT"
    assert report["assessment"]["independent_corroboration_established"] is False
    assert "BRAZIL_SPECIFIC_UPSTREAM_WDI_INPUT_RELATION_NOT_VERIFIED" in report["assessment"]["reasons"]
    assert report["sourceDependence"] == "NOT_PROVEN_INDEPENDENT"
    assert report["ibgeDatasetRights"] == "NEEDS_PROVIDER_CLARIFICATION"
    assert report["numericComparison"] == "NOT_COMPUTED"
    assert str(FAKE_IBGE) not in (tmp_path / result["relativePath"]).read_text()
    assert str(FAKE_WDI) not in (tmp_path / result["relativePath"]).read_text()
    again = store.evaluate(
        ibge_composite_sha256=ibge["receiptSha256"],
        wdi_response_sha256=wdi.notes["httpBodySha256"],
    )
    assert again["reviewReceiptSha256"] == result["reviewReceiptSha256"]
    assert not (tmp_path / "timeseries").exists()


def test_comparison_rejects_tamper_unknown_sha_and_unfetched_wdi(tmp_path):
    ibge, wdi = full_pair(tmp_path)
    review = PrivatePopulationReviewStore(tmp_path)
    with pytest.raises(EvidenceIntegrityError):
        review.evaluate(
            ibge_composite_sha256=ibge["receiptSha256"],
            wdi_response_sha256="0" * 64,
        )
    result = review.evaluate(
        ibge_composite_sha256=ibge["receiptSha256"],
        wdi_response_sha256=wdi.notes["httpBodySha256"],
    )
    review_path = tmp_path / result["relativePath"]
    review_path.write_text(review_path.read_text().replace(
        '"numericComparison":"NOT_COMPUTED"',
        '"numericComparison":"PUBLISHED"',
    ))
    with pytest.raises(EvidenceIntegrityError):
        review.verify(result["reviewReceiptSha256"])


def test_comparison_detects_corrupted_wdi_version_or_removed_journal(tmp_path):
    ibge, wdi = full_pair(tmp_path)
    report = PrivatePopulationReviewStore(tmp_path).evaluate(
        ibge_composite_sha256=ibge["receiptSha256"],
        wdi_response_sha256=wdi.notes["httpBodySha256"],
    )
    wdi.raw_payload_path.write_bytes(b"CHANGED")
    with pytest.raises(EvidenceIntegrityError):
        PrivatePopulationReviewStore(tmp_path).verify(report["reviewReceiptSha256"])
