"""Quarantined, content-addressed JSON source evidence.

This store is opt-in. It does not publish data, infer licenses, modify Timeseries,
or replace the older BronzeStore used by other institution connectors.
A revision becomes visible only after its complete directory is renamed.
"""
from __future__ import annotations

from datetime import UTC, datetime
from hashlib import sha256
import json
import os
from pathlib import Path
import re
import shutil
import tempfile
from typing import Any, Iterable

from ingestion_service.models import RunManifest


_CODE = re.compile(r"^[A-Za-z0-9][A-Za-z0-9_.-]{0,95}$")
_SHA = re.compile(r"^[a-f0-9]{64}$")
_MAX_NORMALIZED_BYTES = 8_000_000
_MAX_MANIFEST_BYTES = 256_000
_REQUIRED_QUARANTINE = {
    "publicationStatus": "BRONZE_ONLY_UNREVIEWED",
    "timeseriesPublication": "NOT_ATTEMPTED",
    "licenseReviewStatus": "REVIEW_REQUIRED",
}


class EvidenceIntegrityError(ValueError):
    """Reject corrupt, ambiguous, unexpectedly modified or unsafe evidence."""


def _code(value: str) -> str:
    if not isinstance(value, str) or not _CODE.fullmatch(value) or value in {".", ".."}:
        raise EvidenceIntegrityError("Invalid source/dataset code")
    return value.lower()


def _write_private(path: Path, content: bytes) -> None:
    # Create only inside a new private staging directory; never rewrite evidence.
    with path.open("xb") as out:
        os.chmod(path, 0o600)
        out.write(content)
        out.flush()
        os.fsync(out.fileno())


def _canonical_hash(raw: bytes) -> str:
    try:
        parsed = json.loads(raw.decode("utf-8"))
    except (UnicodeDecodeError, ValueError) as exc:
        raise EvidenceIntegrityError("Source response is not valid UTF-8 JSON") from exc
    canonical = json.dumps(
        parsed, ensure_ascii=False, sort_keys=True, separators=(",", ":")
    ).encode("utf-8")
    return sha256(canonical).hexdigest()


class QuarantinedJsonEvidenceStore:
    """Immutable revisions keyed by exact HTTP-response bytes (SHA-256).

    The first successful capture wins for each byte-identical revision. A replay
    verifies the original evidence rather than overwriting it. Differing bytes
    get a different revision, even when the normalized statistic is unchanged.
    """

    def __init__(self, bronze_root: Path, *, max_response_bytes: int = 1_000_000):
        if max_response_bytes < 1 or max_response_bytes > 25_000_000:
            raise ValueError("Evidence size budget must be bounded (1..25 MB)")
        self._root = Path(bronze_root)
        self._max_bytes = max_response_bytes

    def _revisions(self, source_code: str, dataset_code: str) -> Path:
        # Reject intermediate symlinks before creating or reading private data.
        source = self._root / _code(source_code)
        dataset = source / _code(dataset_code)
        revisions = dataset / "revisions"
        if any(path.is_symlink() for path in (self._root, source, dataset, revisions)):
            raise EvidenceIntegrityError("Symlinked evidence storage root is forbidden")
        return revisions

    def capture(
        self,
        *,
        source_code: str,
        dataset_code: str,
        raw_response_bytes: bytes,
        normalized_records: Iterable[dict[str, Any]],
        notes: dict[str, Any],
    ) -> RunManifest:
        if not isinstance(raw_response_bytes, bytes) or not (
            1 <= len(raw_response_bytes) <= self._max_bytes
        ):
            raise EvidenceIntegrityError("Missing or oversized original response bytes")
        if not isinstance(notes, dict):
            raise EvidenceIntegrityError("Source evidence notes must be explicit")
        for key, required in _REQUIRED_QUARANTINE.items():
            if notes.get(key) != required:
                raise EvidenceIntegrityError("Cannot archive unreviewed evidence as publishable")
        canonical_hash = _canonical_hash(raw_response_bytes)
        if notes.get("rawSha256") != canonical_hash:
            raise EvidenceIntegrityError("Normalized source hash differs from original response")
        rows = list(normalized_records)
        if not rows or len(rows) > 10_000 or any(not isinstance(row, dict) for row in rows):
            raise EvidenceIntegrityError("Invalid bounded normalized observation set")
        try:
            ndjson = ("".join(
                json.dumps(row, ensure_ascii=False, sort_keys=True, separators=(",", ":"))
                + "\n" for row in rows
            )).encode("utf-8")
        except (TypeError, ValueError) as exc:
            raise EvidenceIntegrityError("Normalized records are not JSON serializable") from exc
        if len(ndjson) > _MAX_NORMALIZED_BYTES:
            raise EvidenceIntegrityError("Normalized evidence exceeds bounded size")
        body_hash = sha256(raw_response_bytes).hexdigest()
        normalized_hash = sha256(ndjson).hexdigest()
        revisions = self._revisions(source_code, dataset_code)
        revisions.mkdir(mode=0o700, parents=True, exist_ok=True)
        destination = revisions / body_hash
        if destination.exists() or destination.is_symlink():
            return self.verify(
                source_code, dataset_code, body_hash,
                expected_raw_hash=body_hash, expected_normalized_hash=normalized_hash,
            )

        run_id = "sha256-" + body_hash
        receipt_notes = {
            **notes,
            "httpBodySha256": body_hash,
            "normalizedNdjsonSha256": normalized_hash,
            "evidenceLayoutVersion": "DATA-1B1",
            "rawBytesLength": len(raw_response_bytes),
            "publicationStatus": "BRONZE_ONLY_UNREVIEWED",
            "timeseriesPublication": "NOT_ATTEMPTED",
            "licenseReviewStatus": "REVIEW_REQUIRED",
        }
        manifest = RunManifest(
            source_code=source_code,
            dataset_code=dataset_code,
            run_id=run_id,
            fetched_at_utc=datetime.now(UTC),
            record_count=len(rows),
            raw_payload_path=destination / "original.http.json",
            normalized_payload_path=destination / "observations.ndjson",
            manifest_path=destination / "manifest.json",
            notes=receipt_notes,
        )
        temporary = Path(tempfile.mkdtemp(prefix=".staging-", dir=revisions))
        os.chmod(temporary, 0o700)
        try:
            _write_private(temporary / "original.http.json", raw_response_bytes)
            _write_private(temporary / "observations.ndjson", ndjson)
            _write_private(
                temporary / "manifest.json",
                # Portable receipt: on-disk paths are relative to the revision
                # directory. Returned RunManifest is rehydrated with real paths.
                manifest.model_copy(update={
                    "raw_payload_path": Path("original.http.json"),
                    "normalized_payload_path": Path("observations.ndjson"),
                    "manifest_path": Path("manifest.json"),
                }).model_dump_json(indent=2).encode("utf-8"),
            )
            try:
                temporary.rename(destination)
            except OSError:
                # A concurrent writer may have won. A corrupt/colliding revision
                # MUST fail verification rather than being replaced.
                if not destination.is_dir() or destination.is_symlink():
                    raise
            try:
                fd = os.open(revisions, os.O_RDONLY)
                try:
                    os.fsync(fd)
                finally:
                    os.close(fd)
            except OSError:
                # Some filesystems cannot sync directories. File fsync is done;
                # operator must still use a durable backed-up volume.
                pass
        finally:
            if temporary.exists():
                shutil.rmtree(temporary)
        return self.verify(
            source_code, dataset_code, body_hash,
            expected_raw_hash=body_hash, expected_normalized_hash=normalized_hash,
        )

    def verify(
        self,
        source_code: str,
        dataset_code: str,
        response_sha256: str,
        *,
        expected_raw_hash: str | None = None,
        expected_normalized_hash: str | None = None,
    ) -> RunManifest:
        if not isinstance(response_sha256, str) or not _SHA.fullmatch(response_sha256):
            raise EvidenceIntegrityError("Invalid SHA256 revision ID")
        destination = self._revisions(source_code, dataset_code) / response_sha256
        if not destination.is_dir() or destination.is_symlink():
            raise EvidenceIntegrityError("Evidence revision missing or unsafe")
        paths = [destination / name for name in (
            "original.http.json", "observations.ndjson", "manifest.json"
        )]
        if any(not p.is_file() or p.is_symlink() for p in paths):
            raise EvidenceIntegrityError("Incomplete or symlinked evidence revision")
        for path, size_limit in zip(
            paths, (self._max_bytes, _MAX_NORMALIZED_BYTES, _MAX_MANIFEST_BYTES), strict=True
        ):
            if not 1 <= path.stat().st_size <= size_limit:
                raise EvidenceIntegrityError("Evidence file exceeds its verified size budget")
        raw, normalized = paths[0].read_bytes(), paths[1].read_bytes()
        if sha256(raw).hexdigest() != response_sha256:
            raise EvidenceIntegrityError("Original HTTP bytes were modified")
        normalized_hash = sha256(normalized).hexdigest()
        if expected_raw_hash is not None and response_sha256 != expected_raw_hash:
            raise EvidenceIntegrityError("Source replay hash mismatch")
        if expected_normalized_hash is not None and normalized_hash != expected_normalized_hash:
            raise EvidenceIntegrityError("Same source bytes produced incompatible normalization")
        try:
            manifest = RunManifest.model_validate_json(paths[2].read_text(encoding="utf-8"))
        except (ValueError, UnicodeDecodeError) as exc:
            raise EvidenceIntegrityError("Corrupt evidence manifest") from exc
        if (
            manifest.source_code != source_code
            or manifest.dataset_code != dataset_code
            or manifest.run_id != "sha256-" + response_sha256
            or manifest.raw_payload_path != Path("original.http.json")
            or manifest.normalized_payload_path != Path("observations.ndjson")
            or manifest.manifest_path != Path("manifest.json")
        ):
            raise EvidenceIntegrityError("Manifest paths/identity do not match revision")
        for key, value in _REQUIRED_QUARANTINE.items():
            if manifest.notes.get(key) != value:
                raise EvidenceIntegrityError("Quarantine was weakened")
        if (
            manifest.notes.get("httpBodySha256") != response_sha256
            or manifest.notes.get("normalizedNdjsonSha256") != normalized_hash
            or manifest.notes.get("rawSha256") != _canonical_hash(raw)
            or manifest.notes.get("rawBytesLength") != len(raw)
            or manifest.notes.get("evidenceLayoutVersion") != "DATA-1B1"
        ):
            raise EvidenceIntegrityError("Provenance manifest inconsistent with bytes")
        try:
            lines = normalized.decode("utf-8").splitlines()
        except UnicodeDecodeError as exc:
            raise EvidenceIntegrityError("Normalized evidence encoding corrupted") from exc
        if len(lines) != manifest.record_count:
            raise EvidenceIntegrityError("Normalized row count changed")
        try:
            if any(not isinstance(json.loads(line), dict) for line in lines):
                raise EvidenceIntegrityError("Normalized observation is not a JSON object")
        except (ValueError, UnicodeDecodeError) as exc:
            raise EvidenceIntegrityError("Invalid normalized JSON") from exc
        # Never trust absolute paths stored in evidence; derive from the
        # verified root to permit relocation and disaster recovery.
        return manifest.model_copy(update={
            "raw_payload_path": paths[0],
            "normalized_payload_path": paths[1],
            "manifest_path": paths[2],
        })

    def list_verified_revisions(
        self, source_code: str, dataset_code: str
    ) -> list[RunManifest]:
        revisions = self._revisions(source_code, dataset_code)
        if not revisions.exists():
            return []
        if not revisions.is_dir() or revisions.is_symlink():
            raise EvidenceIntegrityError("Unsafe revisions directory")
        manifests = [
            self.verify(source_code, dataset_code, path.name)
            for path in revisions.iterdir() if not path.name.startswith(".staging-")
        ]
        return sorted(manifests, key=lambda m: (m.fetched_at_utc, m.run_id))
