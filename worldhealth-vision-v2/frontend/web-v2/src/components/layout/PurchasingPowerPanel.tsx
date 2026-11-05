// WorldHealthVision V2 — PurchasingPowerPanel
// Calculateur de pouvoir d'achat réel : « Mon revenu de X vaut combien là-bas ? »
//
// Niveau de prix (indice, référence mondiale ≈ 100) = PIB/habitant NOMINAL ÷
// PIB/habitant en PPA, tous deux de la BANQUE MONDIALE. C'est, par définition,
// le ratio « niveau de prix » (PA.NUS.PPPC.RF) : couverture quasi mondiale
// (~180 pays, Afrique incluse), une seule source claire et cohérente.
// On n'utilise QUE la perspective Banque mondiale (les valeurs FMI peuvent être
// sur une autre échelle), donc départ et destination sont toujours comparés sur
// la même base → résultat non biaisé.
//
// Formule : équivalent = revenu × (niveauPrix_départ / niveauPrix_destination).

import { useEffect, useMemo, useState } from "react";
import type { CountrySummary, IndicatorOverviewResponse } from "../../api/types";
import { fetchIndicatorOverview } from "../../api/whvApi";
import { useLang } from "../../context/LanguageContext";
import { useUserProfile } from "../../context/UserProfileContext";
import "../../styles/purchasing-power.css";

// ---------- helpers ----------

function flag(iso2?: string | null): string {
  if (!iso2 || iso2.length !== 2) return "🌍";
  const b = 0x1f1e6, A = 65, u = iso2.toUpperCase();
  return String.fromCodePoint(u.charCodeAt(0) - A + b) + String.fromCodePoint(u.charCodeAt(1) - A + b);
}

const NOMINAL_CODE = "NY.GDP.PCAP.CD";       // PIB/hab nominal (USD courants)
const PPP_CODE = "NY.GDP.PCAP.PP.CD";        // PIB/hab en PPA ($ internationaux)

// Valeur de la perspective Banque mondiale d'un overview d'indicateur.
function worldBankValue(ov: IndicatorOverviewResponse): { value: number; period: string | null } | null {
  const p = ov.sourcePerspectives.find(
    sp => sp.sourceCode === "WORLD_BANK" && sp.numericValue !== null,
  );
  return p && p.numericValue !== null ? { value: p.numericValue, period: p.periodLabel } : null;
}

// ---------- hook : niveau de prix mondial (indice référence ≈ 100) ----------

type PriceScope = "GLOBAL" | "NONE";

interface PriceLevelState {
  value: number | null;   // indice, niveau de prix mondial de référence ≈ 100
  scope: PriceScope;
  period: string | null;
  loading: boolean;
  error: string | null;
}

const EMPTY_PRICE: PriceLevelState = { value: null, scope: "NONE", period: null, loading: false, error: null };

function usePriceLevel(iso3: string | null): PriceLevelState {
  const [state, setState] = useState<PriceLevelState>(EMPTY_PRICE);

  useEffect(() => {
    if (!iso3) { setState(EMPTY_PRICE); return; }
    let active = true;
    setState({ ...EMPTY_PRICE, loading: true });

    (async () => {
      try {
        const [nominalOv, pppOv] = await Promise.all([
          fetchIndicatorOverview(iso3, NOMINAL_CODE),
          fetchIndicatorOverview(iso3, PPP_CODE),
        ]);
        const nominal = worldBankValue(nominalOv);
        const ppp = worldBankValue(pppOv);
        if (!active) return;
        if (nominal && ppp && ppp.value > 0) {
          // ratio nominal/PPA = niveau de prix (US/monde ≈ 1) → ×100 pour l'indice
          setState({
            value: (nominal.value / ppp.value) * 100,
            scope: "GLOBAL",
            period: nominal.period ?? ppp.period,
            loading: false, error: null,
          });
        } else {
          setState({ ...EMPTY_PRICE, scope: "NONE" });
        }
      } catch (err: unknown) {
        if (!active) return;
        setState({ ...EMPTY_PRICE, error: err instanceof Error ? err.message : "Erreur" });
      }
    })();

    return () => { active = false; };
  }, [iso3]);

  return state;
}

// ---------- composant principal ----------

type Props = {
  countries: CountrySummary[];
  onClose: () => void;
};

export default function PurchasingPowerPanel({ countries, onClose }: Props) {
  const lang = useLang();
  const { profile } = useUserProfile();

  const [amount, setAmount] = useState(profile.monthlyBudgetEur.toString());
  const [destIso3, setDestIso3] = useState("");
  const [searchDest, setSearchDest] = useState("");

  const homeIso3 = profile.homeIso3;
  const homeLevel = usePriceLevel(homeIso3 || null);
  const destLevel = usePriceLevel(destIso3 || null);

  const homeCountry = countries.find(c => c.iso3 === homeIso3);
  const destCountry = countries.find(c => c.iso3 === destIso3);

  const filteredDest = searchDest
    ? countries.filter(c =>
        c.displayName.toLowerCase().includes(searchDest.toLowerCase()) ||
        c.iso3.toLowerCase().includes(searchDest.toLowerCase()))
    : countries;

  // Pouvoir d'achat : équivalent = revenu × (niveauPrix_départ / niveauPrix_destination)
  const result = useMemo(() => {
    const amt = parseFloat(amount);
    if (!amt || !homeLevel.value || !destLevel.value) return null;
    const equivalent = amt * (homeLevel.value / destLevel.value);
    // Gain de pouvoir d'achat (combien votre argent "grandit" à destination)
    const pctDiff = ((homeLevel.value - destLevel.value) / destLevel.value) * 100;
    // Différence de COÛT de la vie (positif = destination moins chère) — borné à 100 %
    const costPct = (1 - destLevel.value / homeLevel.value) * 100;
    return { equivalent, pctDiff, costPct, cheaper: pctDiff > 0 };
  }, [amount, homeLevel.value, destLevel.value]);

  const fr = lang === "fr";

  return (
    <div className="pp-panel">
      {/* En-tête */}
      <div className="pp-header">
        <div className="pp-header-left">
          <span className="pp-header-icon">💶</span>
          <div>
            <h2 className="pp-title">{fr ? "Pouvoir d'achat réel" : "Real purchasing power"}</h2>
            <p className="pp-subtitle">{fr ? "Combien vaut mon revenu à l'étranger ?" : "How far does my income go abroad?"}</p>
          </div>
        </div>
        <button type="button" className="pp-close-btn" onClick={onClose}>✕</button>
      </div>

      <div className="pp-body">
        {/* Montant */}
        <div className="pp-input-section">
          <label className="pp-label">{fr ? "Revenu ou budget mensuel" : "Monthly income or budget"}</label>
          <div className="pp-amount-row">
            <input type="number" className="pp-amount-input" value={amount} min={1} onChange={e => setAmount(e.target.value)} />
            <span className="pp-currency">{profile.preferredCurrency}</span>
            <span className="pp-per-month">/ {fr ? "mois" : "month"}</span>
          </div>
        </div>

        {/* Départ → destination */}
        <div className="pp-route-row">
          <div className="pp-route-box pp-route-box--home">
            <span className="pp-route-label">{fr ? "Depuis" : "From"}</span>
            <div className="pp-route-country">
              <span>{flag(homeCountry?.iso2)}</span>
              <span className="pp-route-name">{homeCountry?.displayName ?? homeIso3}</span>
            </div>
            {homeLevel.loading
              ? <span className="pp-loading-mini">…</span>
              : homeLevel.value !== null
                ? <span className="pp-price-level-badge" title={fr ? "Indice de niveau de prix (réf. mondiale ≈ 100)" : "Price level index (world ref. ≈ 100)"}>IPrix = {homeLevel.value.toFixed(0)}</span>
                : <span className="pp-missing">{fr ? "Données indisponibles" : "Data unavailable"}</span>}
          </div>

          <span className="pp-arrow">→</span>

          <div className="pp-route-box pp-route-box--dest">
            <span className="pp-route-label">{fr ? "Vers" : "To"}</span>
            {destIso3 ? (
              <>
                <div className="pp-route-country">
                  <span>{flag(destCountry?.iso2)}</span>
                  <span className="pp-route-name">{destCountry?.displayName ?? destIso3}</span>
                  <button type="button" className="pp-clear" onClick={() => setDestIso3("")}>✕</button>
                </div>
                {destLevel.loading
                  ? <span className="pp-loading-mini">…</span>
                  : destLevel.value !== null
                    ? <span className="pp-price-level-badge" title={fr ? "Indice de niveau de prix (réf. mondiale ≈ 100)" : "Price level index (world ref. ≈ 100)"}>IPrix = {destLevel.value.toFixed(0)}</span>
                    : <span className="pp-missing">{fr ? "Données indisponibles" : "Data unavailable"}</span>}
              </>
            ) : (
              <span className="pp-route-placeholder">{fr ? "Choisir…" : "Choose…"}</span>
            )}
          </div>
        </div>

        {/* Sélecteur de destination */}
        {!destIso3 && (
          <div className="pp-dest-picker">
            <input className="pp-dest-search" type="text"
              placeholder={fr ? "Rechercher un pays…" : "Search country…"}
              value={searchDest} onChange={e => setSearchDest(e.target.value)} autoFocus />
            <div className="pp-dest-list">
              {filteredDest.slice(0, 60).map(c => (
                <button key={c.iso3} type="button" className="pp-dest-item"
                  onClick={() => { setDestIso3(c.iso3); setSearchDest(""); }}>
                  <span>{flag(c.iso2)}</span>
                  <span>{c.displayName}</span>
                  {c.currencyCode && <span className="pp-dest-currency">{c.currencyCode}</span>}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* RÉSULTAT */}
        {result && !homeLevel.loading && !destLevel.loading && (
          <div className={`pp-result-card${result.cheaper ? " pp-result--cheaper" : " pp-result--costlier"}`}>
            <p className="pp-result-label">{fr ? "Équivalent à" : "Equivalent to"}</p>
            <p className="pp-result-amount">
              {Math.round(result.equivalent).toLocaleString("fr-FR")} {profile.preferredCurrency}
              <span className="pp-result-period">/ {fr ? "mois" : "month"}</span>
            </p>
            <p className="pp-result-diff" style={{ color: result.cheaper ? "#4ade80" : "#f87171" }}>
              {result.cheaper
                ? `▲ ${Math.abs(result.pctDiff).toFixed(0)} % ${fr ? "de pouvoir d'achat en plus" : "more purchasing power"}`
                : `▼ ${Math.abs(result.pctDiff).toFixed(0)} % ${fr ? "de pouvoir d'achat en moins" : "less purchasing power"}`}
            </p>
            <p className="pp-result-explain">
              {fr
                ? `En clair : la vie à ${destCountry?.displayName ?? destIso3} coûte en moyenne ${Math.abs(result.costPct).toFixed(0)} % ${result.cheaper ? "de moins" : "de plus"} qu'à ${homeCountry?.displayName ?? homeIso3}. Vos ${amount} ${profile.preferredCurrency} y offrent donc le même niveau de vie que ${Math.round(result.equivalent).toLocaleString("fr-FR")} ${profile.preferredCurrency} chez vous.`
                : `In short: living in ${destCountry?.displayName ?? destIso3} costs on average ${Math.abs(result.costPct).toFixed(0)}% ${result.cheaper ? "less" : "more"} than in ${homeCountry?.displayName ?? homeIso3}. Your ${amount} ${profile.preferredCurrency} there buys the same standard of living as ${Math.round(result.equivalent).toLocaleString("fr-FR")} ${profile.preferredCurrency} at home.`}
            </p>
            <p style={{ fontSize: 11, color: "rgba(183,220,245,0.62)", marginTop: 8, lineHeight: 1.5 }}>
              {fr
                ? `Niveau de prix selon la Banque mondiale (parités de pouvoir d'achat, ~180 pays). Indice : 100 = niveau de prix mondial de référence. ${homeCountry?.displayName ?? homeIso3} = ${homeLevel.value?.toFixed(0)}, ${destCountry?.displayName ?? destIso3} = ${destLevel.value?.toFixed(0)}${destLevel.period ? ` (${destLevel.period})` : ""}.`
                : `Price level per the World Bank (purchasing power parities, ~180 countries). Index: 100 = world reference price level. ${homeCountry?.displayName ?? homeIso3} = ${homeLevel.value?.toFixed(0)}, ${destCountry?.displayName ?? destIso3} = ${destLevel.value?.toFixed(0)}${destLevel.period ? ` (${destLevel.period})` : ""}.`}
            </p>
          </div>
        )}

        {/* Donnée indisponible pour la destination (rare avec la couverture mondiale) */}
        {destIso3 && !destLevel.loading && !homeLevel.loading && destLevel.value === null && (
          <div className="pp-hint" style={{ borderLeft: "2px solid rgba(251,191,36,0.55)" }}>
            <p>
              {fr
                ? `Le niveau de prix n'est pas encore disponible pour ${destCountry?.displayName ?? destIso3} (PIB par habitant en PPA manquant à la Banque mondiale). Le calcul s'activera dès que cette donnée sera intégrée.`
                : `The price level is not yet available for ${destCountry?.displayName ?? destIso3} (World Bank PPP GDP per capita missing). The estimate will activate once this data is integrated.`}
            </p>
          </div>
        )}

        {/* Méthodologie */}
        {(homeLevel.value || destLevel.value) && (
          <details className="pp-methodology">
            <summary>{fr ? "Méthodologie & source" : "Methodology & source"}</summary>
            <p>
              {fr
                ? "L'indice de niveau de prix (IPrix) compare le coût de la vie entre pays. Il est calculé comme le rapport entre le PIB par habitant nominal (au taux de change du marché) et le PIB par habitant en parité de pouvoir d'achat (PPA) — c'est la définition officielle du « niveau de prix » de la Banque mondiale. 100 = niveau de prix mondial de référence ; 50 signifie des prix deux fois moins élevés. Source unique et cohérente : la Banque mondiale (couverture ~180 pays, Afrique incluse). Comme le départ et la destination utilisent exactement la même source et la même échelle, la comparaison n'est pas biaisée."
                : "The price level index (IPrice) compares the cost of living across countries. It is the ratio of nominal GDP per capita (at market exchange rates) to PPP GDP per capita — the World Bank's official definition of the price level. 100 = world reference price level; 50 means prices are roughly half. Single, consistent source: the World Bank (~180 countries, Africa included). Since home and destination use the exact same source and scale, the comparison is unbiased."}
            </p>
          </details>
        )}

        {/* État vide */}
        {!destIso3 && !searchDest && (
          <div className="pp-hint">
            <p>
              {fr
                ? `Basé sur votre profil : ${profile.monthlyBudgetEur.toLocaleString("fr-FR")} ${profile.preferredCurrency}/mois depuis ${homeCountry?.displayName ?? homeIso3}. Choisissez une destination pour comparer votre pouvoir d'achat réel.`
                : `Based on your profile: ${profile.monthlyBudgetEur.toLocaleString("en-US")} ${profile.preferredCurrency}/month from ${homeCountry?.displayName ?? homeIso3}. Choose a destination to compare your real purchasing power.`}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}