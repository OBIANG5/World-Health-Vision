/**
 * World-Vision — geographic motion engineering laboratory.
 *
 * This is a controlled, interactive 2.5D prototype: valid geographic targeting
 * from existing V2 borders, not the approved cinematic 3D master D00 nor a
 * rendered video. It never changes editorial states or publishes content.
 */
import {useCallback,useEffect,useMemo,useRef,useState} from "react";
import {loadCountries} from "./GeoGlobe";
import CinematicEarth from "./CinematicEarth";
import type {MediaStory} from "./types";
import {
  START_POSE,GEO_TARGETING_VERSION,interpolateGlobe,listCountryTargets,targetForStory,
} from "./geoTargeting.mjs";
import type {CountryTarget} from "./geoTargeting.mjs";
import "./GeoTargetingLab.css";

const ANIMATION_MS=4000;
const FRAME_INTERVAL_MS=65;

export default function GeoTargetingLab({story}:{story?:MediaStory|null}) {
  const [countries,setCountries]=useState<CountryTarget[]>([]);
  const [loading,setLoading]=useState(true);
  const [error,setError]=useState("");
  const [countryCode,setCountryCode]=useState("");
  const [progress,setProgress]=useState(0);
  const [playing,setPlaying]=useState(false);
  const [reducedMotion,setReducedMotion]=useState(false);
  const raf=useRef<number|null>(null);
  const lastFrame=useRef(0);
  const startedAt=useRef(0);

  useEffect(()=>{
    let alive=true;
    void loadCountries().then(data=>{
      if(!alive)return;
      const all=listCountryTargets(data);
      if(!all.length)throw new Error("Aucun pays ISO3 utilisable dans la géographie V2");
      setCountries(all);
      setLoading(false);
    }).catch(caught=>{
      if(!alive)return;
      setError(caught instanceof Error?caught.message:"Carte indisponible");
      setLoading(false);
    });
    return ()=>{alive=false};
  },[]);

  useEffect(()=>{
    const query=window.matchMedia?.("(prefers-reduced-motion: reduce)");
    if(!query)return;
    const change=()=>setReducedMotion(query.matches);
    change();query.addEventListener?.("change",change);
    return ()=>query.removeEventListener?.("change",change);
  },[]);

  const storyCountry=useMemo(()=>targetForStory(story,countries),[story,countries]);
  const chosen=useMemo(()=>countries.find(x=>x.iso3===countryCode)||null,[countries,countryCode]);

  const stop=useCallback(()=>{
    if(raf.current!==null){cancelAnimationFrame(raf.current);raf.current=null;}
    setPlaying(false);
  },[]);
  useEffect(()=>stop,[story?.id,stop]); // new editorial story must not inherit a previous motion
  useEffect(()=>()=>{if(raf.current!==null)cancelAnimationFrame(raf.current);},[]);

  useEffect(()=>{
    if(!countries.length)return;
    // A real newsroom country is the default only when a valid ISO3 is present.
    // The operator may always choose another country as a labelled demo.
    setCountryCode(storyCountry?.iso3||"");
    setProgress(0);
  },[story?.id,storyCountry?.iso3,countries]);

  const target=chosen?{lon:chosen.lon,lat:chosen.lat}:null;
  const orientation=target?interpolateGlobe(START_POSE,target,progress):START_POSE;
  const pose={
    centerLon:orientation.lon,centerLat:orientation.lat,
    radiusRatio:.466,
    theme:"space" as const,
    preciseBorders:progress>=.96,
    target:progress>=.965&&target?[target.lon,target.lat] as [number,number]:undefined,
    highlightCountryIso3:progress>=.96?chosen?.iso3:undefined,
  };

  const play=()=>{
    if(!chosen||playing)return;
    stop();
    setProgress(0);
    setPlaying(true);
    startedAt.current=0;
    lastFrame.current=0;
    const tick=(now:number)=>{
      if(!startedAt.current)startedAt.current=now;
      const next=Math.min(1,(now-startedAt.current)/ANIMATION_MS);
      if(now-lastFrame.current>=FRAME_INTERVAL_MS||next===1){
        lastFrame.current=now;
        setProgress(next);
      }
      if(next<1){raf.current=requestAnimationFrame(tick);}
      else{raf.current=null;setPlaying(false);}
    };
    raf.current=requestAnimationFrame(tick);
  };

  const changeCountry=(code:string)=>{
    stop();setCountryCode(code);setProgress(0);
  };
  const scrub=(value:number)=>{
    stop();setProgress(Math.min(1,Math.max(0,value)));
  };
  const reset=()=>{
    stop();setProgress(0);
  };

  return <section className="wv-geotarget" id="wv-geotarget" aria-label="Laboratoire de rotation géographique World-Vision">
    <div className="wv-geotarget-head">
      <span>INGÉNIERIE GÉOGRAPHIQUE · PROTOTYPE TECHNIQUE</span>
      <h3>Une actualité. Un pays. La Terre s’oriente.</h3>
      <p>Le logiciel charge les frontières du projet World-Vision, identifie le pays depuis son code ISO3, puis calcule une trajectoire sphérique jusqu’à la destination. Ici tu peux tester le mouvement avant son adaptation au globe cinématographique.</p>
      <p className="wv-geotarget-disclaimer"><strong>Ce qui est réel :</strong> texture NASA, calcul sphérique GPU, frontières GeoJSON et rotation géographique. <strong>Encore à valider :</strong> fidélité au concept D00-v6, caméra cinéma, vidéo encodée, voix et montage. Ce laboratoire ne valide aucun plan automatiquement.</p>
    </div>
    <div className="wv-geotarget-layout">
      <div className="wv-geotarget-visual">
        <div className="wv-geotarget-planet">
          <CinematicEarth pose={pose} alt={chosen?`Terre texturée NASA orientable vers ${chosen.name}, ${chosen.iso3}`:"Terre texturée NASA : globe neutre"}/>
          <div className="wv-geotarget-caption" aria-hidden="true">
            <small>WORLD–VISION · GÉOLOCALISATION</small>
            <strong>{chosen?(progress>.96?chosen.name.toUpperCase():"TERRE → DESTINATION"):"TERRE ENTIÈRE"}</strong>
            <span>{chosen?chosen.iso3:"AUCUN PAYS IMPOSÉ"} · {Math.round(progress*100)} %</span>
          </div>
        </div>
        <p>Simulation GPU WebGL texturée NASA + frontières géographiques ; ce n’est pas encore un MP4 ni une validation finale de D00.</p>
      </div>
      <div className="wv-geotarget-controls">
        <div className="wv-geotarget-evidence">
          <span>SOURCE DE LA DESTINATION</span>
          <strong>{storyCountry?"Pays du dossier éditorial":"Exemple choisi manuellement"}</strong>
          <p>{storyCountry?`Dossier : ${story?.title||"actualité"} — ${storyCountry.name} (${storyCountry.iso3})`:
            "Aucune destination éditoriale ISO3 exploitable : choisis un pays pour tester le moteur. Aucune localisation n’est inventée."}</p>
        </div>
        <label htmlFor="wv-geotarget-country">Pays vers lequel orienter la Terre</label>
        <select id="wv-geotarget-country" data-testid="wv-geotarget-country" value={countryCode}
          disabled={loading||Boolean(error)} onChange={e=>changeCountry(e.target.value)}>
          <option value="">{loading?"Chargement des pays…":"Choisir un pays de démonstration"}</option>
          {countries.map(c=><option key={c.iso3} value={c.iso3}>{c.name} · {c.iso3}</option>)}
        </select>
        {error&&<p role="alert" className="wv-geotarget-error">Géographie indisponible : {error}. Aucun pays artificiel n'est substitué.</p>}
        <div className="wv-geotarget-metrics">
          <div><small>ORIGINE</small><b>{START_POSE.lat}° / {START_POSE.lon}°</b></div>
          <div><small>DESTINATION APPROX.</small><b>{chosen?`${chosen.lat.toFixed(1)}° / ${chosen.lon.toFixed(1)}°`:"—"}</b></div>
        </div>
        <p className="wv-geotarget-hint">Le point affiché correspond à un centre représentatif de la géométrie nationale, <strong>pas à la ville où s'est produit l'événement</strong>. Une actualité réelle exigera une latitude/longitude vérifiée.</p>
        <div className="wv-geotarget-buttons">
          <button type="button" onClick={play} disabled={!chosen||playing||Boolean(error)}>
            {playing?"Rotation en cours…":"Voir la rotation vers le pays"}
          </button>
          <button type="button" onClick={reset} disabled={!chosen||(!playing&&progress===0)}>Recommencer</button>
        </div>
        <label htmlFor="wv-geotarget-scrub">Explorer le mouvement image par image · {Math.round(progress*100)} %</label>
        <input id="wv-geotarget-scrub" type="range" min="0" max="1000" step="1"
          value={Math.round(progress*1000)} onChange={e=>scrub(Number(e.target.value)/1000)}
          disabled={!chosen} aria-label="Position de la rotation du globe"/>
        <div className="wv-geotarget-footer">
          <small>{countries.length} pays/territoires ISO3 · source : GeoJSON V2</small>
          <small>{GEO_TARGETING_VERSION} · 4 s de démonstration</small>
        </div>
        {reducedMotion&&<p className="wv-geotarget-accessibility">Réduction du mouvement activée sur ton appareil. Le globe ne démarre jamais seul ; le curseur permet de comparer les positions sans animation.</p>}
      </div>
    </div>
  </section>;
}
