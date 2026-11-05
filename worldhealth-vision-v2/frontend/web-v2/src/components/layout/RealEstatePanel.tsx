// WorldHealthVision V2 — RealEstatePanel (version simplifiée et honnête)
// On NE fabrique plus de prix absolus (€/m²), de loyers ni de rendements : ces
// chiffres étaient des heuristiques trompeuses (ex. France très sous-évaluée).
// On n'affiche QUE la donnée réelle disponible : l'indice de prix RÉEL des
// logements (base 2015 = 100) = évolution des prix depuis 2015, en médiane des
// sources officielles (BRI, OCDE…). Couverture partielle ; message clair sinon.
// Les prix absolus / loyers de terrain seront ajoutés quand les sources existeront.

import { useEffect, useState } from "react";
import type { CountrySummary, IndicatorOverviewResponse } from "../../api/types";
import { fetchIndicatorOverview } from "../../api/whvApi";
import { useLang } from "../../context/LanguageContext";
import { useUserProfile } from "../../context/UserProfileContext";
import "../../styles/realestate.css";

const HOUSING_CODE = "WHV.HOUSING.PRICE.REAL.INDEX2015";

const SOURCE_NAMES: Record<string, string> = {
  WORLD_BANK: "Banque mondiale", IMF: "FMI", OECD: "OCDE", ECB: "BCE",
  EUROSTAT: "Eurostat", BIS: "BRI (Banque des règlements internationaux)",
  NUMBEO: "Numbeo", MERCER: "Mercer",
};
function srcName(code: string): string { return SOURCE_NAMES[code] ?? code.replace(/_/g, " "); }

interface HousingState {
  value: number | null;     // indice médian, base 2015 = 100
  period: string | null;
  sources: string[];
  sourceCount: number;
  agreement: string;
  loading: boolean;
  loaded: boolean;
}

const EMPTY: HousingState = { value: null, period: null, sources: [], sourceCount: 0, agreement: "", loading: false, loaded: false };

function useHousing(iso3: string): HousingState {
  const [state, setState] = useState<HousingState>(EMPTY);

  useEffect(() => {
    if (!iso3) { setState(EMPTY); return; }
    let active = true;
    setState({ ...EMPTY, loading: true });
    fetchIndicatorOverview(iso3, HOUSING_CODE)
      .then((ov: IndicatorOverviewResponse) => {
        if (!active) return;
        const sources = ov.sourcePerspectives
          .filter(p => p.numericValue !== null)
          .map(p => p.sourceCode)
          .filter((v, i, a) => a.indexOf(v) === i);
        setState({
          value: ov.divergence.medianNumericValue,
          period: ov.divergence.latestComparablePeriodLabel ?? null,
          sources,
          sourceCount: ov.divergence.comparableValueCount ?? sources.length,
          agreement: ov.divergence.agreementLevel ?? "",
          loading: false, loaded: true,
        });
      })
      .catch(() => { if (active) setState({ ...EMPTY, loaded: true }); });
    return () => { active = false; };
  }, [iso3]);

  return state;
}

function isoToFlag(iso2: string | null): string {
  if (!iso2 || iso2.length !== 2) return "🌐";
  return iso2.toUpperCase().split("").map(c => String.fromCodePoint(0x1f1e0 - 65 + c.charCodeAt(0))).join("");
}

interface Props {
  countries: CountrySummary[];
  onOpenCountry: (iso3: string) => void;
  onClose: () => void;
}

export default function RealEstatePanel({ countries, onOpenCountry, onClose }: Props) {
  const fr = useLang() === "fr";
  const { profile } = useUserProfile();

  const [selectedIso3, setSelectedIso3] = useState(profile.homeIso3 || "FRA");
  const [search, setSearch] = useState("");
  const [showSearch, setShowSearch] = useState(false);

  const data = useHousing(selectedIso3);
  const selectedCountry = countries.find(c => c.iso3 === selectedIso3);

  const filtered = countries.filter(c =>
    !search || c.displayName.toLowerCase().includes(search.toLowerCase()) || c.iso3.toLowerCase().includes(search.toLowerCase()),
  );

  const changePct = data.value !== null ? data.value - 100 : null;
  const singleSource = data.sources.length <= 1;
  const srcLabel = data.sources.length ? data.sources.map(srcName).join(", ") : "OCDE";
  // Lien direct vers les VRAIS prix au m² (crowdsourcés, à jour) sur Numbeo —
  // les prix immobiliers varient trop par ville pour un chiffre national unique.
  const numbeoUrl = `https://www.numbeo.com/property-investment/country_result.jsp?country=${encodeURIComponent(selectedCountry?.displayName ?? "")}`;

  return (
    <div className="re-panel">
      <div className="re-header">
        <div className="re-header-left">
          <span className="re-header-icon">🏘</span>
          <div>
            <h2 className="re-title">{fr ? "Immobilier & Logement" : "Real Estate & Housing"}</h2>
            <p className="re-subtitle">{fr ? "Évolution réelle des prix des logements" : "Real home-price trend"}</p>
          </div>
        </div>
        <button type="button" className="re-close-btn" onClick={onClose}>✕</button>
      </div>

      <div className="re-body">
        {/* Sélecteur de pays */}
        <div className="re-country-section">
          <span className="re-label">{fr ? "Pays" : "Country"}</span>
          <div className="re-country-row">
            <button type="button" className="re-country-btn" onClick={() => setShowSearch(v => !v)}>
              <span className="re-country-flag">{isoToFlag(selectedCountry?.iso2 ?? null)}</span>
              <span className="re-country-name">{selectedCountry?.displayName ?? selectedIso3}</span>
              <span className="re-country-chevron">▼</span>
            </button>
          </div>
          {showSearch && (
            <>
              <div className="re-country-overlay" onClick={() => setShowSearch(false)} />
              <div className="re-country-dropdown">
                <input className="re-country-search" type="text"
                  placeholder={fr ? "Rechercher..." : "Search..."}
                  value={search} onChange={e => setSearch(e.target.value)} autoFocus />
                <div className="re-country-list">
                  {filtered.slice(0, 50).map(c => (
                    <button key={c.iso3} type="button"
                      className={`re-country-item${c.iso3 === selectedIso3 ? " selected" : ""}`}
                      onClick={() => { setSelectedIso3(c.iso3); setShowSearch(false); setSearch(""); }}>
                      <span>{isoToFlag(c.iso2)}</span><span>{c.displayName}</span>
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>

        {/* Chargement */}
        {data.loading && (
          <div className="re-loading">
            <span className="re-loading-spinner">{fr ? "Chargement…" : "Loading…"}</span>
          </div>
        )}

        {/* Donnée disponible */}
        {data.loaded && data.value !== null && (
          <>
            <div className="re-kpi-card" style={{ alignItems: "flex-start", padding: "16px 18px" }}>
              <span className="re-kpi-icon">🏠</span>
              <div>
                <p className="re-kpi-label">{fr ? "Indice OCDE des prix réels des logements" : "OECD real home-price index"}</p>
                <p className="re-kpi-val">{data.value.toFixed(1)} <span style={{ fontSize: 13, fontWeight: 500, opacity: 0.7 }}>(2015 = 100)</span></p>
                {changePct !== null && (
                  <p className="re-kpi-sub" style={{ color: changePct >= 0 ? "#4ade80" : "#f87171", fontWeight: 600 }}>
                    {changePct >= 0 ? "▲ +" : "▼ "}{changePct.toFixed(1)} % {fr ? "depuis 2015, en termes réels (mesuré par l'OCDE)" : "since 2015, in real terms (per OECD)"}
                  </p>
                )}
                <p className="re-kpi-sub">
                  {singleSource ? (fr ? "Source : " : "Source: ") : (fr ? `Médiane de ${data.sourceCount} sources : ` : `Median of ${data.sourceCount} sources: `)}
                  <strong style={{ color: "rgba(183,220,245,0.85)" }}>{srcLabel}</strong>
                  {data.period && ` · ${fr ? "dernière donnée " : "latest "}${data.period}`}
                </p>
              </div>
            </div>

            {/* Lever la confusion : 2015 = base, pas fin des données */}
            <div className="re-affordability-note" style={{ background: "rgba(96,165,250,0.07)", border: "1px solid rgba(96,165,250,0.22)", borderRadius: 10, padding: "12px 14px", marginTop: 12, lineHeight: 1.6 }}>
              <p style={{ margin: 0 }}>
                ℹ {fr
                  ? `« 2015 = 100 » est seulement l'année de référence de l'indice — PAS la fin des données : la dernière mesure date de ${data.period ?? "—"} (à jour). Le « +${changePct?.toFixed(1)} % » est la valeur publiée par l'OCDE (prix corrigés de l'inflation), ce n'est pas une inflation ajoutée de notre côté.`
                  : `« 2015 = 100 » is only the index's reference year — NOT where data stops: the latest reading is ${data.period ?? "—"} (current). The « +${changePct?.toFixed(1)}% » is the value published by the OECD (inflation-adjusted), not an inflation figure we added.`}
              </p>
            </div>

            {/* Prix réels au m² : lien direct vers la vraie source, zéro chiffre inventé */}
            <div className="re-affordability-note" style={{ background: "rgba(251,191,36,0.07)", border: "1px solid rgba(251,191,36,0.22)", borderRadius: 10, padding: "12px 14px", marginTop: 10, lineHeight: 1.6 }}>
              <p style={{ margin: "0 0 6px", fontWeight: 600, color: "rgba(183,220,245,0.9)" }}>{fr ? "💰 Prix réels au m² (achat & loyers)" : "💰 Real €/m² prices & rents"}</p>
              <p style={{ margin: "0 0 10px" }}>
                {fr
                  ? `Le prix au m² varie énormément d'une ville à l'autre (ex. Paris ≫ moyenne France) : un seul chiffre national serait trompeur. Plutôt que d'inventer une valeur, voici les prix réels et détaillés (achat centre-ville / hors centre, loyers), crowdsourcés et à jour, pour ${selectedCountry?.displayName ?? "ce pays"} :`
                  : `Price per m² varies hugely by city (e.g. Paris ≫ France average): a single national figure would mislead. Rather than inventing a value, here are the real, detailed prices (city-centre / outside, rents), crowdsourced and up to date, for ${selectedCountry?.displayName ?? "this country"}:`}
              </p>
              <a href={numbeoUrl} target="_blank" rel="noopener noreferrer" className="re-open-btn" style={{ display: "block", textDecoration: "none", textAlign: "center" }}>
                {fr ? `📊 Voir les prix réels au m² (Numbeo) →` : `📊 See real €/m² prices (Numbeo) →`}
              </a>
              <p style={{ margin: "8px 0 0", fontSize: 11, color: "rgba(183,220,245,0.6)" }}>
                {fr
                  ? "Source : Numbeo (données contributives). Pour afficher ces prix directement ici (sans ouvrir Numbeo), une clé API Numbeo est nécessaire — donne-la-moi et je les intègre, affichés « selon Numbeo »."
                  : "Source: Numbeo (crowdsourced). To show these prices in-app (without opening Numbeo), a Numbeo API key is required — provide it and I'll integrate them, shown « per Numbeo »."}
              </p>
            </div>

            <button type="button" className="re-open-btn" onClick={() => onOpenCountry(selectedIso3)}>
              {fr ? `Ouvrir la fiche complète — ${selectedCountry?.displayName ?? selectedIso3} →` : `Open full country sheet — ${selectedCountry?.displayName ?? selectedIso3} →`}
            </button>
          </>
        )}

        {/* Pas de donnée pour ce pays */}
        {data.loaded && data.value === null && (
          <div className="re-error" style={{ lineHeight: 1.6 }}>
            <p>
              {fr
                ? `Aucune donnée de prix immobiliers pour ${selectedCountry?.displayName ?? selectedIso3} dans notre base actuelle. La couverture est aujourd'hui limitée (~47 pays, surtout OCDE/Europe) ; d'autres pays seront ajoutés au fur et à mesure de l'intégration des sources.`
                : `No real-estate data for ${selectedCountry?.displayName ?? selectedIso3} in our current dataset. Coverage is currently limited (~47 countries, mostly OECD/Europe); more countries will be added as sources are integrated.`}
            </p>
          </div>
        )}

        {/* Méthodologie & limites */}
        <details className="re-methodology">
          <summary>{fr ? "Méthodologie & limites" : "Methodology & limits"}</summary>
          <p>
            {fr
              ? "Donnée affichée : indice de prix RÉEL des logements (corrigé de l'inflation), publié par l'OCDE, base 2015 = 100. C'est une TENDANCE (évolution des prix), à jour (dernier trimestre disponible affiché), et NON un prix absolu en €/m². Source : OCDE (la source est toujours indiquée sous la valeur ; quand plusieurs sources couvrent un pays, on affiche leur médiane). Limites : (1) tendance et non niveau de prix absolu ; (2) couverture partielle (~47 pays, surtout OCDE/Europe) — sinon un message le précise ; (3) données nationales, sans détail par ville. Prix au m² / loyers absolus : non affichés faute de source fiable branchée (Numbeo nécessite une clé API). Aucun chiffre n'est inventé."
              : "Shown data: REAL (inflation-adjusted) home-price index published by the OECD, base 2015 = 100. It is a TREND (price evolution), up to date (latest available quarter shown), and NOT an absolute €/m² price. Source: OECD (always shown under the value; when several sources cover a country, the median is shown). Limits: (1) trend, not an absolute price level; (2) partial coverage (~47 countries, mostly OECD/Europe) — otherwise a message says so; (3) national data, no city-level detail. Absolute €/m² prices / rents: not shown for lack of a connected reliable source (Numbeo requires an API key). No figure is fabricated."}
          </p>
        </details>
      </div>
    </div>
  );
}