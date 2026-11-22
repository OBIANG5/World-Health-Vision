import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import type { CountrySummary } from "../../api/types";
import { worldBankCatalogProvenance, type CountryCatalogSource } from "../../catalog/worldBankCountryCatalog";
import { VISION_PRODUCTS, type VisionId } from "../../product/visionProducts";
import { WorldIcon, type WorldIconName } from "../ui/WorldIcon";

type Language = "fr" | "en";

const discoveryIcons: Record<VisionId, WorldIconName> = {
  atlas: "globe", watch: "alert", money: "currency",
  transport: "travel", tourism: "compass", price: "markets",
  basket: "scale", trading: "markets", brvm: "markets",
  radar: "search", media: "book",
};

interface Props {
  language: Language;
  onToggleLanguage: () => void;
  countries: readonly CountrySummary[];
  loading: boolean;
  unavailable: boolean;
  catalogSource: CountryCatalogSource;
  onClose: () => void;
  onCountry: (iso3: string) => void;
  onVision: (id: VisionId) => void;
  onSources: () => void;
}

/** Local-only matching. No user search terms are stored, routed or transmitted. */
function normalize(value: string) {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLocaleLowerCase().trim();
}

export default function WorldDiscovery({
  language, onToggleLanguage, countries, loading, unavailable, catalogSource,
  onClose, onCountry, onVision, onSources,
}: Props) {
  const [query, setQuery] = useState("");
  const dialogRef = useRef<HTMLElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const matches = useMemo(() => {
    const term = normalize(query);
    const products = VISION_PRODUCTS.filter((product) => {
      if (!term) return true;
      return [
        product.name, product.tagline.fr, product.tagline.en,
        product.description.fr, product.description.en,
      ].some((part) => normalize(part).includes(term));
    });
    const countriesFound = term
      ? countries.filter((country) =>
          !country.aggregate && country.active
          && [country.displayName, country.iso2 ?? "", country.iso3,
            country.regionName ?? "", country.capitalCity ?? ""]
            .some((value) => normalize(value).includes(term)))
        .sort((left, right) => {
          // ISO3 exact must win over a capital substring: GAB = Gabon, not
          // Botswana/Gaborone. Never privilege a country for commercial reasons.
          const relevance = (country: CountrySummary) => {
            if (country.iso3.toLowerCase() === term) return 0;
            if (country.iso2?.toLowerCase() === term) return 1;
            if (normalize(country.displayName) === term) return 2;
            if (normalize(country.displayName).startsWith(term)) return 3;
            if (normalize(country.capitalCity ?? "").startsWith(term)) return 4;
            if (normalize(country.displayName).includes(term)) return 5;
            if (normalize(country.capitalCity ?? "").includes(term)) return 6;
            return 7;
          };
          return relevance(left) - relevance(right) || left.displayName.localeCompare(right.displayName, language);
        })
      : [];
    return {
      products,
      countries: countriesFound.slice(0, 18),
      countryTotal: countriesFound.length,
    };
  }, [query, countries, language]);

  useEffect(() => {
    const focusedBefore = document.activeElement instanceof HTMLElement
      ? document.activeElement : null;
    const overflowBefore = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    inputRef.current?.focus();

    function handleKeys(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.preventDefault();
        event.stopPropagation();
        onClose();
        return;
      }
      if (event.key !== "Tab" || !dialogRef.current) return;
      const controls = [...dialogRef.current.querySelectorAll<HTMLElement>(
        'input:not([disabled]),button:not([disabled]),a[href],[tabindex="0"]',
      )].filter((el) => el.getClientRects().length > 0);
      if (!controls.length) return;
      const first = controls[0];
      const last = controls[controls.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }

    document.addEventListener("keydown", handleKeys, true);
    return () => {
      document.removeEventListener("keydown", handleKeys, true);
      document.body.style.overflow = overflowBefore;
      focusedBefore?.focus();
    };
  }, [onClose]);

  return createPortal(
    <div className="world-discovery-backdrop" onMouseDown={(event) => {
      if (event.target === event.currentTarget) onClose();
    }}>
      <section className="world-discovery" role="dialog" aria-modal="true"
        aria-label={language === "fr" ? "Recherche dans World-Vision" : "Search World-Vision"}
        ref={dialogRef} tabIndex={-1}>
        <div className="world-discovery-header">
          <div>
            <span className="world-discovery-overline">WORLD-VISION · {language === "fr" ? "RECHERCHE" : "DISCOVERY"}</span>
            <h2>{language === "fr" ? "Que souhaitez-vous explorer ?" : "What would you like to explore?"}</h2>
            <p>{language === "fr"
              ? "Recherchez un pays ou découvrez les Visions. Les données réellement disponibles restent identifiées."
              : "Find a country or discover a Vision. Actual data availability is always made clear."}</p>
          </div>
          <div className="world-discovery-header-actions">
            <button type="button" className="world-discovery-language"
              onClick={onToggleLanguage}
              aria-label={language === "fr" ? "Switch World-Vision to English" : "Passer World-Vision en français"}>
              <WorldIcon name="globe" size={16}/> {language === "fr" ? "EN" : "FR"}
            </button>
            <button type="button" onClick={onClose} className="world-discovery-close"
              aria-label={language === "fr" ? "Fermer la recherche" : "Close search"}>
              <WorldIcon name="close" size={19}/>
            </button>
          </div>
        </div>

        <label className="world-discovery-input">
          <WorldIcon name="search" size={22}/>
          <span className="vision-visually-hidden">
            {language === "fr" ? "Pays, capitale, code ISO ou Vision" : "Country, capital, ISO code or Vision"}
          </span>
          <input ref={inputRef} type="search" autoComplete="off" spellCheck={false}
            value={query} onChange={(event) => setQuery(event.target.value)}
            placeholder={language === "fr"
              ? "Pays, capitale, code ISO, Vision…"
              : "Country, capital, ISO code, Vision…"} />
          <kbd>ESC</kbd>
        </label>

        <div className="world-discovery-content">
          {query.trim() && (
            <section className="world-discovery-group">
              <h3>{language === "fr" ? "Pays et territoires" : "Countries and territories"}</h3>
              {loading && <p className="world-discovery-hint">
                {language === "fr" ? "Chargement du catalogue…" : "Loading country catalog…"}
              </p>}
              {!loading && unavailable && (
                <p className="world-discovery-hint" role="status">
                  {language === "fr"
                    ? "Le catalogue des pays est indisponible. Aucun résultat national n'est inventé."
                    : "The country catalog is unavailable. No country results are fabricated."}
                </p>
              )}
              {!loading && matches.countryTotal === 0 && !unavailable && (
                <p className="world-discovery-hint">
                  {language === "fr" ? "Aucun pays correspondant dans le catalogue chargé." : "No matching country in the loaded catalog."}
                </p>
              )}
              <div className="world-discovery-results">
                {matches.countries.map((country) => (
                  <button type="button" className="world-discovery-result" key={country.iso3}
                    onClick={() => onCountry(country.iso3)}>
                    <span className="world-discovery-result-icon"><WorldIcon name="globe" size={18}/></span>
                    <span><strong>{country.displayName}</strong>
                      <small>{[country.iso3, country.capitalCity, country.regionName].filter(Boolean).join(" · ")}</small>
                    </span>
                    <WorldIcon name="arrow" size={16}/>
                  </button>
                ))}
              </div>
              {matches.countryTotal > matches.countries.length && (
                <p className="world-discovery-hint">
                  {language === "fr" ? "Affichage des 18 premiers résultats : précisez votre recherche." : "Showing first 18 results: refine your search."}
                </p>
              )}
            </section>
          )}

          <section className="world-discovery-group">
            <h3>{language === "fr" ? "Les Visions" : "World-Vision products"}</h3>
            {!matches.products.length && (
              <p className="world-discovery-hint">
                {language === "fr" ? "Aucune Vision ne correspond à cette recherche." : "No Vision matches this search."}
              </p>
            )}
            <div className="world-discovery-results">
              {matches.products.map((product) => (
                <button type="button" className="world-discovery-result" key={product.id}
                  onClick={() => onVision(product.id)}>
                  <span className="world-discovery-result-icon"><WorldIcon name={discoveryIcons[product.id]} size={18}/></span>
                  <span><strong>{product.name}</strong>
                    <small>{product.tagline[language]} · {product.stage === "planned"
                      ? (language === "fr" ? "prévu" : "planned")
                      : product.stage === "partial"
                        ? (language === "fr" ? "partiellement disponible" : "partially available")
                        : (language === "fr" ? "explorable, couverture variable" : "explorable, varying coverage")}</small>
                  </span>
                  <WorldIcon name="arrow" size={16}/>
                </button>
              ))}
            </div>
          </section>

          <section className="world-discovery-group">
            <h3>{language === "fr" ? "Sources et fiabilité" : "Sources and trust"}</h3>
            <button type="button" className="world-discovery-result" onClick={onSources}>
              <span className="world-discovery-result-icon"><WorldIcon name="book" size={18}/></span>
              <span>
                <strong>{language === "fr" ? "Méthodologie et sources" : "Source methodology"}</strong>
                <small>{language === "fr"
                  ? "Références et limites du catalogue, pas une garantie d'ingestion."
                  : "Catalog references and caveats, not proof of ingestion."}</small>
              </span>
              <WorldIcon name="arrow" size={16}/>
            </button>
          </section>
        </div>
        {catalogSource === "WORLD_BANK_SNAPSHOT" && <p className="whv-discovery-snapshot-attribution">
          {language === "fr"
            ? "Répertoire de secours : économies et territoires classés par la Banque mondiale, non les séries officielles World-Vision."
            : "Fallback directory: World Bank-classified economies and territories, not World-Vision's authorized indicator data."}
          {" · "}{worldBankCatalogProvenance.asOfUtc.slice(0, 10)}
          {" · "}<a href={worldBankCatalogProvenance.sourceUrl}
            target="_blank" rel="noopener noreferrer">
            {language === "fr" ? "Source" : "Source"}
          </a>
          {" · "}<a href={worldBankCatalogProvenance.termsUrl}
            target="_blank" rel="noopener noreferrer">{language === "fr" ? "Licence" : "License"}</a>
        </p>}
        <footer className="world-discovery-footer">
          <WorldIcon name="shield" size={15}/>
          {language === "fr"
            ? "Recherche locale : les mots saisis ne sont ni enregistrés dans l'adresse ni envoyés à un moteur distant."
            : "Local search: your query is not saved in the URL or sent to a remote search engine."}
        </footer>
      </section>
    </div>,
    document.body,
  );
}
