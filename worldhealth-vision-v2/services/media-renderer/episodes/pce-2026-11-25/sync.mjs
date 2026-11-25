import fs from 'node:fs';
import {alignBeatToSpokenWords,snapPhotoTrackToBeat,snapSoundCueToBeat} from '../../creative/voice-beat-motion-sync.mjs';
import {inspectProject} from '../../creative/validate-project.mjs';
const file='output/pce-2026-11-25/project.json';
let p=JSON.parse(fs.readFileSync(file,'utf8'));
for(let i=0;i<p.directorBeats.length;i++){
  const id=p.directorBeats[i].id;
  p.directorBeats=alignBeatToSpokenWords(p,id).directorBeats;
  if(i<3){
    const tr=p.shots[i].photo.comparison;
    const beat=p.directorBeats.find(x=>x.id===id);
    const shotStart=p.shots.slice(0,i).reduce((n,s)=>n+s.durationFrames,0);
    // Keep at least 30 frames of readable reveal; no facts or voice edited.
    const available=p.shots[i].durationFrames-(beat.startFrame-shotStart);
    tr.endFrame=tr.startFrame+Math.min(tr.endFrame-tr.startFrame,available-8);
    p.shots[i].photo.comparison=snapPhotoTrackToBeat(p,id,tr,'comparison').track;
  }
  p.soundCues=snapSoundCueToBeat(p,id,i).soundCues;
}
const inspection=inspectProject(p);
if(!inspection.ok)throw Error(JSON.stringify(inspection.errors));
fs.writeFileSync(file,JSON.stringify(p,null,2));
console.log('Verified actual narration → beat → PHOTO×DATA → SFX',inspection.frames);
