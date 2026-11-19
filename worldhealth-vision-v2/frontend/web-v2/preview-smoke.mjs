/**
 * Browser acceptance smoke for the REAL V2 static phone preview.
 * Fails closed if the single interactive globe, country drill-down,
 * sources/navigation or honest preview disclosure regresses. The retired
 * Leaflet eye-map mode must never return. Uses existing preview snapshots
 * WITHOUT inventing economic observations or reaching a production backend.
 */
import { chromium } from "playwright";
import { spawn } from "node:child_process";
import { mkdirSync } from "node:fs";
import { resolve } from "node:path";

const port = "5189";
const origin = "http://127.0.0.1:" + port;
const previewRoot = resolve(process.env.WHV_PREVIEW_DIRECTORY ?? "preview");
const server = spawn(
  "python3",
  ["-m", "http.server", port, "--bind", "127.0.0.1", "--directory", previewRoot],
  { stdio: "ignore" },
);
const sleep = (ms) => new Promise((done) => setTimeout(done, ms));
mkdirSync("preview-artifacts", { recursive: true });
let browser;
try {
  let healthy = false;
  for (let i = 0; i < 50; i++) {
    try {
      const response = await fetch(origin + "/index.html");
      if (response.ok) {
        healthy = true;
        break;
      }
    } catch { /* startup delay */ }
    await sleep(250);
  }
  if (!healthy) throw new Error("Generated preview not served locally");

  browser = await chromium.launch({
    headless: true,
    args: ["--no-sandbox"],
  });
  for (const device of [
    { name: "iphone", width: 390, height: 844, isMobile: true, hasTouch: true },
    { name: "desktop", width: 1365, height: 900, isMobile: false, hasTouch: false },
  ]) {
    const pageErrors = [];
    const page = await browser.newPage({
      viewport: { width: device.width, height: device.height },
      isMobile: device.isMobile,
      hasTouch: device.hasTouch,
      deviceScaleFactor: 1,
    });
    page.on("pageerror", (error) => pageErrors.push(error.message));
    await page.goto(origin + "/", { waitUntil: "domcontentloaded" });
    const catalogSize = await page.evaluate(
      () => window.__WHV_PREVIEW_COUNTRIES__?.length ?? 0,
    );
    if (catalogSize < 200) {
      throw new Error(device.name + ": preview lost its real country registry");
    }
    await page.waitForFunction(
      () => document.querySelector(".whv-service-status")?.textContent?.includes("Aperçu"),
      { timeout: 20000 },
    );
    const globe = page.locator("canvas.whv-globe-canvas");
    await globe.waitFor({ state: "visible", timeout: 20000 });
    await page.waitForFunction(
      () => !document.querySelector(".whv-globe-status"),
      { timeout: 20000 },
    );
    const box = await globe.boundingBox();
    if (!box || box.width < 150 || box.height < 150) {
      throw new Error(device.name + ": globe is missing or too small");
    }
    // The current V2 has ONE real interactive globe. The old switch and
    // Leaflet eye-map were intentionally removed in Electric Earth (2026-11-13).
    // Never reintroduce them just to make a stale browser test pass.
    if (await page.locator(".whv-map-mode-switch").count() !== 0 ||
        await page.locator(".eye-map-surface").count() !== 0) {
      throw new Error(device.name + ": obsolete Leaflet/eye-map mode returned");
    }
    // A beautiful canvas without working geography is not an acceptable V2.
    await globe.click({ position: { x: box.width * 0.5, y: box.height * 0.51 } });
    await page.locator(".country-drawer.open").waitFor({ state: "visible", timeout: 15000 });
    await page.locator(".country-drawer.open .drawer-btn.close").click();
    await page.locator(".country-drawer.open").waitFor({ state: "hidden", timeout: 15000 });

    const before = await globe.evaluate((canvas) => canvas.toDataURL());
    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
    await page.mouse.down();
    await page.mouse.move(box.x + box.width / 2 + 50, box.y + box.height / 2 + 15, { steps: 8 });
    await page.mouse.up();
    await page.waitForTimeout(200);
    const after = await globe.evaluate((canvas) => canvas.toDataURL());
    if (before === after) throw new Error(device.name + ": globe drag did not change view");
    await page.screenshot({ path: "preview-artifacts/" + device.name + "-globe.png", fullPage: true });

    const navTools = page.locator("button.whv-nav-btn--tools");
    if (await navTools.isVisible()) {
      await navTools.click();
    } else {
      const mobileTools = page.locator(".whv-mobile-shortcut").filter({ hasText: "Outils" });
      await mobileTools.click();
    }
    const items = page.locator(".whv-tools-menu button.whv-tools-item");
    await items.first().waitFor({ state: "visible", timeout: 10000 });
    const names = (await items.allTextContents()).join(" ");
    for (const label of [
      "Pouvoir d'achat", "Score destination", "Expat", "Immobilier",
      "Devises", "Conseiller", "Favoris", "Voyage", "Alertes",
    ]) {
      if (!names.includes(label)) {
        throw new Error(device.name + ": missing interactive tool " + label);
      }
    }
    // Nine core business tools remain available, while the CURRENT V2
    // navigation also exposes geographic entry points (12 menu buttons total).
    // Check real groups and minimum actions, not the obsolete exact-nine count.
    const groups = page.locator(".whv-tools-menu .whv-domain-group");
    if (await groups.count() !== 4 || await items.count() < 12) {
      throw new Error(device.name + ": navigation categories/actions missing (" +
        await groups.count() + " groups, " + await items.count() + " actions)");
    }
    // Save the actual OPEN tools menu, not a homepage screenshot disguised as
    // proof that a menu existed. Then verify that selecting a tool opens its
    // real lazy-loaded panel (closing the menu alone is insufficient).
    await page.screenshot({ path: "preview-artifacts/" + device.name + "-menu.png", fullPage: true });
    await items.filter({ hasText: "Favoris" }).click();
    if (await page.locator(".whv-tools-menu").isVisible()) {
      throw new Error(device.name + ": tools menu did not close after selection");
    }
    await page.locator(".watchlist-panel").waitFor({ state: "visible", timeout: 15000 });
    // Browser-computed WCAG contrast: a white panel with old pale text was
    // nearly invisible. Fail this release check if the problem returns.
    const failedContrast = await page.evaluate(() => {
      const rgb = (s) => {
        const parts = s.match(/[0-9.]+/g)?.slice(0, 3).map(Number);
        if (!parts || parts.length !== 3) throw new Error("Unparseable CSS color: " + s);
        return parts;
      };
      const luminance = (s) => {
        const [r, g, b] = rgb(s).map((v) => {
          const c = v / 255;
          return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
        });
        return 0.2126 * r + 0.7152 * g + 0.0722 * b;
      };
      return [
        [".watchlist-panel-title", ".watchlist-panel-header"],
        [".watchlist-panel-subtitle", ".watchlist-panel-header"],
        [".watchlist-panel-close", ".watchlist-panel-close"],
        [".watchlist-empty-text", ".watchlist-panel"],
        [".watchlist-empty-hint", ".watchlist-panel"],
      ].flatMap(([fgSel, bgSel]) => {
        const fg = document.querySelector(fgSel);
        const bg = document.querySelector(bgSel);
        if (!fg || !bg) return [fgSel + ": missing DOM element"];
        const l1 = luminance(getComputedStyle(fg).color);
        const l2 = luminance(getComputedStyle(bg).backgroundColor);
        const ratio = (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
        return ratio < 4.5 ? [fgSel + ": insufficient contrast " + ratio.toFixed(2)] : [];
      });
    });
    if (failedContrast.length) throw new Error(device.name + ": " + failedContrast.join("; "));
    await page.screenshot({ path: "preview-artifacts/" + device.name + "-tools.png", fullPage: true });
    if (pageErrors.length) throw new Error(device.name + " runtime errors: " + pageErrors.join("; "));
    console.log("PASS", device.name, "catalog", catalogSize, "single globe, country drill-down, 9 core tools, 4 navigation groups, preview honesty");
    await page.close();
  }
  console.log("PASS real V2 static preview iPhone and desktop acceptance");
} finally {
  if (browser) await browser.close();
  server.kill("SIGTERM");
}
