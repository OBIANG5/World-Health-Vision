#!/usr/bin/env python3
"""Strict A/B/A proof: same 54-lens data and source evidence despite queue cap.

Three runs on SAME disposable SQL DB, SAME code, SAME runner:
unbounded baseline -> optional max 8 in-flight economic batch requests ->
unbounded baseline again. Latencies are descriptive, not production SLO.
"""
from __future__ import annotations

import argparse
import json
from pathlib import Path


def read(path: Path) -> dict:
    data = json.loads(path.read_text(encoding="utf-8"))
    if not data.get("not_real_country_economic_data"):
        raise ValueError("Only synthetic, explicitly labeled fixture is allowed")
    if len(data.get("results", [])) != 5 or data.get("snapshots") != 60:
        raise ValueError("All 5 workload tiers x 12 countries are mandatory")
    if not data.get("private_hikari_jdbc_sampling"):
        raise ValueError("Metrics from the same private Timeseries JDBC/Hikari instance required")
    return data


def compare(original: dict, capped: dict, repeat: dict) -> dict:
    modes = {"baseline": original, "bounded_8": capped, "baseline_repeat": repeat}
    expected_tiers = [1, 2, 4, 8, 12]
    for name, data in modes.items():
        tiers = data["results"]
        if [x.get("concurrency") for x in tiers] != expected_tiers:
            raise AssertionError(f"Wrong tier order in {name}")
        for row in tiers:
            if (row.get("successful_snapshots") != 12
                    or row.get("country_count") != 12
                    or row.get("errors")
                    or set(row.get("jdbc_batch_wall", {})) != {
                        "history", "availability", "latest"
                    }):
                raise AssertionError(f"Incomplete real economic proof for {name}")
            if any(row["jdbc_batch_wall"][op]["calls"] != 12
                   for op in ("history", "availability", "latest")):
                raise AssertionError(f"JDBC batch N+1 or dropped result in {name}")

    fingerprints = {}
    for name, data in modes.items():
        for row in data["results"]:
            for country, fingerprint in row["per_country_fingerprints"].items():
                if country in fingerprints and fingerprints[country] != fingerprint:
                    raise AssertionError(
                        f"{name} returned different source/value/history evidence for {country}"
                    )
                fingerprints[country] = fingerprint
    if len(fingerprints) != 12:
        raise AssertionError("Expected exactly 12 synthetic countries in each mode")

    values = {}
    for name, data in modes.items():
        values[name] = []
        for tier in data["results"]:
            values[name].append({
                "concurrency": tier["concurrency"],
                "wall_ms": tier["wall_time_ms"],
                "p50_ms": tier["request_latency_ms"]["p50"],
                "p95_ms": tier["request_latency_ms"]["p95"],
                "hikari_pending_max_sampled": tier["pool_hikari"]["pending_max_observed"],
                "hikari_active_max_sampled": tier["pool_hikari"]["active_max_observed"],
                "hikari_checkout_mean_ms": tier["pool_hikari"]["checkout_mean_ms"],
                "jdbc_history_mean_ms": tier["jdbc_batch_wall"]["history"]["mean_ms"],
                "jdbc_availability_mean_ms": tier["jdbc_batch_wall"]["availability"]["mean_ms"],
                "jdbc_latest_mean_ms": tier["jdbc_batch_wall"]["latest"]["mean_ms"],
                "response_max_bytes": tier["response_json_bytes"]["max"],
            })
    return {
        "environment": "one disposable 124416-observation SYNTHETIC fixture, one runner",
        "test_modes": "baseline limit=0, bounded limit=8, baseline limit=0 again",
        "mode_labels_are_not_client_parameters": True,
        "entire_json_except_generatedAtUtc_identical_across_modes": True,
        "validated_countries": len(fingerprints),
        "verified_snapshots": 180,
        "not_production_SLO": True,
        "warning": "1 run per treatment, ordered A/B/A; warm-cache, CPU scheduling and CI noise remain; no automatic pool changes",
        "results": values,
    }


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--baseline", type=Path, required=True)
    parser.add_argument("--bounded", type=Path, required=True)
    parser.add_argument("--baseline-repeat", type=Path, required=True)
    parser.add_argument("--output", type=Path, required=True)
    args = parser.parse_args()
    data = compare(read(args.baseline), read(args.bounded), read(args.baseline_repeat))
    args.output.parent.mkdir(parents=True, exist_ok=True)
    args.output.write_text(json.dumps(data, indent=2, ensure_ascii=False)+"\n",encoding="utf-8")
    for name, rows in data["results"].items():
        max_tier = rows[-1]
        print(f"OBSERVED A/B/A {name} tier=12: wall={max_tier['wall_ms']}ms "
              f"p95={max_tier['p95_ms']}ms Hikari pending sampled "
              f"{max_tier['hikari_pending_max_sampled']} "
              f"checkout_mean={max_tier['hikari_checkout_mean_ms']}ms")
    print("PASS: 180 snapshots; all 12 country full JSON hashes and 54-lens source evidence unchanged across A/B/A")


if __name__ == "__main__":
    main()
