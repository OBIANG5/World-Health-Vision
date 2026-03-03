/*
Ce fichier est responsable de:
- afficher l ecran principal du front (carte, panneau lateral, courbe)
- definir les contrats de donnees entre front et backend
- configurer la vue Leaflet (centre, zoom, bornes)
- charger le GeoJSON local des pays
- charger la liste des indicateurs depuis l API avec repli local
- gerer les etats React (selection, chargement, erreurs, donnees)
- gerer les interactions utilisateur sur la carte et dans le panneau
- lancer les requetes API et afficher tendance + serie temporelle
- afficher une comparaison multi-pays dans la fiche (courbe multi-lignes)
*/
import { useEffect, useMemo, useState } from "react";
import "./App.css";

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

// Point annuel retourne par le backend pour la courbe.
type Point = { year: number; value: number };

// Meta-information de tendance retournee par le backend.
type TrendInfo = {
  trend: "UP" | "DOWN" | "STABLE" | "INSUFFICIENT_DATA";
  window?: number;
  points_used?: number;
  slope?: number;
  slope_relative?: number;
  threshold_relative?: number;
  method?: string;
};

type DescriptiveStats = {
  mean: number;
  median: number;
  min: number;
  max: number;
};

// Contrat de la route /country/{iso3}/indicator/{indicator}.
type SeriesResponse = {
  country_iso3: string;
  indicator: string;
  from_year: number | null;
  to_year: number | null;
  points: number;
  series: Point[];
  trend?: TrendInfo;
  stats?: DescriptiveStats;
};

// Contrat de la route /indicators.
type IndicatorsResponse = { count: number; indicators: string[] };

// Contrat de la route /compare.
type CompareResponse = {
  indicator: string;
  countries: Record<string, Point[]>;
};

// URL de base du backend local.
const API_BASE = "http://127.0.0.1:8000";

// Source GeoJSON locale (fichier place dans /public).
const WORLD_GEOJSON_URL = "/countries.geojson";
// Reglages de camera Leaflet pour cadrer le monde.
const WORLD_CENTER: [number, number] = [15, 0];
const WORLD_ZOOM = 2.8;
const WORLD_MIN_ZOOM = 2.6;
const WORLD_BOUNDS: [[number, number], [number, number]] = [[-85, -180], [85, 180]];

// Libelles d affichage pour les indicateurs (modifiable).
const INDICATOR_LABELS: Record<string, string> = {
  "NY.GDP.MKTP.CD": "PIB (USD courants)",
  "NY.GDP.PCAP.CD": "PIB/hab (USD courants)",
  "NY.GDP.MKTP.KD.ZG": "Croissance PIB (%)",
  "FP.CPI.TOTL.ZG": "Inflation CPI (%)",
  "SP.POP.TOTL": "Population",
  "SL.UEM.TOTL.ZS": "Chomage (%)",
  "SP.DYN.LE00.IN": "Esperance de vie (ans)",
};

const COMPARE_LINE_COLORS = [
  "#2aa7d6",
  "#5adc9f",
  "#f5b642",
  "#ff7a7a",
  "#b286ff",
  "#58c4dd",
];

const ISO3_FALLBACK_BY_NAME: Record<string, string> = {
  FRANCE: "FRA",
};

// Sous-composant Leaflet: impose une vue monde stable au rendu et au resize.
function FitToWorld() {
  const map = useMap();
  useEffect(() => {
    // Reapplique les contraintes de vue pour eviter un mauvais cadrage initial.
    const applyStableView = () => {
      map.invalidateSize(false);
      map.setMinZoom(WORLD_MIN_ZOOM);
      map.setView(WORLD_CENTER, WORLD_ZOOM, { animate: false });
      map.setMaxBounds(WORLD_BOUNDS);
    };

    applyStableView();
    // Deuxieme passe courte utile quand le layout finit de se stabiliser.
    const t = window.setTimeout(applyStableView, 60);
    // Recalcule la taille de carte quand la fenetre change.
    const onResize = () => map.invalidateSize(false);
    window.addEventListener("resize", onResize);

    return () => {
      window.clearTimeout(t);
      window.removeEventListener("resize", onResize);
    };
  }, [map]);
  return null;
}

// Normalise une annee saisie: entier, valide, puis borne entre 1960 et 2024.
function clampYear(v: string, fallback: number) {
  const n = Number(v);
  if (!Number.isFinite(n)) return fallback;
  return Math.max(1960, Math.min(2024, Math.trunc(n)));
}

function normalizeCountriesCsv(csv: string, primaryIso?: string) {
  const parts = csv
    .split(",")
    .map((p) => p.trim().toUpperCase())
    .filter((p) => p.length > 0);

  const unique = [...new Set(parts)];
  if (primaryIso && !unique.includes(primaryIso)) {
    unique.unshift(primaryIso);
  }
  return unique.join(",");
}

function buildCompareChartRows(countries: Record<string, Point[]>) {
  const byYear = new Map<number, Record<string, number | string>>();

  for (const [iso, points] of Object.entries(countries)) {
    for (const p of points) {
      const current = byYear.get(p.year) ?? { year: p.year };
      current[iso] = p.value;
      byYear.set(p.year, current);
    }
  }

  return Array.from(byYear.values()).sort((a, b) => Number(a.year) - Number(b.year));
}

export default function App() {
  // Etat d interface: panneau lateral ouvert/ferme.
  const [drawerOpen, setDrawerOpen] = useState(false);

  // Etat de chargement du GeoJSON monde.
  const [world, setWorld] = useState<FeatureCollection<Geometry> | null>(null);
  const [worldLoading, setWorldLoading] = useState(true);
  const [worldError, setWorldError] = useState<string | null>(null);

  // Liste des indicateurs affiches dans le select.
  const [indicators, setIndicators] = useState<string[]>(Object.keys(INDICATOR_LABELS));

  // Selection active de requete.
  const [countryIso3, setCountryIso3] = useState("FRA");
  const [countryName, setCountryName] = useState("France");
  const [indicator, setIndicator] = useState("NY.GDP.MKTP.CD");
  const [fromYear, setFromYear] = useState(2000);
  const [toYear, setToYear] = useState(2024);

  // Donnees backend et statut de requete.
  const [data, setData] = useState<SeriesResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  // Donnees de comparaison multi-pays.
  const [compareCountriesInput, setCompareCountriesInput] = useState("FRA,DEU,USA");
  const [compareData, setCompareData] = useState<CompareResponse | null>(null);
  const [compareLoading, setCompareLoading] = useState(false);
  const [compareErr, setCompareErr] = useState<string | null>(null);

  // Palette partagee pour la carte, le panneau et la courbe.
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

  // Charge le GeoJSON monde une seule fois depuis /public.
  // Le garde-fou "alive" evite un setState apres unmount.
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

  // Tente de charger le catalogue d indicateurs depuis l API.
  // Si indisponible, le select utilise la liste locale de repli.
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

  // Point central d appel API: utilise au chargement, au clic carte et aux controles.
  async function fetchSeriesFor(iso3: string, ind: string, fy: number, ty: number) {
    setLoading(true);
    setErr(null);
    try {
      // include_trend active le calcul de tendance affiche dans le badge.
      const url =
        `${API_BASE}/country/${iso3}/indicator/${ind}` +
        `?from_year=${fy}&to_year=${ty}&include_trend=true&trend_window=10&include_stats=true`;

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

  async function fetchCompareFor(
    countriesCsv: string,
    ind: string,
    fy: number,
    ty: number,
    primaryIso: string = countryIso3
  ) {
    const normalized = normalizeCountriesCsv(countriesCsv, primaryIso);
    if (!normalized) {
      setCompareData(null);
      setCompareErr("Veuillez saisir au moins un code ISO3");
      return;
    }

    setCompareCountriesInput(normalized);
    setCompareLoading(true);
    setCompareErr(null);

    try {
      const params = new URLSearchParams({
        countries: normalized,
        indicator: ind,
        from_year: String(fy),
        to_year: String(ty),
      });

      const r = await fetch(`${API_BASE}/compare?${params.toString()}`);
      if (!r.ok) {
        const t = await r.text();
        throw new Error(`API ${r.status}: ${t}`);
      }
      const j = (await r.json()) as CompareResponse;
      setCompareData(j);
    } catch (e: any) {
      setCompareData(null);
      setCompareErr(String(e?.message || e));
    } finally {
      setCompareLoading(false);
    }
  }

  // Charge une premiere serie avec la selection par defaut.
  useEffect(() => {
    fetchSeriesFor(countryIso3, indicator, fromYear, toYear);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Style de base applique a chaque polygone pays.
  function geoStyle(_f: Feature) {
    return {
      weight: 1.1,
      color: theme.stroke,
      fillColor: "rgba(8, 28, 50, 0.55)",
      fillOpacity: 0.82,
    };
  }

  // Lie les interactions (clic + survol) a chaque feature GeoJSON pays.
  // Le clic est critique: il ouvre le panneau et lance la requete de suite.
  function onEachCountry(feature: Feature, layer: any) {
    const props = (feature.properties || {}) as any;
    const name = String(props.ADMIN || props.NAME || props.NAME_EN || props.name || "").trim();

    // Accepte plusieurs noms de champ ISO selon la source GeoJSON.
    const isoCandidates = [
      props.ISO_A3,
      props["ISO3166-1-Alpha-3"],
      props.ADM0_A3,
      props.iso_a3,
    ]
      .map((v: unknown) => String(v ?? "").toUpperCase().trim())
      .filter(Boolean);

    let iso = isoCandidates.find((v) => /^[A-Z]{3}$/.test(v) && v !== "-99") || "";
    if (!iso) {
      const fallback = ISO3_FALLBACK_BY_NAME[name.toUpperCase()];
      if (fallback) iso = fallback;
    }

    const displayName = name || iso;

    layer.on({
      click: () => {
        if (!iso || iso === "-99") return;

        setCountryIso3(iso);
        setCountryName(displayName);
        setDrawerOpen(true);

        // Appel immediat avec les valeurs locales, sans attendre les setState asynchrones.
        fetchSeriesFor(iso, indicator, fromYear, toYear);
        const nextCompare = normalizeCountriesCsv(compareCountriesInput, iso);
        setCompareCountriesInput(nextCompare);
        fetchCompareFor(nextCompare, indicator, fromYear, toYear, iso);
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

  // Recharts attend un tableau: fallback [] pour eviter un rendu nul.
  const chartData = useMemo(() => data?.series || [], [data?.series]);
  const compareChartData = useMemo(
    () => (compareData ? buildCompareChartRows(compareData.countries) : []),
    [compareData]
  );
  const compareIsos = useMemo(
    () =>
      compareData
        ? Object.keys(compareData.countries).filter((iso) => (compareData.countries[iso] ?? []).length > 0)
        : [],
    [compareData]
  );

  // Transforme la tendance backend en modele d affichage (texte + couleur).
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

  function formatStatValue(value?: number) {
    if (value === undefined || value === null || !Number.isFinite(value)) return "-";
    const abs = Math.abs(value);
    if (abs >= 1_000_000) {
      return new Intl.NumberFormat("fr-FR", {
        notation: "compact",
        maximumFractionDigits: 2,
      }).format(value);
    }
    return new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 2 }).format(value);
  }

  return (
    <div className="whv-root" style={{ background: theme.bg, color: theme.text }}>
      {/* En-tete fixe: logo + titre du projet */}
      <div className="whv-header">
        {/* Logo charge depuis src/assets/logo.png */}
        <img className="whv-logo" src="/src/assets/logo.png" alt="WorldHealth Vision" />
        <div className="whv-title">WorldHealth Vision - V1</div>
      </div>

      {/* Arcs decoratifs de l oeil, uniquement visuels */}
      <div className="whv-eye-overlay" aria-hidden>
        <svg viewBox="0 0 1200 420" preserveAspectRatio="none">
          {/* Arc superieur */}
          <path
            d="M -220 290 Q 600 -180 1420 290"
            fill="none"
            stroke="rgba(55, 155, 210, 0.45)"
            strokeWidth="40"
            strokeLinecap="round"
          />
          {/* Arc inferieur */}
          <path
            d="M -220 130 Q 600 600 1420 130"
            fill="none"
            stroke="rgba(55, 155, 210, 0.35)"
            strokeWidth="40"
            strokeLinecap="round"
          />
        </svg>
      </div>

      {/* Zone carte plein ecran (tuiles + pays GeoJSON) */}
      <div className="whv-map-shell">
        {worldLoading && <div className="whv-toast">Chargement carte...</div>}
        {worldError && <div className="whv-toast whv-toast-error">Erreur carte: {worldError}</div>}

        <MapContainer
          // Reglages camera de la carte.
          style={{ height: "100%", width: "100%" }}
          center={WORLD_CENTER}
          zoom={WORLD_ZOOM}
          minZoom={WORLD_MIN_ZOOM}
          maxBounds={WORLD_BOUNDS}
          maxBoundsViscosity={1.0}
          zoomSnap={0.1}
          worldCopyJump={false}
          scrollWheelZoom={true}
        >
          <FitToWorld />

          <TileLayer
            // noWrap evite les copies horizontales multiples du monde.
            attribution='&copy; OpenStreetMap contributors &copy; CARTO'
            url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
            noWrap={true}
          />

          {world && (
            <GeoJSON
              // Le style et les interactions sont definis par geoStyle/onEachCountry.
              data={world as any}
              style={(f: any) => geoStyle(f)}
              onEachFeature={(f: any, layer: any) => onEachCountry(f, layer)}
            />
          )}
        </MapContainer>
      </div>

      {/* Panneau lateral droit: filtres, tendance et courbe */}
      <div className={`whv-drawer ${drawerOpen ? "open" : ""}`}>
        <div className="whv-drawer-header">
          <div className="whv-drawer-title">
            {countryName} <span className="whv-muted">({countryIso3})</span>
          </div>
          <button className="whv-close" onClick={() => setDrawerOpen(false)} aria-label="Fermer">
            X
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
              // Si le panneau est deja ouvert, on recharge immediatement.
              if (drawerOpen) {
                fetchSeriesFor(countryIso3, v, fromYear, toYear);
                fetchCompareFor(compareCountriesInput, v, fromYear, toYear);
              }
            }}
          >
            {indicators.map((k) => (
              <option key={k} value={k}>
                {(INDICATOR_LABELS[k] ? `${INDICATOR_LABELS[k]} - ` : "") + k}
              </option>
            ))}
          </select>

          <div className="whv-row">
            <div style={{ flex: 1 }}>
              <div className="whv-label">De l'année</div>
              <input
                className="whv-input"
                value={fromYear}
                onChange={(e) => {
                  const v = clampYear(e.target.value, 2000);
                  setFromYear(v);
                  if (drawerOpen) {
                    fetchSeriesFor(countryIso3, indicator, v, toYear);
                    fetchCompareFor(compareCountriesInput, indicator, v, toYear);
                  }
                }}
              />
            </div>
            <div style={{ flex: 1 }}>
              <div className="whv-label">à l'année</div>
              <input
                className="whv-input"
                value={toYear}
                onChange={(e) => {
                  const v = clampYear(e.target.value, 2024);
                  setToYear(v);
                  if (drawerOpen) {
                    fetchSeriesFor(countryIso3, indicator, fromYear, v);
                    fetchCompareFor(compareCountriesInput, indicator, fromYear, v);
                  }
                }}
              />
            </div>
          </div>

          <button
            className="whv-btn"
            onClick={() => {
              fetchSeriesFor(countryIso3, indicator, fromYear, toYear);
              fetchCompareFor(compareCountriesInput, indicator, fromYear, toYear);
            }}
            disabled={loading}
          >
            {loading ? "Chargement..." : "Rafraichir"}
          </button>

          {err && <div className="whv-error">Erreur: {err}</div>}
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
          <div className="whv-section-title">Statistiques descriptives</div>
          {data?.stats ? (
            <div className="whv-stats-grid">
              <div className="whv-stat-card">
                <div className="whv-stat-label">Moyenne</div>
                <div className="whv-stat-value">{formatStatValue(data.stats.mean)}</div>
              </div>
              <div className="whv-stat-card">
                <div className="whv-stat-label">Mediane</div>
                <div className="whv-stat-value">{formatStatValue(data.stats.median)}</div>
              </div>
              <div className="whv-stat-card">
                <div className="whv-stat-label">Minimum</div>
                <div className="whv-stat-value">{formatStatValue(data.stats.min)}</div>
              </div>
              <div className="whv-stat-card">
                <div className="whv-stat-label">Maximum</div>
                <div className="whv-stat-value">{formatStatValue(data.stats.max)}</div>
              </div>
            </div>
          ) : (
            <div className="whv-muted">Aucune statistique disponible</div>
          )}
        </div>

        <div className="whv-section">
          <div className="whv-section-title">Comparaison multi-pays</div>
          <div className="whv-label">Codes ISO3 separes par virgule</div>
          <input
            className="whv-input"
            placeholder="FRA,DEU,USA"
            value={compareCountriesInput}
            onChange={(e) => setCompareCountriesInput(e.target.value.toUpperCase())}
          />
          <button
            className="whv-btn whv-btn-compact"
            onClick={() => fetchCompareFor(compareCountriesInput, indicator, fromYear, toYear)}
            disabled={compareLoading}
          >
            {compareLoading ? "Comparaison..." : "Comparer"}
          </button>

          {compareErr && <div className="whv-error">Erreur: {compareErr}</div>}

          <div className="whv-chart whv-chart-compare">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={compareChartData}>
                <XAxis dataKey="year" tick={{ fill: "rgba(240,248,255,0.7)", fontSize: 12 }} />
                <YAxis tick={{ fill: "rgba(240,248,255,0.7)", fontSize: 12 }} />
                <Tooltip />
                {compareIsos.map((iso, idx) => (
                  <Line
                    key={iso}
                    type="monotone"
                    dataKey={iso}
                    stroke={COMPARE_LINE_COLORS[idx % COMPARE_LINE_COLORS.length]}
                    dot={false}
                    strokeWidth={2}
                  />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div className="whv-legend">
            {compareIsos.map((iso, idx) => (
              <span className="whv-legend-item" key={iso}>
                <span
                  className="whv-legend-dot"
                  style={{ background: COMPARE_LINE_COLORS[idx % COMPARE_LINE_COLORS.length] }}
                />
                {iso}
              </span>
            ))}
            {!compareIsos.length && <span className="whv-muted">Aucune serie comparable</span>}
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
          Clique un pays pour mettre a jour automatiquement la fiche.
        </div>
      </div>
    </div>
  );
}
