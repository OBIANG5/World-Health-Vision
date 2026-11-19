#!/usr/bin/env python3
"""Same disposable SQL fixture A/B of full 54-lens historical batch semantics.

Catalog, latest and availability batch are enabled in BOTH arms; only the
historical Timeseries transport changes. No official observations are stored.
The full model excluding generatedAtUtc is hashed; numerical data not logged.
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

CORE = {
    ("catalog", "country"): 1,
    ("catalog", "indicators_batch"): 1,
    ("timeseries", "latest_batch"): 1,
    ("timeseries", "availability_batch"): 1,
}
BASE = {**CORE, ("timeseries", "series"): 54}
BATCH = {**CORE, ("timeseries", "series_batch"): 1}
TRACKED = set(BASE) | set(BATCH) | {
    ("catalog", "source"),
    ("catalog", "dataset"),
    ("timeseries", "source_runs"),
}
PROVENANCE = {
    ("catalog", "source"), ("catalog", "dataset"), ("timeseries", "source_runs"),
}


def request_metrics():
    return {
        key: REGISTRY.get_sample_value(
            "whv_analytics_upstream_http_requests_total",
            {"dependency": key[0], "operation": key[1], "outcome": "success"},
        ) or 0.0
        for key in TRACKED
    }


async def snapshot(
    country: str, batch: bool, include_missing: bool,
    series_limit: int, source_code: str | None = None,
    dataset_code: str | None = None, period_granularity: str | None = None,
):
    settings = Settings(
        catalog_indicator_batch_enabled=True,
        timeseries_latest_batch_enabled=True,
        timeseries_availability_batch_enabled=True,
        timeseries_history_batch_enabled=batch,
    )
    catalog = CatalogClient(settings.catalog_base_url, settings.request_timeout_seconds)
    timeseries = TimeseriesClient(settings.timeseries_base_url, settings.request_timeout_seconds)
    service = AnalyticsService(settings, catalog, timeseries)
    try:
        before = request_metrics()
        t0 = perf_counter()
        response = await service.get_country_economic_snapshot(
            country_iso3=country,
            source_code=source_code,
            dataset_code=dataset_code,
            period_granularity=period_granularity,
            include_missing=include_missing,
            series_limit=series_limit,
        )
        elapsed = round((perf_counter() - t0) * 1000, 3)
        after = request_metrics()
        delta = {k: int(after[k] - before[k]) for k in TRACKED}
        expected = BATCH if batch else BASE
        for operation, count in expected.items():
            if delta[operation] != count:
                raise AssertionError(f"Wrong historical SQL operation count for {operation}")
        other = ("timeseries", "series") if batch else ("timeseries", "series_batch")
        if delta[other]:
            raise AssertionError("Batch/individual historical queries were accidentally mixed")
        if any(delta[key] < 0 for key in PROVENANCE):
            raise AssertionError("Negative provenance count")
        if country in {"FRA", "GAB"} and not source_code and not dataset_code:
            if {k: delta[k] for k in PROVENANCE} != {
                ("catalog", "source"): 4,
                ("catalog", "dataset"): 4,
                ("timeseries", "source_runs"): 4,
            }:
                raise AssertionError("Four source/dataset/run keys were not single-flighted")
        data = response.model_dump(mode="json", exclude={"generatedAtUtc"})
        if data.get("lensCount") != 54 or len(data.get("lenses", [])) != 54:
            raise AssertionError("Historical batch dropped or duplicated economic lenses")
        comparisons = sum(lens["sourceAudit"]["comparableSourceCount"] for lens in data["lenses"])
        evidence = sum(len(lens["sourceAudit"]["evidence"]) for lens in data["lenses"])
        semantic_hash = hashlib.sha256(json.dumps(
            data, sort_keys=True, ensure_ascii=False, separators=(",", ":"),
        ).encode("utf-8")).hexdigest()
        result = {
            "country": country,
            "mode": "historical_batch" if batch else "baseline_individual_history",
            "include_missing": include_missing,
            "series_limit": series_limit,
            "source_filter": bool(source_code),
            "period_filter": period_granularity or "any",
            "http_calls": sum(delta.values()),
            "history_individual": delta[("timeseries", "series")],
            "history_batch": delta[("timeseries", "series_batch")],
            "provenance_calls": sum(delta[k] for k in PROVENANCE),
            "elapsed_ms": elapsed,
            "comparable_source_count": comparisons,
            "evidence_items": evidence,
            "semantic_sha256": semantic_hash,
        }
        print(
            f"OBSERVED history A/B: {country} mode={result['mode']} "
            f"includeMissing={include_missing} seriesLimit={series_limit} "
            f"http={result['http_calls']} elapsed_ms={elapsed}",
            file=sys.stderr,
        )
        return result
    finally:
        await service.aclose()


async def main():
    # Inverse order for hot-cache bias; exercise realistic sparse and missing
    # observations, different bounded history windows, and single-source filter.
    cases = [
        ("FRA", False, 12, None, None, None, False),
        ("FRA", False, 12, None, None, None, True),
        ("FRA", False, 12, None, None, None, True),
        ("FRA", False, 12, None, None, None, False),
        ("GAB", False, 12, None, None, None, True),
        ("GAB", False, 12, None, None, None, False),
        ("FRA", True, 24, None, None, None, False),
        ("FRA", True, 24, None, None, None, True),
        ("GAB", True, 2, None, None, None, True),
        ("GAB", True, 2, None, None, None, False),
        ("FRA", True, 8, "IMF", "IMF_PUBLIC_DATA", "ANNUAL", False),
        ("FRA", True, 8, "IMF", "IMF_PUBLIC_DATA", "ANNUAL", True),
    ]
    samples = []
    grouped = {}
    for country, include_missing, limit, source, dataset, granularity, batch in cases:
        result = await snapshot(country, batch, include_missing, limit, source, dataset, granularity)
        key = (country, include_missing, limit, source, dataset, granularity)
        grouped.setdefault(key, []).append(result)
        samples.append(result)
    for key, values in grouped.items():
        digests = {v["semantic_sha256"] for v in values}
        if len(digests) != 1:
            raise AssertionError(f"Full snapshot semantic parity failed for {key}")
        evidence = {(v["comparable_source_count"], v["evidence_items"]) for v in values}
        if len(evidence) != 1:
            raise AssertionError(f"Source comparisons/evidence changed for {key}")
        if any(v["history_individual"] == 54 for v in values) and any(
            v["history_batch"] == 1 for v in values
        ):
            legacy = next(v for v in values if v["history_individual"] == 54)
            batch = next(v for v in values if v["history_batch"] == 1)
            if legacy["http_calls"] - batch["http_calls"] != 53:
                raise AssertionError(f"Historical network reduction is not exactly 53: {key}")
    if len(grouped) != 5:
        raise AssertionError("Expected five distinct differential workloads")
    # Baseline dense four-source fixture, same economic records as earlier PRs.
    for v in samples[:10]:
        if v["comparable_source_count"] != 200 or v["evidence_items"] != 270:
            raise AssertionError("Existing 200 source comparisons or 270 audit proofs changed")
        if v["http_calls"] not in (70, 17):
            raise AssertionError("Expected 70 -> 17 reviewed HTTP calls on unfiltered fixture")

    print(json.dumps({
        "fixture": "SYNTHETIC ONLY: 124416 observations, 54 canonical codes, 4 sources, 24 years, 2 revisions",
        "not_live_or_official_data": True,
        "not_a_production_latency_slo": True,
        "all_enabled_flags_are_ci_only": True,
        "baseline_four_source_http": 70,
        "candidate_four_source_http": 17,
        "complete_json_equivalence_per_workload": True,
        "workload_groups": len(grouped),
        "samples": samples,
        "caveat": "Small sequential same-DB A/B; need larger dense, sparse and multi-user tests",
    }, indent=2, ensure_ascii=False))
    print(
        "PASS: complete 54-lens JSON, 200 comparisons and 270 audit proofs "
        "preserved while 54 historical requests become 1 per-indicator SQL batch "
        "(70 to 17 outbound HTTP calls) on the base four-source synthetic fixture",
        file=sys.stderr,
    )


if __name__ == "__main__":
    asyncio.run(main())
