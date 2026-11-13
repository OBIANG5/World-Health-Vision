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
  // Real pilot: grade the exact video, preserve the user's 1-to-10 values
  // across reloads, and verify secure handoff without creating a fake issue.
  await page.getByRole("button",{name:/Noter & valider/}).click();
  await page.locator('[data-review-gate="video"]').waitFor();
  // The exact user 1/10 refusal is loaded from durable GitHub-backed archive
  // even if Safari has lost the local browser cache.
  const archivedResponse=await page.request.get(base+"/review-archive/cop31-video.json");
  assert.equal(archivedResponse.status(),200,"Published refusal must be present in dist/ for iPhone.");
  const archiveRecord=await archivedResponse.json();
  assert.equal(archiveRecord.github_issue,9);
  const selectedStory=await page.evaluate(async()=>{
    const response=await window.fetch("/api/media/stories");
    const stories=await response.json();
    return stories[0]?{
      story:stories[0].id,
      hash:stories[0].render_job?.output_sha256||null,
      status:stories[0].render_job?.status||"none",
    }:null;
  });
  console.log("GitHub issue archive / active MP4",JSON.stringify({
    issue:archiveRecord.github_issue,
    story:archiveRecord.story_id,expected:archiveRecord.artifact_ref,
    selectedStory,
  }));
  assert.equal(selectedStory.hash,archiveRecord.artifact_ref);
  await page.getByText("AVIS DURABLE · GITHUB #9").waitFor();
  assert.equal(await page.locator("#wv-review-overall").inputValue(),"1");
  assert.equal(await page.locator("#wv-review-score-logo").inputValue(),"1");
  assert.equal(await page.locator("#wv-review-score-voix").inputValue(),"1");
  assert.equal(await page.locator("#wv-review-gh-link").count(),1,
    "An explicit refusal of 1/10 without written comments must be submittable.");
  await page.locator("#wv-review-overall").selectOption("2");
  await page.locator("#wv-review-score-logo").selectOption("1");
  await page.locator("#wv-review-score-voix").selectOption("2");
  await page.locator("#wv-review-score-animations").selectOption("1");
  await page.locator("#wv-review-notes").fill("Le logo est incorrect, la voix est robotique et les animations ne conviennent pas.");
  await page.locator("#wv-review-priorities").fill("Récupérer le logo exact, comparer trois voix, valider un micro-clip.");
  await page.getByRole("button",{name:"Refusé",exact:true}).click();
  await page.screenshot({path:path.join(dist,"media-studio-review-iphone.png"),fullPage:true});
  const reviewLink=page.locator("#wv-review-gh-link");
  assert.equal(await reviewLink.isVisible(),true);
  assert.equal(await reviewLink.getAttribute("target"),null,
    "GitHub must navigate the current tab to survive iOS in-app popup blocking.");
  const issueUrl=await reviewLink.getAttribute("href");
  assert.ok(issueUrl && issueUrl.startsWith("https://github.com/OBIANG5/World-Health-Vision/issues/new?"));
  const issue=new URL(issueUrl);
  assert.match(issue.searchParams.get("title"),/WV-REVIEW/);
  assert.match(issue.searchParams.get("body"),/2\/10/);
  assert.match(issue.searchParams.get("body"),/Le logo est incorrect/);
  assert.match(issue.searchParams.get("body"),/Vidéo SHA-256/);
  // Switching views MUST NOT silently discard an unsubmitted draft.
  await page.getByRole("button",{name:/Parcours vidéo/}).click();
  await page.getByRole("button",{name:/Noter & valider/}).click();
  await page.locator('[data-review-gate="video"]').waitFor();
  assert.equal(await page.locator("#wv-review-overall").inputValue(),"2");
  assert.equal(await page.locator("#wv-review-notes").inputValue(),
    "Le logo est incorrect, la voix est robotique et les animations ne conviennent pas.");
  await page.reload({waitUntil:"networkidle"});
  await page.locator('[data-review-gate="video"]').waitFor();
  assert.equal(await page.locator("#wv-review-overall").inputValue(),"2");
  assert.equal(await page.locator("#wv-review-score-logo").inputValue(),"1");
  assert.equal(await page.locator("#wv-review-score-voix").inputValue(),"2");
  assert.equal(await page.locator("#wv-review-notes").inputValue(),
    "Le logo est incorrect, la voix est robotique et les animations ne conviennent pas.");
  // Do not allow approving an identity design with no genuine logo asset.
  await page.locator(".wv-review-stage-tabs button").first().click();
  await page.locator(".wv-brand-gate").waitFor();
  assert.equal(await page.locator(".wv-brand-example.old img").count(),1);
  assert.equal(await page.locator(".wv-brand-example.approved img").count(),0,
    "Do not invent the missing approved multicolor logo.");
  const originalLogo=await page.request.get(base+"/brand-archive/legacy-eye-globe-blue.png");
  assert.equal(originalLogo.status(),200,"Historic eye-globe must be shipped as an actual asset.");
  await page.getByText(/FICHIER MANQUANT/).first().waitFor();
  await page.locator("#wv-review-overall").selectOption("10");
  for(const aspect of ["logo","couleurs","typographie"]) {
    await page.locator("#wv-review-score-"+aspect).selectOption("10");
  }
  await page.getByRole("button",{name:"Je valide",exact:true}).click();
  assert.equal(await page.locator("#wv-review-gh-link").count(),0);
  assert.equal(await page.getByRole("button",{name:/Note nécessaire avant l'enregistrement/}).isDisabled(),true);
  await page.getByRole("button",{name:/Parcours vidéo/}).click();
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
  assert.equal(await page.locator(".wv-media-story-card").count(),1);
  await page.locator(".wv-media-story-card").first().getByText(/COP31/).first().waitFor();
  await page.screenshot({path:path.join(dist,"media-studio-desk-iphone.png"),fullPage:true});
  await page.getByRole("button",{name:/Scanner le Web/}).click();
  await page.getByText(/Archive réelle en lecture seule/).first().waitFor();
  assert.deepEqual(errors,[]);
  console.log("iPhone 390x844: verified real news, 14 pages, 7 scenes, 8 QA gates, newsroom and blocked fake scan — passed.");

  const desktop = await browser.newPage({viewport:{width:1365,height:900}});
  await desktop.goto(base+"/index.html?view=media&screen=review&gate=video",{waitUntil:"networkidle"});
  await desktop.locator('[data-review-gate="video"]').waitFor();
  await desktop.screenshot({path:path.join(dist,"media-studio-review-desktop.png"),fullPage:true});
  await desktop.getByRole("button",{name:/Parcours vidéo/}).click();
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
