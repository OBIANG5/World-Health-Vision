// WorldHealthVision V2 — SourceMethodologyModal
// Affiche le catalogue complet des sources : type, biais, qualité, licence, liens.
// Ouvert depuis le bouton "Sources" dans la nav principale.

import { useEffect, useRef, useState } from "react";
import type { CountryLocalCoverageOverview, SourceDataCoverage, SourceDetail } from "../../api/types";
import { fetchCountrySourceCoverage, fetchSourceDataCoverage, fetchSources } from "../../api/whvApi";
import { useLang } from "../../context/LanguageContext";
import type { Lang } from "../../context/LanguageContext";

// ---------------------------------------------------------------------------
// Labels inline — spécifiques à ce composant
// ---------------------------------------------------------------------------

const L = {
  fr: {
    title: "Sources & Méthodologie",
    subtitle:
      "Référentiel des sources enregistrées dans World Health Vision. La plateforme confronte les observations disponibles et rend leurs biais visibles.",
    close: "Fermer",
    organisation: "Organisation",
    porteeGeo: "Portée géographique",
    cadence: "Mise à jour",
    acces: "Accès",
    licence: "Licence",
    biais: "Biais à connaître",
    qualite: "Notes qualité",
    documentation: "Documentation",
    siteOfficiel: "Site officiel",
    loading: "Chargement des sources...",
    coverageLoading: "Vérification des observations présentes dans la base…",
    numericObserved: "Mesures chiffrées",
    error: "Impossible de charger les sources. Vérifier que le backend est actif.",
    search: "Rechercher une source",
    all: "Toutes",
    available: "Avec données",
    absent: "Sans données",
    unknown: "Disponibilité des observations non vérifiable : le service de séries temporelles n'est pas connecté.",
    preview: "Cet aperçu présente les sources enregistrées. Leur couverture réelle sera vérifiée après connexion à la base de données.",
    observed: "Observations mesurées",
    estimated: "Estimations",
    coveredCountries: "Pays avec valeurs",
    lastPeriod: "Dernière période",
    lastFetched: "Dernière collecte",
    noValues: "Source répertoriée, aucune observation utilisable dans la base",
    measured: "Données mesurées disponibles",
    estimatesOnly: "Estimations uniquement",
    notVerified: "Données non vérifiables",
    noMatch: "Aucune source ne correspond à cette recherche.",
    localCoverageTitle: "Couverture des sources nationales — état réel",
    localCoverageTitlePreview: "Sources nationales — extrait versionné du catalogue V2",
    localCoverageSnapshot: "APERÇU STATIQUE · Ces chiffres sont calculés à partir des migrations SQL V24–V26 du projet (12 novembre 2026). Ce n'est ni une interrogation en direct ni une preuve que des données économiques sont collectées.",
    localCoverageLoading: "Vérification du registre des pays et des sources nationales…",
    localCoverageUnknown: "Couverture nationale non vérifiable : le catalogue connecté n'est pas disponible.",
    localCoveragePreview: "En aperçu statique, aucune couverture nationale n'est confirmée.",
    locallyStarted: "pays avec recherche locale partielle",
    regionOnly: "pays avec uniquement une institution régionale partagée",
    unresearched: "pays sans recherche locale dans le catalogue",
    connected: "sources locales marquées comme connectées",
    localCoverageCaution: "Un pays répertorié n'est pas un pays couvert exhaustivement. Une source identifiée ne signifie pas un connecteur actif ni une publication réutilisable.",

  },
  en: {
    title: "Sources & Methodology",
    subtitle:
      "Catalogue of sources registered in World Health Vision. The platform compares available observations and exposes their limitations.",
    close: "Close",
    organisation: "Organization",
    porteeGeo: "Geographic coverage",
    cadence: "Update cadence",
    acces: "Access",
    licence: "License",
    biais: "Bias notes",
    qualite: "Quality notes",
    documentation: "Documentation",
    siteOfficiel: "Official website",
    loading: "Loading sources...",
    coverageLoading: "Checking observations present in the data store…",
    numericObserved: "Numeric measurements",
    error: "Failed to load sources. Check that the backend is running.",
    search: "Search a source",
    all: "All",
    available: "With data",
    absent: "Without data",
    unknown: "Observation availability cannot be verified: the time-series service is not connected.",
    preview: "This preview lists registered sources. Real availability requires the connected data store.",
    observed: "Measured observations",
    estimated: "Estimates",
    coveredCountries: "Countries with values",
    lastPeriod: "Latest data period",
    lastFetched: "Latest fetch",
    noValues: "Registered source, no usable observations in the database",
    measured: "Measured data available",
    estimatesOnly: "Estimates only",
    notVerified: "Data not verifiable",
    noMatch: "No sources match this search.",
    localCoverageTitle: "National source coverage — real status",
    localCoverageTitlePreview: "National sources — versioned V2 catalog snapshot",
    localCoverageSnapshot: "STATIC PREVIEW · These counts are derived from project SQL migrations V24–V26 (November 12, 2026). This is not a live backend query or proof of economic data collection.",
    localCoverageLoading: "Checking country and national-source research coverage…",
    localCoverageUnknown: "Country source coverage cannot be verified: the connected catalog is unavailable.",
    localCoveragePreview: "Static preview cannot confirm country source research coverage.",
    locallyStarted: "countries with partial local research",
    regionOnly: "countries with a shared regional institution only",
    unresearched: "countries without local research in the catalog",
    connected: "local sources marked as connected",
    localCoverageCaution: "A listed country is not exhaustively researched. A registered organization is not an active connector or permission to reuse its publications.",

  },
} as const;

// ---------------------------------------------------------------------------
// Données de présentation par type
// ---------------------------------------------------------------------------

const TYPE_META: Record<string, { bg: string; color: string; fr: string; en: string }> = {
  OFFICIAL: { bg: "rgba(37,99,235,0.15)", color: "#60a5fa", fr: "Officiel", en: "Official" },
  RESEARCH: { bg: "rgba(124,58,237,0.15)", color: "#a78bfa", fr: "Recherche", en: "Research" },
  COMMUNITY: { bg: "rgba(5,150,105,0.15)", color: "#34d399", fr: "Communautaire", en: "Community" },
  MARKET: { bg: "rgba(217,119,6,0.15)", color: "#fbbf24", fr: "Terrain / Marché", en: "Market data" },
};

const TYPE_ORDER = ["OFFICIAL", "RESEARCH", "COMMUNITY", "MARKET"];

const SCOPE_FR: Record<string, string> = {
  GLOBAL: "Mondial",
  MULTI_REGION: "Multi-régional",
  EUROPE: "Europe",
  REGIONAL: "Régional",
  LOCAL: "Local",
};

const SCOPE_EN: Record<string, string> = {
  GLOBAL: "Global",
  MULTI_REGION: "Multi-regional",
  EUROPE: "Europe",
  REGIONAL: "Regional",
  LOCAL: "Local",
};

const CADENCE_FR: Record<string, string> = {
  PERIODIC: "Périodique",
  ANNUAL: "Annuel",
  QUARTERLY: "Trimestriel",
  CONTINUOUS: "Continu",
  AD_HOC: "Ponctuel",
};

const CADENCE_EN: Record<string, string> = {
  PERIODIC: "Periodic",
  ANNUAL: "Annual",
  QUARTERLY: "Quarterly",
  CONTINUOUS: "Continuous",
  AD_HOC: "Ad-hoc",
};

const ACCESS_FR: Record<string, string> = {
  OPEN: "Ouvert",
  REGISTRATION: "Inscription / Clé API",
  API_KEY: "Clé API",
  LIMITED: "Accès limité",
  COMMERCIAL: "Commercial",
};

const ACCESS_EN: Record<string, string> = {
  OPEN: "Open",
  REGISTRATION: "Registration / API key",
  API_KEY: "API key",
  LIMITED: "Limited access",
  COMMERCIAL: "Commercial",
};

function lv(mapFr: Record<string, string>, mapEn: Record<string, string>, key: string | null, lang: Lang): string {
  if (!key) return "—";
  return (lang === "fr" ? mapFr[key] : mapEn[key]) ?? key;
}

// ---------------------------------------------------------------------------
// Composant
// ---------------------------------------------------------------------------

export default function SourceMethodologyModal({ onClose }: { onClose: () => void }) {
  const lang = useLang();
  const l = L[lang];
  const isPreview = import.meta.env.VITE_WHV_PREVIEW_MODE === "true";
  const [sources, setSources] = useState<SourceDetail[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [coverage, setCoverage] = useState<Map<string, SourceDataCoverage> | null>(null);
  const [nationalCoverage, setNationalCoverage] = useState<CountryLocalCoverageOverview | null>(null);
  const [nationalCoverageState, setNationalCoverageState] = useState<"loading" | "available" | "unavailable">("loading");
  const [coverageState, setCoverageState] = useState<"loading" | "available" | "unavailable">(
    isPreview ? "unavailable" : "loading",
  );
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | "available" | "absent">("all");
  const overlayRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let mounted = true;
    fetchSources()
      .then((items) => { if (mounted) setSources(items); })
      .catch(() => { if (mounted) setError(l.error); });
    return () => { mounted = false; };
  }, [l.error]);

  useEffect(() => {
    if (isPreview) return;
    let mounted = true;
    fetchSourceDataCoverage()
      .then((items) => {
        if (!mounted) return;
        setCoverage(new Map(items.map((item) => [item.sourceCode, item])));
        setCoverageState("available");
      })
      .catch(() => { if (mounted) setCoverageState("unavailable"); });
    return () => { mounted = false; };
  }, [isPreview]);

  useEffect(() => {
    // In static mode fetch() is intentionally served by the audited,
    // migration-derived versioned snapshot. Never label it as live evidence.
    let mounted = true;
    fetchCountrySourceCoverage()
      .then((data) => {
        if (!mounted) return;
        setNationalCoverage(data);
        setNationalCoverageState("available");
      })
      .catch(() => { if (mounted) setNationalCoverageState("unavailable"); });
    return () => { mounted = false; };
  }, [isPreview]);

  // Fermer sur Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  const sorted = sources
    ? [...sources].sort((a, b) => {
        const aRank = TYPE_ORDER.indexOf(a.type);
        const bRank = TYPE_ORDER.indexOf(b.type);
        return (aRank < 0 ? TYPE_ORDER.length : aRank) -
          (bRank < 0 ? TYPE_ORDER.length : bRank);
      })
    : null;
  const withObserved = sorted?.filter((s) => (coverage?.get(s.code)?.observedRecordCount ?? 0) > 0).length ?? 0;
  const withEstimatesOnly = sorted?.filter((s) => {
    const item = coverage?.get(s.code);
    return item && item.observedRecordCount === 0 && item.estimatedRecordCount > 0;
  }).length ?? 0;
  const withNoValues = sorted && coverageState === "available"
    ? sorted.length - withObserved - withEstimatesOnly
    : 0;
  const visible = sorted?.filter((source) => {
    const query = search.trim().toLocaleLowerCase();
    if (query && !(`${source.displayName} ${source.organizationName} ${source.code}`).toLocaleLowerCase().includes(query)) {
      return false;
    }
    if (coverageState !== "available" || filter === "all") return true;
    const item = coverage?.get(source.code);
    const hasValues = !!item && (item.observedRecordCount > 0 || item.estimatedRecordCount > 0);
    return filter === "available" ? hasValues : !hasValues;
  });

  return (
    <div
      className="whv-modal-overlay"
      ref={overlayRef}
      onClick={(e) => {
        if (e.target === overlayRef.current) onClose();
      }}
    >
      <div className="whv-modal" role="dialog" aria-modal="true" aria-label={l.title}>
        {/* En-tête */}
        <div className="whv-modal-header">
          <div>
            <h2 className="whv-modal-title">{l.title}</h2>
            <p className="whv-modal-subtitle">{l.subtitle}</p>
          </div>
          <button type="button" className="whv-modal-close" onClick={onClose}>
            {l.close} ✕
          </button>
        </div>

        {/* Corps */}
        <div className="whv-modal-body">
          {error && <p className="whv-modal-message whv-modal-message--error">{error}</p>}
          {!error && !sorted && (
            <p className="whv-modal-message">{l.loading}</p>
          )}

          {sorted && (
            <>
              <p style={{ margin: "0 0 12px", fontSize: 13, color: "rgba(190,226,245,.77)" }}>
                {sorted.length} {lang === "fr" ? "sources répertoriées dans le catalogue V2" : "sources registered in the V2 catalog"}.
                {isPreview && (
                  <span> {lang === "fr"
                    ? "Mode aperçu : cette liste provient des migrations SQL de la V2. Une source répertoriée n'implique pas que ses données soient déjà ingérées ou actualisées."
                    : "Preview mode: entries are generated from V2 SQL migrations. A registered source does not mean its observations have been ingested or refreshed."}</span>
                )}
              </p>
              <details className="whv-national-coverage-overview">
                <summary>{isPreview ? l.localCoverageTitlePreview : l.localCoverageTitle}</summary>
                <div className="whv-national-coverage-overview-body" role="status">
                  {nationalCoverageState === "loading" && <p>{l.localCoverageLoading}</p>}
                  {nationalCoverageState === "unavailable" && (
                    <p>{isPreview ? l.localCoveragePreview : l.localCoverageUnknown}</p>
                  )}
                  {nationalCoverageState === "available" && nationalCoverage && (
                    <>
                      {isPreview && <p className="whv-national-coverage-caution"><strong>{l.localCoverageSnapshot}</strong></p>}
                      <p>
                        <strong>{nationalCoverage.totalCountryCount}</strong>{" "}
                        {lang === "fr" ? "pays et territoires actifs du registre" : "active countries and territories in the registry"}.
                      </p>
                      <div className="whv-national-coverage-metrics">
                        <span><strong>{nationalCoverage.countriesWithCountrySpecificSources}</strong> {l.locallyStarted}</span>
                        <span><strong>{nationalCoverage.countriesWithRegionalReferencesOnly}</strong> {l.regionOnly}</span>
                        <span><strong>{nationalCoverage.countriesNotResearchedLocally}</strong> {l.unresearched}</span>
                        <span><strong>{nationalCoverage.verifiedIngestionLinks}</strong> {l.connected}</span>
                      </div>
                      <p className="whv-national-coverage-caution">{l.localCoverageCaution}</p>
                      <p className="whv-national-coverage-country-names">
                        {nationalCoverage.items
                          .filter((country) => country.researchStatus === "PARTIAL_CATALOGUED")
                          .map((country) => country.displayName).join(" · ")}
                      </p>
                    </>
                  )}
                </div>
              </details>

              <div className="whv-source-coverage-overview" role="status">
                {coverageState === "available"
                  ? (lang === "fr"
                    ? `${withObserved} sources avec mesures · ${withEstimatesOnly} avec estimations seules · ${withNoValues} sans observation utilisable`
                    : `${withObserved} sources with measured values · ${withEstimatesOnly} estimates only · ${withNoValues} without usable observations`)
                  : (isPreview ? l.preview : coverageState === "loading" ? l.coverageLoading : l.unknown)}
              </div>
              <div className="whv-source-controls">
                <label htmlFor="whv-source-search">{l.search}</label>
                <input
                  id="whv-source-search"
                  type="search"
                  value={search}
                  placeholder={l.search}
                  onChange={(event) => setSearch(event.target.value)}
                />
                <div className="whv-source-filters" role="group" aria-label={l.title}>
                  {(["all", "available", "absent"] as const).map((key) => (
                    <button
                      key={key}
                      type="button"
                      className={filter === key ? "active" : ""}
                      aria-pressed={filter === key}
                      disabled={coverageState !== "available" && key !== "all"}
                      onClick={() => setFilter(key)}
                    >
                      {l[key]}
                    </button>
                  ))}
                </div>
              </div>
              {visible?.length === 0 && <p className="whv-modal-message">{l.noMatch}</p>}
              <div className="whv-source-grid">
              {visible?.map((s) => {
                const data = coverage?.get(s.code);
                const observed = data?.observedRecordCount ?? 0;
                const estimated = data?.estimatedRecordCount ?? 0;
                const verified = coverageState === "available";
                const hasValues = observed > 0 || estimated > 0;
                const statusText = !verified
                  ? l.notVerified
                  : observed > 0 ? l.measured : estimated > 0 ? l.estimatesOnly : l.noValues;
                const meta = TYPE_META[s.type] ?? {
                  bg: "rgba(255,255,255,0.06)",
                  color: "#999",
                  fr: s.type,
                  en: s.type,
                };
                return (
                  <div key={s.code} className="whv-source-card">
                    {/* Nom + badge type */}
                    <div className="whv-source-card-header">
                      <span className="whv-source-card-name">{s.displayName}</span>
                      <span
                        className="whv-source-type-badge"
                        style={{ background: meta.bg, color: meta.color }}
                      >
                        {lang === "fr" ? meta.fr : meta.en}
                      </span>
                    </div>

                    <div className="whv-source-coverage" data-coverage={verified ? (hasValues ? "available" : "absent") : "unknown"}>
                      <strong>{statusText}</strong>
                      {verified && data && hasValues && (
                        <div className="whv-source-coverage-detail">
                          <span>{l.observed} : {observed.toLocaleString(lang)}</span>
                          <span>{l.numericObserved} : {data.observedNumericCount.toLocaleString(lang)}</span>
                          <span>{l.estimated} : {estimated.toLocaleString(lang)}</span>
                          <span>{l.coveredCountries} : {data.coveredCountryCount.toLocaleString(lang)}</span>
                          {data.latestAvailablePeriodStart && <span>{l.lastPeriod} : {data.latestAvailablePeriodStart}</span>}
                          {data.latestDataFetchedAtUtc && <span>{l.lastFetched} : {data.latestDataFetchedAtUtc.slice(0, 10)}</span>}
                        </div>
                      )}
                    </div>
                    {/* Organisation */}
                    <p className="whv-source-meta">
                      {l.organisation} :{" "}
                      <strong style={{ color: "rgba(183,220,245,0.82)" }}>
                        {s.organizationName}
                      </strong>
                    </p>

                    {/* Pills : portée + cadence + accès */}
                    <div className="whv-source-pills">
                      <span className="whv-pill whv-pill--scope">
                        {lv(SCOPE_FR, SCOPE_EN, s.geographicScope, lang)}
                      </span>
                      {s.updateCadence && (
                        <span className="whv-pill whv-pill--cadence">
                          {lv(CADENCE_FR, CADENCE_EN, s.updateCadence, lang)}
                        </span>
                      )}
                      <span className="whv-pill whv-pill--access">
                        {lv(ACCESS_FR, ACCESS_EN, s.accessModel, lang)}
                      </span>
                    </div>

                    {/* Biais */}
                    {s.biasNotes && (
                      <div className="whv-source-box whv-source-box--bias">
                        <span className="whv-source-box-label">{l.biais}</span>
                        <span>{s.biasNotes}</span>
                      </div>
                    )}

                    {/* Qualité */}
                    {s.qualityNotes && (
                      <div className="whv-source-box whv-source-box--quality">
                        <span className="whv-source-box-label">{l.qualite}</span>
                        <span>{s.qualityNotes}</span>
                      </div>
                    )}

                    {/* Licence */}
                    {s.licenseSummary && (
                      <div className="whv-source-box whv-source-box--license">
                        <span className="whv-source-box-label">{l.licence}</span>
                        <span>{s.licenseSummary}</span>
                      </div>
                    )}

                    {/* Liens */}
                    <div className="whv-source-links">
                      {s.homepageUrl && (
                        <a
                          href={s.homepageUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="whv-source-link"
                        >
                          {l.siteOfficiel} ↗
                        </a>
                      )}
                      {s.documentationUrl && (
                        <a
                          href={s.documentationUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="whv-source-link"
                        >
                          {l.documentation} ↗
                        </a>
                      )}
                    </div>
                  </div>
                );
              })}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}