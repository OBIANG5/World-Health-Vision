import {lazy, Suspense, useEffect, useMemo, useRef, useState, type ChangeEvent} from "react";
import type {CreativeEditProps, CreativeMedia, CreativeShot} from "../../../../services/media-renderer/src/CreativeEdit";
import {parseSrtCaptions,captionCueIssues} from "../../../../services/media-renderer/src/caption-timeline.mjs";
import type {CaptionCue} from "../../../../services/media-renderer/src/caption-timeline.mjs";
import {parseStudioProject,studioShotToEditor,studioAssetNames,frameCaptionsToSrt} from "../../../../services/media-renderer/creative/studio-project-io.mjs";
import type {PhotoMotion} from "../../../../services/media-renderer/src/photo-motion-tracks.mjs";
import {photoComparisonIssues} from "../../../../services/media-renderer/src/photo-comparison-motion.mjs";
import {reviewFrameRange} from "../../../../services/media-renderer/creative/review-range.mjs";
import {directorBeatIssues,DIRECTOR_INTENTS} from "../../../../services/media-renderer/creative/director-beats.mjs";
import type {DirectorBeat,DirectorIntent} from "../../../../services/media-renderer/creative/director-beats.mjs";
import {attentionCueIssues} from "../../../../services/media-renderer/creative/attention-cues.mjs";
import type {SourceSoundCue} from "../../../../services/media-renderer/creative/attention-cues.mjs";
import type {DataDirection} from "../../../../services/media-renderer/src/data-motion-engine.mjs";
import atlasData from "world-atlas/countries-110m.json";

// Lazy: do not load the sizeable motion runtime until a user requests preview.
const RealCreativePreview = lazy(() => import("./CreativeCompositionPreview"));
const CountrySelector10m = lazy(() => import("./CountrySelector10m"));
import "./CinematicProductionBoard.css";

type Template = "documentary"|"kinetic"|"evidence"|"number"|"clean_video"|"focus_reveal"|"document_focus"|"geo_story"|"country_focus"|"photo_story"|"data_story";
type Motion = "locked"|"dolly"|"drift"|"push";
type Transition = "cut"|"dissolve"|"slide";
type MediaType = "image"|"video"|"audio";
type PreviewMode = "source"|"shot"|"film";
type AtlasGeometry={id?:string|number;properties?:{name?:string}};
const COUNTRIES=((atlasData as unknown as {objects:{countries:{geometries:AtlasGeometry[]}}})
  .objects.countries.geometries)
  .map(g=>({id:String(g.id).padStart(3,"0"),name:g.properties?.name??"ID "+g.id}))
  .sort((a,b)=>a.name.localeCompare(b.name,"fr"));
const COUNTRY_IDS=new Set(COUNTRIES.map(c=>c.id));
type Asset = {name:string;size:number;kind:MediaType;url:string};
type PhotoSettings={
  camera:PhotoMotion["camera"];
  subject:NonNullable<PhotoMotion["subject"]>;
  mask:NonNullable<PhotoMotion["mask"]>;
  focus:NonNullable<PhotoMotion["focus"]>;
  metric:NonNullable<PhotoMotion["metric"]>;
  comparison:NonNullable<PhotoMotion["comparison"]>;
};
const initialPhotoSettings=():PhotoSettings=>({
  camera:{zoomFrom:1.05,zoomTo:1.13,panX:18,panY:-14,startFrame:0,endFrame:132},
  subject:{dx:-12,dy:-17,scale:.055,startFrame:12,endFrame:125},
  mask:{axis:"horizontal",startFrame:18,endFrame:68},
  focus:{x:.5,y:.48,radius:83,startFrame:48,endFrame:91},
  metric:{label:"",value:0,unit:"",precision:0,sourceLabel:"",startFrame:71,endFrame:122},
  comparison:{
    title:"",first:{label:"",value:0},second:{label:"",value:0},
    domain:{min:0,max:1},unit:"",precision:0,locale:"fr-FR",
    source:{publisher:"",dataset:"",asOf:""},
    startFrame:40,endFrame:130
  }
});

type Shot = {
  id:string;title:string;subtitle:string;eyebrow:string;durationFrames:number;
  titleFrameZero:boolean;
  template:Template;motion:Motion;transitionAfter:Transition;transitionFrames:number;
  mediaName:string;mediaCredit:string;mediaTrimBefore:number;
  foregroundName:string;foregroundCredit:string;focusX:number;focusY:number;
  documentX:number;documentY:number;documentW:number;documentH:number;
  documentMobileSafe:boolean;documentZoomMax:number;
  geoLon:number;geoLat:number;geoSpin:number;geoLook:"photo"|"vector";
  geoShowCamera:boolean;geoToLon:number;geoToLat:number;
  geoCameraStart:number;geoCameraEnd:number;geoCameraZoom:number;
  geoShowCountry:boolean;geoCountryId:string;
  geoShowTarget:boolean;geoTargetLon:number;geoTargetLat:number;geoTargetLabel:string;
  geoShowRoute:boolean;geoFromLon:number;geoFromLat:number;
  geoShowMetric:boolean;geoMetricLabel:string;geoMetricValue:string;geoMetricUnit:string;
  photoSettings:PhotoSettings;photoUseSubject:boolean;photoUseMask:boolean;photoUseFocus:boolean;photoUseMetric:boolean;photoUseComparison:boolean;
  dataMode:DataDirection["mode"];dataRaw:string;dataPublisher:string;dataDataset:string;dataAsOf:string;
  dataUrl:string;dataUnit:string;dataPrecision:number;dataLocale:"fr-FR"|"en-US";dataMin:string;dataMax:string;
};
const TEMPLATE_LABELS:Record<Template,string>={
  documentary:"Photographie / reportage",focus_reveal:"Révélation cinématographique du visuel",kinetic:"Typographie cinématique",
  evidence:"Document / contexte",document_focus:"Preuve visuelle · inspection de document",geo_story:"Globe lumineux · géographie et données",country_focus:"Pays en détail · carte 1:10m / média / données",photo_story:"PHOTO · six pistes de motion sur une image",data_story:"DATA · courbes, classements et heatmaps vérifiables",number:"Chiffre important",clean_video:"Clip intégral / animation externe"
};
const MOTION_LABELS:Record<Motion,string>={
  locked:"Cadre fixe",dolly:"Approche de caméra",drift:"Mouvement latéral",push:"Révélation progressive"
};
const templates=Object.keys(TEMPLATE_LABELS) as Template[];
const motions=Object.keys(MOTION_LABELS) as Motion[];
const TRANSITIONS:Record<Transition,string>={cut:"Coupe franche",dissolve:"Fondu discret",slide:"Glissement contrôlé"};
const typesByExt=(name:string):MediaType|null=>{
  const ext=name.split(".").pop()?.toLowerCase();
  if(["jpg","jpeg","png","webp"].includes(ext||""))return "image";
  if(["mp4","mov","webm"].includes(ext||""))return "video";
  if(["wav","mp3","m4a","aac","flac"].includes(ext||""))return "audio";
  return null;
};
const initialShot=():Shot=>({
  id:"plan-01",title:"",subtitle:"",eyebrow:"",durationFrames:120,titleFrameZero:false,
  template:"kinetic",motion:"locked",transitionAfter:"cut",transitionFrames:0,mediaName:"",mediaCredit:"",mediaTrimBefore:0,
  foregroundName:"",foregroundCredit:"",focusX:0.5,focusY:0.5,
  documentX:.25,documentY:.32,documentW:.5,documentH:.22,
  documentMobileSafe:false,documentZoomMax:1.85,
  geoLon:0,geoLat:10,geoSpin:16,geoLook:"photo",
  geoShowCamera:false,geoToLon:0,geoToLat:0,
  geoCameraStart:15,geoCameraEnd:102,geoCameraZoom:1.1,
  geoShowCountry:false,geoCountryId:"",
  geoShowTarget:false,geoTargetLon:0,geoTargetLat:0,geoTargetLabel:"",
  geoShowRoute:false,geoFromLon:0,geoFromLat:0,
  geoShowMetric:false,geoMetricLabel:"",geoMetricValue:"",geoMetricUnit:"",
  photoSettings:initialPhotoSettings(),photoUseSubject:false,photoUseMask:true,photoUseFocus:false,photoUseMetric:false,photoUseComparison:false,
  dataMode:"line",dataRaw:"",dataPublisher:"",dataDataset:"",dataAsOf:"",dataUrl:"",
  dataUnit:"",dataPrecision:0,dataLocale:"fr-FR",dataMin:"",dataMax:""
});
/** No geography or numeric fact is inferred from text here. The user chooses
 * every coordinate and figure explicitly. Never insert synthetic values. */
const buildGeo=(shot:Shot):CreativeShot["geo"]=>({
  center:{lon:shot.geoLon,lat:shot.geoLat},
  look:shot.geoLook,
  spinDegrees:shot.geoSpin,
  ...(shot.template==="geo_story"&&shot.geoShowCamera?{camera:{
    to:{lon:shot.geoToLon,lat:shot.geoToLat},
    startFrame:shot.geoCameraStart,endFrame:shot.geoCameraEnd,
    zoom:shot.geoCameraZoom
  }}:{}),
  ...((shot.template==="country_focus"||shot.geoShowCountry)?{spotlight:{countryId:shot.geoCountryId}}:{}),
  ...(shot.geoShowTarget?{target:{
    lon:shot.geoTargetLon,lat:shot.geoTargetLat,label:shot.geoTargetLabel
  }}:{}),
  ...(shot.template==="geo_story"&&shot.geoShowRoute?{route:{
    from:{lon:shot.geoFromLon,lat:shot.geoFromLat},
    to:{lon:shot.geoTargetLon,lat:shot.geoTargetLat}
  }}:{}),
  ...(shot.geoShowMetric?{metric:{
    label:shot.geoMetricLabel,value:Number(shot.geoMetricValue),
    unit:shot.geoMetricUnit,precision:0
  }}:{})
});
const buildPhoto=(shot:Shot):PhotoMotion=>({
  camera:shot.photoSettings.camera,
  ...(shot.photoUseSubject?{subject:shot.photoSettings.subject}:{}),
  ...(shot.photoUseMask?{mask:shot.photoSettings.mask}:{}),
  ...(shot.photoUseFocus?{focus:shot.photoSettings.focus}:{}),
  ...(shot.photoUseMetric?{metric:shot.photoSettings.metric}:{}),
  ...(shot.photoUseComparison?{comparison:shot.photoSettings.comparison}:{})
});
const validPhoto=(s:Shot)=>{
  if(s.template!=="photo_story")return true;
  const within=(v:number,min:number,max:number)=>Number.isFinite(v)&&v>=min&&v<=max;
  const beats=(t:{startFrame:number;endFrame:number},min:number)=>Number.isInteger(t.startFrame)&&
    Number.isInteger(t.endFrame)&&t.startFrame>=0&&t.endFrame<=s.durationFrames&&
    t.endFrame-t.startFrame>=min;
  const c=s.photoSettings.camera,m=s.photoSettings.metric,f=s.photoSettings.focus;
  return Boolean(s.durationFrames>=150&&s.durationFrames<=3600&&
    s.title.trim()&&s.title.length<=90&&s.subtitle.length<=180&&
    beats(c,35)&&c.startFrame<=s.durationFrames-20&&
    within(c.zoomFrom,1.03,1.18)&&within(c.zoomTo,c.zoomFrom,1.20)&&
    within(c.panX,-40,40)&&within(c.panY,-45,45)&&
    Math.abs(c.panX)<=(c.zoomTo-1)*540&&Math.abs(c.panY)<=(c.zoomTo-1)*960&&
    (!s.photoUseSubject||(s.foregroundName&&beats(s.photoSettings.subject,25)&&
      within(s.photoSettings.subject.dx,-45,45)&&
      within(s.photoSettings.subject.dy,-45,45)&&
      within(s.photoSettings.subject.scale,0,.16)))&&
    (!s.photoUseMask||(beats(s.photoSettings.mask,20)&&
      ["horizontal","vertical"].includes(s.photoSettings.mask.axis)))&&
    (!s.photoUseFocus||(beats(f,20)&&within(f.x,.07,.93)&&within(f.y,.09,.76)&&
      within(f.radius,35,190)))&&
    (!s.photoUseComparison||(!s.photoUseMetric&&
      photoComparisonIssues(s.photoSettings.comparison,s.durationFrames).length===0))&&
    (!s.photoUseMetric||(beats(m,25)&&m.label.trim()&&m.label.length<=55&&
      Number.isFinite(m.value)&&Math.abs(m.value)<=1e12&&
      m.unit.length<=12&&m.sourceLabel.trim()&&m.sourceLabel.length<=85&&
      Number.isInteger(m.precision)&&m.precision>=0&&m.precision<=2))
  );
};
// Data labels and values are never guessed from the script or a live API.
// Lines use DATE|LIBELLÉ|VALEUR; other graphs LIBELLÉ|VALEUR.
// The author explicitly enters the visible axis range and provenance.
const parseDataRows=(s:Shot):DataDirection["series"]=>{
  const rows=s.dataRaw.split("\n").map(x=>x.trim()).filter(Boolean);
  return rows.map(row=>{
    const parts=row.split("|").map(x=>x.trim());
    if(s.dataMode==="line")return {
      date:parts[0]??"",label:parts[1]??"",
      value:parts.length===3&&parts[2]!==""?Number(parts[2]):Number.NaN
    };
    return {label:parts[0]??"",value:parts.length===2&&parts[1]!==""?Number(parts[1]):Number.NaN};
  });
};
const buildData=(s:Shot):DataDirection=>({
  mode:s.dataMode,series:parseDataRows(s),
  source:{publisher:s.dataPublisher.trim(),dataset:s.dataDataset.trim(),asOf:s.dataAsOf,
    ...(s.dataUrl.trim()?{url:s.dataUrl.trim()}:{})},
  domain:{min:Number(s.dataMin),max:Number(s.dataMax)},
  precision:s.dataPrecision,unit:s.dataUnit,locale:s.dataLocale
});
const validData=(s:Shot)=>{
  if(s.template!=="data_story")return true;
  const p=parseDataRows(s);
  const dateValid=(v:string)=>/^[0-9]{4}-[0-9]{2}-[0-9]{2}$/.test(v)&&
    Number.isFinite(new Date(v+"T12:00:00Z").getTime())&&
    new Date(v+"T12:00:00Z").toISOString().slice(0,10)===v;
  const min=s.dataMode==="line"?3:s.dataMode==="ranking"?3:4;
  const max=s.dataMode==="line"?16:s.dataMode==="ranking"?8:12;
  const low=Number(s.dataMin),high=Number(s.dataMax);
  const names=new Set(p.map(row=>row.label));
  const dates=p.map(row=>row.date??"");
  return Boolean(s.title.trim()&&s.title.length<=90&&s.subtitle.length<=180&&
    s.durationFrames>=150&&s.durationFrames<=3600&&
    p.length>=min&&p.length<=max&&p.every(x=>x.label.trim()&&x.label.length<=22&&
      Number.isFinite(x.value)&&Math.abs(x.value)<=1e12&&
      (s.dataMode==="line"||x.value>=0))&&names.size===p.length&&
    (s.dataMode!=="line"||(dates.every(dateValid)&&
      dates.every((value,i)=>i===0||dates[i-1]<value)&&
      s.dataAsOf>=dates[dates.length-1]))&&
    s.dataMin.trim()!==""&&s.dataMax.trim()!==""&&
    Number.isFinite(low)&&Number.isFinite(high)&&low<high&&
    Math.max(Math.abs(low),Math.abs(high))<=1e12&&
    (s.dataMode==="line"||low===0)&&
    p.every(x=>x.value>=low&&x.value<=high)&&
    dateValid(s.dataAsOf)&&s.dataPublisher.trim()&&s.dataPublisher.length<=80&&
    s.dataDataset.trim()&&s.dataDataset.length<=120&&
    (!s.dataUrl.trim()||(s.dataUrl.startsWith("https://")&&s.dataUrl.length<=1000))&&
    s.dataUnit.length<=12&&Number.isInteger(s.dataPrecision)&&s.dataPrecision>=0&&s.dataPrecision<=2&&
    (s.dataLocale==="fr-FR"||s.dataLocale==="en-US")&&!s.foregroundName);
};
const inLon=(v:number)=>Number.isFinite(v)&&v>=-180&&v<=180;
const inLat=(v:number)=>Number.isFinite(v)&&v>=-85&&v<=85;
const validGeo=(s:Shot)=>{
  if(s.template==="country_focus")return Boolean(
    s.durationFrames>=150&&s.durationFrames<=3600&&
    s.title.trim()&&s.title.length<=90&&s.subtitle.length<=180&&
    /^\d{3}$/.test(s.geoCountryId)&&
    (!s.geoShowTarget||(inLon(s.geoTargetLon)&&inLat(s.geoTargetLat)&&s.geoTargetLabel.length<=80))&&
    (!s.geoShowMetric||(s.geoMetricLabel.trim()&&s.geoMetricLabel.length<=55&&
      s.geoMetricValue.trim()!==""&&Number.isFinite(Number(s.geoMetricValue))&&
      Math.abs(Number(s.geoMetricValue))<=1e12&&s.geoMetricUnit.length<=12))
  );
  return s.template!=="geo_story"||Boolean(
  s.durationFrames>=120&&s.title.trim()&&s.title.length<=90&&
  inLon(s.geoLon)&&inLat(s.geoLat)&&Number.isFinite(s.geoSpin)&&Math.abs(s.geoSpin)<=360&&
  (!s.geoShowCamera||(inLon(s.geoToLon)&&inLat(s.geoToLat)&&
    Number.isInteger(s.geoCameraStart)&&Number.isInteger(s.geoCameraEnd)&&
    s.geoCameraStart>=0&&s.geoCameraEnd<=s.durationFrames-18&&
    s.geoCameraEnd-s.geoCameraStart>=30&&
    Number.isFinite(s.geoCameraZoom)&&s.geoCameraZoom>=1&&s.geoCameraZoom<=1.15))&&
  (!s.geoShowCountry||COUNTRY_IDS.has(s.geoCountryId))&&
  (!s.geoShowTarget||(inLon(s.geoTargetLon)&&inLat(s.geoTargetLat)&&s.geoTargetLabel.length<=80))&&
  (!s.geoShowRoute||(s.geoShowTarget&&inLon(s.geoFromLon)&&inLat(s.geoFromLat)&&
    (s.geoFromLon!==s.geoTargetLon||s.geoFromLat!==s.geoTargetLat)))&&
  (!s.geoShowMetric||(s.geoMetricLabel.trim()&&s.geoMetricLabel.length<=55&&
    s.geoMetricValue.trim()!==""&&Number.isFinite(Number(s.geoMetricValue))&&
    Math.abs(Number(s.geoMetricValue))<=1e12&&s.geoMetricUnit.length<=12))
  );
};
const mkSlug=(value:string)=>("wv-"+value.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g,"").replace(/[^a-z0-9_-]+/g,"-").replace(/^-+|-+$/g,"").slice(0,60))||"wv-projet";
const path="https://github.com/OBIANG5/World-Health-Vision/blob/feature/worldvision-cinematic-director-gates-2026-11-19/worldhealth-vision-v2/docs/media/WORLDVISION_CREATIVE_EDIT_HANDOFF_2026-11-19.md";

export default function CinematicProductionBoard() {
  const [projectName,setProjectName]=useState("Nouvelle production World-Vision");
  // Preserve the original stable project identifier through revisions.
  const [loadedProjectId,setLoadedProjectId]=useState<string|null>(null);
  const [script,setScript]=useState("");
  const [files,setFiles]=useState<Asset[]>([]);
  const [shots,setShots]=useState<Shot[]>([initialShot()]);
  const [selectedId,setSelectedId]=useState("plan-01");
  const [voiceFile,setVoiceFile]=useState("");
  const [comparisonVoice,setComparisonVoice]=useState("");
  const [musicFile,setMusicFile]=useState("");
  const [srtInput,setSrtInput]=useState("");
  // Preserve imported frame-exact cues until the editor explicitly changes captions.
  const [importedCaptionCues,setImportedCaptionCues]=useState<CaptionCue[]|null>(null);
  const [captionPosition,setCaptionPosition]=useState<"upper"|"lower">("upper");
  const parsedCaptions=useMemo(()=>{
    if(importedCaptionCues)return {cues:importedCaptionCues,error:""};
    try{return {cues:parseSrtCaptions(srtInput,{position:captionPosition}),error:""};}
    catch(e){return {cues:[],error:e instanceof Error?e.message:String(e)};}
  },[srtInput,captionPosition,importedCaptionCues]);
  const [outroFile,setOutroFile]=useState("");
  const [accent,setAccent]=useState("#8bbecf");
  const [feedback,setFeedback]=useState("");
  const [croppedPreview,setCroppedPreview]=useState(true);
  const [previewMode,setPreviewMode]=useState<PreviewMode>("source");
  const [filmReview,setFilmReview]=useState<{shotId:string;frame:number;requestId:number}|null>(null);
  const [directorBeats,setDirectorBeats]=useState<DirectorBeat[]>([]);
  const [soundCues,setSoundCues]=useState<SourceSoundCue[]>([]);
  const [newSfxFile,setNewSfxFile]=useState("");
  const createdUrls=useRef<string[]>([]);
  useEffect(()=>()=>{for(const url of createdUrls.current)URL.revokeObjectURL(url);},[]);
  const active=useMemo(()=>shots.find(s=>s.id===selectedId)??shots[0],[shots,selectedId]);
  const requiredNames=new Set([...shots.flatMap(s=>[s.mediaName,s.foregroundName]),voiceFile,musicFile,outroFile,...soundCues.map(cue=>cue.file)].filter(Boolean));
  const unresolvedAssets=[...requiredNames].filter(name=>!files.some(file=>file.name===name));
  const activeAsset=files.find(f=>f.name===active.mediaName);
  const foregroundAsset=files.find(f=>f.name===active.foregroundName);
  const needsRealMedia=["documentary","evidence","clean_video","focus_reveal","document_focus","photo_story"].includes(active.template);
  const previewCanRender=(!needsRealMedia||Boolean(activeAsset&&activeAsset.kind!=="audio"))&&
    (active.template!=="focus_reveal"||Boolean(active.title.trim()&&active.title.length<=90&&active.durationFrames>=90))&&
    (active.template!=="document_focus"||Boolean(activeAsset?.kind==="image"&&active.title.trim()&&active.title.length<=90&&active.durationFrames>=115))&&
    (active.template!=="photo_story"||activeAsset?.kind==="image")&&
    (active.template!=="data_story"||!activeAsset||activeAsset.kind==="image")&&
    validData(active)&&validPhoto(active)&&validGeo(active);
  // Exact props type of the REAL server-rendered Remotion compositor; object
  // URLs only exist in this browser session and never reach GitHub or an API.
  const previewProps=useMemo<CreativeEditProps>(()=>{
    const media:CreativeMedia|null=activeAsset&&activeAsset.kind!=="audio"
      ? {kind:activeAsset.kind,src:activeAsset.url,
          ...(active.mediaCredit?{credit:active.mediaCredit}:{}),
          ...(activeAsset.kind==="video"&&active.mediaTrimBefore?{trimBefore:active.mediaTrimBefore}:{})}:null;
    return {
      version:1,
      title:projectName,
      script,
      shots:[{
        id:active.id,
        titleFrameZero:active.titleFrameZero,
        durationFrames:active.durationFrames,
        template:active.template,
        title:active.title,
        subtitle:active.subtitle,
        eyebrow:active.eyebrow,
        media,
        foreground:foregroundAsset?{src:foregroundAsset.url,
          ...(active.foregroundCredit?{credit:active.foregroundCredit}:{})}:null,
        motion:active.motion,
        transitionAfter:"cut",
        transitionFrames:0,
        focus:{x:active.focusX,y:active.focusY},
        ...(active.template==="document_focus"?{
          documentRegion:{x:active.documentX,y:active.documentY,width:active.documentW,height:active.documentH},
          ...(active.documentMobileSafe?{evidencePresentation:"mobile-safe" as const,
            documentZoomMax:active.documentZoomMax}:{})
        }:{}),
        ...(active.template==="photo_story"?{photo:buildPhoto(active)}:{}),
        ...(active.template==="data_story"?{data:buildData(active)}:{}),
        ...((active.template==="geo_story"||active.template==="country_focus")?{geo:buildGeo(active)}:{})
      }],
      captions:[],
      narration:null,
      soundtrack:null,
      brandOutro:null,
      visualStyle:{background:"#0b1721",ink:"#f6f8fa",accent}
    };
  },[active,activeAsset,foregroundAsset,projectName,script,accent]);
  const canExport=unresolvedAssets.length===0&&script.trim().length>0&&shots.every(shot=>{
    const requires=["documentary","evidence","clean_video","focus_reveal","document_focus","photo_story"].includes(shot.template);
    const hasMedia=!requires||Boolean(shot.mediaName&&files.some(f=>f.name===shot.mediaName));
    const validFocus=shot.template!=="focus_reveal"||Boolean(shot.title.trim()&&shot.title.length<=90&&shot.durationFrames>=90);
    const validDocument=shot.template!=="document_focus"||Boolean(
      shot.title.trim()&&shot.title.length<=90&&shot.durationFrames>=115&&
      files.some(f=>f.name===shot.mediaName&&f.kind==="image")&&
      shot.documentX>=0&&shot.documentY>=0&&shot.documentW>=.12&&shot.documentW<=.85&&
      shot.documentH>=.08&&shot.documentH<=.8&&
      shot.documentX+shot.documentW<=1.0000001&&shot.documentY+shot.documentH<=1.0000001&&
      (!shot.documentMobileSafe||(Number.isFinite(shot.documentZoomMax)&&
        shot.documentZoomMax>=1&&shot.documentZoomMax<=2.25))
    );
    const validForeground=!shot.foregroundName||Boolean(shot.mediaName&&files.some(f=>f.name===shot.foregroundName&&f.kind==="image"));
    return hasMedia&&validFocus&&validDocument&&validForeground&&validGeo(shot)&&validPhoto(shot)&&validData(shot)&&
      (shot.template!=="data_story"||!shot.mediaName||files.some(f=>f.name===shot.mediaName&&f.kind==="image"))&&
      (shot.template!=="photo_story"||files.some(f=>f.name===shot.mediaName&&f.kind==="image"));
  });
  const shotsDuration=shots.reduce((sum,s,i)=>
    sum+s.durationFrames-(i<shots.length-1&&s.transitionAfter!=="cut"?s.transitionFrames:0),0);
  const duration=shotsDuration+(outroFile?90:0);
  const directorIssues=directorBeatIssues({shots,script,directorBeats},shotsDuration);
  const soundIssues=attentionCueIssues({soundCues},shotsDuration);
  const captionIssues=captionCueIssues(parsedCaptions.cues,shotsDuration);
  const captionValid=!parsedCaptions.error&&captionIssues.length===0;
  const fullFilmCanRender=canExport&&captionValid&&soundIssues.length===0&&duration>0&&duration<=18000;

  /**
   * Complete local timeline for editorial review — EXACT Remotion composition
   * used by the renderer. This is only instantiated when previewMode='film'.
   * Voice and music are the currently selected real file blobs, never AI
   * speech synthesized or generated without user approval.
   */
  const fullFilmProps=useMemo<CreativeEditProps>(()=>({
    version:1,
    title:projectName,
    script,
    shots:shots.map((shot,i)=>{
      const clip=files.find(f=>f.name===shot.mediaName);
      const cutout=files.find(f=>f.name===shot.foregroundName);
      const media:CreativeMedia|null=clip&&clip.kind!=="audio"
        ? {kind:clip.kind,src:clip.url,
            ...(shot.mediaCredit?{credit:shot.mediaCredit}:{}),
            ...(clip.kind==="video"&&shot.mediaTrimBefore?{trimBefore:shot.mediaTrimBefore}:{})}:null;
      return {
        id:shot.id,
        titleFrameZero:shot.titleFrameZero,
        durationFrames:shot.durationFrames,
        template:shot.template,
        title:shot.title,
        subtitle:shot.subtitle,
        eyebrow:shot.eyebrow,
        media,
        foreground:cutout?{src:cutout.url,
          ...(shot.foregroundCredit?{credit:shot.foregroundCredit}:{})}:null,
        motion:shot.motion,
        transitionAfter:i===shots.length-1?"cut":shot.transitionAfter,
        transitionFrames:i===shots.length-1||shot.transitionAfter==="cut"?0:shot.transitionFrames,
        focus:{x:shot.focusX,y:shot.focusY},
        ...(shot.template==="document_focus"?{
          documentRegion:{x:shot.documentX,y:shot.documentY,width:shot.documentW,height:shot.documentH},
          ...(shot.documentMobileSafe?{evidencePresentation:"mobile-safe" as const,
            documentZoomMax:shot.documentZoomMax}:{})
        }:{}),
        ...(shot.template==="photo_story"?{photo:buildPhoto(shot)}:{}),
        ...(shot.template==="data_story"?{data:buildData(shot)}:{}),
        ...((shot.template==="geo_story"||shot.template==="country_focus")?{geo:buildGeo(shot)}:{})
      };
    }),
    captions:parsedCaptions.cues,
    soundCues:soundCues.map(cue=>({src:files.find(f=>f.name===cue.file)?.url??"",
      startFrame:cue.startFrame,durationFrames:cue.durationFrames,
      volume:cue.volume??0.25,label:cue.label})),
    narration:voiceFile&&files.find(f=>f.name===voiceFile)
      ? {src:files.find(f=>f.name===voiceFile)!.url,volume:1,label:"Narration sélectionnée"}
      :null,
    soundtrack:musicFile&&files.find(f=>f.name===musicFile)
      ? {src:files.find(f=>f.name===musicFile)!.url,volume:0.10,label:"Bande-son fournie"}
      :null,
    brandOutro:outroFile&&files.find(f=>f.name===outroFile)
      ? {src:files.find(f=>f.name===outroFile)!.url,durationFrames:90}
      :null,
    visualStyle:{background:"#0b1721",ink:"#f6f8fa",accent}
  }),[shots,files,projectName,script,voiceFile,musicFile,outroFile,accent,parsedCaptions.cues,soundCues]);
  const importProject=async(e:ChangeEvent<HTMLInputElement>)=>{
    const file=e.currentTarget.files?.[0];
    e.currentTarget.value="";
    if(!file)return;
    if(file.size>2_000_000){setFeedback("Import refusé : le JSON dépasse 2 Mo.");return;}
    try{
      const saved=parseStudioProject(await file.text());
      const restored=saved.shots.map(s=>studioShotToEditor(s,initialShot()));
      const necessary=studioAssetNames(saved);
      const missing=necessary.filter(name=>!files.some(f=>f.name===name));
      // An invalid project must never overwrite an in-progress edit.
      setProjectName(saved.title);setLoadedProjectId(saved.id);
      setScript(saved.script);setShots(restored);setSelectedId(restored[0].id);
      setVoiceFile(saved.voice?.file??"");setComparisonVoice("");
      setMusicFile(saved.music?.file??"");setOutroFile(saved.outro?.file??"");
      setAccent(saved.style?.accent??"#8bbecf");
      setImportedCaptionCues(saved.captions??null);
      setSrtInput(frameCaptionsToSrt(saved.captions??[]));
      setCaptionPosition(saved.captions?.[0]?.position??"upper");
      setPreviewMode("source");
      setFilmReview(null);
      setDirectorBeats(saved.directorBeats??[]);
      setSoundCues(saved.soundCues??[]);
      setFeedback("Projet repris : "+restored.length+" plan(s), "+(saved.captions?.length??0)+" sous-titre(s). "+
        (missing.length?"Réimporte les médias d'origine avant le rendu : "+missing.join(", "):"Médias correspondants déjà présents dans cette session."));
    }catch(error){setFeedback("Import refusé. Le montage en cours reste inchangé. "+
      (error instanceof Error?error.message:String(error)));}
  };
  const addFiles=(e:ChangeEvent<HTMLInputElement>)=>{
    const items=Array.from(e.currentTarget.files??[]);
    const known=new Set(files.map(x=>x.name));
    const next:Asset[]=[];
    const rejected:string[]=[];
    for(const file of items){
      const kind=typesByExt(file.name);
      if(!kind){rejected.push(file.name);continue;}
      if(known.has(file.name)){rejected.push(file.name+" (déjà importé)");continue;}
      const url=URL.createObjectURL(file);createdUrls.current.push(url);
      next.push({name:file.name,size:file.size,kind,url});
      known.add(file.name);
    }
    setFiles(old=>[...old,...next]);
    setFeedback(rejected.length?"Non importés : "+rejected.join(", "):next.length+" fichier(s) ajouté(s) à la session.");
    e.currentTarget.value="";
  };
  const updateShot=(change:Partial<Shot>)=>setShots(old=>old.map(s=>s.id===selectedId?{...s,...change}:s));
  const updatePhotoTrack=(key:keyof PhotoSettings,change:Record<string,unknown>)=>updateShot({photoSettings:{...active.photoSettings,[key]:{...active.photoSettings[key],...change}}});
  const updatePhotoComparison=(change:Partial<NonNullable<PhotoMotion["comparison"]>>)=>updatePhotoTrack("comparison",change);
  const addShot=()=>{
    const existing=new Set(shots.map(x=>x.id));
    let n=shots.length+1;let id="plan-"+String(n).padStart(2,"0");
    while(existing.has(id)){n++;id="plan-"+String(n).padStart(2,"0");}
    setShots(old=>[...old,{...initialShot(),id}]);
    setSelectedId(id);
  };
  const removeShot=()=>{
    if(shots.length===1)return;
    if(directorBeats.some(beat=>beat.shotId===selectedId)){
      setFeedback("Ce plan possède des décisions éditoriales : retire ou déplace explicitement ses séquences avant de le supprimer.");
      return;
    }
    const next=shots.filter(s=>s.id!==selectedId);
    setShots(next);setSelectedId(next[0].id);
  };
  const move=(direction:number)=>{
    const index=shots.findIndex(s=>s.id===selectedId),next=index+direction;
    if(next<0||next>=shots.length)return;
    const list=[...shots];[list[index],list[next]]=[list[next],list[index]];
    setShots(list);
  };
  const updateSoundCue=(index:number,change:Partial<SourceSoundCue>)=>
    setSoundCues(old=>old.map((cue,i)=>i===index?{...cue,...change}:cue));
  const addSoundCue=()=>{
    const f=files.find(file=>file.name===newSfxFile&&file.kind==="audio");
    if(!f){
      setFeedback("Choisis explicitement un véritable fichier audio importé et autorisé pour ajouter un SFX.");
      return;
    }
    const start=reviewFrameRange({shots},selectedId,0).selectedShotSourceFrames[0];
    if(start+4>shotsDuration){
      setFeedback("Durée restante insuffisante pour un accent sonore d'au moins quatre images.");
      return;
    }
    setSoundCues(old=>[...old,{file:f.name,startFrame:start,
      durationFrames:Math.min(12,shotsDuration-start),volume:.25,label:""}]);
    setFeedback("Accent ajouté au film : écoute et corrige son timing, niveau et droit d'utilisation avant publication.");
  };
  const updateDirectorBeat=(id:string,change:Partial<DirectorBeat>)=>
    setDirectorBeats(old=>old.map(beat=>beat.id===id?{...beat,...change}:beat));
  const addDirectorBeat=()=>{
    try{
      const [shotStart,shotLast]=reviewFrameRange({shots},selectedId,0).selectedShotSourceFrames;
      const shotEnd=shotLast+1;
      let cursor=shotStart;
      let end=shotEnd;
      for(const beat of [...directorBeats].sort((a,b)=>a.startFrame-b.startFrame)){
        if(beat.endFrame<=cursor)continue;
        if(beat.startFrame>cursor){
          end=Math.min(shotEnd,beat.startFrame);
          if(end-cursor>=6)break;
        }
        cursor=Math.max(cursor,beat.endFrame);
        end=shotEnd;
      }
      if(end-cursor<6||cursor>=shotEnd){
        setFeedback("Aucune place pour une nouvelle séquence sur ce plan : ajuste les timecodes existants.");
        return;
      }
      const used=new Set(directorBeats.map(beat=>beat.id));
      let next=directorBeats.length+1;
      while(used.has("beat-"+String(next).padStart(2,"0")))next++;
      const beat:DirectorBeat={
        id:"beat-"+String(next).padStart(2,"0"),shotId:selectedId,
        startFrame:cursor,endFrame:Math.min(cursor+90,end),
        intent:"explain",idea:"",spokenExcerpt:"",proofNote:"",
        visualDirection:"",audioDirection:""
      };
      setDirectorBeats(old=>[...old,beat].sort((a,b)=>a.startFrame-b.startFrame));
      setFeedback("Nouvelle séquence ajoutée au timecode original ; décris son sens, sa preuve et son mouvement avant export.");
    }catch(error){
      setFeedback("Impossible de placer une séquence sur un montage invalide : "+
        (error instanceof Error?error.message:String(error)));
    }
  };
  const reviewDirectorBeat=(beat:DirectorBeat)=>{
    if(!fullFilmCanRender){
      setFeedback("Corrige les médias et la timeline avant de revoir cette séquence dans le film.");
      return;
    }
    if(directorIssues.length){
      setFeedback("Corrige le conducteur avant cette revue : "+directorIssues[0].reason);
      return;
    }
    setFilmReview(previous=>({
      shotId:beat.shotId,frame:Math.max(0,beat.startFrame-15),
      requestId:(previous?.requestId??0)+1
    }));
    setPreviewMode("film");
    setFeedback("Revue du "+beat.intent+" : "+(beat.startFrame/30).toFixed(2)+
      " s sur l'horloge originale; voix et musique conservées si elles sont importées.");
    window.requestAnimationFrame(()=>{
      document.getElementById("wvc-preview")?.scrollIntoView({behavior:"smooth",block:"nearest"});
    });
  };
  const reviewSelectedShotInContext=()=>{
    if(!fullFilmCanRender){
      setFeedback("Impossible de revoir ce plan en contexte : renseigne les médias, le script et les sous-titres valides du film.");
      return;
    }
    try{
      // Re-use the already tested P0.1 frame clock. 15 source frames (0.5 s)
      // before the shot let the editor hear the preceding narration/music.
      const review=reviewFrameRange({shots},selectedId);
      setFilmReview(previous=>({
        shotId:selectedId,
        frame:review.frameRange[0],
        requestId:(previous?.requestId??0)+1
      }));
      setPreviewMode("film");
      setFeedback("Lecture contextuelle prête : "+selectedId+" à "+(review.frameRange[0]/30).toFixed(2)+
        " s sur la timeline originale, avec voix, musique et sous-titres uniquement s'ils sont fournis.");
      window.requestAnimationFrame(()=>{
        document.getElementById("wvc-preview")?.scrollIntoView({behavior:"smooth",block:"nearest"});
      });
    }catch(error){
      setFeedback("Le raccord ou la durée des plans empêche cette revue ciblée : "+
        (error instanceof Error?error.message:String(error)));
    }
  };
  const exportProject=()=>{
    if(soundIssues.length){
      setFeedback("Corrige les SFX sourcés avant export : "+soundIssues[0].field+" — "+soundIssues[0].reason);
      return;
    }
    if(directorIssues.length){
      setFeedback("Corrige la direction éditoriale avant export : "+
        directorIssues[0].field+" — "+directorIssues[0].reason);
      return;
    }
    if(!canExport){setFeedback("Ajoute un script et les médias indispensables aux plans choisis.");return;}
    if(!captionValid){setFeedback("Corrige les sous-titres avant export : "+(parsedCaptions.error||captionIssues[0]?.reason));return;}
    const project={
      schema_version:"worldvision-creative-project-v1",id:loadedProjectId??mkSlug(projectName),
      title:projectName,script,fps:30,aspect_ratio:"9:16",
      ...(parsedCaptions.cues.length?{captions:parsedCaptions.cues}:{}),
      ...(directorBeats.length?{directorBeats}:{}),
      ...(soundCues.length?{soundCues}:{}),
      style:{background:"#0b1721",ink:"#f6f8fa",accent},
      shots:shots.map(s=>({
        id:s.id,durationFrames:s.durationFrames,template:s.template,
        title:s.title,subtitle:s.subtitle,eyebrow:s.eyebrow,
        ...(s.titleFrameZero?{titleFrameZero:true}:{}),
        focus:{x:s.focusX,y:s.focusY},
        ...(s.template==="document_focus"?{
          documentRegion:{x:s.documentX,y:s.documentY,width:s.documentW,height:s.documentH},
          ...(s.documentMobileSafe?{evidencePresentation:"mobile-safe",
            documentZoomMax:s.documentZoomMax}:{})
        }:{}),
        ...(s.template==="photo_story"?{photo:buildPhoto(s)}:{}),
        ...(s.template==="data_story"?{data:buildData(s)}:{}),
        ...((s.template==="geo_story"||s.template==="country_focus")?{geo:buildGeo(s)}:{}),
        motion:s.motion,transitionAfter:shots.indexOf(s)===shots.length-1?"cut":s.transitionAfter,
        transitionFrames:shots.indexOf(s)===shots.length-1||s.transitionAfter==="cut"?0:s.transitionFrames,
        ...(s.mediaName?{media:{kind:files.find(f=>f.name===s.mediaName)?.kind,file:s.mediaName,
          ...(s.mediaCredit?{credit:s.mediaCredit}:{}),
          ...(files.find(f=>f.name===s.mediaName)?.kind==="video"&&s.mediaTrimBefore?{trimBefore:s.mediaTrimBefore}:{})}}:{}),
        ...(s.foregroundName?{foreground:{file:s.foregroundName,
          ...(s.foregroundCredit?{credit:s.foregroundCredit}:{})}}:{})
      })),
      ...(voiceFile?{voice:{file:voiceFile,label:"Voix choisie ou enregistrée",volume:1}}:{}),
      ...(musicFile?{music:{file:musicFile,label:"Bande-son fournie",volume:0.10}}:{}),
      ...(outroFile?{outro:{file:outroFile,durationFrames:90}}:{})
    };
    const blob=new Blob([JSON.stringify(project,null,2)+"\n"],{type:"application/json"});
    const url=URL.createObjectURL(blob);
    const link=document.createElement("a");link.href=url;link.download=(loadedProjectId??mkSlug(projectName))+".json";
    document.body.append(link);link.click();link.remove();
    window.setTimeout(()=>URL.revokeObjectURL(url),1000);
    setFeedback("Projet JSON exporté. Conserve les fichiers médias dans un dossier assets/ portant les mêmes noms avant rendu.");
  };
  return <section className="wvc-board" aria-label="Atelier de composition audiovisuelle">
    <header className="wvc-head">
      <div className="wvc-eyebrow">WORLD-VISION · CREATIVE WORKBENCH</div>
      <h2>Les médias d'abord. <em>La réalisation ensuite.</em></h2>
      <p>Apporte ton texte, tes photographies, tes vidéos et tes sons. Construis des plans à partir de vrais éléments, et prépare un montage exploitable par Remotion sans dépendre d'une voix imposée.</p>
      <div className="wvc-disclaimer">Espace de préparation <strong>local dans ce navigateur</strong> : les fichiers ne sont pas envoyés à GitHub ou au serveur. L'export JSON prépare un rendu par notre moteur ; il ne produit pas encore de MP4 depuis cet écran.</div>
    </header>
    <div className="wvc-workspace">
      <div className="wvc-inputs">
        <label className="wvc-field-label" htmlFor="wvc-load-project">ROUVRIR UN PROJET WORLD-VISION (.JSON)</label>
        <input id="wvc-load-project" type="file" accept=".json,application/json" onChange={importProject}/>
        <p className="wvc-hint">Restaure les plans, la narration choisie et les sous-titres. Le JSON ne contient aucun fichier média : rattache les photos, vidéos et audios par leurs noms originaux.</p>
        <label className="wvc-field-label" htmlFor="wvc-project">PROJET</label>
        <input id="wvc-project" className="wvc-input" value={projectName} onChange={e=>setProjectName(e.target.value)} maxLength={160}/>
        <label className="wvc-field-label" htmlFor="wvc-script">SCRIPT FOURNI</label>
        <textarea id="wvc-script" className="wvc-script" value={script} onChange={e=>setScript(e.target.value)} placeholder="Colle ici ton script déjà rédigé. Le moteur de montage ne le réécrit pas." rows={8}/>
        <div className="wvc-script-meta">{script.trim()?script.trim().split(/\s+/).length+" mots":"Aucun script"} · Le texte reste sous ton contrôle.</div>
        <label className="wvc-field-label" htmlFor="wvc-import">IMPORTER TES FICHIERS</label>
        <input id="wvc-import" type="file" multiple accept="image/*,video/*,audio/*" onChange={addFiles}/>
        <p className="wvc-hint">Photos, rushes, animations MP4 produites ici ou ailleurs, voix enregistrée et musique. Les doublons de noms sont refusés.</p>
        <div className="wvc-asset-list">
          {files.length===0&&<span className="wvc-muted">Aucun fichier importé pour le moment.</span>}
          {files.map(f=><div className="wvc-asset" key={f.name}><b>{f.kind==="image"?"PHOTO":f.kind==="video"?"VIDÉO":"AUDIO"}</b><span title={f.name}>{f.name}</span><small>{(f.size/1024/1024).toFixed(1)} Mo</small></div>)}
        </div>
        {unresolvedAssets.length>0&&<p className="wvc-hint" role="alert">Médias à rattacher avant le rendu : {unresolvedAssets.join(", ")}. Aucune substitution automatique.</p>}
        <div className="wvc-audio">
          <label htmlFor="wvc-voice">VOIX / NARRATION</label>
          <select id="wvc-voice" value={voiceFile} onChange={e=>setVoiceFile(e.target.value)}>
            <option value="">Aucune — la voix pourra être choisie plus tard</option>
            {voiceFile&&!files.some(f=>f.name===voiceFile)&&<option value={voiceFile} disabled>Fichier absent : {voiceFile}</option>}
            {files.filter(f=>f.kind==="audio").map(f=><option key={f.name} value={f.name}>{f.name}</option>)}
          </select>
          <label htmlFor="wvc-voice-b">AUTRE PRISE À COMPARER</label>
          <select id="wvc-voice-b" value={comparisonVoice} onChange={e=>setComparisonVoice(e.target.value)}>
            <option value="">Aucune autre prise sélectionnée</option>
            {files.filter(f=>f.kind==="audio"&&f.name!==voiceFile).map(f=><option key={f.name} value={f.name}>{f.name}</option>)}
          </select>
          <div className="wvc-auditions" aria-label="Écoute comparative des voix fournies">
            {([
              ["A — Voix principale",voiceFile],
              ["B — Comparaison, non exportée",comparisonVoice]
            ] as [string,string][]).filter(x=>x[1]&&files.some(f=>f.name===x[1])).map(([label,name])=>{
              const audio=files.find(f=>f.name===name);
              return <div className="wvc-audition" key={label}>
                <span>{label}</span>
                <strong>{name}</strong>
                <audio controls preload="none" src={audio?.url} aria-label={label+": "+name}/>
              </div>;
            })}
          </div>
          <p className="wvc-hint">Écoute les deux prises du même texte au même volume. Aucune voix n'est générée automatiquement ; seule la prise principale est exportée dans le projet.</p>
          <label htmlFor="wvc-captions">SOUS-TITRES MINUTÉS (.SRT) — PISTE GLOBALE</label>
          <textarea id="wvc-captions" className="wvc-script" rows={5} value={srtInput} onChange={e=>{setImportedCaptionCues(null);setSrtInput(e.target.value);}} placeholder={"1\\n00:00:00,000 --> 00:00:02,200\\nPremière phrase de la vraie voix."}/>
          <label htmlFor="wvc-caption-position">POSITION INITIALE DES SOUS-TITRES</label>
          <select id="wvc-caption-position" value={captionPosition} onChange={e=>{setImportedCaptionCues(null);setCaptionPosition(e.target.value as "upper"|"lower");}}>
            <option value="upper">Haut — pour les scènes avec titres en bas</option>
            <option value="lower">Bas — pour les scènes avec titres en haut</option>
          </select>
          <p className="wvc-hint" role="status">{parsedCaptions.error?"Erreur SRT : "+parsedCaptions.error:captionIssues.length?"Erreur : "+captionIssues[0].reason:parsedCaptions.cues.length+" sous-titres lus à 30 images/s · aucune synchronisation vocale automatique."} Un SRT doit correspondre à la prise A effectivement sélectionnée ; vérifier son alignement à l’écoute et la superposition à chaque changement de scène.</p>
          <label htmlFor="wvc-music">MUSIQUE / AMBIANCE</label>
          <select id="wvc-music" value={musicFile} onChange={e=>setMusicFile(e.target.value)}>
            <option value="">Aucune</option>
            {musicFile&&!files.some(f=>f.name===musicFile)&&<option value={musicFile} disabled>Fichier absent : {musicFile}</option>}
            {files.filter(f=>f.kind==="audio").map(f=><option key={f.name} value={f.name}>{f.name}</option>)}
          </select>
          <label htmlFor="wvc-outro">SIGNATURE VIDÉO ORIGINALE</label>
          <select id="wvc-outro" value={outroFile} onChange={e=>setOutroFile(e.target.value)}>
            <option value="">Pas de signature ajoutée à ce stade</option>
            {outroFile&&!files.some(f=>f.name===outroFile)&&<option value={outroFile} disabled>Fichier absent : {outroFile}</option>}
            {files.filter(f=>f.kind==="video").map(f=><option key={f.name} value={f.name}>{f.name}</option>)}
          </select>
        </div>
      </div>
      <div className="wvc-edit">
        <div className="wvc-edit-head"><div><span>LE CONDUCTEUR DE MONTAGE</span><h3>Plans et compositions</h3></div><button type="button" onClick={addShot}>+ Ajouter un plan</button></div>
        <div className="wvc-shots" role="list" aria-label="Ordre des plans">
          {shots.map((s,i)=><button type="button" role="listitem" key={s.id} className={"wvc-shot "+(s.id===selectedId?"selected":"")} onClick={()=>setSelectedId(s.id)}>
            <b>{String(i+1).padStart(2,"0")}</b><span><strong>{s.title||TEMPLATE_LABELS[s.template]}</strong><small>{(s.durationFrames/30).toFixed(1)}s · {s.template}</small></span>
          </button>)}
        </div>
        <div className="wvc-shot-form">
          <div className="wvc-control-row"><strong>PLAN : {active.id}</strong><div><button type="button" onClick={()=>move(-1)} aria-label="Monter le plan">↑</button><button type="button" onClick={()=>move(1)} aria-label="Descendre le plan">↓</button><button type="button" onClick={removeShot} disabled={shots.length===1}>Supprimer</button></div></div>
          <div className="wvc-director-sheet" aria-label="Conducteur des hooks et re-hooks">
            <div className="wvc-director-head">
              <div><strong>DIRECTION DU RÉCIT · HOOKS ET RE-HOOKS</strong>
                <small>Des idées vérifiables, à un timecode réel. Aucune phrase, donnée ou voix n'est créée par cet outil.</small>
              </div>
              <button type="button" onClick={addDirectorBeat}>+ Séquence</button>
            </div>
            {directorBeats.filter(beat=>beat.shotId===active.id).length===0&&
              <p className="wvc-hint">Aucune séquence renseignée sur ce plan. Ajoute celles qui apportent une information nouvelle ; n'en invente pas pour remplir la vidéo.</p>}
            {directorBeats.filter(beat=>beat.shotId===active.id).map(beat=>
              <div className="wvc-director-beat" key={beat.id}>
                <div className="wvc-director-row"><strong>{beat.id} · {(beat.startFrame/30).toFixed(2)}–{(beat.endFrame/30).toFixed(2)} s</strong>
                  <div>
                    <button type="button" disabled={!fullFilmCanRender||directorIssues.length>0}
                      onClick={()=>reviewDirectorBeat(beat)}>▶ Écouter en contexte</button>
                    <button type="button" onClick={()=>setDirectorBeats(old=>old.filter(item=>item.id!==beat.id))}>Retirer</button>
                  </div>
                </div>
                <label>RÔLE NARRATIF
                  <select value={beat.intent} onChange={e=>updateDirectorBeat(beat.id,{intent:e.target.value as DirectorIntent})}>
                    {DIRECTOR_INTENTS.map(intent=><option key={intent} value={intent}>{
                      ({hook:"Accroche",explain:"Explication",rehook:"Relance de sens",
                        reveal:"Révélation",impact:"Conséquence",payoff:"Résolution"} as Record<DirectorIntent,string>)[intent]
                    }</option>)}
                  </select>
                </label>
                <div className="wvc-two-col">
                  <label>DÉBUT · SECONDES DU FILM
                    <input type="number" min="0" step=".033333" value={(beat.startFrame/30).toFixed(3)}
                      onChange={e=>updateDirectorBeat(beat.id,{startFrame:Math.round(Number(e.target.value)*30)})}/>
                  </label>
                  <label>FIN · SECONDES DU FILM
                    <input type="number" min="0" step=".033333" value={(beat.endFrame/30).toFixed(3)}
                      onChange={e=>updateDirectorBeat(beat.id,{endFrame:Math.round(Number(e.target.value)*30)})}/>
                  </label>
                </div>
                <label>CE QUE LE SPECTATEUR APPREND
                  <textarea maxLength={280} rows={2} value={beat.idea}
                    onChange={e=>updateDirectorBeat(beat.id,{idea:e.target.value})}
                    placeholder="Un fait, un contraste ou une conséquence réellement nouvelle"/>
                </label>
                <label>PHRASE EXACTE DU SCRIPT · LAISSER VIDE SI SILENCE
                  <textarea maxLength={420} rows={2} value={beat.spokenExcerpt}
                    onChange={e=>updateDirectorBeat(beat.id,{spokenExcerpt:e.target.value})}
                    placeholder="Copier un passage mot pour mot du texte approuvé (pas de synchronisation devinée)"/>
                </label>
                <label>PREUVE / SOURCE / DATE (À CONTRÔLER AVANT PUBLICATION)
                  <textarea maxLength={320} rows={2} value={beat.proofNote}
                    onChange={e=>updateDirectorBeat(beat.id,{proofNote:e.target.value})}
                    placeholder="Source primaire, document, vrai rush, attribution ou représentation explicitée"/>
                </label>
                <label>MOUVEMENT DIRECTEUR · COMPOSITION DU PLAN EXISTANT
                  <textarea maxLength={400} rows={2} value={beat.visualDirection}
                    onChange={e=>updateDirectorBeat(beat.id,{visualDirection:e.target.value})}
                    placeholder="Quel élément bouge, quand et pourquoi ? Photo + données + texte sans surcharge."/>
                </label>
                <label>INTENTION SONORE · NOTE, PAS UN SFX AUTOMATIQUE
                  <input maxLength={240} value={beat.audioDirection}
                    onChange={e=>updateDirectorBeat(beat.id,{audioDirection:e.target.value})}
                    placeholder="Entrée voix, respiration, accent bref autorisé, baisse de musique"/>
                </label>
              </div>)}
            {directorIssues.length>0&&<p className="wvc-director-error" role="alert">
              Direction incomplète : {directorIssues[0].field} — {directorIssues[0].reason}
            </p>}
          </div>
          <div className="wvc-sfx-sheet" aria-label="Accents sonores réels sur l'horloge du film">
            <strong>ACCENTS SONORES · FILM ORIGINAL</strong>
            <p className="wvc-hint">Les notes sonores ci-dessus ne jouent rien. Ici, chaque fichier doit être importé et autorisé.
              Les cues sont rendus par Remotion au même timecode dans le Player et le MP4.</p>
            <div className="wvc-sfx-add">
              <label>FICHIER SOURCE SFX
                <select value={newSfxFile} onChange={e=>setNewSfxFile(e.target.value)}>
                  <option value="">Choisir un fichier audio importé</option>
                  {files.filter(file=>file.kind==="audio").map(file=>
                    <option key={file.name} value={file.name}>{file.name}</option>)}
                </select>
              </label>
              <button type="button" disabled={!newSfxFile} onClick={addSoundCue}>
                + Accenter ce plan
              </button>
            </div>
            {soundCues.length===0&&<p className="wvc-hint">Aucun accent audio ajouté : les voix et la musique restent gérées séparément.</p>}
            {soundCues.map((cue,index)=>
              <div className="wvc-sfx-cue" key={index}>
                <div className="wvc-director-row">
                  <strong>SFX {index+1} · {cue.file}</strong>
                  <button type="button" onClick={()=>setSoundCues(old=>old.filter((_,i)=>i!==index))}>Retirer</button>
                </div>
                <div className="wvc-two-col">
                  <label>DÉBUT · SECONDES FILM
                    <input type="number" min="0" step=".033333" value={(cue.startFrame/30).toFixed(3)}
                      onChange={e=>updateSoundCue(index,{startFrame:Math.round(Number(e.target.value)*30)})}/>
                  </label>
                  <label>DURÉE · SECONDES
                    <input type="number" min=".1333" step=".033333" value={(cue.durationFrames/30).toFixed(3)}
                      onChange={e=>updateSoundCue(index,{durationFrames:Math.round(Number(e.target.value)*30)})}/>
                  </label>
                </div>
                <div className="wvc-two-col">
                  <label>GAIN MAX · 0 À 0,8
                    <input type="number" min="0" max=".8" step=".05" value={cue.volume??.25}
                      onChange={e=>updateSoundCue(index,{volume:Number(e.target.value)})}/>
                  </label>
                  <label>LIBELLÉ / PROVENANCE
                    <input maxLength={90} value={cue.label??""}
                      onChange={e=>updateSoundCue(index,{label:e.target.value})}/>
                  </label>
                </div>
              </div>)}
            {soundIssues.length>0&&<p role="alert" className="wvc-director-error">
              SFX invalide : {soundIssues[0].field} — {soundIssues[0].reason}
            </p>}
          </div>
          <div className="wvc-context-review">
            <button type="button" disabled={!fullFilmCanRender} onClick={reviewSelectedShotInContext}>
              ▶ Revoir ce plan avec son contexte
            </button>
            <small>Aller directement au raccord précédent dans le vrai film Remotion : même voix, musique,
              sous-titres et plans voisins. Aucun rendu complet supplémentaire.</small>
          </div>
          <div className="wvc-two-col">
            <label>TYPE DE COMPOSITION<select value={active.template} onChange={e=>updateShot({template:e.target.value as Template,geoShowCamera:e.target.value==="geo_story"?active.geoShowCamera:false,geoShowRoute:e.target.value==="geo_story"?active.geoShowRoute:false,geoShowCountry:e.target.value==="country_focus"?true:active.geoShowCountry,durationFrames:e.target.value==="focus_reveal"?Math.max(active.durationFrames,90):e.target.value==="document_focus"?Math.max(active.durationFrames,115):(e.target.value==="geo_story"||e.target.value==="country_focus"||e.target.value==="photo_story"||e.target.value==="data_story")?Math.max(active.durationFrames,150):active.durationFrames})}>{templates.map(t=><option key={t} value={t}>{TEMPLATE_LABELS[t]}</option>)}</select></label>
            <label>DURÉE DU PLAN (SECONDES)<input type="number" min=".5" max="120" step=".1" value={active.durationFrames/30} onChange={e=>{const v=Number(e.target.value);if(Number.isFinite(v)&&v>=.5&&v<=120)updateShot({durationFrames:Math.round(v*30)});}}/></label>
          </div>
          <label className="wvc-wide">MÉDIA SOURCE<select value={active.mediaName} onChange={e=>updateShot({mediaName:e.target.value})}>
            <option value="">Pas de média source</option>
            {active.mediaName&&!files.some(f=>f.name===active.mediaName)&&<option value={active.mediaName} disabled>Fichier absent : {active.mediaName}</option>}
            {files.filter(f=>f.kind!=="audio").map(f=><option key={f.name} value={f.name}>{f.name}</option>)}
          </select></label>
          <label className="wvc-wide">DÉTOURAGE POUR EFFET DE PROFONDEUR
            <select value={active.foregroundName} onChange={e=>updateShot({foregroundName:e.target.value})}>
              <option value="">Aucun — composition classique</option>
              {active.foregroundName&&!files.some(f=>f.name===active.foregroundName)&&<option value={active.foregroundName} disabled>Fichier absent : {active.foregroundName}</option>}
              {files.filter(f=>f.kind==="image"&&/\.(png|webp)$/i.test(f.name)).map(f=><option key={f.name} value={f.name}>{f.name}</option>)}
            </select>
            <span className="wvc-hint">Utiliser uniquement un premier plan transparent préparé avec un outil spécialisé ; le studio effectue le compositing et le mouvement 2,5D sans inventer une image.</span>
          </label>
          <label className="wvc-wide">CRÉDIT / PROVENANCE DU MÉDIA
            <input value={active.mediaCredit} maxLength={200} onChange={e=>updateShot({mediaCredit:e.target.value})}
              placeholder="Auteur, institution et attribution approuvée"/>
          </label>
          {files.find(f=>f.name===active.mediaName)?.kind==="video"&&<label className="wvc-wide">
            POINT D'ENTRÉE VIDÉO (IMAGES À 30 FPS)
            <input type="number" min="0" max="30000" step="1" value={active.mediaTrimBefore}
              onChange={e=>{const n=Number(e.target.value);if(Number.isInteger(n)&&n>=0&&n<=30000)updateShot({mediaTrimBefore:n});}}/>
          </label>}
          {active.foregroundName&&<label className="wvc-wide">CRÉDIT DU DÉTOURAGE
            <input value={active.foregroundCredit} maxLength={200} onChange={e=>updateShot({foregroundCredit:e.target.value})}/>
          </label>}
          <label className="wvc-wide">TITRE À L'ÉCRAN<input value={active.title} maxLength={150} onChange={e=>updateShot({title:e.target.value})} placeholder="Court, lisible, sans surcharge"/></label>
          {shots[0]?.id===active.id&&<label className="wvc-wide">
            <input type="checkbox" checked={active.titleFrameZero} onChange={e=>updateShot({titleFrameZero:e.target.checked})}/>
            Accroche immédiate : titre lisible dès la première image (TikTok et formats courts)
          </label>}
          <label className="wvc-wide">TEXTE SECONDAIRE<input value={active.subtitle} onChange={e=>updateShot({subtitle:e.target.value})} placeholder="Une seule idée claire"/></label>
          {active.template==="photo_story"&&<div className="wvc-focus-control" aria-label="PHOTO : direction de six pistes indépendantes">
            <div className="wvc-focus-heading">
              <strong>PHOTO MOTION — UNE IMAGE, PLUSIEURS ANIMATIONS SIMULTANÉES</strong>
              <span>Source réelle obligatoire. Les pistes ont des temps indépendants : caméra, détourage externe, révélation du même original, focus manuel, chiffre sourcé et typographie. Aucun objet ou fait généré.</span>
            </div>
            <div className="wvc-two-col">
              <label>ZOOM DE DÉPART <input type="number" step=".01" min="1.03" max="1.18" value={active.photoSettings.camera.zoomFrom}
                onChange={e=>updatePhotoTrack("camera",{zoomFrom:Number(e.target.value)})}/></label>
              <label>ZOOM D'ARRIVÉE <input type="number" step=".01" min="1.03" max="1.2" value={active.photoSettings.camera.zoomTo}
                onChange={e=>updatePhotoTrack("camera",{zoomTo:Number(e.target.value)})}/></label>
              <label>PAN X · PIXELS <input type="number" min="-40" max="40" step="1" value={active.photoSettings.camera.panX}
                onChange={e=>updatePhotoTrack("camera",{panX:Number(e.target.value)})}/></label>
              <label>PAN Y · PIXELS <input type="number" min="-45" max="45" step="1" value={active.photoSettings.camera.panY}
                onChange={e=>updatePhotoTrack("camera",{panY:Number(e.target.value)})}/></label>
            </div>
            <details><summary>Timeline caméra — début et arrivée</summary>
              <div className="wvc-two-col">
                <label>DÉBUT (s) <input type="number" step=".1" min="0" value={active.photoSettings.camera.startFrame/30}
                  onChange={e=>updatePhotoTrack("camera",{startFrame:Math.round(Number(e.target.value)*30)})}/></label>
                <label>FIN (s) <input type="number" step=".1" min="1" value={active.photoSettings.camera.endFrame/30}
                  onChange={e=>updatePhotoTrack("camera",{endFrame:Math.round(Number(e.target.value)*30)})}/></label>
              </div>
            </details>
            <label className="wvc-geo-toggle"><input type="checkbox" checked={active.photoUseMask}
              onChange={e=>updateShot({photoUseMask:e.target.checked})}/>Révélation progressive du même original par masque</label>
            {active.photoUseMask&&<div className="wvc-two-col">
              <label>AXE <select value={active.photoSettings.mask.axis}
                onChange={e=>updatePhotoTrack("mask",{axis:e.target.value})}>
                <option value="horizontal">Latéral</option><option value="vertical">Vertical</option>
              </select></label>
              <label>DÉBUT (s) <input type="number" step=".1" value={active.photoSettings.mask.startFrame/30}
                onChange={e=>updatePhotoTrack("mask",{startFrame:Math.round(Number(e.target.value)*30)})}/></label>
              <label>FIN (s) <input type="number" step=".1" value={active.photoSettings.mask.endFrame/30}
                onChange={e=>updatePhotoTrack("mask",{endFrame:Math.round(Number(e.target.value)*30)})}/></label>
            </div>}
            <label className="wvc-geo-toggle"><input type="checkbox" checked={active.photoUseSubject}
              onChange={e=>updateShot({photoUseSubject:e.target.checked})}/>Parallaxe du premier plan détouré (PNG/WebP transparent importé)</label>
            {active.photoUseSubject&&<div className="wvc-two-col">
              <label>DÉPLACEMENT X <input type="number" min="-45" max="45" value={active.photoSettings.subject.dx}
                onChange={e=>updatePhotoTrack("subject",{dx:Number(e.target.value)})}/></label>
              <label>DÉPLACEMENT Y <input type="number" min="-45" max="45" value={active.photoSettings.subject.dy}
                onChange={e=>updatePhotoTrack("subject",{dy:Number(e.target.value)})}/></label>
              <label>PROFONDEUR (ZOOM SUPPLÉMENTAIRE) <input type="number" min="0" max=".16" step=".01" value={active.photoSettings.subject.scale}
                onChange={e=>updatePhotoTrack("subject",{scale:Number(e.target.value)})}/></label>
              <label>DÉBUT (s) <input type="number" step=".1" value={active.photoSettings.subject.startFrame/30}
                onChange={e=>updatePhotoTrack("subject",{startFrame:Math.round(Number(e.target.value)*30)})}/></label>
              <label>FIN (s) <input type="number" step=".1" value={active.photoSettings.subject.endFrame/30}
                onChange={e=>updatePhotoTrack("subject",{endFrame:Math.round(Number(e.target.value)*30)})}/></label>
            </div>}
            <label className="wvc-geo-toggle"><input type="checkbox" checked={active.photoUseFocus}
              onChange={e=>updateShot({photoUseFocus:e.target.checked})}/>Focus sur un détail explicitement choisi dans l'image</label>
            {active.photoUseFocus&&<div className="wvc-two-col">
              <label>X (0–1) <input type="number" min=".07" max=".93" step=".01" value={active.photoSettings.focus.x}
                onChange={e=>updatePhotoTrack("focus",{x:Number(e.target.value)})}/></label>
              <label>Y (0–1) <input type="number" min=".09" max=".76" step=".01" value={active.photoSettings.focus.y}
                onChange={e=>updatePhotoTrack("focus",{y:Number(e.target.value)})}/></label>
              <label>RAYON (px) <input type="number" min="35" max="190" value={active.photoSettings.focus.radius}
                onChange={e=>updatePhotoTrack("focus",{radius:Number(e.target.value)})}/></label>
              <label>DÉBUT (s) <input type="number" step=".1" value={active.photoSettings.focus.startFrame/30}
                onChange={e=>updatePhotoTrack("focus",{startFrame:Math.round(Number(e.target.value)*30)})}/></label>
              <label>FIN (s) <input type="number" step=".1" value={active.photoSettings.focus.endFrame/30}
                onChange={e=>updatePhotoTrack("focus",{endFrame:Math.round(Number(e.target.value)*30)})}/></label>
            </div>}
            <label className="wvc-geo-toggle"><input type="checkbox" checked={active.photoUseMetric}
              onChange={e=>updateShot({photoUseMetric:e.target.checked,photoUseComparison:e.target.checked?false:active.photoUseComparison})}/>Chiffre animé et ATTRIBUTION obligatoire</label>
            {active.photoUseMetric&&<div className="wvc-two-col">
              <label>INTITULÉ <input maxLength={55} value={active.photoSettings.metric.label}
                onChange={e=>updatePhotoTrack("metric",{label:e.target.value})}/></label>
              <label>VALEUR <input type="number" value={active.photoSettings.metric.value}
                onChange={e=>updatePhotoTrack("metric",{value:Number(e.target.value)})}/></label>
              <label>UNITÉ <input maxLength={12} value={active.photoSettings.metric.unit}
                onChange={e=>updatePhotoTrack("metric",{unit:e.target.value})}/></label>
              <label>LIBELLÉ DE SOURCE <input maxLength={85} value={active.photoSettings.metric.sourceLabel}
                onChange={e=>updatePhotoTrack("metric",{sourceLabel:e.target.value})}/></label>
              <label>DÉBUT (s) <input type="number" step=".1" value={active.photoSettings.metric.startFrame/30}
                onChange={e=>updatePhotoTrack("metric",{startFrame:Math.round(Number(e.target.value)*30)})}/></label>
              <label>FIN (s) <input type="number" step=".1" value={active.photoSettings.metric.endFrame/30}
                onChange={e=>updatePhotoTrack("metric",{endFrame:Math.round(Number(e.target.value)*30)})}/></label>
            </div>}
            <label className="wvc-geo-toggle"><input type="checkbox" checked={active.photoUseComparison}
              onChange={e=>updateShot({photoUseComparison:e.target.checked,photoUseMetric:e.target.checked?false:active.photoUseMetric})}/>
              PHOTO + COMPARAISON DATA ANIMÉE EN MÊME TEMPS (valeurs et source obligatoires)</label>
            {active.photoUseComparison&&<div className="wvc-two-col">
              <label>TITRE DE COMPARAISON <input maxLength={65}
                value={active.photoSettings.comparison.title}
                onChange={e=>updatePhotoComparison({title:e.target.value})}/></label>
              <label>UNITÉ <input maxLength={12} value={active.photoSettings.comparison.unit}
                onChange={e=>updatePhotoComparison({unit:e.target.value})}/></label>
              <label>PREMIÈRE CATÉGORIE <input maxLength={30} value={active.photoSettings.comparison.first.label}
                onChange={e=>updatePhotoComparison({first:{...active.photoSettings.comparison.first,label:e.target.value}})}/></label>
              <label>PREMIÈRE VALEUR <input type="number" value={active.photoSettings.comparison.first.value}
                onChange={e=>updatePhotoComparison({first:{...active.photoSettings.comparison.first,value:Number(e.target.value)}})}/></label>
              <label>DEUXIÈME CATÉGORIE <input maxLength={30} value={active.photoSettings.comparison.second.label}
                onChange={e=>updatePhotoComparison({second:{...active.photoSettings.comparison.second,label:e.target.value}})}/></label>
              <label>DEUXIÈME VALEUR <input type="number" value={active.photoSettings.comparison.second.value}
                onChange={e=>updatePhotoComparison({second:{...active.photoSettings.comparison.second,value:Number(e.target.value)}})}/></label>
              <label>ÉCHELLE MINIMUM (DOIT INCLURE 0) <input type="number"
                value={active.photoSettings.comparison.domain.min}
                onChange={e=>updatePhotoComparison({domain:{...active.photoSettings.comparison.domain,min:Number(e.target.value)}})}/></label>
              <label>ÉCHELLE MAXIMUM (DOIT INCLURE 0) <input type="number"
                value={active.photoSettings.comparison.domain.max}
                onChange={e=>updatePhotoComparison({domain:{...active.photoSettings.comparison.domain,max:Number(e.target.value)}})}/></label>
              <label>ÉDITEUR / INSTITUTION SOURCE <input maxLength={80} value={active.photoSettings.comparison.source.publisher}
                onChange={e=>updatePhotoComparison({source:{...active.photoSettings.comparison.source,publisher:e.target.value}})}/></label>
              <label>JEU DE DONNÉES / PUBLICATION <input maxLength={120} value={active.photoSettings.comparison.source.dataset}
                onChange={e=>updatePhotoComparison({source:{...active.photoSettings.comparison.source,dataset:e.target.value}})}/></label>
              <label>DATE DE SOURCE (AAAA-MM-JJ) <input type="date" value={active.photoSettings.comparison.source.asOf}
                onChange={e=>updatePhotoComparison({source:{...active.photoSettings.comparison.source,asOf:e.target.value}})}/></label>
              <label>URL SOURCE HTTPS (FACULTATIF) <input type="url" value={active.photoSettings.comparison.source.url??""}
                onChange={e=>updatePhotoComparison({source:{
                  ...active.photoSettings.comparison.source,
                  ...(e.target.value?{url:e.target.value}:{url:undefined})
                }})}/></label>
              <label>ENTRÉE DE LA COMPARAISON (s) <input type="number" step=".1" min="0"
                value={active.photoSettings.comparison.startFrame/30}
                onChange={e=>updatePhotoComparison({startFrame:Math.round(Number(e.target.value)*30)})}/></label>
              <label>FIN DE RÉVÉLATION DES BARRES (s) <input type="number" step=".1" min="0"
                value={active.photoSettings.comparison.endFrame/30}
                onChange={e=>updatePhotoComparison({endFrame:Math.round(Number(e.target.value)*30)})}/></label>
              <span className="wvc-hint">Les valeurs restent exactes pendant toute l'animation : seule la longueur des barres se dévoile. Les négatifs partent vers la gauche du zéro, les positifs vers la droite. La date, les catégories et l'échelle ne sont jamais inventées.</span>
            </div>}
            <p className="wvc-hint">Ces réglages sont des pistes de montage, pas une preuve des faits. Le masque et le focus utilisent les pixels de l'image importée. Vérifie cadrage et sujet après mouvement ; seuls les assets aux droits connus peuvent être diffusés.</p>
          </div>}
          {active.template==="data_story"&&<div className="wvc-focus-control" aria-label="Data Motion — graphiques et sources éditoriales">
            <div className="wvc-focus-heading">
              <strong>DATA MOTION — GRAPHIQUES ANIMÉS ET SOURCE VÉRIFIABLE</strong>
              <span>Le chiffre, son échelle, sa date et sa provenance viennent uniquement de tes données. Le moteur n'invente ni cours de Bourse, ni classement, ni série financière.</span>
            </div>
            <label>TYPE DE GRAPHIQUE
              <select value={active.dataMode} onChange={e=>updateShot({dataMode:e.target.value as Shot["dataMode"]})}>
                <option value="line">Évolution · courbe temporelle</option>
                <option value="ranking">Classement · barres horizontales</option>
                <option value="heatmap">Heatmap · intensité relative et valeurs</option>
              </select>
            </label>
            <label>SÉRIE DE DONNÉES FOURNIE
              <textarea rows={8} value={active.dataRaw} maxLength={3200}
                placeholder={active.dataMode==="line"
                  ?"2026-01-01|Janvier|15.5\n2026-02-01|Février|16.1\n2026-03-01|Mars|17.0"
                  :"Catégorie A|15.5\nCatégorie B|12.0\nCatégorie C|7.2"}
                onChange={e=>updateShot({dataRaw:e.target.value})}/>
              <span className="wvc-hint">Séparer les colonnes par le caractère |. Courbe : DATE ISO | LIBELLÉ | VALEUR. Classement/heatmap : LIBELLÉ | VALEUR. Utiliser le point pour les décimales. Les nombres affichés dans l'exemple de saisie sont fictifs : ne pas les utiliser comme actualité.</span>
            </label>
            <div className="wvc-two-col">
              <label>MINIMUM VISIBLE DE L'AXE
                <input inputMode="decimal" value={active.dataMin} placeholder="0"
                  onChange={e=>updateShot({dataMin:e.target.value})}/>
              </label>
              <label>MAXIMUM VISIBLE DE L'AXE
                <input inputMode="decimal" value={active.dataMax} placeholder="100"
                  onChange={e=>updateShot({dataMax:e.target.value})}/>
              </label>
              <label>UNITÉ DE LA SÉRIE
                <input maxLength={12} value={active.dataUnit} placeholder="%, $, €, personnes..."
                  onChange={e=>updateShot({dataUnit:e.target.value})}/>
              </label>
              <label>PRÉCISION
                <select value={active.dataPrecision} onChange={e=>updateShot({dataPrecision:Number(e.target.value)})}>
                  <option value={0}>0 décimale</option>
                  <option value={1}>1 décimale</option>
                  <option value={2}>2 décimales</option>
                </select>
              </label>
              <label>FORMAT DES NOMBRES
                <select value={active.dataLocale} onChange={e=>updateShot({dataLocale:e.target.value as "fr-FR"|"en-US"})}>
                  <option value="fr-FR">Français</option>
                  <option value="en-US">English (US)</option>
                </select>
              </label>
            </div>
            <div className="wvc-two-col">
              <label>ÉMETTEUR / INSTITUTION
                <input maxLength={80} value={active.dataPublisher} placeholder="Organisme à vérifier"
                  onChange={e=>updateShot({dataPublisher:e.target.value})}/>
              </label>
              <label>INDICATEUR / JEU DE DONNÉES
                <input maxLength={120} value={active.dataDataset} placeholder="Nom exact de la série"
                  onChange={e=>updateShot({dataDataset:e.target.value})}/>
              </label>
              <label>DATE DE SITUATION (ISO)
                <input type="date" value={active.dataAsOf}
                  onChange={e=>updateShot({dataAsOf:e.target.value})}/>
              </label>
              <label>LIEN HTTPS VERS LA SOURCE (FACULTATIF)
                <input type="url" value={active.dataUrl} placeholder="https://…"
                  onChange={e=>updateShot({dataUrl:e.target.value})}/>
              </label>
            </div>
            <p className="wvc-hint">Les classements et heatmaps exigent un axe qui commence à zéro. Les courbes peuvent choisir une autre échelle, mais l'intervalle sera explicitement affiché dans la vidéo. Un lien ou une institution saisi ne remplace pas la vérification journalistique humaine.</p>
            <p className="wvc-hint">{validData(active)
              ?"Format, données, échelle et source cohérents pour une prévisualisation technique. Vérifie toujours les faits."
              :"À compléter : données (3–16 lignes suivant le graphique), source, date, bornes et unités cohérentes."}</p>
          </div>}
          {active.template==="geo_story"&&<div className="wvc-focus-control" aria-label="Direction du plan géographique">
            <div className="wvc-focus-heading">
              <strong>CARTE DU MONDE — DIRECTION GÉOGRAPHIQUE</strong>
              <span>Frontières Natural Earth réelles. Toutes les positions, routes et données doivent être choisies et vérifiées manuellement. Pas de chiffres ou de géocodage inventés.</span>
            </div>
            <label>MATIÈRE DE LA TERRE
              <select value={active.geoLook} onChange={e=>updateShot({geoLook:e.target.value as "photo"|"vector"})}>
                <option value="photo">Terre 3D · photographie NASA Blue Marble (2004)</option>
                <option value="vector">Carte vectorielle · Natural Earth (alternative explicite)</option>
              </select>
            </label>
            <div className="wvc-two-col">
              <label>CENTRE LONGITUDE
                <input type="number" min="-180" max="180" step=".1" value={active.geoLon}
                  onChange={e=>updateShot({geoLon:Number(e.target.value)})}/>
              </label>
              <label>CENTRE LATITUDE
                <input type="number" min="-85" max="85" step=".1" value={active.geoLat}
                  onChange={e=>updateShot({geoLat:Number(e.target.value)})}/>
              </label>
              <label>ROTATION PENDANT LE PLAN · DEGRÉS
                <input type="number" min="-360" max="360" step="1" value={active.geoSpin}
                  onChange={e=>updateShot({geoSpin:Number(e.target.value)})}/>
              </label>
            </div>
            <label className="wvc-geo-toggle"><input type="checkbox" checked={active.geoShowCamera}
              onChange={e=>updateShot({geoShowCamera:e.target.checked})}/>
              Caméra géographique dirigée · depuis le centre initial vers une destination choisie
            </label>
            {active.geoShowCamera&&<div className="wvc-two-col">
              <label>DESTINATION · LONGITUDE
                <input type="number" min="-180" max="180" step=".01" value={active.geoToLon}
                  onChange={e=>updateShot({geoToLon:Number(e.target.value)})}/>
              </label>
              <label>DESTINATION · LATITUDE
                <input type="number" min="-85" max="85" step=".01" value={active.geoToLat}
                  onChange={e=>updateShot({geoToLat:Number(e.target.value)})}/>
              </label>
              <label>DÉBUT DU MOUVEMENT (s)
                <input type="number" min="0" step=".1" value={active.geoCameraStart/30}
                  onChange={e=>updateShot({geoCameraStart:Math.round(Number(e.target.value)*30)})}/>
              </label>
              <label>FIN DU MOUVEMENT (s)
                <input type="number" min="1" step=".1" value={active.geoCameraEnd/30}
                  onChange={e=>updateShot({geoCameraEnd:Math.round(Number(e.target.value)*30)})}/>
              </label>
              <label>APPROCHE OPTIQUE DE LA PLANÈTE
                <input type="number" min="1" max="1.15" step=".01" value={active.geoCameraZoom}
                  onChange={e=>updateShot({geoCameraZoom:Number(e.target.value)})}/>
              </label>
            </div>}
            <p className="wvc-hint">La caméra suit un arc géodésique court puis reste orientée sur la destination. Le zoom optique est limité à 15 % dans l'œil ; un vrai zoom pleine carte/pays nécessitera une composition distincte. Vérifie la destination et le rendu avant tout reportage.</p>
            <label className="wvc-geo-toggle"><input type="checkbox" checked={active.geoShowCountry}
              onChange={e=>updateShot({geoShowCountry:e.target.checked})}/>
              Mettre en lumière le contour d'un pays (Natural Earth / World Atlas 110m)
            </label>
            {active.geoShowCountry&&<label>PAYS SÉLECTIONNÉ DANS L'ATLAS
              <select value={active.geoCountryId} onChange={e=>updateShot({geoCountryId:e.target.value})}>
                <option value="">Choisir explicitement un pays du référentiel</option>
                {COUNTRIES.map(country=><option key={country.id} value={country.id}>
                  {country.name} · {country.id}
                </option>)}
              </select>
              <span className="wvc-hint">L'atlas 110m simplifie les frontières et omet des territoires. Ce dessin n'est pas une prise de position sur un différend territorial. Vérifier carte, source et période avant publication.</span>
            </label>}
            <label className="wvc-geo-toggle"><input type="checkbox" checked={active.geoShowTarget}
              onChange={e=>updateShot({geoShowTarget:e.target.checked,geoShowRoute:e.target.checked?active.geoShowRoute:false})}/>
              Localiser un lieu explicitement indiqué
            </label>
            {active.geoShowTarget&&<div className="wvc-two-col">
              <label>LIEU · LONGITUDE <input type="number" min="-180" max="180" step=".01"
                value={active.geoTargetLon} onChange={e=>updateShot({geoTargetLon:Number(e.target.value)})}/></label>
              <label>LIEU · LATITUDE <input type="number" min="-85" max="85" step=".01"
                value={active.geoTargetLat} onChange={e=>updateShot({geoTargetLat:Number(e.target.value)})}/></label>
              <label>NOM DU LIEU <input value={active.geoTargetLabel} maxLength={80}
                onChange={e=>updateShot({geoTargetLabel:e.target.value})}/></label>
            </div>}
            {active.geoShowTarget&&<label className="wvc-geo-toggle"><input type="checkbox" checked={active.geoShowRoute}
              onChange={e=>updateShot({geoShowRoute:e.target.checked})}/>Tracer un arc géographique réel</label>}
            {active.geoShowRoute&&<div className="wvc-two-col">
              <label>DÉPART · LONGITUDE <input type="number" min="-180" max="180" step=".01"
                value={active.geoFromLon} onChange={e=>updateShot({geoFromLon:Number(e.target.value)})}/></label>
              <label>DÉPART · LATITUDE <input type="number" min="-85" max="85" step=".01"
                value={active.geoFromLat} onChange={e=>updateShot({geoFromLat:Number(e.target.value)})}/></label>
            </div>}
            <label className="wvc-geo-toggle"><input type="checkbox" checked={active.geoShowMetric}
              onChange={e=>updateShot({geoShowMetric:e.target.checked})}/>Animer une donnée du script (chiffre vérifié)</label>
            {active.geoShowMetric&&<div className="wvc-two-col">
              <label>LIBELLÉ <input maxLength={55} value={active.geoMetricLabel}
                onChange={e=>updateShot({geoMetricLabel:e.target.value})}/></label>
              <label>VALEUR <input inputMode="decimal" value={active.geoMetricValue}
                onChange={e=>updateShot({geoMetricValue:e.target.value})}/></label>
              <label>UNITÉ <input maxLength={12} value={active.geoMetricUnit}
                onChange={e=>updateShot({geoMetricUnit:e.target.value})}/></label>
            </div>}
            <p className="wvc-hint">Une photographie ou un extrait vidéo importé dans « Média source » apparaît dans la même composition que le globe, l'arc, les chiffres et les titres. Aucun élément n'est censé illustrer une actualité sans provenance vérifiée.</p>
          </div>}
          {active.template==="country_focus"&&<div className="wvc-focus-control" aria-label="Direction d'un pays / Motion GEO-2">
            <div className="wvc-focus-heading">
              <strong>GEO-2 · PAYS EN DÉTAIL — CARTE ET MÉDIAS MULTICOUCHES</strong>
              <span>Choisir une vraie géométrie Natural Earth 1:10m. Le contexte vient du 1:50m. La caméra, la silhouette, le média, la donnée et le texte sont animés indépendamment.</span>
            </div>
            <Suspense fallback={<div className="wvc-hint">Chargement du référentiel géographique détaillé…</div>}>
              <CountrySelector10m value={active.geoCountryId} onChange={id=>updateShot({geoCountryId:id})}/>
            </Suspense>
            <label className="wvc-geo-toggle"><input type="checkbox" checked={active.geoShowTarget}
              onChange={e=>updateShot({geoShowTarget:e.target.checked})}/>Repérer un lieu situé dans ce pays (coordonnées sourcées)</label>
            {active.geoShowTarget&&<div className="wvc-two-col">
              <label>LONGITUDE <input type="number" min="-180" max="180" step=".01" value={active.geoTargetLon}
                onChange={e=>updateShot({geoTargetLon:Number(e.target.value)})}/></label>
              <label>LATITUDE <input type="number" min="-85" max="85" step=".01" value={active.geoTargetLat}
                onChange={e=>updateShot({geoTargetLat:Number(e.target.value)})}/></label>
              <label>LIBELLÉ DU LIEU <input maxLength={80} value={active.geoTargetLabel}
                onChange={e=>updateShot({geoTargetLabel:e.target.value})}/></label>
            </div>}
            <label className="wvc-geo-toggle"><input type="checkbox" checked={active.geoShowMetric}
              onChange={e=>updateShot({geoShowMetric:e.target.checked})}/>Animer une donnée chiffrée du script</label>
            {active.geoShowMetric&&<div className="wvc-two-col">
              <label>LIBELLÉ <input maxLength={55} value={active.geoMetricLabel}
                onChange={e=>updateShot({geoMetricLabel:e.target.value})}/></label>
              <label>VALEUR <input inputMode="decimal" value={active.geoMetricValue}
                onChange={e=>updateShot({geoMetricValue:e.target.value})}/></label>
              <label>UNITÉ <input maxLength={12} value={active.geoMetricUnit}
                onChange={e=>updateShot({geoMetricUnit:e.target.value})}/></label>
            </div>}
            <p className="wvc-hint">Un marqueur doit appartenir au pays sélectionné selon la géométrie de l'atlas. Le validateur serveur refuse les positions extérieures. Photo/vidéo et éventuel détourage transparent se choisissent dans les champs « Média source » et « Détourage » au-dessus. Aucun chiffre, droit d'image ou événement n'est vérifié automatiquement.</p>
          </div>}
          {active.template==="document_focus"&&<div className="wvc-focus-control" aria-label="Sélection de la zone du document à inspecter">
            <div className="wvc-focus-heading">
              <strong>ZONE DU DOCUMENT À METTRE EN LUMIÈRE</strong>
              <span>Les coordonnées s'appliquent à la feuille affichée en entier, et non à une reconstitution IA. Vérifie les mots et chiffres avant diffusion.</span>
            </div>
            <label>GAUCHE · {Math.round(active.documentX*100)} %
              <input type="range" min="0" max={Math.round((1-active.documentW)*100)} step="1"
                value={Math.round(active.documentX*100)}
                onChange={e=>updateShot({documentX:Number(e.target.value)/100})}/>
            </label>
            <label>HAUT · {Math.round(active.documentY*100)} %
              <input type="range" min="0" max={Math.round((1-active.documentH)*100)} step="1"
                value={Math.round(active.documentY*100)}
                onChange={e=>updateShot({documentY:Number(e.target.value)/100})}/>
            </label>
            <label>LARGEUR · {Math.round(active.documentW*100)} %
              <input type="range" min="12" max="85" step="1"
                value={Math.round(active.documentW*100)}
                onChange={e=>{const width=Number(e.target.value)/100;updateShot({documentW:width,documentX:Math.min(active.documentX,1-width)});}}/>
            </label>
            <label>HAUTEUR · {Math.round(active.documentH*100)} %
              <input type="range" min="8" max="80" step="1"
                value={Math.round(active.documentH*100)}
                onChange={e=>{const height=Number(e.target.value)/100;updateShot({documentH:height,documentY:Math.min(active.documentY,1-height)});}}/>
            </label>
            <label>
              <input type="checkbox" checked={active.documentMobileSafe}
                onChange={e=>updateShot({documentMobileSafe:e.target.checked})}/>
              PREUVE LISIBLE SUR MOBILE · sous-titres au-dessus du document
            </label>
            <label>ZOOM OPTIQUE SUR PIXELS ORIGINAUX · {active.documentZoomMax.toFixed(2)}×
              <input type="range" min="1" max="2.25" step="0.05"
                disabled={!active.documentMobileSafe}
                value={active.documentZoomMax}
                onChange={e=>updateShot({documentZoomMax:Number(e.target.value)})}/>
            </label>
            <small>La zone choisie et le zoom ne modifient pas l'image source. Évalue la lisibilité du document et les contrôles TikTok sur le vrai MP4 avant toute diffusion.</small>
          </div>}
          <div className="wvc-focus-control" aria-label="Cadrage précis de l’image source">
            <div className="wvc-focus-heading"><strong>CADRAGE ET POINT D’INTÉRÊT</strong><span>Sauvegardé dans le projet Remotion</span></div>
            <label>HORIZONTAL · {Math.round(active.focusX*100)} %
              <input type="range" min="0" max="100" step="1" value={Math.round(active.focusX*100)}
                onChange={e=>updateShot({focusX:Number(e.target.value)/100})}/>
            </label>
            <label>VERTICAL · {Math.round(active.focusY*100)} %
              <input type="range" min="0" max="100" step="1" value={Math.round(active.focusY*100)}
                onChange={e=>updateShot({focusY:Number(e.target.value)/100})}/>
            </label>
          </div>
          <div className="wvc-two-col">
            <label>MOUVEMENT<select value={active.motion} onChange={e=>updateShot({motion:e.target.value as Motion})}>{motions.map(m=><option key={m} value={m}>{MOTION_LABELS[m]}</option>)}</select></label>
            <label>RACCORD<select value={active.transitionAfter} onChange={e=>updateShot({transitionAfter:e.target.value as Transition,transitionFrames:e.target.value==="cut"?0:Math.max(active.transitionFrames,8)})}>{(Object.keys(TRANSITIONS) as Transition[]).map(t=><option key={t} value={t}>{TRANSITIONS[t]}</option>)}</select></label>
          </div>
        </div>
        <div className="wvc-export">
          <div className="wvc-export-top"><strong>MASTER VISÉ · 9:16 · 1080×1920 · 30 ips</strong><span>{(duration/30).toFixed(1)} secondes</span></div>
          <p>Une fois le JSON exporté, les médias peuvent être montés par le moteur Remotion de World‑Vision. Les effets professionnels avancés ou génératifs resteront accessibles par des outils spécialisés.</p>
          <button type="button" disabled={!canExport||!captionValid||directorIssues.length>0||soundIssues.length>0} onClick={exportProject}>Exporter le projet de montage (.json)</button>
          <a href={path} target="_blank" rel="noopener noreferrer">Voir le processus de rendu et les limites ↗</a>
          {feedback&&<div className="wvc-feedback" role="status">{feedback}</div>}
        </div>
      </div>
      <aside className="wvc-preview" id="wvc-preview">
        <div className="wvc-preview-title">APERÇU DE PRODUCTION · 9:16</div>
        <div className="wvc-preview-switch" aria-label="Choisir le mode de visionnage">
          <button type="button" className={previewMode==="shot"?"selected":""} onClick={()=>setPreviewMode("shot")}>
            <span aria-hidden="true">▶</span> Plan animé
          </button>
          <button type="button" className={previewMode==="film"?"selected":""} onClick={()=>{setFilmReview(null);setPreviewMode("film");}}>
            <span aria-hidden="true">▶</span> Film entier
          </button>
          <button type="button" className={previewMode==="source"?"selected":""} onClick={()=>setPreviewMode("source")}>
            Média original
          </button>
        </div>
        {previewMode==="source"&&active.template!=="document_focus"&&<button type="button" className="wvc-crop-toggle" onClick={()=>setCroppedPreview(x=>!x)}>
          {croppedPreview?"Afficher la source complète":"Visualiser le cadrage 9:16"}
        </button>}
        <div className="wvc-device">
          {previewMode==="shot" ? (
            previewCanRender ? <Suspense fallback={<div className="wvc-player-loading">Chargement du vrai moteur Remotion…</div>}>
              <RealCreativePreview props={previewProps} previewId={active.id} label={"Composition du "+active.id}/>
            </Suspense> : <div className="wvc-player-loading">{active.template==="geo_story"?"Valide le titre, le centre géographique et les éventuels points, trajets ou chiffres avant de prévisualiser.":"Ajoute un visuel et un titre conforme à ce plan avant de visionner sa véritable animation."}</div>
          ) : previewMode==="film" ? (
            fullFilmCanRender ? <Suspense fallback={<div className="wvc-player-loading">Préparation de la timeline Remotion complète…</div>}>
              <RealCreativePreview
                props={fullFilmProps}
                previewId="film-complet"
                initialFrame={filmReview?.frame??0}
                reviewRequestId={filmReview?.requestId??0}
                label={filmReview
                  ?"Révision ciblée du plan "+filmReview.shotId+" dans le film original, avec piste vocale et musique importées"
                  :"Visionnage du reportage intégral avec ses transitions et les pistes audio sélectionnées"}
              />
            </Suspense> : <div className="wvc-player-loading">Le film complet exige un script, des plans valides et leurs médias. Maximum 10 minutes dans ce profil.</div>
          ) : <>
          {active.template==="document_focus"&&activeAsset?.kind==="image"
            ? <div className="wvc-document-source" aria-label="Aperçu de l'intégralité du document avec région sélectionnée">
                <div className="wvc-document-page">
                  <img src={activeAsset.url} alt={"Document source, inchangé : "+activeAsset.name}/>
                  <div className="wvc-document-region" style={{
                    left:(active.documentX*100)+"%",top:(active.documentY*100)+"%",
                    width:(active.documentW*100)+"%",height:(active.documentH*100)+"%"
                  }} aria-label="Rectangle de mise au point défini par l'utilisateur"/>
                </div>
                <small>Zone choisie : contenu réel seulement</small>
              </div>
            :activeAsset?.kind==="image"&&<img src={activeAsset.url} alt={"Média source : "+activeAsset.name} style={{objectFit:croppedPreview?"cover":"contain",objectPosition:Math.round(active.focusX*100)+"% "+Math.round(active.focusY*100)+"%"}}/>}
          {activeAsset?.kind==="video"&&<video src={activeAsset.url} controls playsInline preload="metadata" style={{objectFit:croppedPreview?"cover":"contain",objectPosition:Math.round(active.focusX*100)+"% "+Math.round(active.focusY*100)+"%"}}/>}
          {!activeAsset&&<div className="wvc-no-preview"><span>WORLD—VISION</span><strong>TON MÉDIA<br/>ICI</strong><small>L'image d'actualité doit être fournie ou choisie explicitement.</small></div>}
          </>}
        </div>
        <p>{previewMode==="film"
          ? "Timeline Remotion réelle : plans, raccords, narration et musique importées. Ce n'est pas encore un export MP4 ; la lecture des codecs et la fluidité dépendent du téléphone. Vérifie toujours le master avant diffusion."
          : previewMode==="shot"
          ? "Même composition que le moteur de rendu, sur le plan seul. La narration et les raccords des autres plans ne sont pas inclus dans ce mode."
          : active.template==="document_focus"
          ? "Aperçu de la page originale et de la région choisie. Aucune citation n'est reconstituée ; la caméra et le titre apparaissent uniquement dans le vrai Player."
          : (croppedPreview?"Cadrage source 9:16 uniquement, sans titres ni animation.":"Fichier source complet, sans recadrage.")}</p>
        <label className="wvc-accent">ACCENT GRAPHIQUE <input type="color" value={accent} onChange={e=>setAccent(e.target.value)}/></label>
      </aside>
    </div>
  </section>;
}
