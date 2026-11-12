from fastapi import FastAPI, HTTPException, Query
from fastapi.responses import Response
from prometheus_client import CONTENT_TYPE_LATEST, generate_latest

from media_service.models import (
    CreateStoryRequest,
    DecisionRequest,
    MediaDashboard,
    MediaStory,
    SelectHookRequest,
    StoryStatus,
)
from media_service.store import (
    MediaStoryNotFoundError,
    MediaWorkflowConflictError,
    STORE,
)


app = FastAPI(title="World-Vision Media Studio Service")


@app.get("/health")
async def health():
    return {"status": "ok", "service": "media-service"}


@app.get("/metrics")
async def metrics():
    return Response(generate_latest(), media_type=CONTENT_TYPE_LATEST)


@app.get("/api/media/dashboard", response_model=MediaDashboard)
async def media_dashboard() -> MediaDashboard:
    return STORE.dashboard()


@app.get("/api/media/stories", response_model=list[MediaStory])
async def list_media_stories(
    status: StoryStatus | None = Query(default=None),
) -> list[MediaStory]:
    return STORE.list(status=status)


@app.post("/api/media/stories", response_model=MediaStory, status_code=201)
async def create_media_story(request: CreateStoryRequest) -> MediaStory:
    return STORE.create(request)


@app.get("/api/media/stories/{story_id}", response_model=MediaStory)
async def get_media_story(story_id: str) -> MediaStory:
    try:
        return STORE.get(story_id)
    except MediaStoryNotFoundError as exc:
        raise HTTPException(status_code=404, detail="Story not found") from exc


@app.post("/api/media/stories/{story_id}/score/recompute", response_model=MediaStory)
async def recompute_story_score(story_id: str) -> MediaStory:
    try:
        return STORE.recompute_score(story_id)
    except MediaStoryNotFoundError as exc:
        raise HTTPException(status_code=404, detail="Story not found") from exc


@app.post("/api/media/stories/{story_id}/hooks/select", response_model=MediaStory)
async def select_story_hook(story_id: str, request: SelectHookRequest) -> MediaStory:
    try:
        return STORE.select_hook(story_id, request)
    except MediaStoryNotFoundError as exc:
        raise HTTPException(status_code=404, detail="Story not found") from exc
    except MediaWorkflowConflictError as exc:
        raise HTTPException(status_code=409, detail=str(exc)) from exc


@app.post("/api/media/stories/{story_id}/decision", response_model=MediaStory)
async def decide_story(story_id: str, request: DecisionRequest) -> MediaStory:
    try:
        return STORE.decide(story_id, request)
    except MediaStoryNotFoundError as exc:
        raise HTTPException(status_code=404, detail="Story not found") from exc
    except MediaWorkflowConflictError as exc:
        raise HTTPException(status_code=409, detail=str(exc)) from exc
