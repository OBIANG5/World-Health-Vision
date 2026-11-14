from __future__ import annotations

import json
from datetime import datetime

import redis.asyncio as redis

from media_service.models import RadarSchedulerStatus
from media_service.settings import Settings, get_settings


LOCK_KEY = "whv:media:radar:scheduler:lock"
HEARTBEAT_KEY = "whv:media:radar:scheduler:heartbeat"
STATUS_KEY = "whv:media:radar:scheduler:status"


def _parse_datetime(value: str | None) -> datetime | None:
    if not value:
        return None
    try:
        return datetime.fromisoformat(value.replace("Z", "+00:00"))
    except ValueError:
        return None


async def read_scheduler_status(
    settings: Settings | None = None,
) -> RadarSchedulerStatus:
    resolved = settings or get_settings()
    client = redis.from_url(resolved.redis_url, decode_responses=True)

    try:
        await client.ping()
        redis_connected = True
        heartbeat_raw, status_raw, lock_raw = await client.mget(
            HEARTBEAT_KEY,
            STATUS_KEY,
            LOCK_KEY,
        )
    except Exception:
        return RadarSchedulerStatus(
            enabled=resolved.radar_scheduler_enabled,
            interval_seconds=resolved.radar_scheduler_interval_seconds,
            scan_hours=resolved.radar_scheduler_scan_hours,
            max_candidates=resolved.radar_scheduler_max_candidates,
            redis_connected=False,
            lock_held=False,
        )
    finally:
        await client.aclose()

    status_payload: dict[str, object] = {}
    if status_raw:
        try:
            decoded = json.loads(status_raw)
            if isinstance(decoded, dict):
                status_payload = decoded
        except json.JSONDecodeError:
            status_payload = {}

    return RadarSchedulerStatus(
        enabled=resolved.radar_scheduler_enabled,
        interval_seconds=resolved.radar_scheduler_interval_seconds,
        scan_hours=resolved.radar_scheduler_scan_hours,
        max_candidates=resolved.radar_scheduler_max_candidates,
        redis_connected=redis_connected,
        lock_held=bool(lock_raw),
        heartbeat_at=_parse_datetime(heartbeat_raw),
        last_run_at=_parse_datetime(
            status_payload.get("last_run_at")
            if isinstance(status_payload.get("last_run_at"), str)
            else None
        ),
        last_run_status=(
            status_payload.get("last_run_status")
            if isinstance(status_payload.get("last_run_status"), str)
            else None
        ),
        last_scan_id=(
            status_payload.get("last_scan_id")
            if isinstance(status_payload.get("last_scan_id"), str)
            else None
        ),
        last_error=(
            status_payload.get("last_error")
            if isinstance(status_payload.get("last_error"), str)
            else None
        ),
    )
