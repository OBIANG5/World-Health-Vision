export type DirectorIntent="hook"|"explain"|"rehook"|"reveal"|"impact"|"payoff";
export type DirectorBeat={
  id:string;
  shotId:string;
  startFrame:number;
  endFrame:number;
  intent:DirectorIntent;
  idea:string;
  spokenExcerpt:string;
  proofNote:string;
  visualDirection:string;
  audioDirection:string;
};
export declare const DIRECTOR_INTENTS:readonly DirectorIntent[];
export declare function directorBeatIssues(
  project:{shots:Array<{id:string;durationFrames:number;template?:string;transitionAfter?:string;transitionFrames?:number}>;
           script:string;directorBeats?:DirectorBeat[]},
  narratedFrames:number
):Array<{field:string;reason:string}>;
