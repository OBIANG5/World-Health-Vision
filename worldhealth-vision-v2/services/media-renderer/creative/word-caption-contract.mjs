/**
 * Pure, isomorphic Studio contract for EXTERNALLY ALIGNED spoken words.
 * Does not transcribe or infer acoustic times. Same frame clock as Remotion.
 * Unlike the CLI import tool, it contains no node:crypto/path dependency,
 * so a project can be reopened and edited safely in a browser.
 */
import {attentionCueIssues} from './attention-cues.mjs';

const issue=(field,reason)=>({field,reason});
const isObject=value=>value!==null&&typeof value==='object'&&!Array.isArray(value);
const allowed=new Set(['text','startFrame','endFrame','emphasis']);
export const approvedScriptWords=script=>{
  if(typeof script!=='string'||!script.trim())return [];
  return script.split(/\s+/u).filter(word=>/[\p{L}\p{N}]/u.test(word));
};

/** Validate exact transcription and timestamp bounds before exposing kinetic captions. */
export function wordCaptionIssues(project,narratedFrames){
  const words=project?.wordCaptions;
  if(words==null||Array.isArray(words)&&words.length===0)return [];
  if(!Array.isArray(words)||words.length>1200)
    return [issue('wordCaptions','Use at most 1200 original externally aligned spoken words.')];
  const problems=[];
  if(!project?.voice?.file||typeof project.voice.file!=='string')
    problems.push(issue('wordCaptions.voice','A selected voice source is required for real word alignment.'));
  if(Array.isArray(project?.captions)&&project.captions.length>0)
    problems.push(issue('wordCaptions.captions','Use either word alignment or SRT; never silently overlay both.'));
  const source=approvedScriptWords(project.script);
  if(source.length!==words.length)
    problems.push(issue('wordCaptions.script','Aligned word count differs from the approved unedited script.'));
  for(let i=0;i<words.length;i++){
    const word=words[i];
    if(!isObject(word)){problems.push(issue('wordCaptions['+i+']','Expected an aligned word object.'));continue;}
    for(const field of Object.keys(word))
      if(!allowed.has(field))problems.push(issue('wordCaptions['+i+'].'+field,'Unknown word field cannot be preserved safely.'));
    if(word.text!==source[i])
      problems.push(issue('wordCaptions['+i+'].text','Word differs from exact approved script, including case and punctuation.'));
  }
  problems.push(...attentionCueIssues({wordCaptions:words},narratedFrames));
  return problems;
}
