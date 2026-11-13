import {useState} from "react";
import "./CreativeDirections.css";

/** Real editorial source, not a claim that this 2017 archival photograph
 * depicts the 2026 COP31 conference. Explicit source and credit stay visible. */
const archivePhoto="https://media.defense.gov/2017/Aug/27/2002037959/-1/-1/0/170827-A-ZW944-005A.JPG";
const photoSource="https://www.war.gov/Multimedia/Photos/igphoto/2002037959/";
const logo="./brand/world-vision-official.png";

export type DirectionId="terrain"|"chiffres"|"pedagogie";
export const DIRECTIONS:ReadonlyArray<{
 id:DirectionId;number:string;name:string;subtitle:string;approach:string;
}>=[
 {id:"terrain",number:"A",name:"Le terrain d'abord",
  subtitle:"Impact humain et photographie documentaire",
  approach:"L'ouverture montre le problème humain avec une vraie photo d'archives correctement identifiée, puis revient à l'annonce de l'ONU."},
 {id:"chiffres",number:"B",name:"L'information par les chiffres",
  subtitle:"Très lisible, clair et rythmé",
  approach:"Le chiffre central sert d'accroche. On distingue explicitement l'objectif financier des sommes déjà débloquées."},
 {id:"pedagogie",number:"C",name:"Comprendre le mécanisme",
  subtitle:"Explication visuelle simple",
  approach:"Le spectateur comprend la chaîne concrète : une alerte précoce, des fonds pré-arrangés, puis une intervention avant la crise."},
];

function Wordmark(){
  return <div className="wv-direction-lockup">
    <img src={logo} alt="Logo officiel de World-Vision, œil bleu et Terre"/>
    <strong>WORLD–VISION</strong>
  </div>;
}
function IllustrationPhoto(){
  const [failed,setFailed]=useState(false);
  return <div className="wv-direction-photo">
    {!failed&&<img loading="lazy" src={archivePhoto}
      onError={()=>setFailed(true)}
      alt="Photographie authentique de militaires transportant une embarcation de secours dans une rue inondée à Houston en 2017"/>}
    {failed&&<div className="wv-direction-photo-error">
      Photo d'archives indisponible sur cet appareil. Consulter le document source ci-dessous.
    </div>}
  </div>;
}
function CommonFooter(){
  return <div className="wv-direction-foot">COP31 · ANTALYA · 12 NOV. 2026 <span>SOURCES : UNICEF · FAO</span></div>;
}
function DirectionVisual({id}:{id:DirectionId}){
  if(id==="terrain")return <div className="wv-direction-canvas wv-direction-terrain">
    <IllustrationPhoto/>
    <div className="wv-direction-photo-shade"/>
    <header><Wordmark/><span className="wv-direction-stamp">LE MONDE EN CLAIR</span></header>
    <div className="wv-direction-terrain-text">
      <span className="wv-direction-kicker">CLIMAT · COP31</span>
      <h3>ET SI L'AIDE<br/>ARRIVAIT<br/><em>AVANT ?</em></h3>
      <p>L'ONU lance une plateforme pour anticiper les catastrophes.</p>
    </div>
    <div className="wv-direction-archive-label">IMAGE D'ARCHIVES · HOUSTON, 2017 · U.S. ARMY</div>
    <CommonFooter/>
  </div>;
  if(id==="chiffres")return <div className="wv-direction-canvas wv-direction-chiffres">
    <header><Wordmark/><span>CLIMAT / FINANCEMENT</span></header>
    <div className="wv-direction-number-content">
      <div className="wv-direction-num-kicker">À LA COP31, L'ONU VISE…</div>
      <div className="wv-direction-numeral"><span>+</span>3</div>
      <h3>MILLIARDS<br/><em>DE DOLLARS</em></h3>
      <div className="wv-direction-number-rule"/>
      <p>Pour anticiper les crises climatiques.</p>
      <div className="wv-direction-count-panel"><strong>75 M</strong>
        <span>PERSONNES À PROTÉGER<br/>D'ICI 2030</span>
      </div>
      <p className="wv-direction-fact-note">OBJECTIF ANNONCÉ · PAS DES FONDS DÉJÀ VERSÉS</p>
    </div>
    <CommonFooter/>
  </div>;
  return <div className="wv-direction-canvas wv-direction-pedagogie">
    <header><Wordmark/><span>WORLD-VISION EXPLIQUE</span></header>
    <div className="wv-direction-pedag-body">
      <span className="wv-direction-kicker">COP31 · LE DÉCRYPTAGE</span>
      <h3>AGIR <em>AVANT</em><br/>LA CATASTROPHE</h3>
      <p>Comment l'ONU veut financer une réponse plus rapide.</p>
      <div className="wv-direction-flow-step">
        <div><b>01</b><span>UNE ALERTE<br/><strong>Le risque est identifié.</strong></span></div>
        <span className="wv-direction-flow-link" aria-hidden="true">↓</span>
        <div><b>02</b><span>DES FONDS PRÉVUS<br/><strong>Les moyens sont préparés.</strong></span></div>
        <span className="wv-direction-flow-link" aria-hidden="true">↓</span>
        <div><b>03</b><span>UNE ACTION PLUS TÔT<br/><strong>On agit avant le choc.</strong></span></div>
      </div>
    </div>
    <div className="wv-direction-lower-note">PLATEFORME ANNONCÉE · RÉSULTATS À CONFIRMER</div>
    <CommonFooter/>
  </div>;
}

export default function CreativeDirections({
 selected,onSelect,
}:{
 selected:DirectionId;
 onSelect:(id:DirectionId)=>void;
}){
  return <section className="wv-direction-board" aria-label="Trois propositions de direction artistique">
    <div className="wv-direction-intro">
      <span>ÉTAPE ARTISTIQUE 01 · PAS ENCORE VALIDÉE</span>
      <h3>Trois ouvertures possibles. Une seule direction à retenir.</h3>
      <p>Ce sont de <strong>véritables compositions 9:16</strong> à juger avant la réalisation d'un clip animé.
        Elles utilisent ton logo original, des chiffres vérifiés et une image d'archives
        clairement identifiée, jamais présentée comme une photographie de la COP31.</p>
    </div>
    <div className="wv-direction-grid">
      {DIRECTIONS.map(item=><article key={item.id}
        className={`wv-direction-item ${selected===item.id?"chosen":""}`} data-direction={item.id}>
        <div className="wv-direction-item-head">
          <span>PROPOSITION {item.number}</span>
          <strong>{item.name}</strong>
          <small>{item.subtitle}</small>
        </div>
        <DirectionVisual id={item.id}/>
        <p>{item.approach}</p>
        <button type="button" aria-pressed={selected===item.id}
          className={selected===item.id?"chosen":""}
          onClick={()=>onSelect(item.id)}>
          {selected===item.id?"✓ Direction sélectionnée — à noter":"Sélectionner pour évaluer"}
        </button>
      </article>)}
    </div>
    <div className="wv-direction-method">
      <strong>Vraies sources et droits d'utilisation</strong>
      <p>Informations : communiqué officiel UNICEF/FAO du 12 novembre 2026.
        Image de la proposition A : photographie U.S. Army (Houston, ouragan Harvey, 27 août 2017),
        œuvre d'un agent du gouvernement fédéral des États-Unis dans le cadre de ses fonctions.
        C'est une illustration du risque de catastrophe, pas une image de l'annonce COP31.
        Aucune image de synthèse n'est présentée comme reportage réel.</p>
      <div className="wv-direction-source-links">
        <a href="https://www.unicef.org/press-releases/un-launches-disaster-risk-financing-platform-cop31-make-humanitarian-responses"
          target="_blank" rel="noreferrer">Communiqué UNICEF ↗</a>
        <a href="https://www.fao.org/newsroom/detail/un-launches-disaster-risk-financing-platform-at-cop31-to-make-humanitarian-responses-faster-and-more-predictable/en"
          target="_blank" rel="noreferrer">Communiqué FAO ↗</a>
        <a href={photoSource} target="_blank" rel="noreferrer">Photo U.S. Army 2017 ↗</a>
      </div>
      <p><strong>Important :</strong> le choix d'une direction n'autorise aucune animation, aucune voix, aucun
        nouveau MP4 ni publication. Il sert seulement à préparer une version artistique cohérente.</p>
    </div>
  </section>;
}
