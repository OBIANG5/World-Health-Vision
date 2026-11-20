/** PRODUCT-P2C1 SYNTHETIC browser-only acceptance, never published dataset. */
import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { mkdirSync } from "node:fs";
import { chromium } from "playwright";
const port=5221, origin="http://127.0.0.1:"+port;
const root=process.env.WHV_PREVIEW_DIRECTORY ?? "preview";
const server=spawn("python3",["-m","http.server",String(port),"--bind","127.0.0.1","--directory",root],{stdio:"ignore"});
const sleep=ms=>new Promise(f=>setTimeout(f,ms));
mkdirSync("p2c1-artifacts",{recursive:true});
let browser;
try {
  let ready=false;
  for(let n=0;n<60;n++){
    try {ready=(await fetch(origin+"/index.html")).ok;if(ready)break;} catch { /* wait */ }
    await sleep(250);
  }
  assert(ready,"V2 compiled offline fixture server not ready");
  browser=await chromium.launch({headless:true,args:["--no-sandbox"]});
  for(const device of [
    {name:"small-mobile",width:320,height:700,mobile:true},
    {name:"iphone",width:390,height:844,mobile:true},
    {name:"desktop",width:1440,height:900,mobile:false},
  ]) {
    const page=await browser.newPage({viewport:{width:device.width,height:device.height},
      isMobile:device.mobile,hasTouch:device.mobile,deviceScaleFactor:1});
    const errors=[];
    page.on("pageerror",e=>errors.push(e.message));
    await page.addInitScript(()=>{
      let current=window.fetch.bind(window);
      window.__WV_SYNTHETIC_REVOKED__=false;
      const syntheticCode="SYNTHETIC.QA.ONLY";
      const json=(body,status=200)=>Promise.resolve(new Response(JSON.stringify(body),
        {status,headers:{"content-type":"application/json;charset=utf-8"}}));
      Object.defineProperty(window,"fetch",{configurable:true,
        get:()=>current,
        set:assigned=>{
          current=(input,init)=>{
            const raw=typeof input==="string"?input:input?.url;
            const target=new URL(raw,document.baseURI);
            const path=target.pathname;
            const revoked=window.__WV_SYNTHETIC_REVOKED__;
            if(path==="/api/timeseries/countries/GAB/published-coverage"){
              return json({countryIso3:"GAB",
                coverageStatus:revoked?"NO_PUBLICLY_ELIGIBLE_DATA":"PUBLISHED_DATA_AVAILABLE",
                availableObservationCount:revoked?0:1,observedObservationCount:revoked?0:1,
                estimatedObservationCount:0,publishedIndicatorCount:revoked?0:1,
                publishedSourceCount:revoked?0:1,
                latestAvailablePeriodStart:revoked?null:"2024-01-01",
                latestSourceFetchedAtUtc:revoked?null:"2026-11-20T10:00:00Z"});
            }
            if(path==="/api/timeseries/countries/GAB/published-indicators"){
              return json({count:revoked?0:1,items:revoked?[]:[{
                indicatorCode:syntheticCode,indicatorDisplayName:"Synthetic QA indicator — NOT REAL DATA",
                availableObservationCount:1,observedObservationCount:1,
                estimatedObservationCount:0,publishedSourceCount:1,
                latestAvailablePeriodStart:"2024-01-01"}]});
            }
            if(path==="/api/timeseries/series/latest"){
              return json({count:revoked?0:1,items:revoked?[]:[{
                sourceCode:"WORLD_BANK",sourceDisplayName:"Synthetic QA source",
                datasetCode:"WDI",datasetDisplayName:"Synthetic demo dataset",
                countryIso3:"GAB",indicatorCode:syntheticCode,
                periodLabel:"2024",periodStart:"2024-01-01",periodEnd:"2024-12-31",
                numericValue:17,textValue:null,valueStatus:"OBSERVED",
                sourcePublishedAt:"2025-01-02T00:00:00Z",
                fetchedAtUtc:"2026-11-20T10:00:00Z"}]});
            }
            if(path==="/api/catalog/indicators/"+syntheticCode){
              return json({code:syntheticCode,displayName:"Synthetic QA only",
                topic:"TEST",unitLabel:"QA units",description:"Not an official statistic",
                methodologyNotes:"Synthetic demonstration. No real institution."});
            }
            if(path==="/api/catalog/sources/WORLD_BANK"){
              return json({code:"WORLD_BANK",displayName:"Synthetic QA source",type:"OFFICIAL",
                organizationName:"Test fixture only",homepageUrl:"https://example.org",
                documentationUrl:"https://example.org/synthetic-qa",
                accessModel:"TEST",licenseSummary:"SYNTHETIC QA ONLY",
                geographicScope:"TEST",temporalGranularity:"ANNUAL",updateCadence:"TEST",
                biasNotes:"Synthetic, not a real statistic",qualityNotes:"No evidence of real data",enabled:true});
            }
            return assigned(input,init);
          };
        }
      });
    });
    await page.goto(origin+"/?wv=country&iso3=GAB",{waitUntil:"domcontentloaded"});
    await page.locator(".country-drawer.open").waitFor({state:"visible",timeout:22000});
    const explorer=page.locator(".whv-published-explorer");
    await explorer.waitFor({state:"visible",timeout:18000});
    const indicator=explorer.locator(".whv-published-indicator");
    await indicator.waitFor({state:"visible",timeout:18000});
    assert((await indicator.innerText()).includes("NOT REAL DATA"));
    assert.equal(await explorer.locator(".whv-published-value").count(),0,
      "No source or indicator should be silently preselected");
    await indicator.click();
    const item=explorer.locator(".whv-published-value");
    await item.waitFor({state:"visible",timeout:18000});
    assert((await item.innerText()).includes("17"),"Selected value missing");
    assert((await explorer.innerText()).includes("QA units"),"Catalog unit missing");
    await item.locator("button").click();
    const info=explorer.locator(".whv-published-source-note");
    await info.waitFor({state:"visible",timeout:16000});
    assert((await info.innerText()).includes("SYNTHETIC QA ONLY"),
      "Source catalog terms, caveat or method not disclosed");
    const overflow=await explorer.evaluate(node=>node.scrollWidth-node.clientWidth);
    assert(overflow<=3,"Indicator explorer overflows "+device.name+": "+overflow);
    await page.screenshot({path:"p2c1-artifacts/"+device.name+"-synthetic-published.png",fullPage:true});
    // Withdraw synthetic grant while tab is still open. This mimics a
    // backend read-time revocation; does NOT claim an actual DB grant was used.
    await page.evaluate(()=>{
      window.__WV_SYNTHETIC_REVOKED__=true;
      window.dispatchEvent(new Event("focus"));
    });
    await page.getByText("Aucune observation actuellement autorisée",{exact:false})
      .first().waitFor({state:"visible",timeout:18000});
    await explorer.waitFor({state:"hidden",timeout:18000});
    assert.equal(await page.locator(".whv-published-figure").count(),0,
      "Stale public value remained visible after refresh/revocation");
    await page.screenshot({path:"p2c1-artifacts/"+device.name+"-synthetic-revoked.png",fullPage:true});
    assert.deepEqual(errors,[],device.name+": unexpected JS exceptions");
    console.log("PASS P2C1 "+device.name+": user-selected value, method, terms and revocation refresh");
    await page.close();
  }
} finally {
  await browser?.close();
  server.kill("SIGTERM");
}
