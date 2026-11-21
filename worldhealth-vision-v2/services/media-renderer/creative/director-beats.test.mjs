import test from 'node:test';
import assert from 'node:assert/strict';
import {directorBeatIssues} from './director-beats.mjs';

const source=()=>({
  script:'Un fait nouveau change la lecture du dossier. Voici sa preuve et la conséquence.',
  shots:[
    {id:'premier-plan',durationFrames:150,template:'document_focus',transitionAfter:'dissolve',transitionFrames:10},
    {id:'second-plan',durationFrames:120,template:'photo_story',transitionAfter:'cut',transitionFrames:0}
  ],
  directorBeats:[
    {id:'beat-hook',shotId:'premier-plan',startFrame:0,endFrame:76,intent:'hook',
      idea:'Le premier élément surprend.',
      spokenExcerpt:'Un fait nouveau change la lecture du dossier.',
      proofNote:'Document original daté, à vérifier humainement.',
      visualDirection:'Zoom original sur le passage, une preuve lisible à la fois.',
      audioDirection:'Faire entrer la narration, sans faux son documentaire.'},
    {id:'beat-rehook',shotId:'second-plan',startFrame:150,endFrame:225,intent:'rehook',
      idea:'Une seconde information change le sens.',
      spokenExcerpt:'Voici sa preuve et la conséquence.',
      proofNote:'Photo authentique et date/attribution exigées.',
      visualDirection:'PHOTO et métrique authentifiée dans le même plan.',
      audioDirection:'Accent bref licencié, si fourni.'}
  ]
});
const issues=p=>directorBeatIssues(p,260).map(e=>e.field);

test('preserves original frame clock over dissolved shots and the authored script',()=>{
  const p=source(),before=JSON.stringify(p);
  assert.deepEqual(directorBeatIssues(p,260),[]);
  assert.equal(JSON.stringify(p),before);
});
test('rejects invented or stale narration, but allows an explicitly silent visual beat',()=>{
  const p=source();
  p.directorBeats[0].spokenExcerpt='Un autre script non validé.';
  assert.ok(issues(p).includes('directorBeats[0].spokenExcerpt'));
  p.directorBeats[0].spokenExcerpt='';
  assert.deepEqual(directorBeatIssues(p,260),[]);
});
test('rejects invalid intent, fake provenance, missing director idea or motion',()=>{
  const p=source();p.directorBeats[1].intent='flash-box';
  assert.ok(issues(p).includes('directorBeats[1].intent'));
  p.directorBeats[1].intent='rehook';p.directorBeats[1].proofNote='';
  assert.ok(issues(p).includes('directorBeats[1].proofNote'));
  p.directorBeats[1].proofNote='Source à vérifier';p.directorBeats[1].visualDirection='';
  assert.ok(issues(p).includes('directorBeats[1].visualDirection'));
  p.directorBeats[1].visualDirection='Scène réelle';p.directorBeats[0].idea='';
  assert.ok(issues(p).includes('directorBeats[0].idea'));
});
test('forbids overlaps and times outside the selected shot, including transitions',()=>{
  const p=source();
  p.directorBeats[1].startFrame=139;
  assert.deepEqual(issues(p),['directorBeats[1].time']);
  p.directorBeats[1].startFrame=74;
  assert.ok(issues(p).includes('directorBeats[1].startFrame'));
  p.directorBeats[1].startFrame=150;p.directorBeats[1].endFrame=261;
  assert.ok(issues(p).includes('directorBeats[1].time'));
  p.directorBeats[1].endFrame=225;p.directorBeats[1].shotId='unknown';
  assert.ok(issues(p).includes('directorBeats[1].shotId'));
});
test('fails closed on unsupported fields, IDs, controls and invalid timeline',()=>{
  const p=source();p.directorBeats[0].scriptOverride='misinformation';
  assert.ok(issues(p).includes('directorBeats[0].scriptOverride'));
  delete p.directorBeats[0].scriptOverride;
  p.directorBeats[1].id=p.directorBeats[0].id;
  assert.ok(issues(p).includes('directorBeats[1].id'));
  p.directorBeats=new Array(121).fill({});
  assert.ok(issues(p).includes('directorBeats'));
  p.directorBeats=source().directorBeats;
  p.shots=[];
  assert.ok(issues(p).includes('directorBeats'));
  assert.deepEqual(directorBeatIssues({shots:source().shots,script:source().script},260),[]);
});
