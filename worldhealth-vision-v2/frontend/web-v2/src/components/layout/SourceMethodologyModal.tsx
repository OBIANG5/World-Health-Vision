// WorldHealthVision V2 — SourceMethodologyModal
// Affiche le catalogue complet des sources : type, biais, qualité, licence, liens.
// Ouvert depuis le bouton "Sources" dans la nav principale.

import { useEffect, useRef, useState } from "react";
import type { SourceDetail } from "../../api/types";
import { fetchSources } from "../../api/whvApi";
import { useLang } from "../../context/LanguageContext";
import type { Lang } from "../../context/LanguageContext";

// ---------------------------------------------------------------------------
// Labels inline — spécifiques à ce composant
// ---------------------------------------------------------------------------

const L = {
  fr: {
    title: "Sources & Méthodologie",
    subtitle:
      "Référentiel des sources de données utilisées par World Health Vision. La plateforme ne masque pas les biais — elle les expose.",
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
    error: "Impossible de charger les sources. Vérifier que le backend est actif.",
  },
  en: {
    title: "Sources & Methodology",
    subtitle:
      "Reference catalogue of data sources used by World Health Vision. The platform doesn't hide biases — it exposes them.",
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
    error: "Failed to load sources. Check that the backend is running.",
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
  const overlayRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchSources()
      .then((items) => setSources(items))
      .catch(() => setError(l.error));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
              <div className="whv-source-grid">
              {sorted.map((s) => {
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