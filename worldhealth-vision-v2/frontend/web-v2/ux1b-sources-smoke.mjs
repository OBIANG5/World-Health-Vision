/**
 * UX-1B real-browser acceptance for user-controlled source comparison.
 * Genuine World-Vision V2 React app, archival country/source fixtures clearly
 * marked. No fake news or numerical agreement/conflict assumptions.
 */
import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { mkdirSync } from "node:fs";
import { chromium } from "playwright";

const port = 5213;
const origin = "http://127.0.0.1:" + port;
const root = process.env.WHV_PREVIEW_DIRECTORY ?? "dist";
const server = spawn("python3", ["-m", "http.server", String(port), "--bind", "127.0.0.1", "--directory", root], { stdio: "ignore" });
const sleep = ms => new Promise(done => setTimeout(done, ms));
mkdirSync("ux1b-artifacts", { recursive: true });
let browser;

try {
  let serving = false;
  for (let i = 0; i < 60; i++) {
    try { serving = (await fetch(origin + "/index.html")).ok; if (serving) break; }
    catch { /* waiting for server */ }
    await sleep(250);
  }
  assert(serving, "Real compiled UX-1B preview failed to start");
  browser = await chromium.launch({ headless: true, args: ["--no-sandbox"] });

  for (const device of [
    { name: "small-mobile", width: 320, height: 700, mobile: true },
    { name: "iphone", width: 390, height: 844, mobile: true },
    { name: "tablet", width: 820, height: 1040, mobile: false },
    { name: "desktop", width: 1440, height: 900, mobile: false },
  ]) {
    const page = await browser.newPage({
      viewport: { width: device.width, height: device.height },
      isMobile: device.mobile,
      hasTouch: device.mobile,
      deviceScaleFactor: 1,
    });
    const errors = [];
    page.on("pageerror", err => errors.push(err.message));
    await page.goto(origin + "/", { waitUntil: "domcontentloaded" });
    await page.locator("canvas.whv-globe-canvas").waitFor({ state: "visible", timeout: 18000 });
    assert((await page.locator("canvas.whv-globe-canvas").count()) === 1, "Do not duplicate the real globe");

    if (device.mobile) {
      const card = page.locator(".whv-mobile-perspectives");
      await card.waitFor({ state: "visible" });
      assert((await card.textContent()).includes("Ne vous arrêtez pas à une source."),
        "Source plurality is not visible on the actual phone homepage");
      const sizes = await card.evaluate(node => ({ inner: node.clientWidth, actual: node.scrollWidth }));
      assert(sizes.actual <= sizes.inner + 2, device.name + " source card overflows: " + JSON.stringify(sizes));
      await card.locator("button").filter({ hasText: "Sources mondiales" }).click();
      assert.equal(new URL(page.url()).searchParams.get("wv"), "sources", "Global source directory action is dead");
      await page.screenshot({ path: "ux1b-artifacts/" + device.name + "-global-sources.png", fullPage: true });
      await page.goto(origin + "/", { waitUntil: "domcontentloaded" });
      await page.locator(".whv-mobile-perspectives").locator("button")
        .filter({ hasText: "Sources du pays" }).click();
      await page.locator(".country-drawer.open").waitFor({ state: "visible", timeout: 15000 });
      assert.equal(new URL(page.url()).searchParams.get("wv"), "country");
    } else {
      const desktopEntry = page.locator(".whv-story-perspectives");
      assert(await desktopEntry.isVisible(), "Desktop has lost source-plurality entry");
      await desktopEntry.locator("button").filter({ hasText: "Répertoire des sources" }).click();
      assert.equal(new URL(page.url()).searchParams.get("wv"), "sources", "Desktop source action is dead");
    }

    // GAB has THREE documented local-source metadata entries in the existing
    // archival fixture. This is a catalog comparison, NOT three live feeds.
    await page.goto(origin + "/?wv=country&iso3=GAB", { waitUntil: "domcontentloaded" });
    await page.locator(".country-drawer.open").waitFor({ state: "visible", timeout: 15000 });
    const evidence = page.locator(".whv-national-evidence");
    await evidence.waitFor({ state: "attached", timeout: 12000 });
    await page.locator(".whv-national-evidence-source").first().waitFor({ state: "attached", timeout: 15000 });
    const checkboxes = page.locator(".whv-national-evidence-source .whv-source-compare-picker input");
    assert((await checkboxes.count()) >= 3, "GAB original catalog source choices missing");
    assert.equal(await page.locator(".whv-source-compare-grid .whv-source-compare-item").count(), 0,
      "A source should not be privileged as the default comparison");
    await checkboxes.nth(0).check();
    assert.equal(await page.locator(".whv-source-compare-grid .whv-source-compare-item").count(), 0,
      "One source must not imply corroboration");
    await checkboxes.nth(1).check();
    assert.equal(await page.locator(".whv-source-compare-grid .whv-source-compare-item").count(), 2,
      "Exactly two user-selected source metadata cards expected");
    assert(await checkboxes.nth(2).isDisabled(), "A third source must not silently replace user's selection");

    const comparison = page.locator(".whv-source-compare-panel");
    assert((await comparison.textContent()).includes("Comparer les organismes n'établit"),
      "Missing methodological non-equivalence caveat");
    const urls = await comparison.locator(".whv-source-compare-item a[href]").evaluateAll(
      elements => elements.map(a => a.getAttribute("href")),
    );
    assert(urls.length === 2 && urls.every(url => url?.startsWith("https://")),
      "Only original HTTPS institutional links may be displayed");

    await checkboxes.nth(0).uncheck();
    assert(await checkboxes.nth(2).isEnabled(), "Visitor must be able to change viewpoint");
    assert.equal(await page.locator(".whv-source-compare-grid .whv-source-compare-item").count(), 0,
      "Comparison must reset when a source is removed");

    const contentSizes = await comparison.evaluate(node => ({ inner: node.clientWidth, actual: node.scrollWidth }));
    assert(contentSizes.actual <= contentSizes.inner + 3,
      device.name + " comparison layout overflows: " + JSON.stringify(contentSizes));
    await page.screenshot({ path: "ux1b-artifacts/" + device.name + "-source-choice.png", fullPage: true });
    assert.deepEqual(errors, [], device.name + " runtime errors: " + errors.join("; "));
    console.log("PASS UX-1B " + device.name + ": actual source choices, no defaults, original links, responsive layout, honest catalog");
    await page.close();
  }
} finally {
  await browser?.close();
  server.kill("SIGTERM");
}
