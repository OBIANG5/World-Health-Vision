import assert from "node:assert/strict";
import { chromium } from "playwright";

const url = "https://rawcdn.githack.com/OBIANG5/World-Health-Vision/ee1104d603d598d4069033ef96d340f3727278da/index.html";
const browser = await chromium.launch({headless: true, args: ["--no-sandbox"]});
try {
  const page = await browser.newPage({viewport: {width:390,height:844}, isMobile:true,hasTouch:true});
  const errors = [], failures = [];
  page.on("pageerror", error => errors.push(String(error)));
  page.on("response", response => {
    if(response.status() >= 400 && response.url().includes("/assets/"))
      failures.push(response.status()+" "+response.url());
  });
  const result = await page.goto(url, {waitUntil:"domcontentloaded", timeout:45000});
  assert(result?.status() === 200, "Remote immutable CDN did not return HTTP 200");
  await page.locator(".whv-mobile-overview").waitFor({state:"visible",timeout:25000});
  await page.locator(".eye-stage").waitFor({state:"visible"});
  await page.locator(".whv-nav-btn--tools").click();
  await page.locator(".whv-tools-menu").waitFor({state:"visible"});
  await page.locator(".whv-tools-menu").getByText("Expat & Retraite").click();
  await page.locator(".rt-panel").waitFor({state:"visible"});
  await page.locator(".rt-close-btn").click();
  await page.locator(".whv-nav-btn--tools").click();
  await page.locator(".whv-tools-menu").getByText("Conseiller économique").click();
  await page.locator(".adv-panel").waitFor({state:"visible"});
  assert(errors.length === 0, "Remote JS errors: "+errors.join("; "));
  assert(failures.length === 0, "Remote static asset failures: "+failures.join("; "));
  console.log("PASS remote pinned V2: Mobile overview, eye, tools, retirement and advisor.");
} finally { await browser.close(); }
