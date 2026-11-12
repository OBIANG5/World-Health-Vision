from __future__ import annotations

import asyncio
from datetime import datetime, timezone
from typing import Protocol

from media_service.models import (
    AssetBundle,
    AssetSelection,
    DiscoverAssetsRequest,
    MediaAsset,
    MediaStory,
)
from media_service.wikimedia_assets import AssetProviderError


EXTERNAL_VISUAL_KINDS = {"real_photo", "real_video"}


class AssetClientProtocol(Protocol):
    async def search_images(
        self,
        query: str,
        *,
        limit: int = 4,
    ) -> list[MediaAsset]: ...

    async def search_videos(
        self,
        query: str,
        *,
        limit: int = 4,
    ) -> list[MediaAsset]: ...


class AssetWorkflowError(RuntimeError):
    pass


def score_asset_for_vertical(asset: MediaAsset) -> tuple[int, str]:
    score = 0
    reasons: list[str] = []

    if asset.rights_status == "approved":
        score += 20
        reasons.append("droits approuvés")
    else:
        reasons.append("droits non approuvés")

    width = asset.width or 0
    height = asset.height or 0
    if width > 0 and height > 0:
        short_side = min(width, height)
        if short_side >= 1080:
            score += 30
            reasons.append("résolution ≥1080")
        elif short_side >= 720:
            score += 25
            reasons.append("résolution ≥720")
        elif short_side >= 480:
            score += 14
            reasons.append("résolution moyenne")
        else:
            score += 4
            reasons.append("résolution faible")

        ratio = width / height
        if 0.45 <= ratio <= 0.75:
            score += 20
            reasons.append("cadrage proche du 9:16")
        elif height > width:
            score += 15
            reasons.append("format portrait")
        elif 0.85 <= ratio <= 1.15:
            score += 8
            reasons.append("format carré")
        else:
            score += 4
            reasons.append("format paysage à recadrer")
    else:
        score += 6
        reasons.append("dimensions inconnues")

    size_bytes = asset.size_bytes
    if size_bytes is None:
        score += 6
        reasons.append("poids inconnu")
    else:
        size_mb = size_bytes / 1_000_000
        if asset.kind == "video":
            if size_mb <= 25:
                score += 20
                reasons.append("vidéo légère")
            elif size_mb <= 50:
                score += 15
                reasons.append("poids vidéo raisonnable")
            elif size_mb <= 100:
                score += 7
                reasons.append("vidéo lourde")
            else:
                reasons.append("vidéo trop lourde")
        else:
            if size_mb <= 8:
                score += 20
                reasons.append("image légère")
            elif size_mb <= 20:
                score += 14
                reasons.append("poids image raisonnable")
            else:
                score += 5
                reasons.append("image lourde")

    mime = (asset.mime_type or "").casefold()
    if (
        (asset.kind == "video" and mime in {"video/webm", "video/mp4", "video/quicktime", "video/x-m4v"})
        or (asset.kind == "image" and mime.startswith("image/"))
    ):
        score += 10
        reasons.append("format renderer compatible")

    return min(100, score), " · ".join(reasons)


def required_asset_scene_orders(story: MediaStory) -> list[int]:
    package = story.creative_package
    if package is None:
        return []
    return [
        scene.order
        for scene in package.scene_plan
        if scene.visual_kind in EXTERNAL_VISUAL_KINDS
    ]


def recompute_unresolved_scene_orders(
    story: MediaStory,
    bundle: AssetBundle,
) -> list[int]:
    required = set(required_asset_scene_orders(story))
    assets_by_id = {asset.id: asset for asset in bundle.assets}
    package = story.creative_package
    expected_kind_by_order = {
        scene.order: (
            "video"
            if scene.visual_kind == "real_video"
            else "image"
        )
        for scene in (package.scene_plan if package is not None else [])
        if scene.visual_kind in EXTERNAL_VISUAL_KINDS
    }
    approved_selected = {
        selection.scene_order
        for selection in bundle.selections
        if (
            selection.asset_id in assets_by_id
            and assets_by_id[selection.asset_id].rights_status == "approved"
            and assets_by_id[selection.asset_id].kind
            == expected_kind_by_order.get(selection.scene_order)
        )
    }
    return sorted(required.difference(approved_selected))


async def discover_asset_bundle(
    story: MediaStory,
    request: DiscoverAssetsRequest,
    *,
    asset_client: AssetClientProtocol,
) -> AssetBundle:
    package = story.creative_package
    if package is None:
        raise AssetWorkflowError(
            "CREATIVE package is required before asset discovery."
        )

    required_scenes = [
        scene
        for scene in package.scene_plan
        if scene.visual_kind in EXTERNAL_VISUAL_KINDS
    ]

    previous_version = story.asset_bundle.version if story.asset_bundle else 0
    if not required_scenes:
        return AssetBundle(
            version=previous_version + 1,
            discovered_at=datetime.now(timezone.utc),
            assets=[],
            selections=[],
            unresolved_scene_orders=[],
        )

    searches = []
    for scene in required_scenes:
        query = scene.asset_query or (
            f"{story.country_name or story.region or ''} "
            f"{story.category} {story.title}"
        ).strip()
        if scene.visual_kind == "real_video":
            search = asset_client.search_videos(
                query,
                limit=request.limit_per_scene,
            )
        else:
            search = asset_client.search_images(
                query,
                limit=request.limit_per_scene,
            )
        searches.append(search)

    results = await asyncio.gather(*searches, return_exceptions=True)

    all_assets: dict[str, MediaAsset] = {}
    selections: list[AssetSelection] = []
    unresolved: list[int] = []
    provider_failures = 0

    for scene, result in zip(required_scenes, results):
        if isinstance(result, Exception):
            provider_failures += 1
            unresolved.append(scene.order)
            continue

        scene_assets = result
        for asset in scene_assets:
            all_assets.setdefault(asset.id, asset)

        approved_candidates = [
            asset
            for asset in scene_assets
            if (
                asset.rights_status == "approved"
                and (
                    (scene.visual_kind == "real_video" and asset.kind == "video")
                    or (scene.visual_kind == "real_photo" and asset.kind == "image")
                )
            )
        ]
        if not approved_candidates:
            unresolved.append(scene.order)
            continue

        approved = max(
            approved_candidates,
            key=lambda candidate: score_asset_for_vertical(candidate)[0],
        )
        selection_score, selection_reason = score_asset_for_vertical(approved)
        selections.append(
            AssetSelection(
                scene_order=scene.order,
                asset_id=approved.id,
                selection_score=selection_score,
                selection_reason=selection_reason,
            )
        )

    if provider_failures == len(required_scenes):
        first_error = next(
            (result for result in results if isinstance(result, Exception)),
            None,
        )
        if isinstance(first_error, AssetProviderError):
            raise first_error
        raise AssetWorkflowError(
            "All asset provider searches failed."
        )

    return AssetBundle(
        version=previous_version + 1,
        discovered_at=datetime.now(timezone.utc),
        assets=list(all_assets.values()),
        selections=selections,
        unresolved_scene_orders=sorted(set(unresolved)),
    )
