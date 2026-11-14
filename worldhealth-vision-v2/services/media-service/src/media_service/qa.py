from __future__ import annotations

import json
from datetime import datetime, timezone
from typing import Protocol

import httpx

from media_service.asset_workflow import required_asset_scene_orders
from media_service.models import (
    MediaStory,
    QaIssue,
    QaReport,
    QaState,
    RunQaRequest,
)
from media_service.settings import Settings, get_settings


class QaConfigurationError(RuntimeError):
    pass


class QaProviderError(RuntimeError):
    pass


LANGUAGE_QA_SCHEMA = {
    "type": "object",
    "additionalProperties": False,
    "properties": {
        "issues": {
            "type": "array",
            "items": {
                "type": "object",
                "additionalProperties": False,
                "properties": {
                    "original_text": {"type": "string"},
                    "suggested_text": {"type": "string"},
                    "explanation": {"type": "string"},
                },
                "required": [
                    "original_text",
                    "suggested_text",
                    "explanation",
                ],
            },
        }
    },
    "required": ["issues"],
}


class LanguageQaClientProtocol(Protocol):
    model_name: str

    async def check(self, story: MediaStory) -> list[QaIssue]: ...


def _append_issue(
    issues: list[QaIssue],
    check: str,
    message: str,
    *,
    severity: str = "error",
) -> None:
    issues.append(
        QaIssue(
            check=check,
            severity=severity,
            message=message,
        )
    )


def evaluate_structural_qa(
    story: MediaStory,
) -> tuple[QaState, list[QaIssue]]:
    state = story.qa.model_copy(deep=True)
    issues: list[QaIssue] = []

    # Facts: VERIFY remains the authority.
    report = story.verification_report
    report_claims_ok = (
        report is None
        or (
            bool(report.claims)
            and all(claim.status == "verified" for claim in report.claims)
        )
    )
    if story.verification_status == "verified" and report_claims_ok:
        state.facts = "pass"
    else:
        state.facts = "fail"
        _append_issue(
            issues,
            "facts",
            "VERIFY does not prove every factual claim used by the story.",
        )

    # Rights: every external visual required by CREATIVE must resolve to an
    # explicitly approved asset.
    required_orders = set(required_asset_scene_orders(story))
    if not required_orders:
        state.rights = "pass"
    elif story.asset_bundle is None:
        state.rights = "fail"
        _append_issue(
            issues,
            "rights",
            "CREATIVE requires external media but ASSETS has not been run.",
        )
    else:
        assets_by_id = {
            asset.id: asset
            for asset in story.asset_bundle.assets
        }
        approved_orders = {
            selection.scene_order
            for selection in story.asset_bundle.selections
            if (
                selection.asset_id in assets_by_id
                and assets_by_id[selection.asset_id].rights_status == "approved"
            )
        }
        unresolved = required_orders.difference(approved_orders)
        if unresolved or story.asset_bundle.unresolved_scene_orders:
            state.rights = "fail"
            _append_issue(
                issues,
                "rights",
                "Media rights remain unresolved for scenes: "
                + ", ".join(
                    str(order)
                    for order in sorted(
                        unresolved.union(
                            story.asset_bundle.unresolved_scene_orders
                        )
                    )
                ),
            )
        else:
            state.rights = "pass"

    # Audio: modern CREATIVE output must have gone through transcript/duration QA.
    if story.creative_package is None:
        state.audio = "pass" if state.audio == "pass" else "pending"
    elif story.voiceover is not None and story.voiceover.qa_passed:
        state.audio = "pass"
    else:
        state.audio = "fail"
        _append_issue(
            issues,
            "audio",
            "The AI voiceover is missing or failed transcript/duration QA.",
        )

    draft = story.video_draft
    if draft is None:
        state.safe_zones = "fail"
        state.logo_integrity = "fail"
        state.source_display = "fail"
        _append_issue(issues, "safe_zones", "No final VideoDraft is available.")
        _append_issue(issues, "logo_integrity", "No final VideoDraft is available.")
        _append_issue(issues, "source_display", "No final VideoDraft is available.")
        return state, issues

    # Safe-zone preflight is deterministic because the Remotion design system has
    # fixed 1080x1920 geometry and reserved right/bottom UI zones.
    allowed_profile = draft.safe_zone_profile == "tiktok-conservative-v1"
    geometry_ok = (
        draft.width == 1080
        and draft.height == 1920
        and draft.fps == 30
    )
    text_overflow = [
        scene.order
        for scene in draft.scenes
        if len(scene.on_screen_text.strip()) > (
            120 if scene.purpose.lower() == "hook" else 190
        )
    ]
    if allowed_profile and geometry_ok and not text_overflow:
        state.safe_zones = "pass"
    else:
        state.safe_zones = "fail"
        detail = (
            "safe-zone profile or 1080x1920/30fps geometry is invalid"
            if not (allowed_profile and geometry_ok)
            else "on-screen copy is too long in scenes: "
            + ", ".join(str(order) for order in text_overflow)
        )
        _append_issue(issues, "safe_zones", detail)

    # Logo/brand is rendered from a fixed trusted Remotion design system.
    if (
        draft.design_system_id == "wv-pilot-editorial-dark-v1"
        and story.render_job is not None
        and story.render_job.status == "completed"
    ):
        state.logo_integrity = "pass"
    else:
        state.logo_integrity = "fail"
        _append_issue(
            issues,
            "logo_integrity",
            "The approved World-Vision design system has not produced a completed render.",
        )

    source_cards = [
        scene
        for scene in draft.scenes
        if scene.visual_kind == "source_card"
        or scene.purpose.lower() == "source_and_brand"
    ]
    source_names = [source.name for source in story.sources]
    source_text = draft.source_line.casefold()
    source_line_ok = (
        bool(story.sources)
        and bool(source_cards)
        and source_text.startswith("sources :")
        and any(name.casefold() in source_text for name in source_names)
    )
    if source_line_ok:
        state.source_display = "pass"
    else:
        state.source_display = "fail"
        _append_issue(
            issues,
            "source_display",
            "The final draft does not visibly expose at least one real story source.",
        )

    # Final render integrity is measured from the encoded MP4 with ffprobe.
    render_job = story.render_job
    probe = render_job.output_probe if render_job is not None else None
    if (
        render_job is None
        or render_job.status != "completed"
        or not render_job.output_url
        or not render_job.output_sha256
        or probe is None
    ):
        state.render_integrity = "fail"
        _append_issue(
            issues,
            "render_integrity",
            "The final MP4 has not been completed, hashed and ffprobe-validated.",
        )
    else:
        duration_tolerance = max(0.75, 2 / max(draft.fps, 1))
        format_ok = (
            probe.format_name is None
            or "mp4" in probe.format_name.casefold()
            or "mov" in probe.format_name.casefold()
        )
        render_checks = {
            "container": format_ok,
            "codec": (probe.video_codec or "").casefold() == "h264",
            "width": probe.width == draft.width,
            "height": probe.height == draft.height,
            "fps": abs(probe.fps - draft.fps) <= 0.05,
            "duration": abs(probe.duration_sec - draft.duration_sec)
            <= duration_tolerance,
            "size": probe.size_bytes > 0,
        }
        failed_render_checks = [
            name for name, passed in render_checks.items() if not passed
        ]
        if failed_render_checks:
            state.render_integrity = "fail"
            _append_issue(
                issues,
                "render_integrity",
                "Encoded MP4 failed technical checks: "
                + ", ".join(failed_render_checks)
                + (
                    f" (measured {probe.width}x{probe.height}, "
                    f"{probe.fps:.3f} fps, {probe.duration_sec:.3f}s, "
                    f"{probe.video_codec or 'unknown codec'})."
                ),
            )
        else:
            state.render_integrity = "pass"

        if story.voiceover is not None:
            if not probe.has_audio:
                state.audio = "fail"
                _append_issue(
                    issues,
                    "audio",
                    "The approved voiceover exists, but the encoded MP4 has no audio stream.",
                )
            else:
                delivery_format_ok = (
                    (probe.audio_codec or "").casefold() == "aac"
                    and probe.audio_sample_rate_hz == 48_000
                )
                if not delivery_format_ok:
                    state.audio = "fail"
                    _append_issue(
                        issues,
                        "audio",
                        "Final narration delivery format is invalid "
                        f"({probe.audio_codec or 'unknown codec'}, "
                        f"{probe.audio_sample_rate_hz or 'unknown'} Hz). "
                        "Expected AAC at 48000 Hz after normalization.",
                    )

                loudness_values_present = (
                    probe.integrated_lufs is not None
                    and probe.true_peak_dbfs is not None
                    and probe.loudness_range_lu is not None
                )
                loudness_ok = (
                    loudness_values_present
                    and -17.0 <= probe.integrated_lufs <= -15.0
                    and probe.true_peak_dbfs <= -1.0
                    and probe.loudness_range_lu <= 12.0
                )
                if not loudness_ok:
                    state.audio = "fail"
                    measured = (
                        f"{probe.integrated_lufs:.2f} LUFS, "
                        f"{probe.true_peak_dbfs:.2f} dBTP, "
                        f"LRA {probe.loudness_range_lu:.2f} LU"
                        if loudness_values_present
                        else "mesures de loudness absentes"
                    )
                    _append_issue(
                        issues,
                        "audio",
                        "Final narration loudness is outside the World-Vision "
                        f"delivery envelope ({measured}). Expected integrated "
                        "loudness between -17 and -15 LUFS, true peak <= -1 dBTP "
                        "and LRA <= 12 LU.",
                    )

    return state, issues


def _language_qa_text(story: MediaStory) -> str:
    parts: list[str] = [
        f"TITRE\n{story.title}",
        f"RÉSUMÉ\n{story.summary}",
    ]

    if story.creative_package is not None:
        parts.append(f"ANGLE\n{story.creative_package.angle}")
        parts.extend(
            f"HOOK {index}\n{hook.text}"
            for index, hook in enumerate(
                story.creative_package.hooks,
                start=1,
            )
        )
        parts.extend(
            f"SCRIPT {index}\n{segment.text}"
            for index, segment in enumerate(
                story.creative_package.script_segments,
                start=1,
            )
        )
        parts.append(f"LÉGENDE\n{story.creative_package.caption}")

    if story.video_draft is not None:
        parts.extend(
            f"ÉCRAN SCÈNE {scene.order}\n{scene.on_screen_text}"
            for scene in story.video_draft.scenes
        )

    return "\n\n".join(parts)


def _extract_output_text(payload: dict) -> str:
    direct = payload.get("output_text")
    if isinstance(direct, str) and direct.strip():
        return direct

    chunks: list[str] = []
    for item in payload.get("output", []):
        if not isinstance(item, dict) or item.get("type") != "message":
            continue
        for part in item.get("content", []):
            if isinstance(part, dict) and part.get("type") == "output_text":
                value = part.get("text")
                if isinstance(value, str):
                    chunks.append(value)

    output = "".join(chunks).strip()
    if not output:
        raise QaProviderError(
            "OpenAI QA response did not contain structured output text."
        )
    return output


class OpenAILanguageQaClient:
    def __init__(self, settings: Settings | None = None) -> None:
        self.settings = settings or get_settings()
        self.model_name = self.settings.qa_model

    async def check(self, story: MediaStory) -> list[QaIssue]:
        if not self.settings.openai_api_key:
            raise QaConfigurationError(
                "WHV_MEDIA_OPENAI_API_KEY is not configured; linguistic QA is disabled."
            )

        prompt = f"""
Tu es le correcteur linguistique final de World-Vision.
Contrôle UNIQUEMENT l'orthographe, la grammaire, la ponctuation, les accords,
les coquilles et la typographie française des textes ci-dessous.

Interdictions:
- ne change jamais un chiffre, une date, un nom propre ou un fait;
- ne propose pas de nouvel angle;
- ne réécris pas pour le style;
- ne signale pas une préférence stylistique comme une faute;
- une issue doit reproduire précisément le fragment fautif et sa correction.

Si tout est correct, retourne une liste issues vide.

TEXTES:
{_language_qa_text(story)}
""".strip()

        body = {
            "model": self.settings.qa_model,
            "reasoning": {"effort": "low"},
            "text": {
                "format": {
                    "type": "json_schema",
                    "name": "world_vision_language_qa",
                    "description": "Strict French spelling and grammar QA.",
                    "strict": True,
                    "schema": LANGUAGE_QA_SCHEMA,
                }
            },
            "input": prompt,
        }
        headers = {
            "authorization": f"Bearer {self.settings.openai_api_key}",
            "content-type": "application/json",
        }

        try:
            async with httpx.AsyncClient(
                timeout=self.settings.qa_timeout_seconds
            ) as client:
                response = await client.post(
                    "https://api.openai.com/v1/responses",
                    headers=headers,
                    json=body,
                )
                response.raise_for_status()
        except httpx.HTTPError as exc:
            raise QaProviderError(
                f"OpenAI linguistic QA request failed: {exc}"
            ) from exc

        payload = response.json()
        if payload.get("status") not in {None, "completed"}:
            raise QaProviderError(
                f"OpenAI linguistic QA response status is {payload.get('status')!r}."
            )

        try:
            raw = json.loads(_extract_output_text(payload))
        except (json.JSONDecodeError, TypeError) as exc:
            raise QaProviderError(
                "OpenAI linguistic QA returned invalid JSON."
            ) from exc

        raw_issues = raw.get("issues", [])
        if not isinstance(raw_issues, list):
            return []

        issues: list[QaIssue] = []
        for raw_issue in raw_issues[:20]:
            if not isinstance(raw_issue, dict):
                continue
            original = raw_issue.get("original_text")
            suggested = raw_issue.get("suggested_text")
            explanation = raw_issue.get("explanation")
            if not all(
                isinstance(value, str) and value.strip()
                for value in [original, suggested, explanation]
            ):
                continue
            issues.append(
                QaIssue(
                    check="spelling",
                    severity="error",
                    message=explanation.strip(),
                    original_text=original.strip(),
                    suggested_text=suggested.strip(),
                )
            )
        return issues


async def run_publication_qa(
    story: MediaStory,
    request: RunQaRequest,
    *,
    language_client: LanguageQaClientProtocol,
) -> tuple[QaState, QaReport]:
    state, issues = evaluate_structural_qa(story)

    language_model: str | None = None
    if request.check_spelling:
        spelling_issues = await language_client.check(story)
        issues.extend(spelling_issues)
        state.spelling = "fail" if spelling_issues else "pass"
        language_model = language_client.model_name

    checks = [
        state.facts,
        state.spelling,
        state.safe_zones,
        state.logo_integrity,
        state.source_display,
        state.rights,
        state.audio,
        state.render_integrity,
    ]
    previous_version = (
        story.qa_report.version
        if story.qa_report is not None
        else 0
    )
    report = QaReport(
        version=previous_version + 1,
        checked_at=datetime.now(timezone.utc),
        language_model=language_model,
        all_passed=all(value == "pass" for value in checks),
        issues=issues,
    )
    return state, report


QA_LANGUAGE_CLIENT = OpenAILanguageQaClient()
