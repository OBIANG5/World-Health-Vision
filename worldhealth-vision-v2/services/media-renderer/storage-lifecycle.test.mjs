import assert from "node:assert/strict";
import {mkdtemp, mkdir, writeFile, utimes, rm} from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import {
  cleanupTemporaryRenders,
  inventoryRendererStorage,
} from "./storage-lifecycle.mjs";

test("storage inventory separates final, temporary and voiceover files", async () => {
  const root = await mkdtemp(path.join(os.tmpdir(), "whv-render-storage-"));
  const outputDir = path.join(root, "output");
  const audioDir = path.join(root, "audio");
  await mkdir(outputDir);
  await mkdir(audioDir);

  try {
    await writeFile(path.join(outputDir, "job-a.mp4"), Buffer.alloc(120));
    await writeFile(path.join(outputDir, "job-b.raw.mp4"), Buffer.alloc(40));
    await writeFile(path.join(audioDir, "voice-a.wav"), Buffer.alloc(30));

    const inventory = await inventoryRendererStorage({outputDir, audioDir});
    assert.deepEqual(inventory.final_renders, {count: 1, bytes: 120});
    assert.deepEqual(inventory.temporary_renders, {count: 1, bytes: 40});
    assert.deepEqual(inventory.voiceovers, {count: 1, bytes: 30});
    assert.equal(inventory.total_bytes, 190);
  } finally {
    await rm(root, {recursive: true, force: true});
  }
});

test("temp cleanup removes only old inactive raw renders", async () => {
  const root = await mkdtemp(path.join(os.tmpdir(), "whv-render-cleanup-"));
  const outputDir = path.join(root, "output");
  await mkdir(outputDir);

  try {
    const oldInactive = path.join(outputDir, "old-inactive.raw.mp4");
    const oldActive = path.join(outputDir, "old-active.raw.mp4");
    const freshInactive = path.join(outputDir, "fresh.raw.mp4");
    const finalRender = path.join(outputDir, "final.mp4");

    await writeFile(oldInactive, Buffer.alloc(10));
    await writeFile(oldActive, Buffer.alloc(20));
    await writeFile(freshInactive, Buffer.alloc(30));
    await writeFile(finalRender, Buffer.alloc(40));

    const nowMs = Date.parse("2026-11-12T19:00:00Z");
    const oldDate = new Date(nowMs - 8 * 60 * 60 * 1000);
    const freshDate = new Date(nowMs - 10 * 60 * 1000);
    await utimes(oldInactive, oldDate, oldDate);
    await utimes(oldActive, oldDate, oldDate);
    await utimes(freshInactive, freshDate, freshDate);

    const result = await cleanupTemporaryRenders({
      outputDir,
      maxAgeMs: 6 * 60 * 60 * 1000,
      activeJobIds: new Set(["old-active"]),
      nowMs,
    });

    assert.deepEqual(result.removed, ["old-inactive.raw.mp4"]);
    assert.equal(result.removed_bytes, 10);

    const inventory = await inventoryRendererStorage({
      outputDir,
      audioDir: path.join(root, "audio"),
    });
    assert.deepEqual(inventory.final_renders, {count: 1, bytes: 40});
    assert.deepEqual(inventory.temporary_renders, {count: 2, bytes: 50});
  } finally {
    await rm(root, {recursive: true, force: true});
  }
});
