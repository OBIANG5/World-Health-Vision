from __future__ import annotations

import atexit
from copy import deepcopy
from threading import RLock
from typing import Protocol

from psycopg.rows import dict_row
from psycopg.types.json import Jsonb
from psycopg_pool import ConnectionPool

from media_service.models import MediaStory, StoryStatus
from media_service.settings import Settings, get_settings


class StoryPersistence(Protocol):
    def list(self, status: StoryStatus | None = None) -> list[MediaStory]: ...
    def get(self, story_id: str) -> MediaStory | None: ...
    def save(self, story: MediaStory) -> MediaStory: ...
    def save_radar_if_absent(self, story: MediaStory) -> tuple[MediaStory, bool]: ...
    def find_by_radar_fingerprint(self, fingerprint: str) -> MediaStory | None: ...
    def reset(self) -> None: ...
    def close(self) -> None: ...


class MemoryStoryPersistence:
    def __init__(self) -> None:
        self._lock = RLock()
        self._stories: dict[str, MediaStory] = {}

    def list(self, status: StoryStatus | None = None) -> list[MediaStory]:
        with self._lock:
            stories = list(self._stories.values())
            if status is not None:
                stories = [story for story in stories if story.status == status]
            stories.sort(key=lambda story: (story.score.total, story.detected_at), reverse=True)
            return deepcopy(stories)

    def get(self, story_id: str) -> MediaStory | None:
        with self._lock:
            story = self._stories.get(story_id)
            return deepcopy(story) if story else None

    def save(self, story: MediaStory) -> MediaStory:
        with self._lock:
            self._stories[story.id] = deepcopy(story)
            return deepcopy(story)

    def save_radar_if_absent(self, story: MediaStory) -> tuple[MediaStory, bool]:
        if not story.radar_fingerprint:
            raise ValueError("Radar story must have a radar_fingerprint.")
        with self._lock:
            for existing in self._stories.values():
                if existing.radar_fingerprint == story.radar_fingerprint:
                    return deepcopy(existing), False
            self._stories[story.id] = deepcopy(story)
            return deepcopy(story), True

    def find_by_radar_fingerprint(self, fingerprint: str) -> MediaStory | None:
        with self._lock:
            for story in self._stories.values():
                if story.radar_fingerprint == fingerprint:
                    return deepcopy(story)
        return None

    def reset(self) -> None:
        with self._lock:
            self._stories = {}

    def close(self) -> None:
        return None


class PostgresStoryPersistence:
    def __init__(self, settings: Settings) -> None:
        self._pool = ConnectionPool(
            conninfo=settings.database_url,
            min_size=settings.database_pool_min_size,
            max_size=settings.database_pool_max_size,
            open=True,
            check=ConnectionPool.check_connection,
            kwargs={"row_factory": dict_row},
        )
        atexit.register(self._pool.close)

    @staticmethod
    def _story_from_row(row: dict | None) -> MediaStory | None:
        if row is None:
            return None
        return MediaStory.model_validate(row["payload"])

    def list(self, status: StoryStatus | None = None) -> list[MediaStory]:
        query = """
            SELECT payload
            FROM media.story_state
        """
        params: tuple[object, ...] = ()
        if status is not None:
            query += " WHERE status = %s"
            params = (status,)
        query += " ORDER BY score DESC, detected_at DESC"

        with self._pool.connection() as conn:
            rows = conn.execute(query, params).fetchall()
        return [
            story
            for row in rows
            if (story := self._story_from_row(row)) is not None
        ]

    def get(self, story_id: str) -> MediaStory | None:
        with self._pool.connection() as conn:
            row = conn.execute(
                "SELECT payload FROM media.story_state WHERE id = %s",
                (story_id,),
            ).fetchone()
        return self._story_from_row(row)

    def save(self, story: MediaStory) -> MediaStory:
        payload = story.model_dump(mode="json")
        with self._pool.connection() as conn:
            conn.execute(
                """
                INSERT INTO media.story_state (
                    id,
                    status,
                    score,
                    country_iso3,
                    radar_fingerprint,
                    detected_at,
                    updated_at,
                    payload
                )
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
                ON CONFLICT (id) DO UPDATE SET
                    status = EXCLUDED.status,
                    score = EXCLUDED.score,
                    country_iso3 = EXCLUDED.country_iso3,
                    radar_fingerprint = EXCLUDED.radar_fingerprint,
                    detected_at = EXCLUDED.detected_at,
                    updated_at = EXCLUDED.updated_at,
                    payload = EXCLUDED.payload
                """,
                (
                    story.id,
                    story.status,
                    story.score.total,
                    story.country_iso3,
                    story.radar_fingerprint,
                    story.detected_at,
                    story.updated_at,
                    Jsonb(payload),
                ),
            )
        return story.model_copy(deep=True)

    def save_radar_if_absent(self, story: MediaStory) -> tuple[MediaStory, bool]:
        if not story.radar_fingerprint:
            raise ValueError("Radar story must have a radar_fingerprint.")

        payload = story.model_dump(mode="json")
        with self._pool.connection() as conn:
            inserted = conn.execute(
                """
                INSERT INTO media.story_state (
                    id,
                    status,
                    score,
                    country_iso3,
                    radar_fingerprint,
                    detected_at,
                    updated_at,
                    payload
                )
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
                ON CONFLICT (radar_fingerprint)
                    WHERE radar_fingerprint IS NOT NULL
                DO NOTHING
                RETURNING payload
                """,
                (
                    story.id,
                    story.status,
                    story.score.total,
                    story.country_iso3,
                    story.radar_fingerprint,
                    story.detected_at,
                    story.updated_at,
                    Jsonb(payload),
                ),
            ).fetchone()

            if inserted is not None:
                persisted = self._story_from_row(inserted)
                if persisted is None:
                    raise RuntimeError("PostgreSQL returned an empty inserted media story.")
                return persisted, True

            existing = conn.execute(
                """
                SELECT payload
                FROM media.story_state
                WHERE radar_fingerprint = %s
                LIMIT 1
                """,
                (story.radar_fingerprint,),
            ).fetchone()

        persisted = self._story_from_row(existing)
        if persisted is None:
            raise RuntimeError("Radar fingerprint conflict occurred without an existing row.")
        return persisted, False

    def find_by_radar_fingerprint(self, fingerprint: str) -> MediaStory | None:
        with self._pool.connection() as conn:
            row = conn.execute(
                """
                SELECT payload
                FROM media.story_state
                WHERE radar_fingerprint = %s
                LIMIT 1
                """,
                (fingerprint,),
            ).fetchone()
        return self._story_from_row(row)

    def reset(self) -> None:
        raise RuntimeError("Refusing to reset the PostgreSQL newsroom repository.")

    def close(self) -> None:
        self._pool.close()


def build_story_persistence(settings: Settings | None = None) -> StoryPersistence:
    resolved = settings or get_settings()
    backend = resolved.repository_backend.strip().lower()

    if backend == "memory":
        return MemoryStoryPersistence()
    if backend == "postgres":
        return PostgresStoryPersistence(resolved)

    raise ValueError(f"Unsupported media repository backend: {resolved.repository_backend!r}")
