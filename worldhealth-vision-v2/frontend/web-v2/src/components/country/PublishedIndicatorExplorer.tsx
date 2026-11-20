/**
 * Actual PUBLIC country indicator explorer: never substitute catalog entries
 * for eligible observations. No public values are cached after a rights change.
 */
import { useEffect, useState } from "react";
import {
  fetchCountryPublishedIndicators, fetchPublishedLatestSources,
  fetchCatalogIndicatorDetail, fetchCatalogSourceDetail,
} from "../../api/whvApi";
import type {
  CountryPublishedIndicator, PublishedLatestSourceObservation,
  CatalogIndicatorDetail, SourceDetail,
} from "../../api/types";
import "../../styles/published-explorer.css";

type Props = { iso3: string; lang: string };
type Loaded<T> = { key: string; kind: "ready"; value: T } |
  { key: string; kind: "error" };

const COPY = {
  fr: {
    title: "Explorer les indicateurs publiables", intro: "Uniquement les observations actuellement autorisées dans World-Vision.",
    loading: "Vérification des indicateurs…", error: "Données non vérifiables actuellement — aucune absence n'est déduite.",
    empty: "Aucun indicateur éligible dans cette base à cet instant.", refresh: "Revérifier les droits et les données",
    select: "Consulter les observations", choose: "Choisissez un indicateur pour consulter ses sources.",
    latest: "Dernières observations par source", noValue: "Aucune valeur publiable actuellement pour cet indicateur.",
    observations: "observations", observed: "mesurées", estimated: "estimées", sources: "sources",
    measured: "Mesure observée", estimate: "Estimation", period: "Période", unit: "Unité",
    publication: "Source publiée le", collection: "Collectée le", unknownUnit: "non vérifiée",
    sourceDetails: "Méthode, limites et source", sourceError: "Métadonnées de la source momentanément indisponibles.",
    method: "Méthodologie", quality: "Qualité documentée", bias: "Limites connues", rights: "Conditions indiquées au catalogue",
    original: "Documentation de la source", warning: "La notice du catalogue n'est pas une autorisation générale de réutilisation commerciale. Une même période ne prouve pas que deux méthodes sont équivalentes.",
    updated: "Résultats revalidés lors de l'ouverture et du retour sur cet onglet. Les droits peuvent changer.",
    notVerified: "Données non vérifiables — la dernière réponse n'est pas présentée comme actuelle.",
  },
  en: {
    title: "Explore publishable indicators", intro: "Only records currently eligible for public reading in World-Vision.",
    loading: "Checking available indicators…", error: "Cannot verify records currently — no absence is inferred.",
    empty: "No eligible indicator in this database right now.", refresh: "Recheck rights and observations",
    select: "Inspect observations", choose: "Select an indicator to explore its sources.",
    latest: "Latest observations by source", noValue: "No currently publishable value for this indicator.",
    observations: "observations", observed: "observed", estimated: "estimated", sources: "sources",
    measured: "Observed measurement", estimate: "Estimate", period: "Period", unit: "Unit",
    publication: "Source published", collection: "Retrieved", unknownUnit: "not verified",
    sourceDetails: "Method, limitations and source", sourceError: "Source metadata temporarily unavailable.",
    method: "Methodology", quality: "Documented quality", bias: "Known limitations", rights: "Catalog reuse notes",
    original: "Original source documentation", warning: "Catalog notes are not a general commercial redistribution permission. Matching periods do not establish methodological equivalence.",
    updated: "Records are rechecked on opening and when returning to this tab. Permissions can change.",
    notVerified: "Records could not be verified — a previous response is not shown as current.",
  },
} as const;

const httpsOnly = (url: string | null | undefined): string | null => {
  if (!url) return null;
  try { const parsed = new URL(url); return parsed.protocol === "https:" ? parsed.toString() : null; }
  catch { return null; }
};
const dateLabel = (raw: string | null | undefined, lang: string) => {
  if (!raw) return null;
  const date = new Date(raw);
  return Number.isFinite(date.valueOf()) ? new Intl.DateTimeFormat(
    lang === "fr" ? "fr-FR" : "en-US", { timeZone: "UTC", dateStyle: "medium" },
  ).format(date) : null;
};
const displayedValue = (item: PublishedLatestSourceObservation, lang: string) =>
  item.numericValue !== null && Number.isFinite(item.numericValue)
    ? new Intl.NumberFormat(lang === "fr" ? "fr-FR" : "en-US", {
      maximumSignificantDigits: 10,
    }).format(item.numericValue)
    : item.textValue ?? "—";

export default function PublishedIndicatorExplorer({ iso3, lang }: Props) {
  const copy = lang === "fr" ? COPY.fr : COPY.en;
  const [refreshId, setRefreshId] = useState(0);
  const listKey = iso3 + ":" + refreshId;
  const [list, setList] = useState<Loaded<CountryPublishedIndicator[]> | null>(null);
  const [selectedCode, setSelectedCode] = useState<string | null>(null);
  const detailKey = listKey + ":" + (selectedCode ?? "");
  const [detail, setDetail] = useState<Loaded<{
    values: PublishedLatestSourceObservation[];
    catalog: CatalogIndicatorDetail | null;
  }> | null>(null);
  const [sourceCode, setSourceCode] = useState<string | null>(null);
  const sourceKey = detailKey + ":" + (sourceCode ?? "");
  const [sourceInfo, setSourceInfo] = useState<Loaded<SourceDetail> | null>(null);

  useEffect(() => {
    let active = true;
    fetchCountryPublishedIndicators(iso3).then((answer) => {
      if (active) setList({ key: listKey, kind: "ready", value: answer.items });
    }).catch(() => { if (active) setList({ key: listKey, kind: "error" }); });
    return () => { active = false; };
  }, [iso3, listKey]);

  // A tab revisited after revocation must not continue displaying stale values.
  useEffect(() => {
    const fresh = () => setRefreshId((n) => n + 1);
    const visible = () => { if (document.visibilityState === "visible") fresh(); };
    window.addEventListener("focus", fresh);
    document.addEventListener("visibilitychange", visible);
    return () => {
      window.removeEventListener("focus", fresh);
      document.removeEventListener("visibilitychange", visible);
    };
  }, []);

  const visibleList = list?.key === listKey && list.kind === "ready" ? list.value : null;
  const listError = list?.key === listKey && list.kind === "error";
  const validSelection = !!selectedCode && !!visibleList?.some((item) => item.indicatorCode === selectedCode);
  useEffect(() => {
    if (!validSelection || !selectedCode) return;
    let active = true;
    Promise.allSettled([
      fetchPublishedLatestSources(iso3, selectedCode),
      fetchCatalogIndicatorDetail(selectedCode),
    ]).then(([latest, catalog]) => {
      if (!active) return;
      if (latest.status === "rejected") {
        setDetail({ key: detailKey, kind: "error" });
      } else {
        setDetail({ key: detailKey, kind: "ready", value: {
          values: latest.value.items,
          catalog: catalog.status === "fulfilled" ? catalog.value : null,
        } });
      }
    });
    return () => { active = false; };
  }, [iso3, selectedCode, validSelection, detailKey]);

  const selectedDetail = validSelection && detail?.key === detailKey &&
    detail.kind === "ready" ? detail.value : null;
  const detailError = validSelection && detail?.key === detailKey && detail.kind === "error";
  useEffect(() => {
    if (!sourceCode || !selectedDetail) return;
    let active = true;
    fetchCatalogSourceDetail(sourceCode).then((value) => {
      if (active) setSourceInfo({ key: sourceKey, kind: "ready", value });
    }).catch(() => { if (active) setSourceInfo({ key: sourceKey, kind: "error" }); });
    return () => { active = false; };
  }, [sourceCode, sourceKey, selectedDetail]);

  const displayedSource = sourceInfo?.key === sourceKey &&
    sourceInfo.kind === "ready" ? sourceInfo.value : null;
  const sourceUnavailable = sourceInfo?.key === sourceKey && sourceInfo.kind === "error";
  const formatter = new Intl.NumberFormat(lang === "fr" ? "fr-FR" : "en-US");

  return <section className="whv-published-explorer" aria-label={copy.title}>
    <div className="whv-published-head">
      <div><h4>{copy.title}</h4><p>{copy.intro}</p></div>
      <button type="button" onClick={() => setRefreshId((n) => n + 1)}>{copy.refresh}</button>
    </div>
    {!visibleList && !listError && <p role="status">{copy.loading}</p>}
    {listError && <p role="status">{copy.error}</p>}
    {visibleList && visibleList.length === 0 && <p>{copy.empty}</p>}
    {visibleList && visibleList.length > 0 && <>
      <div className="whv-published-indicator-grid">
        {visibleList.map((item) => <button type="button" key={item.indicatorCode}
          className={"whv-published-indicator" + (selectedCode === item.indicatorCode ? " chosen" : "")}
          aria-pressed={selectedCode === item.indicatorCode}
          onClick={() => { setSelectedCode(item.indicatorCode); setSourceCode(null); }}>
          <strong>{item.indicatorDisplayName}</strong>
          <small>{item.indicatorCode}</small>
          <span>{formatter.format(item.availableObservationCount)} {copy.observations}
            {" · "}{formatter.format(item.publishedSourceCount)} {copy.sources}</span>
          <small>{formatter.format(item.observedObservationCount)} {copy.observed}
            {" · "}{formatter.format(item.estimatedObservationCount)} {copy.estimated}</small>
          <span>{copy.select}</span>
        </button>)}
      </div>
      {!validSelection && <p>{copy.choose}</p>}
      {validSelection && <div className="whv-published-details" aria-live="polite">
        <h5>{copy.latest}</h5>
        {!selectedDetail && !detailError && <p role="status">{copy.loading}</p>}
        {detailError && <p role="status">{copy.notVerified}</p>}
        {selectedDetail && <>
          {selectedDetail.catalog && <p>{copy.unit}: {selectedDetail.catalog.unitLabel || copy.unknownUnit}
            {selectedDetail.catalog.methodologyNotes && <small className="whv-published-note">{selectedDetail.catalog.methodologyNotes}</small>}
          </p>}
          {!selectedDetail.catalog && <p>{copy.unit}: {copy.unknownUnit}</p>}
          {selectedDetail.values.length === 0 && <p>{copy.noValue}</p>}
          {selectedDetail.values.map((item) => <article key={item.sourceCode+":"+item.datasetCode+":"+item.periodStart}
            className="whv-published-value">
            <strong>{item.sourceDisplayName || item.sourceCode}</strong>
            <small>{item.sourceCode} · {item.datasetDisplayName || item.datasetCode}</small>
            <div className="whv-published-figure">{displayedValue(item, lang)}</div>
            <p>{item.valueStatus === "ESTIMATED" ? copy.estimate : copy.measured}
              {" · "}{copy.period}: {item.periodLabel}</p>
            {dateLabel(item.sourcePublishedAt, lang) && <small>{copy.publication}: {dateLabel(item.sourcePublishedAt, lang)}</small>}
            {dateLabel(item.fetchedAtUtc, lang) && <small>{copy.collection}: {dateLabel(item.fetchedAtUtc, lang)}</small>}
            <button type="button" onClick={() => setSourceCode(
              sourceCode === item.sourceCode ? null : item.sourceCode)}>{copy.sourceDetails}</button>
          </article>)}
          {sourceCode && <>
            {!displayedSource && !sourceUnavailable && <p role="status">{copy.loading}</p>}
            {sourceUnavailable && <p role="status">{copy.sourceError}</p>}
            {displayedSource && <aside className="whv-published-source-note">
              <strong>{displayedSource.displayName}</strong>
              {displayedSource.qualityNotes && <p><b>{copy.quality}:</b> {displayedSource.qualityNotes}</p>}
              {displayedSource.biasNotes && <p><b>{copy.bias}:</b> {displayedSource.biasNotes}</p>}
              {displayedSource.licenseSummary && <p><b>{copy.rights}:</b> {displayedSource.licenseSummary}</p>}
              {httpsOnly(displayedSource.documentationUrl) &&
                <a href={httpsOnly(displayedSource.documentationUrl) ?? "#"} rel="noopener noreferrer"
                  target="_blank">{copy.original}</a>}
              <small>{copy.warning}</small>
            </aside>}
          </>}
        </>}
      </div>}
    </>}
    <p className="whv-published-disclaimer">{copy.updated}</p>
  </section>;
}
