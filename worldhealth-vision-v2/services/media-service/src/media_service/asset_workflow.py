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


class AssetWorkflowError(RuntimeError):
    pass


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
    approved_selected = {
        selection.scene_order
        for selection in bundle.selections
        if (
            selection.asset_id in assets_by_id
            and assets_by_id[selection.asset_id].rights_status == "approved"
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
        searches.append(
            asset_client.search_images(
                query,
                limit=request.limit_per_scene,
            )
        )

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

        approved = next(
            (
                asset
                for asset in scene_assets
                if asset.rights_status == "approved"
            ),
            None,
        )
        if approved is None:
            unresolved.append(scene.order)
            continue

        selections.append(
            AssetSelection(
                scene_order=scene.order,
                asset_id=approved.id,
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
