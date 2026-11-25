#!/usr/bin/env node
/**
 * World-Vision Creative Edit — local files -> Remotion -> MP4.
 *
 * This is an ASSEMBLER, not an AI voice/video model or news researcher.
 * Media lives on disk, outside Git; no user files are committed.
 * Usage:
 * node creative/render-project.mjs --project /work/project.json \
 *     --assets /work/assets --output /work/export/master.mp4
 */
import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import {createHash,randomUUID} from "node:crypto";
import {fileURLToPath} from "node:url";
import {bundle} from "@remotion/bundler";
import {renderMedia,renderStill,selectComposition} from "@remotion/renderer";
import {FORMAT,inspectProject,resolveLocalFile} from "./validate-project.mjs";
import {reviewFrameRange} from "./review-range.mjs";
import {verifyOwnerReviewVoice} from "./owner-review-voice-gate.mjs";
import {artisticSampleFrames,artisticDeliveryStatus} from "./artistic-delivery-gate.mjs";

const rendererRoot=path.resolve(path.dirname(fileURLToPath(import.meta.url)),"..");
function args(argv){
  const o={};
  for(let i=0;i<argv.length;i+=2){
    const key=argv[i],value=argv[i+1];
    if(!["--project","--assets","--output","--shot","--review-shot","--owner-review-voice-manifest"].includes(key)||!value||value.startsWith("--"))
      throw new Error("Usage: --project <JSON> --assets <directory> --output <master.mp4>");
    o[key]=value;
  }
  if(![6,8].includes(argv.length)||!o["--project"]||!o["--assets"]||!o["--output"])
    throw new Error("Missing --project, --assets or --output.");
  if(o["--shot"]&&o["--review-shot"])
    throw new Error("Choose either the legacy silent --shot preview or the new --review-shot with original audio and captions.");
  if(o["--shot"]&&o["--owner-review-voice-manifest"])
    throw new Error("Silent technical --shot renders cannot be marked as owner voice review.");
  return o;
}
async function hashFile(file){
  const h=createHash("sha256");
  for await(const chunk of fs.createReadStream(file))h.update(chunk);
  return h.digest("hex");
}
async function run(argv){
  const cli=args(argv);
  const projectPath=path.resolve(cli["--project"]);
  const assetRoot=path.resolve(cli["--assets"]);
  const output=path.resolve(cli["--output"]);
  if(path.extname(output).toLowerCase()!==".mp4")throw new Error("Output must be an MP4.");
  const fullProject=JSON.parse(fs.readFileSync(projectPath,"utf-8"));
  const fullInspection=inspectProject(fullProject);
  if(!fullInspection.ok){
    process.stderr.write(JSON.stringify({status:"invalid_project",issues:fullInspection.errors},null,2)+"\n");
    return 2;
  }
  // An owner's audiovisual preview must NEVER substitute Kokoro or an older
  // Vivienne take. Evaluate selected C5.2, script and real audio bytes BEFORE
  // any expensive staging/bundling/rendering. No audio file is generated here.
  const ownerVoiceReview=cli["--owner-review-voice-manifest"]
    ? verifyOwnerReviewVoice({
        project:fullProject,assetsRoot:assetRoot,
        manifestPath:path.resolve(cli["--owner-review-voice-manifest"])
      }) : null;
  const shotId=cli["--shot"]||null;
  const reviewShotId=cli["--review-shot"]||null;
  if(shotId&&!fullProject.shots.some(s=>s.id===shotId)){
    throw new Error("Requested shot was not found: "+shotId);
  }
  // Review is a frame range of the ORIGINAL movie; retain original captions,
  // the approved voice and soundtrack, visual transitions and absolute time.
  // The source project is never edited, regenerated or rewritten.
  const review=reviewShotId?reviewFrameRange(fullProject,reviewShotId):null;
  // Historical --shot remains a silent isolated composition for existing CI.
  // Do not change its semantics without migrating existing users/tests.
  const project=shotId?{
    ...fullProject,
    shots:fullProject.shots.filter(s=>s.id===shotId).map(s=>({...s,transitionAfter:"cut",transitionFrames:0})),
    // An isolated --shot preview is an intentionally different technical
    // timeline; original-clock director beats belong to the FULL project only.
    // The source JSON and --review-shot retain every authored beat unchanged.
    voice:null,music:null,outro:null,directorBeats:[]
  }:fullProject;
  const inspection=inspectProject(project);
  if(!inspection.ok){
    process.stderr.write(JSON.stringify({status:"invalid_project",issues:inspection.errors},null,2)+"\n");
    return 2;
  }
  const publicRoot=path.join(rendererRoot,"public");
  const stagedRoot=path.join(publicRoot,"creative-import");
  fs.mkdirSync(stagedRoot,{recursive:true});
  const buildFolder="job-"+randomUUID();
  const staging=path.join(stagedRoot,buildFolder);
  fs.mkdirSync(staging,{recursive:true});
  const ledger=[];
  const cache=new Map();
  let tempBundle=null;
  async function stageFile(relative){
    // Cache the in-flight Promise, not merely the finished src string.
    // Promise.all() stages simultaneous SFX; the SAME licensed media file
    // must produce exactly one copy and one SHA provenance ledger entry.
    if(cache.has(relative))return await cache.get(relative);
    const pending=(async()=>{
      const source=resolveLocalFile(assetRoot,relative);
      const stat=fs.statSync(source);
      if(stat.size>2*1024*1024*1024)throw new Error("File exceeds 2 GiB: "+relative);
      const sha=await hashFile(source);
      const name=sha+path.extname(source).toLowerCase();
      const target=path.join(staging,name);
      if(!fs.existsSync(target))fs.copyFileSync(source,target);
      const src="creative-import/"+buildFolder+"/"+name;
      ledger.push({relative_path:relative,sha256:sha,size_bytes:stat.size,staged_as:src});
      return src;
    })();
    cache.set(relative,pending);
    try{return await pending;}
    catch(error){
      if(cache.get(relative)===pending)cache.delete(relative);
      throw error;
    }
  }
  try{
    const shots=[];
    for(const shot of project.shots){
      const media=shot.media?{
        kind:shot.media.kind,
        src:await stageFile(shot.media.file),
        trimBefore:shot.media.trimBefore??0,
        credit:shot.media.credit
      }:null;
      shots.push({
        id:shot.id,durationFrames:shot.durationFrames,template:shot.template,
        title:shot.title,subtitle:shot.subtitle,eyebrow:shot.eyebrow,
        titleFrameZero:shot.titleFrameZero??false,titleTreatment:shot.titleTreatment,
        footnote:shot.footnote,media,
        foreground:shot.foreground?{src:await stageFile(shot.foreground.file),credit:shot.foreground.credit}:null,
        accent:shot.accent,motion:shot.motion,
        transitionAfter:shot.transitionAfter,transitionFrames:shot.transitionFrames,
        focus:shot.focus,
        documentRegion:shot.documentRegion,
        // Keep the opt-in mobile evidence layout and bounded original-pixel zoom
        // through the production JSON -> Remotion inputProps boundary.
        evidencePresentation:shot.evidencePresentation,
        documentZoomMax:shot.documentZoomMax,
        geo:shot.geo,
        // Pass the SAME independently authored tracks to the H264 engine
        // that CreativeCompositionPreview uses in the browser. Never freeze.
        photo:shot.photo,
        // Export all DATA modes on the same server inputProps contract as the V2 Player.
        data:shot.data,
      });
    }
    const props={
      version:1,title:project.title,script:project.script,shots,
      showOfficialBrand:project.brandMark==="worldvision",
      // Same project-supplied global frame cues in browser Player and exported MP4.
      captions:shotId?[]:(project.captions??[]),
      wordCaptions:shotId?[]:(project.wordCaptions??[]),
      soundCues:shotId?[]:await Promise.all((project.soundCues??[]).map(async cue=>({
        src:await stageFile(cue.file),startFrame:cue.startFrame,
        durationFrames:cue.durationFrames,volume:cue.volume??0.25,label:cue.label
      }))),
      narration:project.voice?{
        src:await stageFile(project.voice.file),
        volume:project.voice.volume??1,
        label:project.voice.label
      }:null,
      soundtrack:project.music?{
        src:await stageFile(project.music.file),
        volume:project.music.volume??.1,
        label:project.music.label
      }:null,
      brandOutro:project.outro?{
        src:await stageFile(project.outro.file),
        durationFrames:project.outro.durationFrames
      }:null,
      visualStyle:{
        background:project.style?.background??"#0b1721",
        ink:project.style?.ink??"#f6f8fa",
        accent:project.style?.accent??"#8bbecf",
      }
    };
    tempBundle=fs.mkdtempSync(path.join(os.tmpdir(),"worldvision-bundle-"));
    process.stdout.write("Bundling official Remotion engine...\n");
    const serveUrl=await bundle({
      entryPoint:path.join(rendererRoot,"src","index.ts"),
      publicDir:publicRoot,
      outDir:tempBundle,
    });
    const composition=await selectComposition({
      serveUrl,id:"WorldVisionCreativeEdit",inputProps:props
    });
    fs.mkdirSync(path.dirname(output),{recursive:true});
    const outputFrames=review?review.durationFrames:inspection.frames;
    process.stdout.write("Rendering "+outputFrames+" frames with your supplied media"+(review?" and original timeline audio":"")+"...\n");
    await renderMedia({
      composition,serveUrl,inputProps:props,
      codec:"h264",audioCodec:"aac",outputLocation:output,
      pixelFormat:"yuv420p",crf:17,overwrite:true,
      ...(review?{frameRange:review.frameRange}:{}),
    });
    const sha=await hashFile(output);
    // Use Remotion's pixel-accurate frame renderer, not a simulated browser
    // source preview or a generic screenshot of the unrendered input photo.
    const stillDir=output+".stills";
    fs.mkdirSync(stillDir,{recursive:true});
    // Stills are absolute SOURCE frames when reviewing a film segment.
    const first=review?review.frameRange[0]:0;
    const last=review?review.frameRange[1]:inspection.frames-1;
    const frames=ownerVoiceReview&&!review&&!shotId?artisticSampleFrames(project):[first,Math.floor((first+last)*0.5),last];
    const stills=[];
    for(const [i,frame] of [...new Set(frames)].entries()){
      const name="frame-"+String(i+1).padStart(2,"0")+"-at-"+frame+".png";
      const location=path.join(stillDir,name);
      await renderStill({composition,serveUrl,inputProps:props,frame,output:location,imageFormat:"png"});
      stills.push({frame,file:location,sha256:await hashFile(location)});
    }
    const report={
      schema_version:FORMAT,episode_id:project.id,
      mode:review?"audio_context_shot_review":shotId?"single_shot_preview":"full_film",
      shot_id:reviewShotId??shotId,
      ...(review?{review_source_frame_range:review.frameRange,review_selected_source_frames:review.selectedShotSourceFrames,
        review_context_frames:review.actualContextFrames}:{}),
      input_manifest_sha256:await hashFile(projectPath),
      source_project_duration_frames:fullInspection.frames,
      source_script_sha256:createHash("sha256").update(project.script,"utf8").digest("hex"),
      exact_script_unchanged:true,
      // Absent explicit owner voice manifest, all legacy output is clearly
      // classified as a TECHNICAL TEST, never a voice-approved presentation.
      owner_review_voice_gate:ownerVoiceReview,
      intended_audience:ownerVoiceReview
        ?"internal_artistic_candidate_pending_review"
        :"internal_technical_qa_only",
      artistic_delivery:artisticDeliveryStatus(fullProject,ownerVoiceReview),
      output_path:output,output_sha256:sha,
      duration_frames:outputFrames,canvas:{width:1080,height:1920,fps:30},
      track_voice:project.voice?.label??(project.voice?"externally_supplied":"no_narration"),
      caption_cues:review?props.captions.filter(cue=>cue.startFrame<=review.frameRange[1]&&cue.endFrame>review.frameRange[0]).length:props.captions.length,
      word_caption_cues:review?props.wordCaptions.filter(cue=>cue.startFrame<=review.frameRange[1]&&cue.endFrame>review.frameRange[0]).length:props.wordCaptions.length,
      sound_cues:review?props.soundCues.filter(cue=>cue.startFrame<=review.frameRange[1]&&cue.startFrame+cue.durationFrames>review.frameRange[0]).length:props.soundCues.length,
      caption_timing_source:"editor_supplied_not_auto_verified",
      // Audit the ACTUAL Remotion inputProps after JSON staging, not just
      // the unrendered project manifest (P0.6 regression initially found).
      mobile_evidence_inputprops:props.shots.filter(shot=>
        shot.template==="document_focus"&&shot.evidencePresentation==="mobile-safe"
      ).map(shot=>({
        shot_id:shot.id,documentZoomMax:shot.documentZoomMax??1.85,
        documentRegion:shot.documentRegion,
        status:"STAGED_INPUTPROPS_NOT_ARTISTIC_APPROVAL"
      })),
      media:ledger,
      actual_rendered_stills:stills,
      warnings:["Tech render only. Not an AI quality guarantee, not editorial verification or publication approval.",
        ...(review?["Original film voice, soundtrack and captions retained; clip covers the selected shot with 15-frame context where available."]:[])],
    };
    fs.writeFileSync(output+".report.json",JSON.stringify(report,null,2)+"\n");
    process.stdout.write(JSON.stringify(report,null,2)+"\n");
    return 0;
  }finally{
    fs.rmSync(staging,{recursive:true,force:true});
    if(tempBundle)fs.rmSync(tempBundle,{recursive:true,force:true});
  }
}
run(process.argv.slice(2)).then(n=>{process.exitCode=n;}).catch(e=>{
  process.stderr.write("Creative Edit failed: "+e.message+"\n");
  process.exitCode=1;
});
