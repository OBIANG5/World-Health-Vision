/**
 * PHOTO MULTILAYER — independent deterministic motion tracks in frame space.
 * No random effects, no AI media, no re-timed facts. Identical for React Player
 * and actual Remotion H.264 renders. All distances are output pixels at 1080x1920.
 */
const clamp=(x)=>Math.max(0,Math.min(1,x));
export const motionEase=(t)=>{const x=clamp(t);return x*x*(3-2*x)};
export const motionProgress=(frame,start,end)=>motionEase((frame-start)/Math.max(1,end-start));
const mix=(a,b,t)=>a+(b-a)*t;

/** Each track has its OWN timeline; an effect should not control the others. */
export function photoTrackPose(photo,frame,durationFrames){
  const f=Math.max(0,Math.min(durationFrames,frame));
  const c=photo.camera;
  const cameraProgress=motionProgress(f,c.startFrame,c.endFrame);
  const scale=mix(c.zoomFrom,c.zoomTo,cameraProgress);
  const panX=c.panX*cameraProgress;
  const panY=c.panY*cameraProgress;
  const subject=photo.subject;
  const subjectProgress=subject?motionProgress(f,subject.startFrame,subject.endFrame):0;
  const mask=photo.mask;
  const focus=photo.focus;
  const metric=photo.metric;
  const maskProgress=mask?motionProgress(f,mask.startFrame,mask.endFrame):0;
  const focusProgress=focus?motionProgress(f,focus.startFrame,focus.endFrame):0;
  const countProgress=metric?motionProgress(f,metric.startFrame,metric.endFrame):0;
  // Point is selected in visible-image viewport coordinates (not EXIF / GPS).
  // It follows the exact same output transformation as the base photograph.
  const focusPoint=focus?{
    x:540+(focus.x*1080-540)*scale+panX,
    y:960+(focus.y*1920-960)*scale+panY
  }:null;
  return {
    camera:{progress:cameraProgress,scale,panX,panY},
    subject:{progress:subjectProgress,
      scale:subject?1+subject.scale*subjectProgress:1,
      dx:subject?subject.dx*subjectProgress:0,
      dy:subject?subject.dy*subjectProgress:0},
    maskProgress,focusProgress,focusPoint,countProgress,
    // A news shot must carry its headline on the very first visible frame.
    headingProgress:.78+.22*motionProgress(f,0,27),
    subtitleProgress:motionProgress(f,79,112),
    underlayProgress:motionProgress(f,0,28)
  };
}
