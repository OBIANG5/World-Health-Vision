from prometheus_client import generate_latest
import pytest

from analytics_service.metrics import observe_economic_phase, timed_economic_phase


def test_economic_phase_histogram_uses_fixed_labels_and_observes_success():
    with timed_economic_phase("country"):
        pass
    metrics = generate_latest().decode()
    assert 'whv_analytics_country_economic_snapshot_phase_seconds_count{phase="country"}' in metrics
    assert 'whv_analytics_country_economic_snapshot_phase_seconds_sum{phase="country"}' in metrics
    assert "country_iso3=" not in metrics
    assert 'username=' not in metrics


def test_economic_phase_histogram_observes_failures_without_swallowing_exception():
    before = generate_latest().decode().count(
        'whv_analytics_country_economic_snapshot_phase_seconds_count{phase="indicators"}'
    )
    with pytest.raises(RuntimeError, match="upstream unavailable"):
        with timed_economic_phase("indicators"):
            raise RuntimeError("upstream unavailable")
    after = generate_latest().decode()
    assert before in (0, 1)
    assert 'whv_analytics_country_economic_snapshot_phase_seconds_count{phase="indicators"}' in after


def test_metric_phase_names_are_fail_closed():
    with pytest.raises(ValueError, match="Unknown economic snapshot phase"):
        observe_economic_phase("GAB-user-identifier", 0.1)
