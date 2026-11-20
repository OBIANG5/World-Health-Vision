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
    __wvSmokeMode?:"shot"|"film"|"clip"|"document"|"geo"|"country"|"photo"|"data-line"|"data-ranking"|"data-heatmap"|"editorial";
    __wvSmokeFrames?:number;
    __wvSmokeHasVoice?:boolean;
  }
}
type SmokeAssets={photo:string;voice:string|null;clip:string|null;foreground:string|null;document:string|null;filmTone:string|null};
const mode=new URLSearchParams(window.location.search).get("mode");
const isFilm=mode==="film";
const isClip=mode==="clip";
const isDocument=mode==="document";
const isGeo=mode==="geo";
const isCountry=mode==="country";
const isPhoto=mode==="photo";
const isEditorial=mode==="editorial";
const isData=mode==="data-line"||mode==="data-ranking"||mode==="data-heatmap";
function Smoke(){
  const playerRef=useRef<PlayerRef>(null);
  const [assets,setAssets]=useState<SmokeAssets|null>(null);
  const [error,setError]=useState<string|null>(null);
  useEffect(()=>{
    let disposed=false;
    const urls:string[]=[];
    (async()=>{
      const routes=isEditorial?["/smoke/synthetic-landscape.png","/smoke/synthetic-foreground.png","/smoke/synthetic-document.png","/smoke/synthetic-film-oscillator.wav"]:isPhoto?["/smoke/synthetic-landscape.png","/smoke/synthetic-foreground.png"]:isFilm?["/smoke/synthetic-landscape.png","/smoke/synthetic-tone.wav"]:isClip?["/smoke/synthetic-clip.mp4"]:isDocument?["/smoke/synthetic-document.png"]:["/smoke/synthetic-landscape.png"];
      const blobs=await Promise.all(routes.map(async route=>{
        const response=await fetch(route,{cache:"no-store"});
        if(!response.ok)throw Error("Missing synthetic fixture "+route+" ("+response.status+")");
        return response.blob();
      }));
      for(const blob of blobs)urls.push(URL.createObjectURL(blob));
      if(!disposed)setAssets({photo:isClip?"":urls[0],voice:isFilm?urls[1]:null,clip:isClip?urls[0]:null,foreground:isPhoto||isEditorial?urls[1]:null,document:isEditorial?urls[2]:null,filmTone:isEditorial?urls[3]:null});
    })().catch(e=>{if(!disposed)setError(String(e));});
    return ()=>{disposed=true;for(const url of urls)URL.revokeObjectURL(url);};
  },[]);
  const props=useMemo<CreativeEditProps|null>(()=>{
    if(!assets)return null;
    const opener:CreativeShot={
      id:"plan-synthetique",durationFrames:isData?165:isPhoto?165:isCountry?165:isGeo?150:isDocument?140:105,template:isData?"data_story":isPhoto?"photo_story":isCountry?"country_focus":isGeo?"geo_story":isDocument?"document_focus":isClip?"clean_video":"focus_reveal",
      media:assets.clip?{kind:"video",src:assets.clip}:{kind:"image",src:assets.photo},
      title:isData?"DONNÉES · ESSAI VISUEL SOURCÉ":isPhoto?"UNE IMAGE · SIX MOUVEMENTS":isCountry?"GABON · FOCUS CARTOGRAPHIQUE":isGeo?"LE MONDE EN MOUVEMENT":isDocument?"EXAMINER LE DOCUMENT":"UN PLAN. UNE HISTOIRE.",
      subtitle:isData?"Valeurs, unités et dates de démonstration : aucun fait économique.":isPhoto?"Six animations indépendantes sur une seule source synthétique.":isCountry?"Source géographique réelle, paysage artificiel de test : aucune actualité.":isGeo?"Cartographie et animations simultanées, test synthétique.":isDocument?"Une source fournie, jamais reconstituée.":"Test technique de composition — aucune actualité",
      eyebrow:isData?"DATA MOTION · NON JOURNALISTIQUE":isPhoto?"PHOTO MOTION · NON JOURNALISTIQUE":isCountry?"ATELIER 1:10m · NON JOURNALISTIQUE":isGeo?"GEO MOTION · AUCUNE ACTUALITÉ":isDocument?"DOCUMENT TEST — AUCUNE ACTUALITÉ":"STUDIO / RENDU RÉEL",
      motion:"dolly",transitionAfter:isFilm?"dissolve":"cut",
      transitionFrames:isFilm?10:0,
      focus:{x:.5,y:.46},
      ...(isPhoto&&assets.foreground?{foreground:{src:assets.foreground}}:{}),
      ...(isPhoto?{photo:{
        camera:{zoomFrom:1.05,zoomTo:1.13,panX:18,panY:-14,startFrame:0,endFrame:132},
        subject:{dx:-12,dy:-17,scale:.055,startFrame:12,endFrame:125},
        mask:{axis:"horizontal" as const,startFrame:18,endFrame:68},
        focus:{x:.5,y:.48,radius:83,startFrame:48,endFrame:91},
        metric:{label:"TEST SYNTHÉTIQUE",value:42,unit:" TEST",precision:0,
          sourceLabel:"Source : fixture synthétique CI",startFrame:71,endFrame:122}
      }}:{}),
      ...(isData?{data:{
        mode:mode==="data-ranking"?"ranking" as const:mode==="data-heatmap"?"heatmap" as const:"line" as const,
        series:mode==="data-line"?[
          {date:"2026-01-01",label:"JAN",value:10},
          {date:"2026-02-01",label:"FÉV",value:15},
          {date:"2026-03-01",label:"MAR",value:12}
        ]:mode==="data-ranking"?[
          {label:"CAT A",value:45},{label:"CAT B",value:80},
          {label:"CAT C",value:30},{label:"CAT D",value:65}
        ]:[
          {label:"ZONE A",value:12},{label:"ZONE B",value:54},
          {label:"ZONE C",value:91},{label:"ZONE D",value:30},
          {label:"ZONE E",value:68},{label:"ZONE F",value:5}
        ],
        source:{publisher:"SIMULATION CI",dataset:"Série inventée à des fins de test",
          asOf:"2026-03-01",url:"https://example.invalid/fake"},
        domain:mode==="data-line"?{min:8,max:16}:{min:0,max:100},
        unit:" TEST",precision:0,locale:"fr-FR" as const
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
    const editorialShots:CreativeShot[]=isEditorial&&assets.foreground&&assets.document?[
      {id:"film-world-overview",template:"geo_story",durationFrames:150,
        title:"DU GLOBE AU CONTEXTE",eyebrow:"WORLD-VISION · FILM TEST NON JOURNALISTIQUE",
        subtitle:"Géographie vérifiable, aucun événement journalistique.",
        motion:"locked",transitionAfter:"dissolve",transitionFrames:10,
        geo:{center:{lon:0,lat:10},look:"photo",spinDegrees:12,
          camera:{to:{lon:11.6,lat:-.7},startFrame:15,endFrame:100,zoom:1.09},
          spotlight:{countryId:"266"},target:{lon:11.6,lat:-.7,label:"POINT DE TEST"}}},
      {id:"film-territory-context",template:"country_focus",durationFrames:165,
        title:"LE TERRITOIRE · CONTEXTE",eyebrow:"FILM TEST · CARTOGRAPHIE",
        subtitle:"Frontières Natural Earth, aucun événement simulé.",
        media:{kind:"image",src:assets.photo},
        motion:"locked",transitionAfter:"dissolve",transitionFrames:10,
        focus:{x:.5,y:.5},geo:{center:{lon:0,lat:10},
          spotlight:{countryId:"266"},target:{lon:11.6,lat:-.7,label:"POINT DE TEST"},
          metric:{label:"CHIFFRE FICTIF",value:42,unit:" TEST",precision:0}}},
      {id:"film-source-photo",template:"photo_story",durationFrames:165,
        title:"UNE IMAGE · PLUSIEURS PISTES",eyebrow:"FILM TEST · PHOTO SYNTHÉTIQUE",
        subtitle:"Même image avec mouvements indépendants.",
        media:{kind:"image",src:assets.photo},foreground:{src:assets.foreground},
        motion:"locked",transitionAfter:"dissolve",transitionFrames:10,focus:{x:.5,y:.46},
        photo:{
          camera:{zoomFrom:1.05,zoomTo:1.13,panX:18,panY:-14,startFrame:0,endFrame:132},
          subject:{dx:-12,dy:-17,scale:.055,startFrame:12,endFrame:125},
          mask:{axis:"horizontal",startFrame:18,endFrame:68},
          focus:{x:.5,y:.48,radius:83,startFrame:48,endFrame:91},
          metric:{label:"VALEUR FICTIVE",value:42,unit:" TEST",precision:0,
            sourceLabel:"Fixture synthétique, aucun fait",startFrame:71,endFrame:122}
        }},
      {id:"film-verified-data-contract",template:"data_story",durationFrames:165,
        title:"LES DONNÉES · AVEC SOURCE",eyebrow:"FILM TEST · DONNÉES FICTIVES",
        subtitle:"Dates, unités et échelles visibles, données imaginaires.",
        motion:"locked",transitionAfter:"dissolve",transitionFrames:10,
        data:{mode:"line",series:[
            {date:"2026-01-01",label:"JAN",value:10},
            {date:"2026-02-01",label:"FÉV",value:15},
            {date:"2026-03-01",label:"MAR",value:12}],
          source:{publisher:"SIMULATION CI",dataset:"Données inventées pour QA",asOf:"2026-03-01"},
          domain:{min:8,max:16},unit:" TEST",precision:0,locale:"fr-FR"}},
      {id:"film-evidence-closing",template:"document_focus",durationFrames:140,
        title:"REMONTER À LA SOURCE",eyebrow:"FILM TEST · DOCUMENT ABSTRAIT",
        subtitle:"Simple géométrie, aucun rapport authentique.",
        media:{kind:"image",src:assets.document},motion:"locked",
        transitionAfter:"cut",transitionFrames:0,
        documentRegion:{x:.3,y:.4,width:.45,height:.20}}
    ]:[];
    return {
      version:1,
      title:"WORLD-VISION — ESSAI NON JOURNALISTIQUE",
      script:"Ceci est un texte de test. Aucune information d'actualité n'est générée.",
      shots:isEditorial?editorialShots:isFilm?[opener,continuation]:[opener],
      narration:assets.filmTone?{src:assets.filmTone,label:"CONTINUOUS CI OSCILLATOR, NOT NARRATION",volume:.35}:assets.voice?{src:assets.voice,label:"Synthetic CI tone, NOT a human voice",volume:.3}:null,
      soundtrack:null,brandOutro:null,
      visualStyle:{background:"#0b1721",ink:"#f6f8fa",accent:"#8bbecf"}
    };
  },[assets]);
  useEffect(()=>{
    if(!props)return;
    window.__wvSmokeSeek=(n:number)=>playerRef.current?.seekTo(n);
    window.__wvSmokeReady=true;
    window.__wvSmokeMode=isEditorial?"editorial":isData?mode as "data-line"|"data-ranking"|"data-heatmap":isFilm?"film":isClip?"clip":isDocument?"document":isPhoto?"photo":isCountry?"country":isGeo?"geo":"shot";
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
