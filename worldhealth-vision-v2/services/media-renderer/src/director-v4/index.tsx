import React,{useEffect,useState} from 'react';
import {AbsoluteFill,Audio,Composition,OffthreadVideo,Sequence,continueRender,delayRender,interpolate,spring,staticFile,useCurrentFrame,useVideoConfig,registerRoot,Easing} from 'remotion';
import './style.css';

/* WORLD-VISION: factual story about 13 Nov 2026, using clearly marked historical
USCG context footage. NONE of the shots depict the 2026 tanker collision.
No painted crash, decorative headers/footers, corner badges or stacked captions.
Vivienne is precisely the original fr-FR-VivienneMultilingualNeural model. */
const FPS=30,OUTRO_START=1080,DURATION=1170,ICE='#8EDBEC',WHITE='#F5F9FC',NAVY='#071627';
const file=(name:string)=>staticFile('director-v4/'+name);
const clamp={extrapolateLeft:'clamp' as const,extrapolateRight:'clamp' as const};
type S={name:string,start:number,length:number,source:string,trim:number,lines:string[],hi?:number,stat?:number,sub?:string,note?:string,question?:boolean};
const shots:S[]=[
 {name:'CHOC',start:0,length:126,source:'port_ship_clean.mp4',trim:305,lines:['UN NAVIRE-CITERNE','PERCUTE UN BATEAU'],hi:1},
 {name:'FLEUVE',start:126,length:162,source:'river_aerial_source.mp4',trim:180,lines:['SUR LE','MISSISSIPPI'],hi:1},
 {name:'DATE',start:288,length:78,source:'river_aerial_source.mp4',trim:510,lines:['13 NOVEMBRE','12 H 30'],hi:1},
 {name:'PASSAGERS',start:366,length:132,source:'tanker_context_source.mp4',trim:2600,lines:[],stat:180,sub:'PERSONNES À BORD'},
 {name:'SECOURS',start:498,length:141,source:'tanker_context_source.mp4',trim:935,lines:['UNE COURSE','CONTRE LA MONTRE'],hi:1},
 {name:'BILAN',start:639,length:138,source:'tanker_context_source.mp4',trim:1170,lines:[],stat:32,sub:'PERSONNES HOSPITALISÉES'},
 {name:'RETROUVES',start:777,length:99,source:'tanker_context_source.mp4',trim:1850,lines:['TOUS LES OCCUPANTS','RETROUVÉS'],hi:1,note:'AUCUN DÉCÈS SIGNALÉ'},
 {name:'QUESTION',start:876,length:124,source:'river_aerial_source.mp4',trim:705,lines:['COMMENT UN TEL CHOC','A-T-IL PU SURVENIR ?'],hi:1,question:true},
 {name:'ENQUETE',start:1000,length:80,source:'river_aerial_source.mp4',trim:830,lines:['UNE ENQUÊTE','EST OUVERTE'],hi:1},
];
const typeface:React.CSSProperties={fontFamily:'WorldDM',fontWeight:800,letterSpacing:'-0.042em'};
const Footage:React.FC<{shot:S}>=({shot})=>{
 const f=useCurrentFrame();
 const z=interpolate(f,[0,shot.length],[1.042,1.003],clamp);
 const src=file(shot.source);
 return <AbsoluteFill style={{backgroundColor:NAVY,overflow:'hidden'}}>
  <AbsoluteFill style={{transform:'scale('+(z*1.18)+')',filter:'blur(36px) brightness(0.60) saturate(.82)'}}>
   <OffthreadVideo src={src} trimBefore={shot.trim} muted style={{height:'100%',width:'100%',objectFit:'cover'}}/>
  </AbsoluteFill>
  <div style={{position:'absolute',top:540,left:0,width:1080,height:1130,overflow:'hidden',boxShadow:'0 0 85px rgba(0,10,22,.4)'}}>
   <div style={{position:'absolute',inset:0,transform:'scale('+z+')'}}>
    <OffthreadVideo src={src} trimBefore={shot.trim} muted style={{height:'100%',width:'100%',objectFit:'cover',objectPosition:'center 30%'}}/>
   </div>
   <div style={{position:'absolute',inset:0,background:'linear-gradient(180deg,rgba(1,11,21,.30),transparent 30%,transparent 70%,rgba(1,11,21,.36))'}}/>
  </div>
  <AbsoluteFill style={{background:'linear-gradient(180deg,rgba(3,13,24,.78),rgba(4,15,27,.3) 38%,transparent 58%,rgba(3,12,22,.12) 75%,rgba(4,15,27,.6))'}}/>
 </AbsoluteFill>;
};
const TextMotion:React.FC<{shot:S}>=({shot})=>{
 const f=useCurrentFrame(),{fps}=useVideoConfig();
 const fadeIn=interpolate(f,[0,10,24],[0,.55,1],clamp);
 const fadeOut=interpolate(f,[shot.length-15,shot.length],[1,0],clamp);
 const up=interpolate(spring({fps,frame:Math.max(0,f-4),config:{damping:24,stiffness:110}}),[0,1],[52,0]);
 const size=shot.question?77:shot.lines.some(x=>x.length>19)?83:93;
 return <div style={{position:'absolute',top:shot.question?265:262,left:74,right:66,opacity:fadeIn*fadeOut,transform:'translateY('+up+'px)'}}>
  {shot.lines.map((line,i)=><div key={i} style={{...typeface,color:i===shot.hi?ICE:WHITE,fontSize:size,lineHeight:1.08,textShadow:'0 5px 20px rgba(3,8,15,.3)'}}>{line}</div>)}
  {shot.note&&<div style={{fontFamily:'WorldDM',fontWeight:700,color:WHITE,fontSize:34,letterSpacing:'.018em',marginTop:30,opacity:interpolate(f,[16,30],[0,1],clamp)}}>{shot.note}</div>}
 </div>;
};
const Counter:React.FC<{shot:S}>=({shot})=>{
 const f=useCurrentFrame(),max=shot.stat||0;
 const progress=interpolate(f,[5,29],[0,1],{...clamp,easing:Easing.out(Easing.cubic)});
 const pop=interpolate(spring({fps:FPS,frame:f,config:{stiffness:122,damping:17}}),[0,1],[90,0]);
 const alpha=interpolate(f,[0,12],[0,1],clamp)*interpolate(f,[shot.length-14,shot.length],[1,0],clamp);
 return <div style={{position:'absolute',left:76,right:66,top:143,opacity:alpha,transform:'translateY('+pop+'px)'}}>
  <div style={{...typeface,fontVariantNumeric:'tabular-nums',fontSize:265,lineHeight:1,color:ICE,textShadow:'0 6px 28px rgba(0,10,20,.25)'}}>{Math.round(progress*max)}</div>
  <div style={{fontFamily:'WorldDM',fontWeight:770,fontSize:60,lineHeight:1.1,letterSpacing:'-0.02em',color:WHITE}}>{shot.sub}</div>
  {max===32&&<div style={{fontFamily:'WorldDM',fontSize:31,fontWeight:650,marginTop:24,color:WHITE,opacity:interpolate(f,[47,69],[0,1],clamp)}}>SANS BLESSURE CRITIQUE SIGNALÉE</div>}
  <div style={{marginTop:32,width:450,height:4,background:'rgba(180,232,239,.18)'}}>
   <div style={{width:(progress*100)+'%',height:4,backgroundColor:ICE}}/>
  </div>
 </div>;
};
const Shot:React.FC<{shot:S}>=({shot})=>{
 const f=useCurrentFrame();
 return <AbsoluteFill style={{opacity:interpolate(f,[0,8],[0,1],clamp)}}>
  <Footage shot={shot}/>
  {shot.stat?<Counter shot={shot}/>:<TextMotion shot={shot}/>}
  {shot.name==='CHOC'&&<div style={{position:'absolute',top:153,left:76,fontFamily:'WorldDM',fontSize:26,fontWeight:500,color:WHITE,
   opacity:interpolate(f,[13,23,85,104],[0,.65,.65,0],clamp)}}>Images d’archives USCG — pas celles de l’accident</div>}
 </AbsoluteFill>;
};
const Film:React.FC=()=>{
 const [handle]=useState(()=>delayRender('Official DM Sans preload'));
 useEffect(()=>{
  const f=new FontFace('WorldDM','url('+file('DMSans.ttf')+')',{weight:'100 1000'});
  f.load().then(font=>{document.fonts.add(font);continueRender(handle)}).catch(err=>{console.error(err);continueRender(handle)});
 },[handle]);
 return <AbsoluteFill style={{backgroundColor:NAVY}}>
  {shots.map(s=><Sequence key={s.name} from={s.start} durationInFrames={s.length}><Shot shot={s}/></Sequence>)}
  <Sequence from={OUTRO_START} durationInFrames={90}>
   <OffthreadVideo muted src={file('worldvision-original-g0-graphite.mp4')} style={{height:'100%',width:'100%',objectFit:'cover'}}/>
  </Sequence>
  <Audio src={file('vivienne-extended.mp3')}/>
 </AbsoluteFill>;
};
const Root:React.FC=()=> <Composition id="WV002-Director-V4" component={Film} width={1080} height={1920} fps={FPS} durationInFrames={DURATION}/>;
registerRoot(Root);
