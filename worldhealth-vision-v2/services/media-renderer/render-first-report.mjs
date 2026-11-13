/**
 * Produce the FIRST REAL newsroom report from a verified UN primary source.
 * No fake live RADAR run, no fake publication receipt, no silent proof claims.
 * Usage: node render-first-report.mjs <output-directory>
 * Requires: ffmpeg, ffprobe, Remotion browser, public/pilot-narration.wav
 */
import {createHash} from "node:crypto";
import {execFileSync} from "node:child_process";
import {createReadStream, existsSync} from "node:fs";
import {mkdir, readFile, writeFile} from "node:fs/promises";
import path from "node:path";
import {fileURLToPath} from "node:url";
import {bundle} from "@remotion/bundler";
import {renderMedia, renderStill, selectComposition} from "@remotion/renderer";

const root=path.dirname(fileURLToPath(import.meta.url));
const storyFile=path.resolve(root,"../../docs/media/pilots/cop31-risk-finance-2026-11-12.json");
const pilotDir=path.resolve(process.argv[2] || path.join(root,"pilot-dist/cop31-risk-finance-2026-11-12"));
const publicDir=path.join(root,"public");
const voiceFile=path.join(publicDir,"pilot-narration.wav");
const startedAt=new Date().toISOString();
const story=JSON.parse(await readFile(storyFile,"utf8"));
const expectedSceneCount=7;

function fail(condition,message){if(!condition)throw new Error("World-Vision real pilot integrity: "+message);}
fail(story.scenes?.length===expectedSceneCount,"exactly 7 editorial scenes required");
fail(story.sources?.length>=2,"primary sources must be explicitly recorded");
fail(story.verified_claims?.length>=4,"claim-level verification is missing");
fail(story.publication_consent===false,"test must not be auto-published");
fail(story.visual_assets?.type==="original_vector_motion_design","unknown rights for video assets");
for(const claim of story.verified_claims){
  fail(claim.sources?.length>0,"claim without cited source");
  for(const id of claim.sources)fail(story.sources.some(s=>s.id===id),"claim source "+id+" missing");
}
fail(existsSync(voiceFile),"a real WAV soundtrack must exist");
await mkdir(pilotDir,{recursive:true});

const probe=(filename)=>{
  const raw=execFileSync("ffprobe",[
    "-v","error","-show_entries",
    "format=duration,size,format_name:stream=index,codec_type,codec_name,width,height,avg_frame_rate,sample_rate,channels",
    "-of","json",filename
  ],{encoding:"utf8",maxBuffer:4_000_000});
  return JSON.parse(raw);
};
const voiceProbe=probe(voiceFile);
const audioDuration=Number(voiceProbe.format?.duration||0);
fail(audioDuration>=10&&audioDuration<=65,"invalid generated narration duration "+audioDuration);
const durationSeconds=Math.max(36,Math.ceil(audioDuration+2.8));
fail(durationSeconds<=68,"video would be too long");
const inputProps={
  story,
  durationSeconds,
  audioFilename:"pilot-narration.wav",
  renderProfile:"canonical_newsroom_v1",
};
const serveUrl=await bundle({entryPoint:path.join(root,"src","first-report-index.ts"),onProgress:()=>undefined});
const composition=await selectComposition({serveUrl,id:"WorldVisionFirstReport",inputProps});
fail(composition.width===1080&&composition.height===1920&&composition.fps===30,
  "composition is not 1080x1920 at 30fps");
const rawMp4=path.join(pilotDir,".pilot-render-raw.mp4");
const finalMp4=path.join(pilotDir,"world-vision-cop31-master.mp4");
const posterFile=path.join(pilotDir,"poster.png");
let previousMilestone=-1;
await renderMedia({
  codec:"h264",composition,serveUrl,outputLocation:rawMp4,inputProps,
  concurrency:2,
  crf:22,
  onProgress:({progress})=>{
    const current=Math.floor(progress*10);
    if(current>previousMilestone){previousMilestone=current;process.stdout.write("Remotion render "+Math.round(progress*100)+"%\n");}
  }
});
console.log("Normalizing narration and encoding AAC 48 kHz.");
execFileSync("ffmpeg",[
  "-hide_banner","-loglevel","error","-y",
  "-i",rawMp4,
  "-map","0:v:0","-map","0:a:0",
  "-c:v","copy","-c:a","aac","-ar","48000","-ac","2","-b:a","160k",
  "-af","loudnorm=I=-16:TP=-1.5:LRA=7",
  "-movflags","+faststart",finalMp4,
],{stdio:"inherit"});
await renderStill({
  composition,serveUrl,inputProps,
  frame:Math.round(durationSeconds*30*0.36),
  output:posterFile,
  imageFormat:"png",
});
const p=probe(finalMp4);
const video=p.streams?.find(x=>x.codec_type==="video");
const audio=p.streams?.find(x=>x.codec_type==="audio");
fail(video?.codec_name==="h264"&&video?.width===1080&&video?.height===1920,"invalid real encoded video");
fail(audio?.codec_name==="aac"&&Number(audio?.sample_rate)===48000,"invalid delivered audio");
fail(Number(p.format?.size)>100000,"suspiciously empty MP4");
fail(Number(p.format?.size)<90000000,"MP4 exceeds safe static GitHub preview size");
fail(Number(p.format?.duration)>audioDuration,"video is shorter than narration");
const hashFile=async(p)=>{
  const hash=createHash("sha256");
  for await(const chunk of createReadStream(p))hash.update(chunk);
  return hash.digest("hex");
};
const mp4Sha=await hashFile(finalMp4);
const voiceSha=await hashFile(voiceFile);
const renderedAt=new Date().toISOString();
const sceneWeights=[0.145,0.15,0.16,0.16,0.16,0.145,0.08];
const boundaries=[0];let proportion=0;
for(const weight of sceneWeights.slice(0,-1)){proportion+=weight;boundaries.push(Math.round(proportion*durationSeconds*30));}
boundaries.push(Math.round(durationSeconds*30));
const scenes=story.scenes.map((scene,i)=>({
 id:scene.id,order:i+1,
 start_sec:boundaries[i]/30,
 duration_sec:(boundaries[i+1]-boundaries[i])/30,
 purpose:scene.label.toLowerCase(),
 narration:null,
 on_screen_text:scene.headline,
 visual_kind:["hook_globe","source_close"].includes(scene.visual)?"typography":"chart",
 source_ids:scene.claim_ids.flatMap(claimId=>
   story.verified_claims.filter(c=>c.id===claimId).flatMap(c=>c.sources)
 ).filter((v,i,a)=>a.indexOf(v)===i),
}));
const facts=story.verified_claims.map(claim=>({
 claim:claim.text,
 status:"verified",
 supporting_urls:story.sources.filter(s=>claim.sources.includes(s.id)).map(s=>s.url),
 contradicting_urls:[],
 explanation:"Vérification rédactionnelle manuelle contre les sources primaires listées, 13/11/2026."
}));
const now=new Date().toISOString();
const factors={
 freshness:95,surprise:75,human_impact:93,importance:91,
 visual_potential:95,numerical_strength:96,undercoverage:82,
 francophone_relevance:84,africa_relevance:82,source_confidence:96,
 urgency:78,saturation_penalty:14,
};
const sources=story.sources.map(s=>({
 id:s.id,name:s.name,url:s.url,
 source_type:s.type==="institution"?"institution":"media",
 scope:s.scope,
 is_primary:Boolean(s.is_primary),
 published_at:s.published_at+"T12:00:00Z",
 note:"Source explicite de l'événement, consultée et consignée pour ce reportage.",
}));
const actualVideoPath="./media-pilots/cop31-risk-finance-2026-11-12/world-vision-cop31-master.mp4";
const realArchive={
 id:story.story_id,slug:story.slug,
 status:"preview_ready",
 title:story.title,summary:story.subtitle,
 category:story.category,language:"fr",
 country_iso3:null,country_name:"Monde",region:"Global",
 breaking:false,detected_at:"2026-11-13T08:40:00Z",
 event_at:"2026-11-12T12:00:00Z",updated_at:renderedAt,
 verification_status:"verified",confidence_score:96,
 radar_scan_id:null,radar_fingerprint:null,
 verification_report:{
   version:1,checked_at:renderedAt,
   model:"verification-redactionnelle-manuelle",
   retrieved_urls:story.sources.map(s=>s.url),
   claims:facts,distinct_supporting_sources:story.sources.filter(s=>s.id!=="unfccc").length,
   has_primary_support:true,verdict:"verified",confidence_score:96
 },
 sources,
 score:{
   total:87,factors,
   reasons:[
    "Sélection éditoriale humaine d'un véritable communiqué de l'ONU du 12 novembre 2026.",
    "Les trois chiffres sont des objectifs annoncés, jamais présentés comme des sommes versées.",
    "Score indicatif de sélection manuelle : la surveillance RADAR en continu n'a pas produit ce sujet."
   ],
   model_version:"choix-editorial-manuel-v1"
 },
 hooks:[
   {id:"hook-real-1",text:"Et si l'aide arrivait avant la catastrophe ?",score:91,
     rationale:"Question immédiatement compréhensible, évite de surpromettre.",claim_indexes:[]},
   {id:"hook-real-2",text:"COP31 : 3 milliards de dollars visés, 75 millions de personnes concernées.",score:89,
     rationale:"Faits chiffrés présents dans la publication officielle de l'ONU.",claim_indexes:[1,2]},
   {id:"hook-real-3",text:"Une alerte météo. Des fonds débloqués avant la catastrophe ?",score:83,
     rationale:"Explique le principe sans prétendre qu'il fonctionne déjà partout.",claim_indexes:[3]}
 ],
 selected_hook_id:"hook-real-1",
 creative_package:{
   version:1,created_at:renderedAt,model:"edition-humaine-sources-onu",
   angle:"Mobiliser des ressources avant une catastrophe : une ambition chiffrée, pas un résultat déjà atteint",
   angle_claim_indexes:[0,1,2,3,4],
   target_duration_sec:Math.round(durationSeconds),
   hooks:[],
   script_segments:[{text:story.narration,claim_indexes:[0,1,2,3,4]}],
   caption:story.copy_tiktok,caption_claim_indexes:[0,1,2,3,4],
   hashtags:["#COP31","#ONU","#Climat","#WorldVision"],
   scene_plan:story.scenes.map((s,i)=>({
     order:i+1,purpose:s.label.toLowerCase(),on_screen_text:s.headline,
     visual_kind:s.visual==="source_close"?"source_card":"chart",
     asset_query:null,claim_indexes:s.claim_ids.map(c=>story.verified_claims.findIndex(x=>x.id===c))
   }))
 },
 script:story.narration,
 video_draft:{
  version:1,created_at:renderedAt,format:"9:16",
  width:1080,height:1920,fps:30,duration_sec:durationSeconds,
  rendering_engine:"remotion",design_system_id:"world-vision-eye-globe-blue-news-v1",
  safe_zone_profile:"tiktok-conservative-v1",hook_id:"hook-real-1",
  voiceover_script:story.narration,
  source_line:"Sources : UN News · Nations unies · CCNUCC",
  scenes
 },
 voiceover:{
   id:"voice-cop31-piper-2026",provider:"piper_offline",
   model:"fr_FR-siwis-medium",voice:"siwis",
   format:"wav",sample_rate_hz:Number(voiceProbe.streams?.find(x=>x.codec_type==="audio")?.sample_rate||22050),
   duration_sec:audioDuration,generated_at:renderedAt,
   renderer_url:null,transcript:"Transcription indépendante ASR non réalisée.",
   transcript_match_score:0,duration_fit:true,qa_passed:false,
   ai_generated_disclosure:"Voix générée par IA"
 },
 render_job:{
   id:"real-remotion-cop31-2026-11-12",story_id:story.story_id,
   render_profile:"canonical_newsroom_v1",
   status:"completed",progress:1,created_at:startedAt,updated_at:renderedAt,
   output_url:actualVideoPath,output_sha256:mp4Sha,
   output_probe:{
     format_name:p.format?.format_name,size_bytes:Number(p.format.size),
     duration_sec:Number(p.format.duration),video_codec:video.codec_name,
     width:video.width,height:video.height,fps:30,
     pixel_format:"yuv420p",video_bit_rate:null,
     has_audio:true,audio_codec:audio.codec_name,
     audio_sample_rate_hz:Number(audio.sample_rate),audio_channels:Number(audio.channels),
     integrated_lufs:null,true_peak_dbfs:null,loudness_range_lu:null
   },attempts:1,max_attempts:3,error:null
 },
 target_duration_sec:Math.min(60,Math.round(durationSeconds)),
 assets:{photos:0,videos:0,official_documents:0,maps_or_charts:7},
 asset_bundle:null,
 qa:{
  facts:"pass",spelling:"pending",safe_zones:"pending",logo_integrity:"pending",
  source_display:"pass",rights:"pass",audio:"pending",render_integrity:"pass",
  notes:[
    "Le reportage MP4 est réellement encodé et identifié par son SHA-256.",
    "Les illustrations sont des animations graphiques originales, pas des photos de la COP31.",
    "Voix française Piper : écoute humaine + ASR indépendantes encore à effectuer.",
    "La publication reste bloquée en attente de validation éditoriale/QA."
  ]
 },
 qa_report:null,publication_package:null,channel_exports:[],publication_receipts:[],
 approval_note:"Reportage réel préparé pour test et visionnage ; pas d'autorisation de publication.",
};
await writeFile(path.join(pilotDir,"story.json"),JSON.stringify(realArchive,null,2)+"\n");
const provenance={
 schema_version:1,type:"WORLD_VISION_REAL_NEWSROOM_PILOT",
 source_case:storyFile,
 story_id:story.story_id,event_date:story.event_date,
 source_urls:story.sources.map(s=>s.url),
 video_filename:path.basename(finalMp4),video_sha256:mp4Sha,
 narration_sha256:voiceSha,voice_engine:story.voiceover_engine,
 duration_seconds:Number(p.format.duration),
 width:video.width,height:video.height,
 video_codec:video.codec_name,audio_codec:audio.codec_name,
 audio_sample_rate_hz:Number(audio.sample_rate),
 build_started_utc:startedAt,rendered_at_utc:renderedAt,
 published_to_platform:false,human_visual_review:false,
 independent_voice_transcription_qa:false,
 generated_visuals:"ORIGINAL_MOTION_GRAPHICS_ONLY",
 qa_note:"Technically encoded and hashed; final independent human visual/audio QA still pending."
};
await writeFile(path.join(pilotDir,"provenance.json"),JSON.stringify(provenance,null,2)+"\n");
await writeFile(path.join(pilotDir,"tiktok-caption.txt"),story.copy_tiktok+"\n");
await writeFile(path.join(pilotDir,"whatsapp-copy.txt"),story.copy_whatsapp+"\n");
await writeFile(path.join(pilotDir,"SHA256SUMS"),`${mp4Sha}  ${path.basename(finalMp4)}\n`);
console.log(JSON.stringify({
 success:true,story_id:story.story_id,
 mp4:finalMp4,mp4_sha256:mp4Sha,poster:posterFile,
 duration:durationSeconds,voice_duration:audioDuration,
 bytes:Number(p.format.size)
},null,2));
