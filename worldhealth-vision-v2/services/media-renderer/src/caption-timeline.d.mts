export type CaptionCue={
  startFrame:number;
  endFrame:number;
  text:string;
  position?:"upper"|"lower";
};
export function parseSrtCaptions(text:string,options?:{fps?:number;position?:"upper"|"lower"}):CaptionCue[];
export function captionCueIssues(cues:CaptionCue[]|null|undefined,totalFrames:number):{field:string;reason:string}[];
export function activeCaption(cues:CaptionCue[]|null|undefined,frame:number):CaptionCue|null;
export const CAPTION_FPS:30;
