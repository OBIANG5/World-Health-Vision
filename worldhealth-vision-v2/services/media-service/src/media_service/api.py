from fastapi import FastAPI, HTTPException, Query
from fastapi.responses import Response
from prometheus_client import CONTENT_TYPE_LATEST, generate_latest

from media_service.models import (
    CreateStoryRequest,
    DecisionRequest,
    MediaDashboard,
    MediaStory,
    PrepareDraftRequest,
    RadarScanHistoryItem,
    RadarScanRequest,
    RadarScanResult,
    SelectHookRequest,
    StoryStatus,
)
from media_service.radar import (
    RADAR_CLIENT,
    RadarConfigurationError,
    RadarProviderError,
)
from media_service.radar_workflow import execute_radar_scan
from media_service.renderer_client import RENDERER_CLIENT, RendererDependencyError
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


@app.post("/api/media/radar/scans", response_model=RadarScanResult)
async def run_radar_scan(request: RadarScanRequest) -> RadarScanResult:
    try:
        return await execute_radar_scan(
            request,
            radar_client=RADAR_CLIENT,
            store=STORE,
        )
    except RadarConfigurationError as exc:
        raise HTTPException(status_code=503, detail=str(exc)) from exc
    except RadarProviderError as exc:
        raise HTTPException(status_code=502, detail=str(exc)) from exc


@app.get("/api/media/radar/scans", response_model=list[RadarScanHistoryItem])
async def list_radar_scan_history(
    limit: int = Query(default=20, ge=1, le=100),
) -> list[RadarScanHistoryItem]:
    return STORE.list_radar_scans(limit=limit)


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


@app.post("/api/media/stories/{story_id}/draft/prepare", response_model=MediaStory)
async def prepare_story_draft(story_id: str, request: PrepareDraftRequest) -> MediaStory:
    try:
        return STORE.prepare_draft(story_id, request)
    except MediaStoryNotFoundError as exc:
        raise HTTPException(status_code=404, detail="Story not found") from exc
    except MediaWorkflowConflictError as exc:
        raise HTTPException(status_code=409, detail=str(exc)) from exc


@app.post("/api/media/stories/{story_id}/render-preview", response_model=MediaStory)
async def launch_preview_render(story_id: str) -> MediaStory:
    try:
        story = STORE.get(story_id)
        if story.video_draft is None:
            raise MediaWorkflowConflictError("Prepare a video draft before rendering.")
        if story.status not in {"scripting", "assets", "rendering"}:
            raise MediaWorkflowConflictError(
                f"Render cannot start from status '{story.status}'."
            )
        render_job = await RENDERER_CLIENT.create_job(story)
        return STORE.attach_render_job(story_id, render_job)
    except MediaStoryNotFoundError as exc:
        raise HTTPException(status_code=404, detail="Story not found") from exc
    except MediaWorkflowConflictError as exc:
        raise HTTPException(status_code=409, detail=str(exc)) from exc
    except RendererDependencyError as exc:
        raise HTTPException(status_code=502, detail=str(exc)) from exc


@app.post("/api/media/stories/{story_id}/render-preview/sync", response_model=MediaStory)
async def sync_preview_render(story_id: str) -> MediaStory:
    try:
        story = STORE.get(story_id)
        if story.render_job is None:
            raise MediaWorkflowConflictError("Story has no render job.")
        render_job = await RENDERER_CLIENT.get_job(story.render_job.id)
        return STORE.sync_render_job(story_id, render_job)
    except MediaStoryNotFoundError as exc:
        raise HTTPException(status_code=404, detail="Story not found") from exc
    except MediaWorkflowConflictError as exc:
        raise HTTPException(status_code=409, detail=str(exc)) from exc
    except RendererDependencyError as exc:
        raise HTTPException(status_code=502, detail=str(exc)) from exc


@app.post("/api/media/stories/{story_id}/decision", response_model=MediaStory)
async def decide_story(story_id: str, request: DecisionRequest) -> MediaStory:
    try:
        return STORE.decide(story_id, request)
    except MediaStoryNotFoundError as exc:
        raise HTTPException(status_code=404, detail="Story not found") from exc
    except MediaWorkflowConflictError as exc:
        raise HTTPException(status_code=409, detail=str(exc)) from exc
