import fs from 'node:fs';
import {createHash} from 'node:crypto';
import {inspectProject} from '../../creative/validate-project.mjs';
const dir='output/pce-2026-11-25',file=dir+'/project.json';
const p=JSON.parse(fs.readFileSync(file,'utf8'));
const original=JSON.parse(JSON.stringify(p));
const originalFrames=p.shots.reduce((a,s)=>a+s.durationFrames,0);
const hash=x=>createHash('sha256').update(x).digest('hex');
const voiceHash=hash(fs.readFileSync(dir+'/assets/'+p.voice.file));
const manifest=JSON.parse(fs.readFileSync(dir+'/voice-manifest.json','utf8'));
if(voiceHash!==manifest.voice_sha256||hash(p.script)!==manifest.script_sha256)throw Error('Source voice or exact script changed');
if(p.shots.length!==4||p.shots.slice(0,3).some(s=>!s.photo?.comparison))throw Error('Wrong source project');
const [hook,split,target,impact]=p.shots;
hook.photo.editorialLayout='hero';hook.subtitle='Inflation annuelle aux États-Unis';
hook.eyebrow='ÉTATS-UNIS · 25 NOV. 2026';
split.photo.editorialLayout='split';split.title='Payer plus. Acheter autant.';split.subtitle='';
target.photo.editorialLayout='target';target.title='La Fed sous pression';target.subtitle='Hausse des taux anticipée, pas décidée.';
target.eyebrow='POLITIQUE MONÉTAIRE';
for(const s of [hook,split,target]){
  if(s===hook)s.titleFrameZero=true; else delete s.titleFrameZero;
  const c=s.photo.comparison;
  if(c.domain.min!==0||[c.first,c.second].some(v=>v.value<0))throw Error('Unexpected nonpositive scale');
  // Preserve the actual word-synced V1 timing, not a regenerated cue.
}
impact.title='Des crédits\nplus chers ?';impact.subtitle='';impact.eyebrow='MÉNAGES ET ENTREPRISES';delete impact.titleTreatment;
delete impact.titleFrameZero;
const spokenEnd=p.wordCaptions.at(-1).endFrame;
const closingStart=Math.max(spokenEnd+8,originalFrames-55),tail=originalFrames-closingStart;
if(tail<45)throw Error('Insufficient silent tail');
impact.durationFrames-=tail;
p.shots.push({id:'neutral-end',template:'kinetic',durationFrames:tail,title:'WORLD-VISION',subtitle:'Voir le monde, le comprendre',motion:'locked',transitionAfter:'cut',transitionFrames:0});
// A wordmark is a text-only internal closing card, NOT a substitute official logo.
delete p.brandMark; p.style={background:'#15191b',ink:'#f5f2eb',accent:'#cc734d'};
p.music.volume=Math.min(p.music.volume,.12);
p.soundCues=p.soundCues.map(c=>({...c,volume:Math.min(c.volume,.16)}));
const same=(a,b)=>JSON.stringify(a)===JSON.stringify(b);
if(!same(p.wordCaptions,original.wordCaptions)||!same(p.directorBeats,original.directorBeats)||!same(p.voice,original.voice)||p.script!==original.script)throw Error('Exact timeline or voice altered');
for(let i=0;i<3;i++)if(!same(p.shots[i].photo.comparison,original.shots[i].photo.comparison)||!same(p.shots[i].media,original.shots[i].media))throw Error('Source evidence changed');
const check=inspectProject(p);
if(!check.ok||check.frames!==originalFrames)throw Error(JSON.stringify(check.errors));
fs.writeFileSync(dir+'/project-v3.json',JSON.stringify(p,null,2));
fs.writeFileSync(dir+'/v3-provenance.json',JSON.stringify({originalRun:45667257921,originalFrames,frames:check.frames,voiceSha256:voiceHash,scriptSha256:hash(p.script),wordCueCount:p.wordCaptions.length,logo:'not located; no graphic logo',publicationAuthorized:false},null,2));
console.log('V3 candidate: exact original voice, words, sources, frames preserved',check.frames);
