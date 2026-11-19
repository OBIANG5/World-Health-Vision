#!/usr/bin/env python3
"""Bounded, internal-only HTTP concurrency experiment on synthetic Timeseries DB.

Executed FROM disposable analytics-service in isolated Compose. Host and endpoints
are hard-coded private Docker DNS: never run against a public site or user host.
Preserves all 54 canonical economic codes and three original query paths.
"""
from __future__ import annotations

import asyncio
from collections import Counter
import json
from math import ceil
from statistics import mean
from time import perf_counter
import sys

import httpx
from analytics_service.product_profiles import ECONOMIC_LENS_PROFILES

INTERNAL_ORIGIN = "http://timeseries-service:8080"
CONCURRENCY_LEVELS = (1, 4, 16, 54)
OPERATIONS = ("latest_by_source", "availability", "series")
EXPECTED_INDICATORS = 54


def percentile(data: list[float], percentage: int) -> float:
    ordered = sorted(data)
    return round(ordered[max(0, ceil(len(ordered) * percentage / 100) - 1)], 3)


async def one(client: httpx.AsyncClient, sem: asyncio.Semaphore, code: str, operation: str):
    urls = {
        "latest_by_source": "/api/timeseries/series/latest",
        "availability": "/api/timeseries/series/availability",
        "series": "/api/timeseries/series",
    }
    params = {"countryIso3": "FRA", "indicatorCode": code}
    if operation == "series":
        params.update({"includeMissing": "false", "sortDirection": "DESC", "limit": "100"})
    elif operation == "availability":
        params["limit"] = "100"
    async with sem:
        start = perf_counter()
        try:
            response = await client.get(urls[operation], params=params)
            # Consume actual JSON payload, as production client does. Payload is synthetic.
            if response.status_code == 200:
                payload = response.json()
                if not isinstance(payload.get("items"), list):
                    raise ValueError("Malformed timeseries response")
                # Each canonical profile is populated in this fixture.
                if len(payload["items"]) == 0:
                    raise ValueError("No synthetic observations for economic profile")
            return (operation, response.status_code,
                    (perf_counter() - start) * 1000.0, None)
        except (httpx.HTTPError, ValueError) as exc:
            return (operation, None, (perf_counter() - start) * 1000.0, type(exc).__name__)


async def run_level(client: httpx.AsyncClient, codes: tuple[str, ...], workers: int) -> dict:
    sem = asyncio.Semaphore(workers)
    start = perf_counter()
    responses = await asyncio.gather(*(
        one(client, sem, code, op)
        for code in codes
        for op in OPERATIONS
    ))
    wall_ms = (perf_counter() - start) * 1000.0
    by_operation = []
    for op in OPERATIONS:
        subset = [row for row in responses if row[0] == op]
        durations = [row[2] for row in subset]
        errors = Counter(
            str(status) if status is not None else error for _, status, _, error in subset
            if status != 200
        )
        by_operation.append({
            "operation": op,
            "requests": len(subset),
            "successes": sum(status == 200 for _, status, _, _ in subset),
            "status_errors": dict(errors),
            "mean_ms": round(mean(durations), 3),
            "p50_ms": percentile(durations, 50),
            "p95_ms": percentile(durations, 95),
            "p99_ms": percentile(durations, 99),
        })
    return {
        "concurrency": workers,
        "requests": len(responses),
        "successful_requests": sum(status == 200 for _, status, _, _ in responses),
        "wall_time_ms": round(wall_ms, 3),
        "by_operation": by_operation,
    }


async def main() -> int:
    codes = tuple(profile.indicator_code for profile in ECONOMIC_LENS_PROFILES)
    if len(codes) != EXPECTED_INDICATORS or len(set(codes)) != EXPECTED_INDICATORS:
        raise RuntimeError("Economic profiles changed: need 54 unique codes")
    async with httpx.AsyncClient(
        base_url=INTERNAL_ORIGIN, timeout=25,
        limits=httpx.Limits(max_connections=64, max_keepalive_connections=64),
    ) as client:
        # Warm a real populated read before comparison; no user-controlled URLs.
        for op in OPERATIONS:
            warm = await one(client, asyncio.Semaphore(1), codes[0], op)
            if warm[1] != 200:
                raise RuntimeError(f"Internal synthetic warmup failed for {op}: {warm[1]}, {warm[3]}")
        cases = []
        for limit in CONCURRENCY_LEVELS:
            result = await run_level(client, codes, limit)
            cases.append(result)
            print(f"OBSERVED synthetic internal HTTP: concurrency={limit} "
                  f"{result['successful_requests']}/{result['requests']} success "
                  f"wall={result['wall_time_ms']}ms", file=sys.stderr)

    report = {
        "mode": "private-docker-network-disposable-ci",
        "data_kind": "SYNTHETIC 124416 observations, 54 canonical economic codes",
        "url_is_never_public": True,
        "indicators": EXPECTED_INDICATORS,
        "requests_per_level": EXPECTED_INDICATORS * len(OPERATIONS),
        "comparison": cases,
        "limitations": [
            "No user traffic, geographic network latency or international production load",
            "Different concurrency levels run sequentially; caches may warm further",
            "HTTP includes JSON parsing, pool waits and server processing, not SQL alone",
            "p95/p99 here are descriptive for 54 samples per operation, not an SLO",
        ],
    }
    print(json.dumps(report, indent=2, ensure_ascii=False))
    if any(case["successful_requests"] != case["requests"] for case in cases):
        print("FAIL: synthetic profile returned unavailable HTTP or empty data", file=sys.stderr)
        return 1
    return 0


if __name__ == "__main__":
    raise SystemExit(asyncio.run(main()))
