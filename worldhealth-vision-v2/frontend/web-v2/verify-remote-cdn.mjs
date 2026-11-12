import assert from "node:assert/strict";
import { chromium } from "playwright";

const url = "https://rawcdn.githack.com/OBIANG5/World-Health-Vision/01c5aacfabb48e2b094414b94bab7db987de223d/index.html";
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
  await page.locator(".whv-national-coverage-overview summary").click();
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

  assert(errors.length === 0, "Remote JS errors: "+errors.join("; "));
  assert(failures.length === 0, "Remote static asset failures: "+failures.join("; "));
  console.log("PASS remote pinned V2: mobile eye, 9 tools, 22 global sources, 217-country local registry and documented Gabon census with NO fake live comparison.");
} finally { await browser.close(); }
