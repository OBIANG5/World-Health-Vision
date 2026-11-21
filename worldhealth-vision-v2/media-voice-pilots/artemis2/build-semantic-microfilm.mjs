#!/usr/bin/env node
/**
 * MEDIA P0.5 — internal 3-beat Remotion test from existing, unapproved NASA voice.
 * Uses exact two first sentences, pinned NASA stills and measured PCM phrase times.
 * No publication, new TTS provider, fabricated word alignment or story choice.
 */
import fs from 'node:fs';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {inspectProject} from '../../services/media-renderer/creative/validate-project.mjs';

const here=path.dirname(fileURLToPath(import.meta.url));
const take=JSON.parse(fs.readFileSync(path.join(here,'narration.json'),'utf8'));
const sources=JSON.parse(fs.readFileSync(path.join(here,'../../media-pilots/artemis2/sources.json'),'utf8'));
const sha=bytes=>createHash('sha256').update(bytes).digest('hex');
const shaFile=file=>sha(fs.readFileSync(file));
const fail=message=>{throw new Error('NASA MICROFILM INTERNAL: '+message);};
const [timingArg,assetsArg,projectArg]=process.argv.slice(2);
if(!timingArg||!assetsArg||!projectArg||process.argv.length!==5)
  fail('Usage: node build-semantic-microfilm.mjs VOICE_TIMINGS.json /tmp/ASSETS /tmp/NEW.json');
const assets=path.resolve(assetsArg),output=path.resolve(projectArg);
if(!assets.startsWith('/tmp/')||!output.startsWith('/tmp/')||path.extname(output)!=='.json')
  fail('Only new temporary output paths are permitted');
if(fs.existsSync(output)||fs.existsSync(output+'.microfilm-qa.json'))
  fail('Never overwrite an existing file');
const source=JSON.parse(fs.readFileSync(path.resolve(timingArg),'utf8'));
if(source.voice_generated_with_ai!==true||source.voice_approved_for_publication!==false||
   source.voice_id!==take.voice_id||source.model_weights_sha256!==take.model_weights_sha256||
   source.sample_rate!==24000||!Array.isArray(source.segments)||
   source.segments.length!==take.segments.length)fail('Unapproved NASA pilot voice provenance mismatch');
for(let i=0;i<take.segments.length;i++){
  if(source.segments[i].text!==take.segments[i].text||
     source.segments[i].scene!==take.segments[i].scene||
     source.segments[i].index!==i)fail('Source spoken text or phrase order modified');
}
const master=path.join(path.dirname(path.resolve(timingArg)),source.audio_master);
if(shaFile(master)!==source.audio_sha256)fail('Narration master SHA256 does not match verified original');
const [first,second]=source.segments;
if(first.start_frame!==0||!Number.isInteger(first.end_frame)||
   !Number.isInteger(second.start_frame)||!Number.isInteger(second.end_frame)||
   second.start_frame<=first.end_frame)fail('Genuine PCM phrase timings are missing');
const totalFrames=second.end_frame+10;
if(totalFrames<240||totalFrames>360)fail('Do not force speech speed to fit 8–12 seconds');
const rehook1=Math.round(first.end_frame*.60); // editorial camera change, NOT a word timestamp
const rehook2=second.start_frame; // measured phrase onset
if(rehook1<38||rehook1>110||rehook2-rehook1<38||totalFrames-rehook2<115)
  fail('The genuine voice timing cannot support three readable acts with the existing templates');
for(const entry of sources.assets){
  if(!fs.existsSync(path.join(assets,entry.file))||shaFile(path.join(assets,entry.file))!==entry.sha256)
    fail('Pinned original NASA asset missing or modified: '+entry.file);
}
const annotated=sources.assets.find(x=>x.file==='impact-annotations.jpg');
if(!annotated||annotated.media_type!=='annotated_visualization'||annotated.is_impact_observation!==false)
  fail('Annotated image cannot be presented as photographed impact');
const audio='microfilm-original-nasa-same-script.wav',sfx='microfilm-original-editorial-transition.wav';
const audioFile=path.join(assets,audio),sfxFile=path.join(assets,sfx);
if(fs.existsSync(audioFile)||fs.existsSync(sfxFile))fail('Refuse to overwrite media');
let createdAudio=false,createdSfx=false;
try{
  const duration=(totalFrames/30).toFixed(6),fadeStart=Math.max(0,totalFrames/30-.25).toFixed(6);
  execFileSync('ffmpeg',['-hide_banner','-nostdin','-loglevel','error','-y',
    '-i',master,'-af','atrim=start=0:end='+duration+',asetpts=PTS-STARTPTS,afade=t=out:st='+fadeStart+':d=0.22',
    '-ar','24000','-ac','1','-c:a','pcm_s16le',audioFile],{timeout:35000});
  createdAudio=true;
  // Original short non-diegetic transition, NOT an astronaut impact recording.
  execFileSync('ffmpeg',['-hide_banner','-nostdin','-loglevel','error','-y',
    '-f','lavfi','-i','anoisesrc=color=pink:duration=0.45:amplitude=0.055:sample_rate=48000',
    '-af','highpass=f=310,lowpass=f=2300,afade=t=in:st=0:d=0.035,afade=t=out:st=0.25:d=0.20',
    '-ac','1','-c:a','pcm_s16le',sfxFile],{timeout:35000});
  createdSfx=true;
  const overlap=6;
  const shots=[
    {id:'reported-flashes',durationFrames:rehook1+overlap,template:'kinetic',titleTreatment:'cyan-slab',
      title:'5 ÉCLAIRS\nSIGNALÉS',titleFrameZero:true,eyebrow:'OBSERVATIONS DE L’ÉQUIPAGE',
      subtitle:'Sur la face cachée de la Lune',footnote:'NASA · équipage Artemis II · avril 2026',
      media:{kind:'image',file:'lunar-orientale.jpg',credit:'NASA original art002e009627 — not an impact photo'},
      focus:{x:.43,y:.45},motion:'push',transitionAfter:'dissolve',transitionFrames:overlap},
    {id:'farside-rehook',durationFrames:rehook2-rehook1+overlap,template:'documentary',
      title:'DERRIÈRE\nLA LUNE',eyebrow:'ARTEMIS II · IMAGE AUTHENTIQUE',
      subtitle:'Survol de la face cachée',footnote:'NASA · Earthset art002e009288',
      media:{kind:'image',file:'earthset.jpg',credit:'NASA / Artemis II crew — true Earthset photograph'},
      focus:{x:.5,y:.52},motion:'drift',transitionAfter:'dissolve',transitionFrames:overlap},
    {id:'nasa-report-rehook',durationFrames:totalFrames-rehook2,template:'document_focus',
      title:'LE RAPPORT\nDE LA NASA',eyebrow:'ANNOTATIONS · VISUALISATION SCIENTIFIQUE',
      subtitle:'Image annotée, pas une vidéo des impacts',
      media:{kind:'image',file:'impact-annotations.jpg',
        credit:'NASA / CSA art002e016252 — astronaut annotations on a SIMULATION'},
      documentRegion:{x:.13,y:.12,width:.74,height:.65},
      motion:'locked',transitionAfter:'cut',transitionFrames:0}
  ];
  const project={
    schema_version:'worldvision-creative-project-v1',
    id:'wv-nasa-artemis2-microfilm-internal-20261121',
    title:'Artemis II — test interne de trois relances audiovisuelles',
    script:take.segments.slice(0,2).map(s=>s.text).join(' '),
    fps:30,aspect_ratio:'9:16',
    style:{background:'#061522',ink:'#ffffff',accent:'#08dedb'},
    shots,
    voice:{file:audio,label:'Kokoro ff_siwis NASA — AUDITION INTERNE NON APPROUVÉE',volume:1},
    music:null,outro:null,
    captions:[first,second].map((segment,index)=>({
      startFrame:segment.start_frame,endFrame:segment.end_frame,
      text:take.segments[index].text,position:'upper'
    })),
    soundCues:[
      {file:sfx,startFrame:rehook1,durationFrames:13,volume:.24,
       label:'Original editorial transition, NOT recorded NASA impact'},
      {file:sfx,startFrame:rehook2,durationFrames:13,volume:.18,
       label:'Original editorial reveal, NOT recorded NASA impact'}
    ]
  };
  const inspected=inspectProject(project);
  if(!inspected.ok||inspected.frames!==totalFrames)
    fail('Existing Remotion project validator refused storyboard: '+JSON.stringify(inspected.errors));
  const QA={
    kind:'WORLDVISION_NASA_MICROFILM_NOT_FOR_PUBLICATION',
    status:'INTERNAL_ARTISTIC_REVIEW_REQUIRED',
    original_script_sha256:sha(project.script),
    original_narration_sha256:source.audio_sha256,
    excerpt_audio_sha256:shaFile(audioFile),
    short_original_sfx_sha256:shaFile(sfxFile),
    source_photos:sources.assets.map(s=>({file:s.file,sha256:s.sha256,kind:s.media_type,
       source_url:s.source_page,public_rights_approved:false})),
    source_report_url:sources.report,
    spoken_text_preserved_exactly:true,
    timed_to:'PCM phrase boundary for second rehook; first rehook editorial (NOT ASR word timing)',
    genuine_phrase_frames:[first.start_frame,first.end_frame,second.start_frame,second.end_frame],
    visual_beats:{opening:0,rehook_one:rehook1,rehook_two:rehook2,end:totalFrames},
    total_frames:totalFrames,voice_approved:false,publication_approved:false,
    quality_approval:'PENDING human listening and actual 390px inspection',
    visual_ethics:'NASA astronaut annotations are on a SIMULATION; no impact photo or sound is fabricated'
  };
  fs.writeFileSync(output,JSON.stringify(project,null,2)+'\n',{flag:'wx'});
  fs.writeFileSync(output+'.microfilm-qa.json',JSON.stringify(QA,null,2)+'\n',{flag:'wx'});
  console.log(JSON.stringify({status:QA.status,frames:totalFrames,
    seconds:totalFrames/30,beats:QA.visual_beats},null,2));
}catch(error){
  if(createdAudio)fs.rmSync(audioFile,{force:true});
  if(createdSfx)fs.rmSync(sfxFile,{force:true});
  throw error;
}
