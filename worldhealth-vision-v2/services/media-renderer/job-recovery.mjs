export const recoverMissingCompletedOutput = async ({
  job,
  outputExists,
  persist,
  enqueue,
  now = () => new Date().toISOString(),
}) => {
  if (job.status !== "completed" || outputExists(job.id)) {
    return false;
  }

  const recoveredAt = now();
  Object.assign(job, {
    status: "queued",
    progress: 0,
    output_url: null,
    output_sha256: null,
    output_probe: null,
    error:
      "Completed render metadata existed but the MP4 file was missing; rerender queued.",
    recovered_at: recoveredAt,
    updated_at: recoveredAt,
  });
  await persist(job);
  await enqueue(job.id);
  return true;
};
