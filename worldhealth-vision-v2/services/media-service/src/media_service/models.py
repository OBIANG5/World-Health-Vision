from __future__ import annotations

from datetime import datetime, timezone
from typing import Literal

from pydantic import BaseModel, Field


StoryStatus = Literal[
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
    "published",
    "rejected",
]

VerificationStatus = Literal[
    "unverified",
    "partially_verified",
    "verified",
    "conflicting",
]

SourceType = Literal[
    "institution",
    "press_agency",
    "media",
    "social",
    "research",
    "other",
]

SourceScope = Literal["local", "regional", "international"]


class MediaSource(BaseModel):
    id: str
    name: str
    url: str
    source_type: SourceType
    scope: SourceScope
    country_iso3: str | None = None
    is_primary: bool = False
    published_at: datetime | None = None
    note: str | None = None
    rights_note: str | None = None


class EditorialScoreFactors(BaseModel):
    freshness: int = Field(ge=0, le=100)
    surprise: int = Field(ge=0, le=100)
    human_impact: int = Field(ge=0, le=100)
    importance: int = Field(ge=0, le=100)
    visual_potential: int = Field(ge=0, le=100)
    numerical_strength: int = Field(ge=0, le=100)
    undercoverage: int = Field(ge=0, le=100)
    francophone_relevance: int = Field(ge=0, le=100)
    africa_relevance: int = Field(ge=0, le=100)
    source_confidence: int = Field(ge=0, le=100)
    urgency: int = Field(ge=0, le=100)
    saturation_penalty: int = Field(ge=0, le=100, default=0)


class EditorialScore(BaseModel):
    total: int = Field(ge=0, le=100)
    factors: EditorialScoreFactors
    reasons: list[str] = Field(default_factory=list)
    model_version: str = "wv-editorial-v0.1"


class HookOption(BaseModel):
    id: str
    text: str
    score: int = Field(ge=0, le=100)
    rationale: str
    claim_indexes: list[int] = Field(default_factory=list)


class AssetInventory(BaseModel):
    photos: int = Field(default=0, ge=0)
    videos: int = Field(default=0, ge=0)
    official_documents: int = Field(default=0, ge=0)
    maps_or_charts: int = Field(default=0, ge=0)


AssetRightsStatus = Literal["approved", "review_required", "rejected"]
AssetKind = Literal["image", "video"]


class MediaAsset(BaseModel):
    id: str
    provider: Literal["wikimedia_commons"]
    title: str
    kind: AssetKind
    source_page_url: str
    media_url: str
    thumbnail_url: str | None = None
    mime_type: str | None = None
    author: str | None = None
    license_name: str | None = None
    license_url: str | None = None
    attribution: str
    rights_status: AssetRightsStatus
    rights_note: str
    query: str
    discovered_at: datetime


class AssetSelection(BaseModel):
    scene_order: int = Field(ge=1)
    asset_id: str


class AssetBundle(BaseModel):
    version: int = Field(ge=1)
    discovered_at: datetime
    provider: Literal["wikimedia_commons"] = "wikimedia_commons"
    assets: list[MediaAsset] = Field(default_factory=list)
    selections: list[AssetSelection] = Field(default_factory=list)
    unresolved_scene_orders: list[int] = Field(default_factory=list)


class DiscoverAssetsRequest(BaseModel):
    limit_per_scene: int = Field(default=4, ge=1, le=8)


class SelectAssetRequest(BaseModel):
    scene_order: int = Field(ge=1)
    asset_id: str


class QaState(BaseModel):
    facts: Literal["pending", "pass", "fail"] = "pending"
    spelling: Literal["pending", "pass", "fail"] = "pending"
    safe_zones: Literal["pending", "pass", "fail"] = "pending"
    logo_integrity: Literal["pending", "pass", "fail"] = "pending"
    source_display: Literal["pending", "pass", "fail"] = "pending"
    rights: Literal["pending", "pass", "fail"] = "pending"
    audio: Literal["pending", "pass", "fail"] = "pending"
    notes: list[str] = Field(default_factory=list)


ClaimVerificationStatus = Literal["verified", "unresolved", "conflicting"]


class ClaimVerification(BaseModel):
    claim: str
    status: ClaimVerificationStatus
    supporting_urls: list[str] = Field(default_factory=list)
    contradicting_urls: list[str] = Field(default_factory=list)
    explanation: str


class VerificationReport(BaseModel):
    version: int = Field(ge=1)
    checked_at: datetime
    model: str
    retrieved_urls: list[str] = Field(default_factory=list)
    claims: list[ClaimVerification] = Field(default_factory=list)
    distinct_supporting_sources: int = 0
    has_primary_support: bool = False
    verdict: VerificationStatus
    confidence_score: int = Field(ge=0, le=100)


class VerifyStoryRequest(BaseModel):
    max_claims: int = Field(default=6, ge=1, le=10)


VisualKind = Literal[
    "real_photo",
    "real_video",
    "map",
    "chart",
    "document",
    "typography",
    "source_card",
]


class CreativeScriptSegment(BaseModel):
    text: str
    claim_indexes: list[int] = Field(default_factory=list)


class CreativeScenePlan(BaseModel):
    order: int = Field(ge=1)
    purpose: str
    on_screen_text: str
    visual_kind: VisualKind
    asset_query: str | None = None
    claim_indexes: list[int] = Field(default_factory=list)


class CreativePackage(BaseModel):
    version: int = Field(ge=1)
    created_at: datetime
    model: str
    angle: str
    angle_claim_indexes: list[int] = Field(default_factory=list)
    target_duration_sec: int = Field(ge=5, le=60)
    hooks: list[HookOption] = Field(min_length=1, max_length=3)
    script_segments: list[CreativeScriptSegment] = Field(min_length=1)
    caption: str
    caption_claim_indexes: list[int] = Field(default_factory=list)
    hashtags: list[str] = Field(default_factory=list, max_length=12)
    scene_plan: list[CreativeScenePlan] = Field(min_length=2)


class GenerateCreativeRequest(BaseModel):
    target_duration_sec: int = Field(default=15, ge=8, le=45)
    max_hooks: int = Field(default=3, ge=1, le=3)


class VideoScene(BaseModel):
    id: str
    order: int = Field(ge=1)
    start_sec: float = Field(ge=0)
    duration_sec: float = Field(gt=0)
    purpose: str
    narration: str | None = None
    on_screen_text: str
    visual_kind: VisualKind
    asset_query: str | None = None
    source_ids: list[str] = Field(default_factory=list)
    asset_id: str | None = None
    asset_url: str | None = None
    asset_attribution: str | None = None
    asset_license: str | None = None


class VideoDraft(BaseModel):
    version: int = Field(ge=1)
    created_at: datetime
    format: Literal["9:16"] = "9:16"
    width: Literal[1080] = 1080
    height: Literal[1920] = 1920
    fps: Literal[30] = 30
    duration_sec: float = Field(ge=5, le=60)
    rendering_engine: Literal["remotion"] = "remotion"
    design_system_id: str = "wv-pilot-editorial-dark-v1"
    audio_url: str | None = None
    audio_disclosure: str | None = None
    safe_zone_profile: str = "tiktok-conservative-v1"
    hook_id: str
    voiceover_script: str
    source_line: str
    scenes: list[VideoScene] = Field(min_length=2)


RenderJobStatus = Literal["queued", "bundling", "rendering", "completed", "failed"]


class RenderJobRef(BaseModel):
    id: str
    story_id: str
    status: RenderJobStatus
    progress: float = Field(ge=0, le=1)
    created_at: datetime
    updated_at: datetime
    output_url: str | None = None
    error: str | None = None


class AudioTrack(BaseModel):
    version: int = Field(ge=1)
    created_at: datetime
    model: str
    voice: str
    ai_generated: Literal[True] = True
    format: Literal["wav"] = "wav"
    sample_rate_hz: Literal[24000] = 24000
    duration_sec: float = Field(gt=0)
    storage_url: str
    transcript: str


class GenerateAudioRequest(BaseModel):
    voice: str | None = None


class MediaStory(BaseModel):
    id: str
    slug: str
    status: StoryStatus
    title: str
    summary: str
    category: str
    language: str = "fr"
    country_iso3: str | None = None
    country_name: str | None = None
    region: str | None = None
    breaking: bool = False
    detected_at: datetime
    event_at: datetime | None = None
    updated_at: datetime
    verification_status: VerificationStatus = "unverified"
    confidence_score: int = Field(ge=0, le=100, default=0)
    verification_report: VerificationReport | None = None
    sources: list[MediaSource] = Field(default_factory=list)
    score: EditorialScore
    hooks: list[HookOption] = Field(default_factory=list)
    selected_hook_id: str | None = None
    creative_package: CreativePackage | None = None
    script: str | None = None
    video_draft: VideoDraft | None = None
    audio_track: AudioTrack | None = None
    render_job: RenderJobRef | None = None
    target_duration_sec: int = Field(ge=5, le=60, default=15)
    assets: AssetInventory = Field(default_factory=AssetInventory)
    asset_bundle: AssetBundle | None = None
    qa: QaState = Field(default_factory=QaState)
    approval_note: str | None = None
    radar_scan_id: str | None = None
    radar_fingerprint: str | None = None


class MediaDashboard(BaseModel):
    total: int
    detected: int
    verifying: int
    candidates: int
    in_production: int
    preview_ready: int
    publish_ready: int
    published: int
    rejected: int
    top_score: int


class DecisionRequest(BaseModel):
    action: Literal[
        "approve",
        "reject",
        "request_changes",
        "approve_preview",
        "mark_publish_ready",
    ]
    note: str | None = None


class SelectHookRequest(BaseModel):
    hook_id: str


class CreateStoryRequest(BaseModel):
    title: str = Field(min_length=5, max_length=240)
    summary: str = Field(min_length=10, max_length=2000)
    category: str = Field(min_length=2, max_length=80)
    language: str = "fr"
    country_iso3: str | None = Field(default=None, min_length=3, max_length=3)
    country_name: str | None = None
    region: str | None = None
    breaking: bool = False
    detected_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    event_at: datetime | None = None
    verification_status: VerificationStatus = "unverified"
    confidence_score: int = Field(default=0, ge=0, le=100)
    sources: list[MediaSource] = Field(default_factory=list)
    factors: EditorialScoreFactors
    hooks: list[HookOption] = Field(default_factory=list)
    target_duration_sec: int = Field(default=15, ge=5, le=60)
    assets: AssetInventory = Field(default_factory=AssetInventory)


class PrepareDraftRequest(BaseModel):
    script_override: str | None = Field(default=None, min_length=10, max_length=1200)


class RadarSourceCandidate(BaseModel):
    name: str
    url: str
    source_type: SourceType
    scope: SourceScope
    country_iso3: str | None = None
    is_primary: bool
    published_at: datetime | None = None
    note: str
    rights_note: str | None = None


class RadarHookCandidate(BaseModel):
    text: str
    score: int = Field(ge=0, le=100)
    rationale: str


class RadarCandidate(BaseModel):
    title: str
    summary: str
    category: str
    country_iso3: str | None = None
    country_name: str | None = None
    region: str | None = None
    breaking: bool
    event_at: datetime | None = None
    confidence_score: int = Field(ge=0, le=100)
    sources: list[RadarSourceCandidate]
    factors: EditorialScoreFactors
    hooks: list[RadarHookCandidate]


class RadarScanRequest(BaseModel):
    hours: int = Field(default=6, ge=1, le=48)
    country_iso3: str | None = Field(default=None, min_length=3, max_length=3)
    max_candidates: int = Field(default=12, ge=1, le=30)


class RadarScanResult(BaseModel):
    scan_id: str
    query: str
    model: str
    retrieved_urls: list[str]
    candidates_found: int
    candidates_accepted: int
    candidates_rejected_without_retrieved_source: int
    stories_created: list[str]
    stories_deduplicated: list[str]


class RadarScanHistoryItem(BaseModel):
    scan_id: str
    requested_at: datetime
    hours: int = Field(ge=1, le=48)
    country_iso3: str | None = None
    max_candidates: int = Field(ge=1, le=30)
    model: str
    query: str
    retrieved_urls: list[str]
    candidates_found: int
    candidates_accepted: int
    candidates_rejected_without_retrieved_source: int
    stories_created: list[str]
    stories_deduplicated: list[str]


class RadarSchedulerStatus(BaseModel):
    enabled: bool
    interval_seconds: int
    scan_hours: int
    max_candidates: int
    redis_connected: bool
    lock_held: bool
    heartbeat_at: datetime | None = None
    last_run_at: datetime | None = None
    last_run_status: str | None = None
    last_scan_id: str | None = None
    last_error: str | None = None
