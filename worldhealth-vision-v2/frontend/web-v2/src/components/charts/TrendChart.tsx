import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import type { TimeseriesPoint } from "../../api/types";
import "../../styles/charts.css";

type Props = {
  points: TimeseriesPoint[];
  unitLabel: string;
  height?: number;
};

// Assign a distinct color per source code
const SOURCE_COLORS: Record<string, string> = {
  WORLD_BANK: "#4db8ff",
  IMF: "#7eeabd",
  ILOSTAT: "#f3d47f",
  OECD: "#c084fc",
  UNSD_SDG: "#fb923c",
  UNODC: "#f87171",
};

function colorFor(sourceCode: string): string {
  return SOURCE_COLORS[sourceCode] ?? "#94a3b8";
}

function formatValue(value: number, unitLabel: string): string {
  const u = unitLabel.toUpperCase();
  if (u === "USD" || u.includes("USD")) {
    if (Math.abs(value) >= 1e12) return `${(value / 1e12).toFixed(2)}T`;
    if (Math.abs(value) >= 1e9) return `${(value / 1e9).toFixed(1)}B`;
    if (Math.abs(value) >= 1e6) return `${(value / 1e6).toFixed(1)}M`;
  }
  if (u === "PERCENT" || u.includes("%")) return `${value.toFixed(2)}%`;
  if (Math.abs(value) >= 1e9) return `${(value / 1e9).toFixed(1)}B`;
  if (Math.abs(value) >= 1e6) return `${(value / 1e6).toFixed(1)}M`;
  return value.toLocaleString(undefined, { maximumFractionDigits: 2 });
}

function CustomTooltip({
  active,
  payload,
  label,
  unitLabel,
}: {
  active?: boolean;
  payload?: Array<{ name: string; value: number; color: string }>;
  label?: string;
  unitLabel: string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="chart-tooltip">
      <p className="chart-tooltip-label">{label}</p>
      {payload.map((entry) => (
        <p key={entry.name} style={{ color: entry.color }} className="chart-tooltip-row">
          {entry.name}: <strong>{formatValue(entry.value, unitLabel)}</strong>
        </p>
      ))}
    </div>
  );
}

export default function TrendChart({ points, unitLabel, height = 200 }: Props) {
  if (points.length === 0) {
    return <div className="chart-empty">No historical data available for this indicator.</div>;
  }

  // Group by periodLabel so each row has one value per source
  const periodMap = new Map<string, Record<string, number>>();
  const sources = new Set<string>();

  for (const p of points) {
    if (p.numericValue === null) continue;
    if (!periodMap.has(p.periodLabel)) periodMap.set(p.periodLabel, {});
    periodMap.get(p.periodLabel)![p.sourceCode] = p.numericValue;
    sources.add(p.sourceCode);
  }

  const chartData = [...periodMap.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([period, values]) => ({ period, ...values }));

  const sourceList = [...sources];

  return (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart data={chartData} margin={{ top: 4, right: 8, bottom: 4, left: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(115,192,242,0.1)" />
        <XAxis
          dataKey="period"
          tick={{ fill: "rgba(183,220,245,0.65)", fontSize: 11 }}
          tickLine={false}
          axisLine={{ stroke: "rgba(115,192,242,0.2)" }}
          interval="preserveStartEnd"
        />
        <YAxis
          tickFormatter={(v: number) => formatValue(v, unitLabel)}
          tick={{ fill: "rgba(183,220,245,0.65)", fontSize: 11 }}
          tickLine={false}
          axisLine={false}
          width={56}
        />
        <Tooltip content={<CustomTooltip unitLabel={unitLabel} />} />
        {sourceList.length > 1 && (
          <Legend
            wrapperStyle={{ fontSize: 11, color: "rgba(183,220,245,0.8)" }}
          />
        )}
        {sourceList.map((src) => (
          <Line
            key={src}
            type="monotone"
            dataKey={src}
            name={src.replace(/_/g, " ")}
            stroke={colorFor(src)}
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 4, strokeWidth: 0 }}
            connectNulls
          />
        ))}
      </LineChart>
    </ResponsiveContainer>
  );
}