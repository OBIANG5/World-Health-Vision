/**
 * Globe orthographique interactif de World Health Vision V2.
 * Frontières : GeoJSON fourni avec le logiciel. Couleurs : présentation
 * géographique (jamais un indice économique ou une donnée de crise).
 */
import {memo,useCallback,useEffect,useRef,useState} from "react";
import type {PointerEvent as PointerEventReact,KeyboardEvent as KeyboardEventReact,WheelEvent as WheelEventReact} from "react";
import type {FeatureCollection,Feature,Geometry} from "geojson";
import type {CountrySummary} from "../../api/types";
import "../../styles/globe.css";

const RAD=Math.PI/180,DEG=180/Math.PI;
const clamp=(x:number,a:number,b:number)=>Math.max(a,Math.min(b,x));
const wrap=(x:number)=>((x+180)%360+360)%360-180;
type Pose={lon:number;lat:number;zoom:number};
type Vec=[number,number,number];
type Pt={x:number;y:number;z:number};
type Ring=number[][];
type Props={countriesMap:Map<string,CountrySummary>;selectedCountryIso3:string;onCountryClick:(iso3:string)=>void};
// Biome-inspired color palette, visual presentation only (not country indicators).
const palette:Record<string,string>={
 "Europe & Central Asia":"#68aa32","Sub-Saharan Africa":"#269149",
 "Middle East & North Africa":"#efae50","East Asia & Pacific":"#499b45",
 "South Asia":"#a4a53d","Latin America & Caribbean":"#36a34e","North America":"#80b246"
};
const vec=(p:number[]):Vec=>[Math.cos(p[1]*RAD)*Math.cos(p[0]*RAD),Math.cos(p[1]*RAD)*Math.sin(p[0]*RAD),Math.sin(p[1]*RAD)];
function project(v:Vec,pose:Pose):Pt{
 const a=pose.lon*RAD,b=pose.lat*RAD,c=Math.cos(a),s=Math.sin(a),cb=Math.cos(b),sb=Math.sin(b);
 return {x:-s*v[0]+c*v[1],y:-sb*c*v[0]-sb*s*v[1]+cb*v[2],z:cb*c*v[0]+cb*s*v[1]+sb*v[2]};
}
export function projectCoordinates(lon:number,lat:number,centerLon:number,centerLat:number):Pt{
 return project(vec([lon,lat]),{lon:centerLon,lat:centerLat,zoom:1});
}
export function inverseProjection(x:number,y:number,centerLon:number,centerLat:number):[number,number]|null{
 if(x*x+y*y>1)return null;
 const z=Math.sqrt(Math.max(0,1-x*x-y*y)),b=centerLat*RAD;
 const lon=wrap(centerLon+Math.atan2(x,z*Math.cos(b)-y*Math.sin(b))*DEG);
 const lat=Math.asin(clamp(z*Math.sin(b)+y*Math.cos(b),-1,1))*DEG;
 return [lon,lat];
}
function rings(geometry:Geometry|null):Ring[][]{
 if(!geometry)return [];
 if(geometry.type==="Polygon")return [geometry.coordinates as Ring[]];
 if(geometry.type==="MultiPolygon")return geometry.coordinates as Ring[][];
 return [];
}
function iso(f:Feature){return String(f.properties?.["ISO3166-1-Alpha-3"]??"");}
function ringContains(lon:number,lat:number,ring:Ring){
 let inside=false;
 for(let i=0,j=ring.length-1;i<ring.length;j=i++){
  const x=wrap(ring[i][0]-lon),xx=wrap(ring[j][0]-lon);
  const y=ring[i][1],yy=ring[j][1];
  if((y>lat)!==(yy>lat) && x+(xx-x)*(lat-y)/(yy-y)>0)inside=!inside;
 }
 return inside;
}
export function geometryContains(lon:number,lat:number,geometry:Geometry|null){
 return rings(geometry).some(poly=>poly.length>0&&ringContains(lon,lat,poly[0])&&!poly.slice(1).some(hole=>ringContains(lon,lat,hole)));
}
function pick(data:FeatureCollection,lon:number,lat:number){
 const feature=data.features.find(f=>geometryContains(lon,lat,f.geometry));
 const code=feature?iso(feature):"";
 return code&&code!=="-99"?code:null;
}
// Cache great-circle interpolation once per real GeoJSON ring: no expensive
// acos/sin rebuilding on every frame of the rotating Earth.
const ringCache=new WeakMap<Ring,Vec[]>();
function sampled(ring:Ring,pose:Pose):Pt[]{
 if(ring.length<3)return [];
 let vectors=ringCache.get(ring);
 if(!vectors){
  vectors=[];
  let prev=vec(ring[ring.length-1]);
  for(const ll of ring){
   const cur=vec(ll),dot=clamp(prev[0]*cur[0]+prev[1]*cur[1]+prev[2]*cur[2],-1,1);
   const angle=Math.acos(dot),sin=Math.sin(angle),steps=Math.max(1,Math.ceil(angle/(7*RAD)));
   for(let i=1;i<=steps;i++){
    const t=i/steps,a=sin>1e-6?Math.sin((1-t)*angle)/sin:1-t,b=sin>1e-6?Math.sin(t*angle)/sin:t;
    vectors.push([a*prev[0]+b*cur[0],a*prev[1]+b*cur[1],a*prev[2]+b*cur[2]]);
   }
   prev=cur;
  }
  ringCache.set(ring,vectors);
 }
 return vectors.map(v=>project(v,pose));
}
function limb(a:Pt,b:Pt):Pt{
 const t=a.z/(a.z-b.z);let x=a.x+t*(b.x-a.x),y=a.y+t*(b.y-a.y);
 const length=Math.hypot(x,y)||1;x/=length;y/=length;
 return {x,y,z:0};
}
function paintRing(ctx:CanvasRenderingContext2D,ring:Ring,pose:Pose,cx:number,cy:number,r:number){
 const pts=sampled(ring,pose);
 if(pts.length<3||pts.every(p=>p.z<=0))return;
 const xx=(p:Pt)=>cx+p.x*r,yy=(p:Pt)=>cy-p.y*r;
 if(pts.every(p=>p.z>=0)){
  ctx.beginPath();ctx.moveTo(xx(pts[0]),yy(pts[0]));
  for(const p of pts.slice(1))ctx.lineTo(xx(p),yy(p));
  ctx.closePath();ctx.fill();ctx.stroke();return;
 }
 const hidden=pts.findIndex(p=>p.z<=0),cycle=pts.slice(hidden).concat(pts.slice(0,hidden));
 let first:Pt|null=null,prev=cycle[0];
 for(let i=1;i<=cycle.length;i++){
  const p=cycle[i%cycle.length];
  if(prev.z<=0&&p.z>0){first=limb(prev,p);ctx.beginPath();ctx.moveTo(xx(first),yy(first));ctx.lineTo(xx(p),yy(p));}
  else if(prev.z>0&&p.z>0){ctx.lineTo(xx(p),yy(p));}
  else if(prev.z>0&&p.z<=0&&first){
   const last=limb(prev,p);ctx.lineTo(xx(last),yy(last));
   const start=Math.atan2(-last.y,last.x),end=Math.atan2(-first.y,first.x);
   const delta=Math.atan2(Math.sin(end-start),Math.cos(end-start));
   ctx.arc(cx,cy,r,start,start+delta,delta<0);ctx.closePath();ctx.fill();ctx.stroke();first=null;
  }
  prev=p;
 }
}
function drawEye(ctx:CanvasRenderingContext2D,w:number,h:number,cx:number,cy:number,r:number){
 // The actual brand emblem: luminous blue outlines around a pure-white sclera.
 const left=cx-r*1.70,right=cx+r*1.70,top=cy-r*1.17,bottom=cy+r*1.17;
 const shape=()=>{
  ctx.beginPath();ctx.moveTo(left,cy);
  ctx.bezierCurveTo(cx-r*.8,cy-r*1.11,cx+r*.8,cy-r*1.11,right,cy);
  ctx.bezierCurveTo(cx+r*.8,cy+r*1.11,cx-r*.8,cy+r*1.11,left,cy);
  ctx.closePath();
 };
 const white=ctx.createLinearGradient(cx,top,cx,bottom);
 white.addColorStop(0,"#f8ffff");white.addColorStop(.35,"#ffffff");
 white.addColorStop(.7,"#ffffff");white.addColorStop(1,"#e3faff");
 ctx.save();
 shape();ctx.fillStyle=white;ctx.fill();
 shape();ctx.shadowColor="#00afff";ctx.shadowBlur=Math.max(12,r*.17);
 ctx.strokeStyle="#03a1ff";ctx.lineWidth=Math.max(8,r*.063);ctx.stroke();
 ctx.shadowBlur=0;
 shape();ctx.strokeStyle="#36e9ff";ctx.lineWidth=Math.max(3,r*.017);ctx.stroke();
 ctx.restore();
 // Subtle deeper blue ribbon outside the cyan light.
 ctx.save();shape();ctx.strokeStyle="rgba(3,61,165,.60)";
 ctx.lineWidth=Math.max(2,r*.036);ctx.stroke();
 ctx.restore();
}
function landColor(region:string,latitude:number){
 // Natural broad biome zones: warm Sahara, vivid equatorial belt, pale far north.
 if(region==="Middle East & North Africa")return "#eab454";
 if(region==="Sub-Saharan Africa")return latitude>11?"#c9a456":latitude< -22?"#bba052":"#278a42";
 if(latitude>66)return "#d2e2c3";
 if(region==="Europe & Central Asia")return latitude>46?"#62a53c":"#7ab73c";
 return palette[region]??(Math.abs(latitude)<25?"#3f9653":"#9bb868");
}
function render(ctx:CanvasRenderingContext2D,w:number,h:number,pose:Pose,geo:FeatureCollection|null,selected:string,hover:string|null,countries:Map<string,CountrySummary>){
 ctx.clearRect(0,0,w,h);
 const cx=w/2,cy=h*.51,r=Math.min(w*.32,h*.41)*pose.zoom;
 // Behind the eye: clean midnight space as on the reference artwork.
 const sky=ctx.createRadialGradient(cx,cy,r*.52,cx,cy,Math.max(w,h)*.79);
 sky.addColorStop(0,"#063981");sky.addColorStop(.56,"#031843");sky.addColorStop(1,"#000621");
 ctx.fillStyle=sky;ctx.fillRect(0,0,w,h);
 for(let i=0;i<95;i++){
  const x=((i*7907+421)%997)/997*w,y=((i*541+153)%991)/991*h;
  const distance=Math.hypot(x-cx,y-cy);
  if(distance<r*1.18)continue;
  const opacity=.18+(i%7)*.075;
  ctx.fillStyle="rgba(218,246,255,"+opacity+")";
  ctx.beginPath();ctx.arc(x,y,i%31===0?1.12:.49,0,Math.PI*2);ctx.fill();
 }
 drawEye(ctx,w,h,cx,cy,r);
 const aura=ctx.createRadialGradient(cx,cy,r*.76,cx,cy,r*1.19);
 aura.addColorStop(0,"rgba(0,194,255,.40)");
 aura.addColorStop(.72,"rgba(0,191,255,.22)");
 aura.addColorStop(1,"rgba(0,204,255,0)");
 ctx.fillStyle=aura;ctx.beginPath();ctx.arc(cx,cy,r*1.21,0,Math.PI*2);ctx.fill();
 const sea=ctx.createRadialGradient(cx-r*.33,cy-r*.36,r*.08,cx+r*.12,cy+r*.06,r*1.15);
 sea.addColorStop(0,"#168de6");sea.addColorStop(.42,"#096cc9");
 sea.addColorStop(.75,"#07469c");sea.addColorStop(1,"#02144d");
 ctx.fillStyle=sea;ctx.beginPath();ctx.arc(cx,cy,r,0,Math.PI*2);ctx.fill();
 ctx.save();ctx.beginPath();ctx.arc(cx,cy,r,0,Math.PI*2);ctx.clip();
 // Quiet ocean currents and subtle polar/atmospheric highlights; no graticule
 // that would cover the vivid earth photo-inspired look.
 ctx.strokeStyle="rgba(156,229,252,.12)";ctx.lineWidth=.6;
 for(let latitude=-75;latitude<=75;latitude+=30){
  ctx.beginPath();let started=false;
  for(let lon=-180;lon<=180;lon+=4){
   const p=projectCoordinates(lon,latitude,pose.lon,pose.lat);
   if(p.z>=0){if(!started)ctx.moveTo(cx+p.x*r,cy-p.y*r);else ctx.lineTo(cx+p.x*r,cy-p.y*r);started=true;}
   else{if(started)ctx.stroke();ctx.beginPath();started=false;}
  }
  if(started)ctx.stroke();
 }
 if(geo){
  const ordinary=geo.features.filter(f=>iso(f)!==selected&&iso(f)!==hover);
  const highlighted=geo.features.filter(f=>iso(f)===selected||iso(f)===hover);
  for(const f of ordinary.concat(highlighted)){
   const code=iso(f),region=countries.get(code)?.regionName??"";
   const polys=rings(f.geometry),outer=polys[0]?.[0];
   const latitude=outer?.length?outer.reduce((sum,p)=>sum+p[1],0)/outer.length:0;
   const active=code===selected,over=code===hover;
   ctx.fillStyle=active?"#90dc55":over?"#d8ed6f":landColor(region,latitude);
   ctx.strokeStyle=active?"#f7ffff":over?"#ffffff":"rgba(248,255,252,.93)";
   ctx.lineWidth=active?2.0:over?1.7:Math.max(.58,r*.0025);
   for(const p of polys)if(p[0])paintRing(ctx,p[0],pose,cx,cy,r);
  }
 }
 // High-frequency light glints and limited cloud strokes; never factual weather.
 ctx.globalAlpha=.12;ctx.strokeStyle="#f4fbff";ctx.lineWidth=Math.max(.6,r*.007);
 for(let k=0;k<16;k++){
  const lat=-52+(k*37)%110,lon=-162+(k*47)%325;
  const p=projectCoordinates(lon,lat,pose.lon,pose.lat);
  if(p.z<.25)continue;
  const x=cx+p.x*r,y=cy-p.y*r;
  ctx.beginPath();ctx.ellipse(x,y,r*.034,r*.008,-.35,0,Math.PI*1.5);ctx.stroke();
 }
 ctx.globalAlpha=1;
 const light=ctx.createRadialGradient(cx-r*.34,cy-r*.45,r*.02,cx-r*.1,cy-r*.15,r*1.35);
 light.addColorStop(0,"rgba(255,255,255,.22)");
 light.addColorStop(.45,"rgba(255,255,255,.03)");
 light.addColorStop(1,"rgba(0,3,25,.50)");
 ctx.fillStyle=light;ctx.fillRect(cx-r,cy-r,r*2,r*2);
 ctx.restore();
 // Electric-blue atmosphere makes the globe read as a single spherical object.
 ctx.save();ctx.shadowColor="#00d9ff";ctx.shadowBlur=Math.max(12,r*.065);
 ctx.beginPath();ctx.arc(cx,cy,r,0,Math.PI*2);
 ctx.strokeStyle="rgba(79,238,255,.98)";ctx.lineWidth=Math.max(2,r*.009);ctx.stroke();
 ctx.restore();
 ctx.strokeStyle="rgba(239,255,255,.55)";ctx.lineWidth=.8;
 ctx.beginPath();ctx.arc(cx,cy,r-2.5,0,Math.PI*2);ctx.stroke();
}
function GlobeMap({selectedCountryIso3,onCountryClick,countriesMap}:Props){
 const canvas=useRef<HTMLCanvasElement>(null);
 const geo=useRef<FeatureCollection|null>(null);
 const pose=useRef<Pose>({lon:13,lat:25,zoom:1});
 const pointers=useRef(new Map<number,{x:number;y:number}>());
 const drag=useRef<{moved:number}|null>(null);
 const pinch=useRef<{distance:number;zoom:number}|null>(null);
 const hovering=useRef<string|null>(null),frame=useRef<number|null>(null);
 const live=useRef({selectedCountryIso3,countriesMap});
 live.current={selectedCountryIso3,countriesMap};
 const [status,setStatus]=useState<"loading"|"ready"|"error">("loading");
 const [hoverName,setHoverName]=useState<string|null>(null);
 const interaction=useRef(0);
 const visible=useRef(true);
 const draw=useCallback(()=>{
  const el=canvas.current,ctx=el?.getContext("2d");
  if(!el||!ctx)return;
  const rect=el.getBoundingClientRect();if(rect.width<1||rect.height<1)return;
  const dpr=Math.min(2,window.devicePixelRatio||1);
  const w=Math.round(rect.width*dpr),h=Math.round(rect.height*dpr);
  if(el.width!==w||el.height!==h){el.width=w;el.height=h;}
  ctx.setTransform(dpr,0,0,dpr,0,0);
  render(ctx,rect.width,rect.height,pose.current,geo.current,live.current.selectedCountryIso3,hovering.current,live.current.countriesMap);
 },[]);
 const schedule=useCallback(()=>{
  if(frame.current!==null)return;
  frame.current=requestAnimationFrame(()=>{frame.current=null;draw();});
 },[draw]);
 useEffect(()=>{
  const ac=new AbortController();
  fetch("/countries.geojson",{signal:ac.signal})
   .then(r=>{if(!r.ok)throw Error("GeoJSON unavailable");return r.json();})
   .then((data:FeatureCollection)=>{
    if(data.type!=="FeatureCollection"||!Array.isArray(data.features)||data.features.length<150)throw Error("Invalid GeoJSON");
    geo.current=data;setStatus("ready");schedule();
   }).catch(e=>{if(!ac.signal.aborted){console.error("Globe geometry:",e);setStatus("error");}});
  return()=>ac.abort();
 },[schedule]);
 useEffect(()=>{
  const obs=new ResizeObserver(schedule);if(canvas.current)obs.observe(canvas.current);
  schedule();return()=>{obs.disconnect();if(frame.current!==null)cancelAnimationFrame(frame.current);frame.current=null;};
 },[schedule]);
 useEffect(()=>{
  const feature=geo.current?.features.find(f=>iso(f)===selectedCountryIso3);
  const mainRing=feature&&rings(feature.geometry).map(p=>p[0]).filter(Boolean).sort((a,b)=>b.length-a.length)[0];
  if(mainRing&&mainRing.length>2){
   const sum:Vec=[0,0,0];
   for(const p of mainRing){
    const v=vec(p);sum[0]+=v[0];sum[1]+=v[1];sum[2]+=v[2];
   }
   const norm=Math.hypot(...sum);
   if(norm>1e-6){
    pose.current.lon=wrap(Math.atan2(sum[1],sum[0])*DEG);
    pose.current.lat=clamp(Math.asin(clamp(sum[2]/norm,-1,1))*DEG,-75,75);
   }
  }
  schedule();
 },[selectedCountryIso3,status,schedule]);
 // Time-capped motion; pause outside viewport and for reduced-motion visitors.
 // No 60fps redraw on idle phones: approximately 15fps, with 0 network use.
 useEffect(()=>{
  const element=canvas.current;if(!element)return;
  const observer=new IntersectionObserver(entries=>{visible.current=!!entries[0]?.isIntersecting;},{threshold:0.03});
  observer.observe(element);
  const reduced=window.matchMedia("(prefers-reduced-motion: reduce)");
  let running=true,anim=0,last=0;
  const tick=(time:number)=>{
   if(!running)return;
   if(visible.current&&!document.hidden&&!reduced.matches&&time-last>=64){
    const elapsed=last?Math.min(time-last,100):64;
    last=time;
    if(performance.now()-interaction.current>1800&&pointers.current.size===0){
     pose.current.lon=wrap(pose.current.lon+elapsed*.0008);
     schedule();
    }
   }
   anim=requestAnimationFrame(tick);
  };
  anim=requestAnimationFrame(tick);
  return()=>{running=false;cancelAnimationFrame(anim);observer.disconnect();};
 },[schedule]);
 const location=(x:number,y:number)=>{
  const r=canvas.current?.getBoundingClientRect();if(!r)return null;
  const radius=Math.min(r.width*.32,r.height*.41)*pose.current.zoom;
  return inverseProjection((x-r.left-r.width/2)/radius,-(y-r.top-r.height*.51)/radius,pose.current.lon,pose.current.lat);
 };
 const hoverAt=(x:number,y:number)=>{
  const p=location(x,y),code=p&&geo.current?pick(geo.current,p[0],p[1]):null;
  if(code!==hovering.current){
   hovering.current=code;setHoverName(code?(live.current.countriesMap.get(code)?.displayName??code):null);schedule();
  }
 };
 const down=(e:PointerEventReact<HTMLCanvasElement>)=>{
  interaction.current=performance.now();
  e.currentTarget.setPointerCapture(e.pointerId);
  pointers.current.set(e.pointerId,{x:e.clientX,y:e.clientY});
  if(pointers.current.size===1)drag.current={moved:0};
  if(pointers.current.size===2){
   const p=[...pointers.current.values()];
   pinch.current={distance:Math.hypot(p[0].x-p[1].x,p[0].y-p[1].y),zoom:pose.current.zoom};
   drag.current=null;
  }
 };
 const move=(e:PointerEventReact<HTMLCanvasElement>)=>{
  interaction.current=performance.now();
  const prev=pointers.current.get(e.pointerId);
  if(!prev){if(e.pointerType==="mouse")hoverAt(e.clientX,e.clientY);return;}
  pointers.current.set(e.pointerId,{x:e.clientX,y:e.clientY});
  if(pointers.current.size===2&&pinch.current){
   const p=[...pointers.current.values()],d=Math.hypot(p[0].x-p[1].x,p[0].y-p[1].y);
   if(pinch.current.distance>0)pose.current.zoom=clamp(pinch.current.zoom*d/pinch.current.distance,.75,1.25);
  }else if(drag.current){
   const rect=canvas.current?.getBoundingClientRect();
   const radius=rect?Math.max(80,Math.min(rect.width*.32,rect.height*.41)):180;
   const dx=e.clientX-prev.x,dy=e.clientY-prev.y;
   drag.current.moved+=Math.hypot(dx,dy);
   if(drag.current.moved>5){
    pose.current.lon=wrap(pose.current.lon-dx/radius*68);
    pose.current.lat=clamp(pose.current.lat+dy/radius*55,-80,80);
   }
  }
  schedule();
 };
 const up=(e:PointerEventReact<HTMLCanvasElement>)=>{
  const tap=pointers.current.size===1&&!!drag.current&&drag.current.moved<8;
  pointers.current.delete(e.pointerId);pinch.current=null;drag.current=null;
  if(tap){
   const p=location(e.clientX,e.clientY),code=p&&geo.current?pick(geo.current,p[0],p[1]):null;
   if(code)onCountryClick(code);
  }
  if(e.currentTarget.hasPointerCapture(e.pointerId))e.currentTarget.releasePointerCapture(e.pointerId);
 };
 const wheel=(e:WheelEventReact<HTMLCanvasElement>)=>{
  interaction.current=performance.now();
  e.preventDefault();pose.current.zoom=clamp(pose.current.zoom*(e.deltaY>0?.93:1.07),.82,1.18);schedule();
 };
 const keys=(e:KeyboardEventReact<HTMLCanvasElement>)=>{
  interaction.current=performance.now();
  if(e.key==="ArrowLeft")pose.current.lon=wrap(pose.current.lon-12);
  else if(e.key==="ArrowRight")pose.current.lon=wrap(pose.current.lon+12);
  else if(e.key==="ArrowUp")pose.current.lat=clamp(pose.current.lat+9,-80,80);
  else if(e.key==="ArrowDown")pose.current.lat=clamp(pose.current.lat-9,-80,80);
  else if(e.key==="+"||e.key==="=")pose.current.zoom=clamp(pose.current.zoom+.09,.82,1.18);
  else if(e.key==="-")pose.current.zoom=clamp(pose.current.zoom-.09,.82,1.18);
  else return;
  e.preventDefault();schedule();
 };
 const zoom=(step:number)=>{interaction.current=performance.now();pose.current.zoom=clamp(pose.current.zoom+step,.82,1.18);schedule();};
 return <div className="whv-globe-shell">
  <canvas ref={canvas} className="whv-globe-canvas" role="application" tabIndex={0}
   aria-label="Globe terrestre interactif. Glisser pour tourner, toucher un pays pour ouvrir sa fiche, flèches pour tourner, plus et moins pour zoomer."
   onPointerDown={down} onPointerMove={move} onPointerUp={up} onPointerCancel={up}
   onWheel={wheel} onKeyDown={keys}/>
  <div className="whv-globe-topline" aria-hidden="true"><span className="whv-globe-signal"/>WORLD VISION · TERRE INTERACTIVE</div>
  {status!=="ready"&&<div className="whv-globe-status" role="status">
   {status==="loading"?"Chargement des frontières réelles…":"Frontières indisponibles — rechargez la page."}
  </div>}
  <div className="whv-globe-hint" aria-live="polite">{hoverName??"Tournez le globe · touchez un pays"}</div>
  <div className="whv-globe-zoom" aria-label="Zoom du globe">
   <button type="button" aria-label="Agrandir le globe" onClick={()=>zoom(.12)}>+</button>
   <button type="button" aria-label="Réduire le globe" onClick={()=>zoom(-.12)}>−</button>
  </div>
  <div className="whv-globe-disclaimer">Couleurs géographiques · pas de données simulées</div>
 </div>;
}
export default memo(GlobeMap);
