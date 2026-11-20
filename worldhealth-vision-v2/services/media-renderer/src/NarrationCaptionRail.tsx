import {AbsoluteFill,useCurrentFrame} from "remotion";
import {captionAtFrame} from "./caption-timeline.mjs";
import type {CaptionTrack} from "./caption-timeline.mjs";

/**
 * A common safe-area subtitle rail, independently keyed to actual Remotion
 * frames: no per-shot timers, TTS guesses or CSS animations. With captions,
 * native per-template explanatory subtitles are suppressed and DATA provenance
 * is reflowed above this reserved caption zone. Source values remain intact.
 */
export function NarrationCaptionRail({track}:{track:CaptionTrack}){
  const frame=useCurrentFrame();
  const cue=captionAtFrame(track,frame);
  if(!cue)return null;
  const test=track.kind==="non_speech_test";
  return <AbsoluteFill data-wv-caption-layer="true"
    style={{pointerEvents:"none",fontFamily:"'Helvetica Neue',Arial,sans-serif"}}>
    <div data-wv-caption-rail="true" data-wv-caption-kind={track.kind}
      data-wv-caption-id={cue.id}
      style={{position:"absolute",top:1390,left:108,right:108,
        minHeight:80,maxHeight:124,
        borderLeft:"5px solid #57dded",borderRadius:12,
        padding:"11px 17px",boxSizing:"border-box",
        background:"rgba(2,12,23,.94)",color:"#f8feff",
        fontSize:37,lineHeight:1.14,fontWeight:650,
        textAlign:"center",whiteSpace:"pre-line",
        overflowWrap:"break-word",overflow:"hidden",
        boxShadow:"0 6px 20px rgba(0,0,0,.35)"}}>
      {test&&<div style={{fontSize:18,fontWeight:750,
        color:"#98e5ed",letterSpacing:".055em"}}>
        TEST DE SOUS-TITRES · AUCUNE PAROLE
      </div>}
      {cue.text}
    </div>
  </AbsoluteFill>;
}
