"""A small, reproducible V2 proof-of-evidence for CPI inflation.

Purpose:
- ingest real official WDI FP.CPI.TOTL.ZG and IMF WEO PCPIPCH observations;
- publish to the canonical TimescaleDB service (never a local fabricated CSV);
- report *same-calendar-year*, OBSERVED comparisons only, with provenance.
This is NOT a general production scheduler or a ranking of data quality.
"""

from __future__ import annotations

from collections import defaultdict
from datetime import date
from typing import Any

import httpx

from ingestion_service.pipelines.imf_weo import ImfWeoIngestionService
from ingestion_service.pipelines.worldbank import WorldBankIngestionService

INFLATION_CODE = "FP.CPI.TOTL.ZG"
VALID_SOURCE_CODES = frozenset({"WORLD_BANK", "IMF"})
DEFAULT_COUNTRIES = ("FRA", "GAB", "USA")


def _numeric_observed_rows(rows: list[dict[str, Any]]) -> dict[tuple[str, str], dict[str, Any]]:
    """Extract independent annual observations; ignore estimates and missing rows.

    The caller must use the canonical `/api/timeseries/series` endpoint.
    Duplicate publisher-period records are not treated as independent sources.
    """
    observed: dict[tuple[str, str], dict[str, Any]] = {}
    for row in rows:
        source = row.get("sourceCode")
        if source not in VALID_SOURCE_CODES or row.get("valueStatus") != "OBSERVED":
            continue
        if row.get("periodGranularity") != "ANNUAL":
            continue
        year = row.get("periodLabel")
        if not isinstance(year, str) or len(year) != 4 or not year.isdigit():
            continue
        start, end = row.get("periodStart"), row.get("periodEnd")
        if start != f"{year}-01-01" or end != f"{year}-12-31":
            continue
        value = row.get("numericValue")
        if not isinstance(value, (float, int)) or isinstance(value, bool):
            continue
        observed.setdefault((source, year), row)
    return observed


def summarize_country_inflation(
    country: str, rows: list[dict[str, Any]]
) -> dict[str, Any]:
    """Compare the latest common OBSERVED year, not two independent 'latest' years."""
    observed = _numeric_observed_rows(rows)
    years = sorted(
        {year for source, year in observed if source == "WORLD_BANK"} &
        {year for source, year in observed if source == "IMF"},
        reverse=True,
    )
    result: dict[str, Any] = {
        "countryIso3": country,
        "indicatorCode": INFLATION_CODE,
        "comparisonStatus": "NO_ALIGNED_OBSERVED_YEAR",
        "observedYears": {
            source: sorted(
                [year for code, year in observed if code == source],
                reverse=True,
            )[:4]
            for source in sorted(VALID_SOURCE_CODES)
        },
        "year": None,
        "sourceValues": [],
        "absoluteGapPercentagePoints": None,
    }
    if not years:
        return result

    year = years[0]
    values = [observed[(source, year)] for source in ("WORLD_BANK", "IMF")]
    result["comparisonStatus"] = "ALIGNED_OBSERVED"
    result["year"] = year
    result["sourceValues"] = [
        {
            "sourceCode": row["sourceCode"],
            "datasetCode": row.get("datasetCode"),
            "sourceRunKey": row.get("sourceRunKey"),
            "periodLabel": row.get("periodLabel"),
            "valueStatus": row.get("valueStatus"),
            "numericValuePercent": row["numericValue"],
            "sourcePublishedAt": row.get("sourcePublishedAt"),
            "fetchedAtUtc": row.get("fetchedAtUtc"),
        }
        for row in values
    ]
    result["absoluteGapPercentagePoints"] = round(
        abs(values[0]["numericValue"] - values[1]["numericValue"]), 6
    )
    return result


def run_inflation_pilot(
    *,
    worldbank: WorldBankIngestionService,
    imf_weo: ImfWeoIngestionService,
    timeseries_base_url: str,
    countries: tuple[str, ...] = DEFAULT_COUNTRIES,
) -> dict[str, Any]:
    """Run the real upstream and persistence path; fail loudly if any stage is empty."""
    country_scope = {country.strip().upper() for country in countries}
    if not country_scope or any(len(code) != 3 or not code.isalpha() for code in country_scope):
        raise ValueError("Pilot requires valid three-letter ISO country codes")
    if worldbank._timeseries_client is None or imf_weo._timeseries_client is None:
        raise RuntimeError("Pilot requires WHV_INGEST_PUBLISH_TO_TIMESERIES=true; no dry-run masquerading as ingestion")

    manifests = {
        "WORLD_BANK": worldbank.fetch_core_indicators(
            indicator_codes={INFLATION_CODE}, country_iso3s=country_scope
        ),
        "IMF": imf_weo.fetch_core_indicators(
            indicator_codes={INFLATION_CODE}, country_iso3s=country_scope
        ),
    }
    evidence: dict[str, Any] = {}
    for source, runs in manifests.items():
        if len(runs) != 1:
            raise RuntimeError(f"Expected one {source} inflation ingestion run, got {len(runs)}")
        run = runs[0]
        publication = run.notes.get("timeseriesPublication")
        if not isinstance(publication, dict) or publication.get("upsertedCount", 0) <= 0:
            raise RuntimeError(f"{source} had no confirmed canonical observation writes")
        evidence[source] = {
            "runKey": run.run_id,
            "recordCount": run.record_count,
            "persistedCount": publication["upsertedCount"],
            "fetchedAtUtc": run.fetched_at_utc.isoformat(),
        }

    reports = []
    with httpx.Client(base_url=timeseries_base_url, timeout=45) as client:
        for iso3 in sorted(country_scope):
            reply = client.get(
                "/api/timeseries/series",
                params={
                    "countryIso3": iso3,
                    "indicatorCode": INFLATION_CODE,
                    "sortDirection": "DESC",
                    "limit": 500,
                },
            )
            reply.raise_for_status()
            payload = reply.json()
            if not isinstance(payload.get("items"), list):
                raise RuntimeError(f"Invalid canonical series contract for country {iso3}")
            reports.append(summarize_country_inflation(iso3, payload["items"]))

    if not any(report["comparisonStatus"] == "ALIGNED_OBSERVED" for report in reports):
        raise RuntimeError("Neither source has a matching observed inflation year in the selected countries")
    return {
        "pilot": "IMF_WEO_VS_WORLD_BANK_CPI_INFLATION",
        "indicatorCode": INFLATION_CODE,
        "status": "INGESTED_AND_AUDITED",
        "sourceRuns": evidence,
        "countries": reports,
        "notes": [
            "Comparisons include only same-year measured CPI inflation.",
            "WEO forecasts and estimates remain stored separately and are not included in observed consensus.",
            "IMF PCPIPCH and WDI FP.CPI.TOTL.ZG may differ by revisions and national coverage; agreement is not proof of unbiased measurement.",
            "This report describes the temporary test database, not a deployed persistent production backend.",
        ],
    }
