"""R2B preview-snapshot contract. All synthetic data, no network/third-party articles."""
from dataclasses import replace
from datetime import UTC, datetime, timedelta
import json
from pathlib import Path

import pytest

from ingestion_service.connectors.gdelt_events_feed import EventLink, GdeltEventBatch, GdeltFeedError
from export_gdelt_radar_snapshot import (
    GDELT_CREDIT_URL, GDELT_RIGHTS_URL, LATEST_PUBLIC_NAME, MAX_OUTPUT_BYTES,
    atomic_write_json, create_snapshot,
)

NOW = datetime(2026, 11, 21, 20, 20, tzinfo=UTC)
SLOT = "2026-11-21T20:00:00Z"
OBSERVED = "2026-11-21T20:05:00Z"


def _link(index=1, url=None, **changes):
    value = EventLink(
        source_url=url or f"https://publisher-{index}.example.org/article/{index}?id={index}",
        canonical_key=f"https://publisher-{index}.example.org/article/{index}?id={index}",
        gdelt_event_id=str(10_000 + index),
        gdelt_added_at_utc=SLOT,
        gdelt_event_date="20261121",
        coded_event="043",
        coded_action_country_fips="GB",
    )
    return replace(value, **changes)


def _batch(*, links=None, **changes):
    value = GdeltEventBatch(
        manifest_sha256="a" * 64,
        source_url="https://data.gdeltproject.org/gdeltv2/20261121200000.export.CSV.zip",
        export_md5_verified=True,
        archive_sha256="b" * 64,
        batch_at_utc=SLOT,
        retrieved_at_utc=OBSERVED,
        total_rows_examined=619,
        candidate_rows=619,
        distinct_safe_article_urls=120,
        duplicate_links=476,
        unsafe_or_missing_links=23,
        wrong_slot_rows=0,
        links=tuple(links if links is not None else [_link(1), _link(2)]),
    )
    return replace(value, **changes)


def test_real_batch_metadata_becomes_source_only_gdelt_attributed_preview():
    snapshot = create_snapshot(_batch(), now=NOW)
    assert snapshot["schemaVersion"] == 1
    assert snapshot["kind"] == "WORLD_VISION_GDELT_STATIC_SOURCE_SNAPSHOT"
    assert snapshot["status"] == "DISCOVERY_ONLY"
    assert snapshot["sourceDataset"] == "GDELT_2_EVENTS_EXPORT"
    assert snapshot["providerBatchSlotUtc"] == SLOT
    assert snapshot["providerObservedAtUtc"] == OBSERVED
    assert snapshot["generatedAtUtc"] == "2026-11-21T20:20:00Z"
    assert snapshot["providerLink"] == GDELT_CREDIT_URL
    assert snapshot["gdeltDatasetReuseTermsUrl"] == GDELT_RIGHTS_URL
    assert snapshot["providerAttribution"].startswith("Data: The GDELT Project")
    assert snapshot["eventFactsVerified"] is False
    assert snapshot["publisherTextPresent"] is False
    assert snapshot["editorialIndependenceVerified"] is False
    assert snapshot["originalPublisherArticleRights"] == "NOT_REVIEWED_NO_ARTICLE_TEXT_COPIED"
    assert snapshot["stats"] == {
        "codedRows": 619, "distinctOriginalUrlsFound": 120,
        "duplicateReferencesDropped": 476, "unsafeOrMissingLinks": 23,
        "reportedSlotDiscrepancies": 0, "selectedForPreview": 2,
    }
    for source in snapshot["candidates"]:
        assert source["publisherPublicationTime"] is None
        assert source["status"] == "DISCOVERY_ONLY"
        assert source["editorialIndependenceVerified"] is False
        assert source["gdeltActionGeoFipsCode"] == "GB"
        assert source["gdeltCameoCode"] == "043"
        assert "title" not in source and "fullText" not in source and "summary" not in source
    assert snapshot["candidates"][0]["outletDomainFromUrl"] == "publisher-1.example.org"


def test_transport_integrity_does_not_grant_publication_rights():
    snapshot = create_snapshot(_batch(), now=NOW)
    assert snapshot["providerMd5Verified"] is True
    assert snapshot["originalPublisherArticleRights"].startswith("NOT_REVIEWED")
    assert snapshot["eventFactsVerified"] is False
    assert snapshot["candidates"][0]["editorialIndependenceVerified"] is False


@pytest.mark.parametrize("old,code", [
    ({"export_md5_verified": False}, "unverified_transport"),
    ({"status": "PUBLISHED"}, "inconsistent_source_state"),
    ({"license_reviewed": True}, "inconsistent_source_state"),
    ({"links": ()}, "invalid_snapshot_link_count"),
    ({"links": tuple(_link(i) for i in range(41))}, "invalid_snapshot_link_count"),
    ({"links": (_link(1), _link(1))}, "duplicate_snapshot_links"),
    ({"links": (_link(1, url="http://insecure.example.org/news"),)}, "invalid_snapshot_source_url"),
    ({"links": (_link(1, url="https://user:pass@media.example.org/news"),)}, "invalid_snapshot_source_url"),
    ({"links": (_link(1, publication_time_verified=True),)}, "unverified_article_promoted"),
    ({"links": (_link(1, independence_verified=True),)}, "unverified_article_promoted"),
    ({"links": (_link(1, verification="REVIEWED"),)}, "unverified_article_promoted"),
    ({"batch_at_utc": "2026-11-21T20:40:00Z"}, "future_archive"),
    ({"batch_at_utc": "2026-11-21T13:20:00Z"}, "stale_archive"),
    ({"retrieved_at_utc": "2026-11-21T20:40:00Z"}, "snapshot_precedes_retrieval"),
])
def test_fail_closed_prevents_fake_recentness_unreviewed_promotions_and_bad_urls(old, code):
    with pytest.raises(GdeltFeedError, match=code):
        create_snapshot(_batch(**old), now=NOW)


def test_negative_offset_and_incorrect_wall_clock_do_not_produce_fresh_claim():
    with pytest.raises(GdeltFeedError, match="unaware_snapshot_clock"):
        create_snapshot(_batch(), now=datetime(2026, 11, 21, 20, 20))


def test_preview_file_is_atomic_bounded_and_metadata_only(tmp_path):
    folder = tmp_path / "web-v2" / "public" / "radar"
    target = folder / LATEST_PUBLIC_NAME
    snapshot = create_snapshot(_batch(), now=NOW)
    atomic_write_json(snapshot, target)
    assert target.is_file()
    assert target.stat().st_size < MAX_OUTPUT_BYTES
    assert not list(folder.glob(".radar-*"))
    assert json.loads(target.read_text(encoding="utf-8")) == snapshot
    atomic_write_json(snapshot, target)
    assert json.loads(target.read_text(encoding="utf-8")) == snapshot


def test_preview_writer_refuses_arbitrary_paths_and_symlink(tmp_path):
    record = create_snapshot(_batch(), now=NOW)
    with pytest.raises(GdeltFeedError, match="unsafe_snapshot_filename"):
        atomic_write_json(record, tmp_path / "unrelated-file.json")
    original = tmp_path / "original"
    original.write_text("do not overwrite", encoding="utf-8")
    link = tmp_path / LATEST_PUBLIC_NAME
    link.symlink_to(original)
    with pytest.raises(GdeltFeedError, match="unsafe_snapshot_filename"):
        atomic_write_json(record, link)
    assert original.read_text(encoding="utf-8") == "do not overwrite"


def test_preview_writer_rejects_large_payload_instead_of_creating_file(tmp_path):
    large = create_snapshot(_batch(), now=NOW)
    large["unexpectedField"] = "X" * (MAX_OUTPUT_BYTES + 1)
    with pytest.raises(GdeltFeedError, match="snapshot_oversized"):
        atomic_write_json(large, tmp_path / LATEST_PUBLIC_NAME)
    assert not (tmp_path / LATEST_PUBLIC_NAME).exists()


def test_external_publisher_copyright_never_covered_by_gdelt_dataset_attribution():
    record = create_snapshot(_batch(), now=NOW)
    raw = json.dumps(record)
    assert "article bodies" not in raw
    assert "PUBLISHED" not in raw
    assert "NOT_REVIEWED_NO_ARTICLE_TEXT_COPIED" in raw
    assert "https://www.gdeltproject.org/" in raw
