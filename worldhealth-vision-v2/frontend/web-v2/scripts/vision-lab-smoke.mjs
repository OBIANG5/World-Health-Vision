/**
 * Design review, NOT end-to-end Atlas acceptance.
 * Opens the isolated HTML concept directly, never starts the production App.
 * All scene data are text-only geographic references, never live statistics.
 */
import assert from "node:assert/strict";
import {spawn} from "node:child_process";
import {mkdirSync} from "node:fs";
import {chromium} from "playwright";
const origin="http://127.0.0.1:5387";
const pause=ms=>new Promise(r=>setTimeout(r,ms));
const server=spawn("python3",["-m","http.server","5387","--bind","127.0.0.1","--directory","public"],{stdio:"ignore"});
mkdirSync("design-artifacts",{recursive:true});
let browser;
try{
  let ready=false;
  for(let i=0;i<50;i++){try{ready=(await fetch(origin+"/vision-lab/index.html")).ok;if(ready)break;}catch{}await pause(200);}
  assert(ready,"Isolated design lab must serve without Vite, Gateway or fake backend");
  browser=await chromium.launch({headless:true,args:["--no-sandbox"],
    ...(process.env.WHV_BROWSER_CHANNEL?{channel:process.env.WHV_BROWSER_CHANNEL}:{})});
  const sizes=[{name:"mobile-320",width:320,height:700},{name:"iphone-390",width:390,height:844},
    {name:"tablet-820",width:820,height:1180},{name:"desktop-1440",width:1440,height:900}];
  let count=0;
  for(const concept of ["a","b","c"]){
    for(const size of sizes){
      const page=await browser.newPage({viewport:{width:size.width,height:size.height},deviceScaleFactor:1,
        isMobile:size.width<=390,hasTouch:size.width<=390});
      const runtime=[];
      page.on("pageerror",e=>runtime.push(e.message));
      await page.goto(origin+"/vision-lab/index.html?concept="+concept+"&screen=home",{waitUntil:"domcontentloaded"});
      await page.locator(".home-hero").waitFor({state:"visible"});
      await page.waitForFunction(() => document.querySelector(".earth-img")?.complete,
        null,{timeout:8500}).catch(() => {});
      assert.equal(await page.locator("#app").getAttribute("data-concept"),concept);
      const chosen=page.locator('[data-concept-select="'+concept+'"]');
      assert.equal(await chosen.getAttribute("aria-pressed"),"true");
      const startText=await page.locator("#screen-home").innerText();
      assert(startText.includes("Le monde.")&&startText.includes("Un pays, dans toutes ses dimensions"));
      assert(!startText.includes("PIB de démonstration"),
        "The lab must never claim invented numerical coverage");
      // Capture both same-framed screens for real human comparison.
      if(["iphone-390","desktop-1440"].includes(size.name)){
        await page.screenshot({path:"design-artifacts/"+concept+"-"+size.name+"-accueil.png"});
      }
      if(size.name==="iphone-390"){
        await page.locator(".search-trigger").click();
        const dialog=page.locator("#country-search");
        await dialog.waitFor({state:"visible"});
        await dialog.locator("input").fill("gabon");
        assert(await dialog.locator('[data-go="country"]').isVisible(),
          "Country search must offer a real, explicit prototype result");
        await dialog.locator('[data-go="country"]').click();
        assert.equal(await dialog.isVisible(),false,"Search must close on navigation");
      }else{
        await page.locator('.hero-actions [data-go="country"]').click();
      }
      await page.locator("#screen-country").waitFor({state:"visible"});
      assert.equal(await page.locator("#screen-country h1").innerText(),"Gabon");
      const tabs=page.locator('.country-tabs-inner button');
      assert.equal(await tabs.count(),6,"News remains only 1 of 6 country rubrics");
      assert.equal(await tabs.filter({hasText:"Vue d'ensemble"}).getAttribute("aria-selected"),"true");
      assert(await page.locator('[data-section-panel="overview"]').isVisible());
      assert(!(await page.locator('[data-section-panel="news"]').isVisible()));
      assert((await page.locator(".facts-strip").innerText()).includes("Libreville"));
      await page.waitForFunction(() => document.querySelector('.country-photo img')?.complete,
        null, { timeout: 12000 }).catch(() => {});
      const photoLoaded = await page.locator('.country-photo img').evaluate(el => el.complete && el.naturalWidth > 0);
      assert(photoLoaded, "Human design review screenshots must have their licensed source photograph fully loaded");

      if(["iphone-390","desktop-1440","mobile-320"].includes(size.name)){
        await page.screenshot({path:"design-artifacts/"+concept+"-"+size.name+"-gabon.png"});
      }
      const docSize=await page.evaluate(()=>({scroll:document.documentElement.scrollWidth,client:document.documentElement.clientWidth}));
      assert(docSize.scroll<=docSize.client+2,
        "No horizontal document overflow in country on "+concept+" "+size.name+": "+JSON.stringify(docSize));
      await tabs.filter({hasText:"Données"}).click();
      assert(await page.locator('[data-section-panel="data"]').isVisible());
      assert(!(await page.locator('[data-section-panel="overview"]').isVisible()));
      if(size.name==="desktop-1440")
        await page.screenshot({path:"design-artifacts/"+concept+"-desktop-1440-donnees.png"});
      await page.locator('[data-section="news"]').first().click();
      assert(await page.locator('[data-section-panel="news"]').isVisible());
      assert(!(await page.locator('[data-section-panel="overview"]').isVisible()));
      await page.locator('.context-side [data-go="compare"]').first().click();
      assert(await page.locator("#screen-compare").isVisible());
      await page.locator("#screen-compare [data-go=country]").first().click();
      assert(await page.locator('[data-section-panel="overview"]').isVisible());
      await page.locator('.context-side [data-go="markets"]').first().click();
      assert(await page.locator("#screen-markets").isVisible());
      if(size.name==="desktop-1440")
        await page.screenshot({path:"design-artifacts/"+concept+"-desktop-1440-marches.png"});
      const overflow=await page.evaluate(()=>({scroll:document.documentElement.scrollWidth,client:document.documentElement.clientWidth}));
      assert(overflow.scroll<=overflow.client+2,"No overflow on markets: "+JSON.stringify({concept,size,overflow}));
      assert.deepEqual(runtime,[],"No page errors in design review concept "+concept+"/"+size.name);
      if(size.name==="iphone-390"){
        const imageState=await page.evaluate(()=>[...document.images].map(i=>({url:i.currentSrc,
          loaded:i.complete&&i.naturalWidth>0})));
        console.log("IMAGE_AUDIT",concept,JSON.stringify(imageState));
      }
      await page.close();count++;
    }
  }
  console.log("VISION_LAB_PASS",count,"concept-size combinations; 3 compositions; 4 viewports; country-first; no invented data");
}catch(error){console.error("VISION_LAB_FAIL",error);process.exitCode=1;}
finally{if(browser)await browser.close();server.kill("SIGTERM");}
