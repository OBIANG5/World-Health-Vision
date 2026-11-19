export type DataMetric={label:string;value:number};
export type DataMotion = {
  kind:"trend"|"comparison"|"ranking"|"heatmap";
  unit:string;
  precision:number;
  xMode?:"date"|"category";
  points?:DataMetric[];
  matrix?:{columns:string[];rows:{label:string;values:number[]}[];min:number;max:number};
  source:{publisher:string;dataset:string;asOf:string;methodology:string;url?:string};
  synthetic?:boolean;
};
export type DataPose={headline:number;chart:number;bars:number[];source:number;subtitle:number};
export function dataBeat(frame:number,start:number,end:number):number;
export function dataMotionPose(frame:number,durationFrames:number,n?:number):DataPose;
export function valueDomain(values:number[],options?:{includeZero?:boolean}):{min:number;max:number};
export function valueCoordinate(value:number,domain:{min:number;max:number},width:number):number;
export function seriesCoordinates(points:DataMetric[],box:{left:number;top:number;width:number;height:number},xMode?:"date"|"category"):{
 domain:{min:number;max:number};baselineY:number;coords:Array<DataMetric&{x:number;y:number}>
};
export function cellIntensity(value:number,min:number,max:number):number;
export function formatMetric(value:number,precision?:number):string;
