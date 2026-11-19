/**
 * World-Vision GEO / deterministic director camera, shared by browser and MP4.
 * Each frame is a pure function of supplied coordinates and the shot timeline.
 * No geolocation, AI-created country, map inference or network request.
 */
import {geoInterpolate} from "d3-geo";

const clamp=(x)=>Math.max(0,Math.min(1,x));
const smooth=t=>t*t*(3-2*t);

/**
 * @param {{center:{lon:number,lat:number},spinDegrees?:number,camera?:{to:{lon:number,lat:number},startFrame:number,endFrame:number,zoom:number}}} geo
 * @param {number} localFrame
 * @param {number} durationFrames
 */
export function geoCameraPose(geo,localFrame,durationFrames){
  const local=Math.max(0,Math.min(durationFrames,localFrame));
  const fraction=clamp(local/Math.max(1,durationFrames));
  const c=geo.camera;
  const arrival=c?smooth(clamp((local-c.startFrame)/(c.endFrame-c.startFrame))):0;
  // D3 interpolates along a spherical great-circle, including across ±180°.
  // Straight longitude interpolation would cause a 358° camera sweep.
  const position=c?geoInterpolate(
    [geo.center.lon,geo.center.lat],[c.to.lon,c.to.lat]
  )(arrival):[geo.center.lon,geo.center.lat];
  // Legacy global spin is unchanged when no camera has been authored.
  // During a directed arrival it fades to zero so the camera holds the
  // precisely editor-selected destination instead of drifting past it.
  const spinDegrees=(geo.spinDegrees??16)*fraction*(c?1-arrival:1);
  return {
    centerLon:position[0],centerLat:position[1],
    spinDegrees,zoom:c?1+(c.zoom-1)*arrival:1,arrival
  };
}
