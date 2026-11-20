import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import {parseSrtCaptions,captionCueIssues,activeCaption} from "../src/caption-timeline.mjs";

const oldSrt=`1
00:00:00,035 --> 00:00:02,335
Trois puissances nucléaires. Une même
table.

2
00:00:02,781 --> 00:00:03,842
Et une rencontre inédite.
`;
test("reuse real legacy SRT time format without copying unverified news into a release",()=>{
  const cues=parseSrtCaptions(oldSrt);
  assert.equal(cues.length,2);
  assert.deepEqual(cues.map(c=>[c.startFrame,c.endFrame]),[[1,70],[83,115]]);
  assert.equal(cues[0].position,"lower");
  assert.equal(activeCaption(cues,70),null);
  assert.equal(activeCaption(cues,83)?.text,"Et une rencontre inédite.");
  assert.deepEqual(captionCueIssues(cues,150),[]);
});
test("SRT supports BOM, CRLF, period milliseconds and an upper title-safe lane",()=>{
  const cues=parseSrtCaptions("\uFEFF1\r\n00:00:00.000 --> 00:00:01.500\r\nExemple validé.\r\n",{position:"upper"});
  assert.deepEqual(cues,[{startFrame:0,endFrame:45,text:"Exemple validé.",position:"upper"}]);
});
test("invalid and overlapping cues fail closed",()=>{
  for(const s of [
    "1\n00:00:00,000 --> 00:00:00,030\nFlash",
    "1\n00:00:00,000 --> 00:00:01,000\n<script>bad</script>",
    "1\n00:00:00,000 --> 00:00:01,000\nA\n\n2\n00:00:00,500 --> 00:00:01,500\nB",
    "1\n00:99:00,000 --> 00:99:01,000\nA"
  ])assert.throws(()=>parseSrtCaptions(s));
});
test("caption validator enforces total frames, order, mobile placement and plain text",()=>{
  assert.deepEqual(captionCueIssues([{startFrame:0,endFrame:60,text:"TEST"}],60),[]);
  const invalid=[
    {startFrame:55,endFrame:70,text:"Later"},
    {startFrame:0,endFrame:30,text:"<b>Fake</b>"},
    {startFrame:0,endFrame:30,text:"Test",position:"left"},
  ];
  assert.ok(captionCueIssues(invalid,60).some(i=>i.field==="captions[0].time"));
  assert.ok(captionCueIssues(invalid,60).some(i=>i.field==="captions[1].text"));
  assert.ok(captionCueIssues(invalid,60).some(i=>i.field==="captions[2].position"));
});
test("example remains valid if caption track omitted; rejects cues into silent outro",()=>{
  const sample=JSON.parse(fs.readFileSync(new URL("./project.example.json",import.meta.url),"utf8"));
  assert.ok(!sample.captions);
  assert.equal(captionCueIssues([{startFrame:140,endFrame:155,text:"Outro"}],151).length>0,true);
});
