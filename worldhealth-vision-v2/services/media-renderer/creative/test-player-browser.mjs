#!/usr/bin/env node
/**
 * A real browser smoke test using Remotion's own HeadlessBrowser + CDP session.
 * This is NOT Puppeteer: Remotion newPage(), goto() and CDP screenshot are used
 * with the options their 4.0.542 API actually expects.
 *
 * Test: Vite -> React -> shared CreativeEdit -> official Remotion Player,
 * with local blob URL -> visual screenshot at two different animation frames.
 * Synthetic imagery only; never depict a fake news event.
 */
import fs from "node:fs";
import path from "node:path";
import {createHash} from "node:crypto";
import {openBrowser} from "@remotion/renderer";

const url="http://127.0.0.1:5173/creative-player-smoke.html";
const output=path.resolve("output/creative");
fs.mkdirSync(output,{recursive:true});
const sleep=ms=>new Promise(resolve=>setTimeout(resolve,ms));

async function serverReady(){
  console.log("[player-smoke] waiting for local Vite server");
  for(let i=0;i<25;i++){
    try{const r=await fetch(url);if(r.ok)return;}catch{}
    await sleep(450);
  }
  throw Error("Local Vite smoke page not reachable: "+url);
}
async function poll(page,probe,label){
  console.log("[player-smoke] "+label);
  for(let n=0;n<60;n++){
    const value=await page.evaluate(probe);
    if(value===true)return;
    if(typeof value==="string"&&value.startsWith("ERROR:"))throw Error(label+": "+value);
    await sleep(450);
  }
  throw Error("Timed out "+label+"; page may be loading a module or asset incorrectly.");
}
async function capture(page,frame){
  const data=await page._client().send("Page.captureScreenshot",{
    format:"png",fromSurface:true,captureBeyondViewport:false,
    clip:{x:0,y:0,width:360,height:675,scale:1}
  });
  // CDP wrapper returns {value:{data}} in this Remotion release.
  const base64=data?.value?.data??data?.data;
  if(typeof base64!=="string")throw Error("No screenshot data in CDP response");
  const buf=Buffer.from(base64,"base64");
  if(buf.length<1000)throw Error("Screenshot was unexpectedly small");
  const destination=path.join(output,"player-browser-frame-"+frame+".png");
  fs.writeFileSync(destination,buf);
  return {frame,path:destination,sha256:createHash("sha256").update(buf).digest("hex"),bytes:buf.length};
}

async function main(){
  await serverReady();
  console.log("[player-smoke] opening Remotion headless-shell");
  const browser=await openBrowser("chrome",{logLevel:"error",shouldDumpIo:false});
  const errors=[];
  let page=null;
  try{
    page=await browser.newPage({
      context:()=>null,
      logLevel:"error",indent:false,pageIndex:0,
      onBrowserLog:log=>{if(log.type==="error")errors.push(log.text)},
      onLog:()=>{},
    });
    await page.setViewport({width:390,height:844,deviceScaleFactor:1});
    console.log("[player-smoke] navigating using Remotion Page.goto API");
    await page.goto({url,timeout:30000,options:{waitUntil:"load"}});
    await poll(page,()=>window.__wvSmokeReady===true||
      (document.getElementById("smoke-state")?.textContent||"").startsWith("Error:")
        ? true : false,"React + Remotion Player mount");
    const errorState=await page.evaluate(()=>{
      const str=document.getElementById("smoke-state")?.textContent||"";
      return str.startsWith("Error:")?str:null;
    });
    if(errorState)throw Error(errorState);
    await poll(page,()=>Array.from(document.querySelectorAll("#smoke-preview img")).some(
      im=>im.complete&&im.naturalWidth>0
    ),"local synthetic blob: image paint");
    console.log("[player-smoke] seeking and capturing exact Remotion frames");
    const captures=[];
    for(const frame of [0,74]){
      await page.evaluate(f=>window.__wvSmokeSeek?.(f),frame);
      await sleep(550);
      const state=await page.evaluate(()=>document.querySelector("#smoke-error")?.textContent||null);
      if(state)throw Error("Player fallback: "+state);
      captures.push(await capture(page,frame));
    }
    if(errors.length)throw Error("Browser console errors: "+errors.join(" | ").slice(0,1500));
    if(captures[0].sha256===captures[1].sha256)throw Error("No visible motion between exact Player frames");
    const report={
      test:"shared-compositor-remotion-player-browser-smoke-v1",
      source:"locally staged synthetic image converted to browser blob: URL",
      component:"CreativeEdit.tsx shared by Remotion Player and MP4 renderer",
      viewport:{width:390,height:844},
      screenshots:captures,
      no_browser_errors:true,
      caveat:"Technical Chromium test only; Safari/iOS and exported MP4 must receive separate human QA."
    };
    fs.writeFileSync(path.join(output,"player-browser-smoke.report.json"),JSON.stringify(report,null,2)+"\n");
    console.log(JSON.stringify(report,null,2));
  }finally{
    if(page)await page.close().catch(()=>{});
    await browser.close({silent:true});
  }
}
main().catch(error=>{console.error("[player-smoke] "+String(error?.stack??error));process.exitCode=1});
