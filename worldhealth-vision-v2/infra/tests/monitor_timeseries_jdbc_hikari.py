#!/usr/bin/env python3
"""Sample ONLY bounded JDBC timers and Hikari pool gauges over Docker-private DNS.

Execution location: disposable analytics-service container; private Timeseries
Actuator endpoint is not exposed through Gateway. No countries, sources,
SQL text, values or usernames are emitted. stdout: one JSON object per sample.
"""
from __future__ import annotations

import json
from math import isfinite
import re
import sys
import time
from urllib.request import urlopen

ORIGIN = "http://timeseries-service:8080/actuator/prometheus"
OPERATIONS = ("history", "latest", "availability")
GAUGES = (
    "hikaricp_connections_active",
    "hikaricp_connections_idle",
    "hikaricp_connections_pending",
    "hikaricp_connections_max",
    "hikaricp_connections_min",
    "hikaricp_connections",
)
JDBC_TIMER = "whv_timeseries_batch_jdbc_duration_seconds"
POOL_TIMER_FAMILIES = {
    "hikaricp_connections_acquire_seconds": "acquire",
    "hikaricp_connections_usage_seconds": "usage",
    "hikaricp_connections_creation_seconds": "creation",
}
POOL_TIMEOUT = "hikaricp_connections_timeout_total"
LABEL_PAIR = re.compile(r'([a-zA-Z_][a-zA-Z0-9_]*)="([^"]*)"')


def parse_approved_metrics(raw: str) -> dict:
    hikari = {}
    timers = {}
    pool_timers = {}
    pool_timeout = None
    for line in raw.splitlines():
        if not line or line.startswith("#") or "{" not in line:
            continue
        metric = line.split("{", 1)[0]
        try:
            labels = {
                match.group(1): match.group(2)
                for match in LABEL_PAIR.finditer(line.split("{", 1)[1].split("}", 1)[0])
            }
            value = float(line.split("}", 1)[1].strip().split()[0])
        except (IndexError, ValueError):
            continue
        if not isfinite(value) or value < 0:
            continue
        if metric in GAUGES:
            # Pool labels are not copied into the artifact; sum if multi-pool.
            hikari[metric] = hikari.get(metric, 0.0) + value
        elif metric == POOL_TIMEOUT:
            pool_timeout = (pool_timeout or 0.0) + value
        elif any(metric.startswith(family + "_") for family in POOL_TIMER_FAMILIES):
            for family, name in POOL_TIMER_FAMILIES.items():
                if metric in {f"{family}_count", f"{family}_sum", f"{family}_max"}:
                    values = pool_timers.setdefault(name, {})
                    suffix = metric[len(family) + 1:]
                    values[suffix] = values.get(suffix, 0.0) + value
        elif metric in {
            f"{JDBC_TIMER}_count", f"{JDBC_TIMER}_sum",
            f"{JDBC_TIMER}_max",
        } and labels.get("operation") in OPERATIONS:
            if set(labels) != {"operation"}:
                raise ValueError("Unreviewed high-cardinality Timeseries JDBC metric label")
            op = labels["operation"]
            if op not in timers:
                timers[op] = {}
            suffix = metric[len(JDBC_TIMER) + 1:]
            timers[op][suffix] = value
    return {
        "hikari": hikari, "jdbc": timers,
        "hikari_pool_timers": pool_timers,
        "hikari_timeouts": pool_timeout,
    }


def sample() -> dict:
    with urlopen(ORIGIN, timeout=5) as response:
        body = response.read(1_500_000).decode("utf-8")
    result = parse_approved_metrics(body)
    result["monotonic_elapsed_s"] = round(time.monotonic(), 3)
    return result


def main():
    if "--once" in sys.argv:
        print(json.dumps(sample(), sort_keys=True), flush=True)
        return
    for _ in range(100):
        try:
            print(json.dumps(sample(), sort_keys=True), flush=True)
        except (TimeoutError, OSError, UnicodeDecodeError) as error:
            print(json.dumps({"sample_error": type(error).__name__}), flush=True)
        time.sleep(0.3)


if __name__ == "__main__":
    main()
