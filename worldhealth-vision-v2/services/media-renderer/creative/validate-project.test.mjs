import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import {fileURLToPath} from "node:url";
import {FORMAT,inspectProject,durationFrames,resolveLocalFile} from "./validate-project.mjs";
import {geoCameraPose} from "../src/geo-motion-camera.mjs";
import {countryFocusGeometry} from "../src/country-focus-geometry.mjs";
import {createRequire} from "node:module";
import {geoContains} from "d3-geo";
const requireAtlas=createRequire(import.meta.url);
const atlas10=requireAtlas("world-atlas/countries-10m.json");
const atlas50=requireAtlas("world-atlas/countries-50m.json");

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

test("document focus only magnifies a selected passage in a provided still",()=>{
  const project=clone(sample);
  const shot=project.shots[0];
  shot.template="document_focus";
  shot.durationFrames=140;
  shot.title="Inspect the supplied document";
  shot.subtitle="A factual description from the human script";
  shot.media={kind:"image",file:"docs/supplied-source.png"};
  shot.documentRegion={x:.30,y:.40,width:.45,height:.20};
  assert.equal(inspectProject(project).ok,true);

  shot.media={kind:"video",file:"docs/source.mp4"};
  assert.ok(reasons(project).includes("shots[0].media"));
  shot.media={kind:"image",file:"docs/supplied-source.png"};
  shot.documentRegion={x:.8,y:.35,width:.45,height:.20};
  assert.ok(reasons(project).includes("shots[0].documentRegion"));
  shot.documentRegion={x:.3,y:.35,width:.04,height:.2};
  assert.ok(reasons(project).includes("shots[0].documentRegion"));
  shot.documentRegion={x:.3,y:.35,width:.45,height:.2};
  shot.durationFrames=68;
  assert.ok(reasons(project).includes("shots[0].durationFrames"));
  shot.durationFrames=140;
  shot.title="A".repeat(91);
  assert.ok(reasons(project).includes("shots[0].title"));
  shot.title="A source, never retyped by renderer";
  delete shot.documentRegion;
  assert.ok(reasons(project).includes("shots[0].documentRegion"));
});


test("geo story requires real coordinates and never injects an automatic geopolitical fact",()=>{
  const project=clone(sample);
  const shot=project.shots[0];
  shot.template="geo_story";
  shot.title="GÉOGRAPHIE — TEST SYNTHÉTIQUE";
  shot.durationFrames=150;
  shot.geo={
    center:{lon:13,lat:8},
    spinDegrees:14,
    target:{lon:11.59,lat:-0.72,label:"EXEMPLE CARTOGRAPHIQUE"},
    route:{from:{lon:2.35,lat:48.86},to:{lon:11.59,lat:-0.72}},
    metric:{label:"VALEUR DE TEST",value:42,unit:"",precision:0}
  };
  assert.equal(inspectProject(project).ok,true);

  shot.geo.center.lat=98;
  assert.ok(reasons(project).includes("shots[0].geo.center"));
  shot.geo.center.lat=8;
  shot.geo.target.lon=200;
  assert.ok(reasons(project).includes("shots[0].geo.target"));
  shot.geo.target.lon=11.59;
  shot.geo.route.to={...shot.geo.route.from};
  assert.ok(reasons(project).includes("shots[0].geo.route"));
  shot.geo.route.to={lon:11.59,lat:-.72};
  shot.geo.metric.value=Number.POSITIVE_INFINITY;
  assert.ok(reasons(project).includes("shots[0].geo.metric"));
  shot.geo.metric.value=42;
  shot.durationFrames=82;
  assert.ok(reasons(project).includes("shots[0].durationFrames"));
  shot.durationFrames=150;
  delete shot.geo;
  assert.ok(reasons(project).includes("shots[0].geo.center"));
});

test("geo story never guesses a numeric market value or coordinates from a photo",()=>{
  const p=clone(sample);
  const shot=p.shots[0];
  shot.template="geo_story";
  shot.durationFrames=150;
  shot.title="Lieu déterminé par le journaliste";
  shot.geo={center:{lon:0,lat:10}};
  assert.equal(inspectProject(p).ok,true);
  assert.equal("metric" in shot.geo,false);
  assert.equal("route" in shot.geo,false);
  assert.equal("target" in shot.geo,false);
});

test("director camera is a deterministic great-circle move, with exact target hold",()=>{
  const geo={center:{lon:179,lat:6},spinDegrees:16,
    camera:{to:{lon:-179,lat:6},startFrame:30,endFrame:90,zoom:1.12}};
  const initial=geoCameraPose(geo,0,150);
  const midpoint=geoCameraPose(geo,60,150);
  const final=geoCameraPose(geo,90,150);
  const held=geoCameraPose(geo,145,150);
  assert.equal(initial.centerLon,179);
  assert.equal(initial.zoom,1);
  assert.ok(Math.abs(midpoint.centerLon)>175,"Antimeridian should not rotate 358°");
  assert.ok(midpoint.zoom>1.05&&midpoint.zoom<1.08);
  assert.ok(Math.abs(final.centerLon+179)<1e-7);
  assert.ok(Math.abs(final.centerLat-6)<1e-7);
  assert.equal(final.spinDegrees,0);
  assert.equal(final.zoom,1.12);
  assert.deepEqual({lon:held.centerLon,lat:held.centerLat},
    {lon:final.centerLon,lat:final.centerLat});
  assert.deepEqual(geoCameraPose(geo,60,150),midpoint);
  const legacy=geoCameraPose({center:{lon:0,lat:10},spinDegrees:12},75,150);
  assert.equal(legacy.spinDegrees,6);
  assert.equal(legacy.zoom,1);
});

test("geo camera and sourced country spotlight fail closed on unknown geometry or bad beats",()=>{
  const p=clone(sample),shot=p.shots[0];
  shot.template="geo_story";shot.durationFrames=150;
  shot.title="TEST CARTOGRAPHIQUE UNIQUEMENT";
  shot.geo={center:{lon:10,lat:12},look:"photo",spinDegrees:12,
    camera:{to:{lon:11.6,lat:-.7},startFrame:15,endFrame:102,zoom:1.10},
    spotlight:{countryId:"266"}};
  assert.equal(inspectProject(p).ok,true,JSON.stringify(inspectProject(p).errors));
  shot.geo.spotlight.countryId="999";
  assert.ok(reasons(p).includes("shots[0].geo.spotlight"));
  shot.geo.spotlight.countryId="266";
  shot.geo.camera.to={lon:190,lat:0};
  assert.ok(reasons(p).includes("shots[0].geo.camera"));
  shot.geo.camera.to={lon:11.6,lat:-.7};
  shot.geo.camera.endFrame=145;
  assert.ok(reasons(p).includes("shots[0].geo.camera"),"Destination must remain visible");
  shot.geo.camera.endFrame=102;
  shot.geo.camera.startFrame=90;
  assert.ok(reasons(p).includes("shots[0].geo.camera"),"No abrupt 12-frame camera sweep");
  shot.geo.camera.startFrame=15;
  shot.geo.camera.zoom=1.7;
  assert.ok(reasons(p).includes("shots[0].geo.camera"),"Zoom beyond readable iris");
  shot.geo.camera.zoom=1.10;
  assert.equal(inspectProject(p).ok,true);
  delete shot.geo.camera;
  delete shot.geo.spotlight;
  assert.equal(inspectProject(p).ok,true,"Old GEO projects remain valid");
});

test("country-focus: 10m real polygon, 50m sourced context and legal source identity",()=>{
  const g=countryFocusGeometry(atlas10,atlas50,"266");
  assert.ok(g&&g.detailPath.length>100&&g.contextPath.length>200);
  assert.ok(g.centerXY&&g.centerXY.every(Number.isFinite));
  assert.equal(g.countryId,"266");
  assert.ok(g.contextRadius>=.36&&g.contextRadius<.8);
  assert.ok(g.contextPath.length<650000,"Gabon context must not draw nearly the entire globe");
  assert.equal(g.geoContainsPoint([11.6,-.7]),true,"Gabon location should sit within the country");
  assert.equal(g.geoContainsPoint([2.35,48.86]),false,"Paris must not appear inside Gabon");
  assert.equal(countryFocusGeometry(atlas10,atlas50,"999"),null,"Unknown country cannot be fabricated");
});

test("country-focus validator rejects fake map, wrong country marker, and shortened storytelling",()=>{
  const p=clone(sample);
  const shot=p.shots[0];
  shot.template="country_focus";
  shot.durationFrames=150;
  shot.title="FOCUS PAYS — DÉMONSTRATION";
  shot.subtitle="Animation de données fictives sur une cartographie réelle.";
  shot.geo={center:{lon:0,lat:10},
    spotlight:{countryId:"266"},
    target:{lon:11.6,lat:-.7,label:"POINT TECHNIQUE"},
    metric:{label:"TEST TECHNIQUE",value:42,unit:" TEST",precision:0}};
  shot.media={kind:"image",file:"synthetic-landscape.png"};
  assert.equal(inspectProject(p).ok,true,JSON.stringify(inspectProject(p).errors));
  shot.geo.spotlight.countryId="999";
  assert.ok(reasons(p).includes("shots[0].geo.spotlight"));
  shot.geo.spotlight.countryId="266";
  shot.geo.target={lon:2.35,lat:48.86,label:"PAS AU GABON"};
  assert.ok(reasons(p).includes("shots[0].geo.target"));
  shot.geo.target={lon:11.6,lat:-.7,label:"POINT TECHNIQUE"};
  shot.durationFrames=80;
  assert.ok(reasons(p).includes("shots[0].durationFrames"));
  shot.durationFrames=150;
  shot.geo.camera={to:{lon:5,lat:0},startFrame:10,endFrame:100,zoom:1.1};
  assert.ok(reasons(p).includes("shots[0].geo"));
  delete shot.geo.camera;
  shot.geo.route={from:{lon:2,lat:5},to:{lon:3,lat:4}};
  assert.ok(reasons(p).includes("shots[0].geo"));
  delete shot.geo.route;
  assert.equal(inspectProject(p).ok,true);
  // Existing GEO and other scenes are not forced into country-focus.
  shot.template="geo_story";
  assert.equal(inspectProject(p).ok,true);
});

test("international country focus loads independent 10m shapes for Fiji and Russia",()=>{
  for(const id of ["242","643"]){
    const geometry=countryFocusGeometry(atlas10,atlas50,id);
    assert.ok(geometry, "Valid world-atlas country ID "+id);
    assert.ok(geometry.detailPath.length>50, "10m country outline must exist");
    assert.ok(geometry.centroid.every(Number.isFinite));
    assert.ok(geometry.contextRadius>=.36&&geometry.contextRadius<=1.10);
  }
  // Island/datetime-rich countries still require a human visual map review.
});

test("PHOTO multilayer accepts only genuine user photo with six independently staged tracks",()=>{
  const p=clone(sample),shot=p.shots[0];
  shot.template="photo_layers";shot.durationFrames=165;
  shot.title="UNE IMAGE, PLUSIEURS MOUVEMENTS";
  shot.subtitle="Séquence originale de démonstration, aucun reportage.";
  shot.media={kind:"image",file:"synthetic-landscape.png"};
  shot.foreground={file:"synthetic-foreground.png"};
  shot.photo={
    camera:{scaleStart:1.02,scaleEnd:1.11,panX:-22,panY:-8,startFrame:0,endFrame:130},
    reveal:{startFrame:3,endFrame:68,direction:"left"},
    highlight:{x:.56,y:.44,radius:.28,startFrame:38,endFrame:99},
    metric:{label:"VALEUR FICTIVE",value:42,unit:" TEST",precision:0,startFrame:68,endFrame:122}
  };
  assert.equal(inspectProject(p).ok,true,JSON.stringify(inspectProject(p).errors));
  shot.media={kind:"video",file:"false-footage.mp4"};
  assert.ok(reasons(p).includes("shots[0].media"));
  shot.media={kind:"image",file:"synthetic-landscape.png"};
  shot.photo.camera.panX=Infinity;
  assert.ok(reasons(p).includes("shots[0].photo.camera"));
  shot.photo.camera.panX=-22;
  shot.photo.reveal.endFrame=5;
  assert.ok(reasons(p).includes("shots[0].photo.reveal"));
  shot.photo.reveal.endFrame=68;
  shot.photo.highlight.x=2;
  assert.ok(reasons(p).includes("shots[0].photo.highlight"));
  shot.photo.highlight.x=.56;
  shot.photo.metric.value=NaN;
  assert.ok(reasons(p).includes("shots[0].photo.metric"));
  shot.photo.metric.value=42;
  shot.photo.metric.startFrame=150;
  assert.ok(reasons(p).includes("shots[0].photo.metric"));
  shot.photo.metric.startFrame=68;
  shot.durationFrames=65;
  assert.ok(reasons(p).includes("shots[0].durationFrames"));
  shot.durationFrames=165;
  assert.equal(inspectProject(p).ok,true);
});

test("PHOTO multilayer never invents a missing image or a number",()=>{
  const p=clone(sample),shot=p.shots[0];
  shot.template="photo_layers";shot.durationFrames=165;
  shot.title="IMAGE D'ORIGINE REQUISE";
  shot.photo={
    camera:{scaleStart:1,scaleEnd:1.08,panX:0,panY:0,startFrame:0,endFrame:120},
    reveal:{startFrame:8,endFrame:65,direction:"right"}
  };
  assert.ok(reasons(p).includes("shots[0].media"));
  shot.media={kind:"image",file:"synthetic-landscape.png"};
  assert.equal(inspectProject(p).ok,true);
  assert.equal("metric" in shot.photo,false);
  assert.equal("foreground" in shot,false);
});
