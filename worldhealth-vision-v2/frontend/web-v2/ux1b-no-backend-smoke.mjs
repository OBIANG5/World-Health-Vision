/**
 * World-Vision RC0: REAL V2 + no backend/catalog fixture must fail CLOSED.
 * A 404 or disconnected static preview is NOT evidence of zero local sources,
 * zero publishable observations, or a resolved news event.
 */
import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { mkdirSync } from "node:fs";
import { chromium } from "playwright";

const port = 5214;
const origin = "http://127.0.0.1:" + port;
const dir = process.env.WHV_PREVIEW_DIRECTORY ?? "dist";
const server = spawn("python3", ["-m", "http.server", String(port), "--bind", "127.0.0.1",
  "--directory", dir], { stdio: "ignore" });
mkdirSync("ux1b-artifacts", { recursive: true });
const delay = ms => new Promise(done => setTimeout(done, ms));
let browser;
try {
  let up = false;
  for (let i = 0; i < 60; i++) {
    try { up = (await fetch(origin + "/index.html")).ok; if (up) break; }
    catch { /* process startup */ }
    await delay(250);
  }
  assert(up, "Compiled V2 site must start in genuine static no-backend mode");
  browser = await chromium.launch({
    headless: true, args: ["--no-sandbox"],
    ...(process.env.WHV_BROWSER_CHANNEL ? { channel: process.env.WHV_BROWSER_CHANNEL } : {}),
  });
  for (const device of [
    { name: "320", width: 320, height: 700 },
    { name: "390", width: 390, height: 844 },
  ]) {
    const page = await browser.newPage({
      viewport: { width: device.width, height: device.height },
      isMobile: true, hasTouch: true, deviceScaleFactor: 1,
    });
    const errors = [];
    page.on("pageerror", err => errors.push(err.message));
    await page.goto(origin + "/?wv=country&iso3=GAB", { waitUntil: "domcontentloaded" });
    await page.locator(".country-drawer.open").waitFor({ state: "visible", timeout: 18000 });
    const country = page.locator(".whv-national-evidence");
    await country.waitFor({ state: "attached", timeout: 15000 });
    await country.locator('p[role="status"]').filter({
      hasText: "Sources locales non vérifiables",
    }).waitFor({ state: "visible", timeout: 18000 });
    await country.locator('p[role="status"]').filter({
      hasText: "État des séries non vérifiable actuellement",
    }).waitFor({ state: "visible", timeout: 18000 });
    assert.equal(await country.locator(".whv-national-evidence-source").count(), 0,
      "Disconnected Catalog must not invent institutions to meet a demo quota");
    const displayed = await country.innerText();
    assert(!displayed.includes("Aucune source locale documentée pour ce pays"),
      "Unavailable backend must not be described as a known empty source catalog");
    assert(!displayed.includes("Aucune observation actuellement autorisée"),
      "Unreachable Timeseries cannot be reported as verified zero coverage");
    assert.deepEqual(errors, [], "Real browser errors in disconnected Atlas country view");
    await page.screenshot({
      path: "ux1b-artifacts/" + device.name + "-no-backend-honest-unavailable.png",
      fullPage: true,
    });
    console.log("PASS RC0 " + device.name +
      "px: no backends, local catalog UNKNOWN, published coverage UNKNOWN; no fake zeros");
    await page.close();
  }
} finally {
  await browser?.close();
  server.kill("SIGTERM");
}
