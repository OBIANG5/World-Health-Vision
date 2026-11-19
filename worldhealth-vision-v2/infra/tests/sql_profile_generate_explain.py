#!/usr/bin/env python3
"""Generate read-only EXPLAIN ANALYZE for the 3 ACTUAL Java SQL repository queries.

Not handwritten approximations: extract JDBC text blocks from the source, substitute
ONLY constant synthetic fixture parameters, and fail if the Java template drifts.
Run only on the disposable CI database containing sql_profile_dense_fixture.sql.
"""
from __future__ import annotations

import argparse
import re
from pathlib import Path

METHODS = {
    "series": "listSeries",
    "latest_by_source": "listLatestBySource",
    "availability": "listSeriesAvailability",
}
VALUES = {
    "countryIso3": "'FRA'",
    "indicatorCode": "'NY.GDP.MKTP.CD'",
    "sourceCode": "NULL",
    "datasetCode": "NULL",
    "periodGranularity": "NULL",
    "includeMissing": "false",
    "fromPeriodStart": "NULL",
    "toPeriodStart": "NULL",
    "limit": "100",
}
REPLACEMENT = re.compile(r"(?<!:):([A-Za-z][A-Za-z0-9_]*)")
ORDER_BY_DESC = "order by lo.period_start desc, lo.source_code asc, lo.dataset_code asc,
                             lo.period_granularity asc, lo.period_end desc, lo.run_key asc"


def _method_fragment(java: str, method: str) -> str:
    # Java method extracted by name; includes multi-line signature and SQL text.
    signature = re.search(r"public List<[^>]+>\s+" + re.escape(method) + r"\s*\(", java)
    if signature is None:
        raise ValueError(f"Repository SQL method missing: {method}")
    next_method = java.find("\n    @Override", signature.end())
    if next_method < 0:
        raise ValueError(f"Repository SQL method boundary missing: {method}")
    return java[signature.end():next_method]


def extract_sql(java: str, operation: str) -> str:
    if operation not in METHODS:
        raise ValueError("Unknown read operation")
    fragment = _method_fragment(java, METHODS[operation])
    parts = re.findall(r'"""(.*?)"""', fragment, flags=re.S)
    if operation == "series":
        if len(parts) != 2 or "+ seriesOrderBy(sortDescending)" not in fragment:
            raise ValueError("listSeries SQL composition changed; review the actual Java code")
        if ORDER_BY_DESC not in java:
            raise ValueError("Descending series order changed; review the source")
        template = parts[0] + "\n" + ORDER_BY_DESC + "\n" + parts[1]
    else:
        if len(parts) != 1:
            raise ValueError(f"Expected exactly one SQL template for {operation}")
        template = parts[0]
    if "from timeseries.latest_observation lo" not in template:
        raise ValueError(f"Timeseries view missing for {operation}")
    if ":countryIso3" not in template or ":indicatorCode" not in template:
        raise ValueError(f"Country/indicator filters missing for {operation}")

    def substitute(m: re.Match[str]) -> str:
        key = m.group(1)
        if key not in VALUES:
            raise ValueError(f"Unknown SQL bind value: {key}")
        return VALUES[key]

    sql = REPLACEMENT.sub(substitute, template).strip()
    if REPLACEMENT.search(sql):
        raise ValueError("Unresolved bind parameter")
    # Prevent accidentally profiling a mutation when source code changes.
    if not re.match(r"^(select|with)\b", sql, flags=re.I):
        raise ValueError("Not a read-only SQL statement")
    return sql


def generate(java: str) -> str:
    output = [
        "-- SYNTHETIC DISPOSABLE DB ONLY. Generated from JdbcTimeseriesRepository.java.",
        "\\set ON_ERROR_STOP on",
        "SET statement_timeout = '90s';",
        "SET lock_timeout = '5s';",
    ]
    # One first-touch sample and five repeat samples per operation.
    # These are within-run synthetic comparisons, NOT a production p99/SLO.
    for operation in METHODS:
        sql = extract_sql(java, operation)
        for repetition in ("cold", "warm1", "warm2", "warm3", "warm4", "warm5"):
            marker = operation + "__" + repetition
            output.extend([
                f"\\echo WHV_PLAN_BEGIN_{marker}",
                "EXPLAIN (ANALYZE, BUFFERS, FORMAT JSON) " + sql + ";",
                f"\\echo WHV_PLAN_END_{marker}",
            ])
    return "\n".join(output) + "\n"


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--source", type=Path, required=True)
    parser.add_argument("--output", type=Path, required=True)
    parser.add_argument("--ci-fixture-only", action="store_true")
    args = parser.parse_args()
    if not args.ci_fixture_only:
        parser.error("EXPLAIN ANALYZE generation requires explicit --ci-fixture-only")
    output = generate(args.source.read_text(encoding="utf-8"))
    args.output.parent.mkdir(parents=True, exist_ok=True)
    args.output.write_text(output, encoding="utf-8")
    print("PASS: generated SQL EXPLAIN from 3 canonical JDBC queries (synthetic fixture only)")


if __name__ == "__main__":
    main()
