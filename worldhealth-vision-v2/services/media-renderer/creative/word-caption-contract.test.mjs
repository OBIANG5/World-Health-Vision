import test from 'node:test';
import assert from 'node:assert/strict';
import {approvedScriptWords,wordCaptionIssues} from './word-caption-contract.mjs';

const base=()=>({
  script:"VOIR LE MONDE. L'idée change.",
  voice:{file:"vivienne-exact-approved-take.wav"},
  wordCaptions:[
    {text:"VOIR",startFrame:0,endFrame:9,emphasis:true},
    {text:"LE",startFrame:9,endFrame:14,emphasis:false},
    {text:"MONDE.",startFrame:14,endFrame:28,emphasis:false},
    {text:"L'idée",startFrame:29,endFrame:47,emphasis:true},
    {text:"change.",startFrame:47,endFrame:63,emphasis:false}
  ]
});
const fields=p=>wordCaptionIssues(p,120).map(x=>x.field);
test("only externally aligned exact script words survive, without mutating voice or captions",()=>{
  const p=base(),before=JSON.stringify(p);
  assert.deepEqual(approvedScriptWords(p.script),
    ["VOIR","LE","MONDE.","L'idée","change."]);
  assert.deepEqual(wordCaptionIssues(p,120),[]);
  assert.equal(JSON.stringify(p),before);
});
test("cannot silently change narration, drop words, or switch the selected voice",()=>{
  const p=base();p.wordCaptions[2].text="monde";
  assert.ok(fields(p).includes("wordCaptions[2].text"));
  p.wordCaptions[2].text="MONDE.";
  p.wordCaptions.pop();
  assert.ok(fields(p).includes("wordCaptions.script"));
  p.wordCaptions=base().wordCaptions;p.voice=null;
  assert.ok(fields(p).includes("wordCaptions.voice"));
});
test("no SRT plus kinetic captions and no unknown imported metadata",()=>{
  const p=base();p.captions=[{startFrame:0,endFrame:50,text:"SRT"}];
  assert.ok(fields(p).includes("wordCaptions.captions"));
  delete p.captions;p.wordCaptions[0].unreviewedTextOverride="FAUX";
  assert.ok(fields(p).includes("wordCaptions[0].unreviewedTextOverride"));
});
test("word timestamps remain on original film, not shot-local synthetic zero",()=>{
  const p=base();p.wordCaptions[2].startFrame=13;
  assert.ok(fields(p).includes("wordCaptions[2].time"));
  p.wordCaptions[2].startFrame=14;p.wordCaptions[4].endFrame=121;
  assert.ok(fields(p).includes("wordCaptions[4].time"));
});
test("legacy projects and empty captions remain valid",()=>{
  assert.deepEqual(wordCaptionIssues({script:"Script",voice:null},120),[]);
  assert.deepEqual(wordCaptionIssues({script:"Script",wordCaptions:[]},120),[]);
});
