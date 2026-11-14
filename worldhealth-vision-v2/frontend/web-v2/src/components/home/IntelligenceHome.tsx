import type { CountrySummary } from "../../api/types";
import EyeMapFrame from "../layout/EyeMapFrame";
import { WorldIcon, type WorldIconName } from "../ui/WorldIcon";

/**
 * World-Vision · Global Intelligence
 *
 * Editorial home, not a second data engine.
 * Every entry point opens an existing V2 product surface; values never
 * masquerade as live market quotes or production ingestion statistics.
 */
type Props = {
  lang: string;
  countries: CountrySummary[];
  selectedCountry: CountrySummary | null;
  selectedCountryIso3: string;
  drawerOpen: boolean;
  isPreview: boolean;
  isOffline: boolean;
  onCountryClick: (iso3: string) => void;
  onExploreCountries: () => void;
  onExploreRegions: () => void;
  onExploreMarkets: () => void;
  onExploreTravel: () => void;
  onExploreSafety: () => void;
  onExploreAll: () => void;
  onExploreSources: () => void;
  onOpenSelected: () => void;
  onExploreCurrencies: () => void;
  onExploreAdvisor: () => void;
  onExploreFavorites: () => void;
};

type Feature = {
  number: string;
  name: string;
  nameEn: string;
  detail: string;
  detailEn: string;
  icon: WorldIconName;
  onClick: () => void;
};

export default function IntelligenceHome(props: Props) {
  const fr = props.lang === "fr";
  const selected = props.selectedCountry;
  const catalogSize = props.countries.length;
  const features: Feature[] = [
    { number: "01", name: "Pays & territoires", nameEn: "Countries & territories",
      detail: "Géographie, fiches pays, régions et données sourcées.",
      detailEn: "Geography, country profiles, regions and sourced data.",
      icon: "globe", onClick: props.onExploreCountries },
    { number: "02", name: "Économie & monnaies", nameEn: "Economy & currencies",
      detail: "Indicateurs, pouvoir d'achat, devises et comparaisons.",
      detailEn: "Indicators, purchasing power, currencies and comparisons.",
      icon: "markets", onClick: props.onExploreMarkets },
    { number: "03", name: "Voyager & vivre", nameEn: "Travel & living",
      detail: "Destinations, installation, immobilier et mobilité.",
      detailEn: "Destinations, relocation, real estate and mobility.",
      icon: "compass", onClick: props.onExploreTravel },
    { number: "04", name: "Sécurité & contexte", nameEn: "Safety & context",
      detail: "Comprendre les risques avec leurs sources et leurs limites.",
      detailEn: "Understand risks, with sources and methodological limits.",
      icon: "shield", onClick: props.onExploreSafety },
  ];

  return (
    <div className="wv-intelligence-home">
      <div className="wv-intelligence-topline" role="note">
        <div className="wv-topline-left">
          <span className="wv-topline-index">WV / INTELLIGENCE MONDIALE</span>
          <span className="wv-topline-divider" aria-hidden="true" />
          <span>{fr ? "Un atlas pour comprendre, comparer et décider" : "An atlas to understand, compare and decide"}</span>
        </div>
        <span className="wv-topline-status">
          <span className="wv-status-dot" aria-hidden="true" />
          {props.isPreview ? (fr ? "VERSION D’APERÇU" : "PREVIEW VERSION") :
            props.isOffline ? (fr ? "DONNÉES INDISPONIBLES" : "DATA UNAVAILABLE") :
            (fr ? "CATALOGUE V2" : "V2 CATALOG")}
        </span>
      </div>

      <div className="wv-lead-grid">
        <section className="wv-lead-copy" aria-labelledby="wv-lead-title">
          <span className="wv-eyebrow"><span className="wv-eyebrow-rule" />
            {fr ? "LE MONDE, EXPLIQUÉ PAR LES DONNÉES" : "THE WORLD, EXPLAINED BY DATA"}
          </span>
          <h2 id="wv-lead-title">{fr
            ? <>Le monde change.<br /><span>Comprenez pourquoi.</span></>
            : <>The world changes.<br /><span>Understand why.</span></>}</h2>
          <p className="wv-lead-description">
            {fr
              ? "Explorez les pays, leurs réalités économiques et sociales, les territoires et les sources qui permettent de les comprendre. Une lecture du monde plus claire, plus profonde et plus vérifiable."
              : "Explore countries, their economic and social realities, territories and the evidence behind them. A clearer, deeper and more verifiable view of the world."}
          </p>
          <div className="wv-lead-actions">
            <button type="button" className="wv-primary-cta" onClick={props.onExploreCountries}>
              <WorldIcon name="search" size={18} />
              {fr ? "Rechercher un pays" : "Find a country"}
              <WorldIcon name="arrow" size={16} />
            </button>
            <button type="button" className="wv-text-cta" onClick={props.onExploreRegions}>
              {fr ? "Explorer les régions" : "Explore regions"}
              <WorldIcon name="arrow" size={17} />
            </button>
          </div>
          <div className="wv-lead-proof">
            <div className="wv-proof-count">
              <strong>{catalogSize > 0 ? catalogSize.toLocaleString(fr ? "fr-FR" : "en-US") : "—"}</strong>
              <span>{fr ? "pays et territoires dans le catalogue chargé" : "countries and territories in the loaded catalog"}</span>
            </div>
            <div className="wv-proof-count">
              <strong>22</strong>
              <span>{fr ? "sources institutionnelles recensées en V2" : "institutional sources registered in V2"}</span>
            </div>
          </div>
          <p className="wv-catalog-caveat">
            <WorldIcon name="info" size={15} />
            {fr
              ? "Un organisme référencé n’est pas forcément une source connectée ou actualisée."
              : "A registered institution is not necessarily connected or updated."}
          </p>
        </section>

        <section className="wv-globe-panel" aria-label={fr ? "Explorer la Terre" : "Explore Earth"}>
          <div className="wv-globe-panel-head">
            <span><span className="wv-live-line" /> {fr ? "ATLAS INTERACTIF" : "INTERACTIVE ATLAS"}</span>
            <span className="wv-globe-coordinate">AFRICA · 12°E / 8°N</span>
          </div>
          <div className="wv-globe-viewport">
            <EyeMapFrame
              drawerOpen={props.drawerOpen}
              countries={props.countries}
              selectedCountryIso3={props.selectedCountryIso3}
              onCountryClick={props.onCountryClick}
            />
          </div>
          <div className="wv-globe-panel-footer">
            <div><WorldIcon name="globe" size={18} />
              <span>{fr ? "Glissez pour explorer · touchez un pays" : "Drag to explore · select a country"}</span>
            </div>
            <button type="button" onClick={props.onExploreCountries}>
              {fr ? "Liste des pays" : "Country list"} <WorldIcon name="arrow" size={16} />
            </button>
          </div>
        </section>
      </div>

      <section className="wv-desk-section" aria-labelledby="wv-explore-title">
        <div className="wv-section-heading">
          <div>
            <span className="wv-section-overline">{fr ? "ESPACES D’EXPLORATION" : "EXPLORE THE PLATFORM"} / 01</span>
            <h3 id="wv-explore-title">{fr ? "Explorez le monde sous tous ses angles." : "Explore the world from every angle."}</h3>
          </div>
          <button type="button" className="wv-section-link" onClick={props.onExploreAll}>
            {fr ? "Tous les outils" : "All tools"} <WorldIcon name="arrow" size={17} />
          </button>
        </div>
        <div className="wv-feature-grid">
          {features.map((feature) => (
            <button type="button" className="wv-feature-card" key={feature.number} onClick={feature.onClick}>
              <div className="wv-feature-top">
                <span className="wv-feature-icon"><WorldIcon name={feature.icon} size={23} /></span>
                <span className="wv-feature-number">{feature.number} / 04</span>
              </div>
              <strong>{fr ? feature.name : feature.nameEn}</strong>
              <span className="wv-feature-description">{fr ? feature.detail : feature.detailEn}</span>
              <span className="wv-feature-arrow"><WorldIcon name="arrow" size={18} /></span>
            </button>
          ))}
        </div>
      </section>

      <section className="wv-bottom-grid" aria-label={fr ? "Accès directs et méthode" : "Shortcuts and methodology"}>
        <div className="wv-selected-country">
          <span className="wv-section-overline">{fr ? "EXPLORATION DIRECTE" : "QUICK EXPLORATION"} / 02</span>
          <div className="wv-selected-grid">
            <div className="wv-selected-main">
              <span className="wv-selected-label">{fr ? "PAYS SÉLECTIONNÉ" : "SELECTED COUNTRY"}</span>
              <h3>{selected?.displayName ?? (fr ? "Choisissez un pays" : "Choose a country")}</h3>
              <p>{[selected?.capitalCity, selected?.regionName].filter(Boolean).join(" · ")
                || (fr ? "Retrouvez les indicateurs et les sources disponibles." : "Explore available indicators and sources.")}</p>
              <button type="button" onClick={props.onOpenSelected}>
                {fr ? "Ouvrir la fiche pays" : "Open country profile"} <WorldIcon name="arrow" size={17}/>
              </button>
            </div>
            <div className="wv-quick-links">
              <button type="button" onClick={props.onExploreCurrencies}><WorldIcon name="currency" size={19} />{fr ? "Devises" : "Currencies"}<WorldIcon name="arrow" size={14}/></button>
              <button type="button" onClick={props.onExploreAdvisor}><WorldIcon name="advisor" size={19} />{fr ? "Conseiller" : "Advisor"}<WorldIcon name="arrow" size={14}/></button>
              <button type="button" onClick={props.onExploreFavorites}><WorldIcon name="star" size={19} />{fr ? "Favoris" : "Favorites"}<WorldIcon name="arrow" size={14}/></button>
            </div>
          </div>
        </div>
        <div className="wv-source-card">
          <span className="wv-section-overline">{fr ? "LA PREUVE AVANT L’INTERPRÉTATION" : "EVIDENCE BEFORE INTERPRETATION"} / 03</span>
          <WorldIcon name="book" size={26} className="wv-source-symbol"/>
          <h3>{fr ? "Savoir d’où viennent les chiffres." : "Know where the numbers come from."}</h3>
          <p>{fr
            ? "Chaque chiffre doit être accompagné de sa source, de son année et de ses limites. Comparez les publications nationales et internationales sans masquer leurs divergences."
            : "Every figure should carry its source, reference year and limitations. Compare local and international publications without hiding disagreements."}</p>
          <button type="button" onClick={props.onExploreSources}>
            {fr ? "Consulter les sources et la méthode" : "Explore sources and methodology"}
            <WorldIcon name="arrow" size={17}/>
          </button>
        </div>
      </section>

      <footer className="wv-home-footer">
        <span>WORLD HEALTH VISION <span aria-hidden="true">/</span> {fr ? "Voir le monde, le comprendre." : "See the world, understand it."}</span>
        <span>{fr ? "Cartographie interactive · Données avec provenance · V2" : "Interactive cartography · Evidence-led data · V2"}</span>
      </footer>
    </div>
  );
}
