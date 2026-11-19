import type {CSSProperties} from "react";
import {AbsoluteFill,Img,useCurrentFrame} from "remotion";
import {fitTextOnNLines} from "@remotion/layout-utils";
import type {CreativeShot,CreativeEditProps} from "./CreativeEdit";
import {resolveCreativeSource} from "./CreativeEdit";
import {dataPose,valueLabel,dataPointGeometry,rankedData,heatmapCells} from "./data-motion-engine.mjs";

/**
 * World-Vision DATA / multi-visualization Remotion scene. All measurements
 * originate with editor-supplied values, dates, unit, scale and provenance.
 * This renderer neither fetches markets nor invents quotes. A displayed axis
 * range is ALWAYS named to prevent a deceptive truncated financial chart.
 */
type Style=Required<NonNullable<CreativeEditProps["visualStyle"]>>;
const pct=(x:number)=>Math.max(0,Math.min(1,x));
const n=(v:number)=>Math.round(v*100)/100;
export function DataMotion({shot,globalStyle,enterOverlapFrames}:{
  shot:CreativeShot;globalStyle:Style;enterOverlapFrames:number;
}){
  const frame=useCurrentFrame();
  const local=Math.max(0,frame-enterOverlapFrames);
  const d=shot.data;
  if(!d||!d.series?.length)return <AbsoluteFill data-wv-data-invalid="true"
    style={{background:"#081825",color:"#e8f5fa",fontFamily:globalStyle.editorialFont,
      fontSize:32,justifyContent:"center",alignItems:"center"}}>
    Ajouter un jeu de données documenté et validé
  </AbsoluteFill>;
  const beat=dataPose(local,shot.durationFrames);
  const series=d.series;
  const accent=shot.accent??"#49e7f3";
  const format=(v:number)=>valueLabel(v,d.precision,d.locale??"fr-FR");
  const mode=d.mode;
  const ordered=mode==="ranking"?rankedData(series):series;
  const featured=mode==="ranking"?ordered[0]:mode==="heatmap"
    ?series.reduce((a,b)=>b.value>a.value?b:a):series[series.length-1];
  const formattedValue=format(featured.value);
  const titleSize=fitTextOnNLines({
    text:shot.title??"",maxBoxWidth:852,maxLines:2,
    fontFamily:globalStyle.editorialFont,fontWeight:820,maxFontSize:81
  }).fontSize;
  const summaryText=shot.subtitle??"";
  const summarySize=summaryText?fitTextOnNLines({
    text:summaryText,maxBoxWidth:840,maxLines:2,
    fontFamily:globalStyle.editorialFont,fontWeight:470,maxFontSize:34
  }).fontSize:34;
  const fadeOut=shot.transitionAfter!=="cut"&&shot.transitionFrames
    ?pct((shot.durationFrames-frame)/shot.transitionFrames):1;
  const serial=mode==="line"?dataPointGeometry(d):[];
  const linePath=serial.map((p,i)=>(i===0?"M ":" L ")+n(p.x)+" "+n(p.y)).join("");
  const heat=mode==="heatmap"?heatmapCells(series,d.domain):[];
  const valueWidth=(value:number)=>Math.max(0,Math.min(1,value/d.domain.max));
  const altColor="rgba(126,232,249,.25)";
  const chartModeLabel=mode==="line"?"ÉVOLUTION TEMPORELLE":mode==="ranking"
    ?"CLASSEMENT PAR VALEUR":"CARTE DE CHALEUR · INTENSITÉ";
  const showNumber=beat.number;
  const headlineOpacity=beat.intro*fadeOut;
  const unitLabel=d.unit?" · "+d.unit:"";
  const scaleLabel="ÉCHELLE "+format(d.domain.min)+" – "+format(d.domain.max)+unitLabel;
  const seriesSummary=mode==="line"?"DERNIER POINT":mode==="ranking"
    ?"VALEUR LA PLUS ÉLEVÉE":"CELLULE LA PLUS ÉLEVÉE";
  const labelClass:CSSProperties={fontSize:26,fontWeight:660,
    fill:"#e5f7fb",fontFamily:globalStyle.editorialFont};
  return <AbsoluteFill data-wv-data-motion={mode}
    style={{background:"#061827",color:"#f8feff",overflow:"hidden",
      fontFamily:globalStyle.editorialFont}}>
    <AbsoluteFill style={{
      background:"radial-gradient(ellipse at 68% 42%,#16465e 0%,#09283c 43%,#061827 78%)"
    }}/>
    {shot.media?.kind==="image"&&<AbsoluteFill data-wv-data-sourced-photo="true"
      style={{opacity:.16,overflow:"hidden"}}>
      <Img src={resolveCreativeSource(shot.media.src)} style={{
        width:"100%",height:"100%",objectFit:"cover",
        transform:"scale("+(1.04+beat.plot*.035)+")"
      }}/>
    </AbsoluteFill>}
    {/* A: editorial text comes first, not decorative effects. */}
    <div data-wv-data-heading="true" style={{
      position:"absolute",top:169,left:94,right:90,
      opacity:headlineOpacity,transform:"translateY("+Math.round(17*(1-beat.intro))+"px)",
      borderLeft:"5px solid "+accent,paddingLeft:19
    }}>
      <div style={{fontSize:25,fontWeight:780,color:"#a4f6fb",
        letterSpacing:".09em",marginBottom:12}}>{shot.eyebrow||chartModeLabel}</div>
      <div data-wv-title={shot.id} dir="auto" style={{
        fontSize:titleSize,fontWeight:830,lineHeight:1.07,
        letterSpacing:"-.042em",overflowWrap:"break-word",
        textShadow:"0 4px 29px rgba(0,7,15,.72)"
      }}>{shot.title}</div>
    </div>
    {/* B: display all source-axis choices explicitly. No implied zero baseline
      or axis trimming hidden from audiences. */}
    <div data-wv-data-scale="true" style={{
      position:"absolute",top:415,left:118,right:105,
      fontSize:27,fontWeight:720,color:"#9bdde8",
      opacity:beat.grid*fadeOut,letterSpacing:".04em"
    }}>{chartModeLabel} · {scaleLabel}</div>
    <svg viewBox="0 0 1080 1920" width="100%" height="100%"
      style={{position:"absolute",inset:0,pointerEvents:"none"}}>
      <defs>
        <clipPath id={"wv-data-graph-"+shot.id}>
          <rect x="110" y="505" width="865" height="710" rx="20"/>
        </clipPath>
      </defs>
      <rect x="92" y="475" width="896" height="736" rx="22"
        fill="rgba(4,21,36,.70)" stroke="#56b7cc" strokeOpacity=".36"
        strokeWidth="2" opacity={beat.grid}/>
      {mode==="line"&&<g data-wv-data-line="true" clipPath={"url(#wv-data-graph-"+shot.id+")"}>
        {[0,1,2,3,4].map((t)=><g key={t} opacity={beat.grid}>
          <line x1="125" x2="960" y1={590+t*122.5} y2={590+t*122.5}
            stroke="#9dc9d4" strokeOpacity=".25" strokeDasharray="5 8"/>
          <text x="128" y={584+t*122.5} fill="#afd5df" fontSize="21" fontWeight="550">
            {format(d.domain.max-(d.domain.max-d.domain.min)*t/4)}{d.unit}
          </text>
        </g>)}
        <path data-wv-data-line-path="true" d={linePath} fill="none"
          stroke={accent} strokeWidth="8" strokeLinejoin="round"
          strokeLinecap="round" pathLength={1} strokeDasharray="1"
          strokeDashoffset={1-beat.plot}
          style={{filter:"drop-shadow(0 0 12px rgba(46,221,255,.35))"}}/>
        {serial.map((point,i)=><g key={i} opacity={pct((beat.plot*(series.length-1)-i)*2)}>
          <circle cx={point.x} cy={point.y} r="8" fill="#e3feff" stroke="#0a7f9e" strokeWidth="3"/>
          {(i===0||i===serial.length-1)&&<text x={point.x} y={1160} textAnchor={i===0?"start":"end"}
            style={labelClass}>{point.label}</text>}
        </g>)}
      </g>}
      {mode==="ranking"&&<g data-wv-data-ranking="true">
        {ordered.map((point,i)=>{
          const y=537+i*81;
          const progress=pct((beat.plot*ordered.length-i)*.88);
          return <g key={point.label+"-"+i} opacity={beat.grid}>
            <text x="126" y={y+37} style={labelClass}>
              {String(point.rank).padStart(2,"0")} · {point.label.slice(0,18)}
            </text>
            <rect x="390" y={y+8} width={Math.max(0,500*valueWidth(point.value)*progress)}
              height="43" rx="8" fill={accent} fillOpacity=".85"/>
            <text x="916" y={y+39} fill="#e6fcff" fontWeight="750"
              fontSize="29" textAnchor="end">{format(point.value)}{d.unit}</text>
          </g>;
        })}
      </g>}
      {mode==="heatmap"&&<g data-wv-data-heatmap="true">
        {heat.map((cell,i)=>{
          const x=127+cell.col*280,y=542+cell.row*153;
          const reveal=pct((beat.plot*heat.length-i)*.6);
          const intensity=cell.intensity;
          return <g key={cell.label+"-"+i} opacity={reveal}>
            <rect x={x} y={y} width="254" height="130" rx="13"
              fill={accent} fillOpacity={.08+.65*intensity}
              stroke="#8be9f5" strokeOpacity=".28" strokeWidth="2"/>
            <text x={x+18} y={y+45} fill="#f3fdff" fontSize="27"
              fontWeight="650">{cell.label.slice(0,16)}</text>
            <text x={x+18} y={y+92} fill="#e7fcff" fontSize="44"
              fontWeight="820">{format(cell.value)}{d.unit}</text>
          </g>;
        })}
      </g>}
    </svg>
    {/* C: key number has an independent beat, not silently derived profit. */}
    <div data-wv-data-key-metric="true" style={{
      position:"absolute",top:1215,left:100,right:100,height:115,
      display:"flex",alignItems:"center",justifyContent:"space-between",
      opacity:showNumber*fadeOut
    }}>
      <div style={{fontSize:24,color:"#c5e9f1",fontWeight:770,maxWidth:380}}>
        {seriesSummary}<div style={{fontSize:31,marginTop:7,color:"#f1faff"}}>{featured.label}</div>
      </div>
      <div style={{fontSize:76,fontWeight:875,letterSpacing:"-.055em",color:"#b9faff"}}>
        {valueLabel(featured.value*showNumber,d.precision,d.locale??"fr-FR")}
        <span style={{fontSize:29,marginLeft:10}}>{d.unit}</span>
      </div>
    </div>
    {/* D/E: interpretation and provenance are independent tracks. */}
    {summaryText&&<div data-wv-data-caption="true" dir="auto" style={{
      position:"absolute",top:1361,left:100,right:100,
      borderTop:"3px solid "+accent,paddingTop:16,maxHeight:91,
      fontSize:summarySize,lineHeight:1.27,fontWeight:510,
      opacity:beat.notes*fadeOut,overflow:"hidden"
    }}>{summaryText}</div>}
    <div data-wv-data-provenance="true" style={{
      position:"absolute",top:1438,left:101,right:102,maxHeight:76,
      fontSize:27,lineHeight:1.2,color:"#bfdde6",
      opacity:beat.source*fadeOut
    }}>
      <span style={{fontWeight:770}}>SOURCE : </span>{d.source.publisher} · {d.source.dataset}
      <div style={{fontSize:24,marginTop:2}}>Situation au {d.source.asOf}. Données et échelle contrôlées par la rédaction.</div>
    </div>
  </AbsoluteFill>;
}
