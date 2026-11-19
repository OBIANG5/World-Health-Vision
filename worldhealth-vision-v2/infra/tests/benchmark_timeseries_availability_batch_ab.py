#!/usr/bin/env python3
"""Full economic snapshot semantic A/B: availability SQL batch only.

CI-private DNS; same code/image/database and canonical 54 indicators.
Catalog and Timeseries latest batching remain enabled in BOTH arms to isolate
only the availability query change. No official data or public Gateway is touched.
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
    ("timeseries", "availability"): 54,
    ("timeseries", "series"): 54,
    ("catalog", "source"): 4,
    ("catalog", "dataset"): 4,
    ("timeseries", "source_runs"): 4,
}
BATCH = {
    **{key: count for key, count in BASE.items() if key != ("timeseries", "availability")},
    ("timeseries", "availability_batch"): 1,
}
COUNTER_KEYS = set(BASE) | set(BATCH)


def counters() -> dict[tuple[str, str], float]:
    return {
        key: REGISTRY.get_sample_value(
            "whv_analytics_upstream_http_requests_total",
            {"dependency": key[0], "operation": key[1], "outcome": "success"}
        ) or 0.0
        for key in COUNTER_KEYS
    }


async def snapshot(country: str, batch_enabled: bool) -> dict:
    settings = Settings(
        catalog_indicator_batch_enabled=True,
        timeseries_latest_batch_enabled=True,
        timeseries_availability_batch_enabled=batch_enabled,
    )
    catalog = CatalogClient(settings.catalog_base_url, settings.request_timeout_seconds)
    timeseries = TimeseriesClient(settings.timeseries_base_url, settings.request_timeout_seconds)
    service = AnalyticsService(settings, catalog, timeseries)
    try:
        before = counters()
        start = perf_counter()
        model = await service.get_country_economic_snapshot(
            country_iso3=country,
            source_code=None,
            dataset_code=None,
            period_granularity=None,
            include_missing=False,
            series_limit=12,
        )
        elapsed_ms = round((perf_counter() - start) * 1000, 3)
        after = counters()
        delta = {key: int(after[key] - before[key]) for key in COUNTER_KEYS}
        expected = BATCH if batch_enabled else BASE
        actual = {key: count for key, count in delta.items() if count}
        if actual != expected:
            raise AssertionError(
                "Incorrect internal HTTP count: "
                + json.dumps({f"{dep}.{operation}": count for (dep, operation), count in actual.items()})
            )
        data = model.model_dump(mode="json", exclude={"generatedAtUtc"})
        if data["lensCount"] != 54 or len(data["lenses"]) != 54:
            raise AssertionError("Timeseries latest batch changed the 54 economic lenses")
        comparable = sum(lens["sourceAudit"]["comparableSourceCount"]
                         for lens in data["lenses"])
        evidence = sum(len(lens["sourceAudit"]["evidence"])
                       for lens in data["lenses"])
        if (comparable, evidence) != (200, 270):
            raise AssertionError("Latest batch changed provenance, comparisons or source evidence")

        digest = hashlib.sha256(json.dumps(
            data, sort_keys=True, ensure_ascii=False, separators=(",", ":")
        ).encode("utf-8")).hexdigest()
        result = {
            "country": country,
            "mode": "timeseries_availability_batch" if batch_enabled else "baseline_54_availability_get",
            "elapsed_ms": elapsed_ms,
            "calls": sum(delta.values()),
            "availability_individual_calls": delta[("timeseries", "availability")],
            "availability_batch_calls": delta[("timeseries", "availability_batch")],
            "latest_batch_calls": delta[("timeseries", "latest_batch")],
            "series_calls": delta[("timeseries", "series")],
            "comparable_source_count": comparable,
            "evidence_count": evidence,
            "semantic_sha256_excluding_generatedAtUtc": digest,
        }
        print(
            f"OBSERVED Timeseries availability A/B: {country} {result['mode']}, "
            f"{result['calls']} HTTP calls, elapsed={elapsed_ms}ms, "
            f"200 comparisons, 270 evidence items",
            file=sys.stderr,
        )
        return result
    finally:
        await service.aclose()


async def main() -> int:
    trials = []
    # Mixed order within the same disposable data fixture; six descriptive
    # samples cannot be extrapolated as a worldwide SLO or causal p99.
    for country, batch in [
        ("FRA", False), ("FRA", True), ("FRA", True), ("FRA", False),
        ("GAB", True), ("GAB", False),
    ]:
        trials.append(await snapshot(country, batch))
    for country in ("FRA", "GAB"):
        fingerprints = {
            trial["semantic_sha256_excluding_generatedAtUtc"]
            for trial in trials if trial["country"] == country
        }
        if len(fingerprints) != 1:
            raise AssertionError("Availability SQL batch changed the full economic response: " + country)

    print(json.dumps({
        "source": "ci-disposable-only; 124416 synthetic observations; 54 real economic indicator codes",
        "no_production_data": True,
        "catalog_batch_enabled_in_both_arms": True,
        "timeseries_latest_batch_enabled_in_both_arms": True,
        "availability_batch_disabled_by_default": True,
        "complete_semantic_json_equivalence": True,
        "baseline_http_per_snapshot": 123,
        "candidate_http_per_snapshot": 70,
        "samples": trials,
        "caveat": "Small same-fixture A/B, not a global throughput or p99 promise",
    }, indent=2, ensure_ascii=False))
    print(
        "PASS: Timeseries availability batch 123 to 70 calls without changing "
        "54 lenses, 200 comparisons, 270 evidence elements or JSON hash",
        file=sys.stderr,
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(asyncio.run(main()))
