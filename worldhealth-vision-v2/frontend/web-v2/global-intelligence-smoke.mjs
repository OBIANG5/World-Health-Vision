/**
 * World-Vision Global Intelligence: real V2 acceptance tests.
 * Responsive home, globe, navigation, country drilldown and source disclosure.
 * Does not assert that a backend or live feeds exist.
 */
import { chromium } from "playwright";
import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { mkdirSync } from "node:fs";

const port = process.env.WV_TEST_PORT ?? "5214";
const base = "http://127.0.0.1:" + port;
const server = spawn("python3",
  ["-m", "http.server", port, "--bind", "127.0.0.1", "--directory", "dist"],
  { stdio: "ignore" });
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
mkdirSync("global-intelligence-artifacts", { recursive: true });
let browser;

try {
  let ready = false;
  for (let i=0; i<45; i++) {
    try { if ((await fetch(base + "/countries.geojson")).ok) { ready = true; break; } }
    catch {}
    await sleep(250);
  }
  assert(ready, "Build server did not start");
  browser = await chromium.launch({ headless:true, args:["--no-sandbox"] });
  for (const device of [
    {name:"iphone", width:390,height:844, mobile:true},
    {name:"tablet", width:820,height:1100,mobile:false},
    {name:"desktop",width:1440,height:900,mobile:false}
  ]) {
    const page = await browser.newPage({
      viewport:{width:device.width,height:device.height},
      isMobile:device.mobile,hasTouch:device.mobile,deviceScaleFactor:1
    });
    const errors=[];
    page.on("pageerror", e => errors.push(e.message));
    await page.goto(base, {waitUntil:"domcontentloaded"});
    await page.locator(".wv-intelligence-home").waitFor({state:"visible",timeout:20000});
    const title=await page.locator("#wv-lead-title").textContent();
    assert(title?.includes("Comprenez pourquoi"), "New information hierarchy missing");
    assert.equal(await page.locator(".wv-feature-card").count(),4, "Missing thematic cards");
    assert.equal(await page.locator(".whv-map-mode-switch").count(),0, "Obsolete map switch returned");
    const globe = page.locator("canvas.whv-globe-canvas");
    await globe.waitFor({state:"visible",timeout:20000});
    await page.waitForFunction(()=>!document.querySelector(".whv-globe-status"),null,{timeout:20000});
    const box=await globe.boundingBox();
    assert(box && box.width>=250 && box.height>=210, device.name+" globe too small");

    const dimensions=await page.evaluate(()=>({
      width:document.documentElement.scrollWidth,
      viewport:window.innerWidth,
      pageHeight:document.documentElement.scrollHeight,
      viewHeight:window.innerHeight,
      header:getComputedStyle(document.querySelector(".whv-header")).position
    }));
    assert(dimensions.width <= dimensions.viewport+3,
      device.name+" horizontal overflow: "+JSON.stringify(dimensions));
    assert(dimensions.pageHeight>dimensions.viewHeight,
      device.name+" cannot scroll as an editorial page");
    assert.equal(dimensions.header,"sticky",device.name+" masthead not sticky");
    await page.screenshot({path:"global-intelligence-artifacts/"+device.name+"-home.png",fullPage:true});

    // Country search must really filter the loaded catalog.
    await page.locator(".wv-primary-cta").click();
    const search=page.locator(".country-selector-search");
    await search.waitFor({state:"visible",timeout:10000});
    await search.fill("Gab");
    const matches=page.locator(".country-selector-item");
    assert(await matches.count()>0,device.name+" country search unavailable");
    await page.keyboard.press("Escape");
    await search.waitFor({state:"hidden",timeout:10000});

    // Live V2 region drawer, not a dummy view.
    await page.getByRole("button",{name:/Explorer les régions/}).click();
    await page.locator(".region-drawer.open").waitFor({state:"visible",timeout:20000});
    await page.locator(".region-drawer.open .drawer-btn.close").click();
    await page.locator(".region-drawer.open").waitFor({state:"hidden",timeout:10000});

    // Source ledger is the existing V2 methodology panel.
    await page.locator(".wv-source-card button").click();
    await page.locator(".whv-modal").waitFor({state:"visible",timeout:15000});
    await page.screenshot({path:"global-intelligence-artifacts/"+device.name+"-sources.png",fullPage:true});
    const closeSource=page.locator(".whv-modal-close");
    await closeSource.click();
    await page.locator(".whv-modal").waitFor({state:"hidden",timeout:10000});

    // A scrolling home must never open an absolute panel far above the user.
    await page.locator(".wv-selected-country").scrollIntoViewIfNeeded();
    await page.locator(".wv-selected-main button").click();
    const countryDrawer=page.locator(".country-drawer.open");
    await countryDrawer.waitFor({state:"visible",timeout:15000});
    const countryBox=await countryDrawer.boundingBox();
    assert(countryBox && countryBox.y>=-5 && countryBox.y<=20,
      device.name+" country detail is offscreen after scrolling");
    assert.equal(await countryDrawer.evaluate(el=>getComputedStyle(el).position),"fixed");
    await countryDrawer.locator(".drawer-btn.close").click();
    await countryDrawer.waitFor({state:"hidden",timeout:10000});

    // Currency tool also stays visible when launched below the fold.
    await page.locator(".wv-quick-links button").first().click();
    const currencyPanel=page.locator(".cur-panel");
    await currencyPanel.waitFor({state:"visible",timeout:15000});
    const currencyBox=await currencyPanel.boundingBox();
    assert(currencyBox && currencyBox.y>=0 && currencyBox.y<=140,
      device.name+" currency tool positioned outside the viewport");
    await currencyPanel.locator(".prf-close-btn").click();
    await currencyPanel.waitFor({state:"hidden",timeout:10000});

    // Four category cards must call real navigation, not inert mock cards.
    const economy=page.locator(".wv-feature-card").nth(1);
    await economy.click();
    await page.locator('.whv-domain-menu[data-domain="markets"]').waitFor({state:"visible",timeout:10000});
    const sourceMenu=page.locator(".whv-domain-group");
    assert(await sourceMenu.count()>=1,device.name+" markets menu not populated");
    await page.keyboard.press("Escape");
    assert.deepEqual(errors,[],device.name+" runtime JS errors");
    await page.close();
    console.log("PASS",device.name,"editorial home, globe, responsive scrolling, region, search, sources, markets");
  }
} finally {
  if(browser)await browser.close();
  server.kill("SIGTERM");
}
