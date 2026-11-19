#!/usr/bin/env python3
"""Report bounded observed pool/JDBC timings from CI-only metrics samples.

No country, source, SQL statement, connection string or user identifiers.
JDBC duration includes pool wait + row mapping; NOT PostgreSQL-only duration.
"""
from __future__ import annotations

import argparse
import json
from pathlib import Path
from statistics import median

OPERATIONS = ("history", "latest", "availability")
METRICS = ("hikaricp_connections_active", "hikaricp_connections_idle",
           "hikaricp_connections_pending", "hikaricp_connections_max")


def summarize(records: list[dict], minimum_count: int = 60) -> dict:
    meaningful = [x for x in records if isinstance(x.get("hikari"), dict)
                  and isinstance(x.get("jdbc"), dict)]
    if len(meaningful) < 2:
        raise ValueError("Not enough private Hikari/JDBC metric samples to profile load")
    with_hikari = [x for x in meaningful if x["hikari"].get("hikaricp_connections_max", 0) >= 1]
    if not with_hikari:
        raise ValueError("Missing actual Hikari pool metrics")
    gauge_summary = {}
    for metric in METRICS:
        values = [s["hikari"][metric] for s in with_hikari if metric in s["hikari"]]
        if not values:
            raise ValueError(f"Missing expected Hikari metric {metric}")
        gauge_summary[metric.removeprefix("hikaricp_connections_")] = {
            "minimum_sample": min(values),
            "median_sample": median(values),
            "maximum_sample": max(values),
        }

    final = meaningful[-1]
    # Hikari pool-acquire and connection-usage metrics separate wait from
    # holding a connection. They include ALL pool activity, not only batches.
    pool_timers = []
    for name in ("acquire", "usage"):
        values = final.get("hikari_pool_timers", {}).get(name)
        if not isinstance(values, dict):
            raise ValueError(f"Missing Hikari {name} timing")
        count, total = values.get("count"), values.get("sum")
        if not isinstance(count, (float, int)) or count < minimum_count:
            raise ValueError(f"Insufficient Hikari {name} observations")
        if not isinstance(total, (float, int)) or total < 0:
            raise ValueError(f"Invalid Hikari {name} total duration")
        sampled_max = max(
            item.get("hikari_pool_timers", {}).get(name, {}).get("max", 0.0)
            for item in meaningful
        )
        pool_timers.append({
            "metric": name,
            "calls_all_pool_users": int(count),
            "mean_duration_ms": round(total * 1000 / count, 3),
            "sampled_max_ms": round(sampled_max * 1000, 3),
        })
    jdbc_summary = []
    for operation in OPERATIONS:
        metric = final["jdbc"].get(operation)
        if not isinstance(metric, dict):
            raise ValueError(f"Missing approved JDBC timer for {operation}")
        count, total_seconds = metric.get("count"), metric.get("sum")
        if not isinstance(count, (int, float)) or count < minimum_count:
            raise ValueError(f"Insufficient {operation} batch JDBC calls")
        if not isinstance(total_seconds, (int, float)) or total_seconds <= 0:
            raise ValueError(f"No JDBC duration sum observed for {operation}")
        jdbc_summary.append({
            "operation": operation,
            "calls": int(count),
            "total_jdbc_and_mapping_ms": round(total_seconds * 1000, 3),
            "mean_jdbc_and_mapping_ms": round(total_seconds * 1000 / count, 3),
            "sampled_timer_max_ms": round(metric.get("max", 0.0) * 1000, 3),
        })
    return {
        "environment": "disposable ci, private Timeseries Actuator, synthetic data",
        "not_production": True,
        "no_official_values": True,
        "samples": len(meaningful),
        "method": "Micrometer JDBC timers include Hikari waiting + query + Java result mapping; excludes HTTP serialization. Hikari gauges are sampled, not guaranteed peaks.",
        "hikari": gauge_summary,
        "hikari_pool_timers": pool_timers,
        "hikari_timeouts_reported": final.get("hikari_timeouts"),
        "batch_jdbc_timers": jdbc_summary,
    }


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--input", type=Path, required=True)
    parser.add_argument("--output", type=Path, required=True)
    args = parser.parse_args()
    records = [json.loads(line) for line in args.input.read_text(encoding="utf-8").splitlines() if line.strip()]
    summary = summarize(records)
    args.output.parent.mkdir(parents=True, exist_ok=True)
    args.output.write_text(json.dumps(summary, indent=2) + "\n", encoding="utf-8")
    for item in summary["hikari_pool_timers"]:
        print(f"OBSERVED Hikari {item['metric']}: "
              f"{item['calls_all_pool_users']} acquisitions/uses, "
              f"mean={item['mean_duration_ms']}ms")
    for item in summary["batch_jdbc_timers"]:
        print(f"OBSERVED {item['operation']} JDBC+mapping: {item['calls']} calls, "
              f"mean={item['mean_jdbc_and_mapping_ms']}ms")
    print("PASS: bounded Hikari active/idle/pending/max samples and three batch JDBC timings")


if __name__ == "__main__":
    main()
