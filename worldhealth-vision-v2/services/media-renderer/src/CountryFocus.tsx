import {useMemo} from "react";
import {AbsoluteFill,Img,OffthreadVideo,useCurrentFrame} from "remotion";
import {fitTextOnNLines} from "@remotion/layout-utils";
import atlas10 from "world-atlas/countries-10m.json";
import atlas50 from "world-atlas/countries-50m.json";
import type {CreativeShot,CreativeEditProps} from "./CreativeEdit";
import {resolveCreativeSource} from "./CreativeEdit";
import {countryFocusGeometry} from "./country-focus-geometry.mjs";
import {headlineHandoffOpacity} from "./editorial-text-handoff.mjs";

/**
 * GEO-2 / premium 10m COUNTRY FOCUS, independent of the globe composition.
 * Actual Natural Earth 10m country geometry + 50m surrounding geography.
 * No satellite image is manufactured; a user-authored photo/clip is optional.
 *
 * One canonical Remotion scene for both V2 Player and H.264 render:
 * A context camera, B 10m silhouette reveal, C pulse marker when *inside*
 * the selected feature, D supplied documentary media, E optional independent
 * transparent 2.5D foreground, F verified metric, G staged editorial type.
 */
type GlobalStyle=Required<NonNullable<CreativeEditProps["visualStyle"]>>;
const clamp=(x:number)=>Math.max(0,Math.min(1,x));
const between=(f:number,a:number,b:number)=>clamp((f-a)/Math.max(1,b-a));
const ease=(t:number)=>t*t*(3-2*t);

export function CountryFocus({shot,globalStyle,enterOverlapFrames}:{
  shot:CreativeShot;globalStyle:GlobalStyle;enterOverlapFrames:number;
}){
  const frame=useCurrentFrame();
  const local=Math.max(0,frame-enterOverlapFrames);
  const geo=shot.geo;
  const countryId=geo?.spotlight?.countryId??"";
  const map=useMemo(()=>countryFocusGeometry(atlas10,atlas50,countryId),[countryId]);
  // A partially edited Studio draft is not a valid published map; the Studio
  // and project JSON validator block it before export or final rendering.
  if(!map)return <AbsoluteFill data-wv-country-invalid="true"
    style={{background:"#061625",color:"#e8f8fd",justifyContent:"center",
      alignItems:"center",fontSize:30,fontFamily:globalStyle.editorialFont}}>
    Sélectionner un pays existant dans le référentiel 1:10m
  </AbsoluteFill>;

  const accent=shot.accent??"#5eeeff";
  const intro=ease(between(local,0,22));
  const move=ease(between(local,15,115));
  const outline=ease(between(local,24,90));
  const photoIn=ease(between(local,46,81));
  const dataIn=ease(between(local,73,109));
  const titleIn=.20+.80*ease(between(local,0,22));
  const subtitleIn=ease(between(local,100,136));
  const holdFade=shot.transitionAfter!=="cut"&&(shot.transitionFrames??0)>0
    ?1-ease(between(frame,shot.durationFrames-(shot.transitionFrames??0),shot.durationFrames)):1;
  const cameraScale=.92+.08*move;
  const cameraY=14*(1-move);
  const hasMedia=Boolean(shot.media);
  const metric=geo?.metric;
  const metricValue=metric?.value??0;
  const countProgress=ease(between(local,72,109));
  const shown=metric?new Intl.NumberFormat("fr-FR",{
    minimumFractionDigits:metric.precision??0,
    maximumFractionDigits:metric.precision??0
  }).format(metricValue*countProgress):"";
  // The marker is not allowed to represent another country. geoContainsPoint
  // checks the original 10m multipolygon rather than just latitude/longitude.
  const canMark=Boolean(geo?.target&&map.geoContainsPoint([
    geo.target.lon,geo.target.lat
  ]));
  const markedXY=canMark&&geo?.target?map.projection([geo.target.lon,geo.target.lat]):null;
  const titleSize=shot.title?fitTextOnNLines({
    text:shot.title,maxBoxWidth:855,maxLines:2,
    fontFamily:globalStyle.editorialFont,fontWeight:800,maxFontSize:83
  }).fontSize:83;
  const subtitleSize=shot.subtitle?fitTextOnNLines({
    text:shot.subtitle,maxBoxWidth:840,maxLines:2,
    fontFamily:globalStyle.editorialFont,fontWeight:470,maxFontSize:35
  }).fontSize:35;

  return <AbsoluteFill data-wv-country-focus={countryId} style={{
    background:"#041521",overflow:"hidden",color:"#f4fcff",
    fontFamily:globalStyle.editorialFont
  }}>
    {/* Atmosphere / art-directed background, not a false satellite raster. */}
    <AbsoluteFill style={{background:
      "radial-gradient(ellipse at 51% 39%,#124e68 0%,#09293e 41%,#04101c 82%)"
    }}/>
    <AbsoluteFill style={{
      opacity:.28,transform:"rotate("+(-4+move*3)+"deg)",
      background:"linear-gradient(118deg,transparent 16%,rgba(24,198,246,.22) 45%,transparent 76%)"
    }}/>
    <svg viewBox="0 0 1080 1920" width="100%" height="100%"
      style={{position:"absolute",inset:0,pointerEvents:"none"}}>
      <defs>
        <linearGradient id={"wv-country-fill-"+shot.id} x1="0%" x2="100%" y1="0%" y2="90%">
          <stop offset="0%" stopColor="#49f5d6" stopOpacity=".52"/>
          <stop offset="53%" stopColor="#1287c1" stopOpacity=".43"/>
          <stop offset="100%" stopColor="#174f9c" stopOpacity=".31"/>
        </linearGradient>
        <filter id={"wv-country-bloom-"+shot.id} x="-70%" y="-70%" width="240%" height="240%">
          <feGaussianBlur stdDeviation="13"/>
        </filter>
        <clipPath id={"wv-country-mapclip-"+shot.id}>
          <rect x="88" y="423" width="904" height="448" rx="23"/>
        </clipPath>
      </defs>
      <rect data-wv-country-map-boundary="true" x="90" y="422" width="900" height="449" rx="24"
        fill="#071b2b" fillOpacity=".47"
        stroke="#2ccde9" strokeOpacity=".32" strokeWidth="2"/>
      <g clipPath={"url(#wv-country-mapclip-"+shot.id+")"}>
        <g data-wv-country-camera="true"
          data-wv-country-scale={cameraScale.toFixed(4)}
          transform={"translate(540 641) scale("+cameraScale+") translate(-540 -641) translate(0 "+cameraY+")"}>
          {/* Natural Earth 50m near neighbors, explicitly context-only. */}
          <path data-wv-country-context="50m" d={map.contextPath} fill="none"
            stroke="#6eb6c9" strokeOpacity={.17+.28*intro}
            strokeWidth="1.7"/>
          {/* Large country form is true 10m shape, never AI hand-drawn. */}
          <path data-wv-country-fill="10m" d={map.detailPath}
            fill={"url(#wv-country-fill-"+shot.id+")"}
            fillRule="evenodd" opacity={.21+.71*outline}/>
          <path data-wv-country-bloom="true" d={map.detailPath}
            fill="none" stroke="#04ddff" strokeWidth="18"
            strokeLinejoin="round" opacity={outline*.28}
            filter={"url(#wv-country-bloom-"+shot.id+")"}/>
          <path d={map.detailPath} fill="none" stroke="#8cdcf0" strokeWidth="2.5" opacity=".24"/>
          <path data-wv-country-outline="10m" d={map.detailPath} fill="none"
            stroke="#b4faff" strokeWidth="5.5" strokeLinejoin="round"
            pathLength={1} strokeDasharray="1" strokeDashoffset={1-outline}
            opacity={.35+.65*intro}/>
          {markedXY&&geo?.target&&<g data-wv-country-marker="true"
            transform={"translate("+markedXY[0]+" "+markedXY[1]+")"}
            opacity={ease(between(local,45,75))}>
            <circle r={24+7*Math.sin(local/8)} stroke="#b7ffff"
              strokeWidth="4" fill="none" opacity=".83"/>
            <circle r="8" fill="#e9ffff" stroke="#007a99" strokeWidth="3"/>
          </g>}
        </g>
      </g>
      <path d="M 109 882 L 975 882" stroke="#2ba4c3" strokeOpacity=".38" strokeWidth="2"/>
    </svg>
    {/* Brand stays subtle: no invented breaking-news or VERIFIED badge. */}
    <div style={{position:"absolute",top:154,left:92,right:91,
      opacity:titleIn*holdFade*headlineHandoffOpacity(frame,enterOverlapFrames)}}>
      {shot.eyebrow&&<div dir="auto" style={{
        fontSize:24,fontWeight:780,textTransform:"uppercase",
        color:"#9eecfa",letterSpacing:".10em",lineHeight:1.22
      }}>{shot.eyebrow}</div>}
      <div data-wv-title={shot.id} dir="auto" style={{
        fontSize:titleSize,lineHeight:1.05,fontWeight:810,
        marginTop:12,letterSpacing:"-.042em",maxWidth:840,
        textShadow:"0 6px 23px rgba(0,0,0,.48)",
        transform:"translateY("+Math.round((1-titleIn)*23)+"px)",
        overflowWrap:"break-word"
      }}>{shot.title}</div>
    </div>
    {/* Documentarily sourced image/clip, NEVER a fabricated stand-in. */}
    {shot.media&&<div data-wv-country-media="true" style={{
      position:"absolute",top:900,left:96,width:888,height:364,
      overflow:"hidden",borderRadius:19,
      border:"2px solid rgba(132,237,255,.53)",
      boxShadow:"0 23px 56px rgba(0,8,17,.61)",
      opacity:photoIn*holdFade,
      transform:"translateY("+Math.round((1-photoIn)*45)+"px)"
    }}>
      {shot.media.kind==="image"
        ?<Img src={resolveCreativeSource(shot.media.src)} style={{
          width:"100%",height:"100%",objectFit:"cover",
          objectPosition:Math.round((shot.focus?.x??.5)*100)+"% "+
            Math.round((shot.focus?.y??.5)*100)+"%",
          transform:"scale("+(1.015+.045*move)+")"
        }}/>
        :<OffthreadVideo src={resolveCreativeSource(shot.media.src)}
          trimBefore={shot.media.trimBefore??0} muted
          style={{width:"100%",height:"100%",objectFit:"cover"}}/>
      }
      {/* Optional independently moving, specialist-prepared alpha cutout. */}
      {shot.foreground&&<Img data-wv-country-foreground="true"
        src={resolveCreativeSource(shot.foreground.src)} style={{
          position:"absolute",inset:0,width:"100%",height:"100%",
          objectFit:"cover",
          transform:"scale("+(1.04+.08*move)+") translateX("+(3*move)+"px)"
        }}/>}
      <div style={{position:"absolute",inset:0,
        pointerEvents:"none",
        background:"linear-gradient(0deg,rgba(1,11,22,.8),transparent 58%)"}}/>
    </div>}
    {/* Optional fact supplied by the editor: no fabricated numbers. */}
    {metric&&<div data-wv-country-metric="true" style={{
      position:"absolute",top:hasMedia?1085:1125,right:95,
      minWidth:255,maxWidth:570,padding:"14px 25px",
      border:"1px solid rgba(162,245,255,.56)",borderRadius:14,
      background:"rgba(3,18,31,.91)",
      boxShadow:"0 8px 32px rgba(1,9,19,.48)",
      opacity:dataIn*holdFade,
      textAlign:"right"
    }}>
      <div style={{fontSize:23,fontWeight:700,color:"#c8eaf0",
        textTransform:"uppercase",letterSpacing:".06em"}}>{metric.label}</div>
      <div style={{fontSize:76,lineHeight:1.08,fontWeight:860,
        color:"#c9fcff",letterSpacing:"-.06em"}}>{shown}
        <span style={{fontSize:32,marginLeft:7}}>{metric.unit??""}</span>
      </div>
    </div>}
    {/* Secondary explanatory beat; no text in TikTok's bottom controls. */}
    {shot.subtitle&&<div data-wv-country-caption="true" dir="auto" style={{
      position:"absolute",top:hasMedia?1340:1295,left:96,right:96,
      maxHeight:175,overflow:"hidden",
      fontSize:subtitleSize,fontWeight:490,lineHeight:1.31,
      color:"#d9f0f6",textShadow:"0 5px 18px rgba(0,0,0,.45)",
      opacity:subtitleIn*holdFade
    }}>{shot.subtitle}</div>}
    <div style={{position:"absolute",left:97,top:1540,width:170,
      height:2,background:"#48bfd9",opacity:.46*intro}}/>
  </AbsoluteFill>;
}
