/* Assemble an authentic source-backed editorial case for static mobile preview.
 * No fake stories, no generated MP4 claim. The real archive from the renderer
 * supersedes this working dossier as soon as it is published to the same URL.
 */
import {readFileSync, writeFileSync} from "node:fs";
import path from "node:path";
import {fileURLToPath} from "node:url";

const dirname=path.dirname(fileURLToPath(import.meta.url));
export function writeRealEditorialCase(dist) {
  const src=path.resolve(dirname,"../docs/media/pilots/cop31-risk-finance-2026-11-12.json");
  const article=JSON.parse(readFileSync(src,"utf8"));
  if(article.publication_consent!==false)throw new Error("Real news pilot cannot be auto-published");
  const factorNames=[
    "freshness","surprise","human_impact","importance","visual_potential",
    "numerical_strength","undercoverage","francophone_relevance",
    "africa_relevance","source_confidence","urgency","saturation_penalty",
  ];
  const values=[95,75,93,91,95,96,82,84,82,96,78,14];
  const factors=Object.fromEntries(factorNames.map((name,index)=>[name,values[index]]));
  const sources=article.sources.map(s=>({
    id:s.id,name:s.name,url:s.url,
    source_type:s.type==="institution"?"institution":"media",
    scope:s.scope,is_primary:!!s.is_primary,
    published_at:s.published_at+"T12:00:00Z",
    note:"Source vérifiée et archivée pour ce reportage réel.",
  }));
  const claims=article.verified_claims.map(c=>({
    claim:c.text,status:"verified",explanation:"Contenu vérifié manuellement contre les références primaires.",
    supporting_urls:article.sources.filter(s=>c.sources.includes(s.id)).map(s=>s.url),
    contradicting_urls:[],
  }));
  const duration=40,fps=30;
  const weights=[0.145,0.15,0.16,0.16,0.16,0.145,0.08],boundaries=[0];
  let total=0;
  for(const w of weights.slice(0,-1)){total+=w;boundaries.push(Math.round(total*duration*fps));}
  boundaries.push(duration*fps);
  const scenes=article.scenes.map((s,i)=>({
    id:s.id,order:i+1,start_sec:boundaries[i]/fps,
    duration_sec:(boundaries[i+1]-boundaries[i])/fps,
    purpose:s.label.toLowerCase(),on_screen_text:s.headline,
    visual_kind:s.visual==="source_close"?"source_card":"chart",
    source_ids:s.claim_ids.flatMap(cid=>article.verified_claims.find(c=>c.id===cid)?.sources??[]),
  }));
  const hooks=[
    {id:"hook-real-1",text:"Et si l'aide arrivait avant la catastrophe ?",score:91,
      rationale:"Un angle clair et prudent fondé sur l'annonce de l'ONU.",claim_indexes:[]},
    {id:"hook-real-2",text:"COP31 : 3 milliards de dollars visés pour agir plus tôt.",score:88,
      rationale:"Les chiffres sont des objectifs annoncés, pas des résultats acquis.",claim_indexes:[1]},
    {id:"hook-real-3",text:"75 millions de personnes : ce que vise la nouvelle plateforme de l'ONU.",score:86,
      rationale:"Impact potentiel, avec horizon explicite de 2030.",claim_indexes:[2]},
  ];
  const now="2026-11-13T09:00:00Z";
  const record={
    id:article.story_id,slug:article.slug,status:"scripting",
    title:article.title,summary:article.subtitle,category:article.category,
    language:"fr",country_iso3:null,country_name:"Monde",region:"Global",
    breaking:false,detected_at:now,event_at:"2026-11-12T12:00:00Z",updated_at:now,
    verification_status:"verified",confidence_score:96,
    verification_report:{
      version:1,checked_at:now,model:"verification-redactionnelle-manuelle",
      retrieved_urls:sources.map(s=>s.url),claims,distinct_supporting_sources:3,
      has_primary_support:true,verdict:"verified",confidence_score:96,
    },
    sources,score:{
      total:87,factors,model_version:"selection-editoriale-manuelle-v1",
      reasons:[
        "Vraie annonce des Nations unies datée du 12 novembre 2026.",
        "Score éditorial indicatif choisi manuellement, non issu d'un scan RADAR continu.",
        "Les trois milliards de dollars sont une cible de mobilisation, pas un versement déjà effectué.",
      ]
    },
    hooks,selected_hook_id:"hook-real-1",
    creative_package:{
      version:1,created_at:now,model:"redaction-humaine-source-onu",
      angle:"Financer des mesures AVANT les catastrophes, sans surinterpréter l'objectif.",
      angle_claim_indexes:[0,1,2,3,4],
      target_duration_sec:duration,hooks,
      script_segments:[{text:article.narration,claim_indexes:[0,1,2,3,4]}],
      caption:article.copy_tiktok,caption_claim_indexes:[0,1,2,3,4],
      hashtags:["#COP31","#Climat","#ONU","#WorldVision"],
      scene_plan:article.scenes.map((s,i)=>({
        order:i+1,purpose:s.label.toLowerCase(),
        on_screen_text:s.headline,visual_kind:s.visual==="source_close"?"source_card":"chart",
        asset_query:null,claim_indexes:s.claim_ids.map(cid=>article.verified_claims.findIndex(c=>c.id===cid)),
      }))
    },
    script:article.narration,
    video_draft:{
      version:1,created_at:now,format:"9:16",width:1080,height:1920,fps,
      duration_sec:duration,rendering_engine:"remotion",
      design_system_id:"world-vision-eye-globe-blue-news-v1",
      safe_zone_profile:"tiktok-conservative-v1",hook_id:"hook-real-1",
      voiceover_script:article.narration,
      source_line:"Sources : UN News, Nations unies, CCNUCC",
      scenes,
    },
    voiceover:null,render_job:null,target_duration_sec:duration,
    assets:{photos:0,videos:0,official_documents:0,maps_or_charts:7},
    asset_bundle:null,
    qa:{
      facts:"pass",spelling:"pending",safe_zones:"pending",
      logo_integrity:"pending",source_display:"pass",
      rights:"pass",audio:"pending",render_integrity:"pending",
      notes:[
        "Vrai sujet vérifié sur les sources officielles de l'ONU.",
        "Animation originale sans médias externes soumis à une licence supplémentaire.",
        "Le fichier MP4 et ses empreintes ne sont affichés qu'après le rendu GitHub réel.",
      ]
    },
    qa_report:null,publication_package:null,channel_exports:[],
    publication_receipts:[],approval_note:"Rendu de test demandé, publication publique non autorisée.",
    radar_scan_id:null,radar_fingerprint:null,
  };
  writeFileSync(path.join(dist,"editorial-case.json"),JSON.stringify(record,null,2)+"\n","utf8");
  return record;
}
