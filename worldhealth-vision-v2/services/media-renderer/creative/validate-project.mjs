/**
 * World-Vision creative project v1 — user materials in, deterministic edit out.
 * No AI scripted news, no fixed narrator, no mandatory RADAR or GDELT.
 * Validation is technical; editorial/source and commercial rights remain human.
 */
import path from "node:path";
import fs from "node:fs";

export const FORMAT = "worldvision-creative-project-v1";
const TEMPLATES = new Set(["documentary","kinetic","evidence","number","clean_video"]);
const TRANSITIONS = new Set(["cut","dissolve","slide"]);
const MOTIONS = new Set(["locked","dolly","drift","push"]);
const IMAGE_EXT = new Set([".png",".jpg",".jpeg",".webp"]);
const VIDEO_EXT = new Set([".mp4",".mov",".webm"]);
const AUDIO_EXT = new Set([".wav",".mp3",".m4a",".aac",".flac"]);
const SLUG = /^[a-zA-Z0-9][a-zA-Z0-9_-]{2,79}$/;
const COLOR = /^#[0-9a-fA-F]{6}$/;

function bad(errors,field,reason){errors.push({field,reason});}
function boundedInteger(value,min,max){return Number.isInteger(value)&&value>=min&&value<=max;}
function isText(value,max=800){return typeof value==="string"&&value.length<=max;}
function isLocalPath(value){
  if(typeof value!=="string"||!value||value.includes("\0")||value.includes("\\"))return false;
  if(value.startsWith("/")||value.startsWith("//")||/^[a-z]+:/i.test(value))return false;
  const parts=value.split("/");
  return !parts.includes("..")&&!parts.includes(".")&&parts.every(Boolean);
}
export function durationFrames(project){
  if(!Array.isArray(project?.shots))return 0;
  let total=0;
  for(let i=0;i<project.shots.length;i++){
    const scene=project.shots[i];
    total+=scene.durationFrames||0;
    if(i<project.shots.length-1&&["dissolve","slide"].includes(scene.transitionAfter))
      total-=scene.transitionFrames||0;
  }
  total+=project.outro?.durationFrames||0;
  return total;
}
export function inspectProject(project) {
  const errors=[];
  if(!project||typeof project!=="object"||Array.isArray(project)){
    return {ok:false,errors:[{field:"project",reason:"Expected JSON object."}]};
  }
  if(project.schema_version!==FORMAT)bad(errors,"schema_version","Unknown project format.");
  if(!SLUG.test(project.id||""))bad(errors,"id","Use a stable 3-80 character slug.");
  if(!isText(project.title,180)||!project.title.trim())bad(errors,"title","Project title required.");
  if(!isText(project.script,50000)||!project.script.trim())bad(errors,"script","Provide your script; this tool never writes or rewrites it.");
  if(project.fps!==30||project.aspect_ratio!=="9:16")bad(errors,"video","Initial delivery profile is 1080x1920/30fps.");
  if(!Array.isArray(project.shots)||!project.shots.length||project.shots.length>80){
    bad(errors,"shots","Include between 1 and 80 explicitly directed shots.");
  }
  const seen=new Set();
  for(const [i,scene] of (Array.isArray(project.shots)?project.shots:[]).entries()){
    const p="shots["+i+"]";
    if(!scene||typeof scene!=="object"){bad(errors,p,"Shot must be an object.");continue;}
    if(!SLUG.test(scene.id||"")||seen.has(scene.id))bad(errors,p+".id","Unique shot slug required.");
    seen.add(scene.id);
    if(!TEMPLATES.has(scene.template))bad(errors,p+".template","Unknown template.");
    if(!boundedInteger(scene.durationFrames,1,3600))bad(errors,p+".durationFrames","1-3600 frames required.");
    if(scene.motion!==undefined&&!MOTIONS.has(scene.motion))bad(errors,p+".motion","Unknown motion profile.");
    if(scene.transitionAfter!==undefined&&!TRANSITIONS.has(scene.transitionAfter))bad(errors,p+".transitionAfter","Unknown transition.");
    const t=scene.transitionFrames??0;
    if(!boundedInteger(t,0,18))bad(errors,p+".transitionFrames","Only deliberate 0-18 frame transitions.");
    if(i===project.shots.length-1&&t>0)bad(errors,p+".transitionFrames","Final shot cannot transition into an absent shot.");
    if(t>0&&!["dissolve","slide"].includes(scene.transitionAfter))bad(errors,p+".transitionFrames","Transition frames require dissolve or slide.");
    if(i<project.shots.length-1&&scene.transitionAfter!=="cut"&&t>0&&
       (t>=scene.durationFrames||t>=project.shots[i+1]?.durationFrames))
      bad(errors,p+".transitionFrames","Transition must be shorter than both adjacent shots.");
    if(scene.focus&&(typeof scene.focus.x!=="number"||typeof scene.focus.y!=="number"||
       scene.focus.x<0||scene.focus.x>1||scene.focus.y<0||scene.focus.y>1))
      bad(errors,p+".focus","Focus must be normalized x,y 0-1.");
    for(const k of ["title","subtitle","eyebrow","footnote"]){
      if(scene[k]!==undefined&&!isText(scene[k],k==="title"?150:500))bad(errors,p+"."+k,"Invalid or excessive overlay text.");
    }
    if(scene.accent!==undefined&&!COLOR.test(scene.accent))bad(errors,p+".accent","Use six-digit hex color.");
    const needsMedia=["documentary","evidence","clean_video"].includes(scene.template);
    if(needsMedia&&!scene.media)bad(errors,p+".media","This composition requires your real source image/clip; no fake fallback.");
    if(scene.media){
      const media=scene.media;
      if(!["image","video"].includes(media.kind)||!isLocalPath(media.file))
        bad(errors,p+".media","Specify a local image/video file under the asset directory.");
      else{
        const ext=path.extname(media.file).toLowerCase();
        if(!(media.kind==="image"?IMAGE_EXT:VIDEO_EXT).has(ext))
          bad(errors,p+".media.file","Unsupported image/video extension.");
      }
      if(media.trimBefore!==undefined&&(!boundedInteger(media.trimBefore,0,30000)||media.kind!=="video"))
        bad(errors,p+".media.trimBefore","Only video supports trimBefore frames.");
    }
  }
  for(const [label,track] of [["voice",project.voice],["music",project.music]]){
    if(track!=null){
      if(!isLocalPath(track.file)||!AUDIO_EXT.has(path.extname(track.file).toLowerCase()))
        bad(errors,label+".file","Provide a local, externally prepared audio file.");
      if(track.volume!==undefined&&(typeof track.volume!=="number"||track.volume<0||track.volume>2))
        bad(errors,label+".volume","Volume outside 0-2.");
    }
  }
  if(project.outro!=null){
    if(!isLocalPath(project.outro.file)||!VIDEO_EXT.has(path.extname(project.outro.file).toLowerCase()))
      bad(errors,"outro.file","Provide the ORIGINAL end-card video, not a generated logo.");
    if(!boundedInteger(project.outro.durationFrames,1,600))
      bad(errors,"outro.durationFrames","Outro duration should be 1-600 frames.");
  }
  if(project.style!=null){
    for(const k of ["accent","background","ink"])
      if(project.style[k]!=null&&!COLOR.test(project.style[k]))bad(errors,"style."+k,"Use six-digit hex color.");
  }
  if(durationFrames(project)>18000)bad(errors,"duration","This profile is limited to 10 minutes; use a long-form workflow for longer films.");
  return {ok:errors.length===0,errors,frames:durationFrames(project)};
}
export function resolveLocalFile(assetRoot,relativePath) {
  if(!isLocalPath(relativePath))throw new Error("Unsafe asset path: "+relativePath);
  const root=fs.realpathSync(assetRoot);
  const target=fs.realpathSync(path.join(root,relativePath));
  if(!target.startsWith(root+path.sep))throw new Error("Asset escapes selected folder: "+relativePath);
  if(!fs.statSync(target).isFile())throw new Error("Asset must be a file: "+relativePath);
  return target;
}
