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
    assert.equal(await page.locator(".whv-route-notice").count(), 0,
      "Catalog outage must never mislabel a valid GAB country URL as invalid");
    const catalogStatus = page.locator(".whv-country-profile-source-status");
    await catalogStatus.waitFor({ state: "visible", timeout: 15000 });
    assert((await catalogStatus.innerText()).includes("Le catalogue des pays est momentanément inaccessible"),
      "Show a human-readable catalog outage, never raw HTTP/404 traces");
    assert.equal(await page.locator("#country-select").count(), 0,
      "Do not show an empty/invalid country selector without a catalog");
    const editorial = page.locator(".whv-country-story");
    await editorial.waitFor({ state: "visible" });
    const nav = page.locator(".whv-country-section-nav");
    await nav.waitFor({ state: "visible" });
    assert(await page.locator(".whv-country-overview").isVisible(),
      "Country identity and reference MUST lead, even without the backend");
    assert.equal(await page.locator(".whv-country-news").count(), 0,
      "News must never be imposed above the country profile");
    await page.screenshot({
      path: "ux1b-artifacts/" + device.name + "-country-overview-first.png",
      fullPage: false,
    });
    await nav.getByRole("button", { name: "Actualités" }).click();
    const dossier = page.locator(".whv-country-news-article");
    await dossier.waitFor({ state: "visible" });
    assert.equal(await dossier.locator(".whv-country-news-source-list a").count(), 0,
      "Deep research must require explicit opening");
    await dossier.locator(".whv-country-news-expand").click();
    assert.equal(await dossier.locator(".whv-country-news-source-list a").count(), 3,
      "Historical sources are visible only after entering News and expanding");
    await nav.getByRole("button", { name: "Sources" }).click();
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
    if (device.width === 390) {
      // A third country cannot inherit Gabon's historic news or photograph.
      await page.goto(origin + "/?wv=country&iso3=FRA",
        { waitUntil: "domcontentloaded" });
      await page.locator(".country-drawer.open").waitFor({ state: "visible" });
      assert.equal(await page.locator(".whv-route-notice").count(), 0,
        "Valid FRA country link cannot be flagged invalid because the backend is down");
      await page.locator(".whv-country-section-nav").getByRole("button", { name: "Actualités" }).click();
      const absentFeed = page.locator(".whv-country-news-empty");
      await absentFeed.waitFor({ state: "visible" });
      assert.equal(await page.locator(".whv-country-news-article").count(), 0,
        "Never display the Gabon/FMI story on France or another country");
      const frenchPhoto = page.locator(".whv-country-story-photo");
      if (await frenchPhoto.count()) {
        assert((await frenchPhoto.getAttribute("src")).includes("Paris_skyline"),
          "France must use its own reviewed country photo");
      }
      await page.screenshot({
        path: "ux1b-artifacts/390-country-france-honest-unavailable.png",
        fullPage: false,
      });
    }
    await page.close();
  }
} finally {
  await browser?.close();
  server.kill("SIGTERM");
}
