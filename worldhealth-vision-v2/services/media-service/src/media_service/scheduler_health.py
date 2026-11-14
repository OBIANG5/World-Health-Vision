from __future__ import annotations

import asyncio
from datetime import datetime, timezone

import redis.asyncio as redis

from media_service.scheduler_state import HEARTBEAT_KEY
from media_service.settings import get_settings


async def check() -> int:
    settings = get_settings()
    client = redis.from_url(settings.redis_url, decode_responses=True)
    try:
        heartbeat = await client.get(HEARTBEAT_KEY)
        if not heartbeat:
            return 1
        timestamp = datetime.fromisoformat(heartbeat.replace("Z", "+00:00"))
        age = (datetime.now(timezone.utc) - timestamp).total_seconds()
        max_age = max(
            settings.radar_scheduler_heartbeat_ttl_seconds,
            settings.radar_scheduler_interval_seconds + 60,
        )
        return 0 if age <= max_age else 1
    except Exception:
        return 1
    finally:
        await client.aclose()


def main() -> None:
    raise SystemExit(asyncio.run(check()))


if __name__ == "__main__":
    main()
