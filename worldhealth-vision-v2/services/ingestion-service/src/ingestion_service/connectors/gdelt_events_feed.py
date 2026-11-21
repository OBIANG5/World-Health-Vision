"""Global Radar R2A: a tightly bounded, rights-unreviewed GDELT 2.0 Event feed probe.

GDELT raw Events CSV (61 tab-separated columns) is algorithmically inferred
*event mentions*, NOT independently verified news. In particular:
- DATEADDED is the GDELT added timestamp, not an original article publish time.
- ActionGeo_CountryCode is GDELT's FIPS-coded inference, NOT ISO3 geography.
- NumSources is a GDELT coding count, NOT independent editorial confirmation.
- SOURCEURL is just a *candidate link*. We NEVER fetch or proxy this URL.
- A valid MD5 binds bytes to the provider's published manifest for transport
  integrity only; it does NOT imply truth, legal publication rights or signing.

No mutation of Bronze, Catalog, Timeseries or any public API here. This pilot
returns bounded diagnostics and optional candidate metadata for review only.
"""
from __future__ import annotations

from dataclasses import dataclass
from collections.abc import Callable
from datetime import datetime, timezone
import csv
from hashlib import md5, sha256
import io
import ipaddress
import re
import time
from typing import Any
from urllib.parse import urlsplit, urlunsplit, parse_qsl, urlencode
import zipfile

import httpx

HOST = "data.gdeltproject.org"
BASE_URL = f"https://{HOST}/gdeltv2"
MANIFEST_URL = f"{BASE_URL}/lastupdate.txt"
MANIFEST_MAX_BYTES = 16_384
ARCHIVE_MAX_BYTES = 8_000_000
UNCOMPRESSED_MAX_BYTES = 85_000_000
MAX_ROWS = 120_000
MAX_CANDIDATES = 40
MAX_COMPRESSION_RATIO = 300
EXPECTED_COLUMNS = 61
SCHEMA_ID = "GDELT_2_RAW_EVENTS_R2A_DISCOVERY_ONLY"
LINE = re.compile(
    r"^(\d{1,9})\s+([0-9a-fA-F]{32})\s+https?://data\.gdeltproject\.org/gdeltv2/"
    r"(\d{14})\.(export|mentions|gkg)\.CSV\.zip$", re.I
)
TIMESTAMP = re.compile(r"^\d{14}$")
TRACKING = re.compile(r"^(?:utm_[a-z0-9_]+|fbclid|gclid|mc_cid|mc_eid)$", re.I)


class GdeltFeedError(ValueError):
    """A quarantined provider/format/transport failure, not zero news."""

    def __init__(self, code: str):
        super().__init__(code)
        self.code = code


@dataclass(frozen=True)
class GdeltEntry:
    kind: str
    size_bytes: int
    md5_hex: str
    added_at_utc: str
    url: str


@dataclass(frozen=True)
class GdeltManifest:
    as_of_utc: str
    entries: tuple[GdeltEntry, ...]
    raw_sha256: str

    def export(self) -> GdeltEntry:
        return next(item for item in self.entries if item.kind == "export")


@dataclass(frozen=True)
class EventLink:
    """Provider-coded candidate only, not an accessible or verified article."""

    source_url: str
    canonical_key: str
    gdelt_event_id: str
    gdelt_added_at_utc: str
    gdelt_event_date: str
    coded_event: str
    coded_action_country_fips: str | None
    verification: str = "DISCOVERY_ONLY"
    publication_time_verified: bool = False
    independence_verified: bool = False


@dataclass(frozen=True)
class GdeltEventBatch:
    manifest_sha256: str
    source_url: str
    export_md5_verified: bool
    archive_sha256: str
    batch_at_utc: str
    retrieved_at_utc: str
    total_rows_examined: int
    candidate_rows: int
    distinct_safe_article_urls: int
    duplicate_links: int
    unsafe_or_missing_links: int
    wrong_slot_rows: int
    links: tuple[EventLink, ...]
    status: str = "DISCOVERY_ONLY"
    license_reviewed: bool = False


def _slot(raw: str) -> str:
    if not TIMESTAMP.fullmatch(raw):
        raise GdeltFeedError("invalid_timestamp")
    try:
        parsed = datetime.strptime(raw, "%Y%m%d%H%M%S").replace(tzinfo=timezone.utc)
    except ValueError as exc:
        raise GdeltFeedError("invalid_timestamp") from exc
    # Canonical UTC without guessed source-publication precision.
    return parsed.isoformat().replace("+00:00", "Z")


def parse_manifest(raw: bytes, *, as_of: datetime | None = None) -> GdeltManifest:
    if not isinstance(raw, bytes) or not 1 <= len(raw) <= MANIFEST_MAX_BYTES:
        raise GdeltFeedError("invalid_manifest_size")
    try:
        lines = raw.decode("ascii").strip().splitlines()
    except UnicodeDecodeError as exc:
        raise GdeltFeedError("non_ascii_manifest") from exc
    if len(lines) != 3:
        raise GdeltFeedError("unexpected_manifest_lines")
    entries: list[GdeltEntry] = []
    for rawline in lines:
        match = LINE.fullmatch(rawline.strip())
        if not match:
            raise GdeltFeedError("invalid_manifest_row")
        size, digest, stamp, kind = match.groups()
        kind = kind.lower()
        provider_path = rawline.strip().split()[-1].split("/gdeltv2/", 1)[-1]
        bytes_expected = int(size)
        if bytes_expected < 1 or bytes_expected > 120_000_000:
            raise GdeltFeedError("invalid_manifest_file_size")
        entries.append(GdeltEntry(
            kind=kind, size_bytes=bytes_expected,
            md5_hex=digest.lower(), added_at_utc=_slot(stamp),
            url=f"{BASE_URL}/{provider_path}",
        ))
    if set(item.kind for item in entries) != {"export", "mentions", "gkg"}:
        raise GdeltFeedError("unexpected_manifest_kind")
    if len({item.added_at_utc for item in entries}) != 1:
        raise GdeltFeedError("mismatched_feed_slots")
    time_now = as_of or datetime.now(timezone.utc)
    if time_now.tzinfo is None or time_now.utcoffset() is None:
        raise GdeltFeedError("unaware_now")
    batch_time = datetime.fromisoformat(entries[0].added_at_utc.replace("Z", "+00:00"))
    # Provider timestamps may be up to 2h ahead due to clocks/timezones,
    # but cannot plausibly be >2d in the future.
    if (batch_time - time_now).total_seconds() > 2 * 86400:
        raise GdeltFeedError("future_feed_slot")
    return GdeltManifest(
        as_of_utc=time_now.astimezone(timezone.utc).isoformat().replace("+00:00", "Z"),
        entries=tuple(entries),
        raw_sha256=sha256(raw).hexdigest(),
    )


def _safe_source_article_url(raw: str) -> tuple[str, str] | None:
    """No SOURCEURL is fetched. This validates outbound HTTPS link shape only."""
    if not isinstance(raw, str) or not 10 <= len(raw) <= 1800:
        return None
    try:
        parsed = urlsplit(raw)
        if parsed.scheme != "https" or parsed.username or parsed.password or parsed.port:
            return None
        hostname = parsed.hostname
        if not hostname or "." not in hostname or hostname.endswith((".local", ".internal", ".test")):
            return None
        if any(ord(char) < 33 or ord(char) > 126 for char in parsed.netloc):
            return None
        try:
            address = ipaddress.ip_address(hostname)
            if not address.is_global:
                return None
        except ValueError:
            # Browser follows outbound publisher URL only on explicit click.
            pass
        if any(ord(char) < 32 for char in raw):
            return None
        outbound = urlunsplit((parsed.scheme, parsed.netloc, parsed.path or "/", parsed.query, ""))
        query = [(key, value) for key, value in parse_qsl(parsed.query, keep_blank_values=True)
                 if not TRACKING.fullmatch(key)]
        canonical = urlunsplit(("https", parsed.netloc.lower(), parsed.path or "/",
                                urlencode(query, doseq=True), ""))
        return outbound, canonical
    except (ValueError, UnicodeError):
        return None


def parse_event_archive(
    manifest: GdeltManifest,
    archive: bytes,
    *,
    retrieved_at: datetime | None = None,
    max_candidates: int = MAX_CANDIDATES,
) -> GdeltEventBatch:
    if not isinstance(manifest, GdeltManifest) or not isinstance(archive, bytes):
        raise GdeltFeedError("invalid_input")
    entry = manifest.export()
    if not 1 <= max_candidates <= MAX_CANDIDATES:
        raise GdeltFeedError("invalid_candidate_limit")
    if entry.size_bytes > ARCHIVE_MAX_BYTES:
        raise GdeltFeedError("export_archive_over_budget")
    if len(archive) != entry.size_bytes or len(archive) > ARCHIVE_MAX_BYTES:
        raise GdeltFeedError("export_size_mismatch")
    if md5(archive).hexdigest() != entry.md5_hex:
        raise GdeltFeedError("export_manifest_digest_mismatch")
    received = retrieved_at or datetime.now(timezone.utc)
    if received.tzinfo is None or received.utcoffset() is None:
        raise GdeltFeedError("unaware_retrieval")
    archive_sha = sha256(archive).hexdigest()
    try:
        opened = zipfile.ZipFile(io.BytesIO(archive))
        with opened:
            files = opened.infolist()
            if len(files) != 1 or files[0].is_dir() or files[0].flag_bits & 0x1:
                raise GdeltFeedError("unsafe_archive_entries")
            member = files[0]
            expected_name = entry.url.rsplit("/", 1)[-1].removesuffix(".zip")
            if member.filename != expected_name or not re.fullmatch(
                r"\d{14}\.export\.CSV", member.filename, re.I
            ):
                raise GdeltFeedError("unexpected_archive_member")
            if member.file_size < 1 or member.file_size > UNCOMPRESSED_MAX_BYTES:
                raise GdeltFeedError("unsafe_uncompressed_size")
            if member.compress_size == 0 or member.file_size > member.compress_size * MAX_COMPRESSION_RATIO:
                raise GdeltFeedError("unsafe_compression_ratio")
            links: list[EventLink] = []
            seen_links: set[str] = set()
            rows = duplicates = bad_links = wrong_slot = candidate_rows = 0
            with opened.open(member) as file, io.TextIOWrapper(
                file, encoding="utf-8", errors="strict", newline="",
            ) as text:
                reader = csv.reader(text, dialect="excel-tab")
                for fields in reader:
                    rows += 1
                    if rows > MAX_ROWS:
                        raise GdeltFeedError("export_rows_over_budget")
                    if len(fields) != EXPECTED_COLUMNS:
                        raise GdeltFeedError("changed_event_schema")
                    if not fields[0].isdigit() or not re.fullmatch(r"\d{8}", fields[1]):
                        raise GdeltFeedError("invalid_event_id_or_day")
                    # DATEADDED is GDELT ingest/batch time; not source publication.
                    added = _slot(fields[59])
                    if added != entry.added_at_utc:
                        wrong_slot += 1
                        # GDELT may encode a prior date inside the latest
                        # event slot: retain as GDELT-added date (not original).
                    candidate_rows += 1
                    safe = _safe_source_article_url(fields[60])
                    if safe is None:
                        bad_links += 1
                        continue
                    outbound, canonical = safe
                    if canonical in seen_links:
                        duplicates += 1
                        continue
                    seen_links.add(canonical)
                    if len(links) >= max_candidates:
                        continue
                    links.append(EventLink(
                        source_url=outbound, canonical_key=canonical,
                        gdelt_event_id=fields[0],
                        gdelt_added_at_utc=added,
                        gdelt_event_date=fields[1],
                        coded_event=fields[26],
                        coded_action_country_fips=fields[53] or None,
                    ))
    except (zipfile.BadZipFile, UnicodeDecodeError, EOFError, OSError) as exc:
        raise GdeltFeedError("invalid_export_zip") from exc
    return GdeltEventBatch(
        manifest_sha256=manifest.raw_sha256, source_url=entry.url,
        export_md5_verified=True, archive_sha256=archive_sha,
        batch_at_utc=entry.added_at_utc,
        retrieved_at_utc=received.astimezone(timezone.utc).isoformat().replace("+00:00", "Z"),
        total_rows_examined=rows, candidate_rows=candidate_rows,
        distinct_safe_article_urls=len(seen_links), duplicate_links=duplicates,
        unsafe_or_missing_links=bad_links, wrong_slot_rows=wrong_slot,
        links=tuple(links),
    )


def _read_bounded(stream: httpx.Response, *, max_bytes: int) -> bytes:
    announced = stream.headers.get("content-length")
    if announced:
        try:
            parsed = int(announced)
        except ValueError as exc:
            raise GdeltFeedError("invalid_content_length") from exc
        if parsed < 1 or parsed > max_bytes:
            raise GdeltFeedError("oversized_response")
    raw = bytearray()
    for chunk in stream.iter_bytes():
        raw.extend(chunk)
        if len(raw) > max_bytes:
            raise GdeltFeedError("oversized_response")
    if not raw:
        raise GdeltFeedError("empty_response")
    return bytes(raw)


class GdeltStaticEventsClient:
    """Only manifest and its ONE pinned export ZIP; no arbitrary URL fetching."""

    def __init__(self, *, timeout_seconds: float = 14.0,
                 transport: httpx.BaseTransport | None = None,
                 sleep: Callable[[float], None] = time.sleep):
        if not 1 <= timeout_seconds <= 30:
            raise GdeltFeedError("invalid_timeout")
        self.timeout_seconds = timeout_seconds
        self.transport = transport
        self._sleep = sleep

    def _client(self) -> httpx.Client:
        return httpx.Client(
            base_url=f"https://{HOST}",
            timeout=self.timeout_seconds,
            follow_redirects=False,
            transport=self.transport,
            headers={"User-Agent": "World-Vision-ResearchProbe/0.1",
                     "Accept-Encoding": "identity"},
        )

    @staticmethod
    def _fetch(client: httpx.Client, url: str, cap: int) -> bytes:
        parts = urlsplit(url)
        if (parts.scheme != "https" or parts.netloc != HOST or parts.query or
                parts.fragment or not parts.path.startswith("/gdeltv2/")):
            raise GdeltFeedError("unapproved_provider_url")
        with client.stream("GET", url) as response:
            if response.status_code == 429:
                raise GdeltFeedError("provider_throttled")
            if response.status_code != 200:
                raise GdeltFeedError(f"provider_http_{response.status_code}")
            if response.headers.get("content-encoding", "identity").lower() not in ("", "identity"):
                raise GdeltFeedError("unexpected_http_compression")
            return _read_bounded(response, max_bytes=cap)

    def fetch_latest_events(self, *, max_candidates: int = MAX_CANDIDATES) -> GdeltEventBatch:
        with self._client() as client:
            raw = self._fetch(client, MANIFEST_URL, MANIFEST_MAX_BYTES)
            manifest = parse_manifest(raw)
            export = manifest.export()
            if export.size_bytes > ARCHIVE_MAX_BYTES:
                raise GdeltFeedError("export_archive_over_budget")
            # A manifest may be published moments before its ZIP becomes
            # accessible on a public CDN. Handle ONLY this precise 404 race:
            # up to two delayed retries of the SAME MD5-pinned official file.
            # NEVER retry 429/403/5xx, never re-fetch a moving manifest, never
            # switch to arbitrary article links or silently use stale data.
            # Total optional delay is capped at 15 seconds per explicit call.
            for attempt in range(3):
                try:
                    data = self._fetch(client, export.url, ARCHIVE_MAX_BYTES)
                    break
                except GdeltFeedError as exc:
                    if exc.code != "provider_http_404" or attempt >= 2:
                        raise
                    self._sleep((5.0, 10.0)[attempt])
            return parse_event_archive(manifest, data, max_candidates=max_candidates)
