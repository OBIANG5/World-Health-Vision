#!/usr/bin/env node
/**
 * FILM-2B2 — Build a full real-source Remotion film from measured French voice.
 *
 * Captions are timed to PCM phrase sample boundaries. Scene lengths follow
 * the actual narration instead of speeding up/slowing down speech to a
 * pre-determined 25 seconds. No rewriting of the NASA images or facts.
 */
import fs from "node:fs";
import path from "node:path";
import {fileURLToPath} from "node:url";
import {createHash} from "node:crypto";
import {inspectProject,durationFrames} from "../../services/media-renderer/creative/validate-project.mjs";
import {captionCueIssues} from "../../services/media-renderer/src/caption-timeline.mjs";

const root=path.dirname(fileURLToPath(import.meta.url));
const pilot=JSON.parse(fs.readFileSync(path.join(root,"../../media-pilots/artemis2/project.json"),"utf8"));
const narration=JSON.parse(fs.readFileSync(path.join(root,"narration.json"),"utf8"));
const timingsPath=process.argv[2],target=process.argv[3];
if(!timingsPath||!target)throw Error("Usage: build-narrated-project.mjs <voice-timings.json> <out.json>");
const voice=JSON.parse(fs.readFileSync(timingsPath,"utf8"));
if(voice.voice_approved_for_publication!==false||voice.voice_generated_with_ai!==true||
   voice.segment_alignment!=="speech synthesized separately; phrase-level sample timings only; words not ASR-checked")
 throw Error("Refusing to represent sample-timed AI voice as an editorially approved or word-forced narration");
if(narration.segments.length!==voice.segments.length||voice.sample_rate!==24000)
 throw Error("Missing or mismatched source script / voice cues");
const audioPath=path.join(path.dirname(timingsPath),voice.audio_master);
const actualAudioSha=createHash("sha256").update(fs.readFileSync(audioPath)).digest("hex");
if(actualAudioSha!==voice.audio_sha256)throw Error("Narrator mastering file changed after timing creation");
const scenes=pilot.shots.map(s=>structuredClone(s));
const cues=[],starts=[],ends=[];
for(const [index,segment] of narration.segments.entries()){
 const timing=voice.segments[index];
 if(segment.text!==timing.text||segment.scene!==timing.scene||
    timing.index!==index||!Number.isInteger(timing.start_frame)||
    !Number.isInteger(timing.end_frame))
  throw Error("The spoken text or phoneme timing was modified after rendering at phrase "+index);
 if(index&&timing.start_frame<voice.segments[index-1].end_frame)
  throw Error("Overlapping French narration cues");
 if(starts[segment.scene]===undefined)starts[segment.scene]=timing.start_frame;
 ends[segment.scene]=timing.end_frame;
 cues.push({startFrame:timing.start_frame,endFrame:timing.end_frame,
   text:segment.text,position:"upper"});
}
if(starts.length!==4||starts[0]!==0||starts.some(x=>!Number.isInteger(x))||
   !starts.every((n,i)=>i===0||n>starts[i-1]))
 throw Error("Missing scene/utterance source timeline; refusing guesswork");
const totalVoiceFrames=Math.ceil(voice.duration_samples*30/voice.sample_rate);
const transition=10;
for(let i=0;i<4;i++){
 const segmentFrames=(i===3?totalVoiceFrames+14:starts[i+1])-starts[i];
 scenes[i].durationFrames=segmentFrames+(i<3?transition:0);
 scenes[i].transitionAfter=i<3?"dissolve":"cut";
 scenes[i].transitionFrames=i<3?transition:0;
 if(scenes[i].durationFrames<(i===2?115:i===1?90:30))
  throw Error("Narration is too short for necessary authentic-source visual beat "+i);
}
const project={
 ...pilot,id:"wv-artemis2-french-voice-kokoro-internal-preview-v01",
 title:"Artemis II — véritable reportage NASA avec voix FR (AUDITION, non publiable)",
 script:narration.segments.map(x=>x.text).join(" "),
 shots:scenes,captions:cues,
 voice:{file:voice.audio_master,
   label:"Kokoro ff_siwis · AUDITION IA FR NON APPROUVÉE · ambiance originale mixée",
   volume:1},
 music:null,outro:null
};
const check=inspectProject(project);
if(!check.ok)throw Error("Narrated film invalid: "+JSON.stringify(check.errors));
const duration=durationFrames(project);
const bad=captionCueIssues(cues,duration);
if(bad.length)throw Error("Narration sample/caption contract violated: "+JSON.stringify(bad));
if(duration!==totalVoiceFrames+14||duration<600||duration>2100)
 throw Error("Film length not proportional to the actual voice PCM: "+duration+"/"+totalVoiceFrames);
fs.writeFileSync(target,JSON.stringify(project,null,2)+"\n");
const ms=frame=>Math.round(frame*1000/30);
const stamp=frame=>{
 const n=ms(frame),t=n%1000,s=Math.floor(n/1000)%60,m=Math.floor(n/60000)%60,h=Math.floor(n/3600000);
 return [h,m,s].map(x=>String(x).padStart(2,"0")).join(":")+","+String(t).padStart(3,"0");
};
const srt=cues.map((c,i)=>String(i+1)+"\n"+stamp(c.startFrame)+" --> "+
 stamp(c.endFrame)+"\n"+c.text).join("\n\n")+"\n";
fs.writeFileSync(target+".srt",srt,"utf8");
const report={
 schema_version:"worldvision-voice-to-film-timeline-v1",
 audio_master_sha256:actualAudioSha,
 script_sha256:createHash("sha256").update(project.script).digest("hex"),
 exact_spoken_text_unchanged:true,
 caption_alignment:"ACTUAL PCM SEGMENT BOUNDARIES, NOT WORD FORCED ALIGNMENT",
 source_pilot_id:pilot.id,
 source_image_hashes_unchanged:true,
 voice_provider:voice.model_repository,
 voice_blob_sha256:voice.voice_blob_sha256,
 scene_start_frames:starts,
 film_frames:duration,
 fps:30,
 audio_seconds:voice.duration_seconds,
 caption_count:cues.length,
 narrator_approval:"PENDING",
 public_release_allowed:false
};
fs.writeFileSync(target+".timeline-audit.json",JSON.stringify(report,null,2)+"\n");
console.log(JSON.stringify(report,null,2));
