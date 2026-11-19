#!/usr/bin/env python3
"""Prove original GET and batched POST are byte-equivalent JSON lists PER indicator.

This test guards the bug a global LIMIT would introduce: with 54 indicators
and limit=1, every indicator must still receive its own most recent row.
Runs exclusively inside isolated CI's analytics container against internal DNS.
"""
from __future__ import annotations

import asyncio
import hashlib
import json
import sys
from math import ceil

import httpx
from analytics_service.product_profiles import ECONOMIC_LENS_PROFILES

PRIVATE = "http://timeseries-service:8080"
CASES = (
    {"name": "desc_one", "country": "FRA", "limit": 1, "direction": "DESC",
     "include_missing": False, "source": None, "from_date": None, "to_date": None},
    {"name": "asc_missing_five", "country": "FRA", "limit": 5, "direction": "ASC",
     "include_missing": True, "source": None, "from_date": None, "to_date": None},
    {"name": "imf_latest_ten", "country": "GAB", "limit": 10, "direction": "DESC",
     "include_missing": False, "source": "IMF", "from_date": None, "to_date": None},
    {"name": "bounded_periods", "country": "GAB", "limit": 10, "direction": "DESC",
     "include_missing": True, "source": None,
     "from_date": "2010-01-01", "to_date": "2015-01-01"},
)


async def compare(client: httpx.AsyncClient, codes: list[str], case: dict) -> dict:
    common = {
        "countryIso3": case["country"],
        "sourceCode": case["source"],
        "datasetCode": None,
        "periodGranularity": "ANNUAL",
        "fromPeriodStart": case["from_date"],
        "toPeriodStart": case["to_date"],
        "includeMissing": case["include_missing"],
        "sortDirection": case["direction"],
    }
    batch_request = {
        **common, "indicatorCodes": codes,
        "limitPerIndicator": case["limit"],
    }
    batched = await client.post(
        "/internal/timeseries/series/history/batch", json=batch_request
    )
    batched.raise_for_status()
    payload = batched.json()
    if payload.get("count") != 54 or len(payload.get("items", [])) != 54:
        raise AssertionError("Historical batch omitted indicators.")
    semaphore = asyncio.Semaphore(8)
    async def get_one(code: str) -> list[dict]:
        async with semaphore:
            params = {k: v for k, v in common.items() if v is not None}
            params["indicatorCode"] = code
            params["limit"] = case["limit"]
            response = await client.get("/api/timeseries/series", params=params)
            response.raise_for_status()
            return response.json()["items"]

    baseline = await asyncio.gather(*(get_one(code) for code in codes))
    total = 0
    signatures = []
    for code, group, individual in zip(codes, payload["items"], baseline, strict=True):
        if group.get("indicatorCode") != code or group.get("count") != len(individual):
            raise AssertionError(f"Missing indicator history or mistaken rank for {code}")
        if group.get("items") != individual:
            raise AssertionError(f"Unequal full per-indicator historical JSON for {code}")
        if len(individual) == 0 or len(individual) > case["limit"]:
            raise AssertionError(f"Wrong per-indicator LIMIT for populated synthetic code {code}")
        total += len(individual)
        signatures.append(hashlib.sha256(
            json.dumps(individual, sort_keys=True, separators=(",", ":")).encode()
        ).hexdigest())

    print(
        f"PASS historical per-indicator contract {case['name']}: "
        f"54 exact groups, {total} rows, filtered/ordered/full provenance equal",
        file=sys.stderr,
    )
    return {
        "case": case["name"], "country": case["country"],
        "individual_items": 54,
        "returned_observations": total,
        "limit_per_indicator": case["limit"],
        "all_full_json_groups_equal": True,
        "composite_digest": hashlib.sha256("".join(signatures).encode()).hexdigest(),
    }


async def main() -> None:
    codes = [profile.indicator_code for profile in ECONOMIC_LENS_PROFILES]
    if len(codes) != 54 or len(set(codes)) != 54:
        raise RuntimeError("Expected the current canonical 54 economic indicators")
    async with httpx.AsyncClient(
        base_url=PRIVATE, timeout=75, limits=httpx.Limits(max_connections=12)
    ) as client:
        results = []
        for case in CASES:
            results.append(await compare(client, codes, case))
    print(json.dumps({
        "source": "Only disposable local CI database; strictly synthetic observations",
        "not_official_statistical_data": True,
        "limits_are_per_indicator": True,
        "full_54x_get_vs_batch_parity": True,
        "cases": results,
    }, indent=2, ensure_ascii=False))


if __name__ == "__main__":
    asyncio.run(main())
