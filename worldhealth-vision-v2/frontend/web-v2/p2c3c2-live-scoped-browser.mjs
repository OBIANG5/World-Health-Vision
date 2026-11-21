/**
 * P2C3C2 REAL Chrome → compiled React → Gateway JWT routes → real Postgres16.
 * CI fixture is entirely SYNTHETIC, 3 ephemeral independent Ed25519 signers.
 * Neither institutional values nor source rights are produced or published.
 * The browser has NO mocked fetch. A real DB tombstone is inserted while the
 * SAME iPhone page remains open, then its signed value must disappear.
 */
import assert from "node:assert/strict";
import { spawn, spawnSync } from "node:child_process";
import { readFileSync, mkdirSync } from "node:fs";
import { chromium } from "playwright";

const root = "worldhealth-vision-v2";
const proofDir = process.env.WHV_P2C3C2_DIRECTORY;
assert(proofDir?.startsWith("/"), "CI private proof root required");
const meta = JSON.parse(readFileSync(proofDir + "/proof-public.json", "utf8"));
const origin = "http://127.0.0.1:5219";
const artifactDir = "p2c3c2-artifacts";
mkdirSync(artifactDir, { recursive: true });
const server = spawn("python3", [
  root + "/infra/tests/p2b_same_origin_preview.py",
  "--root", root + "/frontend/web-v2/dist",
  "--gateway", "http://127.0.0.1:18080", "--port", "5219",
], {stdio:"ignore"});
const sleep = ms => new Promise(resolve => setTimeout(resolve,ms));
let browser;

function inRealDb(sqlName) {
  const files = [
    root + "/infra/compose.secure-staging.yml",
    root + "/infra/tests/compose.ci-public-read.yml",
    root + "/infra/tests/compose.ci-synthetic-rights.yml",
    root + "/infra/tests/compose.ci-scoped-rights.yml",
  ];
  const args = files.flatMap(f=>["-f",f]).concat([
    "exec","-T","whv-timescaledb","psql","-v","ON_ERROR_STOP=1",
    "-U","whv_user","-d","whv",
  ]);
  const result = spawnSync("docker",["compose",...args],{
    input:readFileSync(proofDir+"/"+sqlName),encoding:"utf8",
    timeout:30000,maxBuffer:1024*1024,env:process.env,
  });
  assert.equal(result.status,0,
    "CI-only actual Postgres SQL failed: "+String(result.stderr??"").slice(0,360));
}

async function stateFromRealGateway(page) {
  return page.evaluate(async() => {
    const endpoints = [
      "/api/timeseries/countries/GAB/scoped-values",
      "/api/timeseries/countries/GAB/published-coverage",
      "/api/timeseries/countries/GAB/published-indicators",
      "/api/timeseries/series/latest?countryIso3=GAB&indicatorCode=SYNTH.P2C2.QA",
      "/api/timeseries/compare/countries/latest?countryIso3=GAB&indicatorCode=SYNTH.P2C2.QA",
    ];
    return Promise.all(endpoints.map(async path => {
      const response=await fetch(path,{cache:"no-store"});
      const json=await response.json();
      return {status:response.status,headers:{cache:response.headers.get("cache-control")},body:json};
    }));
  });
}

async function visit(page) {
  await page.goto(origin + "/?wv=country&iso3=GAB",{waitUntil:"domcontentloaded"});
  await page.locator("canvas.whv-globe-canvas").waitFor({state:"visible",timeout:26000});
  await page.locator(".country-drawer.open").waitFor({state:"visible",timeout:26000});
  const national = page.locator(".whv-national-evidence");
  await national.waitFor({state:"attached",timeout:22000});
  if (!(await national.evaluate(x=>x.open)))
    await national.locator(":scope > summary").click();
  const scoped=page.locator(".whv-scoped-explorer");
  await scoped.waitFor({state:"visible",timeout:20000});
  if (!(await scoped.evaluate(x=>x.open)))
    await scoped.locator(":scope > summary").click();
  return scoped;
}

async function showAndCheck(page,name) {
  const scoped=await visit(page);
  const card=scoped.locator(".whv-scoped-card");
  await card.waitFor({state:"visible",timeout:28000});
  const text=await card.innerText();
  assert(text.includes(meta.expectedScope),name+": missing synthetic scoped territory");
  assert(text.includes("17") && text.includes("CI_UNITS"),name+": fake value/unit missing");
  assert(text.includes("FICTIONAL_TEST_TERRITORY"),name+": excluded territory not visible");
  assert(text.includes("SYNTHETIC_QA_METHOD"),name+": source methodology missing");
  assert(text.includes("2025") && text.includes("2024"),name+": geography vs period missing");
  assert(text.includes("SYNTHETIC QA ONLY"),name+": must be clearly labelled synthetic");
  assert((await scoped.innerText()).includes("PAS") ||
         (await scoped.innerText()).includes("NOT"),
         name+": territory must not claim national comparability");
  const overflow=await scoped.evaluate(el=>el.scrollWidth-el.clientWidth);
  assert(overflow<=3,name+": horizontal scoped overflow "+overflow);
  const api=await stateFromRealGateway(page);
  assert(api.every(r=>r.status===200),name+": missing actual Gateway scoped/national routes");
  assert.equal(api[0].body.count,1,name+": scoped API should expose ONE QA source-native figure");
  assert.equal(api[0].body.items[0].comparabilityStatus,"SOURCE_SCOPED_NOT_COUNTRY_EQUIVALENT");
  assert((api[0].headers.cache||"").includes("no-store"),"scoped permission cannot be HTTP cached");
  assert.equal(api[1].body.coverageStatus,"NO_PUBLICLY_ELIGIBLE_DATA");
  assert.equal(api[1].body.availableObservationCount,0);
  assert(api.slice(2).every(r=>r.body.count===0),
    name+": raw source-native observation leaked to NATIONAL list/series/compare");
  const privateRoute=await page.evaluate(async() =>
    (await fetch("/api/timeseries/source-runs")).status);
  assert.equal(privateRoute,401,name+": operator metadata must remain private");
  await page.screenshot({path:artifactDir+"/"+name+"-REAL-GATEWAY-THREE-SIGNERS-SYNTHETIC-before.png",
                         fullPage:true});
  return scoped;
}

try {
  let ready=false;
  for(let attempt=0;attempt<70;attempt++){
    try{ready=(await fetch(origin+"/index.html")).ok;if(ready)break;}catch{}
    await sleep(300);
  }
  assert(ready,"Real compiled Atlas and Gateway proxy did not start");
  browser=await chromium.launch({
    headless:true,channel:process.env.WHV_BROWSER_CHANNEL==="chrome"?"chrome":undefined,
    args:["--no-sandbox"],
  });
  const variants=[
    {name:"iphone-320",width:320,height:700,isMobile:true},
    {name:"iphone-390",width:390,height:844,isMobile:true},
    {name:"desktop-1440",width:1440,height:900,isMobile:false},
  ];
  let live;
  for(const config of variants){
    const page=await browser.newPage({
      viewport:{width:config.width,height:config.height},
      isMobile:config.isMobile,hasTouch:config.isMobile,deviceScaleFactor:1,
    });
    const errors=[];
    page.on("pageerror",error=>errors.push(error.message));
    const panel=await showAndCheck(page,config.name);
    if(config.name==="iphone-390")live={page,panel,errors};
    else {
      assert.deepEqual(errors,[],config.name+": browser JS error");
      await page.close();
    }
    console.log("PASS P2C3C2 "+config.name+": 3 signed synthetic proofs, true country UI and separate scoped API.");
  }
  assert(live,"Same open iPhone needed for actual revocation proof");
  inRealDb("revoke-scope.sql");
  console.log("PASS: actual append-only geographic revocation inserted in disposable PostgreSQL");
  await live.page.evaluate(()=>window.dispatchEvent(new Event("focus")));
  // React must hide stale old numeric data immediately during validation.
  await live.panel.locator(".whv-scoped-card").waitFor({state:"hidden",timeout:20000});
  await live.panel.getByText("Aucune donnée à périmètre spécifique",
      {exact:false}).waitFor({state:"visible",timeout:23000});
  const after=await stateFromRealGateway(live.page);
  assert(after.every(r=>r.status===200));
  assert.equal(after[0].body.count,0,"Revoked scope still exists on public scoped GET");
  assert.equal(after[1].body.availableObservationCount,0);
  assert(after.slice(2).every(r=>r.body.count===0),"Revoked source leaked into national routes");
  assert.deepEqual(live.errors,[],"JavaScript errors during same-iPhone scope revocation");
  await live.page.screenshot({
    path:artifactDir+"/iphone-390-REAL-POSTGRES-GEOSCOPE-REVOKED-after.png",
    fullPage:true,
  });
  console.log("PASS P2C3C2 SAME iPhone: real DB geography revocation removed synthetic value from actual Atlas.");
} finally {
  await browser?.close();
  server.kill("SIGTERM");
}
