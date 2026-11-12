from __future__ import annotations

import hashlib
import re
import unicodedata
from datetime import datetime, timezone
from uuid import uuid4

from media_service.asset_workflow import (
    recompute_unresolved_scene_orders,
    required_asset_scene_orders,
)
from media_service.creative import build_video_draft
from media_service.models import (
    AssetBundle,
    AssetInventory,
    AssetSelection,
    CreateStoryRequest,
    CreativePackage,
    DecisionRequest,
    EditorialScoreFactors,
    HookOption,
    MediaDashboard,
    MediaSource,
    MediaStory,
    PrepareDraftRequest,
    QaReport,
    QaState,
    RadarCandidate,
    RadarScanHistoryItem,
    RadarScanRequest,
    RadarScanResult,
    RenderJobRef,
    SelectAssetRequest,
    SelectHookRequest,
    StoryStatus,
    VerificationReport,
    VoiceoverRef,
)
from media_service.persistence import StoryPersistence, build_story_persistence
from media_service.scoring import compute_editorial_score
from media_service.settings import get_settings


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


def _radar_fingerprint(candidate: RadarCandidate) -> str:
    normalized = unicodedata.normalize("NFKD", candidate.title)
    normalized = normalized.encode("ascii", "ignore").decode("ascii").lower()
    normalized = re.sub(r"[^a-z0-9]+", " ", normalized)
    normalized = " ".join(normalized.split())
    country = (candidate.country_iso3 or "WORLD").upper()
    raw = f"{country}|{normalized}".encode("utf-8")
    return hashlib.sha256(raw).hexdigest()[:24]


def _source_id(url: str) -> str:
    return "src-" + hashlib.sha256(url.encode("utf-8")).hexdigest()[:12]


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
    def __init__(
        self,
        persistence: StoryPersistence | None = None,
        *,
        seed_demo: bool | None = None,
    ) -> None:
        settings = get_settings()
        self._persistence = persistence or build_story_persistence(settings)
        self._seed_demo = settings.seed_demo_story if seed_demo is None else seed_demo

        if self._seed_demo and not self._persistence.list():
            self._persistence.save(build_seed_story())

    def reset(self) -> None:
        self._persistence.reset()
        if self._seed_demo:
            self._persistence.save(build_seed_story())

    def close(self) -> None:
        self._persistence.close()

    def list(self, status: StoryStatus | None = None) -> list[MediaStory]:
        return self._persistence.list(status=status)

    def get(self, story_id: str) -> MediaStory:
        story = self._persistence.get(story_id)
        if story is None:
            raise MediaStoryNotFoundError(story_id)
        return story

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
        return self._persistence.save(story)

    def create_from_radar(
        self,
        candidate: RadarCandidate,
        scan_id: str,
    ) -> tuple[MediaStory, bool]:
        fingerprint = _radar_fingerprint(candidate)

        existing = self._persistence.find_by_radar_fingerprint(fingerprint)
        if existing is not None:
            return existing, False

        now = datetime.now(timezone.utc)
        story_id = f"story-{uuid4().hex[:12]}"
        sources = [
            MediaSource(
                id=_source_id(source.url),
                name=source.name,
                url=source.url,
                source_type=source.source_type,
                scope=source.scope,
                country_iso3=source.country_iso3,
                is_primary=source.is_primary,
                published_at=source.published_at,
                note=source.note,
                rights_note=source.rights_note,
            )
            for source in candidate.sources
        ]
        hooks = [
            HookOption(
                id=f"hook-{index + 1}-{story_id[-4:]}",
                text=hook.text,
                score=hook.score,
                rationale=hook.rationale,
            )
            for index, hook in enumerate(candidate.hooks[:3])
        ]

        story = MediaStory(
            id=story_id,
            slug=f"{_slugify(candidate.title)}-{story_id[-6:]}",
            status="candidate",
            title=candidate.title,
            summary=candidate.summary,
            category=candidate.category,
            language="fr",
            country_iso3=candidate.country_iso3.upper() if candidate.country_iso3 else None,
            country_name=candidate.country_name,
            region=candidate.region,
            breaking=candidate.breaking,
            detected_at=now,
            event_at=candidate.event_at,
            updated_at=now,
            verification_status="partially_verified",
            confidence_score=candidate.confidence_score,
            sources=sources,
            score=compute_editorial_score(candidate.factors),
            hooks=hooks,
            target_duration_sec=15,
            radar_scan_id=scan_id,
            radar_fingerprint=fingerprint,
        )

        return self._persistence.save_radar_if_absent(story)

    def record_radar_scan(
        self,
        request: RadarScanRequest,
        result: RadarScanResult,
    ) -> None:
        self._persistence.save_radar_scan(request, result)

    def list_radar_scans(self, limit: int = 20) -> list[RadarScanHistoryItem]:
        return self._persistence.list_radar_scans(limit=limit)

    def recompute_score(self, story_id: str) -> MediaStory:
        story = self.get(story_id)
        story.score = compute_editorial_score(story.score.factors)
        return self._save(story)

    def apply_verification(
        self,
        story_id: str,
        report: VerificationReport,
    ) -> MediaStory:
        story = self.get(story_id)
        story.verification_report = report
        story.verification_status = report.verdict
        story.confidence_score = report.confidence_score
        story.score.factors.source_confidence = report.confidence_score
        story.score = compute_editorial_score(story.score.factors)

        if report.verdict == "conflicting":
            story.qa.facts = "fail"
            story.qa.notes.append(
                "VERIFY detected contradictory evidence; editorial approval is blocked."
            )
        elif report.verdict == "verified":
            story.qa.facts = "pass"
        else:
            story.qa.facts = "pending"

        return self._save(story)

    def apply_creative_package(
        self,
        story_id: str,
        package: CreativePackage,
    ) -> MediaStory:
        story = self.get(story_id)
        if story.status != "approved":
            raise MediaWorkflowConflictError(
                "CREATIVE can only run after the story is editorially approved."
            )
        if story.verification_status != "verified":
            raise MediaWorkflowConflictError(
                "CREATIVE requires a fully verified story."
            )

        story.creative_package = package
        story.hooks = [hook.model_copy(deep=True) for hook in package.hooks]
        story.selected_hook_id = None
        story.script = " ".join(
            segment.text for segment in package.script_segments
        )
        story.target_duration_sec = package.target_duration_sec
        story.video_draft = None
        story.voiceover = None
        story.render_job = None
        story.qa.audio = "pending"
        return self._save(story)

    def select_hook(self, story_id: str, request: SelectHookRequest) -> MediaStory:
        story = self.get(story_id)
        if not any(hook.id == request.hook_id for hook in story.hooks):
            raise MediaWorkflowConflictError("Unknown hook for this story.")
        story.selected_hook_id = request.hook_id
        return self._save(story)

    def apply_asset_bundle(
        self,
        story_id: str,
        bundle: AssetBundle,
    ) -> MediaStory:
        story = self.get(story_id)
        if story.status != "approved":
            raise MediaWorkflowConflictError(
                "ASSETS can only run after an approved CREATIVE package."
            )
        if story.creative_package is None:
            raise MediaWorkflowConflictError(
                "CREATIVE package is required before ASSETS."
            )

        story.asset_bundle = bundle
        story.assets.photos = sum(
            asset.kind == "image"
            for asset in bundle.assets
        )
        story.assets.videos = sum(
            asset.kind == "video"
            for asset in bundle.assets
        )
        story.status = "assets"
        story.qa.rights = (
            "pass"
            if not bundle.unresolved_scene_orders
            else "pending"
        )
        return self._save(story)

    def select_asset(
        self,
        story_id: str,
        request: SelectAssetRequest,
    ) -> MediaStory:
        story = self.get(story_id)
        bundle = story.asset_bundle
        if bundle is None:
            raise MediaWorkflowConflictError(
                "Discover assets before selecting one."
            )

        asset = next(
            (candidate for candidate in bundle.assets if candidate.id == request.asset_id),
            None,
        )
        if asset is None:
            raise MediaWorkflowConflictError(
                "Unknown asset for this story."
            )

        valid_scene_orders = set(required_asset_scene_orders(story))
        if request.scene_order not in valid_scene_orders:
            raise MediaWorkflowConflictError(
                "This scene does not accept an external media asset."
            )

        bundle.selections = [
            selection
            for selection in bundle.selections
            if selection.scene_order != request.scene_order
        ]
        bundle.selections.append(
            AssetSelection(
                scene_order=request.scene_order,
                asset_id=request.asset_id,
            )
        )
        bundle.selections.sort(key=lambda selection: selection.scene_order)
        bundle.unresolved_scene_orders = recompute_unresolved_scene_orders(
            story,
            bundle,
        )
        story.asset_bundle = bundle
        story.qa.rights = (
            "pass"
            if not bundle.unresolved_scene_orders
            else "pending"
        )
        return self._save(story)

    def prepare_draft(self, story_id: str, request: PrepareDraftRequest) -> MediaStory:
        story = self.get(story_id)
        if story.status not in {"approved", "assets", "changes_requested", "scripting"}:
            raise MediaWorkflowConflictError(
                f"Video draft cannot be prepared from status '{story.status}'."
            )
        if story.creative_package is not None:
            required_orders = required_asset_scene_orders(story)
            if required_orders:
                if story.asset_bundle is None:
                    raise MediaWorkflowConflictError(
                        "Discover and clear media assets before preparing the final draft."
                    )
                unresolved = recompute_unresolved_scene_orders(
                    story,
                    story.asset_bundle,
                )
                if unresolved:
                    raise MediaWorkflowConflictError(
                        "Asset rights are unresolved for scenes: "
                        + ", ".join(str(order) for order in unresolved)
                    )
        try:
            draft = build_video_draft(story, request)
        except ValueError as exc:
            raise MediaWorkflowConflictError(str(exc)) from exc

        story.video_draft = draft
        story.script = draft.voiceover_script
        story.voiceover = None
        story.qa.audio = "pending"
        story.status = "scripting"
        return self._save(story)

    def apply_voiceover(
        self,
        story_id: str,
        voiceover: VoiceoverRef,
    ) -> MediaStory:
        story = self.get(story_id)
        if story.video_draft is None:
            raise MediaWorkflowConflictError(
                "Prepare the final VideoDraft before generating AUDIO."
            )
        if story.status != "scripting":
            raise MediaWorkflowConflictError(
                f"AUDIO cannot be attached from status '{story.status}'."
            )

        story.voiceover = voiceover
        story.qa.audio = "pass" if voiceover.qa_passed else "fail"
        if not voiceover.qa_passed:
            story.qa.notes.append(
                "AUDIO QA failed: transcript or duration does not match the approved draft."
            )
        return self._save(story)

    def attach_render_job(self, story_id: str, render_job: RenderJobRef) -> MediaStory:
        story = self.get(story_id)
        if story.video_draft is None:
            raise MediaWorkflowConflictError("A video draft is required before rendering.")
        if story.creative_package is not None:
            if story.voiceover is None:
                raise MediaWorkflowConflictError(
                    "Generate and validate AUDIO before rendering."
                )
            if story.qa.audio != "pass":
                raise MediaWorkflowConflictError(
                    "AUDIO QA must pass before rendering."
                )
        if story.status not in {"scripting", "assets", "rendering"}:
            raise MediaWorkflowConflictError(
                f"Render cannot start from status '{story.status}'."
            )
        story.render_job = render_job
        story.status = "rendering"
        return self._save(story)

    def sync_render_job(self, story_id: str, render_job: RenderJobRef) -> MediaStory:
        story = self.get(story_id)
        if story.render_job is None:
            raise MediaWorkflowConflictError("Story has no render job.")
        if story.render_job.id != render_job.id:
            raise MediaWorkflowConflictError("Render job does not match this story.")

        story.render_job = render_job
        if render_job.status == "completed":
            story.status = "preview_ready"
        elif render_job.status == "failed":
            story.status = "changes_requested"
            story.qa.notes.append(
                f"Render failed: {render_job.error or 'unknown renderer error'}"
            )
        else:
            story.status = "rendering"
        return self._save(story)

    def apply_qa_report(
        self,
        story_id: str,
        state: QaState,
        report: QaReport,
    ) -> MediaStory:
        story = self.get(story_id)
        if story.status != "qa":
            raise MediaWorkflowConflictError(
                f"Publication QA can only run from status 'qa', not '{story.status}'."
            )
        story.qa = state
        story.qa_report = report
        return self._save(story)

    def decide(self, story_id: str, request: DecisionRequest) -> MediaStory:
        story = self.get(story_id)

        if request.action == "approve":
            allowed = {"detected", "verifying", "candidate", "changes_requested"}
            if story.verification_status != "verified":
                raise MediaWorkflowConflictError(
                    "Story must be fully verified before editorial approval."
                )
            next_status: StoryStatus = "approved"
        elif request.action == "reject":
            allowed = {
                "detected",
                "verifying",
                "candidate",
                "approved",
                "scripting",
                "assets",
                "rendering",
                "qa",
                "preview_ready",
                "changes_requested",
                "publish_ready",
            }
            next_status = "rejected"
        elif request.action == "request_changes":
            allowed = {
                "candidate",
                "approved",
                "scripting",
                "assets",
                "rendering",
                "qa",
                "preview_ready",
                "publish_ready",
            }
            next_status = "changes_requested"
        elif request.action == "approve_preview":
            allowed = {"preview_ready"}
            next_status = "qa"
        else:
            allowed = {"qa"}
            next_status = "publish_ready"

        if story.status not in allowed:
            raise MediaWorkflowConflictError(
                f"Action '{request.action}' is not allowed from status '{story.status}'."
            )

        if request.action == "mark_publish_ready":
            checks = {
                "facts": story.qa.facts,
                "spelling": story.qa.spelling,
                "safe_zones": story.qa.safe_zones,
                "logo_integrity": story.qa.logo_integrity,
                "source_display": story.qa.source_display,
                "rights": story.qa.rights,
                "audio": story.qa.audio,
            }
            pending = [name for name, value in checks.items() if value != "pass"]
            if pending:
                raise MediaWorkflowConflictError(
                    "QA is incomplete: " + ", ".join(pending)
                )

        story.status = next_status
        story.approval_note = request.note
        return self._save(story)

    def dashboard(self) -> MediaDashboard:
        stories = self._persistence.list()
        statuses = [story.status for story in stories]
        production = {
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
            in_production=sum(1 for status in statuses if status in production),
            preview_ready=statuses.count("preview_ready"),
            publish_ready=statuses.count("publish_ready"),
            published=statuses.count("published"),
            rejected=statuses.count("rejected"),
            top_score=max((story.score.total for story in stories), default=0),
        )

    def _save(self, story: MediaStory) -> MediaStory:
        story.updated_at = datetime.now(timezone.utc)
        return self._persistence.save(story)


STORE = MediaStoryStore()
