import React from "react";
import {AbsoluteFill, Img, Video, Sequence, interpolate, staticFile, useCurrentFrame, useVideoConfig, Easing} from "remotion";

/**
 * WORLD-VISION — EDITORIAL V2 / SHENZHEN.
 * A new composition, not a cosmetic recolor of the rejected 43s render.
 *
 * Editorial rules:
 *  - Direct image cut from leaders to the genuine NASA globe; NEVER a logo hold.
 *  - No progress bars, static footers, QA labels, fake scenes or rotating wireframes.
 *  - Two independent type families: Barlow Condensed headline, DM Sans supporting.
 *  - 1080x1920, true 30 fps, camera motion at normal time.
 *  - Only the official G0 brand asset, as part of meaningful intro/outro.
 *  - Captions are NEVER baked into standalone clips; later only with approved voice.
 *  - S08 is SILENT, its slogan must NEVER be spoken.
 */
export const V2_FPS=30;
export const V2_DURATION_FRAMES=1263; // 42.1 seconds, no artificial 0.9s logo filler.
export const V2_TIMELINE=[
 {id:"leaders", start:0, end:135},
 {id:"globe", start:135, end:282},
 {id:"city", start:267, end:348}, // 15f circle reveal over last 0.5s globe
 {id:"new-start", start:348, end:585},
 {id:"china", start:585, end:771},
 {id:"agenda", start:771, end:987},
 {id:"uncertainty", start:987, end:1173},
 {id:"signature", start:1173, end:1263},
] as const;

const C={
 navy:"#061528",navy2:"#071B31",ink:"#071727",
 white:"#F7F9FA",cyan:"#69D3E8",muted:"#B9CED8",
 sea:"#0A3145",dark:"#03101D",paper:"#F0F2F0",
} as const;
const root="editorial-v2/";
const officialLogo=staticFile("brand/world-vision-official.png");
const fontTitle=staticFile("fonts/BarlowCondensed-Bold.ttf");
const fontText=staticFile("fonts/DMSans-variable.ttf");
const styleFont=`
 @font-face { font-family:"WV-Editorial"; src:url("${fontTitle}") format("truetype"); font-weight:700; font-display:block; }
 @font-face { font-family:"WV-Text"; src:url("${fontText}") format("truetype"); font-weight:100 1000; font-display:block; }
`;
const clamp={extrapolateLeft:"clamp",extrapolateRight:"clamp"} as const;
const smooth=(f:number,a:number,b:number)=>interpolate(f,[a,b],[0,1],{...clamp,easing:Easing.bezier(.21,.72,.26,1)});
const Main:React.FC<{children:React.ReactNode; bg?:string}>=({children,bg=C.navy})=>
  <AbsoluteFill style={{background:bg,overflow:"hidden",color:C.white}}>
    {children}
  </AbsoluteFill>;
const ShortBrand:React.FC=()=>(
 <div style={{position:"absolute",top:112,left:88,zIndex:10,
  display:"flex",alignItems:"center",gap:14}}>
  <div style={{width:61,height:61,borderRadius:8,overflow:"hidden",background:C.paper}}>
    <Img src={officialLogo} style={{width:"100%",height:"100%",objectFit:"contain"}}/>
  </div>
  <div style={{fontFamily:"WV-Text",fontSize:27,fontWeight:800,letterSpacing:1.8}}>WORLD-VISION</div>
 </div>
);
const BottomVignette:React.FC<{height?:number}>=({height=880})=>(
  <AbsoluteFill style={{background:`linear-gradient(to bottom,transparent 35%,rgba(3,13,24,.09) 45%,rgba(3,13,24,.82) 76%,${C.navy} 100%)`,
    opacity:.95,pointerEvents:"none"}}/>
);
const Overline:React.FC<{children:React.ReactNode;top:number;color?:string}>=({children,top,color=C.cyan})=>(
 <div style={{position:"absolute",left:90,top,fontFamily:"WV-Text",
  fontSize:26,letterSpacing:4.4,fontWeight:700,color}}>{children}</div>
);
const Title:React.FC<{children:React.ReactNode;top:number;size?:number;color?:string;maxWidth?:number}>=
 ({children,top,size=148,color=C.white,maxWidth=930})=>(
  <div style={{position:"absolute",left:80,top,maxWidth,
    fontFamily:"WV-Editorial",fontSize:size,fontWeight:700,lineHeight:1.0,letterSpacing:-1.2,
    whiteSpace:"nowrap",color,textShadow:"0 12px 35px rgba(0,0,0,.5)"}}>{children}</div>
);
const ArchivePhoto:React.FC<{name:string,zoom?:number,focus?:string,shade?:number}>=
 ({name,zoom=1.10,focus="center center",shade=.24})=>{
  const f=useCurrentFrame();
  const {durationInFrames}=useVideoConfig();
  const z=interpolate(f,[0,durationInFrames],[1.02,zoom],clamp);
  return <AbsoluteFill>
    <Img src={staticFile(root+name)} style={{width:"100%",height:"100%",
      objectFit:"cover",objectPosition:focus,transform:`scale(${z})`,
      filter:"saturate(.92) contrast(1.04)"}}/>
    <AbsoluteFill style={{background:`linear-gradient(to bottom,rgba(2,13,26,${shade}),transparent 30%,rgba(2,13,26,.24) 55%,${C.dark} 100%)`}}/>
  </AbsoluteFill>
};
const EditorialLeaders:React.FC=()=>{
 const f=useCurrentFrame();
 const imgs=[
  {src:"trump.jpg",name:"TRUMP",focus:"57% 22%"},
  {src:"putin.jpg",name:"POUTINE",focus:"50% 18%"},
  {src:"xi.jpg",name:"XI JINPING",focus:"54% 18%"}
 ];
 return <Main>
  <div style={{position:"absolute",inset:"115px 0 0 0",display:"flex",height:1170,gap:3}}>
   {imgs.map((it,i)=>{
    const reveal=smooth(f,3+i*4,22+i*4);
    const z=interpolate(f,[0,135],[1.04,1.11],clamp);
    return <div key={it.name} style={{width:"33.333%",position:"relative",overflow:"hidden",
      opacity:reveal,transform:`translateY(${(1-reveal)*42}px)`}}>
      <Img src={staticFile(root+it.src)} style={{height:"100%",width:"100%",objectFit:"cover",
        objectPosition:it.focus,transform:`scale(${z})`,filter:"contrast(1.06) saturate(.81)"}}/>
      <div style={{position:"absolute",left:0,right:0,bottom:0,height:390,
        background:"linear-gradient(transparent,rgba(3,16,29,.93))"}}/>
    </div>
   })}
  </div>
  <AbsoluteFill style={{background:"linear-gradient(to bottom,rgba(4,17,31,.7),transparent 24%,transparent 46%,rgba(3,14,26,.85) 74%,#061528 88%)"}}/>
  <ShortBrand/>
  <Overline top={990}>UNE RENCONTRE ANNONCÉE</Overline>
  <div style={{opacity:smooth(f,13,29)}}>
   <Title top={1070} size={111}>TROIS DIRIGEANTS.</Title>
   <Title top={1212} size={111} color={C.cyan}>UN MÊME ENJEU.</Title>
  </div>
 </Main>;
};
const Globe:React.FC=()=>(
 <Main bg={C.dark}>
  {/* Genuine 4.9s NASA/Natural Earth geometry preserved; no D00 placeholder. */}
  <Video muted src={staticFile(root+"segment03-shenzhen-july-v3-clean-4p9s.mp4")}/>
 </Main>
);
const City:React.FC=()=>{
 const f=useCurrentFrame();
 const reveal=smooth(f,0,15);
 const radius=interpolate(reveal,[0,1],[8,1440]);
 // Keep authentic photography in a widescreen documentary window, instead
 // of cropping 75% of Shenzhen out of a vertical fill. No invented buildings.
 return <Main>
  <AbsoluteFill style={{clipPath:`circle(${radius}px at 50% 43%)`,
    background:"linear-gradient(145deg,#09263B,#061528 72%)"}}>
    <Overline top={292}>SHENZHEN · CHINE</Overline>
    <div style={{position:"absolute",left:56,right:56,top:410,height:680,
      overflow:"hidden",borderRadius:5}}>
      <Img src={staticFile(root+"shenzhen-city-2025.jpg")} style={{width:"100%",height:"100%",
        objectFit:"cover",objectPosition:"50% 59%",transform:`scale(${interpolate(f,[0,81],[1.03,1.085],clamp)})`}}/>
      <div style={{position:"absolute",inset:0,background:"linear-gradient(180deg,rgba(5,20,37,.02),transparent 55%,rgba(5,20,37,.46))"}}/>
    </div>
    <Title top={1130} size={149}>SHENZHEN</Title>
    <div style={{position:"absolute",left:89,top:1292,fontFamily:"WV-Text",fontWeight:700,
      fontSize:35,color:C.cyan}}>19 NOVEMBRE 2026</div>
  </AbsoluteFill>
 </Main>;
};
const Treaty:React.FC=()=>{
 const f=useCurrentFrame();
 return <Main>
  <ArchivePhoto name="new-start-prague-2010.jpg" zoom={1.065} focus="center 30%"/>
  <AbsoluteFill style={{background:"linear-gradient(to bottom,rgba(3,15,28,.76),rgba(3,15,28,.08) 24%,rgba(3,15,28,.16) 45%,#061528 83%)"}}/>
  <Overline top={267}>DÉSARMEMENT NUCLÉAIRE</Overline>
  <div style={{opacity:smooth(f,4,20)}}>
   <Title top={390} size={197}>NEW START</Title>
  </div>
  <div style={{position:"absolute",left:87,top:660,fontFamily:"WV-Text",
    fontSize:27,color:C.white,fontWeight:600,padding:"14px 20px",
    borderRadius:4,background:"rgba(3,15,28,.78)"}}>ARCHIVES · PRAGUE · AVRIL 2010</div>
  <div style={{opacity:smooth(f,43,67)}}>
   <Title top={1020} size={124}>LE TRAITÉ</Title>
   <Title top={1156} size={124} color={C.cyan}>A EXPIRÉ.</Title>
   <div style={{position:"absolute",left:92,top:1291,
    fontSize:34,color:C.white,fontFamily:"WV-Text",fontWeight:700}}>5 FÉVRIER 2026</div>
  </div>
 </Main>;
};
const China:React.FC=()=>{
 const f=useCurrentFrame();
 return <Main>
  <ArchivePhoto name="xi.jpg" zoom={1.10} focus="center 17%" shade={.18}/>
  <Overline top={288}>LE POINT DE BLOCAGE</Overline>
  <div style={{opacity:smooth(f,9,28)}}>
   <Title top={870} size={169}>PÉKIN RESTE</Title>
   <Title top={1027} size={169} color={C.cyan}>RÉTICENT.</Title>
  </div>
 </Main>;
};
const Agenda:React.FC=()=>{
 const f=useCurrentFrame();
 return <Main bg={C.navy2}>
  <AbsoluteFill style={{background:"radial-gradient(circle at 73% 28%,rgba(65,146,173,.20),transparent 56%)"}}/>
  <Overline top={282}>LES AUTRES DOSSIERS</Overline>
  <div style={{opacity:smooth(f,0,18),position:"absolute",left:90,right:100,top:492}}>
   <div style={{fontFamily:"WV-Editorial",fontSize:182,fontWeight:700,
     color:C.white,lineHeight:.85}}>IRAN</div>
   <div style={{fontFamily:"WV-Text",fontSize:36,fontWeight:600,
     color:C.muted,marginTop:35}}>Devrait être abordé.</div>
  </div>
  <div style={{position:"absolute",left:90,right:105,top:856,
    borderTop:"2px solid rgba(166,206,218,.34)",paddingTop:80,opacity:smooth(f,27,44)}}>
   <div style={{fontFamily:"WV-Editorial",fontSize:182,fontWeight:700,
     color:C.cyan,lineHeight:.85}}>UKRAINE</div>
   <div style={{fontFamily:"WV-Text",fontSize:36,fontWeight:600,
     color:C.muted,marginTop:35}}>Non prévue selon Washington.</div>
  </div>
 </Main>;
};
const Uncertainty:React.FC=()=>{
 const f=useCurrentFrame();
 return <Main>
  <ArchivePhoto name="trump.jpg" zoom={1.085} focus="center 25%"/>
  <Overline top={283}>À CE STADE</Overline>
  <div style={{opacity:smooth(f,8,25)}}>
   <Title top={880} size={159}>AUCUN ACCORD</Title>
   <Title top={1031} size={159} color={C.cyan}>N'EST ATTENDU.</Title>
  </div>
 </Main>;
};
const Signature:React.FC=()=>{
 const f=useCurrentFrame();
 const a=smooth(f,3,24);
 return <Main bg="#061528">
  <AbsoluteFill style={{background:"radial-gradient(circle at 50% 40%,rgba(15,88,123,.28),transparent 46%)"}}/>
  <div style={{position:"absolute",left:0,right:0,top:571,
    display:"flex",alignItems:"center",flexDirection:"column",
    opacity:a,transform:`translateY(${(1-a)*42}px)`}}>
    <div style={{width:235,height:235,borderRadius:18,
      overflow:"hidden",background:C.paper,
      boxShadow:"0px 20px 90px rgba(0,0,0,.23)"}}>
      <Img src={officialLogo} style={{width:"100%",height:"100%",objectFit:"contain"}}/>
    </div>
    <div style={{marginTop:57,fontFamily:"WV-Text",fontSize:66,fontWeight:800,
       letterSpacing:.8}}>WORLD-VISION</div>
    <div style={{marginTop:34,fontFamily:"WV-Text",fontSize:34,fontWeight:500,
       color:C.muted}}>Voir le monde, le comprendre.</div>
  </div>
 </Main>;
};

export const WorldVisionEditorialV2:React.FC=()=>{
 const {fps}=useVideoConfig();
 return <AbsoluteFill style={{background:C.navy}}>
  <style>{styleFont}</style>
  <Sequence from={0} durationInFrames={135}><EditorialLeaders/></Sequence>
  <Sequence from={135} durationInFrames={147}><Globe/></Sequence>
  <Sequence from={267} durationInFrames={81}><City/></Sequence>
  <Sequence from={348} durationInFrames={237}><Treaty/></Sequence>
  <Sequence from={585} durationInFrames={186}><China/></Sequence>
  <Sequence from={771} durationInFrames={216}><Agenda/></Sequence>
  <Sequence from={987} durationInFrames={186}><Uncertainty/></Sequence>
  <Sequence from={1173} durationInFrames={90}><Signature/></Sequence>
 </AbsoluteFill>;
};
