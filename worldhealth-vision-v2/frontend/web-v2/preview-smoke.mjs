import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { join } from "node:path";
import { chromium } from "playwright";

const server=spawn("npx",["vite","preview","--host","127.0.0.1","--port","4173"],{
  cwd:process.cwd(),stdio:"ignore",env:process.env
});
let browser;
try {
  let ready=false;
  for(let i=0;i<50;i++){
    try{const r=await fetch("http://127.0.0.1:4173");if(r.ok){ready=true;break;}}
    catch(_){}
    await new Promise(r=>setTimeout(r,250));
  }
  assert(ready,"Preview server did not start");

  browser=await chromium.launch({headless:true,args:["--no-sandbox"]});
  const phone=await browser.newPage({
    viewport:{width:390,height:844},deviceScaleFactor:1,
    isMobile:true,hasTouch:true
  });
  phone.setDefaultTimeout(15000);
  const jsErrors=[];
  phone.on("pageerror",error=>jsErrors.push(String(error)));
  await phone.goto("http://127.0.0.1:4173/",{waitUntil:"domcontentloaded"});
  await phone.locator(".whv-mobile-overview").waitFor({state:"visible"});
  await phone.locator(".eye-stage").waitFor({state:"visible"});
  await phone.locator(".whv-mobile-featured").waitFor({state:"visible"});
  await phone.screenshot({path:join("dist","preview-mobile-check.png")});
  const eye=await phone.locator(".eye-stage").boundingBox();
  const card=await phone.locator(".whv-mobile-overview").boundingBox();
  assert(eye && card && eye.width/eye.height>1.5,
    "Mobile eye is not correctly horizontal");
  assert(card.y>eye.y+eye.height,
    "Mobile overview covers the map");

  await phone.locator(".whv-nav-btn--tools").click();
  const menu=phone.locator(".whv-tools-menu");
  await menu.waitFor({state:"visible"});
  const bounds=await menu.boundingBox();
  assert(bounds && bounds.x>=0 && bounds.x+bounds.width<=400 &&
    bounds.y+bounds.height<=844,"Tools menu is clipped on phone");
  await phone.screenshot({path:join("dist","preview-mobile-tools.png")});
  await menu.locator("button").filter({hasText:"Pouvoir d'achat"}).click();
  await phone.locator(".pp-panel").waitFor({state:"visible"});
  await phone.locator(".pp-close-btn").click();
  await phone.locator(".pp-panel").waitFor({state:"hidden"});

  await phone.locator(".whv-mobile-shortcut").filter({hasText:"Pays"}).click();
  await phone.locator(".country-selector-popover").waitFor({state:"visible"});
  await phone.locator(".country-selector-search").fill("Gabon");
  await phone.locator(".country-selector-item").filter({hasText:"Gabon"}).click();
  await phone.locator(".country-drawer.open").waitFor({state:"visible"});
  await phone.screenshot({path:join("dist","preview-mobile-gabon.png")});
  assert((await phone.locator(".country-drawer.open").innerText()).includes("Gabon"));
  assert(jsErrors.length===0,"Client errors: "+jsErrors.slice(0,3).join("; "));
  console.log("OK: mobile eye, content, menus, purchasing power, Gabon country drawer.");

  const desktop=await browser.newPage({viewport:{width:1440,height:900}});
  await desktop.goto("http://127.0.0.1:4173/",{waitUntil:"domcontentloaded"});
  await desktop.locator(".whv-brand").waitFor({state:"visible"});
  assert(!(await desktop.locator(".whv-mobile-overview").isVisible()),
    "Mobile dashboard leaked to desktop layout");
  await desktop.screenshot({path:join("dist","preview-desktop-check.png")});
  console.log("OK: desktop source layout remains unchanged.");

  // Check the actual immutable CDN URL, not only the local Vite server.
  const publicContext=await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true});
  await publicContext.addCookies([{name:"__Http-phish",value:"1",domain:"rawcdn.githack.com",path:"/",httpOnly:true,secure:true}]);
  const publicPage=await publicContext.newPage();
  const cdnErrors=[],assetFailures=[];
  publicPage.on("pageerror",e=>cdnErrors.push(String(e)));
  publicPage.on("response",r=>{
    if(r.status()>=400)assetFailures.push(String(r.status())+" "+r.url());
  });
  const immutableUrl="https://rawcdn.githack.com/OBIANG5/World-Health-Vision/98fb74b5b556f2a6bd259a3caf79a713229f2c8c/index.html";
  const response=await publicPage.goto(immutableUrl,{waitUntil:"domcontentloaded",timeout:25000});
  await publicPage.screenshot({path:join("dist","preview-cdn-mobile-check.png")});
  try {
    await publicPage.locator(".whv-brand").waitFor({state:"visible",timeout:15000});
    await publicPage.locator(".whv-mobile-overview").waitFor({state:"visible",timeout:10000});
    assert(response?.status()===200,"CDN HTML HTTP status not 200");
    assert(cdnErrors.length===0,"CDN JS errors: "+cdnErrors.slice(0,5).join(";"));
    assert(assetFailures.filter(x=>x.includes("/assets/")).length===0,"CDN asset failures: "+assetFailures.slice(0,6).join(";"));
    console.log("OK: remote immutable CDN frontend renders on mobile Chromium.");
  } catch(err) {
    console.error("CDN diagnostics",JSON.stringify({http:response?.status(),title:await publicPage.title(),body:(await publicPage.locator("body").innerText()).slice(0,400),cdnErrors,assetFailures}));
    throw err;
  }
  await publicContext.close();

}finally{
  if(browser)await browser.close();
  server.kill("SIGTERM");
}
