// WorldHealthVision V2 — TrendChartSection
// Self-contained wrapper: fetches its own history and renders TrendChart.

import { useIndicatorHistory } from "../../hooks/useIndicatorHistory";
import TrendChart from "./TrendChart";
import "../../styles/charts.css";

type Props = {
  iso3: string;
  indicatorCode: string;
  indicatorName: string;
  unitLabel: string;
  trendDirection?: "UP" | "DOWN" | "FLAT" | "INSUFFICIENT_DATA";
};

const TREND_ARROW: Record<string, string> = {
  UP: "↑",
  DOWN: "↓",
  FLAT: "→",
  INSUFFICIENT_DATA: "—",
};

export default function TrendChartSection({
  iso3,
  indicatorCode,
  indicatorName,
  unitLabel,
  trendDirection,
}: Props) {
  const { points, loading, error } = useIndicatorHistory(iso3, indicatorCode, true);

  return (
    <div className="trend-section">
      <div className="trend-section-meta">
        <span className="trend-section-title">{indicatorName}</span>
        {trendDirection && (
          <span className={`trend-dir trend-dir-${trendDirection.toLowerCase()}`}>
            {TREND_ARROW[trendDirection]}
          </span>
        )}
        <span className="trend-unit">{unitLabel}</span>
      </div>

      {loading && <div className="chart-empty">Loading history...</div>}
      {error && <div className="chart-empty chart-empty-error">{error}</div>}
      {!loading && !error && (
        <TrendChart points={points} unitLabel={unitLabel} height={160} />
      )}
    </div>
  );
}