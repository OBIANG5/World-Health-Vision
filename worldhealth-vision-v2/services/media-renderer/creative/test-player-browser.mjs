#!/usr/bin/env node
/**
 * Browser-level smoke test: exercise the ACTUAL shared Remotion Player in Vite.
 * Tests dynamic import, no duplicate React runtime, blob: inputs and motion.
 * The asset is a clearly synthetic CI fixture, not a journalist's footage.
 *
 * Run Vite locally on :5173 and ensure public/smoke/synthetic-landscape.png
 * exists. No production service, login or account is used by this test.
 */
import fs from "node:fs";
import path from "node:path";
import {createHash} from "node:crypto";
import {openBrowser} from "@remotion/renderer";

const url="http://127.0.0.1:5173/creative-player-smoke.html";
const output=path.resolve("output/creative");
fs.mkdirSync(output,{recursive:true});
const sleep=(ms)=>new Promise(resolve=>setTimeout(resolve,ms));

async function ready(){
  for(let attempt=0;attempt<45;attempt++){
    try{const r=await fetch(url);if(r.ok)return;}catch{}
    await sleep(1000);
  }
  throw Error("Vite smoke page not reachable: "+url);
}

async function main(){
  console.log("[player-smoke] waiting for local Vite server");
  await ready();
  console.log("[player-smoke] opening Chromium");
  const browser=await openBrowser("chrome",{shouldDumpIo:false});
  const errors=[];
  try{
    const page=await browser.newPage();
    await page.setViewport({width:390,height:844,deviceScaleFactor:1});
    page.on("pageerror",e=>errors.push("pageerror: "+String(e)));
    console.log("[player-smoke] opening test page");
    await page.goto(url,{waitUntil:"domcontentloaded",timeout:30000});
    console.log("[player-smoke] waiting for React + Remotion Player");
    await page.waitForFunction("window.__wvSmokeReady === true",{timeout:30000});
    // The Remotion <Img /> must have loaded the local synthetic blob: URL.
    console.log("[player-smoke] waiting for synthetic blob:image paint");
    await page.waitForFunction("Array.from(document.querySelectorAll('#smoke-preview img')).some(im => im.complete && im.naturalWidth > 0)",{timeout:30000});
    const element=await page.$("#smoke-preview");
    if(!element)throw Error("Missing real Player container");
    const frames=[0,74];
    const results=[];
    console.log("[player-smoke] seeking and capturing exact Player frames");
    for(const frame of frames){
      await page.evaluate(f=>window.__wvSmokeSeek?.(f),frame);
      await sleep(450); // allow the browser to paint and load frame imagery
      const file=path.join(output,"player-browser-frame-"+frame+".png");
      const buffer=await element.screenshot({type:"png",path:file});
      results.push({frame,path:file,sha256:createHash("sha256").update(buffer).digest("hex"),bytes:buffer.length});
    }
    const previewErrors=await page.$("#smoke-error");
    if(previewErrors)errors.push(await page.evaluate(node=>node.textContent,previewErrors));
    if(errors.length)throw Error("Player runtime errors: "+errors.join(" | "));
    if(results[0].sha256===results[1].sha256)throw Error("No visible motion between exact Player frames");
    const report={
      test:"shared-compositor-remotion-player-browser-smoke-v1",
      input:"local synthetic blob image, no external fetch or real news",
      composed_with:"CreativeEdit.tsx shared with MP4 renderer",
      viewport:{width:390,height:844},
      screenshot_frames:results,
      no_runtime_errors:true,
      caveats:"This tests Chromium Player rendering only. A real iPhone/Safari and exported MP4 still require separate human QA."
    };
    fs.writeFileSync(path.join(output,"player-browser-smoke.report.json"),JSON.stringify(report,null,2)+"\n");
    console.log(JSON.stringify(report,null,2));
  }finally{await browser.close();}
}
main().catch(e=>{console.error(e);process.exitCode=1;});
