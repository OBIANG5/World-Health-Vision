import test from 'node:test';
import assert from 'node:assert/strict';
import {alignBeatToSpokenWords,snapPhotoTrackToBeat,snapSoundCueToBeat} from './voice-beat-motion-sync.mjs';
import {photoComparisonPose} from '../src/photo-comparison-motion.mjs';

const fixture=()=>({
 script:'OUVERTURE DU DOSSIER. UNE PREUVE CHANGE TOUT.',
 voice:{file:'take-exactly-aligned.wav'},
 shots:[
  {id:'shot-open',template:'kinetic',durationFrames:90,transitionAfter:'dissolve',transitionFrames:10},
  {id:'shot-proof',template:'photo_story',durationFrames:180,transitionAfter:'cut',transitionFrames:0}
 ],
 wordCaptions:[
  {text:'OUVERTURE',startFrame:0,endFrame:20},
  {text:'DU',startFrame:20,endFrame:32},
  {text:'DOSSIER.',startFrame:32,endFrame:70},
  {text:'UNE',startFrame:91,endFrame:110},
  {text:'PREUVE',startFrame:111,endFrame:132,emphasis:true},
  {text:'CHANGE',startFrame:133,endFrame:148},
  {text:'TOUT.',startFrame:149,endFrame:170}
 ],
 directorBeats:[
  {id:'beat-hook',shotId:'shot-open',startFrame:0,endFrame:60,intent:'hook',
   idea:'A first verified element',spokenExcerpt:'OUVERTURE DU DOSSIER.',proofNote:'',
   visualDirection:'Show existing source',audioDirection:''},
  {id:'beat-rehook',shotId:'shot-proof',startFrame:119,endFrame:165,intent:'rehook',
   idea:'A new piece of evidence',spokenExcerpt:'PREUVE CHANGE',
   proofNote:'Approved photo and published figures',visualDirection:'Reveal factual comparison',
   audioDirection:'Use licensed accent if provided'}
 ],
 soundCues:[{file:'licensed-hit.wav',startFrame:180,durationFrames:10,volume:0.2,label:'Editorial approved cue'}]
});
const comparison=()=>({
 title:'Reported figures',first:{label:'A',value:12},second:{label:'B',value:18},
 domain:{min:0,max:20},unit:'%',precision:0,locale:'fr-FR',
 source:{publisher:'Publisher',dataset:'Documented data',asOf:'2026-11-22'},
 startFrame:40,endFrame:100
});
test('exactly aligns a re-hook to APPROVED words on the original overlapping film clock',()=>{
 const p=fixture(),before=JSON.stringify(p);
 const result=alignBeatToSpokenWords(p,'beat-rehook');
 assert.equal(result.sourceStartFrame,111);
 assert.equal(result.sourceEndFrame,148);
 assert.equal(result.wordStartIndex,4);
 assert.deepEqual(result.directorBeats[1].startFrame,111);
 assert.deepEqual(result.directorBeats[1].endFrame,148);
 assert.equal(JSON.stringify(p),before,'Never change user script, voice, beats or word alignment on input.');
});
test('fails on repeated phrase, stale exact text and invalid selected take',()=>{
 const p=fixture();p.directorBeats[1].spokenExcerpt='PREUVE';
 p.script='OUVERTURE DU DOSSIER. PREUVE PREUVE CHANGE TOUT.';
 p.wordCaptions.splice(3,0,{text:'PREUVE',startFrame:91,endFrame:109});
 p.wordCaptions[4].text='PREUVE';
 assert.throws(()=>alignBeatToSpokenWords(p,'beat-rehook'),/absente ou répétée/);
 const q=fixture();q.directorBeats[1].spokenExcerpt='autres mots';
 assert.throws(()=>alignBeatToSpokenWords(q,'beat-rehook'),/exacte/);
 const r=fixture();r.voice=null;
 assert.throws(()=>alignBeatToSpokenWords(r,'beat-rehook'),/voice/);
});
test('cannot silently move a hook onto another overlapping director beat',()=>{
 const p=fixture();p.directorBeats.push({
  ...p.directorBeats[1],id:'beat-other',startFrame:110,endFrame:128,
  spokenExcerpt:'',intent:'explain',proofNote:''
 });
 assert.throws(()=>alignBeatToSpokenWords(p,'beat-rehook'),/incompatible/);
});
test('existing sourced PHOTO comparison becomes a real plotted reveal at the voice moment',()=>{
 const p=fixture(),track=comparison(),original=structuredClone(track);
 const aligned=alignBeatToSpokenWords(p,'beat-rehook');
 const synced=snapPhotoTrackToBeat({...p,directorBeats:aligned.directorBeats},
   'beat-rehook',track,'comparison');
 assert.equal(synced.sourceStartFrame,111);
 assert.equal(synced.shotLocalStartFrame,31);
 assert.equal(synced.track.startFrame,31);
 assert.equal(synced.track.endFrame,91);
 assert.deepEqual(synced.track.source,original.source);
 assert.deepEqual(synced.track.first,original.first);
 assert.deepEqual(synced.track.second,original.second);
 assert.equal(photoComparisonPose(synced.track,30).reveal,0);
 assert.equal(photoComparisonPose(synced.track,91).reveal,1);
 assert.deepEqual(track,original);
});
test('a metric or photo focus is moved only when an existing track fits visibly',()=>{
 const p=fixture(),track={startFrame:20,endFrame:60,x:.3,y:.4,radius:80};
 const aligned=alignBeatToSpokenWords(p,'beat-rehook');
 const synced=snapPhotoTrackToBeat({...p,directorBeats:aligned.directorBeats},'beat-rehook',track,'focus');
 assert.deepEqual(synced.track,{...track,startFrame:31,endFrame:71});
 assert.throws(()=>snapPhotoTrackToBeat({...p,directorBeats:aligned.directorBeats},
   'beat-rehook',{startFrame:0,endFrame:165},'comparison'),/sans couper/);
 const entering=structuredClone(p);entering.directorBeats[1].startFrame=81;
 assert.throws(()=>snapPhotoTrackToBeat(entering,'beat-rehook',comparison(),'comparison'),/raccord/);
 assert.throws(()=>snapPhotoTrackToBeat(p,'beat-hook',comparison(),'comparison'),/PHOTO/);
});
test('an approved SFX moves to the actual hook without changing its source, length or volume',()=>{
 const p=fixture(),initial=JSON.stringify(p);
 const aligned=alignBeatToSpokenWords(p,'beat-rehook');
 const synced=snapSoundCueToBeat({...p,directorBeats:aligned.directorBeats},'beat-rehook',0);
 assert.deepEqual(synced.soundCues,[{...p.soundCues[0],startFrame:111}]);
 assert.equal(JSON.stringify(p),initial);
 assert.throws(()=>snapSoundCueToBeat(p,'beat-rehook',9),/importé/);
 const late=fixture();late.directorBeats[1].startFrame=258;
 assert.throws(()=>snapSoundCueToBeat(late,'beat-rehook',0),/tronquée/);
});
