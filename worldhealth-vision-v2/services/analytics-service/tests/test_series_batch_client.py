"""Bounded historical batch reads must never drop individual indicator years."""
import asyncio
import json

import httpx
import pytest
from prometheus_client import REGISTRY

from analytics_service.clients.timeseries_client import TimeseriesClient


def observation(code: str, year: int = 2024, status: str = "OBSERVED"):
    return {
        "sourceCode": "WORLD_BANK", "sourceDisplayName": "World Bank",
        "datasetCode": "WDI", "datasetDisplayName": "World Development Indicators",
        "sourceRunKey": "SYNTHETIC_REVISION_R2", "countryIso3": "FRA",
        "countryDisplayName": "France", "indicatorCode": code,
        "indicatorDisplayName": "Synthetic code " + code, "periodGranularity": "ANNUAL",
        "periodStart": f"{year}-01-01", "periodEnd": f"{year}-12-31",
        "periodLabel": str(year), "numericValue": None if status == "MISSING" else 42.0,
        "textValue": None, "valueStatus": status,
        "sourcePublishedAt": "2026-01-01T00:00:00Z",
        "fetchedAtUtc": "2026-01-02T00:00:00Z",
    }


def response(groups):
    return {"count": len(groups), "items": [
        {"indicatorCode": code, "count": len(rows), "items": rows}
        for code, rows in groups
    ]}


def run(handler, codes=None, limit=120, include_missing=False):
    async def task():
        client = TimeseriesClient(
            "http://timeseries.internal", 5, transport=httpx.MockTransport(handler)
        )
        try:
            return await client.list_series_batch(
                country_iso3="FRA",
                indicator_codes=codes if codes is not None else ["A.ONE", "B.TWO"],
                source_code="WORLD_BANK", dataset_code="WDI",
                period_granularity="ANNUAL", include_missing=include_missing,
                sort_direction="DESC", limit_per_indicator=limit,
            )
        finally:
            await client.aclose()
    return asyncio.run(task())


def test_indicators_stay_separate_and_periods_and_missing_status_are_retained():
    captured = []
    def handler(req):
        captured.append(req)
        return httpx.Response(200, json=response([
            ("A.ONE", [observation("A.ONE", 2024), observation("A.ONE", 2023, "MISSING")]),
            ("B.TWO", [observation("B.TWO", 2022, "ESTIMATED")]),
        ]))
    before = REGISTRY.get_sample_value(
        "whv_analytics_upstream_http_requests_total",
        {"dependency": "timeseries", "operation": "series_batch", "outcome": "success"}
    ) or 0
    rows = run(handler, include_missing=True)
    assert list(rows) == ["A.ONE", "B.TWO"]
    assert [v.periodLabel for v in rows["A.ONE"]] == ["2024", "2023"]
    assert rows["A.ONE"][1].valueStatus == "MISSING"
    assert rows["B.TWO"][0].valueStatus == "ESTIMATED"
    assert rows["B.TWO"][0].sourceRunKey == "SYNTHETIC_REVISION_R2"
    assert len(captured) == 1
    assert captured[0].method == "POST"
    assert captured[0].url.path == "/internal/timeseries/series/history/batch"
    assert json.loads(captured[0].content) == {
        "countryIso3": "FRA", "indicatorCodes": ["A.ONE", "B.TWO"],
        "sourceCode": "WORLD_BANK", "datasetCode": "WDI",
        "periodGranularity": "ANNUAL", "fromPeriodStart": None, "toPeriodStart": None,
        "includeMissing": True, "sortDirection": "DESC", "limitPerIndicator": 120,
    }
    after = REGISTRY.get_sample_value(
        "whv_analytics_upstream_http_requests_total",
        {"dependency": "timeseries", "operation": "series_batch", "outcome": "success"}
    ) or 0
    assert after == before + 1


@pytest.mark.parametrize("bad", [
    {"count": 1, "items": [{"indicatorCode": "A.ONE", "count": 0, "items": []}]},
    response([("B.TWO", []), ("A.ONE", [observation("A.ONE")])]),
    response([("A.ONE", [observation("B.TWO")]), ("B.TWO", [])]),
    {"count": 2, "items": [
        {"indicatorCode": "A.ONE", "count": 2, "items": [observation("A.ONE")]},
        {"indicatorCode": "B.TWO", "count": 0, "items": []}
    ]},
])
def test_bad_batch_group_is_not_silently_used(bad):
    with pytest.raises(httpx.RemoteProtocolError):
        run(lambda req: httpx.Response(200, json=bad))


def test_http_error_propagates():
    with pytest.raises(httpx.HTTPStatusError) as err:
        run(lambda req: httpx.Response(503, json={"temporary": True}))
    assert err.value.response.status_code == 503


def test_chunking_preserves_all_54_codes_at_600_rows_per_indicator():
    codes = [f"SYNTHETIC.CODE.{i:02d}" for i in range(54)]
    received_chunks = []
    def handler(req):
        body = json.loads(req.content)
        requested = body["indicatorCodes"]
        received_chunks.append(requested)
        assert len(requested) * body["limitPerIndicator"] <= 10000
        return httpx.Response(200, json=response(
            [(code, [observation(code, 2023)]) for code in requested]
        ))
    values = run(handler, codes=codes, limit=600)
    assert list(values) == codes
    assert len(values) == 54
    assert all(len(values[code]) == 1 for code in codes)
    assert len(received_chunks) == 4  # 16+16+16+6 with 10k row budget
    assert [c for chunk in received_chunks for c in chunk] == codes


def test_validation_refuses_empty_or_duplicate_codes_and_excessive_limit():
    def never(req):
        raise AssertionError("Invalid batch performed network I/O")
    with pytest.raises(ValueError):
        run(never, codes=[])
    with pytest.raises(ValueError):
        run(never, codes=["A.ONE", "A.ONE"])
    with pytest.raises(ValueError):
        run(never, codes=["A.ONE"], limit=1001)
