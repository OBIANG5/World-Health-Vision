/**
 * PRODUCT-P2B: LIVE six-service Gateway acceptance from the real compiled UI.
 * NO archived fixtures, mock coverage, synthetic public grants, or data faking.
 * mode=baseline|outage|recovery. These are ephemeral GitHub-hosted services.
 */
import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { mkdirSync } from "node:fs";
import { chromium } from "playwright";

const mode = process.argv.find(a => a.startsWith("--mode="))?.split("=")[1] ?? "baseline";
assert(["baseline", "outage", "recovery"].includes(mode), "Invalid test mode");
const origin = "http://127.0.0.1:5219";
const root = process.env.WHV_COMPILED_DIRECTORY ??
  "worldhealth-vision-v2/frontend/web-v2/dist";
const server = spawn("python3", [
  "worldhealth-vision-v2/infra/tests/p2b_same_origin_preview.py",
  "--root", root, "--port", "5219", "--gateway", "http://127.0.0.1:18080"
], { stdio: "ignore" });
const sleep = ms => new Promise(done => setTimeout(done, ms));
mkdirSync("p2b-artifacts", { recursive: true });
let browser;
try {
  let available = false;
  for (let n = 0; n < 75; n++) {
    try { available = (await fetch(origin + "/index.html")).ok; if (available) break; }
    catch { /* wait for loopback test proxy */ }
    await sleep(300);
  }
  assert(available, "CI read-only frontend+real Gateway proxy did not start");
  browser = await chromium.launch({ headless: true, args: ["--no-sandbox"] });
  const countries = mode === "baseline" ? ["GAB", "FRA", "BRA"] : ["GAB"];
  for (const iso3 of countries) {
    const page = await browser.newPage({
      viewport: { width: 390, height: 844 },
      isMobile: true, hasTouch: true, deviceScaleFactor: 1
    });
    const errors = [];
    page.on("pageerror", error => errors.push(error.message));
    const response = await page.goto(
      origin + "/?wv=country&iso3=" + iso3, { waitUntil: "domcontentloaded" });
    assert.equal(response?.status(), 200, "Compiled frontend HTTP error");
    await page.locator("canvas.whv-globe-canvas")
      .waitFor({ state: "visible", timeout: 25000 });
    await page.locator(".country-drawer.open")
      .waitFor({ state: "visible", timeout: 25000 });
    const accordion = page.locator(".whv-national-evidence");
    await accordion.waitFor({ state: "attached", timeout: 25000 });
    const opened = await accordion.evaluate(node => node.open);
    if (!opened) await accordion.locator(":scope > summary").click();
    const coverage = page.locator('.whv-national-evidence-release[aria-label="Données réellement publiables pour ce pays"]');
    await coverage.waitFor({ state: "visible", timeout: 25000 });
    const expected = mode === "outage"
      ? "État des séries non vérifiable actuellement"
      : "Aucune observation actuellement autorisée";
    await page.waitForFunction(
      text => [...document.querySelectorAll(".whv-national-evidence-release[aria-label]")]
        .some(node => node.textContent?.includes(text)),
      expected, { timeout: 26000 });
    const shown = await coverage.innerText();
    assert(shown.includes(expected), mode + "/" + iso3 + ": " + shown);
    assert(!shown.includes("Observations disponibles"),
      "Never fabricate authorized data from the country catalogue");
    if (mode === "outage") {
      assert(!shown.includes("Aucune observation actuellement autorisée"),
        "503 service outage must NEVER be represented as zero observations");
    }
    const gateway = await page.evaluate(async code => {
      const response = await fetch("/api/timeseries/countries/" + code + "/published-coverage", {
        cache: "no-store"
      });
      let body; try { body = await response.json(); } catch { body = null; }
      return { status: response.status, body };
    }, iso3);
    if (mode === "outage") {
      assert(gateway.status >= 500,
        "Gateway outage should be an error, never an empty published dataset");
    } else {
      assert.equal(gateway.status, 200,
        "Real Gateway must allow public rights-gated GET");
      assert.equal(gateway.body?.countryIso3, iso3);
      assert.equal(gateway.body?.coverageStatus, "NO_PUBLICLY_ELIGIBLE_DATA");
      assert.equal(gateway.body?.availableObservationCount, 0);
      assert.equal(gateway.body?.publishedSourceCount, 0);
    }
    // Real catalog must be available independently of Timeseries failure.
    const catalog = await page.evaluate(async code => {
      const response = await fetch("/api/catalog/countries/" + code + "/local-context");
      const data = response.ok ? await response.json() : null;
      return { status: response.status, data };
    }, iso3);
    assert.equal(catalog.status, 200, "Actual national-source catalog must be reachable");
    assert.equal(catalog.data?.countryIso3, iso3);
    if (iso3 === "GAB" && mode === "baseline") {
      const count = await page.locator(".whv-source-compare-picker input").count();
      assert.equal(count, catalog.data.localSources.length,
        "Source-selection cards must come from the REAL Catalog response");
      if (count >= 2) {
        const checks = page.locator(".whv-source-compare-picker input");
        assert.equal(await page.locator(".whv-source-compare-item").count(), 0);
        await checks.nth(0).check();
        await checks.nth(1).check();
        assert.equal(await page.locator(".whv-source-compare-item").count(), 2,
          "Two-source user choice must still work against real Catalog");
      }
    }
    await page.screenshot({
      path: "p2b-artifacts/" + mode + "-" + iso3 + "-real-stack-iphone.png",
      fullPage: true
    });
    assert.deepEqual(errors, [], iso3 + " browser exception(s)");
    console.log("PASS P2B " + mode + "/" + iso3 +
      ": LIVE Catalog + Gateway + rights-gated Timeseries in genuine React app");
    await page.close();
  }

  if (mode === "baseline") {
    const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
    await page.goto(origin + "/?wv=country&iso3=ZZZ", { waitUntil: "domcontentloaded" });
    await page.locator(".whv-route-notice")
      .waitFor({ state: "visible", timeout: 25000 });
    assert.equal(await page.locator(".country-drawer.open").count(), 0,
      "Nonexistent country should not receive an invented country profile");
    const privateAccess = await page.evaluate(async () =>
      (await fetch("/api/timeseries/source-runs")).status);
    assert.equal(privateAccess, 401,
      "Read-only browser same-origin proxy must retain Gateway private authorization");
    await page.close();
  }
} finally {
  await browser?.close();
  server.kill("SIGTERM");
}
