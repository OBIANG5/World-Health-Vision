/**
 * World-Vision MEDIA — OWNER audiovisual review voice provenance gate.
 *
 * This gate is NOT voice synthesis, ASR, a speaker-recognition model, or
 * proof of commercial rights. It protects against silently substituting
 * Kokoro/Remy/old Vivienne on a film presented to the owner for judgment.
 *
 * A narration must be a NEW take for the APPROVED script of THIS film.
 * The historical 14.088s C5.2 sample is a vocal reference, NOT reusable
 * for another news story. Internal machine QA may still run independently.
 */
import fs from 'node:fs';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {resolveLocalFile} from './validate-project.mjs';

export const OWNER_VOICE_PROFILE=Object.freeze({
  profile_id:'vivienne-c5-2-impact-media',
  display_name:'Vivienne C5.2 — Impact média',
  voice_provider_id:'fr-FR-VivienneMultilingualNeural',
  speaking_rate:'+8%',
  reference_branch:'whv-media-studio-browser-preview',
  reference_audio:'media-lab/nextgen/vivienne-c5-linked/c5_broadcast-review-only.mp3',
  reference_report:'media-lab/nextgen/vivienne-c5-linked/c5_broadcast-report.json',
  reference_duration_seconds:14.088
});
export const OWNER_VOICE_MANIFEST_VERSION='worldvision-owner-review-voice-v1';
// Verified Git blob SHA-1s from the historical public audition branch.
// This is an exact-byte *sample reuse* prohibition, NOT a speaker biometric.
const REFERENCE_SAMPLE_GIT_BLOBS=new Set([
  'cd2254c1557b815fd63a4861af9086d26d960da6', // 14.088s C5.2 review
  'b36aca061d634e68be464e805284d3aa1735a5f6'  // C5.2 raw service
]);
const HASH=/^[a-f0-9]{64}$/;
const isObj=o=>o!==null&&typeof o==='object'&&!Array.isArray(o);
const die=s=>{throw new Error('World-Vision owner-review voice blocked: '+s);};
const hash=b=>createHash('sha256').update(b).digest('hex');
const keys=new Set([
  'schema_version','project_id','voice_profile_id','provider_voice_id',
  'speaking_rate','script_sha256','voice_file','voice_sha256',
  'recording_scope','human_listening','publication_authorized',
  'rights_status'
]);

/**
 * No external connections, no mutation, no paid TTS. Verifies exact
 * PROJECT/script/audio byte identity and declared selected-voice settings.
 * It CANNOT identify the actual speaker in an MP3: human listening and
 * recorded service provenance remain mandatory.
 */
export function verifyOwnerReviewVoice({project,assetsRoot,manifestPath}){
  if(!isObj(project)||typeof project.script!=='string'||!project.script.trim())
    die('approved source script must be present verbatim');
  if(!project.voice||typeof project.voice.file!=='string')
    die('narration audio is missing; never substitute a technical voice');
  if(typeof manifestPath!=='string'||!path.isAbsolute(manifestPath))
    die('supply an absolute path to the separately reviewed voice manifest');
  const stat=fs.statSync(manifestPath);
  if(!stat.isFile()||stat.size>65536)
    die('manifest must be a local JSON file, <=64 KiB');
  let m;
  try{m=JSON.parse(fs.readFileSync(manifestPath,'utf8'));}
  catch{die('malformed or unreadable voice manifest JSON');}
  if(!isObj(m))die('voice manifest must be an object');
  for(const key of Object.keys(m))if(!keys.has(key))
    die('unknown or unsafe voice manifest field: '+key);
  if(m.schema_version!==OWNER_VOICE_MANIFEST_VERSION)
    die('voice manifest schema version mismatch');
  if(m.project_id!==project.id)
    die('voice manifest belongs to another story/project');
  if(m.voice_profile_id!==OWNER_VOICE_PROFILE.profile_id||
     m.provider_voice_id!==OWNER_VOICE_PROFILE.voice_provider_id||
     m.speaking_rate!==OWNER_VOICE_PROFILE.speaking_rate)
    die('owner selected Vivienne C5.2 Impact média +8%; no alternative voice');
  if(!HASH.test(m.script_sha256)||m.script_sha256!==hash(Buffer.from(project.script,'utf8')))
    die('narration manifest script differs from the current locked film script');
  if(m.voice_file!==project.voice.file)
    die('wrong narration file; do not reuse an old MP3 from another episode');
  if(!HASH.test(m.voice_sha256))
    die('raw original narration file SHA256 is required');
  if(m.recording_scope!=='new_take_for_this_exact_script')
    die('the historic C5.2 audition is a REFERENCE, not a take for this story');
  if(m.human_listening!=='pending_owner_review')
    die('the narration take has not been approved for a different scope');
  if(m.publication_authorized!==false||m.rights_status!=='not_yet_verified')
    die('owner review is NOT a publishing authorization or rights certification');
  let file;
  try{file=resolveLocalFile(path.resolve(assetsRoot),project.voice.file);}
  catch(e){die('unsafe/missing original voice file: '+e.message);}
  const audioStat=fs.statSync(file);
  if(!audioStat.isFile()||audioStat.size===0||audioStat.size>256*1024*1024)
    die('narration take must be a non-empty local audio file <=256 MiB');
  const audioBytes=fs.readFileSync(file);
  const gitBlobHash=createHash('sha1')
    .update(Buffer.from('blob '+audioBytes.length+'\0')).update(audioBytes).digest('hex');
  if(REFERENCE_SAMPLE_GIT_BLOBS.has(gitBlobHash))
    die('the historical C5.2 sample is for REFERENCE only, not another story');
  const fileHash=hash(audioBytes);
  if(fileHash!==m.voice_sha256)
    die('source audio bytes differ from the exact SHA256 locked narration take');
  return Object.freeze({
    purpose:'owner_audiovisual_review_not_publication',
    profile_id:OWNER_VOICE_PROFILE.profile_id,
    provider_voice_id:OWNER_VOICE_PROFILE.voice_provider_id,
    speaking_rate:OWNER_VOICE_PROFILE.speaking_rate,
    narration_audio_sha256:fileHash,
    narration_script_sha256:m.script_sha256,
    narration_file:m.voice_file,
    recorded_origin:'manifest_declared_not_voice_biometrics_verified',
    actual_spoken_words_verified:false,
    pronunciation_and_naturalness_review:'owner_listening_required',
    commercial_rights_verified:false,
    publication_authorized:false
  });
}
