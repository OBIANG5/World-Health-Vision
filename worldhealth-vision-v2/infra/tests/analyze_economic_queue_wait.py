#!/usr/bin/env python3
"""Independent verifier of private Analytics admission queue metrics.

Never mistake summed waiting across overlapping requests for wall-clock time
saved. Only fixed operation labels are accepted, with no user/country/source.
"""
from __future__ import annotations

import argparse
import json
import math
import re
from pathlib import Path

_METRIC = re.compile(
    r'^whv_analytics_economic_timeseries_batch_wait_seconds_'
    r'(count|sum)\{operation="(latest|availability|history)"\} '
    r'([0-9]+(?:\.[0-9]+)?(?:[eE][+-]?[0-9]+)?)$'
)
_PREFIX = "whv_analytics_economic_timeseries_batch_wait_seconds_"
_OPS = ("latest", "availability", "history")


def read_queue_wait(path: Path) -> dict:
    samples: dict[tuple[str, str], float] = {}
    for line in path.read_text(encoding="utf-8").splitlines():
        if not line.startswith(_PREFIX):
            continue
        if "_bucket{" in line or "_created{" in line:
            continue
        match = _METRIC.fullmatch(line)
        if match is None:
            raise ValueError("Unreviewed metric/label on private batch wait histogram")
        kind, operation, raw_value = match.groups()
        key = (operation, kind)
        if key in samples:
            raise ValueError("Duplicate batch wait series")
        value = float(raw_value)
        if not math.isfinite(value) or value < 0:
            raise ValueError("Non-finite or negative queue metric")
        samples[key] = value
    result = {}
    for operation in _OPS:
        count = samples.get((operation, "count"))
        total = samples.get((operation, "sum"))
        if count != 61 or total is None:
            raise ValueError("Missing or incorrectly counted batch wait observations")
        result[operation] = {
            "count": 61,
            "total_wait_ms_across_all_requests": round(total * 1000, 3),
            "mean_wait_ms_all_61_snapshots": round(total * 1000 / count, 3),
        }
    return result


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--baseline", type=Path, required=True)
    parser.add_argument("--bounded", type=Path, required=True)
    parser.add_argument("--baseline-repeat", type=Path, required=True)
    parser.add_argument("--report", type=Path, required=True)
    args = parser.parse_args()
    report = json.loads(args.report.read_text(encoding="utf-8"))
    if report.get("verified_snapshots") != 180 or report.get("validated_countries") != 12:
        raise ValueError("A/B/A source parity must succeed before queue metrics are appended")
    modes = {
        "baseline": read_queue_wait(args.baseline),
        "bounded_8": read_queue_wait(args.bounded),
        "baseline_repeat": read_queue_wait(args.baseline_repeat),
    }
    for name in ("baseline", "baseline_repeat"):
        if any(modes[name][op]["total_wait_ms_across_all_requests"] != 0 for op in _OPS):
            raise AssertionError("Unbounded baseline must have zero Analytics admission queue time")
    report["analytics_batch_queue_wait"] = modes
    report["queue_wait_interpretation"] = (
        "sum is cumulative across overlapping requests and all 5 tiers, not "
        "wall-clock delay or a latency percentile; cap can transfer waiting "
        "upstream from Hikari to Analytics"
    )
    args.report.write_text(json.dumps(report, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    for operation in _OPS:
        item = modes["bounded_8"][operation]
        print(f"OBSERVED Analytics bounded wait {operation}: "
              f"mean {item['mean_wait_ms_all_61_snapshots']} ms "
              f"over {item['count']} calls, total cumulative "
              f"{item['total_wait_ms_across_all_requests']} ms")
    print("PASS: queue metrics are complete, operation-only and unbounded modes remain queue-free")


if __name__ == "__main__":
    main()
