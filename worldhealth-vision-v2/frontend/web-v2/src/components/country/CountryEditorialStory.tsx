/**
 * COUNTRY-LIVE U1: a country is a living editorial entry point, not a raw
 * SQL/GDELT dashboard. Images are individually reviewed, NOT generated and
 * NEVER guessed from arbitrary ISO codes. This limited registry is intentional.
 *
 * The Gabon case is a HISTORICAL, HUMAN-RESEARCHED source dossier shared with
 * GlobalRadarEditorialPilot. It is NOT the country's daily news feed.
 */
import { useState } from "react";


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
    imageUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/6/6c/Libreville_bord_de_mer.jpg/1280px-Libreville_bord_de_mer.jpg",
    attributionUrl: "https://commons.wikimedia.org/wiki/File:Libreville_bord_de_mer.jpg",
    author: "Shirmy25",
    license: "CC BY-SA 4.0",
    place: { fr: "Libreville, boulevard de l’Indépendance", en: "Libreville, Independence Boulevard" },
    alt: { fr: "Vue aérienne du front de mer de Libreville au Gabon", en: "Aerial view of Libreville's seafront in Gabon" },
  },
  FRA: {
    imageUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/8/83/Paris_skyline.jpg/1280px-Paris_skyline.jpg",
    attributionUrl: "https://commons.wikimedia.org/wiki/File:Paris_skyline.jpg",
    author: "Jose Huwaidi",
    license: "CC BY-SA 4.0",
    place: { fr: "Paris, vue sur les toits", en: "Paris rooftops" },
    alt: { fr: "Panorama des toits de Paris et de la tour Eiffel en France", en: "Paris rooftops with the Eiffel Tower in France" },
  },
  CIV: {
    imageUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/c/c4/Abidjan_vue_sur_la_ville.JPG/1280px-Abidjan_vue_sur_la_ville.JPG",
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

const PILOT_REGIONS: Readonly<Record<string, { fr: string; en: string }>> = {
  GAB: { fr: "Afrique centrale", en: "Central Africa" },
  FRA: { fr: "Europe occidentale", en: "Western Europe" },
  CIV: { fr: "Afrique de l’Ouest", en: "West Africa" },
};
const WORLD_BANK_REGIONS_FR: Readonly<Record<string, string>> = {
  "Sub-Saharan Africa": "Afrique subsaharienne",
  "Europe & Central Asia": "Europe et Asie centrale",
  "Europe and Central Asia": "Europe et Asie centrale",
  "East Asia & Pacific": "Asie de l’Est et Pacifique",
  "South Asia": "Asie du Sud",
  "Middle East & North Africa": "Moyen-Orient et Afrique du Nord",
  "Latin America & Caribbean": "Amérique latine et Caraïbes",
  "North America": "Amérique du Nord",
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
  const rawRegion = subtitle.split(" • ")[0];
  const regionLabel = PILOT_REGIONS[iso3]?.[locale] ??
    (locale === "fr" ? WORLD_BANK_REGIONS_FR[rawRegion] ?? rawRegion : rawRegion);
  const photo = REVIEWED_COUNTRY_PHOTOS[iso3];
  const [imageFailed, setImageFailed] = useState(false);
  const hasPhoto = !!photo && !imageFailed;

  return (
    <>
      <section className="whv-country-story" aria-labelledby="whv-country-story-heading">
        <figure className={hasPhoto ? "whv-country-story-visual has-photo" : "whv-country-story-visual"}>
          {hasPhoto && open && <img
            className="whv-country-story-photo" src={photo.imageUrl}
            alt={photo.alt[locale]} decoding="async" loading="eager" fetchPriority="high"
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
            {regionLabel && <p className="whv-country-story-region">{regionLabel}</p>}
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
    </>
  );
}
