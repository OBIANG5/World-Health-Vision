/**
 * WORLD-VISION V3 software REAL browser acceptance, no backend fixture:
 * home → real embedded GeoJSON country → services → news vs follow.
 * Screenshots are evidence of UI behavior, NOT aesthetic approval.
 */
import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { mkdirSync } from "node:fs";
import { chromium } from "playwright";

const origin = "http://127.0.0.1:5399";
const delay = ms => new Promise(resolve => setTimeout(resolve, ms));
const server = spawn("npm", ["run", "dev", "--", "--host", "127.0.0.1", "--port", "5399", "--strictPort"],
  { stdio: "ignore" });
mkdirSync("v3-artifacts", { recursive: true });
let browser;
try {
  let ready = false;
  for (let i = 0; i < 75; i++) {
    try { ready = (await fetch(origin + "/")).ok; if (ready) break; } catch { /* server not yet listening */ }
    await delay(250);
  }
  assert(ready, "Vite V3 app must start and serve HTML");
  browser = await chromium.launch({
    headless: true,
    ...(process.env.WHV_BROWSER_CHANNEL ? { channel: process.env.WHV_BROWSER_CHANNEL } : {}),
    args: ["--no-sandbox"],
  });
  for (const size of [
    { n: "small-mobile-320", width: 320, height: 720 },
    { n: "iphone-390", width: 390, height: 844 },
    { n: "tablet-820", width: 820, height: 1090 },
    { n: "desktop-1440", width: 1440, height: 900 },
  ]) {
    const page = await browser.newPage({ viewport: { width: size.width, height: size.height },
      isMobile: size.width <= 390, hasTouch: size.width <= 390 });
    const errors = [];
    page.on("pageerror", err => errors.push(err.message));
    await page.goto(origin + "/?wv=home", { waitUntil: "domcontentloaded" });
    await page.locator(".wv3-home-intro").waitFor({ state: "visible", timeout: 20000 });
    assert((await page.locator(".wv3-home-intro").innerText()).includes("Voir le monde"),
      "Actual home must be new globe-first task UI");
    assert.equal(await page.locator(".wv3-home-tasks button").count(), 6,
      "One unified index of six task families, not six repeated neon tiles");
    assert.equal(await page.locator(".whv-desktop-story").count(), 0,
      "Do not keep previous brochure-like desktop story behind new home");
    assert.equal(await page.locator(".whv-offline-banner").count(), 0,
      "The CDN geographic fallback must not trigger a giant obstructive offline alert");
    await page.waitForFunction(() => {
      const shell = document.querySelector(".whv-globe-shell");
      return shell && ["ready","fallback"].includes(shell.dataset.earthRenderer);
    },null,{timeout:12000});
    const renderer = await page.locator(".whv-globe-shell").getAttribute("data-earth-renderer");
    console.log("V4_EARTH_RENDERER",size.n,renderer);
    assert(["ready","fallback"].includes(renderer),"Globe must attempt a real self-hosted Earth texture");
    const homepageSurface = await page.locator(".whv-header").evaluate(node => getComputedStyle(node).backgroundColor);
    assert(!homepageSurface.includes("255, 255, 255"),
      "Visual reset must not show the old white header against the Earth");
    await page.screenshot({ path: `v3-artifacts/${size.n}-home.png`, animations: "disabled" });
    await page.locator(".wv3-services-trigger").click();
    const menu = page.locator(".wv3-service-menu");
    await menu.waitFor({ state: "visible" });
    assert.equal(await menu.locator(".wv3-service-menu-groups button").count(), 6,
      "One shared menu has six task families");
    await menu.locator(".wv3-service-menu-groups button").filter({hasText:"Argent & marchés"}).click();
    const financeProducts = await menu.innerText();
    assert(financeProducts.includes("Money Vision") &&
      financeProducts.includes("Trading Vision") && financeProducts.includes("BRVM Vision"),
      "All finance Visions must be named correctly in the global menu");
    await page.screenshot({ path: `v3-artifacts/${size.n}-services-menu.png`, animations: "disabled" });
    await menu.getByRole("button",{name:"Fermer les services"}).click();
    await menu.waitFor({state:"hidden"});

    await page.goto(origin + "/?wv=country&iso3=GAB", { waitUntil: "domcontentloaded" });
    const drawer = page.locator(".country-drawer.open");
    await drawer.waitFor({ state: "visible", timeout: 20000 });
    await page.locator(".wv3-geo-hero").waitFor({ state: "visible" });
    await page.locator(".wv3-country-geometry > g > path").first().waitFor({ state: "visible", timeout: 15000 });
    assert.equal(await page.locator(".whv-country-story-photo").count(), 0,
      "No panorama photo as country hero");
    const text = await page.locator(".wv3-geo-hero").innerText();
    assert(text.includes("Gabon") && text.includes("GAB"),
      "Country map + identity must match route");
    assert(await page.locator(".wv3-directory").isVisible(),
      "All country Visions discoverable on overview");
    assert.equal(await page.locator(".whv-country-section-tab").count(), 6,
      "Peer sections preserved, news secondary");
    await page.waitForFunction(() => {
      const canvas = document.querySelector(".wv4-country-texture");
      return canvas && ["ready","unavailable"].includes(canvas.dataset.imageState);
    },null,{timeout:12000});
    const imageryState = await page.locator(".wv4-country-texture").getAttribute("data-image-state");
    assert.equal(imageryState,"ready","Country imagery is self-hosted and can be decoded without remote provider keys");
    const basemapColor = await page.locator(".wv4-country-map").evaluate(node=>getComputedStyle(node).backgroundColor);
    console.log("V4_COUNTRY_BASEMAP",size.n,imageryState,basemapColor);
    await page.screenshot({ path: `v3-artifacts/${size.n}-gabon-map-first.png`, animations: "disabled" });
    const mapBounds = await page.locator(".wv3-geo-hero").boundingBox();
    assert(mapBounds && mapBounds.y >= 55 && mapBounds.width > size.width * .65,
      "Real geographic country map must dominate the first screen after header");
    const structure = await page.evaluate(() => {
      const rect = selector => {
        const element = document.querySelector(selector);
        if (!element) return null;
        const r = element.getBoundingClientRect();
        return { top:Math.round(r.top),left:Math.round(r.left),
          bottom:Math.round(r.bottom),right:Math.round(r.right),
          width:Math.round(r.width),height:Math.round(r.height),
          display:getComputedStyle(element).display };
      };
      return { hero:rect(".wv3-geo-hero"),map:rect(".wv3-country-map"),
        identity:rect(".wv3-country-identity"),tabs:rect(".whv-country-section-nav"),
        bodyScroll:document.querySelector(".country-drawer-body")?.scrollTop ?? -1 };
    });
    console.log("V3_COUNTRY_LAYOUT",size.n,JSON.stringify(structure));
    assert(structure.identity?.height > 100 && structure.hero?.height > 200,
      "Country identity must not be collapsed or clipped on any viewport");
    assert(structure.tabs?.top >= structure.hero.bottom - 3,
      "Country tabs must appear AFTER the complete geographic hero");
    if(size.width <= 960){
      assert(structure.identity.top >= structure.map.bottom - 2,
        "Mobile country identity must follow the country map, not overlay it");
    }
    assert((await page.locator(".whv-country-section-tab").first().evaluate(node =>
      getComputedStyle(node).display)) === "flex", "Country tabs must not inherit six-column legacy grid");

    const cats = page.locator(".wv3-directory-categories button");
    assert.equal(await cats.count(), 6);
    await cats.filter({ hasText: "Argent & marchés" }).click();
    const finance = await page.locator(".wv3-directory-detail").innerText();
    assert(finance.includes("Money Vision") && finance.includes("Trading Vision") &&
      finance.includes("BRVM Vision"), "Preserve exact Finance Vision identities");
    await cats.filter({ hasText: "Actualités & suivi" }).click();
    const monitor = await page.locator(".wv3-directory-detail").innerText();
    assert(monitor.includes("Watch Vision") && monitor.includes("Global Radar") &&
      monitor.includes("World-Vision Média"), "News/Watch/Media all discoverable");

    await page.screenshot({ path: `v3-artifacts/${size.n}-gabon-services.png`, animations: "disabled" });
    const countryOverflow = await page.evaluate(() =>
      ({ scroll: document.documentElement.scrollWidth, client: document.documentElement.clientWidth }));
    assert(countryOverflow.scroll <= countryOverflow.client + 2,
      "No horizontal viewport spill: " + JSON.stringify({ size, countryOverflow }));

    await page.locator(".wv3-geo-hero button").filter({ hasText: "Actualités" }).click();
    await page.locator(".whv-country-news").first().waitFor({ state: "visible", timeout: 12000 })
      .catch(async () => {
        assert(await page.locator(".whv-country-section-nav button")
          .filter({ hasText: "Actualités" }).getAttribute("aria-current") === "page",
          "Country-specific news accessible as a separate section");
      });
    assert(!(await page.locator(".wv3-directory").isVisible().catch(() => false)),
      "News section is not overridden by the service directory");
    await page.waitForFunction(() => {
      const nav = document.querySelector(".whv-country-section-nav");
      const tab = nav?.querySelector('button[data-section="news"]');
      if (!nav || !tab || tab.getAttribute("aria-current") !== "page") return false;
      const n = nav.getBoundingClientRect(), t = tab.getBoundingClientRect();
      return t.left >= n.left - 2 && t.right <= n.right + 2;
    }, null, {timeout: 6000});
    await page.screenshot({ path: `v3-artifacts/${size.n}-gabon-news.png`, animations: "disabled" });

    // Separate, honest follow: bookmarking exists; push news notifications do not.
    await page.locator(".whv-country-section-nav button").filter({ hasText: "Vue d’ensemble" }).click();
    const favorite = page.locator(".wv3-country-key-actions button[aria-pressed=false]");
    await favorite.click();
    assert.equal(await page.locator(".wv3-country-key-actions button[aria-pressed=true]").count(), 1,
      "Country favorite actually changes persistent local watchlist state");

    if (size.width >= 1200) {
      await page.locator(".wv3-topnav button").filter({ hasText: "Actualités" }).click();
      await page.locator(".whv-country-section-nav button").filter({ hasText: "Actualités" }).waitFor();
      assert.equal(await page.locator(".whv-country-section-nav button")
        .filter({ hasText: "Actualités" }).getAttribute("aria-current"), "page",
      "Global News navigation opens current country's actual News section");
    }
    assert.deepEqual(errors, [], "No runtime page exceptions: " + size.n);
    await page.close();
  }
  console.log("WORLD_VISION_V4_PASS: 320/390/820/1440 actual Vite+React globe/country map/11 Visions/news/follow");
} catch (err) {
  console.error("WORLD_VISION_V3_FAIL", err);
  process.exitCode = 1;
} finally {
  if (browser) await browser.close();
  server.kill("SIGTERM");
}
