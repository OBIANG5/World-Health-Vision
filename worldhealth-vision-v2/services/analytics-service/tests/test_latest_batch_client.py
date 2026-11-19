"""Timeseries latest-by-source batch: preserve strict group and provenance boundaries."""
import asyncio
import json

import httpx
import pytest
from prometheus_client import REGISTRY

from analytics_service.clients.timeseries_client import TimeseriesClient


def source_value(indicator: str, source: str = "IMF"):
    return {
        "sourceCode": source,
        "sourceDisplayName": source,
        "datasetCode": "IMF_PUBLIC_DATA",
        "datasetDisplayName": "Synthetic Dataset",
        "sourceRunKey": "SYNTHETIC_R2",
        "countryIso3": "FRA",
        "countryDisplayName": "France",
        "indicatorCode": indicator,
        "indicatorDisplayName": "Synthetic indicator",
        "periodGranularity": "ANNUAL",
        "periodStart": "2024-01-01",
        "periodEnd": "2024-12-31",
        "periodLabel": "2024",
        "numericValue": 17.5,
        "textValue": None,
        "valueStatus": "ESTIMATED",
        "sourcePublishedAt": "2026-01-01T00:00:00Z",
        "fetchedAtUtc": "2026-01-02T00:00:00Z",
    }


def run(handler, codes=None):
    async def task():
        client = TimeseriesClient(
            "http://timeseries.internal", 5, transport=httpx.MockTransport(handler)
        )
        try:
            return await client.list_latest_by_source_batch(
                country_iso3="FRA",
                indicator_codes=codes if codes is not None else ["FIRST.A", "SECOND.B"],
                source_code="IMF",
                dataset_code=None,
                period_granularity="ANNUAL",
                include_missing=False,
            )
        finally:
            await client.aclose()
    return asyncio.run(task())


def envelope(groups):
    return {
        "count": len(groups),
        "items": [
            {"indicatorCode": code, "count": len(items), "items": items}
            for code, items in groups
        ],
    }


def test_correct_order_estimated_provenance_empty_group_and_single_post():
    requests = []
    def handler(req):
        requests.append(req)
        return httpx.Response(200, json=envelope([
            ("FIRST.A", [source_value("FIRST.A")]),
            ("SECOND.B", []),
        ]))
    before = REGISTRY.get_sample_value(
        "whv_analytics_upstream_http_requests_total",
        {"dependency": "timeseries", "operation": "latest_batch", "outcome": "success"}
    ) or 0
    results = run(handler)
    assert list(results) == ["FIRST.A", "SECOND.B"]
    assert results["SECOND.B"] == []
    row = results["FIRST.A"][0]
    assert (row.sourceCode, row.valueStatus, row.sourceRunKey, row.periodLabel) == (
        "IMF", "ESTIMATED", "SYNTHETIC_R2", "2024"
    )
    assert len(requests) == 1
    req = requests[0]
    assert (req.method, req.url.path) == ("POST", "/internal/timeseries/series/latest/batch")
    body = json.loads(req.content)
    assert body == {
        "countryIso3": "FRA", "indicatorCodes": ["FIRST.A", "SECOND.B"],
        "sourceCode": "IMF", "datasetCode": None, "periodGranularity": "ANNUAL",
        "includeMissing": False,
    }
    after = REGISTRY.get_sample_value(
        "whv_analytics_upstream_http_requests_total",
        {"dependency": "timeseries", "operation": "latest_batch", "outcome": "success"}
    ) or 0
    assert after == before + 1


@pytest.mark.parametrize("payload", [
    {"count": 1, "items": [{"indicatorCode": "FIRST.A", "count": 0, "items": []}]},
    envelope([("SECOND.B", []), ("FIRST.A", [source_value("FIRST.A")])]),
    envelope([("FIRST.A", [source_value("SECOND.B")]), ("SECOND.B", [])]),
    {"count": 2, "items": [
        {"indicatorCode": "FIRST.A", "count": 2, "items": [source_value("FIRST.A")]},
        {"indicatorCode": "SECOND.B", "count": 0, "items": []}
    ]},
    {"count": 2, "items": [
        {"indicatorCode": "FIRST.A", "count": 1, "items": [source_value("FIRST.A")]},
        {"indicatorCode": "FIRST.A", "count": 0, "items": []}
    ]},
])
def test_wrong_group_count_order_or_cross_indicator_observation_is_fatal(payload):
    with pytest.raises(httpx.RemoteProtocolError):
        run(lambda req: httpx.Response(200, json=payload))


def test_original_http_error_is_preserved_for_gateway_failure_mapping():
    with pytest.raises(httpx.HTTPStatusError) as err:
        run(lambda req: httpx.Response(503, json={"code": "DEPENDENCY_UNAVAILABLE"}))
    assert err.value.response.status_code == 503


def test_invalid_duplicate_and_empty_batch_rejected_before_io():
    def never(req):
        raise AssertionError("Invalid batch performed a network request.")
    with pytest.raises(ValueError):
        run(never, ["SAME.A", "SAME.A"])
    with pytest.raises(ValueError):
        run(never, [])
