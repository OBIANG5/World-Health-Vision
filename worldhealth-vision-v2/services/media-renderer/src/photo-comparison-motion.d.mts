import type {PhotoMotion} from "./photo-motion-tracks.mjs";
export type PhotoComparison=NonNullable<PhotoMotion["comparison"]>;
export type ComparisonIssue={field:string;reason:string};
export type ComparisonPose={
  reveal:number;
  panelProgress:number;
  origin:number;
  axisMin:number;
  axisMax:number;
  bars:Array<{
    value:number;label:string;zero:number;
    start:number;end:number;width:number;
    direction:"positive"|"negative"|"zero";
  }>
};
export function photoComparisonIssues(comparison:PhotoComparison,shotDuration:number):ComparisonIssue[];
export function photoComparisonPose(comparison:PhotoComparison,frame:number):ComparisonPose;
