/**
 * PRIVATE DEV/CI only — all inputs are original SYNTHETIC fixtures.
 * Exercises BOTH a single shot and a whole-film Remotion timeline using the
 * exact same CreativeEdit.tsx composition as the server-side MP4 exporter.
 *
 * /creative-player-smoke.html           -> one shot
 * /creative-player-smoke.html?mode=film -> 2 shots + dissolve + local WAV
 */
import {useEffect,useMemo,useRef,useState} from "react";
import {createRoot} from "react-dom/client";
import {Player} from "@remotion/player";
import type {PlayerRef} from "@remotion/player";
import {CreativeEdit,creativeDuration} from "../../../../services/media-renderer/src/CreativeEdit";
import type {CreativeEditProps,CreativeShot} from "../../../../services/media-renderer/src/CreativeEdit";

declare global{
  interface Window{
    __wvSmokeSeek?:(frame:number)=>void;
    __wvSmokeReady?:boolean;
    __wvSmokeMode?:"shot"|"film"|"clip"|"document"|"geo"|"country"|"photo";
    __wvSmokeFrames?:number;
    __wvSmokeHasVoice?:boolean;
  }
}
type SmokeAssets={photo:string;voice:string|null;clip:string|null;cutout:string|null};
const mode=new URLSearchParams(window.location.search).get("mode");
const isFilm=mode==="film";
const isClip=mode==="clip";
const isDocument=mode==="document";
const isGeo=mode==="geo";
const isCountry=mode==="country";
const isPhoto=mode==="photo";
function Smoke(){
  const playerRef=useRef<PlayerRef>(null);
  const [assets,setAssets]=useState<SmokeAssets|null>(null);
  const [error,setError]=useState<string|null>(null);
  useEffect(()=>{
    let disposed=false;
    const urls:string[]=[];
    (async()=>{
      const routes=isPhoto?["/smoke/synthetic-landscape.png","/smoke/synthetic-foreground.png"]:isFilm?["/smoke/synthetic-landscape.png","/smoke/synthetic-tone.wav"]:isClip?["/smoke/synthetic-clip.mp4"]:isDocument?["/smoke/synthetic-document.png"]:["/smoke/synthetic-landscape.png"];
      const blobs=await Promise.all(routes.map(async route=>{
        const response=await fetch(route,{cache:"no-store"});
        if(!response.ok)throw Error("Missing synthetic fixture "+route+" ("+response.status+")");
        return response.blob();
      }));
      for(const blob of blobs)urls.push(URL.createObjectURL(blob));
      if(!disposed)setAssets({photo:isClip?"":urls[0],voice:isFilm?urls[1]:null,clip:isClip?urls[0]:null,cutout:isPhoto?urls[1]:null});
    })().catch(e=>{if(!disposed)setError(String(e));});
    return ()=>{disposed=true;for(const url of urls)URL.revokeObjectURL(url);};
  },[]);
  const props=useMemo<CreativeEditProps|null>(()=>{
    if(!assets)return null;
    const opener:CreativeShot={
      id:"plan-synthetique",durationFrames:isPhoto?165:isCountry?165:isGeo?150:isDocument?140:105,template:isPhoto?"photo_layers":isCountry?"country_focus":isGeo?"geo_story":isDocument?"document_focus":isClip?"clean_video":"focus_reveal",
      media:assets.clip?{kind:"video",src:assets.clip}:{kind:"image",src:assets.photo},
      title:isPhoto?"UNE IMAGE. SIX MOUVEMENTS.":isCountry?"GABON · FOCUS CARTOGRAPHIQUE":isGeo?"LE MONDE EN MOUVEMENT":isDocument?"EXAMINER LE DOCUMENT":"UN PLAN. UNE HISTOIRE.",
      subtitle:isPhoto?"Photo abstraite, masquage, profondeur, lumière et chiffres fictifs : essai seulement.":isCountry?"Source géographique réelle, paysage artificiel de test : aucune actualité.":isGeo?"Cartographie et animations simultanées, test synthétique.":isDocument?"Une source fournie, jamais reconstituée.":"Test technique de composition — aucune actualité",
      eyebrow:isPhoto?"PHOTO MULTILAYER · AUCUNE ACTUALITÉ":isCountry?"ATELIER 1:10m · NON JOURNALISTIQUE":isGeo?"GEO MOTION · AUCUNE ACTUALITÉ":isDocument?"DOCUMENT TEST — AUCUNE ACTUALITÉ":"STUDIO / RENDU RÉEL",
      motion:"dolly",transitionAfter:isFilm?"dissolve":"cut",
      transitionFrames:isFilm?10:0,
      focus:{x:.5,y:.46},
       ...(isPhoto&&assets.cutout?{foreground:{src:assets.cutout}}:{}),
       ...(isPhoto?{photo:{
         camera:{scaleStart:1.02,scaleEnd:1.11,panX:-22,panY:-8,startFrame:0,endFrame:130},
         reveal:{startFrame:3,endFrame:68,direction:"left"},
         highlight:{x:.56,y:.44,radius:.28,startFrame:38,endFrame:99},
         metric:{label:"DONNÉE FICTIVE",value:42,unit:" TEST",precision:0,startFrame:68,endFrame:122}
       }}:{}),
      ...(isDocument?{documentRegion:{x:.30,y:.40,width:.45,height:.20}}:{}),
      ...(isCountry?{geo:{
        center:{lon:0,lat:10},spotlight:{countryId:"266"},
        target:{lon:11.6,lat:-.7,label:"TEST GÉOGRAPHIQUE"},
        metric:{label:"VALEUR FICTIVE",value:42,unit:" TEST",precision:0}
      }}:{}),
      ...(isGeo?{geo:{
        center:{lon:10,lat:12},spinDegrees:12,look:"photo",
        camera:{to:{lon:11.6,lat:-.7},startFrame:15,endFrame:102,zoom:1.10},
        spotlight:{countryId:"266"},
        target:{lon:12,lat:-2,label:"POINT FICTIF"},
        route:{from:{lon:-9,lat:40},to:{lon:12,lat:-2}},
        metric:{label:"VALEUR DE TEST",value:42,unit:" TEST",precision:0}
      }}:{})
    };
    const continuation:CreativeShot={
      id:"contexte-synthetique",durationFrames:70,template:"kinetic",
      title:"LE RÉCIT CONTINUE.",
      subtitle:"Une séquence liée par un fondu et une piste fournie.",
      eyebrow:"ATELIER / ESSAI DE TIMELINE",
      motion:"locked",transitionAfter:"cut",transitionFrames:0
    };
    return {
      version:1,
      title:"WORLD-VISION — ESSAI NON JOURNALISTIQUE",
      script:"Ceci est un texte de test. Aucune information d'actualité n'est générée.",
      shots:isFilm?[opener,continuation]:[opener],
      narration:assets.voice?{src:assets.voice,label:"Synthetic CI tone, NOT a human voice",volume:.3}:null,
      soundtrack:null,brandOutro:null,
      visualStyle:{background:"#0b1721",ink:"#f6f8fa",accent:"#8bbecf"}
    };
  },[assets]);
  useEffect(()=>{
    if(!props)return;
    window.__wvSmokeSeek=(n:number)=>playerRef.current?.seekTo(n);
    window.__wvSmokeReady=true;
    window.__wvSmokeMode=isFilm?"film":isClip?"clip":isDocument?"document":isCountry?"country":isPhoto?"photo":isGeo?"geo":"shot";
    window.__wvSmokeFrames=creativeDuration(props);
    window.__wvSmokeHasVoice=Boolean(props.narration);
    return ()=>{
      window.__wvSmokeReady=false;
      delete window.__wvSmokeSeek;
      delete window.__wvSmokeMode;
      delete window.__wvSmokeFrames;
      delete window.__wvSmokeHasVoice;
    };
  },[props]);
  return <div style={{margin:0,width:360}}>
    <p id="smoke-state" style={{color:"#fff",fontSize:12,margin:0}}>
      {error?"Error: "+error:props?"player mounted":"loading local blob"}
    </p>
    {props&&<div id="smoke-preview" style={{width:360,height:640}}>
      <Player
        ref={playerRef}
        component={CreativeEdit}
        inputProps={props}
        compositionWidth={1080}
        compositionHeight={1920}
        fps={30}
        durationInFrames={creativeDuration(props)}
        autoPlay={false}
        controls={false}
        style={{width:360,height:640}}
        errorFallback={({error:playerError})=><div id="smoke-error">{String(playerError)}</div>}
      />
    </div>}
  </div>;
}
const root=document.getElementById("root");
if(!root)throw Error("Missing smoke root");
createRoot(root).render(<Smoke/>);
