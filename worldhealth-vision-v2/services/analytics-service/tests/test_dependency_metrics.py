"""F1.2b.2c-2: count real outbound requests without exposing input parameters."""
import asyncio

import httpx
import pytest
from prometheus_client import REGISTRY, generate_latest

from analytics_service.clients.catalog_client import CatalogClient
from analytics_service.clients.timeseries_client import TimeseriesClient
from analytics_service.metrics import timed_dependency_http


def _sample(name: str, *, dependency: str, operation: str, outcome: str | None = None) -> float:
    labels = {"dependency": dependency, "operation": operation}
    if outcome is not None:
        labels["outcome"] = outcome
    return REGISTRY.get_sample_value(name, labels) or 0.0


def test_timeseries_operation_counts_actual_http_calls_with_fixed_labels():
    received_paths = []

    def handler(request: httpx.Request) -> httpx.Response:
        received_paths.append(request.url.path)
        return httpx.Response(200, json={"count": 0, "items": []})

    before = _sample(
        "whv_analytics_upstream_http_requests_total",
        dependency="timeseries", operation="availability", outcome="success",
    )
    before_histogram = _sample(
        "whv_analytics_upstream_http_latency_seconds_count",
        dependency="timeseries", operation="availability",
    )

    async def run():
        client = TimeseriesClient("http://fake-timeseries.internal", 5, transport=httpx.MockTransport(handler))
        try:
            return await client.list_series_availability(
                country_iso3="FRA", indicator_code="CPI", source_code=None,
                dataset_code=None, period_granularity=None, limit=100,
            )
        finally:
            await client.aclose()

    assert asyncio.run(run()) == []
    assert received_paths == ["/api/timeseries/series/availability"]
    assert _sample(
        "whv_analytics_upstream_http_requests_total",
        dependency="timeseries", operation="availability", outcome="success",
    ) == before + 1
    assert _sample(
        "whv_analytics_upstream_http_latency_seconds_count",
        dependency="timeseries", operation="availability",
    ) == before_histogram + 1
    output = generate_latest().decode()
    assert 'country_iso3=' not in output
    assert 'indicator_code=' not in output
    assert 'source_code=' not in output
    assert 'username=' not in output


def test_catalog_http_error_remains_an_error_and_is_counted():
    def handler(request: httpx.Request) -> httpx.Response:
        return httpx.Response(404, json={"error": "not_found"})

    before = _sample(
        "whv_analytics_upstream_http_requests_total",
        dependency="catalog", operation="country", outcome="http_error",
    )
    async def run():
        client = CatalogClient("http://fake-catalog.internal", 5, transport=httpx.MockTransport(handler))
        try:
            await client.get_country("FRA")
        finally:
            await client.aclose()

    with pytest.raises(httpx.HTTPStatusError):
        asyncio.run(run())
    assert _sample(
        "whv_analytics_upstream_http_requests_total",
        dependency="catalog", operation="country", outcome="http_error",
    ) == before + 1


def test_timeseries_transport_error_is_not_mislabelled_as_success():
    def handler(request: httpx.Request) -> httpx.Response:
        raise httpx.ConnectError("synthetic unavailable", request=request)

    before = _sample(
        "whv_analytics_upstream_http_requests_total",
        dependency="timeseries", operation="readiness", outcome="transport_error",
    )

    async def run():
        client = TimeseriesClient("http://fake-timeseries.internal", 5, transport=httpx.MockTransport(handler))
        try:
            await client.get_readiness()
        finally:
            await client.aclose()

    with pytest.raises(httpx.ConnectError):
        asyncio.run(run())
    assert _sample(
        "whv_analytics_upstream_http_requests_total",
        dependency="timeseries", operation="readiness", outcome="transport_error",
    ) == before + 1


def test_dynamic_operation_labels_are_rejected_before_metrics_are_emitted():
    with pytest.raises(ValueError, match="Unknown dependency operation"):
        with timed_dependency_http("timeseries", "FRA-secret-user"):
            pass
    with pytest.raises(ValueError, match="Unknown dependency operation"):
        with timed_dependency_http("unreviewed", "readiness"):
            pass
