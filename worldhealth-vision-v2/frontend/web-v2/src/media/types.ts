export type StoryStatus =
  | "detected"
  | "verifying"
  | "candidate"
  | "approved"
  | "scripting"
  | "assets"
  | "rendering"
  | "qa"
  | "preview_ready"
  | "changes_requested"
  | "publish_ready"
  | "published"
  | "rejected";

export type VerificationStatus =
  | "unverified"
  | "partially_verified"
  | "verified"
  | "conflicting";

export type EditorialScoreFactors = {
  freshness: number;
  surprise: number;
  human_impact: number;
  importance: number;
  visual_potential: number;
  numerical_strength: number;
  undercoverage: number;
  francophone_relevance: number;
  africa_relevance: number;
  source_confidence: number;
  urgency: number;
  saturation_penalty: number;
};

export type MediaSource = {
  id: string;
  name: string;
  url: string;
  source_type: "institution" | "press_agency" | "media" | "social" | "research" | "other";
  scope: "local" | "regional" | "international";
  country_iso3?: string | null;
  is_primary: boolean;
  published_at?: string | null;
  note?: string | null;
  rights_note?: string | null;
};

export type HookOption = {
  id: string;
  text: string;
  score: number;
  rationale: string;
};


export type VideoScene = {
  id: string;
  order: number;
  start_sec: number;
  duration_sec: number;
  purpose: string;
  narration?: string | null;
  on_screen_text: string;
  visual_kind:
    | "real_photo"
    | "real_video"
    | "map"
    | "chart"
    | "document"
    | "typography"
    | "source_card";
  asset_query?: string | null;
  source_ids: string[];
};

export type VideoDraft = {
  version: number;
  created_at: string;
  format: "9:16";
  width: 1080;
  height: 1920;
  fps: 30;
  duration_sec: number;
  rendering_engine: "remotion";
  design_system_id: string;
  safe_zone_profile: string;
  hook_id: string;
  voiceover_script: string;
  source_line: string;
  scenes: VideoScene[];
};


export type RenderJobRef = {
  id: string;
  story_id: string;
  status: "queued" | "bundling" | "rendering" | "completed" | "failed";
  progress: number;
  created_at: string;
  updated_at: string;
  output_url?: string | null;
  error?: string | null;
};

export type QaState = {
  facts: "pending" | "pass" | "fail";
  spelling: "pending" | "pass" | "fail";
  safe_zones: "pending" | "pass" | "fail";
  logo_integrity: "pending" | "pass" | "fail";
  source_display: "pending" | "pass" | "fail";
  rights: "pending" | "pass" | "fail";
  audio: "pending" | "pass" | "fail";
  notes: string[];
};

export type MediaStory = {
  id: string;
  slug: string;
  status: StoryStatus;
  title: string;
  summary: string;
  category: string;
  language: string;
  country_iso3?: string | null;
  country_name?: string | null;
  region?: string | null;
  breaking: boolean;
  detected_at: string;
  event_at?: string | null;
  updated_at: string;
  verification_status: VerificationStatus;
  confidence_score: number;
  sources: MediaSource[];
  score: {
    total: number;
    factors: EditorialScoreFactors;
    reasons: string[];
    model_version: string;
  };
  hooks: HookOption[];
  selected_hook_id?: string | null;
  script?: string | null;
  video_draft?: VideoDraft | null;
  render_job?: RenderJobRef | null;
  target_duration_sec: number;
  assets: {
    photos: number;
    videos: number;
    official_documents: number;
    maps_or_charts: number;
  };
  qa: QaState;
  approval_note?: string | null;
};

export type MediaDashboard = {
  total: number;
  detected: number;
  verifying: number;
  candidates: number;
  in_production: number;
  preview_ready: number;
  publish_ready: number;
  published: number;
  rejected: number;
  top_score: number;
};


export type RadarScanResult = {
  scan_id: string;
  query: string;
  model: string;
  retrieved_urls: string[];
  candidates_found: number;
  candidates_accepted: number;
  candidates_rejected_without_retrieved_source: number;
  stories_created: string[];
  stories_deduplicated: string[];
};


export type RadarScanHistoryItem = {
  scan_id: string;
  requested_at: string;
  hours: number;
  country_iso3?: string | null;
  model: string;
  candidates_found: number;
  candidates_accepted: number;
  candidates_rejected_without_retrieved_source: number;
  stories_created: string[];
  stories_deduplicated: string[];
};

export type RadarSchedulerStatus = {
  enabled: boolean;
  interval_seconds: number;
  scan_hours: number;
  max_candidates: number;
  redis_connected: boolean;
  lock_held: boolean;
  heartbeat_at?: string | null;
  last_run_at?: string | null;
  last_run_status?: string | null;
  last_scan_id?: string | null;
  last_error?: string | null;
};
