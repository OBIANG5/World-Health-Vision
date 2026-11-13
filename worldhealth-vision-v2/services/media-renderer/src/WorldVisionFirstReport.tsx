import React from "react";
import {
  AbsoluteFill,
  Audio,
  Easing,
  interpolate,
  Sequence,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";

/**
 * First fact-checked World-Vision report.
 * A separate Remotion composition using the actual eye/globe brand geometry.
 * No photographed or AI-imagined scenes are presented as real COP31 footage.
 */
export type FirstReportScene = {
  id: string;
  label: string;
  headline: string;
  eyebrow: string;
  subline: string;
  visual: string;
  claim_ids: string[];
};

export type FirstReportStory = {
  story_id: string;
  title: string;
  subtitle: string;
  event_date: string;
  narration: string;
  sources: Array<{id:string;name:string;url:string}>;
  scenes: FirstReportScene[];
};

export type FirstReportProps = {
  story: FirstReportStory;
  durationSeconds: number;
  audioFilename?: string | null;
  renderProfile?: "canonical_newsroom_v1" | "tiktok_api_clean_v1";
};

const C = {
  bg: "#051625",
  deep: "#03111d",
  blue: "#06365d",
  cyan: "#59dafa",
  sky: "#21a9e8",
  white: "#f7fbfd",
  muted: "#b6cbd5",
  line: "rgba(133,215,245,0.25)",
  gold: "#f5e5a3", // only sparse typographic emphasis, never streaks or sparkle
};

const clamp = {extrapolateLeft:"clamp" as const,extrapolateRight:"clamp" as const};

const FadeUp: React.FC<{children:React.ReactNode;offset?:number;delay?:number;style?:React.CSSProperties}> =
  ({children,offset=70,delay=0,style}) => {
    const f=useCurrentFrame();
    const {fps}=useVideoConfig();
    const p=spring({fps,frame:Math.max(0,f-delay),config:{damping:22,mass:0.8,stiffness:108}});
    return <div style={{opacity:interpolate(p,[0,1],[0,1],clamp),
      transform:`translateY(${interpolate(p,[0,1],[offset,0],clamp)}px)`,...style}}>{children}</div>;
};

const EyeGlobe:React.FC<{size?:number;muted?:boolean}> = ({size=120,muted=false}) =>
  <svg width={size} height={size*0.65} viewBox="0 0 200 130" role="img" aria-label="World-Vision eye globe"
    style={{display:"block",opacity:muted?0.3:1}}>
    <defs><linearGradient id="wv-eyeglobe" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stopColor="#81e2ff"/><stop offset="100%" stopColor="#1475b1"/></linearGradient></defs>
    <path d="M13 67 C 54 15 142 14 187 67 C 143 120 54 118 13 67 Z"
      fill="none" stroke="url(#wv-eyeglobe)" strokeWidth="9" strokeLinejoin="round"/>
    <circle cx="100" cy="67" r="47" fill="#06436f" stroke="#e4f5fb" strokeWidth="7"/>
    <ellipse cx="100" cy="67" rx="19" ry="44" fill="none" stroke="#5ec4ed" strokeOpacity=".7" strokeWidth="3"/>
    <path d="M56 67H144M68 44H132M68 90H132" stroke="#5ec4ed" strokeOpacity=".68" strokeWidth="3" fill="none"/>
    <path d="M87 24l-12 14 11 15 12-4 12 18 9-3-4 22 16 8-6 16-22 2-3-16-13-14-13-18-18-8 7-22 11-10z"
      fill="#4eb8e0" opacity=".70"/>
  </svg>;

const OrbitWorld:React.FC<{progress:number;stage:string}> = ({progress,stage}) => {
  const dots=Array.from({length:72},(_,i)=>{
    const a=(i*137.5)*Math.PI/180;
    const r=210+((i*29)%160);
    const x=540+Math.cos(a)*r;
    const y=750+Math.sin(a)*r*0.8;
    return {x,y,i};
  });
  return <svg width="1080" height="1920" viewBox="0 0 1080 1920" style={{position:"absolute",inset:0}}>
    <defs>
      <radialGradient id="wv-globe-glow"><stop offset="0%" stopColor="#237ba8" stopOpacity=".6"/><stop offset="67%" stopColor="#0b3d63" stopOpacity=".18"/><stop offset="100%" stopColor="#051625" stopOpacity="0"/></radialGradient>
      <linearGradient id="wv-gridline" x1="0" y1="0" x2="1" y2="1"><stop stopColor="#75e1f7" stopOpacity=".65"/><stop offset="100%" stopColor="#0064a4" stopOpacity=".2"/></linearGradient>
    </defs>
    <rect x="0" y="0" width="1080" height="1920" fill={C.bg}/>
    <circle cx="580" cy="775" r="590" fill="url(#wv-globe-glow)" />
    <circle cx="540" cy="750" r="390" fill="none" stroke="url(#wv-gridline)" strokeWidth="4" opacity=".65"/>
    <circle cx="540" cy="750" r="345" fill="none" stroke="#2a779b" strokeWidth="2" opacity=".6"/>
    <ellipse cx="540" cy="750" rx="205" ry="390" fill="none" stroke="#17608d" strokeWidth="3" opacity=".65"/>
    <ellipse cx="540" cy="750" rx="343" ry="390" fill="none" stroke="#17608d" strokeWidth="2" opacity=".42"/>
    <ellipse cx="540" cy="750" rx="390" ry="180" fill="none" stroke="#267daa" strokeWidth="2" opacity=".55"/>
    <ellipse cx="540" cy="750" rx="390" ry="285" fill="none" stroke="#2574a0" strokeWidth="2" opacity=".38"/>
    <path d="M150 750 H930" stroke="#2574a0" strokeWidth="2" strokeDasharray="8 12" opacity=".5"/>
    <circle cx="540" cy="750" r="412" fill="none" stroke="#54c4ea" strokeWidth="3"
      strokeDasharray="80 55 15 60 115 80" strokeDashoffset={-progress*170} opacity=".64"/>
    {dots.map(p=><circle key={p.i} cx={p.x} cy={p.y} r={p.i%9===0?5:2.5}
        fill="#7ae0fa" opacity={0.2+(p.i%7)*0.06}/>)}
    {stage==="early_action" && <><circle cx="540" cy="750" r={145+progress*40} fill="none" stroke="#77e7f7" strokeWidth="4" opacity=".6"/>
      <path d="M414 755l83 90 166-188" stroke="#91eff2" strokeWidth="15" strokeLinecap="round" strokeLinejoin="round" fill="none"/></>}
  </svg>;
};

const Count:React.FC<{primary:string;secondary:string;label:string}> = ({primary,secondary,label}) => {
  const frame=useCurrentFrame();
  const {fps}=useVideoConfig();
  const shine=interpolate(frame,[0,fps*2],[0,1],clamp);
  return <div style={{margin:"72px 0 8px",width:790,maxWidth:790,textAlign:"left"}}>
    <FadeUp delay={6}>
      <div style={{fontSize:202,lineHeight:0.95,letterSpacing:-7,fontWeight:950,
        color:C.white,textShadow:"0 20px 100px rgba(38,177,239,.28)"}}>
        {primary}
      </div>
    </FadeUp>
    <FadeUp delay={11}>
      <div style={{fontSize:secondary.length>8?78:97,lineHeight:1.05,
        letterSpacing:-2.6,fontWeight:920,color:C.white,
        whiteSpace:"nowrap",maxWidth:790}}>
        {secondary}
      </div>
    </FadeUp>
    <div style={{marginTop:45,width:interpolate(shine,[0,1],[0,550],clamp),
      height:7,background:C.cyan,borderRadius:4}}/>
    <FadeUp delay={15}><div style={{fontWeight:800,fontSize:26,letterSpacing:4,color:C.cyan,marginTop:23}}>{label}</div></FadeUp>
  </div>;
};

const NewsScene:React.FC<{scene:FirstReportScene;story:FirstReportStory;index:number;durationInFrames:number;clean:boolean}> =
 ({scene,story,index,durationInFrames,clean}) => {
  const f=useCurrentFrame();
  const progress=interpolate(f,[0,Math.max(1,durationInFrames)],[0,1],clamp);
  const year=story.event_date.slice(0,4);
  const isBigNumber=scene.visual==="money_goal"||scene.visual==="people_goal";
  return <AbsoluteFill style={{overflow:"hidden",background:C.bg,color:C.white,
    fontFamily:"Inter,Arial,Helvetica,sans-serif"}}>
    <OrbitWorld progress={progress} stage={scene.visual}/>
    <AbsoluteFill style={{background:"linear-gradient(180deg,rgba(2,13,26,.75) 0%,rgba(2,13,26,.13) 43%,rgba(2,13,26,.50) 71%,rgba(1,13,22,.95) 100%)"}}/>
    <div style={{position:"absolute",left:80,top:85,right:175,display:"flex",alignItems:"center",gap:21}}>
      {!clean && <EyeGlobe size={110}/>}
      <div style={{flex:1}}>
        {!clean && <div style={{fontWeight:950,fontSize:38,letterSpacing:2,color:C.white}}>WORLD—VISION</div>}
        <div style={{fontSize:18,letterSpacing:3,fontWeight:700,color:C.cyan,marginTop:10}}>
          {scene.eyebrow} <span style={{opacity:.6}}> / {year}</span>
        </div>
      </div>
    </div>
    <div style={{position:"absolute",left:80,right:155,top:isBigNumber?515:600}}>
      <FadeUp delay={2}><div style={{fontSize:24,fontWeight:800,letterSpacing:7,color:C.cyan,marginBottom:36}}>
        {String(index+1).padStart(2,"0")} / 07 — {scene.label}
      </div></FadeUp>
      {scene.visual==="money_goal" ? <Count primary="+3" secondary="MILLIARDS $" label="FINANCEMENTS VISÉS"/> :
       scene.visual==="people_goal" ? <Count primary="75" secondary="MILLIONS" label="DE PERSONNES · CIBLE 2030"/> :
       <FadeUp delay={6}><div style={{fontSize:scene.visual==="source_close"?68:scene.visual==="caveat"?67:scene.headline.length>22?78:96,
           fontWeight:950,lineHeight:0.98,letterSpacing:-4,maxWidth:830,
           textTransform:"uppercase",whiteSpace:"pre-wrap",overflowWrap:"break-word"}}>
         {scene.headline}
       </div></FadeUp>}
      <FadeUp delay={19}><div style={{marginTop:49,fontSize:30,lineHeight:1.37,
          fontWeight:580,maxWidth:720,color:"#e2f0f7",textShadow:"0 5px 15px #071624"}}>
        {scene.subline}
      </div></FadeUp>
      {scene.visual==="early_action" && <FadeUp delay={25}><div style={{display:"flex",flexDirection:"column",gap:13,marginTop:46}}>
        {["01 · ALERTE","02 · FINANCEMENT","03 · ACTION PRÉCOCE"].map(label=>
          <div key={label} style={{padding:"18px 26px",width:550,background:"rgba(4,47,74,.78)",
            border:"1px solid rgba(77,210,242,.45)",fontSize:30,fontWeight:780,letterSpacing:2}}>{label}</div>)}
      </div></FadeUp>}
    </div>
    <div style={{position:"absolute",left:80,right:175,bottom:300,display:"flex",flexDirection:"column",gap:15}}>
      <div style={{height:2,background:C.line,position:"relative"}}>
        <div style={{height:4,background:C.cyan,width:`${progress*100}%`,transform:"translateY(-1px)"}}/>
      </div>
      <div style={{display:"flex",justifyContent:"space-between",fontSize:18,letterSpacing:2,color:C.muted}}>
        <span>UN NEWS · 12 NOV. 2026</span><span>COP31 · ANTALYA</span>
      </div>
    </div>
    <div style={{position:"absolute",left:80,right:165,bottom:210,display:"flex",justifyContent:"space-between",
      alignItems:"end",gap:30}}>
      <div style={{fontWeight:750,fontSize:18,color:"#d1e4e9",lineHeight:1.35}}>
        Sources : Nations unies · CCNUCC
      </div>
      <div style={{fontSize:15,color:C.muted}}>ILLUSTRATION DE DONNÉES</div>
    </div>
    <div style={{position:"absolute",left:80,bottom:134,display:"flex",justifyContent:"space-between",width:690,alignItems:"center"}}>
      {!clean && <span style={{fontSize:22,fontWeight:900,letterSpacing:1.2}}>Voir le monde, le comprendre.</span>}
      <span style={{fontSize:15,letterSpacing:2,color:C.muted}}>VOIX GÉNÉRÉE PAR IA</span>
    </div>
  </AbsoluteFill>;
};

export const WorldVisionFirstReport:React.FC<FirstReportProps> = ({
  story,durationSeconds,audioFilename,renderProfile="canonical_newsroom_v1"
})=>{
  const {fps}=useVideoConfig();
  const weights=[0.145,0.15,0.16,0.16,0.16,0.145,0.08];
  const frames=Math.round(durationSeconds*fps);
  const boundaries=[0];
  let acc=0;
  for(const weight of weights.slice(0,-1)){acc+=weight;boundaries.push(Math.round(acc*frames));}
  boundaries.push(frames);
  return <AbsoluteFill style={{background:C.bg}}>
    {audioFilename && <Audio src={staticFile(audioFilename)}/>}
    {story.scenes.slice(0,7).map((scene,i)=><Sequence key={scene.id} from={boundaries[i]}
        durationInFrames={Math.max(1,boundaries[i+1]-boundaries[i])} name={scene.label}>
      <NewsScene scene={scene} story={story} index={i} durationInFrames={boundaries[i+1]-boundaries[i]}
        clean={renderProfile==="tiktok_api_clean_v1"}/>
    </Sequence>)}
  </AbsoluteFill>;
};
