import {AbsoluteFill,Img,useCurrentFrame} from "remotion";
import {fitTextOnNLines} from "@remotion/layout-utils";
import type {CreativeEditProps,CreativeShot} from "./CreativeEdit";
import {resolveCreativeSource} from "./CreativeEdit";
import {photoTrackPose} from "./photo-motion-tracks.mjs";

type VisualStyle=Required<NonNullable<CreativeEditProps["visualStyle"]>>;

/**
 * Original, imported PHOTO: one real image can carry six independent beats:
 * A background camera / B clip-mask reveal of the VERY SAME image /
 * C an externally supplied alpha cutout / D a human-selected focus ring /
 * E a human-supplied number with attribution / F cinematic typography.
 * No object is added or erased; no unsourced object, location or number.
 * All layers use the shared Remotion frame, identical in Player and MP4.
 */
export function PhotoMultilayer({shot,globalStyle,enterOverlapFrames}:{
  shot:CreativeShot;globalStyle:VisualStyle;enterOverlapFrames:number;
}){
  const frame=useCurrentFrame();
  const local=Math.max(0,frame-enterOverlapFrames);
  const photo=shot.photo;
  if(!photo||shot.media?.kind!=="image")return <AbsoluteFill
    data-wv-photo-invalid="true"
    style={{background:"#061521",color:"#e8f6fc",display:"flex",
      alignItems:"center",justifyContent:"center",
      fontSize:34,fontFamily:globalStyle.editorialFont}}>
    Source image et réglages de mouvement obligatoires
  </AbsoluteFill>;

  const pose=photoTrackPose(photo,local,shot.durationFrames);
  const src=resolveCreativeSource(shot.media.src);
  const accent=shot.accent??globalStyle.accent;
  const imageTransform="translate3d("+pose.camera.panX+"px,"+
    pose.camera.panY+"px,0) scale("+pose.camera.scale+")";
  const objectPosition=Math.round((shot.focus?.x??.5)*100)+"% "+
    Math.round((shot.focus?.y??.5)*100)+"%";
  const backgroundStyle:React.CSSProperties={
    width:"100%",height:"100%",objectFit:"cover",
    objectPosition,transform:imageTransform,transformOrigin:"50% 50%"
  };
  const mask=photo.mask;
  const maskFraction=mask?pose.maskProgress:1;
  const clip=mask?.axis==="vertical"
    ?"inset("+((1-maskFraction)*100)+"% 0 0 0)"
    :"inset(0 "+((1-maskFraction)*100)+"% 0 0)";
  const number=photo.metric;
  const shown=number?new Intl.NumberFormat("fr-FR",{
    minimumFractionDigits:number.precision,
    maximumFractionDigits:number.precision
  }).format(number.value*pose.countProgress):"";
  const headlineSize=shot.title?fitTextOnNLines({
    text:shot.title,maxBoxWidth:850,maxLines:3,
    fontFamily:globalStyle.editorialFont,fontWeight:810,maxFontSize:86
  }).fontSize:86;
  const subtitleSize=shot.subtitle?fitTextOnNLines({
    text:shot.subtitle,maxBoxWidth:845,maxLines:2,
    fontFamily:globalStyle.editorialFont,fontWeight:490,maxFontSize:36
  }).fontSize:36;
  const fading=shot.transitionAfter!=="cut"&&shot.transitionFrames
    ?Math.max(0,Math.min(1,(shot.durationFrames-frame)/Math.max(1,shot.transitionFrames))):1;

  return <AbsoluteFill data-wv-photo-multilayer="true" style={{
    background:"#04131f",overflow:"hidden",color:"#f9feff",
    fontFamily:globalStyle.editorialFont
  }}>
    {/* Genuine supplied image stays the only full-frame factual picture. */}
    <AbsoluteFill data-wv-photo-camera="true"
      data-wv-photo-camera-scale={pose.camera.scale.toFixed(4)}
      style={{overflow:"hidden"}}>
      <Img src={src} style={{...backgroundStyle,filter:"brightness(.78) saturate(.90)"}}/>
    </AbsoluteFill>
    <AbsoluteFill data-wv-photo-mask="true"
      data-wv-photo-mask-progress={maskFraction.toFixed(4)}
      style={{overflow:"hidden",clipPath:clip}}>
      <Img src={src} style={backgroundStyle}/>
      {mask&&<div style={{
        position:"absolute",top:0,bottom:0,
        left:mask.axis==="vertical"?0:Math.round(maskFraction*1080)-4,
        width:mask.axis==="vertical"?"100%":4,
        height:mask.axis==="vertical"?3:"100%",
        background:accent,opacity:.42
      }}/>}
    </AbsoluteFill>
    {/* Only an external alpha mask prepared from this exact source is accepted;
        the renderer never invents or segments people itself. */}
    {shot.foreground&&<AbsoluteFill data-wv-photo-foreground="true"
      data-wv-photo-subject-progress={pose.subject.progress.toFixed(4)}
      style={{pointerEvents:"none",overflow:"hidden"}}>
      <Img src={resolveCreativeSource(shot.foreground.src)} style={{
        width:"100%",height:"100%",objectFit:"cover",objectPosition,
        transform:"translate3d("+
          (pose.camera.panX+pose.subject.dx)+"px,"+
          (pose.camera.panY+pose.subject.dy)+"px,0) scale("+
          (pose.camera.scale*pose.subject.scale)+")",
        transformOrigin:"50% 50%"
      }}/>
    </AbsoluteFill>}
    {/* Vignette is editorial contrast, not synthetic crisis scenery. */}
    <AbsoluteFill style={{background:
      "linear-gradient(180deg,rgba(2,12,23,.82),rgba(1,12,24,.20) 31%,rgba(1,12,24,.09) 54%,rgba(1,12,24,.9) 83%,rgba(1,12,24,.96))",
      pointerEvents:"none"
    }}/>
    {photo.focus&&pose.focusPoint&&<div data-wv-photo-focus="true"
      data-wv-photo-focus-center={pose.focusPoint.x.toFixed(2)+","+pose.focusPoint.y.toFixed(2)}
      style={{
        position:"absolute",left:pose.focusPoint.x,top:pose.focusPoint.y,
        width:photo.focus.radius*2,height:photo.focus.radius*2,
        border:"3px solid "+accent,borderRadius:"50%",
        boxShadow:"0 0 0 7px rgba(6,172,205,.09),0 0 30px rgba(26,224,255,.37)",
        transform:"translate(-50%,-50%) scale("+(0.92+0.08*pose.focusProgress)+")",
        opacity:.8*pose.focusProgress,
        pointerEvents:"none"
      }}/>}
    {/* Editorial hierarchy; zones remain above platform's caption/nav bars. */}
    <div data-wv-photo-heading="true" style={{
      position:"absolute",top:190,left:94,right:93,
      borderLeft:"5px solid "+accent,paddingLeft:22,
      opacity:pose.headingProgress*fading,
      transform:"translateY("+Math.round((1-pose.headingProgress)*28)+"px)"
    }}>
      {shot.eyebrow&&<div dir="auto" style={{fontSize:30,fontWeight:760,
        color:"#8ee8f8",letterSpacing:".095em",lineHeight:1.22,
        textTransform:"uppercase",marginBottom:19}}>{shot.eyebrow}</div>}
      <div data-wv-title={shot.id} dir="auto" style={{
        fontSize:headlineSize,fontWeight:825,lineHeight:1.06,
        letterSpacing:"-.045em",overflowWrap:"break-word",
        maxWidth:820,textShadow:"0 6px 30px rgba(0,0,0,.68)"
      }}>{shot.title}</div>
    </div>
    {/* Count and label are *supplied* and include a readable source label. */}
    {number&&<div data-wv-photo-metric="true" style={{
      position:"absolute",right:94,top:1040,maxWidth:600,
      padding:"16px 25px",borderRadius:17,
      background:"rgba(2,17,32,.88)",
      border:"1px solid rgba(154,237,250,.57)",
      boxShadow:"0 8px 34px rgba(1,12,22,.4)",
      textAlign:"right",opacity:pose.countProgress*fading,
      transform:"translateY("+Math.round(28*(1-pose.countProgress))+"px)"
    }}>
      <div style={{fontSize:25,fontWeight:750,color:"#d5f2f7",
        textTransform:"uppercase",letterSpacing:".07em"}}>{number.label}</div>
      <div style={{fontSize:82,lineHeight:1.01,fontWeight:865,
        letterSpacing:"-.06em",color:"#c4fbff"}}>{shown}
        <span style={{fontSize:28,marginLeft:10}}>{number.unit}</span>
      </div>
      <div data-wv-photo-metric-source="true" style={{
        fontSize:32,lineHeight:1.2,marginTop:12,color:"#c1e2eb"
      }}>{number.sourceLabel}</div>
    </div>}
    {shot.subtitle&&<div data-wv-photo-caption="true" dir="auto"
      style={{
        position:"absolute",left:96,right:96,top:1355,maxHeight:200,
        borderTop:"3px solid "+accent,paddingTop:23,overflow:"hidden",
        fontSize:subtitleSize,fontWeight:510,lineHeight:1.31,
        textShadow:"0 6px 25px rgba(0,0,0,.67)",
        opacity:pose.subtitleProgress*fading,
        transform:"translateY("+Math.round(18*(1-pose.subtitleProgress))+"px)"
      }}>{shot.subtitle}</div>}
  </AbsoluteFill>;
}
