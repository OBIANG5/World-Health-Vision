/**
 * World-Vision visual laboratory V2.
 * This is an editorial STYLE-FRAME BOARD, not a video or a finished motion test.
 * Every approved decision must be explicit and version-bound.
 */
import {useEffect,useState} from "react";
import GeoGlobe from "./GeoGlobe";
import "./GlobeDirection.css";

type Verdict="a_corriger"|"refuse"|"valide";
type Feedback={score:number|null;decision:Verdict;note:string};
type Step={
 id:string;ordinal:string;name:string;short:string;
 function:string;question:string;pose:{centerLon:number;centerLat:number;target?:[number,number];highlightTurkey?:boolean;radiusRatio?:number};
};
const STEPS:readonly Step[]=[
 {id:"d00",ordinal:"00",name:"Le monde s'ouvre",short:"Terre entière",
  function:"Une Terre immédiatement reconnaissable installe l'échelle mondiale. La signature œil-globe reste exactement celle déjà validée.",
  question:"Le globe est-il suffisamment beau, lumineux, lisible et fidèle à une identité de grand média ?",
  pose:{centerLon:-9,centerLat:16,radiusRatio:.43}},
 {id:"d01",ordinal:"01",name:"La Terre se dirige vers le pays",short:"Orientation",
  function:"Un déplacement géographique piloté par les coordonnées réelles. La direction de rotation sera jugée sur un micro-clip distinct, après validation du style.",
  question:"Le cadrage de la destination, l'accent discret et la hiérarchie sont-ils convaincants ?",
  pose:{centerLon:19,centerLat:28,radiusRatio:.44,target:[30.7,36.9],highlightTurkey:true}},
 {id:"d02",ordinal:"02",name:"Le pays entre dans le récit",short:"Pays et ville",
  function:"La Turquie, puis Antalya, apparaissent sans contour inventé ; la source géographique est le GeoJSON déjà présent dans la V2.",
  question:"Le nom du pays et le repère de la ville sont-ils lisibles sans masquer la géographie ?",
  pose:{centerLon:30.7,centerLat:36.9,radiusRatio:.48,target:[30.7,36.9],highlightTurkey:true}},
 {id:"d03",ordinal:"03",name:"Passage à la preuve",short:"Sources et images",
  function:"Transition depuis la carte vers de véritables séquences autorisées. Pour cette maquette, seul le document officiel est affiché : pas de faux reportage tourné sur place.",
  question:"La transition entre carte et document/source te paraît-elle digne d'un média professionnel ?",
  pose:{centerLon:30.7,centerLat:36.9,radiusRatio:.44,target:[30.7,36.9]}},
 {id:"d04",ordinal:"04",name:"Expliquer sans surcharger",short:"Chiffres et contexte",
  function:"Rendre le chiffre et sa nuance intelligibles. Les objectifs financiers sont distingués des sommes déjà versées.",
  question:"Comprends-tu la nouvelle sans devoir lire des blocs de texte ni perdre le lien avec le pays ?",
  pose:{centerLon:30.7,centerLat:36.9,radiusRatio:.4}},
 {id:"d05",ordinal:"05",name:"Une fin qui prépare la suite",short:"Signature et suite",
  function:"Terminer le plan proprement et retrouver un repère géographique neutre, prêt pour un éventuel nouveau pays. Aucune barre de progression spectateur.",
  question:"L'ensemble reste-t-il reconnaissable comme World-Vision, sans devenir une publicité pour notre marque ?",
  pose:{centerLon:19,centerLat:18,radiusRatio:.42}},
];
const NO_FEEDBACK:Feedback={score:null,decision:"a_corriger",note:""};
const keyFor=(id:string)=>`wv-visual-lab-d-v2:${id}`;
function getFeedback(id:string):Feedback{
  try{
    const text=window.localStorage.getItem(keyFor(id))||window.sessionStorage.getItem(keyFor(id));
    if(!text)return {...NO_FEEDBACK};
    const r=JSON.parse(text) as Partial<Feedback>;
    return {score:typeof r.score==="number"&&r.score>=1&&r.score<=10?r.score:null,
      decision:r.decision==="valide"||r.decision==="refuse"?r.decision:"a_corriger",
      note:typeof r.note==="string"?r.note.slice(0,900):""};
  }catch{return {...NO_FEEDBACK};}
}
function saveFeedback(id:string,value:Feedback){
  const text=JSON.stringify(value);
  try{window.localStorage.setItem(keyFor(id),text)}catch{/* storage may be blocked */}
  try{window.sessionStorage.setItem(keyFor(id),text)}catch{/* storage may be blocked */}
}
const SOURCE="https://www.unicef.org/press-releases/un-launches-disaster-risk-financing-platform-cop31-make-humanitarian-responses";
const SOURCE_FAO="https://www.fao.org/newsroom/detail/un-launches-disaster-risk-financing-platform-at-cop31-to-make-humanitarian-responses-faster-and-more-predictable/en";
const LOGO="./brand/world-vision-official.png";
function EditorialBrand(){
  return <div className="wv-globe-brand">
    <img src={LOGO} alt="Vrai logo officiel actuel World-Vision, œil et globe bleu"/>
    <b>WORLD–VISION</b>
  </div>;
}
function SceneFrame({step}:{step:Step}){
  const isEvidence=step.id==="d03",isData=step.id==="d04";
  return <div className={`wv-globe-scene wv-globe-scene-${step.id}`}
      data-scene-id={step.id} aria-label={`Aperçu vertical : ${step.name}`}>
    <div className="wv-globe-scene-top"><EditorialBrand/><span>VOIR LE MONDE. LE COMPRENDRE.</span></div>
    {!isEvidence&&!isData&&<div className="wv-globe-stage-planet">
      <GeoGlobe pose={step.pose} alt={`Globe géographique vectoriel orienté vers ${step.id==="d00"?"la Terre entière":"la Turquie et Antalya"}`}/>
    </div>}
    {step.id==="d00"&&<div className="wv-globe-stage-headline intro">
      <span>LE MONDE, EN UNE IMAGE</span>
      <h3>UNE HISTOIRE.<br/><em>UN LIEU.</em></h3>
      <p>Chaque histoire commence quelque part.</p>
    </div>}
    {step.id==="d01"&&<div className="wv-globe-stage-headline focus">
      <span>NOUS ALLONS VERS…</span><h3>LA TURQUIE</h3>
      <p>Le lieu de la COP31</p>
    </div>}
    {step.id==="d02"&&<div className="wv-globe-stage-headline country">
      <span>ANTALYA · TURQUIE</span>
      <h3>LA COP31</h3>
      <p>Le contexte géographique avant le fait.</p>
    </div>}
    {isEvidence&&<div className="wv-globe-evidence-frame">
      <span>DOCUMENT SOURCE · ONU</span>
      <h3>Anticiper plutôt que réagir.</h3>
      <div className="wv-globe-source-card">
        <b>UNICEF / FAO</b><strong>UNE PLATEFORME DE FINANCEMENT DES RISQUES</strong>
        <p>Annonce lors de la COP31 à Antalya. Vérification des faits avant narration.</p>
      </div>

    </div>}
    {isData&&<div className="wv-globe-data-frame">
      <span>COP31 · OBJECTIF ANNONCÉ</span>
      <div className="wv-globe-data-main"><b>+3</b><strong>MILLIARDS<br/>DE DOLLARS</strong></div>
      <p>Pour mieux anticiper les catastrophes climatiques.</p>
      <div className="wv-globe-data-secondary"><strong>75 M</strong><span>de personnes visées<br/>d'ici 2030</span></div>
      <small>OBJECTIF · PAS UNE SOMME DÉJÀ VERSÉE</small>
    </div>}
    {step.id==="d05"&&<div className="wv-globe-stage-headline close">
      <span>WORLD-VISION</span><h3>LE MONDE,<br/><em>EN CONTEXTE.</em></h3>
      <p>Prochaine étape : un autre lieu, si l'actualité l'exige.</p>
    </div>}

  </div>;
}
function feedbackPayload(step:Step,feedback:Feedback){
  return {
    schema_version:"world-vision-visual-step-review-v1",
    stage:"creative_visual",
    visual_direction:"D_GLOBE_TO_COUNTRY",
    design_version:"world-vision-globe-v2-2026-11-13",
    scene_id:step.id,scene_name:step.name,
    story_example:"COP31 Antalya — exemple géographique sourcé UNICEF/FAO",
    evaluated_artifact:"geojson_projected_style_frame_not_motion_video",
    decision:feedback.decision,score:feedback.score,comments:feedback.note,
    animation_authorized:false,mp4_authorized:false,
  };
}
export default function GlobeDirection(){
  const [selected,setSelected]=useState<string>(()=>{
    const p=new URLSearchParams(window.location.search).get("frame");
    return STEPS.some(s=>s.id===p)?p!:"d00";
  });
  const [feedback,setFeedback]=useState<Feedback>(()=>getFeedback(selected));
  const [status,setStatus]=useState("");
  const step=STEPS.find(s=>s.id===selected)||STEPS[0];
  useEffect(()=>{setFeedback(getFeedback(selected));},[selected]);
  useEffect(()=>{
    const url=new URL(window.location.href);
    url.searchParams.set("frame",selected);
    history.replaceState({},"",url.pathname+url.search+url.hash);
  },[selected]);
  const update=(p:Partial<Feedback>)=>{
    const next={...feedback,...p};setFeedback(next);saveFeedback(selected,next);
  };
  const reviewUrl=()=>{
    const title=`[WV-STYLE-REVIEW] ${step.id} · ${feedback.decision} · ${feedback.score}/10`;
    const body=[
      `## Revue d'image World-Vision — ${step.name}`,
      `Direction: D « globe → pays → information »`,
      `Étape: ${step.id}`,
      `Note: ${feedback.score}/10 | Décision: ${feedback.decision}`,
      `Commentaires: ${feedback.note||"Aucun commentaire"}`,
      "Code: world-vision-globe-v2-2026-11-13",
      "Aucun rendu ni publication autorisé par cet avis.",
    ].join("\n");
    return `https://github.com/OBIANG5/World-Health-Vision/issues/new?title=${encodeURIComponent(title)}&body=${encodeURIComponent(body)}`;
  };
  const copy=async()=>{
    try{await navigator.clipboard.writeText(JSON.stringify(feedbackPayload(step,feedback),null,2));
      setStatus("Avis copié. Colle-le dans ChatGPT pour que je le sauvegarde dans GitHub.");}
    catch{setStatus("La copie est bloquée par ce navigateur. Utilise le lien GitHub ci-dessous.");}
  };
  const canApprove=feedback.score!==null&&feedback.score>=8;
  return <section className="wv-globe-lab" id="wv-globe-lab">
    <div className="wv-globe-lab-intro">
      <span>NOUVELLE DIRECTION D · MAQUETTES À VALIDER</span>
      <h3>Le globe raconte le monde.</h3>
      <p>Les trois anciennes directions A/B/C ont été rejetées. Voici une proposition nouvelle et cohérente,
        construite <strong>plan par plan</strong>. L'application utilise son propre fichier de frontières GeoJSON ;
        ce globe est une <strong>étude vectorielle lumineuse</strong>, pas encore un globe satellite 3D
        ni une animation finalisée.</p>
    </div>
    <nav className="wv-globe-stage-list" aria-label="Six étapes de l'identité visuelle">
      {STEPS.map(s=><button type="button" key={s.id}
        aria-current={selected===s.id?"step":undefined}
        onClick={()=>setSelected(s.id)} className={selected===s.id?"active":""}>
        <b>{s.ordinal}</b><span>{s.short}</span>
      </button>)}
    </nav>
    <div className="wv-globe-lab-comparison">
      <div className="wv-globe-visual">
        <SceneFrame step={step}/>
        <p>MAQUETTE FIXE {step.ordinal} / 05 · Aucun mouvement, voix ou nouveau MP4 n'a été produit.</p>
      </div>
      <div className="wv-globe-lab-review" data-globe-step={selected}>
        <span>ÉTAPE VISUELLE {step.ordinal}</span>
        <h4>{step.name}</h4>
        <p>{step.function}</p>
        <div className="wv-globe-question"><strong>Ce que je te demande de juger</strong>
          <p>{step.question}</p>
        </div>
        <label htmlFor="wv-globe-score">Ta note sur 10</label>
        <select id="wv-globe-score" value={feedback.score??""}
          onChange={e=>update({score:e.target.value?Number(e.target.value):null})}>
          <option value="">Aucune note pour l'instant</option>
          {[1,2,3,4,5,6,7,8,9,10].map(n=><option value={n} key={n}>{n}/10</option>)}
        </select>
        <label htmlFor="wv-globe-decision">Ta décision pour ce plan</label>
        <select id="wv-globe-decision" value={feedback.decision}
          onChange={e=>update({decision:e.target.value as Verdict})}>
          <option value="a_corriger">À corriger</option>
          <option value="refuse">Refusé</option>
          <option value="valide">Je valide ce plan</option>
        </select>
        {feedback.decision==="valide"&&!canApprove&&<p className="wv-globe-validation-warn">
          Pour une validation, attribue d'abord au moins 8/10. Une note faible reste un refus ou une demande de correction.
        </p>}
        <label htmlFor="wv-globe-comment">Les défauts et tes corrections précises</label>
        <textarea id="wv-globe-comment" value={feedback.note} maxLength={900} rows={5}
          placeholder="Ex. : la Terre est trop plate, la lumière insuffisante, les pays mal visibles…"
          onChange={e=>update({note:e.target.value})}/>
        <div className="wv-globe-feedback-actions">
          <button type="button" disabled={feedback.score===null} onClick={()=>void copy()}>
            Copier ma note pour ChatGPT</button>
          {feedback.score!==null && !(feedback.decision==="valide"&&!canApprove) &&
            <a href={reviewUrl()}>Enregistrer sur GitHub ↗</a>}
        </div>
        {status&&<p role="status" className="wv-globe-feedback-status">{status}</p>}
        <div className="wv-globe-lab-caveat">
          Les brouillons locaux peuvent disparaître si ton navigateur efface ses données.
          Les notes partagées dans ChatGPT ou confirmées sur GitHub sont conservables dans le dépôt.
          <strong> Ce formulaire ne lance aucune production automatiquement.</strong>
        </div>
      </div>
    </div>
    <div className="wv-globe-lab-sources">
      <strong>Sources, authenticité et étapes restantes</strong>
      <p>Exemple situé à Antalya en Turquie, repris d'une annonce de la COP31 :
        les sources factuelles utilisées sont UNICEF et FAO. Les contours viennent du
        GeoJSON du projet V2. Les cases « vidéos authentiques » ne sont pas remplies
        tant que les droits et les images exactes de l'actualité ne sont pas vérifiés.</p>
      <div>
        <a href={SOURCE} target="_blank" rel="noreferrer">Source UNICEF ↗</a>
        <a href={SOURCE_FAO} target="_blank" rel="noreferrer">Source FAO ↗</a>
      </div>
      <p><strong>Après tes notes :</strong> une amélioration visuelle ciblée de chaque plan,
        puis une démonstration 3D de quelques secondes pour juger le mouvement,
        enfin une sélection de vrais rushes et plusieurs voix à écouter.</p>
    </div>
  </section>;
}
