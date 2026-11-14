from __future__ import annotations

from typing import Protocol

from media_service.models import RadarScanRequest, RadarScanResult
from media_service.radar import RadarDiscovery
from media_service.store import MediaStoryStore


class RadarClientProtocol(Protocol):
    async def scan(self, request: RadarScanRequest) -> RadarDiscovery: ...


async def execute_radar_scan(
    request: RadarScanRequest,
    *,
    radar_client: RadarClientProtocol,
    store: MediaStoryStore,
) -> RadarScanResult:
    discovery = await radar_client.scan(request)

    created: list[str] = []
    deduplicated: list[str] = []

    for candidate in discovery.candidates:
        story, was_created = store.create_from_radar(candidate, discovery.scan_id)
        if was_created:
            created.append(story.id)
        else:
            deduplicated.append(story.id)

    result = RadarScanResult(
        scan_id=discovery.scan_id,
        query=discovery.query,
        model=discovery.model,
        retrieved_urls=discovery.retrieved_urls,
        candidates_found=discovery.raw_candidate_count,
        candidates_accepted=len(discovery.candidates),
        candidates_rejected_without_retrieved_source=(
            discovery.rejected_without_retrieved_source
        ),
        stories_created=created,
        stories_deduplicated=deduplicated,
    )
    store.record_radar_scan(request, result)
    return result
