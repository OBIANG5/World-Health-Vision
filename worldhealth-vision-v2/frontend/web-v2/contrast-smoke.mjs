import {chromium} from "playwright";
import assert from "node:assert/strict";
import {spawn} from "node:child_process";
const server=spawn("python3",["-m","http.server","5199","--bind","127.0.0.1","--directory","dist"],{stdio:"ignore"});
const browser=await chromium.launch({headless:true,args:["--no-sandbox"]});
const pause=ms=>new Promise(resolve=>setTimeout(resolve,ms));
try{
 for(let i=0;i<40;i++){try{if((await fetch("http://127.0.0.1:5199/")).ok)break}catch{}await pause(200)}
 for(const screen of [{name:"iPhone",width:390,height:844},{name:"desktop",width:1440,height:900}]){
  const page=await browser.newPage({viewport:{width:screen.width,height:screen.height}});
  await page.goto("http://127.0.0.1:5199/",{waitUntil:"domcontentloaded"});
  await page.locator(".whv-nav").waitFor();
  const all=[
   ".whv-brand-text h1",".whv-brand-text p",".whv-nav-btn--explore",
   ".whv-nav-btn--markets",".whv-nav-btn--tools",".whv-service-status",
   ".whv-globe-topline"
  ];
  if(screen.name==="desktop")all.push(".whv-story-eyebrow",".whv-desktop-story h2",
   ".whv-desktop-story > p",".whv-story-metrics strong",".whv-story-metrics span");
  else all.push(".whv-mobile-overview h2",".whv-mobile-overview-description",
   ".whv-mobile-featured-name",".whv-mobile-featured-subtitle",
   ".whv-mobile-shortcut",".whv-mobile-note");
  await page.locator(".whv-nav-btn--tools").click();
  await page.locator(".whv-domain-menu").waitFor({state:"visible"});
  all.push(".whv-domain-heading h2",".whv-domain-group h3",
   ".whv-domain-menu .whv-tools-item strong",
   ".whv-domain-menu .whv-tools-item small",".whv-domain-disclosure",
   ".whv-domain-footer");
  const checks=await page.evaluate(selectors=>{
   const rgb=s=>{const m=s.match(/rgba?\(([^)]+)\)/);
    if(!m)return null;const p=m[1].split(",").map(Number);
    return {r:p[0],g:p[1],b:p[2],a:p[3]??1}};
   const brightness=({r,g,b})=>{
    const v=[r,g,b].map(c=>{let s=c/255;return s<=.04045?s/12.92:((s+.055)/1.055)**2.4});
    return v[0]*.2126+v[1]*.7152+v[2]*.0722;
   };
   return selectors.map(selector=>{
    const el=document.querySelector(selector);
    if(!el)return {selector,error:"missing"};
    const st=getComputedStyle(el),fg=rgb(st.color);
    let bg=null,node=el;
    while(node&&!bg){const c=rgb(getComputedStyle(node).backgroundColor);if(c&&c.a>=.97)bg=c;node=node.parentElement;}
    if(!bg)bg={r:255,g:255,b:255};
    const l1=brightness(fg),l2=brightness(bg);
    const ratio=(Math.max(l1,l2)+.05)/(Math.min(l1,l2)+.05);
    return {selector,foreground:st.color,background:bg,ratio:Math.round(ratio*100)/100};
   })
  },all);
  const bad=checks.filter(r=>r.error||r.ratio<4.5);
  assert.equal(bad.length,0,screen.name+" insufficient text contrast: "+JSON.stringify(bad));
  await page.keyboard.press("Escape");
  console.log("PASS "+screen.name+" WCAG AA contrast >=4.5:1",JSON.stringify(checks));
  await page.close();
 }
}finally{await browser.close();server.kill("SIGTERM")}
