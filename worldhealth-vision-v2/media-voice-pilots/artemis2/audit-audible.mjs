#!/usr/bin/env node
/**
 * Independent post-render QA of the TRUE audible MP4, not merely a JSON plan.
 */
import fs from "node:fs";
import path from "node:path";
import {createHash} from "node:crypto";
import {execFileSync} from "node:child_process";
import {captionCueIssues} from "../../services/media-renderer/src/caption-timeline.mjs";
import {durationFrames,inspectProject} from "../../services/media-renderer/creative/validate-project.mjs";

const video=process.argv[2],projectFile=process.argv[3],assets=process.argv[4];
if(!video||!projectFile||!assets)throw Error("Usage: audit-audible.mjs <mp4> <project.json> <assetdir>");
const project=JSON.parse(fs.readFileSync(projectFile,"utf8"));
const renderer=JSON.parse(fs.readFileSync(video+".report.json","utf8"));
const originals=JSON.parse(fs.readFileSync(path.join(assets,"nasa-asset-ledger.json"),"utf8"));
const take=JSON.parse(fs.readFileSync(new URL("./narration.json",import.meta.url),"utf8"));
const source=JSON.parse(fs.readFileSync(new URL("../../media-pilots/artemis2/sources.json",import.meta.url),"utf8"));
const shortsha=file=>createHash("sha256").update(fs.readFileSync(file)).digest("hex");
const ffprobe=JSON.parse(execFileSync("ffprobe",["-v","error","-count_frames",
    "-show_entries","format=duration:stream=codec_name,codec_type,width,height,r_frame_rate,nb_read_frames,sample_rate",
    "-of","json",video],{encoding:"utf8",timeout:30000}));
const v=ffprobe.streams.find(s=>s.codec_type==="video");
const a=ffprobe.streams.find(s=>s.codec_type==="audio");
const issues=inspectProject(project).errors.map(p=>p.field+": "+p.reason);
if(!v||v.codec_name!=="h264"||v.width!==1080||v.height!==1920||
   v.r_frame_rate!=="30/1"||Number(v.nb_read_frames)!==durationFrames(project))
 issues.push("MP4 H264 1080x1920/30fps duration inconsistent with measured voice timeline.");
if(!a||a.codec_name!=="aac"||Number(a.sample_rate)<22050)
 issues.push("Voice soundtrack is absent from the actual MP4.");
if(renderer.track_voice!==project.voice?.label||
   renderer.caption_cues!==take.segments.length||
   renderer.output_sha256!==shortsha(video))
 issues.push("Renderer source ledger mismatch: voice label, captions, or output bytes.");
if(renderer.caption_timing_source!=="editor_supplied_not_auto_verified")
 issues.push("Caption alignment was mislabeled as verified word ASR.");
if(captionCueIssues(project.captions,durationFrames(project)).length)
 issues.push("Invalid caption cue offsets/durations.");
if(project.music!==null||project.voice?.file!=="worldvision-master-mix.wav"||
   project.captions.length!==take.segments.length||
   !project.shots[0]?.titleFrameZero)
 issues.push("Wrong narrator, accidental independent commercial music, or missing first frame hook.");
if(renderer.media.length!==4)issues.push("Expected 3 original images and one mastered audio source");
for(const m of renderer.media){
 const original=originals.assets.find(s=>s.file===m.relative_path);
 if(original){
   const approved=source.assets.find(s=>s.file===m.relative_path);
   if(approved?.sha256!==m.sha256||original.sha256!==m.sha256)
     issues.push("Original NASA image bytes have changed during audio production: "+m.relative_path);
 }else if(m.relative_path==="worldvision-master-mix.wav"){
   const wav=JSON.parse(fs.readFileSync(path.join(assets,"worldvision-narration-timings.json"),"utf8"));
   if(wav.audio_sha256!==m.sha256)issues.push("Mixed and mastered voice does not match documented source WAV");
 }else issues.push("Unexpected extra file in film:"+m.relative_path);
}
const voiceMetadata=JSON.parse(fs.readFileSync(path.join(assets,"worldvision-narration-timings.json"),"utf8"));
const expectedSeconds=voiceMetadata.duration_seconds;
const actualSeconds=Number(ffprobe.format?.duration);
if(Math.abs(expectedSeconds-actualSeconds)>1.0)
 issues.push("Soundtrack and picture timeline diverge by more than one second.");
// Independently analyze encoded AAC output. Do not trust requested loudnorm settings.
let loudness={note:"See audio scan"};
const proc=await import("node:child_process");
const measured=proc.spawnSync("ffmpeg",["-hide_banner","-nostats","-i",video,"-vn","-af",
   "loudnorm=I=-16:TP=-1.5:LRA=10:print_format=json","-f","null","-"],
   {encoding:"utf8",timeout:90000,maxBuffer:1024*1024});
const match=(measured.stderr||"").match(/\{\s*"input_i"[\s\S]*?\}/);
if(measured.status!==0||!match)issues.push("Cannot independently determine integrated loudness/peak of encoded AAC.");
else {
  loudness=JSON.parse(match[0]);
  const i=Number(loudness.input_i),tp=Number(loudness.input_tp);
  if(!(i>-21&&i<-11&&tp<-.4))issues.push("Mastered audible AAC outside safe internal audition levels (LUFS or true peak).");
}
const result={
 schema_version:"worldvision-film2b-audible-qa-v1",status:issues.length?"FAIL":"PASS_INTERNAL_AUDIBLE_PREVIEW",
 source_date:"2026-11-17",voice_approval:false,public_release_allowed:false,
 video_sha256:shortsha(video),frames:Number(v?.nb_read_frames),duration_seconds:actualSeconds,
 voice_sha256:voiceMetadata.audio_sha256,voice_id:voiceMetadata.voice_id,
 audio_codec:a?.codec_name||"MISSING",audio_samplerate:a?.sample_rate||"MISSING",
 integrated_loudness:loudness,
 phrase_cues:project.captions.length,
 cue_alignment:"SYNTHESIZED PHRASE BOUNDARIES, NOT WORD-FORCED TRANSCRIPTION",
 media_ledger_sha256:renderer.media.map(({relative_path,sha256})=>({relative_path,sha256})),
 issues
};
fs.writeFileSync(video+".audible-qa.json",JSON.stringify(result,null,2)+"\n");
console.log(JSON.stringify(result,null,2));
if(issues.length)process.exitCode=1;
