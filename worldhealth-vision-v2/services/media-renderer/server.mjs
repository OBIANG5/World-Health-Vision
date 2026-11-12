import {createServer} from "node:http";
import {createReadStream, existsSync, mkdirSync, statSync} from "node:fs";
import {fileURLToPath} from "node:url";
import path from "node:path";
import {createHash, randomUUID} from "node:crypto";
import {bundle} from "@remotion/bundler";
import {renderMedia, selectComposition} from "@remotion/renderer";

const root = path.dirname(fileURLToPath(import.meta.url));
const outputDir = process.env.WHV_RENDER_OUTPUT_DIR || path.join(root, "output");
const audioDir = process.env.WHV_RENDER_AUDIO_DIR || path.join(root, "audio");
const port = Number.parseInt(process.env.WHV_RENDER_PORT || "8011", 10);
const maxConcurrency = Math.max(
  1,
  Number.parseInt(process.env.WHV_RENDER_CONCURRENCY || "1", 10) || 1,
);

mkdirSync(outputDir, {recursive: true});
mkdirSync(audioDir, {recursive: true});

const jobs = new Map();
const queue = [];
let running = 0;
let bundlePromise;

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

const updateJob = (job, patch) => {
  Object.assign(job, patch, {updated_at: now()});
};

const sha256File = async (filePath) =>
  await new Promise((resolve, reject) => {
    const hash = createHash("sha256");
    const stream = createReadStream(filePath);
    stream.on("data", (chunk) => hash.update(chunk));
    stream.on("error", reject);
    stream.on("end", () => resolve(hash.digest("hex")));
  });

const renderJob = async (job) => {
  running += 1;
  try {
    updateJob(job, {status: "bundling", progress: 0.02});
    const serveUrl = await getBundle();

    updateJob(job, {status: "rendering", progress: 0.05});
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
    const outputLocation = path.join(outputDir, filename);

    await renderMedia({
      codec: "h264",
      composition,
      serveUrl,
      outputLocation,
      inputProps,
      onProgress: ({progress}) => {
        updateJob(job, {
          progress: Math.min(0.99, Math.max(0.05, progress)),
        });
      },
    });

    const outputSha256 = await sha256File(outputLocation);

    updateJob(job, {
      status: "completed",
      progress: 1,
      output_url: `/api/media-renderer/renders/${filename}`,
      output_sha256: outputSha256,
    });
  } catch (error) {
    updateJob(job, {
      status: "failed",
      error: error instanceof Error ? error.message : String(error),
    });
  } finally {
    running -= 1;
    drain();
  }
};

const drain = () => {
  while (running < maxConcurrency && queue.length > 0) {
    const job = queue.shift();
    void renderJob(job);
  }
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
        queued: queue.length,
        concurrency: maxConcurrency,
        audio_dir: audioDir,
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

      const job = {
        id: randomUUID(),
        story_id: payload.story.id,
        payload,
        render_profile: renderProfile,
        status: "queued",
        progress: 0,
        created_at: now(),
        updated_at: now(),
        output_url: null,
        output_sha256: null,
        error: null,
      };
      jobs.set(job.id, job);
      queue.push(job);
      drain();
      json(res, 202, publicJob(job));
      return;
    }

    if (req.method === "GET" && url.pathname === "/api/media-renderer/jobs") {
      json(res, 200, [...jobs.values()].map(publicJob));
      return;
    }

    const jobMatch = /^\/api\/media-renderer\/jobs\/([a-f0-9-]+)$/.exec(url.pathname);
    if (req.method === "GET" && jobMatch) {
      const job = jobs.get(jobMatch[1]);
      if (!job) {
        json(res, 404, {detail: "Render job not found."});
        return;
      }
      json(res, 200, publicJob(job));
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

server.listen(port, "0.0.0.0", () => {
  console.log(`World-Vision media-renderer listening on :${port}`);
});
