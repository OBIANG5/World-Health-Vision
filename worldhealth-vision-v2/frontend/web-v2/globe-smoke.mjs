import { chromium } from "playwright";
import { spawn } from "node:child_process";
import { mkdirSync } from "node:fs";
const host="http://127.0.0.1:5187";
const server=spawn("python3",["-m","http.server","5187","--bind","127.0.0.1","--directory","dist"],{stdio:"ignore"});
const sleep=(n)=>new Promise(resolve=>setTimeout(resolve,n));
const browser=await chromium.launch({headless:true,args:["--no-sandbox"]});
const errors=[];
mkdirSync("globe-artifacts",{recursive:true});
try{
 let ready=false;
 for(let i=0;i<40;i++){
  try{const r=await fetch(host+"/countries.geojson");if(r.ok){ready=true;break;}}catch{}
  await sleep(300);
 }
 if(!ready)throw Error("Local V2 static web server not ready");
 for(const screen of [{name:"iphone",width:390,height:844,isMobile:true,hasTouch:true},{name:"desktop",width:1365,height:900,isMobile:false,hasTouch:false}]){
  const page=await browser.newPage({viewport:{width:screen.width,height:screen.height},deviceScaleFactor:1,isMobile:screen.isMobile,hasTouch:screen.hasTouch});
  page.on("pageerror",e=>errors.push(screen.name+": "+e.message));
  await page.goto(host+"/",{waitUntil:"domcontentloaded"});
  const globe=page.locator("canvas.whv-globe-canvas");
  await globe.waitFor({state:"visible",timeout:20000});
  await page.waitForFunction(()=>!document.querySelector(".whv-globe-status"),{timeout:20000});
  const box=await globe.boundingBox();if(!box||box.width<150||box.height<150)throw Error(screen.name+" globe is too small");
  const before=await globe.evaluate(el=>el.toDataURL());
  const x=box.x+box.width*.5,y=box.y+box.height*.5;
  await page.mouse.move(x,y);await page.mouse.down();await page.mouse.move(x+60,y+19,{steps:8});await page.mouse.up();
  await page.waitForTimeout(250);
  const after=await globe.evaluate(el=>el.toDataURL());
  if(before===after)throw Error(screen.name+" globe did not rotate");
  await page.screenshot({path:"globe-artifacts/"+screen.name+"-globe.png",fullPage:true});
  const eye=page.getByRole("button",{name:/Carte œil/});
  await eye.click();await page.locator(".eye-map-surface .leaflet-container").waitFor({state:"visible",timeout:15000});
  await page.screenshot({path:"globe-artifacts/"+screen.name+"-original-eye.png",fullPage:true});
  await page.getByRole("button",{name:/Globe/}).click();
  await globe.waitFor({state:"visible",timeout:15000});
  await page.close();
  console.log("PASS "+screen.name+": geo-backed globe, drag, original Leaflet mode, switch back");
 }
 if(errors.length)throw Error("Page errors: "+errors.join("; "));
 console.log("PASS all browser runtime checks");
}finally{
 await browser.close();server.kill("SIGTERM");
}
