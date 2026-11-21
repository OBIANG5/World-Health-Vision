/**
 * Adapt existing Remotion Caption[] word timestamps to World-Vision's native
 * wordCaptions. NEVER transcribe, guess timings, edit approved text or publish.
 * A real audio aligner (e.g. Whisper.cpp) must supply the Caption[] array.
 */
import {createHash} from 'node:crypto';

const normalized = (s) => String(s).normalize('NFKD').replace(/\p{M}/gu, '')
  .replace(/[^\p{L}\p{N}]/gu, '').toLocaleLowerCase('und');
const hasLetters = (s) => /[\p{L}\p{N}]/u.test(s);
export const scriptWords = (script) => {
  if (typeof script !== 'string' || !script.trim()) throw Error('A locked script is required');
  // Word timings must be reviewed for scripts without whitespace boundaries.
  const words = script.split(/\s+/u).filter(hasLetters);
  if (words.length === 0) throw Error('Approved script contains no spoken words');
  if (words.some(w => w.length > 60)) throw Error('An approved word exceeds World-Vision 60-char limit');
  return words;
};
const sha = (text) => createHash('sha256').update(text, 'utf8').digest('hex');

/**
 * @param {object} args
 * @param {string} args.script - EXACT approved script, left unchanged.
 * @param {Array} args.captions - official @remotion/captions Caption[] JSON.
 * @param {number} args.durationFrames - source film without silent logo outro.
 * @param {number} [args.fps=30]
 * @param {number} [args.offsetFrames=0] - if voice is deliberately delayed in film.
 * @param {string[]} [args.emphasis=[]] - editor-supplied strong words, not AI guessed.
 */
export function importWordTiming({script, captions, durationFrames, fps = 30, offsetFrames = 0, emphasis = []}) {
  if (fps !== 30) throw Error('World-Vision P0.3 requires source 30 fps');
  if (!Number.isInteger(durationFrames) || durationFrames < 1 || durationFrames > 18000)
    throw Error('Invalid narrated film duration in frames');
  if (!Number.isInteger(offsetFrames) || offsetFrames < 0 || offsetFrames >= durationFrames)
    throw Error('Invalid voice offset in frames');
  if (!Array.isArray(captions) || captions.length > 1200 || captions.length === 0)
    throw Error('Expect 1–1200 word tokens from an existing aligner (Caption[])');
  if (!Array.isArray(emphasis) || emphasis.some(s => typeof s !== 'string' || !normalized(s)))
    throw Error('Editor emphasis must be an array of spoken-word strings');
  const approved = scriptWords(script);
  if (approved.length !== captions.length) {
    throw Error('Alignment word count mismatch: approved script has '+approved.length+
      ' words, existing aligner has '+captions.length+'. Review transcript; no output changed.');
  }
  const emphSet = new Set(emphasis.map(normalized));
  let lastEnd = 0;
  const words = captions.map((c, i) => {
    if (!c || typeof c !== 'object' || Array.isArray(c) || typeof c.text !== 'string')
      throw Error('Caption token '+(i+1)+' is invalid');
    const sourceWord = approved[i];
    if (normalized(sourceWord) !== normalized(c.text)) {
      throw Error('Alignment mismatch at spoken word '+(i+1)+': approved "'+
        sourceWord+'" vs aligner "'+c.text.trim()+'". Review audio; no silent script edits.');
    }
    if (!Number.isFinite(c.startMs) || !Number.isFinite(c.endMs) || c.startMs < 0 || c.endMs <= c.startMs)
      throw Error('Caption '+(i+1)+' must have valid numeric from/to milliseconds');
    const startFrame = Math.round(c.startMs * fps / 1000) + offsetFrames;
    const endFrame = Math.round(c.endMs * fps / 1000) + offsetFrames;
    if (endFrame <= startFrame || startFrame < lastEnd || endFrame > durationFrames)
      throw Error('Caption '+(i+1)+' collapses/overlaps/outlasts source after 30fps rounding; review with a real waveform.');
    lastEnd = endFrame;
    return {text: sourceWord, startFrame, endFrame, emphasis: emphSet.has(normalized(sourceWord))};
  });
  const matched = new Set(words.filter(w => w.emphasis).map(w => normalized(w.text)));
  for (const strong of emphSet) if (!matched.has(strong))
    throw Error('Requested emphasis word not in approved script: ' + strong);
  return {
    wordCaptions: words,
    report: {
      kind: 'external_word_alignment_import_needs_review',
      source_script_sha256: sha(script),
      word_count: words.length,
      duration_frames: durationFrames,
      word_start_frame: words[0].startFrame,
      word_end_frame: words.at(-1).endFrame,
      timing_origin: 'provided Remotion Caption[] from external aligner; not measured by this import',
      human_audio_visual_review: 'required_before_publication',
      source_script_unchanged: true,
    }
  };
}
