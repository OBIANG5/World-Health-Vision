#!/usr/bin/env node
/**
 * Browser-level MEDIA STUDIO smoke: actual Vite / React / @remotion/player.
 * Uses public Puppeteer Core API (not private Remotion Browser/CDP methods).
 * Remotion remains the SAME composition for Player and MP4.
 *
 * - one-shot: synthetic user asset blob, two animation frames
 * - full-film: 2 real Remotion scenes, actual dissolve, synthetic WAV track,
 *   screenshot during transition and after the second shot
 *
 * No news imagery, no fabricated reports, no accounts or remote API calls.
 */
import fs from "node:fs";
import path from "node:path";
import {createHash} from "node:crypto";
import puppeteer from "puppeteer-core";

const url="http://127.0.0.1:5173/creative-player-smoke.html";
const output=path.resolve("output/creative");
fs.mkdirSync(output,{recursive:true});
const sleep=ms=>new Promise(resolve=>setTimeout(resolve,ms));
const chromeCandidates=[
  process.env.WV_TEST_CHROME,process.env.PUPPETEER_EXECUTABLE_PATH,
  "/usr/bin/google-chrome","/usr/bin/google-chrome-stable",
  "/usr/bin/chromium","/usr/bin/chromium-browser"
].filter(Boolean);
const executablePath=chromeCandidates.find(p=>fs.existsSync(p));

async function serverReady(){
  for(let i=0;i<45;i++){
    try{const response=await fetch(url);if(response.ok)return;}catch{}
    await sleep(350);
  }
  throw Error("Local Vite smoke page not reachable: "+url);
}
async function testCase(browser,{mode,frames,expectedDuration,expectVoice}){
  const prefix=mode==="film"?"player-film-frame-":mode==="clip"?"player-clip-frame-":mode==="document"?"player-document-frame-":"player-browser-frame-";
  const page=await browser.newPage();
  const errors=[];
  page.on("pageerror",e=>errors.push(String(e)));
  try{
    await page.setViewport({width:390,height:844,deviceScaleFactor:1});
    await page.goto(url+(mode==="shot"?"":"?mode="+mode),{
      waitUntil:"domcontentloaded",timeout:35000
    });
    await page.waitForFunction("window.__wvSmokeReady === true",{timeout:30000});
    if(mode==="clip"){
      await page.waitForFunction(
        "Array.from(document.querySelectorAll('#smoke-preview video')).some(v=>v.readyState>=2 && v.videoWidth>0)",
        {timeout:30000}
      );
    }else{
      await page.waitForFunction(
        "Array.from(document.querySelectorAll('#smoke-preview img')).some(im=>im.complete&&im.naturalWidth>0)",
        {timeout:30000}
      );
    }
    const state=await page.evaluate(()=>({
      mode:window.__wvSmokeMode,frames:window.__wvSmokeFrames,
      hasVoice:window.__wvSmokeHasVoice,
      error:document.querySelector("#smoke-error")?.textContent||null
    }));
    if(state.error||state.mode!==mode||state.frames!==expectedDuration||state.hasVoice!==expectVoice)
      throw Error("Player did not load intended composition: "+JSON.stringify(state));
    const element=await page.$("#smoke-preview");
    if(!element)throw Error("Missing Remotion Player viewport");

    const screenshots=[];
    for(const frame of frames){
      await page.evaluate(f=>window.__wvSmokeSeek?.(f),frame);
      await sleep(600);
      if(mode==="document"&&frame===0){
        const entrance=await page.evaluate(()=>{
          const card=document.querySelector('[data-wv-document-card="plan-synthetique"]');
          return card?{opacity:Number(getComputedStyle(card).opacity),height:card.getBoundingClientRect().height}:null;
        });
        if(!entrance||entrance.opacity<.9||entrance.height<200)
          throw Error("News evidence intro must not begin with a blank screen: "+JSON.stringify(entrance));
      }
      if(mode==="document"&&frame===40){
        const region=await page.evaluate(()=>{
          const target=document.querySelector('[data-wv-evidence-target="plan-synthetique"]');
          return target?{visible:Number(getComputedStyle(target).opacity),rect:target.getBoundingClientRect().toJSON()}:null;
        });
        if(!region||region.visible<.1||region.rect.width<30||region.rect.height<20)
          throw Error("Document region is not visible at inspection beat: "+JSON.stringify(region));
        console.log("[player-smoke] authentic-pixel evidence highlight validated",region);
      }
      if(mode==="document"&&frame===102){
        const geometry=await page.evaluate(()=>{
          const card=document.querySelector('[data-wv-document-card="plan-synthetique"]');
          const captions=document.querySelector('[data-wv-document-caption="plan-synthetique"]');
          const viewport=document.querySelector("#smoke-preview");
          if(!card||!captions||!viewport)return null;
          const box=card.getBoundingClientRect();
          const text=captions.getBoundingClientRect();
          const frame=viewport.getBoundingClientRect();
          return {
            cardBottom:box.bottom,
            captionTop:text.top,
            captionBottom:text.bottom,
            mobileMaxY:frame.top+frame.height*.78
          };
        });
        if(!geometry||geometry.cardBottom>geometry.captionTop+3||
           geometry.captionBottom>geometry.mobileMaxY+3)
          throw Error("Document caption covers evidence or enters mobile overlay danger zone: "+JSON.stringify(geometry));
        console.log("[player-smoke] document safe-area and non-overlap verified",geometry);
      }
      if(mode==="document"&&frame===102){
        const titleVisible=await page.evaluate(()=>{
          const title=document.querySelector('[data-wv-title="plan-synthetique"]');
          return title?Number(getComputedStyle(title.parentElement).opacity):null;
        });
        if(titleVisible===null||titleVisible<.85)
          throw Error("Authored context not visible after document camera emphasis: "+titleVisible);
      }
      if(mode==="film"&&frame===100){
        const incomingHeadlineOpacity=await page.evaluate(()=>{
          const title=document.querySelector('[data-wv-title="contexte-synthetique"]');
          return title?Number(getComputedStyle(title).opacity):null;
        });
        if(incomingHeadlineOpacity===null||incomingHeadlineOpacity>.02){
          throw Error("Incoming headline overlaps the outgoing title during dissolve: opacity="+incomingHeadlineOpacity);
        }
        console.log("[player-smoke] transition typography gate validated");
      }
      const fallback=await page.$("#smoke-error");
      if(fallback)throw Error("Player fallback: "+(await page.evaluate(el=>el.textContent,fallback)));
      const file=path.join(output,prefix+frame+".png");
      const buffer=await element.screenshot({type:"png",path:file});
      screenshots.push({
        frame,path:file,sha256:createHash("sha256").update(buffer).digest("hex"),
        size_bytes:buffer.length
      });
    }
    if(errors.length)throw Error("Browser page errors: "+errors.join(" | ").slice(0,2500));
    if(new Set(screenshots.map(s=>s.sha256)).size!==screenshots.length)
      throw Error("No actual visible motion between some "+mode+" frames");
    if(mode==="film"){
      const secondShotVisible=await page.evaluate(()=>
        document.querySelector("#smoke-preview")?.textContent?.includes("LE RÉCIT CONTINUE.")??false
      );
      if(!secondShotVisible)throw Error("Second shot not mounted after transition");
    }
    const report={
      test:"worldvision-shared-remotion-player-browser-"+mode+"-v2",
      input:mode==="clip"?"locally supplied synthetic H.264 video as blob":mode==="document"?"synthetic abstract paper, no original facts or excerpts":"original synthetic picture; "+(expectVoice?"local synthetic WAV tone":"no voice"),
      composition:"exact shared CreativeEdit.tsx — no CSS animation duplication",
      screen:{width:390,height:844},
      frames_in_composition:expectedDuration,
      browser_errors:0,
      screenshots,
      warning:"This confirms Chromium animation and source integration, NOT artistic quality, iOS Safari or production publication rights."
    };
    const dest=path.join(output,mode==="film"?"player-film-smoke.report.json":mode==="clip"?"player-clip-smoke.report.json":mode==="document"?"player-document-smoke.report.json":"player-browser-smoke.report.json");
    fs.writeFileSync(dest,JSON.stringify(report,null,2)+"\n");
    console.log(JSON.stringify(report,null,2));
  }finally{
    await page.close();
  }
}
async function main(){
  console.log("[player-smoke] waiting for Vite");
  await serverReady();
  if(!executablePath)throw Error("Chromium not found. Set WV_TEST_CHROME to its executable path.");
  console.log("[player-smoke] starting system Chromium:",executablePath);
  const browser=await puppeteer.launch({
    executablePath,headless:true,
    args:["--no-sandbox","--disable-setuid-sandbox","--disable-dev-shm-usage","--disable-gpu"]
  });
  try{
    console.log("[player-smoke] checking single shot");
    await testCase(browser,{mode:"shot",frames:[0,74],expectedDuration:105,expectVoice:false});
    console.log("[player-smoke] checking real whole-film transitions and imported WAV");
    await testCase(browser,{mode:"film",frames:[0,100,145],expectedDuration:165,expectVoice:true});
    console.log("[player-smoke] verifying imported H.264 MP4 clip from local file");
    await testCase(browser,{mode:"clip",frames:[0,74],expectedDuration:105,expectVoice:false});
    console.log("[player-smoke] examining directed documentary inspection without fabricating quotes");
    await testCase(browser,{mode:"document",frames:[0,40,68,102],expectedDuration:140,expectVoice:false});
    console.log("[player-smoke] all four real Player paths passed");
  }finally{
    await browser.close();
  }
}
main().catch(e=>{console.error("[player-smoke] "+String(e?.stack??e));process.exitCode=1;});
