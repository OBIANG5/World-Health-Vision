import {createServer} from "node:http";
import {createReadStream, existsSync, mkdirSync, statSync} from "node:fs";
import {unlink} from "node:fs/promises";
import {fileURLToPath} from "node:url";
import path from "node:path";
import {createHash, randomUUID} from "node:crypto";
import {execFile} from "node:child_process";
import {promisify} from "node:util";
import {bundle} from "@remotion/bundler";
import {renderMedia, selectComposition} from "@remotion/renderer";
import {buildJobStore, renderFingerprint} from "./job-store.mjs";
import {recoverMissingCompletedOutput as recoverMissingOutputPolicy} from "./job-recovery.mjs";
import {
  cleanupTemporaryRenders,
  inventoryRendererStorage,
} from "./storage-lifecycle.mjs";

const execFileAsync = promisify(execFile);

const root = path.dirname(fileURLToPath(import.meta.url));
const outputDir = process.env.WHV_RENDER_OUTPUT_DIR || path.join(root, "output");
const audioDir = process.env.WHV_RENDER_AUDIO_DIR || path.join(root, "audio");
const port = Number.parseInt(process.env.WHV_RENDER_PORT || "8011", 10);
const maxConcurrency = Math.max(
  1,
  Number.parseInt(process.env.WHV_RENDER_CONCURRENCY || "1", 10) || 1,
);

const loudnessTarget = {
  integratedLufs: -16,
  truePeakDbfs: -1.5,
  loudnessRangeLu: 7,
};
const maxAttempts = Math.max(
  1,
  Number.parseInt(process.env.WHV_RENDER_JOB_MAX_ATTEMPTS || "3", 10) || 3,
);
const redisUrl = process.env.WHV_RENDER_REDIS_URL || "";
const redisPrefix =
  process.env.WHV_RENDER_REDIS_PREFIX || "whv:media-renderer";
const tempMaxAgeHours = Math.max(
  1,
  Number.parseFloat(process.env.WHV_RENDER_TEMP_MAX_AGE_HOURS || "6") || 6,
);
const tempMaxAgeMs = tempMaxAgeHours * 60 * 60 * 1000;
const storageCleanupIntervalSeconds = Math.max(
  60,
  Number.parseInt(
    process.env.WHV_RENDER_STORAGE_CLEANUP_INTERVAL_SECONDS || "3600",
    10,
  ) || 3600,
);

mkdirSync(outputDir, {recursive: true});
mkdirSync(audioDir, {recursive: true});

let store;
let running = 0;
let draining = false;
let bundlePromise;
let storageCleanupTimer;
let lastStorageCleanup = null;

const now = () => new Date().toISOString();

const json = (res, status, body) => {
  const payload = Buffer.from(JSON.stringify(body));
  res.writeHead(status, {
    "content-type": "application/json; charset=utf-8",
    "content-length": payload.length,
    "cache-control": "no-store",
  });
  res.end(payload);
};

const publicJob = (job) => ({
  id: job.id,
  story_id: job.story_id,
  status: job.status,
  progress: job.progress,
  created_at: job.created_at,
  updated_at: job.updated_at,
  render_profile: job.render_profile,
  output_url: job.output_url,
  output_sha256: job.output_sha256,
  output_probe: job.output_probe,
  attempts: job.attempts || 0,
  max_attempts: job.max_attempts || maxAttempts,
  recovered_at: job.recovered_at || null,
  error: job.error,
});

const readJsonBody = async (req, limitBytes = 2_000_000) => {
  const chunks = [];
  let size = 0;
  for await (const chunk of req) {
    size += chunk.length;
    if (size > limitBytes) {
      throw new Error("Request body is too large.");
    }
    chunks.push(chunk);
  }
  if (chunks.length === 0) return {};
  return JSON.parse(Buffer.concat(chunks).toString("utf8"));
};

const getBundle = () => {
  if (!bundlePromise) {
    bundlePromise = bundle({
      entryPoint: path.join(root, "src", "index.ts"),
      onProgress: () => undefined,
    }).catch((error) => {
      bundlePromise = undefined;
      throw error;
    });
  }
  return bundlePromise;
};

const updateJob = async (job, patch) => {
  Object.assign(job, patch, {updated_at: now()});
  await store.save(job);
};

const sha256File = async (filePath) =>
  await new Promise((resolve, reject) => {
    const hash = createHash("sha256");
    const stream = createReadStream(filePath);
    stream.on("data", (chunk) => hash.update(chunk));
    stream.on("error", reject);
    stream.on("end", () => resolve(hash.digest("hex")));
  });

const finiteNumber = (value) => {
  const parsed = Number.parseFloat(String(value ?? ""));
  return Number.isFinite(parsed) ? parsed : null;
};

const parseLoudnormReport = (stderr) => {
  const start = stderr.lastIndexOf("{");
  const end = stderr.lastIndexOf("}");
  if (start < 0 || end <= start) {
    throw new Error("FFmpeg loudnorm did not return JSON measurements.");
  }
  const raw = JSON.parse(stderr.slice(start, end + 1));
  return {
    integrated_lufs: finiteNumber(raw.input_i),
    true_peak_dbfs: finiteNumber(raw.input_tp),
    loudness_range_lu: finiteNumber(raw.input_lra),
    threshold: finiteNumber(raw.input_thresh),
    target_offset: finiteNumber(raw.target_offset),
  };
};

const analyzeLoudness = async (filePath) => {
  const filter =
    `loudnorm=I=${loudnessTarget.integratedLufs}` +
    `:TP=${loudnessTarget.truePeakDbfs}` +
    `:LRA=${loudnessTarget.loudnessRangeLu}:print_format=json`;
  const {stderr} = await execFileAsync(
    "ffmpeg",
    [
      "-hide_banner",
      "-nostats",
      "-i",
      filePath,
      "-map",
      "0:a:0",
      "-af",
      filter,
      "-f",
      "null",
      "-",
    ],
    {maxBuffer: 8_000_000},
  );
  return parseLoudnormReport(stderr);
};

const normalizeNarration = async (inputPath, outputPath) => {
  const measured = await analyzeLoudness(inputPath);
  const required = [
    measured.integrated_lufs,
    measured.true_peak_dbfs,
    measured.loudness_range_lu,
    measured.threshold,
    measured.target_offset,
  ];
  if (required.some((value) => value === null)) {
    throw new Error("Narration loudness could not be measured reliably.");
  }

  const filter =
    `loudnorm=I=${loudnessTarget.integratedLufs}` +
    `:TP=${loudnessTarget.truePeakDbfs}` +
    `:LRA=${loudnessTarget.loudnessRangeLu}` +
    `:measured_I=${measured.integrated_lufs}` +
    `:measured_TP=${measured.true_peak_dbfs}` +
    `:measured_LRA=${measured.loudness_range_lu}` +
    `:measured_thresh=${measured.threshold}` +
    `:offset=${measured.target_offset}` +
    ":linear=true:print_format=summary";

  await execFileAsync(
    "ffmpeg",
    [
      "-y",
      "-hide_banner",
      "-loglevel",
      "error",
      "-i",
      inputPath,
      "-map",
      "0:v:0",
      "-map",
      "0:a:0",
      "-c:v",
      "copy",
      "-c:a",
      "aac",
      "-b:a",
      "160k",
      "-ar",
      "48000",
      "-af",
      filter,
      "-movflags",
      "+faststart",
      outputPath,
    ],
    {maxBuffer: 8_000_000},
  );
};

const parseRate = (value) => {
  if (!value || typeof value !== "string") return null;
  const [numeratorRaw, denominatorRaw = "1"] = value.split("/");
  const numerator = Number.parseFloat(numeratorRaw);
  const denominator = Number.parseFloat(denominatorRaw);
  if (!Number.isFinite(numerator) || !Number.isFinite(denominator) || denominator === 0) {
    return null;
  }
  const rate = numerator / denominator;
  return Number.isFinite(rate) && rate > 0 ? rate : null;
};

const probeMedia = async (filePath) => {
  const {stdout} = await execFileAsync(
    "ffprobe",
    [
      "-v",
      "error",
      "-print_format",
      "json",
      "-show_format",
      "-show_streams",
      filePath,
    ],
    {maxBuffer: 4_000_000},
  );
  const payload = JSON.parse(stdout);
  const streams = Array.isArray(payload.streams) ? payload.streams : [];
  const video = streams.find((stream) => stream?.codec_type === "video");
  const audio = streams.find((stream) => stream?.codec_type === "audio");
  if (!video) {
    throw new Error("ffprobe did not find a video stream in rendered output.");
  }

  const format = payload.format || {};
  const duration = Number.parseFloat(format.duration ?? video.duration ?? "");
  const sizeBytes = Number.parseInt(format.size ?? "", 10);
  const fps =
    parseRate(video.avg_frame_rate) ??
    parseRate(video.r_frame_rate);

  if (!Number.isFinite(duration) || duration <= 0) {
    throw new Error("ffprobe returned an invalid rendered duration.");
  }
  if (!Number.isInteger(sizeBytes) || sizeBytes <= 0) {
    throw new Error("ffprobe returned an invalid rendered file size.");
  }
  if (!fps) {
    throw new Error("ffprobe returned an invalid rendered frame rate.");
  }

  const bitRateRaw = Number.parseInt(video.bit_rate ?? "", 10);
  const sampleRateRaw = Number.parseInt(audio?.sample_rate ?? "", 10);
  const channelsRaw = Number.parseInt(audio?.channels ?? "", 10);

  let loudness = null;
  if (audio) {
    try {
      loudness = await analyzeLoudness(filePath);
    } catch {
      loudness = null;
    }
  }

  return {
    format_name:
      typeof format.format_name === "string"
        ? format.format_name
        : null,
    size_bytes: sizeBytes,
    duration_sec: Math.round(duration * 1000) / 1000,
    video_codec:
      typeof video.codec_name === "string"
        ? video.codec_name
        : null,
    width: Number(video.width),
    height: Number(video.height),
    fps: Math.round(fps * 1000) / 1000,
    pixel_format:
      typeof video.pix_fmt === "string"
        ? video.pix_fmt
        : null,
    video_bit_rate:
      Number.isInteger(bitRateRaw) && bitRateRaw >= 0
        ? bitRateRaw
        : null,
    has_audio: Boolean(audio),
    audio_codec:
      typeof audio?.codec_name === "string"
        ? audio.codec_name
        : null,
    audio_sample_rate_hz:
      Number.isInteger(sampleRateRaw) && sampleRateRaw > 0
        ? sampleRateRaw
        : null,
    audio_channels:
      Number.isInteger(channelsRaw) && channelsRaw > 0
        ? channelsRaw
        : null,
    integrated_lufs: loudness?.integrated_lufs ?? null,
    true_peak_dbfs: loudness?.true_peak_dbfs ?? null,
    loudness_range_lu: loudness?.loudness_range_lu ?? null,
  };
};

const finalOutputPathForJob = (jobId) =>
  path.join(outputDir, `${jobId}.mp4`);

const recoverMissingCompletedOutput = async (job) =>
  recoverMissingOutputPolicy({
    job,
    outputExists: (jobId) => existsSync(finalOutputPathForJob(jobId)),
    persist: (candidate) => store.save(candidate),
    enqueue: (jobId) => store.enqueue(jobId),
    now,
  });

const renderJob = async (job) => {
  running += 1;
  let temporaryOutputLocation = null;
  try {
    await updateJob(job, {
      status: "bundling",
      progress: 0.02,
      attempts: (job.attempts || 0) + 1,
      error: null,
    });
    const serveUrl = await getBundle();

    await updateJob(job, {status: "rendering", progress: 0.05});
    const rawVoiceover = job.payload.voiceover || null;
    const voiceover = rawVoiceover?.renderer_url
      ? {
          ...rawVoiceover,
          renderer_url: rawVoiceover.renderer_url.startsWith(
            "/api/media-renderer/audio/",
          )
            ? `http://127.0.0.1:${port}${rawVoiceover.renderer_url}`
            : rawVoiceover.renderer_url,
        }
      : rawVoiceover;

    const inputProps = {
      render_profile: job.render_profile,
      draft: job.payload.draft,
      voiceover,
      story: job.payload.story,
      brand: job.payload.brand || {
        name: "WORLD-VISION",
        tagline: "Voir le monde, le comprendre.",
      },
    };

    const composition = await selectComposition({
      serveUrl,
      id: "WorldVisionShort",
      inputProps,
    });

    const filename = `${job.id}.mp4`;
    const outputLocation = finalOutputPathForJob(job.id);
    temporaryOutputLocation = voiceover
      ? path.join(outputDir, `${job.id}.raw.mp4`)
      : null;
    const renderOutputLocation = temporaryOutputLocation || outputLocation;

    await renderMedia({
      codec: "h264",
      composition,
      serveUrl,
      outputLocation: renderOutputLocation,
      inputProps,
      onProgress: ({progress}) => {
        void updateJob(job, {
          progress: Math.min(0.99, Math.max(0.05, progress)),
        });
      },
    });

    if (temporaryOutputLocation) {
      await updateJob(job, {status: "normalizing", progress: 0.995});
      await normalizeNarration(
        temporaryOutputLocation,
        outputLocation,
      );
      await unlink(temporaryOutputLocation).catch(() => undefined);
      temporaryOutputLocation = null;
    }

    const [outputSha256, outputProbe] = await Promise.all([
      sha256File(outputLocation),
      probeMedia(outputLocation),
    ]);

    await updateJob(job, {
      status: "completed",
      progress: 1,
      output_url: `/api/media-renderer/renders/${filename}`,
      output_sha256: outputSha256,
      output_probe: outputProbe,
    });
  } catch (error) {
    await updateJob(job, {
      status: "failed",
      error: error instanceof Error ? error.message : String(error),
    });
  } finally {
    running -= 1;
    void drain();
  }
};

const drain = async () => {
  if (draining) return;
  draining = true;
  try {
    while (running < maxConcurrency) {
      const jobId = await store.dequeue();
      if (!jobId) break;
      const job = await store.get(jobId);
      if (!job || job.status !== "queued") continue;
      void renderJob(job);
    }
  } finally {
    draining = false;
  }
};

const runStorageCleanup = async () => {
  const jobs = await store.list();
  const activeJobIds = new Set(
    jobs
      .filter((job) =>
        ["bundling", "rendering", "normalizing"].includes(job.status),
      )
      .map((job) => job.id),
  );
  const result = await cleanupTemporaryRenders({
    outputDir,
    maxAgeMs: tempMaxAgeMs,
    activeJobIds,
  });
  lastStorageCleanup = {
    at: now(),
    ...result,
  };
  return lastStorageCleanup;
};

const serveVideo = (req, res, filename) => {
  if (!/^[a-f0-9-]+\.mp4$/.test(filename)) {
    json(res, 400, {detail: "Invalid render filename."});
    return;
  }

  const filePath = path.join(outputDir, filename);
  if (!existsSync(filePath)) {
    json(res, 404, {detail: "Render not found."});
    return;
  }

  const size = statSync(filePath).size;
  const range = req.headers.range;

  if (!range) {
    res.writeHead(200, {
      "content-type": "video/mp4",
      "content-length": size,
      "accept-ranges": "bytes",
      "cache-control": "private, max-age=3600",
    });
    createReadStream(filePath).pipe(res);
    return;
  }

  const match = /^bytes=(\d*)-(\d*)$/.exec(range);
  if (!match) {
    res.writeHead(416, {"content-range": `bytes */${size}`});
    res.end();
    return;
  }

  const start = match[1] ? Number.parseInt(match[1], 10) : 0;
  const end = match[2]
    ? Math.min(Number.parseInt(match[2], 10), size - 1)
    : size - 1;

  if (start > end || start >= size) {
    res.writeHead(416, {"content-range": `bytes */${size}`});
    res.end();
    return;
  }

  res.writeHead(206, {
    "content-type": "video/mp4",
    "content-length": end - start + 1,
    "content-range": `bytes ${start}-${end}/${size}`,
    "accept-ranges": "bytes",
    "cache-control": "private, max-age=3600",
  });
  createReadStream(filePath, {start, end}).pipe(res);
};

const serveAudio = (req, res, filename) => {
  if (!/^[A-Za-z0-9_-]+\.wav$/.test(filename)) {
    json(res, 400, {detail: "Invalid audio filename."});
    return;
  }

  const filePath = path.join(audioDir, filename);
  if (!existsSync(filePath)) {
    json(res, 404, {detail: "Audio not found."});
    return;
  }

  const size = statSync(filePath).size;
  const range = req.headers.range;

  if (!range) {
    res.writeHead(200, {
      "content-type": "audio/wav",
      "content-length": size,
      "accept-ranges": "bytes",
      "cache-control": "private, max-age=3600",
    });
    createReadStream(filePath).pipe(res);
    return;
  }

  const match = /^bytes=(\d*)-(\d*)$/.exec(range);
  if (!match) {
    res.writeHead(416, {"content-range": `bytes */${size}`});
    res.end();
    return;
  }

  const start = match[1] ? Number.parseInt(match[1], 10) : 0;
  const end = match[2]
    ? Math.min(Number.parseInt(match[2], 10), size - 1)
    : size - 1;

  if (start > end || start >= size) {
    res.writeHead(416, {"content-range": `bytes */${size}`});
    res.end();
    return;
  }

  res.writeHead(206, {
    "content-type": "audio/wav",
    "content-length": end - start + 1,
    "content-range": `bytes ${start}-${end}/${size}`,
    "accept-ranges": "bytes",
    "cache-control": "private, max-age=3600",
  });
  createReadStream(filePath, {start, end}).pipe(res);
};

const server = createServer(async (req, res) => {
  try {
    const url = new URL(req.url || "/", `http://${req.headers.host || "localhost"}`);

    if (req.method === "GET" && url.pathname === "/health") {
      json(res, 200, {
        status: "ok",
        service: "media-renderer",
        running,
        queued: await store.queueLength(),
        concurrency: maxConcurrency,
        persistence: store.mode,
        redis_configured: Boolean(redisUrl),
        audio_dir: audioDir,
      });
      return;
    }

    if (req.method === "GET" && url.pathname === "/api/media-renderer/storage") {
      const inventory = await inventoryRendererStorage({
        outputDir,
        audioDir,
      });
      json(res, 200, {
        ...inventory,
        policy: {
          final_renders: "retain",
          voiceovers: "retain",
          temporary_renders_max_age_hours: tempMaxAgeHours,
          cleanup_interval_seconds: storageCleanupIntervalSeconds,
        },
        last_cleanup: lastStorageCleanup,
      });
      return;
    }

    if (req.method === "POST" && url.pathname === "/api/media-renderer/jobs") {
      const payload = await readJsonBody(req);
      if (!payload?.story?.id || !payload?.draft?.scenes?.length) {
        json(res, 400, {detail: "story.id and draft.scenes are required."});
        return;
      }

      const renderProfile =
        payload.render_profile === "tiktok_api_clean_v1"
          ? "tiktok_api_clean_v1"
          : "canonical_newsroom_v1";

      const fingerprint = renderFingerprint(payload, renderProfile);
      const existing = await store.getByFingerprint(fingerprint);
      if (existing) {
        const recoveredMissingOutput =
          await recoverMissingCompletedOutput(existing);
        if (recoveredMissingOutput) {
          void drain();
          json(res, 202, publicJob(existing));
          return;
        }
        json(
          res,
          existing.status === "completed" ? 200 : 202,
          publicJob(existing),
        );
        return;
      }

      const job = {
        id: randomUUID(),
        story_id: payload.story.id,
        payload,
        render_profile: renderProfile,
        status: "queued",
        progress: 0,
        attempts: 0,
        max_attempts: maxAttempts,
        recovered_at: null,
        idempotency_key: fingerprint,
        created_at: now(),
        updated_at: now(),
        output_url: null,
        output_sha256: null,
        output_probe: null,
        error: null,
      };
      await store.save(job);
      await store.bindIdempotency(fingerprint, job.id);
      await store.enqueue(job.id);
      void drain();
      json(res, 202, publicJob(job));
      return;
    }

    if (req.method === "GET" && url.pathname === "/api/media-renderer/jobs") {
      json(res, 200, (await store.list()).map(publicJob));
      return;
    }

    const jobMatch = /^\/api\/media-renderer\/jobs\/([a-f0-9-]+)$/.exec(url.pathname);
    if (req.method === "GET" && jobMatch) {
      const job = await store.get(jobMatch[1]);
      if (!job) {
        json(res, 404, {detail: "Render job not found."});
        return;
      }
      json(res, 200, publicJob(job));
      return;
    }

    const retryMatch = /^\/api\/media-renderer\/jobs\/([a-f0-9-]+)\/retry$/.exec(
      url.pathname,
    );
    if (req.method === "POST" && retryMatch) {
      const job = await store.get(retryMatch[1]);
      if (!job) {
        json(res, 404, {detail: "Render job not found."});
        return;
      }
      if (job.status !== "failed") {
        json(res, 409, {detail: "Only failed render jobs can be retried."});
        return;
      }
      if ((job.attempts || 0) >= (job.max_attempts || maxAttempts)) {
        json(res, 409, {detail: "Render job retry limit has been reached."});
        return;
      }

      await updateJob(job, {
        status: "queued",
        progress: 0,
        error: null,
      });
      await store.enqueue(job.id);
      void drain();
      json(res, 202, publicJob(job));
      return;
    }

    const audioMatch = /^\/api\/media-renderer\/audio\/([^/]+)$/.exec(url.pathname);
    if (req.method === "GET" && audioMatch) {
      serveAudio(req, res, audioMatch[1]);
      return;
    }

    const renderMatch = /^\/api\/media-renderer\/renders\/([^/]+)$/.exec(url.pathname);
    if (req.method === "GET" && renderMatch) {
      serveVideo(req, res, renderMatch[1]);
      return;
    }

    json(res, 404, {detail: "Not found."});
  } catch (error) {
    json(res, 500, {
      detail: error instanceof Error ? error.message : String(error),
    });
  }
});

const shutdown = async (signal) => {
  console.log(`World-Vision media-renderer received ${signal}; closing job store.`);
  if (storageCleanupTimer) clearInterval(storageCleanupTimer);
  try {
    await store?.close();
  } finally {
    process.exit(0);
  }
};

const start = async () => {
  store = await buildJobStore({
    redisUrl,
    prefix: redisPrefix,
    onRedisError: (error) => {
      console.error("World-Vision renderer Redis error:", error);
    },
  });
  const recovered = await store.recover();
  if (recovered > 0) {
    console.warn(`Recovered ${recovered} interrupted render job(s).`);
  }
  await runStorageCleanup();
  storageCleanupTimer = setInterval(() => {
    void runStorageCleanup().catch((error) => {
      console.error("World-Vision renderer storage cleanup failed:", error);
    });
  }, storageCleanupIntervalSeconds * 1000);
  storageCleanupTimer.unref();
  void drain();

  server.listen(port, "0.0.0.0", () => {
    console.log(
      `World-Vision media-renderer listening on :${port} · persistence=${store.mode}`,
    );
  });
};

process.on("SIGTERM", () => void shutdown("SIGTERM"));
process.on("SIGINT", () => void shutdown("SIGINT"));

start().catch((error) => {
  console.error("World-Vision media-renderer failed to start:", error);
  process.exit(1);
});
