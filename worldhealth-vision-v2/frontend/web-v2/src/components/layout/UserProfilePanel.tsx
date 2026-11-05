// WorldHealthVision V2 — UserProfilePanel
// Panneau de configuration du profil utilisateur.
// Contrôle : pays de résidence, budget, situation, priorités pondérées (sliders).

import type { ChangeEvent } from "react";
import type { CountrySummary } from "../../api/types";
import {
  PRIORITY_LABEL,
  SITUATION_LABEL,
  type UserPriorities,
  type UserSituation,
  useUserProfile,
} from "../../context/UserProfileContext";
import { useLang } from "../../context/LanguageContext";
import { CURRENCY_META, FIXED_PEGS, computeRate } from "../../api/fxApi";
import { useFxRates } from "../../hooks/useFxRates";
import "../../styles/profile.css";

// Toutes les devises disponibles pour le profil (organisées)
const PROFILE_CURRENCIES = [
  // Majeures
  "EUR", "USD", "GBP", "CHF", "JPY", "CNY", "CAD", "AUD",
  // Afrique & CFA
  "XOF", "XAF", "ZAR", "CVE", "KMF",
  // Moyen-Orient
  "SAR", "AED", "QAR",
  // Asie
  "INR", "KRW", "SGD", "HKD", "IDR",
  // Amériques
  "BRL", "MXN",
  // Europe
  "SEK", "NOK", "PLN", "TRY",
];

function currencyLabel(code: string, lang: "fr" | "en"): string {
  const meta = CURRENCY_META[code];
  if (!meta) return code;
  const name = lang === "fr" ? meta.nameFr : meta.name;
  const pegMark = FIXED_PEGS[code] ? " ★" : "";
  return `${code} — ${name}${pegMark}`;
}

// ---------- helpers ----------

function countryFlag(iso2?: string | null): string {
  if (!iso2 || iso2.length !== 2) return "🌍";
  const base = 0x1f1e6;
  const A = 65;
  const upper = iso2.toUpperCase();
  return (
    String.fromCodePoint(upper.charCodeAt(0) - A + base) +
    String.fromCodePoint(upper.charCodeAt(1) - A + base)
  );
}

// ---------- composant PrioritySlider ----------

function PrioritySlider({
  keyName,
  value,
  lang,
  onChange,
}: {
  keyName: keyof UserPriorities;
  value: number;
  lang: "fr" | "en";
  onChange: (v: number) => void;
}) {
  const meta = PRIORITY_LABEL[keyName];
  const filled = Math.round((value / 10) * 5);
  const dots = Array.from({ length: 5 }, (_, i) => i < filled);

  return (
    <div className="prf-priority-row">
      <div className="prf-priority-meta">
        <span className="prf-priority-icon">{meta.icon}</span>
        <span className="prf-priority-name">{lang === "fr" ? meta.fr : meta.en}</span>
        <span className="prf-priority-val">{value}/10</span>
      </div>
      <input
        type="range"
        min={0}
        max={10}
        step={1}
        value={value}
        className="prf-slider"
        onChange={(e: ChangeEvent<HTMLInputElement>) => onChange(Number(e.target.value))}
      />
      <div className="prf-priority-dots">
        {dots.map((filled, i) => (
          <span key={i} className={`prf-dot${filled ? " filled" : ""}`} />
        ))}
      </div>
    </div>
  );
}

// ---------- composant principal ----------

type Props = {
  countries: CountrySummary[];
  onClose: () => void;
};

export default function UserProfilePanel({ countries, onClose }: Props) {
  const lang = useLang();
  const { profile, updateProfile, updatePriority, resetProfile } = useUserProfile();

  // Taux EUR → devise préférée pour afficher le budget converti
  const { rates: eurData } = useFxRates("EUR");
  const eurRates = eurData?.rates ?? {};
  const budgetRate = profile.preferredCurrency === "EUR"
    ? 1
    : computeRate("EUR", profile.preferredCurrency, eurRates);
  const budgetConverted = budgetRate !== null ? profile.monthlyBudgetEur * budgetRate : null;

  const homeCountry = countries.find((c) => c.iso3 === profile.homeIso3);

  const situations = Object.entries(SITUATION_LABEL) as [UserSituation, { fr: string; en: string }][];

  return (
    <div className="prf-panel">
      {/* En-tête */}
      <div className="prf-header">
        <div className="prf-header-left">
          <span className="prf-header-icon">👤</span>
          <div>
            <h2 className="prf-header-title">{lang === "fr" ? "Mon profil" : "My profile"}</h2>
            <p className="prf-header-sub">
              {lang === "fr"
                ? "Personnalise toutes les analyses WHV selon ta situation"
                : "Personalizes all WHV analyses to your situation"}
            </p>
          </div>
        </div>
        <button type="button" className="prf-close-btn" onClick={onClose} aria-label="Fermer">
          ✕
        </button>
      </div>

      <div className="prf-body">
        {/* Nom d'affichage optionnel */}
        <div className="prf-section">
          <label className="prf-label">{lang === "fr" ? "Prénom (optionnel)" : "First name (optional)"}</label>
          <input
            type="text"
            className="prf-input"
            placeholder={lang === "fr" ? "Ex : Presley" : "Ex: Alex"}
            value={profile.displayName}
            onChange={(e) => updateProfile({ displayName: e.target.value })}
            maxLength={40}
          />
        </div>

        {/* Pays de résidence */}
        <div className="prf-section">
          <label className="prf-label">
            {lang === "fr" ? "Pays de résidence" : "Country of residence"}
          </label>
          <div className="prf-select-with-flag">
            <span className="prf-flag">{countryFlag(homeCountry?.iso2)}</span>
            <select
              className="prf-select"
              value={profile.homeIso3}
              onChange={(e) => updateProfile({ homeIso3: e.target.value })}
            >
              {countries.map((c) => (
                <option key={c.iso3} value={c.iso3}>
                  {c.displayName}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Situation */}
        <div className="prf-section">
          <label className="prf-label">{lang === "fr" ? "Situation" : "Situation"}</label>
          <div className="prf-situation-grid">
            {situations.map(([key, labels]) => (
              <button
                key={key}
                type="button"
                className={`prf-situation-btn${profile.situation === key ? " active" : ""}`}
                onClick={() => updateProfile({ situation: key })}
              >
                {lang === "fr" ? labels.fr : labels.en}
              </button>
            ))}
          </div>
        </div>

        {/* Budget mensuel */}
        <div className="prf-section">
          <label className="prf-label">
            {lang === "fr" ? "Budget mensuel (€)" : "Monthly budget (€)"}
          </label>
          <div className="prf-budget-row">
            <input
              type="number"
              className="prf-input prf-input--budget"
              value={profile.monthlyBudgetEur}
              min={100}
              max={50000}
              step={100}
              onChange={(e) => updateProfile({ monthlyBudgetEur: Number(e.target.value) })}
            />
            <span className="prf-currency-badge">€ / {lang === "fr" ? "mois" : "month"}</span>
          </div>
          {/* Équivalent en devise préférée */}
          {profile.preferredCurrency !== "EUR" && budgetConverted !== null && (
            <p className="prf-hint prf-hint--currency">
              ≈ {budgetConverted.toLocaleString("fr-FR", { maximumFractionDigits: 0 })} {profile.preferredCurrency} / {lang === "fr" ? "mois" : "month"}
              {FIXED_PEGS[profile.preferredCurrency] && (
                <span style={{ color: "rgba(40,167,69,0.7)", marginLeft: 5 }}>
                  ★ {lang === "fr" ? "parité fixe" : "fixed parity"}
                </span>
              )}
            </p>
          )}
          <p className="prf-hint">
            {lang === "fr"
              ? "Revenus nets ou budget disponible. Utilisé pour les modules retraite et pouvoir d'achat."
              : "Net income or available budget. Used by retirement and purchasing power modules."}
          </p>
        </div>

        {/* Devise préférée */}
        <div className="prf-section">
          <label className="prf-label">
            {lang === "fr" ? "Devise de référence" : "Reference currency"}
          </label>
          <select
            className="prf-select"
            value={profile.preferredCurrency}
            onChange={(e) => updateProfile({ preferredCurrency: e.target.value })}
          >
            {PROFILE_CURRENCIES.map((code) => (
              <option key={code} value={code}>
                {currencyLabel(code, lang)}
              </option>
            ))}
          </select>
          <p className="prf-hint">
            {lang === "fr"
              ? "Utilisée pour l'affichage des modules Pouvoir d'achat, Retraite et Convertisseur."
              : "Used in Purchasing Power, Retirement, and Currency Converter modules."}
            {FIXED_PEGS[profile.preferredCurrency] && (
              <span style={{ color: "rgba(40,167,69,0.75)", display: "block", marginTop: 3 }}>
                ★ {lang === "fr"
                  ? `Parité fixe : 1 ${FIXED_PEGS[profile.preferredCurrency].anchor} = ${FIXED_PEGS[profile.preferredCurrency].rate.toLocaleString("fr-FR")} ${profile.preferredCurrency}`
                  : `Fixed parity: 1 ${FIXED_PEGS[profile.preferredCurrency].anchor} = ${FIXED_PEGS[profile.preferredCurrency].rate.toLocaleString("en-US")} ${profile.preferredCurrency}`}
              </span>
            )}
          </p>
        </div>

        {/* Priorités */}
        <div className="prf-section">
          <label className="prf-label">
            {lang === "fr"
              ? "Mes priorités — influencent le score de destination"
              : "My priorities — influence destination scoring"}
          </label>
          <div className="prf-priorities">
            {(Object.keys(PRIORITY_LABEL) as (keyof UserPriorities)[]).map((key) => (
              <PrioritySlider
                key={key}
                keyName={key}
                value={profile.priorities[key]}
                lang={lang}
                onChange={(v) => updatePriority(key, v)}
              />
            ))}
          </div>
        </div>

        {/* Résumé */}
        <div className="prf-summary">
          <div className="prf-summary-row">
            <span>{lang === "fr" ? "Profil actif :" : "Active profile:"}</span>
            <strong>
              {profile.displayName || (lang === "fr" ? "Anonyme" : "Anonymous")}
              {" · "}{homeCountry?.displayName ?? profile.homeIso3}
              {" · "}{profile.monthlyBudgetEur.toLocaleString("fr-FR")} €/{lang === "fr" ? "mois" : "mo"}
            </strong>
          </div>
        </div>

        {/* Reset */}
        <button
          type="button"
          className="prf-reset-btn"
          onClick={() => { resetProfile(); onClose(); }}
        >
          {lang === "fr" ? "Réinitialiser le profil" : "Reset profile"}
        </button>
      </div>
    </div>
  );
}