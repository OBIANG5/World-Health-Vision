import React from "react";
import {Composition} from "remotion";
import {WorldVisionShort} from "./WorldVisionShort";
import {WorldVisionSummit2026,SUMMIT_FRAMES,SUMMIT_FPS} from "./WorldVisionSummit2026";
import type {WorldVisionRenderProps} from "./types";
import {CreativeEdit, creativeDuration} from "./CreativeEdit";
import type {CreativeEditProps} from "./CreativeEdit";

const defaultProps: WorldVisionRenderProps = {
  render_profile: "canonical_newsroom_v1",
  voiceover: null,
  draft: {
    version: 1,
    created_at: "2026-11-12T00:00:00Z",
    format: "9:16",
    width: 1080,
    height: 1920,
    fps: 30,
    duration_sec: 15,
    rendering_engine: "remotion",
    safe_zone_profile: "tiktok-conservative-v1",
    hook_id: "sample-hook",
    voiceover_script: "World-Vision transforme une actualité vérifiée en vidéo courte.",
    source_line: "Sources : World-Vision",
    scenes: [
      {
        id: "scene-hook",
        order: 1,
        start_sec: 0,
        duration_sec: 5,
        purpose: "hook",
        narration: "World-Vision transforme une actualité vérifiée en vidéo courte.",
        on_screen_text: "UNE INFORMATION.\nUN HOOK.\nUNE VIDÉO.",
        visual_kind: "typography",
        source_ids: []
      },
      {
        id: "scene-context",
        order: 2,
        start_sec: 5,
        duration_sec: 7,
        purpose: "explain",
        narration: null,
        on_screen_text: "Le contexte essentiel, sans surcharge.",
        visual_kind: "chart",
        source_ids: []
      },
      {
        id: "scene-source",
        order: 3,
        start_sec: 12,
        duration_sec: 3,
        purpose: "source_and_brand",
        narration: null,
        on_screen_text: "Sources : World-Vision",
        visual_kind: "source_card",
        source_ids: []
      }
    ]
  },
  story: {
    id: "sample",
    title: "World-Vision Media Studio",
    country_name: "Monde",
    category: "actualité"
  },
  brand: {
    name: "WORLD-VISION",
    tagline: "Voir le monde, le comprendre."
  }
};

const defaultCreativeProps: CreativeEditProps = {
  version: 1,
  title: "DÉMONSTRATION TECHNIQUE — aucun fait d'actualité",
  script: "Texte fourni par l'utilisateur, jamais écrit par le moteur vidéo.",
  visualStyle: {background:"#0c1822", ink:"#f8fafb", accent:"#8ebcce"},
  shots: [
    {id:"demo-opening",durationFrames:90,template:"kinetic",
      eyebrow:"WORLD-VISION / ESSAI TECHNIQUE", title:"RACONTER.\nMONTRER.\nCOMPRENDRE.",
      subtitle:"Une composition créée à partir de tes propres matériaux.",
      motion:"locked",transitionAfter:"dissolve",transitionFrames:8},
    {id:"demo-end",durationFrames:96,template:"number",
      eyebrow:"ATELIER DE MONTAGE",title:"01",subtitle:"Un plan soigné à la fois.",
      footnote:"Aucune image d'actualité simulée.",motion:"locked"}
  ],
  narration: null,
  soundtrack: null,
  brandOutro: null,
};

export const RemotionRoot: React.FC = () => {
  return (
    <>
    <Composition
      id="WorldVisionSummit2026"
      component={WorldVisionSummit2026}
      width={1080}
      height={1920}
      fps={SUMMIT_FPS}
      durationInFrames={SUMMIT_FRAMES}
      defaultProps={{voiceFilename:null}}
    />
    <Composition
      id="WorldVisionCreativeEdit"
      component={CreativeEdit}
      width={1080}
      height={1920}
      fps={30}
      durationInFrames={creativeDuration(defaultCreativeProps)}
      defaultProps={defaultCreativeProps}
      calculateMetadata={({props})=>({durationInFrames:creativeDuration(props)})}
    />
    <Composition
      id="WorldVisionShort"
      component={WorldVisionShort}
      width={1080}
      height={1920}
      fps={30}
      durationInFrames={450}
      defaultProps={defaultProps}
      calculateMetadata={({props}) => ({
        width: props.draft.width,
        height: props.draft.height,
        fps: props.draft.fps,
        durationInFrames: Math.max(
          1,
          Math.ceil(props.draft.duration_sec * props.draft.fps),
        ),
      })}
    />
    </>
  );
};
