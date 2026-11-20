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
 assert.equal(project.voice,null);
 assert.equal(project.music,null);
 assert.equal(project.captions,undefined);
 assert.equal(metadata.publication_approved,false);
 assert.ok(metadata.exclusions.some(x=>x.includes("Universal Production Music")));
 assert.ok(project.shots.every(s=>metadata.assets.some(a=>a.file===s.media?.file)));
 assert.ok(project.shots.some(s=>s.subtitle?.includes("PAS une photo")));
});
