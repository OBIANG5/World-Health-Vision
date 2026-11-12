/**
 * Browser acceptance smoke for the REAL V2 static phone preview.
 * Fails closed if the globe, preserved map, sources/navigation, or honest
 * preview disclosure regresses. Uses the existing preview snapshot assets
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
    const before = await globe.evaluate((canvas) => canvas.toDataURL());
    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
    await page.mouse.down();
    await page.mouse.move(box.x + box.width / 2 + 50, box.y + box.height / 2 + 15, { steps: 8 });
    await page.mouse.up();
    await page.waitForTimeout(200);
    const after = await globe.evaluate((canvas) => canvas.toDataURL());
    if (before === after) throw new Error(device.name + ": globe drag did not change view");
    await page.screenshot({ path: "preview-artifacts/" + device.name + "-globe.png", fullPage: true });

    await page.getByRole("button", { name: /Carte œil/ }).click();
    await page.locator(".eye-map-surface .leaflet-container").waitFor({
      state: "visible", timeout: 15000,
    });
    await page.getByRole("button", { name: /Globe/ }).click();
    await globe.waitFor({ state: "visible", timeout: 15000 });

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
    if (await items.count() !== 9) {
      throw new Error(device.name + ": not all 9 menu tools are reachable");
    }
    await items.filter({ hasText: "Favoris" }).click();
    if (await page.locator(".whv-tools-menu").isVisible()) {
      throw new Error(device.name + ": tools menu did not close after selection");
    }
    await page.screenshot({ path: "preview-artifacts/" + device.name + "-tools.png", fullPage: true });
    if (pageErrors.length) throw new Error(device.name + " runtime errors: " + pageErrors.join("; "));
    console.log("PASS", device.name, "catalog", catalogSize, "globe, eye map, 9 tools, preview honesty");
    await page.close();
  }
  console.log("PASS real V2 static preview iPhone and desktop acceptance");
} finally {
  if (browser) await browser.close();
  server.kill("SIGTERM");
}
