"""P2C3 — Insee Melodi FIRST NATIONAL SERIES, private research / fail closed.

OFFICIAL provider https://api.insee.fr/melodi.
Pinned dataset DS_POPULATIONS_REFERENCE and exact query GEO=FRANCE-F,
POPREF_MEASURE=PTOT; DO NOT ASSUME FRA geospatial/statistical equivalence.
A catalogue, a general Licence Ouverte or an API response are NOT a signed
World-Vision grant. This code has ZERO Timeseries publishing calls.

Dataset metadata, source statuses, unit, method, revisions and redistribution
rights must be examined before an authorized public connector may be written.
Live network is opt-in only and no generic provider URL may be supplied.
"""
from __future__ import annotations

from dataclasses import dataclass
from datetime import UTC, datetime
from hashlib import sha256
import json
import math
from pathlib import Path
import re
from urllib.parse import parse_qs, urlsplit
from typing import Any

import httpx

from ingestion_service.source_evidence_store import (
    EvidenceIntegrityError, QuarantinedJsonEvidenceStore, _canonical_hash,
)

SOURCE_CODE = "INSEE"
DATASET_CODE = "DS_POPULATIONS_REFERENCE"
MEASURE_CODE = "PTOT"  # population totale, NOT municipal population PMUN
GEO_FILTER = "FRANCE-F"  # official Melodi geometry, NOT inferred ISO3
API_HOST = "https://api.insee.fr"
API_PATH = "/melodi/data/DS_POPULATIONS_REFERENCE"
PROBE_PARAMS = {"GEO": GEO_FILTER, "POPREF_MEASURE": MEASURE_CODE, "maxResult": "20"}
MAX_BODY_BYTES = 500_000
MAX_OBSERVATIONS = 20
YEAR_RE = re.compile(r"^(?:19|20)\d{2}$")
CODE_RE = re.compile(r"^[A-Za-z0-9_.-]{1,96}$")


@dataclass(frozen=True)
class MelodiPopulationEvidence:
    """Citable *research* observation, not normalized Timeseries publication."""
    source_url: str
    dataset_code: str
    measure_code: str
    geo_filter: str
    geo_reference: str | None
    year: int
    population_total: int
    population_type: str
    raw_response_bytes: bytes
    original_http_sha256: str
    observed_status: str | None
    confidentiality_status: str | None
    fetched_at_utc: str
    etag: str | None
    last_modified: str | None


def _dimension(raw: dict[str, Any], name: str) -> str | None:
    if name not in raw:
        return None
    value = raw[name]
    # The Melodi JSON API's dimensions map may hold plain codes or objects
    # with a code/id. Any other shape must be reviewed, not guessed.
    if isinstance(value, dict):
        if "id" in value:
            value = value["id"]
        elif "value" in value:
            value = value["value"]
        else:
            raise EvidenceIntegrityError("Unreviewed Melodi dimension structure")
    if value is None:
        return None
    if not isinstance(value, str) or len(value) > 96:
        raise EvidenceIntegrityError("Unreviewed Melodi dimension value")
    return value


def _required(raw: dict[str, Any], key: str) -> str:
    value = _dimension(raw, key)
    if not value:
        raise EvidenceIntegrityError("Missing expected Melodi dimension: " + key)
    return value


def _positive_integer(value: Any) -> int:
    # No coercion of a decimal, an estimate flag or a suppressed value into a
    # census population. Exact integer representation is required.
    if isinstance(value, bool):
        raise EvidenceIntegrityError("Invalid boolean Melodi population")
    if isinstance(value, str):
        if not re.fullmatch(r"[0-9]{1,12}", value):
            raise EvidenceIntegrityError("Non-integer or suppressed Melodi population")
        number = int(value)
    elif isinstance(value, int):
        number = value
    else:
        raise EvidenceIntegrityError("Melodi population must be an integer or integer string")
    if not 1 <= number <= 200_000_000:
        raise EvidenceIntegrityError("Melodi value outside reviewed population bounds")
    return number


def _validate_exact_official_url(url: str) -> None:
    try:
        parsed = urlsplit(url)
        query = parse_qs(parsed.query, strict_parsing=True, keep_blank_values=True)
    except (ValueError, TypeError) as error:
        raise EvidenceIntegrityError("Invalid source evidence URL") from error
    if (
        parsed.scheme != "https" or parsed.hostname != "api.insee.fr"
        or parsed.port is not None or parsed.username is not None
        or parsed.password is not None or parsed.fragment
        or parsed.path != API_PATH
        or query != {key: [value] for key, value in PROBE_PARAMS.items()}
    ):
        raise EvidenceIntegrityError("Provider provenance is not the exact allowlisted research request")


def _unique_key_pairs(pairs: list[tuple[str, Any]]) -> dict[str, Any]:
    result: dict[str, Any] = {}
    for key, value in pairs:
        if key in result:
            raise EvidenceIntegrityError("Duplicate fields in official source response")
        result[key] = value
    return result


def _reject_nonfinite(value: str) -> None:
    raise EvidenceIntegrityError("Nonfinite JSON tokens are not valid source measurements")


def parse_reference_population(
    body: bytes, *, source_url: str, fetched_at_utc: str,
    etag: str | None = None, last_modified: str | None = None,
) -> list[MelodiPopulationEvidence]:
    _validate_exact_official_url(source_url)
    if not isinstance(body, bytes) or not 1 <= len(body) <= MAX_BODY_BYTES:
        raise EvidenceIntegrityError("Empty/oversize original Insee response")
    try:
        raw = json.loads(
            body.decode("utf-8"),
            object_pairs_hook=_unique_key_pairs,
            parse_constant=_reject_nonfinite,
        )
    except (UnicodeDecodeError, ValueError) as err:
        raise EvidenceIntegrityError("Insee response is not valid unambiguous UTF-8 JSON") from err
    if not isinstance(raw, dict) or not isinstance(raw.get("observations"), list):
        raise EvidenceIntegrityError("Melodi response structure changed: observations absent")
    rows = raw["observations"]
    if not 1 <= len(rows) <= MAX_OBSERVATIONS:
        raise EvidenceIntegrityError("Unexpected Insee page size; pagination/review required")
    if raw.get("next") or raw.get("nextPage") or raw.get("hasMore") is True:
        raise EvidenceIntegrityError("Unreviewed Melodi pagination, no partial dataset claim")
    observed: list[MelodiPopulationEvidence] = []
    seen_periods: set[int] = set()
    for row in rows:
        if not isinstance(row, dict):
            raise EvidenceIntegrityError("Invalid Melodi observation")
        dimensions = row.get("dimensions")
        measures = row.get("measures")
        if not isinstance(dimensions, dict) or not isinstance(measures, dict):
            raise EvidenceIntegrityError("Missing structured Melodi dimension/measures")
        if _required(dimensions, "GEO") != GEO_FILTER:
            raise EvidenceIntegrityError("Unexpected geography: cannot treat foreign/metro territories as FRA")
        if _required(dimensions, "POPREF_MEASURE") != MEASURE_CODE:
            raise EvidenceIntegrityError("Municipal population is not total population (PTOT)")
        if _required(dimensions, "FREQ") != "A":
            raise EvidenceIntegrityError("Expected annual reference population")
        year_text = _required(dimensions, "TIME_PERIOD")
        if not YEAR_RE.fullmatch(year_text):
            raise EvidenceIntegrityError("Unexpected reference period")
        year = int(year_text)
        if year in seen_periods:
            raise EvidenceIntegrityError("More than one total population for same territory/year")
        seen_periods.add(year)
        geo_reference = _dimension(dimensions, "GEO_REF")
        obj = _dimension(dimensions, "GEO_OBJECT")
        if obj not in (None, "FRANCE"):
            raise EvidenceIntegrityError("GEO_OBJECT not national FRANCE")
        if geo_reference is not None and not re.fullmatch(r"20\d{2}", geo_reference):
            raise EvidenceIntegrityError("GEO_REF not a recognized annual year")

        measure = measures.get("OBS_VALUE_NIVEAU")
        if not isinstance(measure, dict) or "value" not in measure:
            raise EvidenceIntegrityError("Melodi OBS_VALUE_NIVEAU schema not verified")
        population = _positive_integer(measure["value"])
        status = _dimension(row, "OBS_STATUS") or _dimension(dimensions, "OBS_STATUS")
        confidentiality = (
            _dimension(row, "CONF_STATUS") or _dimension(dimensions, "CONF_STATUS")
        )
        if status is not None and status not in {"A"}:
            raise EvidenceIntegrityError("Source statistical status requires manual review")
        if confidentiality is not None and confidentiality not in {"F"}:
            # An unknown confidentiality code is NOT evidence of free
            # redistribution. Reject until verified with Insee metadata.
            raise EvidenceIntegrityError("Confidentiality status requires manual review")
        observed.append(MelodiPopulationEvidence(
            source_url=source_url, dataset_code=DATASET_CODE,
            measure_code=MEASURE_CODE, geo_filter=GEO_FILTER,
            geo_reference=geo_reference, year=year,
            population_total=population, population_type="LEGAL_TOTAL_UNREVIEWED",
            raw_response_bytes=body, original_http_sha256=sha256(body).hexdigest(),
            observed_status=status, confidentiality_status=confidentiality,
            fetched_at_utc=fetched_at_utc, etag=etag, last_modified=last_modified,
        ))
    return sorted(observed, key=lambda x: x.year)


class InseeMelodiReferenceResearchClient:
    """Allowlisted, research-only live GET. Live OFF by default.

    No arbitrary endpoint, cookie, bearer token, redirect, publisher or POST.
    API latency/quota are bounded; 429 is an error (do not retry aggressively).
    """
    def __init__(
        self, *, allow_live: bool = False, timeout_seconds: float = 15.0,
        transport: httpx.BaseTransport | None = None,
    ) -> None:
        if not 1 <= timeout_seconds <= 30:
            raise ValueError("Insee research timeout must be bounded")
        self._live = allow_live
        self._timeout = timeout_seconds
        self._transport = transport

    def fetch(self) -> list[MelodiPopulationEvidence]:
        if not self._live:
            raise PermissionError("Insee network disabled until explicit read-only probe")
        with httpx.Client(
            base_url=API_HOST,
            timeout=self._timeout,
            follow_redirects=False, transport=self._transport,
            headers={"Accept": "application/json", "User-Agent": "World-Vision-Research-Only/1"},
        ) as client:
            resp = client.get(API_PATH, params=PROBE_PARAMS)
            if resp.status_code != 200:
                # 301/302/307/308, 429, 5xx must not cause a redirect,
                # rate-limit bypass or silent fallback to third-party mirrors.
                raise EvidenceIntegrityError("Insee returned an unsupported HTTP status " + str(resp.status_code))
            content_type = resp.headers.get("Content-Type", "").split(";", 1)[0].strip().lower()
            if content_type != "application/json":
                raise EvidenceIntegrityError("Unexpected Insee content type")
            if len(resp.content) > MAX_BODY_BYTES:
                raise EvidenceIntegrityError("Insee research body exceeds budget")
            url = str(resp.request.url)
            if not url.startswith(API_HOST + API_PATH + "?"):
                raise EvidenceIntegrityError("Unexpected Insee research URL")
            fetched = datetime.now(UTC).isoformat()
            return parse_reference_population(
                resp.content, source_url=url, fetched_at_utc=fetched,
                etag=resp.headers.get("ETag"), last_modified=resp.headers.get("Last-Modified")
            )


def capture_private_insee_evidence(
    *, root: Path, rows: list[MelodiPopulationEvidence],
):
    """Archive original bytes in existing immutable/quarantined Bronze store.

    The receipt is intentionally PRIVATE_RESEARCH_VALIDATION. It never signs a
    PUBLIC_API_INGEST permission, calls Timeseries or implies a real license.
    """
    if not rows:
        raise EvidenceIntegrityError("Cannot archive empty Melodi evidence")
    first = rows[0]
    _validate_exact_official_url(first.source_url)
    if any(row.raw_response_bytes != first.raw_response_bytes or
           row.source_url != first.source_url or row.original_http_sha256 != first.original_http_sha256
           for row in rows):
        raise EvidenceIntegrityError("Mixed source responses cannot be a single revision")
    normalized = [{
        "datasetCode": DATASET_CODE, "measureCode": MEASURE_CODE,
        "geoFilter": GEO_FILTER, "countryIso3Candidate": "FRA",
        "countryMappingStatus": "REVIEW_REQUIRED", "referencePeriod": str(row.year),
        "populationType": row.population_type, "numericValue": row.population_total,
        "unitStatus": "REVIEW_REQUIRED", "publicationRights": "NOT_GRANTED",
        "httpBodySha256": row.original_http_sha256,
    } for row in rows]
    return QuarantinedJsonEvidenceStore(root).capture(
        source_code=SOURCE_CODE, dataset_code=DATASET_CODE,
        raw_response_bytes=first.raw_response_bytes,
        normalized_records=normalized,
        notes={
            "rawSha256": _canonical_hash(first.raw_response_bytes),
            "sourceUrl": first.source_url, "httpBodySha256": first.original_http_sha256,
            "countryMappingStatus": "REVIEW_REQUIRED",
            "unitReviewStatus": "REVIEW_REQUIRED",
            "licenseReviewStatus": "REVIEW_REQUIRED",
            "publicationStatus": "BRONZE_ONLY_UNREVIEWED",
            "timeseriesPublication": "NOT_ATTEMPTED",
            "sourceStatus": "PRIVATE_RESEARCH_VALIDATION",
            "attributionReview": "REVIEW_REQUIRED",
            "dataMethodologyReview": "REVIEW_REQUIRED",
            "metadataSourceUrl": "https://api.insee.fr/melodi/catalog/DS_POPULATIONS_REFERENCE",
        },
    )
