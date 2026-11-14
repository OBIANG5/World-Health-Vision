import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync,existsSync} from "node:fs";
import path from "node:path";
import {fileURLToPath} from "node:url";

const root=path.dirname(fileURLToPath(import.meta.url));
const component=readFileSync(path.join(root,"src/WorldVisionSummit2026.tsx"),"utf8");
const scriptFile=path.join(root,"../../docs/media/episodes/2026-11-14_trump_xi_putin_shenzhen/SCRIPT_V1.md");
const scriptMd=readFileSync(scriptFile,"utf8");
const exact=(scriptMd.split("## Script V1 — copie exacte pour narration")[1]||"").split("## Sources")[0].trim().replace(/\\s+/g," ");
const matches=[...component.matchAll(/\\{start:([0-9.]+),end:([0-9.]+),t:"([^"]+)"\\}/g)];
const captions=matches.map(x=>({start:Number(x[1]),end:Number(x[2]),text:x[3]}));
test("All approved narration is shown verbatim in onscreen captions",()=>{
 assert.ok(captions.length>=12);
 const full=captions.map(x=>x.text).join(" ").replace(/\\s+/g," ").trim();
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
 assert.match(component,/staticFile\\("brand\\/world-vision-official\\.png"\\)/);
 assert.match(component,/staticFile\\(rootAssets\\+"eye-earth-d00-v6\\.png"\\)/);
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
