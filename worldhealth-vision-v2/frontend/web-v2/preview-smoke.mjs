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
}finally{
  if(browser)await browser.close();
  server.kill("SIGTERM");
}
