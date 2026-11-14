/**
 * Internal deterministic capture surface for D01 motion review.
 * Not a publishing endpoint. Frame is controlled synchronously by the
 * authorized Playwright render runner through same-origin postMessage.
 *
 * Render engine (CinematicEarth) and geographic engine (geoTargeting)
 * are EXACTLY the same modules as the mobile Media Studio.
 */
import {useEffect,useMemo,useState} from "react";
import CinematicEarth from "./CinematicEarth";
import {loadCountries} from "./GeoGlobe";
import {START_POSE,interpolateGlobe,listCountryTargets} from "./geoTargeting.mjs";
import type {CountryTarget} from "./geoTargeting.mjs";

const NUMBER=(v:unknown)=>typeof v==="number"&&Number.isFinite(v)?Math.max(0,Math.min(1,v)):0;
export default function CinematicCapture(){
  const query=new URLSearchParams(window.location.search);
  const code=(query.get("iso3")||"GAB").toUpperCase();
  const [countries,setCountries]=useState<CountryTarget[]>([]);
  const [error,setError]=useState("");
  const [frame,setFrame]=useState(0);
  useEffect(()=>{
    let active=true;
    void loadCountries().then(data=>{
      if(active)setCountries(listCountryTargets(data));
    }).catch(()=>{if(active)setError("COUNTRY_GEOJSON_UNAVAILABLE");});
    return ()=>{active=false};
  },[]);
  useEffect(()=>{
    const handler=(ev:MessageEvent)=>{
      if(ev.source!==window||ev.origin!==location.origin)return;
      const data=ev.data as {type?:string;progress?:number};
      if(data?.type!=="WV_CINEMATIC_FRAME_V1")return;
      setFrame(NUMBER(data.progress));
    };
    window.addEventListener("message",handler);
    return ()=>window.removeEventListener("message",handler);
  },[]);
  const country=useMemo(()=>countries.find(c=>c.iso3===code),[countries,code]);
  const pose=country?interpolateGlobe(START_POSE,{lon:country.lon,lat:country.lat},frame):START_POSE;
  return <div className="wv-cinema-capture" id="wv-cinema-capture"
    data-frame={frame.toFixed(6)} data-target-valid={Boolean(country)}
    data-target-iso3={country?.iso3||""} data-capture-error={error||""}>
    <CinematicEarth pose={{
      centerLon:pose.lon,centerLat:pose.lat,preciseBorders:true,
      highlightCountryIso3:frame>=.96?country?.iso3:undefined,
      radiusRatio:.466,
    }} alt={country?`Technical CGI motion capture toward ${country.name}`:"Technical CGI motion capture unavailable"}/>
  </div>;
}
