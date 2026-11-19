#!/usr/bin/env python3
"""Differential A/B for internal Catalog indicator batching on disposable dense DB.

Runs ONLY inside analytics-service in isolated CI, never hits Vercel/public URLs.
Both modes use the SAME code, database, series/provenance algorithms and source
metadata; the only difference is 54 GET vs 1 bounded internal POST to Catalog.
No statistical values are printed or exported, only complete semantic digests.
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

EXPECTED_BASELINE = {
    ("catalog", "country"): 1,
    ("catalog", "indicator"): 54,
    ("timeseries", "latest_by_source"): 54,
    ("timeseries", "availability"): 54,
    ("timeseries", "series"): 54,
    ("catalog", "source"): 4,
    ("catalog", "dataset"): 4,
    ("timeseries", "source_runs"): 4,
}
EXPECTED_BATCH = {
    **{k: v for k, v in EXPECTED_BASELINE.items() if k != ("catalog", "indicator")},
    ("catalog", "indicators_batch"): 1,
}
TRACKED = set(EXPECTED_BASELINE) | set(EXPECTED_BATCH)


def success_counters() -> dict[tuple[str, str], float]:
    return {
        key: REGISTRY.get_sample_value(
            "whv_analytics_upstream_http_requests_total",
            {"dependency": key[0], "operation": key[1], "outcome": "success"},
        ) or 0.0
        for key in TRACKED
    }


async def snapshot(country: str, batch: bool) -> dict:
    # A new client and request-local resolution cache for each call: no
    # unacknowledged cross-user/cross-country snapshot cache.
    settings = Settings(catalog_indicator_batch_enabled=batch)
    catalog = CatalogClient(settings.catalog_base_url, settings.request_timeout_seconds)
    timeseries = TimeseriesClient(settings.timeseries_base_url, settings.request_timeout_seconds)
    service = AnalyticsService(settings, catalog, timeseries)
    try:
        before = success_counters()
        started = perf_counter()
        model = await service.get_country_economic_snapshot(
            country_iso3=country, source_code=None, dataset_code=None,
            period_granularity=None, include_missing=False, series_limit=12,
        )
        elapsed = round((perf_counter() - started) * 1000, 3)
        delta = {key: int(success_counters()[key] - before[key]) for key in TRACKED}
        expected = EXPECTED_BATCH if batch else EXPECTED_BASELINE
        if {key: count for key, count in delta.items() if count} != expected:
            raise AssertionError(
                "Incorrect call accounting on synthetic A/B: "
                + json.dumps({f"{k[0]}.{k[1]}": v for k, v in delta.items()})
            )
        # Do not drop any schema/model/narrative/sourceAudit field. Full dump
        # excludes ONLY the non-deterministic response generation timestamp.
        data = model.model_dump(mode="json", exclude={"generatedAtUtc"})
        if data["lensCount"] != 54 or len(data["lenses"]) != 54:
            raise AssertionError("Batch changed economic lens count")
        comparison_count = sum(lens["sourceAudit"]["comparableSourceCount"]
                               for lens in data["lenses"])
        evidence_count = sum(len(lens["sourceAudit"]["evidence"])
                             for lens in data["lenses"])
        if (comparison_count, evidence_count) != (200, 270):
            raise AssertionError("Batch changed the synthetic source evidence contract")
        digest = hashlib.sha256(json.dumps(
            data, sort_keys=True, ensure_ascii=False, separators=(",", ":")
        ).encode("utf-8")).hexdigest()
        item = {
            "synthetic_country": country,
            "mode": "catalog_batch" if batch else "baseline_54_get",
            "elapsed_ms": elapsed,
            "http_calls": sum(delta.values()),
            "catalog_indicator_calls": delta[("catalog", "indicator")],
            "catalog_batch_calls": delta[("catalog", "indicators_batch")],
            "timeseries_calls": sum(v for (dep, _), v in delta.items() if dep == "timeseries"),
            "evidence_items": evidence_count,
            "comparable_sources": comparison_count,
            "semantic_sha256_excluding_only_generatedAtUtc": digest,
        }
        print(f"OBSERVED catalog A/B: {country} {item['mode']} "
              f"{item['http_calls']} HTTP, elapsed={elapsed}ms, evidence={evidence_count}",
              file=sys.stderr)
        return item
    finally:
        await service.aclose()


async def main() -> int:
    samples = []
    # Reversal mitigates, but does not eliminate, warmup/order effects.
    for code, batch in [
        ("FRA", False), ("FRA", True), ("FRA", True), ("FRA", False),
        ("GAB", True), ("GAB", False),
    ]:
        samples.append(await snapshot(code, batch))
    for country in ("FRA", "GAB"):
        digests = {
            s["semantic_sha256_excluding_only_generatedAtUtc"]
            for s in samples if s["synthetic_country"] == country
        }
        if len(digests) != 1:
            raise AssertionError("Full economic JSON differs between sequential and batch Catalog modes")
    report = {
        "fixture": "SYNTHETIC 124416 revised observations: 12 countries, 54 indicators, 4 sources",
        "not_live_or_official_data": True,
        "batch_is_opt_in_and_private": True,
        "full_semantic_equivalence": True,
        "expected_per_snapshot_before": 229,
        "expected_per_snapshot_after": 176,
        "samples": samples,
        "interpretation_limit": "6 A/B samples; durations descriptive, not production p95/p99 or guaranteed speedup",
    }
    print(json.dumps(report, indent=2, ensure_ascii=False))
    print("PASS: same complete JSON for FRA/GAB, preserved 200 comparisons / 270 evidence, "
          "229 to 176 bounded HTTP calls", file=sys.stderr)
    return 0


if __name__ == "__main__":
    raise SystemExit(asyncio.run(main()))
