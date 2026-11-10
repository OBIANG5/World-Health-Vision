"""Unit checks for the official-data CPI pilot; no fake values enter production."""

from datetime import UTC, datetime
from pathlib import Path
from types import SimpleNamespace
from unittest.mock import Mock

import httpx
import pytest

from ingestion_service.pilots.inflation import (
    INFLATION_CODE,
    _numeric_observed_rows,
    run_inflation_pilot,
    summarize_country_inflation,
)


def row(source, year, value, *, status="OBSERVED", dataset=None):
    return {
        "sourceCode": source,
        "datasetCode": dataset or ("WDI" if source == "WORLD_BANK" else "IMF_PUBLIC_DATA"),
        "sourceRunKey": "run-123",
        "periodGranularity": "ANNUAL",
        "periodStart": f"{year}-01-01",
        "periodEnd": f"{year}-12-31",
        "periodLabel": str(year),
        "numericValue": value,
        "valueStatus": status,
    }


def test_common_year_required_before_comparing_inflation():
    report = summarize_country_inflation("FRA", [
        row("WORLD_BANK", 2024, 2.4),
        row("IMF", 2025, 3.0, status="ESTIMATED"),
    ])
    assert report["comparisonStatus"] == "NO_ALIGNED_OBSERVED_YEAR"
    assert report["absoluteGapPercentagePoints"] is None


def test_uses_most_recent_same_year_observed_inflation():
    report = summarize_country_inflation("GAB", [
        row("WORLD_BANK", 2024, 2.0),
        row("IMF", 2024, 2.3),
        row("WORLD_BANK", 2023, 1.3),
        row("IMF", 2023, 1.1),
        row("IMF", 2025, 3.9, status="ESTIMATED"),
    ])
    assert report["comparisonStatus"] == "ALIGNED_OBSERVED"
    assert report["year"] == "2024"
    assert report["absoluteGapPercentagePoints"] == 0.3
    assert {x["sourceCode"] for x in report["sourceValues"]} == {"WORLD_BANK", "IMF"}
    assert all(x["valueStatus"] == "OBSERVED" for x in report["sourceValues"])


def test_filters_suppressed_missing_estimates_and_nonannual():
    malformed = [
        row("WORLD_BANK", 2024, None),
        row("IMF", 2024, 3.0, status="MISSING"),
        row("IMF", 2025, 3.0, status="ESTIMATED"),
        dict(row("WORLD_BANK", 2024, 2.0), periodGranularity="MONTHLY"),
        row("OECD", 2024, 1.5),
    ]
    assert _numeric_observed_rows(malformed) == {}


def test_bad_scope_never_contacts_upstream_sources():
    worldbank = Mock()
    imf_weo = Mock()
    with pytest.raises(ValueError):
        run_inflation_pilot(
            worldbank=worldbank,
            imf_weo=imf_weo,
            timeseries_base_url="http://localhost:8080",
            countries=("FRA", "INVALID", "USA"),
        )
    worldbank.fetch_core_indicators.assert_not_called()
    imf_weo.fetch_core_indicators.assert_not_called()


def test_publishing_cannot_be_silently_disabled():
    worldbank = Mock()
    imf_weo = Mock()
    worldbank._timeseries_client = None
    imf_weo._timeseries_client = None
    with pytest.raises(RuntimeError, match="PUBLISH_TO_TIMESERIES"):
        run_inflation_pilot(
            worldbank=worldbank,
            imf_weo=imf_weo,
            timeseries_base_url="http://localhost:8080",
        )
