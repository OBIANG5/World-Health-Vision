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


def build_video_draft(story: MediaStory, request: PrepareDraftRequest) -> VideoDraft:
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

    # The contract is deliberately deterministic for Phase 1. AI-assisted creative
    # generation will plug into the same VideoDraft model later.
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
