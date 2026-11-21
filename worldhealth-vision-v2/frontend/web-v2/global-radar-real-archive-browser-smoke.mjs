/**
 * R2B browser acceptance: actual built World-Vision V2 React + static /radar/
 * snapshot. Follows identical path with SYNTHETIC fixture or REAL GDELT batch
 * (WHV_RADAR_REAL=1); never claims any publisher's news was fact-checked.
 */
import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { readFileSync, mkdirSync } from "node:fs";
import { chromium } from "playwright";
import { join } from "node:path";

const dir = process.env.WHV_PREVIEW_DIRECTORY ?? "dist";
const fixture = JSON.parse(readFileSync(join(dir, "radar", "global-latest.json"), "utf8"));
const real = process.env.WHV_RADAR_REAL === "1";
assert.equal(fixture.sourceDataset, "GDELT_2_EVENTS_EXPORT");
assert.equal(fixture.providerAttribution, "Data: The GDELT Project — https://www.gdeltproject.org/");
assert.equal(fixture.publisherTextPresent, false);
assert.equal(fixture.eventFactsVerified, false);
assert.equal(fixture.originalPublisherArticleRights, "NOT_REVIEWED_NO_ARTICLE_TEXT_COPIED");
assert.equal(fixture.stats.selectedForPreview, fixture.candidates.length);
assert(fixture.candidates.length >= 2);
if (real) {
  assert.notEqual(fixture.sourceManifestSha256, "a".repeat(64),
    "Real-provider browser mode must never consume synthetic fixture");
  assert.notEqual(fixture.sourceArchiveSha256, "b".repeat(64),
    "Real-provider browser mode must never consume synthetic fixture");
  assert(fixture.stats.codedRows >= fixture.candidates.length);
  assert(fixture.stats.distinctOriginalUrlsFound >= fixture.candidates.length);
}
const port = 5253, origin = "http://127.0.0.1:" + port;
const server = spawn("python3", ["-m", "http.server", String(port), "--bind", "127.0.0.1",
  "--directory", dir], { stdio: "ignore" });
mkdirSync("global-radar-r2b-artifacts", { recursive: true });
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
let browser;
try {
  let ok = false;
  for (let i = 0; i < 60; i++) {
    try { ok = (await fetch(origin + "/index.html")).ok; if (ok) break; }
    catch { /* wait for preview server */ }
    await delay(250);
  }
  assert(ok, "Built real World-Vision V2 cannot be served");
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
    const pageErrors = [];
    page.on("pageerror", (error) => pageErrors.push(error.message));
    let upstreamCalls = 0, staticCalls = 0;
    page.on("request", (req) => {
      if (req.url().includes("gdeltproject.org/api/v2/")) upstreamCalls++;
      if (req.url().endsWith("/radar/global-latest.json")) staticCalls++;
    });
    await page.goto(origin + "/?wv=radar", { waitUntil: "domcontentloaded" });
    await page.locator(".radar-dialog").waitFor({ state: "visible" });
    // An earlier green browser run allowed almost completely UNSTYLED markup:
    // check computed design values, not just DOM presence and overflow.
    const computed = await page.locator(".radar-dialog").evaluate((node) => {
      const dialogStyle = getComputedStyle(node);
      const backdrop = document.querySelector(".radar-backdrop");
      return {
        dialogBg: dialogStyle.backgroundColor,
        dialogRadius: dialogStyle.borderTopLeftRadius,
        backdropPosition: backdrop ? getComputedStyle(backdrop).position : "missing",
      };
    });
    assert.equal(computed.dialogBg, "rgb(247, 251, 255)",
      "Global Radar CSS did not load: raw HTML is NOT a professional media experience");
    assert(computed.dialogRadius !== "0px",
      "Global Radar needs styled responsive card framing");
    assert.equal(computed.backdropPosition, "fixed",
      "Global Radar must stay in its modal overlay instead of flowing as raw HTML");
    const geometry = await page.locator(".radar-dialog").evaluate((node) => {
      const r = node.getBoundingClientRect();
      const closeButton = node.querySelector(".radar-close")?.getBoundingClientRect();
      return {
        top: r.top, bottom: r.bottom, viewportHeight: window.innerHeight,
        closeTop: closeButton?.top ?? -999,
      };
    });
    assert(geometry.top >= -1 && geometry.closeTop >= -1 &&
      geometry.bottom <= geometry.viewportHeight + 1,
    "At 320px (or desktop), modal header/close must be fully inside real viewport " +
      JSON.stringify({ device, geometry }));
    const editorial = page.locator(".radar-case");
    assert((await editorial.innerText()).includes("Gabon et FMI"),
      "Actual dated AGP/IMF/EcoMatin research dossier must be reachable");
    await editorial.locator(".radar-case-toggle").click();
    const sourceCards = editorial.locator(".radar-case-source-grid .radar-case-source");
    assert.equal(await sourceCards.count(), 3,
      "Real Gabon national/IMF primary/Central Africa regional articles required");
    const originalHosts = await editorial.locator(".radar-case-source-grid a[href]")
      .evaluateAll(links => links.map(a => new URL(a.href).hostname));
    assert.deepEqual(originalHosts, ["agpgabon.ga", "www.imf.org", "ecomatin.net"]);
    assert((await editorial.innerText()).includes("Ces documents ne suffisent pas"),
      "Do not claim government aspirations are an IMF-approved programme");
    const claims = editorial.locator(".radar-claims");
    const claimRows = claims.locator(".radar-claim");
    assert.equal(await claimRows.count(), 4,
      "Editorial pilot must explain four concrete claim-specific verification questions");
    const dateIssue = claims.locator('[data-claim-id="MISSION_END_DAY"]');
    assert.equal(await dateIssue.locator(".radar-claim-evidence").count(), 2,
      "Unresolved mission date discrepancy must retain AGP and IMF references");
    const dateNarrative = await dateIssue.innerText();
    assert(dateNarrative.includes("19 septembre 2026") &&
      dateNarrative.includes("14–25 septembre 2026"),
      "Do not silently erase AGP 19 Sep vs IMF 14–25 Sep attributed date discrepancy");
    assert(dateNarrative.includes("pas une erreur définitivement attribuée"),
      "Disagreement must remain uncertain, not automatic publisher error");
    const imfIssue = claims.locator('[data-claim-id="PROGRAMME_DISCUSSIONS_STAGE"]');
    await imfIssue.locator(".radar-claim-trigger").click();
    assert.equal(await dateIssue.locator(".radar-claim-evidence").count(), 0,
      "Opening a second question must collapse the first without losing sources");
    assert((await imfIssue.innerText()).includes("Conseil d'administration"),
      "Approval requires a dated IMF Executive Board statement, not a reporter inference");
    const targets = claims.locator('[data-claim-id="DECEMBER_STAFF_LEVEL_TARGET"]');
    await targets.locator(".radar-claim-trigger").click();
    assert((await targets.innerText()).includes("Bloomberg"),
      "Secondhand Bloomberg provenance must be shown explicitly");
    assert((await targets.innerText()).includes("ne constitue ni"),
      "Government target must never be rendered as IMF-approved agreement");
    const ratio = claims.locator('[data-claim-id="GOVERNMENT_DEBT_AUDIT_RATIO"]');
    await ratio.locator(".radar-claim-trigger").click();
    assert((await ratio.innerText()).includes("n'a pas encore validé"),
      "Reported 69% debt estimate must remain unapproved by IMF in dated source");
    const evidenceLinks = await ratio.locator("a[href]").evaluateAll(
      anchors => anchors.map(a => ({ href: a.href, rel: a.getAttribute("rel") })),
    );
    assert.equal(evidenceLinks.length, 1);
    assert(evidenceLinks.every(a => a.href.startsWith("https://ecomatin.net/") &&
      a.rel.includes("noopener") && a.rel.includes("noreferrer")),
      "Never proxy source text or drop outbound URL security");
    await ratio.locator(".radar-claim-trigger").click();
    assert.equal(await ratio.locator(".radar-claim-evidence").count(), 0,
      "Evidence disclosure must be operable on iPhone touch");
    assert((await claims.innerText()).includes("aucun événement") ||
      (await claims.innerText()).includes("Aucun événement"),
      "Fact-checking limitations must remain visible even with all disclosures collapsed");
    assert((await editorial.innerText()).includes("extraits publics indexés"),
      "Unfetched original text must NOT be called independently verified");
    await sourceCards.nth(0).getByRole("button", { name: "Confronter" }).click();
    assert.equal(await editorial.locator(".radar-case-comparison").count(), 0,
      "A single original document never corroborates itself");
    await sourceCards.nth(1).getByRole("button", { name: "Confronter" }).click();
    const editorialCompare = editorial.locator(".radar-case-comparison");
    await editorialCompare.waitFor();
    assert.equal(await editorialCompare.locator(".radar-case-source").count(), 2);
    assert((await editorialCompare.innerText()).includes("ne prouve"),
      "Two different time periods must not become an automatic agreement");
    await editorial.locator(".radar-case-toggle").click();
    assert.equal(await editorial.locator(".radar-case-comparison").count(), 0,
      "Research dossier collapse must actually hide the comparison UI");

    await page.locator(".radar-archive-grid .radar-archive-candidate").first().waitFor({
      state: "visible", timeout: 18000,
    });
    assert.equal(upstreamCalls, 0, "Opening static archive must NOT issue costly DOC API query");
    assert.equal(staticCalls, 1, "One explicit same-origin asset load per panel mount");
    await page.locator(".radar-scroll").evaluate((node) => { node.scrollTop = 0; });
    await page.screenshot({
      path: "global-radar-r2b-artifacts/" + device.name +
        (real ? "-real-gdelt-" : "-synthetic-") + "styled-editorial-overview.png",
    });
    const archive = page.locator(".radar-archive");
    assert.equal(await archive.evaluate((node) => getComputedStyle(node).backgroundColor),
      "rgb(248, 252, 255)",
      "Global Radar R2B stylesheet must style real provider archive, not display unstyled blocks");
    assert((await archive.innerText()).includes("Pas du direct"),
      "Real batch must never imply a live publisher news service");
    assert((await archive.innerText()).includes("Les « événements » sont des codes automatiques"),
      "Must disclose machine-coded signal rather than confirmed event");
    assert((await archive.innerText()).includes("GDELT Project"),
      "Mandatory official GDELT credit must be visible");
    assert((await archive.innerText()).includes("droits des ARTICLES"),
      "Publisher rights must be separated from GDELT data terms");
    const cards = page.locator(".radar-archive-grid .radar-archive-candidate");
    assert((await cards.count()) >= 2);
    const links = await archive.locator(".radar-archive-candidate .radar-original").evaluateAll(
      anchors => anchors.map(a => ({
        url: a.href, target: a.getAttribute("target"), rel: a.getAttribute("rel"),
      })),
    );
    assert(links.length >= 2);
    assert(links.every(a => a.url.startsWith("https://") &&
      a.target === "_blank" && a.rel.includes("noopener") && a.rel.includes("noreferrer")));
    assert.equal(await archive.locator("img, iframe, script").count(), 0,
      "Publisher text/HTML/images must never be embedded");

    await cards.nth(0).getByRole("button", { name: "Confronter" }).click();
    assert.equal(await archive.locator(".radar-archive-comparison").count(), 0,
      "One URL is never a corroborated report");
    await cards.nth(1).getByRole("button", { name: "Confronter" }).click();
    const comparison = archive.locator(".radar-archive-comparison");
    await comparison.waitFor();
    assert.equal(await comparison.locator(".radar-archive-candidate").count(), 2);
    assert((await comparison.innerText()).includes("NON VÉRIFIÉES") ||
      (await comparison.innerText()).includes("Aucune corroboration"),
      "No automatic verification or agreement may be suggested");
    assert(await cards.nth(2).getByRole("button", { name: "Confronter" }).isDisabled().catch(() => true),
      "A third selection must not silently override the visitor's choice");

    const toolbar = archive.locator(".radar-archive-toolbar input");
    await toolbar.fill(fixture.candidates[0].outletDomainFromUrl);
    assert((await archive.locator(".radar-archive-grid .radar-archive-candidate").count()) >= 1);
    assert.equal(await archive.locator(".radar-archive-comparison").count(), 0,
      "Changing source filter invalidates chosen perspective comparison");
    await toolbar.fill("nonexistent-publisher-do-not-match.invalid");
    assert((await archive.innerText()).includes("Aucun lien correspondant"),
      "No matching URL does NOT mean no events occurred");
    await toolbar.fill("");

    for (const selector of [".radar-dialog", ".radar-scroll", ".radar-content", ".radar-archive"]) {
      const width = await page.locator(selector).evaluate(el => ({
        client: el.clientWidth, scroll: el.scrollWidth,
      }));
      assert(width.scroll <= width.client + 3,
        device.name + " overflow: " + selector + JSON.stringify(width));
    }

    // Scroll ONLY the body, never the header/close/footer, after the
    // complete source-selection sequence. This caught a true 320px defect
    // which initial DOM/overflow checks had missed.
    const footerGeometry = await page.locator(".radar-dialog").evaluate((node) => {
      const main = node.getBoundingClientRect();
      const header = node.querySelector(".radar-header")?.getBoundingClientRect();
      const footer = node.querySelector(".radar-footer")?.getBoundingClientRect();
      const viewport = window.innerHeight;
      return {
        mainTop: main.top, mainBottom: main.bottom,
        headerTop: header?.top ?? -999, footerBottom: footer?.bottom ?? 9999,
        viewport,
      };
    });
    assert(footerGeometry.mainTop >= 0 && footerGeometry.headerTop >= 0 &&
      footerGeometry.mainBottom <= footerGeometry.viewport + 1 &&
      footerGeometry.footerBottom <= footerGeometry.viewport + 1,
      device.name + " must keep top/header/close and bottom footer inside viewport " +
      JSON.stringify(footerGeometry));
    await archive.locator(".radar-archive-candidate").first().scrollIntoViewIfNeeded();
    await page.screenshot({
      path: "global-radar-r2b-artifacts/" + device.name + (real ? "-real-gdelt-" : "-synthetic-") +
        "source-archive.png",
    });
    assert.deepEqual(pageErrors, [], "React runtime errors: " + pageErrors.join("; "));
    await page.keyboard.press("Escape");
    assert.equal(new URL(page.url()).searchParams.get("wv"), null);
    assert.equal(await page.locator(".radar-dialog").count(), 0);
    console.log("PASS R2B " + device.name + " " + (real ? "REAL_PROVIDER" : "SYNTHETIC_FIXTURE") +
      ": actual V2 browser, batch attribution, no DOC auto call, choice/filter, real URL links and no overflow");
    await page.close();
  }
} finally {
  await browser?.close();
  server.kill("SIGTERM");
}
