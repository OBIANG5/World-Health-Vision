import {AbsoluteFill,useCurrentFrame} from "remotion";
import {fitTextOnNLines} from "@remotion/layout-utils";
import type {CreativeEditProps,CreativeShot} from "./CreativeEdit";
import {dataMotionPose,seriesCoordinates,valueDomain,valueCoordinate,cellIntensity,formatMetric} from "./data-motion-core.mjs";

type Style=Required<NonNullable<CreativeEditProps["visualStyle"]>>;
const graph={left:148,top:590,width:814,height:504};
const colors={cyan:"#9bf3ff",aqua:"#2ee6df",orange:"#ffd396",white:"#eff9fe",muted:"#b5d1da"};
const axisLabel=(text:string,x:number,y:number,anchor:"start"|"middle"|"end"="middle")=>
  <text key={x+"-"+y+"-"+text} x={x} y={y} fontSize={26} textAnchor={anchor}
    fill={colors.muted} fontWeight={550}>{text}</text>;

/**
 * World-Vision DATA: source-first responsive stories with no fictional
 * interpolation of measured observations.
 * 1. Actual equal-value/category x positions or exact ISO date spacing.
 * 2. Zero baseline for values, including negatives.
 * 3. No fabricated quotes/data, source URL not treated as certification.
 * 4. Shared Remotion frame output for Player and MP4.
 */
export function DataMotionStory({shot,globalStyle,enterOverlapFrames}:{
  shot:CreativeShot;globalStyle:Style;enterOverlapFrames:number;
}){
  const f=Math.max(0,useCurrentFrame()-enterOverlapFrames);
  const data=shot.data;
  if(!data)return <AbsoluteFill data-wv-data-invalid="true" style={{
    background:"#081926",color:"#e9f8ff",fontSize:30,display:"flex",
    justifyContent:"center",alignItems:"center"
  }}>Une série chiffrée et sa provenance sont obligatoires</AbsoluteFill>;
  const values=data.points??[];
  const matrix=data.matrix;
  const pose=dataMotionPose(f,shot.durationFrames,Math.max(values.length,matrix?.rows.length??0));
  const accent=shot.accent??globalStyle.accent;
  const headline=fitTextOnNLines({
    text:shot.title??"",fontFamily:globalStyle.editorialFont,
    fontWeight:820,maxBoxWidth:830,maxLines:2,maxFontSize:83
  }).fontSize;
  const subtitle=shot.subtitle?fitTextOnNLines({
    text:shot.subtitle,fontFamily:globalStyle.editorialFont,
    fontWeight:500,maxBoxWidth:835,maxLines:2,maxFontSize:36
  }).fontSize:36;
  const fade=shot.transitionAfter!=="cut"&&shot.transitionFrames
    ?Math.max(0,Math.min(1,(shot.durationFrames-f)/Math.max(1,shot.transitionFrames))):1;
  let chart:React.ReactNode=null;
  if(data.kind==="trend"&&values.length>=2){
    const p=seriesCoordinates(values,graph,data.xMode??"category");
    const d=p.coords.map((q,i)=>(i===0?"M":"L")+q.x.toFixed(2)+" "+q.y.toFixed(2)).join(" ");
    chart=<svg width="1080" height="1200" viewBox="0 0 1080 1200" style={{position:"absolute",top:0,left:0}}>
      <g data-wv-data-graph="trend">
        {[0,.25,.5,.75,1].map((tick,i)=>{
          const y=graph.top+graph.height*(1-tick);
          const val=p.domain.min+tick*(p.domain.max-p.domain.min);
          return <g key={i}>
            <line x1={graph.left} x2={graph.left+graph.width} y1={y} y2={y} stroke="#8fc9dc" strokeOpacity=".2" strokeWidth="2"/>
            {axisLabel(formatMetric(val,data.precision),graph.left-17,y+10,"end")}
          </g>;
        })}
        <line x1={graph.left} x2={graph.left+graph.width} y1={p.baselineY} y2={p.baselineY} stroke={colors.aqua} strokeOpacity=".6" strokeWidth="3"/>
        <path data-wv-data-line="true" d={d} fill="none" stroke={colors.cyan}
          strokeWidth="7" strokeLinejoin="round" strokeLinecap="round"
          pathLength={1} strokeDasharray={1} strokeDashoffset={1-pose.chart}
          filter="drop-shadow(0 0 8px rgba(32,231,255,.36))"/>
        {p.coords.map((q,i)=><g key={i} opacity={pose.bars[i]}>
          <circle cx={q.x} cy={q.y} r={8} fill="#e0ffff" stroke="#06738c" strokeWidth="4"/>
          {axisLabel(q.label,q.x,graph.top+graph.height+48)}
        </g>)}
      </g>
    </svg>;
  }
  if((data.kind==="comparison"||data.kind==="ranking")&&values.length>=2){
    const d=valueDomain(values.map(v=>v.value));
    const left=430,width=480,zero=left+valueCoordinate(0,d,width);
    chart=<svg width="1080" height="1200" viewBox="0 0 1080 1200"
      style={{position:"absolute",top:0,left:0}}>
      <g data-wv-data-graph={data.kind}>
        <line x1={zero} x2={zero} y1={515} y2={1116} stroke={colors.aqua} strokeWidth="3" strokeOpacity=".62"/>
        {values.map((v,i)=>{
          const top=525+i*94;
          const target=left+valueCoordinate(v.value,d,width);
          const barX=Math.min(target,zero);
          const barW=Math.abs(target-zero)*pose.bars[i];
          return <g key={i} data-wv-data-bar={i} opacity={.28+.72*pose.bars[i]}>
            <text x="112" y={top+38} fontSize={data.kind==="ranking"?34:31} fill={colors.white}
              fontWeight={data.kind==="ranking"?780:620}>
              {data.kind==="ranking"?String(i+1).padStart(2,"0")+"  ":""}{v.label}
            </text>
            <rect x={barX} y={top+7} width={barW} height={44} rx={7}
              fill={v.value<0?colors.orange:colors.aqua}/>
            <text x="932" y={top+40} textAnchor="end" fill={colors.white}
              fontSize={28} fontWeight={750}>{formatMetric(v.value,data.precision)} {data.unit}</text>
          </g>;
        })}
      </g>
    </svg>;
  }
  if(data.kind==="heatmap"&&matrix){
    const n=matrix.columns.length,m=matrix.rows.length;
    const gap=9,w=(817-gap*(n-1))/n,h=(479-gap*(m-1))/m;
    chart=<svg width="1080" height="1200" viewBox="0 0 1080 1200"
      style={{position:"absolute",top:0,left:0}}>
      <g data-wv-data-graph="heatmap">
        {matrix.columns.map((c,i)=>axisLabel(c,147+i*(w+gap)+w/2,568))}
        {matrix.rows.map((row,ri)=><g key={ri} opacity={.1+.9*pose.bars[ri]}>
          {axisLabel(row.label,116,623+ri*(h+gap)+h/2,"end")}
          {row.values.map((value,ci)=>{
            const intensity=cellIntensity(value,matrix.min,matrix.max);
            const x=148+ci*(w+gap),y=594+ri*(h+gap);
            return <g key={ci} data-wv-data-cell={ri+"-"+ci}>
              <rect x={x} y={y} width={w} height={h} rx={9}
                fill={"rgba(33,219,241,"+(.16+.73*intensity)+")"}
                stroke="rgba(156,244,255,.42)" strokeWidth="2"/>
              <text x={x+w/2} y={y+h/2+8} textAnchor="middle"
                fontSize={26} fontWeight={760} fill="#f3fdff">
                {formatMetric(value,data.precision)}
              </text>
            </g>;
          })}
        </g>)}
        <text x="150" y="1145" fontSize="25" fill={colors.muted}>
          Échelle explicite : {formatMetric(matrix.min,data.precision)} à {formatMetric(matrix.max,data.precision)} {data.unit}
        </text>
      </g>
    </svg>;
  }
  const verifiedSource=data.source.publisher+" · "+data.source.dataset+
    " · au "+data.source.asOf;
  return <AbsoluteFill data-wv-data-story={data.kind} style={{
    background:"#061827",overflow:"hidden",color:colors.white,
    fontFamily:globalStyle.editorialFont
  }}>
    <AbsoluteFill style={{background:
      "radial-gradient(ellipse at 68% 31%,rgba(16,89,118,.5),transparent 67%),linear-gradient(145deg,#03111d,#0a2638 60%,#04121e)"}}/>
    <div data-wv-data-heading="true" style={{
      position:"absolute",top:180,left:91,right:92,borderLeft:"5px solid "+accent,
      paddingLeft:24,opacity:pose.headline*fade,
      transform:"translateY("+Math.round(15*(1-pose.headline))+"px)"
    }}>
      {shot.eyebrow&&<div style={{fontSize:28,letterSpacing:".08em",
        color:"#9aebf6",fontWeight:790,marginBottom:19}}>{shot.eyebrow}</div>}
      <div data-wv-title={shot.id} dir="auto" style={{fontSize:headline,fontWeight:825,
        letterSpacing:"-.042em",lineHeight:1.07,textShadow:"0 5px 30px rgba(0,0,0,.57)"}}>
        {shot.title}
      </div>
      <div style={{fontSize:28,color:"#a9dce8",marginTop:22}}>{data.unit} · {data.kind==="trend"?(data.xMode==="date"?"DATES RÉELLES":"CATÉGORIES"):"COMPARAISON VISUELLE"}</div>
    </div>
    {chart}
    <div data-wv-data-source="true" style={{
      position:"absolute",top:1250,left:97,right:99,
      borderTop:"2px solid rgba(79,206,239,.62)",
      paddingTop:17,opacity:pose.source*fade
    }}>
      <div style={{fontSize:31,fontWeight:760,color:"#ecfaff",lineHeight:1.24}}>
        {data.synthetic?"DÉMONSTRATION · VALEURS FICTIVES":"Source fournie par l'éditeur"}
      </div>
      <div data-wv-data-provenance="true" style={{fontSize:30,lineHeight:1.26,
        color:"#bddce5",marginTop:9,overflowWrap:"break-word"}}>
        {verifiedSource}
      </div>
    </div>
    {shot.subtitle&&<div data-wv-data-caption="true" dir="auto" style={{
      position:"absolute",top:1430,left:96,right:97,maxHeight:140,
      overflow:"hidden",fontSize:subtitle,fontWeight:510,lineHeight:1.32,
      opacity:pose.subtitle*fade,textShadow:"0 5px 25px rgba(0,0,0,.5)"
    }}>{shot.subtitle}</div>}
  </AbsoluteFill>;
}
