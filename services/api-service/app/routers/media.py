from __future__ import annotations

from fastapi import APIRouter, HTTPException, Query

from app.media_models import (
    DecisionRequest,
    MediaDashboard,
    MediaStory,
    SelectHookRequest,
)
from app.media_scoring import compute_editorial_score
from app.media_store import STORE


router = APIRouter(prefix="/media", tags=["media-studio"])


@router.get("/dashboard", response_model=MediaDashboard)
def media_dashboard() -> MediaDashboard:
    return STORE.dashboard()


@router.get("/stories", response_model=list[MediaStory])
def list_media_stories(
    status: str | None = Query(default=None),
) -> list[MediaStory]:
    return STORE.list(status=status)


@router.get("/stories/{story_id}", response_model=MediaStory)
def get_media_story(story_id: str) -> MediaStory:
    story = STORE.get(story_id)
    if story is None:
        raise HTTPException(status_code=404, detail="Story not found")
    return story


@router.post("/stories/{story_id}/score/recompute", response_model=MediaStory)
def recompute_story_score(story_id: str) -> MediaStory:
    story = STORE.get(story_id)
    if story is None:
        raise HTTPException(status_code=404, detail="Story not found")

    story.score = compute_editorial_score(story.score.factors)
    return STORE.save(story)


@router.post("/stories/{story_id}/hooks/select", response_model=MediaStory)
def select_story_hook(story_id: str, request: SelectHookRequest) -> MediaStory:
    story = STORE.get(story_id)
    if story is None:
        raise HTTPException(status_code=404, detail="Story not found")

    if not any(hook.id == request.hook_id for hook in story.hooks):
        raise HTTPException(status_code=400, detail="Unknown hook")

    story.selected_hook_id = request.hook_id
    return STORE.save(story)


@router.post("/stories/{story_id}/decision", response_model=MediaStory)
def decide_story(story_id: str, request: DecisionRequest) -> MediaStory:
    story = STORE.get(story_id)
    if story is None:
        raise HTTPException(status_code=404, detail="Story not found")

    transitions = {
        "approve": "approved",
        "reject": "rejected",
        "request_changes": "changes_requested",
        "mark_publish_ready": "publish_ready",
    }
    story.status = transitions[request.action]
    story.approval_note = request.note
    return STORE.save(story)
