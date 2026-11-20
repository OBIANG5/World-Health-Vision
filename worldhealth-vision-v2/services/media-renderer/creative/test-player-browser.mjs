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
  const prefix=mode==="editorial"?"player-editorial-frame-":mode==="film"?"player-film-frame-":mode==="clip"?"player-clip-frame-":mode==="document"?"player-document-frame-":mode==="geo"?"player-geo-frame-":mode==="country"?"player-country-frame-":mode==="photo"?"player-photo-frame-":mode.startsWith("data-")?"player-"+mode+"-frame-":"player-browser-frame-";
  const page=await browser.newPage();
  const errors=[];
  page.on("pageerror",e=>errors.push(String(e)));
  try{
    await page.setViewport({width:390,height:844,deviceScaleFactor:1});
    await page.goto(url+(mode==="shot"?"":"?mode="+mode),{
      waitUntil:"domcontentloaded",timeout:35000
    });
    await page.waitForFunction("window.__wvSmokeReady === true",{timeout:30000});
    if(mode==="editorial"){
      // The first scene is a real globe/canvas rather than an <img> picture.
      await page.waitForFunction(
        "Boolean(document.querySelector('[data-wv-geo-earth]'))",
        {timeout:30000}
      );
    }else if(mode==="clip"){
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
      if(mode==="editorial"){
        const stage=frame>=650?"document":frame>=485&&frame<=580?"data":
          frame>=335&&frame<=420?"photo":frame>=180&&frame<=270?"country":
          frame>=35&&frame<=105?"geo":null;
        if(stage){
          const scene=await page.evaluate(()=>({
            globe:Boolean(document.querySelector('[data-wv-geo-earth]')),
            country:Boolean(document.querySelector('[data-wv-country-map-boundary]')),
            photo:Boolean(document.querySelector('[data-wv-photo-multilayer]')),
            data:Boolean(document.querySelector('[data-wv-data-motion="line"]')),
            document:Boolean(document.querySelector('[data-wv-document-card="film-evidence-closing"]')),
            currentTitles:Array.from(document.querySelectorAll('[data-wv-title]'))
              .map(x=>x.getAttribute("data-wv-title"))
          }));
          if(!(stage==="geo"?scene.globe:scene[stage])||!scene.currentTitles.includes({
            geo:"film-world-overview",country:"film-territory-context",
            photo:"film-source-photo",data:"film-verified-data-contract",
            document:"film-evidence-closing"
          }[stage]))throw Error("Integrated FILM scene missing at frame "+
            frame+": "+JSON.stringify(scene));
          console.log("[player-smoke] editorial FILM verified staged shot",frame,stage);
        }
      }
      if(mode==="geo"&&frame===96){
        const geometry=await page.evaluate(()=>{
          const photo=document.querySelector('[data-wv-geo-photo]');
          const copy=document.querySelector('[data-wv-geo-copy]');
          const metric=document.querySelector('[data-wv-geo-metric]');
          const target=document.querySelector('[data-wv-geo-target]');
          const viewport=document.querySelector('#smoke-preview');
          if(!photo||!copy||!metric||!target||!viewport)return null;
          const a=photo.getBoundingClientRect(),b=copy.getBoundingClientRect();
          const m=metric.getBoundingClientRect(),t=target.getBoundingClientRect();
          const v=viewport.getBoundingClientRect();
          return {
            photoBottom:a.bottom,copyTop:b.top,copyBottom:b.bottom,
            photoRight:a.right,targetLeft:t.left,
            metricTop:m.top,metricBottom:m.bottom,
            photoTop:a.top,
            maxTextBottom:v.top+v.height*.79,
          };
        });
        if(!geometry||geometry.photoBottom>geometry.copyTop-6||
          geometry.copyBottom>geometry.maxTextBottom||
          geometry.metricTop<geometry.photoTop-3||geometry.metricBottom>geometry.photoBottom+3)
          throw Error("Geo card/title/metric breach mobile overlays or overlap: "+JSON.stringify(geometry));
        console.log("[player-smoke] geo media/metric/title mobile layout",geometry);
      }
      if(mode==="geo"&&frame===48){
        const scene=await page.evaluate(()=>{
          const globe=document.querySelector('[data-wv-geo-earth]');
          const land=document.querySelector('[data-wv-geo-land]');
          const borders=document.querySelector('[data-wv-geo-borders]');
          const route=document.querySelector('[data-wv-geo-route]');
          const target=document.querySelector('[data-wv-geo-target]');
          return {
            globe:Boolean(globe),land:Boolean(land),borders:Boolean(borders),
            projectedLandPathLength:land?.getAttribute("d")?.length??0,
            projectedBordersLength:borders?.getAttribute("d")?.length??0,
            route:Boolean(route),routeDashOffset:Number(route?.getAttribute("stroke-dashoffset")??NaN),
            target:Boolean(target),photo:Boolean(document.querySelector('[data-wv-geo-photo]')),
            photoRimsAreHollow:
              document.querySelector('[data-wv-geo-rim]')?.getAttribute('fill')==="none"&&
              document.querySelector('[data-wv-geo-neon-rim]')?.getAttribute('fill')==="none",
            atmosphereCentered:
              document.querySelector('[data-wv-geo-rim]')?.getAttribute('transform')?.includes("translate(-540 -690)")??false,
            nasaCanvas:Boolean(document.querySelector('[data-wv-geo-nasa-texture] canvas')),
            countryId:document.querySelector('[data-wv-geo-country-spotlight]')?.getAttribute("data-wv-geo-country-spotlight")??null,
            countryPathLength:document.querySelector('[data-wv-geo-country-spotlight]')?.getAttribute("d")?.length??0,
            cameraArrival:Number(document.querySelector('[data-wv-geo-camera-arrival]')?.getAttribute("data-wv-geo-camera-arrival")),
            cameraZoom:Number(document.querySelector('[data-wv-geo-camera-zoom]')?.getAttribute("data-wv-geo-camera-zoom")),
            sphereZoom:Number(document.querySelector('[data-wv-geo-sphere-scale]')?.getAttribute("data-wv-geo-sphere-scale")),
            nasaSource:document.querySelector('[data-wv-geo-nasa-texture]')?.getAttribute('data-wv-geo-nasa-texture')??null
          };
        });
        if(!scene.globe||!scene.land||!scene.borders||scene.projectedLandPathLength<3000||
          scene.projectedBordersLength<1000||!scene.route||!Number.isFinite(scene.routeDashOffset)||
          scene.routeDashOffset>=.95||!scene.target||!scene.photo||
          !scene.nasaCanvas||!scene.photoRimsAreHollow||!scene.atmosphereCentered||
          scene.countryId!=="266"||scene.countryPathLength<15||
          scene.cameraArrival<=.1||scene.cameraArrival>=.9||
          scene.cameraZoom<=1||Math.abs(scene.cameraZoom-scene.sphereZoom)>.002||
          scene.nasaSource!=="NASA-BlueMarble-June-2004")
          throw Error("Geo animation missing real projected multi-layer elements: "+JSON.stringify(scene));
        console.log("[player-smoke] Atlas projected geography / simultaneous animated layers",scene);
      }
      if(mode==="geo"&&frame===138){
        const final=await page.evaluate(()=>{
          const svg=document.querySelector('[data-wv-geo-camera-arrival]');
          const sphere=document.querySelector('[data-wv-geo-sphere-scale]');
          return {
            arrival:Number(svg?.getAttribute("data-wv-geo-camera-arrival")),
            zoom:Number(svg?.getAttribute("data-wv-geo-camera-zoom")),
            sphereZoom:Number(sphere?.getAttribute("data-wv-geo-sphere-scale")),
            center:svg?.getAttribute("data-wv-geo-camera-center")??""
          };
        });
        if(final.arrival!==1||Math.abs(final.zoom-1.1)>.0001||
           Math.abs(final.zoom-final.sphereZoom)>.001||
           final.center!=="11.6000,-0.7000")
          throw Error("GEO camera failed to reach/hold editor-approved focus: "+JSON.stringify(final));
      }
      if(mode==="country"&&(frame===0||frame===115)){
        const scene=await page.evaluate(()=>{
          const fill=document.querySelector('[data-wv-country-fill="10m"]');
          const map=document.querySelector('[data-wv-country-map-boundary]');
          const media=document.querySelector('[data-wv-country-media]');
          const copy=document.querySelector('[data-wv-title]');
          if(!fill||!map||!media||!copy)return null;
          return {
            mapBottom:map.getBoundingClientRect().bottom,
            mediaTop:media.getBoundingClientRect().top,
            countryOpacity:Number(fill.getAttribute("opacity")),
            headline:copy.textContent??""
          };
        });
        if(!scene||scene.mapBottom>scene.mediaTop-5||
          scene.countryOpacity<.19||!scene.headline)
          throw Error("Country is cropped under media or opening frame is blank: "+JSON.stringify(scene));
        console.log("[player-smoke] country visible on entry and map separated from photo",scene);
      }
      if(mode==="country"&&frame===60){
        const scene=await page.evaluate(()=>{
          const focused=document.querySelector('[data-wv-country-focus]');
          const detailed=document.querySelector('[data-wv-country-outline="10m"]');
          const context=document.querySelector('[data-wv-country-context="50m"]');
          const fill=document.querySelector('[data-wv-country-fill="10m"]');
          const camera=document.querySelector('[data-wv-country-camera]');
          return {
            country:focused?.getAttribute("data-wv-country-focus")??null,
            outlinePoints:detailed?.getAttribute("d")?.length??0,
            contextPoints:context?.getAttribute("d")?.length??0,
            outlineReveal:Number(detailed?.getAttribute("stroke-dashoffset")),
            cameraScale:Number(camera?.getAttribute("data-wv-country-scale")),
            titleMapGap:(document.querySelector('[data-wv-country-map-boundary]')?.getBoundingClientRect().top??NaN)-
              (document.querySelector('[data-wv-title]')?.getBoundingClientRect().bottom??NaN),
            hasFill:Boolean(fill),hasMarker:Boolean(document.querySelector('[data-wv-country-marker]')),
            hasPhoto:Boolean(document.querySelector('[data-wv-country-media]')),
            hasNumber:Boolean(document.querySelector('[data-wv-country-metric]'))
          };
        });
        if(scene.country!=="266"||scene.outlinePoints<100||scene.contextPoints<200||
          !scene.hasFill||!scene.hasMarker||!scene.hasPhoto||!scene.hasNumber||
          scene.outlineReveal<=0||scene.outlineReveal>=1||
          scene.cameraScale<.9||scene.cameraScale>1.08||
          !Number.isFinite(scene.titleMapGap)||scene.titleMapGap<12)
          throw Error("Country-focus 10m/50m multilayer scene failed: "+JSON.stringify(scene));
        console.log("[player-smoke] detailed country-focus layers proven",scene);
      }
      if(mode==="country"&&frame===155){
        const scene=await page.evaluate(()=>{
          const caption=document.querySelector('[data-wv-country-caption]');
          const media=document.querySelector('[data-wv-country-media]');
          const viewport=document.querySelector("#smoke-preview");
          if(!caption||!media||!viewport)return null;
          const a=caption.getBoundingClientRect(),b=media.getBoundingClientRect(),v=viewport.getBoundingClientRect();
          return {captionTop:a.top,captionBottom:a.bottom,mediaBottom:b.bottom,
            mobileMaxY:v.top+v.height*.79,
            opacity:Number(getComputedStyle(caption).opacity)};
        });
        if(!scene||scene.captionTop<scene.mediaBottom+7||
          scene.captionBottom>scene.mobileMaxY||
          scene.opacity<.95)
          throw Error("Country caption is covered, late or clipped on mobile: "+JSON.stringify(scene));
        console.log("[player-smoke] country-focus mobile safe-area captions",scene);
      }
      if(mode==="photo"&&frame===0){
        const opening=await page.evaluate(()=>{
          const h=document.querySelector('[data-wv-photo-heading]');
          const title=h?.querySelector('[data-wv-title]');
          return {opacity:h?Number(getComputedStyle(h).opacity):0,
            headline:title?.textContent??""};
        });
        if(opening.opacity<.75||!opening.headline.includes("UNE IMAGE"))
          throw Error("PHOTO video must communicate a headline from frame zero: "+JSON.stringify(opening));
        console.log("[player-smoke] initial photo news hook visible from first frame",opening);
      }
      if(mode==="photo"&&(frame===40||frame===85||frame===145)){
        const state=await page.evaluate(()=>{
          const photo=document.querySelector('[data-wv-photo-multilayer]');
          const mask=document.querySelector('[data-wv-photo-mask]');
          const camera=document.querySelector('[data-wv-photo-camera]');
          const alpha=document.querySelector('[data-wv-photo-foreground]');
          const focus=document.querySelector('[data-wv-photo-focus]');
          const number=document.querySelector('[data-wv-photo-metric]');
          const source=document.querySelector('[data-wv-photo-metric-source]');
          const caption=document.querySelector('[data-wv-photo-caption]');
          const viewport=document.querySelector('#smoke-preview');
          const label=document.querySelector('[data-wv-photo-heading]');
          return {
            exists:Boolean(photo),
            cameraScale:Number(camera?.getAttribute('data-wv-photo-camera-scale')),
            reveal:Number(mask?.getAttribute('data-wv-photo-mask-progress')),
            subject:Number(alpha?.getAttribute('data-wv-photo-subject-progress')),
            focusCenter:focus?.getAttribute('data-wv-photo-focus-center')??null,
            metric:Boolean(number),source:source?.textContent??'',
            title:Boolean(label?.textContent),
            metricBottom:number?.getBoundingClientRect().bottom??null,
            sourceHeight:source?.getBoundingClientRect().height??null,
            sourceFontMobile:source&&viewport
              ?parseFloat(getComputedStyle(source).fontSize)*viewport.getBoundingClientRect().width/1080
              :null,
            captionTop:caption?.getBoundingClientRect().top??null,
            captionBottom:caption?.getBoundingClientRect().bottom??null,
            maxCaptionBottom:viewport?viewport.getBoundingClientRect().top+viewport.getBoundingClientRect().height*.79:null
          };
        });
        if(!state.exists||!Number.isFinite(state.cameraScale)||state.cameraScale<1.05||
          state.cameraScale>1.13||!state.title||
          !Number.isFinite(state.subject)||state.subject<0||
          !Number.isFinite(state.reveal)||state.reveal<0||state.reveal>1)
          throw Error("Photo multi-motion missing sourced planes or invalid camera track: "+JSON.stringify(state));
        if(frame===40&&(state.reveal<=.1||state.reveal>=.98||state.subject<=0))
          throw Error("Photo mask and cutout do not move independently on their scheduled beats: "+JSON.stringify(state));
        if(frame===85&&(!state.focusCenter||!state.metric||
          !state.source.includes("synthétique")||!state.sourceHeight||state.sourceHeight<10||
          !state.sourceFontMobile||state.sourceFontMobile<10||
          !state.metricBottom||!state.captionTop||state.metricBottom>=state.captionTop-5))
          throw Error("Photo human-directed focus/metric overlays missing or overlapping: "+JSON.stringify(state));
        if(frame===145&&(state.reveal!==1||
          !state.captionBottom||!state.maxCaptionBottom||
          state.captionBottom>state.maxCaptionBottom))
          throw Error("Photo final reveal and mobile-safe caption failed: "+JSON.stringify(state));
        console.log("[player-smoke] genuine photo multilayer optics and mobile content",state);
      }
      if(mode.startsWith("data-")&&(frame===0||frame===80||frame===145)){
        const state=await page.evaluate(()=>{
          const root=document.querySelector('[data-wv-data-motion]');
          const chartMode=root?.getAttribute("data-wv-data-motion")??null;
          const title=document.querySelector('[data-wv-data-heading]');
          const scale=document.querySelector('[data-wv-data-scale]');
          const source=document.querySelector('[data-wv-data-provenance]');
          const caption=document.querySelector('[data-wv-data-caption]');
          const value=document.querySelector('[data-wv-data-key-metric]');
          const chart=document.querySelector('[data-wv-data-chart-boundary]');
          const viewport=document.querySelector('#smoke-preview');
          return {
            chartMode,scaleText:scale?.textContent??"",
            headingOpacity:title?Number(getComputedStyle(title).opacity):0,
            sourceText:source?.textContent??"",
            sourceOpacity:source?Number(getComputedStyle(source).opacity):0,
            sourceBottom:source?.getBoundingClientRect().bottom??NaN,
            sourceTop:source?.getBoundingClientRect().top??NaN,
            captionBottom:caption?.getBoundingClientRect().bottom??NaN,
            maxMobileBottom:viewport?viewport.getBoundingClientRect().top+
              viewport.getBoundingClientRect().height*.79:NaN,
            metricText:value?.textContent??"",
            chartBottom:chart?.getBoundingClientRect().bottom??NaN,
            metricTop:value?.getBoundingClientRect().top??NaN,
            metricBottom:value?.getBoundingClientRect().bottom??NaN,
            captionTop:caption?.getBoundingClientRect().top??NaN,
            chartLine:Boolean(document.querySelector('[data-wv-data-line-path]')),
            chartRank:Boolean(document.querySelector('[data-wv-data-ranking]')),
            chartHeat:Boolean(document.querySelector('[data-wv-data-heatmap]')),
            lineOffset:Number(document.querySelector('[data-wv-data-line-path]')?.getAttribute('stroke-dashoffset'))
          };
        });
        const expected=mode==="data-line"?"line":mode==="data-ranking"?"ranking":"heatmap";
        if(state.chartMode!==expected||!state.scaleText.includes("ÉCHELLE")||
          !state.scaleText.includes("TEST"))
          throw Error("DATA source scale or mode missing: "+JSON.stringify(state));
        if(frame===0&&state.headingOpacity<.14)
          throw Error("DATA first-frame visual has no headline: "+JSON.stringify(state));
        if(frame===80&&(
          expected==="line"&&(!state.chartLine||state.lineOffset<=.05||state.lineOffset>=.95)||
          expected==="ranking"&&!state.chartRank||
          expected==="heatmap"&&!state.chartHeat))
          throw Error("DATA chart did not animate sourced values: "+JSON.stringify(state));
        if(frame===145&&(!state.sourceText.includes("SIMULATION CI")||
          state.sourceOpacity<.95||!state.metricText.includes("TEST")||
          !Number.isFinite(state.sourceBottom)||state.sourceBottom>state.maxMobileBottom||
          !Number.isFinite(state.captionBottom)||state.captionBottom>state.sourceTop-7||
          !Number.isFinite(state.chartBottom)||state.chartBottom>state.metricTop-4||
          !Number.isFinite(state.metricBottom)||state.metricBottom>state.captionTop-4))
          throw Error("DATA chronology/unit/source mobile readability failed: "+JSON.stringify(state));
        console.log("[player-smoke] DATA source/scale/animation mobile contract",state);
      }
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
      input:mode==="clip"?"locally supplied synthetic H.264 video as blob":mode==="document"?"synthetic abstract paper, no original facts or excerpts":mode==="geo"?"natural earth atlas, synthetic labelled map route, supplied fixture image and fictive counter":mode==="country"?"Natural Earth 50m/10m atlas, synthetic landscape and fictive counter; not reportage":mode==="photo"?"One original synthetic image and alpha PNG, independent mask/camera/focus/data/type; not journalism":mode.startsWith("data-")?"Explicit fictitious data with source/date/unit/domain; not live markets":mode==="editorial"?"Five linked genuine scene grammars with fictional media and explicit non-speech continuous oscillator":"original synthetic picture; "+(expectVoice?"local synthetic WAV tone":"no voice"),
      composition:"exact shared CreativeEdit.tsx — no CSS animation duplication",
      screen:{width:390,height:844},
      frames_in_composition:expectedDuration,
      browser_errors:0,
      screenshots,
      warning:"This confirms Chromium animation and source integration, NOT artistic quality, iOS Safari or production publication rights."
    };
    const dest=path.join(output,mode==="film"?"player-film-smoke.report.json":mode==="clip"?"player-clip-smoke.report.json":mode==="document"?"player-document-smoke.report.json":mode==="geo"?"player-geo-smoke.report.json":mode==="country"?"player-country-smoke.report.json":mode==="photo"?"player-photo-smoke.report.json":mode.startsWith("data-")?"player-"+mode+"-smoke.report.json":mode==="editorial"?"player-editorial-smoke.report.json":"player-browser-smoke.report.json");
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
    console.log("[player-smoke] verifying complex orthographic geo animation");
    await testCase(browser,{mode:"geo",frames:[0,48,96,138],expectedDuration:150,expectVoice:false});
    console.log("[player-smoke] exercising true 50m/10m country focus and multiple concurrent layers");
    await testCase(browser,{mode:"country",frames:[0,60,115,155],expectedDuration:165,expectVoice:false});
    console.log("[player-smoke] verifying 2.5D photo still with six concurrent authored motion tracks");
    await testCase(browser,{mode:"photo",frames:[0,40,85,145],expectedDuration:165,expectVoice:false});
    console.log("[player-smoke] verifying standalone DATA charts with explicit source/date/axis");
    await testCase(browser,{mode:"data-line",frames:[0,80,145],expectedDuration:165,expectVoice:false});
    await testCase(browser,{mode:"data-ranking",frames:[0,80,145],expectedDuration:165,expectVoice:false});
    await testCase(browser,{mode:"data-heatmap",frames:[0,80,145],expectedDuration:165,expectVoice:false});
    console.log("[player-smoke] real connected film: GEO→PAYS→PHOTO→DATA→DOCUMENT + oscillator");
    await testCase(browser,{mode:"editorial",
      frames:[0,70,145,230,300,375,455,520,610,686,742],
      expectedDuration:745,expectVoice:true});
    console.log("[player-smoke] all eleven real Player paths passed");
  }finally{
    await browser.close();
  }
}
main().catch(e=>{console.error("[player-smoke] "+String(e?.stack??e));process.exitCode=1;});
