import {useEffect,useState} from "react";
import "./BrandEvidence.css";

type LocalLogo={name:string;bytes:number;url:string;sha256:string};
const ISSUE_URL="https://github.com/OBIANG5/World-Health-Vision/issues/8";
const SOURCE_URL="https://github.com/OBIANG5/World-Health-Vision/blob/feature/world-vision-media-studio/frontend/web/src/assets/logo.png";
const pretty=(bytes:number)=>`${(bytes/1024).toFixed(0)} Ko`;

export default function BrandEvidence(){
  const [logo,setLogo]=useState<LocalLogo|null>(null);
  const [error,setError]=useState("");
  useEffect(()=>()=>{if(logo?.url)URL.revokeObjectURL(logo.url)},[logo?.url]);
  const handleFile=async(file:File|null)=>{
    setError("");
    if(!file)return;
    if(!["image/png","image/jpeg","image/webp","image/svg+xml"].includes(file.type)){
      setError("Format non pris en charge : PNG, JPG, WebP ou SVG uniquement.");return;
    }
    if(file.size>12*1024*1024){
      setError("Ce logo dépasse 12 Mo : utilise une image plus légère sans modifier les couleurs.");return;
    }
    try{
      const digest=await crypto.subtle.digest("SHA-256",await file.arrayBuffer());
      const sha256=Array.from(new Uint8Array(digest)).map(n=>n.toString(16).padStart(2,"0")).join("");
      setLogo({name:file.name,bytes:file.size,url:URL.createObjectURL(file),sha256});
    }catch{
      setError("Ce navigateur ne permet pas l'analyse du fichier. Envoie directement l'image dans ChatGPT.");
    }
  };
  return <section className="wv-brand-gate" aria-label="Preuves du vrai logo World-Vision">
    <div className="wv-brand-gate-intro">
      <span>ÉTAPE ARTISTIQUE BLOQUANTE · DESIGN SYSTEM</span>
      <h3>Le bon logo, avant le moindre montage.</h3>
      <p>Le 12 novembre, une version <strong>multicolore</strong> de l'œil-globe d'origine
        a été retenue. Je ne possède pas encore le fichier exact de cette version.
        L'ancien logo bleu ci-dessous est une archive, <strong>pas une proposition de remplacement</strong>.</p>
    </div>
    <div className="wv-brand-compare">
      <div className="wv-brand-example old">
        <div className="wv-brand-example-head">
          <span>01 · RÉFÉRENCE HISTORIQUE</span><b>NON APPROUVÉE</b>
        </div>
        <div className="wv-brand-example-canvas">
          <img src="./brand-archive/legacy-eye-globe-blue.png"
            alt="Ancien logo World Health Vision bleu, œil et globe, conservé comme référence historique non approuvée"/>
        </div>
        <p>Forme œil + globe d'origine. Ce fichier est monochrome bleu : ce n'est pas la version finale multicolore.</p>
        <a href={SOURCE_URL} target="_blank" rel="noreferrer">Voir le fichier source dans GitHub ↗</a>
      </div>
      <div className="wv-brand-example approved">
        <div className="wv-brand-example-head">
          <span>02 · LOGO MULTICOLORE OFFICIEL</span><b>FICHIER MANQUANT</b>
        </div>
        <div className="wv-brand-example-canvas">
          {logo?
          <img src={logo.url} alt="Logo sélectionné localement par l'utilisateur pour comparer à l'archive"/>:
          <div className="wv-brand-file-empty">
            <strong>Importer l'image originale</strong>
            <p>Aucun faux logo généré ici. Sélectionne le véritable fichier que tu avais validé.</p>
          </div>}
        </div>
        <label className="wv-brand-file-picker" htmlFor="wv-brand-official-file">
          Choisir le logo sur mon téléphone
        </label>
        <input id="wv-brand-official-file" type="file" accept=".png,.jpg,.jpeg,.webp,.svg,image/*"
          onChange={e=>void handleFile(e.target.files?.[0]||null)}/>
        {logo&&<div className="wv-brand-file-record">
          <strong>{logo.name} · {pretty(logo.bytes)}</strong>
          <code>SHA-256 : {logo.sha256}</code>
        </div>}
        {error&&<p className="wv-brand-file-error" role="alert">{error}</p>}
        <p className="wv-brand-local-warning">Aperçu uniquement sur ton appareil :
          <strong> le fichier n'est ni enregistré sur GitHub, ni envoyé à ChatGPT.</strong></p>
      </div>
    </div>
    <div className="wv-brand-followup">
      <div><strong>Comment nous faisons valider la véritable identité</strong>
        <p>Une fois le fichier officiel retrouvé, joins-le directement à notre conversation
          ou à la tâche GitHub #8. Je pourrai le versionner sans modifier son dessin,
          préparer la planche de charte et te demander une note avant toute animation.</p></div>
      <a href={ISSUE_URL} target="_blank" rel="noreferrer">Tâche identité et qualité #8 ↗</a>
    </div>
  </section>;
}
