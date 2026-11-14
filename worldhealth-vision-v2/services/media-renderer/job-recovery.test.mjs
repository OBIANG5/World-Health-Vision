import assert from "node:assert/strict";
import test from "node:test";
import {recoverMissingCompletedOutput} from "./job-recovery.mjs";

test("missing completed MP4 is requeued without changing job identity", async () => {
  const persisted = [];
  const enqueued = [];
  const job = {
    id: "job-output-missing",
    status: "completed",
    progress: 1,
    output_url: "/api/media-renderer/renders/job-output-missing.mp4",
    output_sha256: "a".repeat(64),
    output_probe: {width: 1080, height: 1920},
    error: null,
    recovered_at: null,
    updated_at: "2026-11-12T18:00:00.000Z",
  };

  const recovered = await recoverMissingCompletedOutput({
    job,
    outputExists: () => false,
    persist: async (candidate) => persisted.push(structuredClone(candidate)),
    enqueue: async (id) => enqueued.push(id),
    now: () => "2026-11-12T19:00:00.000Z",
  });

  assert.equal(recovered, true);
  assert.equal(job.id, "job-output-missing");
  assert.equal(job.status, "queued");
  assert.equal(job.progress, 0);
  assert.equal(job.output_url, null);
  assert.equal(job.output_sha256, null);
  assert.equal(job.output_probe, null);
  assert.equal(job.recovered_at, "2026-11-12T19:00:00.000Z");
  assert.deepEqual(enqueued, ["job-output-missing"]);
  assert.equal(persisted.length, 1);
});

test("existing completed MP4 is not requeued", async () => {
  let persisted = false;
  let enqueued = false;
  const job = {id: "job-ok", status: "completed", progress: 1};

  const recovered = await recoverMissingCompletedOutput({
    job,
    outputExists: () => true,
    persist: async () => { persisted = true; },
    enqueue: async () => { enqueued = true; },
  });

  assert.equal(recovered, false);
  assert.equal(job.status, "completed");
  assert.equal(persisted, false);
  assert.equal(enqueued, false);
});

test("non-terminal job is left to normal queue recovery", async () => {
  let persisted = false;
  const job = {id: "job-rendering", status: "rendering", progress: 0.4};

  const recovered = await recoverMissingCompletedOutput({
    job,
    outputExists: () => false,
    persist: async () => { persisted = true; },
    enqueue: async () => undefined,
  });

  assert.equal(recovered, false);
  assert.equal(job.status, "rendering");
  assert.equal(persisted, false);
});
