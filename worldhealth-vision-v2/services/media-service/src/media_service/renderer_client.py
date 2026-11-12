from __future__ import annotations

import httpx

from media_service.models import MediaStory, RenderJobRef
from media_service.settings import Settings, get_settings


class RendererDependencyError(RuntimeError):
    pass


class RendererClient:
    def __init__(self, settings: Settings | None = None) -> None:
        self.settings = settings or get_settings()
        self.base_url = self.settings.renderer_base_url.rstrip("/")

    async def create_job(self, story: MediaStory) -> RenderJobRef:
        if story.video_draft is None:
            raise ValueError("Story has no video draft.")

        payload = {
            "story": {
                "id": story.id,
                "title": story.title,
                "country_name": story.country_name,
                "category": story.category,
            },
            "draft": story.video_draft.model_dump(mode="json"),
            "voiceover": (
                story.voiceover.model_dump(mode="json")
                if story.voiceover is not None
                else None
            ),
            "brand": {
                "name": "WORLD-VISION",
                "tagline": "Voir le monde, le comprendre.",
            },
        }

        try:
            async with httpx.AsyncClient(timeout=self.settings.renderer_timeout_seconds) as client:
                response = await client.post(
                    f"{self.base_url}/api/media-renderer/jobs",
                    json=payload,
                )
                response.raise_for_status()
        except httpx.HTTPError as exc:
            raise RendererDependencyError(f"media-renderer unavailable: {exc}") from exc

        return RenderJobRef.model_validate(response.json())

    async def get_job(self, job_id: str) -> RenderJobRef:
        try:
            async with httpx.AsyncClient(timeout=self.settings.renderer_timeout_seconds) as client:
                response = await client.get(
                    f"{self.base_url}/api/media-renderer/jobs/{job_id}"
                )
                response.raise_for_status()
        except httpx.HTTPError as exc:
            raise RendererDependencyError(f"media-renderer unavailable: {exc}") from exc

        return RenderJobRef.model_validate(response.json())


RENDERER_CLIENT = RendererClient()
