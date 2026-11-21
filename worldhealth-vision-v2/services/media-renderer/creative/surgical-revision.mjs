/**
 * World-Vision MEDIA P0.4 — surgical, editor-directed revisions.
 * No text generation, no ASR/TTS, no timing guesses, no source alteration.
 * Keep the original project untouched; a separate CLI validates & writes.
 */
import {buildEditorialTimeline} from './editorial-timeline.mjs';
import {reviewFrameRange} from './review-range.mjs';

export const REVISION_FORMAT = 'worldvision-shot-revision-v1';
const SET_FIELDS = new Set([
  'title', 'subtitle', 'eyebrow', 'footnote', 'motion', 'accent',
  'titleTreatment', 'titleFrameZero', 'focus', 'media', 'foreground'
]);
const TOP_FIELDS = new Set([
  'schema_version', 'source_project_sha256', 'shot_id', 'reason',
  'set', 'word_emphasis', 'sound_volume', 'sound_add'
]);
const fail = (message) => {throw new Error('Surgical revision rejected: ' + message);};
const object = (v) => v !== null && typeof v === 'object' && !Array.isArray(v);
const eq = (a,b) => JSON.stringify(a) === JSON.stringify(b);
const own = (v,key) => Object.prototype.hasOwnProperty.call(v,key);
function allowKeys(value, allowed, label) {
  if (!object(value)) fail(label + ' must be a JSON object');
  for (const key of Object.keys(value)) if (!allowed.has(key)) {
    fail(label + ' contains disallowed field ' + key);
  }
}

/**
 * @param {object} source Existing canonical worldvision-creative-project-v1.
 * @param {object} revision Human-reviewed JSON revision, not a free-form AI patch.
 * @param {string} sourceSha SHA256 of the *raw* source project file bytes.
 */
export function reviseShot(source, revision, sourceSha) {
  if (!object(source) || !Array.isArray(source.shots)) fail('source project must contain shots');
  allowKeys(revision, TOP_FIELDS, 'revision');
  if (revision.schema_version !== REVISION_FORMAT) fail('wrong revision schema');
  if (typeof sourceSha !== 'string' || !/^[a-f0-9]{64}$/.test(sourceSha) ||
      revision.source_project_sha256 !== sourceSha) {
    fail('stale or missing source project SHA256; inspect and rebase patch explicitly');
  }
  if (typeof revision.reason !== 'string' || revision.reason.trim().length < 8 ||
      revision.reason.length > 500) fail('a concise editor-directed reason is mandatory');
  if (typeof revision.shot_id !== 'string') fail('shot_id is mandatory');
  const timeline = buildEditorialTimeline(source.shots);
  const row = timeline.shots.find(s => s.id === revision.shot_id);
  if (!row) fail('unknown shot_id: ' + revision.shot_id);
  const index = row.index;
  // An overlapping transition belongs to BOTH shots: do not allow word/SFX
  // edits there without a later, explicit two-shot editorial decision.
  const exclusiveStart = row.startFrame + row.enterOverlapFrames;
  const exclusiveEnd = row.endFrame - (source.shots[index].transitionFrames ?? 0);
  if (exclusiveEnd <= exclusiveStart) fail('shot has no exclusively owned frames');
  const within = (start,end) => Number.isInteger(start) && Number.isInteger(end) &&
    start >= exclusiveStart && end <= exclusiveEnd && end > start;
  const result = structuredClone(source);
  const edits = [];
  const target = result.shots[index];

  if (revision.set !== undefined) {
    allowKeys(revision.set, SET_FIELDS, 'set');
    for (const [key,value] of Object.entries(revision.set)) {
      if (value === null) {
        if (own(target,key)) { delete target[key]; edits.push('shots['+index+'].'+key); }
      } else if (!eq(target[key],value)) {
        target[key] = structuredClone(value);
        edits.push('shots['+index+'].'+key);
      }
    }
  }
  if (revision.word_emphasis !== undefined) {
    if (!Array.isArray(revision.word_emphasis) || revision.word_emphasis.length > 80) {
      fail('word_emphasis must be an array with at most 80 exact indexed changes');
    }
    const seen = new Set();
    for (const change of revision.word_emphasis) {
      allowKeys(change,new Set(['index','emphasis']),'word_emphasis item');
      if (!Number.isInteger(change.index) || seen.has(change.index) ||
          typeof change.emphasis !== 'boolean') fail('invalid or duplicate word emphasis index');
      seen.add(change.index);
      const cue = result.wordCaptions?.[change.index];
      if (!cue || !within(cue.startFrame,cue.endFrame)) {
        fail('word emphasis must be entirely inside the selected non-overlap shot');
      }
      if (cue.emphasis !== change.emphasis) {
        cue.emphasis = change.emphasis;
        edits.push('wordCaptions['+change.index+'].emphasis');
      }
    }
  }
  if (revision.sound_volume !== undefined) {
    if (!Array.isArray(revision.sound_volume) || revision.sound_volume.length > 40) {
      fail('sound_volume must be an array with at most 40 indexed volume changes');
    }
    const seen = new Set();
    for (const change of revision.sound_volume) {
      allowKeys(change,new Set(['index','volume']),'sound_volume item');
      if (!Number.isInteger(change.index) || seen.has(change.index) ||
          typeof change.volume !== 'number' || !Number.isFinite(change.volume) ||
          change.volume < 0 || change.volume > 0.8) fail('invalid or duplicate SFX volume edit');
      seen.add(change.index);
      const cue = result.soundCues?.[change.index];
      if (!cue || !within(cue.startFrame,cue.startFrame+cue.durationFrames)) {
        fail('SFX volume edit must belong entirely to the selected non-overlap shot');
      }
      if (cue.volume !== change.volume) {
        cue.volume = change.volume;
        edits.push('soundCues['+change.index+'].volume');
      }
    }
  }
  if (revision.sound_add !== undefined) {
    if (!Array.isArray(revision.sound_add) || revision.sound_add.length > 12) {
      fail('sound_add must be an array of at most 12 explicitly sourced sound cues');
    }
    for (const cue of revision.sound_add) {
      allowKeys(cue,new Set(['startFrame','durationFrames','file','volume','label']),'sound_add cue');
      if (!within(cue.startFrame,cue.startFrame+cue.durationFrames)) {
        fail('new SFX must be entirely inside selected non-overlap shot');
      }
      if (!result.soundCues) result.soundCues = [];
      result.soundCues.push(structuredClone(cue));
      edits.push('soundCues['+(result.soundCues.length-1)+']');
    }
  }
  if (edits.length === 0) fail('revision is a no-op; no output needed');
  if (!eq(result.script, source.script) || !eq(result.voice,source.voice) ||
      !eq(result.music,source.music) || !eq(result.outro,source.outro) ||
      !eq(result.shots.map(s=>s.id),source.shots.map(s=>s.id)) ||
      !eq(result.shots.map(s=>s.durationFrames),source.shots.map(s=>s.durationFrames)) ||
      !eq(result.shots.map(s=>[s.transitionAfter,s.transitionFrames]),
          source.shots.map(s=>[s.transitionAfter,s.transitionFrames]))) {
    fail('protected narration, duration, ordering or transitions unexpectedly changed');
  }
  for (let i=0;i<source.shots.length;i++) {
    if (i!==index && !eq(result.shots[i],source.shots[i])) fail('unselected shot changed');
  }
  const review = reviewFrameRange(result,revision.shot_id);
  return {
    project: result,
    report: {
      kind: 'editor_directed_surgical_retake_not_publication',
      source_project_sha256: sourceSha,
      shot_id: revision.shot_id,
      reason: revision.reason,
      changed_fields: edits,
      exclusive_source_frames: [exclusiveStart,exclusiveEnd-1],
      review_source_frame_range: review.frameRange,
      review_frame_count: review.durationFrames,
      script_unchanged: true,
      voice_and_music_tracks_unchanged: true,
      durations_and_transitions_unchanged: true,
      human_audio_visual_review: 'required_before_publication'
    }
  };
}
