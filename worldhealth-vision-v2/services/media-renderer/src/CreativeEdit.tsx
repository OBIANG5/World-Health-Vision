import React from "react";
import {AbsoluteFill, Audio, Img, OffthreadVideo, Sequence, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig} from "remotion";
import {TransitionSeries, linearTiming} from "@remotion/transitions";
import {fade} from "@remotion/transitions/fade";
import {slide} from "@remotion/transitions/slide";

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
  template:"documentary"|"kinetic"|"evidence"|"number"|"clean_video";
  title?:string;
  subtitle?:string;
  eyebrow?:string;
  footnote?:string;
  media?:CreativeMedia|null;
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
  const url=staticFile(shot.media.src);
  return <AbsoluteFill style={{overflow:"hidden"}}>
    {shot.media.kind==="image"
      ? <Img src={url} style={style}/>
      : <OffthreadVideo src={url} muted trimBefore={shot.media.trimBefore??0} style={style}/>}
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
  const opacity=reveal(frame,0,17);
  const startTextY=interpolate(move,[0,1],[70,0],clamp);
  const subtitleFade=reveal(frame,15,18);
  const glow=shot.media?"0 5px 38px rgba(0,0,0,.48)":"none";
  return <AbsoluteFill style={{background:globalStyle.background,overflow:"hidden",fontFamily:globalStyle.editorialFont}}>
    <MediaPlate shot={shot}/>
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
              fontSize:numeric?166:kinetic?104:76,
              lineHeight:numeric?.94:kinetic?1.04:1.09,
              fontWeight:numeric?850:790,
              letterSpacing:numeric?"-0.065em":"-0.04em",
              whiteSpace:"pre-line",overflowWrap:"break-word",
              opacity,transform:"translateY("+startTextY+"px)",
              textShadow:glow,
            }}>{shot.title}</div>
          </div>}
          {shot.subtitle&&<div style={{
            fontSize:kinetic?39:33,fontWeight:460,lineHeight:1.34,
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
      <Audio src={staticFile(props.narration.src)} volume={props.narration.volume??1}/>
    </Sequence>}
    {props.soundtrack&&<Audio src={staticFile(props.soundtrack.src)} volume={props.soundtrack.volume??.1}/>}
    {props.brandOutro&&<Sequence from={timelineFrames} durationInFrames={props.brandOutro.durationFrames} name="G0 original ou signature fournie">
      <AbsoluteFill><OffthreadVideo src={staticFile(props.brandOutro.src)} muted style={{width:"100%",height:"100%",objectFit:"cover"}}/></AbsoluteFill>
    </Sequence>}
  </AbsoluteFill>;
};
