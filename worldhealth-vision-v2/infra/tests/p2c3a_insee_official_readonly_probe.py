#!/usr/bin/env python3
"""ONE controlled P2C3A INSEE Melodi read-only probe.

Runs ONLY in a designated GitHub CI job, never deploys/publicly ingests.
Two tightly filtered HTTPS GETs with a pause, preserving signed hashes of
source bytes in PRIVATE ephemerally retained Bronze storage. Reports a
non-sensitive digest + audit result and deletes all raw material on cleanup.
"""
from __future__ import annotations

import argparse
from pathlib import Path
from hashlib import sha256
import json
import time

from ingestion_service.bronze_store import BronzeStore
from ingestion_service.connectors.insee_melodi_population_research import (
    InseePrivatePopulationClient, SOURCE, DATASET,
    REVIEWED_REFERENCE_PMUN,
)
from ingestion_service.pipelines.insee_melodi_population_research import (
    InseePrivatePopulationPilot,
)
from ingestion_service.source_evidence_store import QuarantinedJsonEvidenceStore


def check(root: Path, twice: bool) -> None:
    client = InseePrivatePopulationClient(timeout_seconds=20)
    pilot = InseePrivatePopulationPilot(client=client, bronze_store=BronzeStore(root))
    receipts = []
    for attempt in range(2 if twice else 1):
        if attempt:
            time.sleep(5)  # Conservative: <12 calls/min even on manual tests.
        receipt = pilot.capture()
        assert receipt.notes["publicationStatus"] == "BRONZE_ONLY_UNREVIEWED"
        assert receipt.notes["licenseReviewStatus"] == "REVIEW_REQUIRED"
        assert receipt.notes["timeseriesPublication"] == "NOT_ATTEMPTED"
        assert receipt.notes["geographicScope"].startswith("France hors Mayotte")
        verified = QuarantinedJsonEvidenceStore(root).verify(
            SOURCE, DATASET, receipt.notes["httpBodySha256"])
        assert verified.notes["referenceYear"] == 2023
        assert verified.notes["originalMeasure"] == "PMUN"
        line = json.loads(verified.normalized_payload_path.read_text().splitlines()[0])
        assert line["value"] == float(REVIEWED_REFERENCE_PMUN)
        receipts.append(receipt)
    journal = BronzeStore(root).private_acquisition_journal()
    audit = journal.audit(SOURCE, DATASET)
    assert audit["successCount"] == len(receipts)
    assert audit["failureCount"] == 0
    revisions = QuarantinedJsonEvidenceStore(root).list_verified_revisions(
        SOURCE, DATASET)
    assert len(revisions) in (1, 2)
    # Public logs contain digests and metadata only: NO raw API JSON, no tokens,
    # and no assertion of authorization for commercial redistribution.
    hashes = [r.notes["httpBodySha256"] for r in receipts]
    print("PASS P2C3A: official HTTPS read-only research, exactly",
          len(receipts), "GETs; raw SHA256=" + ",".join(hashes))
    print("PASS P2C3A: immutable private source revisions=",
          len(revisions), "; distinct checks=" + str(audit["successCount"]))
    print("PASS P2C3A: FEHM/PMUN/2023 pinned, official reference consistent,",
          "NO_PUBLIC_API_INGEST, NO PROVIDER LICENSE CLAIM")
    if len(set(hashes)) > 1:
        print("NOTICE: provider returned two distinct byte revisions;"
              " both preserved; manual change review required")


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--bronze-root", required=True, type=Path)
    parser.add_argument("--twice", action="store_true")
    args = parser.parse_args()
    check(args.bronze_root, args.twice)
