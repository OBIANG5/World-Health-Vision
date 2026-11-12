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
  // Journey is now the first screen, not the old one-column newsroom.
  await page.getByRole("heading", {name: /De l'actualité/}).waitFor();
  assert.equal(await page.locator(".wvj-step-card").count(), 14);
  const scrollState = await page.evaluate(() => ({
    document: document.documentElement.scrollHeight,
    body: document.body.scrollHeight,
    viewport: window.innerHeight,
    root: getComputedStyle(document.getElementById("root")).overflowY,
  }));
  assert.ok(
    scrollState.document > scrollState.viewport * 2,
    "Mobile journey must scroll beyond the first screen: " + JSON.stringify(scrollState),
  );
  assert.equal(await page.getByText("MODE DÉMONSTRATION", {exact: false}).count() > 0, true);
  await page.getByRole("button", {name: /07.*STORYBOARD/}).click();
  await page.getByRole("heading", {name: /Chaque seconde a un rôle/}).waitFor();
  assert.match(new URL(page.url()).searchParams.get("step"), /storyboard/);
  await page.getByRole("button", {name: /Étape suivante/}).click();
  await page.getByRole("heading", {name: /Le son doit raconter/}).waitFor();
  await page.getByRole("button", {name: /Vue d'ensemble/}).first().click();
  await page.getByRole("button", {name: /14.*PUBLISH/}).click();
  await page.getByRole("heading", {name: /Publié signifie/}).waitFor();
  await page.getByText("Non publié", {exact: true}).waitFor();
  await page.getByRole("button", {name: /Vue d'ensemble/}).first().click();
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.screenshot({path: path.join(dist, "media-studio-iphone.png"), fullPage: true});
  await page.getByRole("button", {name: /Control Room/}).first().click();
  assert.equal(await page.locator(".wv-media-story-card").count(), 3);
  await page.getByRole("button", {name: /Priorité/}).click();
  assert.equal(await page.locator(".wv-media-story-card").count(), 2);
  await page.getByRole("button", {name: "Production"}).click();
  assert.equal(await page.locator(".wv-media-story-card").count(), 1);
  await page.getByRole("button", {name: "Tout", exact: true}).click();
  await page.locator(".wv-media-story-card").nth(1).click();
  await page.getByText("CREATIVE · v1").first().waitFor();
  await page.screenshot({path: path.join(dist, "media-studio-desk-iphone.png"), fullPage: true});
  await page.getByRole("button", {name: /Scanner le Web/}).click();
  await page.getByText(/Mode démonstration statique/).first().waitFor();
  assert.deepEqual(errors, []);
  console.log("iPhone 390x844: 14 journey pages, deep links, editor, newsroom, blocked live scan — passed.");

  const desktop = await browser.newPage({viewport: {width: 1365, height: 900}});
  await desktop.goto(base + "/index.html?view=media", {waitUntil: "networkidle"});
  assert.equal(await desktop.locator(".wvj-step-card").count(), 14);
  await desktop.getByRole("button", {name: /09.*REMOTION/}).click();
  await desktop.getByRole("heading", {name: /Le montage devient un vrai MP4/}).waitFor();
  await desktop.getByRole("button", {name: /Vue d'ensemble/}).first().click();
  await desktop.screenshot({path: path.join(dist, "media-studio-desktop.png"), fullPage: true});
  await desktop.close();

} finally {
  await page?.close();
  await browser.close();
  await new Promise(resolve => server.close(resolve));
}
