import assert from "node:assert/strict";
import { chromium } from "playwright";

const url = "https://rawcdn.githack.com/OBIANG5/World-Health-Vision/afbde14d572883a6a288476e7582999a0ec2323d/index.html";
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
  await page.locator(".whv-modal-close").click();
  await page.locator(".whv-mobile-shortcut").filter({hasText:"Régions"}).click();
  await page.locator(".region-drawer.open").waitFor({state:"visible"});
  await page.locator(".whv-region-members-toggle").click();
  await page.locator(".whv-region-member").first().waitFor({state:"visible"});
  assert(errors.length === 0, "Remote JS errors: "+errors.join("; "));
  assert(failures.length === 0, "Remote static asset failures: "+failures.join("; "));
  console.log("PASS remote pinned V2: Mobile overview, eye, tools, retirement and advisor.");
} finally { await browser.close(); }
