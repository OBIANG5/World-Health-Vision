from datetime import datetime, timezone

from fastapi.testclient import TestClient

import media_service.api as media_api
from media_service.api import app
from media_service.models import RenderJobRef
from media_service.store import STORE


client = TestClient(app)


class StubRendererClient:
    def __init__(self):
        self.jobs: dict[str, RenderJobRef] = {}

    async def create_job(self, story):
        now = datetime.now(timezone.utc)
        job = RenderJobRef(
            id="render-test-1",
            story_id=story.id,
            status="queued",
            progress=0,
            created_at=now,
            updated_at=now,
        )
        self.jobs[job.id] = job
        return job

    async def get_job(self, job_id: str):
        previous = self.jobs[job_id]
        completed = previous.model_copy(
            update={
                "status": "completed",
                "progress": 1,
                "updated_at": datetime.now(timezone.utc),
                "output_url": f"/api/media-renderer/renders/{job_id}.mp4",
            }
        )
        self.jobs[job_id] = completed
        return completed


def setup_function():
    STORE.reset()
    media_api.RENDERER_CLIENT = StubRendererClient()


def test_health_and_dashboard():
    health = client.get("/health")
    assert health.status_code == 200
    assert health.json()["service"] == "media-service"

    dashboard = client.get("/api/media/dashboard")
    assert dashboard.status_code == 200
    body = dashboard.json()
    assert body["total"] == 1
    assert body["candidates"] == 1
    assert body["top_score"] >= 80


def test_story_keeps_local_provenance():
    response = client.get("/api/media/stories/story-gab-rgpl-2026")
    assert response.status_code == 200
    story = response.json()

    assert story["verification_status"] == "verified"
    assert any(source["scope"] == "local" for source in story["sources"])
    assert any(source["is_primary"] for source in story["sources"])


def test_select_hook_then_approve():
    hook = client.post(
        "/api/media/stories/story-gab-rgpl-2026/hooks/select",
        json={"hook_id": "hook-1"},
    )
    assert hook.status_code == 200
    assert hook.json()["selected_hook_id"] == "hook-1"

    approved = client.post(
        "/api/media/stories/story-gab-rgpl-2026/decision",
        json={"action": "approve", "note": "Angle validé"},
    )
    assert approved.status_code == 200
    assert approved.json()["status"] == "approved"


def test_invalid_workflow_transition_returns_conflict():
    first = client.post(
        "/api/media/stories/story-gab-rgpl-2026/decision",
        json={"action": "approve"},
    )
    assert first.status_code == 200

    second = client.post(
        "/api/media/stories/story-gab-rgpl-2026/decision",
        json={"action": "mark_publish_ready"},
    )
    assert second.status_code == 409


def test_manual_story_ingestion():
    payload = {
        "title": "Test actualité World-Vision",
        "summary": "Une actualité de test suffisamment détaillée pour le pipeline éditorial.",
        "category": "test",
        "country_iso3": "FRA",
        "country_name": "France",
        "verification_status": "partially_verified",
        "confidence_score": 72,
        "sources": [
            {
                "id": "source-1",
                "name": "Source officielle",
                "url": "https://example.org/source",
                "source_type": "institution",
                "scope": "local",
                "country_iso3": "FRA",
                "is_primary": True
            }
        ],
        "factors": {
            "freshness": 90,
            "surprise": 70,
            "human_impact": 60,
            "importance": 80,
            "visual_potential": 70,
            "numerical_strength": 50,
            "undercoverage": 85,
            "francophone_relevance": 100,
            "africa_relevance": 10,
            "source_confidence": 90,
            "urgency": 75,
            "saturation_penalty": 20
        },
        "hooks": []
    }

    response = client.post("/api/media/stories", json=payload)
    assert response.status_code == 201
    story = response.json()
    assert story["status"] == "candidate"
    assert story["country_iso3"] == "FRA"
    assert story["score"]["total"] > 0


def test_prepare_video_draft_after_hook_and_approval():
    selected = client.post(
        "/api/media/stories/story-gab-rgpl-2026/hooks/select",
        json={"hook_id": "hook-1"},
    )
    assert selected.status_code == 200

    approved = client.post(
        "/api/media/stories/story-gab-rgpl-2026/decision",
        json={"action": "approve"},
    )
    assert approved.status_code == 200

    draft = client.post(
        "/api/media/stories/story-gab-rgpl-2026/draft/prepare",
        json={},
    )
    assert draft.status_code == 200
    body = draft.json()

    assert body["status"] == "scripting"
    assert body["video_draft"]["format"] == "9:16"
    assert body["video_draft"]["width"] == 1080
    assert body["video_draft"]["height"] == 1920
    assert body["video_draft"]["fps"] == 30
    assert body["video_draft"]["rendering_engine"] == "remotion"
    assert len(body["video_draft"]["scenes"]) == 3
    assert body["video_draft"]["source_line"].startswith("Sources :")


def test_prepare_video_draft_requires_selected_hook():
    approved = client.post(
        "/api/media/stories/story-gab-rgpl-2026/decision",
        json={"action": "approve"},
    )
    assert approved.status_code == 200

    draft = client.post(
        "/api/media/stories/story-gab-rgpl-2026/draft/prepare",
        json={},
    )
    assert draft.status_code == 409
    assert "hook" in draft.json()["detail"].lower()


def test_candidate_can_request_another_angle():
    response = client.post(
        "/api/media/stories/story-gab-rgpl-2026/decision",
        json={"action": "request_changes", "note": "Angle trop générique"},
    )
    assert response.status_code == 200
    assert response.json()["status"] == "changes_requested"


def test_preview_render_lifecycle():
    assert client.post(
        "/api/media/stories/story-gab-rgpl-2026/hooks/select",
        json={"hook_id": "hook-1"},
    ).status_code == 200
    assert client.post(
        "/api/media/stories/story-gab-rgpl-2026/decision",
        json={"action": "approve"},
    ).status_code == 200
    assert client.post(
        "/api/media/stories/story-gab-rgpl-2026/draft/prepare",
        json={},
    ).status_code == 200

    launched = client.post(
        "/api/media/stories/story-gab-rgpl-2026/render-preview"
    )
    assert launched.status_code == 200
    launched_story = launched.json()
    assert launched_story["status"] == "rendering"
    assert launched_story["render_job"]["status"] == "queued"

    synced = client.post(
        "/api/media/stories/story-gab-rgpl-2026/render-preview/sync"
    )
    assert synced.status_code == 200
    story = synced.json()
    assert story["status"] == "preview_ready"
    assert story["render_job"]["status"] == "completed"
    assert story["render_job"]["output_url"].endswith(".mp4")
