#!/usr/bin/env node
/**
 * World-Vision Creative Edit — local files -> Remotion -> MP4.
 *
 * This is an ASSEMBLER, not an AI voice/video model or news researcher.
 * Media lives on disk, outside Git; no user files are committed.
 * Usage:
 * node creative/render-project.mjs --project /work/project.json \
 *     --assets /work/assets --output /work/export/master.mp4
 */
import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import {createHash,randomUUID} from "node:crypto";
import {fileURLToPath} from "node:url";
import {bundle} from "@remotion/bundler";
import {renderMedia,selectComposition} from "@remotion/renderer";
import {FORMAT,inspectProject,resolveLocalFile} from "./validate-project.mjs";

const rendererRoot=path.resolve(path.dirname(fileURLToPath(import.meta.url)),"..");
function args(argv){
  const o={};
  for(let i=0;i<argv.length;i+=2){
    const key=argv[i],value=argv[i+1];
    if(!["--project","--assets","--output"].includes(key)||!value||value.startsWith("--"))
      throw new Error("Usage: --project <JSON> --assets <directory> --output <master.mp4>");
    o[key]=value;
  }
  if(argv.length!==6||!o["--project"]||!o["--assets"]||!o["--output"])
    throw new Error("Missing --project, --assets or --output.");
  return o;
}
async function hashFile(file){
  const h=createHash("sha256");
  for await(const chunk of fs.createReadStream(file))h.update(chunk);
  return h.digest("hex");
}
async function run(argv){
  const cli=args(argv);
  const projectPath=path.resolve(cli["--project"]);
  const assetRoot=path.resolve(cli["--assets"]);
  const output=path.resolve(cli["--output"]);
  if(path.extname(output).toLowerCase()!==".mp4")throw new Error("Output must be an MP4.");
  const project=JSON.parse(fs.readFileSync(projectPath,"utf-8"));
  const inspection=inspectProject(project);
  if(!inspection.ok){
    process.stderr.write(JSON.stringify({status:"invalid_project",issues:inspection.errors},null,2)+"\n");
    return 2;
  }
  const publicRoot=path.join(rendererRoot,"public");
  const stagedRoot=path.join(publicRoot,"creative-import");
  fs.mkdirSync(stagedRoot,{recursive:true});
  const buildFolder="job-"+randomUUID();
  const staging=path.join(stagedRoot,buildFolder);
  fs.mkdirSync(staging,{recursive:true});
  const ledger=[];
  const cache=new Map();
  let tempBundle=null;
  async function stageFile(relative){
    if(cache.has(relative))return cache.get(relative);
    const source=resolveLocalFile(assetRoot,relative);
    const stat=fs.statSync(source);
    if(stat.size>2*1024*1024*1024)throw new Error("File exceeds 2 GiB: "+relative);
    const sha=await hashFile(source);
    const name=sha+path.extname(source).toLowerCase();
    const target=path.join(staging,name);
    if(!fs.existsSync(target))fs.copyFileSync(source,target);
    const src="creative-import/"+buildFolder+"/"+name;
    cache.set(relative,src);
    ledger.push({relative_path:relative,sha256:sha,size_bytes:stat.size,staged_as:src});
    return src;
  }
  try{
    const shots=[];
    for(const shot of project.shots){
      const media=shot.media?{
        kind:shot.media.kind,
        src:await stageFile(shot.media.file),
        trimBefore:shot.media.trimBefore??0,
        credit:shot.media.credit
      }:null;
      shots.push({
        id:shot.id,durationFrames:shot.durationFrames,template:shot.template,
        title:shot.title,subtitle:shot.subtitle,eyebrow:shot.eyebrow,
        footnote:shot.footnote,media,
        accent:shot.accent,motion:shot.motion,
        transitionAfter:shot.transitionAfter,transitionFrames:shot.transitionFrames,
        focus:shot.focus,
      });
    }
    const props={
      version:1,title:project.title,script:project.script,shots,
      narration:project.voice?{
        src:await stageFile(project.voice.file),
        volume:project.voice.volume??1,
        label:project.voice.label
      }:null,
      soundtrack:project.music?{
        src:await stageFile(project.music.file),
        volume:project.music.volume??.1,
        label:project.music.label
      }:null,
      brandOutro:project.outro?{
        src:await stageFile(project.outro.file),
        durationFrames:project.outro.durationFrames
      }:null,
      visualStyle:{
        background:project.style?.background??"#0b1721",
        ink:project.style?.ink??"#f6f8fa",
        accent:project.style?.accent??"#8bbecf",
      }
    };
    tempBundle=fs.mkdtempSync(path.join(os.tmpdir(),"worldvision-bundle-"));
    process.stdout.write("Bundling official Remotion engine...\n");
    const serveUrl=await bundle({
      entryPoint:path.join(rendererRoot,"src","index.ts"),
      publicDir:publicRoot,
      outDir:tempBundle,
    });
    const composition=await selectComposition({
      serveUrl,id:"WorldVisionCreativeEdit",inputProps:props
    });
    fs.mkdirSync(path.dirname(output),{recursive:true});
    process.stdout.write("Rendering "+inspection.frames+" frames with your supplied media...\n");
    await renderMedia({
      composition,serveUrl,inputProps:props,
      codec:"h264",audioCodec:"aac",outputLocation:output,
      pixelFormat:"yuv420p",crf:17,overwrite:true,
    });
    const sha=await hashFile(output);
    const report={
      schema_version:FORMAT,episode_id:project.id,
      source_script_sha256:createHash("sha256").update(project.script,"utf8").digest("hex"),
      exact_script_unchanged:true,
      output_path:output,output_sha256:sha,
      duration_frames:inspection.frames,canvas:{width:1080,height:1920,fps:30},
      track_voice:project.voice?.label??(project.voice?"externally_supplied":"no_narration"),
      media:ledger,
      warnings:["Tech render only. Not an AI quality guarantee, not editorial verification or publication approval."],
    };
    fs.writeFileSync(output+".report.json",JSON.stringify(report,null,2)+"\n");
    process.stdout.write(JSON.stringify(report,null,2)+"\n");
    return 0;
  }finally{
    fs.rmSync(staging,{recursive:true,force:true});
    if(tempBundle)fs.rmSync(tempBundle,{recursive:true,force:true});
  }
}
run(process.argv.slice(2)).then(n=>{process.exitCode=n;}).catch(e=>{
  process.stderr.write("Creative Edit failed: "+e.message+"\n");
  process.exitCode=1;
});
