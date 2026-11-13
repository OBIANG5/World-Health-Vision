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
  await page.getByText(/DOSSIER ONU VÉRIFIÉ|VIDÉO MP4 RÉELLE/).waitFor();
  await page.getByRole("heading", {name: /De l'actualité/}).waitFor();
  await page.locator(".wvj-subject option").first().waitFor({state:"attached"});
  assert.match(await page.locator(".wvj-subject option").first().textContent(),/COP31/);
  assert.equal(await page.locator(".wvj-step-card").count(),14);
  const scrollState = await page.evaluate(() => ({
    doc:document.documentElement.scrollHeight,
    viewport:window.innerHeight,
  }));
  assert.ok(scrollState.doc>scrollState.viewport*2,
    "Real editorial journey must be fully scrollable on an iPhone");
  await page.getByRole("button",{name:/02.*VERIFY/}).click();
  await page.getByText(/Six agences des Nations unies/).first().waitFor();
  await page.getByRole("button",{name:/07.*STORYBOARD/}).click();
  await page.getByRole("heading",{name:/Chaque seconde a un rôle/}).waitFor();
  assert.equal(await page.locator(".wvj-scene").count(),7);
  assert.match(new URL(page.url()).searchParams.get("step"),/storyboard/);
  await page.getByRole("button",{name:/Étape suivante/}).click();
  await page.getByRole("heading",{name:/Le son doit raconter/}).waitFor();
  await page.getByRole("button",{name:/09.*REMOTION/}).click();
  await page.getByRole("heading",{name:/Le montage devient un vrai MP4/}).waitFor();
  await page.getByRole("button",{name:/11.*QA/}).click();
  await page.getByRole("heading",{name:/huit portes de sécurité/i}).waitFor();
  assert.equal(await page.locator(".wvj-qa-item").count(),8);
  await page.getByRole("button",{name:/14.*PUBLISH/}).click();
  await page.getByText("Non publié",{exact:true}).waitFor();
  await page.getByRole("button",{name:/Vue d'ensemble/}).first().click();
  await page.evaluate(()=>window.scrollTo(0,0));
  await page.screenshot({path:path.join(dist,"media-studio-iphone.png"),fullPage:true});
  await page.getByRole("button",{name:/Control Room/}).first().click();
  assert.equal(await page.locator(".wv-media-story-card").count(),1);
  await page.getByText(/Vraie annonce des Nations unies/).first().waitFor();
  await page.screenshot({path:path.join(dist,"media-studio-desk-iphone.png"),fullPage:true});
  await page.getByRole("button",{name:/Scanner le Web/}).click();
  await page.getByText(/Archive réelle en lecture seule/).first().waitFor();
  assert.deepEqual(errors,[]);
  console.log("iPhone 390x844: verified real news, 14 pages, 7 scenes, 8 QA gates, newsroom and blocked fake scan — passed.");

  const desktop = await browser.newPage({viewport:{width:1365,height:900}});
  await desktop.goto(base+"/index.html?view=media",{waitUntil:"networkidle"});
  assert.equal(await desktop.locator(".wvj-step-card").count(),14);
  await desktop.getByRole("button",{name:/09.*REMOTION/}).click();
  await desktop.getByRole("heading",{name:/Le montage devient un vrai MP4/}).waitFor();
  await desktop.getByRole("button",{name:/Vue d'ensemble/}).first().click();
  await desktop.screenshot({path:path.join(dist,"media-studio-desktop.png"),fullPage:true});
  await desktop.close();
  console.log("Desktop 1365x900: source-backed real newsroom case — passed.");
} finally {
  await page?.close();
  await browser.close();
  await new Promise(resolve => server.close(resolve));
}
