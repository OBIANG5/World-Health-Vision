import {createHash} from "node:crypto";
import {createClient} from "redis";

const TERMINAL = new Set(["completed", "failed"]);

export const stableStringify = (value) => {
  if (value === null || typeof value !== "object") {
    return JSON.stringify(value);
  }
  if (Array.isArray(value)) {
    return `[${value.map((item) => stableStringify(item)).join(",")}]`;
  }
  const keys = Object.keys(value).sort();
  return `{${keys
    .map((key) => `${JSON.stringify(key)}:${stableStringify(value[key])}`)
    .join(",")}}`;
};

export const renderFingerprint = (payload, renderProfile) =>
  createHash("sha256")
    .update(
      stableStringify({
        render_profile: renderProfile,
        payload,
      }),
      "utf8",
    )
    .digest("hex");

export class MemoryJobStore {
  constructor() {
    this.mode = "memory";
    this.jobs = new Map();
    this.queue = [];
    this.idempotency = new Map();
  }

  async init() {}

  async close() {}

  async save(job) {
    this.jobs.set(job.id, structuredClone(job));
  }

  async get(id) {
    const job = this.jobs.get(id);
    return job ? structuredClone(job) : null;
  }

  async list() {
    return [...this.jobs.values()]
      .map((job) => structuredClone(job))
      .sort((a, b) => b.created_at.localeCompare(a.created_at));
  }

  async enqueue(id) {
    if (!this.queue.includes(id)) this.queue.push(id);
  }

  async dequeue() {
    return this.queue.shift() ?? null;
  }

  async queueLength() {
    return this.queue.length;
  }

  async bindIdempotency(fingerprint, id) {
    this.idempotency.set(fingerprint, id);
  }

  async getByFingerprint(fingerprint) {
    const id = this.idempotency.get(fingerprint);
    return id ? this.get(id) : null;
  }

  async recover() {
    const queued = new Set(this.queue);
    let recovered = 0;
    for (const job of this.jobs.values()) {
      if (TERMINAL.has(job.status)) continue;
      if (job.status !== "queued") {
        job.status = "queued";
        job.progress = 0;
        job.recovered_at = new Date().toISOString();
        job.updated_at = job.recovered_at;
        recovered += 1;
      }
      if (!queued.has(job.id)) {
        this.queue.push(job.id);
        queued.add(job.id);
      }
    }
    return recovered;
  }
}

export class RedisJobStore {
  constructor(client, prefix = "whv:media-renderer") {
    this.mode = "redis";
    this.client = client;
    this.prefix = prefix;
  }

  jobKey(id) {
    return `${this.prefix}:job:${id}`;
  }

  idempotencyKey(fingerprint) {
    return `${this.prefix}:idempotency:${fingerprint}`;
  }

  get indexKey() {
    return `${this.prefix}:jobs`;
  }

  get queueKey() {
    return `${this.prefix}:queue`;
  }

  async init() {
    if (!this.client.isOpen) await this.client.connect();
  }

  async close() {
    if (this.client.isOpen) await this.client.quit();
  }

  async save(job) {
    const tx = this.client.multi();
    tx.set(this.jobKey(job.id), JSON.stringify(job));
    tx.sAdd(this.indexKey, job.id);
    await tx.exec();
  }

  async get(id) {
    const raw = await this.client.get(this.jobKey(id));
    return raw ? JSON.parse(raw) : null;
  }

  async list() {
    const ids = await this.client.sMembers(this.indexKey);
    if (ids.length === 0) return [];
    const values = await Promise.all(ids.map((id) => this.get(id)));
    return values
      .filter(Boolean)
      .sort((a, b) => b.created_at.localeCompare(a.created_at));
  }

  async enqueue(id) {
    const queued = new Set(await this.client.lRange(this.queueKey, 0, -1));
    if (!queued.has(id)) await this.client.lPush(this.queueKey, id);
  }

  async dequeue() {
    return await this.client.rPop(this.queueKey);
  }

  async queueLength() {
    return await this.client.lLen(this.queueKey);
  }

  async bindIdempotency(fingerprint, id) {
    await this.client.set(this.idempotencyKey(fingerprint), id);
  }

  async getByFingerprint(fingerprint) {
    const id = await this.client.get(this.idempotencyKey(fingerprint));
    return id ? this.get(id) : null;
  }

  async recover() {
    const jobs = await this.list();
    const queued = new Set(await this.client.lRange(this.queueKey, 0, -1));
    let recovered = 0;

    for (const job of jobs.reverse()) {
      if (TERMINAL.has(job.status)) continue;
      if (job.status !== "queued") {
        const recoveredAt = new Date().toISOString();
        job.status = "queued";
        job.progress = 0;
        job.recovered_at = recoveredAt;
        job.updated_at = recoveredAt;
        await this.save(job);
        recovered += 1;
      }
      if (!queued.has(job.id)) {
        await this.client.lPush(this.queueKey, job.id);
        queued.add(job.id);
      }
    }

    return recovered;
  }
}

export const buildJobStore = async ({
  redisUrl,
  prefix = "whv:media-renderer",
  onRedisError = () => undefined,
} = {}) => {
  if (!redisUrl) {
    const store = new MemoryJobStore();
    await store.init();
    return store;
  }

  const client = createClient({url: redisUrl});
  client.on("error", onRedisError);
  const store = new RedisJobStore(client, prefix);
  await store.init();
  return store;
};
