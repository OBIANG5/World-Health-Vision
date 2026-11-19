#!/usr/bin/env python3
"""Parse JSON EXPLAIN from a disposable synthetic DB; never interpret as official data."""
from __future__ import annotations

import argparse
import json
from pathlib import Path
from statistics import mean, median

OPERATIONS = ("series", "latest_by_source", "availability")
REPETITIONS = ("cold", "warm1", "warm2", "warm3", "warm4", "warm5")


def _read_one(log: str, marker: str) -> dict:
    before = f"WHV_PLAN_BEGIN_{marker}"
    after = f"WHV_PLAN_END_{marker}"
    if log.count(before) != 1 or log.count(after) != 1:
        raise ValueError(f"Missing or duplicate EXPLAIN markers for {marker}")
    raw = log.split(before, 1)[1].split(after, 1)[0].strip()
    try:
        payload = json.loads(raw)
    except json.JSONDecodeError as exc:
        raise ValueError(f"Non-JSON SQL plan for {marker}") from exc
    if not isinstance(payload, list) or len(payload) != 1:
        raise ValueError(f"Unexpected plan list for {marker}")
    result = payload[0]
    if not isinstance(result.get("Plan"), dict):
        raise ValueError(f"Missing root node for {marker}")
    ms = result.get("Execution Time")
    if not isinstance(ms, (int, float)) or ms < 0:
        raise ValueError(f"Missing positive-duration SQL EXPLAIN for {marker}")
    return result


def _nodes(root: dict) -> list[dict]:
    nodes = []
    def visit(node: dict, depth: int) -> None:
        nodes.append({
            "depth": depth,
            "type": node.get("Node Type"),
            "relation": node.get("Relation Name"),
            "actual_rows": node.get("Actual Rows"),
            "loops": node.get("Actual Loops"),
            "total_time_ms": node.get("Actual Total Time"),
            "shared_hits": node.get("Shared Hit Blocks", 0),
            "shared_reads": node.get("Shared Read Blocks", 0),
            "sort_method": node.get("Sort Method"),
            "sort_space_type": node.get("Sort Space Type"),
        })
        for child in node.get("Plans", []):
            visit(child, depth + 1)
    visit(root, 0)
    return nodes


def parse_plan_log(log: str) -> dict:
    operations = []
    for operation in OPERATIONS:
        samples = {rep: _read_one(log, operation + "__" + rep) for rep in REPETITIONS}
        cold = samples["cold"]
        warm_values = [float(samples[rep]["Execution Time"]) for rep in REPETITIONS[1:]]
        representative_nodes = _nodes(samples["warm3"]["Plan"])
        root = samples["warm3"]["Plan"]
        operations.append({
            "operation": operation,
            "cold_execution_ms": cold["Execution Time"],
            "warm_execution_ms": warm_values,
            "warm_median_ms": round(median(warm_values), 3),
            "warm_mean_ms": round(mean(warm_values), 3),
            "warm_min_ms": min(warm_values),
            "warm_max_ms": max(warm_values),
            "warm_samples": len(warm_values),
            "no_p95_p99_claim_for_5_samples": True,
            "planning_ms_representative": samples["warm3"].get("Planning Time"),
            "plan_node_types": sorted({node["type"] for node in representative_nodes if node["type"]}),
            "shared_hit_blocks_representative": root.get("Shared Hit Blocks", 0),
            "shared_read_blocks_representative": root.get("Shared Read Blocks", 0),
            "sorts_spilled_representative": sum(
                node["sort_space_type"] == "Disk" for node in representative_nodes
            ),
            "representative_plan_nodes": representative_nodes,
        })
    return {
        "environment": "disposable-timescaledb",
        "source": "canonical JDBC SQL extracted without manual query changes",
        "data_kind": "SYNTHETIC ONLY — 12 countries, 54 indicators, 4 sources, 24 years, 2 revisions",
        "raw_observations": 124416,
        "latest_observations": 62208,
        "not_production_slo_or_official_data": True,
        "operations": operations,
    }


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--input", type=Path, required=True)
    parser.add_argument("--output", type=Path, required=True)
    args = parser.parse_args()
    result = parse_plan_log(args.input.read_text(encoding="utf-8"))
    args.output.parent.mkdir(parents=True, exist_ok=True)
    args.output.write_text(json.dumps(result, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    for p in result["operations"]:
        print(f"OBSERVED synthetic SQL {p['operation']}: cold={p['cold_execution_ms']}ms; "
              f"warm median (n=5)={p['warm_median_ms']}ms; "
              f"reads={p['shared_read_blocks_representative']}; "
              f"disk sorts={p['sorts_spilled_representative']}")
    print("PASS: three canonical SQL statements, each first-touch + five repeat EXPLAIN plans")


if __name__ == "__main__":
    main()
