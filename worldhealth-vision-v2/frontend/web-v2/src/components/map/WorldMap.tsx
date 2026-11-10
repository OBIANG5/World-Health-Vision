// WorldHealthVision V2 — WorldMap
// Carte Leaflet interactive clippée dans la forme œil.
// Tooltip enrichi au survol : drapeau, devise, région.

import { memo, useCallback, useEffect, useRef, useState } from "react";
import { MapContainer, TileLayer, GeoJSON } from "react-leaflet";
import type { LatLngTuple, PathOptions, Layer, GeoJSON as LeafletGeoJSON } from "leaflet";
import type { Feature, FeatureCollection } from "geojson";
import type { CountrySummary } from "../../api/types";
import "leaflet/dist/leaflet.css";

const MAP_CENTER: LatLngTuple = [20, 0];
const ISO3_FIELD = "ISO3166-1-Alpha-3";

type Props = {
  activeIso3Set: Set<string>;
  selectedCountryIso3: string;
  onCountryClick: (iso3: string) => void;
  countriesMap?: Map<string, CountrySummary>;
};

// ---------- helpers ----------

function flagEmoji(iso2?: string | null): string {
  if (!iso2 || iso2.length !== 2) return "🌍";
  const base = 0x1f1e6;
  const A = 65;
  const up = iso2.toUpperCase();
  return (
    String.fromCodePoint(up.charCodeAt(0) - A + base) +
    String.fromCodePoint(up.charCodeAt(1) - A + base)
  );
}

function buildTooltipHtml(
  geoName: string,
  _iso3: string,
  country?: CountrySummary,
): string {
  const flag = flagEmoji(country?.iso2);
  const name = country?.displayName ?? geoName;
  const capital = country?.capitalCity;
  const currency = country?.currencyCode;
  const currencyName = country?.currencyName;
  const currencySymbol = country?.currencySymbol;
  const region = country?.subregionName ?? country?.regionName;

  const capitalRow = capital
    ? `<div class="wtc-row">🏛 ${capital}</div>`
    : "";

  let currencyRow = "";
  if (currency) {
    // Format: "💱 EUR — Euro (€)"  — évite les doublons type "ETB ETB"
    const parts: string[] = [currency];
    if (currencyName) parts.push(`— ${currencyName}`);
    if (currencySymbol && currencySymbol !== currency) parts.push(`(${currencySymbol})`);
    currencyRow = `<div class="wtc-row wtc-currency">💱 ${parts.join(" ")}</div>`;
  }

  const regionRow = region
    ? `<div class="wtc-row">🌍 ${region}</div>`
    : "";

  return `
    <div class="whv-tooltip-card">
      <div class="wtc-header">
        <span class="wtc-flag">${flag}</span>
        <span class="wtc-name">${name}</span>
      </div>
      ${capitalRow}${currencyRow}${regionRow}
    </div>
  `;
}

// ---------- styles Leaflet par état ----------

function countryStyle(
  feature: Feature | undefined,
  selectedIso3: string,
  activeIso3Set: Set<string>,
): PathOptions {
  const iso3 = feature?.properties?.[ISO3_FIELD] as string | undefined;
  const isSelected = iso3 === selectedIso3;
  const isActive = iso3 ? activeIso3Set.has(iso3) : false;

  if (isSelected) {
    return { fillColor: "#1a82d4", fillOpacity: 0.88, color: "#5bc5ff", weight: 2.8 };
  }
  if (isActive) {
    return { fillColor: "#0e3d56", fillOpacity: 0.72, color: "#1470a8", weight: 1.1 };
  }
  // Pays sans données — légèrement plus visible pour montrer le monde entier
  return { fillColor: "#0c2233", fillOpacity: 0.65, color: "#1b3448", weight: 0.7 };
}

// ---------- composant ----------

function WorldMap({
  activeIso3Set,
  selectedCountryIso3,
  onCountryClick,
  countriesMap,
}: Props) {
  const [geoData, setGeoData] = useState<FeatureCollection | null>(null);
  const geoLayerRef = useRef<LeafletGeoJSON | null>(null);
  // Leaflet installs event handlers once. These refs always point to the newest
  // selection, country registry and callback without recreating 200+ polygons.
  const liveRef = useRef({ selectedCountryIso3, activeIso3Set, onCountryClick, countriesMap });
  liveRef.current = { selectedCountryIso3, activeIso3Set, onCountryClick, countriesMap };

  useEffect(() => {
    fetch("/countries.geojson")
      .then((r) => r.json())
      .then((data: FeatureCollection) => setGeoData(data))
      .catch(() => {});
  }, []);

  const style = useCallback((feature?: Feature): PathOptions => {
    const current = liveRef.current;
    return countryStyle(feature, current.selectedCountryIso3, current.activeIso3Set);
  }, []);

  // React-Leaflet does not need a new GeoJSON instance when the selected country
  // changes. Updating styles in place preserves map position and touch gestures.
  useEffect(() => {
    geoLayerRef.current?.setStyle(style);
  }, [selectedCountryIso3, activeIso3Set, style]);

  const onEachFeature = useCallback((feature: Feature, layer: Layer) => {
    const iso3 = feature?.properties?.[ISO3_FIELD] as string | undefined;
    if (!iso3) return;

    const geoName = (feature.properties?.["name"] as string) ?? iso3;
    layer.on({
      click: () => liveRef.current.onCountryClick(iso3),
      mouseover: (e) => {
        const l = e.target as { setStyle: (s: PathOptions) => void };
        l.setStyle({ fillOpacity: 0.80, weight: 2.2, color: "#4ab8ff" });
        const content = buildTooltipHtml(geoName, iso3, liveRef.current.countriesMap?.get(iso3));
        const tooltipLayer = layer as Layer & {
          getTooltip?: () => { setContent: (html: string) => void } | undefined;
        };
        tooltipLayer.getTooltip?.()?.setContent(content);
      },
      mouseout: (e) => {
        const l = e.target as { setStyle: (s: PathOptions) => void };
        l.setStyle(style(feature));
      },
    });

    layer.bindTooltip(buildTooltipHtml(geoName, iso3, liveRef.current.countriesMap?.get(iso3)), {
      sticky: true,
      className: "whv-tooltip-rich",
      direction: "top",
      offset: [0, -4],
    });
  }, [style]);

  return (
    <MapContainer
      center={MAP_CENTER}
      zoom={2.0}
      minZoom={1.5}
      maxZoom={7}
      zoomControl={true}
      worldCopyJump={true}
      style={{ width: "100%", height: "100%" }}
    >
      <TileLayer
        url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
        attribution="&copy; OpenStreetMap &copy; CARTO"
      />
      {geoData && (
        <GeoJSON
          ref={geoLayerRef}
          data={geoData}
          style={style}
          onEachFeature={onEachFeature}
        />
      )}
    </MapContainer>
  );
}
export default memo(WorldMap);
