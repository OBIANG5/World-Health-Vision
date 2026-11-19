"""Offline parser contract: only fixed SQL-operation labels and safe Hikari metrics."""
import unittest

from monitor_timeseries_jdbc_hikari import parse_approved_metrics
from summarize_timeseries_jdbc_hikari import summarize


def fixture_sample():
    return {
        "hikari": {
            "hikaricp_connections_active": 20.0,
            "hikaricp_connections_idle": 0.0,
            "hikaricp_connections_pending": 4.0,
            "hikaricp_connections_max": 20.0,
        },
        "jdbc": {
            name: {"count": 61.0, "sum": 24.4, "max": 1.2}
            for name in ("history", "latest", "availability")
        },
        "hikari_pool_timers": {
            "acquire": {"count": 160.0, "sum": 2.4, "max": 0.4},
            "usage": {"count": 160.0, "sum": 50.0, "max": 2.0},
        },
        "hikari_timeouts": 0.0,
    }


class HikariMetricReportContract(unittest.TestCase):
    def test_redacts_pool_identity_and_preserves_fixed_operation(self):
        raw = (
            'hikaricp_connections_active{pool="HikariPool-1"} 19\n'
            'hikaricp_connections_pending{pool="HikariPool-1"} 6\n'
            'hikaricp_connections_acquire_seconds_sum{pool="HikariPool-1"} 0.9\n'
            'hikaricp_connections_usage_seconds_count{pool="HikariPool-1"} 61\n'
            'whv_timeseries_batch_jdbc_duration_seconds_count{operation="history"} 61\n'
            'whv_timeseries_batch_jdbc_duration_seconds_sum{operation="history"} 6.1\n'
        )
        result = parse_approved_metrics(raw)
        self.assertEqual(result["hikari"]["hikaricp_connections_pending"], 6)
        self.assertEqual(result["hikari_pool_timers"]["acquire"]["sum"], 0.9)
        self.assertEqual(result["jdbc"]["history"]["count"], 61)
        self.assertNotIn("HikariPool-1", str(result))

    def test_forbids_unreviewed_country_or_source_metric_label(self):
        raw = (
            'whv_timeseries_batch_jdbc_duration_seconds_count'
            '{operation="history",country_iso3="FRA"} 1\n'
        )
        with self.assertRaisesRegex(ValueError, "Unreviewed"):
            parse_approved_metrics(raw)

    def test_result_reports_stable_timers_and_nonzero_pending(self):
        result = summarize([fixture_sample(), fixture_sample()], minimum_count=60)
        self.assertEqual(result["hikari"]["pending"]["maximum_sample"], 4.0)
        self.assertEqual(result["hikari"]["active"]["maximum_sample"], 20)
        self.assertEqual(result["batch_jdbc_timers"][0]["calls"], 61)
        self.assertEqual(result["hikari_pool_timers"][0]["mean_duration_ms"], 15.0)

    def test_missing_acquire_or_timers_fails_closed(self):
        records = [fixture_sample(), fixture_sample()]
        del records[-1]["hikari_pool_timers"]["acquire"]
        with self.assertRaisesRegex(ValueError, "Missing Hikari acquire"):
            summarize(records, minimum_count=60)


if __name__ == "__main__":
    unittest.main()
