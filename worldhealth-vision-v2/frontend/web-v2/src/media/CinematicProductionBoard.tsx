import {lazy, Suspense, useEffect, useMemo, useRef, useState, type ChangeEvent} from "react";
import type {CreativeEditProps, CreativeMedia, CreativeShot} from "../../../../services/media-renderer/src/CreativeEdit";
import atlasData from "world-atlas/countries-110m.json";

// Lazy: do not load the sizeable motion runtime until a user requests preview.
const RealCreativePreview = lazy(() => import("./CreativeCompositionPreview"));
const CountrySelector10m = lazy(() => import("./CountrySelector10m"));
import "./CinematicProductionBoard.css";

type Template = "documentary"|"kinetic"|"evidence"|"number"|"clean_video"|"focus_reveal"|"document_focus"|"geo_story"|"country_focus";
type Motion = "locked"|"dolly"|"drift"|"push";
type Transition = "cut"|"dissolve"|"slide";
type MediaType = "image"|"video"|"audio";
type PreviewMode = "source"|"shot"|"film";
type AtlasGeometry={id?:string|number;properties?:{name?:string}};
const COUNTRIES=((atlasData as unknown as {objects:{countries:{geometries:AtlasGeometry[]}}})
  .objects.countries.geometries)
  .map(g=>({id:String(g.id).padStart(3,"0"),name:g.properties?.name??"ID "+g.id}))
  .sort((a,b)=>a.name.localeCompare(b.name,"fr"));
const COUNTRY_IDS=new Set(COUNTRIES.map(c=>c.id));
type Asset = {name:string;size:number;kind:MediaType;url:string};
type Shot = {
  id:string;title:string;subtitle:string;eyebrow:string;durationFrames:number;
  template:Template;motion:Motion;transitionAfter:Transition;transitionFrames:number;
  mediaName:string;foregroundName:string;focusX:number;focusY:number;
  documentX:number;documentY:number;documentW:number;documentH:number;
  geoLon:number;geoLat:number;geoSpin:number;geoLook:"photo"|"vector";
  geoShowCamera:boolean;geoToLon:number;geoToLat:number;
  geoCameraStart:number;geoCameraEnd:number;geoCameraZoom:number;
  geoShowCountry:boolean;geoCountryId:string;
  geoShowTarget:boolean;geoTargetLon:number;geoTargetLat:number;geoTargetLabel:string;
  geoShowRoute:boolean;geoFromLon:number;geoFromLat:number;
  geoShowMetric:boolean;geoMetricLabel:string;geoMetricValue:string;geoMetricUnit:string;
};
const TEMPLATE_LABELS:Record<Template,string>={
  documentary:"Photographie / reportage",focus_reveal:"Révélation cinématographique du visuel",kinetic:"Typographie cinématique",
  evidence:"Document / contexte",document_focus:"Preuve visuelle · inspection de document",geo_story:"Globe lumineux · géographie et données",country_focus:"Pays en détail · carte 1:10m / média / données",number:"Chiffre important",clean_video:"Clip intégral / animation externe"
};
const MOTION_LABELS:Record<Motion,string>={
  locked:"Cadre fixe",dolly:"Approche de caméra",drift:"Mouvement latéral",push:"Révélation progressive"
};
const templates=Object.keys(TEMPLATE_LABELS) as Template[];
const motions=Object.keys(MOTION_LABELS) as Motion[];
const TRANSITIONS:Record<Transition,string>={cut:"Coupe franche",dissolve:"Fondu discret",slide:"Glissement contrôlé"};
const typesByExt=(name:string):MediaType|null=>{
  const ext=name.split(".").pop()?.toLowerCase();
  if(["jpg","jpeg","png","webp"].includes(ext||""))return "image";
  if(["mp4","mov","webm"].includes(ext||""))return "video";
  if(["wav","mp3","m4a","aac","flac"].includes(ext||""))return "audio";
  return null;
};
const initialShot=():Shot=>({
  id:"plan-01",title:"",subtitle:"",eyebrow:"",durationFrames:120,
  template:"kinetic",motion:"locked",transitionAfter:"cut",transitionFrames:0,mediaName:"",foregroundName:"",focusX:0.5,focusY:0.5,
  documentX:.25,documentY:.32,documentW:.5,documentH:.22,
  geoLon:0,geoLat:10,geoSpin:16,geoLook:"photo",
  geoShowCamera:false,geoToLon:0,geoToLat:0,
  geoCameraStart:15,geoCameraEnd:102,geoCameraZoom:1.1,
  geoShowCountry:false,geoCountryId:"",
  geoShowTarget:false,geoTargetLon:0,geoTargetLat:0,geoTargetLabel:"",
  geoShowRoute:false,geoFromLon:0,geoFromLat:0,
  geoShowMetric:false,geoMetricLabel:"",geoMetricValue:"",geoMetricUnit:""
});
/** No geography or numeric fact is inferred from text here. The user chooses
 * every coordinate and figure explicitly. Never insert synthetic values. */
const buildGeo=(shot:Shot):CreativeShot["geo"]=>({
  center:{lon:shot.geoLon,lat:shot.geoLat},
  look:shot.geoLook,
  spinDegrees:shot.geoSpin,
  ...(shot.template==="geo_story"&&shot.geoShowCamera?{camera:{
    to:{lon:shot.geoToLon,lat:shot.geoToLat},
    startFrame:shot.geoCameraStart,endFrame:shot.geoCameraEnd,
    zoom:shot.geoCameraZoom
  }}:{}),
  ...((shot.template==="country_focus"||shot.geoShowCountry)?{spotlight:{countryId:shot.geoCountryId}}:{}),
  ...(shot.geoShowTarget?{target:{
    lon:shot.geoTargetLon,lat:shot.geoTargetLat,label:shot.geoTargetLabel
  }}:{}),
  ...(shot.template==="geo_story"&&shot.geoShowRoute?{route:{
    from:{lon:shot.geoFromLon,lat:shot.geoFromLat},
    to:{lon:shot.geoTargetLon,lat:shot.geoTargetLat}
  }}:{}),
  ...(shot.geoShowMetric?{metric:{
    label:shot.geoMetricLabel,value:Number(shot.geoMetricValue),
    unit:shot.geoMetricUnit,precision:0
  }}:{})
});
const inLon=(v:number)=>Number.isFinite(v)&&v>=-180&&v<=180;
const inLat=(v:number)=>Number.isFinite(v)&&v>=-85&&v<=85;
const validGeo=(s:Shot)=>{
  if(s.template==="country_focus")return Boolean(
    s.durationFrames>=150&&s.durationFrames<=3600&&
    s.title.trim()&&s.title.length<=90&&s.subtitle.length<=180&&
    /^\\d{3}$/.test(s.geoCountryId)&&
    (!s.geoShowTarget||(inLon(s.geoTargetLon)&&inLat(s.geoTargetLat)&&s.geoTargetLabel.length<=80))&&
    (!s.geoShowMetric||(s.geoMetricLabel.trim()&&s.geoMetricLabel.length<=55&&
      s.geoMetricValue.trim()!==""&&Number.isFinite(Number(s.geoMetricValue))&&
      Math.abs(Number(s.geoMetricValue))<=1e12&&s.geoMetricUnit.length<=12))
  );
  return s.template!=="geo_story"||Boolean(
  s.durationFrames>=120&&s.title.trim()&&s.title.length<=90&&
  inLon(s.geoLon)&&inLat(s.geoLat)&&Number.isFinite(s.geoSpin)&&Math.abs(s.geoSpin)<=360&&
  (!s.geoShowCamera||(inLon(s.geoToLon)&&inLat(s.geoToLat)&&
    Number.isInteger(s.geoCameraStart)&&Number.isInteger(s.geoCameraEnd)&&
    s.geoCameraStart>=0&&s.geoCameraEnd<=s.durationFrames-18&&
    s.geoCameraEnd-s.geoCameraStart>=30&&
    Number.isFinite(s.geoCameraZoom)&&s.geoCameraZoom>=1&&s.geoCameraZoom<=1.15))&&
  (!s.geoShowCountry||COUNTRY_IDS.has(s.geoCountryId))&&
  (!s.geoShowTarget||(inLon(s.geoTargetLon)&&inLat(s.geoTargetLat)&&s.geoTargetLabel.length<=80))&&
  (!s.geoShowRoute||(s.geoShowTarget&&inLon(s.geoFromLon)&&inLat(s.geoFromLat)&&
    (s.geoFromLon!==s.geoTargetLon||s.geoFromLat!==s.geoTargetLat)))&&
  (!s.geoShowMetric||(s.geoMetricLabel.trim()&&s.geoMetricLabel.length<=55&&
    s.geoMetricValue.trim()!==""&&Number.isFinite(Number(s.geoMetricValue))&&
    Math.abs(Number(s.geoMetricValue))<=1e12&&s.geoMetricUnit.length<=12))
  );
};
const mkSlug=(value:string)=>("wv-"+value.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g,"").replace(/[^a-z0-9_-]+/g,"-").replace(/^-+|-+$/g,"").slice(0,60))||"wv-projet";
const path="https://github.com/OBIANG5/World-Health-Vision/blob/feature/worldvision-cinematic-director-gates-2026-11-19/worldhealth-vision-v2/docs/media/WORLDVISION_CREATIVE_EDIT_HANDOFF_2026-11-19.md";

export default function CinematicProductionBoard() {
  const [projectName,setProjectName]=useState("Nouvelle production World-Vision");
  const [script,setScript]=useState("");
  const [files,setFiles]=useState<Asset[]>([]);
  const [shots,setShots]=useState<Shot[]>([initialShot()]);
  const [selectedId,setSelectedId]=useState("plan-01");
  const [voiceFile,setVoiceFile]=useState("");
  const [comparisonVoice,setComparisonVoice]=useState("");
  const [musicFile,setMusicFile]=useState("");
  const [outroFile,setOutroFile]=useState("");
  const [accent,setAccent]=useState("#8bbecf");
  const [feedback,setFeedback]=useState("");
  const [croppedPreview,setCroppedPreview]=useState(true);
  const [previewMode,setPreviewMode]=useState<PreviewMode>("source");
  const createdUrls=useRef<string[]>([]);
  useEffect(()=>()=>{for(const url of createdUrls.current)URL.revokeObjectURL(url);},[]);
  const active=useMemo(()=>shots.find(s=>s.id===selectedId)??shots[0],[shots,selectedId]);
  const activeAsset=files.find(f=>f.name===active.mediaName);
  const foregroundAsset=files.find(f=>f.name===active.foregroundName);
  const needsRealMedia=["documentary","evidence","clean_video","focus_reveal","document_focus"].includes(active.template);
  const previewCanRender=(!needsRealMedia||Boolean(activeAsset&&activeAsset.kind!=="audio"))&&
    (active.template!=="focus_reveal"||Boolean(active.title.trim()&&active.title.length<=90&&active.durationFrames>=90))&&
    (active.template!=="document_focus"||Boolean(activeAsset?.kind==="image"&&active.title.trim()&&active.title.length<=90&&active.durationFrames>=115))&&validGeo(active);
  // Exact props type of the REAL server-rendered Remotion compositor; object
  // URLs only exist in this browser session and never reach GitHub or an API.
  const previewProps=useMemo<CreativeEditProps>(()=>{
    const media:CreativeMedia|null=activeAsset&&activeAsset.kind!=="audio"
      ? {kind:activeAsset.kind,src:activeAsset.url}:null;
    return {
      version:1,
      title:projectName,
      script,
      shots:[{
        id:active.id,
        durationFrames:active.durationFrames,
        template:active.template,
        title:active.title,
        subtitle:active.subtitle,
        eyebrow:active.eyebrow,
        media,
        foreground:foregroundAsset?{src:foregroundAsset.url}:null,
        motion:active.motion,
        transitionAfter:"cut",
        transitionFrames:0,
        focus:{x:active.focusX,y:active.focusY},
        ...(active.template==="document_focus"?{documentRegion:{x:active.documentX,y:active.documentY,width:active.documentW,height:active.documentH}}:{}),
        ...((active.template==="geo_story"||active.template==="country_focus")?{geo:buildGeo(active)}:{})
      }],
      narration:null,
      soundtrack:null,
      brandOutro:null,
      visualStyle:{background:"#0b1721",ink:"#f6f8fa",accent}
    };
  },[active,activeAsset,foregroundAsset,projectName,script,accent]);
  const canExport=script.trim().length>0&&shots.every(shot=>{
    const requires=["documentary","evidence","clean_video","focus_reveal","document_focus"].includes(shot.template);
    const hasMedia=!requires||Boolean(shot.mediaName&&files.some(f=>f.name===shot.mediaName));
    const validFocus=shot.template!=="focus_reveal"||Boolean(shot.title.trim()&&shot.title.length<=90&&shot.durationFrames>=90);
    const validDocument=shot.template!=="document_focus"||Boolean(
      shot.title.trim()&&shot.title.length<=90&&shot.durationFrames>=115&&
      files.some(f=>f.name===shot.mediaName&&f.kind==="image")&&
      shot.documentX>=0&&shot.documentY>=0&&shot.documentW>=.12&&shot.documentW<=.85&&
      shot.documentH>=.08&&shot.documentH<=.8&&
      shot.documentX+shot.documentW<=1.0000001&&shot.documentY+shot.documentH<=1.0000001
    );
    const validForeground=!shot.foregroundName||Boolean(shot.mediaName&&files.some(f=>f.name===shot.foregroundName&&f.kind==="image"));
    return hasMedia&&validFocus&&validDocument&&validForeground&&validGeo(shot);
  });
  const shotsDuration=shots.reduce((sum,s,i)=>
    sum+s.durationFrames-(i<shots.length-1&&s.transitionAfter!=="cut"?s.transitionFrames:0),0);
  const duration=shotsDuration+(outroFile?90:0);
  const fullFilmCanRender=canExport&&duration>0&&duration<=18000;

  /**
   * Complete local timeline for editorial review — EXACT Remotion composition
   * used by the renderer. This is only instantiated when previewMode='film'.
   * Voice and music are the currently selected real file blobs, never AI
   * speech synthesized or generated without user approval.
   */
  const fullFilmProps=useMemo<CreativeEditProps>(()=>({
    version:1,
    title:projectName,
    script,
    shots:shots.map((shot,i)=>{
      const clip=files.find(f=>f.name===shot.mediaName);
      const cutout=files.find(f=>f.name===shot.foregroundName);
      const media:CreativeMedia|null=clip&&clip.kind!=="audio"?{kind:clip.kind,src:clip.url}:null;
      return {
        id:shot.id,
        durationFrames:shot.durationFrames,
        template:shot.template,
        title:shot.title,
        subtitle:shot.subtitle,
        eyebrow:shot.eyebrow,
        media,
        foreground:cutout?{src:cutout.url}:null,
        motion:shot.motion,
        transitionAfter:i===shots.length-1?"cut":shot.transitionAfter,
        transitionFrames:i===shots.length-1||shot.transitionAfter==="cut"?0:shot.transitionFrames,
        focus:{x:shot.focusX,y:shot.focusY},
        ...(shot.template==="document_focus"?{documentRegion:{x:shot.documentX,y:shot.documentY,width:shot.documentW,height:shot.documentH}}:{}),
        ...((shot.template==="geo_story"||shot.template==="country_focus")?{geo:buildGeo(shot)}:{})
      };
    }),
    narration:voiceFile&&files.find(f=>f.name===voiceFile)
      ? {src:files.find(f=>f.name===voiceFile)!.url,volume:1,label:"Narration sélectionnée"}
      :null,
    soundtrack:musicFile&&files.find(f=>f.name===musicFile)
      ? {src:files.find(f=>f.name===musicFile)!.url,volume:0.10,label:"Bande-son fournie"}
      :null,
    brandOutro:outroFile&&files.find(f=>f.name===outroFile)
      ? {src:files.find(f=>f.name===outroFile)!.url,durationFrames:90}
      :null,
    visualStyle:{background:"#0b1721",ink:"#f6f8fa",accent}
  }),[shots,files,projectName,script,voiceFile,musicFile,outroFile,accent]);
  const addFiles=(e:ChangeEvent<HTMLInputElement>)=>{
    const items=Array.from(e.currentTarget.files??[]);
    const known=new Set(files.map(x=>x.name));
    const next:Asset[]=[];
    const rejected:string[]=[];
    for(const file of items){
      const kind=typesByExt(file.name);
      if(!kind){rejected.push(file.name);continue;}
      if(known.has(file.name)){rejected.push(file.name+" (déjà importé)");continue;}
      const url=URL.createObjectURL(file);createdUrls.current.push(url);
      next.push({name:file.name,size:file.size,kind,url});
      known.add(file.name);
    }
    setFiles(old=>[...old,...next]);
    setFeedback(rejected.length?"Non importés : "+rejected.join(", "):next.length+" fichier(s) ajouté(s) à la session.");
    e.currentTarget.value="";
  };
  const updateShot=(change:Partial<Shot>)=>setShots(old=>old.map(s=>s.id===selectedId?{...s,...change}:s));
  const addShot=()=>{
    const existing=new Set(shots.map(x=>x.id));
    let n=shots.length+1;let id="plan-"+String(n).padStart(2,"0");
    while(existing.has(id)){n++;id="plan-"+String(n).padStart(2,"0");}
    setShots(old=>[...old,{...initialShot(),id}]);
    setSelectedId(id);
  };
  const removeShot=()=>{
    if(shots.length===1)return;
    const next=shots.filter(s=>s.id!==selectedId);
    setShots(next);setSelectedId(next[0].id);
  };
  const move=(direction:number)=>{
    const index=shots.findIndex(s=>s.id===selectedId),next=index+direction;
    if(next<0||next>=shots.length)return;
    const list=[...shots];[list[index],list[next]]=[list[next],list[index]];
    setShots(list);
  };
  const exportProject=()=>{
    if(!canExport){setFeedback("Ajoute un script et les médias indispensables aux plans choisis.");return;}
    const project={
      schema_version:"worldvision-creative-project-v1",id:mkSlug(projectName),
      title:projectName,script,fps:30,aspect_ratio:"9:16",
      style:{background:"#0b1721",ink:"#f6f8fa",accent},
      shots:shots.map(s=>({
        id:s.id,durationFrames:s.durationFrames,template:s.template,
        title:s.title,subtitle:s.subtitle,eyebrow:s.eyebrow,
        focus:{x:s.focusX,y:s.focusY},
        ...(s.template==="document_focus"?{documentRegion:{x:s.documentX,y:s.documentY,width:s.documentW,height:s.documentH}}:{}),
        ...((s.template==="geo_story"||s.template==="country_focus")?{geo:buildGeo(s)}:{}),
        motion:s.motion,transitionAfter:shots.indexOf(s)===shots.length-1?"cut":s.transitionAfter,
        transitionFrames:shots.indexOf(s)===shots.length-1||s.transitionAfter==="cut"?0:s.transitionFrames,
        ...(s.mediaName?{media:{kind:files.find(f=>f.name===s.mediaName)?.kind,file:s.mediaName}}:{}),
        ...(s.foregroundName?{foreground:{file:s.foregroundName}}:{})
      })),
      ...(voiceFile?{voice:{file:voiceFile,label:"Voix choisie ou enregistrée",volume:1}}:{}),
      ...(musicFile?{music:{file:musicFile,label:"Bande-son fournie",volume:0.10}}:{}),
      ...(outroFile?{outro:{file:outroFile,durationFrames:90}}:{})
    };
    const blob=new Blob([JSON.stringify(project,null,2)+"\n"],{type:"application/json"});
    const url=URL.createObjectURL(blob);
    const link=document.createElement("a");link.href=url;link.download=mkSlug(projectName)+".json";
    document.body.append(link);link.click();link.remove();
    window.setTimeout(()=>URL.revokeObjectURL(url),1000);
    setFeedback("Projet JSON exporté. Conserve les fichiers médias dans un dossier assets/ portant les mêmes noms avant rendu.");
  };
  return <section className="wvc-board" aria-label="Atelier de composition audiovisuelle">
    <header className="wvc-head">
      <div className="wvc-eyebrow">WORLD-VISION · CREATIVE WORKBENCH</div>
      <h2>Les médias d'abord. <em>La réalisation ensuite.</em></h2>
      <p>Apporte ton texte, tes photographies, tes vidéos et tes sons. Construis des plans à partir de vrais éléments, et prépare un montage exploitable par Remotion sans dépendre d'une voix imposée.</p>
      <div className="wvc-disclaimer">Espace de préparation <strong>local dans ce navigateur</strong> : les fichiers ne sont pas envoyés à GitHub ou au serveur. L'export JSON prépare un rendu par notre moteur ; il ne produit pas encore de MP4 depuis cet écran.</div>
    </header>
    <div className="wvc-workspace">
      <div className="wvc-inputs">
        <label className="wvc-field-label" htmlFor="wvc-project">PROJET</label>
        <input id="wvc-project" className="wvc-input" value={projectName} onChange={e=>setProjectName(e.target.value)} maxLength={160}/>
        <label className="wvc-field-label" htmlFor="wvc-script">SCRIPT FOURNI</label>
        <textarea id="wvc-script" className="wvc-script" value={script} onChange={e=>setScript(e.target.value)} placeholder="Colle ici ton script déjà rédigé. Le moteur de montage ne le réécrit pas." rows={8}/>
        <div className="wvc-script-meta">{script.trim()?script.trim().split(/\s+/).length+" mots":"Aucun script"} · Le texte reste sous ton contrôle.</div>
        <label className="wvc-field-label" htmlFor="wvc-import">IMPORTER TES FICHIERS</label>
        <input id="wvc-import" type="file" multiple accept="image/*,video/*,audio/*" onChange={addFiles}/>
        <p className="wvc-hint">Photos, rushes, animations MP4 produites ici ou ailleurs, voix enregistrée et musique. Les doublons de noms sont refusés.</p>
        <div className="wvc-asset-list">
          {files.length===0&&<span className="wvc-muted">Aucun fichier importé pour le moment.</span>}
          {files.map(f=><div className="wvc-asset" key={f.name}><b>{f.kind==="image"?"PHOTO":f.kind==="video"?"VIDÉO":"AUDIO"}</b><span title={f.name}>{f.name}</span><small>{(f.size/1024/1024).toFixed(1)} Mo</small></div>)}
        </div>
        <div className="wvc-audio">
          <label htmlFor="wvc-voice">VOIX / NARRATION</label>
          <select id="wvc-voice" value={voiceFile} onChange={e=>setVoiceFile(e.target.value)}>
            <option value="">Aucune — la voix pourra être choisie plus tard</option>
            {files.filter(f=>f.kind==="audio").map(f=><option key={f.name} value={f.name}>{f.name}</option>)}
          </select>
          <label htmlFor="wvc-voice-b">AUTRE PRISE À COMPARER</label>
          <select id="wvc-voice-b" value={comparisonVoice} onChange={e=>setComparisonVoice(e.target.value)}>
            <option value="">Aucune autre prise sélectionnée</option>
            {files.filter(f=>f.kind==="audio"&&f.name!==voiceFile).map(f=><option key={f.name} value={f.name}>{f.name}</option>)}
          </select>
          <div className="wvc-auditions" aria-label="Écoute comparative des voix fournies">
            {([
              ["A — Voix principale",voiceFile],
              ["B — Comparaison, non exportée",comparisonVoice]
            ] as [string,string][]).filter(x=>x[1]&&files.some(f=>f.name===x[1])).map(([label,name])=>{
              const audio=files.find(f=>f.name===name);
              return <div className="wvc-audition" key={label}>
                <span>{label}</span>
                <strong>{name}</strong>
                <audio controls preload="none" src={audio?.url} aria-label={label+": "+name}/>
              </div>;
            })}
          </div>
          <p className="wvc-hint">Écoute les deux prises du même texte au même volume. Aucune voix n'est générée automatiquement ; seule la prise principale est exportée dans le projet.</p>
          <label htmlFor="wvc-music">MUSIQUE / AMBIANCE</label>
          <select id="wvc-music" value={musicFile} onChange={e=>setMusicFile(e.target.value)}>
            <option value="">Aucune</option>
            {files.filter(f=>f.kind==="audio").map(f=><option key={f.name} value={f.name}>{f.name}</option>)}
          </select>
          <label htmlFor="wvc-outro">SIGNATURE VIDÉO ORIGINALE</label>
          <select id="wvc-outro" value={outroFile} onChange={e=>setOutroFile(e.target.value)}>
            <option value="">Pas de signature ajoutée à ce stade</option>
            {files.filter(f=>f.kind==="video").map(f=><option key={f.name} value={f.name}>{f.name}</option>)}
          </select>
        </div>
      </div>
      <div className="wvc-edit">
        <div className="wvc-edit-head"><div><span>LE CONDUCTEUR DE MONTAGE</span><h3>Plans et compositions</h3></div><button type="button" onClick={addShot}>+ Ajouter un plan</button></div>
        <div className="wvc-shots" role="list" aria-label="Ordre des plans">
          {shots.map((s,i)=><button type="button" role="listitem" key={s.id} className={"wvc-shot "+(s.id===selectedId?"selected":"")} onClick={()=>setSelectedId(s.id)}>
            <b>{String(i+1).padStart(2,"0")}</b><span><strong>{s.title||TEMPLATE_LABELS[s.template]}</strong><small>{(s.durationFrames/30).toFixed(1)}s · {s.template}</small></span>
          </button>)}
        </div>
        <div className="wvc-shot-form">
          <div className="wvc-control-row"><strong>PLAN : {active.id}</strong><div><button type="button" onClick={()=>move(-1)} aria-label="Monter le plan">↑</button><button type="button" onClick={()=>move(1)} aria-label="Descendre le plan">↓</button><button type="button" onClick={removeShot} disabled={shots.length===1}>Supprimer</button></div></div>
          <div className="wvc-two-col">
            <label>TYPE DE COMPOSITION<select value={active.template} onChange={e=>updateShot({template:e.target.value as Template,geoShowCamera:e.target.value==="geo_story"?active.geoShowCamera:false,geoShowRoute:e.target.value==="geo_story"?active.geoShowRoute:false,geoShowCountry:e.target.value==="country_focus"?true:active.geoShowCountry,durationFrames:e.target.value==="focus_reveal"?Math.max(active.durationFrames,90):e.target.value==="document_focus"?Math.max(active.durationFrames,115):(e.target.value==="geo_story"||e.target.value==="country_focus")?Math.max(active.durationFrames,150):active.durationFrames})}>{templates.map(t=><option key={t} value={t}>{TEMPLATE_LABELS[t]}</option>)}</select></label>
            <label>DURÉE DU PLAN (SECONDES)<input type="number" min=".5" max="120" step=".1" value={active.durationFrames/30} onChange={e=>{const v=Number(e.target.value);if(Number.isFinite(v)&&v>=.5&&v<=120)updateShot({durationFrames:Math.round(v*30)});}}/></label>
          </div>
          <label className="wvc-wide">MÉDIA SOURCE<select value={active.mediaName} onChange={e=>updateShot({mediaName:e.target.value})}>
            <option value="">Pas de média source</option>
            {files.filter(f=>f.kind!=="audio").map(f=><option key={f.name} value={f.name}>{f.name}</option>)}
          </select></label>
          <label className="wvc-wide">DÉTOURAGE POUR EFFET DE PROFONDEUR
            <select value={active.foregroundName} onChange={e=>updateShot({foregroundName:e.target.value})}>
              <option value="">Aucun — composition classique</option>
              {files.filter(f=>f.kind==="image"&&/\.(png|webp)$/i.test(f.name)).map(f=><option key={f.name} value={f.name}>{f.name}</option>)}
            </select>
            <span className="wvc-hint">Utiliser uniquement un premier plan transparent préparé avec un outil spécialisé ; le studio effectue le compositing et le mouvement 2,5D sans inventer une image.</span>
          </label>
          <label className="wvc-wide">TITRE À L'ÉCRAN<input value={active.title} maxLength={150} onChange={e=>updateShot({title:e.target.value})} placeholder="Court, lisible, sans surcharge"/></label>
          <label className="wvc-wide">TEXTE SECONDAIRE<input value={active.subtitle} onChange={e=>updateShot({subtitle:e.target.value})} placeholder="Une seule idée claire"/></label>
          {active.template==="geo_story"&&<div className="wvc-focus-control" aria-label="Direction du plan géographique">
            <div className="wvc-focus-heading">
              <strong>CARTE DU MONDE — DIRECTION GÉOGRAPHIQUE</strong>
              <span>Frontières Natural Earth réelles. Toutes les positions, routes et données doivent être choisies et vérifiées manuellement. Pas de chiffres ou de géocodage inventés.</span>
            </div>
            <label>MATIÈRE DE LA TERRE
              <select value={active.geoLook} onChange={e=>updateShot({geoLook:e.target.value as "photo"|"vector"})}>
                <option value="photo">Terre 3D · photographie NASA Blue Marble (2004)</option>
                <option value="vector">Carte vectorielle · Natural Earth (alternative explicite)</option>
              </select>
            </label>
            <div className="wvc-two-col">
              <label>CENTRE LONGITUDE
                <input type="number" min="-180" max="180" step=".1" value={active.geoLon}
                  onChange={e=>updateShot({geoLon:Number(e.target.value)})}/>
              </label>
              <label>CENTRE LATITUDE
                <input type="number" min="-85" max="85" step=".1" value={active.geoLat}
                  onChange={e=>updateShot({geoLat:Number(e.target.value)})}/>
              </label>
              <label>ROTATION PENDANT LE PLAN · DEGRÉS
                <input type="number" min="-360" max="360" step="1" value={active.geoSpin}
                  onChange={e=>updateShot({geoSpin:Number(e.target.value)})}/>
              </label>
            </div>
            <label className="wvc-geo-toggle"><input type="checkbox" checked={active.geoShowCamera}
              onChange={e=>updateShot({geoShowCamera:e.target.checked})}/>
              Caméra géographique dirigée · depuis le centre initial vers une destination choisie
            </label>
            {active.geoShowCamera&&<div className="wvc-two-col">
              <label>DESTINATION · LONGITUDE
                <input type="number" min="-180" max="180" step=".01" value={active.geoToLon}
                  onChange={e=>updateShot({geoToLon:Number(e.target.value)})}/>
              </label>
              <label>DESTINATION · LATITUDE
                <input type="number" min="-85" max="85" step=".01" value={active.geoToLat}
                  onChange={e=>updateShot({geoToLat:Number(e.target.value)})}/>
              </label>
              <label>DÉBUT DU MOUVEMENT (s)
                <input type="number" min="0" step=".1" value={active.geoCameraStart/30}
                  onChange={e=>updateShot({geoCameraStart:Math.round(Number(e.target.value)*30)})}/>
              </label>
              <label>FIN DU MOUVEMENT (s)
                <input type="number" min="1" step=".1" value={active.geoCameraEnd/30}
                  onChange={e=>updateShot({geoCameraEnd:Math.round(Number(e.target.value)*30)})}/>
              </label>
              <label>APPROCHE OPTIQUE DE LA PLANÈTE
                <input type="number" min="1" max="1.15" step=".01" value={active.geoCameraZoom}
                  onChange={e=>updateShot({geoCameraZoom:Number(e.target.value)})}/>
              </label>
            </div>}
            <p className="wvc-hint">La caméra suit un arc géodésique court puis reste orientée sur la destination. Le zoom optique est limité à 15 % dans l'œil ; un vrai zoom pleine carte/pays nécessitera une composition distincte. Vérifie la destination et le rendu avant tout reportage.</p>
            <label className="wvc-geo-toggle"><input type="checkbox" checked={active.geoShowCountry}
              onChange={e=>updateShot({geoShowCountry:e.target.checked})}/>
              Mettre en lumière le contour d'un pays (Natural Earth / World Atlas 110m)
            </label>
            {active.geoShowCountry&&<label>PAYS SÉLECTIONNÉ DANS L'ATLAS
              <select value={active.geoCountryId} onChange={e=>updateShot({geoCountryId:e.target.value})}>
                <option value="">Choisir explicitement un pays du référentiel</option>
                {COUNTRIES.map(country=><option key={country.id} value={country.id}>
                  {country.name} · {country.id}
                </option>)}
              </select>
              <span className="wvc-hint">L'atlas 110m simplifie les frontières et omet des territoires. Ce dessin n'est pas une prise de position sur un différend territorial. Vérifier carte, source et période avant publication.</span>
            </label>}
            <label className="wvc-geo-toggle"><input type="checkbox" checked={active.geoShowTarget}
              onChange={e=>updateShot({geoShowTarget:e.target.checked,geoShowRoute:e.target.checked?active.geoShowRoute:false})}/>
              Localiser un lieu explicitement indiqué
            </label>
            {active.geoShowTarget&&<div className="wvc-two-col">
              <label>LIEU · LONGITUDE <input type="number" min="-180" max="180" step=".01"
                value={active.geoTargetLon} onChange={e=>updateShot({geoTargetLon:Number(e.target.value)})}/></label>
              <label>LIEU · LATITUDE <input type="number" min="-85" max="85" step=".01"
                value={active.geoTargetLat} onChange={e=>updateShot({geoTargetLat:Number(e.target.value)})}/></label>
              <label>NOM DU LIEU <input value={active.geoTargetLabel} maxLength={80}
                onChange={e=>updateShot({geoTargetLabel:e.target.value})}/></label>
            </div>}
            {active.geoShowTarget&&<label className="wvc-geo-toggle"><input type="checkbox" checked={active.geoShowRoute}
              onChange={e=>updateShot({geoShowRoute:e.target.checked})}/>Tracer un arc géographique réel</label>}
            {active.geoShowRoute&&<div className="wvc-two-col">
              <label>DÉPART · LONGITUDE <input type="number" min="-180" max="180" step=".01"
                value={active.geoFromLon} onChange={e=>updateShot({geoFromLon:Number(e.target.value)})}/></label>
              <label>DÉPART · LATITUDE <input type="number" min="-85" max="85" step=".01"
                value={active.geoFromLat} onChange={e=>updateShot({geoFromLat:Number(e.target.value)})}/></label>
            </div>}
            <label className="wvc-geo-toggle"><input type="checkbox" checked={active.geoShowMetric}
              onChange={e=>updateShot({geoShowMetric:e.target.checked})}/>Animer une donnée du script (chiffre vérifié)</label>
            {active.geoShowMetric&&<div className="wvc-two-col">
              <label>LIBELLÉ <input maxLength={55} value={active.geoMetricLabel}
                onChange={e=>updateShot({geoMetricLabel:e.target.value})}/></label>
              <label>VALEUR <input inputMode="decimal" value={active.geoMetricValue}
                onChange={e=>updateShot({geoMetricValue:e.target.value})}/></label>
              <label>UNITÉ <input maxLength={12} value={active.geoMetricUnit}
                onChange={e=>updateShot({geoMetricUnit:e.target.value})}/></label>
            </div>}
            <p className="wvc-hint">Une photographie ou un extrait vidéo importé dans « Média source » apparaît dans la même composition que le globe, l'arc, les chiffres et les titres. Aucun élément n'est censé illustrer une actualité sans provenance vérifiée.</p>
          </div>}
          {active.template==="country_focus"&&<div className="wvc-focus-control" aria-label="Direction d'un pays / Motion GEO-2">
            <div className="wvc-focus-heading">
              <strong>GEO-2 · PAYS EN DÉTAIL — CARTE ET MÉDIAS MULTICOUCHES</strong>
              <span>Choisir une vraie géométrie Natural Earth 1:10m. Le contexte vient du 1:50m. La caméra, la silhouette, le média, la donnée et le texte sont animés indépendamment.</span>
            </div>
            <Suspense fallback={<div className="wvc-hint">Chargement du référentiel géographique détaillé…</div>}>
              <CountrySelector10m value={active.geoCountryId} onChange={id=>updateShot({geoCountryId:id})}/>
            </Suspense>
            <label className="wvc-geo-toggle"><input type="checkbox" checked={active.geoShowTarget}
              onChange={e=>updateShot({geoShowTarget:e.target.checked})}/>Repérer un lieu situé dans ce pays (coordonnées sourcées)</label>
            {active.geoShowTarget&&<div className="wvc-two-col">
              <label>LONGITUDE <input type="number" min="-180" max="180" step=".01" value={active.geoTargetLon}
                onChange={e=>updateShot({geoTargetLon:Number(e.target.value)})}/></label>
              <label>LATITUDE <input type="number" min="-85" max="85" step=".01" value={active.geoTargetLat}
                onChange={e=>updateShot({geoTargetLat:Number(e.target.value)})}/></label>
              <label>LIBELLÉ DU LIEU <input maxLength={80} value={active.geoTargetLabel}
                onChange={e=>updateShot({geoTargetLabel:e.target.value})}/></label>
            </div>}
            <label className="wvc-geo-toggle"><input type="checkbox" checked={active.geoShowMetric}
              onChange={e=>updateShot({geoShowMetric:e.target.checked})}/>Animer une donnée chiffrée du script</label>
            {active.geoShowMetric&&<div className="wvc-two-col">
              <label>LIBELLÉ <input maxLength={55} value={active.geoMetricLabel}
                onChange={e=>updateShot({geoMetricLabel:e.target.value})}/></label>
              <label>VALEUR <input inputMode="decimal" value={active.geoMetricValue}
                onChange={e=>updateShot({geoMetricValue:e.target.value})}/></label>
              <label>UNITÉ <input maxLength={12} value={active.geoMetricUnit}
                onChange={e=>updateShot({geoMetricUnit:e.target.value})}/></label>
            </div>}
            <p className="wvc-hint">Un marqueur doit appartenir au pays sélectionné selon la géométrie de l'atlas. Le validateur serveur refuse les positions extérieures. Photo/vidéo et éventuel détourage transparent se choisissent dans les champs « Média source » et « Détourage » au-dessus. Aucun chiffre, droit d'image ou événement n'est vérifié automatiquement.</p>
          </div>}
          {active.template==="document_focus"&&<div className="wvc-focus-control" aria-label="Sélection de la zone du document à inspecter">
            <div className="wvc-focus-heading">
              <strong>ZONE DU DOCUMENT À METTRE EN LUMIÈRE</strong>
              <span>Les coordonnées s'appliquent à la feuille affichée en entier, et non à une reconstitution IA. Vérifie les mots et chiffres avant diffusion.</span>
            </div>
            <label>GAUCHE · {Math.round(active.documentX*100)} %
              <input type="range" min="0" max={Math.round((1-active.documentW)*100)} step="1"
                value={Math.round(active.documentX*100)}
                onChange={e=>updateShot({documentX:Number(e.target.value)/100})}/>
            </label>
            <label>HAUT · {Math.round(active.documentY*100)} %
              <input type="range" min="0" max={Math.round((1-active.documentH)*100)} step="1"
                value={Math.round(active.documentY*100)}
                onChange={e=>updateShot({documentY:Number(e.target.value)/100})}/>
            </label>
            <label>LARGEUR · {Math.round(active.documentW*100)} %
              <input type="range" min="12" max="85" step="1"
                value={Math.round(active.documentW*100)}
                onChange={e=>{const width=Number(e.target.value)/100;updateShot({documentW:width,documentX:Math.min(active.documentX,1-width)});}}/>
            </label>
            <label>HAUTEUR · {Math.round(active.documentH*100)} %
              <input type="range" min="8" max="80" step="1"
                value={Math.round(active.documentH*100)}
                onChange={e=>{const height=Number(e.target.value)/100;updateShot({documentH:height,documentY:Math.min(active.documentY,1-height)});}}/>
            </label>
          </div>}
          <div className="wvc-focus-control" aria-label="Cadrage précis de l’image source">
            <div className="wvc-focus-heading"><strong>CADRAGE ET POINT D’INTÉRÊT</strong><span>Sauvegardé dans le projet Remotion</span></div>
            <label>HORIZONTAL · {Math.round(active.focusX*100)} %
              <input type="range" min="0" max="100" step="1" value={Math.round(active.focusX*100)}
                onChange={e=>updateShot({focusX:Number(e.target.value)/100})}/>
            </label>
            <label>VERTICAL · {Math.round(active.focusY*100)} %
              <input type="range" min="0" max="100" step="1" value={Math.round(active.focusY*100)}
                onChange={e=>updateShot({focusY:Number(e.target.value)/100})}/>
            </label>
          </div>
          <div className="wvc-two-col">
            <label>MOUVEMENT<select value={active.motion} onChange={e=>updateShot({motion:e.target.value as Motion})}>{motions.map(m=><option key={m} value={m}>{MOTION_LABELS[m]}</option>)}</select></label>
            <label>RACCORD<select value={active.transitionAfter} onChange={e=>updateShot({transitionAfter:e.target.value as Transition,transitionFrames:e.target.value==="cut"?0:Math.max(active.transitionFrames,8)})}>{(Object.keys(TRANSITIONS) as Transition[]).map(t=><option key={t} value={t}>{TRANSITIONS[t]}</option>)}</select></label>
          </div>
        </div>
        <div className="wvc-export">
          <div className="wvc-export-top"><strong>MASTER VISÉ · 9:16 · 1080×1920 · 30 ips</strong><span>{(duration/30).toFixed(1)} secondes</span></div>
          <p>Une fois le JSON exporté, les médias peuvent être montés par le moteur Remotion de World‑Vision. Les effets professionnels avancés ou génératifs resteront accessibles par des outils spécialisés.</p>
          <button type="button" disabled={!canExport} onClick={exportProject}>Exporter le projet de montage (.json)</button>
          <a href={path} target="_blank" rel="noopener noreferrer">Voir le processus de rendu et les limites ↗</a>
          {feedback&&<div className="wvc-feedback" role="status">{feedback}</div>}
        </div>
      </div>
      <aside className="wvc-preview">
        <div className="wvc-preview-title">APERÇU DE PRODUCTION · 9:16</div>
        <div className="wvc-preview-switch" aria-label="Choisir le mode de visionnage">
          <button type="button" className={previewMode==="shot"?"selected":""} onClick={()=>setPreviewMode("shot")}>
            <span aria-hidden="true">▶</span> Plan animé
          </button>
          <button type="button" className={previewMode==="film"?"selected":""} onClick={()=>setPreviewMode("film")}>
            <span aria-hidden="true">▶</span> Film entier
          </button>
          <button type="button" className={previewMode==="source"?"selected":""} onClick={()=>setPreviewMode("source")}>
            Média original
          </button>
        </div>
        {previewMode==="source"&&active.template!=="document_focus"&&<button type="button" className="wvc-crop-toggle" onClick={()=>setCroppedPreview(x=>!x)}>
          {croppedPreview?"Afficher la source complète":"Visualiser le cadrage 9:16"}
        </button>}
        <div className="wvc-device">
          {previewMode==="shot" ? (
            previewCanRender ? <Suspense fallback={<div className="wvc-player-loading">Chargement du vrai moteur Remotion…</div>}>
              <RealCreativePreview props={previewProps} previewId={active.id} label={"Composition du "+active.id}/>
            </Suspense> : <div className="wvc-player-loading">{active.template==="geo_story"?"Valide le titre, le centre géographique et les éventuels points, trajets ou chiffres avant de prévisualiser.":"Ajoute un visuel et un titre conforme à ce plan avant de visionner sa véritable animation."}</div>
          ) : previewMode==="film" ? (
            fullFilmCanRender ? <Suspense fallback={<div className="wvc-player-loading">Préparation de la timeline Remotion complète…</div>}>
              <RealCreativePreview props={fullFilmProps} previewId="film-complet" label="Visionnage du reportage intégral avec ses transitions et les pistes audio sélectionnées"/>
            </Suspense> : <div className="wvc-player-loading">Le film complet exige un script, des plans valides et leurs médias. Maximum 10 minutes dans ce profil.</div>
          ) : <>
          {active.template==="document_focus"&&activeAsset?.kind==="image"
            ? <div className="wvc-document-source" aria-label="Aperçu de l'intégralité du document avec région sélectionnée">
                <div className="wvc-document-page">
                  <img src={activeAsset.url} alt={"Document source, inchangé : "+activeAsset.name}/>
                  <div className="wvc-document-region" style={{
                    left:(active.documentX*100)+"%",top:(active.documentY*100)+"%",
                    width:(active.documentW*100)+"%",height:(active.documentH*100)+"%"
                  }} aria-label="Rectangle de mise au point défini par l'utilisateur"/>
                </div>
                <small>Zone choisie : contenu réel seulement</small>
              </div>
            :activeAsset?.kind==="image"&&<img src={activeAsset.url} alt={"Média source : "+activeAsset.name} style={{objectFit:croppedPreview?"cover":"contain",objectPosition:Math.round(active.focusX*100)+"% "+Math.round(active.focusY*100)+"%"}}/>}
          {activeAsset?.kind==="video"&&<video src={activeAsset.url} controls playsInline preload="metadata" style={{objectFit:croppedPreview?"cover":"contain",objectPosition:Math.round(active.focusX*100)+"% "+Math.round(active.focusY*100)+"%"}}/>}
          {!activeAsset&&<div className="wvc-no-preview"><span>WORLD—VISION</span><strong>TON MÉDIA<br/>ICI</strong><small>L'image d'actualité doit être fournie ou choisie explicitement.</small></div>}
          </>}
        </div>
        <p>{previewMode==="film"
          ? "Timeline Remotion réelle : plans, raccords, narration et musique importées. Ce n'est pas encore un export MP4 ; la lecture des codecs et la fluidité dépendent du téléphone. Vérifie toujours le master avant diffusion."
          : previewMode==="shot"
          ? "Même composition que le moteur de rendu, sur le plan seul. La narration et les raccords des autres plans ne sont pas inclus dans ce mode."
          : active.template==="document_focus"
          ? "Aperçu de la page originale et de la région choisie. Aucune citation n'est reconstituée ; la caméra et le titre apparaissent uniquement dans le vrai Player."
          : (croppedPreview?"Cadrage source 9:16 uniquement, sans titres ni animation.":"Fichier source complet, sans recadrage.")}</p>
        <label className="wvc-accent">ACCENT GRAPHIQUE <input type="color" value={accent} onChange={e=>setAccent(e.target.value)}/></label>
      </aside>
    </div>
  </section>;
}
