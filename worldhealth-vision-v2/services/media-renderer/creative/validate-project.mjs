/**
 * World-Vision creative project v1 — user materials in, deterministic edit out.
 * No AI scripted news, no fixed narrator, no mandatory RADAR or GDELT.
 * Validation is technical; editorial/source and commercial rights remain human.
 */
import path from "node:path";
import fs from "node:fs";
import {createRequire} from "node:module";
import {feature} from "topojson-client";
import {geoContains} from "d3-geo";

// Keep spotlight IDs bound to the exact Natural Earth atlas used by Remotion.
const requireAtlas=createRequire(import.meta.url);
const countryGeometry=requireAtlas("world-atlas/countries-110m.json").objects.countries.geometries;
const DETAILED_ATLAS=requireAtlas("world-atlas/countries-10m.json");
const DETAIL_COUNTRIES=DETAILED_ATLAS.objects.countries.geometries;
const DETAILED_IDS=new Set(DETAIL_COUNTRIES.map(g=>String(g.id).padStart(3,"0")));
const COUNTRY_IDS=new Set(countryGeometry.map(g=>String(g.id).padStart(3,"0")));

export const FORMAT = "worldvision-creative-project-v1";
const TEMPLATES = new Set(["documentary","kinetic","evidence","number","clean_video","focus_reveal","document_focus","geo_story","country_focus","photo_story","data_story"]);
const TRANSITIONS = new Set(["cut","dissolve","slide"]);
const MOTIONS = new Set(["locked","dolly","drift","push"]);
const IMAGE_EXT = new Set([".png",".jpg",".jpeg",".webp"]);
const VIDEO_EXT = new Set([".mp4",".mov",".webm"]);
const AUDIO_EXT = new Set([".wav",".mp3",".m4a",".aac",".flac"]);
const SLUG = /^[a-zA-Z0-9][a-zA-Z0-9_-]{2,79}$/;
const COLOR = /^#[0-9a-fA-F]{6}$/;

function bad(errors,field,reason){errors.push({field,reason});}
function boundedInteger(value,min,max){return Number.isInteger(value)&&value>=min&&value<=max;}
function isText(value,max=800){return typeof value==="string"&&value.length<=max;}
function isLocalPath(value){
  if(typeof value!=="string"||!value||value.includes("\0")||value.includes("\\"))return false;
  if(value.startsWith("/")||value.startsWith("//")||/^[a-z]+:/i.test(value))return false;
  const parts=value.split("/");
  return !parts.includes("..")&&!parts.includes(".")&&parts.every(Boolean);
}
export function durationFrames(project){
  if(!Array.isArray(project?.shots))return 0;
  let total=0;
  for(let i=0;i<project.shots.length;i++){
    const scene=project.shots[i];
    total+=scene.durationFrames||0;
    if(i<project.shots.length-1&&["dissolve","slide"].includes(scene.transitionAfter))
      total-=scene.transitionFrames||0;
  }
  total+=project.outro?.durationFrames||0;
  return total;
}
export function inspectProject(project) {
  const errors=[];
  if(!project||typeof project!=="object"||Array.isArray(project)){
    return {ok:false,errors:[{field:"project",reason:"Expected JSON object."}]};
  }
  if(project.schema_version!==FORMAT)bad(errors,"schema_version","Unknown project format.");
  if(!SLUG.test(project.id||""))bad(errors,"id","Use a stable 3-80 character slug.");
  if(!isText(project.title,180)||!project.title.trim())bad(errors,"title","Project title required.");
  if(!isText(project.script,50000)||!project.script.trim())bad(errors,"script","Provide your script; this tool never writes or rewrites it.");
  if(project.fps!==30||project.aspect_ratio!=="9:16")bad(errors,"video","Initial delivery profile is 1080x1920/30fps.");
  if(!Array.isArray(project.shots)||!project.shots.length||project.shots.length>80){
    bad(errors,"shots","Include between 1 and 80 explicitly directed shots.");
  }
  const seen=new Set();
  for(const [i,scene] of (Array.isArray(project.shots)?project.shots:[]).entries()){
    const p="shots["+i+"]";
    if(!scene||typeof scene!=="object"){bad(errors,p,"Shot must be an object.");continue;}
    if(!SLUG.test(scene.id||"")||seen.has(scene.id))bad(errors,p+".id","Unique shot slug required.");
    seen.add(scene.id);
    if(!TEMPLATES.has(scene.template))bad(errors,p+".template","Unknown template.");
    if(!boundedInteger(scene.durationFrames,1,3600))bad(errors,p+".durationFrames","1-3600 frames required.");
    if(scene.motion!==undefined&&!MOTIONS.has(scene.motion))bad(errors,p+".motion","Unknown motion profile.");
    if(scene.transitionAfter!==undefined&&!TRANSITIONS.has(scene.transitionAfter))bad(errors,p+".transitionAfter","Unknown transition.");
    const t=scene.transitionFrames??0;
    if(!boundedInteger(t,0,18))bad(errors,p+".transitionFrames","Only deliberate 0-18 frame transitions.");
    if(i===project.shots.length-1&&t>0)bad(errors,p+".transitionFrames","Final shot cannot transition into an absent shot.");
    if(t>0&&!["dissolve","slide"].includes(scene.transitionAfter))bad(errors,p+".transitionFrames","Transition frames require dissolve or slide.");
    if(i<project.shots.length-1&&scene.transitionAfter!=="cut"&&t>0&&
       (t>=scene.durationFrames||t>=project.shots[i+1]?.durationFrames))
      bad(errors,p+".transitionFrames","Transition must be shorter than both adjacent shots.");
    if(scene.focus&&(typeof scene.focus.x!=="number"||typeof scene.focus.y!=="number"||
       scene.focus.x<0||scene.focus.x>1||scene.focus.y<0||scene.focus.y>1))
      bad(errors,p+".focus","Focus must be normalized x,y 0-1.");
    for(const k of ["title","subtitle","eyebrow","footnote"]){
      if(scene[k]!==undefined&&!isText(scene[k],k==="title"?150:500))bad(errors,p+"."+k,"Invalid or excessive overlay text.");
    }
    if(scene.accent!==undefined&&!COLOR.test(scene.accent))bad(errors,p+".accent","Use six-digit hex color.");
    if(scene.template==="focus_reveal"&&scene.durationFrames<90)
      bad(errors,p+".durationFrames","Cinematic focus reveal needs at least 90 frames to complete the composition.");
    if(scene.template==="focus_reveal"&&(!isText(scene.title,90)||!scene.title?.trim()))
      bad(errors,p+".title","Focus reveal requires a concise authored headline (max 90 characters).");
    if(scene.template==="document_focus"){
      if(scene.durationFrames<115)
        bad(errors,p+".durationFrames","Document focus needs at least 115 frames for legible evidence and authored captions.");
      if(!isText(scene.title,90)||!scene.title?.trim())
        bad(errors,p+".title","Document focus needs a concise, supplied headline (up to 90 characters).");
      if(scene.subtitle!==undefined&&!isText(scene.subtitle,180))
        bad(errors,p+".subtitle","Document focus subtitle is limited to 180 characters.");
      if(scene.media?.kind!=="image")
        bad(errors,p+".media","Document focus requires a supplied unaltered still image/screenshot.");
      const region=scene.documentRegion;
      if(!region||typeof region!=="object"||
         ![region.x,region.y,region.width,region.height].every(v=>typeof v==="number"&&Number.isFinite(v))||
         region.width<.12||region.width>.85||region.height<.08||region.height>.8||
         region.x<0||region.y<0||
         region.x+region.width>1.0000001||region.y+region.height>1.0000001)
        bad(errors,p+".documentRegion",
          "Select a visible 0-1 document region x/y/width/height; width 12%-85%, height 8%-80%, fully inside the unmodified document viewport.");
    }
    if(scene.template==="photo_story"){
      if(!boundedInteger(scene.durationFrames,150,3600))
        bad(errors,p+".durationFrames","Multi-track PHOTO needs 150-3600 frames for staggered beats.");
      if(!isText(scene.title,90)||!scene.title?.trim())
        bad(errors,p+".title","Provide a short human-authored photographic headline (<=90).");
      if(scene.subtitle!==undefined&&!isText(scene.subtitle,180))
        bad(errors,p+".subtitle","Max 180 characters for the spoken/visual explanatory line.");
      if(scene.media?.kind!=="image")
        bad(errors,p+".media","PHOTO multi-layer requires one original supplied still image; video/photo synthesis is not substituted.");
      const ph=scene.photo;
      if(!ph||typeof ph!=="object"||Array.isArray(ph)){
        bad(errors,p+".photo","Author separate deterministic motion tracks, no inferred image contents.");
      }else{
        const within=(v,min,max)=>typeof v==="number"&&Number.isFinite(v)&&v>=min&&v<=max;
        const timing=(q,min=25)=>q&&boundedInteger(q.startFrame,0,scene.durationFrames-20)&&
          boundedInteger(q.endFrame,1,scene.durationFrames)&&q.endFrame-q.startFrame>=min;
        const c=ph.camera;
        if(!c||!timing(c,35)||!within(c.zoomFrom,1.03,1.18)||
          !within(c.zoomTo,c.zoomFrom??2,1.20)||
          !within(c.panX,-40,40)||!within(c.panY,-45,45)||
          (Number.isFinite(c.zoomTo)&&Number.isFinite(c.panX)&&
             Math.abs(c.panX)>(c.zoomTo-1)*540)||
          (Number.isFinite(c.zoomTo)&&Number.isFinite(c.panY)&&
             Math.abs(c.panY)>(c.zoomTo-1)*960))
          bad(errors,p+".photo.camera","Camera needs valid beats, modest zoom 1.03-1.20, and pan within original still's zoomed crop.");
        if(ph.subject!==undefined){
          const s=ph.subject;
          if(!scene.foreground||!timing(s,25)||!within(s.dx,-45,45)||
            !within(s.dy,-45,45)||!within(s.scale,0,.16))
            bad(errors,p+".photo.subject","Independent parallax requires an external transparent foreground, sensible offsets and timing.");
        }
        if(ph.mask!==undefined){
          const m=ph.mask;
          if(!timing(m,20)||!["horizontal","vertical"].includes(m.axis))
            bad(errors,p+".photo.mask","Clip must reveal original image in a defined horizontal/vertical direction.");
        }
        if(ph.focus!==undefined){
          const f=ph.focus;
          if(!timing(f,20)||!within(f.x,.07,.93)||!within(f.y,.09,.76)||
            !within(f.radius,35,190))
            bad(errors,p+".photo.focus","Manual focus stays in usable image area with valid radius and motion beats.");
        }
        if(ph.metric!==undefined){
          const m=ph.metric;
          if(!timing(m,25)||!isText(m.label,55)||!m.label?.trim()||
            !within(m.value,-1e12,1e12)||!isText(m.unit,12)||
            !boundedInteger(m.precision,0,2)||
            !isText(m.sourceLabel,85)||!m.sourceLabel?.trim())
            bad(errors,p+".photo.metric","An editor-provided count needs a finite value, unit, readable source label and independent timing.");
        }
      }
    }
    if(scene.template==="data_story"){
      if(!boundedInteger(scene.durationFrames,150,3600))
        bad(errors,p+".durationFrames","DATA motion needs 150-3600 frames for readable chart and source beats.");
      if(!isText(scene.title,90)||!scene.title?.trim())
        bad(errors,p+".title","Provide a human-authored data headline <=90 characters.");
      if(scene.subtitle!==undefined&&!isText(scene.subtitle,180))
        bad(errors,p+".subtitle","DATA interpretation must be <=180 characters.");
      if(scene.geo!==undefined||scene.photo!==undefined||scene.foreground)
        bad(errors,p+".data","Use a sourced standalone data composition; GEO and PHOTO are separate authored shots.");
      if(scene.media&&scene.media.kind!=="image")
        bad(errors,p+".media","Only an explicitly supplied still image can be a restrained data background.");
      const d=scene.data;
      const isoDate=(value)=>{
        if(typeof value!=="string"||!/^\\d{4}-\\d{2}-\\d{2}$/.test(value))return false;
        const t=new Date(value+"T12:00:00Z");
        return Number.isFinite(t.getTime())&&t.toISOString().slice(0,10)===value;
      };
      const safeStr=(v,max)=>isText(v,max)&&v.trim().length>0;
      if(!d||typeof d!=="object"||!["line","ranking","heatmap"].includes(d.mode))
        bad(errors,p+".data.mode","Choose a supported motion grammar: time-series line, ranking or heatmap.");
      else{
        const line=d.mode==="line",ranking=d.mode==="ranking",heatmap=d.mode==="heatmap";
        const min=line?3:ranking?3:4,max=line?16:ranking?8:12;
        const vals=Array.isArray(d.series)?d.series:[];
        if(vals.length<min||vals.length>max)
          bad(errors,p+".data.series","Chart mode requires "+min+"-"+max+" explicitly supplied points.");
        const labels=new Set(),dates=new Set();
        let previousDate="";
        for(const [k,point] of vals.entries()){
          const field=p+".data.series["+k+"]";
          if(!point||!safeStr(point.label,22)||labels.has(point.label))
            bad(errors,field+".label","Every point needs a unique short label.");
          else labels.add(point.label);
          if(!point||typeof point.value!=="number"||!Number.isFinite(point.value)||
            Math.abs(point.value)>1e12||(ranking||heatmap)&&point.value<0)
            bad(errors,field+".value","Only explicit finite values in the chart's supported range are allowed.");
          if(line){
            if(!isoDate(point?.date)||dates.has(point.date)||point.date<=previousDate)
              bad(errors,field+".date","Financial/time series dates must exist and be strictly chronological.");
            else{dates.add(point.date);previousDate=point.date;}
          }
        }
        if(!d.domain||typeof d.domain.min!=="number"||typeof d.domain.max!=="number"||
          !Number.isFinite(d.domain.min)||!Number.isFinite(d.domain.max)||
          d.domain.max<=d.domain.min||Math.max(Math.abs(d.domain.min),Math.abs(d.domain.max))>1e12||
          (ranking||heatmap)&&d.domain.min!==0||
          vals.some(v=>typeof v?.value==="number"&&
            (v.value<d.domain.min||v.value>d.domain.max)))
          bad(errors,p+".data.domain","Explicit finite visible scale must include every value; rankings/heatmaps start at zero.");
        if(!isText(d.unit,12)||!boundedInteger(d.precision,0,2)||
          (d.locale!==undefined&&!["fr-FR","en-US"].includes(d.locale)))
          bad(errors,p+".data.format","Source units, 0-2 decimal places and supported locale are required.");
        const s=d.source;
        if(!s||!safeStr(s.publisher,80)||!safeStr(s.dataset,120)||!isoDate(s.asOf)||
          (line&&previousDate&&s.asOf<previousDate)||
          (s.url!==undefined&&(typeof s.url!=="string"||!/^https:\/\//.test(s.url)||s.url.length>1000)))
          bad(errors,p+".data.source","Data provenance needs actual publisher, dataset and valid observation date (not earlier than last period). HTTPS source link optional.");
      }
    }
    // Geo storytelling is cartography, not geocoding. ALL coordinates, routes
    // and statistics must have been explicitly approved by the human editor.
    // No IP location, language inference or script-to-country guess is allowed.
    if(scene.template==="country_focus"){
      const geo=scene.geo;
      const id=geo?.spotlight?.countryId;
      if(!boundedInteger(scene.durationFrames,150,3600))
        bad(errors,p+".durationFrames","Country focus needs 150-3600 frames for a readable map and independent documentary beats.");
      if(!isText(scene.title,90)||!scene.title?.trim())
        bad(errors,p+".title","Country focus requires a concise human-authored title <=90 characters.");
      if(scene.subtitle!==undefined&&!isText(scene.subtitle,180))
        bad(errors,p+".subtitle","Country focus subtitle must fit in 180 characters.");
      if(typeof id!=="string"||!/^\d{3}$/.test(id)||!DETAILED_IDS.has(id))
        bad(errors,p+".geo.spotlight","Choose a 10m Natural Earth country ID actually present in the versioned atlas.");
      if(geo?.camera!==undefined||geo?.route!==undefined)
        bad(errors,p+".geo","Country focus is a dedicated local projection. Use a separate preceding geo_story for globe travel or route.");
      if(geo?.target!==undefined){
        const point=geo.target;
        if(!point||typeof point.lon!=="number"||typeof point.lat!=="number"||
          !Number.isFinite(point.lon)||!Number.isFinite(point.lat)||
          point.lon< -180||point.lon>180||point.lat< -85||point.lat>85||
          (point.label!==undefined&&!isText(point.label,80)))
          bad(errors,p+".geo.target","Marker must be an explicitly supplied valid geographic coordinate.");
        else if(DETAILED_IDS.has(id)){
          const country=feature(DETAILED_ATLAS,DETAIL_COUNTRIES.find(g=>String(g.id).padStart(3,"0")===id));
          if(!geoContains(country,[point.lon,point.lat]))
            bad(errors,p+".geo.target","The marker is outside the selected 10m country polygon; do not place an ambiguous point.");
        }
      }
      if(geo?.metric!==undefined){
        const m=geo.metric;
        if(!m||!isText(m.label,55)||!m.label?.trim()||
          typeof m.value!=="number"||!Number.isFinite(m.value)||Math.abs(m.value)>1e12||
          (m.unit!==undefined&&!isText(m.unit,12))||
          (m.precision!==undefined&&!boundedInteger(m.precision,0,2)))
          bad(errors,p+".geo.metric","Only a finite editor-supplied number with short label/unit is allowed.");
      }
    }
    if(scene.template==="geo_story"){
      const geo=scene.geo;
      const point=(p)=>p&&typeof p==="object"&&
        typeof p.lon==="number"&&typeof p.lat==="number"&&
        Number.isFinite(p.lon)&&Number.isFinite(p.lat)&&
        p.lon>=-180&&p.lon<=180&&p.lat>=-85&&p.lat<=85;
      if(!geo||typeof geo!=="object"||!point(geo.center))
        bad(errors,p+".geo.center","Select actual longitude -180..180 and latitude -85..85; a valid center is required.");
      if(!boundedInteger(scene.durationFrames,120,3600))
        bad(errors,p+".durationFrames","Geo story needs 120-3600 frames for separate map, route, data and text beats.");
      if(!isText(scene.title,90)||!scene.title?.trim())
        bad(errors,p+".title","Geo story requires a concise human-authored title, max 90 characters.");
      if(geo){
        if(geo.look!==undefined&&!["photo","vector"].includes(geo.look))
          bad(errors,p+".geo.look","Use photo (NASA Blue Marble) or explicit vector cartography.");
        if(geo.spinDegrees!==undefined&&(!Number.isFinite(geo.spinDegrees)||Math.abs(geo.spinDegrees)>360))
          bad(errors,p+".geo.spinDegrees","Spin must be a finite degree angle between -360 and 360.");
        if(geo.camera!==undefined){
          const c=geo.camera;
          if(!c||typeof c!=="object"||!point(c.to)||
             !boundedInteger(c.startFrame,0,scene.durationFrames-40)||
             !boundedInteger(c.endFrame,1,scene.durationFrames-18)||
             c.endFrame-c.startFrame<30||
             typeof c.zoom!=="number"||!Number.isFinite(c.zoom)||
             c.zoom<1||c.zoom>1.15)
            bad(errors,p+".geo.camera","Director camera needs a source-authorized destination, 30+ frames of motion, 18+ frames held at destination, and a 1-1.15 optical push.");
        }
        if(geo.spotlight!==undefined){
          const id=geo.spotlight?.countryId;
          if(typeof id!=="string"||!/^[0-9]{3}$/.test(id)||!COUNTRY_IDS.has(id))
            bad(errors,p+".geo.spotlight","Choose an existing three-digit Natural Earth country feature ID, not a fabricated or inferred border.");
        }
        if(geo.target!==undefined){
          if(!point(geo.target)||geo.target.label!==undefined&&!isText(geo.target.label,80))
            bad(errors,p+".geo.target","Target requires genuine numeric coordinates and optional label <=80 chars.");
        }
        if(geo.route!==undefined){
          if(!geo.route||!point(geo.route.from)||!point(geo.route.to)||
            (geo.route.label!==undefined&&!isText(geo.route.label,80)))
            bad(errors,p+".geo.route","Great-circle path must have valid editor-approved start/end lon-lat pairs.");
          else if(geo.route.from.lon===geo.route.to.lon&&geo.route.from.lat===geo.route.to.lat)
            bad(errors,p+".geo.route","Origin and destination must differ.");
        }
        if(geo.metric!==undefined){
          const m=geo.metric;
          if(!m||!isText(m.label,55)||!m.label?.trim()||
            typeof m.value!=="number"||!Number.isFinite(m.value)||Math.abs(m.value)>1e12||
            (m.unit!==undefined&&!isText(m.unit,12))||
            (m.precision!==undefined&&!boundedInteger(m.precision,0,2)))
            bad(errors,p+".geo.metric","Only a finite editor-supplied value, a label <=55 and 0-2 decimal places are accepted.");
        }
      }
    }
    const needsMedia=["documentary","evidence","clean_video","focus_reveal","document_focus","photo_story"].includes(scene.template);
    if(needsMedia&&!scene.media)bad(errors,p+".media","This composition requires your real source image/clip; no fake fallback.");
    if(scene.foreground!==undefined&&scene.foreground!==null){
      if(!scene.media)
        bad(errors,p+".foreground","A cutout needs the corresponding original background media.");
      if(typeof scene.foreground!=="object"||!isLocalPath(scene.foreground.file)||
         !new Set([".png",".webp"]).has(path.extname(scene.foreground.file??"").toLowerCase()))
        bad(errors,p+".foreground.file","Supply a local transparent PNG or WebP made by a specialist cutout tool.");
    }
    if(scene.media){
      const media=scene.media;
      if(!["image","video"].includes(media.kind)||!isLocalPath(media.file))
        bad(errors,p+".media","Specify a local image/video file under the asset directory.");
      else{
        const ext=path.extname(media.file).toLowerCase();
        if(!(media.kind==="image"?IMAGE_EXT:VIDEO_EXT).has(ext))
          bad(errors,p+".media.file","Unsupported image/video extension.");
      }
      if(media.trimBefore!==undefined&&(!boundedInteger(media.trimBefore,0,30000)||media.kind!=="video"))
        bad(errors,p+".media.trimBefore","Only video supports trimBefore frames.");
    }
  }
  for(const [label,track] of [["voice",project.voice],["music",project.music]]){
    if(track!=null){
      if(!isLocalPath(track.file)||!AUDIO_EXT.has(path.extname(track.file).toLowerCase()))
        bad(errors,label+".file","Provide a local, externally prepared audio file.");
      if(track.volume!==undefined&&(typeof track.volume!=="number"||track.volume<0||track.volume>2))
        bad(errors,label+".volume","Volume outside 0-2.");
    }
  }
  if(project.outro!=null){
    if(!isLocalPath(project.outro.file)||!VIDEO_EXT.has(path.extname(project.outro.file).toLowerCase()))
      bad(errors,"outro.file","Provide the ORIGINAL end-card video, not a generated logo.");
    if(!boundedInteger(project.outro.durationFrames,1,600))
      bad(errors,"outro.durationFrames","Outro duration should be 1-600 frames.");
  }
  if(project.style!=null){
    for(const k of ["accent","background","ink"])
      if(project.style[k]!=null&&!COLOR.test(project.style[k]))bad(errors,"style."+k,"Use six-digit hex color.");
  }
  if(durationFrames(project)>18000)bad(errors,"duration","This profile is limited to 10 minutes; use a long-form workflow for longer films.");
  return {ok:errors.length===0,errors,frames:durationFrames(project)};
}
export function resolveLocalFile(assetRoot,relativePath) {
  if(!isLocalPath(relativePath))throw new Error("Unsafe asset path: "+relativePath);
  const root=fs.realpathSync(assetRoot);
  const target=fs.realpathSync(path.join(root,relativePath));
  if(!target.startsWith(root+path.sep))throw new Error("Asset escapes selected folder: "+relativePath);
  if(!fs.statSync(target).isFile())throw new Error("Asset must be a file: "+relativePath);
  return target;
}
