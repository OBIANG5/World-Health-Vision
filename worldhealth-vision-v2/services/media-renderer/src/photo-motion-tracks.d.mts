export type PhotoMotion = {
  camera:{zoomFrom:number;zoomTo:number;panX:number;panY:number;startFrame:number;endFrame:number};
  subject?:{dx:number;dy:number;scale:number;startFrame:number;endFrame:number};
  mask?:{axis:"horizontal"|"vertical";startFrame:number;endFrame:number};
  focus?:{x:number;y:number;radius:number;startFrame:number;endFrame:number};
  metric?:{label:string;value:number;unit:string;precision:number;sourceLabel:string;startFrame:number;endFrame:number};
  /** Optional authored, sourced two-value data layer rendered simultaneously over PHOTO. */
  comparison?:{
    title:string;
    first:{label:string;value:number};
    second:{label:string;value:number};
    domain:{min:number;max:number};
    unit:string;precision:number;locale:"fr-FR"|"en-US";
    source:{publisher:string;dataset:string;asOf:string;url?:string};
    startFrame:number;endFrame:number;
  };
};
export type PhotoTrackPose = {
  camera:{progress:number;scale:number;panX:number;panY:number};
  subject:{progress:number;scale:number;dx:number;dy:number};
  maskProgress:number;
  focusProgress:number;
  focusPoint:{x:number;y:number}|null;
  countProgress:number;
  headingProgress:number;
  subtitleProgress:number;
  underlayProgress:number;
};
export function motionEase(x:number):number;
export function motionProgress(frame:number,start:number,end:number):number;
export function photoTrackPose(p:PhotoMotion,frame:number,durationFrames:number):PhotoTrackPose;
