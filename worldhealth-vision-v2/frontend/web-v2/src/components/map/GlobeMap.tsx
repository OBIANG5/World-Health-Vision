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
const palette:Record<string,string>={
 "Europe & Central Asia":"#b9ad86","Sub-Saharan Africa":"#c77e60",
 "Middle East & North Africa":"#c49c75","East Asia & Pacific":"#8ba4a1",
 "South Asia":"#a6b198","Latin America & Caribbean":"#bd9e7e","North America":"#859b9c"
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
function sampled(ring:Ring,pose:Pose):Pt[]{
 const points:Pt[]=[];if(ring.length<3)return points;
 let prev=vec(ring[ring.length-1]);
 for(const ll of ring){
  const cur=vec(ll),dot=clamp(prev[0]*cur[0]+prev[1]*cur[1]+prev[2]*cur[2],-1,1);
  const angle=Math.acos(dot),sin=Math.sin(angle),steps=Math.max(1,Math.ceil(angle/(5*RAD)));
  for(let i=1;i<=steps;i++){
   const t=i/steps,a=sin>1e-6?Math.sin((1-t)*angle)/sin:1-t,b=sin>1e-6?Math.sin(t*angle)/sin:t;
   points.push(project([a*prev[0]+b*cur[0],a*prev[1]+b*cur[1],a*prev[2]+b*cur[2]],pose));
  }
  prev=cur;
 }
 return points;
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
function render(ctx:CanvasRenderingContext2D,w:number,h:number,pose:Pose,geo:FeatureCollection|null,selected:string,hover:string|null,countries:Map<string,CountrySummary>){
 ctx.clearRect(0,0,w,h);
 const cx=w/2,cy=h*.51,r=Math.min(w*.39,h*.425)*pose.zoom;
 for(let i=0;i<150;i++){
  const x=((i*7919+379)%997)/997*w,y=((i*541+123)%991)/991*h;
  if(Math.hypot(x-cx,y-cy)<r*1.11)continue;
  ctx.fillStyle="rgba(213,236,255,"+(.15+(i%5)*.075)+")";
  ctx.beginPath();ctx.arc(x,y,i%19===0?1.05:.5,0,Math.PI*2);ctx.fill();
 }
 const atmosphere=ctx.createRadialGradient(cx,cy,r*.78,cx,cy,r*1.35);
 atmosphere.addColorStop(0,"rgba(52,138,207,.36)");atmosphere.addColorStop(.8,"rgba(20,101,176,.08)");atmosphere.addColorStop(1,"rgba(0,0,0,0)");
 ctx.fillStyle=atmosphere;ctx.beginPath();ctx.arc(cx,cy,r*1.35,0,Math.PI*2);ctx.fill();
 const sea=ctx.createLinearGradient(cx-r,cy-r,cx+r,cy+r);
 sea.addColorStop(0,"#28648b");sea.addColorStop(.5,"#184467");sea.addColorStop(1,"#081e38");
 ctx.fillStyle=sea;ctx.beginPath();ctx.arc(cx,cy,r,0,Math.PI*2);ctx.fill();
 ctx.save();ctx.beginPath();ctx.arc(cx,cy,r,0,Math.PI*2);ctx.clip();
 ctx.strokeStyle="rgba(185,226,253,.12)";ctx.lineWidth=.55;
 for(let latitude=-75;latitude<=75;latitude+=15){
  ctx.beginPath();let started=false;
  for(let longitude=-180;longitude<=180;longitude+=3){
   const p=projectCoordinates(longitude,latitude,pose.lon,pose.lat);
   if(p.z>=0){if(!started)ctx.moveTo(cx+p.x*r,cy-p.y*r);else ctx.lineTo(cx+p.x*r,cy-p.y*r);started=true;}
   else {if(started)ctx.stroke();ctx.beginPath();started=false;}
  }
  if(started)ctx.stroke();
 }
 for(let longitude=-180;longitude<180;longitude+=15){
  ctx.beginPath();let started=false;
  for(let latitude=-90;latitude<=90;latitude+=3){
   const p=projectCoordinates(longitude,latitude,pose.lon,pose.lat);
   if(p.z>=0){if(!started)ctx.moveTo(cx+p.x*r,cy-p.y*r);else ctx.lineTo(cx+p.x*r,cy-p.y*r);started=true;}
   else {if(started)ctx.stroke();ctx.beginPath();started=false;}
  }
  if(started)ctx.stroke();
 }
 if(geo){
  const ordinary=geo.features.filter(f=>iso(f)!==selected&&iso(f)!==hover);
  const highlighted=geo.features.filter(f=>iso(f)===selected||iso(f)===hover);
  for(const f of ordinary.concat(highlighted)){
   const code=iso(f),region=countries.get(code)?.regionName??"";
   const active=code===selected,over=code===hover;
   ctx.fillStyle=active?"#44a9e9":over?"#90d6f8":palette[region]??"#91a7a4";
   ctx.strokeStyle=active?"#d0f1ff":over?"#d3f3ff":"rgba(13,37,48,.55)";
   ctx.lineWidth=active?1.5:over?1.2:.48;
   for(const p of rings(f.geometry))if(p[0])paintRing(ctx,p[0],pose,cx,cy,r);
  }
 }
 const shadow=ctx.createLinearGradient(cx-r,cy-r*.8,cx+r,cy+r);
 shadow.addColorStop(0,"rgba(205,239,255,.11)");shadow.addColorStop(.45,"rgba(9,18,37,0)");shadow.addColorStop(.82,"rgba(1,8,23,.15)");shadow.addColorStop(1,"rgba(0,4,18,.68)");
 ctx.fillStyle=shadow;ctx.fillRect(cx-r,cy-r,r*2,r*2);
 const light=ctx.createRadialGradient(cx-r*.4,cy-r*.45,r*.03,cx-r*.2,cy-r*.25,r*1.5);
 light.addColorStop(0,"rgba(210,242,255,.13)");light.addColorStop(1,"rgba(0,0,0,0)");
 ctx.fillStyle=light;ctx.fillRect(cx-r,cy-r,r*2,r*2);
 ctx.restore();
 ctx.strokeStyle="rgba(138,211,251,.5)";ctx.lineWidth=1.5;
 ctx.beginPath();ctx.arc(cx,cy,r,0,Math.PI*2);ctx.stroke();
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
  const c=countriesMap.get(selectedCountryIso3);
  if(c&&typeof c.longitude==="number"&&typeof c.latitude==="number"&&Math.abs(c.longitude)<=180&&Math.abs(c.latitude)<=90){
   pose.current.lon=wrap(c.longitude);pose.current.lat=clamp(c.latitude,-75,75);
  }
  schedule();
 },[selectedCountryIso3,countriesMap,schedule]);
 const location=(x:number,y:number)=>{
  const r=canvas.current?.getBoundingClientRect();if(!r)return null;
  const radius=Math.min(r.width*.39,r.height*.425)*pose.current.zoom;
  return inverseProjection((x-r.left-r.width/2)/radius,-(y-r.top-r.height*.51)/radius,pose.current.lon,pose.current.lat);
 };
 const hoverAt=(x:number,y:number)=>{
  const p=location(x,y),code=p&&geo.current?pick(geo.current,p[0],p[1]):null;
  if(code!==hovering.current){
   hovering.current=code;setHoverName(code?(live.current.countriesMap.get(code)?.displayName??code):null);schedule();
  }
 };
 const down=(e:PointerEventReact<HTMLCanvasElement>)=>{
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
  const prev=pointers.current.get(e.pointerId);
  if(!prev){if(e.pointerType==="mouse")hoverAt(e.clientX,e.clientY);return;}
  pointers.current.set(e.pointerId,{x:e.clientX,y:e.clientY});
  if(pointers.current.size===2&&pinch.current){
   const p=[...pointers.current.values()],d=Math.hypot(p[0].x-p[1].x,p[0].y-p[1].y);
   if(pinch.current.distance>0)pose.current.zoom=clamp(pinch.current.zoom*d/pinch.current.distance,.75,1.25);
  }else if(drag.current){
   const rect=canvas.current?.getBoundingClientRect();
   const radius=rect?Math.max(80,Math.min(rect.width*.39,rect.height*.425)):180;
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
  e.preventDefault();pose.current.zoom=clamp(pose.current.zoom*(e.deltaY>0?.93:1.07),.75,1.25);schedule();
 };
 const keys=(e:KeyboardEventReact<HTMLCanvasElement>)=>{
  if(e.key==="ArrowLeft")pose.current.lon=wrap(pose.current.lon-12);
  else if(e.key==="ArrowRight")pose.current.lon=wrap(pose.current.lon+12);
  else if(e.key==="ArrowUp")pose.current.lat=clamp(pose.current.lat+9,-80,80);
  else if(e.key==="ArrowDown")pose.current.lat=clamp(pose.current.lat-9,-80,80);
  else if(e.key==="+"||e.key==="=")pose.current.zoom=clamp(pose.current.zoom+.09,.75,1.25);
  else if(e.key==="-")pose.current.zoom=clamp(pose.current.zoom-.09,.75,1.25);
  else return;
  e.preventDefault();schedule();
 };
 const zoom=(step:number)=>{pose.current.zoom=clamp(pose.current.zoom+step,.75,1.25);schedule();};
 return <div className="whv-globe-shell">
  <canvas ref={canvas} className="whv-globe-canvas" role="application" tabIndex={0}
   aria-label="Globe terrestre interactif. Glisser pour tourner, toucher un pays pour ouvrir sa fiche, flèches pour tourner, plus et moins pour zoomer."
   onPointerDown={down} onPointerMove={move} onPointerUp={up} onPointerCancel={up}
   onWheel={wheel} onKeyDown={keys}/>
  <div className="whv-globe-topline" aria-hidden="true"><span className="whv-globe-signal"/>EXPLORATION MONDIALE</div>
  {status!=="ready"&&<div className="whv-globe-status" role="status">
   {status==="loading"?"Chargement des frontières réelles…":"Frontières indisponibles — utilisez la vue Carte œil."}
  </div>}
  <div className="whv-globe-hint" aria-live="polite">{hoverName??"Tournez le globe · touchez un pays"}</div>
  <div className="whv-globe-zoom" aria-label="Zoom du globe">
   <button type="button" aria-label="Agrandir le globe" onClick={()=>zoom(.12)}>+</button>
   <button type="button" aria-label="Réduire le globe" onClick={()=>zoom(-.12)}>−</button>
  </div>
  <div className="whv-globe-disclaimer">Couleurs géographiques · aucune statistique simulée</div>
 </div>;
}
export default memo(GlobeMap);
