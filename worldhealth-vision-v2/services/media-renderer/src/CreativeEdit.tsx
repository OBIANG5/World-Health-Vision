import React from "react";
import {AbsoluteFill, Audio, Img, OffthreadVideo, Sequence, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig} from "remotion";
import {TransitionSeries, linearTiming} from "@remotion/transitions";
import {fade} from "@remotion/transitions/fade";
import {slide} from "@remotion/transitions/slide";
import {fitTextOnNLines} from "@remotion/layout-utils";

/**
 * A real Remotion composition for supplied scripts, images, clips, voices and
 * externally rendered animations. It never invents facts or generates media.
 * The rendering backend stages every local media path before invoking Remotion.
 */
export type CreativeMedia = {
  kind:"image"|"video";
  src:string;
  trimBefore?:number;
  credit?:string;
};
export type CreativeShot = {
  id:string;
  durationFrames:number;
  template:"documentary"|"kinetic"|"evidence"|"number"|"clean_video"|"focus_reveal";
  title?:string;
  subtitle?:string;
  eyebrow?:string;
  footnote?:string;
  media?:CreativeMedia|null;
  foreground?:{src:string;credit?:string}|null;
  accent?:string;
  motion?:"locked"|"dolly"|"drift"|"push";
  transitionAfter?:"cut"|"dissolve"|"slide";
  transitionFrames?:number;
  focus?:{x:number;y:number};
};
export type CreativeEditProps = {
  version:1;
  title:string;
  script:string; // authored outside the renderer, passed through untouched
  shots:CreativeShot[];
  narration?:{src:string;volume?:number;label?:string}|null;
  soundtrack?:{src:string;volume?:number;label?:string}|null;
  brandOutro?:{src:string;durationFrames:number}|null;
  visualStyle?:{background?:string;ink?:string;accent?:string;editorialFont?:string};
};
const clamp={extrapolateLeft:"clamp",extrapolateRight:"clamp"} as const;
const DEFAULT_BG="#0b1721";
const DEFAULT_ACCENT="#8bbecf";
const DEFAULT_FONT="'Helvetica Neue',Arial,sans-serif";
const reveal=(f:number,delay:number,duration:number)=>interpolate(f,[delay,delay+duration],[0,1],clamp);
/**
 * Rendering and Player use the SAME React components. The renderer stages local
 * assets under public/, while the browser Studio passes user-selected blob:
 * object URLs; staticFile() would incorrectly rewrite those URLs.
 * Remote URLs are only ever supplied explicitly (not auto-discovered).
 */
export const resolveCreativeSource=(src:string)=>
  /^(blob:|data:|https?:\/\/)/i.test(src)?src:staticFile(src);


function MediaPlate({shot}:{shot:CreativeShot}) {
  const f=useCurrentFrame();
  const p=Math.max(0,Math.min(1,f/Math.max(1,shot.durationFrames)));
  const focus=shot.focus??{x:0.5,y:0.5};
  const motion=shot.motion??"dolly";
  const scale=motion==="locked"?1:motion==="push"?1.055+p*.065:1.03+p*.045;
  const tx=motion==="drift"?(p-.5)*-24:0;
  const ty=motion==="drift"?(p-.5)*14:0;
  const style:React.CSSProperties={
    width:"100%",height:"100%",objectFit:"cover",
    objectPosition:Math.round(focus.x*100)+"% "+Math.round(focus.y*100)+"%",
    transform:"translate3d("+tx+"px,"+ty+"px,0) scale("+scale+")",
    transformOrigin:Math.round(focus.x*100)+"% "+Math.round(focus.y*100)+"%",
  };
  if(!shot.media)return null;
  const url=resolveCreativeSource(shot.media.src);
  return <AbsoluteFill style={{overflow:"hidden"}}>
    {shot.media.kind==="image"
      ? <Img src={url} style={style}/>
      : <OffthreadVideo src={url} muted trimBefore={shot.media.trimBefore??0} style={style}/>}
  </AbsoluteFill>;
}

/**
 * FOCUS REVEAL — motion art direction based on an AUTHENTIC supplied image/video.
 * Framed evidence expands to full-bleed; title enters on a separate semantic beat.
 *
 * No AI-generated background, no fabricated news image, no arbitrary "Ken Burns".
 * Everything is frame-derived so stills, previews and full renders match.
 */
function FocusReveal({shot,globalStyle}:{shot:CreativeShot;globalStyle:Required<NonNullable<CreativeEditProps["visualStyle"]>>}) {
  const frame=useCurrentFrame();
  const {fps}=useVideoConfig();
  const beat=(start:number,end:number)=>interpolate(frame,[start,end],[0,1],clamp);
  const ease=(x:number)=>1-Math.pow(1-x,3);
  const expand=ease(beat(8,48));
  const insetX=interpolate(expand,[0,1],[8,0]);
  const insetTop=interpolate(expand,[0,1],[13,0]);
  const insetBottom=interpolate(expand,[0,1],[18,0]);
  const corner=interpolate(expand,[0,1],[23,0]);
  const shadowOpacity=interpolate(expand,[0,1],[.6,0]);
  const titleSpring=spring({frame:frame-29,fps,config:{mass:1,damping:25,stiffness:96}});
  const textIn=Math.max(0,Math.min(1,titleSpring));
  const lineIn=ease(beat(31,57));
  const overlineIn=ease(beat(32,50));
  const textMask=Math.max(0,Math.min(1,titleSpring));
  // Use the existing layout engine's font metrics rather than brittle
  // heuristics based on character counts (French, Arabic, Cyrillic, etc.).
  const titleSize=shot.title
    ? fitTextOnNLines({
        text:shot.title,maxBoxWidth:795,maxLines:3,
        fontFamily:globalStyle.editorialFont,fontWeight:815,maxFontSize:88,
      }).fontSize : 88;
  const subtitleSize=shot.subtitle
    ? fitTextOnNLines({
        text:shot.subtitle,maxBoxWidth:790,maxLines:2,
        fontFamily:globalStyle.editorialFont,fontWeight:500,maxFontSize:33,
      }).fontSize : 33;
  return <AbsoluteFill style={{
    background:globalStyle.background,
    fontFamily:globalStyle.editorialFont,
    color:globalStyle.ink,
    overflow:"hidden"
  }}>
    {/* Full-screen optical underlay is subtle and intentionally non-documentary. */}
    <AbsoluteFill style={{opacity:.36}}>
      <MediaPlate shot={{...shot,motion:"locked"}}/>
    </AbsoluteFill>
    <AbsoluteFill style={{background:"linear-gradient(180deg,rgba(6,16,25,.25),rgba(6,16,25,.5))"}}/>
    <AbsoluteFill style={{
      clipPath:"inset("+insetTop+"% "+insetX+"% "+insetBottom+"% "+insetX+"% round "+corner+"px)",
      filter:"drop-shadow(0 16px 38px rgba(1,9,18,"+shadowOpacity+"))",
    }}>
      <MediaPlate shot={shot}/>
      <ForegroundPlate shot={shot}/>
    </AbsoluteFill>
    <AbsoluteFill style={{
      background:"linear-gradient(180deg,rgba(4,13,22,.28) 0%,transparent 31%,rgba(4,10,18,.11) 42%,rgba(4,10,18,.58) 68%,rgba(4,10,18,.92) 100%)",
      opacity:ease(beat(32,65))
    }}/>
    <div style={{
      position:"absolute",top:248,left:87,right:154,display:"flex",
      alignItems:"center",justifyContent:"space-between",
      opacity:overlineIn,transform:"translateY("+Math.round((1-overlineIn)*-18)+"px)"
    }}>
{shot.eyebrow&&<span style={{fontSize:24,fontWeight:700,letterSpacing:".1em",color:shot.accent??globalStyle.accent,maxWidth:755}}>{shot.eyebrow}</span>}
    </div>
    <div style={{
      position:"absolute",left:88,right:164,bottom:415,
      display:"flex",flexDirection:"column",alignItems:"flex-start"
    }}>
      <div style={{
        background:shot.accent??globalStyle.accent,width:Math.round(lineIn*90),height:5,
        marginBottom:29,opacity:lineIn
      }}/>
      {shot.title&&<div dir="auto" style={{
        fontSize:titleSize,fontWeight:815,letterSpacing:"-.047em",lineHeight:1.07,
        whiteSpace:"pre-line",overflowWrap:"break-word",
        maxWidth:880,
        clipPath:"inset(0 0 "+(1-textMask)*100+"% 0)",
        transform:"translateY("+Math.round((1-textIn)*42)+"px)",
        textShadow:"0 3px 34px rgba(0,0,0,.5)"
      }}>{shot.title}</div>}
      {shot.subtitle&&<div style={{
        fontSize:subtitleSize,fontWeight:480,lineHeight:1.29,color:"#e7f0f5",
        marginTop:24,maxWidth:800,
        opacity:ease(beat(54,75)),
        transform:"translateY("+Math.round((1-ease(beat(54,75)))*23)+"px)",
        textShadow:"0 3px 30px rgba(0,0,0,.65)"
      }}>{shot.subtitle}</div>}
    </div>
    {/* Artboards stay clean; timestamps, SHA, QA are NOT burned into public pixels. */}
  </AbsoluteFill>;
}

/**
 * Optional externally segmented foreground for depth without fake AI footage.
 * The transparent PNG/WebP is prepared by a specialist tool and staged intact.
 * Different optical travel produces a restrained 2.5D parallax effect.
 */
function ForegroundPlate({shot}:{shot:CreativeShot}) {
  const frame=useCurrentFrame();
  const duration=Math.max(1,shot.durationFrames);
  const progress=Math.max(0,Math.min(1,frame/duration));
  if(!shot.foreground)return null;
  return <AbsoluteFill style={{pointerEvents:"none",overflow:"hidden"}}>
    <Img src={resolveCreativeSource(shot.foreground.src)} style={{
      width:"100%",height:"100%",objectFit:"cover",
      objectPosition:Math.round((shot.focus?.x??.5)*100)+"% "+Math.round((shot.focus?.y??.5)*100)+"%",
      transform:"translate3d("+Math.round(-16*progress)+"px,"+Math.round(-13*progress)+"px,0) scale("+(1.05+progress*.07)+")",
      transformOrigin:"center center"
    }}/>
  </AbsoluteFill>;
}

function CinematicShot({shot,globalStyle}:{shot:CreativeShot;globalStyle:Required<NonNullable<CreativeEditProps["visualStyle"]>>}) {
  const frame=useCurrentFrame();
  const {fps}=useVideoConfig();
  const accent=shot.accent??globalStyle.accent;
  const kinetic=shot.template==="kinetic";
  const numeric=shot.template==="number";
  const evidence=shot.template==="evidence";
  const clean=shot.template==="clean_video";
  const move=spring({frame,fps,config:{mass:1,damping:24,stiffness:90}});
  if(shot.template==="focus_reveal")return <FocusReveal shot={shot} globalStyle={globalStyle}/>;
  const opacity=reveal(frame,0,17);
  const startTextY=interpolate(move,[0,1],[70,0],clamp);
  const subtitleFade=reveal(frame,15,18);
  const glow=shot.media?"0 5px 38px rgba(0,0,0,.48)":"none";
  const textSize=shot.title
    ? fitTextOnNLines({
        text:shot.title,maxBoxWidth:865,maxLines:3,
        fontFamily:globalStyle.editorialFont,fontWeight:790,
        maxFontSize:numeric?166:kinetic?104:76,
      }).fontSize
    : 76;
  const bodySize=shot.subtitle
    ? fitTextOnNLines({
        text:shot.subtitle,maxBoxWidth:830,maxLines:2,
        fontFamily:globalStyle.editorialFont,fontWeight:460,
        maxFontSize:kinetic?39:33,
      }).fontSize
    : 33;

  return <AbsoluteFill style={{background:globalStyle.background,overflow:"hidden",fontFamily:globalStyle.editorialFont}}>
    <MediaPlate shot={shot}/>
    <ForegroundPlate shot={shot}/>
    {!clean&&<>
      <AbsoluteFill style={{
        background:shot.media
          ? "linear-gradient(180deg,rgba(4,10,18,.04),rgba(4,10,18,.12) 43%,rgba(4,10,18,.78) 90%,rgba(4,10,18,.91))"
          : "radial-gradient(ellipse at 78% 32%,#1a3446,"+globalStyle.background+" 66%)"
      }}/>
      {!shot.media&&<AbsoluteFill style={{
        background:"radial-gradient(ellipse at 76% 42%,"+accent+"22,transparent 63%)",
        opacity:move*.85,
      }}/>}
      <AbsoluteFill style={{
        justifyContent:kinetic?"center":"flex-end",
        padding:kinetic?"260px 105px":"0 96px 286px 92px",
        color:globalStyle.ink,
      }}>
        <div style={{maxWidth:888}}>
          {shot.eyebrow&&<div style={{
            color:accent,textTransform:"uppercase",fontSize:25,fontWeight:700,
            letterSpacing:"0.17em",lineHeight:1.25,marginBottom:25,
            opacity:reveal(frame,5,15)
          }}>{shot.eyebrow}</div>}
          {shot.title&&<div style={{overflow:"hidden"}}>
            <div style={{
              fontSize:textSize,
              lineHeight:numeric?.94:kinetic?1.04:1.09,
              fontWeight:numeric?850:790,
              letterSpacing:numeric?"-0.065em":"-0.04em",
              whiteSpace:"pre-line",overflowWrap:"break-word",
              opacity,transform:"translateY("+startTextY+"px)",
              textShadow:glow,
            }}>{shot.title}</div>
          </div>}
          {shot.subtitle&&<div style={{
            fontSize:bodySize,fontWeight:460,lineHeight:1.34,
            color:"#f3f6f8",marginTop:kinetic?38:27,
            opacity:subtitleFade,
            transform:"translateY("+Math.round((1-subtitleFade)*23)+"px)",
            textShadow:glow,
          }}>{shot.subtitle}</div>}
          {evidence&&<div style={{
            position:"absolute",left:64,top:"30%",height:"39%",width:5,
            background:accent,transform:"scaleY("+reveal(frame,4,20)+")",
            transformOrigin:"top",
          }}/>}
          {shot.footnote&&<div style={{
            marginTop:34,color:"#d5e2e8",fontSize:22,lineHeight:1.35,
            opacity:reveal(frame,23,20)
          }}>{shot.footnote}</div>}
        </div>
      </AbsoluteFill>
    </>}
  </AbsoluteFill>;
}
function transitionOf(shot:CreativeShot) {
  const frames=shot.transitionFrames??0;
  if(!frames||!shot.transitionAfter||shot.transitionAfter==="cut")return null;
  return {frames,presentation:shot.transitionAfter==="slide"?slide():fade()};
}
export function creativeDuration(props:CreativeEditProps) {
  let total=props.shots.reduce((sum,shot)=>sum+shot.durationFrames,0);
  props.shots.slice(0,-1).forEach(shot=>{total-=transitionOf(shot)?.frames??0;});
  return total+(props.brandOutro?.durationFrames??0);
}
export const CreativeEdit:React.FC<CreativeEditProps> = props => {
  const base={
    background:props.visualStyle?.background??DEFAULT_BG,
    ink:props.visualStyle?.ink??"#f6f8fa",
    accent:props.visualStyle?.accent??DEFAULT_ACCENT,
    editorialFont:props.visualStyle?.editorialFont??DEFAULT_FONT
  };
  const timelineFrames=creativeDuration({...props,brandOutro:null});
  const children:React.ReactNode[]=[];
  props.shots.forEach((shot,index)=>{
    children.push(<TransitionSeries.Sequence key={"shot-"+shot.id} name={shot.id} durationInFrames={shot.durationFrames}>
      <CinematicShot shot={shot} globalStyle={base}/>
    </TransitionSeries.Sequence>);
    if(index<props.shots.length-1){
      const t=transitionOf(shot);
      if(t)children.push(<TransitionSeries.Transition key={"transition-"+shot.id} presentation={t.presentation} timing={linearTiming({durationInFrames:t.frames})}/>);
    }
  });
  return <AbsoluteFill style={{background:base.background}}>
    <TransitionSeries>{children}</TransitionSeries>
    {props.narration&&<Sequence durationInFrames={timelineFrames} name="Voix choisie / fournie">
      <Audio src={resolveCreativeSource(props.narration.src)} volume={props.narration.volume??1}/>
    </Sequence>}
    {props.soundtrack&&<Sequence durationInFrames={timelineFrames} name="Ambiance avant signature">
      <Audio src={resolveCreativeSource(props.soundtrack.src)}
        volume={(frame)=> {
          const base=props.soundtrack?.volume??.1;
          const fadeIn=Math.max(0,Math.min(1,frame/12));
          const fadeOut=Math.max(0,Math.min(1,(timelineFrames-frame)/15));
          return base*Math.min(fadeIn,fadeOut);
        }}
      />
    </Sequence>}
    {props.brandOutro&&<Sequence from={timelineFrames} durationInFrames={props.brandOutro.durationFrames} name="G0 original ou signature fournie">
      <AbsoluteFill><OffthreadVideo src={resolveCreativeSource(props.brandOutro.src)} muted style={{width:"100%",height:"100%",objectFit:"cover"}}/></AbsoluteFill>
    </Sequence>}
  </AbsoluteFill>;
};
