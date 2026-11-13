/**
 * World-Vision — verified D01 technical motion sample, no external publication.
 * Produces a 4s/24fps/1080x1920 MP4 from the ACTUAL cinematic WebGL renderer
 * and the same spherical target maths used by the Media Studio.
 *
 * Requires built dist/ and dist/earth/blue-marble-topography-nasa.jpg.
 * Technical review only: no music, voice, news footage or artistic approval.
 */
import assert from "node:assert/strict";
import {createServer} from "node:http";
import {createReadStream,existsSync,mkdirSync,readFileSync,rmSync,statSync,writeFileSync} from "node:fs";
import {mkdtemp} from "node:fs/promises";
import {tmpdir} from "node:os";
import {createHash} from "node:crypto";
import {spawnSync} from "node:child_process";
import path from "node:path";
import {fileURLToPath} from "node:url";
import {chromium} from "playwright";

const root=path.dirname(fileURLToPath(import.meta.url));
const dist=path.join(root,"dist");
const country=process.env.WV_CINEMA_TARGET_ISO3||"GAB";
const fps=24,seconds=4,frames=fps*seconds;
const outdir=path.join(dist,"media-lab");
const outfile=path.join(outdir,`wv-d01-${country.toLowerCase()}-technical-4s.mp4`);
assert.match(country,/^[A-Z]{3}$/,"ISO3 country code is required");
const nasa=path.join(dist,"earth","blue-marble-topography-nasa.jpg");
assert.ok(existsSync(nasa)&&statSync(nasa).size>400000,"Real NASA texture must be bundled");
const valid=path.join(dist,"countries.geojson");
assert.ok(existsSync(valid),"A real GeoJSON is mandatory");
const provenance=JSON.parse(readFileSync(path.join(dist,"earth","provenance.json"),"utf8"));
assert.equal(provenance.sha256,createHash("sha256").update(readFileSync(nasa)).digest("hex"));

const mime={".html":"text/html",".js":"application/javascript",".css":"text/css",
  ".png":"image/png",".jpg":"image/jpeg",".json":"application/json",".woff2":"font/woff2"};
const server=createServer((req,res)=>{
  const address=new URL(req.url||"/","http://localhost");
  const file=path.resolve(dist,"."+decodeURIComponent(address.pathname==="/"?"/index.html":address.pathname));
  if(!file.startsWith(dist+path.sep)||!existsSync(file)||!statSync(file).isFile()){
    res.writeHead(404);res.end("Not Found");return;
  }
  res.writeHead(200,{"content-type":mime[path.extname(file)]||"application/octet-stream",
    "cache-control":"no-store"});
  createReadStream(file).pipe(res);
});
await new Promise(resolve=>server.listen(0,"127.0.0.1",resolve));
const port=server.address().port;
const working=await mkdtemp(path.join(tmpdir(),"wv-cinematic-d01-"));
let browser;
try{
  browser=await chromium.launch({headless:true,args:[
    "--enable-webgl","--use-gl=angle","--use-angle=swiftshader","--enable-unsafe-swiftshader",
  ]});
  const context=await browser.newContext({viewport:{width:540,height:960},deviceScaleFactor:2,
    reducedMotion:"reduce"});
  const page=await context.newPage();
  const errors=[];
  page.on("pageerror",error=>errors.push(error.message));
  const url=`http://127.0.0.1:${port}/index.html?view=media&screen=review&gate=direction&cinema_only=1&iso3=${country}`;
  await page.goto(url,{waitUntil:"networkidle",timeout:60000});
  await page.locator("#wv-cinema-capture").waitFor({timeout:25000});
  await page.waitForFunction(()=>{
    const container=document.querySelector("#wv-cinema-capture");
    return container?.getAttribute("data-target-valid")==="true" &&
      !container.getAttribute("data-capture-error") &&
      !container.querySelector(".wv-cinematic-loading,.wv-cinematic-error") &&
      container.querySelector(".wv-cinematic-gl-layer")?.width>600;
  },null,{timeout:40000});
  for(let i=0;i<frames;i++){
    const progress=i/(frames-1);
    await page.evaluate(progress=>window.postMessage({
      type:"WV_CINEMATIC_FRAME_V1",progress
    },window.location.origin),progress);
    await page.waitForFunction(expected=>{
      const s=document.querySelector("#wv-cinema-capture")?.getAttribute("data-frame");
      return s!==null&&Math.abs(Number(s)-expected)<.00001;
    },progress,{timeout:5000});
    // Wait for useEffect WebGL uniforms and the 2D geography overlay.
    await page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));
    await page.screenshot({path:path.join(working,`frame-${String(i).padStart(4,"0")}.png`),
      scale:"device",animations:"disabled",timeout:20000});
    if(i%24===0)console.log(`D01 captured ${i+1}/${frames}`);
  }
  assert.deepEqual(errors,[],"No Chromium runtime errors allowed");
  await context.close();
  mkdirSync(outdir,{recursive:true});
  const render=spawnSync("ffmpeg",[
    "-y","-hide_banner","-loglevel","error","-framerate",String(fps),
    "-i",path.join(working,"frame-%04d.png"),"-c:v","libx264",
    "-preset","fast","-crf","18","-pix_fmt","yuv420p",
    "-r",String(fps),"-movflags","+faststart",outfile,
  ],{encoding:"utf8",timeout:240000});
  assert.equal(render.status,0,`FFmpeg failed: ${render.stderr}`);
  assert.ok(statSync(outfile).size>100000,"MP4 unexpectedly small");
  const probe=spawnSync("ffprobe",["-v","error","-show_entries",
    "stream=width,height,nb_frames,r_frame_rate:format=duration",
    "-of","json",outfile],{encoding:"utf8",timeout:25000});
  assert.equal(probe.status,0,`ffprobe failed: ${probe.stderr}`);
  const details=JSON.parse(probe.stdout);
  assert.equal(details.streams[0].width,1080);
  assert.equal(details.streams[0].height,1920);
  const duration=Number(details.format.duration);
  assert.ok(duration>=3.95&&duration<=4.05,"MP4 must be four seconds");
  const sha=createHash("sha256").update(readFileSync(outfile)).digest("hex");
  const report={
    schema_version:"wv-cinematic-d01-technical-motion-v1",
    source:"World-Vision GitHub Actions",
    status:"TECHNICAL_SAMPLE_NOT_ARTISTICALLY_APPROVED_NOT_FOR_PUBLICATION",
    target_iso3:country,
    frame_count:frames,fps,width:1080,height:1920,duration_seconds:duration,
    image_source:"NASA Blue Marble Next Generation January",
    image_sha256:provenance.sha256,
    borders:"worldhealth-vision-v2/frontend/web-v2/public/countries.geojson",
    interpolation:"geoTargeting.mjs great-circle + quintic easing",
    visual_engine:"CinematicEarth.tsx WebGL ray-sphere + projected borders",
    video_filename:path.basename(outfile),video_sha256:sha,
    publication_authorized:false,voice_approved:false,art_direction_approved:false,
  };
  writeFileSync(path.join(outdir,`wv-d01-${country.toLowerCase()}-technical-4s.json`),
    JSON.stringify(report,null,2)+"\n");
  console.log("D01 technical capture passed",JSON.stringify(report));
}finally{
  await browser?.close();
  await new Promise(resolve=>server.close(resolve));
  rmSync(working,{force:true,recursive:true});
}
