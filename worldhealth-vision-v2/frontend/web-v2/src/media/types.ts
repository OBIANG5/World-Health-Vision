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
  claim_indexes: number[];
};

export type CreativeScriptSegment = {
  text: string;
  claim_indexes: number[];
};

export type CreativeScenePlan = {
  order: number;
  purpose: string;
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
  claim_indexes: number[];
};

export type CreativePackage = {
  version: number;
  created_at: string;
  model: string;
  angle: string;
  angle_claim_indexes: number[];
  target_duration_sec: number;
  hooks: HookOption[];
  script_segments: CreativeScriptSegment[];
  caption: string;
  caption_claim_indexes: number[];
  hashtags: string[];
  scene_plan: CreativeScenePlan[];
};


export type MediaAsset = {
  id: string;
  provider: "wikimedia_commons";
  title: string;
  kind: "image" | "video";
  source_page_url: string;
  media_url: string;
  thumbnail_url?: string | null;
  mime_type?: string | null;
  width?: number | null;
  height?: number | null;
  size_bytes?: number | null;
  author?: string | null;
  license_name?: string | null;
  license_url?: string | null;
  attribution: string;
  rights_status: "approved" | "review_required" | "rejected";
  rights_note: string;
  query: string;
  discovered_at: string;
};

export type AssetSelection = {
  scene_order: number;
  asset_id: string;
  selection_score: number;
  selection_reason: string;
};

export type AssetBundle = {
  version: number;
  discovered_at: string;
  provider: "wikimedia_commons";
  assets: MediaAsset[];
  selections: AssetSelection[];
  unresolved_scene_orders: number[];
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
  asset_id?: string | null;
  asset_url?: string | null;
  asset_attribution?: string | null;
  asset_license?: string | null;
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


export type VoiceoverRef = {
  id: string;
  provider: "openai_realtime";
  model: string;
  voice: string;
  format: "wav";
  sample_rate_hz: 24000;
  duration_sec: number;
  generated_at: string;
  renderer_url: string;
  transcript: string;
  transcript_match_score: number;
  duration_fit: boolean;
  qa_passed: boolean;
  ai_generated_disclosure: string;
};

export type RenderProfile =
  | "canonical_newsroom_v1"
  | "tiktok_api_clean_v1";

export type RenderProbe = {
  format_name?: string | null;
  size_bytes: number;
  duration_sec: number;
  video_codec?: string | null;
  width: number;
  height: number;
  fps: number;
  pixel_format?: string | null;
  video_bit_rate?: number | null;
  has_audio: boolean;
  audio_codec?: string | null;
  audio_sample_rate_hz?: number | null;
  audio_channels?: number | null;
};

export type RenderJobRef = {
  id: string;
  story_id: string;
  render_profile: RenderProfile;
  status: "queued" | "bundling" | "rendering" | "completed" | "failed";
  progress: number;
  created_at: string;
  updated_at: string;
  output_url?: string | null;
  output_sha256?: string | null;
  output_probe?: RenderProbe | null;
  attempts?: number;
  max_attempts?: number;
  recovered_at?: string | null;
  error?: string | null;
};

export type ClaimVerification = {
  claim: string;
  status: "verified" | "unresolved" | "conflicting";
  supporting_urls: string[];
  contradicting_urls: string[];
  explanation: string;
};

export type VerificationReport = {
  version: number;
  checked_at: string;
  model: string;
  retrieved_urls: string[];
  claims: ClaimVerification[];
  distinct_supporting_sources: number;
  has_primary_support: boolean;
  verdict: VerificationStatus;
  confidence_score: number;
};

export type QaCheckName =
  | "facts"
  | "spelling"
  | "safe_zones"
  | "logo_integrity"
  | "source_display"
  | "rights"
  | "audio"
  | "render_integrity";

export type QaIssue = {
  check: QaCheckName;
  severity: "warning" | "error";
  message: string;
  original_text?: string | null;
  suggested_text?: string | null;
};

export type QaReport = {
  version: number;
  checked_at: string;
  language_model?: string | null;
  all_passed: boolean;
  issues: QaIssue[];
};

export type QaState = {
  facts: "pending" | "pass" | "fail";
  spelling: "pending" | "pass" | "fail";
  safe_zones: "pending" | "pass" | "fail";
  logo_integrity: "pending" | "pass" | "fail";
  source_display: "pending" | "pass" | "fail";
  rights: "pending" | "pass" | "fail";
  audio: "pending" | "pass" | "fail";
  render_integrity: "pending" | "pass" | "fail";
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
  verification_report?: VerificationReport | null;
  sources: MediaSource[];
  score: {
    total: number;
    factors: EditorialScoreFactors;
    reasons: string[];
    model_version: string;
  };
  hooks: HookOption[];
  selected_hook_id?: string | null;
  creative_package?: CreativePackage | null;
  script?: string | null;
  video_draft?: VideoDraft | null;
  voiceover?: VoiceoverRef | null;
  render_job?: RenderJobRef | null;
  target_duration_sec: number;
  assets: {
    photos: number;
    videos: number;
    official_documents: number;
    maps_or_charts: number;
  };
  asset_bundle?: AssetBundle | null;
  qa: QaState;
  qa_report?: QaReport | null;
  publication_package?: PublicationPackage | null;
  channel_exports: ChannelExportRef[];
  publication_receipts: PublicationReceipt[];
  approval_note?: string | null;
};

export type PublicationChannel =
  | "tiktok"
  | "whatsapp"
  | "instagram_reels"
  | "youtube_shorts"
  | "manual";

export type PublicationPackage = {
  version: number;
  created_at: string;
  story_id: string;
  target_channels: PublicationChannel[];
  video_url: string;
  title: string;
  caption: string;
  hashtags: string[];
  tiktok_caption: string;
  whatsapp_text: string;
  source_names: string[];
  source_urls: string[];
  ai_disclosure?: string | null;
  creative_version: number;
  qa_version: number;
  manifest_sha256: string;
};

export type ChannelExportRef = {
  channel: "tiktok";
  render_profile: "tiktok_api_clean_v1";
  canonical_manifest_sha256: string;
  render_job: RenderJobRef;
};

export type PublicationReceipt = {
  id: string;
  channel: PublicationChannel;
  published_at: string;
  public_url?: string | null;
  external_id?: string | null;
  note?: string | null;
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
  max_candidates: number;
  model: string;
  query: string;
  retrieved_urls: string[];
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
