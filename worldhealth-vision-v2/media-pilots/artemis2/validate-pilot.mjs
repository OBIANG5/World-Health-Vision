#!/usr/bin/env node
/**
 * Validate that every editorial shot in the pilot derives from an explicitly
 * identified NASA original or contains only authored typography. Fail closed.
 */
import fs from "node:fs";
import path from "node:path";
import {fileURLToPath} from "node:url";
import {inspectProject,durationFrames} from "../../services/media-renderer/creative/validate-project.mjs";
const root=path.dirname(fileURLToPath(import.meta.url));
export function reviewPilot(){
  const project=JSON.parse(fs.readFileSync(path.join(root,"project.json"),"utf8"));
  const sources=JSON.parse(fs.readFileSync(path.join(root,"sources.json"),"utf8"));
  const errors=[];
  const checks=inspectProject(project);
  if(!checks.ok)errors.push(...checks.errors.map(x=>x.field+": "+x.reason));
  if(project.id!=="wv-artemis2-impact-report-2026-11-20-v01"||
     sources.publication_approved!==false||
     sources.latest_source_date!=="2026-11-17")errors.push("Approved editorial version mismatch.");
  if(project.shots.length!==4||durationFrames(project)<600||durationFrames(project)>1000)
    errors.push("Storyboard requires 4 authentic scenes and a 20-33s internal edit.");
  if(project.voice!==null||project.music!==null||project.captions?.length)
    errors.push("This pre-voice review must not masquerade as a synced narrated master.");
  if(!project.script.includes("17 novembre 2026")||!project.script.includes("6 avril")||
     !project.script.includes("cinq éclairs")||
     !project.script.toLowerCase().includes("visualisation"))
    errors.push("Narration draft must keep new report date, April observation and diagram disclosure.");
  const referenced=new Map();
  for(const asset of sources.assets){
    if(referenced.has(asset.file))errors.push("Duplicate source filename.");
    referenced.set(asset.file,asset);
    if(!asset.original_url.startsWith("https://images-assets.nasa.gov/image/")||
      !asset.original_url.endsWith("/"+asset.id+"~orig.jpg")||
      asset.rights_review!=="OPEN"||asset.is_impact_observation!==false)
      errors.push("Unverified media source or invented filmed impact: "+asset.file);
  }
  for(const shot of project.shots){
    if(!shot.media?.file||!referenced.has(shot.media.file))
      errors.push("Shot missing sourced real NASA image: "+shot.id);
    if(shot.media?.credit!==referenced.get(shot.media.file)?.source_credit)
      errors.push("Source credit differs from signed asset manifest: "+shot.id);
    if(!["documentary","focus_reveal","document_focus"].includes(shot.template))
      errors.push("Forbidden invented-data or unnecessary transition grammar: "+shot.id);
  }
  if(project.shots[2].template!=="document_focus"||
     project.shots[2].media.file!=="impact-annotations.jpg"||
     !project.shots[2].subtitle.includes("PAS une photo des impacts"))
    errors.push("Annotated visualization must be visibly disclosed as not a true image of impact.");
  if(project.shots.some(x=>x.template==="data_story"||x.template==="geo_story"))
    errors.push("The Moon event cannot be dressed with invented Earth GIS/data charts.");
  return {ok:errors.length===0,errors,frames:durationFrames(project),sources:sources.assets.map(x=>x.id),publication_allowed:false};
}
if(process.argv[1]&&fileURLToPath(import.meta.url)===path.resolve(process.argv[1])){
  const result=reviewPilot();
  process.stdout.write(JSON.stringify(result,null,2)+"\n");
  if(!result.ok)process.exitCode=1;
}
