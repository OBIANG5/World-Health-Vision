/**
 * World-Vision Media Studio — navigable, evidence-first production journey.
 * This is the actual V2 Media Studio frontend, not a separate static mockup.
 * Every step remains explorable even if live services are unavailable.
 */
import { useEffect, useMemo, useState } from "react";
import type { MediaStory, VideoScene } from "./types";
import "./ProductionJourney.css";

const STEPS = [
  {id:"radar", number:"01", name:"RADAR", short:"Détection", group:"DÉCOUVRIR", icon:"◎",
    kicker:"TROUVER LE SUJET", title:"Tout commence par une information.",
    description:"Le radar surveille les publications, repère les signaux importants et conserve les URL d'origine. Aucun sujet n'est publié à cette étape.",
    purpose:"Ne pas confondre une rumeur populaire et une information confirmée.",
    output:"Liste des sujets candidats, URL consultées, horodatages et dédoublonnage."},
  {id:"verify", number:"02", name:"VERIFY", short:"Vérification", group:"DÉCOUVRIR", icon:"◇",
    kicker:"ÉTABLIR LES FAITS", title:"Une affirmation. Des preuves.",
    description:"Chaque fait du reportage doit être confronté à ses sources originales. Les contradictions restent visibles plutôt que d'être supprimées.",
    purpose:"Empêcher qu'une accroche spectaculaire transforme une hypothèse en fait.",
    output:"Rapport par affirmation : sources favorables, contradictoires et zones d'incertitude."},
  {id:"score", number:"03", name:"SCORE", short:"Priorisation", group:"DÉCOUVRIR", icon:"◈",
    kicker:"CHOISIR LE BON SUJET", title:"Pourquoi cette actu mérite une vidéo ?",
    description:"Le classement combine fraîcheur, intérêt humain, portée, potentiel visuel, pertinence et fiabilité des sources.",
    purpose:"Investir la production sur des sujets réellement utiles, pas seulement viraux.",
    output:"Score éditorial explicable sur 100, critères détaillés et raisons enregistrées."},
  {id:"approval", number:"04", name:"APPROVAL", short:"Décision humaine", group:"ÉDITER", icon:"✓",
    kicker:"CONTRÔLE ÉDITORIAL", title:"L'humain garde la décision.",
    description:"Un rédacteur choisit d'approuver l'idée, de demander un autre angle ou de la rejeter. Une vérification insuffisante interdit l'approbation.",
    purpose:"Garder la responsabilité éditoriale et l'exigence de véracité.",
    output:"Décision signée dans l'état du sujet avant toute génération de contenu."},
  {id:"creative", number:"05", name:"CREATIVE", short:"Script & hooks", group:"ÉDITER", icon:"✳",
    kicker:"CONCEVOIR LE RÉCIT", title:"Captiver sans trahir les faits.",
    description:"Le module prépare l'angle, les accroches, la narration, les textes à l'écran, la description et les hashtags.",
    purpose:"Construire un récit court et compréhensible, dont chaque affirmation reste sourcée.",
    output:"Accroches classées, script, angle et plan de scènes versionnés."},
  {id:"assets", number:"06", name:"ASSETS", short:"Images & droits", group:"PRODUIRE", icon:"▧",
    kicker:"ILLUSTRER SANS INVENTER", title:"Les bonnes images. Les bons droits.",
    description:"Recherche de médias autorisés, examen des licences, auteurs, liens d'attribution et choix des visuels scène par scène.",
    purpose:"Éviter les images hors sujet, les droits ignorés et les faux visuels d'actualité.",
    output:"Inventaire de médias, licences, attribution et blocages des scènes non résolues."},
  {id:"storyboard", number:"07", name:"STORYBOARD", short:"Découpage vidéo", group:"PRODUIRE", icon:"▤",
    kicker:"DESSINER LA VIDÉO", title:"Chaque seconde a un rôle.",
    description:"Les scènes deviennent une timeline : durées, médias choisis, textes, sources et emplacement des éléments.",
    purpose:"Prévoir un montage clair et adapté à l'écran vertical d'un téléphone.",
    output:"VideoDraft 9:16, 1080 × 1920, 30 images/s, avec scènes horodatées."},
  {id:"audio", number:"08", name:"AUDIO", short:"Voix off IA", group:"PRODUIRE", icon:"◉",
    kicker:"DONNER UNE VOIX AU RÉCIT", title:"Le son doit raconter la bonne histoire.",
    description:"La narration est générée, transcrite puis comparée au script validé. La durée et la déclaration d'usage de l'IA sont contrôlées.",
    purpose:"Ne jamais diffuser une voix off différente du texte approuvé.",
    output:"WAV avec transcript, qualité de correspondance et conformité audio."},
  {id:"render", number:"09", name:"REMOTION", short:"Rendu MP4", group:"PRODUIRE", icon:"▶",
    kicker:"FABRIQUER LE FICHIER", title:"Le montage devient un vrai MP4.",
    description:"Remotion assemble les scènes, visuels, voix off et mentions de sources. FFmpeg normalise et inspecte le flux encodé.",
    purpose:"Vérifier les octets réellement produits, pas seulement un aperçu graphique.",
    output:"MP4 H.264, AAC 48 kHz, mesures ffprobe et empreinte SHA-256."},
  {id:"preview", number:"10", name:"PREVIEW", short:"Visionnage", group:"VALIDER", icon:"◧",
    kicker:"VOIR AVANT DE DIFFUSER", title:"La vidéo passe l'épreuve du téléphone.",
    description:"Le rédacteur regarde le montage, contrôle la narration et choisit de l'approuver ou de demander une correction.",
    purpose:"Détecter les problèmes visibles et audibles que le code ne peut pas toujours repérer.",
    output:"Validation humaine de l'aperçu ou demande de révision."},
  {id:"qa", number:"11", name:"QA", short:"Contrôles finaux", group:"VALIDER", icon:"✦",
    kicker:"HUIT CONTRÔLES EXPLICABLES", title:"Rien ne part sans contrôle.",
    description:"Faits, orthographe, zones sûres, identité, sources, droits, audio et intégrité du MP4 sont vérifiés avant publication.",
    purpose:"Rendre les erreurs visibles et bloquer les exports incomplets.",
    output:"Rapport QA détaillé, points bloquants et décision publish_ready."},
  {id:"package", number:"12", name:"PACKAGE", short:"Dossier de diffusion", group:"DIFFUSER", icon:"▣",
    kicker:"GELER LA VERSION APPROUVÉE", title:"Un seul dossier, toutes les preuves.",
    description:"Le contenu validé est réuni avec les textes par canal, les hashtags, les sources, le SHA-256 du fichier MP4 et celui du manifeste.",
    purpose:"Savoir exactement quel fichier et quelle version ont été autorisés.",
    output:"Publication Package immuable avec deux empreintes distinctes."},
  {id:"tiktok", number:"13", name:"TIKTOK CLEAN", short:"Export adapté", group:"DIFFUSER", icon:"↗",
    kicker:"CRÉER UNE VERSION DISTINCTE", title:"Un export propre, relié à l'original.",
    description:"Remotion prépare une variante distincte sans habillage promotionnel applicatif ; ses sources et déclarations restent présentes.",
    purpose:"Adapter le média aux règles de partage sans modifier le master éditorial.",
    output:"MP4 de canal, profil tiktok_api_clean_v1, SHA-256 et lien au manifeste canonique."},
  {id:"publish", number:"14", name:"PUBLISH", short:"Publication & reçus", group:"DIFFUSER", icon:"◌",
    kicker:"PROUVER LA DIFFUSION", title:"Publié signifie vraiment publié.",
    description:"La diffusion ne peut être enregistrée que si chaque canal ciblé dispose d'une preuve de publication réelle.",
    purpose:"Distinguer un fichier exporté d'une vidéo effectivement visible par le public.",
    output:"Reçus TikTok/WhatsApp associés à la version approuvée ; aucun faux statut publié."},
] as const;
export type ProductionStageId = (typeof STEPS)[number]["id"];
type ReviewGateId = "identite" | "direction" | "script" | "medias" | "voix" | "animation" | "montage" | "publication" | "video";
const REVIEW_GATE_FOR_STAGE:Record<ProductionStageId,ReviewGateId> = {
  radar:"script",verify:"script",score:"script",approval:"script",creative:"direction",
  assets:"medias",storyboard:"script",audio:"voix",
  render:"montage",preview:"montage",qa:"video",
  package:"publication",tiktok:"publication",publish:"publication",
};
const STAGE_IDS = new Set<string>(STEPS.map(s => s.id));
const groups = ["DÉCOUVRIR", "ÉDITER", "PRODUIRE", "VALIDER", "DIFFUSER"] as const;
type Props = {
  story: MediaStory | null;
  stories: MediaStory[];
  selectedId: string | null;
  onSelectStory: (id: string) => void;
  previewMode: boolean;
  onOpenControlRoom: () => void;
  onOpenReview: (gate: ReviewGateId) => void;
  busy: boolean;
  onVerify: (story: MediaStory) => Promise<void>;
  onDecision: (story: MediaStory, action: "approve" | "approve_preview" | "mark_publish_ready") => Promise<void>;
  onGenerateCreative: (story: MediaStory) => Promise<void>;
  onDiscoverAssets: (story: MediaStory) => Promise<void>;
  onPrepareDraft: (story: MediaStory) => Promise<void>;
  onGenerateVoiceover: (story: MediaStory) => Promise<void>;
  onLaunchRender: (story: MediaStory) => Promise<void>;
  onSyncRender: (story: MediaStory) => Promise<void>;
  onRunQa: (story: MediaStory) => Promise<void>;
  onPreparePublication: (story: MediaStory) => Promise<void>;
  onLaunchTikTokCleanExport: (story: MediaStory) => Promise<void>;
  onSyncTikTokCleanExport: (story: MediaStory) => Promise<void>;
};
const formatPercent = (n: number) => `${Math.max(0, Math.min(n, 100))}%`;
function evidenceStatus(story: MediaStory, id: ProductionStageId): boolean {
  switch (id) {
    case "radar": return Boolean(story.radar_scan_id);
    case "verify": return story.verification_report?.verdict === "verified";
    case "score": return story.score.reasons.length > 0;
    case "approval": return story.verification_status === "verified" && ["approved","scripting","assets","rendering","preview_ready","qa","publish_ready","published"].includes(story.status);
    case "creative": return Boolean(story.creative_package);
    case "assets": return Boolean(story.asset_bundle && story.asset_bundle.unresolved_scene_orders.length === 0);
    case "storyboard": return Boolean(story.video_draft);
    case "audio": return story.voiceover?.qa_passed === true;
    case "render": return story.render_job?.status === "completed" && Boolean(story.render_job.output_sha256);
    case "preview": return ["qa","publish_ready","published"].includes(story.status);
    case "qa": return story.qa_report?.all_passed === true;
    case "package": return Boolean(story.publication_package?.video_sha256 && story.publication_package.manifest_sha256);
    case "tiktok": return story.channel_exports.some(e => e.channel === "tiktok" && e.render_job.status === "completed" && Boolean(e.render_job.output_sha256));
    case "publish": return story.status === "published" && story.publication_receipts.length > 0;
  }
}

function StepEvidence({id, story, selectedScene, onScene}: {
  id: ProductionStageId; story: MediaStory; selectedScene: number; onScene: (i: number) => void;
}) {
  const draft = story.video_draft;
  const creative = story.creative_package;
  const scenes = draft?.scenes ?? [];
  const selectedHook = story.hooks.find(h => h.id === story.selected_hook_id);
  const qaChecks = [
    ["Faits", story.qa.facts], ["Orthographe", story.qa.spelling],
    ["Zones sûres", story.qa.safe_zones], ["Charte", story.qa.logo_integrity],
    ["Sources", story.qa.source_display], ["Droits", story.qa.rights],
    ["Audio", story.qa.audio], ["MP4", story.qa.render_integrity],
  ];
  switch(id) {
    case "radar": return <div className="wvj-block">
      <div className="wvj-subtitle">Fiche découverte</div>
      <h3>{story.title}</h3>
      <p>{story.summary}</p>
      <div className="wvj-metrics"><div><b>{story.country_name ?? "Monde"}</b><span>Zone suivie</span></div><div><b>{story.sources.length}</b><span>Sources rattachées</span></div><div><b>{story.breaking ? "Oui" : "Non"}</b><span>Signal urgent</span></div></div>
      <p className="wvj-fine">{story.radar_scan_id?`Identifiant du scan : ${story.radar_scan_id}`:"Sélection manuelle sur une publication des Nations unies. Aucun scan RADAR automatisé n’est revendiqué pour ce sujet."}</p>
    </div>;
    case "verify": return <div className="wvj-block"><div className="wvj-subtitle">Rapport d'enquête</div>
      <div className="wvj-evidence-highlight"><b>{story.verification_report?.verdict ?? "Pas de rapport VERIFY"}</b><span>{story.verification_report?.distinct_supporting_sources ?? 0} sources distinctes · {story.confidence_score}% confiance enregistrée</span></div>
      {story.verification_report?.claims.map((claim,i)=><div className="wvj-claim" key={i}><span className={`wvj-state ${claim.status}`}>{claim.status}</span><strong>{claim.claim}</strong><p>{claim.explanation}</p><small>{claim.supporting_urls.length} preuves · {claim.contradicting_urls.length} contradictions</small></div>)}
      {story.verification_report?.claims.length ? null : <p className="wvj-muted">Aucune affirmation vérifiée dans ce dossier. Une présence de source ne suffit pas à approuver le sujet.</p>}
      <div className="wvj-subtitle">Liens de provenance</div>
      {story.sources.length ? story.sources.map(source=><a className="wvj-source" href={source.url} target="_blank" rel="noreferrer" key={source.id}><span><b>{source.name}</b><small>{source.scope} · {source.is_primary ? "primaire" : "secondaire"}</small></span><span>↗</span></a>) : <p className="wvj-muted">Aucune source rattachée.</p>}
    </div>;
    case "score": return <div className="wvj-block"><div className="wvj-subtitle">Analyse éditoriale</div>
      <div className="wvj-score"><strong>{story.score.total}</strong><span>/ 100<br/>SCORE INDICATIF</span></div>
      {Object.entries(story.score.factors).filter(([name])=>name!=="saturation_penalty").sort((a,b)=>b[1]-a[1]).slice(0,8).map(([name,value])=><div className="wvj-factor" key={name}><div><span>{name.replaceAll("_", " ")}</span><b>{value}</b></div><div className="wvj-track"><span style={{width:formatPercent(value)}}/></div></div>)}
      {story.score.reasons.map((reason,i)=><p key={i} className="wvj-reason">✳ {reason}</p>)}
      <p className="wvj-fine">Le score n'est pas une validation de l'information.</p>
    </div>;
    case "approval": return <div className="wvj-block"><div className="wvj-subtitle">Porte éditoriale</div><h3>Décision humaine obligatoire</h3>
      <div className="wvj-decision"><span>Vérification</span><strong>{story.verification_status}</strong></div>
      <div className="wvj-decision"><span>État du sujet</span><strong>{story.status}</strong></div>
      <div className="wvj-decision"><span>Note éditoriale</span><strong>{story.approval_note || "Aucune note"}</strong></div>
      <p className="wvj-muted">Approbation, demandes de corrections et refus sont des transitions contrôlées par l'API média. Un scénario fictif n'est jamais une approbation réelle.</p>
    </div>;
    case "creative": return <div className="wvj-block"><div className="wvj-subtitle">Atelier des accroches</div>
      {creative && <><h3>{creative.angle}</h3><p className="wvj-fine">Version CREATIVE {creative.version} · {creative.target_duration_sec} s</p></>}
      {story.hooks.map(hook=><div className="wvj-hook" key={hook.id}><div><span>ACCROCHE · {hook.score}/100</span>{story.selected_hook_id===hook.id&&<em>CHOISIE</em>}</div><strong>{hook.text}</strong><p>{hook.rationale}</p></div>)}
      <div className="wvj-subtitle">Narration</div>
      {creative?.script_segments.map((line,i)=><p className="wvj-script" key={i}><span>{String(i+1).padStart(2,"0")}</span>{line.text}</p>) ?? <p className="wvj-muted">Le script apparaît ici après génération et approbation.</p>}
      {selectedHook && <p className="wvj-fine">Accroche choisie : {selectedHook.text}</p>}
    </div>;
    case "assets": return <div className="wvj-block"><div className="wvj-subtitle">Bibliothèque des médias</div>
      <div className="wvj-metrics"><div><b>{story.asset_bundle?.assets.length ?? 0}</b><span>Fichiers trouvés</span></div><div><b>{story.asset_bundle?.selections.length ?? 0}</b><span>Scènes illustrées</span></div><div><b>{story.asset_bundle?.unresolved_scene_orders.length ?? "—"}</b><span>Scènes à vérifier</span></div></div>
      {story.asset_bundle?.assets.length ? story.asset_bundle.assets.slice(0,10).map(asset=><a key={asset.id} className="wvj-source" href={asset.source_page_url} target="_blank" rel="noreferrer"><span><b>{asset.title}</b><small>{asset.author || "Auteur inconnu"} · {asset.license_name || "Licence à vérifier"} · {asset.rights_status}</small></span><span>↗</span></a>) : <div className="wvj-empty">Aucun média sélectionné dans ce dossier. La recherche de médias autorisés est une opération backend.</div>}
      <p className="wvj-fine">Une photo sous licence n'est pas automatiquement une preuve de l'événement raconté.</p>
    </div>;
    case "storyboard": return <div className="wvj-block"><div className="wvj-subtitle">Table de montage</div>
      <div className="wvj-metrics"><div><b>{draft ? `${draft.width} × ${draft.height}` : "1080 × 1920"}</b><span>Format vertical</span></div><div><b>{draft?.fps ?? 30} fps</b><span>Cadence cible</span></div><div><b>{draft?.duration_sec ?? "—"} s</b><span>Durée</span></div></div>
      {scenes.length ? scenes.map((scene,i)=><button type="button" aria-pressed={i===selectedScene} className={`wvj-scene ${i===selectedScene?"active":""}`} key={scene.id} onClick={()=>onScene(i)}>
        <span className="wvj-scene-no">{String(i+1).padStart(2,"0")}</span><span><b>{scene.on_screen_text}</b><small>{scene.visual_kind} · {scene.start_sec.toFixed(1)}–{(scene.start_sec+scene.duration_sec).toFixed(1)} s</small></span><span>↗</span></button>)
       : creative?.scene_plan.map((scene,i)=><button type="button" className={`wvj-scene ${i===selectedScene?"active":""}`} key={scene.order} onClick={()=>onScene(i)}><span className="wvj-scene-no">{String(i+1).padStart(2,"0")}</span><span><b>{scene.on_screen_text}</b><small>Préparation · {scene.visual_kind}</small></span><span>↗</span></button>) ?? <p className="wvj-muted">Le storyboard est créé à partir de CREATIVE et des médias autorisés.</p>}
    </div>;
    case "audio": return <div className="wvj-block"><div className="wvj-subtitle">Narration contrôlée</div>
      {story.voiceover ? <><div className="wvj-metrics"><div><b>{story.voiceover.voice}</b><span>Voix</span></div><div><b>{story.voiceover.duration_sec.toFixed(1)} s</b><span>Durée</span></div><div><b>{story.voiceover.transcript_match_score}%</b><span>Correspondance script</span></div></div><div className="wvj-script-quote">« {story.voiceover.transcript} »</div><p className="wvj-fine">{story.voiceover.ai_generated_disclosure} · PCM/WAV {story.voiceover.sample_rate_hz/1000} kHz · QA {story.voiceover.qa_passed?"validé":"non validé"}</p></>
        : <><div className="wvj-script-quote">« {draft?.voiceover_script || creative?.script_segments.map(s=>s.text).join(" ") || "Script non disponible."} »</div><p className="wvj-muted">Aucun fichier vocal généré. La voix off ne peut pas être écoutée dans cet aperçu.</p></>}
    </div>;
    case "render": return <div className="wvj-block"><div className="wvj-subtitle">Encodeur & fichier réel</div>
      <div className="wvj-metrics"><div><b>{story.render_job?.status ?? "À lancer"}</b><span>État du job</span></div><div><b>{story.render_job ? `${Math.round(story.render_job.progress*100)}%` : "—"}</b><span>Progression</span></div><div><b>{story.render_job?.output_probe?.size_bytes ? `${(story.render_job.output_probe.size_bytes/1e6).toFixed(1)} Mo` : "—"}</b><span>Taille MP4</span></div></div>
      {story.render_job?.output_probe && <div className="wvj-decision"><span>Sortie mesurée</span><strong>{story.render_job.output_probe.width}×{story.render_job.output_probe.height} · {story.render_job.output_probe.video_codec} · {story.render_job.output_probe.audio_codec || "sans audio"}</strong></div>}
      <div className="wvj-hash"><span>SHA-256 DU FICHIER MP4</span><code>{story.render_job?.output_sha256 || "En attente du fichier encodé"}</code></div>
      <p className="wvj-fine">Une empreinte présente dans des données de démo ne constitue pas une preuve de fichier. Seul le renderer connecté peut calculer l'empreinte du MP4 réel.</p>
    </div>;
    case "preview": return <div className="wvj-block"><div className="wvj-subtitle">Visionnage éditorial</div>
      <h3>Regarder, écouter, décider.</h3><p className="wvj-muted">Le lecteur à droite affiche le vrai MP4 uniquement lorsque le renderer a fourni une URL et que l'application n'est pas en mode démonstration.</p>
      <div className="wvj-decision"><span>Rendu</span><strong>{story.render_job?.status ?? "Aucun fichier"}</strong></div><div className="wvj-decision"><span>Décision</span><strong>{story.status === "preview_ready"?"En attente de validation":story.status}</strong></div>
      <p className="wvj-reason">① Vérifier la concordance des images · ② Vérifier la voix · ③ Vérifier la lisibilité sur téléphone.</p>
    </div>;
    case "qa": return <div className="wvj-block"><div className="wvj-subtitle">Audit final</div><h3>Les huit portes de sécurité</h3>
      <div className="wvj-qa">{qaChecks.map(([label,status])=><div key={label} className={`wvj-qa-item ${status}`}><span>{status==="pass"?"✓":status==="fail"?"!":"○"}</span><b>{label}</b><small>{status}</small></div>)}</div>
      {story.qa_report?.issues.map((item,i)=><div className="wvj-claim" key={i}><b>{item.check} · {item.severity}</b><p>{item.message}</p></div>)}
      <p className="wvj-fine">Le statut publish_ready exige les contrôles approuvés. La revue visuelle humaine reste nécessaire.</p>
    </div>;
    case "package": return <div className="wvj-block"><div className="wvj-subtitle">Registre de publication</div>
      <div className="wvj-hash"><span>SHA-256 DU MASTER MP4</span><code>{story.publication_package?.video_sha256 || "Master non attesté"}</code></div>
      <div className="wvj-hash"><span>SHA-256 DU MANIFESTE</span><code>{story.publication_package?.manifest_sha256 || "Manifeste non préparé"}</code></div>
      {story.publication_package && <><div className="wvj-decision"><span>Version</span><b>v{story.publication_package.version}</b></div><div className="wvj-decision"><span>Canaux demandés</span><b>{story.publication_package.target_channels.join(" · ")}</b></div><div className="wvj-decision"><span>CREATIVE / QA</span><b>v{story.publication_package.creative_version} / v{story.publication_package.qa_version}</b></div><p className="wvj-script-quote">{story.publication_package.tiktok_caption}</p></>}
      <p className="wvj-fine">L'empreinte du manifeste n'est PAS l'empreinte du fichier MP4.</p>
    </div>;
    case "tiktok": { const exportRef=story.channel_exports.find(e=>e.channel==="tiktok");return <div className="wvj-block"><div className="wvj-subtitle">Livrable TikTok · distinct du master</div>
      <div className="wvj-decision"><span>Profil</span><strong>tiktok_api_clean_v1</strong></div>
      <div className="wvj-decision"><span>Rendu clean</span><strong>{exportRef?.render_job.status ?? "Non généré"}</strong></div>
      <div className="wvj-hash"><span>SHA-256 DU MP4 TIKTOK</span><code>{exportRef?.render_job.output_sha256 || "Pas d'export réel"}</code></div>
      <div className="wvj-hash"><span>MANIFESTE MASTER LIÉ</span><code>{exportRef?.canonical_manifest_sha256 || "Aucun lien enregistré"}</code></div>
      <p className="wvj-muted">Sans bandeau de marque ajouté par l'intégration. Ce profil n'implique pas une autorisation TikTok ni une publication.</p>
    </div>; }
    case "publish": return <div className="wvj-block"><div className="wvj-subtitle">Journal des diffusions</div>
      <div className="wvj-decision"><span>État de diffusion</span><strong>{story.status==="published"?"Publié avec reçus":"Non publié"}</strong></div>
      {(story.publication_package?.target_channels ?? ["tiktok","whatsapp"]).map(channel=>{const receipt=story.publication_receipts.find(r=>r.channel===channel);return <div className="wvj-claim" key={channel}><span className={`wvj-state ${receipt?"verified":"unresolved"}`}>{receipt?"Preuve enregistrée":"En attente"}</span><strong>{channel.toUpperCase()}</strong><p>{receipt?.external_id || receipt?.public_url || "Aucune publication confirmée."}</p></div>})}
      <p className="wvj-fine">TikTok et WhatsApp requièrent des preuves distinctes. La création d'un MP4 n'est jamais une publication.</p>
    </div>;
  }
}

function PhoneStage({story,stage,sceneIndex,previewMode}: {
  story:MediaStory;stage:ProductionStageId;sceneIndex:number;previewMode:boolean;
}) {
  const scenes = story.video_draft?.scenes ?? [];
  const creativeScenes = story.creative_package?.scene_plan ?? [];
  const scene:VideoScene | undefined = scenes[sceneIndex] ?? scenes[0];
  const planning = creativeScenes[sceneIndex] ?? creativeScenes[0];
  const text = scene?.on_screen_text || planning?.on_screen_text || "Une information. Son contexte. Ses preuves.";
  const clean = stage==="tiktok";
  const fileUrl = clean
    ? story.channel_exports.find(e=>e.channel==="tiktok")?.render_job.output_url
    : story.render_job?.output_url;
  const haveFile = clean
    ? story.channel_exports.some(e=>e.channel==="tiktok"&&e.render_job.status==="completed"&&Boolean(e.render_job.output_sha256))
    : story.render_job?.status==="completed" && Boolean(story.render_job.output_sha256);
  const showReal = Boolean(fileUrl) && haveFile && ["render","preview","qa","package","tiktok","publish"].includes(stage);
  return <div className="wvj-phone-column">
    <div className="wvj-phone-head"><span>MONITEUR 9:16</span><span>{showReal?"FICHIER MP4":"PRÉVISUALISATION CONCEPTUELLE"}</span></div>
    <div className="wvj-phone">
      {showReal ? <video key={fileUrl} controls playsInline preload="metadata" src={fileUrl ?? undefined} aria-label="Véritable MP4 encodé du sujet" /> :
      <div className="wvj-phone-frame">
        <div className="wvj-phone-grain"/>
        {!clean && <div className="wvj-phone-brand"><i>◉</i> WORLD—VISION</div>}
        <div className="wvj-phone-inner">
          <span className="wvj-phone-live">{previewMode?"DOSSIER RÉEL":"STORYBOARD"}</span>
          <span className="wvj-phone-category">{story.country_name ?? "MONDE"} · {story.category}</span>
          <div className="wvj-phone-headline">{text}</div>
          <div className="wvj-phone-rule"/>
          <p>{story.video_draft?.voiceover_script?.slice(0,125) || "Le texte et les images exacts apparaissent ici une fois les étapes de production exécutées."}</p>
        </div>
        <div className="wvj-phone-footer"><span>{scene ? `${scene.start_sec.toFixed(0)}s / ${story.video_draft?.duration_sec ?? 20}s` : "00:00 / 00:20"}</span><span>9:16 · 1080p</span></div>
      </div>}
    </div>
    <p className="wvj-phone-warning">{showReal ? "Vidéo issue du moteur connecté : vérifier visuellement et à l'écoute avant publication." : "Ceci est une représentation graphique du storyboard, pas un vrai MP4 encore disponible pour cette étape."}</p>
  </div>;
}

export default function ProductionJourney({
  story, stories, selectedId, onSelectStory, previewMode, onOpenControlRoom, onOpenReview, busy,
  onVerify,onDecision,onGenerateCreative,onDiscoverAssets,onPrepareDraft,
  onGenerateVoiceover,onLaunchRender,onSyncRender,onRunQa,onPreparePublication,
  onLaunchTikTokCleanExport,onSyncTikTokCleanExport,
}: Props) {
  const [current, setCurrent] = useState<ProductionStageId | "overview">(() => {
    const value = new URLSearchParams(window.location.search).get("step");
    return value && STAGE_IDS.has(value) ? value as ProductionStageId : "overview";
  });
  const [sceneIndex,setSceneIndex] = useState(0);
  useEffect(()=>{
    const url=new URL(window.location.href);
    if(current==="overview")url.searchParams.delete("step");
    else url.searchParams.set("step",current);
    window.history.replaceState({}, "", url.pathname+url.search+url.hash);
  },[current]);
  useEffect(()=>{setSceneIndex(0)},[story?.id]);
  useEffect(()=>{
    const handler=()=>{const v=new URLSearchParams(location.search).get("step");setCurrent(v&&STAGE_IDS.has(v)?v as ProductionStageId:"overview")};
    window.addEventListener("popstate",handler);
    return ()=>window.removeEventListener("popstate",handler);
  },[]);
  const index=STEPS.findIndex(s=>s.id===current);
  const selectedStep=index>=0?STEPS[index]:null;
  const doneCount=useMemo(()=>story?STEPS.filter(step=>evidenceStatus(story,step.id)).length:0,[story]);
  type Task={name:string;reason?:string;run:()=>Promise<void>;allowed:boolean};
  const task:Task|null=(!story || !selectedStep)?null:(()=>{
    const s=story;
    switch(selectedStep.id){
      case "verify": return {name:"Lancer la vérification",allowed:["candidate","changes_requested"].includes(s.status),run:()=>onVerify(s)};
      case "approval":return {name:"Approuver le sujet",allowed:s.verification_status==="verified"&&["candidate","changes_requested"].includes(s.status),run:()=>onDecision(s,"approve")};
      case "creative":return {name:"Générer CREATIVE",allowed:s.status==="approved",run:()=>onGenerateCreative(s)};
      case "assets":return {name:"Rechercher les médias",allowed:["approved","assets","changes_requested"].includes(s.status)&&Boolean(s.creative_package),run:()=>onDiscoverAssets(s)};
      case "storyboard":return {name:"Construire le storyboard",allowed:["approved","assets","changes_requested","scripting"].includes(s.status)&&Boolean(s.selected_hook_id)&&Boolean(s.creative_package)&&(!s.asset_bundle||s.asset_bundle.unresolved_scene_orders.length===0),run:()=>onPrepareDraft(s)};
      case "audio":return {name:"Générer la voix off",allowed:s.status==="scripting"&&Boolean(s.video_draft),run:()=>onGenerateVoiceover(s)};
      case "render":return {name:"Lancer le rendu MP4",allowed:s.status==="scripting"&&s.voiceover?.qa_passed===true,run:()=>onLaunchRender(s)};
      case "preview":return s.status==="preview_ready"?{name:"Approuver l'aperçu",allowed:true,run:()=>onDecision(s,"approve_preview")}:{name:"Synchroniser le rendu",allowed:s.status==="rendering"&&Boolean(s.render_job),run:()=>onSyncRender(s)};
      case "qa":return s.status==="qa"&&s.qa_report?.all_passed===true?{name:"Valider les contrôles",allowed:true,run:()=>onDecision(s,"mark_publish_ready")}:{name:"Lancer QA",allowed:s.status==="qa",run:()=>onRunQa(s)};
      case "package":return {name:"Créer Publication Package",allowed:s.status==="publish_ready",run:()=>onPreparePublication(s)};
      case "tiktok":return s.channel_exports.some(e=>e.channel==="tiktok")?{name:"Actualiser l'export",allowed:Boolean(s.publication_package),run:()=>onSyncTikTokCleanExport(s)}:{name:"Créer l'export TikTok",allowed:s.status==="publish_ready"&&Boolean(s.publication_package),run:()=>onLaunchTikTokCleanExport(s)};
      default:return null;
    }
  })();
  return <div className="wvj">
    <section className="wvj-masthead">
      <div className="wvj-masthead-copy"><div className="wvj-eyebrow"><span className="wvj-dot"/> WORLD-VISION · PRODUCTION ENGINE</div>
        <h1>De l'actualité <em>à l'écran.</em></h1>
        <p>Explore le parcours complet d'une vidéo d'information. Chaque étape montre sa mission, ses données, ses contrôles et son livrable.</p>
        <div className="wvj-mode">{previewMode?(story?.render_job?.status==="completed"?"● REPORTAGE MP4 RÉEL · ARCHIVE EN LECTURE SEULE":"● ACTUALITÉ RÉELLE · MONTAGE EN COURS"):"● DONNÉES DU MEDIA SERVICE CONNECTÉ"}</div>
      </div>
      <div className="wvj-masthead-count"><strong>14</strong><span>ÉTAPES<br/>DE PRODUCTION</span></div>
    </section>
    <section className="wvj-current-release" aria-label="Nouveautés du Media Studio">
      <div className="wvj-current-release-copy">
        <div className="wvj-current-kicker">PROCHAINE VALIDATION · DIRECTION ARTISTIQUE</div>
        <h2>Les trois nouvelles ouvertures sont disponibles ici.</h2>
        <p>Le logo bleu officiel est approuvé. Compare les propositions A (documentaire),
          B (chiffres) et C (explication), puis note seulement celle que tu choisis.
          Le montage COP31 original reste refusé 1/10.</p>
      </div>
      <button type="button" onClick={()=>onOpenReview("direction")}>
        Voir A, B et C · noter une proposition ↗
      </button>
    </section>
    <div className="wvj-controls">
      <div className="wvj-switch"><button type="button" className={current==="overview"?"active":""} onClick={()=>setCurrent("overview")}>Vue d'ensemble</button><button type="button" className={current!=="overview"?"active":""} onClick={()=>setCurrent(current==="overview"?"radar":current)}>Explorer les étapes</button></div>
      <div className="wvj-subject"><label htmlFor="wvj-story">DOSSIER</label><select id="wvj-story" value={story?.id||selectedId||""} onChange={e=>onSelectStory(e.target.value)}>{stories.map(s=><option value={s.id} key={s.id}>{s.title}</option>)}</select></div>
    </div>
    {current==="overview" ? <>
      <section className="wvj-overview">
        <div className="wvj-overview-intro"><span>LE CIRCUIT ÉDITORIAL</span><h2>Une information ne devient pas une vidéo par magie.</h2><p>Ce sont quatorze opérations contrôlées : de la détection du sujet jusqu'aux preuves de publication. Choisis n'importe quel bloc pour entrer dans son espace de travail.</p></div>
        <div className="wvj-overview-metrics"><div><strong>05</strong><span>PHASES</span></div><div><strong>14</strong><span>ÉTAPES</span></div><div><strong>8</strong><span>CONTRÔLES QA</span></div><div><strong>{story?`${doneCount}/14`:"—"}</strong><span>ÉTAT DU DOSSIER</span></div></div>
      </section>
      {story?.render_job?.status==="completed" && story.render_job.output_sha256 && story.render_job.output_url && (
        <section className="wvj-featured-real" aria-label="Pilote de création vidéo non approuvé">
          <div className="wvj-featured-details">
            <span>PILOTE REFUSÉ · COP31 / ONU · 12 NOVEMBRE 2026</span>
            <h2>Vrai MP4. Qualité éditoriale refusée.</h2>
            <p>{story.title}</p>
            <div className="wvj-featured-facts">
              <b>{story.render_job.output_probe?.duration_sec.toFixed(1) ?? "—"} s</b>
              <b>1080 × 1920</b>
              <b>H.264 + AAC</b>
            </div>
            <div className="wvj-featured-note">Archive de test conservée pour analyse. Le logo, les images, les animations et la voix ne sont pas conformes.
              Ne pas diffuser. Refonte complète scène par scène avant un nouveau rendu.</div>
            <button type="button" onClick={()=>setCurrent("preview")}>Examiner le rendu refusé et les étapes →</button>
            <button type="button" className="wvj-secondary-review" onClick={()=>onOpenReview("video")}>Noter ce pilote de 1 à 10 ★</button>
          </div>
          <div className="wvj-featured-player">
            <video
              controls playsInline preload="metadata"
              poster="./media-pilots/cop31-risk-finance-2026-11-12/poster-preview.jpg"
              src={story.render_job.output_url}
              aria-label="World-Vision, véritable reportage COP31 en MP4"
            />
            <div>ARCHIVE NON APPROUVÉE · SHA-256 {story.render_job.output_sha256.slice(0,16)}…</div>
          </div>
        </section>
      )}
      {groups.map((group,gi)=><section className="wvj-group" key={group}><div className="wvj-group-title"><span>{String(gi+1).padStart(2,"0")} / 05</span><h3>{group}</h3></div><div className="wvj-card-grid">{STEPS.filter(s=>s.group===group).map(s=><button type="button" key={s.id} onClick={()=>setCurrent(s.id)} className="wvj-step-card"><span className="wvj-step-top"><b>{s.number}</b><i>{s.icon}</i></span><strong>{s.name}</strong><small>{s.short}</small><span className="wvj-step-card-bottom"><span>{story&&evidenceStatus(story,s.id)?"DONNÉES PRODUITES":"EXPLORER"}</span><span>↗</span></span></button>)}</div></section>)}
    </> : selectedStep && <div className="wvj-workspace">
      <nav className="wvj-rail" aria-label="Étapes du processus"><div className="wvj-rail-label">LES 14 ÉTAPES</div>{STEPS.map(step=><button key={step.id} type="button" className={`wvj-rail-item ${step.id===current?"active":""}`} aria-current={step.id===current?"step":undefined} onClick={()=>setCurrent(step.id)}><span className="wvj-rail-num">{step.number}</span><span className="wvj-rail-name"><b>{step.name}</b><small>{step.short}</small></span><span className="wvj-rail-indicator">{story&&evidenceStatus(story,step.id)?"✓":step.id===current?"●":"·"}</span></button>)}</nav>
      <div className="wvj-page">
        <div className="wvj-page-meta"><button type="button" onClick={()=>setCurrent("overview")}>← Vue d'ensemble</button><span>{selectedStep.group} / ÉTAPE {selectedStep.number} SUR 14</span></div>
        <header className="wvj-page-head"><div className="wvj-page-icon">{selectedStep.icon}</div><div><div className="wvj-page-kicker">{selectedStep.kicker}</div><h2>{selectedStep.title}</h2><p>{selectedStep.description}</p></div></header>
        <div className="wvj-why"><div><span>POURQUOI C'EST IMPORTANT</span><p>{selectedStep.purpose}</p></div><div><span>CE QUI EST PRODUIT</span><p>{selectedStep.output}</p></div></div>
        {story ? <div className="wvj-evidence"><div className="wvj-evidence-title"><span>DONNÉES DU DOSSIER SÉLECTIONNÉ</span><small>{evidenceStatus(story,selectedStep.id)?"DONNÉES CONSIGNÉES":"NON FINALISÉ"}</small></div><StepEvidence id={selectedStep.id} story={story} selectedScene={sceneIndex} onScene={setSceneIndex}/></div> : <div className="wvj-empty">Aucune actualité chargée. Vérifie le service média ou choisis un dossier.</div>}
        <div className="wvj-action-panel"><div><strong>PASSER À L'ACTION</strong><p>{previewMode?"Archive d’un reportage fondé sur des sources réelles. Les commandes restent désactivées sans serveur connecté : ce site ne fabrique ni rendus ni preuves fictives.":"Les actions sont reliées au véritable backend et suivent les contrôles d’état du sujet."}</p></div><div className="wvj-action-buttons">{task&&<button type="button" disabled={busy||previewMode||!task.allowed} onClick={()=>void task.run()} className="wvj-action-primary">{busy?"Traitement…":task.name}</button>}<button type="button" className="wvj-action-secondary" onClick={()=>onOpenReview(REVIEW_GATE_FOR_STAGE[selectedStep.id])}>★ Noter / valider cette étape</button>
        <button type="button" className="wvj-action-secondary" onClick={onOpenControlRoom}>Ouvrir le Control Room ↗</button></div></div>
        <nav className="wvj-page-footer" aria-label="Naviguer entre les étapes"><button type="button" disabled={index===0} onClick={()=>setCurrent(STEPS[index-1].id)}>← Étape précédente</button><span>{selectedStep.number} / 14</span><button type="button" disabled={index===STEPS.length-1} onClick={()=>setCurrent(STEPS[index+1].id)}>Étape suivante →</button></nav>
      </div>
      {story && <PhoneStage story={story} stage={selectedStep.id} sceneIndex={sceneIndex} previewMode={previewMode}/>}
    </div>}
  </div>;
}
