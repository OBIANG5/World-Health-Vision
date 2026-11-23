#!/usr/bin/env node
/**
 * Real Chromium roundtrip against the existing V2 edit interface.
 * All external sources are synthetic local fixture bytes from this CI job.
 */
import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import puppeteer from "puppeteer-core";

const target="http://127.0.0.1:5173/studio-project-smoke.html";
const chromeCandidates=[process.env.WV_TEST_CHROME,process.env.PUPPETEER_EXECUTABLE_PATH,
 "/usr/bin/google-chrome","/usr/bin/google-chrome-stable","/usr/bin/chromium","/usr/bin/chromium-browser"].filter(Boolean);
const browserPath=chromeCandidates.find(p=>fs.existsSync(p));
if(!browserPath)throw Error("Chrome/Chromium not found");
const output=path.resolve("output/creative");
fs.mkdirSync(output,{recursive:true});
const sleep=n=>new Promise(resolve=>setTimeout(resolve,n));
for(let i=0;i<40;i++){
 try{if((await fetch(target)).ok)break;}catch{}
 await sleep(350);
 if(i===39)throw Error("Private Vite Studio smoke page unavailable");
}
const browser=await puppeteer.launch({executablePath:browserPath,headless:true,
 args:["--no-sandbox","--disable-setuid-sandbox","--disable-dev-shm-usage"]});
const tmp=fs.mkdtempSync(path.join(os.tmpdir(),"worldvision-reimport-"));
const page=await browser.newPage();
const errors=[];
page.on("pageerror",e=>errors.push(String(e)));
try{
 await page.setViewport({width:390,height:844,deviceScaleFactor:1});
 await page.goto(target,{waitUntil:"domcontentloaded",timeout:35000});
 await page.waitForSelector("#wvc-load-project",{timeout:30000});
 const saved={
   schema_version:"worldvision-creative-project-v1",id:"wv-reprise-test",
   title:"REPRISE TECHNIQUE 2026",script:"Cette production est une simulation. Aucun fait journalistique.",
   aspect_ratio:"9:16",fps:30,
   style:{background:"#0b1721",ink:"#f6f8fa",accent:"#8bbecf"},
   directorBeats:[{id:"beat-test-01",shotId:"plan-01",startFrame:0,endFrame:60,intent:"hook",
     idea:"Une seule idée vérifiable",spokenExcerpt:"Cette production est une simulation.",
     proofNote:"Matériaux locaux simulés pour test CI uniquement",
     visualDirection:"Révéler la photographie source dans le moteur Remotion",
     audioDirection:"Accent synthétique sourcé à 1,2 seconde"}],
   soundCues:[{file:"click-synthetic.wav",startFrame:36,durationFrames:12,volume:.25,
     label:"Son synthétique de test CI"}],
   captions:[{startFrame:1,endFrame:45,text:"SRT importé et préservé",position:"upper"},
     {startFrame:48,endFrame:95,text:"Deuxième sous-titre retenu",position:"lower"}],
   shots:[{id:"plan-01",durationFrames:105,template:"focus_reveal",
     title:"UNE IMAGE FOURNIE",subtitle:"Aucune actualité",eyebrow:"SIMULATION CI",
     motion:"dolly",transitionAfter:"cut",transitionFrames:0,
     media:{kind:"image",file:"synthetic-landscape.png",credit:"SIMULATION CI"}}],
   voice:null,music:null,outro:null
 };
 const good=path.join(tmp,"worldvision-reopen.json");
 fs.writeFileSync(good,JSON.stringify(saved));
 await (await page.$("#wvc-load-project")).uploadFile(good);
 // Fail rapidly with the actual Studio validator result; waiting only for a
 // changed title used to hide a rejected import behind a 30s timeout.
 await page.waitForFunction(()=>
   document.querySelector("#wvc-project")?.value==="REPRISE TECHNIQUE 2026"||
   Array.from(document.querySelectorAll(".wvc-feedback"))
     .some(x=>x.textContent?.includes("Import refusé")),
   {timeout:12000});
 const importDiag=await page.evaluate(()=>({
   title:document.querySelector("#wvc-project")?.value,
   feedback:document.querySelector(".wvc-feedback")?.textContent||"",
   errors:Array.from(document.querySelectorAll('[role="alert"]')).map(x=>x.textContent||"")
 }));
 if(importDiag.title!=="REPRISE TECHNIQUE 2026")
   throw Error("Studio project reimport rejected: "+JSON.stringify(importDiag));
 const missing=await page.evaluate(()=>({
   alert:document.querySelector('[role="alert"]')?.textContent||"",
   exportDisabled:document.querySelector("button.wvc-export-test")?.disabled??
     Array.from(document.querySelectorAll("button")).find(x=>x.textContent?.includes("Exporter le projet"))?.disabled,
   captions:document.querySelector("#wvc-captions")?.value||"",
   selected:document.querySelector(".wvc-shot.selected")?.textContent||""
 }));
 if(!missing.alert.includes("synthetic-landscape.png")||!missing.alert.includes("click-synthetic.wav")||!missing.exportDisabled||
    !missing.captions.includes("SRT importé et préservé")||!missing.selected.includes("UNE IMAGE FOURNIE"))
    throw Error("Studio silently replaced missing media or lost caption/shot: "+JSON.stringify(missing));
 // This media is synthetic and was created by the existing CI fixture builder.
 const photo=path.resolve("../../frontend/web-v2/public/smoke/synthetic-landscape.png");
 if(!fs.existsSync(photo))throw Error("Smoke photo fixture missing");
 // Generate an actual local WAV (1 s PCM), not an external protected sound.
 const wavPath=path.join(tmp,"click-synthetic.wav");
 const samples=48000,dataBytes=samples*2;
 const wav=Buffer.alloc(44+dataBytes);
 wav.write("RIFF",0);wav.writeUInt32LE(36+dataBytes,4);wav.write("WAVE",8);
 wav.write("fmt ",12);wav.writeUInt32LE(16,16);wav.writeUInt16LE(1,20);
 wav.writeUInt16LE(1,22);wav.writeUInt32LE(48000,24);wav.writeUInt32LE(96000,28);
 wav.writeUInt16LE(2,32);wav.writeUInt16LE(16,34);wav.write("data",36);
 wav.writeUInt32LE(dataBytes,40);
 for(let i=0;i<samples;i++)
   wav.writeInt16LE(Math.round(2500*Math.sin(2*Math.PI*440*i/48000)),44+i*2);
 fs.writeFileSync(wavPath,wav);
 await (await page.$("#wvc-import")).uploadFile(photo,wavPath);
 await page.waitForFunction(()=>Array.from(document.querySelectorAll("button"))
   .some(b=>b.textContent?.includes("Exporter le projet")&&!b.disabled),{timeout:15000});
 const valid=await page.evaluate(()=>({
   title:document.querySelector("#wvc-project")?.value||"",
   captions:document.querySelector("#wvc-captions")?.value||"",
   missing:Array.from(document.querySelectorAll('[role="alert"]')).map(x=>x.textContent||""),
   exportEnabled:Array.from(document.querySelectorAll("button"))
      .some(x=>x.textContent?.includes("Exporter le projet")&&!x.disabled)
 }));
 if(valid.missing.some(x=>x.includes("synthetic-landscape.png")||x.includes("click-synthetic.wav"))||!valid.exportEnabled)
   throw Error("Asset reconnection did not restore editability: "+JSON.stringify(valid));
 // Capture the JSON Blob the real button generates, without relying on filesystem downloads.
 await page.evaluate(()=>{
   window.__wvExportedJson=null;
   const real=URL.createObjectURL.bind(URL);
   URL.createObjectURL=(blob)=>{
     if(blob?.type==="application/json")blob.text().then(text=>{window.__wvExportedJson=text;});
     return real(blob);
   };
 });
 await page.evaluate(()=>{
   Array.from(document.querySelectorAll("button"))
     .find(x=>x.textContent?.includes("Exporter le projet"))?.click();
 });
 await page.waitForFunction(()=>Boolean(window.__wvExportedJson),{timeout:15000});
 const exported=JSON.parse(await page.evaluate(()=>window.__wvExportedJson));
 if(exported.id!==saved.id||exported.title!==saved.title||exported.script!==saved.script||
    exported.shots[0]?.media?.file!==saved.shots[0].media.file||
    exported.shots[0]?.media?.credit!=="SIMULATION CI"||
    exported.captions?.length!==2||exported.captions[1].position!=="lower"||
    exported.shots[0]?.durationFrames!==105||
    JSON.stringify(exported.directorBeats)!==JSON.stringify(saved.directorBeats)||
    JSON.stringify(exported.soundCues)!==JSON.stringify(saved.soundCues))
    throw Error("Export after import silently modified a source, cue or timeline: "+JSON.stringify(exported));

 // One real click must open the ORIGINAL Remotion composition on the beat,
 // not an isolated mute shot or a separate mockup viewer.
 const reviewEnabled=await page.evaluate(()=>Array.from(document.querySelectorAll("button"))
   .some(x=>x.textContent?.includes("Écouter en contexte")&&!x.disabled));
 if(!reviewEnabled)throw Error("Contextual beat review disabled despite valid reimport.");
 await page.evaluate(()=>Array.from(document.querySelectorAll("button"))
   .find(x=>x.textContent?.includes("Écouter en contexte"))?.click());
 await page.waitForFunction(()=>Boolean(document.querySelector(
   '[aria-label^="Révision ciblée du plan plan-01"]'
 )),{timeout:20000});
 // Negative file must never erase the currently restored production.
 const bad=path.join(tmp,"bad-project.json");
 fs.writeFileSync(bad,JSON.stringify({...saved,schema_version:"worldvision-other-project",title:"MALICIOUS OVERWRITE"}));
 await (await page.$("#wvc-load-project")).uploadFile(bad);
 await page.waitForFunction(()=>Array.from(document.querySelectorAll('[role="status"]')).some(x=>x.textContent?.includes("Import refusé")),{timeout:15000});
 const title=await page.$eval("#wvc-project",el=>el.value);
 if(title!=="REPRISE TECHNIQUE 2026")throw Error("Invalid JSON overwrote user edit");
 if(errors.length)throw Error("Browser errors: "+errors.join(" / "));
 const screenshot=path.join(output,"studio-reimport-mobile-390.png");
 await page.screenshot({path:screenshot,fullPage:true,type:"png"});
 const report={status:"PASS",source:"CI synthetic local project and photo",
  viewport:{width:390,height:844},missingBeforeRebind:missing,
  afterRebind:valid,roundtripExportVerified:true,
  mixedCaptionPositionsPreserved:true, directorBeatsPreserved:true,
  licensedSourceSoundCuesPreserved:true, contextualBeatPlayerOpened:true,
  invalidImportPreservedTitle:title,screenshot};
 fs.writeFileSync(path.join(output,"studio-reimport-browser.report.json"),JSON.stringify(report,null,2)+"\n");
 console.log(JSON.stringify(report));
}finally{
 await page.close();
 await browser.close();
 fs.rmSync(tmp,{recursive:true,force:true});
}
