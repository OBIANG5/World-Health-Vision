#!/usr/bin/env python3
"""Summarize private, fixed-cardinality Analytics dependency metrics in disposable CI.

Do not output URLs, query strings, countries, indicator values or identities.
The counters represent actual completed HTTP calls, not SQL statements.
"""
from __future__ import annotations

import argparse
import json
import re
from pathlib import Path

SAMPLE_RE = re.compile(
    r'^whv_analytics_upstream_http_'
    r'(requests_total|latency_seconds_(?:sum|count))'
    r'\{([^}]*)\}\s+([0-9.eE+-]+)(?:\s|$)'
)
LABEL_RE = re.compile(r'([a-z_][a-z0-9_]*)="([^"]*)"')
OPERATIONS = {
    "timeseries": {
        "readiness", "series", "series_batch", "latest_by_source",
        "latest_batch", "availability", "availability_batch",
        "country_comparison", "source_runs",
    },
    "catalog": {
        "readiness", "country", "local_context", "countries",
        "region", "indicator", "indicators", "indicators_batch", "source", "dataset",
    },
}
OUTCOMES = {"success", "http_error", "transport_error", "client_error"}
ECONOMIC_REQUIRED = (
    ("catalog", "indicator"),
    ("timeseries", "latest_by_source"),
    ("timeseries", "availability"),
    ("timeseries", "series"),
)


def parse_metrics(metrics_text: str) -> dict:
    data: dict[tuple[str, str], dict] = {}
    for line in metrics_text.splitlines():
        if not line.startswith("whv_analytics_upstream_http_"):
            continue
        if line.startswith("#"):
            continue
        # Histograms contain bucket samples as well; the summary needs sum/count.
        if "_bucket{" in line or "_created{" in line:
            continue
        match = SAMPLE_RE.fullmatch(line.strip())
        if match is None:
            raise ValueError("Unknown upstream-metric sample format")
        name, raw_labels, raw_value = match.groups()
        # Match every complete key-value token; silently ignoring malformed or
        # extra labels could hide a country/source identifier from validation.
        tokens = raw_labels.split(",")
        if any(LABEL_RE.fullmatch(token) is None for token in tokens):
            raise ValueError("Unreviewed upstream-metric label syntax")
        labels = dict(LABEL_RE.fullmatch(token).groups() for token in tokens)
        if len(labels) != len(tokens):
            raise ValueError("Duplicate upstream-metric label name")
        keys = {"dependency", "operation", "outcome"} if name == "requests_total" else {"dependency", "operation"}
        if set(labels) != keys:
            raise ValueError("Unreviewed upstream-metric label names")
        dependency, operation = labels["dependency"], labels["operation"]
        if operation not in OPERATIONS.get(dependency, set()):
            raise ValueError("Unreviewed upstream-metric label values")
        if name == "requests_total" and labels["outcome"] not in OUTCOMES:
            raise ValueError("Unreviewed upstream-metric outcome")
        item = data.setdefault((dependency, operation), {
            "dependency": dependency,
            "operation": operation,
            "outcomes": {},
            "http_round_trip_seconds_sum": 0.0,
            "http_round_trip_count": 0,
        })
        value = float(raw_value)
        if name == "requests_total":
            outcome = labels["outcome"]
            item["outcomes"][outcome] = item["outcomes"].get(outcome, 0) + int(value)
        elif name == "latency_seconds_sum":
            item["http_round_trip_seconds_sum"] = value
        elif name == "latency_seconds_count":
            item["http_round_trip_count"] = int(value)

    summary = []
    for item in sorted(data.values(), key=lambda value: (value["dependency"], value["operation"])):
        count = item["http_round_trip_count"]
        item["mean_http_round_trip_ms"] = (
            round(1000.0 * item["http_round_trip_seconds_sum"] / count, 3) if count else None
        )
        summary.append(item)
    return {"measurement": "outbound HTTP time including status validation; excludes JSON parsing and SQL plans",
            "operations": summary}


def verify_economic_observed(summary: dict) -> None:
    lookup = {(item["dependency"], item["operation"]): item for item in summary["operations"]}
    for key in ECONOMIC_REQUIRED:
        item = lookup.get(key)
        if item is None or item["outcomes"].get("success", 0) < 54:
            raise ValueError(f"Missing 54-indicator economic HTTP proof: {key[0]} / {key[1]}")
        if item["http_round_trip_count"] < item["outcomes"]["success"]:
            raise ValueError(f"Invalid histogram count: {key[0]} / {key[1]}")


def verify_optimized_economic_observed(summary: dict, minimum_snapshots: int = 40) -> None:
    """Prove the PUBLIC Gateway actually executed all four internal batch APIs.

    An A/B unit test alone does not prove real service wiring. Reject a passing
    Gateway benchmark that silently used the old 54x3 request pattern.
    """
    expected = (
        ("catalog", "indicators_batch"),
        ("timeseries", "latest_batch"),
        ("timeseries", "availability_batch"),
        ("timeseries", "series_batch"),
    )
    legacy = (
        ("catalog", "indicator"),
        ("timeseries", "latest_by_source"),
        ("timeseries", "availability"),
        ("timeseries", "series"),
    )
    found = {(v["dependency"], v["operation"]): v for v in summary["operations"]}
    for key in expected:
        item = found.get(key)
        if item is None or item["outcomes"].get("success", 0) < minimum_snapshots:
            raise ValueError(f"Missing active optimized batch evidence: {key}")
        if item["http_round_trip_count"] < item["outcomes"]["success"]:
            raise ValueError(f"Missing optimized batch latency data: {key}")
    for key in legacy:
        item = found.get(key)
        if item is not None and item["outcomes"].get("success", 0):
            raise ValueError(f"Legacy N+1 operation unexpectedly active: {key}")


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--input", type=Path, required=True)
    parser.add_argument("--output", type=Path, required=True)
    parser.add_argument("--require-economic", action="store_true")
    parser.add_argument("--require-optimized-economic", action="store_true")
    args = parser.parse_args()

    summary = parse_metrics(args.input.read_text(encoding="utf-8"))
    if args.require_economic and args.require_optimized_economic:
        parser.error("Choose original OR optimized economic mode, never both")
    if args.require_economic:
        verify_economic_observed(summary)
    if args.require_optimized_economic:
        verify_optimized_economic_observed(summary)
    args.output.parent.mkdir(parents=True, exist_ok=True)
    args.output.write_text(json.dumps(summary, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    for item in summary["operations"]:
        print(f"OBSERVED {item['dependency']} {item['operation']}: "
              f"{item['http_round_trip_count']} HTTP calls, "
              f"{item['mean_http_round_trip_ms']}ms mean, "
              f"outcomes={item['outcomes']}")
    print("PASS: bounded, private upstream HTTP operation counters recorded")


if __name__ == "__main__":
    main()
