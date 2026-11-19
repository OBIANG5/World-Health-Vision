"""Unit-test SQL extraction and EXPLAIN parsing without Docker or real data."""
from __future__ import annotations

import json
import unittest

from sql_profile_generate_explain import extract_sql, generate
from sql_profile_analyze_plans import parse_plan_log

JAVA_SAMPLE = """
    @Override
    public List<X> listSeries(String x) {
        String sql = \"\"\"
             select * from timeseries.latest_observation lo
             where lo.country_iso3 = :countryIso3
               and lo.indicator_code = :indicatorCode
               and (cast(:sourceCode as varchar) is null or lo.source_code = :sourceCode)
             \"\"\"
             + seriesOrderBy(sortDescending)
             + \"\"\"
             limit :limit
             \"\"\";
        return null;
    }

    @Override
    public List<X> listLatestBySource(String x) {
        String sql = \"\"\"
             with ranked as (
                 select * from timeseries.latest_observation lo
                 where lo.country_iso3 = :countryIso3 and lo.indicator_code = :indicatorCode
             ) select * from ranked
             \"\"\";
        return null;
    }

    @Override
    public List<X> listSeriesAvailability(String x) {
        String sql = \"\"\"
             with filtered as (
                 select * from timeseries.latest_observation lo
                 where lo.country_iso3 = :countryIso3 and lo.indicator_code = :indicatorCode
             ) select * from filtered
             \"\"\";
        return null;
    }

    @Override
    public List<X> followingMethod(String x) { return null; }

    private String seriesOrderBy(boolean sortDescending) {
      return \"\"\" order by lo.period_start desc, lo.source_code asc, lo.dataset_code asc \"\"\";
    }
"""


def mock_pg_explain() -> str:
    parts = []
    for operation in ("series", "latest_by_source", "availability"):
        for n, repeat in enumerate(("cold", "warm1", "warm2", "warm3", "warm4", "warm5")):
            marker = f"{operation}__{repeat}"
            result = [{"Plan": {
                "Node Type": "Sort", "Actual Rows": 24, "Actual Loops": 1,
                "Actual Total Time": 4.0, "Shared Hit Blocks": 13, "Shared Read Blocks": 2,
                "Plans": [{"Node Type": "Seq Scan", "Relation Name": "observation",
                           "Actual Rows": 48, "Actual Loops": 1, "Actual Total Time": 2.0}],
            }, "Planning Time": 0.5, "Execution Time": float(100-n)}]
            parts.append(f"WHV_PLAN_BEGIN_{marker}\n{json.dumps(result)}\nWHV_PLAN_END_{marker}")
    return "\n".join(parts)


class SqlProfileContracts(unittest.TestCase):
    def test_sql_template_is_derived_and_binds_are_only_literals(self):
        sql = extract_sql(JAVA_SAMPLE, "series")
        self.assertIn("order by lo.period_start desc", sql)
        self.assertIn("lo.country_iso3 = 'FRA'", sql)
        self.assertIn("lo.indicator_code = 'NY.GDP.MKTP.CD'", sql)
        self.assertNotIn(":countryIso3", sql)
        self.assertNotIn(":sourceCode", sql)
        self.assertIn("limit 100", sql)

    def test_all_three_java_statements_generate_six_plan_runs(self):
        result = generate(JAVA_SAMPLE)
        self.assertEqual(result.count("EXPLAIN (ANALYZE, BUFFERS, FORMAT JSON)"), 18)
        for operation in ("series", "latest_by_source", "availability"):
            self.assertIn(f"WHV_PLAN_BEGIN_{operation}__cold", result)
            self.assertIn(f"WHV_PLAN_END_{operation}__warm5", result)

    def test_missing_java_query_fails_closed(self):
        with self.assertRaisesRegex(ValueError, "method missing"):
            extract_sql("class Empty {}", "series")

    def test_json_explain_six_rounds_are_computed_without_p99_invention(self):
        result = parse_plan_log(mock_pg_explain())
        self.assertEqual(len(result["operations"]), 3)
        self.assertEqual(result["operations"][0]["warm_samples"], 5)
        self.assertEqual(result["operations"][0]["cold_execution_ms"], 100)
        self.assertEqual(result["operations"][0]["warm_median_ms"], 97.0)
        self.assertTrue(result["operations"][0]["no_p95_p99_claim_for_5_samples"])

    def test_missing_explain_marker_is_rejected(self):
        text = mock_pg_explain().replace("WHV_PLAN_END_series__warm5", "")
        with self.assertRaisesRegex(ValueError, "Missing or duplicate"):
            parse_plan_log(text)


if __name__ == "__main__":
    unittest.main()
