import "./BrandEvidence.css";

const LOGO="./brand/world-vision-official.png";
const SOURCE="https://github.com/OBIANG5/World-Health-Vision/blob/feature/world-vision-media-studio/frontend/web/src/assets/logo.png";
const APPROVAL="https://github.com/OBIANG5/World-Health-Vision/blob/feature/world-vision-media-studio/worldhealth-vision-v2/docs/media/approvals/2026-11-13-current-official-logo.json";

export default function BrandEvidence(){
  return <section className="wv-brand-gate" aria-label="Logo World-Vision officiel actuel">
    <div className="wv-brand-gate-intro">
      <span>ÉTAPE 00 · IDENTITÉ WORLD-VISION</span>
      <h3>Le logo est confirmé. Nous pouvons avancer.</h3>
      <p>Tu as désigné <strong>ce logo œil-globe bleu comme logo officiel actuel</strong>.
        Nous utilisons exactement son fichier original, sans réinterpréter ses proportions ni ses couleurs.
        Les futurs ajouts de vert et d'autres couleurs sont reportés.</p>
    </div>
    <div className="wv-brand-compare">
      <article className="wv-brand-example old">
        <div className="wv-brand-example-head">
          <span>01 · ORIGINAL APPROUVÉ</span><b className="wv-brand-ok">VALIDÉ</b>
        </div>
        <div className="wv-brand-example-canvas">
          <img src={LOGO} alt="Véritable logo officiel actuel de World-Vision : œil bleu et globe au centre"/>
        </div>
        <p>Fichier binaire d'origine, sans retouche : <code>logo.png</code>.
          Copié à l'identique dans le Media Studio et le moteur Remotion.</p>
        <a href={SOURCE} target="_blank" rel="noreferrer">Consulter le fichier d'origine sur GitHub ↗</a>
      </article>
      <article className="wv-brand-example approved">
        <div className="wv-brand-example-head">
          <span>02 · UTILISATION À L'ÉCRAN</span><b className="wv-brand-ok">PROPOSITION</b>
        </div>
        <div className="wv-brand-example-canvas wv-brand-application">
          <div className="wv-brand-display-lockup">
            <img src={LOGO} alt="Logo officiel sur fond clair préservant ses pixels"/>
            <strong>WORLD–VISION</strong>
            <small>Voir le monde, le comprendre.</small>
          </div>
        </div>
        <p>Exemple d'agencement : texte, taille et emplacement restent ajustables.
          Le logo lui-même est déjà approuvé, pas cette composition.</p>
        <a href={APPROVAL} target="_blank" rel="noreferrer">Voir la décision officielle enregistrée ↗</a>
      </article>
    </div>
    <div className="wv-brand-followup">
      <div><strong>À venir, sans bloquer la production</strong>
        <p>Plus tard, nous pourrons tester des continents verts et une palette multicolore
          avec un aperçu séparé et ton accord préalable. Pour l'instant, le chantier
          suivant est la direction artistique de la vidéo, pas une nouvelle recherche de logo.</p>
      </div>
      <span className="wv-brand-done">LOGO OFFICIEL ACTUEL · CONFIRMÉ</span>
    </div>
  </section>;
}
