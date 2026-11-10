import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { chromium } from "playwright";

const server = spawn("npx", ["vite", "preview", "--host", "127.0.0.1", "--port", "4173"], { stdio: "ignore" });
let browser;
try {
  let ready = false;
  for (let attempt = 0; attempt < 80; attempt++) {
    try { if ((await fetch("http://127.0.0.1:4173/")).ok) { ready = true; break; } }
    catch {}
    await new Promise(resolve => setTimeout(resolve, 250));
  }
  assert(ready, "Frontend V2 preview did not start");
  browser = await chromium.launch({ headless: true, args: ["--no-sandbox"] });
  const phone = await browser.newPage({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
  phone.setDefaultTimeout(18000);
  const errors = [];
  phone.on("pageerror", error => errors.push(String(error)));
  await phone.goto("http://127.0.0.1:4173/", { waitUntil: "domcontentloaded" });
  await phone.locator(".whv-mobile-overview").waitFor({ state: "visible" });
  await phone.locator(".eye-stage").waitFor({ state: "visible" });
  assert((await phone.locator(".whv-service-status").innerText()).includes("Aperçu"),
    "The static preview must not falsely claim that a real backend is connected");
  const eye = await phone.locator(".eye-stage").boundingBox();
  assert(eye && eye.width / eye.height > 1.4, "The mobile eye layout is distorted");
  await phone.screenshot({ path: "dist/preview-mobile-current.png" });

  async function openTool(label, panel, closeButton) {
    await phone.locator(".whv-nav-btn--tools").click();
    const menu = phone.locator("#whv-tools-menu");
    await menu.waitFor({ state: "visible" });
    assert(await menu.evaluate(element => element.parentElement === document.body),
      "Tools menu must escape mobile nav scroll clipping by portal");
    const bounds = await menu.boundingBox();
    assert(bounds && bounds.x >= 0 && bounds.x + bounds.width <= 390,
      "Tools menu extends beyond the mobile viewport");
    await menu.getByText(label).click();
    await phone.locator(panel).waitFor({ state: "visible" });
    await phone.locator(closeButton).click();
    await phone.locator(panel).waitFor({ state: "hidden" });
  }

  for (const [label,panel,close] of [
    ["Pouvoir d'achat", ".pp-panel", ".pp-close-btn"],
    ["Score destination", ".ds-panel", ".ds-close-btn"],
    ["Expat & Retraite", ".rt-panel", ".rt-close-btn"],
    ["Immobilier", ".re-panel", ".re-close-btn"],
    ["Devises", ".cur-panel", ".cur-panel .prf-close-btn"],
    ["Conseiller économique", ".adv-panel", ".adv-close-btn"],
    ["Favoris", ".watchlist-panel", ".watchlist-panel-close"],
    ["Voyage", ".tv-panel", ".tv-close-btn"],
    ["Alertes", ".al-panel", ".al-close-btn"],
  ]) await openTool(label,panel,close);

  await phone.screenshot({ path: "dist/preview-mobile-tools-current.png" });

  // The source list must come from V2 migrations, not a World Bank-only stub.
  await phone.locator(".whv-nav-btn--sources").click();
  await phone.locator(".whv-source-card").first().waitFor({ state: "visible" });
  const sourceCount = await phone.locator(".whv-source-card").count();
  assert(sourceCount === 22, "Expected 22 registered V2 data sources, got " + sourceCount);
  for (const source of ["World Bank", "International Monetary Fund", "Numbeo", "OpenStreetMap"]) {
    assert((await phone.locator(".whv-modal-body").innerText()).includes(source),
      "Missing original V2 catalogue source " + source);
  }
  await phone.locator(".whv-modal-close").click();

  // Regions must open, select a real group, expose member countries and navigate.
  await phone.locator(".whv-mobile-shortcut").filter({ hasText: "Régions" }).click();
  await phone.locator(".region-drawer.open").waitFor({ state: "visible" });
  await phone.locator("#region-select option").first().waitFor({ state: "attached" });
  const optionCount = await phone.locator("#region-select option").count();
  assert(optionCount >= 5, "Region registry has too few entries");
  await phone.locator(".whv-region-members-toggle").click();
  const members = phone.locator(".whv-region-member");
  await members.first().waitFor({ state: "visible" });
  const memberCount = await members.count();
  assert(memberCount > 0, "Region members are not visible");
  await members.first().click();
  await phone.locator(".country-drawer.open").waitFor({ state: "visible" });
  assert(await phone.locator(".region-drawer.open").count() === 0,
    "Region drawer should close when a member country is selected");
  await phone.locator(".country-drawer.open .drawer-btn.close").click();

  assert(errors.length === 0, "Frontend JS exceptions: " + errors.slice(0, 5).join("; "));
  const desktop = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  await desktop.goto("http://127.0.0.1:4173/", { waitUntil: "domcontentloaded" });
  await desktop.locator(".whv-brand").waitFor({ state: "visible" });
  assert(!(await desktop.locator(".whv-mobile-overview").isVisible()),
    "Mobile explorer leaked into desktop layout");
  await desktop.screenshot({ path: "dist/preview-desktop-current.png" });
  console.log("PASS: V2 mobile/desktop, 9 tools, 22 sources, regions and country navigation.");
} finally {
  if (browser) await browser.close();
  server.kill("SIGTERM");
}
