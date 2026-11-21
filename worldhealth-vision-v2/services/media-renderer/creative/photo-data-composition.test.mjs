import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {photoComparisonIssues,photoComparisonPose} from '../src/photo-comparison-motion.mjs';
import {inspectProject} from './validate-project.mjs';
import {parseStudioProject,studioShotToEditor} from './studio-project-io.mjs';
const sample=JSON.parse(fs.readFileSync(new URL('./project.example.json',import.meta.url),'utf8'));
const copy=()=>structuredClone(sample);
const comparison=()=>({
  title:'Évolution comparée',
  first:{label:'Pays A',value:-6.5},
  second:{label:'Pays B',value:13.4},
  domain:{min:-10,max:20},
  unit:'%',precision:1,locale:'fr-FR',
  source:{publisher:'Institution test',dataset:'Données fictives à ne pas publier',
    asOf:'2026-11-20',url:'https://example.org/data'},
  startFrame:38,endFrame:124
});
function validPhotoProject(){
  const p=copy(),s=p.shots[1];
  s.template='photo_story';s.title='COMPARER SANS TRICHER';
  s.subtitle='Deux chiffres issus d’une source explicitement donnée';
  s.durationFrames=165;s.media={kind:'image',file:'original-photo.jpg',credit:'Droits de test'};
  s.photo={
    camera:{zoomFrom:1.05,zoomTo:1.12,panX:10,panY:-8,startFrame:0,endFrame:130},
    mask:{axis:'horizontal',startFrame:12,endFrame:85},
    focus:{x:.50,y:.42,radius:72,startFrame:32,endFrame:100},
    comparison:comparison()
  };
  return p;
}
const issues=c=>photoComparisonIssues(c,165).map(x=>x.field);
test('PHOTO×DATA: signed bars share the ONE zero baseline and original values',()=>{
  const c=comparison();
  assert.deepEqual(issues(c),[]);
  const start=photoComparisonPose(c,12),end=photoComparisonPose(c,124);
  assert.equal(start.reveal,0);
  assert.equal(end.reveal,1);
  assert.equal(end.origin,1/3);
  assert.equal(end.bars[0].direction,'negative');
  assert.equal(end.bars[1].direction,'positive');
  assert.ok(end.bars[0].start<end.origin&&end.bars[0].end===end.origin);
  assert.ok(end.bars[1].end>end.origin&&end.bars[1].start===end.origin);
  assert.equal(end.bars[0].value,-6.5);assert.equal(end.bars[1].value,13.4);
});
test('PHOTO×DATA: reveal animates WIDTH, never fabricates changing statistics',()=>{
  const c=comparison();
  const frames=[38,50,64,91,124].map(f=>photoComparisonPose(c,f));
  assert.ok(frames.every(f=>f.bars[0].value===c.first.value&&
    f.bars[1].value===c.second.value));
  assert.ok(frames.every((f,i)=>i===0||f.bars[1].width>=frames[i-1].bars[1].width));
  assert.ok(frames.every((f,i)=>i===0||f.bars[0].width>=frames[i-1].bars[0].width));
});
test('PHOTO×DATA: one-sided and zero values retain honest geometry',()=>{
  const c=comparison();c.domain={min:0,max:100};
  c.first.value=0;c.second.value=60;
  assert.deepEqual(issues(c),[]);
  const pose=photoComparisonPose(c,124);
  assert.equal(pose.origin,0);
  assert.equal(pose.bars[0].width,0);
  assert.equal(pose.bars[0].direction,'zero');
  assert.equal(pose.bars[1].width,.6);
});
test('PHOTO×DATA: never truncate domain excluding zero, including negative-only values',()=>{
  for(const domain of [{min:3,max:20},{min:-20,max:-2},{min:5,max:5},{min:50,max:-20}]){
    const c=comparison();c.domain=domain;
    assert.ok(issues(c).includes('domain'));
  }
});
test('PHOTO×DATA: reject unsourced numbers, fake dates, unsafe URL',()=>{
  const c=comparison();
  for(const patch of [
    {publisher:''},{dataset:''},{asOf:'2026-02-30'},
    {url:'http://example.com/data'},{url:'javascript:alert(1)'},
    {asOf:'2026-11-31'}
  ]){
    c.source={...comparison().source,...patch};
    assert.ok(issues(c).includes('source'),JSON.stringify(patch));
  }
});
test('PHOTO×DATA: cannot silently display unsupported values or ambiguous units',()=>{
  const c=comparison();c.second.value=22;
  assert.ok(issues(c).includes('second.value'));
  c.second.value=13;c.first.value=Infinity;
  assert.ok(issues(c).includes('first'));
  c.first.value=-6.5;c.unit='';
  assert.ok(issues(c).includes('unit'));
  c.unit='%';c.precision=5;
  assert.ok(issues(c).includes('precision'));
});
test('PHOTO×DATA: storyboard beat time must be within shot, never auto-generated',()=>{
  const c=comparison();c.startFrame=150;c.endFrame=190;
  assert.ok(issues(c).includes('time'));
  c.startFrame=20;c.endFrame=36;
  assert.ok(issues(c).includes('time'));
  c.startFrame=38;c.endFrame=124;
  assert.deepEqual(issues(c),[]);
});
test('PHOTO×DATA: labels cannot be duplicated or silently injected',()=>{
  const c=comparison();c.second.label='  pays a ';
  assert.ok(issues(c).includes('labels'));
  c.second.label='Pays B';c.title='<script>fake</script>';
  assert.ok(issues(c).includes('title'));
});
test('PHOTO×DATA: full source project validator accepts sourced simultaneous layers',()=>{
  const p=validPhotoProject();
  const result=inspectProject(p);
  assert.equal(result.ok,true,JSON.stringify(result.errors));
  assert.equal(p.shots[1].photo.mask.axis,'horizontal');
  assert.equal(p.shots[1].photo.comparison.first.value,-6.5);
  assert.equal(p.shots[1].media.file,'original-photo.jpg');
});
test('PHOTO×DATA: count and comparison cannot cover the same mobile region',()=>{
  const p=validPhotoProject();
  p.shots[1].photo.metric={label:'UN CHIFFRE',value:12,unit:'%',precision:0,
    sourceLabel:'Fictif',startFrame:65,endFrame:121};
  assert.ok(inspectProject(p).errors.some(x=>x.field==='shots[1].photo.comparison'));
});
test('PHOTO×DATA: Studio import preserves independent motions, both values and source',()=>{
  const p=validPhotoProject();
  const imported=parseStudioProject(JSON.stringify(p));
  const editable=studioShotToEditor(imported.shots[1],{
    photoSettings:{
      camera:{zoomFrom:1.05,zoomTo:1.12,panX:0,panY:0,startFrame:0,endFrame:120},
      subject:{dx:0,dy:0,scale:0,startFrame:0,endFrame:100},
      mask:{axis:'horizontal',startFrame:0,endFrame:60},
      focus:{x:.5,y:.5,radius:70,startFrame:40,endFrame:100},
      metric:{label:'',value:0,unit:'',precision:0,sourceLabel:'',startFrame:60,endFrame:110},
      comparison:comparison()
    }
  });
  assert.equal(editable.photoUseComparison,true);
  assert.equal(editable.photoUseMetric,false);
  assert.deepEqual(editable.photoSettings.comparison,p.shots[1].photo.comparison);
  assert.deepEqual(editable.photoSettings.mask,p.shots[1].photo.mask);
  assert.equal(imported.script,p.script);
});
test('PHOTO×DATA: Studio rejects hidden or malformed extra source fields',()=>{
  const p=validPhotoProject();
  p.shots[1].photo.comparison.source.secretAPIKey='do-not-accept';
  assert.throws(()=>parseStudioProject(JSON.stringify(p)),/champ non pris en charge/);
  delete p.shots[1].photo.comparison.source.secretAPIKey;
  p.shots[1].photo.comparison.domain.min=4;
  assert.throws(()=>parseStudioProject(JSON.stringify(p)),/projet non importable/i);
});
