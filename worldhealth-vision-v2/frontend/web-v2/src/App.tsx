// WorldHealthVision V2 — App
// Composant racine : carte + navigation header + fiche pays + fiche région.

import { lazy, Suspense, useMemo, useState } from "react";
import type { CountrySummary } from "./api/types";
import EyeLayout from "./components/layout/EyeLayout";
import EyeMapFrame from "./components/layout/EyeMapFrame";
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

// ---------- Sélecteur de pays (popover) ----------

function CountrySelectorPopover({
  countries,
  loading,
  selectedIso3,
  watchedIso3s,
  onSelect,
}: {
  countries: CountrySummary[];
  loading: boolean;
  selectedIso3: string;
  watchedIso3s: Set<string>;
  onSelect: (iso3: string) => void;
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
    <div className="country-selector-popover">
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
  const [selectedCountryIso3, setSelectedCountryIso3] = useState("FRA");
  const { profile, hasProfile } = useUserProfile();
  const { countries, loading: countriesLoading, error: countriesError } = useCountryCatalog();
  const isOffline = !countriesLoading && !!countriesError && countries.length === 0;

  const selectedCountry = useMemo<CountrySummary | null>(
    () => countries.find((c) => c.iso3 === selectedCountryIso3) ?? null,
    [countries, selectedCountryIso3],
  );

  function handleCountryClick(iso3: string) {
    setRegionDrawerOpen(false);
    setShowCountrySelector(false);
    setSelectedCountryIso3(iso3);
    setDrawerOpen(true);
  }

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

  const headerActions = (
    <nav className="whv-nav">
      {/* Overlay ferme les popovers en cliquant dehors */}
      {(showCountrySelector || showToolsMenu) && (
        <div
          style={{ position: "fixed", inset: 0, zIndex: 99 }}
          onClick={() => { setShowCountrySelector(false); setShowToolsMenu(false); }}
        />
      )}

      {/* ── Pays ── */}
      <button
        type="button"
        className={`whv-nav-btn${drawerOpen || showCountrySelector ? " active" : ""}`}
        onClick={() => {
          setShowCountrySelector((v) => !v);
          setRegionDrawerOpen(false);
          setShowToolsMenu(false);
        }}
      >
        {t(lang, "pays")}
        {selectedCountry && (
          <span style={{ marginLeft: 6, fontSize: 11, opacity: 0.65 }}>
            {selectedCountry.displayName}
          </span>
        )}
      </button>

      {/* ── Régions ── */}
      <button
        type="button"
        className={`whv-nav-btn whv-nav-btn--regions${regionDrawerOpen ? " active" : ""}`}
        onClick={handleOpenRegions}
      >
        {t(lang, "regions")}
      </button>

      {/* ── Profil ── */}
      <button
        type="button"
        className={`whv-nav-btn whv-nav-btn--profile${showProfilePanel ? " active" : ""}`}
        onClick={handleToggleProfile}
        title={lang === "fr" ? "Mon profil" : "My profile"}
      >
        {hasProfile && profile.displayName
          ? `👤 ${profile.displayName}`
          : `👤 ${lang === "fr" ? "Profil" : "Profile"}`}
      </button>

      {/* ── Outils (dropdown) ── */}
      <div className="whv-tools-dropdown" style={{ position: "relative", zIndex: 120 }}>
        <button
          type="button"
          className={`whv-nav-btn whv-nav-btn--tools${showToolsMenu || anyToolOpen ? " active" : ""}`}
          onClick={() => setShowToolsMenu((v) => !v)}
          title={lang === "fr" ? "Outils d'analyse" : "Analysis tools"}
        >
          ⚙ {lang === "fr" ? "Outils" : "Tools"}
          {anyToolOpen && (
            <span style={{ marginLeft: 5, fontSize: 10, fontWeight: 700, color: "rgba(99,155,255,0.9)" }}>●</span>
          )}
        </button>

        {showToolsMenu && (
          <div className="whv-tools-menu">
            <button type="button"
              className={`whv-tools-item whv-nav-btn--pp${showPurchasingPower ? " active" : ""}`}
              onClick={() => { handleTogglePurchasingPower(); setShowToolsMenu(false); }}>
              💶 {lang === "fr" ? "Pouvoir d'achat" : "Purchasing power"}
            </button>
            <button type="button"
              className={`whv-tools-item whv-nav-btn--score${showDestinationScore ? " active" : ""}`}
              onClick={() => { handleToggleDestinationScore(); setShowToolsMenu(false); }}>
              🎯 {lang === "fr" ? "Score destination" : "Destination score"}
            </button>
            <button type="button"
              className={`whv-tools-item${showRetirement ? " active" : ""}`}
              onClick={() => { handleToggleRetirement(); setShowToolsMenu(false); }}>
              🌿 {lang === "fr" ? "Expat & Retraite" : "Expat & Retirement"}
            </button>
            <button type="button"
              className={`whv-tools-item whv-nav-btn--realestate${showRealEstate ? " active" : ""}`}
              onClick={() => { handleToggleRealEstate(); setShowToolsMenu(false); }}>
              🏘 {lang === "fr" ? "Immobilier" : "Real Estate"}
            </button>
            <button type="button"
              className={`whv-tools-item whv-nav-btn--currency${showCurrencyPanel ? " active" : ""}`}
              onClick={() => { handleToggleCurrencyPanel(); setShowToolsMenu(false); }}>
              💱 {lang === "fr" ? "Devises" : "Currencies"}
            </button>
            <button type="button"
              className={`whv-tools-item${showAdvisor ? " active" : ""}`}
              onClick={() => { handleToggleAdvisor(); setShowToolsMenu(false); }}>
              ◉ {lang === "fr" ? "Conseiller économique" : "Economic advisor"}
            </button>
            <button type="button"
              className={`whv-tools-item whv-nav-btn--watchlist${showWatchlist ? " active" : ""}`}
              onClick={() => {
                setShowWatchlist((v) => !v);
                setShowCountrySelector(false);
                setShowSourcesModal(false);
                setRegionDrawerOpen(false);
                setShowTravelPanel(false);
                setShowToolsMenu(false);
              }}>
              ★ {lang === "fr" ? "Favoris" : "Watchlist"}
              {watchlist.size > 0 && (
                <span style={{
                  marginLeft: 5, fontSize: 10,
                  background: "rgba(247,201,72,0.22)", borderRadius: "50%",
                  width: 16, height: 16, display: "inline-flex",
                  alignItems: "center", justifyContent: "center", fontWeight: 700,
                }}>
                  {watchlist.size}
                </span>
              )}
            </button>
            <div className="whv-tools-divider" />
            <span style={{ padding: "2px 12px 5px", fontSize: 10, fontWeight: 700, letterSpacing: "0.05em", color: "rgba(183,220,245,0.4)", textTransform: "uppercase" }}>
              {lang === "fr" ? "Bientôt disponible" : "Coming soon"}
            </span>
            <button type="button"
              className={`whv-tools-item whv-nav-btn--travel${showTravelPanel ? " active" : ""}`}
              onClick={() => { handleToggleTravel(); setShowToolsMenu(false); }}>
              ✈ {lang === "fr" ? "Voyage" : "Travel"}
            </button>
            <button type="button"
              className={`whv-tools-item whv-nav-btn--alerts${showAlerts ? " active" : ""}`}
              onClick={() => { handleToggleAlerts(); setShowToolsMenu(false); }}>
              🔔 {lang === "fr" ? "Alertes" : "Alerts"}
            </button>
          </div>
        )}
      </div>

      {/* ── Sources ── */}
      <button
        type="button"
        className={`whv-nav-btn whv-nav-btn--sources${showSourcesModal ? " active" : ""}`}
        onClick={() => {
          setShowSourcesModal((v) => !v);
          setShowCountrySelector(false);
          setShowWatchlist(false);
          setRegionDrawerOpen(false);
        }}
        title={lang === "fr" ? "Sources & Méthodologie" : "Sources & Methodology"}
      >
        {t(lang, "sources")}
      </button>

      {/* ── Langue ── */}
      <button
        type="button"
        className="whv-nav-btn whv-nav-btn--lang"
        onClick={toggleLang}
        title={lang === "fr" ? "Switch to English" : "Passer en français"}
      >
        {t(lang, "langue")}
      </button>

      {/* ── Statut des services ── */}
      <span
        className={`whv-service-status ${isOffline ? "whv-service-status--offline" : countriesLoading ? "whv-service-status--loading" : "whv-service-status--online"}`}
        title={isOffline ? "Services backend hors ligne — démarrez gateway, catalog, analytics" : countriesLoading ? "Connexion..." : `${countries.length} pays chargés`}
      >
        <span className="whv-service-status-dot" />
        {isOffline ? "Hors ligne" : countriesLoading ? "..." : "En ligne"}
      </span>

      {showCountrySelector && (
        <CountrySelectorPopover
          countries={countries}
          loading={countriesLoading}
          selectedIso3={selectedCountryIso3}
          watchedIso3s={watchlist}
          onSelect={handleSelectFromPopover}
        />
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

<aside className="whv-mobile-overview" aria-label={lang === "fr" ? "Explorer les pays" : "Explore countries"}>
        <div>
          <span className="whv-mobile-eyebrow">{lang === "fr" ? "L'EXPLORATEUR MONDIAL" : "WORLD EXPLORER"}</span>
          <h2>{lang === "fr" ? "Le monde, en perspective." : "The world, in perspective."}</h2>
          <p className="whv-mobile-overview-description">
            {lang === "fr"
              ? "Touchez un pays sur la carte ou ouvrez sa fiche pour explorer ses indicateurs."
              : "Select a country on the map or open its profile to explore its indicators."}
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
          <span className="whv-mobile-featured-arrow" aria-hidden="true">↗</span>
        </button>
        <div className="whv-mobile-shortcuts">
          <button type="button" className="whv-mobile-shortcut" onClick={() => { setShowCountrySelector(true); setShowToolsMenu(false); }}>
            <span className="whv-mobile-shortcut-symbol" aria-hidden="true">🌍</span>
            <span>{lang === "fr" ? "Pays" : "Countries"}</span>
          </button>
          <button type="button" className="whv-mobile-shortcut" onClick={handleOpenRegions}>
            <span className="whv-mobile-shortcut-symbol" aria-hidden="true">🗺️</span>
            <span>{lang === "fr" ? "Régions" : "Regions"}</span>
          </button>
          <button type="button" className="whv-mobile-shortcut" onClick={() => { setShowToolsMenu(true); setShowCountrySelector(false); }}>
            <span className="whv-mobile-shortcut-symbol" aria-hidden="true">⚙️</span>
            <span>{lang === "fr" ? "Outils" : "Tools"}</span>
          </button>
        </div>
        <p className="whv-mobile-note">
          <strong>{countries.length} {lang === "fr" ? "pays dans le catalogue" : "countries in the catalog"}</strong>
          {" · "}
          {lang === "fr" ? "Explorez les indicateurs provenant des services V2, avec leurs sources et années de référence." : "Explore indicators from the V2 services, including provenance and reference years."}
        </p>
      </aside>

      <Suspense fallback={null}>
      <CountryDrawer
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
      />

      <RegionDrawer
        open={regionDrawerOpen}
        onClose={() => setRegionDrawerOpen(false)}
      />

      {showSourcesModal && (
        <SourceMethodologyModal onClose={() => setShowSourcesModal(false)} />
      )}

      {/* Bandeau hors-ligne */}
      {isOffline && (
        <div className="whv-offline-banner">
          <span className="whv-offline-banner-icon">⚠</span>
          <div>
            <strong>Services backend hors ligne</strong>
            <span>
              Démarrez gateway (8080), catalog (8082) et analytics (8000) pour accéder aux données.
              La carte reste navigable.
            </span>
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