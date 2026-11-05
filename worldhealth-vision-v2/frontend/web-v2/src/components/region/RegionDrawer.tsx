// WorldHealthVision V2 — RegionDrawer
// Fiche économique régionale — design KPI dashboard, cohérent avec CountryDrawer.

import { useMemo, useState } from "react";
import type {
  RegionalEconomicLens,
  RegionalRelativeCostLens,
  RegionSummary,
  RelativeCostDecisionSignal,
} from "../../api/types";
import { useRegionSheet } from "../../hooks/useRegionSheet";
import { useRegions } from "../../hooks/useRegions";
import { pdfSafe } from "../../utils/pdf";
import "../../styles/country.css";

// ---------- dictionnaires ----------

const TONE_FR: Record<string, string> = {
  POSITIVE: "Positif",
  BALANCED: "Équilibré",
  WATCH: "Vigilance",
  STRESS: "Stress",
  CONTEXT: "Contexte",
};

const INDICATOR_NAME_FR: Record<string, string> = {
  "NY.GDP.MKTP.CD":              "PIB (USD courants)",
  "NY.GDP.PCAP.CD":              "PIB par habitant",
  "NY.GDP.MKTP.KD.ZG":          "Croissance PIB",
  "FP.CPI.TOTL.ZG":             "Inflation",
  "SL.UEM.TOTL.ZS":             "Chômage",
  "BN.CAB.XOKA.GD.ZS":          "Balance courante",
  "SP.POP.TOTL":                 "Population totale",
  "SP.DYN.LE00.IN":              "Espérance de vie",
  "SL.TLF.CACT.ZS":             "Taux d'activité",
  "WHV.PRICE.LEVEL.GDP.OECD100": "Niveau de prix (OCDE=100)",
  "WHV.HOUSING.PRICE.REAL.INDEX2015": "Prix immo réels",
  "WHV.SAFETY.HOMICIDE.RATE.P100K":   "Taux d'homicide",
  "SI.POV.GINI":                 "Indice de Gini",
  "IT.NET.USER.ZS":              "Internet (% pop.)",
  "GC.DOD.TOTL.GD.ZS":           "Dette publique",
  "NE.EXP.GNFS.ZS":             "Exportations",
  "NE.IMP.GNFS.ZS":             "Importations",
  "SH.XPD.CHEX.GD.ZS":          "Dépenses santé",
  "SE.XPD.TOTL.GD.ZS":           "Dépenses éducation",
  "EN.ATM.CO2E.PC":             "Émissions CO₂/hab.",
};

const REGION_ICON: Record<string, string> = {
  CONTINENT: "🌍",
  REGION:    "🗺",
  SUBREGION: "📍",
};

const REGION_TYPE_LABEL: Record<string, string> = {
  CONTINENT: "Continent",
  REGION:    "Région",
  SUBREGION: "Sous-région",
};

// ---------- helpers ----------

function fmtCompact(v: number | null | undefined, unit: string): string {
  if (v == null) return "—";
  const abs = Math.abs(v);
  const u = unit.toUpperCase();
  if (u.includes("USD") || u === "USD") {
    if (abs >= 1e12) return `${(v / 1e12).toFixed(2)} T$`;
    if (abs >= 1e9)  return `${(v / 1e9).toFixed(1)} Md$`;
    if (abs >= 1e6)  return `${(v / 1e6).toFixed(1)} M$`;
  }
  if (u === "PERCENT" || u.includes("%")) return `${v.toFixed(1)} %`;
  if (abs >= 1e12) return `${(v / 1e12).toFixed(2)} T`;
  if (abs >= 1e9)  return `${(v / 1e9).toFixed(1)} Md`;
  if (abs >= 1e6)  return `${(v / 1e6).toFixed(1)} M`;
  return v.toLocaleString("fr-FR", { maximumFractionDigits: 2 });
}

// ---------- RegionKpiCard ----------

function RegionKpiCard({ lens }: { lens: RegionalEconomicLens | RegionalRelativeCostLens }) {
  const toneClass = `tone-${lens.signalTone.toLowerCase()}`;
  const label = INDICATOR_NAME_FR[lens.indicatorCode] ?? lens.lensDisplayName;
  const coverage = lens.memberCountryCount > 0
    ? `${lens.comparableCountryCount}/${lens.memberCountryCount} pays`
    : null;

  return (
    <div className={`kpi-card ${toneClass}`}>
      <p className="kpi-card-label">{label}</p>
      <p className="kpi-card-value">
        {fmtCompact(lens.medianComparableValue, lens.unitLabel)}
      </p>
      <div className="kpi-card-trend">
        <span className={`tone-pill ${toneClass}`} style={{ padding: "2px 8px", fontSize: 10 }}>
          {TONE_FR[lens.signalTone] ?? lens.signalTone}
        </span>
        {coverage && (
          <span style={{ fontSize: 10, color: "rgba(183,220,245,0.50)" }}>
            {coverage}
          </span>
        )}
        {lens.latestPeriodLabel && (
          <span style={{ fontSize: 10, color: "rgba(183,220,245,0.40)", marginLeft: "auto" }}>
            {lens.latestPeriodLabel}
          </span>
        )}
      </div>
    </div>
  );
}

// ---------- RegionLensCard (expandable) ----------

function RegionLensCard({
  lens,
  expanded,
  onToggle,
}: {
  lens: RegionalEconomicLens | RegionalRelativeCostLens;
  expanded: boolean;
  onToggle: () => void;
}) {
  const toneClass = `tone-${lens.signalTone.toLowerCase()}`;
  const label = INDICATOR_NAME_FR[lens.indicatorCode] ?? lens.lensDisplayName;

  return (
    <div
      className={`indicator-card ${expanded ? "expanded" : ""}`}
      onClick={onToggle}
      role="button"
      aria-expanded={expanded}
      tabIndex={0}
      onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") onToggle(); }}
    >
      <div className="indicator-card-header">
        <span className={`tone-pill ${toneClass}`} style={{ flexShrink: 0, fontSize: 10 }}>
          {TONE_FR[lens.signalTone] ?? lens.signalTone}
        </span>
        <div className="indicator-name-block">
          <p className="indicator-name">{label}</p>
        </div>
        <div className="indicator-value-block">
          <span className="indicator-main-value">
            {fmtCompact(lens.medianComparableValue, lens.unitLabel)}
          </span>
          <span className="indicator-trend-line" style={{ color: "rgba(183,220,245,0.55)" }}>
            médiane {lens.latestPeriodLabel ? `• ${lens.latestPeriodLabel}` : ""}
          </span>
        </div>
        <span className="indicator-expand-icon">▼</span>
      </div>

      {lens.headline && (
        <p className="indicator-card-headline">{lens.headline}</p>
      )}

      {expanded && (
        <div
          className="indicator-expanded-content"
          onClick={(e) => e.stopPropagation()}
        >
          {lens.narrative && (
            <p style={{ fontSize: 13, color: "rgba(183,220,245,0.72)", lineHeight: 1.55, margin: 0 }}>
              {lens.narrative}
            </p>
          )}
          {lens.whyItMatters && (
            <p style={{ fontSize: 12, color: "rgba(183,220,245,0.5)", lineHeight: 1.5, margin: 0 }}>
              <strong style={{ color: "rgba(183,220,245,0.65)", fontWeight: 600 }}>Pourquoi ça compte :</strong>{" "}
              {lens.whyItMatters}
            </p>
          )}
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 4 }}>
            {lens.memberCountryCount > 0 && (
              <span style={{ fontSize: 11, color: "rgba(183,220,245,0.45)" }}>
                📊 {lens.comparableCountryCount}/{lens.memberCountryCount} pays couverts
              </span>
            )}
            {lens.selectedSourceCode && (
              <span style={{ fontSize: 11, color: "rgba(183,220,245,0.45)" }}>
                🔍 {lens.selectedSourceCode}
                {lens.selectedDatasetCode ? ` • ${lens.selectedDatasetCode}` : ""}
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ---------- DecisionSignalCard ----------

function DecisionSignalCard({ signal }: { signal: RelativeCostDecisionSignal }) {
  const [expanded, setExpanded] = useState(false);
  const toneClass = `tone-${(signal.signalTone ?? "context").toLowerCase()}`;

  return (
    <div
      className={`indicator-card ${expanded ? "expanded" : ""}`}
      onClick={() => setExpanded((v) => !v)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") setExpanded((v) => !v); }}
    >
      <div className="indicator-card-header">
        <span className={`tone-pill ${toneClass}`} style={{ flexShrink: 0, fontSize: 10 }}>
          {TONE_FR[signal.signalTone] ?? signal.signalTone}
        </span>
        <div className="indicator-name-block">
          <p className="indicator-name">{signal.decisionDisplayName}</p>
        </div>
        <span className="indicator-expand-icon">▼</span>
      </div>

      {signal.headline && (
        <p className="indicator-card-headline">{signal.headline}</p>
      )}

      {expanded && (
        <div
          className="indicator-expanded-content"
          onClick={(e) => e.stopPropagation()}
        >
          {signal.narrative && (
            <p style={{ fontSize: 13, color: "rgba(183,220,245,0.72)", lineHeight: 1.55, margin: 0 }}>
              {signal.narrative}
            </p>
          )}
          {signal.whyItMatters && (
            <p style={{ fontSize: 12, color: "rgba(183,220,245,0.5)", lineHeight: 1.5, margin: 0 }}>
              <strong style={{ color: "rgba(183,220,245,0.65)", fontWeight: 600 }}>Pourquoi ça compte :</strong>{" "}
              {signal.whyItMatters}
            </p>
          )}
          {signal.cautionaryNotes.length > 0 && (
            <ul style={{ margin: 0, paddingLeft: 16, display: "grid", gap: 4 }}>
              {signal.cautionaryNotes.map((note) => (
                <li key={note} style={{ fontSize: 12, color: "rgba(251,191,36,0.75)" }}>{note}</li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}

// ---------- sélecteur de région ----------

function RegionSelector({
  regions,
  selectedCode,
  onSelect,
  loading,
}: {
  regions: RegionSummary[];
  selectedCode: string;
  onSelect: (code: string) => void;
  loading: boolean;
}) {
  const byType = useMemo(() => {
    const groups: Record<string, RegionSummary[]> = {};
    for (const r of regions) {
      if (!groups[r.type]) groups[r.type] = [];
      groups[r.type].push(r);
    }
    return groups;
  }, [regions]);

  return (
    <div>
      <label className="country-select-label" htmlFor="region-select">
        {loading ? "Chargement..." : `${regions.length} régions disponibles`}
      </label>
      <select
        id="region-select"
        className="country-select"
        value={selectedCode}
        onChange={(e) => onSelect(e.target.value)}
        disabled={loading || regions.length === 0}
      >
        {Object.entries(byType).map(([type, items]) => (
          <optgroup key={type} label={REGION_TYPE_LABEL[type] ?? type}>
            {items.map((r) => (
              <option key={r.code} value={r.code}>
                {r.displayName} ({r.countryCount} pays)
              </option>
            ))}
          </optgroup>
        ))}
      </select>
    </div>
  );
}

// ---------- export PDF ----------

async function downloadRegionPdf(
  regionLabel: string,
  highlights: string[],
  kpiLenses: (RegionalEconomicLens | RegionalRelativeCostLens)[],
) {
  try {
    const { jsPDF } = await import("jspdf");
    const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
    let y = 15;

    doc.setFontSize(18);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(10, 60, 100);
    doc.text("World Health Vision", 15, y);
    y += 9;

    doc.setFontSize(14);
    doc.setTextColor(30, 30, 60);
    doc.text(pdfSafe(`${regionLabel} — Fiche régionale`), 15, y);
    y += 7;

    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(100, 120, 140);
    doc.text(pdfSafe(`Généré le ${new Date().toLocaleDateString("fr-FR")} • World Health Vision V2`), 15, y);
    y += 8;

    doc.setDrawColor(77, 150, 210);
    doc.setLineWidth(0.4);
    doc.line(15, y, 195, y);
    y += 8;

    if (highlights.length > 0) {
      doc.setFontSize(12);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(10, 60, 100);
      doc.text("Points clés", 15, y);
      y += 6;
      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      doc.setTextColor(40, 40, 70);
      for (const h of highlights) {
        if (y > 270) { doc.addPage(); y = 15; }
        const lines = doc.splitTextToSize(pdfSafe(`• ${h}`), 175) as string[];
        doc.text(lines, 18, y);
        y += 5.8 * lines.length;
      }
      y += 4;
    }

    if (kpiLenses.length > 0) {
      if (y > 255) { doc.addPage(); y = 15; }
      doc.setFontSize(12);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(10, 60, 100);
      doc.text("Indicateurs clés (médiane régionale)", 15, y);
      y += 6;
      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      for (const lens of kpiLenses) {
        if (y > 270) { doc.addPage(); y = 15; }
        const label = INDICATOR_NAME_FR[lens.indicatorCode] ?? lens.lensDisplayName;
        const value = `${fmtCompact(lens.medianComparableValue, lens.unitLabel)}  ${lens.latestPeriodLabel ?? ""}`;
        doc.setFont("helvetica", "bold");
        doc.setTextColor(30, 70, 120);
        doc.text(pdfSafe(`${label} :`), 18, y);
        doc.setFont("helvetica", "normal");
        doc.setTextColor(40, 40, 70);
        doc.text(pdfSafe(value), 105, y);
        y += 5.8;
      }
    }

    doc.save(`region_${regionLabel.replace(/\s+/g, "_")}_WHV_${new Date().toISOString().slice(0, 10)}.pdf`);
  } catch {
    // jsPDF non disponible
  }
}

// ---------- export principal ----------

type RegionDrawerProps = {
  open: boolean;
  onClose: () => void;
};

export default function RegionDrawer({ open, onClose }: RegionDrawerProps) {
  const [fullscreen, setFullscreen] = useState(false);
  const [expandedLens, setExpandedLens] = useState<string | null>(null);

  const { regions: allRegions, loading: regionsLoading } = useRegions();
  const regions = useMemo(
    () => allRegions.filter((r) => r.countryCount > 0),
    [allRegions],
  );

  const defaultCode = regions[0]?.code ?? "";
  const [selectedCode, setSelectedCode] = useState<string>("");
  const activeCode = selectedCode || defaultCode;

  const { economicSnapshot, relativeCostSnapshot, loading, error } = useRegionSheet(
    activeCode,
    open && !!activeCode,
  );

  const activeRegion = regions.find((r) => r.code === activeCode);
  const regionType = activeRegion?.type ?? economicSnapshot?.region.type ?? "REGION";
  const regionIcon = REGION_ICON[regionType] ?? "🗺";

  const regionLabel =
    economicSnapshot?.region.displayName ??
    activeRegion?.displayName ??
    "Fiche régionale";

  const regionSubtitle = [
    REGION_TYPE_LABEL[regionType],
    activeRegion ? `${activeRegion.countryCount} pays` : null,
    economicSnapshot ? `${economicSnapshot.lensCount} indicateurs` : null,
  ]
    .filter(Boolean)
    .join(" · ");

  const combinedHighlights = useMemo(() => {
    const all = [
      ...(economicSnapshot?.highlights ?? []),
      ...(relativeCostSnapshot?.highlights ?? []),
    ];
    return [...new Set(all)].slice(0, 6);
  }, [economicSnapshot?.highlights, relativeCostSnapshot?.highlights]);

  // On n'affiche que les indicateurs ayant une donnée pour cette région
  // (cohérence géographique : pas de "—" pour une source qui ne couvre pas la région).
  const regionLenses = (economicSnapshot?.lenses ?? []).filter(
    (l) => l.medianComparableValue !== null,
  );
  const kpiLenses = regionLenses.slice(0, 4);
  const remainingLenses = regionLenses.slice(4);

  function toggleLens(code: string) {
    setExpandedLens((prev) => (prev === code ? null : code));
  }

  return (
    <aside
      className={`country-drawer region-drawer ${open ? "open" : ""} ${fullscreen ? "fullscreen" : ""}`}
    >
      {/* En-tête */}
      <div className="country-drawer-header">
        <div className="country-hero">
          <span className="country-hero-flag" aria-hidden="true">{regionIcon}</span>
          <div style={{ flex: 1, minWidth: 0 }}>
            <h2 className="country-drawer-title">{regionLabel}</h2>
            {regionSubtitle && (
              <p className="country-drawer-subtitle">{regionSubtitle}</p>
            )}
          </div>
        </div>
        <div className="country-drawer-actions">
          <button
            type="button"
            className="drawer-btn"
            title="Exporter PDF"
            disabled={!economicSnapshot}
            onClick={() => { void downloadRegionPdf(regionLabel, combinedHighlights, [...kpiLenses, ...remainingLenses]); }}
          >
            PDF
          </button>
          <button
            type="button"
            className="drawer-btn"
            onClick={() => setFullscreen(!fullscreen)}
          >
            {fullscreen ? "Nrm" : "Max"}
          </button>
          <button type="button" className="drawer-btn close" onClick={onClose}>
            ✕
          </button>
        </div>
      </div>

      {/* Corps scrollable */}
      <div className="country-drawer-body">

        {/* Sélecteur de région */}
        <RegionSelector
          regions={regions}
          selectedCode={activeCode}
          onSelect={(code) => {
            setSelectedCode(code);
            setExpandedLens(null);
          }}
          loading={regionsLoading}
        />

        {/* Chargement / erreur */}
        {loading && (
          <div className="info-card">
            <p style={{ color: "rgba(183,220,245,0.72)", margin: 0 }}>
              Chargement du snapshot régional...
            </p>
          </div>
        )}
        {error && (
          <div className="info-card">
            <p className="drawer-error">{error}</p>
            <p className="drawer-hint">Vérifiez les services analytics et gateway.</p>
          </div>
        )}

        {!loading && !error && (
          <>
            {/* KPI strip — 4 indicateurs principaux */}
            {kpiLenses.length >= 2 && (
              <div>
                <p className="section-title" style={{ marginBottom: 8 }}>
                  Indicateurs clés — médiane régionale
                </p>
                <div className="kpi-strip">
                  {kpiLenses.map((lens) => (
                    <RegionKpiCard key={lens.lensCode} lens={lens} />
                  ))}
                </div>
              </div>
            )}

            {/* Points clés */}
            {combinedHighlights.length > 0 && (
              <div className="section-block">
                <p className="section-title">Points clés</p>
                <div className="info-card">
                  <ul className="highlight-list">
                    {combinedHighlights.map((h) => (
                      <li key={h}>{h}</li>
                    ))}
                  </ul>
                </div>
              </div>
            )}

            {/* Autres indicateurs macro (expandables) */}
            {remainingLenses.length > 0 && (
              <div className="section-block">
                <p className="section-title">Tous les indicateurs</p>
                {remainingLenses.map((lens) => (
                  <RegionLensCard
                    key={lens.lensCode}
                    lens={lens}
                    expanded={expandedLens === lens.lensCode}
                    onToggle={() => toggleLens(lens.lensCode)}
                  />
                ))}
              </div>
            )}

            {/* Signaux de décision (affordability) */}
            {relativeCostSnapshot && relativeCostSnapshot.decisionSignals.length > 0 && (
              <div className="section-block">
                <p className="section-title">
                  Décisions · Accessibilité ({relativeCostSnapshot.decisionSignals.length})
                </p>
                {relativeCostSnapshot.decisionSignals.map((sig) => (
                  <DecisionSignalCard key={sig.decisionCode} signal={sig} />
                ))}
              </div>
            )}

            {/* Lenses coût relatif */}
            {relativeCostSnapshot && relativeCostSnapshot.lenses.length > 0 && (
              <div className="section-block">
                <p className="section-title">Coût et accessibilité</p>
                {relativeCostSnapshot.lenses.map((lens) => (
                  <RegionLensCard
                    key={lens.lensCode}
                    lens={lens}
                    expanded={expandedLens === lens.lensCode}
                    onToggle={() => toggleLens(lens.lensCode)}
                  />
                ))}
              </div>
            )}

            {/* État vide */}
            {!economicSnapshot && activeCode && (
              <div className="info-card">
                <p style={{ color: "rgba(183,220,245,0.65)", margin: 0, fontSize: 13 }}>
                  Aucune donnée disponible pour cette région.
                </p>
              </div>
            )}
          </>
        )}
      </div>
    </aside>
  );
}