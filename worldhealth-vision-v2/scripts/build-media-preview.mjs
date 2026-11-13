import {copyFileSync, existsSync, readFileSync, writeFileSync} from "node:fs";
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
html = readFileSync(indexPath, "utf8").replace("<title>World Health Vision</title>", "<title>World-Vision Media Studio · reportage réel</title>");
writeFileSync(indexPath, html, "utf8");
console.log("Prepared authentic UN newsroom dossier + isolated read-only archive adapter.");
