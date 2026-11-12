/**
 * Country-specific truth layer: national institutions, local reporting, and
 * carefully qualified statistical releases. Does not use a static fake
 * catalogue and does not call a curated claim a Timescale observation.
 */
import { useEffect, useState } from "react";
import { fetchCountryLocalContext } from "../../api/whvApi";
import type { CountryLocalContext } from "../../api/types";

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
    empty: "Aucune source locale documentée pour ce pays dans notre catalogue pour le moment. Cela ne signifie pas qu'il n'en existe pas.",
    official: "Institution nationale",
    press: "Média local",
    other: "Source locale",
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
  },
  en: {
    title: "National sources and local realities",
    subtitle: "Local institutions, publications and reporting — without hiding international series.",
    loading: "Checking local publications…",
    unknown: "Local evidence cannot be verified: the connected catalog is unavailable.",
    empty: "No researched local sources have yet been recorded for this country. This does not mean none exist.",
    official: "National institution",
    press: "Local media",
    other: "Local source",
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
  const copy = lang === "fr" ? COPY.fr : COPY.en;

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
                  : source.sourceType === "LOCAL_MEDIA" ? copy.press : copy.other;
                return (
                  <div className="whv-national-evidence-source" key={source.sourceCode}>
                    <span className="whv-national-evidence-kind">{sourceKind}</span>
                    <strong>{source.displayName}</strong>
                    <span className="whv-national-evidence-meta">
                      {source.verificationState === "VERIFIED_ORGANIZATION" ? copy.verified : copy.review}
                    </span>
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
