import assert from "node:assert/strict";
import test from "node:test";
import {
  MemoryJobStore,
  buildJobStore,
  renderFingerprint,
} from "./job-store.mjs";

const makeJob = (id, status = "queued") => ({
  id,
  story_id: "story-test",
  payload: {story: {id: "story-test"}, draft: {version: 1}},
  render_profile: "canonical_newsroom_v1",
  status,
  progress: status === "queued" ? 0 : 0.5,
  attempts: status === "queued" ? 0 : 1,
  max_attempts: 3,
  recovered_at: null,
  created_at: "2026-11-12T18:00:00.000Z",
  updated_at: "2026-11-12T18:00:00.000Z",
  output_url: null,
  output_sha256: null,
  output_probe: null,
  error: null,
});

test("render fingerprint is stable across object key order", () => {
  const a = renderFingerprint(
    {story: {id: "s1", title: "A"}, draft: {version: 1, fps: 30}},
    "canonical_newsroom_v1",
  );
  const b = renderFingerprint(
    {draft: {fps: 30, version: 1}, story: {title: "A", id: "s1"}},
    "canonical_newsroom_v1",
  );
  assert.equal(a, b);
});

test("memory store deduplicates queue and recovers interrupted jobs", async () => {
  const store = new MemoryJobStore();
  await store.init();

  const job = makeJob("job-memory", "rendering");
  await store.save(job);
  await store.enqueue(job.id);
  await store.enqueue(job.id);
  assert.equal(await store.queueLength(), 1);

  const recovered = await store.recover();
  assert.equal(recovered, 1);
  const restored = await store.get(job.id);
  assert.equal(restored.status, "queued");
  assert.ok(restored.recovered_at);
  assert.equal(await store.queueLength(), 1);
});

test(
  "Redis store survives reconnect and restores an interrupted render",
  {skip: !process.env.WHV_RENDER_TEST_REDIS_URL},
  async () => {
    const prefix = `whv:renderer-test:${process.pid}:${Date.now()}`;
    const redisUrl = process.env.WHV_RENDER_TEST_REDIS_URL;
    const fingerprint = renderFingerprint(
      {story: {id: "story-redis"}, draft: {version: 2}},
      "canonical_newsroom_v1",
    );

    let store = await buildJobStore({redisUrl, prefix});
    try {
      const job = makeJob("job-redis", "rendering");
      await store.save(job);
      await store.bindIdempotency(fingerprint, job.id);
      assert.equal((await store.getByFingerprint(fingerprint)).id, job.id);
      await store.close();

      store = await buildJobStore({redisUrl, prefix});
      const recovered = await store.recover();
      assert.equal(recovered, 1);

      const restored = await store.get(job.id);
      assert.equal(restored.status, "queued");
      assert.equal(restored.progress, 0);
      assert.ok(restored.recovered_at);
      assert.equal(await store.queueLength(), 1);
      assert.equal(await store.dequeue(), job.id);
      assert.equal(await store.queueLength(), 0);

      restored.status = "completed";
      restored.progress = 1;
      await store.save(restored);
      assert.equal((await store.get(job.id)).status, "completed");

      const keys = await store.client.keys(`${prefix}:*`);
      if (keys.length > 0) await store.client.del(keys);
    } finally {
      await store.close();
    }
  },
);
