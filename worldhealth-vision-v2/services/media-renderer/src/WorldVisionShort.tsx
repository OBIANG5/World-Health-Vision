import React from "react";
import {
  AbsoluteFill,
  Audio,
  Img,
  Sequence,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import type {VideoScene, WorldVisionRenderProps} from "./types";

const accents = {
  pink: "#ff006e",
  orange: "#ff7900",
  yellow: "#ffe600",
  white: "#f7f7f7",
  muted: "rgba(255,255,255,0.62)",
  line: "rgba(255,255,255,0.12)",
};

const safe = {
  left: 78,
  right: 230,
  top: 126,
  bottom: 330,
};

const fontSizeFor = (text: string, purpose: string) => {
  const length = text.replace(/\s+/g, " ").length;
  if (purpose === "hook") {
    if (length < 55) return 96;
    if (length < 90) return 78;
    return 66;
  }
  if (purpose === "source_and_brand") return 44;
  if (length < 90) return 72;
  if (length < 150) return 58;
  return 48;
};

const PreviewBackdrop: React.FC<{scene: VideoScene}> = ({scene}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const pulse = interpolate(frame, [0, 45], [0.35, 0.7], {
    extrapolateRight: "clamp",
  });

  const assetScale = interpolate(
    frame,
    [0, Math.max(1, Math.round(scene.duration_sec * fps))],
    [1.025, 1.095],
    {extrapolateRight: "clamp"},
  );

  return (
    <>
      {scene.asset_url && (
        <>
          <Img
            src={scene.asset_url}
            style={{
              position: "absolute",
              inset: 0,
              width: "100%",
              height: "100%",
              objectFit: "cover",
              filter: "brightness(.52) saturate(.92) contrast(1.04)",
              transform: `scale(${assetScale})`,
            }}
          />
          <AbsoluteFill
            style={{
              background:
                "linear-gradient(180deg,rgba(5,5,5,.22) 0%,rgba(5,5,5,.42) 48%,rgba(5,5,5,.86) 100%)",
            }}
          />
        </>
      )}
      <div
        style={{
          position: "absolute",
          width: 720,
          height: 720,
          borderRadius: "50%",
          right: -300,
          top: 220,
          background:
            "radial-gradient(circle, rgba(255,121,0,.24), rgba(255,0,110,.08) 48%, transparent 70%)",
          filter: "blur(10px)",
          opacity: pulse,
        }}
      />
      <div
        style={{
          position: "absolute",
          left: safe.left,
          right: safe.right,
          bottom: safe.bottom - 40,
          height: 1,
          background: accents.line,
        }}
      />
      {!scene.asset_url && scene.visual_kind !== "source_card" && (
        <div
          style={{
            position: "absolute",
            right: safe.right + 5,
            top: 330,
            width: 180,
            height: 180,
            borderRadius: 28,
            border: "1px solid rgba(255,255,255,.18)",
            background: "rgba(255,255,255,.025)",
            display: "grid",
            placeItems: "center",
            color: accents.muted,
            fontSize: 18,
            textTransform: "uppercase",
            letterSpacing: 2,
            textAlign: "center",
            padding: 20,
          }}
        >
          {scene.visual_kind.replace("_", " ")}
        </div>
      )}
    </>
  );
};

const SceneView: React.FC<{
  scene: VideoScene;
  brand: WorldVisionRenderProps["brand"];
  story: WorldVisionRenderProps["story"];
}> = ({scene, brand, story}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const entrance = spring({
    frame,
    fps,
    config: {damping: 18, stiffness: 125, mass: 0.8},
  });
  const y = interpolate(entrance, [0, 1], [70, 0]);
  const opacity = interpolate(entrance, [0, 1], [0, 1]);
  const titleSize = fontSizeFor(scene.on_screen_text, scene.purpose);

  const isSource = scene.visual_kind === "source_card";

  return (
    <AbsoluteFill style={{backgroundColor: "#050505", overflow: "hidden"}}>
      <PreviewBackdrop scene={scene} />

      <div
        style={{
          position: "absolute",
          left: safe.left,
          top: 68,
          display: "flex",
          alignItems: "baseline",
          gap: 18,
        }}
      >
        <span
          style={{
            fontSize: 30,
            fontWeight: 900,
            letterSpacing: 3,
            color: accents.white,
          }}
        >
          {brand.name}
        </span>
        <span style={{fontSize: 18, color: accents.muted}}>
          {brand.tagline}
        </span>
      </div>

      <div
        style={{
          position: "absolute",
          left: safe.left,
          top: safe.top + 70,
          right: safe.right,
          bottom: safe.bottom,
          display: "flex",
          flexDirection: "column",
          justifyContent: isSource ? "center" : "flex-start",
          transform: `translateY(${y}px)`,
          opacity,
        }}
      >
        <div
          style={{
            fontSize: 20,
            letterSpacing: 4,
            textTransform: "uppercase",
            fontWeight: 800,
            marginBottom: 32,
            background: "linear-gradient(90deg,#ff006e,#ff7900,#ffe600)",
            WebkitBackgroundClip: "text",
            color: "transparent",
          }}
        >
          {story.country_name || "MONDE"} · {story.category || "ACTUALITÉ"}
        </div>

        <div
          style={{
            whiteSpace: "pre-wrap",
            fontSize: titleSize,
            lineHeight: 0.98,
            letterSpacing: -2.4,
            fontWeight: 950,
            color: accents.white,
            maxWidth: 760,
          }}
        >
          {scene.on_screen_text}
        </div>

        {!isSource && !scene.asset_url && scene.asset_query && (
          <div
            style={{
              marginTop: 42,
              maxWidth: 620,
              fontSize: 20,
              lineHeight: 1.4,
              color: accents.muted,
            }}
          >
            Média réel non résolu : {scene.asset_query}
          </div>
        )}
      </div>

      {scene.asset_url && scene.asset_attribution && (
        <div
          style={{
            position: "absolute",
            left: safe.left,
            right: safe.right,
            bottom: 410,
            fontSize: 15,
            lineHeight: 1.35,
            color: "rgba(255,255,255,.72)",
            textShadow: "0 2px 10px rgba(0,0,0,.9)",
          }}
        >
          Média : {scene.asset_attribution}
          {scene.asset_license ? ` · ${scene.asset_license}` : ""}
        </div>
      )}

      <div
        style={{
          position: "absolute",
          left: safe.left,
          bottom: 350,
          display: "flex",
          alignItems: "center",
          gap: 14,
          color: accents.muted,
          fontSize: 18,
        }}
      >
        <span
          style={{
            width: 54,
            height: 5,
            borderRadius: 10,
            background: "linear-gradient(90deg,#ff006e,#ff7900,#ffe600)",
          }}
        />
        DRAFT · {scene.purpose.toUpperCase()}
      </div>
    </AbsoluteFill>
  );
};

export const WorldVisionShort: React.FC<WorldVisionRenderProps> = ({
  draft,
  voiceover,
  story,
  brand,
}) => {
  return (
    <AbsoluteFill style={{backgroundColor: "#050505"}}>
      {voiceover?.renderer_url && (
        <Audio src={voiceover.renderer_url} />
      )}

      {draft.scenes.map((scene) => (
        <Sequence
          key={scene.id}
          from={Math.round(scene.start_sec * draft.fps)}
          durationInFrames={Math.max(1, Math.round(scene.duration_sec * draft.fps))}
          name={scene.id}
        >
          <SceneView scene={scene} brand={brand} story={story} />
        </Sequence>
      ))}

      {voiceover && (
        <div
          style={{
            position: "absolute",
            right: 238,
            bottom: 206,
            zIndex: 30,
            padding: "7px 10px",
            borderRadius: 999,
            border: "1px solid rgba(255,255,255,.16)",
            background: "rgba(5,5,5,.62)",
            color: "rgba(255,255,255,.64)",
            fontSize: 13,
            fontWeight: 800,
            letterSpacing: 1.1,
            textTransform: "uppercase",
          }}
        >
          {voiceover.ai_generated_disclosure}
        </div>
      )}
    </AbsoluteFill>
  );
};
