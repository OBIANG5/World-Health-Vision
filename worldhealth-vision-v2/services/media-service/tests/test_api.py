from datetime import datetime, timezone

from fastapi.testclient import TestClient

import media_service.api as media_api
from media_service.api import app
from media_service.models import (
    ClaimVerification,
    CreativePackage,
    CreativeScenePlan,
    CreativeScriptSegment,
    EditorialScoreFactors,
    RadarCandidate,
    RadarHookCandidate,
    RadarSourceCandidate,
    RenderJobRef,
    HookOption,
    VerificationReport,
)
from media_service.radar import RadarDiscovery
from media_service.store import STORE


client = TestClient(app)


class StubRadarClient:
    async def scan(self, request):
        candidate = RadarCandidate(
            title="RDC : trois nouveaux cas signalés dans une riposte sanitaire",
            summary=(
                "Une source nationale rapporte trois nouveaux cas dans le cadre "
                "d'une riposte sanitaire en République démocratique du Congo."
            ),
            category="santé",
            country_iso3="COD",
            country_name="RDC",
            region="Afrique centrale",
            breaking=True,
            event_at=datetime.now(timezone.utc),
            confidence_score=91,
            sources=[
                RadarSourceCandidate(
                    name="Agence Congolaise de Presse (ACP)",
                    url="https://acp.cd/exemple-radar",
                    source_type="press_agency",
                    scope="local",
                    country_iso3="COD",
                    is_primary=False,
                    published_at=datetime.now(timezone.utc),
                    note="Source nationale de démonstration pour le test.",
                )
            ],
            factors=EditorialScoreFactors(
                freshness=96,
                surprise=78,
                human_impact=88,
                importance=82,
                visual_potential=75,
                numerical_strength=82,
                undercoverage=92,
                francophone_relevance=88,
                africa_relevance=100,
                source_confidence=91,
                urgency=94,
                saturation_penalty=12,
            ),
            hooks=[
                RadarHookCandidate(
                    text="🇨🇩 Trois nouveaux cas viennent d’être signalés.",
                    score=90,
                    rationale="Chiffre immédiat et sujet sanitaire local.",
                )
            ],
        )
        return RadarDiscovery(
            scan_id="radar-test-1",
            query="test radar",
            model="test-model",
            retrieved_urls=["https://acp.cd/exemple-radar"],
            raw_candidate_count=1,
            candidates=[candidate],
            rejected_without_retrieved_source=0,
        )


class StubVerificationClient:
    async def verify(self, story, request):
        return VerificationReport(
            version=1,
            checked_at=datetime.now(timezone.utc),
            model="test-verifier",
            retrieved_urls=[
                "https://acp.cd/exemple-radar",
                "https://example.org/second-confirmation",
            ],
            claims=[
                ClaimVerification(
                    claim="Trois nouveaux cas ont été signalés.",
                    status="verified",
                    supporting_urls=[
                        "https://acp.cd/exemple-radar",
                        "https://example.org/second-confirmation",
                    ],
                    contradicting_urls=[],
                    explanation="Deux sources concordantes confirment le chiffre.",
                )
            ],
            distinct_supporting_sources=2,
            has_primary_support=False,
            verdict="verified",
            confidence_score=92,
        )


class StubCreativeClient:
    async def generate(self, story, request):
        return CreativePackage(
            version=1,
            created_at=datetime.now(timezone.utc),
            model="test-creative",
            angle="Trois cas signalés dans une riposte sanitaire.",
            angle_claim_indexes=[1],
            target_duration_sec=request.target_duration_sec,
            hooks=[
                HookOption(
                    id="creative-v1-hook-1",
                    text="🇨🇩 Trois nouveaux cas viennent d’être signalés.",
                    score=94,
                    rationale="Le chiffre est immédiatement compréhensible.",
                    claim_indexes=[1],
                )
            ],
            script_segments=[
                CreativeScriptSegment(
                    text="Trois nouveaux cas ont été signalés en RDC.",
                    claim_indexes=[1],
                )
            ],
            caption="Trois nouveaux cas ont été signalés en RDC.",
            caption_claim_indexes=[1],
            hashtags=["#RDC", "#Actualité"],
            scene_plan=[
                CreativeScenePlan(
                    order=1,
                    purpose="hook",
                    on_screen_text="3 NOUVEAUX CAS",
                    visual_kind="typography",
                    asset_query="RDC riposte sanitaire",
                    claim_indexes=[1],
                ),
                CreativeScenePlan(
                    order=2,
                    purpose="source_and_brand",
                    on_screen_text="Sources",
                    visual_kind="source_card",
                    asset_query=None,
                    claim_indexes=[],
                ),
            ],
        )


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
    media_api.RADAR_CLIENT = StubRadarClient()
    media_api.VERIFICATION_CLIENT = StubVerificationClient()
    media_api.CREATIVE_CLIENT = StubCreativeClient()


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


def test_radar_scan_creates_and_then_deduplicates_story():
    first = client.post(
        "/api/media/radar/scans",
        json={"hours": 6, "max_candidates": 10},
    )
    assert first.status_code == 200
    first_body = first.json()
    assert first_body["candidates_found"] == 1
    assert first_body["candidates_accepted"] == 1
    assert len(first_body["stories_created"]) == 1
    assert first_body["stories_deduplicated"] == []

    created_id = first_body["stories_created"][0]
    created_story = client.get(f"/api/media/stories/{created_id}")
    assert created_story.status_code == 200
    story = created_story.json()
    assert story["radar_scan_id"] == "radar-test-1"
    assert story["verification_status"] == "partially_verified"
    assert story["sources"][0]["scope"] == "local"
    assert story["score"]["total"] >= 80

    second = client.post(
        "/api/media/radar/scans",
        json={"hours": 6, "max_candidates": 10},
    )
    assert second.status_code == 200
    second_body = second.json()
    assert second_body["stories_created"] == []
    assert second_body["stories_deduplicated"] == [created_id]

    history = client.get("/api/media/radar/scans?limit=10")
    assert history.status_code == 200
    scans = history.json()
    assert len(scans) == 2
    assert scans[0]["scan_id"] == "radar-test-1"
    assert scans[0]["candidates_accepted"] == 1



def test_radar_story_must_be_verified_before_approval():
    scan = client.post(
        "/api/media/radar/scans",
        json={"hours": 3, "max_candidates": 10},
    )
    assert scan.status_code == 200
    story_id = scan.json()["stories_created"][0]

    blocked = client.post(
        f"/api/media/stories/{story_id}/decision",
        json={"action": "approve"},
    )
    assert blocked.status_code == 409
    assert "verified" in blocked.json()["detail"].lower()

    verified = client.post(
        f"/api/media/stories/{story_id}/verify",
        json={"max_claims": 6},
    )
    assert verified.status_code == 200
    verified_story = verified.json()
    assert verified_story["verification_status"] == "verified"
    assert verified_story["confidence_score"] == 92
    assert verified_story["verification_report"]["claims"][0]["status"] == "verified"
    assert verified_story["qa"]["facts"] == "pass"

    approved = client.post(
        f"/api/media/stories/{story_id}/decision",
        json={"action": "approve"},
    )
    assert approved.status_code == 200
    assert approved.json()["status"] == "approved"



def test_verified_approved_story_can_generate_creative_and_prepare_draft():
    scan = client.post(
        "/api/media/radar/scans",
        json={"hours": 3, "max_candidates": 10},
    )
    assert scan.status_code == 200
    story_id = scan.json()["stories_created"][0]

    assert client.post(
        f"/api/media/stories/{story_id}/verify",
        json={"max_claims": 6},
    ).status_code == 200

    assert client.post(
        f"/api/media/stories/{story_id}/decision",
        json={"action": "approve"},
    ).status_code == 200

    creative = client.post(
        f"/api/media/stories/{story_id}/creative/generate",
        json={"target_duration_sec": 15, "max_hooks": 3},
    )
    assert creative.status_code == 200
    creative_story = creative.json()
    assert creative_story["creative_package"]["model"] == "test-creative"
    assert creative_story["hooks"][0]["claim_indexes"] == [1]
    hook_id = creative_story["hooks"][0]["id"]

    selected = client.post(
        f"/api/media/stories/{story_id}/hooks/select",
        json={"hook_id": hook_id},
    )
    assert selected.status_code == 200

    draft = client.post(
        f"/api/media/stories/{story_id}/draft/prepare",
        json={},
    )
    assert draft.status_code == 200
    body = draft.json()
    assert body["status"] == "scripting"
    assert body["video_draft"]["hook_id"] == hook_id
    assert body["video_draft"]["scenes"][0]["on_screen_text"].startswith("🇨🇩")
