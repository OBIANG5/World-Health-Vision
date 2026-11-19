import {useEffect, useMemo, useRef, useState, type ChangeEvent} from "react";
import "./CinematicProductionBoard.css";

type Template = "documentary"|"kinetic"|"evidence"|"number"|"clean_video"|"focus_reveal";
type Motion = "locked"|"dolly"|"drift"|"push";
type Transition = "cut"|"dissolve"|"slide";
type MediaType = "image"|"video"|"audio";
type Asset = {name:string;size:number;kind:MediaType;url:string};
type Shot = {
  id:string;title:string;subtitle:string;eyebrow:string;durationFrames:number;
  template:Template;motion:Motion;transitionAfter:Transition;transitionFrames:number;
  mediaName:string;focusX:number;focusY:number;
};
const TEMPLATE_LABELS:Record<Template,string>={
  documentary:"Photographie / reportage",focus_reveal:"Révélation cinématographique du visuel",kinetic:"Typographie cinématique",
  evidence:"Focus sur un document",number:"Chiffre important",clean_video:"Clip intégral / animation externe"
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
  template:"kinetic",motion:"locked",transitionAfter:"cut",transitionFrames:0,mediaName:"",focusX:0.5,focusY:0.5
});
const mkSlug=(value:string)=>("wv-"+value.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g,"").replace(/[^a-z0-9_-]+/g,"-").replace(/^-+|-+$/g,"").slice(0,60))||"wv-projet";
const path="https://github.com/OBIANG5/World-Health-Vision/blob/feature/worldvision-cinematic-director-gates-2026-11-19/worldhealth-vision-v2/docs/media/WORLDVISION_CREATIVE_EDIT_HANDOFF_2026-11-19.md";

export default function CinematicProductionBoard() {
  const [projectName,setProjectName]=useState("Nouvelle production World-Vision");
  const [script,setScript]=useState("");
  const [files,setFiles]=useState<Asset[]>([]);
  const [shots,setShots]=useState<Shot[]>([initialShot()]);
  const [selectedId,setSelectedId]=useState("plan-01");
  const [voiceFile,setVoiceFile]=useState("");
  const [musicFile,setMusicFile]=useState("");
  const [outroFile,setOutroFile]=useState("");
  const [accent,setAccent]=useState("#8bbecf");
  const [feedback,setFeedback]=useState("");
  const [croppedPreview,setCroppedPreview]=useState(true);
  const createdUrls=useRef<string[]>([]);
  useEffect(()=>()=>{for(const url of createdUrls.current)URL.revokeObjectURL(url);},[]);
  const active=useMemo(()=>shots.find(s=>s.id===selectedId)??shots[0],[shots,selectedId]);
  const activeAsset=files.find(f=>f.name===active.mediaName);
  const canExport=script.trim().length>0&&shots.every(shot=>{
    const requires=["documentary","evidence","clean_video","focus_reveal"].includes(shot.template);
    const hasMedia=!requires||Boolean(shot.mediaName&&files.some(f=>f.name===shot.mediaName));
    const validFocus=shot.template!=="focus_reveal"||Boolean(shot.title.trim()&&shot.title.length<=90&&shot.durationFrames>=90);
    return hasMedia&&validFocus;
  });
  const shotsDuration=shots.reduce((sum,s,i)=>
    sum+s.durationFrames-(i<shots.length-1&&s.transitionAfter!=="cut"?s.transitionFrames:0),0);
  const duration=shotsDuration+(outroFile?90:0);
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
        motion:s.motion,transitionAfter:shots.indexOf(s)===shots.length-1?"cut":s.transitionAfter,
        transitionFrames:shots.indexOf(s)===shots.length-1||s.transitionAfter==="cut"?0:s.transitionFrames,
        ...(s.mediaName?{media:{kind:files.find(f=>f.name===s.mediaName)?.kind,file:s.mediaName}}:{})
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
            <label>TYPE DE COMPOSITION<select value={active.template} onChange={e=>updateShot({template:e.target.value as Template,durationFrames:e.target.value==="focus_reveal"?Math.max(active.durationFrames,90):active.durationFrames})}>{templates.map(t=><option key={t} value={t}>{TEMPLATE_LABELS[t]}</option>)}</select></label>
            <label>DURÉE DU PLAN (SECONDES)<input type="number" min=".5" max="120" step=".1" value={active.durationFrames/30} onChange={e=>{const v=Number(e.target.value);if(Number.isFinite(v)&&v>=.5&&v<=120)updateShot({durationFrames:Math.round(v*30)});}}/></label>
          </div>
          <label className="wvc-wide">MÉDIA SOURCE<select value={active.mediaName} onChange={e=>updateShot({mediaName:e.target.value})}>
            <option value="">Pas de média source</option>
            {files.filter(f=>f.kind!=="audio").map(f=><option key={f.name} value={f.name}>{f.name}</option>)}
          </select></label>
          <label className="wvc-wide">TITRE À L'ÉCRAN<input value={active.title} maxLength={150} onChange={e=>updateShot({title:e.target.value})} placeholder="Court, lisible, sans surcharge"/></label>
          <label className="wvc-wide">TEXTE SECONDAIRE<input value={active.subtitle} onChange={e=>updateShot({subtitle:e.target.value})} placeholder="Une seule idée claire"/></label>
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
        <div className="wvc-preview-title">APERÇU DU MÉDIA SOURCE</div>
        <button type="button" className="wvc-crop-toggle" onClick={()=>setCroppedPreview(x=>!x)}>
          {croppedPreview?"Afficher la source complète":"Visualiser le cadrage 9:16"}
        </button>
        <div className="wvc-device">
          {activeAsset?.kind==="image"&&<img src={activeAsset.url} alt={"Média source : "+activeAsset.name} style={{objectFit:croppedPreview?"cover":"contain",objectPosition:Math.round(active.focusX*100)+"% "+Math.round(active.focusY*100)+"%"}}/>}
          {activeAsset?.kind==="video"&&<video src={activeAsset.url} controls playsInline preload="metadata" style={{objectFit:croppedPreview?"cover":"contain",objectPosition:Math.round(active.focusX*100)+"% "+Math.round(active.focusY*100)+"%"}}/>}
          {!activeAsset&&<div className="wvc-no-preview"><span>WORLD—VISION</span><strong>TON MÉDIA<br/>ICI</strong><small>L'image d'actualité doit être fournie ou choisie explicitement.</small></div>}
        </div>
        <p>{croppedPreview?"Cadrage source 9:16 uniquement (sans les effets, titres ni animation).":"Fichier source complet sans recadrage."} Les animations finales sont calculées par Remotion, pas simulées ici.</p>
        <label className="wvc-accent">ACCENT GRAPHIQUE <input type="color" value={accent} onChange={e=>setAccent(e.target.value)}/></label>
      </aside>
    </div>
  </section>;
}
