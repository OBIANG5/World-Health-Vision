export type GeoCameraPoint={lon:number;lat:number};
export type GeoCameraInput={
  center:GeoCameraPoint;
  spinDegrees?:number;
  camera?:{
    to:GeoCameraPoint;
    startFrame:number;
    endFrame:number;
    zoom:number;
  };
};
export type GeoCameraPose={
  centerLon:number;
  centerLat:number;
  spinDegrees:number;
  zoom:number;
  arrival:number;
};
export function geoCameraPose(
  geo:GeoCameraInput,
  localFrame:number,
  durationFrames:number
):GeoCameraPose;
