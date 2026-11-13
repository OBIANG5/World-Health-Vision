// WorldHealthVision V2 — App
// Composant racine : carte + navigation header + fiche pays + fiche région.

import { lazy, Suspense, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import type { CountrySummary } from "./api/types";
import EyeLayout from "./components/layout/EyeLayout";
import EyeMapFrame from "./components/layout/EyeMapFrame";
import {WorldIcon} from "./components/ui/WorldIcon";
import { LanguageProvider, useLang, useToggleLang } from "./context/LanguageContext";
import { UserProfileProvider, useUserProfile } from "./context/UserProfileContext";
import { useCountryCatalog } from "./hooks/useCountryCatalog";
import { useWatchlist } from "./hooks/useWatchlist";
import { t } from "./i18n/labels";

// Chargement à la demande (code-splitting) : ces composants ne sont pas affichés
// au démarrage. On les charge quand ils s'ouvrent → bundle initial plus léger et
// carte affichée plus vite (Recharts/jsPDF ne sont plus dans le bundle de départ).
const CountryDrawer = lazy(() => import("./components/country/CountryDrawer"));
const RegionDrawer = lazy(() => import("./components/region/RegionDrawer"));
const SourceMethodologyModal = lazy(() => import("./components/layout/SourceMethodologyModal"));
const WatchlistPanel = lazy(() => import("./components/layout/WatchlistPanel"));
const TravelPanel = lazy(() => import("./components/layout/TravelPanel"));
const UserProfilePanel = lazy(() => import("./components/layout/UserProfilePanel"));
const PurchasingPowerPanel = lazy(() => import("./components/layout/PurchasingPowerPanel"));
const DestinationScorePanel = lazy(() => import("./components/layout/DestinationScorePanel"));
const RetirementPanel = lazy(() => import("./components/layout/RetirementPanel"));
const RealEstatePanel = lazy(() => import("./components/layout/RealEstatePanel"));
const AlertsPanel = lazy(() => import("./components/layout/AlertsPanel"));
const AdvisorPanel = lazy(() => import("./components/layout/AdvisorPanel"));
const CurrencyPanel = lazy(() => import("./components/layout/CurrencyPanel"));

import "./styles/mobile.css";
import "./styles/world-editorial.css";
import "./styles/world-electric.css";

// ---------- Sélecteur de pays (popover) ----------

function CountrySelectorPopover({
  countries,
  loading,
  selectedIso3,
  watchedIso3s,
  onSelect,
  anchor,
}: {
  countries: CountrySummary[];
  loading: boolean;
  selectedIso3: string;
  watchedIso3s: Set<string>;
  onSelect: (iso3: string) => void;
  anchor: { top: number; left: number };
}) {
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    const list = q
      ? countries.filter(
          (c) => c.displayName.toLowerCase().includes(q) || c.iso3.toLowerCase().includes(q),
        )
      : countries;
    // Étoilés en premier
    if (watchedIso3s.size === 0 || q) return list;
    return [...list].sort((a, b) => {
      const aW = watchedIso3s.has(a.iso3) ? 0 : 1;
      const bW = watchedIso3s.has(b.iso3) ? 0 : 1;
      return aW - bW;
    });
  }, [countries, search, watchedIso3s]);

  return (
    <div className="country-selector-popover" style={{ position: "fixed", top: anchor.top, left: anchor.left, zIndex: 1199 }}>
      <input
        className="country-selector-search"
        type="text"
        placeholder={loading ? "Chargement..." : "Rechercher un pays..."}
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        autoFocus
      />
      <div className="country-selector-list">
        {filtered.map((c) => (
          <button
            key={c.iso3}
            type="button"
            className={`country-selector-item${c.iso3 === selectedIso3 ? " selected" : ""}`}
            onClick={() => onSelect(c.iso3)}
          >
            {watchedIso3s.has(c.iso3) && (
              <span style={{ marginRight: 5, fontSize: 11 }}>★</span>
            )}
            {c.displayName}
          </button>
        ))}
        {!loading && filtered.length === 0 && (
          <p style={{ padding: "8px 14px", color: "rgba(183,220,245,0.45)", fontSize: 12, margin: 0 }}>
            Aucun pays trouvé
          </p>
        )}
      </div>
    </div>
  );
}

// ---------- Contenu principal ----------

type NavDomain = "explore" | "markets" | "travel" | "safety" | "all";

function AppContent() {
  const lang = useLang();
  const toggleLang = useToggleLang();
  const { watchlist, toggle: toggleWatch, isWatched } = useWatchlist();

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [regionDrawerOpen, setRegionDrawerOpen] = useState(false);
  const [showCountrySelector, setShowCountrySelector] = useState(false);
  const [showSourcesModal, setShowSourcesModal] = useState(false);
  const [showWatchlist, setShowWatchlist] = useState(false);
  const [showTravelPanel, setShowTravelPanel] = useState(false);
  const [showProfilePanel, setShowProfilePanel] = useState(false);
  const [showPurchasingPower, setShowPurchasingPower] = useState(false);
  const [showDestinationScore, setShowDestinationScore] = useState(false);
  const [showRetirement, setShowRetirement] = useState(false);
  const [showRealEstate, setShowRealEstate] = useState(false);
  const [showAlerts, setShowAlerts] = useState(false);
  const [showAdvisor, setShowAdvisor] = useState(false);
  const [showCurrencyPanel, setShowCurrencyPanel] = useState(false);
  const [showToolsMenu, setShowToolsMenu] = useState(false);
  const [navDomain, setNavDomain] = useState<NavDomain>("all");
  const toolsButtonRef = useRef<HTMLButtonElement>(null);
  const [toolsAnchor, setToolsAnchor] = useState({ top: 80, left: 16 });
  const [countryAnchor, setCountryAnchor] = useState({ top: 80, left: 16 });
  const [selectedCountryIso3, setSelectedCountryIso3] = useState("FRA");
  const { profile, hasProfile } = useUserProfile();
  const { countries, loading: countriesLoading, error: countriesError } = useCountryCatalog();
  const isOffline = !countriesLoading && !!countriesError && countries.length === 0;
  const isPreview = import.meta.env.VITE_WHV_PREVIEW_MODE === "true";

  const selectedCountry = useMemo<CountrySummary | null>(
    () => countries.find((c) => c.iso3 === selectedCountryIso3) ?? null,
    [countries, selectedCountryIso3],
  );

  const handleCountryClick = useCallback((iso3: string) => {
    setRegionDrawerOpen(false);
    setShowCountrySelector(false);
    setSelectedCountryIso3(iso3);
    setDrawerOpen(true);
  }, []);

  function handleSelectFromPopover(iso3: string) {
    setSelectedCountryIso3(iso3);
    setDrawerOpen(true);
    setRegionDrawerOpen(false);
    setShowCountrySelector(false);
  }

  function handleOpenRegions() {
    setDrawerOpen(false);
    setShowCountrySelector(false);
    setRegionDrawerOpen((v) => !v);
    setShowTravelPanel(false);
  }

  function handleToggleTravel() {
    setShowTravelPanel((v) => !v);
    setShowCountrySelector(false);
    setShowWatchlist(false);
    setShowSourcesModal(false);
    setShowProfilePanel(false);
  }

  function handleToggleProfile() {
    setShowProfilePanel((v) => !v);
    setShowCountrySelector(false);
    setShowWatchlist(false);
    setShowSourcesModal(false);
    setShowTravelPanel(false);
    setShowPurchasingPower(false);
  }

  function handleTogglePurchasingPower() {
    setShowPurchasingPower((v) => !v);
    setShowProfilePanel(false);
    setShowCountrySelector(false);
    setShowWatchlist(false);
    setShowSourcesModal(false);
    setShowTravelPanel(false);
    setShowDestinationScore(false);
  }

  function handleToggleDestinationScore() {
    setShowDestinationScore((v) => !v);
    setShowPurchasingPower(false);
    setShowProfilePanel(false);
    setShowCountrySelector(false);
    setShowWatchlist(false);
    setShowSourcesModal(false);
    setShowTravelPanel(false);
    setShowRetirement(false);
  }

  function handleToggleRetirement() {
    setShowRetirement((v) => !v);
    setShowRealEstate(false);
    setShowDestinationScore(false);
    setShowPurchasingPower(false);
    setShowProfilePanel(false);
    setShowCountrySelector(false);
    setShowWatchlist(false);
    setShowSourcesModal(false);
    setShowTravelPanel(false);
    setShowAlerts(false);
    setShowAdvisor(false);
    setShowCurrencyPanel(false);
  }

  function handleToggleRealEstate() {
    setShowRealEstate((v) => !v);
    setShowRetirement(false);
    setShowDestinationScore(false);
    setShowPurchasingPower(false);
    setShowProfilePanel(false);
    setShowCountrySelector(false);
    setShowWatchlist(false);
    setShowSourcesModal(false);
    setShowTravelPanel(false);
    setShowAlerts(false);
  }

  function handleToggleAlerts() {
    setShowAlerts((v) => !v);
    setShowRealEstate(false);
    setShowRetirement(false);
    setShowDestinationScore(false);
    setShowPurchasingPower(false);
    setShowProfilePanel(false);
    setShowCountrySelector(false);
    setShowWatchlist(false);
    setShowSourcesModal(false);
    setShowTravelPanel(false);
    setShowAdvisor(false);
  }

  function handleToggleAdvisor() {
    setShowAdvisor((v) => !v);
    setShowCurrencyPanel(false);
    setShowAlerts(false);
    setShowRealEstate(false);
    setShowRetirement(false);
    setShowDestinationScore(false);
    setShowPurchasingPower(false);
    setShowProfilePanel(false);
    setShowCountrySelector(false);
    setShowWatchlist(false);
    setShowSourcesModal(false);
    setShowTravelPanel(false);
  }

  function handleToggleCurrencyPanel() {
    setShowCurrencyPanel((v) => !v);
    setShowAdvisor(false);
    setShowAlerts(false);
    setShowRealEstate(false);
    setShowRetirement(false);
    setShowDestinationScore(false);
    setShowPurchasingPower(false);
    setShowProfilePanel(false);
    setShowCountrySelector(false);
    setShowWatchlist(false);
    setShowSourcesModal(false);
    setShowTravelPanel(false);
  }

  const anyToolOpen = showPurchasingPower || showDestinationScore || showRetirement || showRealEstate
    || showTravelPanel || showAdvisor || showAlerts || showWatchlist || showCurrencyPanel;


  function openNavDomain(domain: NavDomain, trigger?: HTMLElement | null) {
    const rect = trigger?.getBoundingClientRect() ?? document.querySelector(".whv-nav")?.getBoundingClientRect();
    if (rect) {
      const menuWidth = Math.min(580, window.innerWidth - 24);
      const left = Math.max(12, Math.min(rect.left, window.innerWidth - menuWidth - 12));
      setToolsAnchor({ top: rect.bottom + 10, left });
    }
    setShowToolsMenu((wasOpen) => navDomain === domain ? !wasOpen : true);
    setNavDomain(domain);
    setShowCountrySelector(false);
    setRegionDrawerOpen(false);
    setDrawerOpen(false);
  }

  function openCountrySearch() {
    setCountryAnchor(toolsAnchor);
    setShowCountrySelector(true);
    setShowToolsMenu(false);
  }

  function openFavorites() {
    setShowWatchlist((v) => !v);
    setShowCountrySelector(false);
    setShowSourcesModal(false);
    setRegionDrawerOpen(false);
    setShowTravelPanel(false);
    setShowToolsMenu(false);
  }

  useEffect(() => {
    if (!showToolsMenu && !showCountrySelector) return;
    const onEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setShowToolsMenu(false);
        setShowCountrySelector(false);
      }
    };
    window.addEventListener("keydown", onEscape);
    return () => window.removeEventListener("keydown", onEscape);
  }, [showToolsMenu, showCountrySelector]);

  const headerActions = (
    <nav className="whv-nav" aria-label={lang === "fr" ? "Explorer World Health Vision" : "Explore World Health Vision"}>
      <button type="button" className="whv-nav-btn whv-nav-btn--mobile-hub" aria-expanded={showToolsMenu && navDomain === "all"}
        onClick={(event) => openNavDomain("all", event.currentTarget)}><><WorldIcon name="menu" size={17}/> Menu</></button>
      {(showCountrySelector || showToolsMenu) && (
        <div className="whv-menu-dismiss" onClick={() => {
          setShowCountrySelector(false);
          setShowToolsMenu(false);
        }} />
      )}
      <button type="button" className="whv-nav-btn whv-nav-btn--home"
        onClick={() => {
          setDrawerOpen(false); setRegionDrawerOpen(false); setShowToolsMenu(false);
          setShowSourcesModal(false); setShowCountrySelector(false);
        }}>
        {lang === "fr" ? "Accueil" : "Home"}
      </button>
      <button type="button"
        className={"whv-nav-btn whv-nav-btn--explore" + (showToolsMenu && navDomain === "explore" ? " active" : "")}
        aria-expanded={showToolsMenu && navDomain === "explore"}
        onClick={(event) => openNavDomain("explore", event.currentTarget)}>
        {lang === "fr" ? "Pays & régions" : "Countries & regions"}
        <span className="whv-nav-chevron" aria-hidden="true"><WorldIcon name="chevron" size={13}/></span>
      </button>
      <button type="button"
        className={"whv-nav-btn whv-nav-btn--markets" + (showToolsMenu && navDomain === "markets" ? " active" : "")}
        aria-expanded={showToolsMenu && navDomain === "markets"}
        onClick={(event) => openNavDomain("markets", event.currentTarget)}>
        {lang === "fr" ? "Économie & marchés" : "Economy & markets"}
        <span className="whv-nav-chevron" aria-hidden="true">⌄</span>
      </button>
      <button type="button"
        className={"whv-nav-btn whv-nav-btn--travel" + (showToolsMenu && navDomain === "travel" ? " active" : "")}
        aria-expanded={showToolsMenu && navDomain === "travel"}
        onClick={(event) => openNavDomain("travel", event.currentTarget)}>
        {lang === "fr" ? "Voyager & vivre" : "Travel & living"}
        <span className="whv-nav-chevron" aria-hidden="true">⌄</span>
      </button>
      <button type="button"
        className={"whv-nav-btn whv-nav-btn--safety" + (showToolsMenu && navDomain === "safety" ? " active" : "")}
        aria-expanded={showToolsMenu && navDomain === "safety"}
        onClick={(event) => openNavDomain("safety", event.currentTarget)}>
        {lang === "fr" ? "Sécurité" : "Safety"}
        <span className="whv-nav-chevron" aria-hidden="true">⌄</span>
      </button>
      <button type="button" ref={toolsButtonRef}
        className={"whv-nav-btn whv-nav-btn--tools" + (showToolsMenu && navDomain === "all" ? " active" : "") + (anyToolOpen ? " has-active-tool" : "")}
        aria-expanded={showToolsMenu && navDomain === "all"}
        aria-controls="whv-tools-menu"
        onClick={(event) => openNavDomain("all", event.currentTarget)}>
        {lang === "fr" ? "Tous les outils" : "All tools"}
      </button>
      <button type="button"
        className={"whv-nav-btn whv-nav-btn--sources" + (showSourcesModal ? " active" : "")}
        onClick={() => {
          setShowSourcesModal((v) => !v); setShowCountrySelector(false);
          setShowWatchlist(false); setRegionDrawerOpen(false); setShowToolsMenu(false);
        }}>
        {lang === "fr" ? "Sources" : "Sources"}
      </button>
      <button type="button"
        className={"whv-nav-btn whv-nav-btn--profile" + (showProfilePanel ? " active" : "")}
        onClick={() => { handleToggleProfile(); setShowToolsMenu(false); }}
        title={lang === "fr" ? "Mon profil" : "My profile"}>
        {hasProfile && profile.displayName ? profile.displayName : (lang === "fr" ? "Profil" : "Profile")}
      </button>
      <button type="button" className="whv-nav-btn whv-nav-btn--lang"
        onClick={toggleLang} title={lang === "fr" ? "Switch to English" : "Passer en français"}>
        {t(lang, "langue")}
      </button>
      <span className={"whv-service-status " +
          (isPreview || isOffline ? "whv-service-status--offline" : countriesLoading ? "whv-service-status--loading" : "whv-service-status--online")}
        title={isPreview ? "Aperçu statique : données nationales versionnées, sans backend permanent" :
          isOffline ? "Services de données indisponibles" : countriesLoading ? "Connexion..." : countries.length + " pays chargés"}>
        <span className="whv-service-status-dot" />
        {isPreview ? (lang === "fr" ? "Aperçu" : "Preview") : isOffline ? (lang === "fr" ? "Hors ligne" : "Offline") :
          countriesLoading ? "…" : (lang === "fr" ? "Connecté" : "Connected")}
      </span>

      {showToolsMenu && createPortal(
        <div className="whv-tools-menu whv-domain-menu" id="whv-tools-menu" role="menu"
          data-domain={navDomain} aria-label={lang === "fr" ? "Navigation thématique" : "Thematic navigation"}
          style={{ position: "fixed", top: toolsAnchor.top, left: toolsAnchor.left, zIndex: 1200 }}>
          <div className="whv-domain-heading">
            <div>
              <span className="whv-domain-overline">WORLD HEALTH VISION · ATLAS</span>
              <h2>{navDomain === "explore" ? (lang === "fr" ? "Explorer le monde" : "Explore the world") :
                navDomain === "markets" ? (lang === "fr" ? "Comprendre l’économie" : "Explore the economy") :
                navDomain === "travel" ? (lang === "fr" ? "Voyager et s’installer" : "Travel and living") :
                navDomain === "safety" ? (lang === "fr" ? "Comprendre les risques" : "Understand risks") :
                (lang === "fr" ? "Toutes les fonctionnalités" : "All features")}</h2>
            </div>
            <button type="button" className="whv-domain-close" aria-label={lang === "fr" ? "Fermer le menu" : "Close menu"}
              onClick={() => setShowToolsMenu(false)}><WorldIcon name="close" size={17}/></button>
          </div>
          <div className="whv-domain-grid">
            {(navDomain === "explore" || navDomain === "all") && (
              <section className="whv-domain-group" aria-label={lang === "fr" ? "Pays et régions" : "Countries and regions"}>
                <h3>{lang === "fr" ? "01 · Pays & régions" : "01 · Countries & regions"}</h3>
                <button type="button" className="whv-tools-item" onClick={openCountrySearch}>
                  <span className="whv-menu-icon" aria-hidden="true"><WorldIcon name="map" size={19}/></span>
                  <span><strong>{lang === "fr" ? "Explorer les pays" : "Explore countries"}</strong>
                    <small>{lang === "fr" ? "Rechercher et ouvrir les fiches pays" : "Search country profiles"}</small></span>
                </button>
                <button type="button" className="whv-tools-item" onClick={() => { handleOpenRegions(); setShowToolsMenu(false); }}>
                  <span className="whv-menu-icon" aria-hidden="true"><WorldIcon name="regions" size={19}/></span>
                  <span><strong>{lang === "fr" ? "Régions du monde" : "World regions"}</strong>
                    <small>{lang === "fr" ? "Parcourir les grandes régions" : "Browse world regions"}</small></span>
                </button>
                <button type="button" className="whv-tools-item whv-nav-btn--watchlist" onClick={openFavorites}>
                  <span className="whv-menu-icon" aria-hidden="true"><WorldIcon name="star" size={19}/></span>
                  <span><strong>{lang === "fr" ? "Favoris" : "Watchlist"}{watchlist.size ? " · " + watchlist.size : ""}</strong>
                    <small>{lang === "fr" ? "Retrouver ses pays enregistrés" : "Your saved countries"}</small></span>
                </button>
              </section>
            )}
            {(navDomain === "markets" || navDomain === "all") && (
              <section className="whv-domain-group" aria-label={lang === "fr" ? "Économie et marchés" : "Economy and markets"}>
                <h3>{lang === "fr" ? "02 · Économie & marchés" : "02 · Economy & markets"}</h3>
                <button type="button" className="whv-tools-item whv-nav-btn--currency" onClick={() => { handleToggleCurrencyPanel(); setShowToolsMenu(false); }}>
                  <span className="whv-menu-icon" aria-hidden="true"><WorldIcon name="currency" size={19}/></span>
                  <span><strong>{lang === "fr" ? "Devises & taux de change" : "Currencies & FX"}</strong>
                    <small>{lang === "fr" ? "Comparer les monnaies" : "Compare currencies"}</small></span>
                </button>
                <button type="button" className="whv-tools-item whv-nav-btn--pp" onClick={() => { handleTogglePurchasingPower(); setShowToolsMenu(false); }}>
                  <span className="whv-menu-icon" aria-hidden="true"><WorldIcon name="scale" size={19}/></span>
                  <span><strong>{lang === "fr" ? "Pouvoir d'achat" : "Purchasing power"}</strong>
                    <small>{lang === "fr" ? "Comparer les niveaux de vie" : "Compare living standards"}</small></span>
                </button>
                <button type="button" className="whv-tools-item" onClick={() => { handleToggleAdvisor(); setShowToolsMenu(false); }}>
                  <span className="whv-menu-icon" aria-hidden="true"><WorldIcon name="advisor" size={19}/></span>
                  <span><strong>{lang === "fr" ? "Conseiller économique" : "Economic advisor"}</strong>
                    <small>{lang === "fr" ? "Lire les indicateurs et leurs limites" : "Understand the indicators"}</small></span>
                </button>
                <p className="whv-domain-disclosure">{lang === "fr"
                  ? "Actions, obligations, indices et matières premières : futurs espaces dédiés, sans cotations fictives."
                  : "Stocks, bonds, indices and commodities: planned spaces, with no fabricated market quotes."}</p>
              </section>
            )}
            {(navDomain === "travel" || navDomain === "all") && (
              <section className="whv-domain-group" aria-label={lang === "fr" ? "Tourisme et vie" : "Travel and living"}>
                <h3>{lang === "fr" ? "03 · Voyager & vivre" : "03 · Travel & living"}</h3>
                <button type="button" className="whv-tools-item whv-nav-btn--travel" onClick={() => { handleToggleTravel(); setShowToolsMenu(false); }}>
                  <span className="whv-menu-icon" aria-hidden="true"><WorldIcon name="travel" size={19}/></span>
                  <span><strong>{lang === "fr" ? "Voyage" : "Travel"}</strong>
                    <small>{lang === "fr" ? "Explorer une destination" : "Explore a destination"}</small></span>
                </button>
                <button type="button" className="whv-tools-item whv-nav-btn--score" onClick={() => { handleToggleDestinationScore(); setShowToolsMenu(false); }}>
                  <span className="whv-menu-icon" aria-hidden="true"><WorldIcon name="destination" size={19}/></span>
                  <span><strong>{lang === "fr" ? "Score destination" : "Destination score"}</strong>
                    <small>{lang === "fr" ? "Comparer les options" : "Compare destinations"}</small></span>
                </button>
                <button type="button" className="whv-tools-item" onClick={() => { handleToggleRetirement(); setShowToolsMenu(false); }}>
                  <span className="whv-menu-icon" aria-hidden="true"><WorldIcon name="home" size={19}/></span>
                  <span><strong>{lang === "fr" ? "Expat & Retraite" : "Expat & Retirement"}</strong>
                    <small>{lang === "fr" ? "Préparer un projet de vie" : "Plan a move"}</small></span>
                </button>
                <button type="button" className="whv-tools-item whv-nav-btn--realestate" onClick={() => { handleToggleRealEstate(); setShowToolsMenu(false); }}>
                  <span className="whv-menu-icon" aria-hidden="true"><WorldIcon name="building" size={19}/></span>
                  <span><strong>{lang === "fr" ? "Immobilier" : "Real estate"}</strong>
                    <small>{lang === "fr" ? "Explorer des contextes immobiliers" : "Explore property data"}</small></span>
                </button>
              </section>
            )}
            {(navDomain === "safety" || navDomain === "all") && (
              <section className="whv-domain-group" aria-label={lang === "fr" ? "Sécurité" : "Safety"}>
                <h3>{lang === "fr" ? "04 · Sécurité & vigilance" : "04 · Safety & awareness"}</h3>
                <button type="button" className="whv-tools-item whv-nav-btn--alerts" onClick={() => { handleToggleAlerts(); setShowToolsMenu(false); }}>
                  <span className="whv-menu-icon" aria-hidden="true"><WorldIcon name="alert" size={19}/></span>
                  <span><strong>{lang === "fr" ? "Alertes" : "Alerts"}</strong>
                    <small>{lang === "fr" ? "Outil dépendant des services de suivi" : "Requires alert services"}</small></span>
                </button>
                <button type="button" className="whv-tools-item" onClick={openCountrySearch}>
                  <span className="whv-menu-icon" aria-hidden="true"><WorldIcon name="map" size={19}/></span>
                  <span><strong>{lang === "fr" ? "Consulter un pays" : "Explore a country"}</strong>
                    <small>{lang === "fr" ? "Contexte et indicateurs disponibles" : "Available context and indicators"}</small></span>
                </button>
                <p className="whv-domain-disclosure">{lang === "fr"
                  ? "Les indices de sécurité et avis aux voyageurs officiels seront distingués des informations générales et ne sont pas simulés ici."
                  : "Official safety ratings and travel advisories will remain distinct from general country data and are not simulated."}</p>
              </section>
            )}
          </div>
          <p className="whv-domain-footer">{lang === "fr"
            ? "World Health Vision · Voir le monde, le comprendre. Sources et limites consultables depuis le menu Sources."
            : "World Health Vision · See the world, understand it. Sources and limitations are available under Sources."}</p>
        </div>,
        document.body,
      )}
      {showCountrySelector && createPortal(
        <CountrySelectorPopover
          countries={countries} loading={countriesLoading}
          selectedIso3={selectedCountryIso3} watchedIso3s={watchlist}
          onSelect={handleSelectFromPopover} anchor={countryAnchor}
        />, document.body,
      )}
    </nav>
  );

  return (
    <EyeLayout headerActions={headerActions}>
      <EyeMapFrame
        drawerOpen={drawerOpen || regionDrawerOpen}
        countries={countries}
        selectedCountryIso3={selectedCountryIso3}
        onCountryClick={handleCountryClick}
      />

      <section className="whv-desktop-story" aria-label={lang === "fr" ? "Présentation de la plateforme" : "Platform overview"}>
        <span className="whv-story-eyebrow"><span className="whv-story-dot" /> {lang === "fr" ? "VOTRE ATLAS DU MONDE" : "YOUR WORLD ATLAS"}</span>
        <h2>{lang === "fr" ? <>Voir le monde.<br/><em>Le comprendre.</em></> : <>See the world.<br/><em>Understand it.</em></>}</h2>
        <p>{lang === "fr"
          ? "Un même endroit pour explorer les pays, les économies, les destinations et les grands enjeux du monde."
          : "One place to explore countries, economies, destinations and the world's key challenges."}</p>
        <div className="whv-story-actions">
          <button type="button" className="whv-story-primary" onClick={() => openNavDomain("explore")}>
            {lang === "fr" ? "Explorer les pays" : "Explore countries"} <span aria-hidden="true"><WorldIcon name="arrow" size={17}/></span>
          </button>
          <button type="button" className="whv-story-secondary" onClick={() => openNavDomain("all")}>
            {lang === "fr" ? "Découvrir les outils" : "Discover the tools"}
          </button>
        </div>
        <div className="whv-story-metrics" aria-label={lang === "fr" ? "Aperçu du catalogue" : "Catalog overview"}>
          <div><strong>{countries.length || "—"}</strong><span>{lang === "fr" ? "pays & territoires" : "countries & territories"}</span></div>
          <div><strong>04</strong><span>{lang === "fr" ? "univers à explorer" : "areas to explore"}</span></div>
        </div>
        <div className="whv-story-topics">
          <span>{lang === "fr" ? "Géographie" : "Geography"}</span>
          <span>{lang === "fr" ? "Économie" : "Economy"}</span>
          <span>{lang === "fr" ? "Voyage" : "Travel"}</span>
          <span>{lang === "fr" ? "Sécurité" : "Safety"}</span>
        </div>
      </section>


<aside className="whv-mobile-overview" aria-label={lang === "fr" ? "Explorer les pays" : "Explore countries"}>
        <div>
          <span className="whv-mobile-eyebrow">{lang === "fr" ? "L'EXPLORATEUR MONDIAL" : "WORLD EXPLORER"}</span>
          <h2>{lang === "fr" ? "Voir le monde, le comprendre." : "See the world, understand it."}</h2>
          <p className="whv-mobile-overview-description">
            {lang === "fr"
              ? "Pays, économie, voyages et sécurité : explorez les multiples facettes du monde."
              : "Countries, markets, travel and safety: discover the world from every angle."}
          </p>
        </div>
        <button className="whv-mobile-featured" type="button" onClick={() => handleCountryClick(selectedCountryIso3)}>
          <span className="whv-mobile-featured-text">
            <span className="whv-mobile-featured-label">{lang === "fr" ? "PAYS SÉLECTIONNÉ" : "SELECTED COUNTRY"}</span>
            <span className="whv-mobile-featured-name">{selectedCountry?.displayName ?? (lang === "fr" ? "Choisir un pays" : "Choose a country")}</span>
            <span className="whv-mobile-featured-subtitle">
              {[selectedCountry?.capitalCity, selectedCountry?.regionName].filter(Boolean).join(" · ")
                || (lang === "fr" ? "Explorer la fiche du pays" : "Explore the country profile")}
            </span>
          </span>
          <span className="whv-mobile-featured-arrow" aria-hidden="true"><WorldIcon name="arrow" size={19}/></span>
        </button>
        <div className="whv-mobile-shortcuts">
          <button type="button" className="whv-mobile-shortcut" onClick={openCountrySearch}>
            <span className="whv-mobile-shortcut-symbol" aria-hidden="true"><WorldIcon name="map" size={23}/></span>
            <span>{lang === "fr" ? "Pays" : "Countries"}</span>
          </button>
          <button type="button" className="whv-mobile-shortcut" onClick={handleOpenRegions}>
            <span className="whv-mobile-shortcut-symbol" aria-hidden="true"><WorldIcon name="regions" size={23}/></span>
            <span>{lang === "fr" ? "Régions" : "Regions"}</span>
          </button>
          <button type="button" className="whv-mobile-shortcut" onClick={() => openNavDomain("markets")}>
            <span className="whv-mobile-shortcut-symbol" aria-hidden="true"><WorldIcon name="markets" size={23}/></span>
            <span>{lang === "fr" ? "Marchés" : "Markets"}</span>
          </button>
          <button type="button" className="whv-mobile-shortcut" onClick={() => openNavDomain("travel")}>
            <span className="whv-mobile-shortcut-symbol" aria-hidden="true"><WorldIcon name="travel" size={23}/></span>
            <span>{lang === "fr" ? "Voyage" : "Travel"}</span>
          </button>
          <button type="button" className="whv-mobile-shortcut" onClick={() => openNavDomain("safety")}>
            <span className="whv-mobile-shortcut-symbol" aria-hidden="true"><WorldIcon name="shield" size={23}/></span>
            <span>{lang === "fr" ? "Sécurité" : "Safety"}</span>
          </button>
          <button type="button" className="whv-mobile-shortcut" onClick={() => openNavDomain("all")}>
            <span className="whv-mobile-shortcut-symbol" aria-hidden="true"><WorldIcon name="layers" size={23}/></span>
            <span>{lang === "fr" ? "Tous les outils" : "All tools"}</span>
          </button>
        </div>
        <p className="whv-mobile-note">
          <strong>{countries.length} {lang === "fr" ? "pays dans le catalogue" : "countries in the catalog"}</strong>
          {" · "}
          {isPreview
            ? (lang === "fr"
              ? "Aperçu sans backend permanent : les données directes de la Banque mondiale peuvent être consultées, les comparaisons multi-sources nécessitent le backend V2."
              : "Preview without a permanent backend: direct World Bank data may be available, but multi-source comparisons require the V2 backend.")
            : (lang === "fr"
              ? "Explorez les indicateurs provenant des services V2, avec leurs sources et années de référence."
              : "Explore indicators from the V2 services, including provenance and reference years.")}
        </p>
      </aside>

      <Suspense fallback={null}>
      {drawerOpen && <CountryDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        selectedCountryIso3={selectedCountryIso3}
        onCountryChange={(iso3) => {
          setSelectedCountryIso3(iso3);
        }}
        countries={countries}
        countriesLoading={countriesLoading}
        countriesError={countriesError}
        watched={isWatched(selectedCountryIso3)}
        onToggleWatch={() => toggleWatch(selectedCountryIso3)}
      />}

      {regionDrawerOpen && <RegionDrawer
        open={regionDrawerOpen}
        onClose={() => setRegionDrawerOpen(false)}
        countries={countries}
        onOpenCountry={handleCountryClick}
      />}

      {showSourcesModal && (
        <SourceMethodologyModal onClose={() => setShowSourcesModal(false)} />
      )}

      {/* Bandeau hors-ligne */}
      {isOffline && (
        <div className="whv-offline-banner">
          <span className="whv-offline-banner-icon">⚠</span>
          <div>
            <strong>{lang === "fr" ? "Données temporairement indisponibles" : "Data temporarily unavailable"}</strong>
            <span>{lang === "fr"
              ? "Le globe reste consultable. Les fiches et outils indiquent les informations accessibles."
              : "You can still explore the globe. Country profiles and tools will show available information."}</span>
          </div>
        </div>
      )}

      {showProfilePanel && (
        <UserProfilePanel
          countries={countries}
          onClose={() => setShowProfilePanel(false)}
        />
      )}

      {showPurchasingPower && (
        <PurchasingPowerPanel
          countries={countries}
          onClose={() => setShowPurchasingPower(false)}
        />
      )}

      {showDestinationScore && (
        <DestinationScorePanel
          countries={countries}
          onOpenCountry={(iso3) => {
            setSelectedCountryIso3(iso3);
            setDrawerOpen(true);
            setShowDestinationScore(false);
          }}
          onClose={() => setShowDestinationScore(false)}
        />
      )}

      {showRetirement && (
        <RetirementPanel
          countries={countries}
          onOpenCountry={(iso3) => {
            setSelectedCountryIso3(iso3);
            setDrawerOpen(true);
            setShowRetirement(false);
          }}
          onClose={() => setShowRetirement(false)}
        />
      )}

      {showRealEstate && (
        <RealEstatePanel
          countries={countries}
          onOpenCountry={(iso3) => {
            setSelectedCountryIso3(iso3);
            setDrawerOpen(true);
            setShowRealEstate(false);
          }}
          onClose={() => setShowRealEstate(false)}
        />
      )}

      {showAlerts && (
        <AlertsPanel
          onClose={() => setShowAlerts(false)}
        />
      )}

      {showAdvisor && (
        <AdvisorPanel
          countries={countries}
          selectedIso3={selectedCountryIso3}
          onClose={() => setShowAdvisor(false)}
        />
      )}

      {showTravelPanel && (
        <TravelPanel
          onClose={() => setShowTravelPanel(false)}
        />
      )}

      {showCurrencyPanel && (
        <CurrencyPanel onClose={() => setShowCurrencyPanel(false)} />
      )}

      {showWatchlist && (
        <WatchlistPanel
          watchedIso3s={watchlist}
          countries={countries}
          onOpenCountry={(iso3) => {
            setSelectedCountryIso3(iso3);
            setDrawerOpen(true);
            setRegionDrawerOpen(false);
          }}
          onRemove={(iso3) => toggleWatch(iso3)}
          onClose={() => setShowWatchlist(false)}
        />
      )}
      </Suspense>
    </EyeLayout>
  );
}

// ---------- Racine avec contextes ----------

function App() {
  return (
    <LanguageProvider>
      <UserProfileProvider>
        <AppContent />
      </UserProfileProvider>
    </LanguageProvider>
  );
}

export default App;