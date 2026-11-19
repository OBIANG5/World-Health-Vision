"""Strict per-indicator availability batch contract and provenance safety."""
import asyncio
import json

import httpx
import pytest

from analytics_service.clients.timeseries_client import TimeseriesClient


def availability(code):
    return {
        "sourceCode": "IMF", "sourceDisplayName": "International Monetary Fund",
        "datasetCode": "IMF_PUBLIC_DATA", "datasetDisplayName": "Synthetic IMF",
        "countryIso3": "FRA", "countryDisplayName": "France",
        "indicatorCode": code, "indicatorDisplayName": code, "periodGranularity": "ANNUAL",
        "availableObservationCount": 3, "observedObservationCount": 1,
        "estimatedObservationCount": 2, "suppressedObservationCount": 0,
        "missingObservationCount": 2,
        "firstPeriodStart": "2020-01-01", "latestPeriodStart": "2024-01-01",
        "latestPeriodEnd": "2024-12-31", "latestPeriodLabel": "2024",
        "latestNumericValue": 123.5, "latestTextValue": None,
        "latestValueStatus": "ESTIMATED", "latestFetchedAtUtc": "2026-01-01T00:00:00Z",
    }


def document(groups):
    return {"count": len(groups), "items": [
        {"indicatorCode": code, "count": len(items), "items": items}
        for code, items in groups
    ]}


def call(handler, codes=None, limit=100):
    async def go():
        client = TimeseriesClient("http://timeseries.internal", 5, transport=httpx.MockTransport(handler))
        try:
            return await client.list_series_availability_batch(
                country_iso3="FRA", indicator_codes=codes if codes is not None else ["A.ONE", "B.TWO"],
                source_code="IMF", dataset_code="IMF_PUBLIC_DATA",
                period_granularity="ANNUAL", limit_per_indicator=limit,
            )
        finally:
            await client.aclose()
    return asyncio.run(go())


def test_exact_metadata_missing_counts_group_order_and_validated_request():
    seen = []
    def handler(req):
        seen.append(req)
        return httpx.Response(200, json=document([
            ("A.ONE", [availability("A.ONE")]),
            ("B.TWO", []),
        ]))
    result = call(handler)
    assert list(result) == ["A.ONE", "B.TWO"]
    assert result["B.TWO"] == []
    row = result["A.ONE"][0]
    assert row.missingObservationCount == 2
    assert row.estimatedObservationCount == 2
    assert row.latestValueStatus == "ESTIMATED"
    assert row.firstPeriodStart.isoformat() == "2020-01-01"
    assert len(seen) == 1
    assert (seen[0].method, seen[0].url.path) == (
        "POST", "/internal/timeseries/series/availability/batch"
    )
    assert json.loads(seen[0].content) == {
        "countryIso3": "FRA", "indicatorCodes": ["A.ONE", "B.TWO"],
        "sourceCode": "IMF", "datasetCode": "IMF_PUBLIC_DATA",
        "periodGranularity": "ANNUAL", "limitPerIndicator": 100,
    }


@pytest.mark.parametrize("response", [
    {"count": 1, "items": [{"indicatorCode": "A.ONE", "count": 1, "items": [availability("A.ONE")]}]},
    document([("B.TWO", []), ("A.ONE", [availability("A.ONE")])]),
    document([("A.ONE", [availability("B.TWO")]), ("B.TWO", [])]),
    {"count": 2, "items": [
        {"indicatorCode": "A.ONE", "count": 2, "items": [availability("A.ONE")]},
        {"indicatorCode": "B.TWO", "count": 0, "items": []}
    ]},
])
def test_incomplete_reordered_or_contaminated_batch_fails_closed(response):
    with pytest.raises(httpx.RemoteProtocolError):
        call(lambda req: httpx.Response(200, json=response))


def test_dependency_503_preserved():
    with pytest.raises(httpx.HTTPStatusError) as err:
        call(lambda req: httpx.Response(503, json={"error": "temporary"}))
    assert err.value.response.status_code == 503


def test_invalid_or_unbounded_client_batch_refuses_network():
    def never(req):
        raise AssertionError("Client performed request for invalid input")
    with pytest.raises(ValueError):
        call(never, ["DUP", "DUP"])
    with pytest.raises(ValueError):
        call(never, [])
    with pytest.raises(ValueError):
        call(never, ["GOOD"], 501)
    with pytest.raises(ValueError):
        call(never, [f"X.{n}" for n in range(128)], 100)
