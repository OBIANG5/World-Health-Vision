#!/usr/bin/env python3
"""Build a reviewable COUNTRY METADATA snapshot from the World Bank Country API.

No indicator series, population/GDP figures, private data, premium news, or
World-Vision ingest permissions are copied. A World Bank 'economy' is NOT an
assertion of sovereign statehood or membership of the WHV canonical 217.
This is a reproducible, explicitly attributed static fall-back, not live data.

Usage:
  python scripts/build-world-bank-country-catalog.py --output /tmp/whv-wb.json
  python scripts/build-world-bank-country-catalog.py --input fixture.json --output /tmp/whv-wb.json
"""
from __future__ import annotations

import argparse
from datetime import datetime, timezone
import hashlib
import json
from pathlib import Path
import re
from typing import Any
from urllib.request import Request, urlopen
from urllib.parse import urlparse

COUNTRIES_URL = "https://api.worldbank.org/v2/country?format=json&per_page=400"
TERMS_URL = "https://www.worldbank.org/ext/en/legal/terms-conditions/datasets"
MAX_BYTES = 2_000_000
ISO3 = re.compile(r"^[A-Z]{3}$")
ISO2 = re.compile(r"^[A-Z]{2}$")


def clean_string(value: Any, limit: int = 150) -> str:
    if not isinstance(value, str):
        return ""
    return " ".join(value.split())[:limit]


def code(value: Any, pattern: re.Pattern[str]) -> str:
    result = clean_string(value, 5)
    return result if pattern.fullmatch(result) else ""


def build_snapshot(payload: Any, fetched_at: str, upstream_sha256: str) -> dict:
    if (not isinstance(payload, list) or len(payload) != 2
            or not isinstance(payload[0], dict) or not isinstance(payload[1], list)):
        raise ValueError("Unexpected World Bank API envelope")
    meta, rows = payload
    total = meta.get("total")
    if not isinstance(total, int) or total < len(rows) or total > 400:
        raise ValueError("World Bank pagination or total changed; refuse partial feed")
    if meta.get("pages") != 1 or len(rows) != total:
        raise ValueError("Country metadata response is not complete; refuse snapshot")
    result = []
    seen: set[str] = set()
    aggregates = 0
    omitted = 0
    for row in rows:
        if not isinstance(row, dict):
            raise ValueError("Invalid country row")
        region = row.get("region")
        if not isinstance(region, dict):
            raise ValueError("Missing World Bank geographic classification")
        if region.get("id") == "NA" or clean_string(region.get("value")) == "Aggregates":
            aggregates += 1
            continue
        ident = code(row.get("id"), ISO3)
        iso2 = code(row.get("iso2Code"), ISO2)
        name = clean_string(row.get("name"))
        region_code = clean_string(region.get("id"), 8)
        region_name = clean_string(region.get("value"))
        if not ident or not iso2 or not name or not region_code or not region_name:
            omitted += 1
            continue
        if ident in seen:
            raise ValueError(f"Duplicate World Bank economy code {ident}")
        seen.add(ident)
        income = row.get("incomeLevel") or {}
        if not isinstance(income, dict):
            raise ValueError(f"Invalid income classification for {ident}")
        result.append({
            "iso3": ident,
            "iso2": iso2,
            "displayName": name,
            "regionCode": region_code,
            "regionName": region_name,
            "capitalCity": clean_string(row.get("capitalCity"), 120) or None,
            "incomeLevelCode": clean_string(income.get("id"), 8) or None,
            "incomeLevelName": clean_string(income.get("value")) or None,
        })
    result.sort(key=lambda row: row["iso3"])
    if len(result) < 190 or len(result) > 270:
        raise ValueError(f"Unexpected World Bank economy count {len(result)}")
    for iso3, capital in (("GAB", "Libreville"), ("FRA", "Paris"),
                          ("BRA", "Brasilia"), ("CIV", "Yamoussoukro")):
        matches = [r for r in result if r["iso3"] == iso3]
        if len(matches) != 1 or matches[0]["capitalCity"] != capital:
            raise ValueError(f"World Bank source changed unexpectedly for {iso3}; manual review required")
    return {
        "schemaVersion": 1,
        "dataset": "WORLD_BANK_COUNTRY_METADATA",
        "sourceUrl": COUNTRIES_URL,
        "termsUrl": TERMS_URL,
        "fetchedAtUtc": fetched_at,
        "upstreamSha256": upstream_sha256,
        "upstreamEntryCount": total,
        "aggregateExcludedCount": aggregates,
        "otherExcludedCount": omitted,
        "countryEntryCount": len(result),
        "scope": "World Bank economies and territories only; NOT sovereign states, NOT the World-Vision canonical country register.",
        "items": result,
    }


def read_upstream() -> bytes:
    parsed = urlparse(COUNTRIES_URL)
    if parsed.scheme != "https" or parsed.netloc != "api.worldbank.org":
        raise ValueError("Remote host must be the official World Bank API")
    request = Request(COUNTRIES_URL, headers={
        "Accept": "application/json",
        "User-Agent": "World-Vision-Metadata-Snapshot/1.0 (attributed read-only)",
    })
    with urlopen(request, timeout=25) as response:
        final = urlparse(response.geturl())
        if final.scheme != "https" or final.netloc != "api.worldbank.org":
            raise ValueError("World Bank metadata redirected to unexpected host")
        raw = response.read(MAX_BYTES + 1)
    if not raw or len(raw) > MAX_BYTES:
        raise ValueError("Country API payload missing or exceeds maximum size")
    return raw


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--input", type=Path, help="Use an archived API response for deterministic tests")
    parser.add_argument("--output", type=Path, required=True)
    args = parser.parse_args()
    raw = args.input.read_bytes() if args.input else read_upstream()
    snapshot = build_snapshot(
        json.loads(raw),
        datetime.now(timezone.utc).isoformat(timespec="seconds").replace("+00:00", "Z"),
        hashlib.sha256(raw).hexdigest(),
    )
    args.output.parent.mkdir(parents=True, exist_ok=True)
    args.output.write_text(json.dumps(snapshot, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(f"WORLD_BANK_COUNTRY_METADATA {snapshot['countryEntryCount']} economies/territories; "
          f"{snapshot['aggregateExcludedCount']} aggregates excluded; "
          f"{snapshot['otherExcludedCount']} other entries excluded; "
          f"asOf={snapshot['fetchedAtUtc']}; sha={snapshot['upstreamSha256']}")
    print("This is geographic metadata, not indicator access rights, real-time data or proof of 217-country coverage.")


if __name__ == "__main__":
    main()
