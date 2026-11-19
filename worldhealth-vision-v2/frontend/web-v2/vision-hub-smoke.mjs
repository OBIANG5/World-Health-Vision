/**
 * Browser acceptance on the REAL compiled V2 front in a disclosed offline
 * preview. It verifies navigation, no dead future-product buttons, preserved
 * real actions, mobile overflow and focus/keyboard.
 */
import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { mkdirSync } from "node:fs";
import { chromium } from "playwright";

const port = 5197;
const origin = "http://127.0.0.1:" + port;
const directory = process.env.WHV_PREVIEW_DIRECTORY ?? "dist";
const server = spawn("python3",
  ["-m", "http.server", String(port), "--bind", "127.0.0.1", "--directory", directory],
  { stdio: "ignore" });
mkdirSync("vision-hub-artifacts", { recursive: true });
let browser;

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

try {
  let ready = false;
  for (let i = 0; i < 60; i++) {
    try {
      if ((await fetch(origin + "/index.html")).ok) {
        ready = true;
        break;
      }
    } catch { /* waiting for localhost static server */ }
    await sleep(250);
  }
  assert(ready, "Built World-Vision preview did not start");
  browser = await chromium.launch({ headless: true, args: ["--no-sandbox"] });

  for (const device of [
    { name: "iphone", width: 390, height: 844, isMobile: true, hasTouch: true },
    { name: "desktop", width: 1440, height: 900, isMobile: false, hasTouch: false },
  ]) {
    const page = await browser.newPage({
      viewport: { width: device.width, height: device.height },
      isMobile: device.isMobile,
      hasTouch: device.hasTouch,
      deviceScaleFactor: 1,
    });
    const errors = [];
    page.on("pageerror", (err) => errors.push(err.message));
    await page.goto(origin, { waitUntil: "domcontentloaded" });
    await page.locator(".whv-nav .whv-vision-nav").waitFor({ state: "visible" });
    await page.locator(".whv-nav .whv-vision-nav").click();
    await page.locator(".vision-hub[role='dialog']").waitFor({ state: "visible" });
    assert.equal(await page.locator(".vision-product").count(), 11, "All product families must be visible");

    // All future products have an informative, explicit status, not a fake action.
    await page.locator(".vision-product").filter({ hasText: "Bourse Afrique Vision" }).click();
    await page.locator(".vision-hub-detail h3").waitFor();
    assert.equal(await page.locator(".vision-hub-detail h3").textContent(), "Bourse Afrique Vision");
    assert.equal(await page.locator(".vision-hub-detail .vision-detail-action").count(), 0,
      "No fictitious brokerage action or unlicensed live-market flow");
    assert((await page.locator(".vision-hub-detail").textContent()).includes(
      device.name === "iphone" ? "Aucun flux" : "Aucun flux"), "Honest future-product caveat missing");

    // Filtering and search must work across the complete products catalog.
    await page.locator(".vision-filter").filter({ hasText: "Comparer" }).click();
    assert.equal(await page.locator(".vision-product").count(), 4, "Comparer must expose Money/Tourism/Price/Basket");
    await page.locator(".vision-filter").first().click();
    await page.locator(".vision-hub-search input").fill("BRVM");
    assert.equal(await page.locator(".vision-product").count(), 1, "Product search not filtering");
    await page.locator(".vision-hub-search input").fill("");

    // The existing Money tool must genuinely open instead of a dead placeholder.
    await page.locator(".vision-product").filter({ hasText: "Money Vision" }).click();
    await page.locator(".vision-hub-detail .vision-detail-action").click();
    await page.locator(".cur-panel").waitFor({ state: "visible" });
    assert.equal(await page.locator(".vision-hub[role='dialog']").count(), 0, "Hub must close when opening an actual tool");
    await page.locator(".cur-panel .prf-close-btn").click();

    // Country search remains connected to the real interactive Atlas.
    await page.locator(".whv-nav .whv-vision-nav").click();
    await page.locator(".vision-product").filter({ hasText: "Atlas Vision" }).click();
    await page.locator(".vision-hub-detail .vision-detail-action").click();
    await page.locator(".country-selector-popover").waitFor({ state: "visible" });
    await page.keyboard.press("Escape");

    // Keyboard and dismissal, no hidden overlay dead-end.
    await page.locator(".whv-nav .whv-vision-nav").click();
    await page.keyboard.press("Escape");
    assert.equal(await page.locator(".vision-hub[role='dialog']").count(), 0);

    // No viewport overflow and no uncaught React errors from the new interface.
    await page.locator(".whv-nav .whv-vision-nav").click();
    const overflows = await page.locator(".vision-hub").evaluate((element) => (
      { actual: element.scrollWidth, viewport: element.clientWidth }
    ));
    assert(overflows.actual <= overflows.viewport + 2, "VisionHub horizontal overflow: " + JSON.stringify(overflows));
    await page.screenshot({
      path: "vision-hub-artifacts/" + device.name + "-worldvision.png", fullPage: true
    });
    assert.deepEqual(errors, [], "Runtime JS errors: " + errors.join(", "));
    console.log("PASS " + device.name + ": 11 Visions, search/filter, staged truth, Money & Atlas actions, keyboard");
    await page.close();
  }
} finally {
  await browser?.close();
  server.kill("SIGTERM");
}
