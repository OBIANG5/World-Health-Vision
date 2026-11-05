// WorldHealthVision V2 — ForecastChart
// Projection linéaire OLS avec intervalles de confiance et avertissements honnêtes.
// Méthodologie : même approche que IMF WEO (conditionnel) et World Bank MPO (tendances actuelles).

import { useMemo, useState } from "react";
import {
  ComposedChart,
  Area,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
  ResponsiveContainer,
} from "recharts";
import type { ForecastQuality } from "../../api/types";
import { useForecast } from "../../hooks/useForecast";
import { useIndicatorHistory } from "../../hooks/useIndicatorHistory";
import "../../styles/charts.css";

// ---------------------------------------------------------------------------

type Props = {
  iso3: string;
  indicatorCode: string;
  unitLabel: string;
  lang?: string;
  enabled: boolean;
};

// ---------------------------------------------------------------------------

const QUALITY_CONFIG: Record<ForecastQuality, { label: string; color: string; bg: string; icon: string }> = {
  RELIABLE:    { label: "Projection fiable",      color: "#4ade80", bg: "rgba(74,222,128,0.10)", icon: "✓" },
  INDICATIVE:  { label: "Projection indicative",  color: "#fbbf24", bg: "rgba(251,191,36,0.10)", icon: "~" },
  SPECULATIVE: { label: "Projection spéculative", color: "#f87171", bg: "rgba(248,113,113,0.10)", icon: "!" },
};

function formatVal(v: number, unitLabel: string): string {
  const u = unitLabel.toUpperCase();
  const abs = Math.abs(v);
  if (u.includes("USD")) {
    if (abs >= 1e12) return `${(v / 1e12).toFixed(2)} T$`;
    if (abs >= 1e9)  return `${(v / 1e9).toFixed(1)} Md$`;
    if (abs >= 1e6)  return `${(v / 1e6).toFixed(1)} M$`;
  }
  if (u === "PERCENT" || u.includes("%")) return `${v.toFixed(2)} %`;
  if (abs >= 1e9) return `${(v / 1e9).toFixed(1)} Md`;
  if (abs >= 1e6) return `${(v / 1e6).toFixed(1)} M`;
  return v.toLocaleString("fr-FR", { maximumFractionDigits: 2 });
}

// ---------------------------------------------------------------------------
// Custom tooltip

type TooltipEntry = {
  name: string;
  value: number | [number, number] | null;
  color: string;
};

function ForecastTooltip({
  active,
  payload,
  label,
  unitLabel,
  baseYear,
}: {
  active?: boolean;
  payload?: TooltipEntry[];
  label?: string;
  unitLabel: string;
  baseYear: number;
}) {
  if (!active || !payload?.length) return null;
  const isProjected = Number(label) > baseYear;
  return (
    <div className="chart-tooltip">
      <p className="chart-tooltip-label">
        {label}
        {isProjected && (
          <span style={{ marginLeft: 6, fontSize: 10, color: "#fbbf24", opacity: 0.8 }}>
            projection
          </span>
        )}
      </p>
      {payload.map((entry) => {
        if (Array.isArray(entry.value)) {
          return (
            <p key={entry.name} style={{ color: entry.color, margin: "3px 0 0", fontSize: 12 }}>
              {entry.name}: {formatVal(entry.value[0], unitLabel)} – {formatVal(entry.value[1], unitLabel)}
            </p>
          );
        }
        if (entry.value === null || entry.value === undefined) return null;
        return (
          <p key={entry.name} style={{ color: entry.color, margin: "3px 0 0", fontSize: 12 }}>
            {entry.name}: <strong>{formatVal(entry.value, unitLabel)}</strong>
          </p>
        );
      })}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Combined chart data point

type ChartPoint = {
  year: string;
  hist?: number;
  proj?: number;
  ci80?: [number, number];
  ci95?: [number, number];
};

// ---------------------------------------------------------------------------

export default function ForecastChart({
  iso3,
  indicatorCode,
  unitLabel,
  lang = "fr",
  enabled,
}: Props) {
  const [caveatsOpen, setCaveatsOpen] = useState(false);

  const { points: histPoints, loading: histLoading } = useIndicatorHistory(
    iso3, indicatorCode, enabled,
  );
  const { forecast, loading: fcLoading, error: fcError } = useForecast(
    iso3, indicatorCode, lang, enabled,
  );

  const chartData = useMemo<ChartPoint[]>(() => {
    if (!forecast || histPoints.length === 0) return [];

    // Build year→value map from historical series (prefer primary source, take first non-null per year)
    const histMap = new Map<number, number>();
    for (const p of histPoints) {
      const yr = parseInt(p.periodLabel, 10);
      if (!Number.isNaN(yr) && p.numericValue !== null && !histMap.has(yr)) {
        histMap.set(yr, p.numericValue);
      }
    }

    // Keep last 12 historical points
    const histYears = [...histMap.keys()].sort((a, b) => a - b).slice(-12);

    const pts: ChartPoint[] = [];

    for (const yr of histYears) {
      pts.push({ year: String(yr), hist: histMap.get(yr) });
    }

    // Bridge point: last historical year also gets the OLS point estimate as "proj"
    const baseYear = forecast.baseYear;
    const lastHistPt = pts.find((p) => p.year === String(baseYear));
    if (lastHistPt) {
      lastHistPt.proj = lastHistPt.hist;
    }

    // Forecast points
    for (const fp of forecast.points) {
      pts.push({
        year: String(fp.year),
        proj: fp.value,
        ci80: [fp.ciLow80, fp.ciHigh80],
        ci95: [fp.ciLow95, fp.ciHigh95],
      });
    }

    return pts;
  }, [histPoints, forecast]);

  const qualityCfg = forecast ? (QUALITY_CONFIG[forecast.metadata.quality] ?? QUALITY_CONFIG.SPECULATIVE) : null;

  const fr = lang === "fr";

  if (!enabled) return null;
  if (histLoading || fcLoading) {
    return (
      <div className="chart-empty" style={{ height: 48, fontSize: 12 }}>
        {fr ? "Calcul de la projection…" : "Computing projection…"}
      </div>
    );
  }
  if (fcError) {
    return (
      <div className="chart-empty" style={{ fontSize: 12, color: "rgba(248,113,113,0.7)" }}>
        {fr ? "Projection indisponible (service analytics hors ligne)" : "Forecast unavailable (analytics service offline)"}
      </div>
    );
  }
  if (!forecast) return null;

  if (forecast.insufficientData) {
    return (
      <div className="forecast-insufficient">
        <span className="forecast-insufficient-icon">⚠</span>
        <p>
          {fr
            ? "Données insuffisantes pour projeter cet indicateur (minimum 5 observations requises)."
            : "Insufficient data to project this indicator (minimum 5 observations required)."}
        </p>
      </div>
    );
  }

  if (chartData.length === 0) return null;

  const { metadata } = forecast;
  const baseYearStr = String(forecast.baseYear);

  return (
    <div className="forecast-block">
      {/* ---- En-tête ---- */}
      <div className="forecast-header">
        <span className="forecast-title">
          {fr ? "Projection tendancielle" : "Trend projection"}
          <span style={{ fontWeight: 400, fontSize: 11, marginLeft: 6, color: "rgba(183,220,245,0.5)" }}>
            {fr ? `(tendance ${metadata.fromYear}–${metadata.toYear}, horizon ${metadata.horizonYears} ans)`
                : `(trend ${metadata.fromYear}–${metadata.toYear}, horizon ${metadata.horizonYears} yrs)`}
          </span>
        </span>
        {qualityCfg && (
          <span
            className="forecast-quality-badge"
            style={{ color: qualityCfg.color, background: qualityCfg.bg, borderColor: `${qualityCfg.color}33` }}
          >
            {qualityCfg.icon} {qualityCfg.label}
          </span>
        )}
      </div>

      {/* ---- Stats ligne ---- */}
      <div className="forecast-stats-row">
        <span className="forecast-stat">
          R² = <strong style={{ color: metadata.rSquared >= 0.8 ? "#4ade80" : metadata.rSquared >= 0.5 ? "#fbbf24" : "#f87171" }}>
            {metadata.rSquared.toFixed(2)}
          </strong>
        </span>
        <span className="forecast-stat">
          n = <strong>{metadata.nObservations}</strong>
        </span>
        <span className="forecast-stat">
          {fr ? "Méthode" : "Method"}: <strong>OLS linéaire</strong>
        </span>
      </div>

      {/* ---- Graphique ---- */}
      <ResponsiveContainer width="100%" height={168}>
        <ComposedChart data={chartData} margin={{ top: 6, right: 8, bottom: 4, left: 0 }}>
          <defs>
            <linearGradient id={`forecastGrad-${indicatorCode}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%"  stopColor="#fb923c" stopOpacity={0.18} />
              <stop offset="95%" stopColor="#fb923c" stopOpacity={0.04} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(115,192,242,0.08)" />
          <XAxis
            dataKey="year"
            tick={{ fill: "rgba(183,220,245,0.55)", fontSize: 11 }}
            tickLine={false}
            axisLine={{ stroke: "rgba(115,192,242,0.15)" }}
            interval="preserveStartEnd"
          />
          <YAxis
            tickFormatter={(v: number) => formatVal(v, unitLabel)}
            tick={{ fill: "rgba(183,220,245,0.55)", fontSize: 11 }}
            tickLine={false}
            axisLine={false}
            width={58}
          />
          <Tooltip
            content={
              <ForecastTooltip
                unitLabel={unitLabel}
                baseYear={forecast.baseYear}
              />
            }
          />
          {/* IC 95 % — bande extérieure */}
          <Area
            type="monotone"
            dataKey="ci95"
            fill="rgba(251,146,60,0.10)"
            stroke="none"
            legendType="none"
            isAnimationActive={false}
            activeDot={false}
            connectNulls={false}
            name={fr ? "IC 95 %" : "95% PI"}
          />
          {/* IC 80 % — bande intérieure */}
          <Area
            type="monotone"
            dataKey="ci80"
            fill="rgba(251,146,60,0.20)"
            stroke="none"
            legendType="none"
            isAnimationActive={false}
            activeDot={false}
            connectNulls={false}
            name={fr ? "IC 80 %" : "80% PI"}
          />
          {/* Ligne historique */}
          <Line
            type="monotone"
            dataKey="hist"
            stroke="#4ab8ff"
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 4, fill: "#4ab8ff", strokeWidth: 0 }}
            connectNulls
            name={fr ? "Historique" : "Historical"}
          />
          {/* Ligne de projection */}
          <Line
            type="monotone"
            dataKey="proj"
            stroke="#fb923c"
            strokeWidth={2}
            strokeDasharray="5 3"
            dot={false}
            activeDot={{ r: 4, fill: "#fb923c", strokeWidth: 0 }}
            connectNulls
            name={fr ? "Projection" : "Projection"}
          />
          {/* Séparateur historique / projection */}
          <ReferenceLine
            x={baseYearStr}
            stroke="rgba(251,146,60,0.35)"
            strokeDasharray="3 2"
          />
        </ComposedChart>
      </ResponsiveContainer>

      {/* ---- Légende ---- */}
      <div className="forecast-legend">
        <span className="forecast-legend-item">
          <span style={{ display: "inline-block", width: 16, height: 2, background: "#4ab8ff", marginRight: 5, verticalAlign: "middle" }} />
          {fr ? "Historique" : "Historical"}
        </span>
        <span className="forecast-legend-item">
          <span style={{ display: "inline-block", width: 16, height: 2, background: "#fb923c", borderTop: "2px dashed #fb923c", marginRight: 5, verticalAlign: "middle" }} />
          {fr ? "Projection OLS" : "OLS projection"}
        </span>
        <span className="forecast-legend-item" style={{ color: "rgba(251,146,60,0.6)" }}>
          <span style={{ display: "inline-block", width: 10, height: 10, background: "rgba(251,146,60,0.25)", borderRadius: 2, marginRight: 5, verticalAlign: "middle" }} />
          IC 80 %
        </span>
        <span className="forecast-legend-item" style={{ color: "rgba(251,146,60,0.45)" }}>
          <span style={{ display: "inline-block", width: 10, height: 10, background: "rgba(251,146,60,0.12)", borderRadius: 2, marginRight: 5, verticalAlign: "middle" }} />
          IC 95 %
        </span>
      </div>

      {/* ---- Avertissements (caveats) ---- */}
      {metadata.caveats.length > 0 && (
        <div className="forecast-caveats">
          <div className="forecast-caveat-header">
            <span className="forecast-caveat-icon">ℹ</span>
            <span className="forecast-caveat-title">
              {fr ? "Hypothèses et limites de la projection" : "Projection assumptions and limitations"}
            </span>
            {metadata.caveats.length > 1 && (
              <button
                type="button"
                className="forecast-caveat-toggle"
                onClick={(e) => { e.stopPropagation(); setCaveatsOpen((v) => !v); }}
              >
                {caveatsOpen
                  ? (fr ? "Masquer" : "Hide")
                  : `${fr ? "Voir tout" : "Show all"} (${metadata.caveats.length})`}
              </button>
            )}
          </div>
          <p className="forecast-caveat-text">{metadata.caveats[0]}</p>
          {caveatsOpen && metadata.caveats.slice(1).map((c, i) => (
            <p key={i} className="forecast-caveat-text">{c}</p>
          ))}
        </div>
      )}
    </div>
  );
}