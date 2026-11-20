"""DATA-1C-A2B2a — independent, explicit source-to-observation semantic replay.

An independently written validator (NOT the first-ingestion source client or
pipeline) reconstructs the exact single expected normalized observation
from the original provider's HTTP entity bytes. A fully self-consistent fake
NDJSON + manifest + acquisition journal is NOT sufficient for attestation.

Only these two strictly pinned *research* resources are supported:
- IBGE national Censo 2022 aggregate 4714, variable 93, locality 1 N1.
- World Bank WDI SP.POP.TOTL, Brazil 2022, source=2.

The output deliberately carries SHA summaries and verifier contract version,
NOT the population figure. This is scientific evidence validation, NEVER
a commercial license or permission to publish. No network requests.
"""
from __future__ import annotations

from dataclasses import dataclass
from hashlib import sha256
import json
import math
import re
from typing import Any

from ingestion_service.models import IndicatorObservation
from ingestion_service.source_evidence_store import EvidenceIntegrityError


# This is a manually reviewed version of the reference semantic specification.
# Change it only with separate reference tests and documented governance.
SEMANTIC_REPLAY_VERSION = "WORLD_VISION_SEMANTIC_POPULATION_REPLAY_V1"
IBGE_PAIR = ("IBGE", "CENSO2022_4714")
WDI_PAIR = ("WORLD_BANK", "WDI_POP_TOTAL_BRA_2022")
_ALLOWED = frozenset({IBGE_PAIR, WDI_PAIR})
_MAX_RAW = 1_000_000
_MAX_NDJSON = 2_000_000
_IBGE_INTEGER = re.compile(r"^[0-9]+$")
_IBGE_URL = (
    "https://servicodados.ibge.gov.br"
    "/api/v3/agregados/4714/periodos/2022/variaveis/93"
    "?localidades=N1%5Ball%5D"
)
_WDI_URL = (
    "https://api.worldbank.org/v2/country/BRA/indicator/SP.POP.TOTL"
    "?date=2022&format=json&source=2"
)
_WDI_METHOD_URL = (
    "https://databank.worldbank.org/metadataglossary/"
    "world-development-indicators/series/SP.POP.TOTL"
)
_IBGE_FLAGS = [
    "CENSUS_2022_REFERENCE_NOT_CURRENT_ESTIMATE",
    "SOURCE_REVISION_DATE_NOT_VERIFIED",
    "REUSE_RIGHTS_REVIEW_REQUIRED",
]
_WDI_FLAGS = [
    "WDI_DE_FACTO_MIDYEAR_ESTIMATE_NOT_CENSUS_DAY_COUNT",
    "SOURCE_INPUT_DEPENDENCE_UNVERIFIED",
    "SOURCE_OBSERVATION_REVISION_NOT_VERIFIED",
    "REUSE_RIGHTS_REVIEW_REQUIRED",
]
_REQUIRED_FIELDS = frozenset(IndicatorObservation.model_fields)


def _object_without_duplicates(pairs: list[tuple[str, Any]]) -> dict[str, Any]:
    result: dict[str, Any] = {}
    for key, value in pairs:
        if key in result:
            raise EvidenceIntegrityError("Duplicated provider/normalized JSON key")
        result[key] = value
    return result


def _json_strict(data: bytes) -> Any:
    try:
        return json.loads(
            data.decode("utf-8"),
            object_pairs_hook=_object_without_duplicates,
            parse_constant=lambda _: (_ for _ in ()).throw(
                EvidenceIntegrityError("Non-finite source JSON number")
            ),
        )
    except (ValueError, UnicodeDecodeError, TypeError) as exc:
        raise EvidenceIntegrityError("Semantic replay requires unambiguous UTF-8 JSON") from exc


def _canonical_source_sha(payload: Any) -> str:
    canonical = json.dumps(
        payload, ensure_ascii=False, sort_keys=True, separators=(",", ":"),
        allow_nan=False,
    ).encode("utf-8")
    return sha256(canonical).hexdigest()


def _ibge_expected(payload: Any, *, body_sha: str, canonical_sha: str
                   ) -> dict[str, Any]:
    # Independent implementation; does not use parse_ibge_national_population
    # or IbgeNationalCensusPilot, so it can catch pipeline changes.
    if not isinstance(payload, list) or len(payload) != 1:
        raise EvidenceIntegrityError("IBGE reference requires exactly one variable")
    row = payload[0]
    if not isinstance(row, dict) or str(row.get("id")) != "93":
        raise EvidenceIntegrityError("IBGE national reference variable changed")
    label, unit = row.get("variavel"), row.get("unidade")
    if (not isinstance(label, str) or "popula" not in label.casefold()
        or not isinstance(unit, str) or unit.casefold() not in {"pessoas", "pessoa"}):
        raise EvidenceIntegrityError("IBGE population label/unit unsupported")
    results = row.get("resultados")
    if not isinstance(results, list) or len(results) != 1:
        raise EvidenceIntegrityError("IBGE reference requires unambiguous totals")
    total = results[0]
    if (not isinstance(total, dict)
        or total.get("classificacoes") not in (None, [])):
        raise EvidenceIntegrityError("IBGE classified data is not national total")
    series = total.get("series")
    if not isinstance(series, list) or len(series) != 1:
        raise EvidenceIntegrityError("IBGE reference requires exactly one national series")
    item = series[0]
    place = item.get("localidade") if isinstance(item, dict) else None
    if not isinstance(place, dict) or str(place.get("id")) != "1":
        raise EvidenceIntegrityError("IBGE reference requires country locality 1")
    level = place.get("nivel")
    if not isinstance(level, dict) or str(level.get("id")) != "N1":
        raise EvidenceIntegrityError("IBGE reference requires national N1")
    values = item.get("serie")
    if not isinstance(values, dict) or set(values) != {"2022"}:
        raise EvidenceIntegrityError("IBGE source must be Census 2022")
    value = values["2022"]
    if not isinstance(value, str) or not _IBGE_INTEGER.fullmatch(value):
        raise EvidenceIntegrityError("IBGE missing, inferred or imprecise population")
    number = int(value)
    if not 100_000 <= number <= 500_000_000:
        raise EvidenceIntegrityError("IBGE source population outside vetted pilot bounds")
    return IndicatorObservation.annual(
        country_iso3="BRA",
        indicator_code="IBGE.CENSUS2022.RESIDENT_POP",
        year=2022,
        value=float(number),
        value_status="OBSERVED",
        source_published_at=None,
        source_metadata={
            "officialSource": "IBGE",
            "originalAggregateId": "4714",
            "originalVariableId": "93",
            "originalLocalityId": "1",
            "originalUnit": unit,
            "originalLabel": label,
            "sourceUrl": _IBGE_URL,
            "rawSha256": canonical_sha,
            "httpBodySha256": body_sha,
            "referencePopulationType": "RESIDENT_CENSUS_POPULATION",
            "reuseRights": "REVIEW_REQUIRED",
        },
        quality_flags=_IBGE_FLAGS,
    ).model_dump(mode="json")


def _wdi_expected(payload: Any, *, body_sha: str, canonical_sha: str
                  ) -> dict[str, Any]:
    if (not isinstance(payload, list) or len(payload) != 2
        or not isinstance(payload[0], dict)
        or not isinstance(payload[1], list) or len(payload[1]) != 1):
        raise EvidenceIntegrityError("WDI reference must be one page and one row")
    header, records = payload
    if (str(header.get("page")) != "1"
        or str(header.get("pages")) != "1"
        or str(header.get("total")) != "1"
        or (header.get("sourceid") is not None
            and str(header.get("sourceid")) != "2")):
        raise EvidenceIntegrityError("WDI reference source/pagination differs from scope")
    record = records[0]
    if not isinstance(record, dict):
        raise EvidenceIntegrityError("WDI reference observation must be an object")
    indicator, country = record.get("indicator"), record.get("country")
    if (not isinstance(indicator, dict) or indicator.get("id") != "SP.POP.TOTL"
        or not isinstance(country, dict)
        or country.get("id") not in ("BR", "BRA")
        or record.get("countryiso3code") != "BRA"
        or record.get("date") != "2022"):
        raise EvidenceIntegrityError("WDI reference indicator/country/year mismatch")
    value = record.get("value")
    if (isinstance(value, bool) or not isinstance(value, (int, float))
        or (isinstance(value, float)
            and (not math.isfinite(value) or not value.is_integer()))
        or not 100_000_000 <= value <= 400_000_000):
        raise EvidenceIntegrityError("WDI observed value is not a valid integer population")
    status = record.get("obs_status")
    if (status is not None and (
        not isinstance(status, str) or len(status) > 20
        or status.strip().upper() == "F"
    )):
        raise EvidenceIntegrityError("WDI provider status unsupported/forecast")
    updated = header.get("lastupdated")
    if updated is not None and (not isinstance(updated, str) or len(updated) > 80):
        raise EvidenceIntegrityError("WDI dataset update label invalid")
    # WDI population count is in persons. A newly introduced nonempty unit
    # or fractional display precision is not accepted silently.
    if record.get("unit") not in ("", None):
        raise EvidenceIntegrityError("WDI population unit requires methodological review")
    if record.get("decimal") not in (None, 0):
        raise EvidenceIntegrityError("WDI population precision has changed")
    return IndicatorObservation.annual(
        country_iso3="BRA",
        indicator_code="SP.POP.TOTL",
        year=2022,
        value=float(int(value)),
        value_status="MIDYEAR_ESTIMATE",
        source_published_at=None,
        source_metadata={
            "officialSource": "WORLD_BANK_WDI",
            "originalIndicatorCode": "SP.POP.TOTL",
            "originalDatasetId": "2",
            "referenceTime": "MID_YEAR_ESTIMATE",
            "referenceYear": 2022,
            "originalUnitMeaning": "NUMBER_OF_PERSONS",
            "providerObservationStatus": (
                status if status not in ("", None) else "UNSPECIFIED"
            ),
            "providerDatasetUpdatedLabel": updated,
            "providerObservationRevisedAt": None,
            "methodologyUrl": _WDI_METHOD_URL,
            "sourceUrl": _WDI_URL,
            "rawSha256": canonical_sha,
            "httpBodySha256": body_sha,
            "reuseRights": "REVIEW_REQUIRED",
        },
        quality_flags=_WDI_FLAGS,
    ).model_dump(mode="json")


@dataclass(frozen=True)
class SemanticReplayProof:
    # No actual figure, only independently checked identity and hashes.
    verifier_version: str
    raw_sha256: str
    normalized_sha256: str
    semantic_projection_sha256: str
    observation_count: int


def verify_original_to_normalized(
    *, source_code: str, dataset_code: str,
    original_http_bytes: bytes, normalized_ndjson: bytes,
) -> SemanticReplayProof:
    """Fails closed even when original + FAKE normalized have self-consistent SHAs."""
    if (source_code, dataset_code) not in _ALLOWED:
        raise EvidenceIntegrityError("No independent semantic replayer for source/dataset")
    if (not isinstance(original_http_bytes, bytes)
        or not 1 <= len(original_http_bytes) <= _MAX_RAW
        or not isinstance(normalized_ndjson, bytes)
        or not 1 <= len(normalized_ndjson) <= _MAX_NDJSON):
        raise EvidenceIntegrityError("Semantic replay source bytes missing or oversized")
    original = _json_strict(original_http_bytes)
    body_sha = sha256(original_http_bytes).hexdigest()
    canonical_sha = _canonical_source_sha(original)

    expected = (_ibge_expected(original, body_sha=body_sha, canonical_sha=canonical_sha)
                if (source_code, dataset_code) == IBGE_PAIR
                else _wdi_expected(original, body_sha=body_sha, canonical_sha=canonical_sha))
    # Restrict the input to exactly ONE full row; do not tolerate a benign
    # correct row alongside an invented second statistic or extra field.
    try:
        rows = normalized_ndjson.decode("utf-8").splitlines()
    except UnicodeDecodeError as exc:
        raise EvidenceIntegrityError("Normalized evidence is not UTF-8 NDJSON") from exc
    if len(rows) != 1 or not rows[0]:
        raise EvidenceIntegrityError("Semantic pilot expects exactly one normalized row")
    supplied = _json_strict(rows[0].encode("utf-8"))
    if (not isinstance(supplied, dict)
        or set(supplied) != _REQUIRED_FIELDS
        or supplied != expected):
        # NEVER show values, provider snippets or field-by-field numerical
        # differences in logs, exceptions, API errors or CI output.
        raise EvidenceIntegrityError("Normalized statistic disagrees with original provider bytes")

    from ingestion_service.evidence_items_fingerprint import (
        items_sha256, projection_items_from_verified_normalized,
    )
    projected = projection_items_from_verified_normalized(
        source_code=source_code, normalized_ndjson=normalized_ndjson
    )
    if len(projected) != 1:
        raise EvidenceIntegrityError("Projected observation count differs")
    return SemanticReplayProof(
        verifier_version=SEMANTIC_REPLAY_VERSION,
        raw_sha256=body_sha,
        normalized_sha256=sha256(normalized_ndjson).hexdigest(),
        semantic_projection_sha256=items_sha256(projected),
        observation_count=1,
    )
