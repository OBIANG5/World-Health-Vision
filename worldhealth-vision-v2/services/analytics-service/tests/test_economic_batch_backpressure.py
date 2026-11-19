"""CI-only optional economic Timeseries batch backpressure, not a rate limiter."""
import asyncio

import httpx
import pytest
from pydantic import ValidationError
from prometheus_client import REGISTRY

from analytics_service.config import Settings
from analytics_service.service import AnalyticsDependencyError, AnalyticsService


class NoopClient:
    async def aclose(self):
        return None


def service(limit):
    settings = Settings(economic_timeseries_batch_max_inflight=limit)
    return AnalyticsService(settings, NoopClient(), NoopClient())


def run_peak(limit: int, count: int = 10) -> int:
    async def go():
        instance = service(limit)
        active = 0
        peak = 0

        async def one():
            nonlocal active, peak
            active += 1
            peak = max(peak, active)
            try:
                await asyncio.sleep(0.015)
                return "source-preserved"
            finally:
                active -= 1

        results = await asyncio.gather(*(
            instance._run_economic_timeseries_batch("history", one)
            for _ in range(count)
        ))
        assert results == ["source-preserved"] * count
        assert active == 0
        return peak
    return asyncio.run(go())


def test_default_unbounded_behavior_is_preserved():
    assert Settings().economic_timeseries_batch_max_inflight == 0
    assert run_peak(0) > 2


def test_analytics_process_wide_ceiling_applies_across_competing_snapshots():
    before = REGISTRY.get_sample_value(
        "whv_analytics_economic_timeseries_batch_wait_seconds_count",
        {"operation": "history"},
    ) or 0
    assert run_peak(2, 10) == 2
    after = REGISTRY.get_sample_value(
        "whv_analytics_economic_timeseries_batch_wait_seconds_count",
        {"operation": "history"},
    ) or 0
    assert after - before == 10


def test_http_failures_do_not_poison_or_exhaust_queue():
    async def go():
        instance = service(1)

        async def failed():
            raise httpx.ConnectError("synthetic upstream outage")

        async def healthy():
            return 54

        with pytest.raises(AnalyticsDependencyError):
            await instance._run_economic_timeseries_batch("availability", failed)
        assert await instance._run_economic_timeseries_batch("availability", healthy) == 54

    asyncio.run(go())


def test_cancelled_request_releases_semaphore_for_next_snapshot():
    async def go():
        instance = service(1)
        started = asyncio.Event()
        forever = asyncio.Event()

        async def waiting():
            started.set()
            await forever.wait()

        task = asyncio.create_task(
            instance._run_economic_timeseries_batch("latest", waiting)
        )
        await asyncio.wait_for(started.wait(), timeout=1)
        task.cancel()
        with pytest.raises(asyncio.CancelledError):
            await task
        result = await asyncio.wait_for(
            instance._run_economic_timeseries_batch(
                "latest", lambda: asyncio.sleep(0, result="recovered")
            ),
            timeout=1,
        )
        assert result == "recovered"

    asyncio.run(go())


@pytest.mark.parametrize("value", [-1, 65])
def test_rejects_unbounded_or_negative_config(value):
    with pytest.raises(ValidationError):
        Settings(economic_timeseries_batch_max_inflight=value)


def test_metrics_are_fixed_operation_labels_not_country_or_user():
    instance = service(2)
    async def go():
        await instance._run_economic_timeseries_batch(
            "latest", lambda: asyncio.sleep(0, result=None)
        )
    asyncio.run(go())
    found = [
        metric for metric in REGISTRY.collect()
        if metric.name.startswith("whv_analytics_economic_timeseries_batch_wait")
    ]
    assert found
    for metric in found:
        for sample in metric.samples:
            assert set(sample.labels).issubset({"operation", "le"})
            assert sample.labels.get("operation") in {"latest", "availability", "history"}
