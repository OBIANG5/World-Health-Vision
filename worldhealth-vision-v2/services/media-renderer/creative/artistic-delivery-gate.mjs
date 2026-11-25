import {buildEditorialTimeline} from './editorial-timeline.mjs';

/** A review plan, not an algorithm that certifies beauty. Frames use the
 * original source timeline, including actual overlapped transitions. */
export function artisticSampleFrames(project){
  const timeline=buildEditorialTimeline(project.shots);
  const frames=new Set();
  for(const s of timeline.shots){
    frames.add(s.startFrame);
    frames.add(Math.floor((s.startFrame+s.endFrame-1)/2));
    frames.add(s.endFrame-1);
  }
  for(const j of timeline.junctions){
    frames.add(j.startFrame);
    frames.add(Math.floor((j.startFrame+j.endFrame-1)/2));
    frames.add(j.endFrame-1);
  }
  for(const b of project.directorBeats??[]){
    for(const f of [b.startFrame,Math.floor((b.startFrame+b.endFrame-1)/2),b.endFrame-1])
      if(Number.isInteger(f)&&f>=0&&f<timeline.durationFrames)frames.add(f);
  }
  if(project.outro?.durationFrames){
    frames.add(timeline.durationFrames);
    frames.add(timeline.durationFrames+project.outro.durationFrames-1);
  }
  return [...frames].sort((a,b)=>a-b);
}
export const REVIEW_AXES=Object.freeze([
  'brand','typography','visual_hierarchy','no_decorative_rules',
  'caption_clearance','source_legibility','motion_and_transitions',
  'voice_and_mix','mobile_safe_area','narrative'
]);
/** A successful technical render is still only a CANDIDATE. This is
 * intentionally fail-closed while the current approved brand master is
 * missing. No flag, filename, or TTS manifest can override the blocker. */
export function artisticDeliveryStatus(project,ownerVoice){
  const blockers=['actual_full_playback_and_artistic_review_required',
    'approved_current_brand_asset_missing'];
  if(!ownerVoice)blockers.push('selected_exact_voice_not_verified');
  if(project.shots.some(s=>s.titleTreatment==='cyan-slab'))
    blockers.push('legacy_cyan_slab_requires_redesign');
  return {status:'blocked',classification:'candidate_only',
    brand_asset_status:'missing_approved_current_asset',
    blockers,required_review_axes:[...REVIEW_AXES],publication_authorized:false};
}
/** Called at the delivery boundary, NOT at candidate rendering. */
export function requireArtisticallyDeliverable(report){
  if(report?.artistic_delivery?.status!=='approved'||
     report?.artistic_delivery?.publication_authorized!==true)
    throw Error('World-Vision delivery refused: candidate not artistically approved; missing current brand asset or completed review.');
  // Until a real approved brand master is registered and a reviewed receipt
  // is verifiable, no delivery is authorized by this version.
  throw Error('World-Vision delivery refused: current approved brand registry and verified artistic receipt are not installed.');
}
