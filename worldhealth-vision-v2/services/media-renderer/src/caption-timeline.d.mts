export type CaptionCue={
  id:string;startFrame:number;endFrame:number;text:string;speaker?:string;
};
export type CaptionTrack={
  kind:"verbatim"|"non_speech_test";
  language:string;
  sourceVoiceSha256?:string;
  review?:{checkedBy:string;checkedAt:string;
    method:"human_aligned"|"human_verified_external_alignment"};
  cues:CaptionCue[];
};
export function validateCaptionTimeline(
  track:CaptionTrack,totalFrames:number,opts?:{requiresVoice?:boolean}
):{field:string;reason:string}[];
export function captionAtFrame(track:CaptionTrack,frame:number):CaptionCue|null;
