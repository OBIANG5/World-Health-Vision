// WorldHealthVision V2 — RetirementPanel
// Module retraite / expatriation : pour un budget mensuel donné, classe les destinations
// par accessibilité financière, qualité de vie et attractivité pour les expatriés.
// Données : GENERAL_COST_LEVEL (coût), PROSPERITY_LEVEL (qualité de vie), LABOR_STRESS (sécurité)
// Multi-sources : confidence + agreement affichés pour chaque pays.

import { useCallback, useEffect, useRef, useState } from "react";
import type { CountryEconomicSnapshotResponse, CountryRelativeCostSnapshotResponse, CountrySummary } from "../../api/types";
import { fetchCountryEconomicSnapshot, fetchCountryRelativeCostSnapshot } from "../../api/whvApi";
import { useLang } from "../../context/LanguageContext";
import { useUserProfile } from "../../context/UserProfileContext";
import {WorldIcon} from "../ui/WorldIcon";
import "../../styles/retirement.css";

// ---------- destinations populaires (retraite + expat) ----------

const EXPAT_ISO3 = [
  "PRT","ESP","ITA","GRC","HRV","CYP","MLT","DEU","FRA","NLD",
  "POL","HUN","CZE","BGR","ROU","THA","VNM","IDN","MYS","PHL",
  "MEX","COL","PAN","CRI","ECU","BRA","ARG","CHL","PER","URY",
  "MAR","TUN","ZAF","KEN","EGY","AUS","NZL","CAN","USA","JPN",
  "SGP","ARE","MUS","BHS","BLZ",
];

// ---------- types ----------

interface LensData {
  value: number | null;
  confidence: string;
  agreement: string;
  sourceCount: number;
  period: string;
  sources: string[];
}

interface CountryAffordability {
  iso3: string;
  displayName: string;
  iso2: string | null;
  cost: LensData;       // GENERAL_COST_LEVEL (OECD=100)
  prosperity: LensData; // PROSPERITY_LEVEL (qualité de vie)
  safety: LensData;     // LABOR_STRESS inversé → safety
  // budget metrics
  dailyCostEur: number | null;
  monthlyCostEur: number | null;
  ratio: number | null; // budget / monthlyCost (>1 = affordable)
  tier: "comfortable" | "tight" | "insufficient" | "unknown";
  loaded: boolean;
  error: boolean;
}

type TierFilter = "all" | "comfortable" | "tight" | "insufficient";
type SortKey = "ratio" | "name" | "prosperity" | "safety";

// ---------- helpers ----------

function extractLens(
  snapshot: CountryEconomicSnapshotResponse | CountryRelativeCostSnapshotResponse | null,
  code: string,
): LensData {
  if (!snapshot) return { value: null, confidence: "NONE", agreement: "UNKNOWN", sourceCount: 0, period: "—", sources: [] };
  const lens = snapshot.lenses?.find((l) => l.indicatorCode === code);
  if (!lens) return { value: null, confidence: "NONE", agreement: "UNKNOWN", sourceCount: 0, period: "—", sources: [] };
  const evidence = lens.sourceAudit?.evidence ?? [];
  return {
    value: lens.latestComparableValue ?? null,
    confidence: lens.confidenceLevel ?? "NONE",
    agreement: lens.agreementLevel ?? "UNKNOWN",
    sourceCount: lens.latestComparableSourceCount ?? evidence.length,
    period: lens.latestPeriodLabel ?? "—",
    sources: evidence.map((e) => e.sourceCodes ?? []).flat(),
  };
}

const SOURCE_NAMES: Record<string, string> = {
  WORLD_BANK: "Banque Mondiale",
  IMF: "FMI",
  OECD: "OCDE",
  UN_STATS: "Nations Unies",
  EUROSTAT: "Eurostat",
  ILO: "OIT",
  WHO: "OMS",
  WEF: "Forum Économique Mondial",
  NUMBEO: "Numbeo",
  MERCER: "Mercer",
};

function sourceName(code: string): string {
  return SOURCE_NAMES[code] ?? code;
}

function confidenceColor(c: string): string {
  if (c === "HIGH") return "#4ade80";
  if (c === "MEDIUM") return "#fbbf24";
  if (c === "LOW") return "#f87171";
  return "rgba(183,220,245,0.35)";
}

function tierLabel(tier: CountryAffordability["tier"], lang: string): string {
  if (lang === "fr") {
    if (tier === "comfortable") return "✓ Accessible";
    if (tier === "tight") return "≈ Serré";
    if (tier === "insufficient") return "✗ Hors budget";
    return "?";
  }
  if (tier === "comfortable") return "✓ Affordable";
  if (tier === "tight") return "≈ Tight";
  if (tier === "insufficient") return "✗ Over budget";
  return "?";
}

function tierClass(tier: CountryAffordability["tier"]): string {
  if (tier === "comfortable") return "rt-tier--comfortable";
  if (tier === "tight") return "rt-tier--tight";
  if (tier === "insufficient") return "rt-tier--insufficient";
  return "rt-tier--unknown";
}

function computeTier(ratio: number | null): CountryAffordability["tier"] {
  if (ratio === null) return "unknown";
  if (ratio >= 1.4) return "comfortable";
  if (ratio >= 0.9) return "tight";
  return "insufficient";
}

function computeAffordability(
  iso3: string,
  displayName: string,
  iso2: string | null,
  eco: CountryEconomicSnapshotResponse | null,
  cost: CountryRelativeCostSnapshotResponse | null,
  budgetEur: number,
): CountryAffordability {
  const costLens = extractLens(cost, "GENERAL_COST_LEVEL");
  const prosperityLens = extractLens(eco, "PROSPERITY_LEVEL");
  const safetyLens = extractLens(eco, "LABOR_STRESS");

  // Daily cost formula: OECD=100 index → 100 ~ 145 EUR/day
  const dailyCostEur = costLens.value !== null ? Math.round((costLens.value / 100) * 145) : null;
  const monthlyCostEur = dailyCostEur !== null ? dailyCostEur * 30 : null;
  const ratio = monthlyCostEur !== null && monthlyCostEur > 0 ? budgetEur / monthlyCostEur : null;

  return {
    iso3,
    displayName,
    iso2,
    cost: costLens,
    prosperity: prosperityLens,
    safety: safetyLens,
    dailyCostEur,
    monthlyCostEur,
    ratio,
    tier: computeTier(ratio),
    loaded: true,
    error: false,
  };
}

// ---------- snapshotCache ----------

const snapshotCache = new Map<string, { eco: CountryEconomicSnapshotResponse | null; cost: CountryRelativeCostSnapshotResponse | null }>();

// ---------- composant principal ----------

interface RetirementPanelProps {
  countries: CountrySummary[];
  onOpenCountry: (iso3: string) => void;
  onClose: () => void;
}

export default function RetirementPanel({ countries, onOpenCountry, onClose }: RetirementPanelProps) {
  const lang = useLang();
  const { profile, updateProfile } = useUserProfile();

  const [budget, setBudget] = useState(profile.monthlyBudgetEur || 2000);
  const [tierFilter, setTierFilter] = useState<TierFilter>("all");
  const [sortKey, setSortKey] = useState<SortKey>("ratio");
  const [items, setItems] = useState<CountryAffordability[]>(() =>
    EXPAT_ISO3.map((iso3) => {
      const c = countries.find((x) => x.iso3 === iso3);
      return {
        iso3,
        displayName: c?.displayName ?? iso3,
        iso2: c?.iso2 ?? null,
        cost: { value: null, confidence: "NONE", agreement: "UNKNOWN", sourceCount: 0, period: "—", sources: [] },
        prosperity: { value: null, confidence: "NONE", agreement: "UNKNOWN", sourceCount: 0, period: "—", sources: [] },
        safety: { value: null, confidence: "NONE", agreement: "UNKNOWN", sourceCount: 0, period: "—", sources: [] },
        dailyCostEur: null,
        monthlyCostEur: null,
        ratio: null,
        tier: "unknown",
        loaded: false,
        error: false,
      };
    }),
  );
  const [loadedCount, setLoadedCount] = useState(0);
  const [expandedIso3, setExpandedIso3] = useState<string | null>(null);
  const loadingRef = useRef(false);
  const budgetCommittedRef = useRef(budget);

  // Load snapshots progressively in batches of 3
  const loadBatch = useCallback(
    async (startIdx: number, currentBudget: number) => {
      const batch = EXPAT_ISO3.slice(startIdx, startIdx + 3);
      if (batch.length === 0) {
        loadingRef.current = false;
        return;
      }

      await Promise.all(
        batch.map(async (iso3) => {
          try {
            let cached = snapshotCache.get(iso3);
            if (!cached) {
              const [eco, cost] = await Promise.all([
                fetchCountryEconomicSnapshot(iso3).catch(() => null),
                fetchCountryRelativeCostSnapshot(iso3).catch(() => null),
              ]);
              cached = { eco, cost };
              snapshotCache.set(iso3, cached);
            }
            const c = countries.find((x) => x.iso3 === iso3);
            const aff = computeAffordability(iso3, c?.displayName ?? iso3, c?.iso2 ?? null, cached.eco, cached.cost, currentBudget);
            setItems((prev) => prev.map((it) => (it.iso3 === iso3 ? aff : it)));
            setLoadedCount((n) => n + 1);
          } catch {
            setItems((prev) =>
              prev.map((it) =>
                it.iso3 === iso3 ? { ...it, loaded: true, error: true } : it,
              ),
            );
            setLoadedCount((n) => n + 1);
          }
        }),
      );

      await new Promise((r) => setTimeout(r, 180));
      loadBatch(startIdx + 3, currentBudget);
    },
    [countries],
  );

  // Recompute ratios when budget changes (no re-fetch, use cache)
  useEffect(() => {
    if (budget === budgetCommittedRef.current) return;
    budgetCommittedRef.current = budget;
    setItems((prev) =>
      prev.map((it) => {
        if (!it.loaded) return it;
        const cached = snapshotCache.get(it.iso3);
        if (!cached) return it;
        return computeAffordability(it.iso3, it.displayName, it.iso2, cached.eco, cached.cost, budget);
      }),
    );
  }, [budget]);

  useEffect(() => {
    if (loadingRef.current) return;
    loadingRef.current = true;
    loadBatch(0, budget);
  }, [loadBatch, budget]);

  // Sync budget to profile when user stops editing
  function handleBudgetBlur() {
    updateProfile({ monthlyBudgetEur: budget });
    budgetCommittedRef.current = budget;
  }

  // Filtered + sorted list
  const sorted = [...items]
    .filter((it) => {
      if (tierFilter === "all") return true;
      if (!it.loaded) return false;
      return it.tier === tierFilter;
    })
    .sort((a, b) => {
      if (sortKey === "name") return a.displayName.localeCompare(b.displayName);
      if (sortKey === "prosperity") {
        const av = a.prosperity.value ?? -999;
        const bv = b.prosperity.value ?? -999;
        return bv - av;
      }
      if (sortKey === "safety") {
        const av = a.safety.value !== null ? 35 - a.safety.value : -999;
        const bv = b.safety.value !== null ? 35 - b.safety.value : -999;
        return bv - av;
      }
      // ratio
      const ar = a.ratio ?? -999;
      const br = b.ratio ?? -999;
      return br - ar;
    });

  const loadedItems = items.filter((it) => it.loaded && !it.error);
  const comfortableCount = loadedItems.filter((it) => it.tier === "comfortable").length;
  const tightCount = loadedItems.filter((it) => it.tier === "tight").length;

  const progressPct = Math.round((loadedCount / EXPAT_ISO3.length) * 100);
  const isLoading = loadedCount < EXPAT_ISO3.length;

  const fr = lang === "fr";

  return (
    <div className="rt-panel">
      {/* Header */}
      <div className="rt-header">
        <div className="rt-header-left">
          <span className="rt-header-icon"><WorldIcon name="globe" size={25}/></span>
          <div>
            <h2 className="rt-title">{fr ? "Retraite & Expatriation" : "Retirement & Expat"}</h2>
            <p className="rt-subtitle">
              {fr
                ? "Pays accessibles selon votre budget mensuel"
                : "Countries accessible for your monthly budget"}
            </p>
          </div>
        </div>
        <button type="button" className="rt-close-btn" onClick={onClose}>✕</button>
      </div>

      {/* Body */}
      <div className="rt-body">

        {/* Budget input */}
        <div className="rt-budget-section">
          <label className="rt-label" htmlFor="rt-budget">
            {fr ? "Budget mensuel (EUR)" : "Monthly budget (EUR)"}
          </label>
          <div className="rt-budget-row">
            <input
              id="rt-budget"
              className="rt-budget-input"
              type="number"
              min={100}
              max={20000}
              step={100}
              value={budget}
              onChange={(e) => setBudget(Number(e.target.value))}
              onBlur={handleBudgetBlur}
            />
            <span className="rt-budget-currency">€ / {fr ? "mois" : "month"}</span>
          </div>
          <input
            type="range"
            className="rt-budget-slider"
            min={300}
            max={10000}
            step={100}
            value={budget}
            onChange={(e) => setBudget(Number(e.target.value))}
            onMouseUp={handleBudgetBlur}
            onTouchEnd={handleBudgetBlur}
          />
          <div className="rt-budget-marks">
            <span>300€</span><span>1 000€</span><span>3 000€</span><span>10 000€</span>
          </div>
        </div>

        {/* Summary chips */}
        {loadedCount > 0 && (
          <div className="rt-summary-row">
            <span className="rt-summary-chip rt-summary-chip--comfortable">
              ✓ {comfortableCount} {fr ? "accessibles" : "affordable"}
            </span>
            <span className="rt-summary-chip rt-summary-chip--tight">
              ≈ {tightCount} {fr ? "serrés" : "tight"}
            </span>
            <span className="rt-summary-chip rt-summary-chip--muted">
              {fr ? `sur ${loadedCount} analysés` : `of ${loadedCount} analyzed`}
            </span>
          </div>
        )}

        {/* Progress */}
        {isLoading && (
          <div className="rt-loading-bar">
            <div className="rt-loading-fill" style={{ width: `${progressPct}%` }} />
          </div>
        )}

        {/* Filters + sort */}
        <div className="rt-controls">
          <div className="rt-filter-row">
            <span className="rt-control-label">{fr ? "Filtre :" : "Filter:"}</span>
            {(["all", "comfortable", "tight", "insufficient"] as TierFilter[]).map((f) => (
              <button
                key={f}
                type="button"
                className={`rt-filter-btn${tierFilter === f ? " active" : ""}`}
                onClick={() => setTierFilter(f)}
              >
                {f === "all" ? (fr ? "Tous" : "All") :
                 f === "comfortable" ? (fr ? "Accessibles" : "Affordable") :
                 f === "tight" ? (fr ? "Serrés" : "Tight") :
                 (fr ? "Hors budget" : "Over budget")}
              </button>
            ))}
          </div>
          <div className="rt-sort-row">
            <span className="rt-control-label">{fr ? "Tri :" : "Sort:"}</span>
            {([
              { k: "ratio" as SortKey, fr: "Budget", en: "Budget" },
              { k: "prosperity" as SortKey, fr: "Qualité vie", en: "Life quality" },
              { k: "safety" as SortKey, fr: "Sécurité", en: "Safety" },
              { k: "name" as SortKey, fr: "Nom", en: "Name" },
            ]).map(({ k, fr: fl, en }) => (
              <button
                key={k}
                type="button"
                className={`rt-sort-btn${sortKey === k ? " active" : ""}`}
                onClick={() => setSortKey(k)}
              >
                {lang === "fr" ? fl : en}
              </button>
            ))}
          </div>
        </div>

        {/* Country list */}
        <div className="rt-list">
          {sorted.map((item, idx) => (
            <RetirementRow
              key={item.iso3}
              item={item}
              rank={idx + 1}
              budget={budget}
              lang={lang}
              expanded={expandedIso3 === item.iso3}
              onToggle={() => setExpandedIso3(expandedIso3 === item.iso3 ? null : item.iso3)}
              onOpen={() => onOpenCountry(item.iso3)}
            />
          ))}
        </div>

        {/* Methodology */}
        <details className="rt-methodology">
          <summary>{fr ? "Méthodologie & sources" : "Methodology & sources"}</summary>
          <p>
            {fr
              ? `Coût journalier = (GENERAL_COST_LEVEL / 100) × 145 €/jour (OCDE=100 équivaut à ~145 €/j).
                 Ratio = budget mensuel / (coût journalier × 30).
                 Ratio ≥ 1.4 → Accessible. Ratio ≥ 0.9 → Serré. Ratio < 0.9 → Hors budget.
                 Sources : Banque Mondiale, FMI, OCDE, Numbeo, Mercer. Confiance et accord inter-sources affichés.`
              : `Daily cost = (GENERAL_COST_LEVEL / 100) × €145/day (OECD=100 ≈ €145/day).
                 Ratio = monthly budget / (daily cost × 30).
                 Ratio ≥ 1.4 → Affordable. Ratio ≥ 0.9 → Tight. Ratio < 0.9 → Over budget.
                 Sources: World Bank, IMF, OECD, Numbeo, Mercer. Confidence and inter-source agreement shown.`}
          </p>
        </details>
      </div>
    </div>
  );
}

// ---------- RetirementRow ----------

interface RetirementRowProps {
  item: CountryAffordability;
  rank: number;
  budget: number;
  lang: string;
  expanded: boolean;
  onToggle: () => void;
  onOpen: () => void;
}

function RetirementRow({ item, rank, budget, lang, expanded, onToggle, onOpen }: RetirementRowProps) {
  const fr = lang === "fr";

  if (!item.loaded) {
    return (
      <div className="rt-row rt-row--loading">
        <span className="rt-rank">{rank}</span>
        <span className="rt-row-flag">{item.iso2 ? isoToFlag(item.iso2)  : "—"}</span>
        <span className="rt-row-name">{item.displayName}</span>
        <span className="rt-row-spinner">{fr ? "Analyse…" : "Loading…"}</span>
      </div>
    );
  }

  if (item.error) {
    return (
      <div className="rt-row rt-row--error">
        <span className="rt-rank">{rank}</span>
        <span className="rt-row-flag">{item.iso2 ? isoToFlag(item.iso2)  : "—"}</span>
        <span className="rt-row-name">{item.displayName}</span>
        <span className="rt-row-err">{fr ? "Données indisponibles" : "Data unavailable"}</span>
      </div>
    );
  }

  const ratioDisplay = item.ratio !== null ? item.ratio.toFixed(2) : "—";
  const ratioBarPct = item.ratio !== null ? Math.min(100, (item.ratio / 3) * 100) : 0;

  // Prosperity bar 0-120
  const prosperityPct = item.prosperity.value !== null
    ? Math.min(100, (item.prosperity.value / 120) * 100)
    : 0;

  // Safety: invert LABOR_STRESS (0-35 → 35=least stress=safest)
  const safetyScore = item.safety.value !== null ? Math.max(0, 35 - item.safety.value) : null;
  const safetyPct = safetyScore !== null ? Math.min(100, (safetyScore / 35) * 100) : 0;

  return (
    <div className="rt-score-row">
      <button type="button" className="rt-row-main" onClick={onToggle}>
        <span className="rt-rank">{rank}</span>
        <span className="rt-row-flag">{item.iso2 ? isoToFlag(item.iso2)  : "—"}</span>
        <span className="rt-row-name">{item.displayName}</span>

        {/* Budget ratio bar */}
        <div className="rt-ratio-bar-wrap">
          <div
            className="rt-ratio-bar"
            style={{
              width: `${ratioBarPct}%`,
              background: item.tier === "comfortable"
                ? "linear-gradient(90deg,#4ade80,#22c55e)"
                : item.tier === "tight"
                ? "linear-gradient(90deg,#fbbf24,#f59e0b)"
                : "linear-gradient(90deg,#f87171,#ef4444)",
            }}
          />
        </div>

        <span className={`rt-tier-badge ${tierClass(item.tier)}`}>
          {tierLabel(item.tier, lang)}
        </span>

        <span className="rt-row-cost">
          {item.monthlyCostEur !== null ? `~${item.monthlyCostEur}€` : "—"}
        </span>

        <span className="rt-row-chevron">{expanded ? "▲" : "▼"}</span>
      </button>

      {expanded && (
        <div className="rt-detail">
          {/* Budget analysis */}
          <div className="rt-detail-section">
            <p className="rt-detail-title">
              {fr ? "Analyse budgétaire" : "Budget analysis"}
            </p>
            <div className="rt-detail-grid">
              <div className="rt-detail-kpi">
                <span className="rt-kpi-label">{fr ? "Budget mensuel" : "Monthly budget"}</span>
                <span className="rt-kpi-val">{budget}€</span>
              </div>
              <div className="rt-detail-kpi">
                <span className="rt-kpi-label">{fr ? "Coût de vie estimé" : "Est. living cost"}</span>
                <span className="rt-kpi-val">{item.monthlyCostEur !== null ? `${item.monthlyCostEur}€` : "—"}</span>
              </div>
              <div className="rt-detail-kpi">
                <span className="rt-kpi-label">{fr ? "Ratio confort" : "Comfort ratio"}</span>
                <span className="rt-kpi-val" style={{ color: item.tier === "comfortable" ? "#4ade80" : item.tier === "tight" ? "#fbbf24" : "#f87171" }}>
                  ×{ratioDisplay}
                </span>
              </div>
              <div className="rt-detail-kpi">
                <span className="rt-kpi-label">{fr ? "Indice coût OCDE" : "OECD cost index"}</span>
                <span className="rt-kpi-val">{item.cost.value !== null ? item.cost.value.toFixed(1) : "—"}</span>
              </div>
            </div>
            {/* Cost data quality */}
            <DataQualityMini label={fr ? "Source coût" : "Cost source"} lens={item.cost} lang={lang} />
          </div>

          {/* Quality of life */}
          <div className="rt-detail-section">
            <p className="rt-detail-title">{fr ? "Qualité de vie" : "Quality of life"}</p>
            <div className="rt-dim-row">
              <span className="rt-dim-icon"><WorldIcon name="info" size={18}/></span>
              <span className="rt-dim-name">{fr ? "Prospérité / Santé" : "Prosperity / Health"}</span>
              <div className="rt-dim-bar-wrap">
                <div className="rt-dim-bar" style={{ width: `${prosperityPct}%`, background: "#4db8ff" }} />
              </div>
              <span className="rt-dim-val">{item.prosperity.value !== null ? item.prosperity.value.toFixed(0) : "—"}</span>
              <ConfDot lens={item.prosperity} />
            </div>
            <div className="rt-dim-row">
              <span className="rt-dim-icon"><WorldIcon name="shield" size={18}/></span>
              <span className="rt-dim-name">{fr ? "Stabilité / Sécurité" : "Stability / Safety"}</span>
              <div className="rt-dim-bar-wrap">
                <div className="rt-dim-bar" style={{ width: `${safetyPct}%`, background: "#a78bfa" }} />
              </div>
              <span className="rt-dim-val">{safetyScore !== null ? safetyScore.toFixed(0) : "—"}</span>
              <ConfDot lens={item.safety} />
            </div>
            <DataQualityMini label={fr ? "Source qualité vie" : "Life quality source"} lens={item.prosperity} lang={lang} />
          </div>

          {/* Open country sheet */}
          <button type="button" className="rt-open-btn" onClick={onOpen}>
            {fr ? "Ouvrir la fiche pays →" : "Open country sheet →"}
          </button>
        </div>
      )}
    </div>
  );
}

// ---------- ConfDot ----------

function ConfDot({ lens }: { lens: LensData }) {
  const [hovered, setHovered] = useState(false);
  return (
    <span
      className="rt-conf-dot"
      style={{ background: confidenceColor(lens.confidence) }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {hovered && (
        <span className="rt-conf-tooltip">
          {lens.confidence} · {lens.agreement} · {lens.sourceCount} src
        </span>
      )}
    </span>
  );
}

// ---------- DataQualityMini ----------

function DataQualityMini({ label, lens, lang }: { label: string; lens: LensData; lang: string }) {
  const [open, setOpen] = useState(false);
  if (lens.confidence === "NONE") return null;
  const fr = lang === "fr";
  return (
    <div className="rt-quality-mini">
      <button type="button" className="rt-quality-toggle" onClick={() => setOpen((v) => !v)}>
        <span className="rt-quality-badge" style={{ borderColor: confidenceColor(lens.confidence), color: confidenceColor(lens.confidence) }}>
          {lens.confidence}
        </span>
        <span className="rt-quality-agree">
          {lens.agreement === "CONSENSUS" ? "✓" : lens.agreement === "PARTIAL" ? "~" : lens.agreement === "DIVERGENT" ? "!" : "?"}
        </span>
        <span className="rt-quality-label">{label}</span>
        <span className="rt-quality-chevron">{open ? "▲" : "▼"}</span>
      </button>
      {open && (
        <div className="rt-quality-detail">
          <div className="rt-quality-row">
            <strong>{fr ? "Accord" : "Agreement"}:</strong>
            <span>{lens.agreement}</span>
          </div>
          <div className="rt-quality-row">
            <strong>{fr ? "Sources" : "Sources"}:</strong>
            <div className="rt-sources-list">
              {lens.sources.length > 0
                ? lens.sources.map((s) => (
                    <span key={s} className="rt-source-badge">{sourceName(s)}</span>
                  ))
                : <span className="rt-source-badge">{lens.sourceCount} src</span>}
            </div>
          </div>
          <div className="rt-quality-row">
            <strong>{fr ? "Période" : "Period"}:</strong>
            <span>{lens.period}</span>
          </div>
        </div>
      )}
    </div>
  );
}

// ---------- helper emoji flag ----------

function isoToFlag(iso2: string): string {
  return iso2
    .toUpperCase()
    .split("")
    .map((c) => String.fromCodePoint(0x1f1e0 - 65 + c.charCodeAt(0)))
    .join("");
}