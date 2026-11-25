import type {CSSProperties} from "react";
import {AbsoluteFill,Img,useCurrentFrame} from "remotion";
import type {CreativeShot,CreativeEditProps} from "./CreativeEdit";
import {resolveCreativeSource} from "./CreativeEdit";
import {photoTrackPose} from "./photo-motion-tracks.mjs";
import {photoComparisonPose} from "./photo-comparison-motion.mjs";
type Style=Required<NonNullable<CreativeEditProps["visualStyle"]>>;
const ink="#f5f2eb",dark="#15191b",paper="#f2eee5",orange="#cc734d";
const clamp=(v:number)=>Math.max(0,Math.min(1,v));
/** Three opt-in layouts for a real sourced, nonnegative comparison. All source
 * values stay fixed; motion shows magnitude, never invented intermediate data.
 * Bottom 500px reserved for the existing mobile word-caption rail. */
export function EditorialComparison({shot,globalStyle,enterOverlapFrames}:{shot:CreativeShot;globalStyle:Style;enterOverlapFrames:number}){
  const frame=useCurrentFrame(),f=Math.max(0,frame-enterOverlapFrames);
  const ph=shot.photo!,c=ph.comparison!,layout=ph.editorialLayout;
  const pose=photoTrackPose(ph,f,shot.durationFrames),cmp=photoComparisonPose(c,f);
  const value=(n:number)=>new Intl.NumberFormat(c.locale,{minimumFractionDigits:c.precision,maximumFractionDigits:c.precision}).format(n);
  const number=(n:number)=>value(n)+" "+c.unit;
  const src=resolveCreativeSource(shot.media!.src);
  const appear=clamp(f/14),fade=shot.transitionAfter!=="cut"&&shot.transitionFrames?clamp((shot.durationFrames-frame)/shot.transitionFrames):1;
  const img=(top:number,height:number,shade=false)=><div style={{position:"absolute",top,left:0,width:1080,height,overflow:"hidden"}}>
    <Img src={src} style={{width:"100%",height:"100%",objectFit:"cover",objectPosition:"50% 46%",transform:"translate("+pose.camera.panX+"px,"+pose.camera.panY+"px) scale("+pose.camera.scale+")"}}/>
    {shade&&<AbsoluteFill style={{background:"linear-gradient(180deg,rgba(0,0,0,.68),transparent 42%,rgba(0,0,0,.12) 65%,#15191b 100%)"}}/>}
  </div>;
  const pos=(top:number):CSSProperties=>({position:"absolute",top,left:92,right:164});
  const label:CSSProperties={fontSize:29,fontWeight:700,letterSpacing:".07em",textTransform:"uppercase",lineHeight:1.2};
  const source=(top:number,color:string)=><div data-wv-photo-comparison-source="true" style={{...pos(top),fontSize:27,lineHeight:1.25,color}}>
    {c.source.publisher} · {c.source.dataset} · {c.source.asOf}
    {shot.media?.credit&&<div style={{fontSize:24,marginTop:5}}>{shot.media.credit} · image d'archives</div>}
  </div>;
  const headline=(top:number,color:string,size:number)=><div data-wv-photo-heading="true" style={{...pos(top),color,opacity:shot.titleFrameZero?1:appear}}>
    <div style={{...label,marginBottom:15}}>{shot.eyebrow}</div>
    <div data-wv-title={shot.id} style={{fontSize:size,fontWeight:800,letterSpacing:"-.045em",lineHeight:1.02,whiteSpace:"pre-line"}}>{shot.title}</div>
  </div>;
  return <AbsoluteFill data-wv-photo-multilayer="true" data-wv-editorial-layout={layout} style={{background:dark,color:ink,fontFamily:globalStyle.editorialFont,overflow:"hidden",opacity:fade}}>
    {layout==="hero"?<>
      {img(0,1020,true)}
      <AbsoluteFill style={{height:690,background:"linear-gradient(180deg,#15191bf2 0%,#15191bc9 50%,transparent 100%)"}}/>
      <div style={{...pos(164),color:ink,...label}}>{shot.eyebrow}</div>
      <div data-wv-title={shot.id} style={{...pos(235),fontSize:230,fontWeight:800,letterSpacing:"-.078em",lineHeight:1}}>{shot.title}</div>
      <div style={{...pos(480),fontSize:48,fontWeight:650,letterSpacing:"-.025em"}}>{shot.subtitle}</div>
      <div data-wv-photo-comparison="true" style={{...pos(1020),opacity:cmp.panelProgress,transform:"translateY("+Math.round(20*(1-cmp.panelProgress))+"px)"}}>
        <div style={{...label,color:"#ccc8c0",marginBottom:14}}>{c.title}</div>
        <div style={{display:"flex",alignItems:"center",gap:25}}>
          <div style={{flex:1}}><div style={{fontSize:31,color:"#ccc8c0"}}>{c.first.label}</div><div style={{fontSize:86,fontWeight:750,letterSpacing:"-.055em"}}>{number(c.first.value)}</div></div>
          <div style={{fontSize:68,color:"#e5b29a",opacity:cmp.reveal}}>→</div>
          <div style={{flex:1}}><div style={{fontSize:31,color:"#ccc8c0"}}>{c.second.label}</div><div style={{fontSize:86,fontWeight:800,letterSpacing:"-.055em"}}>{number(c.second.value)}</div></div>
        </div>
      </div>
      {source(1255,"#c9c6c0")}
    </>:layout==="split"?<>
      {img(0,565)}
      <div style={{position:"absolute",top:0,height:565,left:0,right:0,background:"linear-gradient(180deg,rgba(0,0,0,.7),transparent 55%)"}}/>
      <div style={{...pos(155),...label,color:ink}}>{shot.eyebrow}</div>
      <div style={{position:"absolute",top:535,height:825,left:0,right:0,background:paper,color:dark}}>
        <div data-wv-title={shot.id} style={{position:"absolute",left:92,right:164,top:45,fontSize:77,fontWeight:800,letterSpacing:"-.05em",lineHeight:1.04,opacity:appear}}>{shot.title}</div>
        <div data-wv-photo-comparison="true" style={{position:"absolute",left:92,right:164,top:255,opacity:cmp.panelProgress}}>
          <div style={{fontSize:29,fontWeight:650,marginBottom:22}}>{c.title}</div>
          {[c.first,c.second].map((v,i)=><div key={i} style={{marginBottom:22}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"baseline",gap:18}}>
              <span style={{fontSize:37,fontWeight:650}}>{v.label}</span><strong style={{fontSize:87,lineHeight:1.05,letterSpacing:"-.055em",color:dark}}>{number(v.value)}</strong>
            </div>
            <div style={{position:"relative",height:20,background:"#d9d3c7",marginTop:8}}>
              <div style={{height:20,width:(cmp.bars[i].width*100)+"%",background:i===0?orange:dark}}/>
              {v.value===0&&<div style={{position:"absolute",top:-3,left:0,width:5,height:26,background:dark}}/>}
            </div>
          </div>)}
          <div style={{display:"flex",justifyContent:"space-between",fontSize:23,color:"#57554e"}}><span>0</span><span>{number(c.domain.max)}</span></div>
        </div>
      </div>
      {source(1250,"#514d47")}
    </>:<>
      {img(0,780,true)}
      {headline(166,ink,75)}
      <div data-wv-photo-comparison="true" style={{...pos(760),opacity:cmp.panelProgress}}>
        <div style={{...label,color:"#ccc8c0",marginBottom:30}}>{c.title}</div>
        <div style={{display:"flex",alignItems:"flex-end",justifyContent:"space-around",height:365}}>
          {[c.first,c.second].map((v,i)=><div key={i} style={{width:"42%",height:"100%",display:"flex",flexDirection:"column",justifyContent:"flex-end",alignItems:"center"}}>
            <div style={{fontSize:72,fontWeight:800,letterSpacing:"-.06em",color:i===1?"#e6a180":ink,marginBottom:13}}>{number(v.value)}</div>
            <div style={{height:Math.round(255*cmp.bars[i].width),width:"78%",background:i===1?orange:"#d6d1c5"}}/>
            <div style={{fontSize:30,fontWeight:650,marginTop:15,textAlign:"center"}}>{v.label}</div>
          </div>)}
        </div>
        <div style={{fontSize:24,color:"#c9c6c0",textAlign:"center",marginTop:15}}>Échelle commune : 0–{number(c.domain.max)}</div>
      </div>
      <div style={{...pos(1245),fontSize:35,lineHeight:1.15,fontWeight:650,opacity:cmp.reveal}}>{shot.subtitle}</div>
      {source(1315,"#c9c6c0")}
    </>}
  </AbsoluteFill>;
}
