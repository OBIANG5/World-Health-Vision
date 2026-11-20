/**
 * PRODUCT-P2A isolated browser regression: no source observations in production.
 * Synthetic coverage is intercepted only inside the Playwright page.
 */
import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { mkdirSync } from "node:fs";
import { chromium } from "playwright";
const port = 5218;
const origin = "http://127.0.0.1:" + port;
const directory = process.env.WHV_PREVIEW_DIRECTORY ?? "dist";
const server = spawn("python3", ["-m", "http.server", String(port), "--bind", "127.0.0.1", "--directory", directory], { stdio: "ignore" });
const sleep = ms => new Promise(done => setTimeout(done, ms));
mkdirSync("p2a-artifacts", { recursive: true });
let browser;
try {
  let ready = false;
  for (let i = 0; i < 60; i++) {
    try { ready = (await fetch(origin + "/index.html")).ok; if (ready) break; }
    catch { /* starting */ }
    await sleep(250);
  }
  assert(ready, "Unified offline preview not available");
  browser = await chromium.launch({ headless: true, args: ["--no-sandbox"] });
  for (const scenario of [
    { mode: "available", expected: "Observations disponibles", forbidden: "Aucune observation actuellement autorisée" },
    { mode: "empty", expected: "Aucune observation actuellement autorisée", forbidden: "Observations disponibles" },
    { mode: "down", expected: "État des séries non vérifiable actuellement", forbidden: "Aucune observation actuellement autorisée" },
    { mode: "invalid", expected: "État des séries non vérifiable actuellement", forbidden: "Observations disponibles" },
  ]) {
    const page = await browser.newPage({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
    const errors = [];
    page.on("pageerror", e => errors.push(e.message));
    await page.addInitScript(() => {
      let implementation = window.fetch.bind(window);
      Object.defineProperty(window, "fetch", {
        configurable: true,
        get: () => implementation,
        set: assigned => {
          implementation = (input, init) => {
            const raw = typeof input === "string" ? input : input?.url;
            const url = new URL(raw, window.location.href);
            const m = url.pathname.match(/^\/api\/timeseries\/countries\/([A-Z]{3})\/published-coverage$/);
            if (!m) return assigned(input, init);
            const mode = new URLSearchParams(location.search).get("wv_coverage_test");
            const zero = { countryIso3: m[1], coverageStatus: "NO_PUBLICLY_ELIGIBLE_DATA",
              availableObservationCount: 0, observedObservationCount: 0, estimatedObservationCount: 0,
              publishedIndicatorCount: 0, publishedSourceCount: 0 };
            const populated = { ...zero, coverageStatus: "PUBLISHED_DATA_AVAILABLE",
              availableObservationCount: 7, observedObservationCount: 5,
              estimatedObservationCount: 2, publishedIndicatorCount: 3, publishedSourceCount: 2 };
            const body = mode === "available" ? populated : mode === "invalid"
              ? { ...populated, observedObservationCount: 1 } : zero;
            return Promise.resolve(new Response(JSON.stringify(mode === "down" ? { detail: "SYNTHETIC 503" } : body),
              { status: mode === "down" ? 503 : 200,
                headers: { "content-type": "application/json" } }));
          };
        }
      });
    });
    await page.goto(origin + "/?wv=country&iso3=GAB&wv_coverage_test=" + scenario.mode, { waitUntil: "domcontentloaded" });
    await page.locator(".country-drawer.open").waitFor({ state: "visible", timeout: 20000 });
    await page.locator(".whv-national-evidence-source").first().waitFor({ state: "attached", timeout: 18000 });
    const selector = '.whv-national-evidence-release[aria-label="Données réellement publiables pour ce pays"]';
    const element = page.locator(selector);
    await element.waitFor({ state: "visible", timeout: 16000 });
    await page.waitForFunction(
      value => Array.from(document.querySelectorAll(".whv-national-evidence-release[aria-label]"))
        .some(n => n.textContent?.includes(value)),
      scenario.expected, { timeout: 15000 });
    const shown = await element.innerText();
    assert(shown.includes(scenario.expected), scenario.mode + ": wrong state: " + shown);
    assert(!shown.includes(scenario.forbidden), scenario.mode + ": false claim: " + shown);
    if (scenario.mode === "available") {
      assert(shown.includes("7") && shown.includes("3 indicateurs") && shown.includes("2 sources"),
        "Synthetic published coverage counters not shown");
      assert(shown.includes("5 observées") && shown.includes("2 estimées"),
        "Observed/estimated split not preserved");
    }
    assert(await page.locator(".whv-source-compare-picker input").count() >= 3,
      "Source selector lost during coverage integration");
    assert.equal(await page.locator(".whv-source-compare-item").count(), 0,
      "Do not imply automatic verification by choosing sources");
    await page.screenshot({ path: "p2a-artifacts/" + scenario.mode + "-iphone-SYNTHETIC.png", fullPage: true });
    assert.deepEqual(errors, [], "JavaScript exceptions: " + scenario.mode);
    console.log("PASS P2A synthetic "+scenario.mode+": no fabricated live country claims");
    await page.close();
  }
} finally {
  await browser?.close();
  server.kill("SIGTERM");
}
