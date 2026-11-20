"""Cross-language DATA-1C-A2B1 projection: typed, length-prefixed observations.

Python and Java must independently arrive at identical SHA256 for the SAME
observations, not merely for a client-asserted provenance hash. All values,
sourceMetadata and qualityFlags are included. A change to a numeric value,
country, period, source metadata or quality flag changes the signed digest.

The protocol is intentionally narrower than general-purpose canonical JSON:
ASCII-only metadata keys; UTF-8 values; IEEE-754 finite binary64 numbers;
map keys sorted in UTF-8 order; length-prefixed tags. Unknown types REFUSE.
"""
from __future__ import annotations

from datetime import UTC, datetime
from hashlib import sha256
import math
import re
import struct
from typing import Any

from ingestion_service.models import IndicatorObservation
from ingestion_service.source_evidence_store import EvidenceIntegrityError

_DOMAIN = b"WORLD_VISION_ITEMS_PROJECTION_V1\x00"
_META_KEY = re.compile(r"^[A-Za-z0-9_.-]{1,128}$")
_MAX_ITEMS = 256
_MAX_NEST = 8
_MAX_BYTES = 2_000_000


def _size(size: int) -> bytes:
    if size < 0 or size > _MAX_BYTES:
        raise EvidenceIntegrityError("Evidence item projection is oversized")
    return struct.pack(">I", size)


def _write(value: Any, *, depth: int = 0) -> bytes:
    if depth > _MAX_NEST:
        raise EvidenceIntegrityError("Evidence metadata nesting exceeds limit")
    if value is None:
        return b"\x00"
    if isinstance(value, bool):
        return b"\x01" + (b"\x01" if value else b"\x00")
    if isinstance(value, str):
        raw = value.encode("utf-8")
        return b"\x02" + _size(len(raw)) + raw
    if isinstance(value, int):
        raw = str(value).encode("ascii")
        return b"\x03" + _size(len(raw)) + raw
    if isinstance(value, float):
        if not math.isfinite(value):
            raise EvidenceIntegrityError("Non-finite observation metadata/numeric value")
        return b"\x04" + struct.pack(">d", value)
    if isinstance(value, list):
        if len(value) > _MAX_ITEMS:
            raise EvidenceIntegrityError("Evidence array too large")
        return b"\x05" + _size(len(value)) + b"".join(
            _write(item, depth=depth + 1) for item in value
        )
    if isinstance(value, dict):
        if len(value) > _MAX_ITEMS or any(
            not isinstance(k, str) or not _META_KEY.fullmatch(k) for k in value
        ):
            raise EvidenceIntegrityError("Unsafe evidence metadata keys")
        keys = sorted(value, key=lambda k: k.encode("utf-8"))
        return b"\x06" + _size(len(keys)) + b"".join(
            _write(k, depth=depth + 1) + _write(value[k], depth=depth + 1)
            for k in keys
        )
    raise EvidenceIntegrityError("Unsupported evidence metadata type")


def _published_instant(value: str | None) -> str | None:
    if value is None:
        return None
    try:
        dt = datetime.fromisoformat(value.replace("Z", "+00:00"))
        if dt.tzinfo is None or dt.utcoffset() is None:
            raise ValueError("Naive timestamp")
        utc = dt.astimezone(UTC)
        seconds = int(utc.timestamp())
        return f"{seconds}.{utc.microsecond * 1000:09d}"
    except (ValueError, TypeError, OverflowError) as exc:
        raise EvidenceIntegrityError("Invalid source published timestamp") from exc


def projection_items_from_verified_normalized(
    *, source_code: str, normalized_ndjson: bytes
) -> list[dict[str, Any]]:
    """Convert existing normalized storage to EXACT receiver-facing fields.

    Rejects text observations, unrecognized statuses and excessive payloads;
    this research pilot intentionally only supports numeric/missing series.
    """
    if not isinstance(normalized_ndjson, bytes) or not (
        1 <= len(normalized_ndjson) <= _MAX_BYTES
    ):
        raise EvidenceIntegrityError("Invalid normalized evidence bytes budget")
    import json
    try:
        raw = normalized_ndjson.decode("utf-8").splitlines()
        if not raw or len(raw) > _MAX_ITEMS:
            raise EvidenceIntegrityError("Unsupported count of normalized evidence items")
        records = [IndicatorObservation.model_validate(json.loads(line)) for line in raw]
    except (UnicodeDecodeError, ValueError, TypeError) as exc:
        raise EvidenceIntegrityError("Invalid verified normalized observation") from exc
    from ingestion_service.connectors.timeseries_client import TimeseriesClient
    converter = TimeseriesClient(
        base_url="https://no-network.invalid", timeout_seconds=1,
        ingestion_key="NO_NETWORK_ONLY_NEVER_PUBLISH",
    )
    try:
        items = [converter._serialize_observation(record, source_code=source_code)
                 for record in records]
    except (ValueError, TypeError) as exc:
        raise EvidenceIntegrityError("Normalized source status is not eligible for projection") from exc
    return items


def items_sha256(items: list[dict[str, Any]]) -> str:
    if not isinstance(items, list) or not 1 <= len(items) <= _MAX_ITEMS:
        raise EvidenceIntegrityError("Invalid bounded batch size")
    projected: list[list[Any]] = []
    unique: set[tuple[str, str, str, str]] = set()
    for item in items:
        if not isinstance(item, dict):
            raise EvidenceIntegrityError("Evidence item must be an object")
        identity = tuple(item.get(k) for k in (
            "indicatorCode", "countryIso3", "periodGranularity", "periodStart"
        ))
        if any(not isinstance(x, str) for x in identity) or identity in unique:
            raise EvidenceIntegrityError("Duplicate or malformed evidence item identity")
        unique.add(identity)
        if item.get("textValue") is not None:
            raise EvidenceIntegrityError("Research evidence projection has no text payload")
        numeric = item.get("numericValue")
        if numeric is not None:
            if isinstance(numeric, bool) or not isinstance(numeric, (int, float)):
                raise EvidenceIntegrityError("Invalid numeric observation")
            numeric = float(numeric)
        meta = item.get("sourceMetadata")
        flags = item.get("qualityFlags")
        if not isinstance(meta, dict) or not isinstance(flags, list):
            raise EvidenceIntegrityError("Missing source metadata or quality flags")
        if any(not isinstance(flag, str) for flag in flags):
            raise EvidenceIntegrityError("Invalid quality flags")
        projected.append([
            *identity,
            item.get("periodEnd"), item.get("periodLabel"),
            item.get("valueStatus"), numeric, None,
            _published_instant(item.get("sourcePublishedAt")),
            meta, flags,
        ])
    projected.sort(key=lambda row: (row[0], row[1], row[2], row[3]))
    contents = _DOMAIN + _write(projected)
    if len(contents) > _MAX_BYTES:
        raise EvidenceIntegrityError("Evidence item projection size exceeded")
    return sha256(contents).hexdigest()
