/**
 * DATA Motion: deterministic frames; never fabricate or fetch market data.
 * Financial charts, rankings and heatmaps are faithful transformations of
 * editor-supplied series. Numeric source/date/unit/domain are explicit.
 */
export const DATA_MODES=Object.freeze(["line","ranking","heatmap"]);
export const dataClamp=(n)=>Math.max(0,Math.min(1,n));
export const dataEase=(n)=>{const x=dataClamp(n);return x*x*(3-2*x)};
export const dataBeat=(f,start,end)=>dataEase((f-start)/Math.max(1,end-start));
export function dataPose(frame,durationFrames){
  const f=Math.max(0,Math.min(durationFrames,frame));
  return {
    intro:.18+.82*dataBeat(f,0,25),
    grid:dataBeat(f,18,58),
    plot:dataBeat(f,35,112),
    number:dataBeat(f,91,128),
    notes:dataBeat(f,105,137),
    source:dataBeat(f,117,147)
  };
}
export function valueLabel(value,precision=0,locale="fr-FR"){
  return new Intl.NumberFormat(locale,{
    minimumFractionDigits:precision,maximumFractionDigits:precision
  }).format(value);
}
export function dataPointGeometry(data){
  const {series,domain}=data;
  const w=815,h=490,x0=140,y0=1080;
  return series.map((pt,i)=>({
    ...pt,
    x:x0+(w*i/Math.max(1,series.length-1)),
    y:y0-(pt.value-domain.min)/(domain.max-domain.min)*h
  }));
}
export function rankedData(series){
  const sorted=series.map((v,i)=>({...v,originalOrder:i}))
    .sort((a,b)=>b.value-a.value||a.originalOrder-b.originalOrder);
  let previous=null,rank=0;
  return sorted.map((entry,i)=>{
    if(previous===null||entry.value!==previous)rank=i+1;
    previous=entry.value;
    return {...entry,rank};
  });
}
export function heatmapCells(series,domain){
  const range=domain.max-domain.min;
  return series.map((entry,i)=>({
    ...entry,col:i%3,row:Math.floor(i/3),
    intensity:dataClamp((entry.value-domain.min)/range)
  }));
}
