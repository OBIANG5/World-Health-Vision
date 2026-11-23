/**
 * Atlas U2: REAL V2 still usable without the private backend.
 * A reviewed WB geographic snapshot is allowed; fake statistical series aren't.
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
    // Country is the product: a dated official GEOGRAPHIC fallback survives
    // even with no Gateway/Catalog/Timeseries, without inventing statistics.
    const catalogStatus = page.locator(".whv-country-profile-snapshot-note");
    await catalogStatus.waitFor({ state: "visible", timeout: 15000 });
    const provenance = await catalogStatus.innerText();
    assert(provenance.includes("Banque mondiale") && provenance.includes("2026-11-22"),
      "WB metadata source and date must be human-readable on every country");
    assert.equal(await catalogStatus.locator('a[href^="https://"]').count(), 2,
      "Direct original provider and license links must remain visible");
    const countryPicker = page.locator("#country-select");
    await countryPicker.waitFor({ state: "visible" });
    assert((await countryPicker.locator("option").count()) >= 190,
      "Global country search may not vanish merely because Gateway is down");
    assert(await countryPicker.locator('option[value="FRA"]').count() === 1 &&
      await countryPicker.locator('option[value="BRA"]').count() === 1 &&
      await countryPicker.locator('option[value="CIV"]').count() === 1,
      "World Bank geographic fallback must cover multiple continents");
    const facts = page.locator(".whv-country-profile-facts");
    await facts.waitFor({ state: "visible" });
    const countryFacts = await facts.innerText();
    assert(countryFacts.includes("Libreville") && countryFacts.includes("Afrique subsaharienne"),
      "GAB must show actual sourced capital and region, not an empty state or fictitious figures");
    assert(!countryFacts.includes("0 sources") && !countryFacts.includes("PIB"),
      "Geographic metadata must not become fabricated statistical coverage");
    const map = page.locator(".wv3-geo-hero");
    await map.waitFor({ state: "visible" });
    await page.locator(".wv3-country-geometry > g > path").first().waitFor({ state: "visible" });
    assert.equal(await page.locator(".whv-country-story-photo").count(), 0,
      "Country now starts with genuine geographic geometry, never a city panorama");
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
      const franceFacts = page.locator(".whv-country-profile-facts");
      await franceFacts.waitFor({ state: "visible" });
      assert((await franceFacts.innerText()).includes("Paris"),
        "France must display its own sourced capital");
      assert(!(await franceFacts.innerText()).includes("Libreville"),
        "Country switch must not reuse Gabon geographic facts");

      assert.equal(await page.locator(".whv-route-notice").count(), 0,
        "Valid FRA country link cannot be flagged invalid because the backend is down");
      await page.locator(".whv-country-section-nav").getByRole("button", { name: "Actualités" }).click();
      const absentFeed = page.locator(".whv-country-news-empty");
      await absentFeed.waitFor({ state: "visible" });
      assert.equal(await page.locator(".whv-country-news-article").count(), 0,
        "Never display the Gabon/FMI story on France or another country");
      const franceMap = page.locator(".wv3-geo-hero");
      await franceMap.waitFor({ state: "visible" });
      assert((await franceMap.innerText()).includes("France"),
        "FRA map identity must not inherit the previous Gabon title");
      assert.equal(await franceMap.locator(".whv-country-story-photo").count(), 0,
        "Country photos must not return as misleading geographic headers");
      await page.screenshot({
        path: "ux1b-artifacts/390-country-france-honest-unavailable.png",
        fullPage: false,
      });
    }
    if (device.width === 390) {
      // End-to-end from global search to a real country profile on mobile.
      await page.goto(origin + "/?wv=search", { waitUntil: "domcontentloaded" });
      const discovery = page.locator('.world-discovery[role="dialog"]');
      await discovery.waitFor({ state: "visible" });
      await discovery.locator("input").fill("Gabon");
      const entry = discovery.locator(".world-discovery-result")
        .filter({ hasText: "Gabon" }).first();
      await entry.waitFor({ state: "visible" });
      assert((await entry.innerText()).includes("Libreville"),
        "Local search results must contain real country metadata");
      await entry.click();
      assert.equal(new URL(page.url()).searchParams.get("iso3"), "GAB",
        "Mobile search must open the requested country");
      await page.locator(".whv-country-overview").waitFor({ state: "visible" });
      await page.screenshot({
        path: "ux1b-artifacts/390-atlas-search-to-gabon.png", fullPage: false,
      });
    }
    await page.close();
  }

  // Simulate an actual late official indicator response. A person who switches
  // from GAB to FRA before GAB finishes must NEVER see GAB numeric data under
  // France. The browser still runs the real hook & React country drawer.
  const switching = await browser.newPage({ viewport: { width: 390, height: 844 },
    isMobile: true, hasTouch: true });
  const errors = [];
  switching.on("pageerror", error => errors.push(error.message));
  let gabCalls = 0, fraCalls = 0;
  await switching.route(/^https:\/\/api\.worldbank\.org\/v2\/country\/(GAB|FRA)\/indicator\//,
    async route => {
      const url = new URL(route.request().url());
      const gab = url.pathname.includes("/country/GAB/");
      if (gab) gabCalls++; else fraCalls++;
      // Independent mocked 2025 values, explicitly SYNTHETIC for CI ONLY.
      await delay(gab ? 1200 : 50);
      const rows = url.searchParams.get("source") === "2"
        ? [{ indicator: { id: "NY.GDP.PCAP.CD" }, date: "2025",
            value: gab ? 123456 : 987654 }] : [];
      await route.fulfill({ status: 200,
        headers: { "access-control-allow-origin": "*", "content-type": "application/json" },
        body: JSON.stringify([{ page: 1, pages: 1, total: rows.length }, rows]) });
    });
  await switching.goto(origin + "/?wv=country&iso3=GAB",
    { waitUntil: "domcontentloaded" });
  await switching.locator(".country-drawer.open").waitFor({ state: "visible" });
  await switching.locator("#country-select").selectOption("FRA");
  await switching.locator(".wv3-country-identity h2").filter({ hasText: "France" })
    .waitFor({ state: "visible" });
  await switching.waitForFunction(() =>
    [...document.querySelectorAll(".overview-kpi-value")]
      .some(node => (node.textContent ?? "").includes("987")),
    null, { timeout: 15000 });
  await delay(1500);
  const numbersAfterLateGabon = await switching.locator(".overview-kpi-value").allTextContents();
  assert(numbersAfterLateGabon.some(text => text.includes("987")),
    "A synthetic France response must be displayed under France");
  assert(!numbersAfterLateGabon.some(text => text.includes("123")),
    "Late GAB API responses must never contaminate the FRA country profile");
  assert(gabCalls > 0 && fraCalls > 0,
    "The race test must genuinely exercise both countries");
  assert.deepEqual(errors, [], "No React browser errors during fast country navigation");
  await switching.screenshot({
    path: "ux1b-artifacts/390-country-switch-no-cross-contamination.png",
    fullPage: false,
  });
  await switching.close();
} finally {
  await browser?.close();
  server.kill("SIGTERM");
}
