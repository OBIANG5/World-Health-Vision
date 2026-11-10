"""Prevent misleading multi-source inflation comparisons.

A source's most recent value is not necessarily the same economic period as
another source's latest value. Same-year / same-granularity / distinct-source
alignment is a prerequisite for any claim of agreement or disagreement.
"""
from datetime import date

from analytics_service.models import DivergenceSummary, LatestSourceObservation


def make_observation(
    source: str,
    value: float | None,
    year: int = 2024,
    status: str = "OBSERVED",
    dataset: str = "WDI",
    granularity: str = "ANNUAL",
) -> LatestSourceObservation:
    return LatestSourceObservation(
        sourceCode=source,
        sourceDisplayName=source,
        datasetCode=dataset,
        datasetDisplayName=dataset,
        sourceRunKey=f"run-{source}",
        countryIso3="FRA",
        countryDisplayName="France",
        indicatorCode="FP.CPI.TOTL.ZG",
        indicatorDisplayName="Inflation (consumer prices)",
        periodGranularity=granularity,
        periodStart=date(year, 1, 1),
        periodEnd=date(year, 12, 31),
        periodLabel=str(year),
        numericValue=value,
        valueStatus=status,
    )


def test_does_not_compare_2024_actual_to_2025_estimate():
    observed = make_observation("WORLD_BANK", 2.0, 2024)
    estimate = make_observation("IMF", 3.5, 2025, "ESTIMATED", "IMF_PUBLIC_DATA")
    result = DivergenceSummary.from_latest_by_source(
        [observed, estimate], latest_comparable_period_label="2025"
    )
    assert result.sourceCount == 2
    assert result.latestComparablePeriodLabel == "2025"
    assert result.comparableValueCount == 1
    assert result.agreementLevel == "INSUFFICIENT_DATA"
    assert result.medianNumericValue == 3.5
    assert result.rangeAbsolute == 0.0


def test_same_year_independent_sources_are_comparable():
    world_bank = make_observation("WORLD_BANK", 2.1)
    imf = make_observation("IMF", 2.7, dataset="IMF_PUBLIC_DATA")
    result = DivergenceSummary.from_latest_by_source(
        [world_bank, imf], latest_comparable_period_label="2024"
    )
    assert result.comparableValueCount == 2
    assert abs(result.medianNumericValue - 2.4) < 1e-10
    assert abs(result.rangeAbsolute - 0.6) < 1e-10
    assert result.agreementLevel == "DIVERGENT"


def test_duplicate_datasets_from_one_institution_are_not_independent_evidence():
    records = [
        make_observation("IMF", 2.6, dataset="IMF_WEO"),
        make_observation("IMF", 2.6, dataset="IMF_IFS"),
    ]
    result = DivergenceSummary.from_latest_by_source(records, latest_comparable_period_label="2024")
    assert result.sourceCount == 1
    assert result.comparableValueCount == 1
    assert result.agreementLevel == "INSUFFICIENT_DATA"


def test_missing_and_suppressed_values_never_establish_agreement():
    records = [
        make_observation("WORLD_BANK", 0.0),
        make_observation("IMF", None, status="MISSING"),
        make_observation("OECD", 0.0, status="SUPPRESSED"),
    ]
    result = DivergenceSummary.from_latest_by_source(records, latest_comparable_period_label="2024")
    assert result.comparableValueCount == 1
    assert result.agreementLevel == "INSUFFICIENT_DATA"


def test_when_no_target_period_is_provided_choose_newest_available_year():
    records = [
        make_observation("WORLD_BANK", 1.9, year=2023),
        make_observation("IMF", 3.2, year=2024, dataset="IMF_PUBLIC_DATA"),
    ]
    result = DivergenceSummary.from_latest_by_source(records)
    assert result.latestComparablePeriodLabel == "2024"
    assert result.comparableValueCount == 1
    assert result.medianNumericValue == 3.2


def test_does_not_compare_mismatched_granularity():
    records = [
        make_observation("WORLD_BANK", 4.0),
        make_observation("IMF", 3.9, dataset="IMF_PUBLIC_DATA", granularity="MONTHLY"),
    ]
    result = DivergenceSummary.from_latest_by_source(records, latest_comparable_period_label="2024")
    assert result.comparableValueCount == 1
