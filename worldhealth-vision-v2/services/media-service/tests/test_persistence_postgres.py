import os

import psycopg

from media_service.migrate import SCHEMA_SQL
from media_service.models import RadarScanRequest, RadarScanResult
from media_service.persistence import PostgresStoryPersistence
from media_service.settings import Settings
from media_service.store import build_seed_story


def postgres_settings() -> Settings:
    return Settings(
        repository_backend="postgres",
        database_url=os.environ[
            "WHV_TEST_MEDIA_DATABASE_URL"
        ],
        database_pool_min_size=1,
        database_pool_max_size=2,
        seed_demo_story=False,
    )


def prepare_database(settings: Settings) -> None:
    with psycopg.connect(settings.database_url) as conn:
        conn.execute(SCHEMA_SQL)
        conn.execute("TRUNCATE TABLE media.story_state")
        conn.execute("TRUNCATE TABLE media.radar_scan")


def test_postgres_roundtrip_and_atomic_radar_deduplication():
    settings = postgres_settings()
    prepare_database(settings)
    persistence = PostgresStoryPersistence(settings)

    try:
        story = build_seed_story().model_copy(
            update={"radar_fingerprint": "same-event-fingerprint"}
        )

        saved = persistence.save(story)
        loaded = persistence.get(story.id)

        assert loaded is not None
        assert loaded.model_dump(mode="json") == saved.model_dump(mode="json")
        assert persistence.list()[0].id == story.id

        second_story = story.model_copy(
            update={
                "id": "story-competing-radar-worker",
                "slug": "same-event-second-worker",
            }
        )

        existing, created = persistence.save_radar_if_absent(second_story)

        assert created is False
        assert existing.id == story.id
        assert len(persistence.list()) == 1
    finally:
        persistence.close()



def test_postgres_persists_radar_scan_audit_history():
    settings = postgres_settings()
    prepare_database(settings)
    persistence = PostgresStoryPersistence(settings)

    try:
        request = RadarScanRequest(
            hours=3,
            country_iso3="GAB",
            max_candidates=12,
        )
        result = RadarScanResult(
            scan_id="radar-postgres-audit",
            query="test query",
            model="test-model",
            retrieved_urls=["https://agpgabon.ga/test"],
            candidates_found=2,
            candidates_accepted=1,
            candidates_rejected_without_retrieved_source=1,
            stories_created=["story-created"],
            stories_deduplicated=["story-existing"],
        )

        persistence.save_radar_scan(request, result)
        scans = persistence.list_radar_scans(limit=10)

        assert len(scans) == 1
        scan = scans[0]
        assert scan.scan_id == "radar-postgres-audit"
        assert scan.hours == 3
        assert scan.country_iso3 == "GAB"
        assert scan.max_candidates == 12
        assert scan.model == "test-model"
        assert scan.query == "test query"
        assert scan.retrieved_urls == ["https://agpgabon.ga/test"]
        assert scan.candidates_found == 2
        assert scan.candidates_accepted == 1
        assert scan.stories_created == ["story-created"]
        assert scan.stories_deduplicated == ["story-existing"]
    finally:
        persistence.close()
