"""Contract tests for the CI-only private Analytics upstream report."""
import unittest

from report_upstream_metrics import parse_metrics, verify_economic_observed


def samples(dependency: str, operation: str, count: int) -> str:
    labels = f'dependency="{dependency}",operation="{operation}"'
    with_outcome = f'{labels},outcome="success"'
    return (
        f'whv_analytics_upstream_http_requests_total{{{with_outcome}}} {count}\n'
        f'whv_analytics_upstream_http_latency_seconds_count{{{labels}}} {count}\n'
        f'whv_analytics_upstream_http_latency_seconds_sum{{{labels}}} {count / 100}\n'
        f'whv_analytics_upstream_http_latency_seconds_created{{{labels}}} 1711111111.0\n'
        f'whv_analytics_upstream_http_latency_seconds_bucket{{{labels},le="0.1"}} {count}\n'
    )


class UpstreamMetricsReportTests(unittest.TestCase):
    def test_all_required_operations_are_observed_and_unit_is_milliseconds(self):
        text = (
            samples("catalog", "indicator", 54)
            + samples("timeseries", "latest_by_source", 54)
            + samples("timeseries", "availability", 54)
            + samples("timeseries", "series", 54)
        )
        summary = parse_metrics(text)
        verify_economic_observed(summary)
        self.assertEqual(len(summary["operations"]), 4)
        self.assertEqual(summary["operations"][0]["mean_http_round_trip_ms"], 10.0)

    def test_fails_if_any_economic_operation_is_missing(self):
        summary = parse_metrics(samples("timeseries", "series", 53))
        with self.assertRaisesRegex(ValueError, "Missing 54-indicator"):
            verify_economic_observed(summary)

    def test_rejects_unreviewed_parameter_label(self):
        text = (
            'whv_analytics_upstream_http_requests_total{dependency="timeseries",'
            'operation="series",outcome="success",country_iso3="FRA"} 1\n'
        )
        with self.assertRaisesRegex(ValueError, "Unreviewed"):
            parse_metrics(text)

    def test_rejects_unreviewed_operation_value(self):
        with self.assertRaisesRegex(ValueError, "Unreviewed"):
            parse_metrics(samples("timeseries", "FRA-private-interest", 1))


if __name__ == "__main__":
    unittest.main()
