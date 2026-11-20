"""DATA-1C-A2B1: independently verified private Bronze acquisition attestation.

THIS ISSUER IS RESEARCH-ONLY. It deliberately cannot sign PUBLIC_API_INGEST:
all existing IBGE/WDI private revisions have rights REVIEW_REQUIRED. A signed
research finding is NOT a license to publish. Future operational issuer must
be separately authorized, isolated, review the legal release, and reconstruct
the actual publishable source evidence before signing a public operation.

Do not put this signing PRIVATE key in Timeseries, the general ingestion
client, GitHub secrets of a public workflow, browsers, Vercel or Atlas.
"""
from __future__ import annotations

from datetime import UTC, datetime, timedelta
from hashlib import sha256
from pathlib import Path
import base64
import json
import re
import struct
from typing import Any

from ingestion_service.acquisition_journal import AcquisitionJournal
from ingestion_service.evidence_items_fingerprint import (
    items_sha256, projection_items_from_verified_normalized,
)
from ingestion_service.source_evidence_store import (
    EvidenceIntegrityError, QuarantinedJsonEvidenceStore,
)

_SCHEMA = "WORLD_VISION_BRONZE_WITNESS_V1"
_OPERATION = "PRIVATE_RESEARCH_VALIDATION"
_SHA = re.compile(r"^[0-9a-f]{64}$")
_EVENT = re.compile(r"^[0-9a-f]{32}$")


def _signing_payload(record: dict[str, Any]) -> bytes:
    fields = [
        _SCHEMA, record["schema"], record["operation"], record["sourceCode"],
        record["datasetCode"], record["runKey"], str(record["fetchedAtEpochSec"]),
        str(record["fetchedAtNano"]), record["originalHttpSha256"],
        record["normalizedNdjsonSha256"], record["manifestSha256"],
        record["acquisitionEventId"], record["acquisitionOutcomeSha256"],
        record["itemsSha256"], str(record["issuedAtEpochSec"]),
        str(record["expiresAtEpochSec"]), record["signingPublicKeySha256"],
    ]
    out = bytearray()
    for field in fields:
        if not isinstance(field, str):
            raise EvidenceIntegrityError("Invalid private attestation field")
        raw = field.encode("utf-8")
        if len(raw) > 4096:
            raise EvidenceIntegrityError("Oversized private attestation field")
        out.extend(struct.pack(">I", len(raw)))
        out.extend(raw)
    return bytes(out)


class PrivateBronzeWitness:
    """A separate/private signer taking ONLY verified institutional research."""
    def __init__(self, *, bronze_root: Path, signing_key: Any):
        self._root = Path(bronze_root)
        self._evidence = QuarantinedJsonEvidenceStore(self._root)
        self._journal = AcquisitionJournal(self._root)
        self._signing_key = signing_key

    def certify_research_only(
        self, *, source_code: str, dataset_code: str,
        original_http_sha256: str, acquisition_event_id: str,
        lifetime_seconds: int = 180,
    ) -> dict[str, Any]:
        if (not isinstance(original_http_sha256, str)
            or not _SHA.fullmatch(original_http_sha256)
            or not isinstance(acquisition_event_id, str)
            or not _EVENT.fullmatch(acquisition_event_id)):
            raise EvidenceIntegrityError("Explicit source revision and acquisition event required")
        if not 10 <= lifetime_seconds <= 300:
            raise EvidenceIntegrityError("Attestation lifetime must be bounded")
        # Never accept a caller-selected endpoint; the Journal's dataset
        # allowlist enforces the pinned official institutional research pilot.
        if ((source_code, dataset_code) not in {
            ("IBGE", "CENSO2022_4714"),
            # IBGE metadata and period listing are separate institutional
            # evidence resources checked by the existing composite receipt.
            # They are NOT normalized IndicatorObservation items and MUST
            # never be mis-signed as a public Timeseries observation batch.
            ("WORLD_BANK", "WDI_POP_TOTAL_BRA_2022"),
        }):
            raise EvidenceIntegrityError("Unreviewed dataset cannot be attested by research issuer")
        manifest = self._evidence.verify(
            source_code, dataset_code, original_http_sha256,
        )
        if (manifest.notes.get("publicationStatus") != "BRONZE_ONLY_UNREVIEWED"
            or manifest.notes.get("licenseReviewStatus") != "REVIEW_REQUIRED"
            or manifest.notes.get("timeseriesPublication") != "NOT_ATTEMPTED"):
            raise EvidenceIntegrityError("Research issuer must not approve publication")
        state = self._journal.audit(source_code, dataset_code)
        if not any(
            revision["responseSha256"] == original_http_sha256
            and revision["successfulFetchCount"] >= 1
            for revision in state["versions"]
        ):
            raise EvidenceIntegrityError("No successful verified acquisition for version")
        directory = (
            self._root / source_code.lower() / dataset_code.lower()
            / "_acquisitions" / acquisition_event_id
        )
        if directory.is_symlink() or not directory.is_dir():
            raise EvidenceIntegrityError("Unsafe or unknown acquisition event")
        outcome_path = directory / "outcome.json"
        if not outcome_path.is_file() or outcome_path.is_symlink():
            raise EvidenceIntegrityError("Requested event did not succeed")
        outcome_bytes = outcome_path.read_bytes()
        if not 1 <= len(outcome_bytes) <= 16_384:
            raise EvidenceIntegrityError("Unbounded event outcome")
        try:
            outcome = json.loads(outcome_bytes)
        except ValueError as exc:
            raise EvidenceIntegrityError("Malformed private event outcome") from exc
        if (outcome.get("schema") != "WORLD_VISION_PRIVATE_ACQUISITION_V1"
            or outcome.get("kind") != "SUCCESS"
            or outcome.get("httpStatus") != 200
            or outcome.get("eventId") != acquisition_event_id
            or outcome.get("responseSha256") != original_http_sha256):
            raise EvidenceIntegrityError("Event is not the explicitly chosen verified success")
        normalized_bytes = manifest.normalized_payload_path.read_bytes()
        observations = projection_items_from_verified_normalized(
            source_code=source_code,
            normalized_ndjson=normalized_bytes,
        )
        if len(observations) != manifest.record_count:
            raise EvidenceIntegrityError("Normalized item count differs from verified source")
        stamp = manifest.fetched_at_utc.astimezone(UTC)
        now = datetime.now(UTC)
        # A signed verification reflects the real old fetch; the token itself
        # is short-lived and may be reissued for the same unchanged evidence.
        encoded_public = self._signing_key.public_key().public_bytes(
            encoding=self._serialization_encoding(),
            format=self._serialization_format(),
        )
        record = {
            "schema": _SCHEMA,
            "operation": _OPERATION,
            "sourceCode": source_code,
            "datasetCode": dataset_code,
            "runKey": manifest.run_id,
            "fetchedAtEpochSec": int(stamp.timestamp()),
            "fetchedAtNano": stamp.microsecond * 1000,
            "originalHttpSha256": original_http_sha256,
            "normalizedNdjsonSha256": sha256(normalized_bytes).hexdigest(),
            "manifestSha256": sha256(manifest.manifest_path.read_bytes()).hexdigest(),
            "acquisitionEventId": acquisition_event_id,
            "acquisitionOutcomeSha256": sha256(outcome_bytes).hexdigest(),
            "itemsSha256": items_sha256(observations),
            "issuedAtEpochSec": int(now.timestamp()),
            "expiresAtEpochSec": int(now.timestamp()) + lifetime_seconds,
            "signingPublicKeySha256": sha256(encoded_public).hexdigest(),
        }
        signature = self._signing_key.sign(_signing_payload(record))
        if len(signature) != 64:
            raise EvidenceIntegrityError("Private witness signature type is not Ed25519")
        return {**record, "signatureBase64": base64.b64encode(signature).decode("ascii")}

    @staticmethod
    def _serialization_encoding():
        from cryptography.hazmat.primitives.serialization import Encoding
        return Encoding.DER

    @staticmethod
    def _serialization_format():
        from cryptography.hazmat.primitives.serialization import PublicFormat
        return PublicFormat.SubjectPublicKeyInfo
