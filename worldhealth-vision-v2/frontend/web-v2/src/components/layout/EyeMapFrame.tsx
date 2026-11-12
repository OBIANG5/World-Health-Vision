// WorldHealthVision V2 — EyeMapFrame
// Contient la carte interactive clippée en forme d'œil.
// Design inspiré du logo officiel : bordure épaisse navy, globe en pupille.

import { memo, useMemo, useState } from "react";
import WorldMap from "../map/WorldMap";
import GlobeMap from "../map/GlobeMap";
import type { CountrySummary } from "../../api/types";
import "../../styles/eye.css";

type EyeMapFrameProps = {
  drawerOpen: boolean;
  countries: CountrySummary[];
  selectedCountryIso3: string;
  onCountryClick: (iso3: string) => void;
};

// Chemin SVG de la forme mandorla (œil).
// Ouverture VERTICALE volontairement très haute : le centre-haut monte à y=-40
// (au-dessus du viewBox) et le centre-bas descend à y=800 (en-dessous).
// Les pointes gauche/droite restent à y=380. Résultat : l'espace intérieur
// de l'œil est assez grand pour contenir tout le cercle du globe, et les arcs
// encadrent ce cercle par l'extérieur (ils sortent de l'écran en haut/bas,
// ce qui est voulu). overflow:visible sur .eye-svg autorise ce débordement.
const EYE_PATH =
  "M30 380 C210 82, 500 -40, 800 -40 C1100 -40, 1390 82, 1570 380 C1390 678, 1100 800, 800 800 C500 800, 210 678, 30 380 Z";

// Même chemin normalisé 0–1 pour clipPathUnits="objectBoundingBox"
// (les valeurs <0 et >1 placent le contour hors de la boîte → la sclère/carte
//  remplissent jusqu'au bord, et les arcs couvrent le reste).
const EYE_PATH_NORM =
  "M0.01875 0.5 C0.13125 0.10789,0.3125 -0.05263,0.5 -0.05263 C0.6875 -0.05263,0.86875 0.10789,0.98125 0.5 C0.86875 0.89211,0.6875 1.05263,0.5 1.05263 C0.3125 1.05263,0.13125 0.89211,0.01875 0.5 Z";

function EyeMapFrame({
  drawerOpen,
  countries,
  selectedCountryIso3,
  onCountryClick,
}: EyeMapFrameProps) {
  const [mapMode, setMapMode] = useState<"globe" | "eye">("globe");
  const activeIso3Set = useMemo(() => new Set(countries.map((c) => c.iso3)), [countries]);

  // Dictionnaire iso3 → CountrySummary pour les tooltips enrichis de WorldMap
  const countriesMap = useMemo(() => new Map(countries.map((c) => [c.iso3, c])), [countries]);

  return (
    <section className={"eye-stage " + (drawerOpen ? "drawer-open " : "") + (mapMode === "globe" ? "globe-mode" : "eye-mode")}>
      <div className="whv-map-mode-switch" role="group" aria-label="Choisir la représentation du monde">
        <button type="button" aria-pressed={mapMode === "globe"} onClick={() => setMapMode("globe")}>🌐 Globe</button>
        <button type="button" aria-pressed={mapMode === "eye"} onClick={() => setMapMode("eye")}>◉ Carte œil</button>
      </div>
      {mapMode === "globe" ? <GlobeMap countriesMap={countriesMap} selectedCountryIso3={selectedCountryIso3} onCountryClick={onCountryClick}/> : (
      <div className="eye-scene">
        {/* Définition clipPath invisible */}
        <svg width="0" height="0" className="eye-defs-svg" aria-hidden="true">
          <defs>
            <clipPath id="whv-eye-clip" clipPathUnits="objectBoundingBox">
              <path d={EYE_PATH_NORM} />
            </clipPath>
          </defs>
        </svg>

        {/* Couche 1 : sclère — le blanc de l'œil, visible entre le globe et la bordure */}
        <div className="eye-sclera" aria-hidden="true" />

        {/* Couche 2 : carte Leaflet masquée en iris (globe central) */}
        <div className="eye-map-surface">
          <WorldMap
            activeIso3Set={activeIso3Set}
            selectedCountryIso3={selectedCountryIso3}
            onCountryClick={onCountryClick}
            countriesMap={countriesMap}
          />
        </div>

        {/* Couche 3 : SVG décoratif — bordure épaisse + bague limbique */}
        <svg
          className="eye-svg"
          viewBox="0 0 1600 760"
          preserveAspectRatio="none"
          aria-hidden="true"
        >
          <defs>
            <filter id="whv-eye-glow" x="-8%" y="-15%" width="116%" height="130%">
              <feGaussianBlur stdDeviation="6" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {/* Halo extérieur diffus — déborde hors de l'écran en haut/bas (voulu) */}
          <path
            d={EYE_PATH}
            fill="none"
            stroke="rgba(10, 60, 120, 0.30)"
            strokeWidth={210}
            strokeLinecap="round"
            strokeLinejoin="round"
            filter="url(#whv-eye-glow)"
          />

          {/* Bordure solide — épaisseur d'origine (155). C'est l'OUVERTURE de l'œil
              qui a été agrandie (path plus haut), pas l'épaisseur de l'arc.
              L'arc encadre désormais le cercle par l'extérieur. */}
          <path
            d={EYE_PATH}
            fill="none"
            stroke="#082843"
            strokeWidth={155}
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Reflet lumineux interne — lisère clair sur l'intérieur de l'arc */}
          <path
            d={EYE_PATH}
            fill="none"
            stroke="rgba(160, 220, 255, 0.10)"
            strokeWidth={153}
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Filet bleu sur le bord intérieur */}
          <path
            d={EYE_PATH}
            fill="none"
            stroke="rgba(77, 184, 255, 0.20)"
            strokeWidth={2.5}
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Anneau limbique — INCHANGÉ : correspond exactement à l'iris mask
              (ellipse 20% 44%). rx=320 ry=334 → cercle de ~444px de rayon à 1080p.
              Avec l'œil agrandi, les arcs encadrent maintenant ce cercle par
              l'extérieur au lieu de le recouvrir. Le cercle reste entier et grand. */}
          <ellipse
            cx="800"
            cy="380"
            rx="320"
            ry="334"
            fill="none"
            stroke="rgba(6, 28, 50, 0.65)"
            strokeWidth={4}
          />

          {/* Ombre interne de l'anneau limbique */}
          <ellipse
            cx="800"
            cy="380"
            rx="320"
            ry="334"
            fill="none"
            stroke="rgba(0, 8, 18, 0.30)"
            strokeWidth={30}
          />
        </svg>
      </div>
      )}
    </section>
  );
}
export default memo(EyeMapFrame);
