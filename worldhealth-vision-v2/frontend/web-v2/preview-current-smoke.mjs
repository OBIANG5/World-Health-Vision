import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { chromium } from "playwright";

const server = spawn("npx", ["vite", "preview", "--host", "127.0.0.1", "--port", "4173"], {stdio: "ignore"});
let browser;
try {
  let ready = false;
  for (let attempt = 0; attempt < 80; attempt++) {
    try { if ((await fetch("http://127.0.0.1:4173/")).ok) { ready = true; break; } }
    catch {}
    await new Promise(resolve => setTimeout(resolve, 250));
  }
  assert(ready, "Frontend V2 preview did not start");
  browser = await chromium.launch({headless: true, args: ["--no-sandbox"]});
  const phone = await browser.newPage({viewport: {width: 390, height: 844}, isMobile: true, hasTouch: true});
  const errors = [];
  phone.on("pageerror", error => errors.push(String(error)));
  await phone.goto("http://127.0.0.1:4173/", {waitUntil: "domcontentloaded"});
  await phone.locator(".whv-mobile-overview").waitFor({state: "visible"});
  await phone.locator(".eye-stage").waitFor({state: "visible"});
  const eye = await phone.locator(".eye-stage").boundingBox();
  assert(eye && eye.width / eye.height > 1.4, "The mobile eye layout is distorted");
  await phone.screenshot({path:"dist/preview-mobile-current.png"});
  await phone.locator(".whv-nav-btn--tools").click();
  const tools = phone.locator(".whv-tools-menu");
  await tools.waitFor({state: "visible"});
  const bounds = await tools.boundingBox();
  assert(bounds && bounds.x >= 0 && bounds.x + bounds.width <= 390, "Tools menu overflows phone");
  await tools.getByText("Expat & Retraite").click();
  await phone.locator(".rt-panel").waitFor({state: "visible"});
  await phone.locator(".rt-close-btn").click();
  await phone.locator(".rt-panel").waitFor({state: "hidden"});
  await phone.locator(".whv-nav-btn--tools").click();
  await phone.locator(".whv-tools-menu").getByText("Conseiller économique").click();
  await phone.locator(".adv-panel").waitFor({state: "visible"});
  await phone.locator(".adv-close-btn").click();
  await phone.locator(".adv-panel").waitFor({state: "hidden"});
  assert(errors.length === 0, "Frontend JS exceptions: " + errors.slice(0,3).join(", "));
  await phone.screenshot({path:"dist/preview-mobile-tools-current.png"});
  const desktop = await browser.newPage({viewport: {width:1440,height:900}});
  await desktop.goto("http://127.0.0.1:4173/", {waitUntil:"domcontentloaded"});
  await desktop.locator(".whv-brand").waitFor({state:"visible"});
  await desktop.screenshot({path:"dist/preview-desktop-current.png"});
  console.log("PASS: authentic V2 frontend, mobile eye, tools menu, retirement panel, advisor panel, desktop.");
} finally {
  if (browser) await browser.close();
  server.kill("SIGTERM");
}
