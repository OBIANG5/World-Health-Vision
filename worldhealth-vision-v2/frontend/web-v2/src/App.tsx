// WorldHealthVision V2 — App
// Composant racine : carte + navigation header + fiche pays + fiche région.

import { lazy, Suspense, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import type { CountrySummary } from "./api/types";
import EyeLayout from "./components/layout/EyeLayout";
import EyeMapFrame from "./components/layout/EyeMapFrame";
import WorldLandingV3 from "./components/layout/WorldLandingV3";
import {WorldIcon} from "./components/ui/WorldIcon";
import { VISION_PRODUCTS, type VisionAction, type VisionId } from "./product/visionProducts";
import { useWorldNavigation } from "./navigation/worldRoute";
import { LanguageProvider, useLang, useToggleLang } from "./context/LanguageContext";
import { UserProfileProvider, useUserProfile } from "./context/UserProfileContext";
import { useCountryCatalog } from "./hooks/useCountryCatalog";
import { useWatchlist } from "./hooks/useWatchlist";


// Chargement à la demande (code-splitting) : ces composants ne sont pas affichés
// au démarrage. On les charge quand ils s'ouvrent → bundle initial plus léger et
// carte affichée plus vite (Recharts/jsPDF ne sont plus dans le bundle de départ).
const CountryDrawer = lazy(() => import("./components/country/CountryDrawer"));
const VisionHub = lazy(() => import("./components/layout/VisionHub"));
const GlobalRadarPanel = lazy(() => import("./components/layout/GlobalRadarPanel"));
const WorldDiscovery = lazy(() => import("./components/layout/WorldDiscovery"));
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
import "./styles/vision-hub.css";
import "./styles/world-discovery.css";
import "./styles/world-v3.css";

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
  const { route, navigate } = useWorldNavigation();
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
  const showVisionHub = route.kind === "visions";
  const [navDomain, setNavDomain] = useState<NavDomain>("all");
  const toolsButtonRef = useRef<HTMLButtonElement>(null);
  const closeVisionHub = useCallback(() => navigate({ kind: "home" }), [navigate]);
  const closeWorldDiscovery = useCallback(() => navigate({ kind: "home" }), [navigate]);
  const [toolsAnchor, setToolsAnchor] = useState({ top: 80, left: 16 });
  const [countryAnchor, setCountryAnchor] = useState({ top: 80, left: 16 });
  const [selectedCountryIso3, setSelectedCountryIso3] = useState(() => route.kind === "country" ? route.iso3 : "FRA");
  const [requestedCountrySection, setRequestedCountrySection] = useState<"overview" | "compare" | "news">("overview");
  const { hasProfile } = useUserProfile();
  const { countries, loading: countriesLoading, error: countriesError,
    source: catalogSource } = useCountryCatalog();

  const activeIso3 = route.kind === "country" ? route.iso3 : selectedCountryIso3;
  const routedCountryMissing = route.kind === "country"
    // A World Bank fallback is NOT a complete World-Vision country registry.
    // Never mark a valid WHV territory link invalid merely because WB omits it.
    && catalogSource === "WHV_CATALOG"
    && !countriesLoading && countries.length > 0
    && !countries.some((country) => country.iso3 === route.iso3 && country.active && !country.aggregate);
  const activeCountryDrawerOpen = (drawerOpen || route.kind === "country") && !routedCountryMissing;

  const handleCountryClick = useCallback((iso3: string, section: "overview" | "compare" | "news" = "overview") => {
    setRegionDrawerOpen(false);
    setShowCountrySelector(false);
    setShowToolsMenu(false);
    setSelectedCountryIso3(iso3);
    setRequestedCountrySection(section);
    setDrawerOpen(false);
    navigate({ kind: "country", iso3 });
  }, [navigate]);

  function handleSelectFromPopover(iso3: string) { handleCountryClick(iso3); }

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


  function openNavDomain(domain: NavDomain, trigger?: HTMLElement | null) {
    // Services is a global menu, not a command to abandon the country.
    // Keep geographic context and the full-page country visible underneath.
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

  function openVisionHub(product: VisionId = "atlas") {
    navigate({ kind: "visions", product });
    setDrawerOpen(false);
    setShowCurrencyPanel(false);
    setShowTravelPanel(false);
    setShowToolsMenu(false);
    setShowCountrySelector(false);
    setShowSourcesModal(false);
  }

  function openWorldDiscovery() {
    navigate({ kind: "search" });
    setDrawerOpen(false);
    setShowToolsMenu(false);
    setShowCountrySelector(false);
    setShowSourcesModal(false);
  }

  function handleVisionAction(action: VisionAction) {
    setShowToolsMenu(false);
    switch (action) {
      case "country":
        navigate({ kind: "home" });
        openCountrySearch();
        return;
      case "favorites":
        navigate({ kind: "home" });
        if (!showWatchlist) openFavorites();
        return;
      case "currency":
        navigate({ kind: "money" });
        return;
      case "travel":
        navigate({ kind: "tourism" });
        return;
      case "sources":
        navigate({ kind: "sources" });
        return;
      case "radar":
        navigate({ kind: "radar" });
        return;
    }
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


  // Back/forward closes stale local menus; public route state is restored separately.
  useEffect(() => {
    const onHistoryChange = () => {
      setDrawerOpen(false);
      setShowToolsMenu(false);
      setShowCountrySelector(false);
      setRegionDrawerOpen(false);
      setShowSourcesModal(false);
      setShowCurrencyPanel(false);
      setShowTravelPanel(false);
    };
    window.addEventListener("popstate", onHistoryChange);
    return () => window.removeEventListener("popstate", onHistoryChange);
  }, []);

  useEffect(() => {
    const onShortcut = (event: KeyboardEvent) => {
      const el = event.target instanceof HTMLElement ? event.target : null;
      const typing = !!el?.closest('input,textarea,select,[contenteditable="true"]');
      const commandK = (event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k";
      const slash = !event.altKey && !event.ctrlKey && !event.metaKey && event.key === "/";
      if (!event.isComposing && !typing && (commandK || slash)) {
        event.preventDefault();
        navigate({ kind: "search" });
        setShowCountrySelector(false);
        setShowToolsMenu(false);
      }
    };
    window.addEventListener("keydown", onShortcut);
    return () => window.removeEventListener("keydown", onShortcut);
  }, [navigate]);

  const headerActions = (
    <nav className="whv-nav wv3-topnav" aria-label={lang === "fr" ? "Navigation World-Vision" : "World-Vision navigation"}>
      {(showCountrySelector || showToolsMenu) && (
        <button className="whv-menu-dismiss" type="button" aria-label={lang === "fr" ? "Fermer les menus" : "Close menus"}
          onClick={() => { setShowCountrySelector(false); setShowToolsMenu(false); }} />
      )}
      <button type="button" className="whv-nav-btn wv3-nav-desktop"
        aria-current={route.kind === "home" || route.kind === "country" ? "page" : undefined}
        onClick={() => { navigate({ kind: "home" }); setShowToolsMenu(false); }}>
        {lang === "fr" ? "Explorer" : "Explore"}
      </button>
      <button type="button" className="whv-nav-btn wv3-nav-desktop"
        onClick={() => handleCountryClick(activeIso3, "compare")}>
        {lang === "fr" ? "Comparer" : "Compare"}
      </button>
      <button type="button" ref={toolsButtonRef}
        className={"whv-nav-btn wv3-services-trigger" + (showToolsMenu ? " active" : "")}
        aria-expanded={showToolsMenu && navDomain === "all"}
        aria-controls="whv-tools-menu"
        onClick={(event) => openNavDomain("all", event.currentTarget)}>
        <span className="wv3-nav-desktop">{lang === "fr" ? "Services" : "Services"}</span>
        <span className="wv3-nav-compact"><WorldIcon name="menu" size={19}/></span>
        <span className="wv3-nav-desktop"><WorldIcon name="chevron" size={13}/></span>
      </button>
      <button type="button" className="whv-nav-btn wv3-nav-desktop"
        onClick={() => route.kind === "country"
          ? handleCountryClick(activeIso3, "news") : openWorldDiscovery()}>
        {lang === "fr" ? "Actualités" : "News"}
      </button>
      <button type="button" className="whv-nav-btn wv3-nav-desktop"
        onClick={openFavorites}>
        {lang === "fr" ? "Suivre" : "Follow"}
        {watchlist.size > 0 ? ` · ${watchlist.size}` : ""}
      </button>
      <span className="wv3-nav-spacer"/>
      <button type="button" className="whv-nav-btn wv3-nav-search"
        onClick={openWorldDiscovery} aria-label={lang === "fr" ? "Rechercher un pays, un service ou une source" : "Find country, service or source"}>
        <WorldIcon name="search" size={18}/>
        <span className="wv3-nav-desktop">{lang === "fr" ? "Rechercher" : "Search"}</span>
      </button>
      <button type="button" className="whv-nav-btn wv3-nav-lang-desktop"
        onClick={toggleLang} title={lang === "fr" ? "Switch to English" : "Passer en français"}>
        {lang.toUpperCase()}
      </button>
      {hasProfile && <button type="button" className="whv-nav-btn wv3-nav-icon"
        onClick={handleToggleProfile}
        aria-label={lang === "fr" ? "Profil" : "Profile"}>
        <WorldIcon name="user" size={18}/>
      </button>}
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
          {navDomain === "all" && <section className="wv3-mega-visions" aria-label={lang === "fr" ? "Toutes les Visions World-Vision" : "All World-Vision products"}>
            <h3>{lang === "fr" ? "Les Visions World-Vision" : "World-Vision products"}</h3>
            <p>{lang === "fr" ? "Découvrez leur rôle, leur avancement et leurs limites avant d'utiliser un outil." :
              "See each product's scope, maturity and limitations before using a tool."}</p>
            <div className="wv3-mega-products">
              {VISION_PRODUCTS.map(product => <button key={product.id} type="button"
                onClick={() => openVisionHub(product.id)}>
                <span><strong>{product.name}</strong><small>{product.tagline[lang]}</small></span>
                <span className="wv3-mega-stage">{product.stage === "planned" ?
                  (lang === "fr" ? "En préparation" : "Planned") :
                  product.stage === "partial" ? (lang === "fr" ? "Partiel" : "Partial") :
                  (lang === "fr" ? "À explorer" : "Explore")}</span>
              </button>)}
            </div>
          </section>}
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
        drawerOpen={activeCountryDrawerOpen || regionDrawerOpen}
        countries={countries}
        selectedCountryIso3={selectedCountryIso3}
        onCountryClick={handleCountryClick}
      />

      {route.kind === "home" && <WorldLandingV3
        language={lang}
        countriesCount={countries.length}
        onSearch={openWorldDiscovery}
        onCompare={() => handleCountryClick(activeIso3, "compare")}
        onMoney={() => handleVisionAction("currency")}
        onTravel={() => handleVisionAction("travel")}
        onVision={openVisionHub}
        onOpenCountry={() => handleCountryClick(activeIso3)}
        onSources={() => navigate({ kind: "sources" })}
      />}

      <Suspense fallback={null}>
      {activeCountryDrawerOpen && <CountryDrawer
        key={`${activeIso3}:${requestedCountrySection}`}
        open={activeCountryDrawerOpen}
        onClose={() => { setDrawerOpen(false); if (route.kind === "country") navigate({ kind: "home" }); }}
        selectedCountryIso3={activeIso3}
        onCountryChange={handleCountryClick}
        countries={countries}
        countriesLoading={countriesLoading}
        countriesError={countriesError}
        catalogSource={catalogSource}
        watched={isWatched(activeIso3)}
        onToggleWatch={() => toggleWatch(activeIso3)}
        initialSection={requestedCountrySection}
        onOpenVision={openVisionHub}
        onVisionAction={handleVisionAction}
      />}

      {regionDrawerOpen && <RegionDrawer
        open={regionDrawerOpen}
        onClose={() => setRegionDrawerOpen(false)}
        countries={countries}
        onOpenCountry={handleCountryClick}
      />}

      {(showSourcesModal || route.kind === "sources") && (
        <SourceMethodologyModal onClose={() => {
          setShowSourcesModal(false);
          if (route.kind === "sources") navigate({ kind: "home" });
        }} />
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

      {(showTravelPanel || route.kind === "tourism") && (
        <TravelPanel
          onClose={() => {
            setShowTravelPanel(false);
            if (route.kind === "tourism") navigate({ kind: "home" });
          }}
        />
      )}

      {(showCurrencyPanel || route.kind === "money") && (
        <CurrencyPanel onClose={() => {
          setShowCurrencyPanel(false);
          if (route.kind === "money") navigate({ kind: "home" });
        }} />
      )}

      {route.kind === "radar" && <GlobalRadarPanel onClose={() => navigate({ kind: "home" })} />}

      <VisionHub open={showVisionHub} language={lang}
        selectedId={route.kind === "visions" ? route.product : "atlas"}
        onSelectProduct={(product) => navigate({ kind: "visions", product })}
        onClose={closeVisionHub} onAction={handleVisionAction} />

      {route.kind === "search" && (
        <WorldDiscovery language={lang} onToggleLanguage={toggleLang} countries={countries}
          loading={countriesLoading} unavailable={countries.length === 0}
          catalogSource={catalogSource}
          onClose={closeWorldDiscovery}
          onCountry={handleCountryClick}
          onVision={(id) => openVisionHub(id)}
          onSources={() => navigate({ kind: "sources" })}
        />
      )}

      {/* Offline Catalog must not make a syntactically valid country URL look invalid.
          CountryDrawer shows a readable service-unavailable state itself. */}
      {(route.kind === "invalid" || routedCountryMissing) && (
        <div className="whv-route-notice" role="status">
          <WorldIcon name="info" size={18}/>
          <span>{lang === "fr"
            ? "Ce lien ne correspond pas à une page ou à un pays actuellement accessible dans le catalogue."
            : "This link does not match an accessible page or country in the catalog."}</span>
          <button type="button" onClick={openWorldDiscovery}>
            {lang === "fr" ? "Rechercher" : "Search"}
          </button>
        </div>
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