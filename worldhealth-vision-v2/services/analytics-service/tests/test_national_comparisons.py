"""Country-specific publication vs canonical international sources.

No national or international value from this test module is connected to a
production dataset. All numeric fixtures are mocks and never leave CI.
"""

import asyncio
from datetime import UTC, date, datetime

import httpx

from analytics_service.api import app
from analytics_service.clients.catalog_client import CatalogClient
from analytics_service.clients.timeseries_client import TimeseriesClient
from analytics_service.config import Settings
from analytics_service.national_comparisons import (
    NationalDocumentedRelease,
    compare_national_release,
)
from analytics_service.models import LatestSourceObservation
from analytics_service.service import AnalyticsService


def local_release(reference_year: int = 2026) -> NationalDocumentedRelease:
    return NationalDocumentedRelease(
        releaseCode="GAB-RGPL-2026-RESIDENTS",
        countryIso3="GAB",
        sourceCode="INSTAT_GABON",
        indicatorCode="SP.POP.TOTL",
        referenceYear=reference_year,
        valueNumeric=3_518_621,
        unitLabel="PEOPLE",
        populationScope="ALL_RESIDENTS",
        methodKind="CENSUS",
        publicationStatus="PRELIMINARY_HOMOLOGATED",
        releaseDate=date(2026, 8, 27),
        title="RGPL 2026",
        primaryEvidenceUrl="https://new.instatgabon.org/fr",
        methodologyCaveat="Preliminary, census coverage needs review.",
        internationalComparisonNote="Do not compare periods uncritically.",
        verificationStatus="DOCUMENTED_NOT_INGESTED",
        reviewedOn=date(2026, 11, 12),
    )


def international(
    year: int,
    value: float | None,
    *,
    source: str = "WORLD_BANK",
    country: str = "GAB",
    indicator: str = "SP.POP.TOTL",
    status: str = "OBSERVED",
    dataset: str = "WDI",
    fetched_at: datetime | None = None,
) -> LatestSourceObservation:
    return LatestSourceObservation(
        sourceCode=source,
        sourceDisplayName=source,
        datasetCode=dataset,
        datasetDisplayName=dataset,
        sourceRunKey=f"{source}-{year}",
        countryIso3=country,
        countryDisplayName="Gabon",
        indicatorCode=indicator,
        indicatorDisplayName="Population total",
        periodGranularity="ANNUAL",
        periodStart=date(year, 1, 1),
        periodEnd=date(year, 12, 31),
        periodLabel=str(year),
        numericValue=value,
        valueStatus=status,
        fetchedAtUtc=fetched_at,
    )


def test_different_years_do_not_create_automatic_conflict_or_gap():
    result = compare_national_release(local_release(2026), [
        international(2025, 2_593_130),
    ])
    assert result.status == "DIFFERENT_REFERENCE_PERIOD"
    assert result.internationalLatest[0].periodLabel == "2025"
    assert result.internationalLatest[0].numericValue == 2_593_130
    assert result.numericalDifference is None
    assert result.comparableByMethod is False


def test_even_same_year_population_does_not_imply_identical_method():
    result = compare_national_release(local_release(), [
        international(2026, 2_900_000, status="ESTIMATED"),
    ])
    assert result.status == "SAME_YEAR_METHOD_NOT_VERIFIED"
    assert result.internationalLatest[0].valueStatus == "ESTIMATED"
    assert result.numericalDifference is None


def test_no_international_data_is_not_equivalent_to_zero():
    result = compare_national_release(local_release(), [])
    assert result.status == "NO_INTERNATIONAL_OBSERVATIONS"
    assert result.internationalLatest == []
    assert result.numericalDifference is None


def test_wrong_country_missing_suppressed_and_nonfinite_values_are_excluded():
    result = compare_national_release(local_release(), [
        international(2026, 1_200_000, country="FRA"),
        international(2026, 1_200_000, indicator="NY.GDP.MKTP.CD"),
        international(2026, None),
        international(2026, 0, status="SUPPRESSED"),
        international(2026, float("inf")),
    ])
    assert result.status == "NO_INTERNATIONAL_OBSERVATIONS"
    assert result.internationalLatest == []


def test_two_datasets_from_one_institution_do_not_double_count():
    result = compare_national_release(local_release(), [
        international(2024, 2_400_000, dataset="WDI"),
        international(2025, 2_500_000, dataset="WB_OTHER"),
        international(2025, 2_510_000, source="IMF", dataset="IMF_WEO",
                      status="ESTIMATED"),
    ])
    assert len(result.internationalLatest) == 2
    assert {i.sourceCode for i in result.internationalLatest} == {"WORLD_BANK", "IMF"}
    assert next(i for i in result.internationalLatest if i.sourceCode == "WORLD_BANK").periodLabel == "2025"


def test_mixed_timezone_publication_dates_do_not_break_comparison():
    result = compare_national_release(local_release(), [
        international(2025, 2_000_000, dataset="ONE", fetched_at=datetime(2026, 1, 1, tzinfo=UTC)),
        international(2025, 2_050_000, dataset="TWO", fetched_at=datetime(2026, 2, 1)),
    ])
    assert len(result.internationalLatest) == 1
    assert result.internationalLatest[0].datasetCode == "TWO"


def build_test_service(*, include_canonical: bool, include_local: bool = True):
    def catalog_route(request: httpx.Request) -> httpx.Response:
        if request.url.path == "/api/catalog/countries/GAB/local-context":
            payload = {
                "countryIso3": "GAB",
                "localSourceCount": 1 if include_local else 0,
                "localSources": [{"sourceCode": "INSTAT_GABON"}] if include_local else [],
                "documentedReleaseCount": 1 if include_local else 0,
                "documentedReleases": [local_release().model_dump(mode="json")] if include_local else [],
            }
            return httpx.Response(200, json=payload)
        return httpx.Response(404, json={"detail": "Country not in catalog"})

    def timeseries_route(request: httpx.Request) -> httpx.Response:
        assert request.url.path == "/api/timeseries/series/latest"
        assert request.url.params["countryIso3"] == "GAB"
        assert request.url.params["indicatorCode"] == "SP.POP.TOTL"
        assert request.url.params["periodGranularity"] == "ANNUAL"
        rows = [international(2025, 2_593_130).model_dump(mode="json")] if include_canonical else []
        return httpx.Response(200, json={"count": len(rows), "items": rows})

    settings = Settings(
        catalog_base_url="http://catalog.test",
        timeseries_base_url="http://timeseries.test",
        request_timeout_seconds=5,
    )
    return AnalyticsService(
        settings=settings,
        catalog_client=CatalogClient("http://catalog.test", 5, transport=httpx.MockTransport(catalog_route)),
        timeseries_client=TimeseriesClient("http://timeseries.test", 5, transport=httpx.MockTransport(timeseries_route)),
    )


def test_real_api_contract_reads_catalog_and_timeseries_without_static_world_bank_number():
    async def run():
        service = build_test_service(include_canonical=True)
        app.state.analytics_service = service
        try:
            async with httpx.AsyncClient(
                transport=httpx.ASGITransport(app=app),
                base_url="http://api.test",
            ) as client:
                response = await client.get("/api/analytics/countries/GAB/national-comparisons")
            assert response.status_code == 200, response.text
            payload = response.json()
            assert payload["countryIso3"] == "GAB"
            assert payload["comparisonCount"] == 1
            record = payload["comparisons"][0]
            assert record["status"] == "DIFFERENT_REFERENCE_PERIOD"
            assert record["internationalLatest"][0]["numericValue"] == 2_593_130
            assert record["numericalDifference"] is None
        finally:
            await service.aclose()

    asyncio.run(run())


def test_api_reports_no_canonical_values_when_database_empty():
    async def run():
        service = build_test_service(include_canonical=False)
        try:
            result = await service.get_country_national_comparisons("GAB")
            assert result.comparisonCount == 1
            assert result.comparisons[0].status == "NO_INTERNATIONAL_OBSERVATIONS"
        finally:
            await service.aclose()

    asyncio.run(run())


def test_api_does_not_trigger_unsupported_calls_for_countries_without_releases():
    async def run():
        service = build_test_service(include_canonical=False, include_local=False)
        try:
            result = await service.get_country_national_comparisons("GAB")
            assert result.comparisonCount == 0
        finally:
            await service.aclose()

    asyncio.run(run())
