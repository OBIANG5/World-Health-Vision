import test from "node:test";
import assert from "node:assert/strict";
import {buildEditorialTimeline,activeAtFrame,checkEditorialFiveScene} from "./editorial-timeline.mjs";
import {headlineHandoffOpacity} from "../src/editorial-text-handoff.mjs";
const kinds=["geo_story","country_focus","photo_story","data_story","document_focus"];
const times=[150,165,165,165,140];
const shots=kinds.map((template,i)=>({
  id:"scene-"+i,template,durationFrames:times[i],
  transitionAfter:i===4?"cut":"dissolve",transitionFrames:i===4?0:10
}));
test("FILM-1 five-stage editor decision list is 745 uninterrupted frames",()=>{
  const t=buildEditorialTimeline(shots);
  assert.equal(t.durationFrames,745);
  assert.equal(t.junctions.length,4);
  assert.deepEqual(t.shots.map(s=>s.startFrame),[0,140,295,450,605]);
  assert.deepEqual(t.shots.map(s=>s.endFrame),[150,305,460,615,745]);
  assert.deepEqual(t.junctions.map(j=>j.durationFrames),[10,10,10,10]);
  assert.equal(checkEditorialFiveScene(t),true);
});
test("FILM-1 transitions show exactly two scenes only during their ten-frame overlaps",()=>{
  const t=buildEditorialTimeline(shots);
  for(const f of [140,149,295,304,450,459,605,614])
    assert.equal(activeAtFrame(t,f).length,2,"True overlapping visual compositing at "+f);
  for(const f of [0,70,150,230,305,375,460,520,615,686,744])
    assert.equal(activeAtFrame(t,f).length,1,"Single independent active shot at "+f);
});
test("FILM-1 rejects montage holes, triple-frames and incorrect editorial scene order",()=>{
  const t=buildEditorialTimeline(shots);
  assert.throws(()=>activeAtFrame(t,745));
  assert.throws(()=>buildEditorialTimeline([shots[0],{...shots[1],durationFrames:5}]));
  assert.throws(()=>checkEditorialFiveScene(buildEditorialTimeline([
    {...shots[0],template:"data_story"},...shots.slice(1)
  ])));
});

test("FILM-1 source imagery crossfades independently from incoming typographic visibility",()=>{
  for(const incomingStart of [140,295,450,605]){
    const overlap=10;
    assert.equal(headlineHandoffOpacity(0,overlap),0,"Headline must not compete on first incoming frame");
    assert.equal(headlineHandoffOpacity(5,overlap),0,"Headline still held inside overlap");
    assert.equal(headlineHandoffOpacity(9,overlap),0,"Incoming headline cannot appear during last overlapped frame");
    assert.equal(headlineHandoffOpacity(10,overlap),0);
    assert.ok(headlineHandoffOpacity(16,overlap)>.45);
    assert.equal(headlineHandoffOpacity(22,overlap),1,"Headline readable only after old shot left");
    assert.equal(activeAtFrame(buildEditorialTimeline(shots),incomingStart).length,2);
  }
  assert.equal(headlineHandoffOpacity(0,0),1,
    "First shot's first frame must remain a legible short-form hook");
  assert.throws(()=>headlineHandoffOpacity(NaN,10));
});
