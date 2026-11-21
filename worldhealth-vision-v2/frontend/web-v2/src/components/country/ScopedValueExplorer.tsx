/**
 * P2C3C2 — read only, verified, explicit SOURCE-NATIVE geography.
 * A value can be public with a narrowly authorized territorial scope while
 * remaining EXCLUDED from country totals and international comparators.
 * No fallbacks to fake country numbers or catalogue guesses. No caching of
 * revocable Ed25519 permission. No HTTP request until visitors open details.
 */
import { useEffect, useState } from "react";
import { fetchCountryScopedPublishedValues } from "../../api/whvApi";
import type { ScopedPublishedValue } from "../../api/types";
import "../../styles/scoped-explorer.css";

type Props = { iso3: string; enabled: boolean; lang: string };

const I18N = {
  fr: {
    title: "Données à périmètre territorial précis",
    intro: "Certaines statistiques ne couvrent qu'une partie d'un pays. Leur lecture et les droits de diffusion sont vérifiés indépendamment des comparaisons nationales.",
    caution: "Ces valeurs NE représentent PAS nécessairement le total du pays. Elles sont exclues des classements et comparaisons nationaux.",
    loading: "Vérification des signatures, des droits et des territoires…",
    unavailable: "Les permissions de diffusion ne peuvent pas être vérifiées actuellement. Aucune valeur n'est affirmée.",
    empty: "Aucune donnée à périmètre spécifique actuellement autorisée dans cette base.",
    refresh: "Actualiser les permissions",
    scope: "Territoire réellement couvert",
    edition: "Référentiel géographique",
    period: "Période statistique",
    excluded: "Territoires exclus",
    method: "Méthode",
    source: "Source institutionnelle",
    original: "Documentation officielle du périmètre",
    observed: "Mesure observée",
    estimated: "Estimation",
    noExclusion: "Aucune exclusion structurée indiquée ; consulter la méthodologie",
    signed: "Droit de diffusion et délimitation vérifiés pour cette valeur",
    warning: "Ne pas comparer à une valeur de pays entier sans examen du champ, des unités et de l'année.",
  },
  en: {
    title: "Values for precise geographic scopes",
    intro: "Some statistics cover only part of a country. Their display rights and territorial review are checked separately from national comparisons.",
    caution: "These values are NOT necessarily whole-country totals. They are excluded from national rankings and comparisons.",
    loading: "Verifying signatures, rights and geography…",
    unavailable: "Publication permissions cannot currently be verified. No value is asserted.",
    empty: "No currently approved scoped observations exist in this database.",
    refresh: "Recheck publication rights",
    scope: "Actual territorial coverage",
    edition: "Geographic reference",
    period: "Statistical period",
    excluded: "Territories excluded",
    method: "Method",
    source: "Institutional source",
    original: "Official scope metadata",
    observed: "Observed measure",
    estimated: "Estimate",
    noExclusion: "No explicit exclusions recorded; consult methodology",
    signed: "Display rights and geographic scope verified for this value",
    warning: "Do not compare to a whole-country statistic without verifying scope, units and reference year.",
  },
} as const;

type ViewState =
  | { key: string; status: "ready"; items: ScopedPublishedValue[] }
  | { key: string; status: "unavailable" };

export default function ScopedValueExplorer({ iso3, enabled, lang }: Props) {
  const [expanded, setExpanded] = useState(false);
  const [revision, setRevision] = useState(0);
  const [result, setResult] = useState<ViewState | null>(null);
  const copy = lang === "fr" ? I18N.fr : I18N.en;
  const key = iso3 + ":" + revision;
  const visible = result?.key === key ? result : null;

  useEffect(() => {
    if (!enabled || !expanded || !/^[A-Z]{3}$/.test(iso3)) return;
    let active = true;
    fetchCountryScopedPublishedValues(iso3)
      .then(value => {
        if (active) setResult({ key, status: "ready", items: value.items });
      })
      .catch(() => {
        if (active) setResult({ key, status: "unavailable" });
      });
    return () => { active = false; };
  }, [enabled, expanded, iso3, key]);

  useEffect(() => {
    if (!enabled || !expanded) return;
    const refresh = () => setRevision(n => n + 1);
    const visibility = () => { if (document.visibilityState === "visible") refresh(); };
    window.addEventListener("focus", refresh);
    document.addEventListener("visibilitychange", visibility);
    return () => {
      window.removeEventListener("focus", refresh);
      document.removeEventListener("visibilitychange", visibility);
    };
  }, [enabled, expanded]);

  if (!enabled || !/^[A-Z]{3}$/.test(iso3)) return null;

  const number = new Intl.NumberFormat(lang === "fr" ? "fr-FR" : "en-US",
    { maximumSignificantDigits: 15 });

  return <details className="whv-scoped-explorer"
    onToggle={event => {
      const open = event.currentTarget.open;
      setExpanded(open);
      if (open) setRevision(n => n + 1);
    }}>
    <summary>
      <strong>{copy.title}</strong>
      <span>{copy.intro}</span>
    </summary>
    <div className="whv-scoped-body" aria-live="polite">
      <p className="whv-scoped-caution">{copy.caution}</p>
      <button type="button" className="whv-scoped-refresh"
        onClick={() => setRevision(n => n + 1)}>{copy.refresh}</button>
      {!visible && <p role="status">{copy.loading}</p>}
      {visible?.status === "unavailable" && <p role="status">{copy.unavailable}</p>}
      {visible?.status === "ready" && visible.items.length === 0 && <p>{copy.empty}</p>}
      {visible?.status === "ready" && visible.items.length > 0 && (
        <div className="whv-scoped-grid">
          {visible.items.map((item) => (
            <article className="whv-scoped-card"
              key={item.sourceCode+":"+item.datasetCode+":"+item.indicatorCode+":"+
                item.sourceNativeGeographyCode+":"+item.periodStart}>
              <div className="whv-scoped-label">
                <small>{copy.scope}</small>
                <h5>{item.scopeDisplayLabel}</h5>
                <span>{item.coverageKind === "PARTIAL_COUNTRY" ?
                  (lang === "fr" ? "Périmètre partiel" : "Partial territory") :
                  (lang === "fr" ? "Échelle infranationale" : "Subnational area")}</span>
              </div>
              <div className="whv-scoped-value">
                <span>{number.format(item.numericValue)} <small>{item.unitCode}</small></span>
                <small>{item.valueStatus === "ESTIMATED" ? copy.estimated : copy.observed}</small>
              </div>
              <dl>
                <div><dt>{copy.edition}</dt><dd>{item.sourceNativeGeographyCode} · {item.geographicVersion}
                  {item.geographicReferenceYear !== null ? " (" + item.geographicReferenceYear + ")" : ""}</dd></div>
                <div><dt>{copy.period}</dt><dd>{item.periodLabel} · {item.periodStart}</dd></div>
                <div><dt>{copy.method}</dt><dd>{item.methodologyCode}</dd></div>
                <div><dt>{copy.excluded}</dt><dd>{
                  item.territorialExclusions.length ? item.territorialExclusions.join(", ") : copy.noExclusion
                }</dd></div>
                <div><dt>{copy.source}</dt><dd>{item.sourceCode} · {item.datasetCode} · {item.indicatorCode}</dd></div>
              </dl>
              <p className="whv-scoped-attribution">{item.attributionText}</p>
              <a href={item.sourceMetadataUrl} target="_blank" rel="noopener noreferrer">
                {copy.original}
              </a>
              <p className="whv-scoped-provenance">{copy.signed}</p>
              <p className="whv-scoped-caution">{copy.warning}</p>
            </article>
          ))}
        </div>
      )}
    </div>
  </details>;
}
