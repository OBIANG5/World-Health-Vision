/**
 * Verify user reference-inspired colour globe without substituting a static
 * screenshot. The same canvas must render the eye, sphere, country boundaries
 * and remain interactive with touch/drag and keyboard/zoom.
 */
import assert from "node:assert/strict";
import {chromium} from "playwright";
import {spawn} from "node:child_process";
import {mkdirSync} from "node:fs";

const port="5216";
const origin="http://127.0.0.1:"+port;
const server=spawn("python3",["-m","http.server",port,"--bind","127.0.0.1","--directory","dist"],{stdio:"ignore"});
const pause=ms=>new Promise(resolve=>setTimeout(resolve,ms));
mkdirSync("reference-eye-artifacts",{recursive:true});
let browser;
try {
  let started=false;
  for(let attempt=0;attempt<55;attempt++){
    try{const r=await fetch(origin+"/countries.geojson");if(r.ok){started=true;break;}}catch{}
    await pause(250);
  }
  assert(started,"V2 country GeoJSON server not ready");
  browser=await chromium.launch({headless:true,args:["--no-sandbox"]});
  for(const device of [
    {name:"iphone-390",width:390,height:844,mobile:true},
    {name:"small-iphone-320",width:320,height:740,mobile:true},
    {name:"tablet-820",width:820,height:1100,mobile:false},
    {name:"desktop-1440",width:1440,height:900,mobile:false}
  ]){
    const page=await browser.newPage({
      viewport:{width:device.width,height:device.height},
      deviceScaleFactor:1,isMobile:device.mobile,hasTouch:device.mobile
    });
    const errors=[];
    page.on("pageerror",e=>errors.push(e.message));
    await page.goto(origin+"/",{waitUntil:"domcontentloaded"});
    const globe=page.locator("canvas.whv-globe-canvas");
    await globe.waitFor({state:"visible",timeout:30000});
    await page.waitForFunction(()=>!document.querySelector(".whv-globe-status"),
      null,{timeout:45000});
    assert.equal(await page.locator("canvas.whv-globe-canvas").count(),1,
      device.name+" must use the real globe (not duplicate screenshot)");
    assert.equal(await page.locator(".whv-map-mode-switch").count(),0,
      device.name+" must not reintroduce the retired map");
    const rect=await globe.boundingBox();
    assert(rect&&rect.width>=210&&rect.height>=180,
      device.name+" globe too small");
    const palette=await globe.evaluate(el=>{
      const ctx=el.getContext("2d");
      const image=ctx.getImageData(0,0,el.width,el.height);
      const d=image.data;
      let white=0,cyan=0,emerald=0,orange=0,blue=0,night=0;
      for(let i=0;i<d.length;i+=4*23){
        const r=d[i],g=d[i+1],b=d[i+2];
        if(r>241&&g>242&&b>242)white++;
        if(b>170&&g>145&&r<155)cyan++;
        if(g>55&&g>r*1.23&&g>b*.69)emerald++;
        if(r>145&&g>78&&b<148&&r>g*1.25)orange++;
        if(b>80&&b>g*1.18&&b>r*1.5)blue++;
        if(r<17&&g<39&&b<81)night++;
      }
      return {white,cyan,emerald,orange,blue,night};
    });
    for(const k of ["white","cyan","emerald","orange","blue","night"]){
      assert(palette[k]>7,device.name+" missing reference eye colour "+k+" "+JSON.stringify(palette));
    }
    await page.screenshot({path:"reference-eye-artifacts/"+device.name+"-eye-earth.png",fullPage:true});

    // A tap on the visible African land mass opens a real V2 country sheet.
    await globe.click({position:{x:rect.width*.5,y:rect.height*.51}});
    await page.locator(".country-drawer.open").waitFor({state:"visible",timeout:15000});
    await page.locator(".country-drawer.open .drawer-btn.close").click();
    const original=await globe.evaluate(el=>el.toDataURL());
    await page.mouse.move(rect.x+rect.width*.5,rect.y+rect.height*.51);
    await page.mouse.down();
    await page.mouse.move(rect.x+rect.width*.5+67,rect.y+rect.height*.51+13,{steps:9});
    await page.mouse.up();
    await page.waitForTimeout(200);
    assert.notEqual(await globe.evaluate(el=>el.toDataURL()),original,
      device.name+" lost globe rotation");
    await page.screenshot({path:"reference-eye-artifacts/"+device.name+"-rotated.png",fullPage:true});
    const zoom=page.getByRole("button",{name:"Agrandir le globe"});
    await zoom.click();
    await page.waitForTimeout(160);
    assert.deepEqual(errors,[],device.name+" browser exceptions");
    console.log("PASS",device.name,"reference-eye palette, Globe 2D canvas, pick, drag, zoom",palette);
    await page.close();
  }
} finally {
  if(browser)await browser.close();
  server.kill("SIGTERM");
}
