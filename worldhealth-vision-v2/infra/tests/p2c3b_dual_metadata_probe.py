#!/usr/bin/env python3
"""World-Vision P2C3B optional TWO-GET private source review.

Make only two fixed official Insee HTTPS GETs: dataset catalog metadata
and national PTOT observation. Verify both independent SHA256 archives
and scope coherence; never infer ISO3 FRA. The raw bytes are destroyed
before the ephemeral CI runner ends and are NEVER uploaded or printed.
No Timeseries, signing keys, official data publication or rights grant.
"""
from __future__ import annotations

import os
from pathlib import Path
import shutil

from ingestion_service.connectors.insee_melodi_catalog_review import (
    InseeMelodiCatalogResearchClient,
    validate_population_and_metadata,
    CATALOG_DATASET_CODE,
)
from ingestion_service.connectors.insee_melodi_reference_client import (
    InseeMelodiReferenceResearchClient,
    capture_private_insee_evidence,
)
from ingestion_service.source_evidence_store import QuarantinedJsonEvidenceStore


def main() -> None:
    if os.environ.get("WHV_INSEE_DUAL_REVIEW_GETS_ENABLED") != "YES_PRIVATE_METADATA_REVIEW":
        raise SystemExit("Fail-closed: two institutional GETs require private review opt-in")
    root = Path(os.environ["RUNNER_TEMP"]).resolve() / "whv-insee-dual-source-private"
    if root.exists() or root.is_symlink():
        raise SystemExit("Refuse previous or symlinked private source evidence root")
    root.mkdir(parents=True, mode=0o700)
    try:
        catalog = InseeMelodiCatalogResearchClient(allow_live=True).fetch()
        observations = InseeMelodiReferenceResearchClient(allow_live=True).fetch()
        validate_population_and_metadata(observations, catalog)
        archive = capture_private_insee_evidence(
            root=root, rows=observations, metadata=catalog)
        assert archive.notes["catalogHttpBodySha256"] == catalog.original_http_sha256
        assert archive.notes["geographicScopeId"] == "FEHM"
        assert archive.notes["countryMappingStatus"] == "NOT_MAPPED_TO_ISO3"
        assert archive.notes["timeseriesPublication"] == "NOT_ATTEMPTED"
        store = QuarantinedJsonEvidenceStore(root)
        received = store.verify(
            "INSEE", "DS_POPULATIONS_REFERENCE",
            observations[0].original_http_sha256)
        official = store.verify(
            "INSEE", CATALOG_DATASET_CODE,
            catalog.original_http_sha256)
        assert received.raw_payload_path.read_bytes() == observations[0].raw_response_bytes
        assert official.raw_payload_path.read_bytes() == catalog.original_metadata_bytes
        print("PASS: 2 exact official read-only GETs and two independent SHA256 Bronze receipts")
        print("PASS: metadata verifies FEHM = France hors Mayotte, not automatically FRA")
        print("PASS: matching 2023 observation period / 2025 geographic reference and Insee publisher")
        print("PASS: statistical unit Individu, source metadata revision provenance recorded privately")
        print("NO PUBLIC RELEASE: 0 Timeseries writes, no license signed, no institutional value printed")
    finally:
        shutil.rmtree(root)


if __name__ == "__main__":
    main()
