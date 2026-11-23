export type WordCaption={text:string;startFrame:number;endFrame:number;emphasis?:boolean};
export declare function approvedScriptWords(script:string):string[];
export declare function wordCaptionIssues(
  project:{script:string;voice?:{file?:string}|null;captions?:Array<unknown>;wordCaptions?:WordCaption[]},
  narratedFrames:number
):Array<{field:string;reason:string}>;
