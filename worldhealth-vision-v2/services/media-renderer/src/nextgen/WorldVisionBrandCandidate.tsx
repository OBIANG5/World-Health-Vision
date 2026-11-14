import React from "react";
import {
  AbsoluteFill, Img, Easing, interpolate, spring,
  staticFile, useCurrentFrame, useVideoConfig,
} from "remotion";

/**
 * World-Vision original G0 eye — same blue eye, same actual continents.
 * Pixel-extracted from official public/brand/world-vision-official.png.
 * Never redraw it using SVG or any generated representation.
 * This composition is a future, silent outro CANDIDATE, not a replacement
 * for the already published Shenzhen film.
 */
const C = {
  navy: "#072D4F",
  ocean: "#147EAC",
  white: "#FAFCFE",
  secondary: "#E1F5FB",
};
const originalTransparentEye = staticFile("brand/world-vision-eye-original-transparent.png");
const fontText = staticFile("fonts/DMSans-variable.ttf");
const fonts = [
  "@font-face {font-family: 'WV-DM'; src:url('" + fontText + "') format('truetype'); font-weight:100 1000;}",
].join("\n");

/** Exact G0 eye artwork. Sizing and motion only, never drawing new paths. */
export const OriginalG0Eye: React.FC<{width?: number}> = ({width = 590}) => {
  const f = useCurrentFrame();
  const pulse = interpolate(f, [0, 25, 60, 89], [0.96, 1, 1.012, 1],
    {extrapolateLeft: "clamp", extrapolateRight: "clamp",
     easing: Easing.inOut(Easing.quad)});
  const opacity = interpolate(f, [0, 19], [0, 1],
    {extrapolateLeft: "clamp", extrapolateRight: "clamp"});
  return (
    <Img src={originalTransparentEye}
      style={{
        display: "block",
        width,
        height: "auto",
        objectFit: "contain",
        opacity,
        transform: "scale(" + pulse.toFixed(4) + ")",
        filter: "drop-shadow(0 15px 18px rgba(0,35,65,.10))",
      }}/>
  );
};

/**
 * Navy/blue GLOBAL background (never a small off-white block underneath the
 * logo). The eye is source-exact, including its earth and contour colors.
 * The wordmark is typeset separately. No logo source text has been altered.
 */
export const WorldVisionBrandOutroCandidate: React.FC = () => {
  const f = useCurrentFrame();
  const {fps} = useVideoConfig();
  const arrival = spring({
    fps, frame: f, config: {damping: 200, mass: .70, stiffness: 90},
  });
  const textOpacity = interpolate(f, [14, 35], [0, 1],
    {extrapolateLeft: "clamp", extrapolateRight: "clamp"});
  return (
    <AbsoluteFill style={{
      background: "linear-gradient(165deg, #4BA2C8 0%, #238AAF 47%, #0C507E 100%)",
      overflow: "hidden", color: C.white, alignItems: "center",
      justifyContent: "center",
    }}>
      <style>{fonts}</style>
      <AbsoluteFill style={{
        background:
          "radial-gradient(ellipse 710px 560px at 50% 43%,rgba(230,249,255,.20),transparent 75%)",
      }}/>
      <div style={{
        width: "100%", display: "flex", flexDirection: "column",
        alignItems: "center", justifyContent: "center",
        transform: "translateY(" + ((1-arrival)*22).toFixed(2) + "px)",
      }}>
        <OriginalG0Eye width={600}/>
        <div style={{
          marginTop: 50, fontFamily: "WV-DM", fontSize: 75,
          fontWeight: 800, letterSpacing: -2.1, lineHeight: 1.1,
          textAlign: "center", opacity: textOpacity,
        }}>WORLD-VISION</div>
        <div style={{
          marginTop: 31, fontFamily: "WV-DM", fontSize: 36,
          fontWeight: 500, textAlign: "center", color: C.secondary,
          letterSpacing: -.5, opacity: textOpacity,
        }}>Voir le monde, le comprendre.</div>
      </div>
    </AbsoluteFill>
  );
};

/** Identity overlay based on the SAME true-source image, no generic sticker. */
export const WorldVisionCornerMarkCandidate: React.FC = () => (
  <div style={{
    position: "absolute", zIndex: 12, left: 76, top: 112,
    display: "flex", alignItems: "center", gap: 12,
  }}>
    <style>{fonts}</style>
    <OriginalG0Eye width={92}/>
    <div style={{
      color: C.white, fontFamily: "WV-DM", fontSize: 29, fontWeight: 800,
      letterSpacing: -.8, textShadow: "0 2px 12px rgba(0,0,0,.35)",
    }}>WORLD-VISION</div>
  </div>
);
