"""Historical source comparison must align reference periods, not publication dates."""

from datetime import UTC, date, datetime

from analytics_service.models import DivergenceSummary, TimeseriesObservation


def record(
    source: str,
    year: int,
    value: float | None,
    status: str = "OBSERVED",
    dataset: str = "DATA",
    start: date | None = None,
    end: date | None = None,
    granularity: str = "ANNUAL",
) -> TimeseriesObservation:
    return TimeseriesObservation(
        sourceCode=source,
        sourceDisplayName=source,
        datasetCode=dataset,
        datasetDisplayName=dataset,
        sourceRunKey=f"run-{source}-{year}",
        countryIso3="GAB",
        countryDisplayName="Gabon",
        indicatorCode="SP.POP.TOTL",
        indicatorDisplayName="Population, total",
        periodGranularity=granularity,
        periodStart=start or date(year, 1, 1),
        periodEnd=end or date(year, 12, 31),
        periodLabel=str(year),
        numericValue=value,
        valueStatus=status,
        fetchedAtUtc=datetime(2026, 11, 12, tzinfo=UTC),
    )


def compare(items, source_count=2):
    return DivergenceSummary.from_historical_observations(
        items=items,
        source_count=source_count,
    )


def test_finds_older_common_year_instead_of_mixing_latest_years():
    summary, aligned = compare([
        record("WORLD_BANK", 2025, 2_593_130),
        record("WORLD_BANK", 2024, 2_538_952),
        record("IMF", 2024, 2_540_000),
    ])
    assert summary.sourceCount == 2
    assert summary.latestComparablePeriodLabel == "2024"
    assert summary.comparableValueCount == 2
    assert {row.sourceCode for row in aligned} == {"WORLD_BANK", "IMF"}
    assert all(row.periodStart == date(2024, 1, 1) for row in aligned)


def test_uses_newest_shared_period_not_oldest_common_year():
    summary, aligned = compare([
        record("WORLD_BANK", 2025, 2_593_130),
        record("WORLD_BANK", 2024, 2_538_952),
        record("IMF", 2024, 2_540_000),
        record("IMF", 2023, 2_480_000),
        record("WORLD_BANK", 2023, 2_484_789),
    ])
    assert summary.latestComparablePeriodLabel == "2024"
    assert len(aligned) == 2


def test_estimate_stays_an_estimate_in_a_same_year_comparison():
    summary, aligned = compare([
        record("WORLD_BANK", 2025, 2.0),
        record("IMF", 2025, 2.2, status="ESTIMATED"),
    ])
    assert summary.comparableValueCount == 2
    assert summary.latestComparablePeriodLabel == "2025"
    assert next(v for v in aligned if v.sourceCode == "IMF").valueStatus == "ESTIMATED"


def test_one_institution_multiple_datasets_are_not_independent_evidence():
    summary, aligned = compare([
        record("IMF", 2025, 2.5, dataset="WEO", status="ESTIMATED"),
        record("IMF", 2025, 2.4, dataset="IFS", status="OBSERVED"),
    ], source_count=1)
    assert summary.comparableValueCount == 1
    assert summary.agreementLevel == "INSUFFICIENT_DATA"
    assert len(aligned) == 1
    assert aligned[0].datasetCode == "IFS"


def test_different_quarters_never_count_as_a_matching_period():
    summary, aligned = compare([
        record("WORLD_BANK", 2025, 2.1, start=date(2025, 1, 1), end=date(2025, 3, 31), granularity="QUARTERLY"),
        record("IMF", 2025, 2.8, start=date(2025, 4, 1), end=date(2025, 6, 30), granularity="QUARTERLY"),
    ])
    assert summary.comparableValueCount == 1
    assert summary.agreementLevel == "INSUFFICIENT_DATA"
    assert len(aligned) == 1


def test_missing_suppressed_and_nonfinite_numbers_never_prove_consensus():
    summary, aligned = compare([
        record("WORLD_BANK", 2024, 2.1, status="MISSING"),
        record("IMF", 2024, 2.2, status="SUPPRESSED"),
        record("OTHER", 2024, float("nan")),
    ], source_count=3)
    assert summary.comparableValueCount == 0
    assert summary.agreementLevel == "INSUFFICIENT_DATA"
    assert aligned == []


def test_zero_is_a_valid_measured_value():
    summary, aligned = compare([
        record("WORLD_BANK", 2024, 0),
        record("IMF", 2024, 0),
    ])
    assert summary.comparableValueCount == 2
    assert summary.agreementLevel == "CONSISTENT"
    assert summary.medianNumericValue == 0
    assert len(aligned) == 2
