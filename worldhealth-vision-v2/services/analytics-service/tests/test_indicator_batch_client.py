"""Internal Catalog batch contract, error propagation and exact order."""
import asyncio

import httpx
import pytest
from prometheus_client import REGISTRY

from analytics_service.clients.catalog_client import CatalogClient


def make_detail(code):
    return {
        "code": code,
        "displayName": "Fixture " + code,
        "topic": "MACROECONOMIC",
        "unitLabel": "PERCENT",
        "description": "Synthetic label only",
        "preferredFrequency": "ANNUAL",
        "sourceDatasetCode": "WDI",
        "core": True,
        "methodologyNotes": "Reviewed methodology",
    }


def run_client(handler, codes):
    async def job():
        client = CatalogClient("http://catalog.internal", 5, transport=httpx.MockTransport(handler))
        try:
            return await client.get_indicators_batch(codes)
        finally:
            await client.aclose()
    return asyncio.run(job())


def test_exact_order_and_all_metadata_are_preserved():
    codes = ["FIRST.A", "SECOND.B"]
    received = []
    def handler(request):
        received.append((request.method, request.url.path, request.content))
        return httpx.Response(200, json={"count": 2, "items": [make_detail(c) for c in codes]})
    before = REGISTRY.get_sample_value(
        "whv_analytics_upstream_http_requests_total",
        {"dependency": "catalog", "operation": "indicators_batch", "outcome": "success"},
    ) or 0
    result = run_client(handler, codes)
    assert [x.code for x in result] == codes
    assert all(x.methodologyNotes == "Reviewed methodology" for x in result)
    assert len(received) == 1
    assert received[0][0:2] == ("POST", "/internal/catalog/indicators/batch")
    assert b'"codes":["FIRST.A","SECOND.B"]' in received[0][2]
    assert (REGISTRY.get_sample_value(
        "whv_analytics_upstream_http_requests_total",
        {"dependency": "catalog", "operation": "indicators_batch", "outcome": "success"},
    ) or 0) == before + 1


@pytest.mark.parametrize("body", [
    {"count": 1, "items": [make_detail("FIRST.A")]},
    {"count": 2, "items": [make_detail("SECOND.B"), make_detail("FIRST.A")]},
    {"count": 2, "items": [make_detail("FIRST.A"), make_detail("FIRST.A")]},
])
def test_incomplete_or_reordered_batch_never_silently_binds_wrong_profile(body):
    with pytest.raises(httpx.RemoteProtocolError):
        run_client(lambda request: httpx.Response(200, json=body), ["FIRST.A", "SECOND.B"])


def test_missing_indicator_keeps_http_404_for_service_layer():
    with pytest.raises(httpx.HTTPStatusError) as info:
        run_client(lambda request: httpx.Response(404, json={"error": "not_found"}),
                   ["FIRST.A", "SECOND.B"])
    assert info.value.response.status_code == 404


def test_invalid_batch_is_rejected_before_any_network_call():
    def fail(request):
        raise AssertionError("Should not call Catalog")
    with pytest.raises(ValueError):
        run_client(fail, ["DUPLICATE", "DUPLICATE"])
    with pytest.raises(ValueError):
        run_client(fail, [])
