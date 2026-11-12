import {readdir, stat, unlink} from "node:fs/promises";
import path from "node:path";

const safeEntries = async (directory) => {
  try {
    return await readdir(directory, {withFileTypes: true});
  } catch (error) {
    if (error?.code === "ENOENT") return [];
    throw error;
  }
};

const summarizeDirectory = async (directory, predicate) => {
  const entries = await safeEntries(directory);
  let count = 0;
  let bytes = 0;

  for (const entry of entries) {
    if (!entry.isFile() || !predicate(entry.name)) continue;
    const info = await stat(path.join(directory, entry.name));
    count += 1;
    bytes += info.size;
  }

  return {count, bytes};
};

export const inventoryRendererStorage = async ({outputDir, audioDir}) => {
  const [finalRenders, temporaryRenders, audioFiles] = await Promise.all([
    summarizeDirectory(
      outputDir,
      (name) => name.endsWith(".mp4") && !name.endsWith(".raw.mp4"),
    ),
    summarizeDirectory(outputDir, (name) => name.endsWith(".raw.mp4")),
    summarizeDirectory(audioDir, (name) => name.endsWith(".wav")),
  ]);

  return {
    final_renders: finalRenders,
    temporary_renders: temporaryRenders,
    voiceovers: audioFiles,
    total_bytes:
      finalRenders.bytes + temporaryRenders.bytes + audioFiles.bytes,
  };
};

export const cleanupTemporaryRenders = async ({
  outputDir,
  maxAgeMs,
  activeJobIds = new Set(),
  nowMs = Date.now(),
}) => {
  const entries = await safeEntries(outputDir);
  const removed = [];
  let removedBytes = 0;

  for (const entry of entries) {
    if (!entry.isFile() || !entry.name.endsWith(".raw.mp4")) continue;

    const jobId = entry.name.slice(0, -".raw.mp4".length);
    if (activeJobIds.has(jobId)) continue;

    const filePath = path.join(outputDir, entry.name);
    const info = await stat(filePath);
    if (nowMs - info.mtimeMs < maxAgeMs) continue;

    await unlink(filePath);
    removed.push(entry.name);
    removedBytes += info.size;
  }

  return {
    removed,
    removed_count: removed.length,
    removed_bytes: removedBytes,
  };
};
