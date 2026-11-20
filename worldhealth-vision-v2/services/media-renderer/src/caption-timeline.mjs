/** SOURCE-BOUND word/phrase caption timeline. No ASR, no TTS, no synthesis.
 * Cues are explicitly authored, aligned, and reviewed outside this renderer.
 * All intervals are [startFrame,endFrame) on the ORIGINAL master timeline. */
export const CAPTION_KINDS=Object.freeze(["verbatim","non_speech_test"]);
const validDate=d=>typeof d==="string"&&/^[0-9]{4}-[0-9]{2}-[0-9]{2}$/.test(d)&&
  Number.isFinite(Date.parse(d+"T12:00:00Z"))&&new Date(d+"T12:00:00Z").toISOString().slice(0,10)===d;
export function validateCaptionTimeline(track,totalFrames,{requiresVoice=false}={}){
  const errors=[];const fail=(field,reason)=>errors.push({field,reason});
  if(!track||typeof track!=="object"||Array.isArray(track))
    return [{field:"captions",reason:"Provide a verified timed-caption track"}];
  if(!CAPTION_KINDS.includes(track.kind))
    fail("captions.kind","Choose verbatim or clearly labelled non_speech_test");
  if(typeof track.language!=="string"||!/^[a-z]{2,3}(?:-[A-Za-z0-9]{2,8}){0,3}$/.test(track.language))
    fail("captions.language","BCP-47 language tag required");
  if(!Array.isArray(track.cues)||track.cues.length<1||track.cues.length>500)
    fail("captions.cues","Between 1 and 500 explicitly timed cues required");
  const cues=Array.isArray(track.cues)?track.cues:[];
  const ids=new Set();
  let lastEnd=0;
  for(const [i,c]of cues.entries()){
    const path="captions.cues["+i+"]";
    if(!c||typeof c!=="object"){fail(path,"Cue must be an object");continue;}
    if(typeof c.id!=="string"||!/^[a-z0-9][a-z0-9_-]{2,60}$/.test(c.id)||ids.has(c.id))
      fail(path+".id","Unique stable caption ID required");
    ids.add(c.id);
    const start=c.startFrame,end=c.endFrame;
    if(!Number.isInteger(start)||!Number.isInteger(end)||start<0||end<=start||
      end>totalFrames||end-start<12||end-start>240||start<lastEnd)
      fail(path+".frames","Cues need 0–end legal, 12–240 frames long, chronological non-overlapping timing");
    else lastEnd=end;
    const text=c.text;
    const lines=typeof text==="string"?text.split("\n"):[];
    if(typeof text!=="string"||text.trim().length===0||text.length>78||
      lines.length>2||lines.some(x=>x.trim().length===0||x.length>39)||
      /[<>\u0000-\u0008\u000B\u000C\u000E-\u001F]/.test(text))
      fail(path+".text","Readable plain-text captions: 1–2 lines, <=39 chars/line, <=78 total");
    if(Number.isInteger(start)&&Number.isInteger(end)&&end>start&&
      typeof text==="string"&&text.length/((end-start)/30)>20)
      fail(path+".readability","Caption reading speed exceeds 20 characters per second");
    if(c.speaker!==undefined&&
      (typeof c.speaker!=="string"||c.speaker.length>55))
      fail(path+".speaker","Speaker label too long");
  }
  if(track.kind==="verbatim"){
    if(!requiresVoice)fail("captions.kind","A verbatim speech claim requires a supplied human-approved voice track");
    if(typeof track.sourceVoiceSha256!=="string"||!/^[a-f0-9]{64}$/i.test(track.sourceVoiceSha256))
      fail("captions.sourceVoiceSha256","Bind the transcript to the SHA-256 of the original speech file");
    if(!track.review||typeof track.review.checkedBy!=="string"||
      !track.review.checkedBy.trim()||!validDate(track.review.checkedAt)||
      !["human_aligned","human_verified_external_alignment"].includes(track.review.method))
      fail("captions.review","Human verification of exact spoken words/timecodes required");
  }
  if(track.kind==="non_speech_test"&&requiresVoice)
    // Oscillators can be supplied as the voice track for technical QA, but
    // must never be mistaken for a real speaker or transcript.
    fail("captions.kind","Technical-only captions should not be attached as a spoken transcript to a voice track");
  return errors;
}
export function captionAtFrame(track,frame){
  if(!track?.cues||!Number.isFinite(frame))return null;
  // Maximum 500 cues: linear scan deterministic and fast for 1080p/30fps.
  return track.cues.find(c=>c.startFrame<=frame&&frame<c.endFrame)??null;
}
