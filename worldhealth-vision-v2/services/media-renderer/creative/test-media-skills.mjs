#!/usr/bin/env node
/**
 * No dependency or network access. Verify agents see one identical editorial
 * quality contract, instead of conflicting Claude/Codex directions.
 */
import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import {fileURLToPath} from "node:url";
const here=path.dirname(fileURLToPath(import.meta.url));
const repo=path.resolve(here,"../../../..");
const codex=path.join(repo,".agents/skills/worldvision-media-director/SKILL.md");
const claude=path.join(repo,".claude/skills/worldvision-media-director/SKILL.md");
const docs=path.join(repo,"worldhealth-vision-v2/docs/media/MEDIA_AGENT_SKILLS_EVALUATION_2026-11-20.md");
const report=path.join(repo,"worldhealth-vision-v2/docs/media/WORLDVISION_INTEGRATED_FILM_SPRINT12_2026-11-20.md");
test("World-Vision Codex and Claude skills are the exact same project instructions",()=>{
  const a=fs.readFileSync(codex,"utf8"),b=fs.readFileSync(claude,"utf8");
  assert.equal(a,b,"Cross-agent instructions must not silently diverge");
  assert.ok(a.startsWith("---\nname: worldvision-media-director\ndescription: "));
  assert.match(a,/\n---\n/);
  assert.ok(a.length>2500);
});
test("Media skill encodes source, geographic, audio, QA, and no-publish protections",()=>{
  const s=fs.readFileSync(codex,"utf8");
  for(const x of ["Remotion","country_focus","photo_story","data_story","document_focus",
    "DATA","source","rights","360","MP4","H.264","AAC","GitHub","no unreviewed",
    "Never invent","never auto-merge","claude-motion","HyperFrames"]) {
    assert.ok(s.toLowerCase().includes(x.toLowerCase()),"Missing skill protection: "+x);
  }
});
test("Skill research documents official upstream links and candid limitations",()=>{
  const s=fs.readFileSync(docs,"utf8");
  for(const url of [
    "https://www.remotion.dev/docs/ai/skills",
    "https://github.com/remotion-dev/skills",
    "https://github.com/whaleyxbt/claude-motion",
    "https://github.com/heygen-com/hyperframes",
    "https://github.com/NVIDIA/skillspector"
  ])assert.ok(s.includes(url),"Missing public upstream reference: "+url);
  assert.match(s,/Claude Code/);
  assert.match(s,/Codex/);
  assert.match(s,/Pro/);
  assert.match(s,/non-invention/i);
  assert.ok(fs.existsSync(report),"Must preserve real film history, not replace it with skill marketing");
});
