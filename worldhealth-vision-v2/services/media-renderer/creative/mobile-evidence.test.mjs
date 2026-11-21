import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {fileURLToPath} from 'node:url';
import {inspectProject} from './validate-project.mjs';
import {reviseShot} from './surgical-revision.mjs';

const root=path.dirname(fileURLToPath(import.meta.url));
const sample=JSON.parse(fs.readFileSync(path.join(root,'project.example.json'),'utf8'));
const sha=x=>createHash('sha256').update(x).digest('hex');
const base=()=>{
  const project=structuredClone(sample);
  const shot=project.shots[1];
  shot.template='document_focus';
  shot.durationFrames=140;
  shot.title='SOURCE OFFICIELLE';
  shot.subtitle='La preuve originale, pas une image générée';
  shot.media={kind:'image',file:'authentic-document.jpg',credit:'Original publisher, verified before release'};
  shot.documentRegion={x:.34,y:.31,width:.34,height:.43};
  shot.evidencePresentation='mobile-safe';
  shot.documentZoomMax=1.94;
  return project;
};
const errors=p=>inspectProject(p).errors.map(e=>e.field);

test('P0.6: mobile evidence frame is opt-in; original script and assets stay verbatim',()=>{
  const p=base();
  assert.equal(inspectProject(p).ok,true,JSON.stringify(inspectProject(p).errors));
  assert.equal(p.shots[1].media.file,'authentic-document.jpg');
  assert.equal(p.script,sample.script);
  const plain=structuredClone(p);
  delete plain.shots[1].evidencePresentation;
  delete plain.shots[1].documentZoomMax;
  assert.equal(inspectProject(plain).ok,true,'existing evidence remains backwards compatible');
});
test('P0.6: reject any zoom outside real-pixel limits and invalid placement on other scenes',()=>{
  const p=base();p.shots[1].documentZoomMax=2.251;
  assert.ok(errors(p).includes('shots[1].documentZoomMax'));
  p.shots[1].documentZoomMax=0.9;
  assert.ok(errors(p).includes('shots[1].documentZoomMax'));
  p.shots[1].documentZoomMax=NaN;
  assert.ok(errors(p).includes('shots[1].documentZoomMax'));
  p.shots[1].documentZoomMax=1.94;
  p.shots[1].evidencePresentation='unverified-mode';
  assert.ok(errors(p).includes('shots[1].evidencePresentation'));
  p.shots[1].evidencePresentation='mobile-safe';
  p.shots[1].template='documentary';
  assert.ok(errors(p).includes('shots[1].evidencePresentation'));
});
test('P0.6: published evidence screenshot region must be explicit and inside source',()=>{
  const p=base();
  p.shots[1].documentRegion={x:.9,y:.8,width:.34,height:.43};
  assert.ok(errors(p).includes('shots[1].documentRegion'));
  p.shots[1].documentRegion={x:.2,y:.2,width:.03,height:.43};
  assert.ok(errors(p).includes('shots[1].documentRegion'));
  p.shots[1].documentRegion={x:.2,y:.2,width:.34,height:.43};
  assert.equal(inspectProject(p).ok,true);
});
test('P0.6: editor-directed ROI/zoom revisions preserve script, voice, duration and neighboring shots',()=>{
  const source=base();
  const raw=JSON.stringify(source);
  const patch={
    schema_version:'worldvision-shot-revision-v1',
    source_project_sha256:sha(raw),
    shot_id:'plan-02',
    reason:'Human-directed enlarge the SOURCE evidence region without rewriting a single word',
    set:{
      documentZoomMax:2.05,
      documentRegion:{x:.31,y:.30,width:.30,height:.40}
    }
  };
  const {project,report}=reviseShot(source,patch,sha(raw));
  assert.equal(inspectProject(project).ok,true);
  assert.equal(project.shots[1].documentZoomMax,2.05);
  assert.deepEqual(project.shots[0],source.shots[0]);
  assert.equal(project.script,source.script);
  assert.deepEqual(project.voice,source.voice);
  assert.deepEqual(project.shots.map(x=>[x.durationFrames,x.transitionFrames,x.transitionAfter]),
    source.shots.map(x=>[x.durationFrames,x.transitionFrames,x.transitionAfter]));
  assert.ok(report.changed_fields.some(s=>s.includes('documentRegion')));
  assert.equal(report.human_audio_visual_review,'required_before_publication');
});
test('P0.6: surgical patch cannot enable an impossible zoom or mutate an unrelated shot',()=>{
  const p=base(),raw=JSON.stringify(p);
  const patch={
    schema_version:'worldvision-shot-revision-v1',source_project_sha256:sha(raw),
    shot_id:'plan-02',reason:'Attempt unsafe source image enlargement',
    set:{documentZoomMax:9}
  };
  const edited=reviseShot(p,patch,sha(raw)).project;
  assert.ok(errors(edited).includes('shots[1].documentZoomMax'),
    'the paired CLI must fail closed on post-patch inspectProject before writing');
  assert.equal(p.shots[1].documentZoomMax,1.94);
});
