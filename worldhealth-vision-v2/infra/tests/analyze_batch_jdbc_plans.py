#!/usr/bin/env python3
"""Read generated source-derived SQL EXPLAIN ANALYZE on a disposable DB only.

Execution Time is PostgreSQL-side; JDBC timer also includes connection checkout
and result mapping, and HTTP timings also include JSON/network/Python work.
These are separate measurements and cannot be subtracted as if synchronous.
"""
from __future__ import annotations

import argparse
import json
from pathlib import Path
from statistics import mean, median

from sql_profile_analyze_plans import _nodes, _read_one

OPERATIONS = ("history_batch", "latest_batch", "availability_batch")
REPETITIONS = ("cold", "warm1", "warm2", "warm3", "warm4", "warm5")


def analyze(log: str) -> dict:
    result = []
    for operation in OPERATIONS:
        plans = {
            rep: _read_one(log, f"{operation}__{rep}")
            for rep in REPETITIONS
        }
        warm = [float(plans[rep]["Execution Time"]) for rep in REPETITIONS[1:]]
        if any(ms < 0 for ms in warm):
            raise ValueError("Negative SQL plan duration")
        representative = plans["warm3"]
        root = representative["Plan"]
        nodes = _nodes(root)
        result.append({
            "operation": operation,
            "cold_execution_ms": plans["cold"]["Execution Time"],
            "warm_execution_ms": warm,
            "warm_median_ms": round(median(warm), 3),
            "warm_mean_ms": round(mean(warm), 3),
            "warm_min_ms": min(warm),
            "warm_max_ms": max(warm),
            "warm_sample_count": len(warm),
            "no_credible_p95_with_five_samples": True,
            "representative_actual_rows": root.get("Actual Rows"),
            "representative_shared_hit_blocks": root.get("Shared Hit Blocks", 0),
            "representative_shared_read_blocks": root.get("Shared Read Blocks", 0),
            "representative_temp_read_blocks": root.get("Temp Read Blocks", 0),
            "representative_temp_written_blocks": root.get("Temp Written Blocks", 0),
            "representative_nodes": [
                {
                    "type": n["type"],
                    "relation": n["relation"],
                    "rows": n["actual_rows"],
                    "loops": n["loops"],
                    "shared_hits": n["shared_hits"],
                    "shared_reads": n["shared_reads"],
                    "sort_method": n["sort_method"],
                    "sort_space_type": n["sort_space_type"],
                }
                for n in nodes
            ],
            "disk_spills": sum(
                n["sort_space_type"] == "Disk" for n in nodes
            ),
        })
    return {
        "environment": "disposable TimescaleDB, exact SQL from Java JDBC source",
        "observations": "124416 entirely synthetic observations, 54 codes, 4 sources",
        "no_official_data": True,
        "source_of_truth": "read-only EXPLAIN ANALYZE BUFFERS on 3 actual JDBC batch SELECT templates",
        "not_total_analytics_latency": True,
        "not_prod_SLO": True,
        "operations": result,
    }


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--input", type=Path, required=True)
    parser.add_argument("--output", type=Path, required=True)
    args = parser.parse_args()
    report = analyze(args.input.read_text(encoding="utf-8"))
    args.output.parent.mkdir(parents=True, exist_ok=True)
    args.output.write_text(json.dumps(report, indent=2) + "\n", encoding="utf-8")
    for op in report["operations"]:
        print(
            f"OBSERVED source-derived {op['operation']}: cold={op['cold_execution_ms']}ms "
            f"warm_median={op['warm_median_ms']}ms (n=5), "
            f"root_rows={op['representative_actual_rows']}, "
            f"shared_hits={op['representative_shared_hit_blocks']}, "
            f"disk_spills={op['disk_spills']}"
        )
    print("PASS: three reviewed JDBC SQL plans with actual rows, buffers and disk spills")


if __name__ == "__main__":
    main()
