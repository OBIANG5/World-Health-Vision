import {chromium} from "playwright";
import assert from "node:assert/strict";
import {spawn} from "node:child_process";
import {mkdirSync} from "node:fs";

const server=spawn("python3",["-m","http.server","5187","--bind","127.0.0.1","--directory","dist"],{stdio:"ignore"});
const browser=await chromium.launch({headless:true,args:["--no-sandbox"]});
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
mkdirSync("globe-artifacts",{recursive:true});
try{
 let live=false;
 for(let i=0;i<40;i++){try{const r=await fetch("http://127.0.0.1:5187/countries.geojson");if(r.ok){live=true;break}}catch{}await sleep(300);}
 assert(live,"V2 server not ready");
 for(const screen of [{name:"iphone",width:390,height:844,isMobile:true,hasTouch:true},
 {name:"desktop",width:1440,height:900,isMobile:false,hasTouch:false}]){
  const page=await browser.newPage({viewport:{width:screen.width,height:screen.height},
    deviceScaleFactor:1,isMobile:screen.isMobile,hasTouch:screen.hasTouch});
  const errors=[],assetFailures=[];
  page.on("pageerror",e=>errors.push(e.message));
  page.on("response",r=>{if(r.status()>=400&&r.url().includes("/assets/"))assetFailures.push(r.url())});
  await page.goto("http://127.0.0.1:5187/",{waitUntil:"domcontentloaded"});
  const globe=page.locator("canvas.whv-globe-canvas");
  await globe.waitFor({state:"visible",timeout:20000});
  await page.waitForFunction(()=>!document.querySelector(".whv-globe-status"),null,{timeout:25000});
  assert.equal(await page.locator(".whv-map-mode-switch").count(),0,"Obsolete map option must be removed");
  assert.equal(await page.locator(".eye-map-surface").count(),0,"Retired Leaflet eye must not render");
  const box=await globe.boundingBox();
  assert(box&&box.width>200&&box.height>180,screen.name+" globe viewport too small");
  const colors=await globe.evaluate(el=>{
   const ctx=el.getContext("2d");
   const {data}=ctx.getImageData(0,0,el.width,el.height);
   let white=0,cyan=0,green=0,sand=0,blue=0;
   for(let i=0;i<data.length;i+=4*17){
    const r=data[i],g=data[i+1],b=data[i+2];
    if(r>230&&g>230&&b>230)white++;
    if(b>195&&g>150&&r<165)cyan++;
    if(g>75&&g>r*1.1&&g>b*.8)green++;
    if(r>150&&g>80&&b<140) sand++;
    if(b>80&&b>g*1.15&&b>r*1.5)blue++;
   }
   return {white,cyan,green,sand,blue};
  });
  assert(colors.white>50,screen.name+" missing white eye "+JSON.stringify(colors));
  assert(colors.cyan>25,screen.name+" missing bright eye ring "+JSON.stringify(colors));
  assert(colors.green>25,screen.name+" missing green land "+JSON.stringify(colors));
  assert(colors.sand>15,screen.name+" missing Sahara gold "+JSON.stringify(colors));
  assert(colors.blue>500,screen.name+" missing vibrant ocean "+JSON.stringify(colors));
  const before=await globe.evaluate(el=>el.toDataURL());
  const x=box.x+box.width*.5,y=box.y+box.height*.51;
  await page.mouse.move(x,y);await page.mouse.down();
  await page.mouse.move(x+68,y+14,{steps:10});await page.mouse.up();
  await page.waitForTimeout(200);
  const after=await globe.evaluate(el=>el.toDataURL());
  assert.notEqual(before,after,screen.name+" Earth did not turn");
  await page.screenshot({path:"globe-artifacts/"+screen.name+"-electric-eye.png",fullPage:true});
  await globe.click({position:{x:box.width*.5,y:box.height*.51}});
  await page.locator(".country-drawer.open").waitFor({state:"visible",timeout:15000});
  await page.locator(".country-drawer.open .drawer-btn.close").click();
  assert.deepEqual(errors,[],screen.name+" JS errors");
  assert.deepEqual(assetFailures,[],screen.name+" assets failed");
  console.log("PASS "+screen.name+" Electric Earth: real GeoJSON, white eye, cyan/green/sand/blue, drag, country drilldown");
  await page.close();
 }
}finally{await browser.close();server.kill("SIGTERM")}
