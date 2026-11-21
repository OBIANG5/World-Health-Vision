import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import {parseStudioProject,frameCaptionsToSrt,studioAssetNames,studioShotToEditor} from "./studio-project-io.mjs";
import {parseSrtCaptions} from "../src/caption-timeline.mjs";
import {inspectProject} from "./validate-project.mjs";

const example=JSON.parse(fs.readFileSync(new URL("./project.example.json",import.meta.url),"utf8"));
const clone=()=>structuredClone(example);
const defaults={
 documentX:.25,documentY:.32,documentW:.5,documentH:.22,
 geoLon:0,geoLat:10,geoSpin:16,geoLook:"photo",geoToLon:0,geoToLat:0,
 geoCameraStart:15,geoCameraEnd:102,geoCameraZoom:1.1,
 geoTargetLon:0,geoTargetLat:0,geoFromLon:0,geoFromLat:0,
 dataMode:"line",photoSettings:{
  camera:{zoomFrom:1.05,zoomTo:1.13,panX:18,panY:-14,startFrame:0,endFrame:132},
  subject:{dx:0,dy:0,scale:0,startFrame:0,endFrame:100},
  mask:{axis:"horizontal",startFrame:0,endFrame:60},
  focus:{x:.5,y:.5,radius:80,startFrame:20,endFrame:65},
  metric:{label:"",value:0,unit:"",precision:0,sourceLabel:"",startFrame:0,endFrame:60}
 }
};
test("a Studio-exported example reopens with authored text and exactly preserved shot timing",()=>{
  const p=parseStudioProject(JSON.stringify(example));
  assert.equal(p.schema_version,"worldvision-creative-project-v1");
  assert.equal(p.shots.length,2);
  assert.equal(p.script,example.script);
  assert.equal(p.shots[0].transitionFrames,8);
  assert.deepEqual(studioAssetNames(p),[]);
  assert.equal(inspectProject(p).ok,true);
});
test("reopen local asset names, credit, trim, selected voice and original captions without substituting media",()=>{
  const p=clone();
  p.shots[0].template="focus_reveal";p.shots[0].durationFrames=105;
  p.shots[0].title="Observation lunaire réelle";
  p.shots[0].media={kind:"video",file:"original-orion.mp4",credit:"NASA · source vérifiée",trimBefore:42};
  p.shots[0].foreground={file:"front.png",credit:"Détourage approuvé"};
  p.voice={file:"voix-fr.wav",label:"Voix choisie ou enregistrée",volume:1};
  p.music={file:"ambiance.mp3",label:"Bande-son fournie",volume:.1};
  p.captions=[{startFrame:1,endFrame:48,text:"Exemple authentifié.",position:"upper"},
    {startFrame:51,endFrame:94,text:"Un deuxième passage.",position:"lower"}];
  const imported=parseStudioProject(JSON.stringify(p));
  assert.deepEqual(studioAssetNames(imported),["original-orion.mp4","front.png","voix-fr.wav","ambiance.mp3"]);
  const edited=studioShotToEditor(imported.shots[0],defaults);
  assert.equal(edited.mediaName,"original-orion.mp4");
  assert.equal(edited.mediaTrimBefore,42);
  assert.equal(edited.mediaCredit,"NASA · source vérifiée");
  assert.equal(edited.foregroundName,"front.png");
  assert.equal(edited.foregroundCredit,"Détourage approuvé");
  assert.equal(edited.title,"Observation lunaire réelle");
  assert.equal(edited.durationFrames,105);
  assert.equal(edited.transitionFrames,8);
  assert.equal(imported.captions[1].position,"lower");
  const srt=frameCaptionsToSrt(imported.captions);
  const converted=parseSrtCaptions(srt,{position:"upper"});
  assert.deepEqual(converted.map(c=>[c.startFrame,c.endFrame]),[[1,48],[51,94]]);
});
test("DATA source values and dates roundtrip through editable form without fabrication",()=>{
  const p=clone(),s=p.shots[0];
  s.template="data_story";s.durationFrames=165;s.title="Valeurs sources";
  s.data={mode:"line",series:[{date:"2026-01-01",label:"JAN",value:10.5},
    {date:"2026-02-01",label:"FÉV",value:18},{date:"2026-03-01",label:"MAR",value:13}],
    source:{publisher:"INSTITUTION",dataset:"Données test",asOf:"2026-03-01",url:"https://example.org/data"},
    domain:{min:0,max:20},unit:"%",precision:1,locale:"fr-FR"};
  const loaded=parseStudioProject(JSON.stringify(p));
  const e=studioShotToEditor(loaded.shots[0],defaults);
  assert.equal(e.dataRaw,"2026-01-01|JAN|10.5\n2026-02-01|FÉV|18\n2026-03-01|MAR|13");
  assert.equal(e.dataPublisher,"INSTITUTION");
  assert.equal(e.dataMin,"0");assert.equal(e.dataMax,"20");
  assert.equal(e.dataUrl,"https://example.org/data");
});
test("GEO and PHOTO tracks rehydrate without adding synthetic facts or changing authored beats",()=>{
  const p=clone();const geo=p.shots[0],photo=p.shots[1];
  geo.template="geo_story";geo.durationFrames=150;geo.title="GÉO";
  geo.geo={center:{lon:11.6,lat:-0.7},spinDegrees:14,look:"photo",
    camera:{to:{lon:11.5,lat:-1},startFrame:15,endFrame:105,zoom:1.1},
    target:{lon:11.5,lat:-1,label:"Lieu vérifié"},route:{from:{lon:9,lat:0},to:{lon:11.5,lat:-1}},
    spotlight:{countryId:"266"},metric:{label:"TEST",value:42,unit:"%",precision:0}};
  photo.template="photo_story";photo.durationFrames=165;photo.title="PHOTO";
  photo.media={kind:"image",file:"image.jpg"};
  photo.photo={camera:{zoomFrom:1.05,zoomTo:1.13,panX:18,panY:-14,startFrame:0,endFrame:132},
    subject:{dx:1,dy:2,scale:.05,startFrame:12,endFrame:125}};
  const loaded=parseStudioProject(JSON.stringify(p));
  const g=studioShotToEditor(loaded.shots[0],defaults),f=studioShotToEditor(loaded.shots[1],defaults);
  assert.equal(g.geoLon,11.6);assert.equal(g.geoCountryId,"266");
  assert.equal(g.geoShowRoute,true);assert.equal(g.geoFromLon,9);
  assert.equal(g.geoShowTarget,true);assert.equal(g.geoMetricValue,"42");
  assert.equal(f.photoUseSubject,true);assert.equal(f.photoUseMask,false);
  assert.equal(f.photoSettings.subject.scale,.05);
});
test("fail closed for unsupported extensions, URL paths and foreign or lossy fields",()=>{
  const mutate=f=>{const p=clone();f(p);assert.throws(()=>parseStudioProject(JSON.stringify(p)),/Projet non importable/);};
  mutate(p=>p.shots[0].media={kind:"image",file:"../secret.jpg"});
  mutate(p=>p.shots[0].media={kind:"video",file:"https://other.example/test.mp4"});
  mutate(p=>p.shots[0].media={kind:"image",file:"test.mp4"});
  mutate(p=>p.shots[0].unknownEffect="magic");
  mutate(p=>p.extraVideoTool={});
  mutate(p=>p.voice={file:"human.wav",label:"Arbitrary",volume:1});
  mutate(p=>p.music={file:"bg.mp3",label:"Bande-son fournie",volume:0.3});
  mutate(p=>p.outro={file:"original.mp4",durationFrames:120});
  mutate(p=>p.style.background="#000000");
  mutate(p=>p.shots[0].durationFrames=0);
  mutate(p=>p.shots[0].transitionFrames=90);
});
test("broken JSON, unsafe captions and silent-outro cues never overwrite current production",()=>{
  assert.throws(()=>parseStudioProject("{invalid"));
  const p=clone();p.outro={file:"logo.mp4",durationFrames:90};
  p.captions=[{startFrame:160,endFrame:190,text:"Caption inside outro only"}];
  assert.throws(()=>parseStudioProject(JSON.stringify(p)),/captions/);
  p.captions=[{startFrame:1,endFrame:31,text:"FIRST"},{startFrame:20,endFrame:50,text:"SECOND"}];
  assert.throws(()=>parseStudioProject(JSON.stringify(p)),/captions/);
  assert.equal(frameCaptionsToSrt([]),"");
});

test("unknown nested GEO, PHOTO, DATA and caption attributes cannot be silently lost",()=>{
  const mutate=f=>{const p=clone();f(p);assert.throws(()=>parseStudioProject(JSON.stringify(p)),/Projet non importable/);};
  mutate(p=>{p.shots[0].template="geo_story";p.shots[0].geo={center:{lon:0,lat:2},secretOverride:true};});
  mutate(p=>{p.shots[0].template="photo_story";p.shots[0].photo={camera:{zoomFrom:1.05,zoomTo:1.12,panX:0,panY:0,startFrame:0,endFrame:110,secretKey:"bad"}};});
  mutate(p=>{p.shots[0].template="data_story";p.shots[0].data={mode:"ranking",series:[{label:"A",value:10,sourceUrl:"hidden"}],source:{publisher:"X",dataset:"Y",asOf:"2026-01-01"},domain:{min:0,max:20}};});
  mutate(p=>{p.captions=[{startFrame:1,endFrame:55,text:"Test",position:"upper",hiddenCommand:"run"}];});
  mutate(p=>{p.shots[0].geo={center:{lon:0,lat:0}};}); // GEO on unrelated kinetic model
});

test("frame-zero headline option roundtrips as an editable Studio control",()=>{
  const p=clone();
  p.shots[0].titleFrameZero=true;
  const parsed=parseStudioProject(JSON.stringify(p));
  const restored=studioShotToEditor(parsed.shots[0],defaults);
  assert.equal(restored.titleFrameZero,true);
  p.shots[0].titleFrameZero=false;
  assert.equal(studioShotToEditor(parseStudioProject(JSON.stringify(p)).shots[0],defaults).titleFrameZero,false);
  p.shots[0].titleFrameZero=1;
  assert.throws(()=>parseStudioProject(JSON.stringify(p)),/Projet non importable/);
  p.shots[0].titleFrameZero=false;
  p.shots[1].titleFrameZero=true;
  assert.throws(()=>parseStudioProject(JSON.stringify(p)),/Projet non importable/);
});

test("P0.6: Studio reopens and preserves caption-safe documentary crop and real-pixel zoom",()=>{
  const p=clone(),s=p.shots[1];
  s.template="document_focus";s.durationFrames=165;s.title="DOCUMENT SOURCE";
  s.media={kind:"image",file:"original-evidence.png",credit:"Original rights review pending"};
  s.documentRegion={x:.30,y:.28,width:.37,height:.43};
  s.evidencePresentation="mobile-safe";
  s.documentZoomMax=1.95;
  const loaded=parseStudioProject(JSON.stringify(p));
  assert.equal(inspectProject(loaded).ok,true);
  const form=studioShotToEditor(loaded.shots[1],{...defaults,documentMobileSafe:false,documentZoomMax:1.85});
  assert.equal(form.documentMobileSafe,true);
  assert.equal(form.documentZoomMax,1.95);
  assert.equal(form.documentX,.30);
  assert.equal(form.documentW,.37);
  assert.equal(form.mediaName,"original-evidence.png");
  assert.deepEqual(loaded.shots[0],p.shots[0]);
  assert.equal(loaded.script,example.script);
});
test("P0.6: Studio rejects unsafe or impossible documentary zoom instead of losing fields",()=>{
  const original=clone();
  original.shots[1].template="document_focus";
  original.shots[1].durationFrames=165;
  original.shots[1].title="PREUVE";
  original.shots[1].media={kind:"image",file:"source.jpg"};
  original.shots[1].documentRegion={x:.2,y:.2,width:.4,height:.3};
  const invalid=(mutate)=>{
    const p=structuredClone(original);mutate(p.shots[1]);
    assert.throws(()=>parseStudioProject(JSON.stringify(p)),/Projet non importable/);
  };
  invalid(s=>s.evidencePresentation="ambiguous");
  invalid(s=>s.documentZoomMax=2.5);
  invalid(s=>{s.evidencePresentation="mobile-safe";s.documentZoomMax=0.4;});
  invalid(s=>{s.evidencePresentation="mobile-safe";s.documentZoomMax=Infinity;});
  invalid(s=>{s.evidencePresentation="mobile-safe";s.documentZoomMax="2.0";});
  invalid(s=>{s.evidencePresentation="mobile-safe";s.template="kinetic";});
});
