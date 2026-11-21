export type SourceSoundCue={
  file:string;
  startFrame:number;
  durationFrames:number;
  volume?:number;
  label?:string;
};
export declare function attentionCueIssues(
  project:{wordCaptions?:Array<{text:string;startFrame:number;endFrame:number;emphasis?:boolean}>;soundCues?:SourceSoundCue[]},
  narratedFrames:number
):Array<{field:string;reason:string}>;
