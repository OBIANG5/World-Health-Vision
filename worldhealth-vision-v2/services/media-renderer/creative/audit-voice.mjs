#!/usr/bin/env node
/**
 * World-Vision — source narration audit.
 *
 * Uses the EXISTING FFmpeg/FFprobe binaries (Media Renderer Dockerfile already
 * installs them). This does not generate voice, trim pauses or normalize audio.
 * Both the user source and its SHA-256 must remain identical.
 *
 * Run: node creative/audit-voice.mjs /absolute/path/to/voice.wav [film_seconds]
 *
 * Remotion's getSilentParts returned a compositor "Invalid argument" for the
 * CI WAV fixture (19 Nov 2026). Use the mature FFmpeg silencedetect directly.
 * Keep that failure documented rather than silently allowing missing QA.
 */
import fs from "node:fs";
import path from "node:path";
import {createHash} from "node:crypto";
import {execFile} from "node:child_process";
import {promisify} from "node:util";
const exec=promisify(execFile);
const file=process.argv[2];
const optionalDuration=process.argv[3]??null;
if(!file||!path.isAbsolute(file)){
  process.stderr.write("Usage: node creative/audit-voice.mjs /absolute/file.wav [film-duration-seconds]\n");
  process.exit(2);
}
const source=path.resolve(file);
const stat=fs.statSync(source);
if(!stat.isFile()||stat.size>2*1024*1024*1024)throw Error("Invalid or too large narration/media input.");
const expected=optionalDuration===null?null:Number(optionalDuration);
if(expected!==null&&(!Number.isFinite(expected)||expected<=0))throw Error("Film duration must be positive.");

async function sha256(p){
  const h=createHash("sha256");
  for await(const chunk of fs.createReadStream(p))h.update(chunk);
  return h.digest("hex");
}
const originalSha=await sha256(source);
async function run(name,args){
  try{
    return await exec(name,args,{encoding:"utf8",maxBuffer:16*1024*1024,timeout:120000});
  }catch(error){
    if(error.code==="ENOENT"){
      throw Error(name+" is missing. Install the standard FFmpeg binaries already used in the renderer Docker image.");
    }
    throw Error(name+" failed: "+String(error.stderr??error.message).slice(-2200));
  }
}
const metadata=await run("ffprobe",[
  "-v","error","-show_entries","format=duration",
  "-of","default=noprint_wrappers=1:nokey=1",source
]);
const duration=Number(metadata.stdout.trim());
if(!Number.isFinite(duration)||duration<=0)throw Error("FFprobe did not return a valid media duration.");
const result=await run("ffmpeg",[
  "-hide_banner","-nostdin","-nostats","-i",source,
  "-map","0:a:0","-vn","-af",
  "silencedetect=noise=-45dB:d=0.45",
  "-f","null","-"
]);
// FFmpeg reports silences through stderr in chronological order.
const segments=[];
let open=null;
for(const line of result.stderr.split(/\r?\n/)){
  const start=line.match(/silence_start:\s*([0-9.]+)/);
  const end=line.match(/silence_end:\s*([0-9.]+)/);
  if(start){open=Number(start[1]);}
  if(end&&open!==null){
    segments.push({startInSeconds:open,endInSeconds:Number(end[1])});
    open=null;
  }
}
if(open!==null)segments.push({startInSeconds:open,endInSeconds:duration});
const silences=segments.filter(s=>s.endInSeconds>s.startInSeconds).map(s=>({
  start_seconds:Number(s.startInSeconds.toFixed(3)),
  end_seconds:Number(s.endInSeconds.toFixed(3)),
  length_seconds:Number((s.endInSeconds-s.startInSeconds).toFixed(3)),
}));
const durationDiff=expected===null?null:duration-expected;
const flags=[
  ...silences.filter(s=>s.length_seconds>=.85).map(s=>({
    code:"long_pause_for_listening_review",
    start_seconds:s.start_seconds,
    end_seconds:s.end_seconds,
    length_seconds:s.length_seconds
  })),
  ...(durationDiff!==null&&Math.abs(durationDiff)>.4
    ?[{code:"voice_timeline_duration_mismatch",offset_seconds:Number(durationDiff.toFixed(3))}]:[])
];
const afterSha=await sha256(source);
if(afterSha!==originalSha)throw Error("Source file changed during analysis; audit invalid.");
const report={
  schema_version:"worldvision-voice-audit-v1",
  analyzer:"ffmpeg-silencedetect",
  original_source_path:source,
  original_sha256:originalSha,
  input_unmodified:true,
  bytes:stat.size,
  duration_seconds:Number(duration.toFixed(3)),
  expected_film_duration_seconds:expected,
  threshold_db:-45,
  silences,
  flags,
  disclaimer:"Measured pauses are editorial review cues, NOT instructions to cut. This audit cannot judge naturalness, accent, factual accuracy, emotional tone, music rights, vocal licensing or artistic quality."
};
process.stdout.write(JSON.stringify(report,null,2)+"\n");
