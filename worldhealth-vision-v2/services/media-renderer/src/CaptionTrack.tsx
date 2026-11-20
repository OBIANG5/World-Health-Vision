import React from "react";
import {AbsoluteFill,interpolate,useCurrentFrame} from "remotion";
import {activeCaption} from "./caption-timeline.mjs";
import type {CaptionCue} from "./caption-timeline.mjs";

/**
 * FILM-2: global captions live OUTSIDE TransitionSeries so they do not
 * duplicate on a dissolve. Frame numbering is for the assembled timeline.
 * This is an accessibility/editorial overlay, NOT auto-ASR or fact checking.
 */
export function CaptionTrack({cues}:{cues:CaptionCue[]}){
  const frame=useCurrentFrame();
  const cue=activeCaption(cues,frame);
  if(!cue)return null;
  const enter=Math.min(1,Math.max(0,(frame-cue.startFrame)/3));
  const leave=Math.min(1,Math.max(0,(cue.endFrame-frame)/3));
  const opacity=Math.min(enter,leave);
  const upper=cue.position==="upper";
  return <AbsoluteFill data-wv-caption-layer="true" style={{
    pointerEvents:"none",alignItems:"center",justifyContent:upper?"flex-start":"flex-end",
    padding:upper?"340px 67px 0":"0 67px 375px",zIndex:50
  }}>
    <div data-wv-caption={cue.text} data-wv-caption-position={upper?"upper":"lower"} style={{
      maxWidth:940,padding:"17px 25px",borderRadius:16,
      background:"rgba(2,10,21,.84)",boxShadow:"0 5px 25px rgba(0,0,0,.42)",
      color:"#fff",fontFamily:"Arial,'Helvetica Neue',sans-serif",
      fontSize:51,fontWeight:740,lineHeight:1.19,letterSpacing:"-.018em",
      textAlign:"center",overflowWrap:"break-word",whiteSpace:"normal",
      opacity,transform:"translateY("+interpolate(enter,[0,1],[7,0])+"px)"
    }}>{cue.text}</div>
  </AbsoluteFill>;
}
