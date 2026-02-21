import { useEffect, useMemo, useState } from "react";
import "./App.css";

import "leaflet/dist/leaflet.css";
import { MapContainer, TileLayer, GeoJSON, useMap } from "react-leaflet";
import type { Feature, FeatureCollection, Geometry } from "geojson";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

type Point = { year: number; value: number };

type TrendInfo = {
  trend: "UP" | "DOWN" | "STABLE" | "INSUFFICIENT_DATA";
  window?: number;
  points_used?: number;
  slope?: number;
  slope_relative?: number;
  threshold_relative?: number;
  method?: string;
};

type SeriesResponse = {
  country_iso3: string;
  indicator: string;
  from_year: number | null;
  to_year: number | null;
  points: number;
  series: Point[];
  trend?: TrendInfo;
};

type IndicatorsResponse = { count: number; indicators: string[] };

// ⚠️ ton API locale
const API_BASE = "http://127.0.0.1:8000";

// GeoJSON gratuit avec ISO_A3 + ADMIN (nom)
const WORLD_GEOJSON_URL =
  "https://raw.githubusercontent.com/datasets/geo-countries/master/data/countries.geojson";

// Labels (tu peux en ajouter)
const INDICATOR_LABELS: Record<string, string> = {
  "NY.GDP.MKTP.CD": "PIB (USD courants)",
  "NY.GDP.PCAP.CD": "PIB/hab (USD courants)",
  "NY.GDP.MKTP.KD.ZG": "Croissance PIB (%)",
  "FP.CPI.TOTL.ZG": "Inflation CPI (%)",
  "SP.POP.TOTL": "Population",
  "SL.UEM.TOTL.ZS": "Chômage (%)",
  "SP.DYN.LE00.IN": "Espérance de vie (ans)",
};

function FitToWorld() {
  const map = useMap();
  useEffect(() => {
    map.fitWorld({ padding: [10, 10] });
  }, [map]);
  return null;
}

function clampYear(v: string, fallback: number) {
  const n = Number(v);
  if (!Number.isFinite(n)) return fallback;
  return Math.max(1960, Math.min(2024, Math.trunc(n)));
}

export default function App() {
  // UI
  const [drawerOpen, setDrawerOpen] = useState(false);

  // World geojson
  const [world, setWorld] = useState<FeatureCollection<Geometry> | null>(null);
  const [worldLoading, setWorldLoading] = useState(true);
  const [worldError, setWorldError] = useState<string | null>(null);

  // Indicators list
  const [indicators, setIndicators] = useState<string[]>(Object.keys(INDICATOR_LABELS));

  // Selection
  const [countryIso3, setCountryIso3] = useState("FRA");
  const [countryName, setCountryName] = useState("France");
  const [indicator, setIndicator] = useState("NY.GDP.MKTP.CD");
  const [fromYear, setFromYear] = useState(2000);
  const [toYear, setToYear] = useState(2024);

  // Data
  const [data, setData] = useState<SeriesResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const theme = useMemo(
    () => ({
      bg: "#050B12",
      text: "rgba(240, 248, 255, 0.92)",
      muted: "rgba(240, 248, 255, 0.70)",
      stroke: "rgba(120, 190, 230, 0.95)",
      accent: "rgba(42,167,214,1)",
      accentSoft: "rgba(42,167,214,0.22)",
      ok: "rgba(90, 220, 160, 0.95)",
      danger: "rgba(255, 110, 110, 0.92)",
    }),
    []
  );

  // Load world geojson
  useEffect(() => {
    let alive = true;
    (async () => {
      setWorldLoading(true);
      setWorldError(null);
      try {
        const r = await fetch(WORLD_GEOJSON_URL);
        if (!r.ok) throw new Error(`GeoJSON HTTP ${r.status}`);
        const j = (await r.json()) as FeatureCollection<Geometry>;
        if (alive) setWorld(j);
      } catch (e: any) {
        if (alive) setWorldError(String(e?.message || e));
      } finally {
        if (alive) setWorldLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  // Load indicators from API (si dispo)
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const r = await fetch(`${API_BASE}/indicators`);
        if (!r.ok) return;
        const j = (await r.json()) as IndicatorsResponse;
        if (alive && j?.indicators?.length) setIndicators(j.indicators);
      } catch {}
    })();
    return () => {
      alive = false;
    };
  }, []);

  async function fetchSeriesFor(iso3: string, ind: string, fy: number, ty: number) {
    setLoading(true);
    setErr(null);
    try {
      const url =
        `${API_BASE}/country/${iso3}/indicator/${ind}` +
        `?from_year=${fy}&to_year=${ty}&include_trend=true&trend_window=10`;

      const r = await fetch(url);
      if (!r.ok) {
        const t = await r.text();
        throw new Error(`API ${r.status}: ${t}`);
      }
      const j = (await r.json()) as SeriesResponse;
      setData(j);
    } catch (e: any) {
      setData(null);
      setErr(String(e?.message || e));
    } finally {
      setLoading(false);
    }
  }

  // Auto-load initial
  useEffect(() => {
    fetchSeriesFor(countryIso3, indicator, fromYear, toYear);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Geo style
  function geoStyle(_f: Feature) {
    return {
      weight: 1.1,
      color: theme.stroke,
      fillColor: "rgba(8, 28, 50, 0.55)",
      fillOpacity: 0.82,
    };
  }

  // IMPORTANT: clic pays => ouvre drawer + requête API immédiatement
  function onEachCountry(feature: Feature, layer: any) {
    const props = (feature.properties || {}) as any;
    const iso = String(props.ISO_A3 || "").toUpperCase();
    const name = String(props.ADMIN || props.NAME || iso);

    layer.on({
      click: () => {
        if (!iso || iso === "-99") return;

        setCountryIso3(iso);
        setCountryName(name);
        setDrawerOpen(true);

        // ✅ requête API immédiate (pas besoin d’attendre setState)
        fetchSeriesFor(iso, indicator, fromYear, toYear);
      },
      mouseover: () => {
        layer.setStyle({
          fillColor: theme.accentSoft,
          color: theme.accent,
          weight: 1.8,
        });
      },
      mouseout: () => {
        layer.setStyle(geoStyle(feature));
      },
    });
  }

  const chartData = useMemo(() => data?.series || [], [data?.series]);

  const trendPill = useMemo(() => {
    const t = data?.trend;
    if (!t) return null;
    if (t.trend === "INSUFFICIENT_DATA") {
      return { label: "DATA INSUFFISANTE", color: theme.danger };
    }
    const rel = t.slope_relative ?? 0;
    const pct = Math.round(rel * 10000) / 100;
    const label = `${t.trend} (${pct}% / an approx)`;
    const color = t.trend === "UP" ? theme.ok : t.trend === "DOWN" ? theme.danger : theme.muted;
    return { label, color };
  }, [data?.trend, theme.danger, theme.muted, theme.ok]);

  return (
    <div className="whv-root" style={{ background: theme.bg, color: theme.text }}>
      {/* Header (logo + titre) */}
      <div className="whv-header">
        {/* ✅ Mets ton logo ici : src/assets/logo.png */}
        <img className="whv-logo" src="/src/assets/logo.png" alt="WorldHealth Vision" />
        <div className="whv-title">WorldHealth Vision — V0</div>
      </div>

      {/* Eye arcs (gros, sortent de l’écran) */}
      <div className="whv-eye-overlay" aria-hidden>
        <svg viewBox="0 0 1200 420" preserveAspectRatio="none">
          {/* Haut : plus grand / plus clair */}
          <path
            d="M -220 290 Q 600 -180 1420 290"
            fill="none"
            stroke="rgba(55, 155, 210, 0.45)"
            strokeWidth="40"
            strokeLinecap="round"
          />
          {/* Bas : bien visible */}
          <path
            d="M -220 130 Q 600 600 1420 130"
            fill="none"
            stroke="rgba(55, 155, 210, 0.35)"
            strokeWidth="40"
            strokeLinecap="round"
          />
        </svg>
      </div>

      {/* Map */}
      <div className="whv-map-shell">
        {worldLoading && <div className="whv-toast">Chargement carte…</div>}
        {worldError && <div className="whv-toast whv-toast-error">Erreur carte: {worldError}</div>}

        <MapContainer
          style={{ height: "100%", width: "100%" }}
          center={[15, 0]}
          zoom={2}
          minZoom={2}
          scrollWheelZoom={true}
        >
          <FitToWorld />

          <TileLayer
            attribution='&copy; OpenStreetMap contributors &copy; CARTO'
            url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
          />

          {world && (
            <GeoJSON
              data={world as any}
              style={(f: any) => geoStyle(f)}
              onEachFeature={(f: any, layer: any) => onEachCountry(f, layer)}
            />
          )}
        </MapContainer>
      </div>

      {/* Drawer */}
      <div className={`whv-drawer ${drawerOpen ? "open" : ""}`}>
        <div className="whv-drawer-header">
          <div className="whv-drawer-title">
            {countryName} <span className="whv-muted">({countryIso3})</span>
          </div>
          <button className="whv-close" onClick={() => setDrawerOpen(false)} aria-label="Fermer">
            ✕
          </button>
        </div>

        <div className="whv-section">
          <div className="whv-label">Indicateur</div>
          <select
            className="whv-select"
            value={indicator}
            onChange={(e) => {
              const v = e.target.value;
              setIndicator(v);
              // ✅ si drawer ouvert, recharge direct
              if (drawerOpen) fetchSeriesFor(countryIso3, v, fromYear, toYear);
            }}
          >
            {indicators.map((k) => (
              <option key={k} value={k}>
                {(INDICATOR_LABELS[k] ? `${INDICATOR_LABELS[k]} — ` : "") + k}
              </option>
            ))}
          </select>

          <div className="whv-row">
            <div style={{ flex: 1 }}>
              <div className="whv-label">from_year</div>
              <input
                className="whv-input"
                value={fromYear}
                onChange={(e) => {
                  const v = clampYear(e.target.value, 2000);
                  setFromYear(v);
                  if (drawerOpen) fetchSeriesFor(countryIso3, indicator, v, toYear);
                }}
              />
            </div>
            <div style={{ flex: 1 }}>
              <div className="whv-label">to_year</div>
              <input
                className="whv-input"
                value={toYear}
                onChange={(e) => {
                  const v = clampYear(e.target.value, 2024);
                  setToYear(v);
                  if (drawerOpen) fetchSeriesFor(countryIso3, indicator, fromYear, v);
                }}
              />
            </div>
          </div>

          <button
            className="whv-btn"
            onClick={() => fetchSeriesFor(countryIso3, indicator, fromYear, toYear)}
            disabled={loading}
          >
            {loading ? "Chargement..." : "Rafraîchir"}
          </button>

          {err && <div className="whv-error">❌ {err}</div>}
        </div>

        <div className="whv-section">
          <div className="whv-section-title">
            Tendance
            {trendPill && (
              <span className="whv-pill" style={{ borderColor: trendPill.color, color: trendPill.color }}>
                {trendPill.label}
              </span>
            )}
          </div>
        </div>

        <div className="whv-section">
          <div className="whv-section-title">
            Courbe <span className="whv-muted">({data?.points ?? 0} points)</span>
          </div>

          <div className="whv-chart">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <XAxis dataKey="year" tick={{ fill: "rgba(240,248,255,0.7)", fontSize: 12 }} />
                <YAxis tick={{ fill: "rgba(240,248,255,0.7)", fontSize: 12 }} />
                <Tooltip />
                <Line
                  type="monotone"
                  dataKey="value"
                  stroke="rgba(42,167,214,0.95)"
                  dot={false}
                  strokeWidth={2.2}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="whv-footer">
          Clique un pays → la fiche se met à jour automatiquement.
        </div>
      </div>
    </div>
  );
}
