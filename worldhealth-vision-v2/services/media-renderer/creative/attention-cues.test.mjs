import test from 'node:test';
import assert from 'node:assert/strict';
import {attentionCueIssues} from './attention-cues.mjs';

const project=()=>({
  script:'VOIR LE MONDE. COMPRENDRE CE QUI COMPTE.',
  wordCaptions:[
    {text:'VOIR',startFrame:0,endFrame:10,emphasis:true},
    {text:'LE',startFrame:10,endFrame:18},
    {text:'MONDE.',startFrame:18,endFrame:33,emphasis:true},
  ],
  soundCues:[
    {file:'sfx/reveal.wav',startFrame:18,durationFrames:9,volume:.3,label:'Original reveal SFX'},
  ]
});
const reasons=p=>attentionCueIssues(p,120).map(e=>e.field);

test('semantic words and short SFX are accepted without changing script or voice',()=>{
  const p=project(),before=JSON.stringify(p);
  assert.deepEqual(attentionCueIssues(p,120),[]);
  assert.equal(JSON.stringify(p),before);
});
test('word alignments must be exact, nonoverlapping, ordered and inside film',()=>{
  const p=project();
  p.wordCaptions[1].startFrame=9;
  assert.ok(reasons(p).includes('wordCaptions[1].time'));
  p.wordCaptions[1].startFrame=10;
  p.wordCaptions[2].endFrame=125;
  assert.ok(reasons(p).includes('wordCaptions[2].time'));
  p.wordCaptions[2].endFrame=33;
  p.wordCaptions[0].text='<script>';
  assert.ok(reasons(p).includes('wordCaptions[0].text'));
  p.wordCaptions[0].text='TWO WORDS';
  assert.ok(reasons(p).includes('wordCaptions[0].text'));
});
test('SFX need licensed local path, safe volume and precise source frames',()=>{
  const p=project();
  p.soundCues[0].file='../private.mp3';
  assert.ok(reasons(p).includes('soundCues[0].file'));
  p.soundCues[0].file='sfx/reveal.wav';
  p.soundCues[0].volume=1.2;
  assert.ok(reasons(p).includes('soundCues[0].volume'));
  p.soundCues[0].volume=.3;
  p.soundCues[0].durationFrames=500;
  assert.ok(reasons(p).includes('soundCues[0].time'));
  p.soundCues[0].durationFrames=9;
  p.soundCues[0].startFrame=116;
  assert.ok(reasons(p).includes('soundCues[0].time'));
});
test('legacy projects remain valid and unsafe cue arrays fail closed',()=>{
  assert.deepEqual(attentionCueIssues({script:'One unchanged script'},120),[]);
  assert.ok(reasons({...project(),wordCaptions:'not-an-array'}).includes('wordCaptions'));
  assert.ok(reasons({...project(),soundCues:new Array(81).fill({})}).includes('soundCues'));
});
