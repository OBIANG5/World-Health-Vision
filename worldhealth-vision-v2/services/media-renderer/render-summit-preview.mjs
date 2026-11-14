/**
 * Standalone review export — existing Remotion renderer, no new editing engine.
 * Usage: node render-summit-preview.mjs [hook|full]
 * HOOK: real portraits + exact official G0 logo, 4.5 seconds (no audio yet).
 * FULL: fail-closed until original D00-v6 SHA and licensed audio/assets are present.
 */
import path from "node:path";
import {fileURLToPath} from "node:url";
import {readFileSync,existsSync,mkdirSync,writeFileSync} from "node:fs";
import {createHash} from "node:crypto";
import {bundle} from "@remotion/bundler";
import {renderMedia,selectComposition} from "@remotion/renderer";
import {execFileSync} from "node:child_process";

const base=path.dirname(fileURLToPath(import.meta.url));
const mode=process.argv[2]||"hook";
if(!["hook","full"].includes(mode))throw new Error("Only hook and full modes are supported");
const required=["public/brand/world-vision-official.png",
 "public/episodes/summit-2026/trump.jpg",
 "public/episodes/summit-2026/putin.jpg",
 "public/episodes/summit-2026/xi.jpg"];
if(mode==="full")required.push(
 "public/episodes/summit-2026/shenzhen.jpg",
 "public/episodes/summit-2026/eye-earth-d00-v6.png");
for(const relative of required){
 const absolute=path.join(base,relative);
 if(!existsSync(absolute))throw new Error("MANDATORY ASSET MISSING: "+relative+" — refusing substitute graphics.");
}
const sha256=filepath=>createHash("sha256").update(readFileSync(filepath)).digest("hex");
const d00Hash="8d9a9d20f20fbf7757713b6f5eab06590f191166eb779865747f0f59683cfca2";
if(mode==="full"){
 const d00=path.join(base,"public/episodes/summit-2026/eye-earth-d00-v6.png");
 if(sha256(d00)!==d00Hash)throw new Error("D00-v6 identity SHA mismatch. No alternate image allowed.");
 if(!existsSync(path.join(base,"public/episodes/summit-2026/voice-fr-approved.wav")))
   throw new Error("Full editorial release requires real approved voice WAV; silent render is NOT final.");
}
const logoPath=path.join(base,"public/brand/world-vision-official.png");
const logoGit=await new Promise((resolve)=>{import("node:child_process").then(({execFileSync})=>{
  try{resolve(execFileSync("git",["hash-object",logoPath],{encoding:"utf8"}).trim());}
  catch{resolve(null);}
});});
if(logoGit!=="bc80fa70cebd566768bfb1703a0f1f636a78c196")
 throw new Error("OFFICIAL G0 logo differs from verified GitHub blob; no replacement accepted.");
const outputDir=path.join(base,"output","summit-2026");
mkdirSync(outputDir,{recursive:true});
const output=path.join(outputDir,mode==="hook"?"hook-4p5s-preview.mp4":"report-43s-master-candidate.mp4");
const bundled=await bundle({entryPoint:path.join(base,"src","index.ts"),onProgress:()=>undefined});
const inputProps={voiceFilename:mode==="full"?"episodes/summit-2026/voice-fr-approved.wav":null,previewWatermark:mode!=="full"};
const comp=await selectComposition({serveUrl:bundled,id:"WorldVisionSummit2026",inputProps});
if(comp.width!==1080||comp.height!==1920||comp.fps!==30)throw new Error("Unexpected composition profile");
await renderMedia({composition:comp,serveUrl:bundled,outputLocation:output,
 codec:"h264",pixelFormat:"yuv420p",inputProps,logLevel:"error",
 ...(mode==="hook"?{frameRange:[0,134]}:{})});
const probe=JSON.parse(execFileSync("ffprobe",["-v","error","-show_format","-show_streams","-of","json",output],{encoding:"utf8"}));
const video=probe.streams.find(x=>x.codec_type==="video");
if(!video)throw new Error("No video stream found");
const duration=Number(probe.format.duration);
if(!Number.isFinite(duration)||duration<4||duration>44)throw new Error("MP4 duration invalid");
const report={
 status:mode==="full"?"REVIEW_REQUIRED_NO_PUBLICATION":"TECHNICAL_HOOK_REVIEW_ONLY",
 published:false,approved:false,mode,script:"2026-11-14_trump_xi_putin/SCRIPT_V1.md",
 label:"Sommet ANNONCÉ Trump–Xi–Poutine (19 nov. 2026) — archives, pas images de la réunion",
 output:path.basename(output),bytes:readFileSync(output).length,
 sha256:sha256(output),duration,width:video.width,height:video.height,
 logo_git_blob:logoGit,reference_d00_sha256:d00Hash,
 audio_present:mode==="full",
 note:"Le hook seul ne remplace pas une vidéo complète. La voix n'est pas générée automatiquement."
};
writeFileSync(path.join(outputDir,mode+"-report.json"),JSON.stringify(report,null,2)+"\n");
console.log(JSON.stringify(report,null,2));
