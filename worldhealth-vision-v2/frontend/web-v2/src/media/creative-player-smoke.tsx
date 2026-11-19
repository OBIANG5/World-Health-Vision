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
    __wvSmokeMode?:"shot"|"film";
    __wvSmokeFrames?:number;
    __wvSmokeHasVoice?:boolean;
  }
}
type SmokeAssets={photo:string;voice:string|null};
const isFilm=new URLSearchParams(window.location.search).get("mode")==="film";
function Smoke(){
  const playerRef=useRef<PlayerRef>(null);
  const [assets,setAssets]=useState<SmokeAssets|null>(null);
  const [error,setError]=useState<string|null>(null);
  useEffect(()=>{
    let disposed=false;
    const urls:string[]=[];
    (async()=>{
      const routes=isFilm?["/smoke/synthetic-landscape.png","/smoke/synthetic-tone.wav"]:["/smoke/synthetic-landscape.png"];
      const blobs=await Promise.all(routes.map(async route=>{
        const response=await fetch(route,{cache:"no-store"});
        if(!response.ok)throw Error("Missing synthetic fixture "+route+" ("+response.status+")");
        return response.blob();
      }));
      for(const blob of blobs)urls.push(URL.createObjectURL(blob));
      if(!disposed)setAssets({photo:urls[0],voice:isFilm?urls[1]:null});
    })().catch(e=>{if(!disposed)setError(String(e));});
    return ()=>{disposed=true;for(const url of urls)URL.revokeObjectURL(url);};
  },[]);
  const props=useMemo<CreativeEditProps|null>(()=>{
    if(!assets)return null;
    const opener:CreativeShot={
      id:"plan-synthetique",durationFrames:105,template:"focus_reveal",
      media:{kind:"image",src:assets.photo},
      title:"UN PLAN. UNE HISTOIRE.",
      subtitle:"Test technique de composition — aucune actualité",
      eyebrow:"STUDIO / RENDU RÉEL",
      motion:"dolly",transitionAfter:isFilm?"dissolve":"cut",
      transitionFrames:isFilm?10:0,
      focus:{x:.5,y:.46}
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
    window.__wvSmokeMode=isFilm?"film":"shot";
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
