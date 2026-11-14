/**
 * Rebuild V2 : immutable source render, no voice, no caption, no provisional D00.
 * Render 11.6s pilot first to approve type, camera and transition before full 33.7s.
 * Usage: node render-editorial-v2.mjs pilot|full
 */
import path from "node:path";
import {fileURLToPath} from "node:url";
import {readFileSync,existsSync,mkdirSync,statSync,writeFileSync} from "node:fs";
import {createHash} from "node:crypto";
import {execFileSync} from "node:child_process";
import {bundle} from "@remotion/bundler";
import {renderMedia,selectComposition} from "@remotion/renderer";

const BASE=path.dirname(fileURLToPath(import.meta.url));
const mode=process.argv[2]||"pilot";
if(!["pilot","full"].includes(mode))throw Error("Choose pilot or full.");
const assets=[
 "public/brand/world-vision-official.png",
 "public/fonts/BarlowCondensed-Bold.ttf",
 "public/fonts/DMSans-variable.ttf",
 "public/editorial-v2/trump.jpg",
 "public/editorial-v2/putin.jpg",
 "public/editorial-v2/xi.jpg",
 "public/editorial-v2/segment03-shenzhen-july-v3-clean-4p9s.mp4",
 "public/editorial-v2/shenzhen-city-2025.jpg",
 "public/editorial-v2/new-start-prague-2010.jpg",
];
for(const f of assets){
 if(!existsSync(path.join(BASE,f)))throw Error("Missing authenticated original asset: "+f);
}
const gitBlob=p=>execFileSync("git",["hash-object",path.join(BASE,p)],{encoding:"utf8"}).trim();
const expectBlob={
 "public/brand/world-vision-official.png":"bc80fa70cebd566768bfb1703a0f1f636a78c196",
 "public/fonts/BarlowCondensed-Bold.ttf":"9e480f467d703009e3abfce290b2ec2b7d24e188",
 "public/fonts/DMSans-variable.ttf":"c672f98060af9b2c85fca704ebd5ad9a8717c1df",
};
for(const [file,expected] of Object.entries(expectBlob)){
 if(gitBlob(file)!==expected)throw Error("Actual blob differs: "+file);
}
const sha=p=>createHash("sha256").update(readFileSync(p)).digest("hex");
const globe=path.join(BASE,"public/editorial-v2/segment03-shenzhen-july-v3-clean-4p9s.mp4");
if(sha(globe)!=="59028e59f40585ed30419a56b083386e492d5cd37920f022f5e3b5301f9423fe")
 throw Error("Never replace the preserved NASA globe with another video.");
const outDir=path.join(BASE,"output","editorial-v2");
mkdirSync(outDir,{recursive:true});
const name=mode==="pilot"?"opening-pilot-10p4s-v3.mp4":"full-silent-picture-33p7s-v3.mp4";
const frames=mode==="pilot"?312:1011;
const out=path.join(outDir,name);
console.log("BUNDLING V2 editorial source, mode",mode);
const bundled=await bundle({entryPoint:path.join(BASE,"src/editorial-v2-index.ts"),onProgress:()=>{}});
const c=await selectComposition({serveUrl:bundled,id:"WVEditorialV2"});
if(c.width!==1080||c.height!==1920||c.fps!==30||c.durationInFrames!==1011)
 throw Error("Wrong scene geometry/driver: "+JSON.stringify(c));
console.log("RENDER",out,frames+" frames");
await renderMedia({
 composition:c,serveUrl:bundled,outputLocation:out,codec:"h264",
 pixelFormat:"yuv420p",frameRange:[0,frames-1],
 concurrency:2,logLevel:"error",overwrite:true
});
const p=JSON.parse(execFileSync("ffprobe",["-v","error","-show_format","-show_streams","-of","json",out],{encoding:"utf8"}));
const v=p.streams.find(x=>x.codec_type==="video");
if(!v||v.codec_name!=="h264"||v.width!==1080||v.height!==1920||
   Number(v.nb_frames)!==frames||p.streams.some(x=>x.codec_type==="audio"))
 throw Error("FFprobe visual quality gate failed");
const report={
 project:"World-Vision 001",branch:"rebuild/editorial-v2-quality-gates",
 iteration:"Vivienne-timed visual V3",mode,status:"TECHNICAL_RENDER_ONLY_WAITING_ART_REVIEW",
 absolute_publishable:false,user_approval:false,voice_approved:false,
 frames,fps:30,duration_sec:frames/30,resolution:[1080,1920],
 input_globe_sha256:sha(globe),
 genuine_logo_blob:gitBlob("public/brand/world-vision-official.png"),
 headline_font:"Barlow Condensed Bold",subtitle_font:"DM Sans",
 original_source_photo_assets:true,
 removes_09s_logo_hold:true,progress_bars:false,voice_present:false,
 captions_baked:false,read_outro:false,
 voice_reference:"fr-FR-VivienneMultilingualNeural",
 first_spoken_frame:0, last_spoken_boundary_sec:30.597,
 silent_logo_from_sec:30.7,
 natural_utterance_seconds:30.912,
 observed_synced_video_seconds:33.7,
 note:"Source design proof: never declare a final film from codec checks alone.",
 sha256:sha(out),bytes:statSync(out).size
};
writeFileSync(out.replace(/\.mp4$/,".json"),JSON.stringify(report,null,2)+"\n");
console.log(JSON.stringify(report));
