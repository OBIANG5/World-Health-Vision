/**
 * World-Vision Studio portable project reader.
 * 
 * This is deliberately restricted to the current Studio JSON export format.
 * It never opens a media URL, runs scripts, grants rights, or rewrites facts.
 * The caller explicitly reconnects local assets by their original filenames.
 */
import {captionCueIssues} from "../src/caption-timeline.mjs";

export const STUDIO_PROJECT_FORMAT="worldvision-creative-project-v1";
const SHOT_TYPES=new Set(["documentary","kinetic","evidence","number","clean_video","focus_reveal","document_focus","geo_story","country_focus","photo_story","data_story"]);
const MOTIONS=new Set(["locked","dolly","drift","push"]);
const TRANSITIONS=new Set(["cut","dissolve","slide"]);
const IMG=new Set(["jpg","jpeg","png","webp"]);
const VID=new Set(["mp4","mov","webm"]);
const AUDIO=new Set(["wav","mp3","m4a","aac","flac"]);
const SLUG=/^[a-zA-Z0-9][a-zA-Z0-9_-]{2,79}$/;
const COLOR=/^#[0-9a-fA-F]{6}$/;
const toObject=v=>v!==null&&typeof v==="object"&&!Array.isArray(v);
const readable=v=>typeof v==="string"&&v.trim().length>0;
const fail=msg=>{throw Error("Projet non importable : "+msg);};
const only=(o,allowed,label)=>{
  if(!toObject(o))fail(label+" doit être un objet.");
  for(const k of Object.keys(o))if(!allowed.includes(k))fail(label+" contient un champ non pris en charge : "+k+" (pas de perte silencieuse).");
};
function filename(name,kinds,label){
  if(!readable(name)||name.length>220||name.includes("/")||name.includes("\\")||name.includes("\0")||
    name==="."||name===".."||name.includes(".."+".")||/^[a-z]+:/i.test(name)||!kinds.has(name.split(".").pop()?.toLowerCase()))
    fail(label+" : fichier local à nom simple et extension attendue requis.");
}
const finite=v=>typeof v==="number"&&Number.isFinite(v);
const integer=(v,low,high)=>Number.isInteger(v)&&v>=low&&v<=high;
function validateMedia(media,label){
  if(media==null)return;
  only(media,["file","kind","credit","trimBefore"],label);
  if(!["image","video"].includes(media.kind))fail(label+" : type image/video uniquement.");
  filename(media.file,media.kind==="image"?IMG:VID,label+".file");
  if(media.credit!=null&&typeof media.credit!=="string")fail(label+".credit invalide.");
  if(media.trimBefore!=null&&(!integer(media.trimBefore,0,30000)||media.kind!=="video"))
    fail(label+".trimBefore invalide.");
}
function validateAudio(value,label,requiredVolume,expectedLabel){
  if(value==null)return;
  only(value,["file","label","volume"],label);
  filename(value.file,AUDIO,label+".file");
  if(value.label!=null&&value.label!==expectedLabel)fail(label+" : libellé audio non pris en charge sans perte.");
  if(value.volume!=null&&value.volume!==requiredVolume)
    fail(label+" : ce Studio ne sait pas encore préserver un volume autre que "+requiredVolume+".");
}
function shotDuration(project){
  let total=0;
  for(const [i,s] of project.shots.entries()){
    total+=s.durationFrames;
    if(i<project.shots.length-1&&s.transitionAfter!=="cut")total-=s.transitionFrames??0;
  }
  return total;
}
export function parseStudioProject(text){
  if(typeof text!=="string"||text.length>2_000_000)fail("taille supérieure à 2 Mo ou entrée non textuelle.");
  let p;
  try{p=JSON.parse(text);}catch{fail("JSON invalide.");}
  only(p,["schema_version","id","title","script","fps","aspect_ratio","style","shots","voice","music","outro","captions"],"projet");
  if(p.schema_version!==STUDIO_PROJECT_FORMAT||p.fps!==30||p.aspect_ratio!=="9:16")
    fail("format/30 fps/9:16 incompatibles.");
  if(!SLUG.test(p.id)||!readable(p.title)||p.title.length>160||
     !readable(p.script)||p.script.length>50000)fail("ID, titre ou texte de narration invalide.");
  if(!Array.isArray(p.shots)||!p.shots.length||p.shots.length>80)fail("1 à 80 plans requis.");
  if(p.style!=null){
    only(p.style,["background","ink","accent"],"style");
    if(p.style.background!=="#0b1721"||p.style.ink!=="#f6f8fa"||
       !COLOR.test(p.style.accent))fail("style incompatible avec cet atelier (aucune conversion automatique).");
  }
  const seen=new Set();
  for(const [i,s] of p.shots.entries()){
    const label="plan "+(i+1);
    only(s,["id","durationFrames","template","title","subtitle","eyebrow","focus","documentRegion","photo","geo","data","motion","transitionAfter","transitionFrames","media","foreground"],label);
    if(!SLUG.test(s.id)||seen.has(s.id))fail(label+" : ID absent ou répété.");
    seen.add(s.id);
    if(!SHOT_TYPES.has(s.template)||!integer(s.durationFrames,1,3600))fail(label+" : modèle ou durée invalide.");
    if(s.motion!=null&&!MOTIONS.has(s.motion))fail(label+" : mouvement inconnu.");
    if(s.transitionAfter!=null&&!TRANSITIONS.has(s.transitionAfter))fail(label+" : transition inconnue.");
    const t=s.transitionFrames??0;
    if(!integer(t,0,18)||((s.transitionAfter??"cut")==="cut"&&t>0)||
       (i===p.shots.length-1&&t>0)||
       (i<p.shots.length-1&&t>=Math.min(s.durationFrames,p.shots[i+1]?.durationFrames||0)))
      fail(label+" : transition incompatible avec les durées.");
    for(const field of ["title","subtitle","eyebrow"]){
      if(s[field]!=null&&(typeof s[field]!=="string"||s[field].length>500))fail(label+"."+field+" invalide.");
    }
    if(s.focus!=null&&(!toObject(s.focus)||!finite(s.focus.x)||!finite(s.focus.y)||
       s.focus.x<0||s.focus.x>1||s.focus.y<0||s.focus.y>1))
      fail(label+".focus hors limites.");
    if(s.media!=null)validateMedia(s.media,label+".media");
    if(s.foreground!=null){
      only(s.foreground,["file","credit"],label+".foreground");
      filename(s.foreground.file,new Set(["png","webp"]),label+".foreground.file");
      if(s.foreground.credit!=null&&typeof s.foreground.credit!=="string")fail(label+".foreground.credit invalide.");
    }
    if(s.photo!=null){
      if(s.template!=="photo_story")fail(label+" : pistes PHOTO incompatibles avec ce modèle.");
      only(s.photo,["camera","subject","mask","focus","metric"],label+".photo");
      if(s.photo.camera)only(s.photo.camera,["zoomFrom","zoomTo","panX","panY","startFrame","endFrame"],label+".photo.camera");
      if(s.photo.subject)only(s.photo.subject,["dx","dy","scale","startFrame","endFrame"],label+".photo.subject");
      if(s.photo.mask)only(s.photo.mask,["axis","startFrame","endFrame"],label+".photo.mask");
      if(s.photo.focus)only(s.photo.focus,["x","y","radius","startFrame","endFrame"],label+".photo.focus");
      if(s.photo.metric)only(s.photo.metric,["label","value","unit","precision","sourceLabel","startFrame","endFrame"],label+".photo.metric");
    }
    if(s.documentRegion!=null){
      if(s.template!=="document_focus")fail(label+" : région documentaire incompatible avec ce modèle.");
      only(s.documentRegion,["x","y","width","height"],label+".documentRegion");
    }
    if(s.geo!=null){
      if(!["geo_story","country_focus"].includes(s.template))
        fail(label+" : champs GEO incompatibles avec ce modèle.");
      if(s.template!=="geo_story"&&(s.geo.camera||s.geo.route))
        fail(label+" : camera/route GEO indisponible dans country_focus.");
      if(s.template==="country_focus"&&!s.geo.spotlight)
        fail(label+" : country_focus exige son identifiant de pays.");

      only(s.geo,["center","look","spinDegrees","camera","spotlight","target","route","metric"],label+".geo");
      if(s.geo.center)only(s.geo.center,["lon","lat"],label+".geo.center");
      if(s.geo.camera){
        only(s.geo.camera,["to","startFrame","endFrame","zoom"],label+".geo.camera");
        if(s.geo.camera.to)only(s.geo.camera.to,["lon","lat"],label+".geo.camera.to");
      }
      if(s.geo.spotlight)only(s.geo.spotlight,["countryId"],label+".geo.spotlight");
      if(s.geo.target)only(s.geo.target,["lon","lat","label"],label+".geo.target");
      if(s.geo.route){
        only(s.geo.route,["from","to"],label+".geo.route");
        if(s.geo.route.from)only(s.geo.route.from,["lon","lat"],label+".geo.route.from");
        if(s.geo.route.to)only(s.geo.route.to,["lon","lat"],label+".geo.route.to");
      }
      if(s.geo.metric)only(s.geo.metric,["label","value","unit","precision"],label+".geo.metric");
      if(s.geo.metric?.precision!=null&&s.geo.metric.precision!==0)
        fail(label+".geo.metric : précision non prise en charge.");
      if(s.geo.route&&(!s.geo.target||s.geo.route.to?.lon!==s.geo.target.lon||
        s.geo.route.to?.lat!==s.geo.target.lat))
        fail(label+".geo.route : destination différente du repère de cible, non modifiable par Studio.");
    }
    if(s.data!=null){
      if(s.template!=="data_story")fail(label+" : champs DATA incompatibles avec ce modèle.");
      only(s.data,["mode","series","source","domain","precision","unit","locale"],label+".data");
      if(s.data.source)only(s.data.source,["publisher","dataset","asOf","url"],label+".data.source");
      if(s.data.domain)only(s.data.domain,["min","max"],label+".data.domain");
      if(Array.isArray(s.data.series)){
        for(const [j,row] of s.data.series.entries()){
          only(row,s.data.mode==="line"?["date","label","value"]:["label","value"],label+".data.series["+j+"]");
          if(typeof row.label!=="string"||/[|\n\r]/.test(row.label)||
            (s.data.mode==="line"&&(typeof row.date!=="string"||/[|\n\r]/.test(row.date)))||
            !finite(row.value))
            fail(label+".data.series : date, valeur ou libellé non préservable.");
        }
      }
    }
    if(s.template==="photo_story"&&(!toObject(s.photo)||!toObject(s.photo.camera)))
      fail(label+" : PHOTO requiert ses pistes caméra originales.");
    if(s.template==="data_story"&&(!toObject(s.data)||!Array.isArray(s.data.series)||
       !toObject(s.data.source)||!toObject(s.data.domain)))
      fail(label+" : DATA requiert séries et sources.");
    if(["geo_story","country_focus"].includes(s.template)&&
       (!toObject(s.geo)||!toObject(s.geo.center)))fail(label+" : géographie requise.");
    if(s.template==="document_focus"&&(!toObject(s.documentRegion)||
       !["x","y","width","height"].every(k=>finite(s.documentRegion[k]))))
      fail(label+" : zone documentaire invalide.");
  }
  validateAudio(p.voice,"voice",1,"Voix choisie ou enregistrée");
  validateAudio(p.music,"music",0.1,"Bande-son fournie");
  if(p.outro!=null){
    only(p.outro,["file","durationFrames"],"outro");
    filename(p.outro.file,VID,"outro.file");
    if(p.outro.durationFrames!==90)fail("outro : durée différente du profil 90 frames du Studio.");
  }
  const filmFrames=shotDuration(p);
  if(filmFrames<=0||filmFrames+(p.outro?.durationFrames??0)>18000)
    fail("durée globale du film invalide.");
  if(Array.isArray(p.captions)){
    for(const [i,cue] of p.captions.entries())only(cue,["startFrame","endFrame","text","position"],"captions["+i+"]");
  }
  const problems=captionCueIssues(p.captions,filmFrames);
  if(problems.length)fail(problems[0].field+" : "+problems[0].reason);
  return p;
}
const timeStamp=(frame)=>{
  const ms=Math.round(frame*1000/30);
  const h=Math.floor(ms/3600000),m=Math.floor(ms/60000)%60,s=Math.floor(ms/1000)%60,t=ms%1000;
  return [h,m,s].map(n=>String(n).padStart(2,"0")).join(":")+","+String(t).padStart(3,"0");
};
export function frameCaptionsToSrt(cues=[]){
  return cues.map((c,i)=>String(i+1)+"\n"+timeStamp(c.startFrame)+" --> "+timeStamp(c.endFrame)+"\n"+c.text).join("\n\n");
}
export function studioAssetNames(project){
  const all=[];
  for(const s of project.shots){
    if(s.media?.file)all.push(s.media.file);
    if(s.foreground?.file)all.push(s.foreground.file);
  }
  for(const a of [project.voice,project.music,project.outro])if(a?.file)all.push(a.file);
  return [...new Set(all)];
}

/**
 * Rehydrate the complete editable form without guessing geographic/data values.
 * Defaults are provided by the board to keep one source of initial UI values.
 * Unknown/additional supported fields must be handled before accepting import.
 */
export function studioShotToEditor(s,defaults){
  const geo=s.geo??{},photo=s.photo??{},data=s.data??{};
  const d=(data.series??[]).map(row=>data.mode==="line"
    ? [row.date,row.label,String(row.value)].join("|")
    : [row.label,String(row.value)].join("|")).join("\n");
  const settings=defaults.photoSettings??{};
  return {
    ...defaults,
    id:s.id,title:s.title??"",subtitle:s.subtitle??"",eyebrow:s.eyebrow??"",
    durationFrames:s.durationFrames,template:s.template,
    motion:s.motion??"locked",transitionAfter:s.transitionAfter??"cut",
    transitionFrames:s.transitionFrames??0,
    mediaName:s.media?.file??"",mediaCredit:s.media?.credit??"",
    mediaTrimBefore:s.media?.trimBefore??0,
    foregroundName:s.foreground?.file??"",foregroundCredit:s.foreground?.credit??"",
    focusX:s.focus?.x??0.5,focusY:s.focus?.y??0.5,
    documentX:s.documentRegion?.x??defaults.documentX,documentY:s.documentRegion?.y??defaults.documentY,
    documentW:s.documentRegion?.width??defaults.documentW,documentH:s.documentRegion?.height??defaults.documentH,
    geoLon:geo.center?.lon??defaults.geoLon,geoLat:geo.center?.lat??defaults.geoLat,
    geoSpin:geo.spinDegrees??defaults.geoSpin,geoLook:geo.look??defaults.geoLook,
    geoShowCamera:Boolean(geo.camera),geoToLon:geo.camera?.to?.lon??defaults.geoToLon,
    geoToLat:geo.camera?.to?.lat??defaults.geoToLat,
    geoCameraStart:geo.camera?.startFrame??defaults.geoCameraStart,
    geoCameraEnd:geo.camera?.endFrame??defaults.geoCameraEnd,
    geoCameraZoom:geo.camera?.zoom??defaults.geoCameraZoom,
    geoShowCountry:Boolean(geo.spotlight),geoCountryId:geo.spotlight?.countryId??"",
    geoShowTarget:Boolean(geo.target),geoTargetLon:geo.target?.lon??defaults.geoTargetLon,
    geoTargetLat:geo.target?.lat??defaults.geoTargetLat,
    geoTargetLabel:geo.target?.label??"",
    geoShowRoute:Boolean(geo.route),geoFromLon:geo.route?.from?.lon??defaults.geoFromLon,
    geoFromLat:geo.route?.from?.lat??defaults.geoFromLat,
    geoShowMetric:Boolean(geo.metric),geoMetricLabel:geo.metric?.label??"",
    geoMetricValue:geo.metric?String(geo.metric.value):"",geoMetricUnit:geo.metric?.unit??"",
    photoSettings:{
      ...settings,camera:{...settings.camera,...photo.camera},
      subject:{...settings.subject,...photo.subject},
      mask:{...settings.mask,...photo.mask},
      focus:{...settings.focus,...photo.focus},
      metric:{...settings.metric,...photo.metric}
    },
    photoUseSubject:Boolean(photo.subject),photoUseMask:Boolean(photo.mask),
    photoUseFocus:Boolean(photo.focus),photoUseMetric:Boolean(photo.metric),
    dataMode:data.mode??defaults.dataMode,dataRaw:d,
    dataPublisher:data.source?.publisher??"",dataDataset:data.source?.dataset??"",
    dataAsOf:data.source?.asOf??"",dataUrl:data.source?.url??"",
    dataUnit:data.unit??"",dataPrecision:data.precision??0,dataLocale:data.locale??"fr-FR",
    dataMin:data.domain?.min!==undefined?String(data.domain.min):"",
    dataMax:data.domain?.max!==undefined?String(data.domain.max):""
  };
}
