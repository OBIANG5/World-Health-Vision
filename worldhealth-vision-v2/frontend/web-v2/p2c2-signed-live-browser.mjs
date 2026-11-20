/**
 * PRODUCT-P2C2: REAL React → Gateway → Timeseries/PostgreSQL six-service test.
 * A separate ephemeral Python signer created a signed SYNTHETIC observation
 * and the ingestion client actually POSTed it. This test injects NO fetch mocks.
 * The same running iPhone page must lose it after an actual SQL revocation.
 */
import assert from "node:assert/strict";
import { spawn, spawnSync } from "node:child_process";
import { readFileSync, mkdirSync } from "node:fs";
import { chromium } from "playwright";

const origin = "http://127.0.0.1:5219";
const repoRoot = "worldhealth-vision-v2";
const root = process.env.WHV_COMPILED_DIRECTORY ?? repoRoot + "/frontend/web-v2/dist";
const tempDir = process.env.WHV_P2C2_DIRECTORY;
assert(tempDir && tempDir.startsWith("/"), "Ephemeral proof directory must be absolute");
const server = spawn("python3", [
  repoRoot + "/infra/tests/p2b_same_origin_preview.py",
  "--root", root, "--gateway", "http://127.0.0.1:18080", "--port", "5219"
], { stdio: "ignore" });

const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));
const metadata = JSON.parse(readFileSync(tempDir + "/proof-public.json", "utf8"));
assert.equal(metadata.expectedCountry, "GAB");
assert.equal(metadata.expectedIndicator, "SYNTH.P2C2.QA");
mkdirSync("p2c2-artifacts", { recursive: true });
let browser;

async function gatewayState(page, country) {
  return page.evaluate(async iso3 => {
    const requests = [
      "/api/timeseries/countries/" + iso3 + "/published-coverage",
      "/api/timeseries/countries/" + iso3 + "/published-indicators?limit=100",
      "/api/timeseries/series/latest?countryIso3=" + iso3 +
        "&indicatorCode=SYNTH.P2C2.QA",
      "/api/timeseries/compare/countries/latest?countryIso3=" + iso3 +
        "&indicatorCode=SYNTH.P2C2.QA",
    ];
    return Promise.all(requests.map(async path => {
      const response = await fetch(path, { cache: "no-store" });
      const body = await response.json();
      return { status: response.status, body };
    }));
  }, country);
}

async function gotoCountry(page, iso3) {
  await page.goto(origin + "/?wv=country&iso3=" + iso3, {
    waitUntil: "domcontentloaded"
  });
  await page.locator("canvas.whv-globe-canvas").waitFor({
    state: "visible", timeout: 26000
  });
  await page.locator(".country-drawer.open").waitFor({
    state: "visible", timeout: 26000
  });
  const evidence = page.locator(".whv-national-evidence");
  await evidence.waitFor({ state: "attached", timeout: 22000 });
  if (!(await evidence.evaluate(node => node.open))) {
    await evidence.locator(":scope > summary").click();
  }
}

async function chooseSynthetic(page, descriptor) {
  const explorer = page.locator(".whv-published-explorer");
  await explorer.waitFor({ state: "visible", timeout: 24000 });
  const indicator = explorer.locator(".whv-published-indicator");
  await indicator.waitFor({ state: "visible", timeout: 22000 });
  assert((await indicator.innerText()).includes("NOT REAL DATA"),
    "A synthetic data indicator must carry visible non-institutional provenance");
  assert.equal(await explorer.locator(".whv-published-value").count(), 0,
    "Never select a default indicator or grant implicit verification");
  await indicator.click();
  const value = explorer.locator(".whv-published-value");
  await value.waitFor({ state: "visible", timeout: 22000 });
  const text = await value.innerText();
  assert(text.includes("17") && text.includes("WHV_SYNTHETIC_QA"), "Wrong signed test value/source: " + text);
  assert((await explorer.innerText()).includes("CI test units"),
    "Unit must come from Catalog, not a guessed label");
  assert((await explorer.innerText()).includes("2024"), "Signed period absent");
  await value.locator("button").click();
  const details = explorer.locator(".whv-published-source-note");
  await details.waitFor({ state: "visible", timeout: 15000 });
  const sourceText = await details.innerText();
  assert(sourceText.includes("SYNTHETIC QA ONLY"), "Source rights disclaimer missing");
  assert(sourceText.includes("Fictional value"), "Methodological limitation missing");
  const delta = await explorer.evaluate(node => node.scrollWidth - node.clientWidth);
  assert(delta <= 3, descriptor + " explorer overflows: " + delta);
  await page.screenshot({
    path: "p2c2-artifacts/" + descriptor + "-REAL-SIGNED-SYNTHETIC-before.png",
    fullPage: true
  });
  return explorer;
}

function revokeInActualDb() {
  const files = [
    repoRoot + "/infra/compose.secure-staging.yml",
    repoRoot + "/infra/tests/compose.ci-public-read.yml",
    repoRoot + "/infra/tests/compose.ci-synthetic-rights.yml",
  ];
  const args = files.flatMap(f => ["-f", f]).concat([
    "exec", "-T", "whv-timescaledb", "psql", "-v", "ON_ERROR_STOP=1",
    "-U", "whv_user", "-d", "whv",
  ]);
  // CI-only SQL was generated in memory along with signed rights, not taken
  // from the webpage. No shell, credentials or private keys enter stdout.
  const result = spawnSync("docker", ["compose", ...args], {
    input: readFileSync(tempDir + "/revoke.sql"), encoding: "utf8",
    timeout: 25000, maxBuffer: 1024 * 1024,
    env: process.env,
  });
  assert.equal(result.status, 0,
    "Real PostgreSQL rights revocation failed: " +
    String(result.stderr ?? "").slice(0, 400));
  console.log("PASS: actual append-only rights_revocation inserted in disposable PostgreSQL");
}

try {
  let serving = false;
  for (let i = 0; i < 60; i++) {
    try { serving = (await fetch(origin + "/index.html")).ok; if (serving) break; }
    catch { /* local CI server starting */ }
    await sleep(300);
  }
  assert(serving, "Real compiled Atlas and Gateway proxy not serving");
  // GitHub-hosted Ubuntu runners normally ship Chrome; downloading Chromium
  // again wastes bandwidth and can hang on the browser CDN. The workflow
  // verifies system Chrome first, then installs Playwright headless-shell only
  // when needed. Both execute the EXACT same browser acceptance code.
  browser = await chromium.launch({
    headless: true,
    channel: process.env.WHV_BROWSER_CHANNEL === "chrome" ? "chrome" : undefined,
    args: ["--no-sandbox"],
  });

  // Same real state in 320px, iPhone and desktop, no fake fixtures.
  const contexts = [
    { name: "iphone-320", width: 320, height: 700, isMobile: true },
    { name: "iphone-390", width: 390, height: 844, isMobile: true },
    { name: "desktop-1440", width: 1440, height: 900, isMobile: false },
  ];
  let liveIphone;
  for (const cfg of contexts) {
    const page = await browser.newPage({
      viewport: { width: cfg.width, height: cfg.height },
      isMobile: cfg.isMobile, hasTouch: cfg.isMobile, deviceScaleFactor: 1
    });
    const errors = [];
    page.on("pageerror", error => errors.push(error.message));
    await gotoCountry(page, "GAB");
    const explorer = await chooseSynthetic(page, cfg.name);

    const state = await gatewayState(page, "GAB");
    assert(state.every(row => row.status === 200), "Gateway didn't permit reviewed read");
    assert.equal(state[0].body.coverageStatus, "PUBLISHED_DATA_AVAILABLE");
    assert.equal(state[0].body.availableObservationCount, 1);
    assert.equal(state[1].body.count, 1);
    assert.equal(state[1].body.items[0].indicatorCode, "SYNTH.P2C2.QA");
    assert.equal(state[2].body.count, 1);
    assert.equal(state[2].body.items[0].numericValue, 17);
    assert.equal(state[3].body.count, 1,
      "Public country comparison must use same validated source-revocation view");

    const privateStatus = await page.evaluate(async () =>
      (await fetch("/api/timeseries/source-runs")).status);
    assert.equal(privateStatus, 401, "Untrusted browser accessed operator source runs");

    if (cfg.name === "iphone-390") {
      // Leave this very same page, explorer and source evidence on screen until
      // the database grant is REVOKED. Then trigger normal app revalidation.
      liveIphone = { page, explorer, errors };
    } else {
      assert.deepEqual(errors, [], cfg.name + ": browser JS error");
      await page.close();
    }
    console.log("PASS P2C2 " + cfg.name + ": signed synthetic DB observation renders in REAL Atlas");
  }
  assert(liveIphone, "No running phone page to validate real revocation");
  const page = liveIphone.page;

  // FRA/BRA are still catalogued countries, NOT proof of any publishable series.
  for (const country of ["FRA", "BRA"]) {
    const state = await gatewayState(page, country);
    assert(state[0].status === 200 && state[0].body.availableObservationCount === 0);
    assert(state[0].body.coverageStatus === "NO_PUBLICLY_ELIGIBLE_DATA");
    assert(state[1].body.count === 0 && state[2].body.count === 0 && state[3].body.count === 0);
  }

  // ACTUAL rights decision revoked in PostgreSQL while this same phone is open.
  revokeInActualDb();
  await page.evaluate(() => window.dispatchEvent(new Event("focus")));
  const release = page.locator(".whv-national-evidence-release").first();
  await release.getByText("Aucune observation actuellement autorisée", { exact: false })
    .waitFor({ state: "visible", timeout: 24000 });
  await liveIphone.explorer.waitFor({ state: "hidden", timeout: 22000 });
  assert.equal(await page.locator(".whv-published-figure").count(), 0,
    "Signed old value persisted after real DB revocation");
  const after = await gatewayState(page, "GAB");
  assert(after.every(row => row.status === 200));
  assert.equal(after[0].body.coverageStatus, "NO_PUBLICLY_ELIGIBLE_DATA");
  assert.equal(after[0].body.availableObservationCount, 0);
  assert(after.slice(1).every(row => row.body.count === 0),
    "An old signed value still escaped through a public series or comparison");
  await page.screenshot({
    path: "p2c2-artifacts/iphone-390-REAL-DATABASE-REVOKED-after.png",
    fullPage: true
  });
  assert.deepEqual(liveIphone.errors, [],
    "JavaScript errors during full signed ingestion/revocation: " + liveIphone.errors);
  console.log("PASS P2C2 same-iPhone: real signed observation disappeared after actual DB rights revocation");
} finally {
  await browser?.close();
  server.kill("SIGTERM");
}
