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
    RenderProbe,
    HookOption,
    MediaAsset,
    VerificationReport,
    VoiceoverRef,
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


class StubCreativePhotoClient(StubCreativeClient):
    async def generate(self, story, request):
        package = await super().generate(story, request)
        package.scene_plan[0].visual_kind = "real_photo"
        package.scene_plan[0].asset_query = "RDC riposte sanitaire Kinshasa"
        return package


class StubAssetsClient:
    async def search_images(self, query, *, limit=4):
        return [
            MediaAsset(
                id="asset-approved-rdc",
                provider="wikimedia_commons",
                title="Kinshasa, République démocratique du Congo",
                kind="image",
                source_page_url="https://commons.wikimedia.org/wiki/File:Kinshasa_test.jpg",
                media_url="https://upload.wikimedia.org/test/kinshasa.jpg",
                thumbnail_url="https://upload.wikimedia.org/test/1080px-kinshasa.jpg",
                mime_type="image/jpeg",
                author="Test Photographer",
                license_name="CC BY 4.0",
                license_url="https://creativecommons.org/licenses/by/4.0/",
                attribution="Test Photographer · CC BY 4.0 · Wikimedia Commons",
                rights_status="approved",
                rights_note="Licence Creative Commons BY détectée.",
                query=query,
                discovered_at=datetime.now(timezone.utc),
            )
        ][:limit]


class StubVoiceoverClient:
    async def generate(self, story, request):
        return VoiceoverRef(
            id="voice-test-1",
            model="gpt-realtime-2.1-mini",
            voice=request.voice or "marin",
            duration_sec=min(10.0, story.video_draft.duration_sec),
            generated_at=datetime.now(timezone.utc),
            renderer_url="/api/media-renderer/audio/story-test.wav",
            transcript=story.video_draft.voiceover_script,
            transcript_match_score=100,
            duration_fit=True,
            qa_passed=True,
        )


class StubLanguageQa:
    model_name = "test-language-qa"

    async def check(self, story):
        return []


class StubRendererClient:
    def __init__(self):
        self.jobs: dict[str, RenderJobRef] = {}
        self.draft_durations: dict[str, float] = {}

    async def create_job(
        self,
        story,
        *,
        render_profile="canonical_newsroom_v1",
    ):
        now = datetime.now(timezone.utc)
        job_id = (
            "render-tiktok-test-1"
            if render_profile == "tiktok_api_clean_v1"
            else "render-test-1"
        )
        job = RenderJobRef(
            id=job_id,
            story_id=story.id,
            render_profile=render_profile,
            status="queued",
            progress=0,
            created_at=now,
            updated_at=now,
        )
        self.jobs[job.id] = job
        self.draft_durations[job.id] = story.video_draft.duration_sec
        return job

    async def retry_job(self, job_id: str):
        previous = self.jobs[job_id]
        if previous.status != "failed":
            raise RuntimeError("Stub retry requires a failed job.")
        retried = previous.model_copy(
            update={
                "status": "queued",
                "progress": 0,
                "attempts": previous.attempts + 1,
                "updated_at": datetime.now(timezone.utc),
                "error": None,
            }
        )
        self.jobs[job_id] = retried
        return retried

    async def get_job(self, job_id: str):
        previous = self.jobs[job_id]
        if previous.status == "failed":
            return previous
        completed = previous.model_copy(
            update={
                "status": "completed",
                "progress": 1,
                "updated_at": datetime.now(timezone.utc),
                "output_url": f"/api/media-renderer/renders/{job_id}.mp4",
                "output_sha256": (
                    "b" * 64
                    if previous.render_profile == "tiktok_api_clean_v1"
                    else "a" * 64
                ),
                "output_probe": RenderProbe(
                    format_name="mov,mp4,m4a,3gp,3g2,mj2",
                    size_bytes=1_250_000,
                    duration_sec=self.draft_durations[job_id],
                    video_codec="h264",
                    width=1080,
                    height=1920,
                    fps=30.0,
                    pixel_format="yuv420p",
                    video_bit_rate=900_000,
                    has_audio=True,
                    audio_codec="aac",
                    audio_sample_rate_hz=48_000,
                    audio_channels=2,
                ),
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
    media_api.WIKIMEDIA_CLIENT = StubAssetsClient()
    media_api.VOICEOVER_CLIENT = StubVoiceoverClient()
    media_api.QA_LANGUAGE_CLIENT = StubLanguageQa()


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



def test_real_photo_creative_requires_licensed_assets_before_final_draft():
    media_api.CREATIVE_CLIENT = StubCreativePhotoClient()

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
    hook_id = creative.json()["hooks"][0]["id"]

    assert client.post(
        f"/api/media/stories/{story_id}/hooks/select",
        json={"hook_id": hook_id},
    ).status_code == 200

    blocked = client.post(
        f"/api/media/stories/{story_id}/draft/prepare",
        json={},
    )
    assert blocked.status_code == 409
    assert "asset" in blocked.json()["detail"].lower()

    discovered = client.post(
        f"/api/media/stories/{story_id}/assets/discover",
        json={"limit_per_scene": 4},
    )
    assert discovered.status_code == 200
    asset_story = discovered.json()
    assert asset_story["status"] == "assets"
    assert asset_story["qa"]["rights"] == "pass"
    assert asset_story["asset_bundle"]["unresolved_scene_orders"] == []
    assert asset_story["asset_bundle"]["selections"][0]["asset_id"] == "asset-approved-rdc"

    draft = client.post(
        f"/api/media/stories/{story_id}/draft/prepare",
        json={},
    )
    assert draft.status_code == 200
    body = draft.json()
    assert body["status"] == "scripting"
    scene = body["video_draft"]["scenes"][0]
    assert scene["asset_id"] == "asset-approved-rdc"
    assert scene["asset_url"].endswith("1080px-kinshasa.jpg")
    assert "Test Photographer" in scene["asset_attribution"]
    assert scene["asset_license"] == "CC BY 4.0"



def test_creative_render_is_blocked_until_audio_qa_passes():
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
    hook_id = creative.json()["hooks"][0]["id"]

    assert client.post(
        f"/api/media/stories/{story_id}/hooks/select",
        json={"hook_id": hook_id},
    ).status_code == 200
    assert client.post(
        f"/api/media/stories/{story_id}/draft/prepare",
        json={},
    ).status_code == 200

    blocked = client.post(
        f"/api/media/stories/{story_id}/render-preview"
    )
    assert blocked.status_code == 409
    assert "audio" in blocked.json()["detail"].lower()

    audio = client.post(
        f"/api/media/stories/{story_id}/audio/generate",
        json={},
    )
    assert audio.status_code == 200
    audio_story = audio.json()
    assert audio_story["qa"]["audio"] == "pass"
    assert audio_story["voiceover"]["qa_passed"] is True
    assert audio_story["voiceover"]["transcript_match_score"] == 100
    assert audio_story["voiceover"]["ai_generated_disclosure"] == "Voix générée par IA"

    launched = client.post(
        f"/api/media/stories/{story_id}/render-preview"
    )
    assert launched.status_code == 200
    assert launched.json()["status"] == "rendering"



def test_failed_preview_render_can_be_retried_without_new_job():
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
    hook_id = creative.json()["hooks"][0]["id"]
    assert client.post(
        f"/api/media/stories/{story_id}/hooks/select",
        json={"hook_id": hook_id},
    ).status_code == 200
    assert client.post(
        f"/api/media/stories/{story_id}/draft/prepare",
        json={},
    ).status_code == 200
    assert client.post(
        f"/api/media/stories/{story_id}/audio/generate",
        json={},
    ).status_code == 200

    launched = client.post(
        f"/api/media/stories/{story_id}/render-preview"
    )
    assert launched.status_code == 200
    job_id = launched.json()["render_job"]["id"]

    renderer = media_api.RENDERER_CLIENT
    renderer.jobs[job_id] = renderer.jobs[job_id].model_copy(
        update={
            "status": "failed",
            "progress": 0.42,
            "attempts": 1,
            "error": "simulated renderer crash",
        }
    )

    failed_sync = client.post(
        f"/api/media/stories/{story_id}/render-preview/sync"
    )
    assert failed_sync.status_code == 200
    failed_story = failed_sync.json()
    assert failed_story["status"] == "changes_requested"
    assert failed_story["render_job"]["id"] == job_id
    assert failed_story["render_job"]["attempts"] == 1

    retried = client.post(
        f"/api/media/stories/{story_id}/render-preview/retry"
    )
    assert retried.status_code == 200
    retried_story = retried.json()
    assert retried_story["status"] == "rendering"
    assert retried_story["render_job"]["id"] == job_id
    assert retried_story["render_job"]["status"] == "queued"
    assert retried_story["render_job"]["attempts"] == 2
    assert retried_story["render_job"]["error"] is None

    duplicate_retry = client.post(
        f"/api/media/stories/{story_id}/render-preview/retry"
    )
    assert duplicate_retry.status_code == 409


def test_full_verified_media_pipeline_reaches_publish_ready_only_after_qa():
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
    hook_id = creative.json()["hooks"][0]["id"]

    assert client.post(
        f"/api/media/stories/{story_id}/hooks/select",
        json={"hook_id": hook_id},
    ).status_code == 200
    assert client.post(
        f"/api/media/stories/{story_id}/draft/prepare",
        json={},
    ).status_code == 200
    assert client.post(
        f"/api/media/stories/{story_id}/audio/generate",
        json={},
    ).status_code == 200

    launched = client.post(
        f"/api/media/stories/{story_id}/render-preview"
    )
    assert launched.status_code == 200

    synced = client.post(
        f"/api/media/stories/{story_id}/render-preview/sync"
    )
    assert synced.status_code == 200
    assert synced.json()["status"] == "preview_ready"

    approved_preview = client.post(
        f"/api/media/stories/{story_id}/decision",
        json={"action": "approve_preview"},
    )
    assert approved_preview.status_code == 200
    assert approved_preview.json()["status"] == "qa"

    blocked = client.post(
        f"/api/media/stories/{story_id}/decision",
        json={"action": "mark_publish_ready"},
    )
    assert blocked.status_code == 409

    qa = client.post(
        f"/api/media/stories/{story_id}/qa/run",
        json={"check_spelling": True},
    )
    assert qa.status_code == 200
    qa_story = qa.json()
    assert qa_story["qa_report"]["all_passed"] is True
    assert qa_story["render_job"]["output_probe"]["width"] == 1080
    assert qa_story["render_job"]["output_probe"]["height"] == 1920
    assert qa_story["render_job"]["output_probe"]["fps"] == 30.0
    assert qa_story["render_job"]["output_probe"]["has_audio"] is True
    assert all(
        qa_story["qa"][name] == "pass"
        for name in [
            "facts",
            "spelling",
            "safe_zones",
            "logo_integrity",
            "source_display",
            "rights",
            "audio",
            "render_integrity",
        ]
    )

    ready = client.post(
        f"/api/media/stories/{story_id}/decision",
        json={"action": "mark_publish_ready"},
    )
    assert ready.status_code == 200
    assert ready.json()["status"] == "publish_ready"

    package = client.post(
        f"/api/media/stories/{story_id}/publication/prepare",
        json={"target_channels": ["tiktok", "whatsapp"]},
    )
    assert package.status_code == 200
    package_story = package.json()
    assert package_story["status"] == "publish_ready"
    assert len(package_story["publication_package"]["manifest_sha256"]) == 64
    assert package_story["publication_package"]["video_url"].endswith(".mp4")
    assert "Sources" in package_story["publication_package"]["whatsapp_text"]
    assert package_story["publication_package"]["ai_disclosure"] == "Voix générée par IA"

    blocked_without_clean_export = client.post(
        f"/api/media/stories/{story_id}/publication/confirm",
        json={
            "channel": "tiktok",
            "external_id": "should-not-pass",
        },
    )
    assert blocked_without_clean_export.status_code == 409
    assert "clean export" in blocked_without_clean_export.json()["detail"].lower()

    tiktok_export = client.post(
        f"/api/media/stories/{story_id}/publication/exports/tiktok"
    )
    assert tiktok_export.status_code == 200
    export_story = tiktok_export.json()
    assert export_story["channel_exports"][0]["channel"] == "tiktok"
    assert export_story["channel_exports"][0]["render_profile"] == "tiktok_api_clean_v1"
    assert (
        export_story["channel_exports"][0]["canonical_manifest_sha256"]
        == export_story["publication_package"]["manifest_sha256"]
    )
    assert (
        export_story["channel_exports"][0]["render_job"]["render_profile"]
        == "tiktok_api_clean_v1"
    )

    renderer = media_api.RENDERER_CLIENT
    tiktok_job_id = export_story["channel_exports"][0]["render_job"]["id"]
    renderer.jobs[tiktok_job_id] = renderer.jobs[tiktok_job_id].model_copy(
        update={
            "status": "failed",
            "progress": 0.25,
            "attempts": 1,
            "error": "simulated TikTok derivative failure",
        }
    )

    failed_export_sync = client.post(
        f"/api/media/stories/{story_id}/publication/exports/tiktok/sync"
    )
    assert failed_export_sync.status_code == 200
    assert (
        failed_export_sync.json()["channel_exports"][0]["render_job"]["status"]
        == "failed"
    )

    retry_tiktok_export = client.post(
        f"/api/media/stories/{story_id}/publication/exports/tiktok/retry"
    )
    assert retry_tiktok_export.status_code == 200
    assert (
        retry_tiktok_export.json()["channel_exports"][0]["render_job"]["status"]
        == "queued"
    )

    synced_export = client.post(
        f"/api/media/stories/{story_id}/publication/exports/tiktok/sync"
    )
    assert synced_export.status_code == 200
    synced_export_story = synced_export.json()
    clean_job = synced_export_story["channel_exports"][0]["render_job"]
    assert clean_job["status"] == "completed"
    assert clean_job["output_url"].endswith(".mp4")
    assert clean_job["output_sha256"] == "b" * 64

    missing_proof = client.post(
        f"/api/media/stories/{story_id}/publication/confirm",
        json={"channel": "tiktok"},
    )
    assert missing_proof.status_code == 409

    tiktok = client.post(
        f"/api/media/stories/{story_id}/publication/confirm",
        json={
            "channel": "tiktok",
            "external_id": "tiktok-post-123",
        },
    )
    assert tiktok.status_code == 200
    assert tiktok.json()["status"] == "publish_ready"
    assert len(tiktok.json()["publication_receipts"]) == 1

    whatsapp = client.post(
        f"/api/media/stories/{story_id}/publication/confirm",
        json={
            "channel": "whatsapp",
            "public_url": "https://whatsapp.com/channel/example/post/456",
        },
    )
    assert whatsapp.status_code == 200
    published_story = whatsapp.json()
    assert published_story["status"] == "published"
    assert {
        receipt["channel"]
        for receipt in published_story["publication_receipts"]
    } == {"tiktok", "whatsapp"}
