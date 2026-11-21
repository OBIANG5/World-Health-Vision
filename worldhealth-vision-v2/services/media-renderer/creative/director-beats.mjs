/**
 * Editorial HookBeatSheet embedded in worldvision-creative-project-v1.
 *
 * This is editor-authored direction, NOT machine-generated news, voice alignment
 * or automatic Remotion effects. Time always uses the original full-film frames.
 * A visual/audio direction is an instruction, never a claim that an effect ran.
 */
import {buildEditorialTimeline} from './editorial-timeline.mjs';

export const DIRECTOR_INTENTS=Object.freeze(['hook','explain','rehook','reveal','impact','payoff']);
const intents=new Set(DIRECTOR_INTENTS);
const slug=/^[a-zA-Z0-9][a-zA-Z0-9_-]{2,79}$/;
const issue=(field,reason)=>({field,reason});
const plain=(v)=>v!==null&&typeof v==='object'&&!Array.isArray(v);
const cleanText=(v,max,required=false)=>
  typeof v==='string'&&v.length<=max&&(!required||v.trim().length>0)&&
  !/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/u.test(v);
const allowedKeys=new Set(['id','shotId','startFrame','endFrame','intent',
  'idea','spokenExcerpt','proofNote','visualDirection','audioDirection']);
/**
 * @returns {{field:string,reason:string}[]} Precise validation errors.
 */
export function directorBeatIssues(project,narratedFrames){
  const beats=project?.directorBeats;
  if(beats==null)return [];
  if(!Array.isArray(beats)||beats.length>120)
    return [issue('directorBeats','Director sheet must be 0–120 authored beats.')];
  const errors=[];
  if(!Number.isInteger(narratedFrames)||narratedFrames<1||narratedFrames>18000)
    return [issue('directorBeats','Invalid source film frame clock.')];
  let timeline;
  try{timeline=buildEditorialTimeline(project.shots);}
  catch{
    return [issue('directorBeats','Cannot place beats until the storyboard timeline is valid.')];
  }
  const byId=new Map(timeline.shots.map(s=>[s.id,s]));
  const seen=new Set();
  let prevEnd=0;
  beats.forEach((beat,index)=>{
    const root='directorBeats['+index+']';
    if(!plain(beat)){errors.push(issue(root,'Beat must be a plain object.'));return;}
    for(const key of Object.keys(beat))
      if(!allowedKeys.has(key))errors.push(issue(root+'.'+key,'Unsupported beat field (no silent loss).'));
    if(typeof beat.id!=='string'||!slug.test(beat.id)||seen.has(beat.id))
      errors.push(issue(root+'.id','Use a unique stable 3–80 character ID.'));
    else seen.add(beat.id);
    const shot=byId.get(beat.shotId);
    if(!shot)errors.push(issue(root+'.shotId','Attach the beat to an existing source shot.'));
    if(!Number.isInteger(beat.startFrame)||!Number.isInteger(beat.endFrame)||
      beat.startFrame<0||beat.endFrame-beat.startFrame<6||
      beat.endFrame>narratedFrames)
      errors.push(issue(root+'.time','Use a 6+ frame interval inside the original narrated film.'));
    else {
      if(beat.startFrame<prevEnd)
        errors.push(issue(root+'.startFrame','Beats must be ordered and cannot compete on the same time range.'));
      prevEnd=beat.endFrame;
      if(shot&&(beat.startFrame<shot.startFrame||beat.endFrame>shot.endFrame))
        errors.push(issue(root+'.time','Beat must remain inside its selected shot, even across transitions.'));
    }
    if(!intents.has(beat.intent))
      errors.push(issue(root+'.intent','Choose hook/explain/rehook/reveal/impact/payoff.'));
    if(!cleanText(beat.idea,280,true))
      errors.push(issue(root+'.idea','Describe the new idea for the spectator (max 280 characters).'));
    if(!cleanText(beat.spokenExcerpt,420))
      errors.push(issue(root+'.spokenExcerpt','Use an exact speech excerpt or empty string for silence.'));
    else if(beat.spokenExcerpt.trim()&&!project.script?.includes(beat.spokenExcerpt))
      errors.push(issue(root+'.spokenExcerpt','Excerpt differs from the unchanged approved script.'));
    if(!cleanText(beat.proofNote,320))
      errors.push(issue(root+'.proofNote','Proof note must be a safe text string (max 320 characters).'));
    if(!cleanText(beat.visualDirection,400,true))
      errors.push(issue(root+'.visualDirection','Describe what the existing Remotion shot should show/move (max 400 characters).'));
    if(!cleanText(beat.audioDirection,240))
      errors.push(issue(root+'.audioDirection','Audio note must be a safe text string (max 240 characters).'));
    if(['rehook','reveal','impact'].includes(beat.intent)&&
      typeof beat.proofNote==='string'&&!beat.proofNote.trim())
      errors.push(issue(root+'.proofNote','A semantic reveal or consequence needs a factual proof/reference note.'));
  });
  return errors;
}
