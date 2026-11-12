from __future__ import annotations

import math
from datetime import datetime, timezone

from media_service.models import MediaStory, PrepareDraftRequest, VideoDraft, VideoScene


WORDS_PER_SECOND = 2.35


def _truncate_words(text: str, max_words: int) -> str:
    words = text.split()
    if len(words) <= max_words:
        return text.strip()
    return " ".join(words[:max_words]).rstrip(" ,;:") + "…"


def _source_line(story: MediaStory) -> str:
    if not story.sources:
        return "Source : à compléter"
    names = [source.name for source in story.sources[:2]]
    return "Sources : " + " · ".join(names)


def _creative_video_draft(
    story: MediaStory,
    request: PrepareDraftRequest,
) -> VideoDraft:
    package = story.creative_package
    if package is None:
        raise ValueError("Creative package is missing.")

    if not story.selected_hook_id:
        raise ValueError("A hook must be selected before preparing a video draft.")

    hook = next(
        (candidate for candidate in package.hooks if candidate.id == story.selected_hook_id),
        None,
    )
    if hook is None:
        raise ValueError("The selected creative hook no longer exists.")

    duration = float(package.target_duration_sec)
    source_line = _source_line(story)
    source_ids = [source.id for source in story.sources[:3]]

    if request.script_override:
        max_words = max(18, math.floor(duration * WORDS_PER_SECOND))
        voiceover = _truncate_words(request.script_override.strip(), max_words)
    else:
        voiceover = " ".join(
            segment.text.strip()
            for segment in package.script_segments
            if segment.text.strip()
        )

    plans = list(package.scene_plan)
    if not plans:
        raise ValueError("Creative scene plan is empty.")

    source_scene_count = sum(
        plan.visual_kind == "source_card"
        for plan in plans
    )
    source_duration = (
        min(2.8, max(2.0, duration * 0.16))
        if source_scene_count
        else 0.0
    )
    content_plans = [
        plan
        for plan in plans
        if plan.visual_kind != "source_card"
    ]
    available_content = max(
        2.0 * max(1, len(content_plans)),
        duration - source_duration * source_scene_count,
    )
    content_duration = (
        available_content / len(content_plans)
        if content_plans
        else 0.0
    )

    scenes: list[VideoScene] = []
    cursor = 0.0
    narration_index = 0

    for plan in plans:
        is_source = plan.visual_kind == "source_card"
        scene_duration = source_duration if is_source else content_duration

        narration = None
        if not is_source and narration_index < len(package.script_segments):
            narration = package.script_segments[narration_index].text
            narration_index += 1

        on_screen_text = plan.on_screen_text
        if plan.purpose.lower() == "hook":
            on_screen_text = hook.text
        elif is_source:
            on_screen_text = source_line

        scenes.append(
            VideoScene(
                id=f"scene-{len(scenes) + 1}",
                order=len(scenes) + 1,
                start_sec=round(cursor, 2),
                duration_sec=round(scene_duration, 2),
                purpose=plan.purpose,
                narration=narration,
                on_screen_text=on_screen_text,
                visual_kind=plan.visual_kind,
                asset_query=plan.asset_query,
                source_ids=source_ids,
            )
        )
        cursor += scene_duration

    if scenes:
        correction = duration - cursor
        scenes[-1].duration_sec = round(
            max(0.1, scenes[-1].duration_sec + correction),
            2,
        )

    previous_version = story.video_draft.version if story.video_draft else 0
    return VideoDraft(
        version=previous_version + 1,
        created_at=datetime.now(timezone.utc),
        duration_sec=duration,
        hook_id=hook.id,
        voiceover_script=voiceover,
        source_line=source_line,
        scenes=scenes,
    )


def _fallback_video_draft(
    story: MediaStory,
    request: PrepareDraftRequest,
) -> VideoDraft:
    if not story.selected_hook_id:
        raise ValueError("A hook must be selected before preparing a video draft.")

    hook = next(
        (candidate for candidate in story.hooks if candidate.id == story.selected_hook_id),
        None,
    )
    if hook is None:
        raise ValueError("The selected hook no longer exists on this story.")

    duration = float(story.target_duration_sec)
    max_words = max(18, math.floor(duration * WORDS_PER_SECOND))

    if request.script_override:
        voiceover = _truncate_words(request.script_override.strip(), max_words)
    else:
        remaining_words = max(8, max_words - len(hook.text.split()))
        context = _truncate_words(story.summary, remaining_words)
        voiceover = f"{hook.text} {context}".strip()

    source_line = _source_line(story)
    hook_duration = round(max(3.2, min(4.8, duration * 0.28)), 2)
    source_duration = round(max(2.2, min(3.0, duration * 0.18)), 2)
    context_duration = round(max(2.0, duration - hook_duration - source_duration), 2)

    context_text = _truncate_words(story.summary, 22)
    country_context = story.country_name or story.region or "Monde"
    source_ids = [source.id for source in story.sources[:2]]

    scenes = [
        VideoScene(
            id="scene-hook",
            order=1,
            start_sec=0,
            duration_sec=hook_duration,
            purpose="hook",
            narration=hook.text,
            on_screen_text=hook.text,
            visual_kind="real_video" if story.assets.videos > 0 else "real_photo",
            asset_query=f"{country_context} {story.category} actualité",
            source_ids=source_ids,
        ),
        VideoScene(
            id="scene-context",
            order=2,
            start_sec=hook_duration,
            duration_sec=context_duration,
            purpose="explain",
            narration=context_text,
            on_screen_text=context_text,
            visual_kind="chart" if story.assets.maps_or_charts > 0 else "typography",
            asset_query=f"{country_context} {story.category} chiffres contexte",
            source_ids=source_ids,
        ),
        VideoScene(
            id="scene-source",
            order=3,
            start_sec=round(hook_duration + context_duration, 2),
            duration_sec=source_duration,
            purpose="source_and_brand",
            narration=None,
            on_screen_text=source_line,
            visual_kind="source_card",
            asset_query=None,
            source_ids=source_ids,
        ),
    ]

    previous_version = story.video_draft.version if story.video_draft else 0
    return VideoDraft(
        version=previous_version + 1,
        created_at=datetime.now(timezone.utc),
        duration_sec=duration,
        hook_id=hook.id,
        voiceover_script=voiceover,
        source_line=source_line,
        scenes=scenes,
    )


def build_video_draft(story: MediaStory, request: PrepareDraftRequest) -> VideoDraft:
    if story.creative_package is not None:
        return _creative_video_draft(story, request)
    return _fallback_video_draft(story, request)
