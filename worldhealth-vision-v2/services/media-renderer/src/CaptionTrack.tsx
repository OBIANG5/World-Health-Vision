import {AbsoluteFill,interpolate,useCurrentFrame} from "remotion";
import {activeCaption} from "./caption-timeline.mjs";
import {fitTextOnNLines} from "@remotion/layout-utils";
import {loadFont as loadDMSans} from "@remotion/google-fonts/DMSans";
import type {CaptionCue} from "./caption-timeline.mjs";

/**
 * FILM-2: global captions live OUTSIDE TransitionSeries so they do not
 * duplicate on a dissolve. Frame numbering is for the assembled timeline.
 * This is an accessibility/editorial overlay, NOT auto-ASR or fact checking.
 */
export function CaptionTrack({cues,mobileEvidenceRanges=[],photoRanges=[]}:{
  cues:CaptionCue[];
  mobileEvidenceRanges?:Array<{startFrame:number;endFrame:number}>;
  photoRanges?:Array<{startFrame:number;endFrame:number}>;
}){
  const frame=useCurrentFrame();
  // One consistent approved World-Vision caption typeface on BOTH the real
  // Player and exported MP4; no Arial/fallback size mismatch at 390px.
  const dmSans=loadDMSans("normal",{weights:["700"],subsets:["latin"]}).fontFamily;
  const cue=activeCaption(cues,frame);
  if(!cue)return null;
  const enter=Math.min(1,Math.max(0,(frame-cue.startFrame)/3));
  const leave=Math.min(1,Math.max(0,(cue.endFrame-frame)/3));
  const opacity=Math.min(enter,leave);
  // When the source document is being read, never mask its source pixels:
  // display the exact same authored caption in a separate top rail.
  const mobileEvidence=mobileEvidenceRanges.some(r=>frame>=r.startFrame&&frame<r.endFrame);
  const photoRail=!mobileEvidence&&photoRanges.some(r=>frame>=r.startFrame&&frame<r.endFrame);
  const upper=mobileEvidence||(!photoRail&&cue.position==="upper");
  const captionSize=mobileEvidence||photoRail?fitTextOnNLines({
    text:cue.text,maxBoxWidth:photoRail?740:780,maxLines:photoRail?2:3,
    fontFamily:dmSans,fontWeight:700,maxFontSize:44,
  }).fontSize:51;
  return <AbsoluteFill data-wv-caption-layer="true"
    data-wv-evidence-caption-rail={mobileEvidence?"true":"false"} style={{
    pointerEvents:"none",alignItems:"center",justifyContent:upper?"flex-start":"flex-end",
    padding:mobileEvidence?"327px 92px 0":photoRail?"0 160px 320px 96px":upper?"340px 67px 0":"0 67px 375px",zIndex:50
  }}>
    <div data-wv-caption={cue.text} data-wv-caption-position={upper?"upper":"lower"} style={{
      maxWidth:mobileEvidence?844:940,padding:mobileEvidence?"13px 19px":"17px 25px",borderRadius:16,
      background:"rgba(2,10,21,.84)",boxShadow:"0 5px 25px rgba(0,0,0,.42)",
      color:"#fff",fontFamily:dmSans,
      fontSize:captionSize,fontWeight:740,lineHeight:1.19,letterSpacing:"-.018em",
      textAlign:"center",overflowWrap:"break-word",whiteSpace:"normal",
      opacity,transform:"translateY("+interpolate(enter,[0,1],[7,0])+"px)"
    }}>{cue.text}</div>
  </AbsoluteFill>;
}
