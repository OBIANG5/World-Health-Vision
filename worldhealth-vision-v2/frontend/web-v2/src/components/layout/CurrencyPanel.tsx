// WorldHealthVision V2 — CurrencyPanel
// Convertisseur universel : ~43 devises, parités fixes CFA/Golfe intégrées.

import { useState, useMemo } from "react";
import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer,
} from "recharts";
import {
  CURRENCY_GROUPS,
  CURRENCY_META,
  FIXED_PEGS,
  FX_SUPPORTED_CURRENCIES,
  computeRate,
} from "../../api/fxApi";
import { useFxRates } from "../../hooks/useFxRates";
import { useFxHistory } from "../../hooks/useFxHistory";
import { useLang } from "../../context/LanguageContext";
import "../../styles/profile.css";
import "../../styles/currency.css";

// ── helpers ──────────────────────────────────────────────────────────────────

function fmtAmount(val: number): string {
  const abs = Math.abs(val);
  if (abs >= 1_000_000) return val.toLocaleString("fr-FR", { maximumFractionDigits: 0 });
  if (abs >= 10_000)    return val.toLocaleString("fr-FR", { maximumFractionDigits: 0 });
  if (abs >= 100)       return val.toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  if (abs >= 1)         return val.toLocaleString("fr-FR", { minimumFractionDigits: 3, maximumFractionDigits: 4 });
  return val.toLocaleString("fr-FR", { minimumFractionDigits: 4, maximumFractionDigits: 6 });
}

function fmtRate(rate: number): string {
  if (rate >= 10_000) return rate.toLocaleString("fr-FR", { maximumFractionDigits: 1 });
  if (rate >= 100)    return rate.toLocaleString("fr-FR", { maximumFractionDigits: 3 });
  if (rate >= 1)      return rate.toLocaleString("fr-FR", { minimumFractionDigits: 4, maximumFractionDigits: 4 });
  return rate.toLocaleString("fr-FR", { minimumFractionDigits: 5, maximumFractionDigits: 6 });
}

const TYPE_BADGE = {
  fixed:    { fr: "Fixe",     en: "Fixed",    cls: "cur-badge--fixed" },
  managed:  { fr: "Dirigé",   en: "Managed",  cls: "cur-badge--managed" },
  floating: { fr: "Flottant", en: "Floating", cls: "cur-badge--floating" },
};

const ALL_SELECTABLE = Object.keys(CURRENCY_META);

// ── composant ────────────────────────────────────────────────────────────────

type Props = { onClose: () => void };

export default function CurrencyPanel({ onClose }: Props) {
  const lang = useLang();
  const [amount, setAmount] = useState<number>(1000);
  const [baseCur, setBaseCur] = useState("EUR");
  const [histTarget, setHistTarget] = useState("USD");
  const [showHistory, setShowHistory] = useState(false);

  // Toujours EUR comme base Frankfurter → cross-rates calculés localement
  const { rates: eurData, loading, error } = useFxRates("EUR");
  const eurRates: Record<string, number> = eurData?.rates ?? {};

  // Tous les taux calculés pour la devise base choisie
  const computedRates = useMemo(() => {
    const all = new Set<string>();
    CURRENCY_GROUPS.forEach((g) => g.codes.forEach((c) => all.add(c)));
    const out: Record<string, number | null> = {};
    all.forEach((code) => {
      out[code] = code === baseCur ? 1 : computeRate(baseCur, code, eurRates);
    });
    return out;
  }, [baseCur, eurRates]);

  const baseMeta  = CURRENCY_META[baseCur];
  const basePeg   = FIXED_PEGS[baseCur];
  const baseInFrankfurter = FX_SUPPORTED_CURRENCIES.has(baseCur) && !basePeg;

  // Historique 30 jours : uniquement pour paires Frankfurter flottantes
  const histEnabled = showHistory
    && baseInFrankfurter
    && FX_SUPPORTED_CURRENCIES.has(histTarget)
    && !FIXED_PEGS[histTarget]
    && baseCur !== histTarget;
  const { points: histPoints, loading: histLoading } = useFxHistory(
    baseCur, histTarget, 30, histEnabled,
  );

  const totalCurrencies = CURRENCY_GROUPS.reduce((s, g) => s + g.codes.length, 0);

  return (
    <div className="cur-panel">
      {/* ── En-tête ── */}
      <div className="cur-header">
        <div className="cur-header-left">
          <span className="cur-header-icon">💱</span>
          <div>
            <h2 className="cur-header-title">
              {lang === "fr" ? "Devises & Convertisseur" : "Currency Converter"}
            </h2>
            <p className="cur-header-sub">
              {lang === "fr"
                ? `${totalCurrencies} devises · parités fixes CFA & Golfe`
                : `${totalCurrencies} currencies · CFA & Gulf fixed parities`}
            </p>
          </div>
        </div>
        <button type="button" className="prf-close-btn" onClick={onClose} aria-label="Fermer">
          ✕
        </button>
      </div>

      <div className="cur-body">
        {/* ── Convertisseur ── */}
        <div className="cur-converter">
          <div className="cur-converter-row">
            <div className="cur-field-group">
              <label className="cur-label">
                {lang === "fr" ? "Montant" : "Amount"}
              </label>
              <input
                type="number"
                className="cur-amount-input"
                value={amount}
                min={0}
                step={100}
                onChange={(e) => setAmount(Number(e.target.value) || 0)}
              />
            </div>
            <div className="cur-field-group cur-field-group--wide">
              <label className="cur-label">
                {lang === "fr" ? "Devise source" : "Base currency"}
              </label>
              <select
                className="cur-base-select"
                value={baseCur}
                onChange={(e) => {
                  setBaseCur(e.target.value);
                  setShowHistory(false);
                }}
              >
                {ALL_SELECTABLE.map((code) => {
                  const m = CURRENCY_META[code];
                  const pegMark = FIXED_PEGS[code] ? " ★" : "";
                  return (
                    <option key={code} value={code}>
                      {code} — {lang === "fr" ? m.nameFr : m.name}{pegMark}
                    </option>
                  );
                })}
              </select>
            </div>
          </div>

          {/* Info devise source */}
          {baseMeta && (
            <div className="cur-base-info">
              <span className="cur-base-full-name">
                {lang === "fr" ? baseMeta.nameFr : baseMeta.name}
              </span>
              {baseMeta.zone && (
                <span className="cur-zone-tag">{baseMeta.zone}</span>
              )}
              <span className={`cur-badge ${TYPE_BADGE[baseMeta.type].cls}`}>
                {lang === "fr" ? TYPE_BADGE[baseMeta.type].fr : TYPE_BADGE[baseMeta.type].en}
              </span>
              {basePeg && (
                <div className="cur-peg-line">
                  <span className="cur-peg-eq" title="Parité légalement fixée">═══</span>
                  <span>
                    {lang === "fr"
                      ? `Parité fixée en ${basePeg.since} : 1 ${basePeg.anchor} = ${basePeg.rate.toLocaleString("fr-FR")} ${baseCur}`
                      : `Fixed in ${basePeg.since}: 1 ${basePeg.anchor} = ${basePeg.rate.toLocaleString("en-US")} ${baseCur}`}
                  </span>
                  <span className="cur-peg-source">
                    {basePeg.zone ? `(${basePeg.zone})` : ""}
                  </span>
                </div>
              )}
            </div>
          )}

          {loading && (
            <div className="cur-status">
              <span className="cur-spinner" />
              {lang === "fr" ? "Chargement des taux Frankfurter..." : "Loading Frankfurter rates..."}
            </div>
          )}
          {error && !loading && (
            <div className="cur-status cur-status--error">
              ⚠ {lang === "fr"
                ? "Taux temps réel indisponibles. Les parités fixes restent affichées."
                : "Live rates unavailable. Fixed parities still displayed."}
            </div>
          )}
        </div>

        {/* ── Table des résultats par groupe ── */}
        {CURRENCY_GROUPS.map((group) => {
          const rows = group.codes
            .filter((code) => code !== baseCur)
            .map((code) => {
              const meta = CURRENCY_META[code];
              const peg  = FIXED_PEGS[code];
              const rate = computedRates[code] ?? null;
              return { code, meta, peg, rate };
            });

          if (rows.length === 0) return null;

          return (
            <div key={group.label} className="cur-group">
              <div className="cur-group-title">
                {lang === "fr" ? group.labelFr : group.label}
              </div>

              {rows.map(({ code, meta, peg, rate }) => {
                const converted = rate !== null ? amount * rate : null;
                const canShowHistory = baseInFrankfurter
                  && FX_SUPPORTED_CURRENCIES.has(code)
                  && !peg;

                return (
                  <div key={code} className="cur-rate-row">
                    {/* Gauche : code + nom + indicateur */}
                    <div className="cur-rate-left">
                      <span className="cur-rate-code">{code}</span>
                      <div className="cur-rate-info">
                        <span className="cur-rate-name">
                          {meta ? (lang === "fr" ? meta.nameFr : meta.name) : code}
                        </span>
                        {peg && (
                          <span
                            className="cur-peg-mini"
                            title={`Parité fixe depuis ${peg.since} : 1 ${peg.anchor} = ${peg.rate} ${code}`}
                          >
                            ═ {peg.anchor}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Droite : montant converti + taux unitaire */}
                    <div className="cur-rate-right">
                      {converted !== null ? (
                        <div className="cur-rate-values">
                          <span className="cur-rate-value">{fmtAmount(converted)}</span>
                          {rate !== null && rate !== 1 && (
                            <span className="cur-rate-unit">
                              1 {baseCur} = {fmtRate(rate)}
                            </span>
                          )}
                        </div>
                      ) : (
                        <span className="cur-rate-na">
                          {lang === "fr" ? "N/A" : "N/A"}
                        </span>
                      )}
                      <div className="cur-rate-meta">
                        {meta && (
                          <span className={`cur-badge cur-badge--sm ${TYPE_BADGE[meta.type].cls}`}>
                            {lang === "fr" ? TYPE_BADGE[meta.type].fr : TYPE_BADGE[meta.type].en}
                          </span>
                        )}
                        {canShowHistory && (
                          <button
                            type="button"
                            className={`cur-chart-btn${histTarget === code && showHistory ? " active" : ""}`}
                            title={lang === "fr" ? "Voir l'historique 30 jours" : "View 30-day history"}
                            onClick={() => {
                              if (histTarget === code && showHistory) {
                                setShowHistory(false);
                              } else {
                                setHistTarget(code);
                                setShowHistory(true);
                              }
                            }}
                          >
                            📈
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          );
        })}

        {/* ── Historique 30 jours ── */}
        {showHistory && baseInFrankfurter && (
          <div className="cur-history">
            <div className="cur-history-header">
              <span className="cur-group-title" style={{ marginBottom: 0 }}>
                {lang === "fr"
                  ? `Historique 30 j · ${baseCur} / ${histTarget}`
                  : `30-day history · ${baseCur} / ${histTarget}`}
              </span>
              <button
                type="button"
                className="cur-history-close"
                onClick={() => setShowHistory(false)}
              >
                ✕
              </button>
            </div>
            {histLoading ? (
              <div className="cur-status" style={{ justifyContent: "center", padding: "20px 0" }}>
                <span className="cur-spinner" />
                {lang === "fr" ? "Chargement..." : "Loading..."}
              </div>
            ) : histPoints.length > 0 ? (
              <div className="cur-chart-wrap">
                <ResponsiveContainer width="100%" height={130}>
                  <LineChart data={histPoints} margin={{ top: 4, right: 12, bottom: 0, left: 0 }}>
                    <XAxis
                      dataKey="date"
                      tickFormatter={(d: string) => d.slice(5)}
                      tick={{ fill: "rgba(183,220,245,0.5)", fontSize: 9 }}
                      tickLine={false}
                      axisLine={false}
                      interval="preserveStartEnd"
                    />
                    <YAxis
                      domain={["auto", "auto"]}
                      tick={{ fill: "rgba(183,220,245,0.5)", fontSize: 9 }}
                      tickLine={false}
                      axisLine={false}
                      tickFormatter={(v: number) => fmtRate(v)}
                      width={52}
                    />
                    <Tooltip
                      contentStyle={{
                        background: "rgba(6,20,32,0.95)",
                        border: "1px solid rgba(74,184,255,0.3)",
                        borderRadius: 6,
                        fontSize: 11,
                        color: "rgba(183,220,245,0.9)",
                        padding: "6px 10px",
                      }}
                      formatter={(value) => [fmtRate(typeof value === "number" ? value : Number(value)), `${baseCur}/${histTarget}`]}
                      labelStyle={{ color: "rgba(183,220,245,0.55)", fontSize: 10 }}
                    />
                    <Line
                      type="monotone"
                      dataKey="rate"
                      stroke="#4ab8ff"
                      strokeWidth={1.5}
                      dot={false}
                      activeDot={{ r: 3, fill: "#4ab8ff" }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <p className="cur-hint">
                {lang === "fr"
                  ? "Historique non disponible pour cette paire."
                  : "History not available for this pair."}
              </p>
            )}
          </div>
        )}

        {/* ── Note pour devises non couvertes ── */}
        <div className="cur-footnote">
          <p>
            {lang === "fr"
              ? "Devises absentes (NGN, GHS, MAD, KES...) : ces devises ne sont pas disponibles dans les flux de données publics gratuits. Consultez la banque centrale locale ou un courtier."
              : "Missing currencies (NGN, GHS, MAD, KES...): not available in free public data feeds. Check the local central bank or a broker."}
          </p>
        </div>

        {/* ── Pied de page sources ── */}
        <div className="cur-footer">
          <div className="cur-footer-row">
            <span className="cur-footer-dot" style={{ background: "#4ab8ff" }} />
            {lang === "fr"
              ? "Taux flottants/dirigés : Frankfurter (BCE) · mise à jour quotidienne 16h CET"
              : "Floating/managed rates: Frankfurter (ECB) · updated daily at 16:00 CET"}
          </div>
          <div className="cur-footer-row">
            <span className="cur-footer-dot" style={{ background: "#28a745" }} />
            {lang === "fr"
              ? "Parités fixes : BRI, FMI, BCEAO, BEAC, banques centrales respectives"
              : "Fixed parities: BIS, IMF, BCEAO, BEAC, respective central banks"}
          </div>
        </div>
      </div>
    </div>
  );
}