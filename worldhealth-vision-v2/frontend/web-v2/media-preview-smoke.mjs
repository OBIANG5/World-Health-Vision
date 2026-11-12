import assert from "node:assert/strict";
import {createServer} from "node:http";
import {createReadStream, existsSync, statSync} from "node:fs";
import path from "node:path";
import {fileURLToPath} from "node:url";
import {chromium} from "playwright";

const frontend = path.dirname(fileURLToPath(import.meta.url));
const dist = path.join(frontend, "dist");
const contentTypes = {
  ".html": "text/html", ".js": "application/javascript", ".css": "text/css",
  ".svg": "image/svg+xml", ".png": "image/png", ".json": "application/json",
  ".woff2": "font/woff2",
};

const server = createServer((request, response) => {
  const url = new URL(request.url || "/", "http://localhost");
  const requested = url.pathname === "/" ? "/index.html" : url.pathname;
  const file = path.resolve(dist, "." + decodeURIComponent(requested));
  if (!file.startsWith(dist + path.sep) || !existsSync(file) || !statSync(file).isFile()) {
    response.writeHead(404);
    response.end("Not found");
    return;
  }
  response.writeHead(200, {
    "content-type": contentTypes[path.extname(file)] || "application/octet-stream",
    "cache-control": "no-store",
  });
  createReadStream(file).pipe(response);
});

await new Promise(resolve => server.listen(0, "127.0.0.1", resolve));
const address = server.address();
const base = "http://127.0.0.1:" + address.port;
const browser = await chromium.launch({headless: true});
let page;
try {
  page = await browser.newPage({viewport: {width: 390, height: 844}, deviceScaleFactor: 2});
  const errors = [];
  page.on("pageerror", error => errors.push(error.message));
  await page.goto(base + "/index.html?view=media", {waitUntil: "networkidle"});
  await page.locator(".wv-media-shell").waitFor();
  await page.getByText("DONNÉES FICTIVES", {exact: false}).first().waitFor();
  assert.equal(await page.locator(".wv-media-story-card").count(), 3);
  await page.getByRole("button", {name: /Priorité/}).click();
  assert.equal(await page.locator(".wv-media-story-card").count(), 2);
  await page.getByRole("button", {name: "Production"}).click();
  assert.equal(await page.locator(".wv-media-story-card").count(), 1);
  await page.getByRole("button", {name: "Tout", exact: true}).click();
  await page.locator(".wv-media-story-card").nth(1).click();
  await page.getByText("CREATIVE · v1").first().waitFor();
  await page.screenshot({path: path.join(dist, "media-studio-iphone.png"), fullPage: true});
  await page.getByRole("button", {name: /Scanner le Web/}).click();
  await page.getByText(/Mode démonstration statique/).first().waitFor();
  assert.deepEqual(errors, []);
  console.log("iPhone 390x844: cards, filters, inspector, blocked live scan — passed.");

  const desktop = await browser.newPage({viewport: {width: 1365, height: 900}});
  await desktop.goto(base + "/index.html?view=media", {waitUntil: "networkidle"});
  assert.equal(await desktop.locator(".wv-media-story-card").count(), 3);
  await desktop.screenshot({path: path.join(dist, "media-studio-desktop.png"), fullPage: true});
  await desktop.close();
  console.log("Desktop 1365x900: canonical Media Studio visible — passed.");
} finally {
  await page?.close();
  await browser.close();
  await new Promise(resolve => server.close(resolve));
}
