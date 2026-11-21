/**
 * Chromium E2E on the compiled, real React app. Synthetic user input ONLY;
 * no price feed, trading order, copied course material or server account.
 */
import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { mkdirSync } from "node:fs";
import { chromium } from "playwright";

const port = 5228;
const origin = "http://127.0.0.1:" + port;
const server = spawn("python3", ["-m", "http.server", String(port), "--bind", "127.0.0.1", "--directory", "dist"], { stdio: "ignore" });
const sleep = (duration) => new Promise((resolve) => setTimeout(resolve, duration));
mkdirSync("trading-process-artifacts", { recursive: true });
let browser;
try {
  let ready = false;
  for (let attempt = 0; attempt < 60; attempt++) {
    try {
      const r = await fetch(origin + "/index.html");
      if (r.ok) { ready = true; break; }
    } catch { /* server not started */ }
    await sleep(250);
  }
  assert(ready, "Compiled SPA failed to serve");
  browser = await chromium.launch({
    headless: true,
    channel: process.env.WHV_BROWSER_CHANNEL === "chrome" ? "chrome" : undefined,
    args: ["--no-sandbox"],
  });
  for (const screen of [
    { id: "small-320", width: 320, height: 700, mobile: true },
    { id: "iphone-390", width: 390, height: 844, mobile: true },
    { id: "desktop-1440", width: 1440, height: 900, mobile: false },
  ]) {
    const context = await browser.newContext({
      viewport: { width: screen.width, height: screen.height },
      isMobile: screen.mobile, hasTouch: screen.mobile, deviceScaleFactor: 1,
      acceptDownloads: true,
    });
    const page = await context.newPage();
    const errors = [];
    page.on("pageerror", (error) => errors.push(error.message));
    await page.goto(origin + "/?wv=trading", { waitUntil: "domcontentloaded" });
    const panel = page.locator("section.tvp-dialog");
    await panel.waitFor({ state: "visible", timeout: 15000 });
    assert.equal(await page.locator("nav.tvp-stages button.tvp-stage").count(), 8, "Seven stages plus evidence registry");
    assert((await page.locator(".tvp-disclaimer").innerText()).includes("aucun flux de marché"),
      "No fake live feed or broker claims");
    const all = await panel.evaluate((el) => ({ visibleWidth: el.clientWidth, totalWidth: el.scrollWidth }));
    assert(all.totalWidth <= all.visibleWidth + 3, screen.id + " horizontal overflow: " + JSON.stringify(all));

    await page.locator(".tvp-identity input").first().fill("SYNTHETIC-PAIR");
    await page.locator(".tvp-identity select").nth(0).selectOption("spot");
    await page.locator(".tvp-identity select").nth(1).selectOption("long");
    await page.locator("nav.tvp-stages button").nth(1).click();
    await page.locator("#trading-field-entry").fill("100");
    await page.locator("#trading-field-stop").fill("98");
    await page.locator("#trading-field-target").fill("106");
    assert((await page.locator(".tvp-risk").innerText()).includes("1 : 3.00"), "Expected 3:1 gross R:R");
    await page.locator("nav.tvp-stages button").nth(2).click();
    await page.locator("#trading-field-rMax").fill("250");
    await page.locator("#trading-field-riskPercent").fill("50");
    await page.locator("#trading-field-accountCurrency").fill("EUR");
    assert((await page.locator(".tvp-risk").innerText()).includes("125"), "Expected 125 account-currency R max fraction");

    await page.locator("nav.tvp-stages button").last().click();
    const fields = page.locator(".tvp-evidence-entry");
    await fields.locator("input").nth(0).fill("Test primary document");
    await fields.locator("input").nth(1).fill("ORIGINAL-PUBLISHER-TEST");
    await fields.locator("input").nth(2).fill("https://example.org/primary");
    await fields.locator("input").nth(3).fill("2026-11-20");
    await fields.locator("select").nth(0).selectOption("national");
    await fields.locator("select").nth(1).selectOption("challenges");
    await fields.locator("textarea").fill("Synthetic competing interpretation, not factual market data");
    await fields.getByRole("button", { name: /Ajouter au dossier/ }).click();
    assert.equal(await page.locator(".tvp-evidence-card").count(), 1, "Evidence must be visibly recorded");

    await page.getByRole("button", { name: /Enregistrer sur cet appareil/ }).click();
    const saved = await page.evaluate(() => localStorage.getItem("world-vision:trading-mta-process:v1"));
    assert(saved && saved.includes("SYNTHETIC-PAIR"), "Explicit local save did not persist");
    await page.reload({ waitUntil: "domcontentloaded" });
    await panel.waitFor({ state: "visible" });
    assert.equal(await page.locator(".tvp-identity input").first().inputValue(), "",
      "Local storage MUST NOT silently load personal research");
    await page.getByRole("button", { name: /^Recharger$/ }).click();
    assert.equal(await page.locator(".tvp-identity input").first().inputValue(), "SYNTHETIC-PAIR",
      "Explicit restore must reload saved draft");
    const [download] = await Promise.all([
      page.waitForEvent("download"),
      page.getByRole("button", { name: /Exporter JSON/ }).click(),
    ]);
    assert.equal(download.suggestedFilename(), "world-vision-trade-plan.json");
    await page.screenshot({ path: "trading-process-artifacts/" + screen.id + "-process.png", fullPage: false });
    await page.getByRole("button", { name: /^Fermer$/ }).click();
    assert.equal(new URL(page.url()).searchParams.get("wv"), null, "Close must remove trading URL");
    assert.deepEqual(errors, [], "JS errors on " + screen.id + ": " + errors.join(" | "));
    console.log("PASS " + screen.id + " real React trade workflow: 7 steps, math, evidence, opt-in save, restore, export and route");
    await context.close();
  }
} finally {
  await browser?.close();
  server.kill();
}
