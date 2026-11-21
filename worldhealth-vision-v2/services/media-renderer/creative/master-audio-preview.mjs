#!/usr/bin/env node
/**
 * Non-destructive, two-pass FFmpeg loudness normalization for an AUDITION MP4.
 * The video bitstream is copied, never re-rendered; all video pixels remain
 * the Remotion source. This does NOT approve source, voice, rights or content.
 *
 * Usage: node creative/master-audio-preview.mjs <input.mp4> <audition.mp4>
 */
import fs from 'node:fs';
import path from 'node:path';
import {spawnSync} from 'node:child_process';
import {createHash} from 'node:crypto';

const TARGET_I=-16,TARGET_TP=-2,TARGET_LRA=9;
const hash=(file)=>createHash('sha256').update(fs.readFileSync(file)).digest('hex');
function call(command,args){
  const r=spawnSync(command,args,{encoding:'utf8',maxBuffer:12*1024*1024,timeout:120000});
  if(r.error)throw r.error;
  if(r.status!==0)throw new Error(command+' exit '+r.status+': '+(r.stderr??'').slice(-2200));
  return (r.stderr??'')+'\n'+(r.stdout??'');
}
function analyze(file){
  const stderr=call('ffmpeg',['-hide_banner','-nostdin','-i',file,
    '-vn','-af',`loudnorm=I=${TARGET_I}:TP=${TARGET_TP}:LRA=${TARGET_LRA}:print_format=json`,
    '-f','null','-']);
  const jsonMatches=stderr.match(/\{\s*"input_i"[\s\S]*?\}/g);
  if(!jsonMatches?.length)throw new Error('FFmpeg did not report EBU R128 loudness.');
  const p=JSON.parse(jsonMatches.at(-1));
  const o={};
  for(const key of ['input_i','input_tp','input_lra','input_thresh','target_offset']){
    const n=Number(p[key]);if(!Number.isFinite(n))throw new Error('Invalid or silent loudnorm '+key+': '+p[key]);o[key]=n;
  }
  return o;
}
function metadata(file){
  const out=call('ffprobe',['-v','error','-show_entries','stream=codec_type,codec_name,nb_frames',
    '-show_entries','format=duration','-of','json',file]);
  return JSON.parse(out);
}
const [inputArg,outputArg,...extras]=process.argv.slice(2);
if(!inputArg||!outputArg||extras.length)throw new Error('Usage: master-audio-preview.mjs input.mp4 output.mp4');
const input=path.resolve(inputArg),output=path.resolve(outputArg);
if(path.extname(input).toLowerCase()!=='.mp4'||path.extname(output).toLowerCase()!=='.mp4'||
  input===output||!fs.existsSync(input))throw new Error('Need separate existing MP4 input and new MP4 output.');
const before=metadata(input);
if(!before.streams.some(s=>s.codec_type==='video'&&s.codec_name==='h264')||
   !before.streams.some(s=>s.codec_type==='audio'&&s.codec_name==='aac'))
  throw new Error('Input must have real H264 video and AAC audio.');
const measured=analyze(input);
const filter=[
  `loudnorm=I=${TARGET_I}`,`TP=${TARGET_TP}`,`LRA=${TARGET_LRA}`,
  `measured_I=${measured.input_i}`,`measured_TP=${measured.input_tp}`,
  `measured_LRA=${measured.input_lra}`,`measured_thresh=${measured.input_thresh}`,
  `offset=${measured.target_offset}`,'linear=true','print_format=json',
].join(':');
fs.mkdirSync(path.dirname(output),{recursive:true});
call('ffmpeg',['-hide_banner','-nostdin','-loglevel','error','-y','-i',input,
  '-map','0:v:0','-map','0:a:0','-c:v','copy','-c:a','aac','-b:a','192k','-ar','48000',
  '-af',filter,'-movflags','+faststart',output]);
const after=metadata(output);
const actual=analyze(output);
if(Math.abs(actual.input_i-TARGET_I)>1.2||actual.input_tp>-1.5)
  throw new Error('Audition cannot be certified: loudness '+actual.input_i+' LUFS, peak '+actual.input_tp+' dBTP.');
if(Math.abs(Number(after.format.duration)-Number(before.format.duration))>.15)
  throw new Error('Audio mastering shifted film duration.');
const report={
  kind:'internal_audio_audition_not_publication_master',
  source_mp4_sha256:hash(input),output_mp4_sha256:hash(output),
  video_codec_passthrough:'copy',audio_codec:'aac',
  input_lufs:measured.input_i,input_true_peak_dbfs:measured.input_tp,
  target_lufs:TARGET_I,target_true_peak_dbfs:TARGET_TP,
  verified_output_lufs:actual.input_i,verified_output_true_peak_dbfs:actual.input_tp,
  source_duration_seconds:Number(before.format.duration),
  audition_duration_seconds:Number(after.format.duration),
  warnings:['Volume and codec verified only. Real narration/music mix, SFX quality, rights, script and artwork require human review.'],
};
fs.writeFileSync(output+'.loudness.json',JSON.stringify(report,null,2)+'\n');
process.stdout.write(JSON.stringify(report,null,2)+'\n');
