// WorldHealthVision V2 — DestinationScorePanel
// Classement des destinations selon le profil utilisateur.
// Score = moyenne pondérée de 5 dimensions (coût, sécurité, santé, emploi, gouvernance)
// chacune dérivée des lentilles WHV existantes (multi-sources, confiance exposée).
// Stratégie de chargement : shortlist de 35 destinations populaires + ajout libre.

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { CountrySummary, IndicatorOverviewResponse } from "../../api/types";
import { fetchIndicatorOverview } from "../../api/whvApi";
import { useLang } from "../../context/LanguageContext";
import { PRIORITY_LABEL, type UserPriorities, useUserProfile } from "../../context/UserProfileContext";
import {WorldIcon} from "../ui/WorldIcon";
import "../../styles/destination-score.css";

// ---------- Shortlist destinations populaires (expats / retraite / nomades) ----------

const POPULAR_ISO3 = [
  "PRT","ESP","ITA","GRC","DEU","NLD","FRA","CHE","AUT","BEL",
  "POL","HUN","CZE","THA","VNM","IDN","MYS","PHL","MEX","COL",
  "BRA","ARG","CHL","PER","MAR","TUN","ZAF","KEN","AUS","NZL",
  "CAN","USA","JPN","SGP","ARE",
];

// ---------- types ----------

interface DimScore {
  value: number | null;      // 0–100
  confidence: string;
  agreement: string;
  sourceCount: number;
  lensName: string;
  indicatorCode: string;
}

interface CountryScore {
  iso3: string;
  displayName: string;
  iso2: string | null;
  dimensions: Record<keyof UserPriorities, DimScore>;
  composite: number | null;
  loaded: boolean;
  error: boolean;
}

// ---------- helpers ----------

function flag(iso2?: string | null): string {
  if (!iso2 || iso2.length !== 2) return "—";
  const b = 0x1f1e6, A = 65, u = iso2.toUpperCase();
  return String.fromCodePoint(u.charCodeAt(0) - A + b) + String.fromCodePoint(u.charCodeAt(1) - A + b);
}

// Normalise une valeur (lower = better si inverted, higher = better sinon) → 0–100
function normalize(v: number | null, min: number, max: number, invert = false): number | null {
  if (v === null) return null;
  const clamped = Math.max(min, Math.min(max, v));
  const raw = (clamped - min) / (max - min);
  return Math.round((invert ? 1 - raw : raw) * 100);
}

// Construit une dimension à partir de l'overview d'UN indicateur (léger + caché).
// On utilise la médiane multi-sources (divergence.medianNumericValue), normalisée 0–100.
async function dimFromOverview(
  iso3: string,
  indicatorCode: string,
  min: number,
  max: number,
  invert: boolean,
): Promise<DimScore> {
  try {
    const ov = await fetchIndicatorOverview(iso3, indicatorCode);
    return {
      value: normalize(ov.divergence.medianNumericValue, min, max, invert),
      confidence: ov.confidence.level,
      agreement: ov.divergence.agreementLevel,
      sourceCount: ov.divergence.comparableValueCount,
      lensName: ov.indicator.displayName,
      indicatorCode,
    };
  } catch {
    return { value: null, confidence: "", agreement: "", sourceCount: 0, lensName: indicatorCode, indicatorCode };
  }
}

// Calcule le score composite pondéré
function computeComposite(dims: Record<keyof UserPriorities, DimScore>, priorities: UserPriorities): number | null {
  let total = 0;
  let weight = 0;
  (Object.keys(priorities) as (keyof UserPriorities)[]).forEach(k => {
    const v = dims[k].value;
    if (v !== null && priorities[k] > 0) {
      total += v * priorities[k];
      weight += priorities[k];
    }
  });
  if (weight === 0) return null;
  return Math.round(total / weight);
}

// Couleur selon le score
function scoreColor(score: number | null): string {
  if (score === null) return "rgba(183,220,245,0.3)";
  if (score >= 70) return "#4ade80";
  if (score >= 50) return "#60a5fa";
  if (score >= 35) return "#fbbf24";
  return "#f87171";
}

function scoreLabel(score: number | null, lang: "fr" | "en"): string {
  if (score === null) return lang === "fr" ? "N/D" : "N/A";
  if (score >= 70) return lang === "fr" ? "Excellent" : "Excellent";
  if (score >= 55) return lang === "fr" ? "Bien" : "Good";
  if (score >= 40) return lang === "fr" ? "Moyen" : "Average";
  return lang === "fr" ? "Difficile" : "Challenging";
}

// ---------- cache pour éviter les refetch ----------

// Niveau de prix (indice, réf. mondiale ≈ 100) = PIB/hab nominal ÷ PIB/hab PPA,
// perspective Banque mondiale (cohérent et mondial — même base que « Pouvoir d'achat »).
async function priceLevelFor(iso3: string): Promise<number | null> {
  try {
    const [nominalOv, pppOv] = await Promise.all([
      fetchIndicatorOverview(iso3, "NY.GDP.PCAP.CD"),
      fetchIndicatorOverview(iso3, "NY.GDP.PCAP.PP.CD"),
    ]);
    const wb = (ov: IndicatorOverviewResponse): number | null =>
      ov.sourcePerspectives.find(p => p.sourceCode === "WORLD_BANK" && p.numericValue !== null)?.numericValue ?? null;
    const nominal = wb(nominalOv), ppp = wb(pppOv);
    return nominal !== null && ppp !== null && ppp > 0 ? (nominal / ppp) * 100 : null;
  } catch {
    return null;
  }
}

// Dimension « coût de la vie » : moins cher = meilleure note (invert).
function priceDim(priceLevel: number | null): DimScore {
  return {
    value: normalize(priceLevel, 25, 150, true),
    confidence: priceLevel !== null ? "MEDIUM" : "",
    agreement: priceLevel !== null ? "CONSISTENT" : "",
    sourceCount: priceLevel !== null ? 1 : 0,
    lensName: "Coût de la vie (Banque mondiale)",
    indicatorCode: "PA.NUS.PPPC.RF",
  };
}

// ---------- composant ConfidenceDot ----------

const CONF_COLOR: Record<string, string> = { HIGH: "#4ade80", MEDIUM: "#fbbf24", LOW: "#f87171", INSUFFICIENT_EVIDENCE: "rgba(183,220,245,0.25)" };
const AGREE_ICON: Record<string, string> = { CONSISTENT: "✓", MIXED: "~", DIVERGENT: "!", INSUFFICIENT_DATA: "?" };

function ConfidenceDot({ confidence, agreement, sourceCount }: { confidence: string; agreement: string; sourceCount: number }) {
  const [show, setShow] = useState(false);
  return (
    <span
      className="ds-conf-dot"
      style={{ background: CONF_COLOR[confidence] ?? CONF_COLOR.INSUFFICIENT_EVIDENCE }}
      onMouseEnter={() => setShow(true)}
      onMouseLeave={() => setShow(false)}
      title={`${confidence} — ${agreement} (${sourceCount} src)`}
    >
      {show && (
        <span className="ds-conf-tooltip">
          <strong>{confidence}</strong>{" · "}
          <span style={{ color: CONF_COLOR[agreement] ?? "inherit" }}>{AGREE_ICON[agreement]}{agreement}</span>
          {sourceCount > 0 && <> · {sourceCount} src</>}
        </span>
      )}
    </span>
  );
}

// ---------- composant ScoreRow ----------

function ScoreRow({ country, priorities, lang, onOpen }: {
  country: CountryScore;
  priorities: UserPriorities;
  lang: "fr" | "en";
  onOpen: () => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const color = scoreColor(country.composite);

  return (
    <div className="ds-score-row">
      <button type="button" className="ds-row-main" onClick={() => setExpanded(v => !v)}>
        <span className="ds-row-flag">{flag(country.iso2)}</span>
        <span className="ds-row-name">{country.displayName}</span>
        {country.loaded ? (
          <>
            <div className="ds-score-bar-wrap">
              <div className="ds-score-bar" style={{ width: `${country.composite ?? 0}%`, background: color }} />
            </div>
            <span className="ds-score-num" style={{ color }}>
              {country.composite ?? "—"}
            </span>
            <span className="ds-score-lbl" style={{ color }}>
              {scoreLabel(country.composite, lang)}
            </span>
          </>
        ) : country.error ? (
          <span className="ds-row-error">{lang === "fr" ? "Indisponible" : "Unavailable"}</span>
        ) : (
          <span className="ds-row-loading">…</span>
        )}
        <span className="ds-row-chevron">{expanded ? "▲" : "▼"}</span>
      </button>

      {expanded && country.loaded && (
        <div className="ds-dim-grid">
          {(Object.keys(priorities) as (keyof UserPriorities)[]).map(k => {
            const dim = country.dimensions[k];
            const meta = PRIORITY_LABEL[k];
            const w = priorities[k];
            if (w === 0) return null;
            return (
              <div key={k} className="ds-dim-row">
                <span className="ds-dim-icon">{meta.icon}</span>
                <span className="ds-dim-name">{lang === "fr" ? meta.fr : meta.en}</span>
                <div className="ds-dim-bar-wrap">
                  <div className="ds-dim-bar" style={{ width: `${dim.value ?? 0}%`, background: scoreColor(dim.value) }} />
                </div>
                <span className="ds-dim-val">{dim.value ?? "—"}</span>
                {dim.confidence && (
                  <ConfidenceDot confidence={dim.confidence} agreement={dim.agreement} sourceCount={dim.sourceCount} />
                )}
                <span className="ds-dim-weight" title={lang === "fr" ? `Poids : ${w}/10` : `Weight: ${w}/10`}>
                  ×{w}
                </span>
              </div>
            );
          })}
          <button type="button" className="ds-open-btn" onClick={(e) => { e.stopPropagation(); onOpen(); }}>
            {lang === "fr" ? "Ouvrir la fiche" : "Open country sheet"}
          </button>
        </div>
      )}
    </div>
  );
}

// ---------- composant principal ----------

type Props = {
  countries: CountrySummary[];
  onOpenCountry: (iso3: string) => void;
  onClose: () => void;
};

export default function DestinationScorePanel({ countries, onOpenCountry, onClose }: Props) {
  const lang = useLang();
  const { profile } = useUserProfile();
  const [scores, setScores] = useState<Map<string, CountryScore>>(new Map());
  const [addSearch, setAddSearch] = useState("");
  const [sortBy, setSortBy] = useState<"composite" | keyof UserPriorities>("composite");
  const loadingRef = useRef(new Set<string>());

  // Shortlist initiale (sans le pays de résidence de l'utilisateur)
  const shortlist = useMemo(() =>
    POPULAR_ISO3.filter(iso3 => iso3 !== profile.homeIso3 && countries.some(c => c.iso3 === iso3)),
    [profile.homeIso3, countries],
  );

  // Charger les données d'un pays
  const loadCountry = useCallback(async (iso3: string) => {
    if (loadingRef.current.has(iso3)) return;
    loadingRef.current.add(iso3);

    const country = countries.find(c => c.iso3 === iso3);
    if (!country) return;

    // Marquer comme en chargement
    setScores(prev => {
      const next = new Map(prev);
      next.set(iso3, {
        iso3, displayName: country.displayName, iso2: country.iso2,
        dimensions: {} as Record<keyof UserPriorities, DimScore>,
        composite: null, loaded: false, error: false,
      });
      return next;
    });

    try {
      // Une dimension = UN indicateur réel, simple et cohérent (médiane multi-sources) :
      //  • Coût        → niveau de prix mondial (Banque mondiale), moins cher = meilleure note
      //  • Sécurité    → taux d'homicides /100 000 (plus bas = mieux)
      //  • Santé       → espérance de vie (ans)
      //  • Emploi      → taux de chômage (plus bas = mieux)
      //  • Gouvernance → État de droit (WGI, Banque mondiale, -2,5 à +2,5)
      const [priceLevel, safety, healthcare, employment, governance] = await Promise.all([
        priceLevelFor(iso3),
        dimFromOverview(iso3, "WHV.SAFETY.HOMICIDE.RATE.P100K",  0,  30, true),
        dimFromOverview(iso3, "SP.DYN.LE00.IN",                 50,  85, false),
        dimFromOverview(iso3, "SL.UEM.TOTL.ZS",                  0,  30, true),
        dimFromOverview(iso3, "RL.EST",                       -2.5, 2.5, false),
      ]);

      const dims: Record<keyof UserPriorities, DimScore> = {
        cost: priceDim(priceLevel), safety, healthcare, employment, governance,
      };

      const composite = computeComposite(dims, profile.priorities);

      setScores(prev => {
        const next = new Map(prev);
        next.set(iso3, { iso3, displayName: country.displayName, iso2: country.iso2, dimensions: dims, composite, loaded: true, error: false });
        return next;
      });
    } catch {
      setScores(prev => {
        const next = new Map(prev);
        next.set(iso3, { iso3, displayName: country.displayName, iso2: country.iso2, dimensions: {} as Record<keyof UserPriorities, DimScore>, composite: null, loaded: true, error: true });
        return next;
      });
    } finally {
      loadingRef.current.delete(iso3);
    }
  }, [countries, profile.priorities]);

  // Charger la shortlist par vagues (3 à la fois pour ne pas surcharger)
  useEffect(() => {
    let i = 0;
    const step = async () => {
      const batch = shortlist.slice(i, i + 3);
      if (batch.length === 0) return;
      await Promise.all(batch.map(loadCountry));
      i += 3;
      if (i < shortlist.length) setTimeout(step, 200);
    };
    step();
  }, [shortlist, loadCountry]);

  // Pays triés
  const sorted = useMemo(() => {
    const list = Array.from(scores.values()).filter(s => s.loaded && !s.error);
    return list.sort((a, b) => {
      if (sortBy === "composite") return (b.composite ?? -1) - (a.composite ?? -1);
      return (b.dimensions[sortBy]?.value ?? -1) - (a.dimensions[sortBy]?.value ?? -1);
    });
  }, [scores, sortBy]);

  const notLoaded = shortlist.length - Array.from(scores.values()).filter(s => s.loaded).length;

  const filteredAdd = addSearch
    ? countries.filter(c =>
        !POPULAR_ISO3.includes(c.iso3) &&
        c.iso3 !== profile.homeIso3 &&
        (c.displayName.toLowerCase().includes(addSearch.toLowerCase()) || c.iso3.toLowerCase().includes(addSearch.toLowerCase()))
      ).slice(0, 20)
    : [];

  return (
    <div className="ds-panel">
      <div className="ds-header">
        <div className="ds-header-left">
          <span className="ds-header-icon"><WorldIcon name="destination" size={23}/></span>
          <div>
            <h2 className="ds-title">{lang === "fr" ? "Score de destination" : "Destination score"}</h2>
            <p className="ds-subtitle">
              {lang === "fr"
                ? "Classement personnalisé selon vos priorités"
                : "Personalized ranking based on your priorities"}
            </p>
          </div>
        </div>
        <button type="button" className="ds-close-btn" onClick={onClose}>✕</button>
      </div>

      <div className="ds-body">
        {/* Info profil actif */}
        <div className="ds-profile-bar">
          <span className="ds-profile-label">
            {lang === "fr" ? "Profil :" : "Profile:"}
          </span>
          {(Object.keys(profile.priorities) as (keyof UserPriorities)[])
            .filter(k => profile.priorities[k] >= 5)
            .map(k => (
              <span key={k} className="ds-profile-chip">
                {PRIORITY_LABEL[k].icon} {lang === "fr" ? PRIORITY_LABEL[k].fr : PRIORITY_LABEL[k].en} ×{profile.priorities[k]}
              </span>
            ))
          }
        </div>

        {/* Tri */}
        <div className="ds-sort-row">
          <span className="ds-sort-label">{lang === "fr" ? "Trier par :" : "Sort by:"}</span>
          <button type="button" className={`ds-sort-btn${sortBy === "composite" ? " active" : ""}`} onClick={() => setSortBy("composite")}>
            {lang === "fr" ? "Score global" : "Global score"}
          </button>
          {(Object.keys(profile.priorities) as (keyof UserPriorities)[]).map(k => (
            <button key={k} type="button"
              className={`ds-sort-btn${sortBy === k ? " active" : ""}`}
              onClick={() => setSortBy(k)}>
              {PRIORITY_LABEL[k].icon}
            </button>
          ))}
        </div>

        {/* Légende transparence */}
        <div className="ds-legend">
          <span className="ds-legend-dot" style={{ background: "#4ade80" }} />
          <span>{lang === "fr" ? "Haute fiabilité" : "High confidence"}</span>
          <span className="ds-legend-dot" style={{ background: "#fbbf24" }} />
          <span>{lang === "fr" ? "Moyenne" : "Medium"}</span>
          <span className="ds-legend-dot" style={{ background: "#f87171" }} />
          <span>{lang === "fr" ? "Faible" : "Low"}</span>
          <span className="ds-legend-note">{lang === "fr" ? "— Passez sur le • pour voir les sources" : "— Hover • to see sources"}</span>
        </div>

        {/* Chargement progressif */}
        {notLoaded > 0 && (
          <div className="ds-loading-bar">
            <div className="ds-loading-fill" style={{ width: `${Math.round(((shortlist.length - notLoaded) / shortlist.length) * 100)}%` }} />
          </div>
        )}

        {/* Liste des scores */}
        <div className="ds-list">
          {sorted.map((cs, i) => (
            <div key={cs.iso3} className="ds-rank-item">
              <span className="ds-rank">{i + 1}</span>
              <ScoreRow
                country={cs}
                priorities={profile.priorities}
                lang={lang}
                onOpen={() => { onOpenCountry(cs.iso3); onClose(); }}
              />
            </div>
          ))}
          {notLoaded > 0 && (
            <p className="ds-loading-note">
              {lang === "fr" ? `Analyse en cours… ${notLoaded} pays restants` : `Analyzing… ${notLoaded} countries remaining`}
            </p>
          )}
        </div>

        {/* Ajouter un pays hors shortlist */}
        <div className="ds-add-section">
          <p className="ds-add-label">{lang === "fr" ? "Ajouter une destination" : "Add a destination"}</p>
          <input
            type="text"
            className="ds-add-search"
            placeholder={lang === "fr" ? "Pays non listé…" : "Country not listed…"}
            value={addSearch}
            onChange={e => setAddSearch(e.target.value)}
          />
          {filteredAdd.length > 0 && (
            <div className="ds-add-results">
              {filteredAdd.map(c => (
                <button key={c.iso3} type="button" className="ds-add-item"
                  onClick={() => { loadCountry(c.iso3); setAddSearch(""); }}>
                  {flag(c.iso2)} {c.displayName}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Note méthodologie */}
        <details className="ds-methodology">
          <summary>{lang === "fr" ? "Méthodologie & limites" : "Methodology & limits"}</summary>
          <p>
            {lang === "fr"
              ? "Chaque pays reçoit une note sur 100 pour 5 critères, puis une note globale = MOYENNE PONDÉRÉE par l'importance (sur 10) que vous avez fixée dans votre profil. Exemple : si vous notez la sécurité 9/10 et le coût 3/10, la sécurité pèse 3 fois plus dans le score. Les 5 critères, chacun basé sur UN indicateur réel : Coût de la vie = niveau de prix mondial (Banque mondiale, moins cher = meilleure note) ; Sécurité = taux d'homicides pour 100 000 hab. (plus bas = mieux) ; Santé = espérance de vie ; Emploi = taux de chômage (plus bas = mieux) ; Gouvernance = État de droit (indicateurs de gouvernance de la Banque mondiale, WGI). Un critère sans donnée pour un pays est simplement ignoré — les autres restent valides. Limites : indicateurs nationaux (pas de détail par ville/région), dernière année disponible, et certains pays manquent encore de données pour un ou plusieurs critères."
              : "Each country gets a 0–100 score for 5 criteria, then an overall score = WEIGHTED AVERAGE by the importance (out of 10) you set in your profile. Example: rating safety 9/10 and cost 3/10 makes safety weigh 3× more. The 5 criteria, each from ONE real indicator: Cost of living = world price level (World Bank, cheaper = higher score); Safety = homicide rate per 100k (lower = better); Health = life expectancy; Employment = unemployment rate (lower = better); Governance = Rule of Law (World Bank WGI). A criterion with no data for a country is simply ignored — the others stay valid. Limits: national indicators (no city/region detail), latest available year, and some countries still lack data for one or more criteria."}
          </p>
        </details>
      </div>
    </div>
  );
}