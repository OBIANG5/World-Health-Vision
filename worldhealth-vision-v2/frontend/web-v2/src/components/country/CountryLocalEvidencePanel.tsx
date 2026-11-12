/**
 * Country-specific truth layer: national institutions, local reporting, and
 * carefully qualified statistical releases. Does not use a static fake
 * catalogue and does not call a curated claim a Timescale observation.
 */
import { useEffect, useState } from "react";
import { fetchCountryLocalContext, fetchCountryNationalComparisons } from "../../api/whvApi";
import type { CountryLocalContext, CountryNationalComparisons } from "../../api/types";

type Props = {
  iso3: string;
  enabled: boolean;
  lang: string;
};

const COPY = {
  fr: {
    title: "Sources nationales et réalités locales",
    subtitle: "Publications du pays, institutions et médias locaux — sans effacer les séries internationales.",
    loading: "Vérification des publications locales…",
    unknown: "Sources locales non vérifiables : le catalogue connecté n'est pas accessible.",
    snapshotNote: "APERÇU STATIQUE · Ces institutions et cette publication proviennent des migrations SQL V24–V26 du projet. Aucun accès aux données nationales ou internationales en temps réel n'est activé ici.",
    snapshotComparisonUnavailable: "Comparaison internationale en direct indisponible dans l'aperçu. Le dernier chiffre Banque mondiale ne doit pas être inventé ou supposé identique à celui d'un test antérieur.",
    empty: "Aucune source locale documentée pour ce pays dans notre catalogue pour le moment. Cela ne signifie pas qu'il n'en existe pas.",
    official: "Institution nationale",
    press: "Média local",
    regional: "Institution régionale partagée",
    other: "Source locale",
    catalogueOnly: "Répertoriée — aucun connecteur de collecte opérationnel",
    connectionInReview: "Connecteur en cours de vérification",
    connectionVerified: "Connecteur testé (ne garantit pas une couverture complète)",
    reviewDue: "Prochaine révision des informations",
    sourceLimitations: "Limites et droits de réutilisation",
    verified: "Organisation identifiée",
    review: "À vérifier",
    record: "Publication statistique documentée",
    status: "Donnée citée, non ingérée automatiquement",
    ingested: "Intégration statistique vérifiée",
    scopeResidents: "Population résidente (toutes nationalités)",
    scopeNationals: "Citoyens de nationalité nationale",
    preliminary: "Résultats préliminaires homologués",
    documentation: "Publication originale",
    supporting: "Corroboration locale",
    methodology: "Précautions méthodologiques",
    comparison: "Contexte international",
    verifiedAt: "Sources revues le",
    rights: "Réutilisation et licences",
    limitation: "L'inscription d'une source ne signifie ni qu'elle est parfaite, ni que toutes ses données sont collectées.",
    comparisonLoading: "Recherche des chiffres réellement présents dans notre base statistique…",
    comparisonUnavailable: "Impossible de vérifier actuellement les séries internationales : aucune comparaison chiffrée n'est affirmée.",
    comparisonMissing: "Aucune observation internationale stockée et utilisable pour cet indicateur.",
    comparisonUnaligned: "Les périodes de référence diffèrent — aucun écart chiffré interprétable n'est calculé.",
    comparisonUnreviewed: "Même année, mais méthodes et périmètres non validés comme équivalents.",
    comparisonNotReady: "Comparaison non disponible pour cette publication.",
    internationalObserved: "Mesure observée",
    internationalEstimated: "Estimation",
    internationalHeading: "Organismes internationaux : données réellement enregistrées",
    methodologicalWarning: "Même pour une année commune, un recensement et une estimation ne prouvent pas un accord ou une contradiction.",

  },
  en: {
    title: "National sources and local realities",
    subtitle: "Local institutions, publications and reporting — without hiding international series.",
    loading: "Checking local publications…",
    unknown: "Local evidence cannot be verified: the connected catalog is unavailable.",
    snapshotNote: "STATIC PREVIEW · These institutions and the documented release come from the project's versioned V24–V26 SQL migrations. Live national and international statistical collection is not enabled here.",
    snapshotComparisonUnavailable: "Live international comparison is unavailable in this preview. Historical World Bank numbers must not be invented or mistaken for a current dataset.",
    empty: "No researched local sources have yet been recorded for this country. This does not mean none exist.",
    official: "National institution",
    press: "Local media",
    regional: "Shared regional institution",
    other: "Local source",
    catalogueOnly: "Listed only — no operational collection connector",
    connectionInReview: "Connector under review",
    connectionVerified: "Connector tested (does not guarantee complete coverage)",
    reviewDue: "Next source metadata review",
    sourceLimitations: "Source limitations and reuse terms",
    verified: "Organization identified",
    review: "Needs review",
    record: "Documented statistical release",
    status: "Documented claim, not automatically ingested",
    ingested: "Verified statistical integration",
    scopeResidents: "Resident population (all nationalities)",
    scopeNationals: "National citizens",
    preliminary: "Homologated preliminary figures",
    documentation: "Original publication",
    supporting: "Local corroboration",
    methodology: "Methodological caution",
    comparison: "International context",
    verifiedAt: "Sources reviewed on",
    rights: "Reuse and licences",
    limitation: "A listed source is not necessarily unbiased, methodologically validated or connected to ingestion.",
    comparisonLoading: "Checking the actual international values stored in our statistical database…",
    comparisonUnavailable: "International series could not be verified. No numerical comparison is asserted.",
    comparisonMissing: "No usable international observations are currently stored for this indicator.",
    comparisonUnaligned: "Reference periods differ — no interpreted numeric gap is computed.",
    comparisonUnreviewed: "Same year, but scope and methodology are not yet verified as equivalent.",
    comparisonNotReady: "No comparison is available for this documented release.",
    internationalObserved: "Observed",
    internationalEstimated: "Estimated",
    internationalHeading: "International institutions: actually stored observations",
    methodologicalWarning: "Even for a common year, a census and an estimate do not by themselves establish agreement or conflict.",

  },
} as const;

function validExternalUrl(url: string): string | null {
  try {
    const parsed = new URL(url);
    return parsed.protocol === "https:" ? parsed.toString() : null;
  } catch {
    return null;
  }
}

export default function CountryLocalEvidencePanel({ iso3, enabled, lang }: Props) {
  const [data, setData] = useState<CountryLocalContext | null>(null);
  const [status, setStatus] = useState<"loading" | "ready" | "unavailable">("loading");
  const [comparisons, setComparisons] = useState<CountryNationalComparisons | null>(null);
  const [comparisonStatus, setComparisonStatus] = useState<"idle" | "loading" | "ready" | "unavailable">("idle");
  const copy = lang === "fr" ? COPY.fr : COPY.en;
  const isPreview = import.meta.env.VITE_WHV_PREVIEW_MODE === "true";

  useEffect(() => {
    if (!enabled || !/^[A-Z]{3}$/.test(iso3)) return;
    let active = true;
    setData(null);
    setStatus("loading");
    fetchCountryLocalContext(iso3)
      .then((value) => {
        if (!active) return;
        setData(value);
        setStatus("ready");
      })
      .catch(() => {
        if (!active) return;
        setStatus("unavailable");
      });
    return () => { active = false; };
  }, [iso3, enabled]);

  // The national registry remains visible if the analytics/timeseries
  // backend is unavailable. Never claim 'no international observations' when
  // it might be a network failure or a disconnected static preview.
  useEffect(() => {
    if (!enabled || data?.countryIso3 !== iso3 || !data.documentedReleases.length) return;
    let active = true;
    setComparisons(null);
    setComparisonStatus("loading");
    fetchCountryNationalComparisons(iso3)
      .then((result) => {
        if (!active) return;
        setComparisons(result);
        setComparisonStatus("ready");
      })
      .catch(() => {
        if (!active) return;
        setComparisonStatus("unavailable");
      });
    return () => { active = false; };
  }, [iso3, enabled, data]);

  if (!enabled || !/^[A-Z]{3}$/.test(iso3)) return null;

  const numberFormatter = new Intl.NumberFormat(lang === "fr" ? "fr-FR" : "en-US", {
    maximumFractionDigits: 0,
  });

  return (
    <details className="whv-national-evidence" key={iso3} open={iso3 === "GAB"}>
      <summary>
        <span className="whv-national-evidence-icon" aria-hidden="true">◈</span>
        <span>
          <strong>{copy.title}</strong>
          <small>{copy.subtitle}</small>
        </span>
        {status === "ready" && data && data.localSourceCount > 0 && (
          <span className="whv-national-evidence-count">{data.localSourceCount}</span>
        )}
      </summary>
      <div className="whv-national-evidence-body">
        {isPreview && <p className="whv-national-evidence-footnote">{copy.snapshotNote}</p>}
        {status === "loading" && <p role="status">{copy.loading}</p>}
        {status === "unavailable" && <p role="status">{copy.unknown}</p>}
        {status === "ready" && data?.localSourceCount === 0 && <p>{copy.empty}</p>}
        {status === "ready" && data && data.localSourceCount > 0 && (
          <>
            <div className="whv-national-evidence-sources">
              {data.localSources.map((source) => {
                const url = validExternalUrl(source.evidenceUrl);
                const sourceKind = source.sourceType === "NATIONAL_OFFICIAL"
                  ? copy.official
                  : source.sourceType === "REGIONAL_OFFICIAL"
                    ? copy.regional
                    : source.sourceType === "LOCAL_MEDIA" ? copy.press : copy.other;
                const connection = source.connectionState === "INGESTION_VERIFIED"
                  ? copy.connectionVerified
                  : source.connectionState === "CONNECTOR_IN_REVIEW"
                    ? copy.connectionInReview : copy.catalogueOnly;
                return (
                  <div className="whv-national-evidence-source" key={source.sourceCode}>
                    <span className="whv-national-evidence-kind">{sourceKind}</span>
                    <strong>{source.displayName}</strong>
                    <span className="whv-national-evidence-meta">
                      {source.verificationState === "VERIFIED_ORGANIZATION" ? copy.verified : copy.review}
                    </span>
                    <span className="whv-national-evidence-connection">{connection}</span>
                    {source.reviewDueOn && (
                      <span className="whv-national-evidence-meta">
                        {copy.reviewDue} : {source.reviewDueOn}
                      </span>
                    )}
                    <details className="whv-national-evidence-restrictions">
                      <summary>{copy.sourceLimitations}</summary>
                      <p>{source.methodologyCaveat}</p>
                      <p>{source.reuseRightsNote}</p>
                    </details>
                    {url && <a href={url} target="_blank" rel="noopener noreferrer">
                      {lang === "fr" ? "Consulter la source" : "Open source"}
                    </a>}
                  </div>
                );
              })}
            </div>
            {data.documentedReleases.map((item) => {
              const official = validExternalUrl(item.primaryEvidenceUrl);
              const corroboration = item.corroborationUrl ? validExternalUrl(item.corroborationUrl) : null;
              const scope = item.populationScope === "ALL_RESIDENTS"
                ? copy.scopeResidents : item.populationScope === "NATIONAL_CITIZENS"
                  ? copy.scopeNationals : item.indicatorCode;
              const live = comparisons?.comparisons.find(
                (record) => record.releaseCode === item.releaseCode && record.indicatorCode === item.indicatorCode,
              );
              const comparisonLabel = live?.status === "NO_INTERNATIONAL_OBSERVATIONS"
                ? copy.comparisonMissing
                : live?.status === "DIFFERENT_REFERENCE_PERIOD"
                  ? copy.comparisonUnaligned
                  : live?.status === "SAME_YEAR_METHOD_NOT_VERIFIED"
                    ? copy.comparisonUnreviewed : copy.comparisonNotReady;
              return (
                <article className="whv-national-evidence-release" key={item.releaseCode}>
                  <span className="whv-national-evidence-kind">{copy.record}</span>
                  <strong className="whv-national-evidence-value">
                    {numberFormatter.format(item.valueNumeric)}
                    <span>{item.unitLabel === "PEOPLE" ? (lang === "fr" ? "habitants" : "people") : item.unitLabel}</span>
                  </strong>
                  <p>{scope} · {item.referenceYear}</p>
                  <p className="whv-national-evidence-caution">
                    {item.publicationStatus === "PRELIMINARY_HOMOLOGATED"
                      ? copy.preliminary : item.publicationStatus}
                    {" · "}
                    {item.verificationStatus === "DOCUMENTED_NOT_INGESTED" ? copy.status : copy.ingested}
                  </p>
                  <p><strong>{copy.methodology} :</strong> {item.methodologyCaveat}</p>
                  <div className="whv-national-comparison" aria-live="polite">
                    <strong className="whv-national-comparison-title">{copy.internationalHeading}</strong>
                    {comparisonStatus === "loading" && <p role="status">{copy.comparisonLoading}</p>}
                    {comparisonStatus === "unavailable" && <p role="status">{isPreview ? copy.snapshotComparisonUnavailable : copy.comparisonUnavailable}</p>}
                    {comparisonStatus === "ready" && (
                      <>
                        <p className="whv-national-evidence-caution">{comparisonLabel}</p>
                        {live?.internationalLatest.map((external) => (
                          <div className="whv-national-comparison-source" key={external.sourceCode}>
                            <strong>{external.sourceDisplayName}</strong>
                            <span>{numberFormatter.format(external.numericValue)} · {external.periodLabel}</span>
                            <small>
                              {external.valueStatus === "OBSERVED"
                                ? copy.internationalObserved : copy.internationalEstimated}
                              {" · "}{external.datasetCode}
                            </small>
                          </div>
                        ))}
                        {live && live.internationalLatest.length > 0 && (
                          <p className="whv-national-evidence-footnote">{copy.methodologicalWarning}</p>
                        )}
                      </>
                    )}
                  </div>
                  <p><strong>{copy.comparison} :</strong> {item.internationalComparisonNote}</p>
                  <div className="whv-national-evidence-links">
                    {official && <a href={official} target="_blank" rel="noopener noreferrer">{copy.documentation}</a>}
                    {corroboration && <a href={corroboration} target="_blank" rel="noopener noreferrer">{copy.supporting}</a>}
                  </div>
                </article>
              );
            })}
            <p className="whv-national-evidence-footnote">
              {copy.limitation} {copy.verifiedAt} {data.localSources[0]?.lastReviewedOn}.
            </p>
          </>
        )}
      </div>
    </details>
  );
}
