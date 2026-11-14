import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync,existsSync} from "node:fs";
import path from "node:path";
import {fileURLToPath} from "node:url";

const root=path.dirname(fileURLToPath(import.meta.url));
const component=readFileSync(path.join(root,"src/WorldVisionSummit2026.tsx"),"utf8");
const scriptFile=path.join(root,"../../docs/media/episodes/2026-11-14_trump_xi_putin_shenzhen/SCRIPT_V1.md");
const scriptMd=readFileSync(scriptFile,"utf8");
const exact=(scriptMd.split("## Script V1 — copie exacte pour narration")[1]||"").split("## Sources")[0].trim().replace(/\s+/g," ");
const matches=[...component.matchAll(/\{start:([0-9.]+),end:([0-9.]+),t:"([^"]+)"\}/g)];
const captions=matches.map(x=>({start:Number(x[1]),end:Number(x[2]),text:x[3]}));
test("All approved narration is shown verbatim in onscreen captions",()=>{
 assert.ok(captions.length>=12);
 const full=captions.map(x=>x.text).join(" ").replace(/\s+/g," ").trim();
 assert.equal(full,exact,"Montage text must never silently rewrite the approved editorial script.");
});
test("Full 43-second timeline has no missing or overlapping subtitle windows",()=>{
 assert.equal(captions[0].start,0);
 assert.equal(captions.at(-1).end,43);
 for(let i=0;i<captions.length;i++){
  assert.ok(captions[i].end>captions[i].start);
  if(i>0)assert.equal(captions[i].start,captions[i-1].end,"Caption gap/overlap");
 }
});
test("Uses official unchanged G0 logo and original D00 asset path",()=>{
 assert.match(component,/staticFile\("brand\/world-vision-official\.png"\)/);
 assert.match(component,/staticFile\(rootAssets\+"eye-earth-d00-v6\.png"\)/);
 const render=readFileSync(path.join(root,"render-summit-preview.mjs"),"utf8");
 assert.match(render,/bc80fa70cebd566768bfb1703a0f1f636a78c196/);
 assert.match(render,/8d9a9d20f20fbf7757713b6f5eab06590f191166eb779865747f0f59683cfca2/);
 assert.match(render,/MANDATORY ASSET MISSING/);
});
test("The exact logo PNG exists inside the currently versioned renderer",()=>{
 assert.ok(existsSync(path.join(root,"public/brand/world-vision-official.png")));
});
test("No unsupported claim that the meeting has already happened",()=>{
 assert.match(scriptMd,/doivent se réunir à Shenzhen/);
 assert.match(component,/Sommet ANNONCÉ|RENCONTRE ANNONCÉE|rencontre inédite/i);
});

test("No production watermark or internal credit is drawn into any master frame",()=>{
 assert.doesNotMatch(component,/previewWatermark\s*&&|PRÉVISUALISATION SANS VOIX FINALE/);
 assert.match(component,/const Credit:React\.FC<\{text:string\}>=\(\)=>null;/);
 const render=readFileSync(path.join(root,"render-summit-preview.mjs"),"utf8");
 assert.doesNotMatch(render,/previewWatermark\s*:/);
});

test("Final assembly requires the precise S04 clean plate — V1/V2 cannot leak",()=>{
 assert.ok(component.includes("segment04-new-start-v3-clean-7p9s.mp4"));
 const render=readFileSync(path.join(root,"render-summit-preview.mjs"),"utf8");
 assert.match(render,/4fa8aebec451f4edb0d8bd495655b619feaab0d9fb0d517c12e4bd9f88b33e69/);
 assert.match(render,/S04 must be exact Manrope clean-plate V3/);
});

test("Geographic segment S03 also uses exact clean premium version",()=>{
 assert.ok(component.includes("segment03-shenzhen-july-v3-clean-4p9s.mp4"));
 const render=readFileSync(path.join(root,"render-summit-preview.mjs"),"utf8");
 assert.ok(render.includes("59028e59f40585ed30419a56b083386e492d5cd37920f022f5e3b5301f9423fe"));
});

test("S01 stand-alone clean plate has no subtitles until the approved master voice",()=>{
 assert.match(component,/\{voiceFilename&&<CaptionOverlay\/>\}/);
 assert.match(component,/const manrope=staticFile\("fonts\/Manrope-variable\.ttf"\)/);
 assert.match(component,/fontFamily:"WorldVision-Manrope, sans-serif"/);
 const render=readFileSync(path.join(root,"render-summit-preview.mjs"),"utf8");
 assert.match(render,/3ae11c49db0455a3cc33e37d380f20fdb8c7f8b41dc07625c177e3d87a9d6ae6/);
});


test("Correct 43s EDL for fast authentic city transition: 0.9 + 4.9 + 2.7 - 0.5",()=>{
 assert.match(component,/\{id:"globe",start:4\.5,end:5\.4,/);
 assert.match(component,/\{id:"location",start:5\.4,end:10\.3,/);
 assert.match(component,/\{id:"city",start:9\.8,end:12\.5,/);
 assert.match(component,/segment03b-shenzhen-city-v1-2p7s\.mp4/);
 assert.match(component,/const radius=Math\.ceil\(1250\*progress\)/);
 assert.match(component,/clipPath:/);
 assert.doesNotMatch(component,/style=\{\{background:S\.ink,opacity\}\}/);
 // Neither source clip is accelerated; dissolve is accomplished by overlap.
 assert.doesNotMatch(component,/playbackRate=/);
 const render=readFileSync(path.join(root,"render-summit-preview.mjs"),"utf8");
 assert.match(render,/cd0dfa113ec71d95b615fba341f0aec5db8953ad1ca520dc292db6c11540f016/);
 assert.match(render,/59028e59f40585ed30419a56b083386e492d5cd37920f022f5e3b5301f9423fe/);
});
