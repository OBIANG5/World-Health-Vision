/**
 * World-Vision FILM-2: deterministic time-aligned captions.
 *
 * Text and timings are supplied/approved by the editor, never inferred.
 * The same integer-frame cues are used by Remotion Player and exported MP4.
 * SRT is an interchange format, NOT proof that an ASR alignment is correct.
 */
export const CAPTION_FPS=30;
const TIME=/^(\d{2}):(\d{2}):(\d{2})[,.](\d{3})$/;
const STAMP=/^(\d{2}:\d{2}:\d{2}[,.]\d{3})\s+-->\s+(\d{2}:\d{2}:\d{2}[,.]\d{3})(?:\s+.*)?$/;
const POSITIONS=new Set(["upper","lower"]);
const error=(field,reason)=>({field,reason});
function msOf(time){
  const m=TIME.exec(time);
  if(!m||Number(m[2])>59||Number(m[3])>59)throw Error("Horodatage SRT invalide : "+time);
  return ((Number(m[1])*60+Number(m[2]))*60+Number(m[3]))*1000+Number(m[4]);
}
export function parseSrtCaptions(input,{fps=CAPTION_FPS,position="lower"}={}){
  if(typeof input!=="string"||input.length>150000)throw Error("Fichier SRT absent ou trop volumineux.");
  if(fps!==CAPTION_FPS)throw Error("Profil World-Vision : 30 images/seconde.");
  if(!POSITIONS.has(position))throw Error("Position des sous-titres inconnue.");
  const normalized=input.replace(/^\uFEFF/,"").replace(/\r\n?/g,"\n").trim();
  if(!normalized)return [];
  const blocks=normalized.split(/\n\s*\n/);
  if(blocks.length>1200)throw Error("SRT trop long : plus de 1200 blocs.");
  const result=[];
  for(const [index,block] of blocks.entries()){
    const lines=block.split("\n").map(x=>x.trim());
    if(/^\d+$/.test(lines[0]))lines.shift();
    const timing=STAMP.exec(lines.shift()||"");
    if(!timing)throw Error("SRT bloc "+(index+1)+" : minutage absent ou invalide.");
    const startMs=msOf(timing[1]),endMs=msOf(timing[2]);
    const text=lines.join(" ").replace(/\s+/g," ").trim();
    const startFrame=Math.round(startMs*fps/1000);
    const endFrame=Math.round(endMs*fps/1000);
    const cue={startFrame,endFrame,text,position};
    const problems=captionCueIssues([cue],Infinity);
    if(problems.length)throw Error("SRT bloc "+(index+1)+" : "+problems[0].reason);
    if(result.length&&startFrame<result[result.length-1].endFrame)
      throw Error("SRT bloc "+(index+1)+" : deux sous-titres se chevauchent ou sont désordonnés.");
    result.push(cue);
  }
  return result;
}
export function captionCueIssues(cues,totalFrames){
  if(cues===undefined||cues===null)return [];
  if(!Array.isArray(cues)||cues.length>1200)return [error("captions","Provide 0-1200 explicit timed caption cues.")];
  const issues=[];
  let previousEnd=0;
  for(const [index,cue] of cues.entries()){
    const field="captions["+index+"]";
    if(!cue||typeof cue!=="object"||Array.isArray(cue)){
      issues.push(error(field,"Caption cue must be an object."));continue;
    }
    const {startFrame,endFrame,text,position="lower"}=cue;
    if(!Number.isInteger(startFrame)||!Number.isInteger(endFrame)||startFrame<0||
      endFrame<=startFrame||endFrame-startFrame<5||endFrame-startFrame>300||
      endFrame>totalFrames)
      issues.push(error(field+".time","Cue must be 5-300 frames long and inside the narrated film."));
    if(index>0&&startFrame<previousEnd)issues.push(error(field+".time","Caption cues overlap or are not in chronological order."));
    if(typeof text!=="string"||!text.trim()||text.length>130||
      /[\u0000-\u0008\u000B-\u001F\u007F]/.test(text)||/<[^>]*>/.test(text))
      issues.push(error(field+".text","Use authored plain text (1-130 characters), no tags or control characters."));
    if(!POSITIONS.has(position))issues.push(error(field+".position","Use upper or lower mobile-safe caption placement."));
    if(Number.isInteger(endFrame))previousEnd=endFrame;
  }
  return issues;
}
export function activeCaption(cues,frame){
  if(!Array.isArray(cues))return null;
  return cues.find(c=>frame>=c.startFrame&&frame<c.endFrame)??null;
}
