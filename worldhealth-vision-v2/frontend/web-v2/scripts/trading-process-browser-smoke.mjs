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
    assert.equal(await page.locator("nav.tvp-stages button.tvp-stage").count(), 9, "Seven stages plus evidence and DataAnalyse-style research");
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

    await page.locator("nav.tvp-stages button").nth(7).click();
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

    // DataAnalyse-style longitudinal research: thesis evolves instead of forcing
    // a fresh signal on each new event. All inputs are fictional synthetic tests.
    await page.locator("nav.tvp-stages button").nth(8).click();
    await page.locator(".tvp-research").waitFor({ state: "visible" });
    await page.locator(".tvp-research .tvp-evidence-entry input").first().fill("Synthetic central-bank scenario");
    await page.locator(".tvp-research .tvp-evidence-entry select").first().selectOption("reconsider");
    await page.locator(".tvp-research .tvp-evidence-entry textarea").nth(0).fill("New synthetic information; no live feed");
    await page.locator(".tvp-research .tvp-evidence-entry textarea").nth(1).fill("Recheck hypothesis; do not trade");
    await page.getByRole("button", { name: /Figer cette version du dossier/ }).click();
    assert((await page.locator(".tvp-research").innerText()).includes("Synthetic central-bank scenario"), "Thesis history must be visible");

    await page.getByRole("button", { name: /Annonces avant \/ après/ }).click();
    const prep = page.locator(".tvp-research .tvp-evidence-entry");
    await prep.locator("input").nth(0).fill("Synthetic price-index release");
    await prep.locator("input").nth(1).fill("2026-11-20T13:00");
    await prep.locator("input").nth(2).fill("2.0");
    await prep.locator("input").nth(3).fill("1.5");
    await prep.locator("input").nth(4).fill("%");
    await prep.locator("input").nth(5).fill("Original expectation publisher");
    await prep.locator("input").nth(6).fill("https://example.org/synthetic-expectation");
    await prep.locator("input").nth(7).fill("2026-11-20T10:00");
    await prep.locator("textarea").nth(0).fill("Higher-than-expected synthetic release");
    await prep.locator("textarea").nth(1).fill("Lower-than-expected synthetic release");
    await prep.getByRole("button", { name: /Figer la préparation/ }).click();
    assert((await page.locator(".tvp-research").innerText()).includes("RECONSTRUCTION RÉTROSPECTIVE"),
      "Historical release prepared today must not be mislabeled ex-ante");
    const history = page.locator(".tvp-research .tvp-evidence-card").first();
    await history.getByRole("button", { name: /Documenter le résultat/ }).click();
    const resultFields = history.locator(".tvp-result-entry");
    await resultFields.locator("input").nth(0).fill("2.4");
    await resultFields.locator("input").nth(1).fill("2026-11-20T13:20");
    await resultFields.locator("input").nth(2).fill("https://example.org/synthetic-result");
    await resultFields.locator("textarea").fill("Only a synthetic post-result example");
    await resultFields.locator('input[type="checkbox"]').check();
    await resultFields.getByRole("button", { name: /Ajouter le résultat sourcé/ }).click();
    assert((await history.innerText()).includes("Résultat SAISI"), "User-entered result not shown");
    assert((await history.innerText()).includes("Écart arithmétique"), "Arithmetic delta not shown");

    // P0C — two independent trade research cases with explicit saves only.
    await page.locator("#tvp-case-title").fill("AUDCAD · original research");
    await page.getByRole("button", { name: /^Enregistrer le dossier$/ }).click();
    const key = "world-vision:trading-mta-cases:v2";
    const one = await page.evaluate((key) => JSON.parse(localStorage.getItem(key) ?? "null"), key);
    assert.equal(one.schemaVersion, 2, "Saved library schema should be version 2");
    assert.equal(one.cases.length, 1, "First analysis not stored independently");
    assert.equal(one.cases[0].plan.updates.length, 1, "Research revisions must survive save");
    assert.equal(one.cases[0].plan.events.length, 1, "Event preparation must survive save");

    await page.getByRole("button", { name: /^Nouvelle analyse$/ }).click();
    assert.equal(await page.locator(".tvp-identity input").first().inputValue(), "",
      "New dossier must not inherit previous research");
    await page.locator(".tvp-identity input").first().fill("SYNTHETIC-CHFJPY");
    await page.locator("#tvp-case-title").fill("CHFJPY · second independent idea");
    await page.getByRole("button", { name: /^Enregistrer le dossier$/ }).click();
    const two = await page.evaluate((key) => JSON.parse(localStorage.getItem(key) ?? "null"), key);
    assert.equal(two.cases.length, 2, "Second save replaced the first instead of adding a case");
    assert.equal(two.cases[0].plan.instrument, "SYNTHETIC-PAIR", "First instrument lost");
    assert.equal(two.cases[1].plan.instrument, "SYNTHETIC-CHFJPY", "Second instrument lost");

    await page.reload({ waitUntil: "domcontentloaded" });
    await panel.waitFor({ state: "visible" });
    assert.equal(await page.locator(".tvp-identity input").first().inputValue(), "",
      "Local storage MUST NOT silently load private user research");
    await page.getByRole("button", { name: /^Mes dossiers$/ }).click();
    assert.equal(await page.locator(".tvp-case-row").count(), 2, "User-controlled case listing failed");
    await page.locator(".tvp-case-row").filter({ hasText: "AUDCAD · original research" })
      .getByRole("button", { name: /^Ouvrir$/ }).click();
    assert.equal(await page.locator(".tvp-identity input").first().inputValue(), "SYNTHETIC-PAIR",
      "Opening first case must restore the correct research");
    await page.locator("nav.tvp-stages button").nth(8).click();
    assert((await page.locator(".tvp-research").innerText()).includes("Synthetic central-bank scenario"),
      "First dossier must preserve frozen thesis revisions");
    await page.getByRole("button", { name: /Annonces avant \/ après/ }).click();
    assert((await page.locator(".tvp-research").innerText()).includes("Synthetic price-index release"),
      "First dossier must preserve sourced event preparation and result");

    await page.getByRole("button", { name: /^Mes dossiers$/ }).click();
    await page.locator(".tvp-case-row").filter({ hasText: "AUDCAD · original research" })
      .getByRole("button", { name: /^Dupliquer$/ }).click();
    assert((await page.locator(".tvp-case-state").innerText()).includes("Analyse non enregistrée"),
      "Copy must remain unsaved until explicit user consent");
    await page.getByRole("button", { name: /^Enregistrer le dossier$/ }).click();
    assert.equal(await page.evaluate((key) => JSON.parse(localStorage.getItem(key)).cases.length, key), 3,
      "Duplicate must save as a new independent case");
    const [download] = await Promise.all([
      page.waitForEvent("download"),
      page.getByRole("button", { name: /Exporter JSON/ }).click(),
    ]);
    assert.equal(download.suggestedFilename(), "world-vision-trade-plan.json");
    await page.screenshot({ path: "trading-process-artifacts/" + screen.id + "-process.png", fullPage: false });
    await page.getByRole("button", { name: /^Fermer$/ }).click();
    assert.equal(new URL(page.url()).searchParams.get("wv"), null, "Close must remove trading URL");
    assert.deepEqual(errors, [], "JS errors on " + screen.id + ": " + errors.join(" | "));
    console.log("PASS " + screen.id + " real React trade workflow: 7 stages, sourced research, 3 independent cases, restore, duplicate, export and route");
    await context.close();
  }
} finally {
  await browser?.close();
  server.kill();
}
