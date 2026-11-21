/**
 * COUNTRY-LIVE U1: a country is a living editorial entry point, not a raw
 * SQL/GDELT dashboard. Images are individually reviewed, NOT generated and
 * NEVER guessed from arbitrary ISO codes. This limited registry is intentional.
 *
 * The Gabon case is a HISTORICAL, HUMAN-RESEARCHED source dossier shared with
 * GlobalRadarEditorialPilot. It is NOT the country's daily news feed.
 */
import { useState } from "react";
import {
  EDITORIAL_GABON_IMF_CASE,
  validateEditorialSourceCase,
} from "../../radar/editorialSourceCase";

type Locale = "fr" | "en";
type CountryPhoto = {
  imageUrl: string;
  attributionUrl: string;
  author: string;
  license: "CC BY-SA 4.0";
  place: { fr: string; en: string };
  alt: { fr: string; en: string };
};

/**
 * Curated Commons photos. All THREE original file pages explicitly list
 * the contributor and CC BY-SA 4.0. CSS object-fit is only a display crop.
 * For a high-traffic product: serve a reviewable, optimized, self-hosted copy
 * with immutable digest and identical attribution; do not bulk hotlink Commons.
 */
const REVIEWED_COUNTRY_PHOTOS: Readonly<Partial<Record<string, CountryPhoto>>> = {
  GAB: {
    imageUrl: "https://commons.wikimedia.org/wiki/Special:FilePath/Libreville_bord_de_mer.jpg?width=1280",
    attributionUrl: "https://commons.wikimedia.org/wiki/File:Libreville_bord_de_mer.jpg",
    author: "Shirmy25",
    license: "CC BY-SA 4.0",
    place: { fr: "Libreville, boulevard de l’Indépendance", en: "Libreville, Independence Boulevard" },
    alt: { fr: "Vue aérienne du front de mer de Libreville au Gabon", en: "Aerial view of Libreville's seafront in Gabon" },
  },
  FRA: {
    imageUrl: "https://commons.wikimedia.org/wiki/Special:FilePath/Paris_skyline.jpg?width=1280",
    attributionUrl: "https://commons.wikimedia.org/wiki/File:Paris_skyline.jpg",
    author: "Jose Huwaidi",
    license: "CC BY-SA 4.0",
    place: { fr: "Paris, vue sur les toits", en: "Paris rooftops" },
    alt: { fr: "Panorama des toits de Paris et de la tour Eiffel en France", en: "Paris rooftops with the Eiffel Tower in France" },
  },
  CIV: {
    imageUrl: "https://commons.wikimedia.org/wiki/Special:FilePath/Abidjan_vue_sur_la_ville.JPG?width=1280",
    attributionUrl: "https://commons.wikimedia.org/wiki/File:Abidjan_vue_sur_la_ville.JPG",
    author: "Axe",
    license: "CC BY-SA 4.0",
    place: { fr: "Abidjan, vue sur la ville", en: "Abidjan city view" },
    alt: { fr: "Vue urbaine d'Abidjan en Côte d'Ivoire", en: "City view of Abidjan in Côte d'Ivoire" },
  },
};

// These names and flags are immutable geographical labels, NOT a substitute
// for country Catalog values. They keep the three reviewed editorial pilots
// intelligible when the backend is intentionally offline in Preview.
const OFFLINE_PILOT_LABELS: Readonly<Record<string, {
  name: { fr: string; en: string };
  flag: string;
}>> = {
  GAB: { name: { fr: "Gabon", en: "Gabon" }, flag: "🇬🇦" },
  FRA: { name: { fr: "France", en: "France" }, flag: "🇫🇷" },
  CIV: { name: { fr: "Côte d’Ivoire", en: "Côte d’Ivoire" }, flag: "🇨🇮" },
};

function bilingual(locale: Locale, fr: string, en: string) {
  return locale === "fr" ? fr : en;
}

export default function CountryEditorialStory({
  iso3, name, flag, subtitle, capital, currencyCode, locale, open,
}: {
  iso3: string;
  name: string;
  flag: string;
  subtitle: string;
  capital: string | null | undefined;
  currencyCode: string | null | undefined;
  locale: Locale;
  open: boolean;
}) {
  const fallback = OFFLINE_PILOT_LABELS[iso3];
  const headingName = name === iso3 ? fallback?.name[locale] ?? name : name;
  const headingFlag = flag === "—" ? fallback?.flag ?? "🌍" : flag;
  const photo = REVIEWED_COUNTRY_PHOTOS[iso3];
  const [imageFailed, setImageFailed] = useState(false);
  const hasPhoto = !!photo && !imageFailed;
  const caseFile = iso3 === "GAB" && validateEditorialSourceCase(EDITORIAL_GABON_IMF_CASE)
    ? EDITORIAL_GABON_IMF_CASE : null;
  return (
    <>
      <section className="whv-country-story" aria-labelledby="whv-country-story-heading">
        <figure className={hasPhoto ? "whv-country-story-visual has-photo" : "whv-country-story-visual"}>
          {hasPhoto && open && <img
            className="whv-country-story-photo" src={photo.imageUrl}
            alt={photo.alt[locale]} decoding="async" loading="lazy"
            referrerPolicy="no-referrer"
            onError={() => setImageFailed(true)}
          />}
          <div className="whv-country-story-identity">
            <span className="whv-country-story-eyebrow">
              {bilingual(locale, "ATLAS · FICHE PAYS", "ATLAS · COUNTRY PROFILE")}
              <span className="whv-country-story-iso">{iso3}</span>
            </span>
            <div className="whv-country-story-titleline">
              <span className="whv-country-story-flag" aria-hidden="true">{headingFlag}</span>
              <h2 id="whv-country-story-heading">{headingName}</h2>
            </div>
            {subtitle && <p className="whv-country-story-region">{subtitle}</p>}
            {(capital || currencyCode) && <div className="whv-country-story-facts">
              {capital && <span>{bilingual(locale, "Capitale", "Capital")} <strong>{capital}</strong></span>}
              {currencyCode && <span>{bilingual(locale, "Devise", "Currency")} <strong>{currencyCode}</strong></span>}
            </div>}
          </div>
          {!photo && <span className="whv-country-story-no-photo">
            {bilingual(locale, "Photo du pays en cours de vérification", "Country photograph pending review")}
          </span>}
          {photo && imageFailed && <span className="whv-country-story-no-photo">
            {bilingual(locale, "Photographie indisponible pour le moment", "Country photograph currently unavailable")}
          </span>}
        </figure>
        {hasPhoto && <p className="whv-country-story-credit">
          {bilingual(locale, "Photo", "Photo")}: <a href={photo.attributionUrl}
            target="_blank" rel="noopener noreferrer">{photo.author}</a>
          <span aria-hidden="true"> · </span><a
            href="https://creativecommons.org/licenses/by-sa/4.0/" target="_blank"
            rel="noopener noreferrer">{photo.license}</a>
          <span aria-hidden="true"> · </span>{photo.place[locale]}
          <span className="whv-country-story-crop"> · {bilingual(locale, "recadrage d'affichage", "display crop")}</span>
        </p>}
      </section>
      <section className="whv-country-now" aria-labelledby="whv-country-now-title">
        <div className="whv-country-now-heading">
          <div>
            <span className="whv-country-now-kicker">
              {bilingual(locale, "COMPRENDRE CE PAYS", "UNDERSTAND THIS COUNTRY")}
            </span>
            <h3 id="whv-country-now-title">
              {bilingual(locale, "Ce qui se passe", "What's happening")}
            </h3>
          </div>
          <span className="whv-country-now-state">
            {caseFile
              ? bilingual(locale, "Dossier daté", "Dated dossier")
              : bilingual(locale, "Flux non connecté", "Feed not connected")}
          </span>
        </div>
        {caseFile ? (
          <article className="whv-country-now-feature">
            <div className="whv-country-now-byline">
              <span>{bilingual(locale, "ENQUÊTE DE SOURCES", "SOURCE RESEARCH")}</span>
              <time dateTime={caseFile.asOfDay}>{caseFile.asOfDay}</time>
            </div>
            <h4>{caseFile.question[locale]}</h4>
            <p className="whv-country-now-intro">{caseFile.context[locale]}</p>
            <p className="whv-country-now-conclusion">{caseFile.editorialConclusion[locale]}</p>
            <div className="whv-country-now-sources" aria-label={bilingual(
              locale, "Consulter les publications originales", "Read original publications"
            )}>
              {caseFile.links.map(link => <a key={link.id} href={link.originalUrl}
                target="_blank" rel="noopener noreferrer" title={link.outlet}>
                <span>{link.outlet.split(" — ")[0]}</span>
                <small>{link.publishedDay}</small>
                <span aria-hidden="true">↗</span>
              </a>)}
            </div>
            <a className="whv-country-now-deep-link" href="?wv=radar">
              {bilingual(locale, "Explorer les questions et comparer les sources",
                "Explore the questions and compare sources")}
              <span aria-hidden="true">→</span>
            </a>
            <p className="whv-country-now-caution">
              {bilingual(locale,
                "Ce dossier historique ne constitue pas un fil d'actualité en direct. Les originaux complets, les corrections et l'indépendance éditoriale restent à examiner.",
                "This historical dossier is not a live news feed. Full original texts, corrections and editorial independence still require review.")}
            </p>
          </article>
        ) : (
          <div className="whv-country-now-unavailable" role="status">
            <strong>{bilingual(locale,
              "Les actualités de ce pays ne sont pas encore disponibles ici.",
              "This country's news is not available here yet.")}</strong>
            <p>{bilingual(locale,
              "Nous préparons un fil daté par pays, avec les sources locales et internationales. Une absence de couverture ne veut pas dire qu'il ne s'est rien passé.",
              "We are preparing a dated, country-specific feed with local and international sources. Missing coverage does not mean nothing happened.")}</p>
            <a href="?wv=radar">
              {bilingual(locale, "Accéder à la recherche mondiale (expérimentale)",
                "Explore global search (experimental)")} →
            </a>
          </div>
        )}
      </section>
    </>
  );
}
