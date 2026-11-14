/**
 * World-Vision #001: render already-authored Remotion scenes S05–S08 as
 * independent, voice-free, clean-plate MP4 files, never full master.
 * Original official G0 & approved Manrope are required, no fallback.
 */
import path from "node:path";
import {fileURLToPath} from "node:url";
import {existsSync,readFileSync,mkdirSync,writeFileSync,statSync} from "node:fs";
import {createHash} from "node:crypto";
import {execFileSync} from "node:child_process";
import {bundle} from "@remotion/bundler";
import {renderMedia,selectComposition} from "@remotion/renderer";

const BASE=path.dirname(fileURLToPath(import.meta.url));
const REQUIRED={
 "public/brand/world-vision-official.png":null,
 "public/fonts/Manrope-variable.ttf":"3ae11c49db0455a3cc33e37d380f20fdb8c7f8b41dc07625c177e3d87a9d6ae6",
 "public/episodes/summit-2026/xi.jpg":null,
 "public/episodes/summit-2026/trump.jpg":null,
};
const sha=p=>createHash("sha256").update(readFileSync(p)).digest("hex");
for(const [relative,expected] of Object.entries(REQUIRED)){
 const f=path.join(BASE,relative);
 if(!existsSync(f))throw Error("MISSING ORIGINAL ASSET: "+relative);
 if(expected&&sha(f)!==expected)throw Error("MISMATCHED ORIGINAL ASSET: "+relative);
}
const logoPath=path.join(BASE,"public/brand/world-vision-official.png");
const gitSha=execFileSync("git",["hash-object",logoPath],{encoding:"utf8"}).trim();
if(gitSha!=="bc80fa70cebd566768bfb1703a0f1f636a78c196")
  throw Error("G0 logo differs from exact official Git blob");
const specs=[
 {id:"S05",first:612,last:797,name:"segment05-china-xi-6p2s.mp4",title:"Pékin reste réticent"},
 {id:"S06",first:798,last:1013,name:"segment06-iran-ukraine-7p2s.mp4",title:"Iran et Ukraine"},
 {id:"S07",first:1014,last:1199,name:"segment07-no-agreement-6p2s.mp4",title:"Aucun accord attendu"},
 {id:"S08",first:1200,last:1289,name:"segment08-worldvision-outro-3p0s.mp4",title:"Signature World-Vision"}
];
const asked=process.argv.slice(2);
const chosen=asked.length?specs.filter(s=>asked.includes(s.id)):specs;
if(!chosen.length||chosen.length!==(asked.length||specs.length))
 throw Error("Choose one or more S05 S06 S07 S08");
const outdir=path.join(BASE,"output","summit-2026");
mkdirSync(outdir,{recursive:true});
const serve=await bundle({entryPoint:path.join(BASE,"src/index.ts"),onProgress:()=>undefined});
const props={voiceFilename:null};
const comp=await selectComposition({serveUrl:serve,id:"WorldVisionSummit2026",inputProps:props});
if(comp.width!==1080||comp.height!==1920||comp.fps!==30||comp.durationInFrames!==1290)
 throw Error("Invalid composition; must be 43s @30fps portrait");
for(const part of chosen){
 const output=path.join(outdir,part.name);
 console.log("RENDER "+part.id+" frames "+part.first+".."+part.last);
 await renderMedia({
   composition:comp,serveUrl:serve,outputLocation:output,
   inputProps:props,codec:"h264",pixelFormat:"yuv420p",
   frameRange:[part.first,part.last],logLevel:"error",
   overwrite:true
 });
 const meta=JSON.parse(execFileSync("ffprobe",[
   "-v","error","-show_format","-show_streams","-of","json",output
 ],{encoding:"utf8"}));
 const v=meta.streams.find(x=>x.codec_type==="video");
 const n=part.last-part.first+1,dur=n/30;
 if(!v||v.codec_name!=="h264"||v.width!==1080||v.height!==1920
  ||Number(v.nb_frames)!==n||Math.abs(Number(meta.format.duration)-dur)>.05
  ||meta.streams.some(x=>x.codec_type==="audio"))
    throw Error("QA technical file mismatch: "+part.id);
 const report={
  id:part.id,source:"src/WorldVisionSummit2026.tsx",
  editorial_title:part.title,
  status:"TECHNICAL_QA_PASSED_ART_REVIEW_REQUIRED",published:false,
  approval:false,voice:false,subtitles:false,metadata_embedded_in_picture:false,
  clean_plate:true,format:"9:16",width:1080,height:1920,fps:30,
  first_master_frame:part.first,last_master_frame:part.last,
  frames:n,duration_sec:dur,codec:"h264",
  original_logo_git_blob:gitSha,
  font:"Manrope Variable (Google Fonts OFL)",
  font_sha256:sha(path.join(BASE,"public/fonts/Manrope-variable.ttf")),
  asset_xi_2024_sha256:sha(path.join(BASE,"public/episodes/summit-2026/xi.jpg")),
  asset_trump_2025_sha256:sha(path.join(BASE,"public/episodes/summit-2026/trump.jpg")),
  edit_note:part.id==="S08"?"Authentic G0-only end card; no fake earth; original D00 film still required separately for S02.":"Narration and subtitle timing to be aligned in a later approved master.",
  sha256:sha(output),bytes:statSync(output).size
 };
 writeFileSync(output.replace(/\.mp4$/,".json"),JSON.stringify(report,null,2)+"\n");
 console.log(JSON.stringify(report));
}
