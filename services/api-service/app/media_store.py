from __future__ import annotations

from copy import deepcopy
from datetime import datetime, timezone
from typing import Dict, List, Optional

from app.media_models import (
    AssetInventory,
    EditorialScoreFactors,
    HookOption,
    MediaDashboard,
    MediaSource,
    MediaStory,
    QaState,
)
from app.media_scoring import compute_editorial_score


def _dt(value: str) -> datetime:
    return datetime.fromisoformat(value.replace("Z", "+00:00"))


_seed_factors = EditorialScoreFactors(
    freshness=86,
    surprise=95,
    human_impact=64,
    importance=91,
    visual_potential=83,
    numerical_strength=98,
    undercoverage=96,
    francophone_relevance=88,
    africa_relevance=100,
    source_confidence=94,
    urgency=82,
    saturation_penalty=18,
)

_seed_story = MediaStory(
    id="story-gab-rgpl-2026",
    slug="gabon-rgpl-2026-3518621-habitants",
    status="candidate",
    title="Gabon : le nouveau recensement fixe la population à 3 518 621 habitants",
    summary=(
        "Le RGPL 2026 homologué au Gabon établit une population officielle de "
        "3 518 621 habitants, très au-dessus des estimations internationales de 2025."
    ),
    category="démographie",
    country_iso3="GAB",
    country_name="Gabon",
    region="Afrique centrale",
    detected_at=_dt("2026-08-27T16:20:00Z"),
    event_at=_dt("2026-08-27T12:00:00Z"),
    updated_at=_dt("2026-08-27T17:10:00Z"),
    verification_status="verified",
    confidence_score=95,
    sources=[
        MediaSource(
            id="src-agp-rgpl",
            name="Agence Gabonaise de Presse (AGP)",
            url="https://agpgabon.ga/rgpl-2026-le-gabon-compte-desormais-3-518-621-habitants/",
            source_type="press_agency",
            scope="local",
            country_iso3="GAB",
            is_primary=False,
            published_at=_dt("2026-08-27T15:00:00Z"),
            note="Agence de presse nationale rapportant l'homologation des résultats.",
        ),
        MediaSource(
            id="src-cour-constitutionnelle-gabon",
            name="Cour constitutionnelle du Gabon",
            url="https://courconstitutionnelle.ga/",
            source_type="institution",
            scope="local",
            country_iso3="GAB",
            is_primary=True,
            published_at=_dt("2026-08-27T12:00:00Z"),
            note="Institution ayant homologué les résultats définitifs du RGPL.",
        ),
    ],
    score=compute_editorial_score(_seed_factors),
    hooks=[
        HookOption(
            id="hook-1",
            text="🇬🇦 Le Gabon vient de gagner près d'un million d'habitants… sur le papier.",
            score=96,
            rationale="Contraste immédiat entre ancienne estimation et nouveau recensement.",
        ),
        HookOption(
            id="hook-2",
            text="🇬🇦 3,5 millions : le nouveau chiffre qui change la taille du Gabon.",
            score=91,
            rationale="Très lisible et centré sur le chiffre clé.",
        ),
        HookOption(
            id="hook-3",
            text="🇬🇦 Les estimations parlaient encore de 2,5 à 2,6 millions. Le recensement dit 3,5.",
            score=94,
            rationale="Met directement en scène l'écart statistique.",
        ),
    ],
    selected_hook_id=None,
    target_duration_sec=16,
    assets=AssetInventory(photos=7, videos=1, official_documents=1, maps_or_charts=2),
    qa=QaState(
        facts="pass",
        spelling="pending",
        safe_zones="pending",
        logo_integrity="pending",
        source_display="pass",
        rights="pending",
        audio="pending",
        notes=["Story de démonstration : le rendu vidéo n'est pas encore généré."],
    ),
)


class MediaStoryStore:
    def __init__(self) -> None:
        self._stories: Dict[str, MediaStory] = {_seed_story.id: _seed_story}

    def list(self, status: Optional[str] = None) -> List[MediaStory]:
        stories = list(self._stories.values())
        if status:
            stories = [story for story in stories if story.status == status]
        return sorted(
            (deepcopy(story) for story in stories),
            key=lambda story: (story.score.total, story.detected_at),
            reverse=True,
        )

    def get(self, story_id: str) -> Optional[MediaStory]:
        story = self._stories.get(story_id)
        return deepcopy(story) if story else None

    def save(self, story: MediaStory) -> MediaStory:
        story.updated_at = datetime.now(timezone.utc)
        self._stories[story.id] = deepcopy(story)
        return deepcopy(story)

    def dashboard(self) -> MediaDashboard:
        stories = list(self._stories.values())
        statuses = [story.status for story in stories]
        in_production = {
            "approved",
            "scripting",
            "assets",
            "rendering",
            "qa",
            "changes_requested",
        }
        return MediaDashboard(
            total=len(stories),
            detected=statuses.count("detected"),
            verifying=statuses.count("verifying"),
            candidates=statuses.count("candidate"),
            in_production=sum(1 for status in statuses if status in in_production),
            preview_ready=statuses.count("preview_ready"),
            publish_ready=statuses.count("publish_ready"),
            published=statuses.count("published"),
            rejected=statuses.count("rejected"),
            top_score=max((story.score.total for story in stories), default=0),
        )


STORE = MediaStoryStore()
