#!/usr/bin/env node
/** Independently verify the actual MP4 against the storyboard and NASA files. */
import fs from "node:fs";
import path from "node:path";
import {createHash} from "node:crypto";
import {execFileSync} from "node:child_process";
const file=process.argv[2],assets=process.argv[3];
if(!file||!assets)throw Error("Usage: qa-video.mjs <real-mp4> <NASA-assets-folder>");
const hash=v=>createHash("sha256").update(fs.readFileSync(v)).digest("hex");
const report=JSON.parse(fs.readFileSync(file+".report.json","utf8"));
const ledger=JSON.parse(fs.readFileSync(path.join(assets,"nasa-asset-ledger.json"),"utf8"));
const probed=JSON.parse(execFileSync("ffprobe",["-v","error","-count_frames",
 "-show_entries","format=duration:stream=codec_name,width,height,nb_read_frames,codec_type,r_frame_rate",
 "-of","json",file],{encoding:"utf8",timeout:30000}));
const v=probed.streams.find(x=>x.codec_type==="video");
const a=probed.streams.find(x=>x.codec_type==="audio");
const errors=[];
if(!v||v.codec_name!=="h264"||v.width!==1080||v.height!==1920||v.r_frame_rate!=="30/1")
 errors.push("Incorrect H264 1080×1920/30fps export.");
if(Number(v?.nb_read_frames)!==750||Math.abs(Number(probed.format?.duration)-25)>.08)
 errors.push("Unexpected final timeline length (750 frames / 25 sec expected).");
if(a)errors.push("Pre-voice animatic unexpectedly contains audio; cannot claim a selected narration.");
if(report.output_sha256!==hash(file)||report.duration_frames!==750||
   report.mode!=="full_film"||report.track_voice!=="no_narration"||report.caption_cues!==0)
 errors.push("MP4 report does not match encoded output / voice labeling.");
const sourceMap=new Map(ledger.assets.map(x=>[x.file,x]));
for(const m of report.media){
 const item=sourceMap.get(m.relative_path);
 if(!item||!item.sha256||item.sha256!==m.sha256)
   errors.push("Video imported bytes do not match verified NASA source ledger: "+m.relative_path);
}
for(const item of ledger.assets){
 if(!report.media.some(x=>x.relative_path===item.file))
   errors.push("NASA original not represented in the film output: "+item.file);
}
const audit={schema_version:"worldvision-film2b-audit-v1",
 status:errors.length?"FAIL":"INTERNAL_TECHNICALLY_VERIFIED",
 project_id:report.episode_id,
 output_sha256:hash(file),
 canvas:{width:v?.width,height:v?.height,fps:30},frames:Number(v?.nb_read_frames),
 duration_seconds:Number(probed.format?.duration),
 audio_track:"NONE; voice C5.2 is an optional historic reference, NOT reused",
 nasa_asset_sha256:ledger.assets.map(({id,sha256,width,height})=>({id,sha256,width,height})),
 narrative_source:"NASA Preliminary Lunar Science Report, 17 Nov 2026",
 public_release_allowed:false,
 publication_blockers:ledger.publication_blockers,
 errors
};
const target=file+".film2b-audit.json";
fs.writeFileSync(target,JSON.stringify(audit,null,2)+"\n");
console.log(JSON.stringify(audit,null,2));
if(errors.length)process.exitCode=1;
