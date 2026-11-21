import React, {useMemo} from "react";
import {AbsoluteFill,interpolate,useCurrentFrame,useVideoConfig} from "remotion";
import {createTikTokStyleCaptions} from "@remotion/captions";
import {fitTextOnNLines} from "@remotion/layout-utils";
import {loadFont as loadBarlow} from "@remotion/google-fonts/BarlowCondensed";
import {loadFont as loadDMSans} from "@remotion/google-fonts/DMSans";

/**
 * World-Vision visual skin for EXISTING Remotion caption pages.
 * Script, voice and individual word timings are approved BEFORE rendering.
 * No inferred transcription and no proprietary caption Element source copied.
 */
export type TimedWord={
  text:string;
  startFrame:number;
  endFrame:number;
  emphasis?:boolean;
};
let fontCache:undefined|{impact:string;body:string};
function getFonts(){
  if(!fontCache){
    const heading=loadBarlow("italic",{weights:["900"],subsets:["latin"]});
    const body=loadDMSans("normal",{weights:["700"],subsets:["latin"]});
    fontCache={impact:heading.fontFamily,body:body.fontFamily};
  }
  return fontCache;
}
const clamp={extrapolateLeft:"clamp",extrapolateRight:"clamp"} as const;

/** An opt-in brand treatment on the EXISTING title field. */
export function ImpactSlabTitle({text,accent,opacity,offsetY}:{
  text:string;
  accent:string;
  opacity:number;
  offsetY:number;
}){
  const {impact}=getFonts();
  const size=fitTextOnNLines({
    text,maxBoxWidth:812,maxLines:3,
    fontFamily:impact,fontWeight:900,maxFontSize:138,
  }).fontSize;
  return <div data-wv-impact-slab="true" style={{
    display:"inline-block",maxWidth:862,background:accent,
    boxShadow:"0 18px 54px rgba(0,0,0,.52)",
    padding:"13px 26px 11px",transform:"translateY("+offsetY+"px) skewX(-5deg)",
    opacity
  }}>
    <div style={{
      fontFamily:impact,color:"#021521",fontSize:size,fontWeight:900,fontStyle:"italic",
      lineHeight:.93,letterSpacing:"-.035em",textTransform:"uppercase",
      whiteSpace:"pre-line",overflowWrap:"break-word",transform:"skewX(5deg)"
    }}>{text}</div>
  </div>;
}

/**
 * The actual word grouping is Remotion's public createTikTokStyleCaptions().
 * World-Vision only defines its own brand composition and meaningful emphasis.
 * Time is GLOBAL, so preview Player and MP4 remain consistent over transitions.
 */
export const AttentionTypography:React.FC<{
  words:TimedWord[];
  accent?:string;
  mobileEvidenceRanges?:Array<{startFrame:number;endFrame:number}>;
}>=({words,accent="#08eeea",mobileEvidenceRanges=[]})=>{
  const frame=useCurrentFrame();
  const {fps}=useVideoConfig();
  const {impact,body}=getFonts();
  const evidenceRail=mobileEvidenceRanges.some(r=>frame>=r.startFrame&&frame<r.endFrame);
  const pages=useMemo(()=>{
    const captions=words.map((word,i)=>({
      text:(i===0?"":" ")+word.text,
      startMs:word.startFrame*1000/fps,
      endMs:word.endFrame*1000/fps,
      timestampMs:(word.startFrame+word.endFrame)*500/fps,
      confidence:null,
    }));
    return createTikTokStyleCaptions({
      captions,combineTokensWithinMilliseconds:1230,
      breakOnSilenceAfterMilliseconds:350,
    }).pages;
  },[words,fps]);
  const now=frame*1000/fps;
  const page=pages.find(p=>now>=p.startMs&&now<p.startMs+p.durationMs);
  if(!page)return null;
  const enter=Math.max(0,Math.min(1,(now-page.startMs)/155));
  const pageY=interpolate(enter,[0,1],[28,0],clamp);
  const highlighted=new Set(words.filter(w=>w.emphasis).map(w=>w.startFrame*1000/fps));
  return <AbsoluteFill data-wv-kinetic-caption-layer="true"
    data-wv-evidence-caption-rail={evidenceRail?"true":"false"} style={{
    pointerEvents:"none",justifyContent:evidenceRail?"flex-start":"flex-end",alignItems:"center",
    padding:evidenceRail?"335px 92px 0":"0 92px 450px",zIndex:55
  }}>
    <div data-wv-kinetic-page={page.text} style={{
      maxWidth:evidenceRail?825:890,width:"100%",textAlign:"center",
      fontFamily:body,fontWeight:700,fontSize:evidenceRail?49:70,lineHeight:1.23,
      letterSpacing:"-.035em",color:"#fff",whiteSpace:"normal",
      textShadow:"0 6px 18px rgba(0,0,0,.68)",
      transform:"translateY("+pageY+"px)",opacity:enter,
    }}>
      {page.tokens.map((token,index)=>{
        const active=now>=token.fromMs&&now<token.toMs;
        const important=highlighted.has(token.fromMs);
        const activeProgress=Math.min(1,Math.max(0,(now-token.fromMs)/125));
        const scale=active?interpolate(activeProgress,[0,1],[1.15,1],clamp):1;
        return <span key={token.fromMs+"-"+index}
          data-wv-active-word={active?"true":"false"}
          data-wv-strong-word={important?"true":"false"}
          style={{
            display:"inline-block",whiteSpace:"pre",verticalAlign:"baseline",
            fontFamily:active&&important?impact:body,
            fontStyle:active&&important?"italic":"normal",
            fontWeight:active&&important?900:700,
            color:active&&important?"#001822":"#fff",
            background:active&&important?accent:"transparent",
            borderRadius:active&&important?3:0,
            boxShadow:active&&important?"0 9px 28px rgba(0,0,0,.45)":"none",
            padding:active&&important?"0 10px":"0 2px",
            transform:"scale("+scale+")",
          }}>{token.text}</span>;
      })}
    </div>
  </AbsoluteFill>;
};
