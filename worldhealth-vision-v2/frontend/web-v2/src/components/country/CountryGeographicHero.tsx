/**
 * WORLD-VISION GEO V4 — contextual country map, not a lonely silhouette.
 *
 * Accurate country and neighboring boundaries: embedded /countries.geojson.
 * Earth texture: self-hosted archival composite; low resolution at country
 * scale, only a visual base. It is explicitly NOT a current satellite image,
 * not a detailed administrative map, and not a source for province or road
 * boundaries. If imagery fails the geographic vector map still renders.
 *
 * Projection is a local equirectangular view, normalized for latitude,
 * with international antimeridian cases failing closed until wrapped
 * geometry is implemented. No fabricated local cities.
 */
import { useEffect, useMemo, useRef, useState } from "react";
import type { FeatureCollection, Feature, Geometry } from "geojson";
import type { CountrySummary } from "../../api/types";
import { WorldIcon } from "../ui/WorldIcon";

type MapStatus =
  | { kind: "loading" }
  | { kind: "missing" }
  | { kind: "ready"; feature: Feature; allFeatures: Feature[] };
type MapViewport = {
  centerLon: number;centerLat: number;pixelsPerDegree: number;longitudeFactor:number;
  worldLeft: number;worldTop: number;worldWidth: number;worldHeight: number;
  neighbors: string[]; selected: string[];
  selectedCenterX:number;selectedCenterY:number;
};
const WIDTH=900, HEIGHT=450, PAD=28;
function polygons(geometry:Geometry|null):number[][][][] {
  if(!geometry)return [];
  if(geometry.type==="Polygon")return [geometry.coordinates];
  if(geometry.type==="MultiPolygon")return geometry.coordinates;
  return [];
}
type Extent={west:number;east:number;south:number;north:number};
function extentOf(feature:Feature):Extent|null {
  const polys=polygons(feature.geometry);
  let west=Infinity,east=-Infinity,south=Infinity,north=-Infinity;
  let points=0;
  for(const p of polys)for(const ring of p)for(const point of ring){
    if(!Number.isFinite(point[0])||!Number.isFinite(point[1]))return null;
    west=Math.min(west,point[0]);east=Math.max(east,point[0]);
    south=Math.min(south,point[1]);north=Math.max(north,point[1]);points++;
  }
  return !points||east-west>180||east===west||north===south
    ?null:{west,east,south,north};
}
function geography(feature:Feature,all:Feature[],zoom:number):MapViewport|null {
  const extent=extentOf(feature);
  if(!extent)return null;
  const centerLon=(extent.west+extent.east)/2;
  const centerLat=(extent.south+extent.north)/2;
  const longitudeFactor=Math.max(.22,Math.cos(centerLat*Math.PI/180));
  const width=(extent.east-extent.west)*longitudeFactor;
  const height=extent.north-extent.south;
  const outerWidth=Math.max(6,width*2.55);
  const outerHeight=Math.max(5,height*2.0);
  const pixelsPerDegree=Math.min((WIDTH-PAD*2)/outerWidth,(HEIGHT-PAD*2)/outerHeight)*zoom;
  const at=(lon:number,lat:number):[number,number]=>
    [WIDTH/2+(lon-centerLon)*longitudeFactor*pixelsPerDegree,
     HEIGHT/2-(lat-centerLat)*pixelsPerDegree];
  const paths=(candidate:Feature)=>{
    const poly=polygons(candidate.geometry);
    return poly.map(p=>p.map(ring=>ring.map(([lon,lat],i)=>{
      const [x,y]=at(lon,lat);
      return `${i===0?"M":"L"}${x.toFixed(2)},${y.toFixed(2)}`;
    }).join(" ")+" Z").join(" "));
  };
  const rangeLon=(WIDTH/2/pixelsPerDegree)/longitudeFactor;
  const rangeLat=(HEIGHT/2/pixelsPerDegree);
  const neighbors=all.filter(candidate=>{
    const e=extentOf(candidate);
    if(!e)return false;
    return e.west<centerLon+rangeLon&&e.east>centerLon-rangeLon
      &&e.south<centerLat+rangeLat&&e.north>centerLat-rangeLat;
  }).flatMap(paths);
  const [selectedCenterX,selectedCenterY]=at(centerLon,centerLat);
  // One global 2:1 NASA composite, projected against exactly the same
  // local lon/lat transform as the vector borders.
  return {
    centerLon,centerLat,longitudeFactor,pixelsPerDegree,
    neighbors,selected:paths(feature),selectedCenterX,selectedCenterY,
    worldLeft:WIDTH/2+(-180-centerLon)*longitudeFactor*pixelsPerDegree,
    worldTop:HEIGHT/2-(90-centerLat)*pixelsPerDegree,
    worldWidth:360*longitudeFactor*pixelsPerDegree,
    worldHeight:180*pixelsPerDegree,
  };
}

function EarthCountryImage({viewport}: {viewport:MapViewport}){
  const ref=useRef<HTMLCanvasElement>(null);
  const [status,setStatus]=useState<"loading"|"ready"|"unavailable">("loading");
  useEffect(()=>{
    const canvas=ref.current,ctx=canvas?.getContext("2d");
    if(!canvas||!ctx)return;
    let live=true;
    const img=new Image();
    img.decoding="async";
    img.onload=()=>{
      if(!live)return;
      const {worldLeft,worldTop,worldWidth,worldHeight}=viewport;
      canvas.width=WIDTH;canvas.height=HEIGHT;
      const c=canvas.getContext("2d");
      if(!c)return;
      c.clearRect(0,0,WIDTH,HEIGHT);
      // Avoid allocating a ~100,000px image for small national windows.
      // Render only the image crop that contributes to this viewport.
      const imgLeft=(0-worldLeft)/worldWidth*img.naturalWidth;
      const imgTop=(0-worldTop)/worldHeight*img.naturalHeight;
      const imgW=WIDTH/worldWidth*img.naturalWidth;
      const imgH=HEIGHT/worldHeight*img.naturalHeight;
      const sx=Math.max(0,imgLeft),sy=Math.max(0,imgTop);
      const ex=Math.min(img.naturalWidth,imgLeft+imgW);
      const ey=Math.min(img.naturalHeight,imgTop+imgH);
      if(ex>sx&&ey>sy){
        const dx=(sx-imgLeft)/imgW*WIDTH,dy=(sy-imgTop)/imgH*HEIGHT;
        c.drawImage(img,sx,sy,ex-sx,ey-sy,dx,dy,
          (ex-sx)/imgW*WIDTH,(ey-sy)/imgH*HEIGHT);
      }
      setStatus("ready");
    };
    img.onerror=()=>{if(live)setStatus("unavailable");};
    img.src="/earth-atmos-2048.jpg";
    return()=>{live=false;img.onload=null;img.onerror=null;};
  },[viewport]);
  return <canvas ref={ref} className="wv4-country-texture" width={WIDTH} height={HEIGHT}
    data-image-state={status} aria-hidden="true"/>;
}

export default function CountryGeographicHero({
  iso3,country,language,onCompare,onNews,onFollow,followed,
}:{
  iso3:string;country:CountrySummary|null;language:"fr"|"en";
  onCompare:()=>void;onNews:()=>void;onFollow?:()=>void;followed?:boolean;
}){
  const fr=language==="fr";
  const [map,setMap]=useState<MapStatus>({kind:"loading"});
  const [zoom,setZoom]=useState(1);
  useEffect(()=>{
    const ac=new AbortController();
    fetch("/countries.geojson",{signal:ac.signal})
      .then(r=>{if(!r.ok)throw Error("GeoJSON unavailable");return r.json() as Promise<FeatureCollection>;})
      .then(data=>{
        if(ac.signal.aborted)return;
        if(data.type!=="FeatureCollection"||!Array.isArray(data.features)){
          setMap({kind:"missing"});return;
        }
        const feature=data.features.find(f=>f.properties?.["ISO3166-1-Alpha-3"]===iso3);
        setMap(feature?{kind:"ready",feature,allFeatures:data.features}:{kind:"missing"});
      })
      .catch(()=>{if(!ac.signal.aborted)setMap({kind:"missing"});});
    return()=>ac.abort();
  },[iso3]);
  const viewport=useMemo(()=>map.kind==="ready"?
    geography(map.feature,map.allFeatures,zoom):null,[map,zoom]);
  const display=country?.displayName??iso3;
  return <section className="wv3-geo-hero wv4-geo-hero" aria-label={fr
      ?`Territoire et identité de ${display}`:`Geography and identity of ${display}`}>
    <div className="wv3-country-map wv4-country-map" role="group" aria-label={fr
      ?`Carte contextuelle de ${display}`:`Context map of ${display}`}>
      <div className="wv3-map-topline wv4-map-topline">
        <span><span className="wv4-map-live-dot"/> {fr?"ATLAS / TERRITOIRE":"ATLAS / TERRITORY"}</span>
        <span>{iso3} · {fr?"FRONTIÈRES":"BORDERS"}</span>
      </div>
      {viewport?<div className="wv4-country-map-surface">
        <EarthCountryImage key={`${iso3}:${zoom}`} viewport={viewport}/>
        <svg className="wv3-country-geometry wv4-country-geometry"
          role="img" viewBox="0 0 900 450" aria-label={fr
          ?`Pays ${display} et territoires limitrophes, zoom ${zoom}`
          :`${display} and neighboring country borders, zoom ${zoom}`}>
          <defs>
            <filter id="wv4-country-glow" x="-70%" y="-70%" width="240%" height="240%">
              <feGaussianBlur stdDeviation="4.4"/>
            </filter>
            <linearGradient id="wv4-foreground" x1="0" y1="0" x2="1" y2="1">
              <stop stopColor="#00ffae" stopOpacity=".18"/>
              <stop offset="1" stopColor="#00caff" stopOpacity=".055"/>
            </linearGradient>
          </defs>
          <g className="wv4-country-border-neighbors">
            {viewport.neighbors.map((d,i)=><path key={i} d={d} fill="none"
              stroke="rgba(215,251,255,.47)" strokeWidth=".9" vectorEffect="non-scaling-stroke"/>)}
          </g>
          <g className="wv4-country-border-focus">
            {viewport.selected.map((d,i)=><path key={i} d={d}
              fill="url(#wv4-foreground)" fillRule="evenodd"
              stroke="#24f5d5" strokeWidth="2.8"
              vectorEffect="non-scaling-stroke"/>)}
          </g>
          <g className="wv4-country-border-glow" pointerEvents="none">
            {viewport.selected.map((d,i)=><path key={i} d={d}
              fill="none" stroke="#37effb" strokeOpacity=".6"
              filter="url(#wv4-country-glow)" strokeWidth="9"
              vectorEffect="non-scaling-stroke"/>)}
          </g>
          <circle cx={viewport.selectedCenterX} cy={viewport.selectedCenterY}
            r="4" fill="#efffff" stroke="#03bed1" strokeWidth="2" opacity=".75"/>
        </svg>
        <span className="wv4-country-map-name" aria-hidden="true">{display.toLocaleUpperCase(language)}</span>
        <span className="wv4-map-scanline" aria-hidden="true"/>
      </div>:<div className="wv3-map-unavailable" role="status">
        <WorldIcon name="map" size={34}/>
        <strong>{map.kind==="loading"?(fr?"Chargement du pays…":"Loading country…"):
          fr?"Carte non disponible":"Map unavailable"}</strong>
        <span>{fr?"Les données et services restent accessibles.":"Country data and services remain accessible."}</span>
      </div>}
      <div className="wv3-map-controls">
        <button type="button" aria-label={fr?"Agrandir la carte":"Zoom map in"}
          onClick={()=>setZoom(v=>Math.min(2.2,+(v+.25).toFixed(2)))} disabled={!viewport}>+</button>
        <button type="button" aria-label={fr?"Réduire la carte":"Zoom map out"}
          onClick={()=>setZoom(v=>Math.max(.75,+(v-.25).toFixed(2)))} disabled={!viewport}>−</button>
        <button type="button" aria-label={fr?"Recentrer":"Reset zoom"}
          onClick={()=>setZoom(1)} disabled={!viewport}><WorldIcon name="compass" size={17}/></button>
      </div>
      <p className="wv3-map-attribution wv4-map-attribution">
        {fr?"Contours GeoJSON · imagerie terrestre d’archive basse résolution"
          :"GeoJSON boundaries · low-resolution archival Earth imagery"}
      </p>
    </div>
    <div className="wv3-country-identity wv4-country-identity">
      <span className="wv3-eyebrow">{fr?"EXPLORER LE PAYS":"EXPLORE COUNTRY"} <span aria-hidden="true">/</span> {iso3}</span>
      <h2>{display}</h2>
      <p className="wv4-country-region">{country?.regionName??(fr?"Territoire à découvrir":"Explore this territory")}</p>
      <dl>
        {country?.capitalCity&&<div><dt>{fr?"Capitale":"Capital"}</dt><dd>{country.capitalCity}</dd></div>}
        {country?.currencyCode&&<div><dt>{fr?"Monnaie":"Currency"}</dt><dd>{country.currencyCode}</dd></div>}
      </dl>
      <div className="wv3-country-key-actions">
        <button type="button" onClick={onCompare}><WorldIcon name="scale" size={17}/>{fr?"Comparer":"Compare"}</button>
        <button type="button" onClick={onNews}><WorldIcon name="book" size={17}/>{fr?"Actualités":"News"}</button>
        {onFollow&&<button type="button" onClick={onFollow} aria-pressed={!!followed}>
          <WorldIcon name="star" size={17}/>{followed?(fr?"Pays suivi":"Following"):(fr?"Suivre":"Follow")}
        </button>}
      </div>
      <small>{fr?"Suivre enregistre le pays. Notifications d’actualité prévues dans Watch Vision."
        :"Following saves this country. News notifications are planned for Watch Vision."}</small>
    </div>
  </section>;
}
