import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {
  OWNER_VOICE_PROFILE,OWNER_VOICE_MANIFEST_VERSION,verifyOwnerReviewVoice
} from './owner-review-voice-gate.mjs';
const here=path.dirname(fileURLToPath(import.meta.url));
const sha=b=>createHash('sha256').update(b).digest('hex');
function setup(){
  const dir=fs.mkdtempSync(path.join(os.tmpdir(),'wv-c52-gate-'));
  const assets=path.join(dir,'assets');
  fs.mkdirSync(path.join(assets,'audio'),{recursive:true});
  // Synthetic bytes are a UNIT TEST only: do not represent a real Vivienne voice.
  const bytes=Buffer.from('SYNTHETIC TEST CONTENT, NOT A REAL NARRATION');
  fs.writeFileSync(path.join(assets,'audio','original-take.mp3'),bytes);
  const project={
    id:'story-20261121-test',
    script:'Test de narration pour cette actualité seulement.',
    voice:{file:'audio/original-take.mp3',label:'Vivienne C5.2 Impact média',volume:1}
  };
  const m={
    schema_version:OWNER_VOICE_MANIFEST_VERSION,
    project_id:project.id,
    voice_profile_id:OWNER_VOICE_PROFILE.profile_id,
    provider_voice_id:OWNER_VOICE_PROFILE.voice_provider_id,
    speaking_rate:OWNER_VOICE_PROFILE.speaking_rate,
    script_sha256:sha(Buffer.from(project.script,'utf8')),
    voice_file:project.voice.file,
    voice_sha256:sha(bytes),
    recording_scope:'new_take_for_this_exact_script',
    human_listening:'pending_owner_review',
    publication_authorized:false,
    rights_status:'not_yet_verified'
  };
  const manifestPath=path.join(dir,'manifest.json');
  const check=(value=m,story=project)=>{
    fs.writeFileSync(manifestPath,JSON.stringify(value));
    return verifyOwnerReviewVoice({project:story,assetsRoot:assets,manifestPath});
  };
  return {dir,assets,project,m,manifestPath,check,
    dispose:()=>fs.rmSync(dir,{recursive:true,force:true})};
}
function run(f){
  const q=setup();
  try{f(q);}finally{q.dispose();}
}
test('C5.2 owner reference is exact: never confuse with historic +11 or C5.1',()=>{
  assert.equal(OWNER_VOICE_PROFILE.profile_id,'vivienne-c5-2-impact-media');
  assert.equal(OWNER_VOICE_PROFILE.voice_provider_id,'fr-FR-VivienneMultilingualNeural');
  assert.equal(OWNER_VOICE_PROFILE.speaking_rate,'+8%');
  assert.equal(OWNER_VOICE_PROFILE.reference_duration_seconds,14.088);
  assert.ok(OWNER_VOICE_PROFILE.reference_audio.includes('c5_broadcast-review-only.mp3'));
});
test('matching take bytes + exact story script still mean owner review, NOT publication',()=>run(q=>{
  const report=q.check();
  assert.equal(report.purpose,'owner_audiovisual_review_not_publication');
  assert.equal(report.profile_id,OWNER_VOICE_PROFILE.profile_id);
  assert.equal(report.publication_authorized,false);
  assert.equal(report.commercial_rights_verified,false);
  assert.equal(report.actual_spoken_words_verified,false);
  assert.equal(report.pronunciation_and_naturalness_review,'owner_listening_required');
  assert.equal(report.narration_audio_sha256,q.m.voice_sha256);
}));
test('no voice is never silently replaced with Kokoro or old narration',()=>run(q=>{
  const p=structuredClone(q.project);
  p.voice=null;
  assert.throws(()=>q.check(q.m,p),/narration audio is missing/);
}));
test('Kokoro, C5.1 and old faster Vivienne are all rejected',()=>run(q=>{
  for(const field of [
    {voice_profile_id:'kokoro-ff-siwis'},
    {voice_profile_id:'vivienne-c5-1-linked'},
    {provider_voice_id:'fr-FR-RemyMultilingualNeural'},
    {speaking_rate:'+11%'},
    {speaking_rate:'+7%'}
  ]){
    assert.throws(()=>q.check({...q.m,...field}),/selected Vivienne C5\.2/);
  }
}));
test('different news story or changed script immediately invalidates original take lock',()=>run(q=>{
  assert.throws(()=>q.check({...q.m,project_id:'another-episode'}),/another story/);
  const p=structuredClone(q.project);
  p.script+=' Des mots qui changent les faits.';
  assert.throws(()=>q.check(q.m,p),/script differs/);
  p.script=q.project.script;
  p.voice.file='audio/other.mp3';
  assert.throws(()=>q.check(q.m,p),/wrong narration file/);
}));
test('real source audio hash must match manifest, never relabel an unrelated MP3',()=>run(q=>{
  assert.throws(()=>q.check({...q.m,voice_sha256:'0'.repeat(64)}),/source audio bytes differ/);
  assert.throws(()=>q.check({...q.m,voice_sha256:'123'}),/SHA256 is required/);
  fs.writeFileSync(path.join(q.assets,'audio','original-take.mp3'),'TAMPERED AUDIO');
  assert.throws(()=>q.check(),/source audio bytes differ/);
}));
test('historical audition cannot be passed off as a new take for this script',()=>run(q=>{
  assert.throws(()=>q.check({...q.m,recording_scope:'historic_14s_reference'}),/REFERENCE/);
  assert.throws(()=>q.check({...q.m,recording_scope:false}),/REFERENCE/);
}));
test('voice approval and publication rights are not inferred by passing the hash',()=>run(q=>{
  assert.throws(()=>q.check({...q.m,human_listening:'final_approved'}),/not been approved/);
  assert.throws(()=>q.check({...q.m,publication_authorized:true}),/NOT a publishing authorization/);
  assert.throws(()=>q.check({...q.m,rights_status:'verified'}),/NOT a publishing authorization/);
}));
test('unknown metadata and unsafe/symlink audio paths fail closed',()=>run(q=>{
  assert.throws(()=>q.check({...q.m,emergency_alt_voice:'Kokoro'}),/unknown or unsafe/);
  const p=structuredClone(q.project);
  p.voice.file='../outside.mp3';
  assert.throws(()=>q.check({...q.m,voice_file:p.voice.file},p),/unsafe\/missing/);
  const external=path.join(q.dir,'external.mp3');
  fs.writeFileSync(external,'SECRET TEST DATA');
  fs.symlinkSync(external,path.join(q.assets,'audio','link.mp3'));
  p.voice.file='audio/link.mp3';
  assert.throws(()=>q.check({...q.m,voice_file:p.voice.file},p),/unsafe\/missing/);
}));
test('malformed manifest, old schema and non-absolute manifest are rejected',()=>run(q=>{
  assert.throws(()=>q.check({...q.m,schema_version:'old'}),/version mismatch/);
  fs.writeFileSync(q.manifestPath,'{invalid');
  assert.throws(()=>verifyOwnerReviewVoice({project:q.project,assetsRoot:q.assets,manifestPath:q.manifestPath}),/malformed/);
  assert.throws(()=>verifyOwnerReviewVoice({project:q.project,assetsRoot:q.assets,manifestPath:'relative.json'}),/absolute path/);
}));
test('renderer owner-review CLI refuses technical no-voice project BEFORE rendering',()=>run(q=>{
  const project=JSON.parse(fs.readFileSync(path.join(here,'project.example.json'),'utf8'));
  const projectPath=path.join(q.dir,'project.json');
  const out=path.join(q.dir,'never-render.mp4');
  fs.writeFileSync(projectPath,JSON.stringify(project));
  q.check();
  const x=spawnSync(process.execPath,[
    path.join(here,'render-project.mjs'),'--project',projectPath,
    '--assets',q.assets,'--output',out,
    '--owner-review-voice-manifest',q.manifestPath
  ],{encoding:'utf8',timeout:20000});
  assert.equal(x.status,1,x.stdout+'\n'+x.stderr);
  assert.match(x.stderr,/owner-review voice blocked: narration audio is missing/);
  assert.equal(fs.existsSync(out),false);
}));
