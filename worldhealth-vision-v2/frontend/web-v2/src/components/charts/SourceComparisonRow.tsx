// WorldHealthVision V2 — SourceComparisonRow
// Per-indicator source breakdown: shows each source's value, period, and freshness.
// Core differentiator: makes source disagreements visible.

import { useIndicatorOverview } from "../../hooks/useIndicatorOverview";
import "../../styles/charts.css";

type Props = {
  iso3: string;
  indicatorCode: string;
  indicatorName: string;
  unitLabel: string;
};

function fmtVal(v: number | null, unit: string): string {
  if (v === null) return "—";
  const abs = Math.abs(v);
  const u = unit.toUpperCase();
  if (u.includes("USD") || u === "USD") {
    if (abs >= 1e12) return `${(v / 1e12).toFixed(2)}T`;
    if (abs >= 1e9) return `${(v / 1e9).toFixed(1)}B`;
    if (abs >= 1e6) return `${(v / 1e6).toFixed(1)}M`;
  }
  if (u === "PERCENT" || u.includes("%")) return `${v.toFixed(2)}%`;
  return v.toLocaleString(undefined, { maximumFractionDigits: 2 });
}

export default function SourceComparisonRow({ iso3, indicatorCode, indicatorName, unitLabel }: Props) {
  const { overview, loading, error } = useIndicatorOverview(iso3, indicatorCode, true);

  if (loading) {
    return (
      <div className="source-comparison-block">
        <div className="source-comparison-header"><h5>{indicatorName}</h5></div>
        <div className="chart-empty">Loading sources...</div>
      </div>
    );
  }

  if (error || !overview) {
    return (
      <div className="source-comparison-block">
        <div className="source-comparison-header"><h5>{indicatorName}</h5></div>
        <div className="chart-empty chart-empty-error">{error ?? "No data available"}</div>
      </div>
    );
  }

  const { divergence, sourcePerspectives } = overview;

  return (
    <div className="source-comparison-block">
      <div className="source-comparison-header">
        <h5>{indicatorName}</h5>
        <span className={`agreement-badge agreement-${divergence.agreementLevel}`}>
          {divergence.agreementLevel.replace(/_/g, " ").toLowerCase()}
        </span>
      </div>

      {divergence.comparableValueCount >= 2 && (
        <div className="source-comparison-divergence">
          <span>
            Median: <strong>{fmtVal(divergence.medianNumericValue, unitLabel)}</strong>
          </span>
          {divergence.rangeRelativeToMedian !== null && (
            <span>
              Spread: <strong>{(divergence.rangeRelativeToMedian * 100).toFixed(1)}%</strong>
            </span>
          )}
          <span>{divergence.comparableValueCount} sources compared</span>
        </div>
      )}

      {sourcePerspectives.length === 0 && (
        <div className="chart-empty">No source perspectives available.</div>
      )}

      <div className="source-table">
        {sourcePerspectives.map((sp) => (
          <div className="source-row" key={`${sp.sourceCode}-${sp.datasetCode}`}>
            <span className="source-row-name">{sp.sourceDisplayName}</span>
            <span className="source-row-value">{fmtVal(sp.numericValue, unitLabel)}</span>
            <span className="source-row-period">{sp.periodLabel ?? "—"}</span>
            <span className={`freshness-pill freshness-${sp.freshnessLevel}`}>
              {sp.freshnessLevel.toLowerCase()}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}