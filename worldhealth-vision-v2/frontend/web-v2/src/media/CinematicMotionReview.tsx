/**
 * A real, audited MP4 player for World-Vision's first D01 geographic motion.
 * Never auto-publish, never autoplay. The technical footage is not a news video.
 */
import {useEffect,useState} from "react";
import "./CinematicMotionReview.css";

const CLIP="./media-lab/wv-d01-gab-technical-4s.mp4";
const REPORT="./media-lab/wv-d01-gab-technical-4s.json";

type MotionReport={
  schema_version?:string;
  status?:string;
  target_iso3?:string;
  fps?:number;
  duration_seconds?:number;
  width?:number;
  height?:number;
  video_sha256?:string;
  image_sha256?:string;
  publication_authorized?:boolean;
  art_direction_approved?:boolean;
};

export default function CinematicMotionReview(){
  const [report,setReport]=useState<MotionReport|null>(null);
  const [state,setState]=useState<"loading"|"available"|"absent"|"error">("loading");
  useEffect(()=>{
    const controller=new AbortController();
    void (async()=>{
      try{
        const response=await fetch(REPORT,{signal:controller.signal,cache:"no-store"});
        if(!response.ok){if(!controller.signal.aborted)setState("absent");return;}
        const value=await response.json() as MotionReport;
        if(value.schema_version!=="wv-cinematic-d01-technical-motion-v1" ||
          value.target_iso3!=="GAB" || value.publication_authorized!==false ||
          value.art_direction_approved!==false || !/^[a-f0-9]{64}$/.test(value.video_sha256||"")){
          if(!controller.signal.aborted)setState("error");
          return;
        }
        if(!controller.signal.aborted){setReport(value);setState("available");}
      }catch{
        if(!controller.signal.aborted)setState("absent");
      }
    })();
    return ()=>controller.abort();
  },[]);

  return <section className="wv-motion-review" id="wv-d01-motion-review"
    aria-label="D01 - vidéo CGI de rotation géographique pour examen">
    <div className="wv-motion-review-heading">
      <span>D01 · ANIMATION GÉOGRAPHIQUE</span>
      <h4>La Terre tourne vers le Gabon.</h4>
      <p>Un essai réel du mouvement entre le globe d’ouverture et le pays concerné, calculé par notre moteur géographique, rendu image par image et encodé en MP4. Aucun faux reportage, aucune voix artificielle imposée.</p>
    </div>
    {state==="available"&&report?
      <div className="wv-motion-review-player">
        <video controls playsInline preload="metadata" src={CLIP}
          aria-label="Quatre secondes de rotation du globe World-Vision vers le Gabon"
          onError={()=>setState("error")}>
          Ton navigateur ne permet pas de lire cette vidéo MP4.
        </video>
        <div className="wv-motion-review-technical">
          <strong>VRAI CLIP CGI · RELECTURE UNIQUEMENT</strong>
          <span>{report.duration_seconds?.toFixed(1)} s · {report.width}×{report.height} · {report.fps} images/s · {report.target_iso3}</span>
          <a href={CLIP} download="world-vision-gabon-cgi-technique-4s.mp4">Ouvrir le MP4 de démonstration</a>
          <a href={REPORT} target="_blank" rel="noreferrer">Provenance et empreinte SHA-256</a>
        </div>
      </div>:
      <p className="wv-motion-review-pending" role="status">
        {state==="loading"?"Recherche du MP4 technique vérifié…":
          state==="absent"?"Le film d’essai n’est pas encore présent dans l’archive publiée. Le globe interactif reste disponible ; aucun clip n’est présenté comme terminé.":
          "Le MP4 ou son manifeste n'a pas passé les vérifications du lecteur. Ne pas le diffuser."}
      </p>}
    <p className="wv-motion-review-caution"><strong>Étape de validation humaine :</strong> cet essai ne valide pas la direction D00-v6, la mise en scène, les animations futures, la voix ou le montage. Aucun réseau social n’est connecté à ce lecteur.</p>
  </section>;
}
