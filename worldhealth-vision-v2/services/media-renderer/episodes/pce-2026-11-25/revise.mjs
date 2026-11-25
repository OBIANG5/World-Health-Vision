import fs from 'node:fs';
import {inspectProject} from '../../creative/validate-project.mjs';
const file='output/pce-2026-11-25/project.json';
const p=JSON.parse(fs.readFileSync(file,'utf8'));
const final=p.shots.at(-1), spokenEnd=p.wordCaptions.at(-1).endFrame;
const total=p.shots.reduce((sum,s)=>sum+s.durationFrames,0);
const closingStart=Math.max(spokenEnd+8,total-55), closeFrames=total-closingStart;
if(closeFrames<45)throw Error('Insufficient silent tail for official visual signature');
final.durationFrames-=closeFrames;
p.shots.push({id:'worldvision-signature',template:'kinetic',durationFrames:closeFrames,title:'WORLD-VISION',subtitle:'Voir le monde, le comprendre',eyebrow:'',motion:'locked',transitionAfter:'cut',transitionFrames:0});
// Keep every original voice cue, source image, factual value and motion. The duplicate subtitle is
// omitted on the first photo because the title and synced voice already say it.
p.shots[0].subtitle='';
p.shots[1].subtitle='';
p.shots[2].subtitle='Hausse des taux anticipée, pas encore décidée.';
const check=inspectProject(p);
if(!check.ok)throw Error(JSON.stringify(check.errors));
fs.writeFileSync(file,JSON.stringify(p,null,2));
console.log('Same timeline '+check.frames+' frames, same source audio; silent signature and safe captions.');
