import test from 'node:test';
import assert from 'node:assert/strict';
import {reviewFrameRange, REVIEW_CONTEXT_FRAMES} from './review-range.mjs';

const fullFilm = Object.freeze({
  script: 'Un texte préalablement validé — sans réécriture.',
  captions: [{startFrame:140,endFrame:170,text:'LE FAIT — DONNÉ PAR LE JOURNALISTE'}],
  voice: {file:'reference-approved.wav'},
  music: {file:'original-soundbed.wav'},
  outro: {file:'logo-original.mp4', durationFrames:90},
  shots: [
    {id:'geo-intro',durationFrames:150,transitionAfter:'dissolve',transitionFrames:10},
    {id:'photo-rehook',durationFrames:165,transitionAfter:'slide',transitionFrames:10},
    {id:'data-reveal',durationFrames:140,transitionAfter:'cut',transitionFrames:0},
  ],
});

test('review shot preserves the original global frame clock through both transitions', () => {
  const r=reviewFrameRange(fullFilm,'photo-rehook');
  assert.deepEqual(r.selectedShotSourceFrames,[140,304]);
  assert.deepEqual(r.frameRange,[125,319]);
  assert.equal(r.durationFrames,195);
  assert.deepEqual(r.actualContextFrames,[15,15]);
  assert.equal(r.sourceContentFrames,435);
  assert.equal(REVIEW_CONTEXT_FRAMES,15);
});

test('intro and closing ranges clip the context; brand outro never leaks into a shot review', () => {
  const first=reviewFrameRange(fullFilm,'geo-intro');
  assert.deepEqual(first.frameRange,[0,164]);
  assert.deepEqual(first.actualContextFrames,[0,15]);
  const last=reviewFrameRange(fullFilm,'data-reveal');
  assert.deepEqual(last.selectedShotSourceFrames,[295,434]);
  assert.deepEqual(last.frameRange,[280,434]);
  assert.deepEqual(last.actualContextFrames,[15,0]);
  assert.equal(last.durationFrames,155);
});

test('no context uses exactly the selected shot including overlapped frames', () => {
  assert.deepEqual(reviewFrameRange(fullFilm,'photo-rehook',0).frameRange,[140,304]);
});

test('review is non destructive for approved script, source audio, captions and media', () => {
  const before=JSON.stringify(fullFilm);
  reviewFrameRange(fullFilm,'photo-rehook');
  assert.equal(JSON.stringify(fullFilm),before);
});

test('unknown shots and abusive context fail closed', () => {
  assert.throws(()=>reviewFrameRange(fullFilm,'not-a-shot'),/not found/);
  assert.throws(()=>reviewFrameRange(fullFilm,''),/required/);
  assert.throws(()=>reviewFrameRange(fullFilm,'photo-rehook',200),/between 0 and 90/);
  assert.throws(()=>reviewFrameRange(fullFilm,'photo-rehook',0.5),/between 0 and 90/);
  assert.throws(()=>reviewFrameRange({},'x'),/Timeline requires/);
});
