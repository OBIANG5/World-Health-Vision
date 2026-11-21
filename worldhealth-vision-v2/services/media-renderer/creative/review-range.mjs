/**
 * Real-timeline review for a single storytelling beat.
 * Unlike the legacy --shot preview, the renderer MUST retain the full film's
 * narration, soundtrack, captions, and overlapping transitions, while asking
 * Remotion to encode only these original source frames.
 */
import {buildEditorialTimeline} from './editorial-timeline.mjs';

export const REVIEW_CONTEXT_FRAMES = 15;

export function reviewFrameRange(project, shotId, contextFrames = REVIEW_CONTEXT_FRAMES) {
  if (typeof shotId !== 'string' || !shotId.trim()) {
    throw new Error('A review shot ID is required.');
  }
  if (!Number.isInteger(contextFrames) || contextFrames < 0 || contextFrames > 90) {
    throw new Error('Review context must be an integer between 0 and 90 frames.');
  }
  const timeline = buildEditorialTimeline(project?.shots);
  const selected = timeline.shots.find((shot) => shot.id === shotId);
  if (!selected) {
    throw new Error('Review shot not found in the original film: ' + shotId);
  }
  const startFrame = Math.max(0, selected.startFrame - contextFrames);
  const endFrame = Math.min(timeline.durationFrames - 1, selected.endFrame - 1 + contextFrames);
  return Object.freeze({
    shotId,
    frameRange: Object.freeze([startFrame, endFrame]),
    durationFrames: endFrame - startFrame + 1,
    selectedShotSourceFrames: Object.freeze([selected.startFrame, selected.endFrame - 1]),
    actualContextFrames: Object.freeze([
      selected.startFrame - startFrame,
      endFrame - (selected.endFrame - 1),
    ]),
    sourceContentFrames: timeline.durationFrames,
  });
}
