import asyncio
from datetime import datetime, timezone

from media_service.asset_workflow import discover_asset_bundle
from media_service.models import (
    CreativePackage,
    CreativeScenePlan,
    CreativeScriptSegment,
    DiscoverAssetsRequest,
    HookOption,
    MediaAsset,
)
from media_service.store import build_seed_story


def creative_story(*, visual_kind="real_photo"):
    story = build_seed_story()
    story.status = "approved"
    story.creative_package = CreativePackage(
        version=1,
        created_at=datetime.now(timezone.utc),
        model="test",
        angle="Un angle vérifié.",
        angle_claim_indexes=[1],
        target_duration_sec=15,
        hooks=[
            HookOption(
                id="creative-hook-1",
                text="Hook vérifié",
                score=95,
                rationale="Test",
                claim_indexes=[1],
            )
        ],
        script_segments=[
            CreativeScriptSegment(
                text="Un segment vérifié.",
                claim_indexes=[1],
            )
        ],
        caption="Une légende vérifiée.",
        caption_claim_indexes=[1],
        hashtags=["#Test"],
        scene_plan=[
            CreativeScenePlan(
                order=1,
                purpose="hook",
                on_screen_text="HOOK",
                visual_kind=visual_kind,
                asset_query="Libreville Gabon",
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
    return story


def asset(asset_id: str, rights_status: str, *, kind="image"):
    return MediaAsset(
        id=asset_id,
        provider="wikimedia_commons",
        title="Libreville",
        kind=kind,
        source_page_url=f"https://commons.wikimedia.org/wiki/File:{asset_id}",
        media_url=(
            f"https://upload.wikimedia.org/{asset_id}.webm"
            if kind == "video"
            else f"https://upload.wikimedia.org/{asset_id}.jpg"
        ),
        thumbnail_url=f"https://upload.wikimedia.org/{asset_id}-1080.jpg",
        mime_type="video/webm" if kind == "video" else "image/jpeg",
        author="Jane Doe",
        license_name="CC BY 4.0" if rights_status == "approved" else "CC BY-SA 4.0",
        license_url="https://creativecommons.org/licenses/by/4.0/",
        attribution="Jane Doe · Wikimedia Commons",
        rights_status=rights_status,
        rights_note="Test rights",
        query="Libreville Gabon",
        discovered_at=datetime.now(timezone.utc),
    )


class FakeAssets:
    def __init__(self, assets):
        self.assets = assets
        self.image_calls = []
        self.video_calls = []

    async def search_images(self, query, *, limit=4):
        self.image_calls.append(query)
        return [
            candidate
            for candidate in self.assets
            if candidate.kind == "image"
        ][:limit]

    async def search_videos(self, query, *, limit=4):
        self.video_calls.append(query)
        return [
            candidate
            for candidate in self.assets
            if candidate.kind == "video"
        ][:limit]


def test_asset_discovery_auto_selects_only_approved_rights():
    story = creative_story()
    bundle = asyncio.run(
        discover_asset_bundle(
            story,
            DiscoverAssetsRequest(limit_per_scene=4),
            asset_client=FakeAssets([
                asset("review", "review_required"),
                asset("approved", "approved"),
            ]),
        )
    )

    assert bundle.unresolved_scene_orders == []
    assert bundle.selections[0].scene_order == 1
    assert bundle.selections[0].asset_id == "approved"


def test_asset_discovery_keeps_scene_unresolved_without_approved_rights():
    story = creative_story()
    bundle = asyncio.run(
        discover_asset_bundle(
            story,
            DiscoverAssetsRequest(limit_per_scene=4),
            asset_client=FakeAssets([
                asset("review", "review_required"),
            ]),
        )
    )

    assert bundle.selections == []
    assert bundle.unresolved_scene_orders == [1]
    assert bundle.assets[0].rights_status == "review_required"



def test_real_video_scene_uses_video_search_and_selects_video_only():
    story = creative_story(visual_kind="real_video")
    client = FakeAssets([
        asset("photo-approved", "approved", kind="image"),
        asset("video-approved", "approved", kind="video"),
    ])

    bundle = asyncio.run(
        discover_asset_bundle(
            story,
            DiscoverAssetsRequest(limit_per_scene=4),
            asset_client=client,
        )
    )

    assert client.image_calls == []
    assert client.video_calls == ["Libreville Gabon"]
    assert bundle.unresolved_scene_orders == []
    assert bundle.selections[0].asset_id == "video-approved"


def test_real_video_scene_stays_unresolved_when_only_photo_is_available():
    story = creative_story(visual_kind="real_video")
    client = FakeAssets([
        asset("photo-approved", "approved", kind="image"),
    ])

    bundle = asyncio.run(
        discover_asset_bundle(
            story,
            DiscoverAssetsRequest(limit_per_scene=4),
            asset_client=client,
        )
    )

    assert bundle.selections == []
    assert bundle.unresolved_scene_orders == [1]
