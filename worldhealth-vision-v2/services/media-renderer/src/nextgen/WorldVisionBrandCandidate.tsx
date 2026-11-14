import React from "react";
import {
  AbsoluteFill, Easing, interpolate, spring, useCurrentFrame,
  useVideoConfig,
} from "remotion";

/**
 * FUTURE BRAND DIRECTION — experimental isolated composition.
 * Transparent vector EYE, not an opaque PNG tile. The eye/globe is a NEW
 * graphic candidate (not a copy of the user's canonical eye logo).
 * Do not substitute it in an already published episode without approval.
 * Brand signature is completely silent.
 */
const C = {
  navy: "#061528", white: "#F6FAFC",
  cyan: "#70DAEB", muted: "#B8CBD8",
};

export const NextGenEye: React.FC<{size?: number}> = ({size = 360}) => {
  const f = useCurrentFrame();
  const pulse = interpolate(f, [0, 25, 55, 90], [0.92, 1, 1.015, 1],
    {extrapolateLeft: "clamp", extrapolateRight: "clamp"});
  const reveal = interpolate(f, [4, 25], [0, 1], {
    easing: Easing.out(Easing.cubic), extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  return (
    <svg width={size} height={size * .60} viewBox="0 0 420 252"
      role="img" aria-label="Proposition d'œil-globe World-Vision"
      style={{transform: "scale(" + pulse + ")", overflow: "visible"}}>
      <defs>
        <linearGradient id="wveye" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor={C.white}/>
          <stop offset="100%" stopColor={C.cyan}/>
        </linearGradient>
        <radialGradient id="wvplanet">
          <stop offset="0%" stopColor="#258BC0"/>
          <stop offset="85%" stopColor="#0A3F70"/>
          <stop offset="100%" stopColor="#09283E"/>
        </radialGradient>
      </defs>
      <g opacity={reveal} fill="none" strokeLinecap="round" strokeLinejoin="round">
        <path d="M23 126 Q114 24 210 24 Q306 24 397 126 Q306 228 210 228 Q114 228 23 126Z"
          stroke="url(#wveye)" strokeWidth="12"/>
        <circle cx="210" cy="126" r="81" fill="url(#wvplanet)"
          stroke={C.cyan} strokeWidth="5"/>
        <ellipse cx="210" cy="126" rx="35" ry="81"
          stroke="#A9E8E9" strokeWidth="3" opacity=".85"/>
        <path d="M129 126H291 M146 87Q210 103 274 87 M146 164Q210 149 274 164"
          stroke="#C3F6F4" strokeWidth="3" opacity=".78"/>
        <path d="M157 75l27 8 14 22-11 18-29 8-4 32-15-27 8-29z
                 M218 158l24-24 24 8-4 22-23 20-17-5z"
          fill="#69BDA0" fillOpacity=".9" stroke="none"/>
      </g>
    </svg>
  );
};

const BrandLine: React.FC<{children: React.ReactNode;size: number;
  weight?: number; color?: string; marginTop?: number; tracking?: number}> =
  ({children,size,weight=600,color=C.white,marginTop=0,tracking=0}) => (
    <div style={{
      color, fontFamily: "Arial, sans-serif", fontSize: size,
      fontWeight: weight, letterSpacing: tracking,
      marginTop, textAlign: "center", whiteSpace: "nowrap",
      lineHeight: 1.16,
    }}>{children}</div>
  );

/** Demo-only 90-frame Remotion end screen; no input audio. */
export const WorldVisionBrandOutroCandidate: React.FC = () => {
  const f = useCurrentFrame();
  const {fps} = useVideoConfig();
  const t = spring({fps, frame: f, config: {damping: 200, mass: 0.65,
    stiffness: 95}});
  return (
    <AbsoluteFill style={{background: C.navy, overflow: "hidden",
      alignItems: "center", justifyContent: "center"}}>
      <AbsoluteFill style={{
        opacity: 0.8, pointerEvents: "none",
        background: "radial-gradient(ellipse 510px 460px at 50% 47%,rgba(20,95,135,.23),transparent 74%)",
      }}/>
      <div style={{
        width: "100%", display: "flex", flexDirection: "column",
        alignItems: "center", justifyContent: "center",
        transform: "translateY(" + ((1-t)*32) + "px)",
        opacity: t,
      }}>
        <NextGenEye size={358}/>
        <BrandLine size={74} weight={800} marginTop={56} tracking={-.8}>
          WORLD-VISION
        </BrandLine>
        <BrandLine size={35} weight={500} marginTop={29} color={C.muted}>
          Voir le monde, le comprendre.
        </BrandLine>
      </div>
    </AbsoluteFill>
  );
};

/** Small transparent eye overlay; prevents the screenshot's white icon tile. */
export const WorldVisionCornerMarkCandidate: React.FC = () => (
  <div style={{position: "absolute", zIndex: 12,
    left: 80, top: 106, display: "flex", alignItems: "center",
    gap: 14, filter: "drop-shadow(0 4px 12px rgba(0,0,0,.35))"}}>
    <NextGenEye size={76}/>
    <div style={{color: C.white, font: "700 29px Arial, sans-serif",
      letterSpacing: .7}}>WORLD-VISION</div>
  </div>
);
