"""R2A unit/regression tests — no external GDELT calls or article scraping."""
from __future__ import annotations

from dataclasses import asdict
from datetime import UTC, datetime
from hashlib import md5
import io
import json
import zipfile

import httpx
import pytest

from ingestion_service.connectors.gdelt_events_feed import (
    ARCHIVE_MAX_BYTES, GdeltFeedError, GdeltStaticEventsClient,
    MANIFEST_URL, MAX_CANDIDATES, SCHEMA_ID,
    parse_event_archive, parse_manifest, _safe_source_article_url,
)

SLOT = "20261121194500"
FIXED_NOW = datetime(2026, 11, 21, 20, 0, tzinfo=UTC)


def _row(event_id: int = 123, *, url: str = "https://media.example.org/story?utm_source=GDELT",
         slot: str = SLOT, fips: str = "GB") -> list[str]:
    record = [""] * 61
    record[0] = str(event_id)
    record[1] = "20261121"
    record[26] = "043"
    record[53] = fips
    record[59] = slot
    record[60] = url
    return record


def _build_zip(rows: list[list[str]], *, filename: str | None = None,
               extra: bool = False) -> bytes:
    name = filename or f"{SLOT}.export.CSV"
    stream = io.BytesIO()
    with zipfile.ZipFile(stream, "w", zipfile.ZIP_DEFLATED) as opened:
        opened.writestr(name, "\n".join("\t".join(fields) for fields in rows) + "\n")
        if extra:
            opened.writestr("extra.txt", "unapproved")
    return stream.getvalue()


def _manifest(archive: bytes, *, stamp: str = SLOT,
              bad_md5: bool = False, wrong_host: bool = False,
              extra_rows: bool = False) -> bytes:
    digest = "0" * 32 if bad_md5 else md5(archive).hexdigest()
    host = "evil.example.org" if wrong_host else "data.gdeltproject.org"
    files = {
        "export": (len(archive), digest),
        "mentions": (50, "a" * 32),
        "gkg": (200, "b" * 32),
    }
    lines = [
        f"{size} {digest} http://{host}/gdeltv2/{stamp}.{kind}.CSV.zip"
        for kind, (size, digest) in files.items()
    ]
    if extra_rows:
        lines.append(lines[0])
    return ("\n".join(lines) + "\n").encode("ascii")


def _provider(handler):
    def respond(req: httpx.Request) -> httpx.Response:
        assert req.url.scheme == "https"
        assert req.url.host == "data.gdeltproject.org", "Never fetch GDELT-derived article URLs"
        assert req.method == "GET"
        assert not req.headers.get("cookie")
        return handler(req)
    return httpx.MockTransport(respond)


def _one() -> tuple[bytes, bytes]:
    archive = _build_zip([_row()])
    return _manifest(archive), archive


def test_manifest_three_products_canonical_https_and_source_slot():
    raw, archive = _one()
    manifest = parse_manifest(raw, as_of=FIXED_NOW)
    assert manifest.export().size_bytes == len(archive)
    assert manifest.export().md5_hex == md5(archive).hexdigest()
    assert manifest.export().url == (
        "https://data.gdeltproject.org/gdeltv2/20261121194500.export.CSV.zip"
    )
    assert {item.kind for item in manifest.entries} == {"export", "mentions", "gkg"}
    assert manifest.export().added_at_utc == "2026-11-21T19:45:00Z"
    assert manifest.raw_sha256
    assert manifest.as_of_utc == "2026-11-21T20:00:00Z"


@pytest.mark.parametrize("broken,code", [
    (b"", "invalid_manifest_size"),
    (b"bad text", "unexpected_manifest_lines"),
    (b"\xff\xfe", "non_ascii_manifest"),
    (_manifest(_build_zip([_row()]), wrong_host=True), "invalid_manifest_row"),
    (_manifest(_build_zip([_row()]), extra_rows=True), "unexpected_manifest_lines"),
    (_manifest(_build_zip([_row()])).replace(b".mentions.CSV.zip", b".export.CSV.zip"),
     "unexpected_manifest_kind"),
    (_manifest(_build_zip([_row()])).replace(b"20261121194500.gkg", b"20261231194500.gkg"),
     "mismatched_feed_slots"),
    (_manifest(_build_zip([_row()]), stamp="20261321194500"), "invalid_timestamp"),
    (_manifest(_build_zip([_row()]), stamp="20271121194500"), "future_feed_slot"),
])
def test_manifest_fail_closed(broken, code):
    with pytest.raises(GdeltFeedError, match=code):
        parse_manifest(broken, as_of=FIXED_NOW)


def test_manifest_rejects_unaware_operator_clock():
    with pytest.raises(GdeltFeedError, match="unaware_now"):
        parse_manifest(_one()[0], as_of=datetime(2026, 11, 21))


def test_real_column_locations_are_retained_as_provider_coding_not_geo_iso():
    raw, archive = _one()
    parsed = parse_event_archive(parse_manifest(raw, as_of=FIXED_NOW), archive,
                                 retrieved_at=FIXED_NOW)
    assert parsed.status == "DISCOVERY_ONLY"
    assert parsed.license_reviewed is False
    assert parsed.export_md5_verified is True
    assert parsed.total_rows_examined == 1
    assert parsed.candidate_rows == 1
    assert parsed.distinct_safe_article_urls == 1
    assert parsed.duplicate_links == 0
    assert parsed.wrong_slot_rows == 0
    assert parsed.archive_sha256
    assert parsed.source_url.endswith(".export.CSV.zip")
    assert parsed.batch_at_utc == "2026-11-21T19:45:00Z"
    assert parsed.retrieved_at_utc == "2026-11-21T20:00:00Z"
    assert len(parsed.links) == 1
    item = parsed.links[0]
    assert item.source_url == "https://media.example.org/story?utm_source=GDELT"
    assert item.canonical_key == "https://media.example.org/story"
    assert item.gdelt_event_id == "123"
    assert item.gdelt_event_date == "20261121"
    assert item.gdelt_added_at_utc == "2026-11-21T19:45:00Z"
    assert item.coded_event == "043"
    assert item.coded_action_country_fips == "GB"
    assert item.verification == "DISCOVERY_ONLY"
    assert item.publication_time_verified is False
    assert item.independence_verified is False
    assert "published_at" not in asdict(item)
    assert "event_confirmed" not in asdict(item)
    assert SCHEMA_ID.startswith("GDELT_2_RAW_EVENTS")


def test_duplicate_same_url_only_with_tracking_removed_and_no_title_guesses():
    rows = [
        _row(1, url="https://world.example.org/news?id=42&utm_source=share"),
        _row(2, url="https://world.example.org/news?id=42&utm_source=gdelt"),
        _row(3, url="https://world.example.org/news?id=43"),
        _row(4, url="https://127.0.0.1/internal"),
        _row(5, url="http://world.example.org/news?id=44"),
        _row(6, url="not a url"),
    ]
    archive = _build_zip(rows)
    parsed = parse_event_archive(parse_manifest(_manifest(archive), as_of=FIXED_NOW), archive)
    assert parsed.total_rows_examined == 6
    assert parsed.distinct_safe_article_urls == 2
    assert parsed.duplicate_links == 1
    assert parsed.unsafe_or_missing_links == 3
    assert len(parsed.links) == 2
    assert parsed.links[0].canonical_key.endswith("id=42")
    assert parsed.links[1].canonical_key.endswith("id=43")


@pytest.mark.parametrize("url", [
    "javascript:alert(1)", "file:///etc/passwd", "http://media.example.org/article",
    "https://localhost/a", "https://10.1.1.1/a", "https://192.168.1.1/a",
    "https://169.254.169.254/latest/meta-data", "https://[::1]/a",
    "https://user:password@media.example.org/a", "https://media.local/a",
])
def test_article_links_cannot_be_used_as_private_network_targets(url):
    assert _safe_source_article_url(url) is None


def test_source_url_is_never_fetched_even_if_present_in_real_provider_export():
    manifest, archive = _one()
    calls = []

    def handle(req):
        calls.append(str(req.url))
        return httpx.Response(200, content=manifest if str(req.url) == MANIFEST_URL else archive)
    client = GdeltStaticEventsClient(timeout_seconds=2, transport=_provider(handle))
    batch = client.fetch_latest_events()
    assert len(batch.links) == 1
    assert calls == [
        "https://data.gdeltproject.org/gdeltv2/lastupdate.txt",
        "https://data.gdeltproject.org/gdeltv2/20261121194500.export.CSV.zip",
    ]


def test_corrupt_manifest_digest_and_size_never_return_trusted_candidate():
    archive = _build_zip([_row()])
    with pytest.raises(GdeltFeedError, match="export_manifest_digest_mismatch"):
        parse_event_archive(parse_manifest(_manifest(archive, bad_md5=True), as_of=FIXED_NOW), archive)
    altered = archive + b"extra"
    with pytest.raises(GdeltFeedError, match="export_size_mismatch"):
        parse_event_archive(parse_manifest(_manifest(archive), as_of=FIXED_NOW), altered)


def test_zip_unsafe_entries_schema_and_uncompressed_limits():
    archive = _build_zip([_row()], extra=True)
    with pytest.raises(GdeltFeedError, match="unsafe_archive_entries"):
        parse_event_archive(parse_manifest(_manifest(archive), as_of=FIXED_NOW), archive)

    archive = _build_zip([_row()], filename="../20261121194500.export.CSV")
    with pytest.raises(GdeltFeedError, match="unexpected_archive_member"):
        parse_event_archive(parse_manifest(_manifest(archive), as_of=FIXED_NOW), archive)

    wrong = _row()[:-1]
    archive = _build_zip([wrong])
    with pytest.raises(GdeltFeedError, match="changed_event_schema"):
        parse_event_archive(parse_manifest(_manifest(archive), as_of=FIXED_NOW), archive)


def test_archive_rejects_old_excessive_row_and_links_without_silently_dropping_event_coding():
    rows = [_row(i + 1, url=f"https://media.example.org/news/{i}") for i in range(50)]
    archive = _build_zip(rows)
    manifest = parse_manifest(_manifest(archive), as_of=FIXED_NOW)
    batch = parse_event_archive(manifest, archive, max_candidates=10)
    assert batch.total_rows_examined == 50
    assert batch.distinct_safe_article_urls == 50
    assert len(batch.links) == 10
    assert batch.links[0].gdelt_event_id == "1"
    assert batch.links[-1].gdelt_event_id == "10"
    with pytest.raises(GdeltFeedError, match="invalid_candidate_limit"):
        parse_event_archive(manifest, archive, max_candidates=MAX_CANDIDATES + 1)


@pytest.mark.parametrize("status,code", [
    (429, "provider_throttled"),
    (403, "provider_http_403"),
    (404, "provider_http_404"),
    (503, "provider_http_503"),
])
def test_realistic_http_errors_fail_without_second_request(status, code):
    calls = []

    def handle(request):
        calls.append(str(request.url))
        return httpx.Response(status, content=b"error")
    client = GdeltStaticEventsClient(transport=_provider(handle))
    with pytest.raises(GdeltFeedError, match=code):
        client.fetch_latest_events()
    assert calls == [MANIFEST_URL], "No auto retries, alternate hosts or scraping"


def test_bounded_manifest_and_export_refuse_oversize_before_any_zip_fetch():
    raw, archive = _one()

    def handle(request):
        if str(request.url) == MANIFEST_URL:
            return httpx.Response(200, content=raw, headers={"Content-Length": str(100_000)})
        raise AssertionError("Would have downloaded a ZIP on invalid manifest")
    with pytest.raises(GdeltFeedError, match="oversized_response"):
        GdeltStaticEventsClient(transport=_provider(handle)).fetch_latest_events()
    too_big_export = _manifest(archive).replace(
        str(len(archive)).encode(), str(ARCHIVE_MAX_BYTES + 1).encode(), 1
    )
    def reject_export(request):
        assert str(request.url) == MANIFEST_URL
        return httpx.Response(200, content=too_big_export)
    with pytest.raises(GdeltFeedError, match="export_archive_over_budget"):
        GdeltStaticEventsClient(transport=_provider(reject_export)).fetch_latest_events()


def test_no_redirects_no_html_no_second_source_when_archive_missing():
    raw, archive = _one()
    called = []
    def handler(req):
        called.append(str(req.url))
        if str(req.url) == MANIFEST_URL:
            return httpx.Response(200, content=raw)
        return httpx.Response(301, headers={"location": "https://evil.example.org/a"})
    with pytest.raises(GdeltFeedError, match="provider_http_301"):
        GdeltStaticEventsClient(transport=_provider(handler)).fetch_latest_events()
    assert len(called) == 2
    assert all(item.startswith("https://data.gdeltproject.org/gdeltv2/") for item in called)
