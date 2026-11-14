/** Isolated 3s brand concept render; never edits existing World-Vision episodes. */
import path from "node:path";
import {fileURLToPath} from "node:url";
import {mkdirSync} from "node:fs";
import {bundle} from "@remotion/bundler";
import {renderMedia, selectComposition} from "@remotion/renderer";

const folder=path.dirname(fileURLToPath(import.meta.url));
const dest=path.join(folder,"output","nextgen","worldvision-eye-only-outro-candidate.mp4");
mkdirSync(path.dirname(dest),{recursive:true});
const bundled=await bundle({
  entryPoint:path.join(folder,"src/nextgen/index.ts"),
  onProgress:()=>{}
});
const comp=await selectComposition({serveUrl:bundled,id:"WVNextGenBrandOutroCandidate"});
if(comp.width!==1080||comp.height!==1920||comp.durationInFrames!==90)
  throw new Error("Invalid nextgen brand candidate geometry");
await renderMedia({
  composition:comp,serveUrl:bundled,codec:"h264",pixelFormat:"yuv420p",
  outputLocation:dest,concurrency:2,logLevel:"error",overwrite:true
});
console.log("CANDIDATE ONLY: "+dest);
