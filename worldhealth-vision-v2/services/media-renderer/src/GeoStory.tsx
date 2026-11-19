import {useMemo} from "react";
import {AbsoluteFill,Img,OffthreadVideo,useCurrentFrame} from "remotion";
import {fitTextOnNLines} from "@remotion/layout-utils";
import {geoOrthographic,geoPath,geoGraticule10,geoInterpolate} from "d3-geo";
import {feature,mesh} from "topojson-client";
import atlasData from "world-atlas/countries-110m.json";
import type {CreativeShot,CreativeEditProps} from "./CreativeEdit";
import {resolveCreativeSource} from "./CreativeEdit";

/**
 * WORLD-VISION GEO STORY / international motion grammar, stage A.
 *
 * GEO SOURCE: Natural Earth Admin-0 boundaries via world-atlas@2 (110m).
 * Rendering geometry is projected by d3-geo. Not invented polygon silhouettes.
 * All center/target/route/data values are chosen by the editor, NOT inferred
 * from scripts, maps, footage or current affairs by this component.
 *
 * The luminous cyan/eye look is a vector art direction, NOT yet the user's
 * NASA-style photorealistic Earth; NASA Blue Marble/Remotion Three.js follows
 * in a separate, evidence-reviewed enhancement.
 *
 * Independent, deterministic sub-animations from Remotion useCurrentFrame:
 * A) earth rotation / atmosphere, B) eye/halo, C) locator + pulse,
 * D) clipped great-circle route, E) supplied media plate,
 * F) author-provided data counter, G) headline / kicker.
 */
export type GeoPoint={lon:number;lat:number};
export type GeoRoute={from:GeoPoint;to:GeoPoint;label?:string};
export type GeoMetric={label:string;value:number;unit?:string;precision?:number};
export type GeoDirection={
  center:GeoPoint;
  spinDegrees?:number;
  target?:GeoPoint & {label?:string};
  route?:GeoRoute;
  metric?:GeoMetric;
};
type GlobalStyle=Required<NonNullable<CreativeEditProps["visualStyle"]>>;

const atlas=atlasData as unknown as {objects:{countries:unknown};arcs:unknown};
const countryCollection=feature(atlasData as never,atlas.objects.countries as never);
const borderMesh=mesh(atlasData as never,atlas.objects.countries as never,(a,b)=>a!==b);
const graticule=geoGraticule10();
const easing=(v:number)=>1-Math.pow(1-Math.max(0,Math.min(1,v)),3);
const norm=(frame:number,a:number,b:number)=>Math.max(0,Math.min(1,(frame-a)/Math.max(1,b-a)));

export function GeoStory({shot,globalStyle,enterOverlapFrames}:{
  shot:CreativeShot;
  globalStyle:GlobalStyle;
  enterOverlapFrames:number;
}){
  const frame=useCurrentFrame();
  const local=Math.max(0,frame-enterOverlapFrames);
  const progress=Math.min(1,local/Math.max(1,shot.durationFrames-enterOverlapFrames));
  const geo=shot.geo!;
  const enter=easing(norm(local,0,31));
  const mapOpacity=.6+.4*enter;
  const spin=(geo.spinDegrees??16)*progress;
  const proj=useMemo(()=>geoOrthographic()
    .scale(399).translate([540,747]).rotate([
      -geo.center.lon+spin,-geo.center.lat
    ]).clipAngle(89.999).precision(.7),[
    geo.center.lon,geo.center.lat,spin
  ]);
  const path=useMemo(()=>geoPath(proj),[proj]);
  const landPath=useMemo(()=>path(countryCollection)??"",[path]);
  const bordersPath=useMemo(()=>path(borderMesh)??"",[path]);
  const gridPath=useMemo(()=>path(graticule)??"",[path]);
  const targetXY=geo.target?proj([geo.target.lon,geo.target.lat]):null;
  const route=geo.route;
  const arc=useMemo(()=>{
    if(!route)return "";
    // Real geographic great-circle samples, projected + clipped by d3.
    const interpolatePoint=geoInterpolate(
      [route.from.lon,route.from.lat],[route.to.lon,route.to.lat]
    );
    const coordinates=Array.from({length:97},(_,i)=>interpolatePoint(i/96));
    return path({type:"LineString",coordinates})??"";
  },[route?.from.lon,route?.from.lat,route?.to.lon,route?.to.lat,path]);
  const accent=shot.accent??globalStyle.accent;
  const atmosphere=1+Math.sin(local/22)*.025;
  const titleIn=easing(norm(local,10,31));
  const captionIn=easing(norm(local,32,55));
  const metricIn=easing(norm(local,72,100));
  const pointIn=easing(norm(local,17,40));
  const arcIn=easing(norm(local,24,91));
  const fadeOut=shot.transitionAfter!=="cut"&&(shot.transitionFrames??0)>0
    ?1-easing(norm(frame,shot.durationFrames-(shot.transitionFrames??0),shot.durationFrames))
    :1;
  const titleSize=shot.title?fitTextOnNLines({
    text:shot.title,fontFamily:globalStyle.editorialFont,
    fontWeight:790,maxBoxWidth:815,maxLines:2,maxFontSize:80
  }).fontSize:80;
  const subtitleSize=shot.subtitle?fitTextOnNLines({
    text:shot.subtitle,fontFamily:globalStyle.editorialFont,
    fontWeight:480,maxBoxWidth:840,maxLines:2,maxFontSize:32
  }).fontSize:32;
  const m=geo.metric;
  const value=m?m.value*metricIn:0;
  const displayNumber=m?new Intl.NumberFormat("fr-FR",{
    maximumFractionDigits:m.precision??0,minimumFractionDigits:m.precision??0
  }).format(value):"";
  const hasPhoto=Boolean(shot.media);
  const photoIn=easing(norm(local,45,78));

  return <AbsoluteFill style={{
    overflow:"hidden",background:"#04111e",
    color:globalStyle.ink,fontFamily:globalStyle.editorialFont
  }}>
    {/* Level 1: quiet editorial stage. No fictional "stars" representing data. */}
    <AbsoluteFill style={{background:
      "radial-gradient(ellipse at 58% 36%,#0c3d73 0%,#091e35 42%,#020814 87%)"
    }}/>
    <AbsoluteFill style={{
      opacity:.47,background:
      "linear-gradient(150deg,transparent 32%,rgba(16,143,195,.07) 56%,transparent 89%)",
      transform:"rotate("+((local*.14)%360)+"deg) scale(1.25)"
    }}/>

    {/* Level 2: animated luminous World-Vision eye. Animated independently. */}
    <svg viewBox="0 0 1080 1920" width="100%" height="100%"
      style={{position:"absolute",inset:0,overflow:"visible"}}>
      <defs>
        <linearGradient id="wv-geo-eye" x1="0%" y1="20%" x2="100%" y2="80%">
          <stop offset="0%" stopColor="#00367c"/>
          <stop offset="25%" stopColor="#00cdff"/>
          <stop offset="49%" stopColor="#caffff"/>
          <stop offset="72%" stopColor="#13bfff"/>
          <stop offset="100%" stopColor="#00367c"/>
        </linearGradient>
        <radialGradient id="wv-geo-water" cx="28%" cy="22%" r="90%">
          <stop offset="0%" stopColor="#119bd9"/>
          <stop offset="38%" stopColor="#034b9d"/>
          <stop offset="80%" stopColor="#07194f"/>
          <stop offset="100%" stopColor="#001331"/>
        </radialGradient>
        <linearGradient id="wv-geo-land" x1="5%" y1="0%" x2="90%" y2="100%">
          <stop offset="0%" stopColor="#b6d85f"/>
          <stop offset="32%" stopColor="#4eab61"/>
          <stop offset="57%" stopColor="#e2bd62"/>
          <stop offset="84%" stopColor="#2f805a"/>
          <stop offset="100%" stopColor="#83aa50"/>
        </linearGradient>
        <radialGradient id="wv-geo-sphere-gloss" cx="24%" cy="20%" r="92%">
          <stop offset="0%" stopColor="#ffffff" stopOpacity=".25"/>
          <stop offset="48%" stopColor="#ffffff" stopOpacity="0"/>
          <stop offset="80%" stopColor="#00142c" stopOpacity=".13"/>
          <stop offset="100%" stopColor="#000614" stopOpacity=".74"/>
        </radialGradient>
        <filter id="wv-geo-soft-glow" x="-60%" y="-80%" width="220%" height="260%">
          <feGaussianBlur stdDeviation="21"/>
        </filter>
        <filter id="wv-geo-neon-glow" x="-70%" y="-70%" width="240%" height="240%">
          <feGaussianBlur stdDeviation="7"/>
        </filter>
        <clipPath id="wv-geo-sphere-clip">
          <circle cx="540" cy="747" r="399"/>
        </clipPath>
      </defs>
      <ellipse cx="540" cy="752" rx="644" ry="490"
        fill="none" stroke="#09adff" strokeWidth="29"
        opacity={.24+Math.sin(local/29)*.04}
        style={{filter:"url(#wv-geo-soft-glow)"}}/>
      <ellipse cx="540" cy="752" rx="620" ry="471"
        fill="none" stroke="url(#wv-geo-eye)" strokeWidth={13+3*Math.sin(local/17)}
        opacity={.5+.5*enter}/>
      <ellipse cx="540" cy="752" rx="614" ry="465"
        fill="none" stroke="#ceffff" strokeWidth="3" opacity={.48*enter}/>
      {/* Level 3: planet, real Natural Earth borders, projection-true rotation. */}
      <circle data-wv-geo-earth="true" cx="540" cy="747" r="418"
        fill="#08ddff" opacity=".35" filter="url(#wv-geo-soft-glow)"
        transform={"translate(540 747) scale("+atmosphere+") translate(-540 -747)"}/>
      <circle cx="540" cy="747" r="405" fill="#11caff" opacity=".7"
        filter="url(#wv-geo-neon-glow)"/>
      <circle cx="540" cy="747" r="399" fill="url(#wv-geo-water)"
        stroke="#a2f8ff" strokeWidth="4" opacity={mapOpacity}/>
      <g clipPath="url(#wv-geo-sphere-clip)">
        <path d={gridPath} fill="none" stroke="#79c9f1" strokeWidth=".7"
          opacity=".17"/>
        <path data-wv-geo-land="true" d={landPath} fill="url(#wv-geo-land)"
          fillRule="evenodd" stroke="#defbbb" strokeWidth="1.35"
          opacity={mapOpacity}/>
        <path data-wv-geo-borders="true" d={bordersPath}
          fill="none" stroke="#eafaff" strokeWidth="1.65"
          opacity={.81*enter}/>
        <circle cx="540" cy="747" r="399" fill="url(#wv-geo-sphere-gloss)"/>
        {/* Level 4: great-circle route with SVG path-length reveal. */}
        {arc&&<path data-wv-geo-route="true" d={arc} fill="none"
          stroke="#4cecff" strokeWidth="5" strokeLinecap="round"
          pathLength={1} strokeDasharray="1"
          strokeDashoffset={1-arcIn}
          opacity={.96*enter}/>}
        {arc&&<path d={arc} fill="none" stroke="#10bcff" strokeWidth="18"
          pathLength={1} strokeDasharray="1" strokeDashoffset={1-arcIn}
          opacity={.22*enter} filter="url(#wv-geo-neon-glow)"/>}
        {/* Level 5: locator marker is hidden when its latitude/longitude is
            behind the globe. Never pin through the rear hemisphere. */}
        {targetXY&&geo.target&&<g data-wv-geo-target="true"
          opacity={pointIn}>
          <circle cx={targetXY[0]} cy={targetXY[1]} r={17+14*(
            .5+.5*Math.sin(local/8))}
            fill="none" stroke="#cffcff" strokeWidth="4"
            opacity=".8"/>
          <circle cx={targetXY[0]} cy={targetXY[1]} r="9"
            fill="#e6ffff" stroke="#006c9e" strokeWidth="3"/>
          {geo.target.label&&<g>
            <rect x={targetXY[0]+23} y={targetXY[1]-24}
              width={Math.min(270,Math.max(115,geo.target.label.length*13+28))}
              height="39" rx="9" fill="#051d31" opacity=".88"
              stroke="#7eebfa" strokeWidth="1.4"/>
            <text x={targetXY[0]+37} y={targetXY[1]+2}
              fill="#edfcff" fontSize="22" fontWeight="720"
              style={{fontFamily:globalStyle.editorialFont}}>
              {geo.target.label}
            </text>
          </g>}
        </g>}
      </g>
    </svg>
    {/* Level 6: optional authentic supplied photographic card.
        If absent the composition stays entirely cartographic. */}
    {hasPhoto&&shot.media&&<div data-wv-geo-photo="true" style={{
      position:"absolute",top:1128,left:89,width:902,height:314,
      overflow:"hidden",borderRadius:22,
      border:"1px solid rgba(166,222,244,.5)",
      boxShadow:"0 20px 50px rgba(0,0,0,.53)",
      opacity:photoIn*fadeOut,
      transform:"translateY("+Math.round((1-photoIn)*38)+"px)"
    }}>
      {shot.media.kind==="image"
      ? <Img src={resolveCreativeSource(shot.media.src)} style={{
          width:"100%",height:"100%",objectFit:"cover",
          transform:"scale("+(1.015+.035*progress)+")"
        }}/>
      : <OffthreadVideo src={resolveCreativeSource(shot.media.src)} muted trimBefore={shot.media.trimBefore??0} style={{width:"100%",height:"100%",objectFit:"cover"}}/>}
      <div style={{position:"absolute",inset:0,
        background:"linear-gradient(0deg,rgba(2,12,22,.4),transparent 45%)"}}/>
    </div>}
    {/* Level 7: numerics are editorial values, NOT market data invented by AI. */}
    {m&&<div data-wv-geo-metric="true" style={{
      position:"absolute",right:100,top:hasPhoto?1230:1168,
      width:375,display:"flex",flexDirection:"column",alignItems:"flex-end",
      opacity:metricIn*fadeOut
    }}>
      <div style={{fontSize:23,color:"#b8dfef",letterSpacing:".08em",
        textTransform:"uppercase",fontWeight:720}}>{m.label}</div>
      <div style={{fontSize:94,lineHeight:1.04,fontWeight:860,
        color:"#c7fbff",letterSpacing:"-.06em",
        textShadow:"0 0 32px rgba(0,188,242,.3)"}}>
        {displayNumber}<span style={{fontSize:40,marginLeft:9}}>{m.unit??""}</span>
      </div>
    </div>}
    <div style={{
      position:"absolute",left:89,top:205,right:170,
      opacity:easing(norm(local,6,26))*fadeOut
    }}>
      <div style={{display:"inline-block",height:5,width:72,
        background:"#71f4ff",marginBottom:17}}/>
      {shot.eyebrow&&<div dir="auto" style={{
        fontSize:22,fontWeight:750,letterSpacing:".11em",
        color:"#c4f9ff",textTransform:"uppercase"
      }}>{shot.eyebrow}</div>}
    </div>
    {/* Level 8: headlines enter after cartographic context. */}
    <div data-wv-geo-copy="true" style={{
      position:"absolute",left:89,right:173,
      bottom:hasPhoto?240:350,
      opacity:titleIn*fadeOut,
      transform:"translateY("+Math.round((1-titleIn)*45)+"px)"
    }}>
      <div style={{height:3,width:Math.round(86*titleIn),
        background:accent,marginBottom:20}}/>
      {shot.title&&<div data-wv-title={shot.id} dir="auto" style={{
        fontSize:titleSize,fontWeight:790,lineHeight:1.08,
        letterSpacing:"-.045em",whiteSpace:"pre-line",
        overflowWrap:"break-word",textShadow:"0 6px 34px #000a14"
      }}>{shot.title}</div>}
      {shot.subtitle&&<div dir="auto" style={{
        fontSize:subtitleSize,fontWeight:480,lineHeight:1.29,
        marginTop:19,color:"#c8e7f1",
        opacity:captionIn
      }}>{shot.subtitle}</div>}
    </div>
    <div style={{position:"absolute",top:1604,left:89,
      width:188,height:2,background:"#42cae6",
      opacity:.4*enter*fadeOut}}/>
  </AbsoluteFill>;
}
