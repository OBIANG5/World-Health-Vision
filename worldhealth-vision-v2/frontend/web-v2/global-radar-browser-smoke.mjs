/**
 * R1 end-to-end Chromium testing on compiled REAL World-Vision V2 React/route.
 * All GDELT API replies are deliberately SYNTHETIC intercepts (never claim
 * the test is a live-provider, verified-news, production or backend test).
 */
import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { mkdirSync } from "node:fs";
import { chromium } from "playwright";

const port = 5231;
const origin = "http://127.0.0.1:" + port;
const server = spawn("python3", ["-m", "http.server", String(port), "--bind", "127.0.0.1",
  "--directory", process.env.WHV_PREVIEW_DIRECTORY ?? "dist"], { stdio: "ignore" });
const fixture = { articles: [
  { url: "https://gabon-local.example.org/article/one?utm_source=test",
    title: "Fixture A — Information publiée localement (non vérifiée)", seendate: "20261121T090100Z",
    sourcecountry: "Gabon", language: "French", domain: "gabon-local.example.org" },
  { url: "https://gabon-local.example.org/article/one?utm_source=syndication",
    title: "Fixture DUPLICATE", seendate: "20261121T090200Z",
    sourcecountry: "Gabon", language: "French", domain: "gabon-local.example.org" },
  { url: "https://international.example.org/article/two",
    title: "Fixture B — Publication internationale (non vérifiée)", seendate: "20261121T091000Z",
    sourcecountry: "United States", language: "English", domain: "international.example.org" },
  { url: "javascript:alert('unsafe')", title: "Unsafe script link" },
  { url: "https://gabon-local.example.org/article/third?id=42",
    title: "<img src=x onerror=alert(1)>", seendate: "invalid",
    sourcecountry: "Gabon", language: "French" },
] };
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
mkdirSync("global-radar-artifacts", { recursive: true });
let browser;

try {
  let ready = false;
  for (let n = 0; n < 60; n++) {
    try { ready = (await fetch(origin + "/index.html")).ok; if (ready) break; }
    catch { /* server starting */ }
    await sleep(250);
  }
  assert(ready, "Compiled V2 frontend cannot be served");
  browser = await chromium.launch({
    headless: true, args: ["--no-sandbox"],
    ...(process.env.WHV_BROWSER_CHANNEL ? { channel: process.env.WHV_BROWSER_CHANNEL } : {}),
  });
  for (const device of [
    { name: "320px", width: 320, height: 700, mobile: true },
    { name: "390px", width: 390, height: 844, mobile: true },
    { name: "1440px", width: 1440, height: 900, mobile: false },
  ]) {
    const page = await browser.newPage({
      viewport: { width: device.width, height: device.height },
      isMobile: device.mobile, hasTouch: device.mobile, deviceScaleFactor: 1,
    });
    const uncaught = [];
    page.on("pageerror", (error) => uncaught.push(error.message));
    let providerCalls = 0;
    let lastQuery = null;
    await page.route("https://api.gdeltproject.org/api/v2/doc/doc?**", async (route) => {
      providerCalls++;
      const requested = new URL(route.request().url());
      lastQuery = requested.searchParams.get("query");
      assert.equal(requested.searchParams.get("mode"), "artlist");
      assert.equal(requested.searchParams.get("format"), "json");
      assert.equal(requested.searchParams.get("maxrecords"), "40");
      assert.equal(route.request().headers().cookie, undefined, "Never send user cookies to public GDELT");
      await route.fulfill({
        status: 200, contentType: "application/json",
        headers: { "access-control-allow-origin": "*" },
        body: JSON.stringify(fixture),
      });
    });

    await page.goto(origin + "/?wv=radar", { waitUntil: "domcontentloaded" });
    await page.locator(".radar-dialog[role='dialog']").waitFor({ state: "visible" });
    await page.waitForTimeout(200);
    assert.equal(providerCalls, 0, "Radar must not issue a provider request before user click");
    assert.equal(await page.locator(".radar-candidates .radar-candidate").count(), 0,
      "No synthetic prepopulated news may appear");
    assert.equal(await page.evaluate(() => localStorage.getItem("world-vision:radar")), null,
      "No Radar data is silently saved");

    await page.locator(".radar-search-field input").fill("Gabon elections");
    await page.locator(".radar-form button[type=submit]").click();
    await page.locator(".radar-candidates .radar-candidate").first().waitFor();
    assert.equal(providerCalls, 1, "One explicit search must produce exactly one GDELT request");
    assert.equal(lastQuery, "Gabon elections");
    assert.equal(await page.locator(".radar-candidates .radar-candidate").count(), 3,
      "Deduplicate only equal links; reject malicious URLs; keep 3 distinct sources");
    assert((await page.locator(".radar-results-stats").innerText()).includes("3"));
    assert((await page.locator(".radar-result-heading").innerText()).includes("Gabon elections"));
    assert((await page.locator(".radar-filter-note").innerText()).includes("1"),
      "Duplicate + malformed counters need visibility");

    const cards = page.locator(".radar-candidates .radar-candidate");
    assert((await cards.first().innerText()).includes("Gabon"),
      "GDELT outlet origin displayed as metadata, not event country");
    assert((await cards.first().innerText()).includes("Paris"),
      "GDELT seen date has a clearly disclosed time zone");
    assert((await cards.first().innerText()).includes("non vérifié"),
      "GDELT list must never become a confirmed report");
    assert.equal(await page.locator(".radar-candidates img").count(), 0,
      "Provider title must be text, not render untrusted HTML");
    const links = await page.locator(".radar-candidates .radar-original").evaluateAll((anchors) =>
      anchors.map((a) => ({
        target: a.getAttribute("target"), rel: a.getAttribute("rel"),
        href: a.getAttribute("href"),
      })));
    assert.equal(links.length, 3);
    assert(links.every((a) => a.target === "_blank" &&
      a.rel.includes("noopener") && a.rel.includes("noreferrer") &&
      a.href.startsWith("https://")), "Outbound original links must be safe");

    await cards.nth(0).getByRole("button", { name: /Comparer cette source/ }).click();
    assert.equal(await page.locator(".radar-comparison").count(), 0,
      "One candidate is NOT evidence of comparison");
    await cards.nth(1).getByRole("button", { name: /Comparer cette source/ }).click();
    const compare = page.locator(".radar-comparison");
    await compare.waitFor();
    assert.equal(await compare.locator(".radar-candidate").count(), 2);
    assert((await compare.innerText()).includes("indépendance"),
      "Two outlets never automatically imply independent verification");
    assert((await compare.innerText()).includes("NON ÉVALUÉES"),
      "Correspondence/contradiction of article texts remains unverified");
    assert(await cards.nth(2).getByRole("button", { name: /Comparer cette source/ }).isDisabled(),
      "The third choice must not silently replace selected sources");

    const dialogSize = await page.locator(".radar-dialog").evaluate((node) => ({
      width: node.clientWidth, scroll: node.scrollWidth,
    }));
    const contentSize = await page.locator(".radar-content").evaluate((node) => ({
      width: node.clientWidth, scroll: node.scrollWidth,
    }));
    assert(dialogSize.scroll <= dialogSize.width + 2,
      "Dialog horizontal overflow " + JSON.stringify({ device, dialogSize }));
    assert(contentSize.scroll <= contentSize.width + 3,
      "Body horizontal overflow " + JSON.stringify({ device, contentSize }));

    await page.screenshot({ path: "global-radar-artifacts/" + device.name + "-source-comparison.png" });
    await page.keyboard.press("Escape");
    assert.equal(new URL(page.url()).searchParams.has("wv"), false);
    assert.equal(await page.locator(".radar-dialog").count(), 0);
    assert.deepEqual(uncaught, [], "React runtime errors " + uncaught.join("; "));
    console.log("PASS R1 " + device.name + ": real app route, opt-in, intercepted GDELT, dedupe, two original domains, safe links, keyboard, no overflow");
    await page.close();
  }

  // Explicitly verify sourcecountry filter semantics (outlet origin, not event location).
  const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
  let requestedFilter = null;
  await page.route("https://api.gdeltproject.org/api/v2/doc/doc?**", async (route) => {
    requestedFilter = new URL(route.request().url()).searchParams.get("query");
    await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ articles: [] }),
      headers: { "access-control-allow-origin": "*" } });
  });
  await page.goto(origin + "/?wv=radar");
  await page.locator(".radar-search-field input").fill("monetary policy");
  await page.locator(".radar-form-controls select").first().selectOption("gabon");
  await page.locator(".radar-form-controls select").last().selectOption("3d");
  await page.locator(".radar-form button[type=submit]").click();
  await page.locator(".radar-result-heading").waitFor();
  assert.equal(requestedFilter, "monetary policy sourcecountry:gabon");
  assert((await page.locator(".radar-empty").innerText()).includes("ne prouve pas"),
    "Zero results must not be misreported as zero events");
  assert.equal(await page.locator(".radar-candidate").count(), 0);
  await page.close();

  // A remote error is not a zero-news assertion, and 200 HTML must not be parsed as a report.
  for (const kind of ["429", "html"]) {
    const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
    await page.route("https://api.gdeltproject.org/api/v2/doc/doc?**", async (route) => {
      if (kind === "429") {
        await route.fulfill({ status: 429, body: "Too many requests", headers: { "access-control-allow-origin": "*" } });
      } else {
        await route.fulfill({ status: 200, body: "<html>Service notice</html>",
          contentType: "text/html", headers: { "access-control-allow-origin": "*" } });
      }
    });
    await page.goto(origin + "/?wv=radar");
    await page.locator(".radar-search-field input").fill("central banks");
    await page.locator(".radar-form button[type=submit]").click();
    const alert = page.locator(".radar-error[role='alert']");
    await alert.waitFor();
    assert((await alert.innerText()).includes(kind === "429" ? "limite" : "format inattendu"),
      "Provider errors must remain visible and honest: " + kind);
    assert.equal(await page.locator(".radar-candidate").count(), 0,
      "Never retain stale or fabricated results after failed search");
    await page.close();
  }
  console.log("PASS R1: country-source filter, truthful empty result, 429 throttle and 200 HTML failure");
} finally {
  await browser?.close();
  server.kill("SIGTERM");
}
