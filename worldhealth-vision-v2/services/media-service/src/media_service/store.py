from __future__ import annotations

import re
from copy import deepcopy
from datetime import datetime, timezone
from threading import RLock
from uuid import uuid4

from media_service.models import (
    AssetInventory,
    CreateStoryRequest,
    DecisionRequest,
    EditorialScoreFactors,
    HookOption,
    MediaDashboard,
    MediaSource,
    MediaStory,
    QaState,
    SelectHookRequest,
    StoryStatus,
)
from media_service.scoring import compute_editorial_score


class MediaStoryNotFoundError(KeyError):
    pass


class MediaWorkflowConflictError(ValueError):
    pass


def _dt(value: str) -> datetime:
    return datetime.fromisoformat(value.replace("Z", "+00:00"))


def _slugify(value: str) -> str:
    lowered = value.lower()
    lowered = re.sub(r"[^a-z0-9]+", "-", lowered)
    return lowered.strip("-")[:96] or "story"


def build_seed_story() -> MediaStory:
    factors = EditorialScoreFactors(
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
    return MediaStory(
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
        score=compute_editorial_score(factors),
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
        target_duration_sec=16,
        assets=AssetInventory(photos=7, videos=1, official_documents=1, maps_or_charts=2),
        qa=QaState(
            facts="pass",
            source_display="pass",
            notes=["Story de démonstration : le rendu vidéo n'est pas encore généré."],
        ),
    )


class MediaStoryStore:
    def __init__(self) -> None:
        self._lock = RLock()
        self._stories: dict[str, MediaStory] = {}
        self.reset()

    def reset(self) -> None:
        with self._lock:
            seed = build_seed_story()
            self._stories = {seed.id: seed}

    def list(self, status: StoryStatus | None = None) -> list[MediaStory]:
        with self._lock:
            stories = list(self._stories.values())
            if status is not None:
                stories = [story for story in stories if story.status == status]
            stories.sort(key=lambda story: (story.score.total, story.detected_at), reverse=True)
            return deepcopy(stories)

    def get(self, story_id: str) -> MediaStory:
        with self._lock:
            story = self._stories.get(story_id)
            if story is None:
                raise MediaStoryNotFoundError(story_id)
            return deepcopy(story)

    def create(self, request: CreateStoryRequest) -> MediaStory:
        now = datetime.now(timezone.utc)
        story_id = f"story-{uuid4().hex[:12]}"
        story = MediaStory(
            id=story_id,
            slug=f"{_slugify(request.title)}-{story_id[-6:]}",
            status="candidate",
            title=request.title,
            summary=request.summary,
            category=request.category,
            language=request.language,
            country_iso3=request.country_iso3.upper() if request.country_iso3 else None,
            country_name=request.country_name,
            region=request.region,
            breaking=request.breaking,
            detected_at=request.detected_at,
            event_at=request.event_at,
            updated_at=now,
            verification_status=request.verification_status,
            confidence_score=request.confidence_score,
            sources=request.sources,
            score=compute_editorial_score(request.factors),
            hooks=request.hooks,
            target_duration_sec=request.target_duration_sec,
            assets=request.assets,
        )
        with self._lock:
            self._stories[story.id] = deepcopy(story)
        return story

    def recompute_score(self, story_id: str) -> MediaStory:
        story = self.get(story_id)
        story.score = compute_editorial_score(story.score.factors)
        return self._save(story)

    def select_hook(self, story_id: str, request: SelectHookRequest) -> MediaStory:
        story = self.get(story_id)
        if not any(hook.id == request.hook_id for hook in story.hooks):
            raise MediaWorkflowConflictError("Unknown hook for this story.")
        story.selected_hook_id = request.hook_id
        return self._save(story)

    def decide(self, story_id: str, request: DecisionRequest) -> MediaStory:
        story = self.get(story_id)

        if request.action == "approve":
            allowed = {"detected", "verifying", "candidate", "changes_requested"}
            next_status: StoryStatus = "approved"
        elif request.action == "reject":
            allowed = {
                "detected", "verifying", "candidate", "approved", "scripting", "assets",
                "rendering", "qa", "preview_ready", "changes_requested", "publish_ready",
            }
            next_status = "rejected"
        elif request.action == "request_changes":
            allowed = {"approved", "scripting", "assets", "rendering", "qa", "preview_ready", "publish_ready"}
            next_status = "changes_requested"
        else:
            allowed = {"qa", "preview_ready", "changes_requested"}
            next_status = "publish_ready"

        if story.status not in allowed:
            raise MediaWorkflowConflictError(
                f"Action '{request.action}' is not allowed from status '{story.status}'."
            )

        story.status = next_status
        story.approval_note = request.note
        return self._save(story)

    def dashboard(self) -> MediaDashboard:
        with self._lock:
            stories = list(self._stories.values())
            statuses = [story.status for story in stories]
            production = {
                "approved", "scripting", "assets", "rendering", "qa", "changes_requested",
            }
            return MediaDashboard(
                total=len(stories),
                detected=statuses.count("detected"),
                verifying=statuses.count("verifying"),
                candidates=statuses.count("candidate"),
                in_production=sum(1 for status in statuses if status in production),
                preview_ready=statuses.count("preview_ready"),
                publish_ready=statuses.count("publish_ready"),
                published=statuses.count("published"),
                rejected=statuses.count("rejected"),
                top_score=max((story.score.total for story in stories), default=0),
            )

    def _save(self, story: MediaStory) -> MediaStory:
        story.updated_at = datetime.now(timezone.utc)
        with self._lock:
            self._stories[story.id] = deepcopy(story)
        return deepcopy(story)


STORE = MediaStoryStore()
