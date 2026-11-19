"""DATA-1B2B: auditable IBGE SourceEvidenceReceipt over three exact revisions.

A composite is a PRIVATE research receipt, not a transaction across three HTTP
endpoints, evidence of simultaneous provider consistency, reuse permission or
a production publish token. Its selection is explicit; never pick "latest".
"""
from __future__ import annotations

from datetime import UTC, datetime
from hashlib import sha256
import json
import os
from pathlib import Path
import re
import secrets

from ingestion_service.acquisition_journal import (
    AcquisitionJournal, _serialized, _sync_dir, _write_new,
)
from ingestion_service.source_evidence_store import (
    EvidenceIntegrityError, QuarantinedJsonEvidenceStore,
)
from ingestion_service.source_rights_review import (
    ReviewedRight, ibge_census_4714_initial_review, inspect_reuse_claim,
)

_SHA = re.compile(r"^[a-f0-9]{64}$")
_DATASETS = (
    ("CENSO2022_4714", "population"),
    ("CENSO2022_4714_METADATA", "aggregateMetadata"),
    ("CENSO2022_4714_PERIODS", "officialPeriods"),
)
_SCHEMA = "WORLD_VISION_PRIVATE_COMPOSITE_RECEIPT_V1"


class IbgeCompositeReceiptStore:
    def __init__(self, bronze_root: Path):
        self._root = Path(bronze_root)
        self._revisions = QuarantinedJsonEvidenceStore(bronze_root)
        self._journal = AcquisitionJournal(bronze_root)

    def _receipt_root(self) -> Path:
        current = self._root
        for component in ("ibge", "_composite_receipts"):
            if current.is_symlink():
                raise EvidenceIntegrityError("Unsafe composite receipt root")
            current = current / component
            if current.is_symlink():
                raise EvidenceIntegrityError("Symlinked composite receipt directory")
        return current

    def _verify_part(self, dataset_code: str, digest: str, role: str) -> dict:
        if not isinstance(digest, str) or not _SHA.fullmatch(digest):
            raise EvidenceIntegrityError("Explicit SHA-256 must select each evidence revision")
        verified = self._revisions.verify("IBGE", dataset_code, digest)
        notes = verified.notes
        if (notes.get("countryIso3") != "BRA"
            or notes.get("referenceYear") != 2022
            or notes.get("licenseReviewStatus") != "REVIEW_REQUIRED"
            or notes.get("publicationStatus") != "BRONZE_ONLY_UNREVIEWED"
            or notes.get("timeseriesPublication") != "NOT_ATTEMPTED"):
            raise EvidenceIntegrityError("Evidence has unexpected scope or weakened quarantine")
        if role == "population":
            if (notes.get("sourceType") != "NATIONAL_OFFICIAL"
                or notes.get("observations") != 1):
                raise EvidenceIntegrityError("Selected population evidence is not 2022 national census")
            row = json.loads(verified.normalized_payload_path.read_text(encoding="utf-8").splitlines()[0])
            if (row.get("country_iso3") != "BRA"
                or row.get("indicator_code") != "IBGE.CENSUS2022.RESIDENT_POP"
                or row.get("period_label") != "2022"
                or row.get("value_status") != "OBSERVED"
                or row.get("source_metadata", {}).get("originalAggregateId") != "4714"
                or row.get("source_metadata", {}).get("originalVariableId") != "93"):
                raise EvidenceIntegrityError("Population normalization contract differs")
        else:
            if (notes.get("tableId") != "4714" or notes.get("variableId") != "93"
                or notes.get("geographicLevel") != "N1"
                or notes.get("sourceInstitution") != "IBGE"
                or notes.get("resource") != (
                    "AGGREGATE_METADATA" if role == "aggregateMetadata"
                    else "OFFICIAL_PERIOD_LIST"
                )):
                raise EvidenceIntegrityError("Metadata/period evidence contract differs")
        verified_events = self._journal.audit("IBGE", dataset_code)
        match = next(
            (v for v in verified_events["versions"] if v["responseSha256"] == digest),
            None,
        )
        if match is None or match["successfulFetchCount"] < 1:
            raise EvidenceIntegrityError("Composite cannot link a version without successful acquisition event")
        # Digest covers the exact original byte manifest, normalized digest and
        # current event count. It contains no original figures or personal data.
        return {
            "role": role, "sourceCode": "IBGE", "datasetCode": dataset_code,
            "responseSha256": digest,
            "canonicalJsonSha256": notes["rawSha256"],
            "normalizedNdjsonSha256": notes["normalizedNdjsonSha256"],
            "manifestSha256": sha256(verified.manifest_path.read_bytes()).hexdigest(),
            "sourceUrl": notes["sourceUrl"],
            "firstSeenAtUtc": match["firstSeenAtUtc"],
            "lastSeenAtUtc": match["lastSeenAtUtc"],
            "successfulFetchCountAtReceipt": match["successfulFetchCount"],
        }

    def create(self, *, population_sha256: str, metadata_sha256: str,
               periods_sha256: str) -> dict:
        selections = (population_sha256, metadata_sha256, periods_sha256)
        links = [self._verify_part(dataset, digest, role)
                 for (dataset, role), digest in zip(_DATASETS, selections, strict=True)]
        review = ibge_census_4714_initial_review()
        decision = inspect_reuse_claim(
            review, institution_code="IBGE", dataset_code="CENSO2022_4714",
            jurisdiction_iso3="BRA", operation=ReviewedRight.PUBLIC_COMMERCIAL_DISPLAY,
            evaluated_at=datetime.now(UTC),
        )
        if decision.status != "BLOCKED":
            # Fail closed even if someone later changes the default review.
            raise EvidenceIntegrityError("Composite pilot must not authorise public publication")
        review_bytes = json.dumps(
            review.model_dump(mode="json"), ensure_ascii=False, sort_keys=True,
            separators=(",", ":"),
        ).encode("utf-8")
        receipt = {
            "schema": _SCHEMA,
            "sourceInstitution": "IBGE",
            "countryIso3": "BRA", "geographicLevel": "N1",
            "referenceYear": 2022, "variableId": "93", "tableId": "4714",
            "indicatorCode": "IBGE.CENSUS2022.RESIDENT_POP",
            "evidenceParts": links,
            "rightsReviewStatus": review.review_status.value,
            "rightsReviewEvidenceSha256": sha256(review_bytes).hexdigest(),
            "commercialReuseAdvice": "BLOCKED",
            "sourceComparability": "NOT_YET_REVIEWED",
            "simultaneousProviderSnapshot": False,
            "publicationStatus": "BRONZE_ONLY_UNREVIEWED",
            "timeseriesPublication": "NOT_ATTEMPTED",
            "publicDisplayAuthorised": False,
        }
        raw = _serialized(receipt)
        digest = sha256(raw).hexdigest()
        root = self._receipt_root()
        root.mkdir(parents=True, mode=0o700, exist_ok=True)
        os.chmod(root, 0o700)
        destination = root / (digest + ".json")
        if destination.is_symlink():
            raise EvidenceIntegrityError("Unsafe composite receipt")
        if destination.exists():
            if destination.read_bytes() != raw:
                raise EvidenceIntegrityError("Existing composite receipt was modified")
        else:
            staged = root / (".receipt-" + secrets.token_hex(16))
            try:
                _write_new(staged, raw)
                os.link(staged, destination, follow_symlinks=False)
                _sync_dir(root)
            except FileExistsError:
                if destination.is_symlink() or destination.read_bytes() != raw:
                    raise EvidenceIntegrityError("Concurrent composite receipt conflict")
            finally:
                staged.unlink(missing_ok=True)
        return {
            "receiptSha256": digest,
            "relativePath": "ibge/_composite_receipts/" + digest + ".json",
            "publicationStatus": "BLOCKED_PENDING_DATASET_RIGHTS_AND_OPS",
            "selectedRevisions": {part["role"]: part["responseSha256"] for part in links},
            "successfulAcquisitionsAtReceipt": {
                part["role"]: part["successfulFetchCountAtReceipt"] for part in links
            },
        }

    def verify(self, receipt_sha256: str) -> dict:
        if not isinstance(receipt_sha256, str) or not _SHA.fullmatch(receipt_sha256):
            raise EvidenceIntegrityError("Invalid composite receipt ID")
        path = self._receipt_root() / (receipt_sha256 + ".json")
        if not path.is_file() or path.is_symlink() or path.stat().st_size > 16_384:
            raise EvidenceIntegrityError("Composite receipt missing or unsafe")
        payload = path.read_bytes()
        if sha256(payload).hexdigest() != receipt_sha256:
            raise EvidenceIntegrityError("Composite receipt content was modified")
        try:
            record = json.loads(payload)
        except ValueError as exc:
            raise EvidenceIntegrityError("Invalid composite receipt JSON") from exc
        if (not isinstance(record, dict) or record.get("schema") != _SCHEMA
            or record.get("publicDisplayAuthorised") is not False
            or record.get("timeseriesPublication") != "NOT_ATTEMPTED"
            or record.get("commercialReuseAdvice") != "BLOCKED"
            or record.get("sourceComparability") != "NOT_YET_REVIEWED"
            or record.get("simultaneousProviderSnapshot") is not False
            or record.get("countryIso3") != "BRA"
            or record.get("tableId") != "4714"
            or record.get("variableId") != "93"
            or not isinstance(record.get("evidenceParts"), list)
            or len(record["evidenceParts"]) != 3):
            raise EvidenceIntegrityError("Composite receipt scope or publication block changed")
        for (dataset, role), part in zip(_DATASETS, record["evidenceParts"], strict=True):
            if part.get("datasetCode") != dataset or part.get("role") != role:
                raise EvidenceIntegrityError("Composite receipt part order changed")
            verified = self._revisions.verify("IBGE", dataset, part["responseSha256"])
            if (part.get("manifestSha256") != sha256(verified.manifest_path.read_bytes()).hexdigest()
                or part.get("normalizedNdjsonSha256") != verified.notes["normalizedNdjsonSha256"]
                or part.get("canonicalJsonSha256") != verified.notes["rawSha256"]):
                raise EvidenceIntegrityError("Composite referenced evidence changed")
            audits = self._journal.audit("IBGE", dataset)
            entry = next(
                (v for v in audits["versions"]
                 if v["responseSha256"] == part["responseSha256"]),
                None,
            )
            if (entry is None
                or entry["successfulFetchCount"] < part.get("successfulFetchCountAtReceipt", 1)
                or entry["firstSeenAtUtc"] != part.get("firstSeenAtUtc")):
                raise EvidenceIntegrityError("Composite acquisition proof missing or altered")
        review = ibge_census_4714_initial_review()
        current_review = sha256(json.dumps(
            review.model_dump(mode="json"), ensure_ascii=False, sort_keys=True,
            separators=(",", ":"),
        ).encode("utf-8")).hexdigest()
        if current_review != record.get("rightsReviewEvidenceSha256"):
            raise EvidenceIntegrityError("Composite rights snapshot differs")
        return {"receiptSha256": receipt_sha256,
                "linkedEvidenceCount": 3,
                "publicDisplayAuthorised": False,
                "commercialReuseAdvice": "BLOCKED",
                "sourceComparability": "NOT_YET_REVIEWED"}
