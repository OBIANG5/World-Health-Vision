import React from "react";
import {AbsoluteFill,Img,Video,Sequence,Audio,Easing,interpolate,spring,staticFile,useCurrentFrame,useVideoConfig} from "remotion";

/**
 * Script-locked newsroom edit for World-Vision #001 / Shenzhen.
 *
 * This is a composition INSIDE the pre-existing Remotion engine, not another
 * video editor. Exactly the existing official logo PNG is used.
 * D00-v6 is an immutable asset and must be installed from the original;
 * DO NOT synthesize a lookalike Earth or replace it with the rejected CGI.
 *
 * A final voice file is required for publication; silent proof is not final.
 */
export const SUMMIT_FPS=30;
export const SUMMIT_SECONDS=43;
export const SUMMIT_FRAMES=SUMMIT_FPS*SUMMIT_SECONDS;
const W=1080,H=1920;
const S={
  ink:"#031126",deep:"#061b38",navy:"#082c52",blue:"#165a93",cyan:"#4eddf8",
  ice:"#a9edfa",white:"#f8fcff",muted:"#b5d3e3",soft:"rgba(174,226,247,.24)",
  panel:"rgba(5,23,44,.85)",border:"rgba(89,211,244,.33)",
} as const;
const clamp={extrapolateLeft:"clamp",extrapolateRight:"clamp"} as const;
const ease=Easing.bezier(.22,1,.36,1);
const P=(n:number)=>Math.max(0,Math.min(1,n));
const brand=staticFile("brand/world-vision-official.png");
const rootAssets="episodes/summit-2026/";

const SCENE_PLAN=[
  {id:"hook",start:0,end:4.5,label:"TROIS PUISSANCES NUCLÉAIRES"},
  {id:"globe",start:4.5,end:7.6,label:"WORLD-VISION"},
  {id:"location",start:7.6,end:12.5,label:"SHENZHEN · CHINE"},
  {id:"nuclear",start:12.5,end:20.4,label:"DÉSARMEMENT NUCLÉAIRE"},
  {id:"beijing",start:20.4,end:26.6,label:"PÉKIN RESTE RÉTICENT"},
  {id:"agenda",start:26.6,end:33.8,label:"L'ORDRE DU JOUR"},
  {id:"uncertainty",start:33.8,end:40,label:"AUCUN ACCORD ATTENDU"},
  {id:"outro",start:40,end:43,label:"VOIR LE MONDE, LE COMPRENDRE"},
] as const;
export const scenePlan=SCENE_PLAN;

/* All phrases come verbatim from the user's selected script V1. Times are
 * editorial PRE-ALIGNMENT: real audio must be word-aligned before release. */
export const captionPlan=[
  {start:0,end:2.25,t:"Trois puissances nucléaires. Une même table."},
  {start:2.25,end:4.5,t:"Et une rencontre inédite."},
  {start:4.5,end:8.65,t:"Jeudi 19 novembre, Donald Trump, Vladimir Poutine et Xi Jinping"},
  {start:8.65,end:12.5,t:"doivent se réunir à Shenzhen, en Chine."},
  {start:12.5,end:15.65,t:"Au cœur des discussions : réduire les arsenaux nucléaires."},
  {start:15.65,end:20.4,t:"Le dernier grand traité entre Washington et Moscou a expiré en février."},
  {start:20.4,end:23.0,t:"Trump veut maintenant associer Pékin,"},
  {start:23.0,end:26.6,t:"qui reste réticent."},
  {start:26.6,end:30.4,t:"La guerre en Iran devrait aussi être abordée."},
  {start:30.4,end:33.8,t:"Mais selon Washington, pas celle en Ukraine."},
  {start:33.8,end:37.2,t:"Et attention : aucun accord n’est attendu pour le moment."},
  {start:37.2,end:40,t:"Alors, véritable tournant diplomatique, ou simple démonstration de puissance ?"},
  {start:40,end:43,t:"World-Vision. Voir le monde, le comprendre."},
] as const;

const enter=(frame:number,fps:number,delay=0)=>{
  const f=Math.max(0,frame-delay);
  return spring({frame:f,fps,config:{damping:23,stiffness:115,mass:.85}});
};
const scale=(f:number,duration:number,from=1,to=1.085)=>
  interpolate(f,[0,Math.max(1,duration)],[from,to],clamp);

const Base:React.FC<{children:React.ReactNode;subtle?:boolean}> =({children,subtle=false})=><AbsoluteFill style={{
  color:S.white,background:subtle?S.deep:S.ink,
  fontFamily:"Inter,Arial,Helvetica,sans-serif",overflow:"hidden"}}>
  <AbsoluteFill style={{background:"radial-gradient(ellipse at 58% 33%,rgba(24,95,153,.35),transparent 57%),linear-gradient(160deg,rgba(4,39,84,.12),transparent 56%,rgba(2,7,20,.56))"}}/>
  <AbsoluteFill style={{opacity:.05,backgroundImage:"repeating-linear-gradient(0deg,transparent,transparent 42px,rgba(213,246,255,.22) 43px)"}}/>
  {children}
</AbsoluteFill>;

// Keep archive/licensing attribution in external metadata and published caption,
// never burn technical or production credits into the master picture.
const Credit:React.FC<{text:string}>=()=>null;

const Logo:React.FC<{large?:boolean}>=({large=false})=><div style={{
  position:"absolute",left:73,top:83,zIndex:60,display:"flex",alignItems:"center",gap:16,
  filter:"drop-shadow(0px 6px 22px rgba(0,0,0,.42))"}}>
  <div style={{width:large?148:112,height:large?96:73,
    background:"#f7f4ee",overflow:"hidden",borderRadius:10,
    display:"flex",alignItems:"center",justifyContent:"center"}}>
    <Img src={brand} style={{width:"100%",height:"100%",objectFit:"contain"}}/>
  </div>
  <div>
    <div style={{fontSize:large?39:32,fontWeight:950,letterSpacing:1.5,lineHeight:1,color:S.white}}>WORLD–VISION</div>
    <div style={{fontSize:large?19:16,letterSpacing:2.6,color:S.ice,marginTop:10}}>VOIR LE MONDE, LE COMPRENDRE.</div>
  </div>
</div>;

const Barcode:React.FC<{topic:string;progress:number}> =({topic,progress})=><div style={{
  position:"absolute",left:76,right:180,bottom:239,zIndex:50}}>
  <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12,
    fontSize:18,fontWeight:800,letterSpacing:2.3,color:S.ice}}>
    <span>GÉOPOLITIQUE / 14 NOV. 2026</span><span>{topic}</span>
  </div>
  <div style={{height:3,background:"rgba(177,218,238,.24)",borderRadius:9,overflow:"hidden"}}>
    <div style={{width:`${P(progress)*100}%`,background:S.cyan,height:"100%"}}/>
  </div>
</div>;

const Photo:React.FC<{name:string;from?:number;to?:number;shade?:boolean}> =
 ({name,from=1.04,to=1.11,shade=true})=>{
 const f=useCurrentFrame();const {durationInFrames}=useVideoConfig();
 return <AbsoluteFill>
   <Img src={staticFile(rootAssets+name)} style={{width:"100%",height:"100%",objectFit:"cover",
     objectPosition:"center 19%",filter:"saturate(.76) contrast(1.10) brightness(.78)",
     transform:`scale(${scale(f,durationInFrames,from,to)})`}}/>
   {shade&&<AbsoluteFill style={{background:"linear-gradient(180deg,rgba(2,11,31,.20) 0%,rgba(3,13,27,.27) 36%,rgba(2,12,30,.88) 83%,#031126 100%)"}}/>}
 </AbsoluteFill>;
};

const BlueLine:React.FC<{from?:number;length?:number}>=({from=0,length=660})=>{
 const f=useCurrentFrame();
 return <div style={{height:6,width:interpolate(f,[from,from+18],[0,length],clamp),
  background:S.cyan,boxShadow:"0 0 24px rgba(56,211,250,.50)",marginTop:33}}/>;
};

const AnimatedHeadline:React.FC<{lines:string[];size?:number;top?:number;accent?:number}> =
 ({lines,size=94,top=580,accent=0})=>{
 const f=useCurrentFrame();const {fps}=useVideoConfig();
 return <div style={{position:"absolute",left:78,right:160,top}}>
 {lines.map((l,i)=>{const p=enter(f,fps,5+i*5);
 return <div key={i} style={{fontSize:size,fontWeight:950,
   letterSpacing:-2.6,lineHeight:1.02,marginBottom:11,
   color:i===accent?S.cyan:S.white,
   opacity:p,transform:`translateY(${(1-p)*76}px)`,textShadow:"0 4px 16px rgba(0,10,27,.78)"}}>{l}</div>;})}
 </div>;
};

const Hook:React.FC=()=>{
 const f=useCurrentFrame();
 const portraits=[{name:"trump.jpg",label:"TRUMP"},{name:"putin.jpg",label:"POUTINE"},{name:"xi.jpg",label:"XI JINPING"}];
 return <Base>
   <div style={{position:"absolute",left:0,right:0,top:340,height:960,display:"flex",gap:5}}>
      {portraits.map((p,i)=>{const pr=interpolate(f,[5+i*4,19+i*4],[0,1],clamp);
       return <div key={p.label} style={{width:"33.333%",height:"100%",position:"relative",overflow:"hidden",
         opacity:pr,transform:`translateY(${(1-pr)*110}px)`}}>
          <Img src={staticFile(rootAssets+p.name)} style={{width:"100%",height:"100%",objectFit:"cover",objectPosition:"center top",
            filter:"saturate(.75) contrast(1.10) brightness(.90)",
            transform:`scale(${scale(f,135,1.1,1.17)})`}}/>
          <div style={{position:"absolute",bottom:0,left:0,right:0,height:350,
            background:"linear-gradient(transparent,rgba(2,12,29,.94))"}}/>
          <div style={{position:"absolute",left:17,bottom:260,fontWeight:950,fontSize:26,letterSpacing:1,
            textShadow:"0 2px 8px #000"}}>{p.label}</div>
       </div>})}
   </div>
   <AnimatedHeadline lines={["TROIS PUISSANCES.","UNE SEULE TABLE."]} size={74} top={1200} accent={1}/>
    <Logo/>
   <Credit text="Portraits d'archives · Maison-Blanche, Kremlin, Maison-Blanche (2024–2025)"/>
   <Barcode topic="LE SOMMET ANNONCÉ" progress={f/SUMMIT_FRAMES}/>
 </Base>;
};

const Globe:React.FC=()=>{
 const f=useCurrentFrame();
 return <Base>
   {/*
     Exact 3.1s D00-v6 art film already rendered from original PNG, verified
     SHA-256 95c47d... and archived as video in Canva. NOT a rebuilt Earth.
   */}
   <AbsoluteFill>
     <Video src={staticFile(rootAssets+"segment02-original-d00.mp4")} muted/>
   </AbsoluteFill>
   <AbsoluteFill style={{background:"linear-gradient(180deg,rgba(1,8,22,.62),transparent 25%,transparent 71%,rgba(2,11,28,.76))"}}/>
   <Logo/>
   <div style={{position:"absolute",left:79,bottom:480,right:180,fontSize:62,
     color:S.white,fontWeight:950,lineHeight:1.04,textShadow:"0 3px 16px #010f23"}}>
     LE MONDE <span style={{color:S.cyan}}>RETIENT SON SOUFFLE.</span>
   </div>
   <Credit text="Identité D00-v6 originale · mouvement cinématographique préservé"/>
   <Barcode topic="SIGNATURE WORLD-VISION" progress={(f+135)/SUMMIT_FRAMES}/>
 </Base>;
};

const Shenzhen:React.FC=()=>{
 return <AbsoluteFill style={{background:S.ink}}>
   {/*
      Genuine NASA/Natural Earth geographic locator S03, 147 frames at 30 fps.
      The source is an independently reviewed MP4, never a drawn fake map.
      Its GUI already contains the original G0 logo (pixel-identical asset).
   */}
   <Video src={staticFile(rootAssets+"segment03-shenzhen-july-v3-clean-4p9s.mp4")} muted/>
 </AbsoluteFill>;
};

// S04 is an immutable clean-plate MP4: no draft texts, debug status or
// production labels may be drawn on top; master uses this verified file only.
const Nuclear:React.FC=()=><AbsoluteFill style={{background:S.ink}}>
  <Video src={staticFile(rootAssets+"segment04-new-start-v3-clean-7p9s.mp4")} muted/>
</AbsoluteFill>;

const Beijing:React.FC=()=>{
 const f=useCurrentFrame();
 return <Base>
  <Photo name="xi.jpg" from={1.06} to={1.17}/>
  <Logo/>
  <div style={{position:"absolute",top:510,left:76,right:180,fontWeight:900,fontSize:30,
    color:S.ice,letterSpacing:5}}>LA DIFFICULTÉ DES NÉGOCIATIONS</div>
  <AnimatedHeadline lines={["PÉKIN","RESTE RÉTICENT."]} top={780} size={99} accent={1}/>
  <div style={{position:"absolute",top:1200,left:78,width:820,fontSize:34,lineHeight:1.3,fontWeight:700}}>Washington voudrait associer la Chine à de futures discussions nucléaires.</div>
  <Credit text="Xi Jinping · portrait d'archives, 2024 · Maison-Blanche / domaine public"/>
  <Barcode topic="CHINE / ARMEMENTS" progress={(f+612)/SUMMIT_FRAMES}/>
 </Base>;
};

const Agenda:React.FC=()=>{
 const f=useCurrentFrame(),p=enter(f,30,14);
 return <Base subtle>
  <Logo/>
  <div style={{position:"absolute",left:78,top:450,letterSpacing:5,fontSize:28,color:S.cyan,fontWeight:900}}>À L'AGENDA ANNONCÉ</div>
  <div style={{position:"absolute",left:78,right:170,top:645,display:"flex",flexDirection:"column",gap:28}}>
    {[{h:"IRAN",sub:"Pourrait être abordé",c:S.cyan},
      {h:"UKRAINE",sub:"Pas prévue selon Washington",c:S.white}].map((x,i)=>{
      const z=interpolate(f,[5+i*14,20+i*14],[0,1],clamp);
      return <div key={x.h} style={{padding:"34px 44px",border:"1px solid "+S.border,
        borderLeft:"9px solid "+x.c,background:S.panel,
        opacity:z,transform:`translateX(${(1-z)*85}px)`}}>
        <div style={{fontWeight:950,fontSize:92,letterSpacing:-1.5,color:x.c}}>{x.h}</div>
        <div style={{fontSize:28,color:S.muted,marginTop:9,fontWeight:720}}>{x.sub}</div>
      </div>})}
  </div>
  <div style={{position:"absolute",top:1370,left:78,width:820,fontSize:28,
    color:S.ice,opacity:p}}>IL S'AGIT DU PROGRAMME PRÉSENTÉ PAR LES ÉTATS-UNIS.</div>
  <Credit text="Source : déclaration américaine rapportée par Reuters, AP et AFP"/>
  <Barcode topic="IRAN / UKRAINE" progress={(f+798)/SUMMIT_FRAMES}/>
 </Base>;
};

const Uncertainty:React.FC=()=>{
 const f=useCurrentFrame();
 return <Base>
  <Photo name="trump.jpg" from={1.04} to={1.1}/>
  <Logo/>
  <div style={{position:"absolute",left:76,top:555,fontWeight:950,
    fontSize:30,letterSpacing:3,color:S.ice}}>À CE STADE</div>
  <AnimatedHeadline lines={["AUCUN ACCORD","N'EST ATTENDU."]} top={760} size={84} accent={0}/>
  <div style={{position:"absolute",left:77,top:1170,right:185,fontSize:35,
    color:S.white,fontWeight:780,lineHeight:1.32}}>
    Tournant diplomatique ou simple démonstration de puissance ?
  </div>
  <Credit text="Évaluation de responsables américains · la réunion est annoncée, pas encore tenue"/>
  <Barcode topic="INCERTITUDE" progress={(f+1014)/SUMMIT_FRAMES}/>
 </Base>;
};

const Outro:React.FC=()=>{
 const f=useCurrentFrame(),p=enter(f,30,3);
 return <Base>
  <Img src={staticFile(rootAssets+"eye-earth-d00-v6.png")} style={{
    position:"absolute",left:-70,top:190,width:1220,height:1400,objectFit:"contain",
    transform:`scale(${scale(f,90,1.0,1.05)})`,
    opacity:.93}}/>
  <AbsoluteFill style={{background:"linear-gradient(180deg,rgba(2,12,30,.55),transparent 35%,rgba(3,14,32,.60) 72%,#031126 100%)"}}/>
  <div style={{position:"absolute",left:80,right:80,bottom:390,
    textAlign:"center",opacity:p,transform:`translateY(${(1-p)*45}px)`}}>
    <div style={{fontSize:73,fontWeight:950,letterSpacing:1,color:S.white}}>WORLD–VISION</div>
    <BlueLine length={600}/>
    <div style={{fontSize:34,fontWeight:730,marginTop:22,color:S.ice}}>VOIR LE MONDE, LE COMPRENDRE.</div>
  </div>
  <Logo/>
  <Credit text="Images d'archives et illustration de marque · ne représente pas un sommet déjà tenu"/>
  <Barcode topic="WORLD-VISION" progress={1}/>
 </Base>;
};

const CaptionOverlay:React.FC=()=>{
 const frame=useCurrentFrame(),s=frame/SUMMIT_FPS;
 const c=captionPlan.find(x=>s>=x.start&&s<x.end);
 const overLocator=s>=7.6&&s<12.5;
 if(!c)return null;
 const progress=P((s-c.start)/.34),f=interpolate(progress,[0,1],[15,0],clamp);
 return <div style={{position:"absolute",zIndex:82,left:75,right:182,bottom:overLocator?1430:354,
   display:"flex",justifyContent:"center",pointerEvents:"none"}}>
  <div style={{background:"rgba(1,12,29,.92)",border:"1px solid rgba(68,202,243,.45)",
   padding:"19px 24px 21px",borderRadius:11,
   fontSize:overLocator?31:c.t.length>78?29:c.t.length>52?32:37,fontWeight:830,
   lineHeight:1.27,textAlign:"center",color:"#fff",
   textShadow:"0 2px 4px #001020",
   transform:`translateY(${f}px)`,opacity:progress,
   boxShadow:"0 14px 45px rgba(0,0,0,.42)"}}>{c.t}</div>
 </div>;
};

export type SummitProps={voiceFilename?:string|null};
export const WorldVisionSummit2026:React.FC<SummitProps>=({voiceFilename})=>{
 return <AbsoluteFill style={{background:S.ink}}>
   {SCENE_PLAN.map(scene=><Sequence key={scene.id} name={scene.id}
     from={Math.round(scene.start*SUMMIT_FPS)}
     durationInFrames={Math.round((scene.end-scene.start)*SUMMIT_FPS)}>
     {scene.id==="hook"?<Hook/>:
      scene.id==="globe"?<Globe/>:
      scene.id==="location"?<Shenzhen/>:
      scene.id==="nuclear"?<Nuclear/>:
      scene.id==="beijing"?<Beijing/>:
      scene.id==="agenda"?<Agenda/>:
      scene.id==="uncertainty"?<Uncertainty/>:<Outro/>}
   </Sequence>)}
   <CaptionOverlay/>
   {voiceFilename&&<Audio src={staticFile(voiceFilename)} volume={1}/>}

 </AbsoluteFill>;
};
