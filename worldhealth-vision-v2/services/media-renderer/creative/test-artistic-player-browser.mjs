import fs from 'node:fs';
import path from 'node:path';
import puppeteer from 'puppeteer-core';
const chrome=[process.env.WV_TEST_CHROME,process.env.PUPPETEER_EXECUTABLE_PATH,'/usr/bin/google-chrome','/usr/bin/google-chrome-stable','/usr/bin/chromium','/usr/bin/chromium-browser'].filter(Boolean).find(p=>fs.existsSync(p));
if(!chrome)throw Error('Missing Chromium');
const browser=await puppeteer.launch({executablePath:chrome,headless:true,args:['--no-sandbox','--disable-dev-shm-usage']});
const dir=path.resolve('output/creative');fs.mkdirSync(dir,{recursive:true});
try{
 const page=await browser.newPage();const errors=[];page.on('pageerror',e=>errors.push(String(e)));
 await page.setViewport({width:390,height:844,deviceScaleFactor:1});
 await page.goto('http://127.0.0.1:5173/creative-player-smoke.html?mode=photo-review',{waitUntil:'domcontentloaded'});
 await page.waitForFunction(()=>window.__wvSmokeReady===true&&window.__wvSmokeMode==='photo-review',{timeout:30000});
 await page.waitForFunction(()=>document.querySelector('[data-wv-photo-heading]'),{timeout:30000});
 await page.evaluate(()=>document.fonts.ready);
 const measures=[];
 for(const frame of [0,80,105,135]){
   await page.evaluate(f=>window.__wvSmokeSeek(f),frame);
   await new Promise(r=>setTimeout(r,450));
   const q=await page.evaluate(()=>{
     const view=document.querySelector('#smoke-preview').getBoundingClientRect();
     const rect=sel=>{
       const el=document.querySelector(sel);if(!el)return null;
       const r=el.getBoundingClientRect(),c=getComputedStyle(el);
       return {top:r.top-view.top,bottom:r.bottom-view.top,left:r.left-view.left,right:r.right-view.left,
         opacity:Number(c.opacity),fontSize:parseFloat(c.fontSize),borderLeftWidth:parseFloat(c.borderLeftWidth)};
     };
     return {height:view.height,width:view.width,heading:rect('[data-wv-photo-heading]'),
       title:rect('[data-wv-title="artistic-review-fixture"]'),
       chart:rect('[data-wv-photo-comparison="true"]'),
       copy:rect('[data-wv-photo-caption="true"]'),
       words:rect('[data-wv-kinetic-page]'),
       source:rect('[data-wv-photo-comparison-source="true"]'),
       legacyLogo:!!document.querySelector('[data-wv-official-brand]'),
       brandState:document.querySelector('[data-wv-brand-state]')?.getAttribute('data-wv-brand-state'),
       renderedImages:Array.from(document.querySelectorAll('#smoke-preview img')).filter(x=>x.complete&&x.naturalWidth>0).length,
       error:document.querySelector('#smoke-error')?.textContent||null};
   });
   if(q.error||q.legacyLogo||q.brandState!=='blocked_legacy_asset'||q.heading?.borderLeftWidth!==0||!q.renderedImages)
     throw Error('Rejected brand/decorative rule or missing real image: '+JSON.stringify(q));
   if(frame===0&&(!q.heading||q.heading.opacity<.99||!q.title||q.title.fontSize<120))
     throw Error('Numeric opening not immediately legible: '+JSON.stringify(q));
   if(frame>0){
     if(!q.chart||!q.copy||!q.words||!q.source||q.chart.opacity<.9||
       q.chart.bottom>q.copy.top+1||q.copy.bottom>q.words.top+1||
       q.words.bottom>q.height*.85+1||q.source.bottom>q.chart.bottom+1||
       q.heading.bottom>q.chart.top+1)
       throw Error('Actual visible photo layout collision/unsafe clearance at '+frame+': '+JSON.stringify(q));
   }
   const el=await page.$('#smoke-preview');
   await el.screenshot({path:path.join(dir,'artistic-mobile-frame-'+frame+'.png')});
   measures.push({frame,...q});
 }
 if(errors.length)throw Error(errors.join(' / '));
 fs.writeFileSync(path.join(dir,'artistic-mobile-layout.report.json'),JSON.stringify({
  status:'PASS',source:'synthetic layout regression, NOT an artistic approval',
  viewport:390,measures},null,2));
 console.log('PASS: actual Remotion Player frame-zero hook, no legacy logo, no decorative rail and separated photo captions');
}finally{await browser.close();}
