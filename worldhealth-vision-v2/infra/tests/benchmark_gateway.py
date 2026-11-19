#!/usr/bin/env python3
"""Bounded reproducible World-Vision Gateway CI benchmark (NOT an Internet stress tool).

All HTTP calls are forced to localhost:18080, never to a user-supplied host.
This runs against disposable service/DB containers, not the production API.
Reports p50/p95/p99 and errors per endpoint; no unsourced performance SLA.
"""
from __future__ import annotations

import argparse
from collections import Counter
from concurrent.futures import ThreadPoolExecutor, as_completed
from datetime import datetime, timezone
from math import ceil
import json
from pathlib import Path
from statistics import mean
from time import perf_counter
from urllib.error import HTTPError, URLError
from urllib.request import Request, urlopen

ORIGIN = "http://127.0.0.1:18080"
ALLOWED_PREFIXES = ("/api/catalog/", "/api/timeseries/", "/api/product/")


def query(path: str, timeout: float = 12.0) -> tuple[int | None, float, str | None]:
    start = perf_counter()
    try:
        req = Request(ORIGIN + path, headers={
            "Accept": "application/json",
            "User-Agent": "WorldVision-V2-Disposable-CI-Benchmark/1.0",
        }, method="GET")
        with urlopen(req, timeout=timeout) as response:
            response.read(65536)
            status = response.status
        return status, (perf_counter() - start) * 1000.0, None
    except HTTPError as exc:
        return exc.code, (perf_counter() - start) * 1000.0, str(exc.reason)[:100]
    except (URLError, TimeoutError, OSError) as exc:
        return None, (perf_counter() - start) * 1000.0, type(exc).__name__


def percentile(values: list[float], percent: int) -> float:
    if not values:
        return 0.0
    ordered = sorted(values)
    return round(ordered[max(0, ceil(len(ordered) * percent / 100) - 1)], 2)


def benchmark(path: str, count: int, workers: int) -> dict:
    # Warm the endpoint and data caches; do not mix cold start with steady state.
    warm = [query(path) for _ in range(3)]
    if any(status != 200 for status, _, _ in warm):
        raise RuntimeError(f"Warmup failed for {path}: {[x[0] for x in warm]}")

    observed = []
    with ThreadPoolExecutor(max_workers=workers) as executor:
        jobs = [executor.submit(query, path) for _ in range(count)]
        for future in as_completed(jobs):
            observed.append(future.result())

    durations = [duration for _, duration, _ in observed]
    statuses = Counter(str(code) for code, _, _ in observed)
    errors = [{"status": status, "error": error}
              for status, _, error in observed if status != 200]
    return {
        "path": path,
        "requests": count,
        "concurrency": workers,
        "status_codes": dict(statuses),
        "successes": sum(code == 200 for code, _, _ in observed),
        "errors": errors[:8],
        "latency_ms": {
            "min": round(min(durations), 2),
            "mean": round(mean(durations), 2),
            "p50": percentile(durations, 50),
            "p95": percentile(durations, 95),
            "p99": percentile(durations, 99),
            "max": round(max(durations), 2),
        },
    }


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--path", action="append", required=True)
    parser.add_argument("--requests-per-path", type=int, default=48)
    parser.add_argument("--workers", type=int, default=4)
    parser.add_argument("--output", type=Path, required=True)
    args = parser.parse_args()

    if not 1 <= args.requests_per_path <= 400 or not 1 <= args.workers <= 12:
        parser.error("benchmark is intentionally bounded to <=400 requests/path and <=12 workers")
    if len(args.path) > 6 or any(not p.startswith(ALLOWED_PREFIXES)
                                  or ".." in p or "://" in p for p in args.path):
        parser.error("only up to six reviewed public API paths are allowed")

    result = {
        "test_mode": "disposable-ci",
        "data_kind": "empty database and official catalogue fixture, NOT live economic data",
        "target": "127.0.0.1:18080 (loopback)",
        "timestamp_utc": datetime.now(timezone.utc).isoformat(),
        "results": [],
    }
    failed = False
    for path in args.path:
        sample = benchmark(path, args.requests_per_path, args.workers)
        result["results"].append(sample)
        print(f"{path}: {sample['successes']}/{sample['requests']} HTTP 200, "
              f"p50={sample['latency_ms']['p50']}ms "
              f"p95={sample['latency_ms']['p95']}ms "
              f"p99={sample['latency_ms']['p99']}ms")
        failed |= sample["successes"] != sample["requests"]

    args.output.parent.mkdir(parents=True, exist_ok=True)
    args.output.write_text(json.dumps(result, indent=2, ensure_ascii=False) + "\n",
                           encoding="utf-8")
    if failed:
        raise SystemExit("FAIL: at least one expected public GET returned non-200 or timed out")
    print("PASS: all bounded localhost benchmark probes succeeded (no latency SLA asserted)")


if __name__ == "__main__":
    main()
