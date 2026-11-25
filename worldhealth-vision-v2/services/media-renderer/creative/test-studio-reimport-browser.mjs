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
 // Separate UI-only synthetic example for word-level captions. The WAV is
 // an oscillator, NOT speech; this tests preservation/interaction, NOT alignment
 // accuracy or real human-voice approval. No caption is fabricated from audio.
 const wordSaved={
   ...saved,id:"wv-aligned-ui-test",title:"ALIGNEMENT UI - SIMULATION CI",
   script:"VOIR LE MONDE.",captions:undefined,directorBeats:undefined,soundCues:undefined,
   shots:[{id:"plan-01",durationFrames:105,template:"kinetic",
     title:"SIMULATION NON JOURNALISTIQUE",subtitle:"Aucun alignement acoustique vérifié",
     eyebrow:"FIXTURE TECHNIQUE",motion:"locked",
     transitionAfter:"cut",transitionFrames:0}],
   voice:{file:"click-synthetic.wav",label:"Voix choisie ou enregistrée",volume:1},
   wordCaptions:[
     {text:"VOIR",startFrame:0,endFrame:8,emphasis:true},
     {text:"LE",startFrame:8,endFrame:14,emphasis:false},
     {text:"MONDE.",startFrame:14,endFrame:25,emphasis:false}
   ]
 };
 const alignedPath=path.join(tmp,"word-aligned-ui.json");
 fs.writeFileSync(alignedPath,JSON.stringify(wordSaved));
 await (await page.$("#wvc-load-project")).uploadFile(alignedPath);
 try{
   await page.waitForFunction(()=>
     document.querySelector("#wvc-project")?.value==="ALIGNEMENT UI - SIMULATION CI",
     {timeout:12000});
 }catch(error){
   const feedback=await page.$eval(".wvc-feedback",el=>el.textContent||"");
   throw Error("Aligned word project failed to reopen: "+feedback+" | "+String(error));
 }
 const checkWords=await page.evaluate(()=>({
   title:document.querySelector("#wvc-project")?.value,
   feedback:document.querySelector(".wvc-feedback")?.textContent,
   count:document.querySelectorAll(".wvc-word-cues button").length,
   voiceLocked:document.querySelector("#wvc-voice")?.disabled,
   srtLocked:!document.querySelector("#wvc-captions")||
     document.querySelector("#wvc-captions")?.disabled,
   competingSrtPositionHidden:!document.querySelector("#wvc-caption-position")
 }));
 if(checkWords.title!=="ALIGNEMENT UI - SIMULATION CI"||checkWords.count!==3||
   !checkWords.voiceLocked||!checkWords.srtLocked||!checkWords.competingSrtPositionHidden)
   throw Error("Source-aligned captions were lost or editable voice/SRT leaked: "+JSON.stringify(checkWords));
 await page.evaluate(()=>document.querySelector(".wvc-word-cues button")?.click());
 await page.waitForFunction(()=>document.querySelector(".wvc-word-cues button")?.getAttribute("aria-pressed")==="false",
   {timeout:12000});
 const toggled=await page.$eval(".wvc-word-cues button",button=>button.getAttribute("aria-pressed"));
 if(toggled!=="false")throw Error("Exact word highlight toggle was not applied.");
 await page.evaluate(()=>{window.__wvExportedJson=null;});
 await page.evaluate(()=>Array.from(document.querySelectorAll("button"))
   .find(x=>x.textContent?.includes("Exporter le projet"))?.click());
 await page.waitForFunction(()=>Boolean(window.__wvExportedJson),{timeout:15000});
 const wordsExported=JSON.parse(await page.evaluate(()=>window.__wvExportedJson));
 if(wordsExported.script!==wordSaved.script||wordsExported.voice?.file!==wordSaved.voice.file||
    wordsExported.captions?.length||
    wordsExported.wordCaptions?.length!==3||
    wordsExported.wordCaptions[0].emphasis!==false||
    wordsExported.wordCaptions[1].text!=="LE"||
    JSON.stringify(wordsExported.wordCaptions.map(w=>[w.startFrame,w.endFrame]))!==
      JSON.stringify(wordSaved.wordCaptions.map(w=>[w.startFrame,w.endFrame])))
   throw Error("Word highlights altered approved script, original timings or chosen voice.");
 // The actual shared Remotion film Player must instantiate (not a CSS preview).
 await page.evaluate(()=>Array.from(document.querySelectorAll(".wvc-preview-switch button"))
   .find(x=>x.textContent?.includes("Film entier"))?.click());
 await page.waitForFunction(()=>Boolean(document.querySelector(
   '[aria-label="Visionnage du reportage intégral avec ses transitions et les pistes audio sélectionnées"]'
  )),{timeout:20000});
 const hostileWordProject=path.join(tmp,"bad-word-alignment.json");
 fs.writeFileSync(hostileWordProject,JSON.stringify({...wordSaved,title:"HIDDEN SOURCE OVERRIDE",
   wordCaptions:[{...wordSaved.wordCaptions[0],text:"FAUX"},...wordSaved.wordCaptions.slice(1)]}));
 await (await page.$("#wvc-load-project")).uploadFile(hostileWordProject);
 await page.waitForFunction(()=>Array.from(document.querySelectorAll(".wvc-feedback"))
   .some(x=>x.textContent?.includes("Import refusé")),{timeout:15000});
 if((await page.$eval("#wvc-project",el=>el.value))!=="ALIGNEMENT UI - SIMULATION CI")
   throw Error("Mismatched alignment overwrote the approved spoken-word project.");

 // End-to-end consumer of the real Remotion PHOTO comparison engine:
 // approved word timing -> same authored beat -> existing sourced PHOTO×DATA
 // reveal -> original-clock SFX. These numbers/pixels are explicitly fictional.
 const photoSaved={
   ...wordSaved,id:"wv-photo-voice-sync",title:"PHOTO + VOIX - SIMULATION CI",
   script:"UNE PREUVE CHANGE TOUT.",
   wordCaptions:[
     {text:"UNE",startFrame:0,endFrame:20,emphasis:false},
     {text:"PREUVE",startFrame:48,endFrame:64,emphasis:true},
     {text:"CHANGE",startFrame:64,endFrame:85,emphasis:false},
     {text:"TOUT.",startFrame:85,endFrame:120,emphasis:false}
   ],
   directorBeats:[{id:"beat-ci-proof",shotId:"plan-01",
     startFrame:132,endFrame:160,intent:"rehook",
     idea:"Un nouveau résultat fictif change l'interprétation",
     spokenExcerpt:"PREUVE CHANGE",proofNote:"Fixture artificielle non publiable",
     visualDirection:"Une comparaison approuvée entre les deux catégories simulées",
     audioDirection:"WAV d'essai raccordé au mot effectivement aligné"}],
   soundCues:[{file:"click-synthetic.wav",startFrame:118,durationFrames:10,
     volume:.2,label:"SFX artificiel uniquement pour test"}],
   shots:[{
     id:"plan-01",template:"photo_story",durationFrames:180,
     title:"PREUVE EN IMAGE",subtitle:"Chiffres artificiels - NON journalistique",
     eyebrow:"SIMULATION CI",motion:"locked",transitionAfter:"cut",transitionFrames:0,
     media:{kind:"image",file:"synthetic-landscape.png",credit:"Simulation CI"},
     photo:{
       camera:{zoomFrom:1.05,zoomTo:1.13,panX:18,panY:-14,startFrame:0,endFrame:132},
       comparison:{title:"Exemple sans données réelles",
         first:{label:"A",value:12},second:{label:"B",value:18},
         domain:{min:0,max:20},unit:"points",precision:0,locale:"fr-FR",
         source:{publisher:"Simulation CI",dataset:"Fixture artificielle",asOf:"2026-11-23"},
         startFrame:100,endFrame:148}
     }
   }]
 };
 const photoPath=path.join(tmp,"photo-voice-sync-ui.json");
 fs.writeFileSync(photoPath,JSON.stringify(photoSaved));
 await (await page.$("#wvc-load-project")).uploadFile(photoPath);
 try{
   await page.waitForFunction(()=>
     document.querySelector("#wvc-project")?.value==="PHOTO + VOIX - SIMULATION CI",
     {timeout:12000});
 }catch(error){
   throw Error("PHOTO edit reimport failed: "+await page.$eval(".wvc-feedback",el=>el.textContent||"")+" / "+String(error));
 }
 await page.evaluate(()=>{
   Array.from(document.querySelectorAll(".wvc-director-row button"))
     .find(button=>button.textContent?.includes("Caler à la voix"))?.click();
 });
 await page.waitForFunction(()=>Array.from(document.querySelectorAll(".wvc-director-row strong"))
   .some(el=>el.textContent?.includes("beat-ci-proof")&&el.textContent.includes("1.60")),{timeout:10000});
 const photoLinkButton=await page.evaluate(()=>Array.from(document.querySelectorAll(".wvc-director-row button"))
   .find(button=>button.textContent?.includes("Caler PHOTO×DATA"))?.disabled??null);
 if(photoLinkButton!==false)throw Error("Sourced PHOTO×DATA layer did not become actionable.");
 await page.evaluate(()=>Array.from(document.querySelectorAll(".wvc-director-row button"))
   .find(button=>button.textContent?.includes("Caler PHOTO×DATA"))?.click());
 await page.waitForFunction(()=>document.querySelector(".wvc-feedback")?.textContent?.includes("Piste comparison calée"),
   {timeout:10000});
 await page.select(".wvc-sfx-beat-link select","beat-ci-proof");
 await page.waitForFunction(()=>document.querySelector(".wvc-feedback")?.textContent?.includes("Effet sonore existant calé"),
   {timeout:10000});
 await page.evaluate(()=>{window.__wvExportedJson=null;});
 await page.evaluate(()=>Array.from(document.querySelectorAll("button"))
   .find(button=>button.textContent?.includes("Exporter le projet"))?.click());
 await page.waitForFunction(()=>Boolean(window.__wvExportedJson),{timeout:12000});
 const linked=JSON.parse(await page.evaluate(()=>window.__wvExportedJson));
 if(linked.script!==photoSaved.script||linked.voice?.file!==photoSaved.voice.file||
   linked.shots[0]?.photo?.comparison?.startFrame!==48||
   linked.shots[0]?.photo?.comparison?.endFrame!==96||
   linked.shots[0]?.photo?.comparison?.source?.dataset!=="Fixture artificielle"||
   linked.shots[0]?.photo?.comparison?.first?.value!==12||
   linked.shots[0]?.photo?.comparison?.second?.value!==18||
   linked.directorBeats[0].startFrame!==48||linked.directorBeats[0].endFrame!==85||
   linked.soundCues[0].startFrame!==48||
   linked.soundCues[0].durationFrames!==10||
   JSON.stringify(linked.wordCaptions)!==JSON.stringify(photoSaved.wordCaptions))
   throw Error("Real PHOTO/data/voice/SFX retime lost approved facts, images or original time: "+
     JSON.stringify(linked));
 // The exact composition is on the film-mode Player, not an isolated fake shot.
 await page.evaluate(()=>Array.from(document.querySelectorAll(".wvc-preview-switch button"))
   .find(button=>button.textContent?.includes("Film entier"))?.click());
 await page.waitForFunction(()=>Boolean(document.querySelector(
   '[aria-label="Visionnage du reportage intégral avec ses transitions et les pistes audio sélectionnées"]'
  )),{timeout:18000});
 // A director must reach the real full-film Player in one tap, not by
 // scrolling through thousands of pixels of editable PHOTO/SFX fields.
 const quickNav=await page.evaluate(()=>({
   visible:document.querySelector('.wvc-quick-nav')?.getBoundingClientRect().height>40,
   position:getComputedStyle(document.querySelector('.wvc-quick-nav')).position,
   buttons:Array.from(document.querySelectorAll('.wvc-quick-nav button')).map(b=>b.textContent?.trim()),
   horizontalOverflow:document.documentElement.scrollWidth>window.innerWidth
 }));
 if(!quickNav.visible||quickNav.position!=='sticky'||
   quickNav.horizontalOverflow||quickNav.buttons.length!==3)
   throw Error('Professional mobile directing navigation is not usable: '+JSON.stringify(quickNav));
 await page.click('.wvc-quick-nav button:last-child');
 await page.waitForFunction(()=>{
   const preview=document.querySelector('#wvc-preview');
   return !!preview&&preview.getBoundingClientRect().top>=-20&&
     preview.getBoundingClientRect().top<180&&
     Array.from(document.querySelectorAll('.wvc-preview-switch button.selected'))
       .some(b=>b.textContent?.includes('Film entier'));
 },{timeout:12000});
 await page.click('.wvc-quick-nav button:nth-child(2)');
 await page.waitForFunction(()=>{
   const edit=document.querySelector('#wvc-directing');
   return !!edit&&edit.getBoundingClientRect().top>=-20&&
     edit.getBoundingClientRect().top<180;
 },{timeout:12000});
 // Back to source in the same persistent app state, not a second mobile app.
 await page.click('.wvc-quick-nav button:first-child');
 await page.waitForFunction(()=>{
   const source=document.querySelector('#wvc-sources');
   return !!source&&source.getBoundingClientRect().top>=-20&&
     source.getBoundingClientRect().top<180;
 },{timeout:12000});
 // Progressive controls protect MOBILE creative speed, but never discard
 // source data or hide the one-click voice/PHOTO/SFX actions.
 const mobileLayout=await page.evaluate(()=>({
   height:document.documentElement.scrollHeight,
   photoClosed:document.querySelector('details[data-wv-advanced="photo_story"]')?.open===false,
   beatClosed:document.querySelector('.wvc-beat-edit')?.open===false,
   syncActionVisible:Array.from(document.querySelectorAll('.wvc-director-row button'))
     .some(button=>button.textContent?.includes('Caler PHOTO×DATA')&&
       button.getBoundingClientRect().width>0)
 }));
 if(!mobileLayout.photoClosed||!mobileLayout.beatClosed||
    !mobileLayout.syncActionVisible||mobileLayout.height>=7100)
   throw Error('390px progressive editing did not reduce the old 8547px scroll: '+
     JSON.stringify(mobileLayout));
 await page.click('details[data-wv-advanced="photo_story"] > summary');
 await page.waitForFunction(()=>
   document.querySelector('details[data-wv-advanced="photo_story"]')?.open===true);
 const sourceFieldsPresent=await page.evaluate(()=>Boolean(
   document.querySelector('details[data-wv-advanced="photo_story"] input[type="number"]')));
 if(!sourceFieldsPresent)throw Error('Collapsed PHOTO panel discarded expert motion inputs');
 await page.click('details[data-wv-advanced="photo_story"] > summary');
 await page.waitForFunction(()=>
   document.querySelector('details[data-wv-advanced="photo_story"]')?.open===false);
 await page.click('.wvc-beat-edit > summary');
 await page.waitForFunction(()=>document.querySelector('.wvc-beat-edit')?.open===true);
 const evidencePreserved=await page.evaluate(()=>Array.from(
   document.querySelectorAll('.wvc-beat-edit textarea')).some(field=>
     field.value.includes('Fixture artificielle non publiable')));
 if(!evidencePreserved)throw Error('Beat expert disclosure lost authored proof note');
 await page.click('.wvc-beat-edit > summary');
 await page.waitForFunction(()=>document.querySelector('.wvc-beat-edit')?.open===false);
 if(errors.length)throw Error("Browser errors: "+errors.join(" / "));
 const screenshot=path.join(output,"studio-reimport-mobile-390.png");
 await page.screenshot({path:screenshot,fullPage:true,type:"png"});
 const report={status:"PASS",source:"CI synthetic local project and photo",
  viewport:{width:390,height:844},missingBeforeRebind:missing,
  afterRebind:valid,roundtripExportVerified:true,
  mixedCaptionPositionsPreserved:true, directorBeatsPreserved:true,
  licensedSourceSoundCuesPreserved:true, contextualBeatPlayerOpened:true,
  alignedWordImportExportVerified:true,sourceVoiceLocked:true,
  wordHighlightEditedWithoutChangingSourceTiming:true,
  invalidWordAlignmentRejected:true,
  actualPhotoComparisonAndSfxReframedToApprovedSpokenWord:true,
  progressiveMobileDisclosureVerified:true,mobilePageHeightPixels:mobileLayout.height,
  singleTapDirectorFilmNavigationVerified:true,duplicateSrtInputsHiddenWhenWordAligned:true,
  invalidImportPreservedTitle:title,screenshot};
 fs.writeFileSync(path.join(output,"studio-reimport-browser.report.json"),JSON.stringify(report,null,2)+"\n");
 console.log(JSON.stringify(report));
}finally{
 await page.close();
 await browser.close();
 fs.rmSync(tmp,{recursive:true,force:true});
}
