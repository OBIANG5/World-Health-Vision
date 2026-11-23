/**
 * WORLD-VISION V3 / GEO-1.
 * The genuine selected country geometry from the SAME embedded GeoJSON used by
 * the interactive Globe. This is not a photograph, illustration, choropleth,
 * risk map, provinces data or assertion of disputed-border sovereignty.
 *
 * A low-bandwidth fallback and an accessible list are always available.
 */
import { useEffect, useMemo, useState } from "react";
import type { FeatureCollection, Feature, Geometry } from "geojson";
import type { CountrySummary } from "../../api/types";
import { WorldIcon } from "../ui/WorldIcon";

type MapStatus =
  | { kind: "loading" }
  | { kind: "missing" }
  | { kind: "ready"; feature: Feature };

const WIDTH = 900;
const HEIGHT = 450;
const PADDING = 42;
function polygons(geometry: Geometry | null): number[][][][] {
  if (!geometry) return [];
  if (geometry.type === "Polygon") return [geometry.coordinates];
  if (geometry.type === "MultiPolygon") return geometry.coordinates;
  return [];
}
/** Ignore antimeridian seams when calculating a country's local extent.
 * For countries spanning the antimeridian the map deliberately fails closed
 * to a text fallback until an authoritative wrap policy is integrated.
 */
function makeMapPaths(feature: Feature) {
  const polys = polygons(feature.geometry);
  const positions = polys.flat(2);
  if (!positions.length) return null;
  const xs = positions.map(p => p[0]);
  const ys = positions.map(p => p[1]);
  const minX = Math.min(...xs), maxX = Math.max(...xs);
  const minY = Math.min(...ys), maxY = Math.max(...ys);
  if (maxX - minX > 180 || !isFinite(maxX - minX) ||
    maxX === minX || maxY === minY) return null;
  // Preserve shape at higher latitudes without pretending to have relief.
  const lat = ((minY + maxY) / 2) * Math.PI / 180;
  const longitudeScale = Math.max(.23, Math.cos(lat));
  const scale = Math.min(
    (WIDTH - 2 * PADDING) / ((maxX - minX) * longitudeScale),
    (HEIGHT - 2 * PADDING) / (maxY - minY),
  );
  const cx = (minX + maxX) / 2, cy = (minY + maxY) / 2;
  function screen(point: number[]) {
    return [
      WIDTH / 2 + (point[0] - cx) * longitudeScale * scale,
      HEIGHT / 2 - (point[1] - cy) * scale,
    ];
  }
  const paths = polys.map(poly => poly.map(ring =>
    ring.map((p, i) => {
      const [x, y] = screen(p);
      return `${i === 0 ? "M" : "L"}${x.toFixed(2)},${y.toFixed(2)}`;
    }).join(" ") + " Z",
  ).join(" "));
  return paths;
}

export default function CountryGeographicHero({
  iso3, country, language, onCompare, onNews, onFollow, followed,
}: {
  iso3: string;
  country: CountrySummary | null;
  language: "fr" | "en";
  onCompare: () => void;
  onNews: () => void;
  onFollow?: () => void;
  followed?: boolean;
}) {
  const fr = language === "fr";
  const [map, setMap] = useState<MapStatus>({ kind: "loading" });
  const [zoom, setZoom] = useState(1);
  useEffect(() => {
    const ac = new AbortController();
    // Same offline-first geometry as GlobeMap; no per-country provider call.
    fetch("/countries.geojson", { signal: ac.signal })
      .then(r => {
        if (!r.ok) throw Error("Geography unavailable");
        return r.json() as Promise<FeatureCollection>;
      })
      .then(data => {
        if (ac.signal.aborted) return;
        if (data.type !== "FeatureCollection" || !Array.isArray(data.features)) {
          setMap({ kind: "missing" }); return;
        }
        const found = data.features.find(feature =>
          feature.properties?.["ISO3166-1-Alpha-3"] === iso3);
        setMap(found ? { kind: "ready", feature: found } : { kind: "missing" });
      })
      .catch(() => { if (!ac.signal.aborted) setMap({ kind: "missing" }); });
    return () => ac.abort();
  }, [iso3]);

  const paths = useMemo(
    () => map.kind === "ready" ? makeMapPaths(map.feature) : null,
    [map],
  );
  const display = country?.displayName ?? iso3;
  return <section className="wv3-geo-hero" aria-label={fr
    ? `Territoire et identité de ${display}` : `Geography and identity of ${display}`}>
    <div className="wv3-country-map" aria-label={fr
      ? `Carte géographique de ${display}` : `Geographic map of ${display}`}>
      <div className="wv3-map-topline">
        <span>{fr ? "ATLAS / TERRITOIRE" : "ATLAS / TERRITORY"}</span>
        <span>{iso3}</span>
      </div>
      {paths ? <svg className="wv3-country-geometry"
        viewBox="0 0 900 450" role="img"
        aria-label={fr ? `Contour géographique de ${display}, zoom ${zoom}` : `Geographic outline of ${display}, zoom ${zoom}`}>
        <defs>
          <pattern id="wv3-map-lines" width="42" height="42" patternUnits="userSpaceOnUse">
            <path d="M42 0H0V42" fill="none" stroke="#c8dbe1" strokeWidth=".7" />
          </pattern>
          <linearGradient id="wv3-country-fill" x1="0" y1="0" x2="1" y2="1">
            <stop stopColor="#658d75"/>
            <stop offset="1" stopColor="#b0ba91"/>
          </linearGradient>
        </defs>
        <rect width={WIDTH} height={HEIGHT} fill="url(#wv3-map-lines)" opacity=".65"/>
        <g transform={`translate(${WIDTH/2} ${HEIGHT/2}) scale(${zoom}) translate(-${WIDTH/2} -${HEIGHT/2})`}>
          {paths.map((d, i) => <path key={i} d={d} fill="url(#wv3-country-fill)"
            fillRule="evenodd" stroke="#f9ffff" strokeWidth={2.9 / zoom}
            strokeLinejoin="round" vectorEffect="non-scaling-stroke"/>)}
        </g>
      </svg> : <div className="wv3-map-unavailable" role="status">
        <WorldIcon name="map" size={35}/>
        <strong>{map.kind === "loading" ? (fr ? "Chargement du contour…" : "Loading geographic outline…")
          : (fr ? "Contour non disponible" : "Geographic outline unavailable")}</strong>
        <span>{fr ? "La fiche et les services restent accessibles." : "Country information and services remain accessible."}</span>
      </div>}
      <div className="wv3-map-controls">
        <button type="button" aria-label={fr ? "Agrandir la carte" : "Zoom in"}
          onClick={() => setZoom(v => Math.min(2.1, +(v + .25).toFixed(2)))} disabled={!paths}>+</button>
        <button type="button" aria-label={fr ? "Réduire la carte" : "Zoom out"}
          onClick={() => setZoom(v => Math.max(1, +(v - .25).toFixed(2)))} disabled={!paths}>−</button>
        <button type="button" aria-label={fr ? "Recentrer la carte" : "Reset map zoom"}
          onClick={() => setZoom(1)} disabled={!paths}><WorldIcon name="compass" size={17}/></button>
      </div>
      <p className="wv3-map-attribution">{fr
        ? "Limites du GeoJSON embarqué · les provinces et le relief ne sont pas fournis par cette couche"
        : "Embedded GeoJSON boundaries · provinces and terrain are not provided by this layer"}</p>
    </div>
    <div className="wv3-country-identity">
      <span className="wv3-eyebrow">{fr ? "FICHE DU PAYS" : "COUNTRY PROFILE"} · {iso3}</span>
      <h2>{display}</h2>
      <p>{country?.regionName ?? (fr ? "Territoire à explorer" : "Explore this territory")}</p>
      <dl>
        {country?.capitalCity && <div><dt>{fr ? "Capitale" : "Capital"}</dt><dd>{country.capitalCity}</dd></div>}
        {country?.currencyCode && <div><dt>{fr ? "Devise" : "Currency"}</dt><dd>{country.currencyCode}</dd></div>}
      </dl>
      <div className="wv3-country-key-actions">
        <button type="button" onClick={onCompare}><WorldIcon name="scale" size={17}/>{fr ? "Comparer" : "Compare"}</button>
        <button type="button" onClick={onNews}><WorldIcon name="book" size={17}/>{fr ? "Actualités" : "News"}</button>
        {onFollow && <button type="button" aria-pressed={!!followed} onClick={onFollow}>
          <WorldIcon name="star" size={17}/>{followed ? (fr ? "Enregistré" : "Saved") : (fr ? "Suivre ce pays" : "Follow country")}
        </button>}
      </div>
      <small>{fr ? "Suivre enregistre ce pays dans les favoris. Les notifications autonomes nécessitent Watch Vision."
        : "Following saves this country as a favorite. Automated notifications require Watch Vision."}</small>
    </div>
  </section>;
}
