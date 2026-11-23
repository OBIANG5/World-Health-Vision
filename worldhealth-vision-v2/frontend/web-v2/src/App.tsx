// WorldHealthVision V2 — App
// Composant racine : carte + navigation header + fiche pays + fiche région.

import { lazy, Suspense, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import type { CountrySummary } from "./api/types";
import EyeLayout from "./components/layout/EyeLayout";
import EyeMapFrame from "./components/layout/EyeMapFrame";
import WorldLandingV3 from "./components/layout/WorldLandingV3";
import ServicesMegaMenuV3 from "./components/layout/ServicesMegaMenuV3";
import {WorldIcon} from "./components/ui/WorldIcon";
import { type VisionAction, type VisionId } from "./product/visionProducts";
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
import "./styles/world-v4.css";

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
      const menuWidth = Math.min(780, window.innerWidth - 24);
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
        <div className="wv3-service-menu-portal" style={{
          position: "fixed", top: toolsAnchor.top, left: toolsAnchor.left, zIndex: 1200,
        }}>
          <ServicesMegaMenuV3 language={lang}
            onClose={() => setShowToolsMenu(false)}
            onVision={(product) => { setShowToolsMenu(false); openVisionHub(product); }}
            handlers={{
              country: openCountrySearch,
              regions: () => { handleOpenRegions(); setShowToolsMenu(false); },
              sources: () => { navigate({ kind: "sources" }); setShowToolsMenu(false); },
              currency: () => { handleToggleCurrencyPanel(); setShowToolsMenu(false); },
              purchasingPower: () => { handleTogglePurchasingPower(); setShowToolsMenu(false); },
              advisor: () => { handleToggleAdvisor(); setShowToolsMenu(false); },
              travel: () => { handleToggleTravel(); setShowToolsMenu(false); },
              destinationScore: () => { handleToggleDestinationScore(); setShowToolsMenu(false); },
              retirement: () => { handleToggleRetirement(); setShowToolsMenu(false); },
              realEstate: () => { handleToggleRealEstate(); setShowToolsMenu(false); },
              favorites: () => { openFavorites(); setShowToolsMenu(false); },
              news: () => {
                if (route.kind === "country") handleCountryClick(activeIso3, "news");
                else openWorldDiscovery();
                setShowToolsMenu(false);
              },
              alerts: () => { handleToggleAlerts(); setShowToolsMenu(false); },
            }}/>
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