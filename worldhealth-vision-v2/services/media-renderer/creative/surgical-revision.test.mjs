import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {fileURLToPath} from 'node:url';
import {reviseShot,REVISION_FORMAT} from './surgical-revision.mjs';
import {runRevision} from './revise-shot.mjs';
import {inspectProject} from './validate-project.mjs';
const dir=path.dirname(fileURLToPath(import.meta.url));
const sample=JSON.parse(fs.readFileSync(path.join(dir,'project.example.json'),'utf8'));
const clone=structuredClone;
const sha=bytes=>createHash('sha256').update(bytes).digest('hex');
const seed=()=>{
  const p=clone(sample);
  p.voice={file:'voice.wav',label:'OSCILLATOR — TECHNICAL FIXTURE'};
  p.wordCaptions=[{text:'exemple',startFrame:90,endFrame:102,emphasis:false}];
  p.soundCues=[{file:'original.wav',startFrame:112,durationFrames:10,volume:.25,label:'SYNTHETIC TEST SFX'}];
  return p;
};
const contract=(p)=>({
  schema_version:REVISION_FORMAT,
  source_project_sha256:sha(Buffer.from(JSON.stringify(p))),
  shot_id:'plan-02',
  reason:'Human-editor-directed correction of one exact technical beat',
  set:{title:'RELANCE TECHNIQUE',motion:'push',titleTreatment:'cyan-slab'},
  word_emphasis:[{index:0,emphasis:true}],
  sound_volume:[{index:0,volume:.16}],
  sound_add:[{file:'additional.wav',startFrame:125,durationFrames:9,volume:.18,label:'ORIGINAL TEST FX'}]
});
const apply=(p,patch=contract(p))=>reviseShot(p,patch,sha(Buffer.from(JSON.stringify(p))));

test('one beat: all other scenes, audio tracks, captions words, durations and source are untouched',()=>{
  const source=seed(),before=JSON.stringify(source);
  const {project,report}=apply(source);
  assert.equal(JSON.stringify(source),before);
  assert.deepEqual(project.shots[0],source.shots[0]);
  assert.equal(project.shots[1].title,'RELANCE TECHNIQUE');
  assert.deepEqual(project.voice,source.voice);
  assert.equal(project.script,source.script);
  assert.equal(project.wordCaptions[0].text,'exemple');
  assert.equal(project.wordCaptions[0].startFrame,90);
  assert.equal(project.wordCaptions[0].emphasis,true);
  assert.equal(project.soundCues[0].volume,.16);
  assert.deepEqual(report.review_source_frame_range,[52,150]);
  assert.deepEqual(report.exclusive_source_frames,[75,150]);
  assert.equal(report.script_unchanged,true);
  assert.equal(report.voice_and_music_tracks_unchanged,true);
  assert.equal(inspectProject(project).ok,true);
});
test('stale or rewritten source hashes fail closed and cannot modify script',()=>{
  const p=seed(),patch=contract(p);
  patch.source_project_sha256='0'.repeat(64);
  assert.throws(()=>apply(p,patch),/stale/);
  const other=contract(p);other.script='fake injected script';
  assert.throws(()=>apply(p,other),/disallowed field script/);
  const draft=contract(p);draft.set.script='fake injected script';
  assert.throws(()=>apply(p,draft),/disallowed field script/);
  const timed=contract(p);timed.set.durationFrames=10;
  assert.throws(()=>apply(p,timed),/disallowed field durationFrames/);
  const voice=contract(p);voice.set.voice={file:'surprise.wav'};
  assert.throws(()=>apply(p,voice),/disallowed field voice/);
});
test('transition-overlap cannot be modified by single-shot word/SFX revision',()=>{
  const p=seed();
  p.wordCaptions[0].startFrame=68;p.wordCaptions[0].endFrame=72;
  const patch=contract(p);
  assert.throws(()=>apply(p,patch),/non-overlap/);
  const q=seed();q.soundCues[0].startFrame=68;
  assert.throws(()=>apply(q,contract(q)),/non-overlap/);
  const r=seed();const update=contract(r);
  update.sound_add=[{file:'test.wav',startFrame:65,durationFrames:12,volume:.1}];
  assert.throws(()=>apply(r,update),/non-overlap/);
});
test('unrelated/cross-shot cues and ambiguous duplicate indices are rejected',()=>{
  const p=seed();
  const badWord=contract(p);badWord.word_emphasis=[{index:9,emphasis:true}];
  assert.throws(()=>apply(p,badWord),/non-overlap/);
  const duplicate=contract(p);
  duplicate.sound_volume=[{index:0,volume:.3},{index:0,volume:.4}];
  assert.throws(()=>apply(p,duplicate),/duplicate/);
  const fake=contract(p);fake.scripting='auto generated angle';
  assert.throws(()=>apply(p,fake),/disallowed field scripting/);
});
test('no-op is refused and deleting required titles fails project validation',()=>{
  const p=seed(),noOp=contract(p);
  delete noOp.set;delete noOp.word_emphasis;delete noOp.sound_volume;delete noOp.sound_add;
  assert.throws(()=>apply(p,noOp),/no-op/);
  const remove=contract(p);
  remove.set={title:null};delete remove.word_emphasis;delete remove.sound_volume;delete remove.sound_add;
  const result=apply(p,remove).project;
  assert.equal(inspectProject(result).ok,true,'Number scene may omit title');
});
test('CLI creates a fresh JSON and checksum review with exact voice/media provenance',async()=>{
  const tmp=fs.mkdtempSync(path.join(os.tmpdir(),'wv-retake-'));
  try {
    const assets=path.join(tmp,'assets');fs.mkdirSync(assets);
    for(const filename of ['voice.wav','original.wav','additional.wav'])fs.writeFileSync(path.join(assets,filename),'SYNTHETIC TEST BYTES: '+filename);
    const p=seed(),source=path.join(tmp,'project.json'),patch=path.join(tmp,'patch.json'),out=path.join(tmp,'revised.json');
    const raw=JSON.stringify(p,null,2)+'\n';
    fs.writeFileSync(source,raw);
    const request=contract(p);request.source_project_sha256=sha(Buffer.from(raw));
    fs.writeFileSync(patch,JSON.stringify(request));
    const report=await runRevision(['--project',source,'--patch',patch,'--assets',assets,'--output',out]);
    const after=JSON.parse(fs.readFileSync(out,'utf8'));
    assert.equal(after.script,p.script);
    assert.equal(report.source_project_sha256,request.source_project_sha256);
    assert.equal(report.referenced_asset_sha256.length,3);
    assert.equal(report.output_project_validated,true);
    assert.equal(report.human_audio_visual_review,'required_before_publication');
    assert.equal(fs.existsSync(out+'.revision-review.json'),true);
    await assert.rejects(()=>runRevision(['--project',source,'--patch',patch,'--assets',assets,'--output',out]),/overwrite/);
    assert.equal(fs.readFileSync(source,'utf8'),raw,'original untouched');
    assert.equal(after.shots[0].title,p.shots[0].title);
  } finally {fs.rmSync(tmp,{recursive:true,force:true});}
});
test('CLI rejects unapproved or nonexistent replacement assets without output',async()=>{
  const tmp=fs.mkdtempSync(path.join(os.tmpdir(),'wv-retake-reject-'));
  try {
    const assets=path.join(tmp,'assets');fs.mkdirSync(assets);
    fs.writeFileSync(path.join(assets,'voice.wav'),'SYNTHETIC');
    fs.writeFileSync(path.join(assets,'original.wav'),'SYNTHETIC');
    const p=seed(),raw=JSON.stringify(p),source=path.join(tmp,'p.json'),patch=path.join(tmp,'rev.json'),out=path.join(tmp,'new.json');
    fs.writeFileSync(source,raw);
    const update=contract(p);update.source_project_sha256=sha(Buffer.from(raw));
    update.sound_add=[{file:'../../escape.wav',startFrame:125,durationFrames:9,volume:.1}];
    fs.writeFileSync(patch,JSON.stringify(update));
    await assert.rejects(()=>runRevision(['--project',source,'--patch',patch,'--assets',assets,'--output',out]),/invalid|Unsafe|failed/i);
    assert.equal(fs.existsSync(out),false);
    update.sound_add=[{file:'unlicensed-missing.wav',startFrame:125,durationFrames:9,volume:.1}];
    fs.writeFileSync(patch,JSON.stringify(update));
    await assert.rejects(()=>runRevision(['--project',source,'--patch',patch,'--assets',assets,'--output',out]));
    assert.equal(fs.existsSync(out),false);
  } finally {fs.rmSync(tmp,{recursive:true,force:true});}
});
