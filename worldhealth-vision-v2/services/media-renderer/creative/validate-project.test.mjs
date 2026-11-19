import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import {fileURLToPath} from "node:url";
import {FORMAT,inspectProject,durationFrames,resolveLocalFile} from "./validate-project.mjs";
import {geoCameraPose} from "../src/geo-motion-camera.mjs";
import {photoTrackPose,motionProgress} from "../src/photo-motion-tracks.mjs";
import {dataPose,dataPointGeometry,rankedData,heatmapCells,dataStagger} from "../src/data-motion-engine.mjs";
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

test("photo STORY tracks are separate, monotone and camera-tied in Player and MP4",()=>{
  const photo={
    camera:{zoomFrom:1.05,zoomTo:1.13,panX:18,panY:-14,startFrame:0,endFrame:132},
    subject:{dx:-12,dy:-17,scale:.055,startFrame:12,endFrame:125},
    mask:{axis:"horizontal",startFrame:18,endFrame:68},
    focus:{x:.5,y:.48,radius:83,startFrame:48,endFrame:91},
    metric:{label:"TEST",value:42,unit:" TEST",precision:0,
      sourceLabel:"source fictive de CI — aucun fait",startFrame:71,endFrame:122}
  };
  const at0=photoTrackPose(photo,0,165);
  const at40=photoTrackPose(photo,40,165);
  const at80=photoTrackPose(photo,80,165);
  const at140=photoTrackPose(photo,140,165);
  assert.equal(at0.camera.scale,1.05);
  assert.equal(at0.subject.progress,0);
  assert.equal(at0.focusProgress,0);
  assert.equal(at0.countProgress,0);
  assert.ok(at40.camera.progress>0&&at40.maskProgress>0);
  assert.equal(at40.countProgress,0,"Metric stays held while image is revealed");
  assert.ok(at80.focusProgress>0);
  assert.ok(at80.countProgress>0&&at80.countProgress<1);
  assert.equal(at140.maskProgress,1);
  assert.equal(at140.focusProgress,1);
  assert.equal(at140.countProgress,1);
  assert.ok(Math.abs(at140.camera.scale-1.13)<1e-10);
  assert.equal(at140.camera.panX,18);
  assert.ok(at140.focusPoint&&Math.abs(at140.focusPoint.x-558)<.01);
  assert.deepEqual(photoTrackPose(photo,80,165),at80);
  assert.equal(motionProgress(0,10,60),0);
  assert.equal(motionProgress(60,10,60),1);
});

test("photo STORY validates imported original, safe crop, foreground, timing and metric attribution",()=>{
  const p=clone(sample),s=p.shots[0];
  s.template="photo_story";s.durationFrames=165;
  s.title="UNE SEULE PHOTO · SIX MOUVEMENTS";
  s.subtitle="Essai original, non journalistique.";
  s.media={kind:"image",file:"synthetic-landscape.png"};
  s.foreground={file:"synthetic-foreground.png"};
  s.photo={
    camera:{zoomFrom:1.05,zoomTo:1.13,panX:18,panY:-14,startFrame:0,endFrame:132},
    subject:{dx:-12,dy:-17,scale:.055,startFrame:12,endFrame:125},
    mask:{axis:"horizontal",startFrame:18,endFrame:68},
    focus:{x:.5,y:.48,radius:83,startFrame:48,endFrame:91},
    metric:{label:"TEST TECHNIQUE",value:42,unit:" TEST",precision:0,
      sourceLabel:"Simulation non journalistique",startFrame:71,endFrame:122}
  };
  assert.equal(inspectProject(p).ok,true,JSON.stringify(inspectProject(p).errors));
  s.photo.camera.panX=80;
  assert.ok(reasons(p).includes("shots[0].photo.camera"));
  s.photo.camera.panX=18;
  s.photo.focus.x=.98;
  assert.ok(reasons(p).includes("shots[0].photo.focus"));
  s.photo.focus.x=.5;
  s.photo.metric.sourceLabel="";
  assert.ok(reasons(p).includes("shots[0].photo.metric"));
  s.photo.metric.sourceLabel="X".repeat(86);
  assert.ok(reasons(p).includes("shots[0].photo.metric"),"Oversized provenance must not be hidden in mobile chart");
  s.photo.metric.sourceLabel="Simulation non journalistique";
  s.foreground=undefined;
  assert.ok(reasons(p).includes("shots[0].photo.subject"));
  s.foreground={file:"synthetic-foreground.png"};
  s.photo.mask.endFrame=22;
  assert.ok(reasons(p).includes("shots[0].photo.mask"));
  s.photo.mask.endFrame=68;
  s.media={kind:"video",file:"synthetic-clip.mp4"};
  assert.ok(reasons(p).includes("shots[0].media"));
  s.media={kind:"image",file:"synthetic-landscape.png"};
  assert.equal(inspectProject(p).ok,true);
  delete s.photo;
  assert.ok(reasons(p).includes("shots[0].photo"));
});

test("DATA charts animate independent editorial, plot, number and source tracks",()=>{
  const intro=dataPose(0,165);
  const plot=dataPose(89,165);
  const end=dataPose(162,165);
  assert.ok(intro.intro>.1,"First frame cannot be blank");
  assert.equal(intro.plot,0);
  assert.ok(plot.plot>0&&plot.plot<1);
  assert.equal(plot.source,0,"Source comes in its own later beat");
  assert.equal(end.plot,1);
  assert.equal(end.source,1);
  assert.deepEqual(dataPose(89,165),plot);
});

test("DATA geometry faithfully plots sourced values, stable tied ranks and honest 0-based heatmap",()=>{
  const sample={mode:"line",series:[
    {date:"2026-01-01",label:"JAN",value:10},
    {date:"2026-02-01",label:"FÉV",value:15},
    {date:"2026-03-01",label:"MAR",value:12}
  ],domain:{min:8,max:16}};
  const points=dataPointGeometry(sample);
  assert.equal(points[0].y,957.5);
  assert.equal(points[1].y,651.25);
  assert.equal(points[2].x,955);
  assert.ok(points.every(p=>p.y>=590&&p.y<=1080));
  const ranks=rankedData([{label:"A",value:3},{label:"B",value:10},{label:"C",value:10},{label:"D",value:2}]);
  assert.deepEqual(ranks.map(v=>[v.label,v.rank]),[["B",1],["C",1],["A",3],["D",4]],
    "Equal values share an honest rank, not false ordinal placement.");
  const h=heatmapCells([{label:"A",value:0},{label:"B",value:50},{label:"C",value:100}],{min:0,max:100});
  assert.deepEqual(h.map(v=>v.intensity),[0,.5,1]);
  assert.deepEqual(h.map(v=>v.col),[0,1,2]);
});

test("DATA series require real date syntax, explicit units, legal numeric scale and publisher",()=>{
  const p=clone(sample),shot=p.shots[0];
  shot.template="data_story";shot.durationFrames=165;
  shot.title="INDICATEUR · SYNTHÉTIQUE UNIQUEMENT";
  shot.subtitle="Aucun chiffre d'actualité.";
  delete shot.foreground;
  shot.data={
    mode:"line",
    series:[
      {date:"2026-01-01",label:"JAN",value:10},
      {date:"2026-02-01",label:"FÉV",value:15},
      {date:"2026-03-01",label:"MAR",value:12}
    ],
    source:{publisher:"INSTITUTION FICTIVE POUR CI",dataset:"Jeu de données purement synthétique",
      asOf:"2026-03-01",url:"https://example.invalid/test"},
    domain:{min:8,max:16},unit:" TEST",precision:0,locale:"fr-FR"
  };
  assert.equal(inspectProject(p).ok,true,JSON.stringify(inspectProject(p).errors));
  shot.data.series[1].date="2025-02-01";
  assert.ok(reasons(p).includes("shots[0].data.series[1].date"));
  shot.data.series[1].date="2026-02-01";
  shot.data.source.asOf="2026-01-01";
  assert.ok(reasons(p).includes("shots[0].data.source"));
  shot.data.source.asOf="2026-03-01";
  shot.data.source.publisher="";
  assert.ok(reasons(p).includes("shots[0].data.source"));
  shot.data.source.publisher="INSTITUTION FICTIVE POUR CI";
  shot.data.domain.max=11;
  assert.ok(reasons(p).includes("shots[0].data.domain"));
  shot.data.domain.max=16;
  assert.equal(inspectProject(p).ok,true);
});

test("DATA rankings and heatmaps reject deceptive baselines and missing attribution",()=>{
  const p=clone(sample),shot=p.shots[0];
  shot.template="data_story";shot.durationFrames=165;
  shot.title="CLASSEMENT D'ESSAI · NON JOURNALISTIQUE";
  shot.data={
    mode:"ranking",series:[
      {label:"CAT A",value:20},{label:"CAT B",value:7},{label:"CAT C",value:12}
    ],
    source:{publisher:"CI SYNTHETIC",dataset:"Comparatif fictif",asOf:"2026-03-01"},
    domain:{min:0,max:25},unit:" TEST",precision:0
  };
  assert.equal(inspectProject(p).ok,true,JSON.stringify(inspectProject(p).errors));
  shot.data.domain.min=6;
  assert.ok(reasons(p).includes("shots[0].data.domain"),"Ranking must start at zero");
  shot.data.domain.min=0;
  shot.data.series[1].value=-5;
  assert.ok(reasons(p).includes("shots[0].data.series[1].value"));
  shot.data.mode="heatmap";
  shot.data.series=[{label:"A",value:3},{label:"B",value:6},{label:"C",value:0},{label:"D",value:9}];
  shot.data.domain.max=10;
  assert.equal(inspectProject(p).ok,true,JSON.stringify(inspectProject(p).errors));
  shot.data.source.asOf="2026-02-30";
  assert.ok(reasons(p).includes("shots[0].data.source"),"Reject impossible publication date");
});

test("DATA stagger never silently shortens a final ranked bar or heatmap cell",()=>{
  for(const count of [3,4,8,12,16]){
    const starts=Array.from({length:count},(_,i)=>dataStagger(0,i,count));
    const finals=Array.from({length:count},(_,i)=>dataStagger(1,i,count));
    assert.ok(starts.every(v=>v===0));
    assert.ok(finals.every(v=>v===1), "Every category must show 100% of its stated value");
    assert.ok(dataStagger(.50,0,count)>dataStagger(.50,count-1,count));
  }
});
