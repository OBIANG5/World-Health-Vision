/** Type contract for the already-tested ORIGINAL timeline review calculation. */
export declare const REVIEW_CONTEXT_FRAMES: number;

export declare function reviewFrameRange(
  project: {
    shots: Array<{
      id: string;
      durationFrames: number;
      transitionAfter?: "cut" | "dissolve" | "slide";
      transitionFrames?: number;
    }>;
  },
  shotId: string,
  contextFrames?: number,
): Readonly<{
  shotId: string;
  frameRange: readonly [number, number];
  durationFrames: number;
  selectedShotSourceFrames: readonly [number, number];
  actualContextFrames: readonly [number, number];
  sourceContentFrames: number;
}>;
