from fastapi.testclient import TestClient

from media_service.api import app
from media_service.store import STORE


client = TestClient(app)


def setup_function():
    STORE.reset()


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
