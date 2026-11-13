/**
 * World-Vision's first independently implemented geographic style-frame globe.
 *
 * NOT a video, not a photorealistic Earth render and not copied from
 * @focus.geopolitique. Countries use the V2 application's own GeoJSON.
 *
 * Render the frame as a still: the owner approves each scene before motion.
 */
import {useEffect, useRef, useState} from "react";

type Position=[number,number];
type GeoFeature={
  type:"Feature";
  properties?:Record<string,unknown>;
  geometry?:{type:string;coordinates:unknown}|null;
};
type FeatureCollection={type:"FeatureCollection";features:GeoFeature[]};
type GlobePose={
  centerLon:number;centerLat:number;
  radiusRatio?:number;
  target?:Position;
  label?:string;
  highlightTurkey?:boolean;
};

let cachedFeatures:FeatureCollection|null=null;
let fetchPromise:Promise<FeatureCollection>|null=null;
function loadCountries():Promise<FeatureCollection>{
  if(cachedFeatures)return Promise.resolve(cachedFeatures);
  if(!fetchPromise)fetchPromise=fetch("./countries.geojson")
    .then(async response=>{
      if(!response.ok)throw new Error(`GeoJSON HTTP ${response.status}`);
      const data=await response.json() as FeatureCollection;
      if(data.type!=="FeatureCollection"||!Array.isArray(data.features))throw new Error("Pays GeoJSON invalide");
      cachedFeatures=data;
      return data;
    }).catch(error=>{fetchPromise=null;throw error});
  return fetchPromise;
}
const toRadian=(v:number)=>v*Math.PI/180;
function pointToSphere(lon:number,lat:number,cLon:number,cLat:number,r:number){
  const lambda=toRadian(lon-cLon),phi=toRadian(lat),phi0=toRadian(cLat);
  const depth=Math.sin(phi0)*Math.sin(phi)+Math.cos(phi0)*Math.cos(phi)*Math.cos(lambda);
  return {
    x:r*Math.cos(phi)*Math.sin(lambda),
    y:-r*(Math.cos(phi0)*Math.sin(phi)-Math.sin(phi0)*Math.cos(phi)*Math.cos(lambda)),
    depth,
  };
}
type Projected={x:number;y:number;depth:number};
function visibleFragment(
  ctx:CanvasRenderingContext2D,coords:Position[],project:(p:Position)=>Projected
){
  let open=false,prev:Position|null=null,prevProjected:Projected|null=null;
  for(const point of coords){
    if(!Array.isArray(point)||point.length<2)continue;
    const current=project(point),vis=current.depth>=0.005;
    if(prev&&prevProjected){
      const prevVis=prevProjected.depth>=0.005;
      if(vis!==prevVis){
        // Horizon clipping: binary-search boundary in longitude and latitude.
        let left=0,right=1;
        const [lon0,lat0]=prev,[lon1,lat1]=point;
        let dLon=lon1-lon0;
        if(dLon>180)dLon-=360;
        if(dLon< -180)dLon+=360;
        for(let i=0;i<10;i++){
          const mid=(left+right)/2;
          const p:Position=[lon0+dLon*mid,lat0+(lat1-lat0)*mid];
          const v=project(p);
          if((v.depth>=0.005)===prevVis)left=mid;else right=mid;
        }
        const cut=project([lon0+dLon*(left+right)/2,lat0+(lat1-lat0)*(left+right)/2]);
        if(prevVis){ctx.lineTo(cut.x,cut.y);open=false;}
        else{ctx.moveTo(cut.x,cut.y);open=true;}
      }
    }
    if(vis){
      if(!open){ctx.moveTo(current.x,current.y);open=true;}
      else ctx.lineTo(current.x,current.y);
    }else if(!prevProjected)open=false;
    prev=point;prevProjected=current;
  }
}
function contours(feature:GeoFeature):Position[][]{
  if(!feature.geometry)return [];
  const {type,coordinates}=feature.geometry;
  if(type==="Polygon"&&Array.isArray(coordinates))
    return coordinates.map(ring=>ring as Position[]).filter(Array.isArray);
  if(type==="MultiPolygon"&&Array.isArray(coordinates))
    return coordinates.flatMap(poly=>Array.isArray(poly)?poly.map(ring=>ring as Position[]):[]);
  return [];
}
function isTurkey(feature:GeoFeature){
  const p=feature.properties||{};
  const name=String(p.name||p.NAME||p.ADMIN||p.admin||p.NAME_EN||"").toLowerCase();
  return name.includes("turkey")||name.includes("türkiye")||name==="turkiye";
}

type Texture={width:number;height:number;pixels:Uint8ClampedArray};
const landTextures=new Map<string,Texture>();
function buildTexture(data:FeatureCollection,highlight:boolean):Texture{
  const key=highlight?"high":"base";
  const existing=landTextures.get(key);
  if(existing)return existing;
  const canvas=document.createElement("canvas");
  const width=1440,height=720;canvas.width=width;canvas.height=height;
  const ctx=canvas.getContext("2d",{willReadFrequently:true});
  if(!ctx)throw new Error("2D canvas texture unavailable");
  // Land geometry is first rasterized in longitude/latitude space.
  // Reprojecting individual pixels onto the sphere avoids the huge
  // antimeridian/horizon triangles of naïve vector clipping.
  const xOf=(lon:number)=>(lon+180)/360*width;
  const yOf=(lat:number)=>(90-lat)/180*height;
  for(const feature of data.features){
    const selected=highlight&&isTurkey(feature);
    ctx.fillStyle=selected?"#e5af53":"#abc9ad";
    ctx.strokeStyle=selected?"#f9e1a4":"#6b9b8e";
    ctx.lineWidth=selected?2.2:0.75;
    for(const ring of contours(feature)){
      let previousX:number|null=null;
      let hasPoints=false;
      ctx.beginPath();
      for(const item of ring){
        if(!Array.isArray(item)||item.length<2)continue;
        const x=xOf(item[0]),y=yOf(item[1]);
        if(previousX!==null&&Math.abs(x-previousX)>width*.48){
          if(hasPoints){ctx.closePath();ctx.fill();ctx.stroke();}
          ctx.beginPath();ctx.moveTo(x,y);hasPoints=true;
        }else if(!hasPoints){ctx.moveTo(x,y);hasPoints=true;}
        else ctx.lineTo(x,y);
        previousX=x;
      }
      if(hasPoints){ctx.closePath();ctx.fill();ctx.stroke();}
    }
  }
  const result={width,height,pixels:ctx.getImageData(0,0,width,height).data};
  landTextures.set(key,result);
  return result;
}
function drawLandOnSphere(
  ctx:CanvasRenderingContext2D,w:number,h:number,r:number,cx:number,cy:number,
  cLon:number,cLat:number,data:FeatureCollection,highlight:boolean
){
  const texture=buildTexture(data,highlight);
  const layer=document.createElement("canvas");
  layer.width=Math.ceil(w);layer.height=Math.ceil(h);
  const output=layer.getContext("2d");
  if(!output)return;
  const image=output.createImageData(layer.width,layer.height);
  const phi0=toRadian(cLat),sin0=Math.sin(phi0),cos0=Math.cos(phi0);
  const minX=Math.max(0,Math.floor(cx-r)),maxX=Math.min(layer.width,Math.ceil(cx+r));
  const minY=Math.max(0,Math.floor(cy-r)),maxY=Math.min(layer.height,Math.ceil(cy+r));
  for(let y=minY;y<maxY;y++){
    const yn=-(y+.5-cy)/r;
    for(let x=minX;x<maxX;x++){
      const xn=(x+.5-cx)/r;
      const rho2=xn*xn+yn*yn;
      if(rho2>=.9999)continue;
      const rho=Math.sqrt(rho2);
      const c=Math.asin(rho);
      const sinc=Math.sin(c),cosc=Math.cos(c);
      const lat=Math.asin(cosc*sin0+(rho>0?yn*sinc*cos0/rho:0));
      let lon=toRadian(cLon)+(rho>0?Math.atan2(xn*sinc,rho*cos0*cosc-yn*sin0*sinc):0);
      lon=((lon+Math.PI)%(2*Math.PI)+2*Math.PI)%(2*Math.PI)-Math.PI;
      const tx=Math.min(texture.width-1,Math.max(0,Math.floor((lon+Math.PI)/(2*Math.PI)*texture.width)));
      const ty=Math.min(texture.height-1,Math.max(0,Math.floor((Math.PI/2-lat)/Math.PI*texture.height)));
      const source=(ty*texture.width+tx)*4;
      const alpha=texture.pixels[source+3];
      if(alpha===0)continue;
      const dest=(y*layer.width+x)*4;
      // Very subtle daylight lift towards the apparent sphere's upper-left.
      const brightness=0.83+0.18*(1-rho2)+0.045*Math.max(0,-xn-yn);
      image.data[dest]=Math.min(255,texture.pixels[source]*brightness);
      image.data[dest+1]=Math.min(255,texture.pixels[source+1]*brightness);
      image.data[dest+2]=Math.min(255,texture.pixels[source+2]*brightness);
      image.data[dest+3]=alpha;
    }
  }
  output.putImageData(image,0,0);
  ctx.drawImage(layer,0,0,w,h);
}
function paint(
 ctx:CanvasRenderingContext2D,w:number,h:number,pose:GlobePose,data:FeatureCollection|null
){
  const ratio=pose.radiusRatio??0.42;
  const r=Math.min(w*ratio,h*.395);
  const cx=w*.5,cy=h*.49;
  ctx.clearRect(0,0,w,h);
  // Full-bleed warm newsroom backdrop; no lifeless black void.
  const bg=ctx.createLinearGradient(0,0,w,h);
  bg.addColorStop(0,"#f1f9fa");bg.addColorStop(.54,"#d9e9ef");bg.addColorStop(1,"#bcd6e5");
  ctx.fillStyle=bg;ctx.fillRect(0,0,w,h);
  const outer=ctx.createRadialGradient(cx-r*.17,cy-r*.22,r*.53,cx,cy,r*1.22);
  outer.addColorStop(0,"rgba(76,159,185,0)");outer.addColorStop(.72,"rgba(58,134,178,.16)");
  outer.addColorStop(1,"rgba(23,105,158,0)");
  ctx.fillStyle=outer;ctx.fillRect(0,0,w,h);

  // Soft atmospheric rim.
  ctx.save();ctx.shadowColor="rgba(26,121,166,.33)";ctx.shadowBlur=r*.15;
  ctx.fillStyle="#d1f0fa";ctx.beginPath();ctx.arc(cx,cy,r+1,0,2*Math.PI);ctx.fill();ctx.restore();
  ctx.save();ctx.beginPath();ctx.arc(cx,cy,r,0,Math.PI*2);ctx.clip();
  const sea=ctx.createRadialGradient(cx-r*.49,cy-r*.5,r*.06,cx+r*.18,cy+r*.18,r*1.6);
  sea.addColorStop(0,"#95cedd");sea.addColorStop(.34,"#3d9bb7");
  sea.addColorStop(.68,"#126887");sea.addColorStop(1,"#17465f");
  ctx.fillStyle=sea;ctx.fillRect(cx-r,cy-r,r*2,r*2);
  const proj=(p:Position)=> {
    const q=pointToSphere(p[0],p[1],pose.centerLon,pose.centerLat,r);
    return {...q,x:cx+q.x,y:cy+q.y};
  };
  // Longitudes and latitude grid: quiet detail, not a technical overlay.
  ctx.strokeStyle="rgba(219,245,248,.19)";ctx.lineWidth=Math.max(.48,w/850);
  for(let lat=-75;lat<=75;lat+=15){
    ctx.beginPath();visibleFragment(ctx,Array.from({length:181},(_,i)=>[-180+i*2,lat] as Position),proj);
    ctx.stroke();
  }
  for(let lon=-180;lon<180;lon+=20){
    ctx.beginPath();visibleFragment(ctx,Array.from({length:181},(_,i)=>[lon,-90+i] as Position),proj);
    ctx.stroke();
  }
  if(data){
    drawLandOnSphere(ctx,w,h,r,cx,cy,pose.centerLon,pose.centerLat,data,Boolean(pose.highlightTurkey));
  }else{
    ctx.fillStyle="rgba(238,255,252,.6)";
    ctx.font=`600 ${Math.max(10,Math.round(w*.035))}px sans-serif`;
    ctx.textAlign="center";ctx.fillText("CHARGEMENT DE LA CARTE…",cx,cy+3);
  }
  // Directional atmosphere and a very soft limb shadow.
  const limb=ctx.createRadialGradient(cx-r*.22,cy-r*.32,r*.34,cx+r*.16,cy+r*.16,r*1.25);
  limb.addColorStop(0,"rgba(255,255,255,.22)");
  limb.addColorStop(.53,"rgba(20,56,84,0)");
  limb.addColorStop(.94,"rgba(0,23,42,.25)");
  limb.addColorStop(1,"rgba(0,23,42,.50)");
  ctx.fillStyle=limb;ctx.fillRect(cx-r,cy-r,r*2,r*2);
  ctx.restore();
  ctx.strokeStyle="rgba(243,255,255,.9)";
  ctx.lineWidth=Math.max(1,w*.006);ctx.beginPath();ctx.arc(cx,cy,r,0,Math.PI*2);ctx.stroke();

  if(pose.target){
    const target=proj(pose.target);
    if(target.depth>0){
      const rr=Math.max(4,w*.012);
      ctx.beginPath();ctx.arc(target.x,target.y,rr*3.5,0,2*Math.PI);
      ctx.fillStyle="rgba(249,158,78,.13)";ctx.fill();
      ctx.lineWidth=Math.max(1,w*.004);ctx.strokeStyle="#fff9e8";
      ctx.beginPath();ctx.arc(target.x,target.y,rr*1.6,0,2*Math.PI);ctx.stroke();
      ctx.fillStyle="#e58a47";ctx.beginPath();ctx.arc(target.x,target.y,rr,0,2*Math.PI);ctx.fill();
    }
  }
}
export default function GeoGlobe({pose,alt}:{pose:GlobePose;alt:string}){
  const canvasRef=useRef<HTMLCanvasElement|null>(null);
  const [countries,setCountries]=useState<FeatureCollection|null>(cachedFeatures);
  const [error,setError]=useState(false);
  useEffect(()=>{
    let mounted=true;
    void loadCountries().then(data=>{if(mounted)setCountries(data)}).catch(()=>{if(mounted)setError(true)});
    return ()=>{mounted=false};
  },[]);
  useEffect(()=>{
    const canvas=canvasRef.current;if(!canvas)return;
    const render=()=>{
      const cssW=Math.max(100,canvas.clientWidth),cssH=Math.max(100,canvas.clientHeight);
      const pixelRatio=Math.min(window.devicePixelRatio||1,2);
      canvas.width=Math.round(cssW*pixelRatio);
      canvas.height=Math.round(cssH*pixelRatio);
      const ctx=canvas.getContext("2d");if(!ctx)return;
      ctx.setTransform(pixelRatio,0,0,pixelRatio,0,0);
      paint(ctx,cssW,cssH,pose,countries);
    };
    render();
    const observer=typeof ResizeObserver!=="undefined"?new ResizeObserver(render):null;
    observer?.observe(canvas);
    return ()=>observer?.disconnect();
  },[pose,countries]);
  return <div className="wv-globe-canvas-wrap">
    <canvas ref={canvasRef} className="wv-globe-canvas" role="img" aria-label={alt}/>
    {error&&<span className="wv-globe-data-warning">Fond cartographique indisponible. Aucun contour de pays inventé.</span>}
  </div>;
}
