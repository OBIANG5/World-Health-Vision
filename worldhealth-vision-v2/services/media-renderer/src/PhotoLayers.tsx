import {AbsoluteFill,Img,useCurrentFrame} from "remotion";
import {fitTextOnNLines} from "@remotion/layout-utils";
import type {CreativeEditProps,CreativeShot} from "./CreativeEdit";
import {resolveCreativeSource} from "./CreativeEdit";

/**
 * PHOTO MULTILAYER — one authentic supplied image, multiple independent
 * deterministic tracks, one shared Remotion composition for V2 Player/MP4.
 *
 * DOES NOT create a photo, remove a subject, simulate an event, infer facts
 * or authorize commercial reuse. Optional foreground must be an externally
 * authored transparent PNG/WebP taken from the SAME source scene.
 *
 * Tracks:
 *  1 optical camera (source image unchanged),
 *  2 documentary reveal mask (same source pixels),
 *  3 alpha foreground/parallax (specialist-prepared cutout),
 *  4 spotlight/radial luminosity (illustrative graphical emphasis),
 *  5 user-supplied number (separately animated),
 *  6 authored title/subtitle (independent beats).
 */
export type PhotoLayersDirection={
  camera:{scaleStart:number;scaleEnd:number;panX:number;panY:number;startFrame:number;endFrame:number};
  reveal:{startFrame:number;endFrame:number;direction:"left"|"right"|"up"};
  highlight?:{x:number;y:number;radius:number;startFrame:number;endFrame:number};
  metric?:{label:string;value:number;unit?:string;precision?:number;startFrame:number;endFrame:number};
};
type GlobalStyle=Required<NonNullable<CreativeEditProps["visualStyle"]>>;
const clamp=(x:number)=>Math.max(0,Math.min(1,x));
const lerp=(a:number,b:number,t:number)=>a+(b-a)*t;
const phase=(f:number,a:number,b:number)=>clamp((f-a)/Math.max(1,b-a));
const ease=(t:number)=>t*t*(3-2*t);

export function PhotoLayers({shot,globalStyle,enterOverlapFrames}:{
  shot:CreativeShot;globalStyle:GlobalStyle;enterOverlapFrames:number;
}){
  const frame=useCurrentFrame();
  const f=Math.max(0,frame-enterOverlapFrames);
  const direction=shot.photo;
  const photo=shot.media;
  if(!direction||photo?.kind!=="image"){
    return <AbsoluteFill data-wv-photo-invalid="true" style={{
      background:"#091a27",color:"#e8f8ff",justifyContent:"center",
      alignItems:"center",fontFamily:globalStyle.editorialFont,fontSize:29
    }}>Photographie originale et paramètres de réalisation requis</AbsoluteFill>;
  }
  const cp=ease(phase(f,direction.camera.startFrame,direction.camera.endFrame));
  const rp=ease(phase(f,direction.reveal.startFrame,direction.reveal.endFrame));
  const scale=lerp(direction.camera.scaleStart,direction.camera.scaleEnd,cp);
  const tx=direction.camera.panX*cp,ty=direction.camera.panY*cp;
  const titleIn=ease(phase(f,8,39));
  const captionIn=ease(phase(f,65,109));
  const highlight=direction.highlight;
  const highlightIn=highlight?ease(phase(f,highlight.startFrame,highlight.endFrame)):0;
  const metric=direction.metric;
  const metricIn=metric?ease(phase(f,metric.startFrame,metric.endFrame)):0;
  const accent=shot.accent??globalStyle.accent;
  const fadeOut=shot.transitionAfter!=="cut"&&(shot.transitionFrames??0)>0
    ?1-ease(phase(frame,shot.durationFrames-(shot.transitionFrames??0),shot.durationFrames))
    :1;
  const focal=shot.focus??{x:.5,y:.5};
  const objectPosition=`${Math.round(focal.x*100)}% ${Math.round(focal.y*100)}%`;
  const source=resolveCreativeSource(photo.src);
  const cameraTransform=`translate3d(${tx.toFixed(2)}px,${ty.toFixed(2)}px,0) scale(${scale.toFixed(5)})`;
  const lens:React.CSSProperties={
    width:"100%",height:"100%",objectFit:"cover",objectPosition,
    transform:cameraTransform,transformOrigin:objectPosition
  };
  const revealInset=direction.reveal.direction==="right"
    ? `inset(0 0 0 ${(100-rp*100).toFixed(2)}%)`
    :direction.reveal.direction==="up"
    ? `inset(${(100-rp*100).toFixed(2)}% 0 0 0)`
    :`inset(0 ${(100-rp*100).toFixed(2)}% 0 0)`;
  const titleSize=shot.title?fitTextOnNLines({
    text:shot.title,fontFamily:globalStyle.editorialFont,fontWeight:810,
    maxBoxWidth:875,maxLines:2,maxFontSize:87
  }).fontSize:87;
  const subSize=shot.subtitle?fitTextOnNLines({
    text:shot.subtitle,fontFamily:globalStyle.editorialFont,fontWeight:490,
    maxBoxWidth:845,maxLines:2,maxFontSize:36
  }).fontSize:36;
  const value=metric?new Intl.NumberFormat("fr-FR",{
    minimumFractionDigits:metric.precision??0,
    maximumFractionDigits:metric.precision??0
  }).format(metric.value*metricIn):"";
  return <AbsoluteFill data-wv-photo-multilayer={shot.id} style={{
    background:"#061621",fontFamily:globalStyle.editorialFont,
    overflow:"hidden",color:globalStyle.ink
  }}>
    {/* The dark underlay is the ORIGINAL photograph. Before the reveal, it is
        visibly identical source pixels, not a fabricated background. */}
    <AbsoluteFill style={{overflow:"hidden"}}>
      <Img src={source} style={{...lens,filter:"brightness(.42) saturate(.76)"}}/>
    </AbsoluteFill>
    <AbsoluteFill data-wv-photo-reveal={rp.toFixed(4)} style={{
      clipPath:revealInset,overflow:"hidden"
    }}>
      <Img data-wv-photo-camera-scale={scale.toFixed(4)} src={source} style={lens}/>
      {/* Same-scene manually prepared transparent cutout, no AI compositing
          performed by this system or source-photographic claims added. */}
      {shot.foreground&&<Img data-wv-photo-cutout="true"
        src={resolveCreativeSource(shot.foreground.src)}
        style={{
          position:"absolute",inset:0,width:"100%",height:"100%",
          objectFit:"cover",objectPosition,transformOrigin:objectPosition,
          transform:`translate3d(${(tx*.56-18*cp).toFixed(2)}px,${(ty*.4-12*cp).toFixed(2)}px,0) scale(${(scale+.055+.035*cp).toFixed(5)})`
        }}/>}
    </AbsoluteFill>
    {/* Emphasize an editor-chosen LOCATION in the photo, not a fabricated
        object detector or a misleading purported evidentiary annotation. */}
    {highlight&&<AbsoluteFill data-wv-photo-highlight={highlightIn.toFixed(4)}
      style={{
        pointerEvents:"none",opacity:highlightIn*.84,
        background:`radial-gradient(circle at ${highlight.x*100}% ${highlight.y*100}%,rgba(190,248,255,.22) 0%,rgba(45,219,252,.12) ${highlight.radius*.52*100}%,transparent ${highlight.radius*100}%)`
      }}/>}
    {/* Typography gets its own readability matte without obscuring the
        photographic center or posing as a platform watermark. */}
    <AbsoluteFill style={{pointerEvents:"none",background:
      "linear-gradient(180deg,rgba(2,12,23,.60) 0%,rgba(2,12,23,.12) 35%,rgba(2,12,23,.20) 48%,rgba(2,12,23,.83) 73%,rgba(2,12,23,.97) 100%)"
    }}/>
    <div data-wv-photo-title={shot.id} style={{
      position:"absolute",top:282,left:91,right:99,
      opacity:titleIn*fadeOut,transform:`translateY(${Math.round((1-titleIn)*27)}px)`,
      borderLeft:"5px solid "+accent,paddingLeft:22
    }}>
      {shot.eyebrow&&<div dir="auto" style={{
        fontSize:23,fontWeight:740,color:"#dcfaff",
        textTransform:"uppercase",letterSpacing:".12em",marginBottom:20
      }}>{shot.eyebrow}</div>}
      {shot.title&&<div data-wv-title={shot.id} dir="auto" style={{
        fontSize:titleSize,lineHeight:1.06,fontWeight:810,
        letterSpacing:"-.042em",whiteSpace:"pre-line",overflowWrap:"break-word",
        textShadow:"0 8px 31px rgba(0,0,0,.62)"
      }}>{shot.title}</div>}
    </div>
    {metric&&<div data-wv-photo-metric="true" style={{
      position:"absolute",top:1135,left:92,right:130,
      borderRadius:20,padding:"21px 28px",
      background:"rgba(3,17,29,.79)",border:"1px solid rgba(145,230,247,.58)",
      boxShadow:"0 12px 33px rgba(0,0,0,.36)",
      display:"flex",justifyContent:"space-between",alignItems:"center",
      gap:20,opacity:metricIn*fadeOut
    }}>
      <div style={{fontSize:25,color:"#d4eff3",fontWeight:700,
        maxWidth:420,textTransform:"uppercase",letterSpacing:".04em"}}>
        {metric.label}
      </div>
      <div style={{fontSize:82,fontWeight:880,color:"#cbfcff",
        letterSpacing:"-.058em",whiteSpace:"nowrap"}}>
        {value}<span style={{fontSize:34,marginLeft:8}}>{metric.unit??""}</span>
      </div>
    </div>}
    {shot.subtitle&&<div data-wv-photo-caption="true" dir="auto" style={{
      position:"absolute",top:1356,left:92,right:130,maxHeight:170,
      overflow:"hidden",borderTop:"3px solid "+accent,
      paddingTop:24,fontSize:subSize,fontWeight:490,lineHeight:1.31,
      opacity:captionIn*fadeOut,
      textShadow:"0 6px 21px rgba(0,0,0,.7)"
    }}>{shot.subtitle}</div>}
    <div style={{position:"absolute",top:1575,left:91,width:178,height:3,
      background:accent,opacity:.55*captionIn*fadeOut}}/>
  </AbsoluteFill>;
}
