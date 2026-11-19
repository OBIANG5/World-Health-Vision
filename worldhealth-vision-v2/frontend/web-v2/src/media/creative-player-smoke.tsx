/**
 * Test harness only, not an editorial sample or public page in the Vite build.
 * Reads an explicitly synthetic fixture from the local Vite public directory,
 * turns it into a browser blob URL, then plays the EXACT shared composition.
 */
import {useEffect,useMemo,useRef,useState} from "react";
import {createRoot} from "react-dom/client";
import {Player} from "@remotion/player";
import type {PlayerRef} from "@remotion/player";
import {CreativeEdit} from "../../../../services/media-renderer/src/CreativeEdit";
import type {CreativeEditProps} from "../../../../services/media-renderer/src/CreativeEdit";

declare global{
  interface Window{
    __wvSmokeSeek?:(frame:number)=>void;
    __wvSmokeReady?:boolean;
  }
}

function Smoke(){
  const playerRef=useRef<PlayerRef>(null);
  const [asset,setAsset]=useState<string|null>(null);
  useEffect(()=>{
    let disposed=false;
    let objectUrl:string|null=null;
    (async()=>{
      const response=await fetch("/smoke/synthetic-landscape.png");
      if(!response.ok)throw new Error("Synthetic test image not found");
      const blob=await response.blob();
      objectUrl=URL.createObjectURL(blob);
      if(!disposed)setAsset(objectUrl);
    })().catch(error=>{
      document.getElementById("smoke-state")!.textContent=String(error);
    });
    return ()=>{disposed=true;if(objectUrl)URL.revokeObjectURL(objectUrl);};
  },[]);
  const props=useMemo<CreativeEditProps|null>(()=>{
    if(!asset)return null;
    return {
      version:1,title:"WORLD-VISION / TEST UNIQUEMENT",
      script:"Aucune information réelle ; objet synthétique de test.",
      shots:[{
        id:"plan-synthetique",durationFrames:105,template:"focus_reveal",
        media:{kind:"image",src:asset},
        title:"UN PLAN. UNE HISTOIRE.",
        subtitle:"Test technique de composition — aucune actualité",
        eyebrow:"STUDIO / RENDU RÉEL",
        motion:"dolly",transitionAfter:"cut",transitionFrames:0,
        focus:{x:.5,y:.46}
      }],
      narration:null,soundtrack:null,brandOutro:null,
      visualStyle:{background:"#0b1721",ink:"#f6f8fa",accent:"#8bbecf"}
    };
  },[asset]);
  useEffect(()=>{
    if(!props)return;
    window.__wvSmokeSeek=(n:number)=>playerRef.current?.seekTo(n);
    window.__wvSmokeReady=true;
    return ()=>{window.__wvSmokeReady=false;delete window.__wvSmokeSeek;};
  },[props]);
  return <div style={{margin:0,width:360}}>
    <p id="smoke-state" style={{color:"#fff",fontSize:12,margin:0}}>{props?"player mounted":"loading local blob"}</p>
    {props&&<div id="smoke-preview" style={{width:360,height:640}}>
      <Player
        ref={playerRef}
        component={CreativeEdit}
        inputProps={props}
        compositionWidth={1080}
        compositionHeight={1920}
        fps={30}
        durationInFrames={105}
        autoPlay={false}
        controls={false}
        style={{width:360,height:640}}
        errorFallback={({error})=><div id="smoke-error">{String(error)}</div>}
      />
    </div>}
  </div>;
}
const root=document.getElementById("root");
if(!root)throw Error("Missing smoke root");
createRoot(root).render(<Smoke/>);
