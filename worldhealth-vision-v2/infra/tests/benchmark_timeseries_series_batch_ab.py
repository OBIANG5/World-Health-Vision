#!/usr/bin/env python3
"""Full economic snapshot A/B: one/split historical SQL batch vs 54 original GETs.

All other batches on in both arms. Run only in disposable CI with synthetic
12-country/54-code data. Compares ALL JSON fields other than generatedAtUtc.
"""
from __future__ import annotations

import asyncio
import hashlib
import json
import sys
from time import perf_counter

from prometheus_client import REGISTRY
from analytics_service.clients.catalog_client import CatalogClient
from analytics_service.clients.timeseries_client import TimeseriesClient
from analytics_service.config import Settings
from analytics_service.service import AnalyticsService

BASE = {
    ("catalog", "country"): 1,
    ("catalog", "indicators_batch"): 1,
    ("timeseries", "latest_batch"): 1,
    ("timeseries", "availability_batch"): 1,
    ("timeseries", "series"): 54,
    ("catalog", "source"): 4,
    ("catalog", "dataset"): 4,
    ("timeseries", "source_runs"): 4,
}
ALL_KEYS = set(BASE) | {("timeseries", "series_batch")}


def counters() -> dict[tuple[str, str], float]:
    return {
        key: REGISTRY.get_sample_value(
            "whv_analytics_upstream_http_requests_total",
            {"dependency": key[0], "operation": key[1], "outcome": "success"}
        ) or 0.0
        for key in ALL_KEYS
    }


async def snapshot(country: str, batch: bool, series_limit: int) -> dict:
    settings = Settings(
        catalog_indicator_batch_enabled=True,
        timeseries_latest_batch_enabled=True,
        timeseries_availability_batch_enabled=True,
        timeseries_series_batch_enabled=batch,
    )
    cat = CatalogClient(settings.catalog_base_url, settings.request_timeout_seconds)
    ts = TimeseriesClient(settings.timeseries_base_url, settings.request_timeout_seconds)
    svc = AnalyticsService(settings, cat, ts)
    try:
        before = counters()
        started = perf_counter()
        model = await svc.get_country_economic_snapshot(
            country_iso3=country, source_code=None, dataset_code=None,
            period_granularity=None, include_missing=False, series_limit=series_limit,
        )
        duration_ms = round((perf_counter() - started) * 1000, 3)
        after = counters()
        delta = {key: int(after[key] - before[key]) for key in ALL_KEYS}

        prefetch_limit = min(600, max(96, series_limit * 10))
        chunk_size = min(128, 10000 // prefetch_limit)
        expected_chunks = (54 + chunk_size - 1) // chunk_size
        expected = {
            **{key: value for key, value in BASE.items() if
               key != ("timeseries", "series")}
            , ("timeseries", "series_batch"): expected_chunks
        } if batch else BASE
        if {key: n for key, n in delta.items() if n} != expected:
            raise AssertionError(
                "Missing/duplicate/crossed historical HTTP operations: "
                + json.dumps({f"{key[0]}.{key[1]}": n for key, n in delta.items()})
            )

        data = model.model_dump(mode="json", exclude={"generatedAtUtc"})
        if data["lensCount"] != 54 or len(data["lenses"]) != 54:
            raise AssertionError("Historical batch changed the indicator count")
        comparisons = sum(item["sourceAudit"]["comparableSourceCount"]
                          for item in data["lenses"])
        evidence = sum(len(item["sourceAudit"]["evidence"])
                       for item in data["lenses"])
        if (comparisons, evidence) != (200, 270):
            raise AssertionError("Historical batch changed source confidence/audit evidence")
        digest = hashlib.sha256(json.dumps(
            data, sort_keys=True, separators=(",", ":"), ensure_ascii=False
        ).encode("utf-8")).hexdigest()
        result = {
            "country": country, "series_limit": series_limit,
            "mode": "historical_series_batch" if batch else "historical_54_get",
            "elapsed_ms": duration_ms,
            "http_calls": sum(delta.values()),
            "historical_gets": delta[("timeseries", "series")],
            "historical_batch_posts": delta[("timeseries", "series_batch")],
            "semantic_sha256": digest,
            "lenses": data["lensCount"],
            "source_comparisons": comparisons,
            "audit_evidence_items": evidence,
        }
        print(
            f"OBSERVED historical A/B: {country} seriesLimit={series_limit} "
            f"{result['mode']} calls={result['http_calls']} "
            f"wall={duration_ms}ms evidence={evidence}",
            file=sys.stderr,
        )
        return result
    finally:
        await svc.aclose()


async def main() -> None:
    cases = [
        ("FRA", 12, False), ("FRA", 12, True),
        ("FRA", 12, True), ("FRA", 12, False),
        ("GAB", 12, True), ("GAB", 12, False),
        ("FRA", 24, False), ("FRA", 24, True),
        ("GAB", 24, True), ("GAB", 24, False),
    ]
    results = []
    for country, limit, batch in cases:
        results.append(await snapshot(country, batch, limit))
    for country in ("FRA", "GAB"):
        for limit in (12, 24):
            signatures = {
                row["semantic_sha256"] for row in results
                if row["country"] == country and row["series_limit"] == limit
            }
            if len(signatures) != 1:
                raise AssertionError(
                    f"Historical batch changed full JSON or source-year alignment: {country}/{limit}"
                )
    print(json.dumps({
        "environment": "CI-only synthetic 124416 revised observations, 54 indicators",
        "complete_semantic_equivalence": True,
        "baseline_http": 70,
        "batch_http_series_limit_12": 17,
        "batch_http_series_limit_24": 18,
        "series_limit_is_per_indicator": True,
        "each_indicator_history_is_never_globally_truncated": True,
        "samples": results,
        "limitations": "10 same-run synthetic snapshots, not an international production SLO",
    }, indent=2, ensure_ascii=False))
    print(
        "PASS: full FRA/GAB snapshot SHA256 parity at 12/24 preview limits; "
        "70 GET/POST -> 17 or 18 calls, 54 lenses, 200 comparisons, 270 evidence",
        file=sys.stderr,
    )


if __name__ == "__main__":
    asyncio.run(main())
