#!/usr/bin/env python3
"""P2C3: one official allowlisted HTTPS GET in opt-in private GitHub CI only.

The original HTTP bytes are stored only on a disposable runner's PRIVATE
filesystem, verified, and deleted in finally. Never publish, sign rights,
log statistic values or upload provider bytes as GitHub artifacts.
"""
from __future__ import annotations

import os
from pathlib import Path
import shutil

from ingestion_service.connectors.insee_melodi_reference_client import (
    InseeMelodiReferenceResearchClient,
    capture_private_insee_evidence,
    SOURCE_CODE, DATASET_CODE,
)
from ingestion_service.source_evidence_store import QuarantinedJsonEvidenceStore


def main() -> None:
    if os.environ.get("WHV_INSEE_PRIVATE_PROBE_ENABLED") != "YES_RESEARCH_READ_ONLY":
        raise SystemExit("Fail closed: opt-in private source network probe not enabled")
    root = Path(os.environ["RUNNER_TEMP"]).resolve() / "whv-insee-research-quarantine"
    if root.exists() or root.is_symlink():
        raise SystemExit("Refusing to overwrite any previous evidence directory")
    root.mkdir(parents=True, mode=0o700)
    try:
        rows = InseeMelodiReferenceResearchClient(allow_live=True).fetch()
        first = rows[0]
        receipt = capture_private_insee_evidence(root=root, rows=rows)
        verified = QuarantinedJsonEvidenceStore(root).verify(
            SOURCE_CODE, DATASET_CODE, first.original_http_sha256,
        )
        assert verified.raw_payload_path.read_bytes() == first.raw_response_bytes
        assert receipt.notes["timeseriesPublication"] == "NOT_ATTEMPTED"
        assert receipt.notes["licenseReviewStatus"] == "REVIEW_REQUIRED"
        print("PASS: single source-allowlisted official HTTPS GET and private Bronze verification")
        print("RESEARCH ONLY: periods=" + ",".join(str(row.year) for row in rows))
        print("REVIEW REQUIRED: source geometry FRANCE-F versus ISO3 FRA; PTOT measure")
        print("REVIEW REQUIRED: method, unit, reuse license, distribution rights and revisions")
        print("Timeseries writes=ZERO; PUBLIC_API_INGEST=NOT_GRANTED")
    finally:
        shutil.rmtree(root)


if __name__ == "__main__":
    main()
