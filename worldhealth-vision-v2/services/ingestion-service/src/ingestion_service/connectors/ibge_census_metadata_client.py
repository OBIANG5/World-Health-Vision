"""DATA-1B2A: pinned, bounded IBGE official metadata and census-period evidence.

This client does NOT infer publication date, license, statistical comparability,
or current-year population from metadata. It never writes to public Timeseries.
"""
from __future__ import annotations

from dataclasses import dataclass
from hashlib import sha256
import json
from typing import Any

import httpx

from ingestion_service.connectors.ibge_national_census_client import IBGE_BASE_URL

_METADATA_PATH = "/api/v3/agregados/4714/metadados"
_PERIODS_PATH = "/api/v3/agregados/4714/periodos"
IBGE_METADATA_URL = IBGE_BASE_URL + _METADATA_PATH
IBGE_PERIODS_URL = IBGE_BASE_URL + _PERIODS_PATH
_MAX_RESPONSE_BYTES = 1_000_000


@dataclass(frozen=True)
class SourceJsonEvidence:
    """Validated provider payload with exact undecoded HTTP entity bytes."""
    source_url: str
    raw_response_bytes: bytes
    canonical_json_sha256: str
    http_body_sha256: str
    payload: Any
    http_status: int = 200
    etag: str | None = None
    last_modified: str | None = None


class IbgeProviderHttpError(ValueError):
    """Sanitized HTTP failure; retain code, never source body in exception."""

    def __init__(self, http_status: int):
        self.http_status = http_status
        super().__init__("IBGE metadata HTTP response was not 200")


@dataclass(frozen=True)
class IbgeCensusMetadata:
    """Narrow 2022 national contract; revision date and reuse rights are unknown."""
    aggregate: SourceJsonEvidence
    periods: SourceJsonEvidence
    table_id: str
    variable_id: str
    reference_year: int
    country_iso3: str
    geographic_level: str
    source_unit: str
    provider_modification_field: Any


def _canonical_hash(payload: Any) -> str:
    return sha256(json.dumps(
        payload, ensure_ascii=False, sort_keys=True, separators=(",", ":")
    ).encode("utf-8")).hexdigest()


def validate_aggregate_metadata(payload: Any) -> dict[str, Any]:
    if not isinstance(payload, dict) or str(payload.get("id")) != "4714":
        raise ValueError("IBGE metadata must describe exactly aggregate 4714")
    variables = payload.get("variaveis")
    if not isinstance(variables, list) or not (1 <= len(variables) <= 40):
        raise ValueError("IBGE metadata variables missing or unbounded")
    population = [v for v in variables if isinstance(v, dict) and str(v.get("id")) == "93"]
    if len(population) != 1:
        raise ValueError("Population variable 93 absent or ambiguous")
    variable = population[0]
    unit = variable.get("unidade")
    if not isinstance(unit, str) or unit.casefold() not in ("pessoas", "pessoa"):
        raise ValueError("IBGE population unit changed, manual review required")
    label = variable.get("nome")
    if not isinstance(label, str) or "popula" not in label.casefold():
        raise ValueError("Variable 93 is not labelled population")
    territory = payload.get("nivelTerritorial")
    administrative = territory.get("Administrativo") if isinstance(territory, dict) else None
    if not isinstance(administrative, list) or "N1" not in administrative:
        raise ValueError("Official national N1 geography is not declared")
    if not isinstance(payload.get("nome"), str) or not payload["nome"].strip():
        raise ValueError("Aggregate title missing")
    if not isinstance(payload.get("pesquisa"), str) or not payload["pesquisa"].strip():
        raise ValueError("Research identity missing")
    return variable


def validate_aggregate_periods(payload: Any) -> dict[str, Any]:
    if not isinstance(payload, list) or not (1 <= len(payload) <= 100):
        raise ValueError("Official aggregate periods response invalid")
    seen: set[str] = set()
    census = None
    for period in payload:
        if not isinstance(period, dict):
            raise ValueError("Invalid provider period row")
        identifier = period.get("id")
        if not isinstance(identifier, (str, int)):
            raise ValueError("Provider period identifier missing")
        code = str(identifier)
        if code in seen:
            raise ValueError("Duplicated period code")
        seen.add(code)
        if code == "2022":
            census = period
    if census is None:
        raise ValueError("2022 absent from official aggregate period listing")
    # 'modificacao' may be a metadata-modification signal. Preserve it exactly.
    # Neither publication date nor revision version is implied from this field.
    return census


class IbgeCensusMetadataClient:
    """Only two fixed official HTTPS paths; never accept arbitrary URLs."""

    def __init__(self, *, timeout_seconds: float = 25, transport: httpx.BaseTransport | None = None):
        if not 1 <= timeout_seconds <= 60:
            raise ValueError("Bound official metadata request timeout to 1..60 seconds")
        self._timeout = timeout_seconds
        self._transport = transport

    def _get(self, path: str) -> SourceJsonEvidence:
        if path not in (_METADATA_PATH, _PERIODS_PATH):
            raise ValueError("Unapproved metadata endpoint")
        with httpx.Client(
            base_url=IBGE_BASE_URL,
            follow_redirects=False,
            timeout=self._timeout,
            transport=self._transport,
            headers={
                "Accept": "application/json",
                "Accept-Encoding": "identity",
                "User-Agent": "World-Vision-DataResearch/1.0",
            },
        ) as client:
            with client.stream("GET", path) as response:
                if response.status_code != 200:
                    raise IbgeProviderHttpError(response.status_code)
                if "application/json" not in response.headers.get("content-type", "").lower():
                    raise ValueError("IBGE metadata is not JSON")
                if response.headers.get("content-encoding", "identity").lower() not in ("", "identity"):
                    raise ValueError("Compressed provider metadata rejected")
                etag = response.headers.get("etag")
                last_modified = response.headers.get("last-modified")
                content = bytearray()
                chunks = (response.content,) if response.is_stream_consumed else response.iter_raw()
                for chunk in chunks:
                    content.extend(chunk)
                    if len(content) > _MAX_RESPONSE_BYTES:
                        raise ValueError("Official metadata response too large")
        if not content:
            raise ValueError("Empty official metadata response")
        try:
            parsed = json.loads(content.decode("utf-8"))
        except (UnicodeDecodeError, ValueError) as exc:
            raise ValueError("Malformed provider metadata JSON") from exc
        exact = bytes(content)
        return SourceJsonEvidence(
            source_url=IBGE_BASE_URL + path,
            raw_response_bytes=exact,
            canonical_json_sha256=_canonical_hash(parsed),
            http_body_sha256=sha256(exact).hexdigest(),
            payload=parsed,
            http_status=200,
            etag=etag,
            last_modified=last_modified,
        )

    def fetch_aggregate_metadata(self) -> SourceJsonEvidence:
        evidence = self._get(_METADATA_PATH)
        validate_aggregate_metadata(evidence.payload)
        return evidence

    def fetch_official_periods(self) -> SourceJsonEvidence:
        evidence = self._get(_PERIODS_PATH)
        validate_aggregate_periods(evidence.payload)
        return evidence

    @staticmethod
    def combine_contract(aggregate: SourceJsonEvidence, periods: SourceJsonEvidence) -> IbgeCensusMetadata:
        variable = validate_aggregate_metadata(aggregate.payload)
        period_2022 = validate_aggregate_periods(periods.payload)
        return IbgeCensusMetadata(
            aggregate=aggregate,
            periods=periods,
            table_id="4714",
            variable_id="93",
            reference_year=2022,
            country_iso3="BRA",
            geographic_level="N1",
            source_unit=variable["unidade"],
            provider_modification_field=period_2022.get("modificacao"),
        )

    def fetch_census2022_contract(self) -> IbgeCensusMetadata:
        # Preserve the original public method for existing tests/callers.
        return self.combine_contract(
            self.fetch_aggregate_metadata(), self.fetch_official_periods()
        )
