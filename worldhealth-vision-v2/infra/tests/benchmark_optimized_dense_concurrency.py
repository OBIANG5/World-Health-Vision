#!/usr/bin/env python3
"""Bounded simultaneous full economic snapshots, only inside CI Analytics container.

Four optimized batch flags MUST be active in the real FastAPI process. No
outside host, no fabricated official data and no publication of numeric test
observations. Report timing, response sizes and full semantic fingerprints.
"""
from __future__ import annotations

import asyncio
import hashlib
import json
import re
from math import ceil
from statistics import mean
import sys
from time import perf_counter

import httpx

from analytics_service.config import Settings

COUNTRIES = (
    "FRA", "GAB", "CIV", "DEU", "USA", "BRA",
    "IND", "CHN", "JPN", "ZAF", "AUS", "CAN",
)
CONCURRENCY = (1, 2, 4, 8, 12)
ORIGIN = "http://127.0.0.1:8000"
EXPECTED_LENSES = 54
EXPECTED_COMPARISONS = 200
EXPECTED_EVIDENCE = 270


def percentile(numbers: list[float], p: int) -> float:
    sorted_values = sorted(numbers)
    return round(sorted_values[max(ceil(len(sorted_values) * p / 100) - 1, 0)], 3)


def sha256_semantic(model: dict) -> str:
    # Only intentionally variable wall-clock timestamp is omitted.
    without_timestamp = {key: value for key, value in model.items()
                         if key != "generatedAtUtc"}
    return hashlib.sha256(json.dumps(
        without_timestamp, sort_keys=True, ensure_ascii=False,
        separators=(",", ":"),
    ).encode("utf-8")).hexdigest()


async def load_one(client: httpx.AsyncClient, semaphore: asyncio.Semaphore, country: str):
    async with semaphore:
        started = perf_counter()
        try:
            response = await client.get(
                f"/api/analytics/countries/{country}/economic-snapshot",
                params={"seriesLimit": "12", "includeMissing": "false"},
            )
            elapsed = (perf_counter() - started) * 1000
            if response.status_code != 200:
                return {"country": country, "status": response.status_code,
                        "elapsed_ms": elapsed, "error": "HTTP_FAILURE"}
            content_bytes = len(response.content)
            value = response.json()
            if value.get("lensCount") != EXPECTED_LENSES or len(value.get("lenses", [])) != EXPECTED_LENSES:
                raise ValueError("Economic lens count differs from canonical 54")
            comparisons = sum(lens["sourceAudit"]["comparableSourceCount"]
                              for lens in value["lenses"])
            evidence = sum(len(lens["sourceAudit"]["evidence"])
                           for lens in value["lenses"])
            if (comparisons, evidence) != (EXPECTED_COMPARISONS, EXPECTED_EVIDENCE):
                raise ValueError("Source provenance/evidence changed under simultaneous workload")
            return {
                "country": country,
                "status": 200,
                "elapsed_ms": round(elapsed, 3),
                "response_json_bytes": content_bytes,
                "sha256": sha256_semantic(value),
                "source_comparisons": comparisons,
                "evidence_items": evidence,
            }
        except (httpx.HTTPError, ValueError, KeyError, TypeError) as exc:
            return {
                "country": country,
                "status": None,
                "elapsed_ms": round((perf_counter() - started) * 1000, 3),
                "error": type(exc).__name__,
            }


async def one_level(client: httpx.AsyncClient, workers: int):
    start = perf_counter()
    semaphore = asyncio.Semaphore(workers)
    rows = await asyncio.gather(*(
        load_one(client, semaphore, iso3) for iso3 in COUNTRIES
    ))
    wall_ms = round((perf_counter() - start) * 1000, 3)
    successful = [v for v in rows if v["status"] == 200]
    errors = [
        {"country": v["country"], "status": v["status"], "error": v.get("error")}
        for v in rows if v["status"] != 200
    ]
    if len(successful) != len(COUNTRIES):
        raise RuntimeError(f"Optimized concurrent snapshot failures: {errors}")
    elapsed = [v["elapsed_ms"] for v in successful]
    bytes_per_country = [v["response_json_bytes"] for v in successful]
    return {
        "concurrency": workers,
        "country_count": len(COUNTRIES),
        "successful_snapshots": len(successful),
        "errors": errors,
        "wall_time_ms": wall_ms,
        "request_latency_ms": {
            "mean": round(mean(elapsed), 3),
            "p50": percentile(elapsed, 50),
            "p95": percentile(elapsed, 95),
            "p99": percentile(elapsed, 99),
            "max": round(max(elapsed), 3),
        },
        "response_json_bytes": {
            "mean": round(mean(bytes_per_country), 2),
            "p95": percentile(bytes_per_country, 95),
            "max": max(bytes_per_country),
        },
        "per_country_fingerprints": {
            v["country"]: v["sha256"] for v in successful
        },
    }


# INTERNAL-ONLY metrics endpoint enabled by a disposable CI Compose overlay.
# Fixed HTTP target; no country, URL/query, source or user included as labels.
TIMESERIES_METRICS = "http://timeseries-service:8080/actuator/prometheus"
POOL_REQUIRED = (
    "hikaricp_connections_active",
    "hikaricp_connections_idle",
    "hikaricp_connections_pending",
    "hikaricp_connections_max",
    "hikaricp_connections_acquire_seconds_sum",
    "hikaricp_connections_acquire_seconds_count",
)
BATCH_OPERATIONS = ("history", "availability", "latest")
METRIC_LINE = re.compile(
    r'^([a-z][a-z0-9_]*)(?:\{([^}]*)\})?\s+([-+0-9.eE]+)(?:\s|$)'
)


def parse_private_pool_snapshot(prometheus_text: str) -> dict[str, float]:
    pool: dict[str, float] = {}
    timers: dict[str, float] = {}
    for line in prometheus_text.splitlines():
        if not line.startswith(("hikaricp_connections_", "whv_timeseries_batch_jdbc_seconds_")):
            continue
        match = METRIC_LINE.match(line)
        if match is None:
            continue
        metric, labels, number = match.groups()
        if metric in POOL_REQUIRED:
            if metric in pool:
                raise ValueError("Multiple unnamed Hikari metrics: inspect pools before profiling")
            pool[metric] = float(number)
        elif metric in {"whv_timeseries_batch_jdbc_seconds_count",
                        "whv_timeseries_batch_jdbc_seconds_sum"}:
            op_match = re.search(r'(?:^|,)operation="(history|availability|latest)"(?:,|$)',
                                 labels or "")
            if op_match:
                key = f"{metric}:{op_match.group(1)}"
                if key in timers:
                    raise ValueError("Duplicate fixed-cardinality JDBC timer")
                timers[key] = float(number)
    missing = [key for key in POOL_REQUIRED if key not in pool]
    missing += [
        f"{kind}:{operation}"
        for kind in ("whv_timeseries_batch_jdbc_seconds_count",
                     "whv_timeseries_batch_jdbc_seconds_sum")
        for operation in BATCH_OPERATIONS
        if f"{kind}:{operation}" not in timers
    ]
    if missing:
        raise ValueError(f"Missing expected PRIVATE Hikari/JDBC metrics: {missing}")
    return pool | timers


async def private_metrics(client: httpx.AsyncClient) -> dict[str, float]:
    response = await client.get(TIMESERIES_METRICS, timeout=5.0)
    response.raise_for_status()
    return parse_private_pool_snapshot(response.text)


async def monitor_pool(client: httpx.AsyncClient, stop: asyncio.Event,
                       samples: list[dict[str, float]]) -> None:
    while not stop.is_set():
        samples.append(await private_metrics(client))
        try:
            await asyncio.wait_for(stop.wait(), timeout=0.25)
        except asyncio.TimeoutError:
            pass


async def timed_level_with_pool(client: httpx.AsyncClient,
                                diagnostic_client: httpx.AsyncClient,
                                workers: int) -> dict:
    before = await private_metrics(diagnostic_client)
    stop = asyncio.Event()
    samples: list[dict[str, float]] = []
    monitor = asyncio.create_task(monitor_pool(diagnostic_client, stop, samples))
    try:
        result = await one_level(client, workers)
    finally:
        stop.set()
        await monitor
    after = await private_metrics(diagnostic_client)
    samples.append(after)
    if not samples:
        raise RuntimeError("No private Hikari pool samples captured")
    result["pool_hikari"] = {
        "samples": len(samples),
        "active_max_observed": max(s["hikaricp_connections_active"] for s in samples),
        "pending_max_observed": max(s["hikaricp_connections_pending"] for s in samples),
        "idle_min_observed": min(s["hikaricp_connections_idle"] for s in samples),
        "configured_max": after["hikaricp_connections_max"],
        "checkout_count_delta": int(
            after["hikaricp_connections_acquire_seconds_count"]
            - before["hikaricp_connections_acquire_seconds_count"]
        ),
        "checkout_mean_ms": None,
    }
    checkout_n = result["pool_hikari"]["checkout_count_delta"]
    if checkout_n > 0:
        delta = (after["hikaricp_connections_acquire_seconds_sum"]
                 - before["hikaricp_connections_acquire_seconds_sum"])
        result["pool_hikari"]["checkout_mean_ms"] = round(1000 * delta / checkout_n, 3)
    result["jdbc_batch_wall"] = {}
    for operation in BATCH_OPERATIONS:
        count_key = f"whv_timeseries_batch_jdbc_seconds_count:{operation}"
        sum_key = f"whv_timeseries_batch_jdbc_seconds_sum:{operation}"
        calls = int(after[count_key] - before[count_key])
        duration = 1000 * (after[sum_key] - before[sum_key])
        if calls != len(COUNTRIES):
            raise AssertionError(
                f"Real JDBC batch timer count must equal 12 per tier for {operation}, saw {calls}"
            )
        result["jdbc_batch_wall"][operation] = {
            "calls": calls,
            "mean_ms": round(duration / calls, 3),
            "total_ms_across_calls": round(duration, 3),
        }
    return result


async def main():
    settings = Settings()
    if not all((
        settings.catalog_indicator_batch_enabled,
        settings.timeseries_latest_batch_enabled,
        settings.timeseries_availability_batch_enabled,
        settings.timeseries_history_batch_enabled,
    )):
        raise RuntimeError("Refusing to test concurrency without four optimized runtime flags ON")
    profile_private_pool = "--profile-timeseries-jdbc" in sys.argv[1:]
    if len(sys.argv) > 2 or (len(sys.argv) == 2 and not profile_private_pool):
        raise ValueError("Only explicit --profile-timeseries-jdbc is accepted")
    results = []
    fingerprints: dict[str, str] = {}
    async with httpx.AsyncClient(
        base_url=ORIGIN,
        timeout=httpx.Timeout(90.0),
        limits=httpx.Limits(max_connections=24, max_keepalive_connections=24),
    ) as client:
        # One warmup, excluded from reported level statistics.
        warm = await load_one(client, asyncio.Semaphore(1), COUNTRIES[0])
        if warm["status"] != 200:
            raise RuntimeError(f"Synthetic optimized warmup failed: {warm.get('error')}")
        # The side channel is always inside core_private and never published.
        async with httpx.AsyncClient(timeout=5.0) as diagnostics:
            for level in CONCURRENCY:
                result = (
                    await timed_level_with_pool(client, diagnostics, level)
                    if profile_private_pool else await one_level(client, level)
                )
                for country, digest in result["per_country_fingerprints"].items():
                    if country in fingerprints and fingerprints[country] != digest:
                        raise AssertionError(
                            f"Concurrent snapshot semantic data/evidence changed: {country}"
                        )
                    fingerprints[country] = digest
                # Keep digests, not synthetic values, in private CI reports.
                results.append(result)
                print(
                    f"OBSERVED 12-country synthetic optimized concurrency={level}: "
                    f"12/12 HTTP 200; wall={result['wall_time_ms']}ms; "
                    f"p50={result['request_latency_ms']['p50']}ms; "
                    f"p95={result['request_latency_ms']['p95']}ms; "
                    f"response_max={result['response_json_bytes']['max']} bytes",
                    file=sys.stderr,
                )

    report = {
        "environment": "disposable internal Analytics FastAPI CI, NO internet target",
        "dataset": "124416 synthetic observations; 12 countries; 54 indicators; 4 sources; 24 years; 2 revisions",
        "not_real_country_economic_data": True,
        "not_a_production_slo": True,
        "private_hikari_jdbc_sampling": profile_private_pool,
        "batch_cap_configured_in_process": settings.economic_timeseries_batch_max_inflight,
        "jdbc_timer_scope": "Connection checkout + SQL execution + ResultSet mapping; excludes HTTP/JSON and Python",
        "snapshots": len(COUNTRIES) * len(CONCURRENCY),
        "concurrency_levels": list(CONCURRENCY),
        "fingerprint_semantics": "Entire JSON except generatedAtUtc; stable under concurrency",
        "caveat": "p95/p99 describe only 12 samples per tier; cold/warm effects not controlled",
        "results": results,
    }
    print(json.dumps(report, indent=2, ensure_ascii=False))
    print("PASS: 60 simultaneous-mode economic snapshots on one dense synthetic DB; "
          "12 country hashes unchanged, all source evidence retained", file=sys.stderr)


if __name__ == "__main__":
    asyncio.run(main())
