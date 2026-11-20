"""INSEE Melodi, ONE pinned 2023 municipal-population RESEARCH observation.

This connector cannot publish or mint rights. It is deliberately restricted to
the officially documented DS_POPULATIONS_REFERENCE, GEO=FRANCE-F, PMUN, 2023.
Insee describes the dataset's scope as France hors Mayotte (FEHM), with 2025
geographic boundaries. The value is NOT automatically the FRA population total.
https://www.insee.fr/fr/statistiques/8681011
https://www.insee.fr/fr/information/8184173
https://inseefrlab.github.io/melodi/reference/get_data.html
"""
from __future__ import annotations

from dataclasses import dataclass, replace
from datetime import UTC, datetime
from hashlib import sha256
import math
import json
import re
from typing import Any

import httpx


INSEE_BASE_URL = "https://api.insee.fr"
MELODI_PATH = "/melodi/data/DS_POPULATIONS_REFERENCE"
DATASET = "DS_POPULATIONS_REFERENCE"
SOURCE = "INSEE"
MEASURE = "PMUN"
YEAR = "2023"
GEOGRAPHY_FILTER = "FRANCE-F"
PINNED_GEO = "2025-FRANCE-F"
GEO_SCOPE = "France hors Mayotte, communal boundaries 2025"
QUERY = {"GEO": GEOGRAPHY_FILTER, "POPREF_MEASURE": MEASURE,
         "TIME_PERIOD": YEAR, "maxResult": "10"}
SOURCE_URL = (INSEE_BASE_URL + MELODI_PATH +
              "?GEO=FRANCE-F&POPREF_MEASURE=PMUN&TIME_PERIOD=2023&maxResult=10")
MAX_RAW_BYTES = 256_000
MAX_ROWS = 10
# Independent, PUBLISHED INSEE 2023 municipality count (not a live API claim).
# Source: INSEE Populations de référence 2023, France hors Mayotte,
# https://www.insee.fr/fr/statistiques/8681011
REVIEWED_REFERENCE_PMUN = 68_094_280


@dataclass(frozen=True)
class InseePrivateMunicipalPopulation:
    """Statistical reference with provenance; private, NEVER publication status."""
    municipal_population: int
    source_geo: str
    reference_year: int
    source_measure: str
    raw_bytes: bytes
    raw_sha256: str
    canonical_sha256: str
    fetched_at_utc: str
    source_url: str
    etag: str | None = None
    last_modified: str | None = None


def _extract(row: Any, field: str) -> Any:
    if not isinstance(row, dict):
        raise ValueError("Melodi observation is not a JSON object")
    return row.get(field)


def parse_private_insee_population(payload: Any, *, original_http_bytes: bytes
                                   ) -> InseePrivateMunicipalPopulation:
    """Fail closed on geography, municipal-vs-total, reference year or missing.
    Uses the same Melodi observations structure as the published melodi client,
    not a flat SDMX data model invented for this pipeline.
    """
    if not isinstance(original_http_bytes, bytes) or not (
            1 <= len(original_http_bytes) <= MAX_RAW_BYTES):
        raise ValueError("Original provider body outside fixed byte budget")
    try:
        original = json.loads(original_http_bytes.decode("utf-8"))
    except (UnicodeDecodeError, ValueError) as error:
        raise ValueError("Malformed Melodi original JSON") from error
    if original != payload or not isinstance(payload, dict):
        raise ValueError("Original Melodi bytes differ from decoded response")
    observations = payload.get("observations")
    if not isinstance(observations, list) or len(observations) != 1:
        # Never silently keep the first record or accidentally sum PTOT/PMUN.
        raise ValueError("Exactly one municipal population observation required")
    row = observations[0]
    dimensions = _extract(row, "dimensions")
    measures = _extract(row, "measures")
    attrs = _extract(row, "attributes")
    if not isinstance(dimensions, dict) or not isinstance(measures, dict):
        raise ValueError("Melodi missing dimensions or measures")
    if (
        dimensions.get("GEO") != PINNED_GEO
        or str(dimensions.get("TIME_PERIOD")) != YEAR
        or dimensions.get("POPREF_MEASURE") != MEASURE
        or dimensions.get("FREQ") != "A"
    ):
        raise ValueError("Melodi series is NOT the pinned municipal, FEHM, 2023 scope")
    if attrs is not None and not isinstance(attrs, dict):
        raise ValueError("Melodi attributes must be documented JSON")
    if isinstance(attrs, dict):
        # A confidentiality/suppression marker always blocks private numeric
        # capture too. Unknown statuses require human review, not a guess.
        for field in ("CONF_STATUS", "OBS_STATUS"):
            state = attrs.get(field)
            if isinstance(state, dict):
                state = state.get("value")
            if state is not None and str(state).strip() not in ("", "F", "A", "D"):
                raise ValueError("Unreviewed Melodi status or confidentiality marker")
    value_record = measures.get("OBS_VALUE_NIVEAU")
    if not isinstance(value_record, dict) or set(value_record) - {"value", "unit", "decimals"}:
        raise ValueError("Changed Melodi numeric measure schema")
    value = value_record.get("value")
    # Melodi JSON can use 68094280.0 for an integral number of persons.
    # IEEE-754 represents all integers below 2**53 exactly; the population
    # bounds below are much tighter. Accept only *mathematically* integral
    # floats, never coerce a fractional or missing observation by rounding.
    valid_integer = (
        (isinstance(value, int) and not isinstance(value, bool))
        or (isinstance(value, str) and re.fullmatch(r"[0-9]+", value) is not None)
        or (isinstance(value, float) and value.is_integer()
            and math.isfinite(value) and abs(value) <= 2**53)
    )
    if not valid_integer:
        # Error includes ONLY schema types/keys, never provider numbers or body.
        field_shape = type(value).__name__
        available_keys = ",".join(sorted(value_record))
        raise ValueError(
            "Missing, suppressed, fractional or invalid municipal count "
            + "(type=" + field_shape + "; measureFields=" + available_keys + ")"
        )
    population = int(value)
    if not 1_000_000 <= population <= 100_000_000:
        raise ValueError("Insee 2023 municipal value outside reviewable range")
    # A change in a declared historical reference must be reviewed as a new
    # revision, not auto-labelled equivalent and silently republished.
    if population != REVIEWED_REFERENCE_PMUN:
        raise ValueError("Pinned official 2023 municipal reference changed; review source revision")
    canonical = json.dumps(payload, ensure_ascii=False, sort_keys=True,
                           separators=(",", ":")).encode("utf-8")
    return InseePrivateMunicipalPopulation(
        municipal_population=population, source_geo=PINNED_GEO,
        reference_year=int(YEAR), source_measure=MEASURE,
        raw_bytes=original_http_bytes, raw_sha256=sha256(original_http_bytes).hexdigest(),
        canonical_sha256=sha256(canonical).hexdigest(),
        fetched_at_utc=datetime.now(UTC).isoformat(), source_url=SOURCE_URL,
    )


class InseePrivatePopulationClient:
    """One exact official HTTPS GET, no redirects, custom hosts or public writes."""

    def __init__(self, *, transport: httpx.BaseTransport | None = None,
                 timeout_seconds: float = 20.0):
        if not 1 <= timeout_seconds <= 40:
            raise ValueError("Pinned Melodi timeout must be 1..40 seconds")
        self._transport = transport
        self._timeout = timeout_seconds

    def fetch(self) -> InseePrivateMunicipalPopulation:
        with httpx.Client(
            base_url=INSEE_BASE_URL, timeout=self._timeout,
            follow_redirects=False, transport=self._transport,
            headers={
                "Accept": "application/json",
                "Accept-Encoding": "identity",
                "User-Agent": "World-Vision-P2C3A-PrivateResearch/1.0",
            },
        ) as client:
            with client.stream("GET", MELODI_PATH, params=QUERY) as response:
                if response.status_code != 200:
                    response.raise_for_status()
                    raise ValueError("Provider returned unexpected non-200 result")
                if str(response.request.url) != SOURCE_URL:
                    raise ValueError("Melodi URL changed unexpectedly")
                if "application/json" not in response.headers.get("content-type", "").lower():
                    raise ValueError("Melodi returned unexpected response media type")
                if response.headers.get("content-encoding", "identity").lower() not in (
                    "identity", "",
                ):
                    raise ValueError("Compressed source bytes require a reviewed receiver")
                data = bytearray()
                # MockTransport can return an already-buffered Response; real
                # responses stream raw bytes. Identity encoding ensures both
                # paths retain the same HTTP entity bytes for the Bronze SHA.
                raw_chunks = ((response.content,) if response.is_stream_consumed
                              else response.iter_raw())
                for chunk in raw_chunks:
                    data.extend(chunk)
                    if len(data) > MAX_RAW_BYTES:
                        raise ValueError("Melodi body exceeds private fixed-byte budget")
                etag, last_modified = response.headers.get("etag"), response.headers.get("last-modified")
        try:
            decoded = json.loads(bytes(data).decode("utf-8"))
        except (UnicodeDecodeError, ValueError) as error:
            raise ValueError("Invalid provider response encoding") from error
        validated = parse_private_insee_population(
            decoded, original_http_bytes=bytes(data))
        return replace(validated, etag=etag, last_modified=last_modified)
