/**
 * World-Vision — revue humaine et validation granulaire.
 *
 * Scoring is deliberately not a publishing or rendering endpoint.
 * The static phone archive has no authenticated backend. Drafts stay local.
 * On deliberate submission, GitHub opens a PRE-FILLED issue that the user
 * must submit themselves; this avoids ever exposing a GitHub token in JS.
 */
import {useEffect, useMemo, useRef, useState} from "react";
import type {MediaStory} from "./types";
import "./ReviewStudio.css";
import BrandEvidence from "./BrandEvidence";
import CreativeDirections, {type DirectionId} from "./CreativeDirections";

type GateId = "identite" | "direction" | "script" | "medias" | "voix" | "animation" | "montage" | "publication" | "video";
type Decision = "a_corriger" | "refuse" | "valide";
type Review = {
  version: 1;
  global: number | null;
  notes: string;
  priorities: string;
  decision: Decision;
  scores: Record<string,number|null>;
  blockers: string[];
};
const repo = "OBIANG5/World-Health-Vision";
const GATES:ReadonlyArray<{
  id:GateId;number:string;name:string;subtitle:string;deliverable:string;
  required:string[];hint:string;
}> = [
  {id:"identite",number:"00",name:"Identité & logo",subtitle:"Charte World-Vision",
    deliverable:"Logo original approuvé, déclinaisons et planche de charte",
    required:["logo","couleurs","typographie","lisibilite"],
    hint:"Le fichier officiel de l’œil-globe bleu est présent dans le site et Remotion. Les nouvelles couleurs attendront."},
  {id:"direction",number:"01",name:"Direction artistique",subtitle:"Choisir l'ouverture du reportage",
    deliverable:"Trois compositions verticales avec le vrai logo ; une seule sera retenue",
    required:["logo","accroche","images","couleurs","luminosite","lisibilite","composition"],
    hint:"Choisis une direction A, B ou C et note-la. Nous ne produirons pas de clip animé sans ton accord."},
  {id:"script",number:"02",name:"Sujet & script",subtitle:"Accroche, faits, angle",
    deliverable:"Script versionné et affirmations liées aux sources",
    required:["accroche","exactitude","narration","rythme"],
    hint:"Relis le récit et compare toutes les affirmations aux sources primaires avant de l'approuver."},
  {id:"medias",number:"03",name:"Images & plans",subtitle:"Pertinence et authenticité",
    deliverable:"Sélection de plans avec licences, sources et autorisations",
    required:["images","authenticite","luminosite","variete"],
    hint:"Une illustration générée n'est pas une image de l'événement réel. Les plans doivent être authentiques ou explicitement illustratifs."},
  {id:"voix",number:"04",name:"Voix & narration",subtitle:"Écoute comparative",
    deliverable:"Extrait de voix vérifié, avec diction et prosodie validées",
    required:["voix","diction","rythme","mixage"],
    hint:"La voix Piper du pilote est un premier essai rejeté ; il faut auditionner de vraies alternatives."},
  {id:"animation",number:"05",name:"Animations",subtitle:"Prototype de 3 à 6 s",
    deliverable:"Micro-animation mobile, avant le rendu intégral",
    required:["animations","transitions","luminosite","lisibilite"],
    hint:"Une animation indépendante est nécessaire. La vidéo COP31 complète n'est pas une validation de ce prototype."},
  {id:"montage",number:"06",name:"Montage & sound design",subtitle:"Rythme, plans, transitions",
    deliverable:"Version candidate avec voix et plans déjà approuvés",
    required:["montage","rythme","transitions","mixage","sous_titres"],
    hint:"Un rendu techniquement encodé peut être rejeté artistiquement. Tous les blocs doivent déjà avoir été validés."},
  {id:"publication",number:"07",name:"Exports & diffusion",subtitle:"TikTok, WhatsApp, conformité",
    deliverable:"Exports conformes, manifestes et preuves de canal",
    required:["conformite","sources","lisibilite","sous_titres"],
    hint:"Ce jalon ne peut pas être approuvé si aucun export autorisé n'a été produit."},
  {id:"video",number:"08",name:"Vidéo complète",subtitle:"Notation finale sur 10",
    deliverable:"Le MP4 exact, avec hash SHA-256 et évaluation de tous ses aspects",
    required:["logo","couleurs","luminosite","images","authenticite","voix","diction",
      "animations","transitions","rythme","mixage","sous_titres","exactitude","montage","lisibilite"],
    hint:"Tu peux noter et refuser le pilote COP31 tel qu'il existe. Ce retour ne publie jamais la vidéo."},
] as const;
const CRITERIA:Record<string,string> = {
  logo:"Logo officiel & placement",
  couleurs:"Couleurs & identité visuelle",
  typographie:"Typographie & hiérarchie",
  lisibilite:"Lisibilité sur téléphone",
  accroche:"Accroche et intérêt immédiat",
  composition:"Composition et direction artistique",
  exactitude:"Fiabilité des faits et des sources",
  narration:"Qualité du texte et des explications",
  rythme:"Rythme général et durée",
  images:"Pertinence et qualité des images",
  authenticite:"Authenticité des plans & droits",
  luminosite:"Luminosité et contraste",
  variete:"Variété des plans et compositions",
  voix:"Voix : naturel et expressivité",
  diction:"Prononciation et articulation",
  mixage:"Qualité sonore et mixage",
  animations:"Fluidité et originalité des animations",
  transitions:"Transitions",
  montage:"Cohérence du montage final",
  sous_titres:"Sous-titres et zones sûres",
  conformite:"Conformité du canal de publication",
  sources:"Sources et crédits à l'écran",
};
const SCORE_OPTIONS = [1,2,3,4,5,6,7,8,9,10] as const;
const START:Review = {version:1,global:null,notes:"",priorities:"",decision:"a_corriger",scores:{},blockers:[]};

function artifactRef(story:MediaStory,gate:GateId,style:DirectionId="terrain"):string|null {
  if(gate==="identite")return "official-eye-globe-blue-bc80fa70cebd566768bfb1703a0f1f636a78c196";
  if(gate==="direction")return `cop31-visual-opening-v1-${style}-logo-bc80fa70`;
  if(gate==="video"||gate==="montage")return story.render_job?.output_sha256 || null;
  if(gate==="voix")return story.voiceover?.id || null;
  if(gate==="script")return story.creative_package?.version ? `creative-v${story.creative_package.version}` : null;
  if(gate==="medias")return story.asset_bundle?.assets.length ? `assets-${story.asset_bundle.assets.length}` : null;
  if(gate==="publication")return story.publication_package?.manifest_sha256||null;
  return null;
}
function readDraft(key:string):Review {
  try {
    let raw:string|null=null;
    try{raw=window.localStorage.getItem(key);}catch{/* Browser may deny durable storage */}
    if(!raw){try{raw=window.sessionStorage.getItem(key);}catch{/* Ignore */}}
    if(!raw)return {...START,scores:{},blockers:[]};
    const parsed=JSON.parse(raw) as Partial<Review>;
    if(parsed.version!==1)return {...START,scores:{},blockers:[]};
    const scores:Record<string,number|null>={};
    for(const [criterion,number] of Object.entries(parsed.scores || {})){
      if(CRITERIA[criterion] && typeof number==="number" && Number.isInteger(number) && number>=1&&number<=10){
        scores[criterion]=number;
      }
    }
    return {version:1,
      global:typeof parsed.global==="number"&&parsed.global>=1&&parsed.global<=10?parsed.global:null,
      decision:["a_corriger","refuse","valide"].includes(parsed.decision||"")?parsed.decision as Decision:"a_corriger",
      notes:typeof parsed.notes==="string"?parsed.notes.slice(0,2500):"",
      priorities:typeof parsed.priorities==="string"?parsed.priorities.slice(0,1500):"",
      scores,blockers:(parsed.blockers || []).filter(s=>Boolean(CRITERIA[s])),
    };
  }catch{return {...START,scores:{},blockers:[]};}
}
function persistDraft(key:string,review:Review):boolean {
  const json=JSON.stringify(review);
  let written=false;
  try{window.localStorage.setItem(key,json);written=true;}catch{/* Safari privacy settings may deny access */}
  try{window.sessionStorage.setItem(key,json);written=true;}catch{/* Session storage may also be disabled */}
  return written;
}
function isEmptyDraft(review:Review):boolean {
  return review.global===null &&
    Object.values(review.scores).every(value=>value===null) &&
    review.blockers.length===0 && !review.notes.trim() && !review.priorities.trim();
}
type ArchivedReview = {
  story_id:string;gate_id:string;artifact_ref:string;video_sha256:string;
  decision:Decision;overall_score:number;category_scores:Record<string,number>;
  blocking_categories:string[];feedback:string;correction_priorities:string;
  github_issue:number;github_issue_url:string;reviewed_at:string;
};
const STANCE:Record<Decision,string> = {
  a_corriger:"À corriger",
  refuse:"Refusé",
  valide:"Je valide",
};
const jsonForReview=(story:MediaStory,gate:GateId,review:Review,style:DirectionId)=>{
  const g=GATES.find(item=>item.id===gate)!;
  return {
    schema_version:"world-vision-review-v1",
    kind:"editorial_human_feedback",
    reviewed_at:new Date().toISOString(),
    source:"World-Vision Media Studio",
    story_id:story.id,
    story_title:story.title,
    gate_id:gate,
    gate_name:g.name,
    artifact_ref:artifactRef(story,gate,style),
    art_direction_id:gate==="direction"?style:null,
    video_sha256:story.render_job?.output_sha256||null,
    decision:review.decision,
    overall_score:review.global,
    category_scores:Object.fromEntries(g.required.map(id=>[id,review.scores[id]??null])),
    blocking_categories:review.blockers.filter(id=>g.required.includes(id)),
    feedback:review.notes.trim(),
    correction_priorities:review.priorities.trim(),
    notes:"Ce document est un retour utilisateur, non un reçu de publication ni une autorisation de rendu automatique.",
  };
};
function ReviewForm({story,gate,previewMode,style}:{ 
  story:MediaStory;gate:GateId;previewMode:boolean;style:DirectionId;
}){
  const g=GATES.find(item=>item.id===gate)!;
  const ref=artifactRef(story,gate,style);
  const storageKey=`wv-review-v1:${story.id}:${gate}:${ref||"missing"}`;
  const [review,setReview]=useState<Review>(()=>readDraft(storageKey));
  const reviewRef=useRef(review);
  const [copyStatus,setCopyStatus]=useState("");
  const [storageWarning,setStorageWarning]=useState(false);
  const [archived,setArchived]=useState<ArchivedReview|null>(null);
  // Save on every interaction, BEFORE a view/tab or external link can unmount
  // this component. React effects alone can run too late on iOS webviews.
  const applyReview=(next:Review)=>{
    reviewRef.current=next;
    setReview(next);
    if(!persistDraft(storageKey,next))setStorageWarning(true);
  };
  const update=(patch:Partial<Review>)=>applyReview({...reviewRef.current,...patch});
  const fromArchive=(saved:ArchivedReview):Review=>({
    version:1,global:saved.overall_score,
    decision:saved.decision,notes:saved.feedback||"",priorities:saved.correction_priorities||"",
    scores:{...saved.category_scores},blockers:[...saved.blocking_categories],
  });
  useEffect(()=>{
    let alive=true;
    void (async()=>{
      try{
        const response=await fetch("./review-archive/cop31-video.json",{cache:"no-store"});
        if(!response.ok)return;
        const saved=await response.json() as ArchivedReview;
        if(!alive||saved.story_id!==story.id||saved.gate_id!==gate||saved.artifact_ref!==ref)return;
        setArchived(saved);
        if(isEmptyDraft(reviewRef.current))applyReview(fromArchive(saved));
      }catch{/* The live API may not expose a public static review archive */}
    })();
    return ()=>{alive=false;};
  },[story.id,gate,ref]);
  useEffect(()=>{
    const save=()=>{persistDraft(storageKey,reviewRef.current);};
    window.addEventListener("pagehide",save);
    document.addEventListener("visibilitychange",save);
    return ()=>{
      window.removeEventListener("pagehide",save);
      document.removeEventListener("visibilitychange",save);
    };
  },[storageKey]);
  const ratedCount=g.required.filter(id=>review.scores[id]!=null).length;
  const average=g.required.reduce((a,id)=>a+(review.scores[id]??0),0)/(ratedCount||1);
  const allStrong=review.global!==null&&review.global>=8&&ratedCount===g.required.length&&
    g.required.every(id=>(review.scores[id]??0)>=8)&&review.blockers.length===0;
  const hasArtifact=Boolean(ref);
  const acceptanceBlocked=review.decision==="valide"&&(!hasArtifact||!allStrong);
  // A low score and an explicit refusal ARE meaningful feedback, even if
  // the user doesn't type any comments. Do not silently disable the CTA.
  const ready=review.global!==null&&!acceptanceBlocked;
  const payload=()=>jsonForReview(story,gate,review,style);
  const githubLink=()=>{
    const data=payload();
    const title=`[WV-REVIEW] ${data.gate_id} · ${STANCE[data.decision]} · ${data.artifact_ref?.slice(0,12)||"sans-asset"}`;
    // Compact enough for in-app iOS browsers. The detailed JSON stays
    // available in the Copy / Export controls if comments are very long.
    const summary=[
      `# ${data.gate_name} — ${STANCE[data.decision]} (${data.overall_score}/10)`,
      `Dossier: ${data.story_id}`,
      `Vidéo SHA-256: ${data.video_sha256||"Aucun MP4"}`,
      `Livrable: ${data.artifact_ref||"Aucun"}`,
      `Notes: ${Object.entries(data.category_scores).map(([k,v])=>`${k}=${v}/10`).join(", ")}`,
      `Bloquants: ${data.blocking_categories.join(", ")||"aucun"}`,
      `Commentaires: ${data.feedback.slice(0,450)||"(aucun)"}`,
      `Corrections: ${data.correction_priorities.slice(0,350)||"(non précisées)"}`,
      `Source: world-vision-review-v1; avis de l'utilisateur à confirmer; aucun rendu ni publication autorisés.`,
    ].join("\n");
    return `https://github.com/${repo}/issues/new?title=${encodeURIComponent(title)}&body=${encodeURIComponent(summary)}`;
  };
  const copy=async()=>{
    if(review.global===null)return;
    const data=JSON.stringify(payload(),null,2);
    try{
      await navigator.clipboard.writeText(data);
      setCopyStatus("Évaluation copiée : colle-la dans ChatGPT ou conserve-la dans tes documents.");
    }catch{setCopyStatus("La copie n'a pas été autorisée par le navigateur. Utilise le lien GitHub.");}
  };
  const download=()=>{
    if(review.global===null)return;
    const blob=new Blob([JSON.stringify(payload(),null,2)+"\n"],{type:"application/json"});
    const url=URL.createObjectURL(blob);
    const link=document.createElement("a");
    link.href=url;
    link.download=`world-vision-review-${gate}-${(ref||"none").slice(0,12)}.json`;
    document.body.append(link);link.click();link.remove();
    URL.revokeObjectURL(url);
    setCopyStatus("Sauvegarde JSON créée sur ton appareil. Elle n'a pas été envoyée au serveur.");
  };
  return <div className="wv-review-panel" data-review-gate={gate}>
    {gate==="identite"&&<BrandEvidence/>}
    <div className="wv-review-target">
      <div><span>LIVRABLE À ÉVALUER</span><h3>{g.deliverable}</h3><p>{g.hint}</p></div>
      <div className={`wv-review-evidence ${hasArtifact?"available":"missing"}`}>
        <b>{hasArtifact?"Version retrouvée":"Pas de livrable validable"}</b>
        <code>{ref?ref.length>32?`${ref.slice(0,18)}…${ref.slice(-8)}`:ref:"—"}</code>
      </div>
    </div>
    {archived && <div className="wv-review-archive" role="status">
      <div><span>AVIS DURABLE · GITHUB #{archived.github_issue}</span>
        <strong>Version déjà refusée — {archived.overall_score}/10</strong>
        <p>{archived.blocking_categories.length} critères bloquants · {new Date(archived.reviewed_at).toLocaleDateString("fr-FR")}</p>
      </div>
      <div className="wv-review-archive-actions">
        <a href={archived.github_issue_url} target="_blank" rel="noreferrer">Voir l'avis sur GitHub ↗</a>
        <button type="button" onClick={()=>{applyReview(fromArchive(archived));setCopyStatus("Notes sauvegardées sur GitHub rechargées.");}}>
          Restaurer les notes 1/10</button>
      </div>
    </div>}
    {(gate==="video"||gate==="montage") && story.render_job?.status==="completed"&&story.render_job.output_url&&
      <div className="wv-review-watch">
        <video controls playsInline preload="metadata" src={story.render_job.output_url}
          poster="./media-pilots/cop31-risk-finance-2026-11-12/poster-preview.jpg" aria-label="Vidéo réelle à évaluer"/>
        <div><strong>Vidéo du pilote COP31 — refusée artistiquement</strong>
          <p>Regarde et écoute avant de noter. La note concerne précisément ce MP4, identifié par son SHA-256.</p>
          <code>{story.render_job.output_sha256}</code>
        </div>
      </div>}
    <div className="wv-review-main-score">
      <div><span>NOTE GÉNÉRALE</span><h3>Combien sur 10 ?</h3><p>La note ne signifie jamais automatiquement « validé ».</p></div>
      <div className="wv-review-main-select">
        <label htmlFor="wv-review-overall">Ta note globale</label>
        <select id="wv-review-overall" value={review.global??""}
          onChange={e=>update({global:e.target.value?Number(e.target.value):null})}>
          <option value="">— / 10</option>
          {SCORE_OPTIONS.map(n=><option value={n} key={n}>{n}/10</option>)}
        </select>
      </div>
    </div>
    <div className="wv-review-section-title"><div><span>CRITÈRES DÉTAILLÉS</span><h3>Évalue chaque aspect</h3></div><span>{ratedCount} / {g.required.length} notés</span></div>
    <div className="wv-review-metrics">
      {g.required.map(id=><div className="wv-review-metric" key={id}>
        <div><label htmlFor={`wv-review-score-${id}`}>{CRITERIA[id]}</label>
          <span>{review.scores[id]!=null?`${review.scores[id]}/10`:"Non noté"}</span>
        </div>
        <div className="wv-review-metric-control">
          <select id={`wv-review-score-${id}`} value={review.scores[id]??""}
            onChange={e=>update({scores:{...reviewRef.current.scores,[id]:e.target.value?Number(e.target.value):null}})}>
            <option value="">Note de 1 à 10</option>
            {SCORE_OPTIONS.map(n=><option key={n} value={n}>{n} / 10</option>)}
          </select>
          <label className="wv-review-blocker">
            <input type="checkbox" checked={review.blockers.includes(id)}
              onChange={e=>update({blockers:e.target.checked?[...reviewRef.current.blockers,id]:reviewRef.current.blockers.filter(k=>k!==id)})}/>
            <span>Bloquant</span>
          </label>
        </div>
      </div>)}
    </div>
    <div className="wv-review-mini-summary">
      <span>Moyenne des aspects renseignés</span>
      <strong>{ratedCount?average.toFixed(1).replace(".",",")+"/10":"—"}</strong>
    </div>
    <div className="wv-review-feedback-fields">
      <label htmlFor="wv-review-notes">Qu'est-ce qui ne va pas ? Qu'est-ce qui te plaît ?</label>
      <textarea id="wv-review-notes" value={review.notes} maxLength={2500} rows={4}
        onChange={e=>update({notes:e.target.value})}
        placeholder="Ex. : voix robotique, logo incorrect, transitions trop lentes, plans répétitifs…"/>
      <label htmlFor="wv-review-priorities">Corrections prioritaires pour la prochaine version</label>
      <textarea id="wv-review-priorities" value={review.priorities} maxLength={1500} rows={3}
        onChange={e=>update({priorities:e.target.value})}
        placeholder="Ex. : 1) reprendre le logo exact 2) tester trois voix 3) créer un vrai plan d'ouverture."/>
    </div>
    <div className="wv-review-verdict">
      <span>TA DÉCISION HUMAINE</span>
      <div role="group" aria-label="Décision de validation">
        {(["a_corriger","refuse","valide"] as const).map(choice=>
          <button type="button" key={choice} className={review.decision===choice?"selected":""}
            aria-pressed={review.decision===choice} onClick={()=>update({decision:choice})}>{STANCE[choice]}</button>)}
      </div>
      {review.decision==="valide"&&acceptanceBlocked&&
        <p className="wv-review-warning">Validation impossible : il faut un livrable réel identifié, une note globale d'au moins 8/10,
          chaque aspect noté à 8/10 ou plus et aucun point bloquant.
          Une mauvaise note ou un point bloquant nécessite « À corriger » ou « Refusé ».</p>}
      <p className="wv-review-context">Les notes ne débloquent pas un nouveau rendu. Elles ne sont prises en compte dans le processus
        qu'après une validation explicite et l'enregistrement de l'avis dans GitHub.</p>
    </div>
    <div className="wv-review-submit">
      <div><strong>Enregistrer tes observations</strong>
        <p>{previewMode?"Brouillon local à ton téléphone ; GitHub nécessite ton clic final de confirmation.":"Compte rendu local et publication manuelle sécurisée dans GitHub."}</p>
      </div>
      <div className="wv-review-actions">
        {ready ?
          <a id="wv-review-gh-link" className="wv-review-primary" href={githubLink()}
            onClick={()=>persistDraft(storageKey,reviewRef.current)}>
            Ouvrir GitHub pour enregistrer ↗</a> :
          <button type="button" disabled className="wv-review-primary">
            Note nécessaire avant l'enregistrement</button>}
        <button type="button" disabled={review.global===null} onClick={()=>void copy()}>Copier pour ChatGPT</button>
        <button type="button" disabled={review.global===null} onClick={download}>Exporter JSON</button>
      </div>
      {copyStatus&&<p role="status" className="wv-review-status">{copyStatus}</p>}
      {storageWarning&&<p role="alert" className="wv-review-warning">
        Ce navigateur bloque le stockage local. Copie ton avis ou confirme-le sur GitHub avant de quitter cette page.
      </p>}
      <p className="wv-review-fine">Le bouton GitHub n'enregistre pas directement l'avis : un formulaire prérempli s'ouvre
        et tu dois cliquer sur « Submit new issue » dans GitHub. Si le navigateur intégré bloque GitHub,
        ouvre le lien dans Safari, ou utilise « Copier pour ChatGPT » comme tu viens de le faire.
        Pour les commentaires longs, copie le JSON complet. Ensuite, cet avis est durable, consultable depuis
        ChatGPT avec le connecteur GitHub. Aucune clé de ton compte GitHub n'est exposée dans le site.</p>
    </div>
  </div>;
}

export default function ReviewStudio({story,onOpenJourney,previewMode}:{
  story:MediaStory|null;onOpenJourney:()=>void;previewMode:boolean;
}){
  const [style,setStyle]=useState<DirectionId>(()=>{
    const candidate=new URLSearchParams(window.location.search).get("style");
    return candidate==="chiffres"||candidate==="pedagogie"?candidate:"terrain";
  });
  const [gate,setGate]=useState<GateId>(() => {
    const candidate=new URLSearchParams(window.location.search).get("gate");
    return GATES.some(item=>item.id===candidate)?candidate as GateId:"video";
  });
  useEffect(()=>{
    const url=new URL(window.location.href);
    url.searchParams.set("gate",gate);
    url.searchParams.set("style",style);
    window.history.replaceState({}, "",url.pathname+url.search+url.hash);
  },[gate,style]);
  const g=useMemo(()=>GATES.find(item=>item.id===gate)!,[gate]);
  const evidence=story?artifactRef(story,gate,style):null;
  return <main className="wv-review-shell">
    <header className="wv-review-hero">
      <div><div className="wv-review-eyebrow">WORLD-VISION · QUALITÉ ÉDITORIALE</div>
        <h1>Tu notes.<br/><em>On améliore.</em></h1>
        <p>Chaque étape est évaluée séparément, de 1 à 10, avant tout nouveau montage.
          Une note faible ou un refus signifie : on corrige ce composant, on ne passe pas au suivant.</p>
      </div>
      <div className="wv-review-badge"><strong>09</strong><span>JALONS<br/>À ÉVALUER</span></div>
    </header>
    <nav className="wv-review-stage-tabs" aria-label="Choisir un jalon à évaluer">
      {GATES.map(item=><button key={item.id} type="button" aria-current={gate===item.id?"step":undefined}
        className={gate===item.id?"active":""} onClick={()=>setGate(item.id)}>
        <span>{item.number}</span><b>{item.name}</b>
      </button>)}
    </nav>
    <section className="wv-review-intro">
      <div><span>JALON {g.number} / 08</span><h2>{g.name}</h2><p>{g.subtitle} · {g.deliverable}</p></div>
      <button onClick={onOpenJourney} type="button">← Retour au parcours</button>
    </section>
    {!story?<div className="wv-review-empty">Aucun dossier chargé. Vérifie le Media Studio ou sélectionne un reportage.</div>:
      <>
        {gate==="identite"?<div className="wv-review-approved-decision" role="status">
          <div><strong>Logo officiel actuel : validé par toi</strong>
            <p>Approbation explicite enregistrée le 13 novembre 2026, sans note chiffrée.
              La version multicolore est une amélioration future et ne bloque plus la production.</p>
          </div>
          <button type="button" onClick={()=>setGate("direction")}>Étape suivante : les trois directions artistiques →</button>
        </div>:<>
          {gate==="direction"&&<CreativeDirections selected={style} onSelect={setStyle}/>}
          <ReviewForm key={`${story.id}:${gate}:${evidence||"missing"}`}
            story={story} gate={gate} style={style} previewMode={previewMode}/>
        </>}
      </>}
    <footer className="wv-review-footer">World-Vision · Le moteur technique reste conservé. L'approbation humaine précède chaque nouvelle production.</footer>
  </main>;
}
