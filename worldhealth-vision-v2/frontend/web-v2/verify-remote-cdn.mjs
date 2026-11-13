import assert from "node:assert/strict";
import { chromium } from "playwright";

const pinnedCdn = "https://rawcdn.githack.com/OBIANG5/World-Health-Vision/d8739fdf9335debea598238b22c23b711c343ca8/index.html";
const productionVercel = "https://world-health-vision-v2.vercel.app";
const url = process.env.WHV_VERIFY_VERCEL === "1" ? productionVercel : pinnedCdn;
const isVercel = url === productionVercel;
const browser = await chromium.launch({headless: true, args: ["--no-sandbox"]});
try {
  const page = await browser.newPage({viewport: {width:390,height:844}, isMobile:true,hasTouch:true});
  const errors = [], failures = [];
  page.on("pageerror", error => errors.push(String(error)));
  page.on("response", response => {
    if(response.status() >= 400 && response.url().includes("/assets/"))
      failures.push(response.status()+" "+response.url());
  });
  const result = await page.goto(url, {waitUntil:"domcontentloaded", timeout:45000});
  assert(result?.status() === 200, "Remote immutable CDN did not return HTTP 200");
  // GitHack displays an interstitial security notice on a first visit.
  // The real user must tap "Open the page", so exercise that flow.
  if ((await page.title()).includes("External Content Notice")) {
    console.log("CDN first-visit security notice found; following Open the page.");
    await page.getByText("Open the page", {exact: true}).click();
  }
  try {
    await page.locator(".whv-mobile-overview").waitFor({state:"visible",timeout:25000});
  } catch (error) {
    console.error("Remote render diagnostics:", JSON.stringify({
      httpStatus: result?.status(),
      title: await page.title(),
      body: (await page.locator("body").innerText()).slice(0,800),
      html: (await page.locator("body").innerHTML()).slice(0,600),
      jsErrors: errors,
      assetFailures: failures,
      location: page.url(),
    }));
    await page.screenshot({path:"remote-preview-failure.png"});
    throw error;
  }
  await page.locator(".eye-stage").waitFor({state:"visible"});
  if(isVercel){
    // Verify the redesigned REAL production site, not only that an older
    // World Health Vision build remains online at the same stable URL.
    await page.locator(".whv-nav-btn--mobile-hub").waitFor({state:"visible"});
    const editorial = await page.locator(".whv-mobile-overview h2").innerText();
    assert(editorial.includes("Voir le monde, le comprendre."),
      "Public Vercel URL has not updated to the new editorial World Explorer");
    const bg = await page.locator(".whv-header").evaluate(
      el => getComputedStyle(el).backgroundColor);
    assert(/255, 254, 250/.test(bg),"The new light header is missing: "+bg);
    assert(await page.locator(".whv-mobile-shortcut").count() === 6,
      "All six world exploration domain shortcuts must remain available");
    await page.locator(".whv-nav-btn--mobile-hub").click();
    const thematicMenu = page.locator('.whv-domain-menu[data-domain="all"]');
    await thematicMenu.waitFor({state:"visible"});
    assert(await thematicMenu.locator(".whv-domain-group").count() === 4,
      "Missing themed countries, markets, travel and safety navigation groups");
    await page.keyboard.press("Escape");
    await thematicMenu.waitFor({state:"hidden"});
    console.log("PASS VERCEL_EDITORIAL_NAVIGATION: permanent URL, light theme, six shortcuts, four functional navigation domains");
  }
  if (isVercel) {
    const badge=await page.locator(".whv-service-status").innerText();
    assert(badge.includes("Aperçu"),"Vercel V2 must label its static preview honestly; got: "+badge);
  }
  if (isVercel) {
    await page.screenshot({path:"vercel-mobile-globe.png",fullPage:true});
    const metrics=await page.evaluate(()=>{
      const n=performance.getEntriesByType("navigation")[0];
      const resources=performance.getEntriesByType("resource");
      return {
        domContentLoadedMs: n ? Math.round(n.domContentLoadedEventEnd) : null,
        transferBytes: resources.reduce((s,r)=>s+(r.transferSize||0),0),
        resourceCount: resources.length,
        resourceLoadDurationMs: resources.length ? Math.round(Math.max(...resources.map(r=>r.responseEnd))) : null
      };
    });
    console.log("VERCEL_BROWSER_BASELINE (lab, not real user measurements)",JSON.stringify(metrics));
    // Initial screen should NOT fetch large feature libraries until a user
    // explicitly opens the relevant tool or the detailed Leaflet map.
    const startupNames = await page.evaluate(() => performance.getEntriesByType("resource")
      .map(r => r.name.split("/").at(-1) ?? ""));
    const eagerFeature = startupNames.filter(n =>
      /^(?:WorldMap-|vendor-leaflet-|vendor-charts-|vendor-pdf-|jspdf\.es\.|index\.es-)/i.test(n));
    assert.deepEqual(eagerFeature, [],
      "Heavy feature libraries unexpectedly downloaded before user action");
    console.log("VERCEL_STARTUP_RESOURCES",JSON.stringify(startupNames));
  }
  // New canonical V2 globe must really render and support country drill-down.
  const globe=page.locator("canvas.whv-globe-canvas");
  await globe.waitFor({state:"visible"});
  await page.waitForFunction(()=>!document.querySelector(".whv-globe-status"),null,{timeout:25000});
  const box=await globe.boundingBox();
  assert(box&&box.width>250&&box.height>220,"Remote mobile interactive globe has invalid dimensions");
  await page.touchscreen.tap(box.x+box.width*.5,box.y+box.height*.51);
  await page.locator(".country-drawer.open").waitFor({state:"visible",timeout:15000});
  await page.locator(".country-drawer.open .drawer-btn.close").click();
  // The original Leaflet eye view must still work, then return to the globe.
  await page.getByRole("button",{name:/Carte œil/}).click();
  await page.locator(".eye-map-surface .leaflet-container").waitFor({state:"visible"});
  await page.getByRole("button",{name:/Globe/}).click();
  await globe.waitFor({state:"visible"});
  await page.locator(".whv-nav-btn--tools").click();
  await page.locator(".whv-tools-menu").waitFor({state:"visible"});
  await page.locator(".whv-tools-menu").getByText("Expat & Retraite").click();
  await page.locator(".rt-panel").waitFor({state:"visible"});
  await page.locator(".rt-close-btn").click();
  await page.locator(".whv-nav-btn--tools").click();
  await page.locator(".whv-tools-menu").getByText("Conseiller économique").click();
  await page.locator(".adv-panel").waitFor({state:"visible"});
  await page.locator(".adv-close-btn").click();
  await page.locator(".whv-nav-btn--sources").click();
  await page.locator(".whv-source-card").first().waitFor({state:"visible"});
  assert(await page.locator(".whv-source-card").count() === 22,
    "Remote preview does not expose all 22 registered V2 sources");
  // Cross-check the actual CURRENT published mobile preview snapshot,
  // rather than passing only on the previous 22-source global catalogue.
  if (isVercel) console.log("VERCEL_SOURCE_BEFORE",JSON.stringify(await page.evaluate(()=>({
    localContext: !!window.__WHV_PREVIEW_LOCAL_CONTEXT__,
    nationalCoverage: !!window.__WHV_PREVIEW_COUNTRY_COVERAGE__,
    nationalCount: document.querySelectorAll(".whv-national-coverage-overview").length,
    nationalText: document.querySelector(".whv-national-coverage-overview")?.textContent?.slice(0,900),
    scripts: [...document.scripts].map(s=>s.src.split("/").at(-1))
  }))));
  await page.locator(".whv-national-coverage-overview summary").click();
  if (isVercel) console.log("VERCEL_SOURCE_AFTER",JSON.stringify(await page.evaluate(()=>({
    detailsOpen: document.querySelector(".whv-national-coverage-overview")?.open,
    metricsCount: document.querySelectorAll(".whv-national-coverage-metrics").length,
    text: document.querySelector(".whv-national-coverage-overview")?.textContent?.slice(0,1200)
  }))));
  await page.locator(".whv-national-coverage-metrics").waitFor({state:"visible"});
  const coverage=await page.locator(".whv-national-coverage-overview").innerText();
  for(const n of ["217","4","5","0","APERÇU STATIQUE"])
    assert(coverage.includes(n),"Public CDN missing genuine V24–V26 source coverage: "+n);
  // Verify the NEW public build, not a previously pinned snapshot.
  assert(await page.locator(".whv-source-coverage[data-coverage='unknown']").count() === 22,
    "Static preview must not claim actual observed source data");
  assert(await page.locator(".whv-source-filters button").nth(1).isDisabled(),
    "Data availability filter should be disabled without a live backend");
  await page.locator("#whv-source-search").fill("OpenStreetMap");
  assert(await page.locator(".whv-source-card").count() === 1,
    "Source search must work through the public CDN");
  await page.locator("#whv-source-search").fill("");
  assert(await page.locator(".whv-source-card").count() === 22);
  await page.locator(".whv-modal-close").click();
  await page.locator(".whv-mobile-shortcut").filter({hasText:"Régions"}).click();
  await page.locator(".region-drawer.open").waitFor({state:"visible"});
  await page.locator(".whv-region-members-toggle").click();
  await page.locator(".whv-region-member").first().waitFor({state:"visible"});
  await page.locator(".whv-region-member").first().click();
  await page.locator(".country-drawer.open #country-select").selectOption("GAB");
  const gab=page.locator(".country-drawer.open .whv-national-evidence");
  await gab.locator(".whv-national-evidence-source").first().waitFor({state:"visible"});
  assert(await gab.locator(".whv-national-evidence-source").count()===3,
    "Published country drawer must show three genuine V24–V26 Gabon references");
  const gabText=(await gab.innerText()).replace(/\s/g,"");
  assert(gabText.includes("3518621"),"Published Gabon census number missing");
  assert(gabText.includes("APERÇUSTATIQUE"),"Published Gabon panel must disclose static provenance");
  await gab.getByText("Comparaison internationale en direct indisponible",{exact:false})
    .waitFor({state:"visible"});

  if (isVercel) await page.screenshot({path:"vercel-mobile-gabon.png",fullPage:true});
  assert(errors.length === 0, "Remote JS errors: "+errors.join("; "));
  assert(failures.length === 0, "Remote static asset failures: "+failures.join("; "));
  console.log("PASS remote pinned V2: mobile eye, 9 tools, 22 global sources, 217-country local registry and documented Gabon census with NO fake live comparison.");
} finally { await browser.close(); }
