/**
 * DATA Motion: deterministic projection of EDITOR-SUPPLIED numerical series.
 * No extrapolation, outlier clipping, smoothing, auto-news interpretation,
 * invented geographical routes, or fake exactness.
 *
 * Physical time-series x locations derive from real ISO dates; categorical x
 * locations are equally spaced and must be shown as categories, not times.
 */
const clamp=(x)=>Math.max(0,Math.min(1,x));
const easing=t=>{const x=clamp(t);return x*x*(3-2*x)};
export function dataBeat(frame,start,end){return easing((frame-start)/Math.max(1,end-start))}
export function dataMotionPose(frame,durationFrames,n=0){
  const f=Math.max(0,Math.min(frame,durationFrames));
  return {
    headline:.78+.22*dataBeat(f,0,27),
    chart:dataBeat(f,22,100),
    bars:Array.from({length:n},(_,i)=>dataBeat(f,30+i*8,76+i*8)),
    source:dataBeat(f,97,122),
    subtitle:dataBeat(f,105,139)
  };
}
export function valueDomain(values,{includeZero=true}={}){
  if(!values.length||!values.every(Number.isFinite))throw Error("A nonempty finite series is required");
  let min=Math.min(...values),max=Math.max(...values);
  if(includeZero){min=Math.min(0,min);max=Math.max(0,max)}
  if(max===min){const pad=Math.max(1,Math.abs(max)*.1);min-=pad;max+=pad}
  return {min,max};
}
export function valueCoordinate(value,domain,width){
  return (value-domain.min)/Math.max(Number.EPSILON,domain.max-domain.min)*width;
}
export function seriesCoordinates(points,{left,top,width,height},xMode="category"){
  if(!Array.isArray(points)||points.length<2)throw Error("Series needs at least 2 samples");
  const values=points.map(p=>p.value);
  const dom=valueDomain(values,{includeZero:true});
  const dates=xMode==="date"?points.map(p=>Date.parse(p.label+"T00:00:00Z")):null;
  if(dates&&(!dates.every(Number.isFinite)||dates.some((v,i)=>i>0&&v<=dates[i-1])))
    throw Error("Dates must be actual ordered ISO calendar days, not invented intervals");
  const xstart=dates?dates[0]:0,xend=dates?dates[dates.length-1]:points.length-1;
  return {
    domain:dom,
    baselineY:top+height-(0-dom.min)/(dom.max-dom.min)*height,
    coords:points.map((p,i)=>({
      label:p.label,value:p.value,
      x:left+(dates?((dates[i]-xstart)/(xend-xstart)):i/(points.length-1))*width,
      y:top+height-((p.value-dom.min)/(dom.max-dom.min))*height
    }))
  };
}
export function cellIntensity(value,min,max){
  if(!Number.isFinite(value)||!Number.isFinite(min)||!Number.isFinite(max)||max<=min)
    throw Error("Explicit finite legend min and max required");
  if(value<min||value>max)throw Error("Cell outside editor's explicit heatmap legend");
  return clamp((value-min)/(max-min));
}
export function formatMetric(value,precision=0){
  return new Intl.NumberFormat("fr-FR",{
    minimumFractionDigits:precision,
    maximumFractionDigits:precision
  }).format(value);
}
