import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import {fileURLToPath} from "node:url";
import {FORMAT,inspectProject,durationFrames,resolveLocalFile} from "./validate-project.mjs";

const here=path.dirname(fileURLToPath(import.meta.url));
const sample=JSON.parse(fs.readFileSync(path.join(here,"project.example.json"),"utf8"));
const clone=o=>structuredClone(o);
const reasons=p=>inspectProject(p).errors.map(e=>e.field);

test("example is valid but clearly technical, with authored script left untouched",()=>{
  assert.equal(sample.schema_version,FORMAT);
  assert.equal(inspectProject(sample).ok,true);
  assert.equal(durationFrames(sample),151);
  assert.ok(sample.script.includes("exemple"));
});
test("no mandatory Vivienne, no voice provider or automatic script research",()=>{
  const project=clone(sample);
  project.voice={file:"voice/human-narration.wav",label:"Human presenter"};
  assert.equal(inspectProject(project).ok,true);
  project.voice={file:"voice/synthetic-approved.mp3",label:"Another licensed TTS"};
  assert.equal(inspectProject(project).ok,true);
  project.voice=null;
  assert.equal(inspectProject(project).ok,true);
});
test("real documentary shots never silently degrade into generic placeholders",()=>{
  const project=clone(sample);project.shots[0].template="documentary";
  assert.ok(reasons(project).includes("shots[0].media"));
  project.shots[0].media={kind:"image",file:"photos/real.jpg"};
  assert.equal(inspectProject(project).ok,true);
});
test("external finished animation clips can enter as a full frame shot",()=>{
  const project=clone(sample);project.shots[1].template="clean_video";
  project.shots[1].media={kind:"video",file:"animations/pre-rendered.mp4",trimBefore:15};
  assert.equal(inspectProject(project).ok,true);
});
test("path traversal, external URL and wrong media types are rejected",()=>{
  const project=clone(sample);project.shots[0].media={kind:"image",file:"../secret.jpg"};
  assert.ok(reasons(project).includes("shots[0].media"));
  project.shots[0].media={kind:"image",file:"https://example.org/foo.jpg"};
  assert.ok(reasons(project).includes("shots[0].media"));
  project.shots[0].media={kind:"video",file:"photo.jpg"};
  assert.ok(reasons(project).includes("shots[0].media.file"));
});
test("transition overlap and sample render duration always agree",()=>{
  const project=clone(sample);
  assert.equal(durationFrames(project),75+84-8);
  project.shots[0].transitionFrames=95;
  assert.ok(reasons(project).includes("shots[0].transitionFrames"));
  project.shots[0].transitionAfter="cut";
  project.shots[0].transitionFrames=8;
  assert.ok(reasons(project).includes("shots[0].transitionFrames"));
  project.shots[0].transitionFrames=0;
  assert.equal(durationFrames(project),159);
});
test("refuse disappearing frames, unsafe volume and huge timelines",()=>{
  const project=clone(sample);
  project.shots[0].durationFrames=0;
  assert.ok(reasons(project).includes("shots[0].durationFrames"));
  project.shots[0].durationFrames=75;
  project.music={file:"music/soundtrack.mp3",volume:5};
  assert.ok(reasons(project).includes("music.volume"));
});
test("local path confinement follows symlinks and rejects escapes",()=>{
  const tmp=fs.mkdtempSync(path.join(os.tmpdir(),"wv-project-tests-"));
  try{
    const assets=path.join(tmp,"assets");
    fs.mkdirSync(assets);
    fs.writeFileSync(path.join(assets,"image.png"),"fixture");
    assert.equal(resolveLocalFile(assets,"image.png"),fs.realpathSync(path.join(assets,"image.png")));
    assert.throws(()=>resolveLocalFile(assets,"../outside.jpg"));
    const external=path.join(tmp,"outside.jpg");
    fs.writeFileSync(external,"sensitive fixture");
    fs.symlinkSync(external,path.join(assets,"link.jpg"));
    assert.throws(()=>resolveLocalFile(assets,"link.jpg"));
  }finally{fs.rmSync(tmp,{recursive:true,force:true});}
});
test("no implicit publication or false AI quality approval",()=>{
  const project=clone(sample);
  assert.equal(Object.hasOwn(project,"publication"),false);
  assert.equal(Object.hasOwn(project,"approved"),false);
  assert.equal(inspectProject(project).ok,true);
});

test("professionally prepared foreground cutout is optional and must be transparent-image format",()=>{
  const project=clone(sample);
  project.shots[0].media={kind:"image",file:"assets/primary.jpg"};
  project.shots[0].foreground={file:"assets/foreground.png"};
  assert.equal(inspectProject(project).ok,true);
  project.shots[0].foreground={file:"assets/foreground.jpg"};
  assert.ok(reasons(project).includes("shots[0].foreground.file"));
  delete project.shots[0].media;
  project.shots[0].foreground={file:"assets/foreground.webp"};
  assert.ok(reasons(project).includes("shots[0].foreground"));
});
test("cinematic focus reveal needs actual user media, enough frames and concise title",()=>{
  const project=clone(sample);
  project.shots[0].template="focus_reveal";
  project.shots[0].durationFrames=75;
  assert.ok(reasons(project).includes("shots[0].durationFrames"));
  assert.ok(reasons(project).includes("shots[0].media"));
  project.shots[0].durationFrames=100;
  project.shots[0].title="A real authored headline";
  project.shots[0].media={kind:"image",file:"abstract/demo.png"};
  assert.equal(inspectProject(project).ok,true);
  project.shots[0].title="X".repeat(91);
  assert.ok(reasons(project).includes("shots[0].title"));
});
