export type VisualKind =
  | "real_photo"
  | "real_video"
  | "map"
  | "chart"
  | "document"
  | "typography"
  | "source_card";

export type VideoScene = {
  id: string;
  order: number;
  start_sec: number;
  duration_sec: number;
  purpose: string;
  narration?: string | null;
  on_screen_text: string;
  visual_kind: VisualKind;
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
  safe_zone_profile: string;
  hook_id: string;
  voiceover_script: string;
  source_line: string;
  scenes: VideoScene[];
};

export type WorldVisionRenderProps = {
  draft: VideoDraft;
  story: {
    id: string;
    title: string;
    country_name?: string | null;
    category?: string | null;
  };
  brand: {
    name: string;
    tagline: string;
  };
};
