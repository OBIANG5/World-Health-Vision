"""Historical Timeseries batch must preserve per-indicator values and evidence.

No unbounded request, fabricated numeric value or cross-indicator response can
be accepted as a valid institutional observation.
"""
import asyncio
import json

import httpx
import pytest
from prometheus_client import REGISTRY

from analytics_service.clients.timeseries_client import TimeseriesClient


def observation(indicator: str, status="ESTIMATED", date="2024-01-01", value=42.0):
    return {
        "sourceCode": "WORLD_BANK",
        "sourceDisplayName": "World Bank",
        "datasetCode": "WDI",
        "datasetDisplayName": "Synthetic WDI",
        "sourceRunKey": "WHV_SYNTHETIC_R2",
        "countryIso3": "FRA",
        "countryDisplayName": "France",
        "indicatorCode": indicator,
        "indicatorDisplayName": "Synthetic data",
        "periodGranularity": "ANNUAL",
        "periodStart": date,
        "periodEnd": "2024-12-31",
        "periodLabel": "2024",
        "numericValue": value,
        "textValue": None,
        "valueStatus": status,
        "sourcePublishedAt": "2026-01-01T00:00:00Z",
        "fetchedAtUtc": "2026-01-02T00:00:00Z",
    }


def payload(groups):
    return {
        "count": len(groups),
        "items": [
            {"indicatorCode": code, "count": len(rows), "items": rows}
            for code, rows in groups
        ],
    }


def run(handler, codes=None, limit=120, include_missing=True, order="DESC"):
    async def task():
        client = TimeseriesClient(
            "http://timeseries.internal", 5, transport=httpx.MockTransport(handler)
        )
        try:
            return await client.list_series_history_batch(
                country_iso3="FRA",
                indicator_codes=codes if codes is not None else ["GDP.A", "CPI.B"],
                source_code="WORLD_BANK",
                dataset_code=None,
                period_granularity=None,
                from_period_start="2020-01-01",
                to_period_start="2024-01-01",
                include_missing=include_missing,
                sort_direction=order,
                limit_per_indicator=limit,
            )
        finally:
            await client.aclose()
    return asyncio.run(task())


def test_complete_provenance_missing_status_request_bounds_and_operation_counter():
    captured = []
    def handler(request):
        captured.append(request)
        return httpx.Response(200, json=payload([
            ("GDP.A", [
                observation("GDP.A", status="MISSING", value=None),
                observation("GDP.A", status="ESTIMATED", date="2023-01-01", value=7.0),
            ]),
            ("CPI.B", [observation("CPI.B", status="OBSERVED")]),
        ]))
    before = REGISTRY.get_sample_value(
        "whv_analytics_upstream_http_requests_total",
        {"dependency": "timeseries", "operation": "series_batch", "outcome": "success"}
    ) or 0
    result = run(handler, order="DESC")
    assert list(result) == ["GDP.A", "CPI.B"]
    assert len(result["GDP.A"]) == 2
    assert result["GDP.A"][0].numericValue is None
    assert result["GDP.A"][0].valueStatus == "MISSING"
    assert result["GDP.A"][1].valueStatus == "ESTIMATED"
    assert result["CPI.B"][0].sourceRunKey == "WHV_SYNTHETIC_R2"
    assert len(captured) == 1
    req = captured[0]
    assert (req.method, req.url.path) == ("POST", "/internal/timeseries/series/history/batch")
    assert json.loads(req.content) == {
        "countryIso3": "FRA",
        "indicatorCodes": ["GDP.A", "CPI.B"],
        "sourceCode": "WORLD_BANK",
        "datasetCode": None,
        "periodGranularity": None,
        "fromPeriodStart": "2020-01-01",
        "toPeriodStart": "2024-01-01",
        "includeMissing": True,
        "sortDirection": "DESC",
        "limitPerIndicator": 120,
    }
    after = REGISTRY.get_sample_value(
        "whv_analytics_upstream_http_requests_total",
        {"dependency": "timeseries", "operation": "series_batch", "outcome": "success"}
    ) or 0
    assert after == before + 1


@pytest.mark.parametrize("response", [
    {"count": 1, "items": [
        {"indicatorCode": "GDP.A", "count": 1, "items": [observation("GDP.A")]}
    ]},
    payload([("CPI.B", []), ("GDP.A", [])]),
    payload([("GDP.A", [observation("CPI.B")]), ("CPI.B", [])]),
    {"count": 2, "items": [
        {"indicatorCode": "GDP.A", "count": 2, "items": [observation("GDP.A")]},
        {"indicatorCode": "CPI.B", "count": 0, "items": []},
    ]},
    {"count": 2, "items": [
        {"indicatorCode": "GDP.A", "count": 1, "items": [observation("GDP.A")]},
        {"indicatorCode": "GDP.A", "count": 0, "items": []},
    ]},
])
def test_wrong_count_order_or_cross_indicator_data_rejected(response):
    with pytest.raises(httpx.RemoteProtocolError):
        run(lambda request: httpx.Response(200, json=response))


def test_group_more_rows_than_its_own_limit_fails_closed():
    with pytest.raises(httpx.RemoteProtocolError):
        run(lambda request: httpx.Response(
            200, json=payload([
                ("GDP.A", [observation("GDP.A"), observation("GDP.A")]),
                ("CPI.B", []),
            ])
        ), limit=1)


def test_internal_dependency_http_503_remains_visible():
    with pytest.raises(httpx.HTTPStatusError) as err:
        run(lambda request: httpx.Response(503, json={"error": "unavailable"}))
    assert err.value.response.status_code == 503


@pytest.mark.parametrize("codes,limit,order", [
    ([], 1, "DESC"),
    (["GDP.A", "GDP.A"], 1, "DESC"),
    (["GDP.A"], 0, "DESC"),
    (["GDP.A"], 1001, "DESC"),
    ([f"TEST.CODE.{n}" for n in range(128)], 600, "DESC"),
    (["GDP.A"], 12, "DROP"),
])
def test_invalid_or_unbounded_request_never_reaches_network(codes, limit, order):
    def never(request):
        raise AssertionError("Invalid historical batch attempted HTTP")
    with pytest.raises(ValueError):
        run(never, codes=codes, limit=limit, order=order)
