from __future__ import annotations

from datetime import datetime
from typing import List, Literal, Optional

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
    country_iso3: Optional[str] = None
    is_primary: bool = False
    published_at: Optional[datetime] = None
    note: Optional[str] = None
    rights_note: Optional[str] = None


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
    reasons: List[str] = Field(default_factory=list)
    model_version: str = "wv-editorial-v0.1"


class HookOption(BaseModel):
    id: str
    text: str
    score: int = Field(ge=0, le=100)
    rationale: str


class AssetInventory(BaseModel):
    photos: int = 0
    videos: int = 0
    official_documents: int = 0
    maps_or_charts: int = 0


class QaState(BaseModel):
    facts: Literal["pending", "pass", "fail"] = "pending"
    spelling: Literal["pending", "pass", "fail"] = "pending"
    safe_zones: Literal["pending", "pass", "fail"] = "pending"
    logo_integrity: Literal["pending", "pass", "fail"] = "pending"
    source_display: Literal["pending", "pass", "fail"] = "pending"
    rights: Literal["pending", "pass", "fail"] = "pending"
    audio: Literal["pending", "pass", "fail"] = "pending"
    notes: List[str] = Field(default_factory=list)


class MediaStory(BaseModel):
    id: str
    slug: str
    status: StoryStatus
    title: str
    summary: str
    category: str
    language: str = "fr"
    country_iso3: Optional[str] = None
    country_name: Optional[str] = None
    region: Optional[str] = None
    breaking: bool = False
    detected_at: datetime
    event_at: Optional[datetime] = None
    updated_at: datetime
    verification_status: VerificationStatus = "unverified"
    confidence_score: int = Field(ge=0, le=100, default=0)
    sources: List[MediaSource] = Field(default_factory=list)
    score: EditorialScore
    hooks: List[HookOption] = Field(default_factory=list)
    selected_hook_id: Optional[str] = None
    script: Optional[str] = None
    target_duration_sec: int = Field(ge=5, le=60, default=15)
    assets: AssetInventory = Field(default_factory=AssetInventory)
    qa: QaState = Field(default_factory=QaState)
    approval_note: Optional[str] = None


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
    action: Literal["approve", "reject", "request_changes", "mark_publish_ready"]
    note: Optional[str] = None


class SelectHookRequest(BaseModel):
    hook_id: str
