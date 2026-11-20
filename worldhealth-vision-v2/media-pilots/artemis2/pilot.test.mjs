import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import {reviewPilot} from "./validate-pilot.mjs";
import {durationFrames,inspectProject} from "../../services/media-renderer/creative/validate-project.mjs";
test("primary NASA science report pilot has correct date, lunar grammar and source names",()=>{
 const result=reviewPilot();
 assert.equal(result.ok,true,JSON.stringify(result.errors));
 assert.equal(result.publication_allowed,false);
 assert.equal(result.sources.length,3);
 assert.equal(result.frames,750);
});
test("the pilot is a real-media silent review, not a falsely aligned news report",()=>{
 const project=JSON.parse(fs.readFileSync(new URL("./project.json",import.meta.url),"utf8"));
 const metadata=JSON.parse(fs.readFileSync(new URL("./sources.json",import.meta.url),"utf8"));
 assert.equal(inspectProject(project).ok,true);
 assert.equal(durationFrames(project),750);
 assert.equal(project.shots[0].titleFrameZero,true,"hook must be visible at frame 0");
 assert.equal(project.voice,null);
 assert.equal(project.music,null);
 assert.equal(project.captions,undefined);
 assert.equal(metadata.publication_approved,false);
 assert.ok(metadata.exclusions.some(x=>x.includes("Universal Production Music")));
 assert.ok(project.shots.every(s=>metadata.assets.some(a=>a.file===s.media?.file)));
 assert.ok(project.shots.some(s=>s.subtitle?.includes("PAS une photo")));
});

test("NASA originals have permanent SHA-256 pins and exact approved dimensions",()=>{
  const sources=JSON.parse(fs.readFileSync(new URL("./sources.json",import.meta.url),"utf8"));
  assert.equal(sources.assets.length,3);
  assert.deepEqual(sources.assets.map(a=>[a.id,a.width,a.height]),[
    ["art002e009627",5568,3712],
    ["art002e009288",5568,3712],
    ["art002e016252_impactflash_annotation_cropped",3840,2160]]);
  for(const a of sources.assets)assert.match(a.sha256,/^[a-f0-9]{64}$/);
  assert.equal(new Set(sources.assets.map(a=>a.sha256)).size,3);
});
