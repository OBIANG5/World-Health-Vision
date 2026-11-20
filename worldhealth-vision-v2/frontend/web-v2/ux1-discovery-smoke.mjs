/**
 * UX-1A acceptance: compiled React/Vite V2 on local static fixture,
 * actual (not mocked) globe and existing country/currency/source panels.
 * URLs must survive refresh, native history and static file hosting.
 */
import { chromium } from "playwright";
import assert from "node:assert/strict";
import { mkdirSync } from "node:fs";
import { spawn } from "node:child_process";

const port = "5201";
const origin = "http://127.0.0.1:" + port + "/";
const directory = process.env.WHV_PREVIEW_DIRECTORY ?? "dist";
const server = spawn("python3",
  ["-m", "http.server", port, "--bind", "127.0.0.1", "--directory", directory],
  { stdio: "ignore" });
const sleep = ms => new Promise(done => setTimeout(done, ms));
mkdirSync("ux1-artifacts", { recursive: true });
let browser;

try {
  let ready = false;
  for (let i = 0; i < 60; i++) {
    try {
      ready = (await fetch(origin)).ok;
      if (ready) break;
    } catch { /* local server still starting */ }
    await sleep(250);
  }
  assert(ready, "Actual compiled static V2 not available");
  browser = await chromium.launch({ headless: true, args: ["--no-sandbox"] });

  for (const device of [
    { name: "iphone", width: 390, height: 844, isMobile: true, hasTouch: true },
    { name: "desktop", width: 1440, height: 900, isMobile: false, hasTouch: false },
  ]) {
    const page = await browser.newPage({
      viewport: { width: device.width, height: device.height },
      isMobile: device.isMobile, hasTouch: device.hasTouch,
      deviceScaleFactor: 1,
    });
    const pageErrors = [];
    page.on("pageerror", error => pageErrors.push(error.message));
    await page.goto(origin + "?utm_source=ux1-internal-test", { waitUntil: "domcontentloaded" });
    await page.locator("canvas.whv-globe-canvas").waitFor({ state: "visible", timeout: 20000 });
    await page.waitForFunction(() => window.__WHV_PREVIEW_COUNTRIES__?.length >= 200);

    // Global discovery uses existing country data and bilingual product registry.
    await page.locator(".whv-nav .whv-global-search-trigger").click();
    await page.locator(".world-discovery[role='dialog']").waitFor({ state: "visible" });
    assert(new URL(page.url()).searchParams.get("wv") === "search");

    // Both desktop and phone must be able to switch languages without losing a search.
    if (device.name === "iphone") {
      assert(await page.locator(".whv-nav .whv-nav-btn--lang").isVisible(),
        "Mobile language selection was hidden by the old responsive navbar");
    }
    await page.locator(".world-discovery-language").click();
    assert((await page.locator(".world-discovery-header h2").textContent())
      .includes("What would you like to explore?"));
    await page.locator(".world-discovery-language").click();
    assert((await page.locator(".world-discovery-header h2").textContent())
      .includes("Que souhaitez-vous explorer ?"));

    await page.locator(".world-discovery-input input").fill("GAB");
    await page.locator(".world-discovery-results .world-discovery-result").filter({ hasText: "GAB" }).first().click();
    await page.locator(".country-drawer.open").waitFor({ state: "visible", timeout: 17000 });
    assert.equal(new URL(page.url()).searchParams.get("iso3"), "GAB");
    assert.equal(new URL(page.url()).searchParams.get("utm_source"), "ux1-internal-test");
    assert(!new URL(page.url()).searchParams.has("query"), "User free text leaked to query string");

    // Real country deep link must survive a hard reload on a static server.
    await page.reload({ waitUntil: "domcontentloaded" });
    await page.locator(".country-drawer.open").waitFor({ state: "visible", timeout: 17000 });
    await page.locator(".country-drawer.open .drawer-btn.close").click();
    await page.locator(".country-drawer.open").waitFor({ state: "hidden", timeout: 15000 });
    assert.equal(new URL(page.url()).searchParams.get("wv"), null, "Closing country must restore Home URL");

    // Deep links for planned Visions must preserve clearly honest scope.
    await page.goto(origin + "?wv=visions&product=brvm", { waitUntil: "domcontentloaded" });
    await page.locator(".vision-hub[role='dialog']").waitFor({ state: "visible", timeout: 15000 });
    assert.equal(await page.locator(".vision-hub-detail h3").textContent(), "Bourse Afrique Vision");
    assert.equal(await page.locator(".vision-hub-detail .vision-detail-action").count(), 0);
    await page.locator(".vision-product").filter({ hasText: "Money Vision" }).click();
    assert.equal(new URL(page.url()).searchParams.get("product"), "money");
    await page.goBack({ waitUntil: "domcontentloaded" });
    await page.locator(".vision-hub-detail h3").waitFor();
    assert.equal(await page.locator(".vision-hub-detail h3").textContent(), "Bourse Afrique Vision",
      "Native browser Back did not restore the prior selected Vision");
    await page.reload({ waitUntil: "domcontentloaded" });
    await page.locator(".vision-hub-detail h3").waitFor();
    assert.equal(await page.locator(".vision-hub-detail h3").textContent(), "Bourse Afrique Vision");

    // Route to an existing money converter must be real (not a nonfunctional card).
    await page.locator(".vision-product").filter({ hasText: "Money Vision" }).click();
    await page.locator(".vision-hub-detail .vision-detail-action").click();
    await page.locator(".cur-panel").waitFor({ state: "visible" });
    assert.equal(new URL(page.url()).searchParams.get("wv"), "money");
    await page.locator(".cur-panel .prf-close-btn").click();
    assert.equal(new URL(page.url()).searchParams.get("wv"), null);

    // Explicitly invalid/unrecognized URLs must NOT display fabricated data.
    await page.goto(origin + "?wv=country&iso3=ZZZ", { waitUntil: "domcontentloaded" });
    await page.locator(".whv-route-notice").waitFor({ state: "visible", timeout: 20000 });
    assert.equal(await page.locator(".country-drawer.open").count(), 0);
    await page.locator(".whv-route-notice button").click();
    await page.locator(".world-discovery[role='dialog']").waitFor({ state: "visible" });
    await page.locator(".world-discovery-input input").fill("brvm");
    assert.equal(await page.locator(".world-discovery-results .world-discovery-result").filter({hasText:"Bourse Afrique Vision"}).count(),1);

    // The query is local-only. ESC dismisses and the browser shell remains usable.
    assert(!new URL(page.url()).searchParams.has("q"));
    await page.keyboard.press("Escape");
    await page.locator(".world-discovery[role='dialog']").waitFor({ state: "hidden" });
    await page.keyboard.press("/");
    await page.locator(".world-discovery[role='dialog']").waitFor({ state: "visible" });
    await page.keyboard.press("Escape");

    await page.locator(".whv-nav .whv-global-search-trigger").click();
    const sizes = await page.locator(".world-discovery").evaluate(el => ({
      inner: el.clientWidth, scroll: el.scrollWidth
    }));
    assert(sizes.scroll <= sizes.inner + 2, "Horizontal overflow in global search: " + JSON.stringify(sizes));
    await page.screenshot({ path: "ux1-artifacts/" + device.name + "-global-discovery.png", fullPage: true });

    assert.deepEqual(pageErrors, [], device.name + " uncaught errors: " + pageErrors.join("; "));
    console.log("PASS UX-1A " + device.name + ": country deep links/refresh, Vision history, real FX, source honesty, keyboard");
    await page.close();
  }
} finally {
  await browser?.close();
  server.kill("SIGTERM");
}
