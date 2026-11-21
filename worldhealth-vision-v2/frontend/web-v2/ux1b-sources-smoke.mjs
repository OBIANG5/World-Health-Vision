/**
 * UX-1B real-browser acceptance for user-controlled source comparison.
 * Genuine World-Vision V2 React app, archival country/source fixtures clearly
 * marked. No fake news or numerical agreement/conflict assumptions.
 */
import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { mkdirSync } from "node:fs";
import { chromium } from "playwright";

const port = 5213;
const origin = "http://127.0.0.1:" + port;
const root = process.env.WHV_PREVIEW_DIRECTORY ?? "dist";
const server = spawn("python3", ["-m", "http.server", String(port), "--bind", "127.0.0.1", "--directory", root], { stdio: "ignore" });
const sleep = ms => new Promise(done => setTimeout(done, ms));
mkdirSync("ux1b-artifacts", { recursive: true });
let browser;

try {
  let serving = false;
  for (let i = 0; i < 60; i++) {
    try { serving = (await fetch(origin + "/index.html")).ok; if (serving) break; }
    catch { /* waiting for server */ }
    await sleep(250);
  }
  assert(serving, "Real compiled UX-1B preview failed to start");
  browser = await chromium.launch({
    headless: true,
    args: ["--no-sandbox"],
    // Reuse the exact Chromium channel chosen by CI. A runner may have
    // system Chrome but not the separately downloaded Playwright browser.
    ...(process.env.WHV_BROWSER_CHANNEL ? { channel: process.env.WHV_BROWSER_CHANNEL } : {}),
  });

  for (const device of [
    { name: "small-mobile", width: 320, height: 700, mobile: true },
    { name: "iphone", width: 390, height: 844, mobile: true },
    { name: "tablet", width: 820, height: 1040, mobile: false },
    { name: "desktop", width: 1440, height: 900, mobile: false },
  ]) {
    const page = await browser.newPage({
      viewport: { width: device.width, height: device.height },
      isMobile: device.mobile,
      hasTouch: device.mobile,
      deviceScaleFactor: 1,
    });
    const errors = [];
    page.on("pageerror", err => errors.push(err.message));
    await page.goto(origin + "/", { waitUntil: "domcontentloaded" });
    await page.locator("canvas.whv-globe-canvas").waitFor({ state: "visible", timeout: 18000 });
    assert((await page.locator("canvas.whv-globe-canvas").count()) === 1, "Do not duplicate the real globe");

    if (device.mobile) {
      const card = page.locator(".whv-mobile-perspectives");
      await card.waitFor({ state: "visible" });
      assert((await card.textContent()).includes("Ne vous arrêtez pas à une source."),
        "Source plurality is not visible on the actual phone homepage");
      const sizes = await card.evaluate(node => ({ inner: node.clientWidth, actual: node.scrollWidth }));
      assert(sizes.actual <= sizes.inner + 2, device.name + " source card overflows: " + JSON.stringify(sizes));
      await card.locator("button").filter({ hasText: "Sources mondiales" }).click();
      assert.equal(new URL(page.url()).searchParams.get("wv"), "sources", "Global source directory action is dead");
      await page.screenshot({ path: "ux1b-artifacts/" + device.name + "-global-sources.png", fullPage: true });
      await page.goto(origin + "/", { waitUntil: "domcontentloaded" });
      await page.locator(".whv-mobile-perspectives").locator("button")
        .filter({ hasText: "Sources du pays" }).click();
      await page.locator(".country-drawer.open").waitFor({ state: "visible", timeout: 15000 });
      assert.equal(new URL(page.url()).searchParams.get("wv"), "country");
    } else {
      const desktopEntry = page.locator(".whv-story-perspectives");
      assert(await desktopEntry.isVisible(), "Desktop has lost source-plurality entry");
      await desktopEntry.locator("button").filter({ hasText: "Répertoire des sources" }).click();
      assert.equal(new URL(page.url()).searchParams.get("wv"), "sources", "Desktop source action is dead");
    }

    // GAB has THREE documented local-source metadata entries in the existing
    // archival fixture. This is a catalog comparison, NOT three live feeds.
    await page.goto(origin + "/?wv=country&iso3=GAB", { waitUntil: "domcontentloaded" });
    await page.locator(".country-drawer.open").waitFor({ state: "visible", timeout: 15000 });
    // COUNTRY-LIVE U1 is a REAL feature on this same compiled country sheet,
    // not a screenshot-only redesign or a synthetic dynamic news feed.
    const story = page.locator(".whv-country-story");
    await story.waitFor({ state: "visible", timeout: 15000 });
    assert((await story.locator("h2").innerText()).includes("Gabon"),
      "Country identity must be visible before data widgets");
    const picture = story.locator("img.whv-country-story-photo");
    // The Commons CDN may be unreachable from CI; verify license metadata and
    // graceful visual fallback separately, not an arbitrary external response.
    if (await picture.count()) {
      assert((await picture.getAttribute("src")).includes("Libreville_bord_de_mer"),
        "Only a reviewed Gabon photograph may represent GAB");
      assert((await story.locator(".whv-country-story-credit").innerText()).includes("Shirmy25"),
        "Photographer attribution must remain visible");
      const licenseUrl = await story.locator('a[href*="creativecommons.org/licenses/by-sa/4.0"]').getAttribute("href");
      assert(licenseUrl?.startsWith("https://"), "Photo license link is required");
    } else {
      assert(await story.locator(".whv-country-story-no-photo").isVisible(),
        "No image must fail visibly without showing unrelated scenery");
    }
    const topic = page.locator(".whv-country-now-feature");
    await topic.waitFor({ state: "visible" });
    assert((await topic.locator("h4").innerText()).includes("FMI"),
      "Real dated Gabon editorial dossier must be reachable from country sheet");
    assert.equal(await topic.locator(".whv-country-now-sources a").count(), 3,
      "National, international and regional original links must stay visible");
    const newsLinks = await topic.locator(".whv-country-now-sources a").evaluateAll(
      nodes => nodes.map(a => a.getAttribute("href")),
    );
    assert(newsLinks.every(h => h?.startsWith("https://")),
      "News sources must go to original HTTPS publishers");
    assert((await topic.locator(".whv-country-now-caution").innerText()).includes("pas un fil d'actualité en direct"),
      "A dated dossier may not masquerade as live news");
    assert.equal(await topic.locator(".whv-country-now-deep-link").getAttribute("href"), "?wv=radar",
      "One click must lead from country to existing research dossier");
    const storyBounds = await story.evaluate(node => ({
      inner: node.clientWidth, actual: node.scrollWidth,
    }));
    assert(storyBounds.actual <= storyBounds.inner + 3,
      device.name + " country story horizontal overflow: " + JSON.stringify(storyBounds));
    // Screenshot must not race the image fetch. CDN failure remains an honest
    // fallback, not a fake photo or an automatic bypass of image rights.
    await page.waitForFunction(() => {
      const image = document.querySelector(".whv-country-story-photo");
      return !image || (image.complete && image.naturalWidth > 0);
    }, null, { timeout: 8000 }).catch(() => undefined);
    const loadedPicture = await page.locator(".whv-country-story-photo").evaluateAll(
      images => images.some(img => img instanceof HTMLImageElement && img.naturalWidth > 0),
    );
    console.log("COUNTRY IMAGE " + device.name + ": " +
      (loadedPicture ? "REAL COMMONS PHOTO LOADED" : "PHOTO UNAVAILABLE — GRADIENT FALLBACK"));
    await page.screenshot({
      path: "ux1b-artifacts/" + device.name + "-country-editorial-top.png",
      fullPage: false,
    });

    const evidence = page.locator(".whv-national-evidence");
    await evidence.waitFor({ state: "attached", timeout: 12000 });
    await page.locator(".whv-national-evidence-source").first().waitFor({ state: "attached", timeout: 15000 });
    const checkboxes = page.locator(".whv-national-evidence-source .whv-source-compare-picker input");
    assert((await checkboxes.count()) >= 3, "GAB original catalog source choices missing");
    assert.equal(await page.locator(".whv-source-compare-grid .whv-source-compare-item").count(), 0,
      "A source should not be privileged as the default comparison");
    await checkboxes.nth(0).check();
    assert.equal(await page.locator(".whv-source-compare-grid .whv-source-compare-item").count(), 0,
      "One source must not imply corroboration");
    await checkboxes.nth(1).check();
    assert.equal(await page.locator(".whv-source-compare-grid .whv-source-compare-item").count(), 2,
      "Exactly two user-selected source metadata cards expected");
    assert(await checkboxes.nth(2).isDisabled(), "A third source must not silently replace user's selection");

    const comparison = page.locator(".whv-source-compare-panel");
    assert((await comparison.textContent()).includes("Comparer les organismes n'établit"),
      "Missing methodological non-equivalence caveat");
    const urls = await comparison.locator(".whv-source-compare-item a[href]").evaluateAll(
      elements => elements.map(a => a.getAttribute("href")),
    );
    assert(urls.length === 2 && urls.every(url => url?.startsWith("https://")),
      "Only original HTTPS institutional links may be displayed");

    await checkboxes.nth(0).uncheck();
    assert(await checkboxes.nth(2).isEnabled(), "Visitor must be able to change viewpoint");
    assert.equal(await page.locator(".whv-source-compare-grid .whv-source-compare-item").count(), 0,
      "Comparison must reset when a source is removed");

    const contentSizes = await comparison.evaluate(node => ({ inner: node.clientWidth, actual: node.scrollWidth }));
    assert(contentSizes.actual <= contentSizes.inner + 3,
      device.name + " comparison layout overflows: " + JSON.stringify(contentSizes));
    await page.screenshot({ path: "ux1b-artifacts/" + device.name + "-source-choice.png", fullPage: true });
    assert.deepEqual(errors, [], device.name + " runtime errors: " + errors.join("; "));
    console.log("PASS UX-1B " + device.name + ": actual source choices, no defaults, original links, responsive layout, honest catalog");
    await page.close();
  }
} finally {
  await browser?.close();
  server.kill("SIGTERM");
}
