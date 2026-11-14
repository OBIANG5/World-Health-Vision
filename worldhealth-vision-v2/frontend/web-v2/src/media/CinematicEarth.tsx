/**
 * WORLD-VISION / D00 cinematic globe engineering preview.
 * - Actual NASA Blue Marble topographic DAY map; no city/night lights
 * - Real projected GeoJSON national borders; editor must review disputed borders
 * - GPU ray/sphere intersection, equirectangular texture and atmospheric Fresnel
 * - The TWO arcs and #fff eye-white are branding geometry, not a circular ring.
 *
 * WARNING: this is a reproducible CGI *candidate*, NOT an approved D00 render
 * or finished MP4. Do not merge visual approval with geographic-engine tests.
 */
import {useEffect, useRef, useState} from "react";
import {loadCountries,type GlobePose} from "./GeoGlobe";
import "./CinematicEarth.css";

type Feature={
  properties?:Record<string,unknown>;
  geometry?:{type:string;coordinates:unknown}|null;
};
type CountryData={type:"FeatureCollection";features:Feature[]};
type Position=[number,number];

const VERTEX=`
attribute vec2 a_pos;
void main(){gl_Position=vec4(a_pos,0.0,1.0);}
`;
const FRAGMENT=`
precision highp float;
uniform vec2 u_resolution;
uniform vec2 u_center;
uniform float u_radius;
uniform vec2 u_geo; // centre longitude/latitude, RADIANS
uniform sampler2D u_earth;
const float PI=3.141592653589793;
void main(){
  vec2 p=(gl_FragCoord.xy-u_center)/u_radius;
  float d=length(p);
  float exterior=exp(-pow(max(0.0,d-1.0)/0.096,2.0));
  if(d>=1.0){
    if(d>1.26)discard;
    float inner=exp(-pow((d-1.0)/0.035,2.0));
    vec3 cyan=mix(vec3(0.035,0.26,0.56),vec3(0.23,0.93,1.0),inner);
    float a=exterior*0.38+inner*0.43;
    gl_FragColor=vec4(cyan,clamp(a,0.0,0.90));
    return;
  }
  float z=sqrt(max(0.0,1.0-dot(p,p)));
  float cl=cos(u_geo.x),sl=sin(u_geo.x);
  float ct=cos(u_geo.y),st=sin(u_geo.y);
  vec3 world=normalize(vec3(
    ct*cl*z-sl*p.x-st*cl*p.y,
    ct*sl*z+cl*p.x-st*sl*p.y,
    st*z+ct*p.y
  ));
  float lon=atan(world.y,world.x);
  float lat=asin(clamp(world.z,-1.0,1.0));
  vec2 uv=vec2((lon+PI)/(2.0*PI),(lat+0.5*PI)/PI);
  vec3 mapColor=texture2D(u_earth,uv).rgb;
  // Blue Marble bathymetric oceans are almost black, unlike our brand's
  // visible cyan-to-deep-blue seas. Preserve genuine continental colours.
  float lightness=max(max(mapColor.r,mapColor.g),mapColor.b);
  float landAmount=smoothstep(0.095,0.28,lightness);
  vec3 ocean=vec3(0.016,0.185,0.36);
  vec3 base=mix(ocean,mapColor,landAmount);
  float illumination=0.78+0.32*max(0.0,dot(normalize(vec3(p,z)),normalize(vec3(-0.40,0.42,0.83))));
  base*=illumination;
  // An atmospheric rim directly on Earth's limb must visually dominate the
  // eyelid strokes, WITHOUT pretending to photograph the literal ozone layer.
  float edge=pow(1.0-z,3.1);
  vec3 atmosphere=vec3(0.20,0.88,1.0);
  base=mix(base,atmosphere,0.52*edge);
  base+=vec3(0.03,0.17,0.22)*pow(1.0-z,9.0);
  gl_FragColor=vec4(clamp(base,0.0,1.0),1.0);
}
`;

function shader(gl:WebGLRenderingContext,kind:number,source:string){
  const handle=gl.createShader(kind);if(!handle)throw new Error("Shader unavailable");
  gl.shaderSource(handle,source);gl.compileShader(handle);
  if(!gl.getShaderParameter(handle,gl.COMPILE_STATUS)){
    const why=gl.getShaderInfoLog(handle)||"Unknown shader error";
    gl.deleteShader(handle);throw new Error(why);
  }
  return handle;
}
function makePipeline(gl:WebGLRenderingContext){
  const program=gl.createProgram();if(!program)throw new Error("WebGL program unavailable");
  const vert=shader(gl,gl.VERTEX_SHADER,VERTEX),frag=shader(gl,gl.FRAGMENT_SHADER,FRAGMENT);
  gl.attachShader(program,vert);gl.attachShader(program,frag);gl.linkProgram(program);
  if(!gl.getProgramParameter(program,gl.LINK_STATUS))
    throw new Error(gl.getProgramInfoLog(program)||"WebGL program link failed");
  gl.deleteShader(vert);gl.deleteShader(frag);
  const buffer=gl.createBuffer();if(!buffer)throw new Error("WebGL buffer unavailable");
  gl.bindBuffer(gl.ARRAY_BUFFER,buffer);
  gl.bufferData(gl.ARRAY_BUFFER,new Float32Array([-1,-1,1,-1,-1,1,1,1]),gl.STATIC_DRAW);
  const tex=gl.createTexture();if(!tex)throw new Error("WebGL texture unavailable");
  gl.bindTexture(gl.TEXTURE_2D,tex);
  gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL,1);
  gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.REPEAT);
  gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.LINEAR);
  return {program,buffer,tex};
}
function vectorPoint(lon:number,lat:number,centerLon:number,centerLat:number,r:number,cx:number,cy:number){
  const rad=Math.PI/180;
  const dLon=(lon-centerLon)*rad,phi=lat*rad,phi0=centerLat*rad;
  const depth=Math.sin(phi0)*Math.sin(phi)+Math.cos(phi0)*Math.cos(phi)*Math.cos(dLon);
  return {x:cx+r*Math.cos(phi)*Math.sin(dLon),
    y:cy-r*(Math.cos(phi0)*Math.sin(phi)-Math.sin(phi0)*Math.cos(phi)*Math.cos(dLon)),
    depth};
}
function rings(feature:Feature):Position[][]{
  const g=feature.geometry;if(!g||!Array.isArray(g.coordinates))return [];
  if(g.type==="Polygon")return g.coordinates.filter(Array.isArray) as Position[][];
  if(g.type==="MultiPolygon")return (g.coordinates as unknown[]).flatMap(poly=>
    Array.isArray(poly)?poly.filter(Array.isArray) as Position[][]:[]);
  return [];
}
function traceClipped(ctx:CanvasRenderingContext2D,points:Position[],pose:GlobePose,
  radius:number,cx:number,cy:number){
  let prev:Position|null=null;
  let active=false;
  for(const p of points){
    if(!Array.isArray(p)||p.length<2||!Number.isFinite(p[0])||!Number.isFinite(p[1]))continue;
    const proj=vectorPoint(p[0],p[1],pose.centerLon,pose.centerLat,radius,cx,cy);
    const visible=proj.depth>=0.004;
    if(prev){
      const before=vectorPoint(prev[0],prev[1],pose.centerLon,pose.centerLat,radius,cx,cy);
      const beforeVisible=before.depth>=0.004;
      let delta=p[0]-prev[0];
      if(delta>180)delta-=360;
      if(delta< -180)delta+=360;
      if(visible!==beforeVisible){
        let low=0,high=1;
        for(let n=0;n<13;n++){
          const mid=(low+high)/2;
          const q=vectorPoint(prev[0]+delta*mid,prev[1]+(p[1]-prev[1])*mid,
            pose.centerLon,pose.centerLat,radius,cx,cy);
          if((q.depth>=0.004)===beforeVisible)low=mid;else high=mid;
        }
        const cut=vectorPoint(prev[0]+delta*(low+high)/2,prev[1]+(p[1]-prev[1])*(low+high)/2,
          pose.centerLon,pose.centerLat,radius,cx,cy);
        if(beforeVisible){ctx.lineTo(cut.x,cut.y);active=false;}
        else{ctx.moveTo(cut.x,cut.y);active=true;}
      }
    }
    if(visible){if(!active){ctx.moveTo(proj.x,proj.y);active=true;}else ctx.lineTo(proj.x,proj.y);}
    else if(!prev)active=false;
    prev=p;
  }
}
function drawBorders(ctx:CanvasRenderingContext2D,w:number,h:number,pose:GlobePose,data:CountryData){
  ctx.clearRect(0,0,w,h);
  const radius=Math.min(w*.466,h*.38),cx=w*.5,cy=h*.5;
  const iso=pose.highlightCountryIso3||"";
  for(const feature of data.features){
    const code=String(feature.properties?.["ISO3166-1-Alpha-3"]||"");
    const selected=Boolean(iso)&&code===iso;
    for(const path of rings(feature)){
      if(path.length<3)continue;
      ctx.beginPath();traceClipped(ctx,path,pose,radius,cx,cy);
      ctx.lineJoin="round";ctx.lineCap="round";
      ctx.lineWidth=selected?2.8:1.5;
      ctx.strokeStyle=selected?"rgba(9,22,42,0.92)":"rgba(5,29,46,0.85)";
      ctx.stroke();
      ctx.lineWidth=selected?1.6:0.75;
      ctx.strokeStyle=selected?"#ffe2a5":"rgba(245,252,247,0.94)";
      ctx.stroke();
    }
  }
}

export default function CinematicEarth({pose,alt}:{
  pose:GlobePose;alt:string
}){
  const glRef=useRef<HTMLCanvasElement|null>(null);
  const bordersRef=useRef<HTMLCanvasElement|null>(null);
  const drawGl=useRef<(()=>void)|null>(null);
  const stateRef=useRef(pose);stateRef.current=pose;
  const [countries,setCountries]=useState<CountryData|null>(null);
  const [error,setError]=useState("");
  const [ready,setReady]=useState(false);

  useEffect(()=>{
    let active=true;
    void loadCountries().then(data=>{if(active)setCountries(data as CountryData)})
      .catch(()=>{if(active)setError("Frontières indisponibles : aucun contour inventé.")});
    return ()=>{active=false};
  },[]);

  useEffect(()=>{
    const canvas=glRef.current;if(!canvas)return;
    const gl=canvas.getContext("webgl",{alpha:true,antialias:true,premultipliedAlpha:false,
      preserveDrawingBuffer:true});
    if(!gl){setError("WebGL indisponible : rendu 3D non affiché.");return;}
    let disposed=false;
    let pipeline:ReturnType<typeof makePipeline>;
    try{pipeline=makePipeline(gl);}catch(e){setError("Shader terrestre invalide : "+String(e));return;}
    const {program,buffer,tex}=pipeline;
    let textureLoaded=false;
    const render=()=>{
      if(disposed||!textureLoaded)return;
      const cssW=Math.max(150,canvas.clientWidth),cssH=Math.max(200,canvas.clientHeight);
      const ratio=Math.min(window.devicePixelRatio||1,2);
      const W=Math.round(cssW*ratio),H=Math.round(cssH*ratio);
      if(canvas.width!==W||canvas.height!==H){canvas.width=W;canvas.height=H;}
      gl.viewport(0,0,W,H);
      gl.clearColor(0,0,0,0);gl.clear(gl.COLOR_BUFFER_BIT);
      gl.enable(gl.BLEND);gl.blendFunc(gl.SRC_ALPHA,gl.ONE_MINUS_SRC_ALPHA);
      gl.useProgram(program);
      gl.bindBuffer(gl.ARRAY_BUFFER,buffer);
      const index=gl.getAttribLocation(program,"a_pos");
      gl.enableVertexAttribArray(index);gl.vertexAttribPointer(index,2,gl.FLOAT,false,0,0);
      gl.activeTexture(gl.TEXTURE0);gl.bindTexture(gl.TEXTURE_2D,tex);
      gl.uniform1i(gl.getUniformLocation(program,"u_earth"),0);
      gl.uniform2f(gl.getUniformLocation(program,"u_resolution"),W,H);
      // WebGL gl_FragCoord uses bottom-origin: .5 is also the visual centre.
      gl.uniform2f(gl.getUniformLocation(program,"u_center"),W*.5,H*.5);
      gl.uniform1f(gl.getUniformLocation(program,"u_radius"),Math.min(W*.466,H*.38));
      const state=stateRef.current;
      gl.uniform2f(gl.getUniformLocation(program,"u_geo"),
        state.centerLon*Math.PI/180,state.centerLat*Math.PI/180);
      gl.drawArrays(gl.TRIANGLE_STRIP,0,4);
    };
    drawGl.current=render;
    const observer=new ResizeObserver(render);observer.observe(canvas);
    const img=new Image();img.decoding="async";
    img.onload=()=>{
      if(disposed)return;
      // 2048x1024 is conservative for mobile GPUs, while source data remains NASA.
      const raster=document.createElement("canvas");
      raster.width=2048;raster.height=1024;
      const c=raster.getContext("2d");
      if(!c){setError("Texture Canvas indisponible.");return;}
      c.drawImage(img,0,0,raster.width,raster.height);
      gl.bindTexture(gl.TEXTURE_2D,tex);
      gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,gl.RGBA,gl.UNSIGNED_BYTE,raster);
      textureLoaded=true;setReady(true);render();
    };
    img.onerror=()=>{if(!disposed)setError("Texture NASA manquante : le globe 3D n'est pas rendu.")};
    img.src="./earth/blue-marble-topography-nasa.jpg";
    return ()=>{
      disposed=true;observer.disconnect();drawGl.current=null;
      img.onload=null;img.onerror=null;
      gl.deleteTexture(tex);gl.deleteBuffer(buffer);gl.deleteProgram(program);
    };
  },[]);
  useEffect(()=>{drawGl.current?.()},[pose,ready]);
  useEffect(()=>{
    const canvas=bordersRef.current;if(!canvas||!countries)return;
    const ratio=Math.min(window.devicePixelRatio||1,2);
    const cssW=Math.max(150,canvas.clientWidth),cssH=Math.max(200,canvas.clientHeight);
    const W=Math.round(cssW*ratio),H=Math.round(cssH*ratio);
    if(canvas.width!==W||canvas.height!==H){canvas.width=W;canvas.height=H;}
    const ctx=canvas.getContext("2d");if(!ctx)return;
    ctx.setTransform(ratio,0,0,ratio,0,0);
    drawBorders(ctx,cssW,cssH,pose,countries);
  },[pose,countries,ready]);

  return <div className="wv-cinematic-earth" data-cinematic="D00-development" data-optical-center="0.5,0.5" role="img" aria-label={alt}>
    <svg className="wv-cinematic-eye" viewBox="0 0 1000 1600"
      preserveAspectRatio="xMidYMid meet" aria-hidden="true">
      <path d="M -300 800 Q 500 -270 1300 800 Q 500 1870 -300 800 Z"
        fill="#ffffff"/>
      <path d="M -300 800 Q 500 -270 1300 800"
        fill="none" stroke="#a9e5ee" strokeWidth="4" opacity=".82"/>
      <path d="M -300 800 Q 500 1870 1300 800"
        fill="none" stroke="#a9e5ee" strokeWidth="4" opacity=".82"/>
    </svg>
    <canvas ref={glRef} className="wv-cinematic-gl-layer" aria-hidden="true"/>
    <canvas ref={bordersRef} className="wv-cinematic-border-layer" aria-hidden="true"/>
    {!ready&&!error&&<span className="wv-cinematic-loading">Chargement de la Terre NASA…</span>}
    {error&&<span role="status" className="wv-cinematic-error">{error}</span>}
  </div>;
}
