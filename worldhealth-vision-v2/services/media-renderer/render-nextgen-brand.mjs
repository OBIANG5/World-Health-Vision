/** Render two official G0 background palettes, independently of existing films. */
import path from "node:path";
import {fileURLToPath} from "node:url";
import {mkdirSync} from "node:fs";
import {bundle} from "@remotion/bundler";
import {renderMedia, selectComposition} from "@remotion/renderer";
const folder=path.dirname(fileURLToPath(import.meta.url));
const dir=path.join(folder,"output","nextgen");
mkdirSync(dir,{recursive:true});
const bundled=await bundle({
  entryPoint:path.join(folder,"src/nextgen/index.ts"),
  onProgress:()=>{}
});
const versions=[
  ["WVOriginalG0Midnight","worldvision-original-g0-midnight.mp4"],
  ["WVOriginalG0Graphite","worldvision-original-g0-graphite.mp4"],
];
for(const [id,name] of versions){
  const comp=await selectComposition({serveUrl:bundled,id});
  if(comp.width!==1080||comp.height!==1920||comp.durationInFrames!==90)
    throw new Error("Invalid official G0 brand candidate geometry: "+id);
  await renderMedia({
    composition:comp,serveUrl:bundled,codec:"h264",
    pixelFormat:"yuv420p",outputLocation:path.join(dir,name),
    concurrency:2,logLevel:"error",overwrite:true
  });
  console.log("ORIGINAL G0 PALETTE REVIEW:",name);
}
