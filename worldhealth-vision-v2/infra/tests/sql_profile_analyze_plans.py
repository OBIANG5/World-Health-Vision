#!/usr/bin/env python3
"""Parse PostgreSQL JSON EXPLAIN of a disposable synthetic DB into audit evidence.

No interpretation as real institutional statistics, no inferred performance gain.
"""
from __future__ import annotations

import argparse
import json
from pathlib import Path

OPERATIONS = ("series", "latest_by_source", "availability")


def parse_plan_log(log: str) -> dict:
    plans = []
    for operation in OPERATIONS:
        before = f"WHV_PLAN_BEGIN_{operation}"
        after = f"WHV_PLAN_END_{operation}"
        if log.count(before) != 1 or log.count(after) != 1:
            raise ValueError(f"Missing/duplicate EXPLAIN markers for {operation}")
        raw = log.split(before, 1)[1].split(after, 1)[0].strip()
        try:
            payload = json.loads(raw)
        except json.JSONDecodeError as exc:
            raise ValueError(f"Non-JSON SQL plan for {operation}") from exc
        if not isinstance(payload, list) or len(payload) != 1:
            raise ValueError(f"Unexpected plan shape for {operation}")
        plan_result = payload[0]
        root = plan_result.get("Plan")
        if not isinstance(root, dict):
            raise ValueError(f"Missing root node for {operation}")
        nodes = []
        def visit(node: dict, depth: int) -> None:
            nodes.append({
                "depth": depth,
                "node_type": node.get("Node Type"),
                "relation": node.get("Relation Name"),
                "actual_rows": node.get("Actual Rows"),
                "actual_loops": node.get("Actual Loops"),
                "actual_total_time_ms": node.get("Actual Total Time"),
                "shared_hit_blocks": node.get("Shared Hit Blocks", 0),
                "shared_read_blocks": node.get("Shared Read Blocks", 0),
                "sort_method": node.get("Sort Method"),
                "sort_space_used_kb": node.get("Sort Space Used"),
                "sort_space_type": node.get("Sort Space Type"),
            })
            for child in node.get("Plans", []):
                visit(child, depth + 1)
        visit(root, 0)
        execution_ms = plan_result.get("Execution Time")
        if not isinstance(execution_ms, (int, float)) or execution_ms < 0:
            raise ValueError(f"Missing execution duration for {operation}")
        plans.append({
            "operation": operation,
            "execution_time_ms": execution_ms,
            "planning_time_ms": plan_result.get("Planning Time"),
            "total_nodes": len(nodes),
            "node_types": sorted({item["node_type"] for item in nodes if item["node_type"]}),
            "top_level_shared_hit_blocks": root.get("Shared Hit Blocks", 0),
            "top_level_shared_read_blocks": root.get("Shared Read Blocks", 0),
            "sorts_spilled_to_disk": sum(
                item["sort_space_type"] == "Disk" for item in nodes
            ),
            "execution_nodes": nodes,
        })
    return {
        "environment": "disposable-timescaledb",
        "source": "JDBC repository SQL extracted without manual rewrites",
        "data_kind": "SYNTHETIC ONLY — 12 countries, 54 indicators, 4 sources, 24 years, 2 revisions",
        "raw_observations": 124416,
        "latest_observations": 62208,
        "not_production_slo_or_official_data": True,
        "plans": plans,
    }


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--input", type=Path, required=True)
    parser.add_argument("--output", type=Path, required=True)
    args = parser.parse_args()
    summary = parse_plan_log(args.input.read_text(encoding="utf-8"))
    args.output.parent.mkdir(parents=True, exist_ok=True)
    args.output.write_text(json.dumps(summary, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    for p in summary["plans"]:
        print(f"OBSERVED synthetic SQL {p['operation']}: execution={p['execution_time_ms']}ms; "
              f"nodes={p['total_nodes']}; shared reads={p['top_level_shared_read_blocks']}; "
              f"disk sorts={p['sorts_spilled_to_disk']}")
    print("PASS: 3 canonical SQL EXPLAIN plans parsed and archived")


if __name__ == "__main__":
    main()
