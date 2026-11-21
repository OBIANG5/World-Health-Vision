import test from 'node:test';
import assert from 'node:assert/strict';
import {importWordTiming, scriptWords} from './word-alignment-import.mjs';

const script = "VOIR LE MONDE. Comprendre l'idée, et l'OTAN.";
const timed = [
  ['voir', 0, 450], ['le', 450, 630], ['monde', 630, 1200],
  ['comprendre', 1250, 1900], ["l'idée", 1900, 2300], ['et', 2350, 2500], ["l'otan", 2500, 3050],
].map(([text,startMs,endMs]) => ({text,startMs,endMs,timestampMs:(startMs+endMs)/2,confidence:null}));
const args = () => ({script,captions:structuredClone(timed),durationFrames:120,emphasis:['VOIR','MONDE',"l'OTAN"]});

test('script exact, punctuation, case and accents retained while timing is imported',()=>{
  const a=args(),before=JSON.stringify(a);
  const {wordCaptions,report}=importWordTiming(a);
  assert.equal(JSON.stringify(a),before,'No silent edits to user materials');
  assert.deepEqual(scriptWords(script),['VOIR','LE','MONDE.','Comprendre',"l'idée,",'et',"l'OTAN."]);
  assert.equal(wordCaptions[2].text,'MONDE.');
  assert.equal(wordCaptions[0].startFrame,0);
  assert.equal(wordCaptions.at(-1).endFrame,92);
  assert.equal(wordCaptions.filter(w=>w.emphasis).length,3);
  assert.equal(report.source_script_unchanged,true);
  assert.equal(report.human_audio_visual_review,'required_before_publication');
});
test('missing, invented or swapped transcript word fails closed',()=>{
  const a=args(); a.captions[2].text='mondeux';
  assert.throws(()=>importWordTiming(a),/mismatch at spoken word 3/);
  const b=args(); b.captions.pop();
  assert.throws(()=>importWordTiming(b),/word count mismatch/);
  const c=args(); c.captions[3].text='OTAN';
  assert.throws(()=>importWordTiming(c),/mismatch at spoken word 4/);
});
test('invalid or word-crossing timestamps never get guessed or stretched',()=>{
  const a=args(); a.captions[2].startMs=600;
  assert.throws(()=>importWordTiming(a),/collapses\/overlaps/);
  const b=args(); b.captions[0].endMs=5;
  assert.throws(()=>importWordTiming(b),/collapses\/overlaps/);
  const c=args(); c.captions.at(-1).endMs=5000;
  assert.throws(()=>importWordTiming(c),/collapses\/overlaps/);
});
test('real source offset can be explicit but not inferred',()=>{
  const {wordCaptions}=importWordTiming({...args(),offsetFrames:9});
  assert.equal(wordCaptions[0].startFrame,9);
  assert.equal(wordCaptions[0].endFrame,23);
});
test('unapproved emphasis or unsupported frame profiles cannot silently pass',()=>{
  assert.throws(()=>importWordTiming({...args(),emphasis:['UNSPOKEN']}),/emphasis word not in approved/);
  assert.throws(()=>importWordTiming({...args(),fps:25}),/30 fps/);
  assert.throws(()=>importWordTiming({...args(),durationFrames:60}),/collapses\/overlaps/);
});
