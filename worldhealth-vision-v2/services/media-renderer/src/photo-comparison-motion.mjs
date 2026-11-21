/**
 * Editorial PHOTO × DATA — evidence-grounded 2-value comparison in one frame.
 * It does not generate statistics, dates, source names, or any new visuals.
 * A bar's length reveals the AUTHORED value from the true zero baseline;
 * the number stays constant during animation (no fictitious intermediates).
 */
const isObj=v=>v!==null&&typeof v==='object'&&!Array.isArray(v);
const finite=v=>typeof v==='number'&&Number.isFinite(v)&&Math.abs(v)<=1e12;
const text=(v,max)=>typeof v==='string'&&v.trim().length>0&&v.length<=max&&
  !/[\u0000-\u001f<>]/u.test(v);
const isoDate=v=>{
  if(typeof v!=='string'||!/^\d{4}-\d{2}-\d{2}$/.test(v))return false;
  const d=new Date(v+'T12:00:00Z');
  return Number.isFinite(d.getTime())&&d.toISOString().slice(0,10)===v;
};
const isHttps=v=>typeof v==='string'&&v.length<=1000&&
  /^https:\/\/[^\s/?#]+(?:[/?#][^\s]*)?$/i.test(v);
export const photoComparisonIssues=(c,shotDuration)=>{
  const errors=[];
  const err=(field,reason)=>errors.push({field,reason});
  if(!isObj(c)){err('comparison','Editor-approved comparison object required');return errors;}
  if(!text(c.title,65))err('title','Use a short editor-written comparison heading');
  if(!Number.isInteger(c.startFrame)||!Number.isInteger(c.endFrame)||
     c.startFrame<0||c.endFrame>shotDuration||c.endFrame-c.startFrame<30)
    err('time','Use a separate 30+ frame reveal within this shot');
  const pair=[c.first,c.second];
  pair.forEach((p,i)=>{
    const name=i===0?'first':'second';
    if(!isObj(p)||!text(p.label,30)||!finite(p.value))
      err(name,'Each line needs a named, finite and sourced value');
  });
  if(pair.every(p=>isObj(p)&&typeof p.label==='string')&&
     pair[0].label.trim().toLocaleLowerCase('fr-FR')===
     pair[1].label.trim().toLocaleLowerCase('fr-FR'))
    err('labels','The two compared entries must be different');
  const d=c.domain;
  if(!isObj(d)||!finite(d.min)||!finite(d.max)||
     !(d.min<=0&&d.max>=0&&d.min<d.max))
    err('domain','Axis must include ZERO and have a finite strict min/max');
  else pair.forEach((p,i)=>{
    if(isObj(p)&&finite(p.value)&&!(p.value>=d.min&&p.value<=d.max))
      err(i===0?'first.value':'second.value','Bar data must fit the displayed axis');
  });
  if(!text(c.unit,12))err('unit','An explicit measurement unit is required');
  if(!Number.isInteger(c.precision)||c.precision<0||c.precision>2)
    err('precision','Displayed values use 0–2 decimals');
  if(!['fr-FR','en-US'].includes(c.locale))
    err('locale','Explicit locale required to avoid ambiguous numbers');
  const s=c.source;
  if(!isObj(s)||!text(s.publisher,80)||!text(s.dataset,120)||!isoDate(s.asOf)||
     (s.url!==undefined&&!isHttps(s.url)))
    err('source','Publisher, dataset, genuine ISO date and optional HTTPS URL required');
  return errors;
};
const clip=n=>Math.max(0,Math.min(1,n));
const ease=x=>{const t=clip(x);return t*t*(3-2*t);};
/**
 * Compute signed bar geometry relative to a visible zero-axis.
 * Positive values extend RIGHT and negative values LEFT. Domain is fixed.
 * All normalized positions are exact proportions of editor-supplied values.
 */
export function photoComparisonPose(c,frame){
  const d=c.domain;
  const width=d.max-d.min;
  const origin=(0-d.min)/width;
  const reveal=ease((frame-c.startFrame)/Math.max(1,c.endFrame-c.startFrame));
  const bars=[c.first,c.second].map(entry=>{
    const target=(entry.value-d.min)/width;
    const tip=origin+(target-origin)*reveal;
    return {
      value:entry.value,
      label:entry.label,
      zero:origin,
      start:Math.min(origin,tip),
      end:Math.max(origin,tip),
      width:Math.abs(tip-origin),
      direction:entry.value<0?'negative':entry.value>0?'positive':'zero'
    };
  });
  return {reveal,origin,axisMin:d.min,axisMax:d.max,bars};
}
