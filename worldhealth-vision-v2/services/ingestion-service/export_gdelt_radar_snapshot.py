#!/usr/bin/env python3
"""World-Vision GLOBAL RADAR R2B — explicit snapshot export for an offline-built preview.

ONE official GDELT 2.0 raw Events batch -> bounded public-domain-link metadata
JSON -> existing V2 web preview. This is not a news fact-check, article
republication, scheduler, PostgreSQL ingestion, or publisher-license grant.

The GDELT Project explicitly authorizes dataset use/redistribution, including
commercial, WITH mandatory GDELT citation and link:
https://www.gdeltproject.org/about.html#termsofuse
This does NOT transfer copyright/licensing for original publisher ARTICLES.
We never extract article bodies/titles, and do not assert news claims.
"""
from __future__ import annotations

import argparse
from datetime import datetime, timezone
import json
import os
from pathlib import Path
import sys
import tempfile
from urllib.parse import urlsplit

from ingestion_service.connectors.gdelt_events_feed import (
    GdeltEventBatch, GdeltFeedError, GdeltStaticEventsClient, MAX_CANDIDATES,
)

SCHEMA_VERSION = 1
GDELT_CREDIT_URL = "https://www.gdeltproject.org/"
GDELT_RIGHTS_URL = "https://www.gdeltproject.org/about.html"
MAX_OUTPUT_BYTES = 140_000
MAX_STALENESS_SECONDS = 6 * 3600
MAX_CLOCK_LEAD_SECONDS = 15 * 60
LATEST_PUBLIC_NAME = "global-latest.json"


def create_snapshot(batch: GdeltEventBatch, *, now: datetime | None = None) -> dict:
    """Pure conversion; no synthetic fields, no copyrighted article content."""
    if not isinstance(batch, GdeltEventBatch) or not batch.export_md5_verified:
        raise GdeltFeedError("unverified_transport")
    if batch.status != "DISCOVERY_ONLY" or batch.license_reviewed:
        raise GdeltFeedError("inconsistent_source_state")
    when = now or datetime.now(timezone.utc)
    if when.tzinfo is None or when.utcoffset() is None:
        raise GdeltFeedError("unaware_snapshot_clock")
    checked = when.astimezone(timezone.utc)
    try:
        slot = datetime.fromisoformat(batch.batch_at_utc.replace("Z", "+00:00"))
        retrieved = datetime.fromisoformat(batch.retrieved_at_utc.replace("Z", "+00:00"))
    except ValueError as exc:
        raise GdeltFeedError("invalid_snapshot_time") from exc
    if slot.utcoffset() is None or retrieved.utcoffset() is None:
        raise GdeltFeedError("unaware_source_time")
    age_sec = round((checked - slot).total_seconds())
    if age_sec > MAX_STALENESS_SECONDS:
        raise GdeltFeedError("stale_archive")
    if age_sec < -MAX_CLOCK_LEAD_SECONDS:
        raise GdeltFeedError("future_archive")
    if checked < retrieved:
        raise GdeltFeedError("snapshot_precedes_retrieval")
    if not 1 <= len(batch.links) <= MAX_CANDIDATES:
        raise GdeltFeedError("invalid_snapshot_link_count")
    unique_keys: set[str] = set()
    candidates = []
    for item in batch.links:
        if item.verification != "DISCOVERY_ONLY" or item.publication_time_verified or item.independence_verified:
            raise GdeltFeedError("unverified_article_promoted")
        if item.canonical_key in unique_keys:
            raise GdeltFeedError("duplicate_snapshot_links")
        unique_keys.add(item.canonical_key)
        url = urlsplit(item.source_url)
        if url.scheme != "https" or not url.hostname or url.username or url.password:
            raise GdeltFeedError("invalid_snapshot_source_url")
        # Field names deliberately emphasize provider coding and uncertainty.
        candidates.append({
            "url": item.source_url,
            "outletDomainFromUrl": url.hostname.lower(),
            "gdeltEventId": item.gdelt_event_id,
            "gdeltAddedAtUtc": item.gdelt_added_at_utc,
            "gdeltEventDay": item.gdelt_event_date,
            "gdeltCameoCode": item.coded_event,
            "gdeltActionGeoFipsCode": item.coded_action_country_fips,
            "status": "DISCOVERY_ONLY",
            "publisherPublicationTime": None,
            "editorialIndependenceVerified": False,
        })
    result = {
        "schemaVersion": SCHEMA_VERSION,
        "kind": "WORLD_VISION_GDELT_STATIC_SOURCE_SNAPSHOT",
        "status": "DISCOVERY_ONLY",
        "generatedAtUtc": checked.isoformat().replace("+00:00", "Z"),
        "providerObservedAtUtc": batch.retrieved_at_utc,
        "providerBatchSlotUtc": batch.batch_at_utc,
        "sourceDataset": "GDELT_2_EVENTS_EXPORT",
        "providerLink": GDELT_CREDIT_URL,
        "providerAttribution": "Data: The GDELT Project — https://www.gdeltproject.org/",
        "gdeltDatasetReuseTermsUrl": GDELT_RIGHTS_URL,
        "originalPublisherArticleRights": "NOT_REVIEWED_NO_ARTICLE_TEXT_COPIED",
        "publisherTextPresent": False,
        "eventFactsVerified": False,
        "editorialIndependenceVerified": False,
        "sourceManifestSha256": batch.manifest_sha256,
        "sourceArchiveSha256": batch.archive_sha256,
        "providerMd5Verified": True,
        "stats": {
            "codedRows": batch.total_rows_examined,
            "distinctOriginalUrlsFound": batch.distinct_safe_article_urls,
            "duplicateReferencesDropped": batch.duplicate_links,
            "unsafeOrMissingLinks": batch.unsafe_or_missing_links,
            "reportedSlotDiscrepancies": batch.wrong_slot_rows,
            "selectedForPreview": len(candidates),
        },
        "candidates": candidates,
    }
    if len(json.dumps(result, ensure_ascii=False).encode("utf-8")) > MAX_OUTPUT_BYTES:
        raise GdeltFeedError("snapshot_oversized")
    return result


def atomic_write_json(snapshot: dict, target: Path) -> None:
    """Atomic local preview asset only, never source db/public feed publication."""
    if target.name != LATEST_PUBLIC_NAME or target.is_symlink():
        raise GdeltFeedError("unsafe_snapshot_filename")
    target.parent.mkdir(parents=True, exist_ok=True)
    if target.parent.is_symlink():
        raise GdeltFeedError("unsafe_snapshot_directory")
    raw = (json.dumps(snapshot, ensure_ascii=False, separators=(",", ":"), sort_keys=True) + "\n").encode("utf-8")
    if len(raw) > MAX_OUTPUT_BYTES:
        raise GdeltFeedError("snapshot_oversized")
    temp_name = None
    try:
        with tempfile.NamedTemporaryFile(mode="wb", dir=target.parent, prefix=".radar-", delete=False) as stream:
            temp_name = stream.name
            os.chmod(temp_name, 0o644)
            stream.write(raw)
            stream.flush()
            os.fsync(stream.fileno())
        os.replace(temp_name, target)
        temp_name = None
    finally:
        if temp_name is not None:
            Path(temp_name).unlink(missing_ok=True)


def run() -> int:
    parser = argparse.ArgumentParser(description="Build one reviewed-contract GDELT metadata snapshot for V2 preview")
    parser.add_argument("--output", type=Path, required=True,
                        help="Explicit absolute/relative path ending in /radar/global-latest.json")
    args = parser.parse_args()
    if args.output.name != LATEST_PUBLIC_NAME or args.output.parent.name != "radar":
        parser.error("Output must be a radar/global-latest.json asset; not a publisher article dump")
    try:
        batch = GdeltStaticEventsClient(timeout_seconds=14).fetch_latest_events(
            max_candidates=MAX_CANDIDATES,
        )
        snapshot = create_snapshot(batch)
        atomic_write_json(snapshot, args.output)
    except (GdeltFeedError, OSError) as exc:
        # Fail closed, without printing or leaving stale file from earlier builds.
        args.output.unlink(missing_ok=True)
        print(json.dumps({"snapshotStatus": "UNAVAILABLE", "reason": str(exc),
                          "publication": "none", "provider": "GDELT_2_EVENTS_EXPORT"}))
        return 2
    print(json.dumps({
        "snapshotStatus": "DISCOVERY_ONLY",
        "slotUtc": snapshot["providerBatchSlotUtc"],
        "generatedUtc": snapshot["generatedAtUtc"],
        "selectedCandidateLinks": len(snapshot["candidates"]),
        "distinctArticleLinksDetected": snapshot["stats"]["distinctOriginalUrlsFound"],
        "codedGdeltRows": snapshot["stats"]["codedRows"],
        "manifestSha256": snapshot["sourceManifestSha256"],
        "providerMd5Verified": True,
        "providerAttribution": snapshot["providerAttribution"],
        "publisherContentCopied": False,
        "eventFactsVerified": False,
        "publication": "local_preview_asset_only",
    }, sort_keys=True))
    return 0


if __name__ == "__main__":
    sys.exit(run())
