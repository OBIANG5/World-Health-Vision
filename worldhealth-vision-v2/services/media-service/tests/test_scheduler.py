import asyncio
import json
from datetime import datetime, timezone

from media_service.models import (
    EditorialScoreFactors,
    RadarCandidate,
    RadarHookCandidate,
    RadarSourceCandidate,
)
from media_service.persistence import MemoryStoryPersistence
from media_service.radar import RadarDiscovery
from media_service.scheduler import LOCK_KEY, STATUS_KEY, run_scheduler_cycle
from media_service.settings import Settings
from media_service.store import MediaStoryStore


class FakeRedis:
    def __init__(self):
        self.data: dict[str, str] = {}

    async def set(self, key, value, nx=False, ex=None):
        if nx and key in self.data:
            return None
        self.data[key] = value
        return True

    async def get(self, key):
        return self.data.get(key)

    async def ping(self):
        return True

    async def eval(self, script, numkeys, key, token):
        if self.data.get(key) == token:
            self.data.pop(key, None)
            return 1
        return 0


class StubRadarClient:
    async def scan(self, request):
        candidate = RadarCandidate(
            title="Gabon : test scheduler RADAR",
            summary="Un sujet de démonstration détecté par le scheduler distribué.",
            category="test",
            country_iso3="GAB",
            country_name="Gabon",
            region="Afrique centrale",
            breaking=True,
            event_at=datetime.now(timezone.utc),
            confidence_score=92,
            sources=[
                RadarSourceCandidate(
                    name="Agence Gabonaise de Presse (AGP)",
                    url="https://agpgabon.ga/scheduler-test",
                    source_type="press_agency",
                    scope="local",
                    country_iso3="GAB",
                    is_primary=False,
                    published_at=datetime.now(timezone.utc),
                    note="Source locale de test.",
                )
            ],
            factors=EditorialScoreFactors(
                freshness=98,
                surprise=82,
                human_impact=76,
                importance=84,
                visual_potential=80,
                numerical_strength=70,
                undercoverage=94,
                francophone_relevance=90,
                africa_relevance=100,
                source_confidence=92,
                urgency=95,
                saturation_penalty=8,
            ),
            hooks=[
                RadarHookCandidate(
                    text="🇬🇦 Une information locale vient d’être détectée.",
                    score=91,
                    rationale="Sujet local récent et sous-couvert.",
                )
            ],
        )
        return RadarDiscovery(
            scan_id="radar-scheduler-test",
            query="scheduler test",
            model="test-model",
            retrieved_urls=["https://agpgabon.ga/scheduler-test"],
            raw_candidate_count=1,
            candidates=[candidate],
            rejected_without_retrieved_source=0,
        )


def _settings(**overrides):
    values = dict(
        repository_backend="memory",
        seed_demo_story=False,
        openai_api_key="test-key",
        radar_scheduler_enabled=True,
        radar_scheduler_interval_seconds=900,
        radar_scheduler_lock_ttl_seconds=840,
        radar_scheduler_scan_hours=3,
        radar_scheduler_max_candidates=12,
    )
    values.update(overrides)
    return Settings(**values)


def test_scheduler_cycle_creates_story_records_scan_and_releases_lock():
    redis_client = FakeRedis()
    store = MediaStoryStore(
        persistence=MemoryStoryPersistence(),
        seed_demo=False,
    )

    status = asyncio.run(
        run_scheduler_cycle(
            redis_client,
            _settings(),
            radar_client=StubRadarClient(),
            store=store,
        )
    )

    assert status == "completed"
    assert LOCK_KEY not in redis_client.data
    assert len(store.list()) == 1
    assert len(store.list_radar_scans()) == 1

    scheduler_status = json.loads(redis_client.data[STATUS_KEY])
    assert scheduler_status["last_run_status"] == "completed"
    assert scheduler_status["last_scan_id"] == "radar-scheduler-test"


def test_scheduler_cycle_skips_when_distributed_lock_is_held():
    redis_client = FakeRedis()
    redis_client.data[LOCK_KEY] = "other-worker"

    store = MediaStoryStore(
        persistence=MemoryStoryPersistence(),
        seed_demo=False,
    )

    status = asyncio.run(
        run_scheduler_cycle(
            redis_client,
            _settings(),
            radar_client=StubRadarClient(),
            store=store,
        )
    )

    assert status == "skipped_lock_held"
    assert store.list() == []
    assert redis_client.data[LOCK_KEY] == "other-worker"


def test_scheduler_stays_disabled_without_openai_key():
    redis_client = FakeRedis()
    store = MediaStoryStore(
        persistence=MemoryStoryPersistence(),
        seed_demo=False,
    )

    status = asyncio.run(
        run_scheduler_cycle(
            redis_client,
            _settings(openai_api_key=None),
            radar_client=StubRadarClient(),
            store=store,
        )
    )

    assert status == "disabled_no_openai_key"
    assert store.list() == []
    assert LOCK_KEY not in redis_client.data
