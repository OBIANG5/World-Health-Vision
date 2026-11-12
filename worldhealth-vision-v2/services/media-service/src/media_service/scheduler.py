from __future__ import annotations

import asyncio
import json
import logging
import signal
from datetime import datetime, timezone
from uuid import uuid4

import redis.asyncio as redis

from media_service.models import RadarScanRequest
from media_service.radar import RADAR_CLIENT, RadarConfigurationError, RadarProviderError
from media_service.radar_workflow import execute_radar_scan
from media_service.scheduler_state import HEARTBEAT_KEY, LOCK_KEY, STATUS_KEY
from media_service.settings import Settings, get_settings
from media_service.store import STORE


logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s %(levelname)s %(name)s %(message)s",
)
LOGGER = logging.getLogger("world-vision-media-scheduler")

_RELEASE_LOCK_SCRIPT = """
if redis.call("GET", KEYS[1]) == ARGV[1] then
  return redis.call("DEL", KEYS[1])
else
  return 0
end
"""


def _iso_now() -> str:
    return datetime.now(timezone.utc).isoformat()


async def _write_heartbeat(client: redis.Redis, settings: Settings) -> None:
    await client.set(
        HEARTBEAT_KEY,
        _iso_now(),
        ex=max(30, settings.radar_scheduler_heartbeat_ttl_seconds),
    )


async def _write_status(
    client: redis.Redis,
    *,
    last_run_status: str,
    last_scan_id: str | None = None,
    last_error: str | None = None,
) -> None:
    await client.set(
        STATUS_KEY,
        json.dumps(
            {
                "last_run_at": _iso_now(),
                "last_run_status": last_run_status,
                "last_scan_id": last_scan_id,
                "last_error": last_error,
            },
            ensure_ascii=False,
        ),
    )


async def run_scheduler_cycle(
    client: redis.Redis,
    settings: Settings,
) -> str:
    await _write_heartbeat(client, settings)

    if not settings.radar_scheduler_enabled:
        await _write_status(client, last_run_status="disabled")
        return "disabled"

    if not settings.openai_api_key:
        await _write_status(
            client,
            last_run_status="disabled_no_openai_key",
            last_error="WHV_MEDIA_OPENAI_API_KEY is not configured.",
        )
        return "disabled_no_openai_key"

    token = uuid4().hex
    ttl = max(
        30,
        min(
            settings.radar_scheduler_lock_ttl_seconds,
            settings.radar_scheduler_interval_seconds,
        ),
    )
    acquired = await client.set(LOCK_KEY, token, nx=True, ex=ttl)
    if not acquired:
        await _write_status(client, last_run_status="skipped_lock_held")
        return "skipped_lock_held"

    try:
        request = RadarScanRequest(
            hours=max(1, min(settings.radar_scheduler_scan_hours, 48)),
            max_candidates=max(1, min(settings.radar_scheduler_max_candidates, 30)),
        )
        result = await execute_radar_scan(
            request,
            radar_client=RADAR_CLIENT,
            store=STORE,
        )
        await _write_status(
            client,
            last_run_status="completed",
            last_scan_id=result.scan_id,
        )
        LOGGER.info(
            "RADAR scan %s completed: %s accepted, %s created, %s deduplicated",
            result.scan_id,
            result.candidates_accepted,
            len(result.stories_created),
            len(result.stories_deduplicated),
        )
        return "completed"
    except RadarConfigurationError as exc:
        await _write_status(
            client,
            last_run_status="configuration_error",
            last_error=str(exc),
        )
        LOGGER.error("RADAR configuration error: %s", exc)
        return "configuration_error"
    except RadarProviderError as exc:
        await _write_status(
            client,
            last_run_status="provider_error",
            last_error=str(exc),
        )
        LOGGER.error("RADAR provider error: %s", exc)
        return "provider_error"
    except Exception as exc:
        await _write_status(
            client,
            last_run_status="failed",
            last_error=f"{type(exc).__name__}: {exc}",
        )
        LOGGER.exception("Unexpected scheduled RADAR failure")
        return "failed"
    finally:
        try:
            await client.eval(_RELEASE_LOCK_SCRIPT, 1, LOCK_KEY, token)
        except Exception:
            LOGGER.exception("Could not release RADAR scheduler lock")


async def run_forever(settings: Settings | None = None) -> None:
    resolved = settings or get_settings()
    client = redis.from_url(resolved.redis_url, decode_responses=True)
    stop_event = asyncio.Event()

    def _stop() -> None:
        stop_event.set()

    loop = asyncio.get_running_loop()
    for sig in (signal.SIGINT, signal.SIGTERM):
        try:
            loop.add_signal_handler(sig, _stop)
        except NotImplementedError:
            pass

    initial_delay = max(0, resolved.radar_scheduler_initial_delay_seconds)
    if initial_delay:
        try:
            await asyncio.wait_for(stop_event.wait(), timeout=initial_delay)
        except asyncio.TimeoutError:
            pass

    LOGGER.info(
        "RADAR scheduler started enabled=%s interval=%ss window=%sh",
        resolved.radar_scheduler_enabled,
        resolved.radar_scheduler_interval_seconds,
        resolved.radar_scheduler_scan_hours,
    )

    try:
        while not stop_event.is_set():
            try:
                await client.ping()
                await run_scheduler_cycle(client, resolved)
            except Exception:
                LOGGER.exception("Redis unavailable to RADAR scheduler")

            interval = max(30, resolved.radar_scheduler_interval_seconds)
            try:
                await asyncio.wait_for(stop_event.wait(), timeout=interval)
            except asyncio.TimeoutError:
                continue
    finally:
        try:
            await client.delete(HEARTBEAT_KEY)
        except Exception:
            pass
        await client.aclose()
        STORE.close()


def main() -> None:
    asyncio.run(run_forever())


if __name__ == "__main__":
    main()
