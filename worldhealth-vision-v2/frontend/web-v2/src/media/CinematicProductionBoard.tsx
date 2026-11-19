import {useMemo, useState} from "react";
import type {MediaStory} from "./types";
import "./CinematicProductionBoard.css";

/**
 * Art direction workspace. The historic 14-step newsroom workflow still exists.
 * These 11 gates cover the high-end AUDIOVISUAL CRAFT of one chosen story.
 * No automated approvals, publication state or backend connection are implied.
 */
type Gate = {
  id: string;
  title: string;
  discipline: string;
  output: string;
  quality: string;
  directorBrief: string;
};
const GATES: readonly Gate[] = [
  {id:"research",title:"Établir les faits",discipline:"Vérification journalistique",
   output:"Affirmations C1…Cn, URLs indépendantes et incertitudes",
   quality:"Une information ne devient jamais plus certaine parce qu'elle donne une bonne accroche.",
   directorBrief:"Pour cette actualité, sépare les faits démontrés, les contradictions et les inconnues. Associe chaque affirmation à ses sources, lieu et date. Ne rédige pas de narration avant ce travail."},
  {id:"script",title:"Verrouiller le récit",discipline:"Scénario & dramaturgie",
   output:"Hook, déroulé, révélations, chute, script immuable + SHA",
   quality:"Chaque phrase explique pourquoi le spectateur doit comprendre et continuer, sans dramatiser ce qui n'est pas prouvé.",
   directorBrief:"Rédige un récit journalistique français, précis et vivant. Identifie accroche, information neuve à chaque séquence, re-hook et dernière pensée. Propose les arbitrages de longueur AVANT tout gel du texte."},
  {id:"treatment",title:"Écrire la réalisation",discipline:"Direction artistique",
   output:"Note de réalisation, arc émotionnel, références et storyboard d'intentions",
   quality:"Une émotion doit provenir d'un fait et d'un plan vrai, pas d'un effet de montage artificiel.",
   directorBrief:"Imagine une mise en scène documentaire sobre mais spectaculaire, avec références de cadrages et de mouvements. Justifie ce que chaque plan révèle et ce qui doit rester hors champ."},
  {id:"voice",title:"Diriger Vivienne",discipline:"Voix & interprétation",
   output:"Deux auditions intégrales du même texte, hash du master choisi",
   quality:"Respiration naturelle et sens; aucun montage voix par phrase, aucune accélération pour tenir un minutage.",
   directorBrief:"Prépare la direction vocale de Vivienne sur le script IDENTIQUE : intention, mots à accentuer, noms propres, pauses. Compare deux prises continues au même niveau d'écoute ; ne change pas de timbre."},
  {id:"casting",title:"Choisir les images",discipline:"Documentaire & droits",
   output:"Casting visuel par plan : provenance, date, lieu, droit, fonction et SHA",
   quality:"Rejeter un plan séduisant mais sans rapport; interdire la fausse vidéo événementielle.",
   directorBrief:"Pour chaque phrase du script, définis le rush exact à trouver, sa fonction probante, la date/le lieu et les droits nécessaires. Indique ce qui manque au lieu de remplacer par un stock-shoot générique."},
  {id:"layouts",title:"Composer les plans",discipline:"Cadre & typographie",
   output:"Planches fixes 1080×1920 examinées à taille iPhone",
   quality:"Grande image lisible, texte minimal, aucune plaque technique ou marge énorme.",
   directorBrief:"Propose la composition fixe du plan sélectionné : cadre, photographie, typographie, contrastes, hiérarchie et safe zones mobile. Préserve les pixels de l'œuvre et le logo G0 d'origine."},
  {id:"motion",title:"Animer avec intention",discipline:"Motion design",
   output:"Micro-clip de 3–6 secondes, revue image par image",
   quality:"Mouvements motivés par le sens, easing cohérent, raccords maîtrisés, pas d'animations gadgets.",
   directorBrief:"À partir de l'artboard approuvé, décris le rythme image par image : entrée, attention, révélation, sortie, raccord. Programme une animation Remotion déterministe; soumets le micro-clip, jamais d'abord un long MP4."},
  {id:"edit",title:"Monter au vrai rythme",discipline:"Montage sélectif",
   output:"Timeline en frames, EDL, pistes verrouillées et diff des changements",
   quality:"Les plans suivent les mots réellement entendus; ne jamais détruire les plans déjà approuvés.",
   directorBrief:"Établis les coupes en prenant la vraie prise Vivienne comme référence. Pour chaque raccord, indique le motif narratif, le mot exact et l'intervalle en frames. Corrige seulement les plans contestés."},
  {id:"sound",title:"Finir le son",discipline:"Mixage & sous-titres",
   output:"Mix mobile mesuré, transcription/alignement sur l'audio approuvé",
   quality:"Présence, chaleur et intelligibilité sans clipping, musique intrusive ni blancs accidentels.",
   directorBrief:"Inspecte l'écoute intégrale sur téléphone, les silences, la diction, le bruit, les dynamiques, LUFS et true peak. Propose des améliorations transparentes sans réécrire ni accélérer la voix."},
  {id:"qa",title:"Regarder et contredire",discipline:"QA artistique et journalistique",
   output:"Relecture intégrale, planche de contrôle, rapports d'erreurs par plan",
   quality:"Un test vert n'est ni une note artistique ni un droit de publication; chaque plan est regardé.",
   directorBrief:"Adopte le rôle de critique de réalisation exigeant : image, preuves, droit, cinéma, transitions, naturel vocal, mix, typographie, safe zones, véracité. Liste les problèmes par plan et évite de toucher au reste."},
  {id:"delivery",title:"Exporter sans dégrader",discipline:"Mastering & décision humaine",
   output:"MP4 réel avec SHA, manifeste, source rights, validation humaine explicite",
   quality:"Aucun « publié » fictif; G0 original silencieux; autorisations réellement vérifiées.",
   directorBrief:"Contrôle le master exact en 1080×1920 H.264/AAC, ses pistes, durée, safe zones, G0, crédits et droits. Fournis le rapport et demande la validation explicite avant toute diffusion."},
];

const path = "https://github.com/OBIANG5/World-Health-Vision/blob/feature/worldvision-cinematic-director-gates-2026-11-19/worldhealth-vision-v2/docs/media/WORLDVISION_CINEMATIC_DIRECTOR_PRODUCTION_V1_2026-11-19.md";

export default function CinematicProductionBoard({story}:{story:MediaStory|null}) {
  const [selected,setSelected] = useState("treatment");
  const [copied,setCopied] = useState(false);
  const active = useMemo(()=>GATES.find(g=>g.id===selected) ?? GATES[0],[selected]);
  const select = (id:string) => {setSelected(id);setCopied(false);};
  const brief = [
    "WORLD-VISION — BRIEF DU RÉALISATEUR CINÉMATOGRAPHIQUE",
    "Projet MEDIA uniquement. BAOCOM séparé. ChatGPT est le copilote IA.",
    "Aucune validation ou source ne doit être inventée.",
    "Étape: "+active.id+" — "+active.title,
    "Dossier sélectionné: "+(story?.title || "(aucun dossier chargé)"),
    "Livrable attendu: "+active.output,
    "Contrôle qualité: "+active.quality,
    "Consigne: "+active.directorBrief,
    "Préserve les décisions humaines, les fichiers/hash approuvés, la voix Vivienne et G0.",
    "Indique clairement les preuves manquantes et le prochain petit livrable vérifiable."
  ].join("\n");
  const copy = async() => {
    try {await navigator.clipboard.writeText(brief);setCopied(true);}
    catch {setCopied(false);}
  };
  return <section className="wvc-board" aria-labelledby="wvc-heading">
    <header className="wvc-head">
      <div className="wvc-eyebrow">LE STUDIO AUDIOVISUEL · NOUVEAU CONDUCTEUR DE RÉALISATION</div>
      <h2 id="wvc-heading">Concevoir chaque plan. <em>Valider chaque détail.</em></h2>
      <p>Onze portes de création pour viser une vraie qualité de reportage, de motion design et de narration. Le circuit RADAR/VERIFY de 14 étapes ci-dessous reste distinct et inchangé.</p>
      <div className="wvc-disclaimer" role="note">Cadre de travail documenté dans GitHub — <strong>pas un statut automatique de production</strong>. Les validations artistiques ne sont pas connectées à cet écran. Aucun rendu, appel IA ni publication n'est lancé ici.</div>
    </header>
    <div className="wvc-layout">
      <nav className="wvc-gates" aria-label="Onze portes de direction audiovisuelle">
        {GATES.map((gate,i)=><button key={gate.id} type="button" className={"wvc-gate "+(selected===gate.id?"is-selected":"")} aria-current={selected===gate.id?"step":undefined} onClick={()=>select(gate.id)}>
          <span className="wvc-gate-index">{String(i+1).padStart(2,"0")}</span>
          <span className="wvc-gate-name"><strong>{gate.title}</strong><small>{gate.discipline}</small></span>
          <span className="wvc-gate-mark" aria-hidden="true">›</span>
        </button>)}
      </nav>
      <article className="wvc-detail" aria-live="polite">
        <div className="wvc-detail-eyebrow">ÉTAPE {String(GATES.indexOf(active)+1).padStart(2,"0")} / 11 · {active.id.toUpperCase()}</div>
        <h3>{active.title}</h3>
        <div className="wvc-detail-block"><span>CE QUE NOUS DEVONS PRODUIRE</span><p>{active.output}</p></div>
        <div className="wvc-detail-block"><span>EXIGENCE NON NÉGOCIABLE</span><p>{active.quality}</p></div>
        <div className="wvc-director-script">
          <span>SCRIPT DE TRAVAIL POUR CHATGPT</span>
          <p>{active.directorBrief}</p>
        </div>
        <div className="wvc-actions">
          <button type="button" onClick={()=>void copy()}>{copied?"Brief copié":"Copier le brief pour ChatGPT"}</button>
          <a href={path} target="_blank" rel="noopener noreferrer">Documentation et code ↗</a>
        </div>
        <p className="wvc-truth">Les créations acceptées doivent être vérifiées dans leurs fichiers réels. Les cases ci-contre ne sont pas des validations humaines.</p>
      </article>
    </div>
  </section>;
}
