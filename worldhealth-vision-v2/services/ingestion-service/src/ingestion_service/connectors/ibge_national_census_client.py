"""Brazil IBGE official aggregated national population — tightly scoped DATA-1A.

Sources:
  https://servicodados.ibge.gov.br/api/docs/agregados?versao=3
  https://www.ibge.gov.br/acesso-informacao/dados-abertos.html

THIS CLIENT IS NOT AN OFFICIAL-DATA VERIFICATION CERTIFICATE.
It fetches one declared national Census 2022 aggregate only. Other data,
levels, years and rights require explicit review before expansion.
"""
from __future__ import annotations

from dataclasses import dataclass, replace
from datetime import UTC, datetime
import hashlib
import json
import re
from typing import Any

import httpx

IBGE_BASE_URL = "https://servicodados.ibge.gov.br"
IBGE_AGGREGATE_ID = "4714"
IBGE_VARIABLE_ID = "93"
IBGE_REFERENCE_YEAR = 2022
IBGE_NATIONAL_LOCALITY_ID = "1"
IBGE_POPULATION_DATASET = "CENSO2022_4714"
IBGE_POPULATION_INDICATOR = "IBGE.CENSUS2022.RESIDENT_POP"
IBGE_DATA_PATH = "/api/v3/agregados/4714/periodos/2022/variaveis/93"
IBGE_QUERY = {"localidades": "N1[all]"}
MAX_BODY_BYTES = 1_000_000
INTEGER = re.compile(r"^[0-9]+$")


@dataclass(frozen=True)
class IbgeNationalPopulation:
    """A validated integer and its raw-response provenance, not a projection."""
    resident_population: int
    raw_payload: list[dict[str, Any]]
    raw_sha256: str
    http_body_sha256: str
    raw_response_bytes: bytes
    response_received_at_utc: str
    source_url: str
    source_variable_label: str
    source_unit_label: str
    http_status: int | None = None
    etag: str | None = None
    last_modified: str | None = None


def parse_ibge_national_population(
    payload: Any, *, original_http_bytes: bytes | None = None
) -> IbgeNationalPopulation:
    """Fail closed on aggregate, geography, year, unit, ambiguity or null values."""
    if not isinstance(payload, list) or len(payload) != 1:
        raise ValueError("IBGE Census response must contain exactly one variable")
    record = payload[0]
    if not isinstance(record, dict) or str(record.get("id")) != IBGE_VARIABLE_ID:
        raise ValueError("Unexpected IBGE variable (expected 93 population)")
    variable_label = record.get("variavel")
    unit = record.get("unidade")
    if not isinstance(variable_label, str) or "popula" not in variable_label.casefold():
        raise ValueError("IBGE population label absent or changed; review required")
    if not isinstance(unit, str) or unit.casefold() not in {"pessoas", "pessoa"}:
        raise ValueError("Population unit changed; do not reinterpret as persons")
    results = record.get("resultados")
    if not isinstance(results, list) or len(results) != 1:
        raise ValueError("Unexpected IBGE classification/results shape")
    result = results[0]
    if not isinstance(result, dict) or result.get("classificacoes") not in ([], None):
        raise ValueError("IBGE population must be unclassified total")
    series = result.get("series")
    if not isinstance(series, list) or len(series) != 1:
        raise ValueError("Expected exactly one Brazil national series")
    row = series[0]
    if not isinstance(row, dict):
        raise ValueError("Invalid IBGE series row")
    locality = row.get("localidade")
    if not isinstance(locality, dict) or str(locality.get("id")) != IBGE_NATIONAL_LOCALITY_ID:
        raise ValueError("Wrong IBGE locality: national Brazil only")
    level = locality.get("nivel")
    if not isinstance(level, dict) or str(level.get("id")) != "N1":
        raise ValueError("Wrong IBGE geography level: national N1 required")
    series_values = row.get("serie")
    if not isinstance(series_values, dict) or set(series_values) != {str(IBGE_REFERENCE_YEAR)}:
        raise ValueError("Expected only reference period 2022")
    raw = series_values[str(IBGE_REFERENCE_YEAR)]
    if not isinstance(raw, str) or not INTEGER.fullmatch(raw):
        raise ValueError("Missing, estimated, suppressed or non-integer population")
    population = int(raw)
    if not 100_000 <= population <= 500_000_000:
        raise ValueError("IBGE Census population outside reviewable bounds")
    canonical = json.dumps(payload, sort_keys=True, separators=(",", ":"), ensure_ascii=False).encode()
    if original_http_bytes is None:
        # Direct parser tests have no HTTP exchange; use canonical JSON.
        original_http_bytes = canonical
    else:
        try:
            original_decoded = json.loads(original_http_bytes.decode("utf-8"))
        except (UnicodeDecodeError, ValueError) as exc:
            raise ValueError("IBGE original HTTP bytes are not UTF-8 JSON") from exc
        if original_decoded != payload:
            raise ValueError("IBGE original bytes and normalized payload differ")
    return IbgeNationalPopulation(
        resident_population=population,
        raw_payload=payload,
        raw_sha256=hashlib.sha256(canonical).hexdigest(),
        http_body_sha256=hashlib.sha256(original_http_bytes).hexdigest(),
        raw_response_bytes=original_http_bytes,
        response_received_at_utc=datetime.now(UTC).isoformat(),
        source_url=IBGE_BASE_URL + IBGE_DATA_PATH + "?localidades=N1%5Ball%5D",
        source_variable_label=variable_label,
        source_unit_label=unit,
    )


class IbgeNationalCensusClient:
    """Pinned official host and one bounded endpoint; injected transport for tests."""

    def __init__(self, *, timeout_seconds: float = 25.0, transport: httpx.BaseTransport | None = None):
        if not 1 <= timeout_seconds <= 60:
            raise ValueError("Bound IBGE request timeout to 1..60s")
        self._timeout = timeout_seconds
        self._transport = transport

    def fetch_population_2022(self) -> IbgeNationalPopulation:
        with httpx.Client(
            base_url=IBGE_BASE_URL,
            timeout=self._timeout,
            follow_redirects=False,
            transport=self._transport,
            headers={"Accept": "application/json", "Accept-Encoding": "identity", "User-Agent": "World-Vision-DataResearch/1.0"},
        ) as client:
            with client.stream("GET", IBGE_DATA_PATH, params=IBGE_QUERY) as response:
                response.raise_for_status()
                response_etag = response.headers.get("etag")
                response_last_modified = response.headers.get("last-modified")
                content_type = response.headers.get("content-type", "").lower()
                if "application/json" not in content_type:
                    raise ValueError("IBGE returned non-JSON content")
                if response.headers.get("content-encoding", "identity").lower() not in ("identity", ""):
                    raise ValueError("Compressed IBGE response cannot be archived as plain JSON bytes")
                body = bytearray()
                # httpx.MockTransport may return an already-buffered Response;
                # a network response is streamed raw. Accept-Encoding identity
                # means both paths retain the exact uncompressed entity bytes.
                raw_chunks = (response.content,) if response.is_stream_consumed else response.iter_raw()
                for chunk in raw_chunks:
                    body.extend(chunk)
                    if len(body) > MAX_BODY_BYTES:
                        raise ValueError("IBGE response exceeds bounded-size contract")
        try:
            payload = json.loads(body)
        except (ValueError, UnicodeDecodeError) as exc:
            raise ValueError("IBGE JSON invalid") from exc
        parsed = parse_ibge_national_population(payload, original_http_bytes=bytes(body))
        return replace(parsed, http_status=200, etag=response_etag,
                       last_modified=response_last_modified)
