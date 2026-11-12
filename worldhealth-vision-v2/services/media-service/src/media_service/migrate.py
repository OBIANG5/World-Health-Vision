from __future__ import annotations

import sys

import psycopg

from media_service.settings import get_settings


SCHEMA_SQL = """
CREATE SCHEMA IF NOT EXISTS media;

CREATE TABLE IF NOT EXISTS media.story_state (
    id TEXT PRIMARY KEY,
    status TEXT NOT NULL,
    score SMALLINT NOT NULL CHECK (score BETWEEN 0 AND 100),
    country_iso3 CHAR(3),
    radar_fingerprint TEXT,
    detected_at TIMESTAMPTZ NOT NULL,
    updated_at TIMESTAMPTZ NOT NULL,
    payload JSONB NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_media_story_radar_fingerprint
    ON media.story_state (radar_fingerprint)
    WHERE radar_fingerprint IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_media_story_status_score
    ON media.story_state (status, score DESC);

CREATE INDEX IF NOT EXISTS idx_media_story_country_detected
    ON media.story_state (country_iso3, detected_at DESC);

CREATE INDEX IF NOT EXISTS idx_media_story_updated
    ON media.story_state (updated_at DESC);

CREATE TABLE IF NOT EXISTS media.radar_scan (
    scan_id TEXT PRIMARY KEY,
    requested_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    hours INTEGER NOT NULL CHECK (hours BETWEEN 1 AND 48),
    country_iso3 CHAR(3),
    model TEXT NOT NULL,
    query TEXT NOT NULL,
    retrieved_urls JSONB NOT NULL,
    candidates_found INTEGER NOT NULL,
    candidates_accepted INTEGER NOT NULL,
    candidates_rejected_without_retrieved_source INTEGER NOT NULL,
    stories_created JSONB NOT NULL,
    stories_deduplicated JSONB NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_media_radar_scan_requested
    ON media.radar_scan (requested_at DESC);
"""


def main() -> int:
    settings = get_settings()
    if settings.repository_backend.strip().lower() != "postgres":
        print("Media migration skipped: repository backend is not postgres.")
        return 0

    with psycopg.connect(settings.database_url) as conn:
        conn.execute(SCHEMA_SQL)

    print("World-Vision media schema is ready.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
