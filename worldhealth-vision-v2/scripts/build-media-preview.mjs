import {copyFileSync, existsSync, mkdirSync, readFileSync, writeFileSync} from "node:fs";
import path from "node:path";
import {writeRealEditorialCase} from "./media-preview-real-case.mjs";
import {fileURLToPath} from "node:url";

const scriptsDir = path.dirname(fileURLToPath(import.meta.url));
const dist = path.resolve(scriptsDir, "../frontend/web-v2/dist");
const indexPath = path.join(dist, "index.html");
const adapter = path.join(scriptsDir, "media-preview-bootstrap.js");

if (!existsSync(indexPath)) {
  throw new Error("V2 frontend must be built before packaging the mobile preview.");
}
if (!existsSync(adapter)) {
  throw new Error("The fictional demo adapter is missing.");
}
let html = readFileSync(indexPath, "utf8");
if (!html.includes("</head>") || !html.includes('id="root"')) {
  throw new Error("Unexpected V2 frontend HTML: refusing to inject into unknown markup.");
}
if (html.includes("media-preview-bootstrap.js")) {
  throw new Error("Demo script already installed: refusing duplicate injection.");
}

html = html.replace(
  "</head>",
  [
    '<meta name="robots" content="noindex,nofollow" />',
    '<script>if(new URLSearchParams(location.search).get("view")!=="media"){location.replace("./index.html?view=media")}</script>',
    '<script src="./media-preview-bootstrap.js"></script>',
    "</head>",
  ].join("\n"),
);
writeFileSync(indexPath, html, "utf8");
copyFileSync(adapter, path.join(dist, "media-preview-bootstrap.js"));
writeRealEditorialCase(dist);
// Display durable, user-submitted reviews on the same stable phone site.
const reviewSource = path.resolve(scriptsDir,"../docs/media/reviews/2026-11-13-cop31-video-5e62e2f0.json");
const reviewDest = path.join(dist,"review-archive");
if(!existsSync(reviewSource))throw new Error("Missing authoritative COP31 user review — cannot silently erase it.");
mkdirSync(reviewDest,{recursive:true});
copyFileSync(reviewSource,path.join(reviewDest,"cop31-video.json"));
// Preserve the REAL historic eye-globe as a clearly unapproved comparison
// asset; do not pretend that it is the approved multicolour logo.
const legacyEye=path.resolve(scriptsDir,"../../frontend/web/src/assets/logo.png");
if(!existsSync(legacyEye))throw new Error("Historical eye-globe source missing; refusing to invent a logo.");
const brandDest=path.join(dist,"brand-archive");
mkdirSync(brandDest,{recursive:true});
copyFileSync(legacyEye,path.join(brandDest,"legacy-eye-globe-blue.png"));
html = readFileSync(indexPath, "utf8").replace("<title>World Health Vision</title>", "<title>World-Vision Media Studio · reportage réel</title>");
writeFileSync(indexPath, html, "utf8");
console.log("Prepared authentic UN newsroom dossier + isolated read-only archive adapter.");
