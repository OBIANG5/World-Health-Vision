/**
 * World-Vision geographic targeting core.
 * Pure ES module: no browser globals, no service keys, no network.
 * The same maths can be used by the React preview and future Remotion renderer.
 *
 * GeoJSON polygons are editorial reference geometry, not diplomatic endorsement.
 * A country representative point is NOT a verified event coordinate.
 */
export const START_POSE = Object.freeze({lon:-9,lat:16});
export const GEO_TARGETING_VERSION = "wv-geotarget-1";

export function normalizeLongitude(lon) {
  if (!Number.isFinite(lon)) throw new TypeError("Invalid longitude");
  const wrapped=((lon+180)%360+360)%360-180;
  return wrapped===-180&&lon>0?180:wrapped;
}
export function assertCoordinate(lon,lat) {
  if (!Number.isFinite(lon)||!Number.isFinite(lat)||lat< -90||lat>90||lon< -180||lon>180) {
    throw new RangeError("Longitude must be in [-180,180], latitude in [-90,90]");
  }
  return {lon,lat};
}
export function easeCinematic(t) {
  const p=Math.min(1,Math.max(0,Number.isFinite(t)?t:0));
  return p*p*p*(p*(p*6-15)+10);
}
const radians=d=>d*Math.PI/180;
const degrees=r=>r*180/Math.PI;
function vector({lon,lat}){
  const phi=radians(lat),lam=radians(lon);
  return [Math.cos(phi)*Math.cos(lam),Math.cos(phi)*Math.sin(lam),Math.sin(phi)];
}
function fromVector([x,y,z]){
  const d=Math.hypot(x,y,z)||1;
  return {lon:normalizeLongitude(degrees(Math.atan2(y,x))),lat:degrees(Math.asin(Math.max(-1,Math.min(1,z/d))))};
}
function cross(a,b){return [a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]];}
function norm(v){const d=Math.hypot(...v)||1;return v.map(x=>x/d);}
export function interpolateGlobe(from,to,progress){
  assertCoordinate(from.lon,from.lat);assertCoordinate(to.lon,to.lat);
  const t=easeCinematic(progress);
  if(t<=0)return {lon:normalizeLongitude(from.lon),lat:from.lat};
  if(t>=1)return {lon:normalizeLongitude(to.lon),lat:to.lat};
  const a=vector(from),b=vector(to);
  const dot=Math.max(-1,Math.min(1,a[0]*b[0]+a[1]*b[1]+a[2]*b[2]));
  const omega=Math.acos(dot);
  if(omega<1e-8)return {lon:normalizeLongitude(from.lon),lat:from.lat};
  // Antipodal destinations require a deterministic great-circle plane.
  // The normal axis is chosen independently of the starting longitude.
  if(Math.PI-omega<1e-6){
    const axis=norm(cross(a,Math.abs(a[2])<.9?[0,0,1]:[0,1,0]));
    const angle=Math.PI*t;
    return fromVector(a.map((v,i)=>v*Math.cos(angle)+axis[i]*Math.sin(angle)));
  }
  const da=Math.sin((1-t)*omega)/Math.sin(omega);
  const db=Math.sin(t*omega)/Math.sin(omega);
  return fromVector(a.map((v,i)=>v*da+b[i]*db));
}
function unwrappedRing(ring){
  if(!Array.isArray(ring))return [];
  const result=[];
  for(const point of ring){
    if(!Array.isArray(point)||!Number.isFinite(point[0])||!Number.isFinite(point[1]))continue;
    const lon=normalizeLongitude(point[0]),lat=point[1];
    if(result.length){
      let x=lon;
      while(x-result[result.length-1][0]>180)x-=360;
      while(x-result[result.length-1][0]< -180)x+=360;
      result.push([x,lat]);
    }else result.push([lon,lat]);
  }
  return result;
}
function ringStats(ring){
  const points=unwrappedRing(ring);
  if(points.length<3)return null;
  let twiceArea=0,cx=0,cy=0;
  for(let i=0;i<points.length;i++){
    const p=points[i],q=points[(i+1)%points.length];
    const cross=p[0]*q[1]-q[0]*p[1];
    twiceArea+=cross;cx+=(p[0]+q[0])*cross;cy+=(p[1]+q[1])*cross;
  }
  if(Math.abs(twiceArea)<1e-9)return null;
  const center=[cx/(3*twiceArea),cy/(3*twiceArea)];
  const minLat=Math.min(...points.map(p=>p[1]));
  const maxLat=Math.max(...points.map(p=>p[1]));
  const area=Math.abs(twiceArea*.5)*Math.max(.08,Math.cos(radians((minLat+maxLat)/2)));
  return {points,center,area};
}
function insideRing(point,ring){
  let inside=false;
  for(let i=0,j=ring.length-1;i<ring.length;j=i++){
    const a=ring[i],b=ring[j];
    if((a[1]>point[1])!==(b[1]>point[1]) &&
      point[0]<(b[0]-a[0])*(point[1]-a[1])/(b[1]-a[1])+a[0])inside=!inside;
  }
  return inside;
}
function stableInteriorPoint(stats){
  if(insideRing(stats.center,stats.points))return stats.center;
  const ring=stats.points;
  const xs=ring.map(p=>p[0]),ys=ring.map(p=>p[1]);
  const minX=Math.min(...xs),maxX=Math.max(...xs),minY=Math.min(...ys),maxY=Math.max(...ys);
  // Prefer a deterministic interior sample near the area centroid.
  let chosen=null,lowest=Infinity;
  for(let y=1;y<=13;y++)for(let x=1;x<=13;x++){
    const point=[minX+(maxX-minX)*x/14,minY+(maxY-minY)*y/14];
    if(!insideRing(point,ring))continue;
    const score=Math.hypot((point[0]-stats.center[0])*Math.cos(radians(point[1])),point[1]-stats.center[1]);
    if(score<lowest){lowest=score;chosen=point;}
  }
  // A point between first vertex and its neighbor is near the boundary;
  // a triangle barycentre can be inside a complex polygon more often.
  return chosen||ring[0];
}
function largestOuterRing(geometry){
  if(!geometry||!Array.isArray(geometry.coordinates))return null;
  const outers=geometry.type==="Polygon"
    ?[geometry.coordinates[0]]
    :geometry.type==="MultiPolygon"
      ?geometry.coordinates.map(poly=>poly?.[0])
      :[];
  return outers.map(ringStats).filter(Boolean).sort((a,b)=>b.area-a.area)[0]||null;
}
/**
 * Discover countries from checked ISO3 GeoJSON. Excludes pseudo regions like -99.
 * Auto-centres are only approximate country representative points; an actual
 * news event must provide its OWN verified latitude/longitude when available.
 */
export function listCountryTargets(collection) {
  if(collection?.type!=="FeatureCollection"||!Array.isArray(collection.features))
    throw new TypeError("Invalid GeoJSON feature collection");
  const items=new Map();
  for(const feature of collection.features){
    const iso=String(feature?.properties?.["ISO3166-1-Alpha-3"]||"").toUpperCase();
    const name=String(feature?.properties?.name||"").trim();
    if(!/^[A-Z]{3}$/.test(iso)||!name)continue;
    const ring=largestOuterRing(feature.geometry);
    if(!ring)continue;
    const [rawLon,lat]=stableInteriorPoint(ring);
    const lon=normalizeLongitude(rawLon);
    if(!Number.isFinite(lat)||lat< -90||lat>90)continue;
    const current=items.get(iso);
    if(!current||ring.area>current.weight)items.set(iso,{iso3:iso,name,lon,lat,weight:ring.area});
  }
  return [...items.values()].map(({weight,...target})=>target).sort((a,b)=>a.name.localeCompare(b.name,"fr"));
}
export function targetForStory(story,countries){
  const iso=typeof story?.country_iso3==="string"?story.country_iso3.trim().toUpperCase():"";
  if(!/^[A-Z]{3}$/.test(iso))return null; // World/no geographic focus: do not invent.
  return countries.find(c=>c.iso3===iso)||null;
}
