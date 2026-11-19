#!/usr/bin/env python3
"""SQL EXPLAIN of THREE CURRENT JDBC BATCH templates, not handwritten variants.

Read-only, source-code-derived, bound to 54 canonical economic indicators.
Only for a disposable synthetic DB; fail if Java syntax/SQL contract drifts.
"""
from __future__ import annotations

import argparse
from pathlib import Path
import re

from sql_profile_build_fixture import economic_codes

METHODS = {
    "history_batch": "listSeriesBatch",
    "latest_batch": "listLatestBySourceBatch",
    "availability_batch": "listSeriesAvailabilityBatch",
}
REPETITIONS = ("cold", "warm1", "warm2", "warm3", "warm4", "warm5")
PARAMETER = re.compile(r"(?<!:):([A-Za-z][A-Za-z0-9_]*)")


def java_sql_fragment(source: str, method: str) -> str:
    match = re.search(
        r"\bpublic List<[^>]+>\s+" + re.escape(method) + r"\s*\(",
        source,
    )
    if match is None:
        raise ValueError(f"Missing JDBC batch method {method}")
    ending = source.find("\n    @Override", match.end())
    if ending < 0:
        raise ValueError(f"No documented Java method end for {method}")
    result = source[match.end():ending]
    if result.count('String sql = """') != 1:
        raise ValueError(f"Unexpected SQL construction for {method}")
    return result


def actual_sql(source: str, operation: str, codes: tuple[str, ...]) -> str:
    if operation not in METHODS or len(codes) != 54 or len(set(codes)) != 54:
        raise ValueError("Only the reviewed three JDBC batches and 54 codes allowed")
    if any(re.fullmatch(r"[A-Z0-9_.]+", code) is None for code in codes):
        raise ValueError("Invalid canonical indicator code")
    section = java_sql_fragment(source, METHODS[operation])
    template = section.split('String sql = """', 1)[1].split('"""', 1)[0].strip()
    if operation == "history_batch":
        order_match = re.search(
            r'String orderColumns = """(.*?)"""\.formatted\(direction\);',
            section, flags=re.S,
        )
        if (order_match is None
                or 'sortDescending ? "desc" : "asc"' not in section
                or '.formatted(orderColumns, orderColumns)' not in section
                or template.count("%s") != 2):
            raise ValueError("Unreviewed per-indicator SQL order template")
        exact_order = order_match.group(1).strip().replace("%s", "desc")
        template = template.replace("%s", exact_order)
    elif "%s" in template or ".formatted(" in section:
        raise ValueError("Unexpected template formatting")
    if "from timeseries.latest_observation lo" not in template:
        raise ValueError("Batch query changed its canonical revision-aware view")
    if "lo.indicator_code in (:indicatorCodes)" not in template:
        raise ValueError("Expected multi-indicator SQL bound list")
    if operation == "history_batch" and (
        "partition by indicator_code" not in template
        or "per_indicator_rank <= :limitPerIndicator" not in template
    ):
        raise ValueError("History must enforce independent per-indicator ranks")
    if operation == "availability_batch" and (
        "partition by unordered.indicator_code" not in template
        or "group_rank <= :limit" not in template
    ):
        raise ValueError("Availability must enforce independent indicator limits")
    if operation == "latest_batch" and (
        "partition by lo.indicator_code" not in template
        or "where ranked.rn = 1" not in template
    ):
        raise ValueError("Latest must rank each indicator/source independently")
    bound = {
        "countryIso3": "'FRA'",
        "indicatorCodes": ", ".join("'" + code + "'" for code in codes),
        "sourceCode": "NULL",
        "datasetCode": "NULL",
        "periodGranularity": "NULL",
        "fromPeriodStart": "NULL",
        "toPeriodStart": "NULL",
        "includeMissing": "false",
        "limit": "100",
        "limitPerIndicator": "120",
    }
    def sub(match: re.Match[str]) -> str:
        key = match.group(1)
        if key not in bound:
            raise ValueError(f"Unreviewed JDBC bind parameter in {operation}: {key}")
        return bound[key]
    statement = PARAMETER.sub(sub, template).strip()
    if PARAMETER.search(statement):
        raise ValueError("Unsubstituted parameter in SQL")
    if not re.match(r"^(select|with)\b", statement, flags=re.I):
        raise ValueError("Only read-only SQL is permitted")
    if ";" in statement or "--" in statement or "/*" in statement:
        raise ValueError("Unexpected SQL separator/comment")
    return statement


def generate(source: str, profile_source: str) -> str:
    codes = economic_codes(profile_source)
    lines = [
        "-- DISPOSABLE CI-ONLY synthetic 54-indicator SQL EXPLAIN.",
        "-- Extracted from actual JdbcTimeseriesRepository, not approximated.",
        "\\set ON_ERROR_STOP on",
        "SET statement_timeout = '90s';",
        "SET lock_timeout = '5s';",
    ]
    for operation in METHODS:
        sql = actual_sql(source, operation, codes)
        for rep in REPETITIONS:
            tag = f"{operation}__{rep}"
            lines.extend((
                f"\\echo WHV_PLAN_BEGIN_{tag}",
                "EXPLAIN (ANALYZE, BUFFERS, FORMAT JSON) " + sql + ";",
                f"\\echo WHV_PLAN_END_{tag}",
            ))
    return "\n".join(lines) + "\n"


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--source", type=Path, required=True)
    parser.add_argument("--profiles", type=Path, required=True)
    parser.add_argument("--output", type=Path, required=True)
    parser.add_argument("--ci-fixture-only", action="store_true")
    args = parser.parse_args()
    if not args.ci_fixture_only:
        parser.error("Source-derived SQL profiling REQUIRES disposable --ci-fixture-only")
    output = generate(args.source.read_text(encoding="utf-8"),
                      args.profiles.read_text(encoding="utf-8"))
    args.output.parent.mkdir(parents=True, exist_ok=True)
    args.output.write_text(output, encoding="utf-8")
    print("PASS: exact SQL extracted from latest/history/availability JDBC batches for 54 profiles")


if __name__ == "__main__":
    main()
