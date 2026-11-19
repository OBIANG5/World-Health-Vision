#!/usr/bin/env node
/**
 * World-Vision VOICE PRELIGHT — source audio unchanged.
 *
 * Reuses @remotion/renderer/FFmpeg for the analysis. Neither a TTS engine
 * nor voice enhancement/DSP is reimplemented here.
 *
 * Usage: node creative/audit-voice.mjs /absolute/path/to/narration.wav [film-duration-seconds]
 *
 * Silences are editorial review markers, NOT automatic cut instructions:
 * a meaningful pause may be intentionally cinematic.
 */
import fs from "node:fs";
import path from "node:path";
import {createHash} from "node:crypto";
import {getSilentParts} from "@remotion/renderer";

const input=process.argv[2];
const lengthArg=process.argv[3]??null;
if(!input||!path.isAbsolute(input)){
  process.stderr.write("Usage: node creative/audit-voice.mjs /absolute/path/to/voice.wav [film-duration-seconds]\n");
  process.exit(2);
}
const source=path.resolve(input);
const stat=fs.statSync(source);
if(!stat.isFile()||stat.size>2*1024*1024*1024)throw new Error("Invalid narration source.");
const videoDuration=lengthArg===null?null:Number(lengthArg);
if(videoDuration!==null&&(!Number.isFinite(videoDuration)||videoDuration<=0)){
  throw new Error("Film duration must be a positive number of seconds.");
}
const hash=createHash("sha256");
for await(const chunk of fs.createReadStream(source))hash.update(chunk);

const {silentParts,durationInSeconds}=await getSilentParts({
  src:source,
  noiseThresholdInDecibels:-45,
  minDurationInSeconds:0.45,
  logLevel:"error",
});
const flagged=silentParts
  .filter(s=>s.endInSeconds-s.startInSeconds>=.85)
  .map(s=>({
    start_seconds:Number(s.startInSeconds.toFixed(3)),
    end_seconds:Number(s.endInSeconds.toFixed(3)),
    length_seconds:Number((s.endInSeconds-s.startInSeconds).toFixed(3)),
    review:"long_silence_not_necessarily_a_fault",
  }));
const durationDiff=videoDuration===null?null:durationInSeconds-videoDuration;
const flags=[
  ...(flagged.length?[{code:"long_pauses_to_review",count:flagged.length}]:[]),
  ...(durationDiff!==null&&Math.abs(durationDiff)>.4
    ?[{code:"narration_timeline_mismatch",offset_seconds:Number(durationDiff.toFixed(3))}]:[]),
];
const report={
  tool:"worldvision-voice-audit-v1",
  original_audio_path:source,
  original_audio_sha256:hash.digest("hex"),
  original_audio_bytes:stat.size,
  input_unmodified:true,
  voice_provider:"not_inferred",
  duration_seconds:Number(durationInSeconds.toFixed(3)),
  expected_film_duration_seconds:videoDuration,
  noise_threshold_db:-45,
  reported_silent_intervals:silentParts.map(s=>({
    start_seconds:Number(s.startInSeconds.toFixed(3)),
    end_seconds:Number(s.endInSeconds.toFixed(3)),
  })),
  flags,
  conclusion:"These measurements are only review prompts. Listening to the entire voice and checking pronunciation, emotion, rhythm, commercial rights and mix is mandatory.",
};
process.stdout.write(JSON.stringify(report,null,2)+"\n");
