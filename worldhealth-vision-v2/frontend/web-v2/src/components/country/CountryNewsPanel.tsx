/**
 * News is one COUNTRY PROFILE RUBRIC, never a lead hero or proof of live feeds.
 * Existing, human-researched documentary cases remain explicitly historical;
 * no syndicated articles are mirrored and no automatic verification is claimed.
 */
import { useState } from "react";
import { EDITORIAL_GABON_IMF_CASE, validateEditorialSourceCase } from "../../radar/editorialSourceCase";

type Locale = "fr" | "en";
const copy = (locale: Locale, fr: string, en: string) => locale === "fr" ? fr : en;

export default function CountryNewsPanel({ iso3, locale }: { iso3: string; locale: Locale }) {
  const [expanded, setExpanded] = useState(false);
  const article = iso3 === "GAB" && validateEditorialSourceCase(EDITORIAL_GABON_IMF_CASE)
    ? EDITORIAL_GABON_IMF_CASE : null;
  return <section className="whv-country-news" aria-labelledby="whv-country-news-title">
    <div className="whv-country-section-heading">
      <div>
        <span className="whv-country-section-kicker">
          {copy(locale, "UNE RUBRIQUE DE LA FICHE PAYS", "ONE SECTION OF THE COUNTRY PROFILE")}
        </span>
        <h3 id="whv-country-news-title">{copy(locale, "Actualités et dossiers", "News and dossiers")}</h3>
        <p>{copy(locale,
          "Actualités récentes, chronologies et perspectives seront classées ici lorsqu'un flux vérifiable sera disponible. Aucun flux en direct n'est connecté.",
          "Recent news, timelines and viewpoints will appear here when verifiable feeds are connected. No live news feed is connected.")}</p>
      </div>
    </div>
    {article ? (
      <article className="whv-country-news-article">
        <div className="whv-country-news-metadata">
          <span>{copy(locale, "DOSSIER DOCUMENTAIRE HISTORIQUE", "HISTORICAL DOCUMENTARY CASE")}</span>
          <time dateTime={article.asOfDay}>{article.asOfDay}</time>
        </div>
        <h4>{article.question[locale]}</h4>
        <p>{copy(locale,
          "Trois publications datées permettent d'explorer différentes étapes des discussions avec le FMI. Ce dossier ne représente ni les dernières nouvelles du pays, ni un événement vérifié indépendamment.",
          "Three dated publications provide perspectives on different stages of IMF talks. This is neither the country's latest news nor independently verified reporting.")}</p>
        <button type="button" className="whv-country-news-expand"
          aria-expanded={expanded}
          onClick={() => setExpanded(value => !value)}>
          {expanded ? copy(locale, "Refermer le dossier", "Close dossier")
            : copy(locale, "Lire le contexte et consulter les sources", "Read context and original sources")}
          <span aria-hidden="true">{expanded ? "−" : "+"}</span>
        </button>
        {expanded && <div className="whv-country-news-details">
          <p>{article.context[locale]}</p>
          <p className="whv-country-news-analysis">{article.editorialConclusion[locale]}</p>
          <div className="whv-country-news-source-list">
            {article.links.map(link => <a key={link.id} href={link.originalUrl}
              rel="noopener noreferrer" target="_blank">
              <strong>{link.outlet}</strong>
              <time dateTime={link.publishedDay}>{link.publishedDay}</time>
              <span aria-hidden="true">↗</span>
            </a>)}
          </div>
          <a className="whv-country-news-research-link" href="?wv=radar">
            {copy(locale, "Voir l'analyse documentaire approfondie", "Open detailed source research")}
            <span aria-hidden="true">→</span>
          </a>
          <p className="whv-country-news-disclaimer">
            {copy(locale,
              "Les originaux complets, les corrections et l'indépendance des publications ne sont pas encore vérifiés. Aucune affirmation n'est automatiquement certifiée par World-Vision.",
              "Full original texts, corrections and editorial independence remain to be reviewed. World-Vision has not automatically verified the claims.")}
          </p>
        </div>}
      </article>
    ) : (
      <div className="whv-country-news-empty" role="status">
        <strong>{copy(locale, "Aucun fil d'actualité vérifiable n'est encore connecté pour ce pays.",
          "No verifiable news feed has been connected for this country yet.")}</strong>
        <p>{copy(locale,
          "Cela ne signifie pas qu'il ne se passe rien ici. L'actualité doit être acquise, datée et attribuée aux sources originales avant d'apparaître dans la fiche.",
          "This does not mean nothing is happening. Stories must have verifiable dates and original attribution before appearing on the profile.")}</p>
        <a href="?wv=radar">{copy(locale,
          "Ouvrir la recherche mondiale expérimentale", "Open experimental global search")} →</a>
      </div>
    )}
  </section>;
}
