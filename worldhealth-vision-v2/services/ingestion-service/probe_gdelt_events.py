#!/usr/bin/env python3
"""One-shot provider health/data-structure probe; NOT a scheduled or public feed.

No provider data is written or redistributed: logs are aggregate transport
provenance and row counts. GDELT CAMEO "events" are machine-coded mentions,
not independently established facts or publisher licences.
"""
from __future__ import annotations

import argparse
from dataclasses import asdict
import json
import sys

from ingestion_service.connectors.gdelt_events_feed import (
    GdeltFeedError, GdeltStaticEventsClient, MAX_CANDIDATES,
)


def run() -> int:
    parser = argparse.ArgumentParser(description="Strict, one-shot GDELT v2 Events archive diagnostic")
    parser.add_argument("--max-candidates", type=int, default=5)
    args = parser.parse_args()
    if not 1 <= args.max_candidates <= MAX_CANDIDATES:
        parser.error(f"--max-candidates must be between 1 and {MAX_CANDIDATES}")
    try:
        batch = GdeltStaticEventsClient(timeout_seconds=14).fetch_latest_events(
            max_candidates=args.max_candidates,
        )
    except GdeltFeedError as exc:
        print(json.dumps({"probe": "GDELT_STATIC_EVENTS_R2A", "status": "unavailable",
                          "reason": exc.code, "publication": "none", "approved": False}))
        return 2
    except Exception as exc:
        # Report type only; never print response body, URL token or secrets.
        print(json.dumps({"probe": "GDELT_STATIC_EVENTS_R2A", "status": "transport_error",
                          "reason": type(exc).__name__, "publication": "none", "approved": False}))
        return 3
    # Print only aggregate metrics and provenance; never print third-party
    # headlines/article text or raw URLs in public workflow logs/artifacts.
    output = {
        "probe": "GDELT_STATIC_EVENTS_R2A",
        "provider": "GDELT 2.0 raw 15m Events, static HTTPS",
        "status": "parsed_discovery_only",
        "slotUtc": batch.batch_at_utc,
        "retrievedUtc": batch.retrieved_at_utc,
        "manifestSha256": batch.manifest_sha256,
        "zipSha256": batch.archive_sha256,
        "providerMd5Verified": batch.export_md5_verified,
        "totalRows": batch.total_rows_examined,
        "candidateRows": batch.candidate_rows,
        "distinctSafeHttpsArticleLinks": batch.distinct_safe_article_urls,
        "duplicateSameArticleLinks": batch.duplicate_links,
        "unsafeOrMissingLinks": batch.unsafe_or_missing_links,
        "providerSlotDiscrepancies": batch.wrong_slot_rows,
        "sampleCandidateCount": len(batch.links),
        "verifiedArticleContent": False,
        "verifiedEvents": 0,
        "licensedForPublicRedistribution": False,
        "publication": "none",
    }
    print(json.dumps(output, sort_keys=True))
    return 0


if __name__ == "__main__":
    sys.exit(run())
