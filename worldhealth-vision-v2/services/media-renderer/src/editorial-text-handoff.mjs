/**
 * Keep two large headlines from becoming readable simultaneously during a
 * cross-dissolve. The new picture enters at frame zero but the incoming
 * typography waits until the preceding shot has finished its overlap.
 * This is a timing policy, not a filter on the original media.
 */
export function headlineHandoffOpacity(frame,enterOverlapFrames,rampFrames=12){
  if(!Number.isFinite(frame)||!Number.isInteger(enterOverlapFrames)||enterOverlapFrames<0)
    throw Error("Invalid editorial text timing");
  if(enterOverlapFrames===0)return 1;
  const progress=Math.max(0,Math.min(1,(frame-enterOverlapFrames)/Math.max(1,rampFrames)));
  return progress*progress*(3-2*progress);
}
