"""DATA-1B3: one pinned official WDI population observation as private evidence.

The legacy WorldBankClient fetches many countries and offers CSV ZIP fallback,
which is useful operationally but does not expose the exact HTTP entity bytes.
This narrow *research adapter* reuses the SAME BronzeStore and acquisition
journal as IBGE. It is not a parallel global ingestion engine or a public API.

Official metadata: https://databank.worldbank.org/metadataglossary/
world-development-indicators/series/SP.POP.TOTL
Indicator: total de facto resident population, *midyear estimate*, not a
second independent count of Brazil's 2022 census.
"""
from __future__ import annotations

from dataclasses import dataclass
from hashlib import sha256
import json
import math
from typing import Any

import httpx

WDI_SOURCE = "WORLD_BANK"
WDI_DATASET = "WDI_POP_TOTAL_BRA_2022"
WDI_INDICATOR = "SP.POP.TOTL"
WDI_BASE_URL = "https://api.worldbank.org"
WDI_PATH = "/v2/country/BRA/indicator/SP.POP.TOTL"
WDI_PARAMS = {"date": "2022", "format": "json", "source": "2"}
WDI_URL = WDI_BASE_URL + WDI_PATH + "?date=2022&format=json&source=2"
WDI_METHOD_URL = (
    "https://databank.worldbank.org/metadataglossary/"
    "world-development-indicators/series/SP.POP.TOTL"
)
_MAX_ENTITY_BYTES = 1_000_000


@dataclass(frozen=True)
class WdiPopulationSourceResponse:
    """Original WDI HTTP bytes + separately verified 2022 country row."""
    resident_midyear_estimate: int
    raw_response_bytes: bytes
    canonical_json_sha256: str
    http_body_sha256: str
    source_url: str
    observed_status_from_provider: str | None
    source_dataset_last_updated_label: str | None
    etag: str | None
    last_modified: str | None


def parse_wdi_brazil_2022_population(
    payload: Any, *, original_http_bytes: bytes,
    etag: str | None = None, last_modified: str | None = None,
) -> WdiPopulationSourceResponse:
    """Fail closed on scope, source, missing population, forecast or bad bytes."""
    if not isinstance(original_http_bytes, bytes) or not (
        1 <= len(original_http_bytes) <= _MAX_ENTITY_BYTES
    ):
        raise ValueError("WDI HTTP entity missing or exceeds bounded size")
    try:
        decoded = json.loads(original_http_bytes.decode("utf-8"))
    except (ValueError, UnicodeDecodeError) as exc:
        raise ValueError("WDI entity must be UTF-8 JSON") from exc
    if decoded != payload:
        raise ValueError("WDI parsed response differs from exact source bytes")
    if (not isinstance(payload, list) or len(payload) != 2
        or not isinstance(payload[0], dict) or not isinstance(payload[1], list)):
        raise ValueError("Unexpected WDI pagination response")
    meta, rows = payload
    if (str(meta.get("page")) != "1" or str(meta.get("pages")) != "1"
        or str(meta.get("total")) != "1" or len(rows) != 1):
        raise ValueError("WDI must return exactly one country/year observation")
    if meta.get("sourceid") is not None and str(meta["sourceid"]) != "2":
        raise ValueError("WDI source ID is not WDI / 2")
    row = rows[0]
    if not isinstance(row, dict):
        raise ValueError("WDI observation is not a structured object")
    indicator = row.get("indicator")
    country = row.get("country")
    if (not isinstance(indicator, dict)
        or indicator.get("id") != WDI_INDICATOR
        or not isinstance(country, dict)
        or country.get("id") not in ("BR", "BRA")
        or row.get("countryiso3code") != "BRA"
        or row.get("date") != "2022"):
        raise ValueError("WDI country, indicator or year differs from pinned Brazil 2022")
    status = row.get("obs_status")
    if status is not None and (not isinstance(status, str) or len(status) > 20):
        raise ValueError("Unexpected WDI provider observation status")
    if str(status or "").strip().upper() == "F":
        raise ValueError("Forecast cannot be treated as 2022 population estimate")
    number = row.get("value")
    if isinstance(number, bool) or not isinstance(number, (int, float)):
        raise ValueError("Missing or non-numeric WDI population")
    if isinstance(number, float) and (not math.isfinite(number) or not number.is_integer()):
        raise ValueError("WDI population cannot be fractional or non-finite")
    if not 100_000_000 <= number <= 400_000_000:
        raise ValueError("WDI Brazil population outside pilot review bounds")
    updated = meta.get("lastupdated")
    if updated is not None and (not isinstance(updated, str) or len(updated) > 80):
        raise ValueError("Unexpected WDI dataset update label")
    canonical = json.dumps(
        payload, ensure_ascii=False, sort_keys=True, separators=(",", ":")
    ).encode("utf-8")
    return WdiPopulationSourceResponse(
        resident_midyear_estimate=int(number),
        raw_response_bytes=original_http_bytes,
        canonical_json_sha256=sha256(canonical).hexdigest(),
        http_body_sha256=sha256(original_http_bytes).hexdigest(),
        source_url=WDI_URL,
        observed_status_from_provider=status,
        source_dataset_last_updated_label=updated,
        etag=etag,
        last_modified=last_modified,
    )


class WdiPopulation2022ResearchClient:
    """Single no-redirect, no-credential WDI JSON GET; explicit failure only.

    The general WorldBankClient already implements broad sourcing and CSV ZIP
    fallback. A fallback is *deliberately forbidden here*: the objective is
    byte-level provenance for a precisely defined comparison.
    """
    def __init__(self, *, timeout_seconds: float = 25,
                 transport: httpx.BaseTransport | None = None):
        if not 1 <= timeout_seconds <= 60:
            raise ValueError("WDI research timeout must be bounded 1..60 seconds")
        self._timeout_seconds = timeout_seconds
        self._transport = transport

    def fetch_population_2022(self) -> WdiPopulationSourceResponse:
        with httpx.Client(
            base_url=WDI_BASE_URL, timeout=self._timeout_seconds,
            follow_redirects=False, transport=self._transport,
            headers={
                "Accept": "application/json",
                "Accept-Encoding": "identity",
                "User-Agent": "World-Vision-DataResearch/1.0",
            },
        ) as client:
            with client.stream("GET", WDI_PATH, params=WDI_PARAMS) as response:
                response.raise_for_status()
                if response.status_code != 200:
                    raise ValueError("WDI response status not 200")
                if "application/json" not in response.headers.get("content-type", "").lower():
                    raise ValueError("WDI returned non-JSON content")
                if response.headers.get("content-encoding", "identity").lower() not in ("identity", ""):
                    raise ValueError("Compressed source rejected for exact-byte JSON evidence")
                etag, modified = response.headers.get("etag"), response.headers.get("last-modified")
                body = bytearray()
                chunks = (response.content,) if response.is_stream_consumed else response.iter_raw()
                for chunk in chunks:
                    body.extend(chunk)
                    if len(body) > _MAX_ENTITY_BYTES:
                        raise ValueError("Official WDI response exceeds bounded size")
        if not body:
            raise ValueError("Empty official WDI response")
        try:
            payload = json.loads(body.decode("utf-8"))
        except (ValueError, UnicodeDecodeError) as exc:
            raise ValueError("Invalid official WDI JSON") from exc
        return parse_wdi_brazil_2022_population(
            payload, original_http_bytes=bytes(body), etag=etag,
            last_modified=modified,
        )
