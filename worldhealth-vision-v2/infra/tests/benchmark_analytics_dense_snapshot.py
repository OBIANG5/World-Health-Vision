#!/usr/bin/env python3
"""Observe ONE complete 54-indicator Analytics snapshot on synthetic data.

Measures outbound Catalog/Timeseries operation deltas, notably duplicate
source/dataset/run metadata calls, without printing any statistical value.
Runs only inside disposable analytics-service and accesses loopback.
"""
from __future__ import annotations

import asyncio
import hashlib
import json
from collections import defaultdict
from time import perf_counter
import re
import sys

import httpx

BASE_URL = "http://127.0.0.1:8000"
METRIC_PREFIX = "whv_analytics_upstream_http_requests_total{"
LABEL_RE = re.compile(r'([a-z_][a-z0-9_]*)="([^"]+)"')
OPERATIONS = {
    "catalog": {"country", "indicator", "source", "dataset"},
    "timeseries": {"series", "latest_by_source", "availability", "source_runs"},
}


def parse_metrics(text: str) -> dict[tuple[str, str], int]:
    result: dict[tuple[str, str], int] = defaultdict(int)
    for row in text.splitlines():
        if not row.startswith(METRIC_PREFIX):
            continue
        labels_text = row.split("{", 1)[1].split("}", 1)[0]
        labels = dict(LABEL_RE.findall(labels_text))
        dependency = labels.get("dependency")
        operation = labels.get("operation")
        if operation not in OPERATIONS.get(dependency, set()):
            continue
        result[(dependency, operation)] += int(float(row.split("}", 1)[1].strip().split()[0]))
    return dict(result)


async def main() -> int:
    async with httpx.AsyncClient(base_url=BASE_URL, timeout=90) as client:
        async def metrics():
            response = await client.get("/metrics")
            response.raise_for_status()
            return parse_metrics(response.text)

        before = await metrics()
        snapshots = []
        for iteration in ("first", "second"):
            t0 = perf_counter()
            response = await client.get(
                "/api/analytics/countries/FRA/economic-snapshot",
                params={"seriesLimit": "12"},
            )
            elapsed = round((perf_counter() - t0) * 1000, 3)
            if response.status_code != 200:
                print(f"FAILED synthetic full snapshot: HTTP {response.status_code}", file=sys.stderr)
                return 1
            payload = response.json()
            if payload.get("lensCount") != 54 or len(payload.get("lenses", [])) != 54:
                raise ValueError("Canonical 54-indicator response changed")
            # CountryEconomicLens exposes sourceAudit, not an overview object.
            source_comparison_count = sum(
                lens.get("sourceAudit", {}).get("comparableSourceCount", 0)
                for lens in payload["lenses"]
            )
            evidence_item_count = sum(
                len(lens.get("sourceAudit", {}).get("evidence", []))
                for lens in payload["lenses"]
            )
            # Covers every lens, value, period, source audit, confidence and
            # narrative; only the intentionally time-varying top timestamp
            # is omitted. We archive the digest, never synthetic values.
            semantic_payload = {key: value for key, value in payload.items()
                                if key != "generatedAtUtc"}
            semantic_sha256 = hashlib.sha256(
                json.dumps(semantic_payload, sort_keys=True, ensure_ascii=False,
                           separators=(",", ":")).encode("utf-8")
            ).hexdigest()
            after = await metrics()
            keys = set(before) | set(after)
            delta = {
                f"{dependency}.{operation}": after.get((dependency, operation), 0) -
                before.get((dependency, operation), 0)
                for dependency, operation in sorted(keys)
            }
            snapshots.append({
                "iteration": iteration,
                "elapsed_ms": elapsed,
                "lens_count": payload["lensCount"],
                "comparable_source_count_sum": source_comparison_count,
                "source_audit_evidence_item_count": evidence_item_count,
                "complete_snapshot_semantic_sha256": semantic_sha256,
                "http_dependency_calls": delta,
                "total_reviewed_http_calls": sum(delta.values()),
            })
            before = after
            print(f"OBSERVED dense Analytics: {iteration}={elapsed}ms, "
                  f"HTTP calls={sum(delta.values())}, "
                  f"metadata source={delta.get('catalog.source',0)}, "
                  f"dataset={delta.get('catalog.dataset',0)}, "
                  f"runs={delta.get('timeseries.source_runs',0)}", file=sys.stderr)

    if snapshots[0]["complete_snapshot_semantic_sha256"] != snapshots[1]["complete_snapshot_semantic_sha256"]:
        raise ValueError("Two consecutive unmodified snapshots changed their values or evidence")

    report = {
        "mode": "CI-only, private analytics loopback",
        "data_kind": "SYNTHETIC revised 12-country/54-indicator/4-source fixture",
        "purpose": "measure repeated metadata discovery and 54x3 internal fan-out",
        "not_a_production_benchmark": True,
        "snapshots": snapshots,
    }
    print(json.dumps(report, indent=2, ensure_ascii=False))
    if any(s["http_dependency_calls"].get("timeseries.series", 0) != 54
           for s in snapshots):
        print("FAIL: snapshot no longer reads all 54 series", file=sys.stderr)
        return 1
    return 0


if __name__ == "__main__":
    raise SystemExit(asyncio.run(main()))
