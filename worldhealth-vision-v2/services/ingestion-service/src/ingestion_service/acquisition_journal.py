"""DATA-1B2B: private append-only acquisition attempts, separate from revisions.

Version identity = SHA-256 of original source HTTP bytes (Bronze evidence store).
Fetch identity = independent cryptographically random ID for EVERY actual attempt.
Never interpret one immutable version as proof that the provider was fetched again.
Each event has one immutable START and at most one immutable terminal OUTCOME.

LOCAL PRIVATE FILESYSTEM ONLY. This is crash-safe for ordinary local POSIX disks
(with supported fsync), NOT distributed consensus, WORM, off-site backup, RBAC
or proof against a privileged attacker rewriting the complete store.
"""
from __future__ import annotations

from dataclasses import dataclass
from datetime import UTC, datetime
from hashlib import sha256
import json
import os
from pathlib import Path
import re
import secrets
import shutil
import tempfile
from typing import Any
from urllib.parse import urlsplit

from ingestion_service.source_evidence_store import (
    EvidenceIntegrityError, QuarantinedJsonEvidenceStore, _code,
)

_EVENT_ID = re.compile(r"^[0-9a-f]{32}$")
_SHA256 = re.compile(r"^[0-9a-f]{64}$")
_MAX_EVENT_BYTES = 16_384
_MAX_EVENTS_PER_AUDIT = 20_000
_SCHEMA = "WORLD_VISION_PRIVATE_ACQUISITION_V1"
_ENDPOINTS = {
    "CENSO2022_4714": "/api/v3/agregados/4714/periodos/2022/variaveis/93",
    "CENSO2022_4714_METADATA": "/api/v3/agregados/4714/metadados",
    "CENSO2022_4714_PERIODS": "/api/v3/agregados/4714/periodos",
}
_CANONICAL_HOST = "servicodados.ibge.gov.br"
# Only ONE audited second-source research endpoint is authorized in DATA-1B3.
# Each dataset remains a separate identity; do not make the API URL arbitrary.
_WDI_DATASET_CODE = "WDI_POP_TOTAL_BRA_2022"
_WDI_PATH = "/v2/country/BRA/indicator/SP.POP.TOTL"
_WDI_QUERY = "date=2022&format=json&source=2"
_WDI_HOST = "api.worldbank.org"
# P2C3A: a single INSEE 2023 municipal reference (France hors Mayotte).
# Approval to archive READ-ONLY is NOT a permission to publish.
_INSEE_DATASET = "DS_POPULATIONS_REFERENCE"
_INSEE_URL = ("https://api.insee.fr/melodi/data/DS_POPULATIONS_REFERENCE"
              "?GEO=FRANCE-F&POPREF_MEASURE=PMUN&TIME_PERIOD=2023&maxResult=10")

_ALLOWED_PAIRS = frozenset(
    {("IBGE", dataset) for dataset in _ENDPOINTS}
    | {("WORLD_BANK", _WDI_DATASET_CODE)}
    | {("INSEE", _INSEE_DATASET)}
)


def _utc() -> str:
    return datetime.now(UTC).isoformat()


def _serialized(value: dict[str, Any]) -> bytes:
    return (json.dumps(value, ensure_ascii=False, sort_keys=True, separators=(",", ":")) + "\n").encode("utf-8")


def _digest(value: dict[str, Any]) -> str:
    return sha256(_serialized(value)).hexdigest()


def _sync_dir(path: Path) -> None:
    # If fsync of a directory is unsupported, STOP: an ACK must not falsely
    # promise that a START or terminal event survived a power failure.
    fd = os.open(path, os.O_RDONLY | getattr(os, "O_DIRECTORY", 0))
    try:
        os.fsync(fd)
    finally:
        os.close(fd)


def _write_new(path: Path, payload: bytes) -> None:
    if not 1 <= len(payload) <= _MAX_EVENT_BYTES:
        raise EvidenceIntegrityError("Acquisition event outside bounded size")
    with path.open("xb") as file:
        os.chmod(path, 0o600)
        file.write(payload)
        file.flush()
        os.fsync(file.fileno())


def _safe_header(value: str | None) -> str | None:
    if value is None:
        return None
    if not isinstance(value, str) or len(value) > 512 or any(
        ord(char) < 32 or ord(char) > 126 for char in value
    ):
        raise EvidenceIntegrityError("Unsafe provider response header")
    return value


def _check_url(source_code: str, dataset_code: str, url: str) -> str:
    if (source_code, dataset_code) not in _ALLOWED_PAIRS:
        raise EvidenceIntegrityError("Unreviewed acquisition source/dataset pair")
    if source_code == "INSEE":
        # No alternate host, parameters, year, dataset or geography. The rest
        # of the acquisition and immutable-event audit remains unchanged.
        if url != _INSEE_URL:
            raise EvidenceIntegrityError("INSEE research URL is not the pinned official request")
        return url
    if not isinstance(url, str) or not (1 <= len(url) <= 380):
        raise EvidenceIntegrityError("Invalid official source URL")
    parts = urlsplit(url)
    host, path, query = (
        (_CANONICAL_HOST, _ENDPOINTS[dataset_code],
         "localidades=N1%5Ball%5D" if dataset_code == "CENSO2022_4714" else "")
        if source_code == "IBGE"
        else (_WDI_HOST, _WDI_PATH, _WDI_QUERY)
    )
    if (parts.scheme != "https" or parts.netloc != host or
        parts.username or parts.password or parts.fragment or parts.port or
        parts.path != path or parts.query != query):
        raise EvidenceIntegrityError("Acquisition URL differs from pinned official resource")
    return url

def _read_json(path: Path) -> dict[str, Any]:
    if not path.is_file() or path.is_symlink() or not 1 <= path.stat().st_size <= _MAX_EVENT_BYTES:
        raise EvidenceIntegrityError("Acquisition event file missing, unsafe or oversized")
    try:
        content = json.loads(path.read_text(encoding="utf-8"))
    except (ValueError, UnicodeDecodeError) as exc:
        raise EvidenceIntegrityError("Malformed acquisition event JSON") from exc
    if not isinstance(content, dict):
        raise EvidenceIntegrityError("Invalid acquisition event object")
    return content


def _parse_utc(text: Any) -> datetime:
    if not isinstance(text, str):
        raise EvidenceIntegrityError("Acquisition time missing")
    try:
        dt = datetime.fromisoformat(text)
    except ValueError as exc:
        raise EvidenceIntegrityError("Invalid acquisition timestamp") from exc
    if dt.tzinfo is None or dt.utcoffset() is None or dt.utcoffset().total_seconds() != 0:
        raise EvidenceIntegrityError("Acquisition time must be UTC")
    return dt


@dataclass(frozen=True)
class AcquisitionHandle:
    event_id: str
    source_code: str
    dataset_code: str
    start_sha256: str
    started_at_utc: str


class AcquisitionJournal:
    """Local private append-only journal with verified revision linkage.

    Each START is committed durably before a request is made. SUCCESS means
    the byte-identified quarantined revision was verified and linked. Failures
    never mark any source data as published. An interrupted attempt remains
    STARTED, not arbitrarily labelled FAILED or fabricated as a fresh fetch.
    """

    def __init__(self, bronze_root: Path):
        self._root = Path(bronze_root)
        self._evidence = QuarantinedJsonEvidenceStore(bronze_root)

    def _events(self, source_code: str, dataset_code: str) -> Path:
        source = _code(source_code)
        dataset = _code(dataset_code)
        if (source_code, dataset_code) not in _ALLOWED_PAIRS:
            raise EvidenceIntegrityError("Only pinned IBGE/WDI research datasets allowed")
        current = self._root
        for component in (source, dataset, "_acquisitions"):
            if current.is_symlink():
                raise EvidenceIntegrityError("Symlinked journal root")
            current = current / component
            if current.is_symlink():
                raise EvidenceIntegrityError("Symlinked journal ancestor")
        return current

    def begin(self, *, source_code: str, dataset_code: str, source_url: str) -> AcquisitionHandle:
        _check_url(source_code, dataset_code, source_url)
        root = self._events(source_code, dataset_code)
        root.mkdir(parents=True, mode=0o700, exist_ok=True)
        os.chmod(root, 0o700)
        event_id = secrets.token_hex(16)
        started = _utc()
        record = {
            "schema": _SCHEMA, "kind": "STARTED", "eventId": event_id,
            "sourceCode": source_code, "datasetCode": dataset_code,
            "sourceUrl": source_url, "startedAtUtc": started,
            "publicationStatus": "BRONZE_ONLY_UNREVIEWED",
            "timeseriesPublication": "NOT_ATTEMPTED",
        }
        # Atomic directory rename makes a complete START visible at once.
        staging = Path(tempfile.mkdtemp(prefix=".attempt-", dir=root))
        os.chmod(staging, 0o700)
        target = root / event_id
        try:
            _write_new(staging / "started.json", _serialized(record))
            _sync_dir(staging)
            if target.exists() or target.is_symlink():
                raise EvidenceIntegrityError("Acquisition event ID collision")
            staging.rename(target)
            _sync_dir(root)
        finally:
            if staging.exists():
                shutil.rmtree(staging)
        return AcquisitionHandle(event_id, source_code, dataset_code, _digest(record), started)

    def _finish(self, handle: AcquisitionHandle, record: dict[str, Any]) -> None:
        if not _EVENT_ID.fullmatch(handle.event_id):
            raise EvidenceIntegrityError("Invalid acquisition identifier")
        directory = self._events(handle.source_code, handle.dataset_code) / handle.event_id
        if not directory.is_dir() or directory.is_symlink():
            raise EvidenceIntegrityError("Missing or unsafe acquisition START")
        started = _read_json(directory / "started.json")
        if (started.get("eventId") != handle.event_id
            or started.get("schema") != _SCHEMA
            or started.get("kind") != "STARTED"
            or started.get("sourceCode") != handle.source_code
            or started.get("datasetCode") != handle.dataset_code
            or started.get("startedAtUtc") != handle.started_at_utc
            or _digest(started) != handle.start_sha256):
            raise EvidenceIntegrityError("Acquisition START changed before outcome")
        target = directory / "outcome.json"
        if target.exists() or target.is_symlink():
            raise EvidenceIntegrityError("Acquisition outcome already recorded; cannot overwrite")
        finished = {**record, "schema": _SCHEMA, "eventId": handle.event_id,
                    "startSha256": handle.start_sha256, "finishedAtUtc": _utc()}
        # Hard link is a filesystem-atomic create-if-absent (unlike replace).
        staging = directory / (".outcome-" + secrets.token_hex(16))
        try:
            _write_new(staging, _serialized(finished))
            os.link(staging, target, follow_symlinks=False)
            _sync_dir(directory)
        finally:
            staging.unlink(missing_ok=True)

    def success(self, handle: AcquisitionHandle, *, response_sha256: str,
                http_status: int = 200, etag: str | None = None,
                last_modified: str | None = None) -> None:
        if not _SHA256.fullmatch(response_sha256) or http_status != 200:
            raise EvidenceIntegrityError("Successful capture requires checked HTTP 200 + bytes")
        # Never record success for a source that hasn't passed Bronze verification.
        self._evidence.verify(handle.source_code, handle.dataset_code, response_sha256)
        self._finish(handle, {
            "kind": "SUCCESS", "httpStatus": http_status,
            "responseSha256": response_sha256,
            "etag": _safe_header(etag), "lastModified": _safe_header(last_modified),
        })

    def failure(self, handle: AcquisitionHandle, *, error: Exception) -> None:
        # Error class only. NEVER persist/log arbitrary error messages, URLs,
        # raw payloads, provider response text, tokens or user data.
        status = getattr(error, "http_status", None)
        response = getattr(error, "response", None)
        if status is None and response is not None:
            status = getattr(response, "status_code", None)
        if not isinstance(status, int) or not (100 <= status <= 599):
            status = None
        kind = type(error).__name__
        if not re.fullmatch(r"[A-Za-z][A-Za-z0-9_]{0,79}", kind):
            kind = "UNCLASSIFIED_EXCEPTION"
        self._finish(handle, {
            "kind": "FAILED", "httpStatus": status,
            "errorClass": kind,
            "responseSha256": None,
            "etag": None, "lastModified": None,
        })

    def audit(self, source_code: str, dataset_code: str) -> dict[str, Any]:
        root = self._events(source_code, dataset_code)
        if not root.exists():
            return {"eventCount": 0, "successCount": 0, "failureCount": 0,
                    "interruptedCount": 0, "versionCount": 0, "versions": []}
        if not root.is_dir() or root.is_symlink():
            raise EvidenceIntegrityError("Unsafe acquisition directory")
        paths = [p for p in root.iterdir() if not p.name.startswith(".attempt-")]
        if len(paths) > _MAX_EVENTS_PER_AUDIT:
            raise EvidenceIntegrityError("Acquisition audit limit exceeded; implement pagination")
        observed: dict[str, list[datetime]] = {}
        failures = interrupted = successes = 0
        for path in paths:
            if not _EVENT_ID.fullmatch(path.name) or not path.is_dir() or path.is_symlink():
                raise EvidenceIntegrityError("Unexpected acquisition event path")
            start = _read_json(path / "started.json")
            if (start.get("schema") != _SCHEMA or start.get("kind") != "STARTED"
                or start.get("eventId") != path.name or start.get("sourceCode") != source_code
                or start.get("datasetCode") != dataset_code
                or start.get("publicationStatus") != "BRONZE_ONLY_UNREVIEWED"
                or start.get("timeseriesPublication") != "NOT_ATTEMPTED"):
                raise EvidenceIntegrityError("Acquisition START identity or quarantine changed")
            _check_url(source_code, dataset_code, start.get("sourceUrl"))
            timestamp = _parse_utc(start.get("startedAtUtc"))
            end = path / "outcome.json"
            if not end.exists() and not end.is_symlink():
                interrupted += 1
                continue
            outcome = _read_json(end)
            end_time = _parse_utc(outcome.get("finishedAtUtc"))
            if end_time < timestamp:
                raise EvidenceIntegrityError("Acquisition outcome predates START")
            if (outcome.get("schema") != _SCHEMA or outcome.get("eventId") != path.name
                or outcome.get("startSha256") != _digest(start)):
                raise EvidenceIntegrityError("Acquisition outcome not bound to START")
            kind = outcome.get("kind")
            status = outcome.get("httpStatus")
            if kind == "SUCCESS":
                if status != 200 or outcome.get("errorClass") is not None:
                    raise EvidenceIntegrityError("Success cannot contain failure or non-200 status")
                digest = outcome.get("responseSha256")
                if not isinstance(digest, str) or not _SHA256.fullmatch(digest):
                    raise EvidenceIntegrityError("Invalid success response digest")
                _safe_header(outcome.get("etag"))
                _safe_header(outcome.get("lastModified"))
                self._evidence.verify(source_code, dataset_code, digest)
                observed.setdefault(digest, []).append(end_time)
                successes += 1
            elif kind == "FAILED":
                if outcome.get("responseSha256") is not None or outcome.get("etag") is not None or outcome.get("lastModified") is not None:
                    raise EvidenceIntegrityError("Failed attempt must not claim source bytes or headers")
                if status is not None and (not isinstance(status, int) or not 100 <= status <= 599):
                    raise EvidenceIntegrityError("Invalid failure HTTP status")
                error = outcome.get("errorClass")
                if not isinstance(error, str) or not re.fullmatch(r"[A-Za-z][A-Za-z0-9_]{0,79}", error):
                    raise EvidenceIntegrityError("Untrusted exception body in private journal")
                failures += 1
            else:
                raise EvidenceIntegrityError("Unexpected acquisition outcome kind")
        versions = [{
            "responseSha256": digest,
            "firstSeenAtUtc": min(instants).isoformat(),
            "lastSeenAtUtc": max(instants).isoformat(),
            "successfulFetchCount": len(instants),
        } for digest, instants in sorted(observed.items())]
        return {"eventCount": len(paths), "successCount": successes,
                "failureCount": failures, "interruptedCount": interrupted,
                "versionCount": len(versions), "versions": versions}
