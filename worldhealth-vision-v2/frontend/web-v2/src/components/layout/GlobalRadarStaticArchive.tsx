import { useEffect, useMemo, useState } from "react";
import { useLang } from "../../context/LanguageContext";
import {
  fetchGdeltStaticSnapshot, GdeltStaticSnapshotError, snapshotAgeHours,
  type GdeltStaticSnapshot, type GdeltStaticSource,
} from "../../radar/gdeltStaticSnapshot";

const say = (lang: "fr" | "en", fr: string, en: string) => lang === "fr" ? fr : en;
const formatParis = (iso: string, lang: "fr" | "en") =>
  new Intl.DateTimeFormat(lang === "fr" ? "fr-FR" : "en-GB", {
    dateStyle: "medium", timeStyle: "short", timeZone: "Europe/Paris",
  }).format(new Date(iso)) + " (Paris)";

function StaticCandidate({ source, lang, selected, onToggle, disabled }: {
  source: GdeltStaticSource;
  lang: "fr" | "en";
  selected: boolean;
  onToggle?: () => void;
  disabled?: boolean;
}) {
  return <article className="radar-archive-candidate">
    <span className="radar-archive-host">{source.outletDomainFromUrl}</span>
    <span className="radar-candidate-state">{say(lang, "Lien repéré, article non lu", "Link discovered, article not read")}</span>
    <dl className="radar-candidate-meta">
      <div>
        <dt>{say(lang, "Ajout GDELT", "GDELT added at")}</dt>
        <dd>{formatParis(source.gdeltAddedAtUtc, lang)}</dd>
      </div>
      <div>
        <dt>{say(lang, "Code d'événement automatique", "Automated event code")}</dt>
        <dd>{source.gdeltCameoCode || "—"}</dd>
      </div>
      <div>
        <dt>{say(lang, "Géographie GDELT (FIPS, non validée)", "GDELT geography (unverified FIPS)")}</dt>
        <dd>{source.gdeltActionGeoFipsCode || "—"}</dd>
      </div>
    </dl>
    <div className="radar-candidate-actions">
      {onToggle && <button type="button" className={selected ? "radar-pick active" : "radar-pick"}
        disabled={disabled} aria-pressed={selected} onClick={onToggle}>
        {selected ? say(lang, "Retirer", "Remove") : say(lang, "Confronter", "Compare")}
      </button>}
      <a className="radar-original" href={source.url}
        target="_blank" rel="noopener noreferrer">
        {say(lang, "Voir la publication", "View publisher link")} ↗
      </a>
    </div>
  </article>;
}

/** Actual provider dataset snapshot, optionally present in a built preview.
 * No automated publisher fetch, no live clock inference, no synthetic fallback.
 * An absent snapshot never means zero news.
 */
export default function GlobalRadarStaticArchive() {
  const lang = useLang();
  const [snapshot, setSnapshot] = useState<GdeltStaticSnapshot | null>(null);
  const [status, setStatus] = useState<"loading" | "available" | "missing" | "error">("loading");
  const [filter, setFilter] = useState("");
  const [chosen, setChosen] = useState<string[]>([]);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    fetchGdeltStaticSnapshot({ signal: controller.signal })
      .then((item) => {
        if (controller.signal.aborted) return;
        setSnapshot(item);
        setStatus("available");
      }).catch((reason: unknown) => {
        if (controller.signal.aborted) return;
        setStatus(reason instanceof GdeltStaticSnapshotError && reason.code === "missing"
          ? "missing" : "error");
      });
    return () => controller.abort();
  }, []);

  const candidates = snapshot?.candidates ?? [];
  const shown = useMemo(() => {
    const q = filter.trim().toLowerCase();
    const matched = candidates.filter((item) =>
      !q || item.outletDomainFromUrl.includes(q) ||
      (item.gdeltActionGeoFipsCode ?? "").toLowerCase() === q ||
      item.gdeltCameoCode.toLowerCase() === q);
    return expanded ? matched : matched.slice(0, 12);
  }, [candidates, filter, expanded]);
  const selected = candidates.filter((item) => chosen.includes(item.url))
    .sort((a, b) => chosen.indexOf(a.url) - chosen.indexOf(b.url));
  const age = snapshot ? snapshotAgeHours(snapshot) : null;
  const stale = age === null ? false : age < -0.25 || age > 3;

  function toggle(item: GdeltStaticSource) {
    setChosen((old) => old.includes(item.url) ? old.filter((x) => x !== item.url)
      : old.length < 2 ? [...old, item.url] : old);
  }

  return <section className="radar-archive" aria-label={say(lang,
    "Dernière archive de liens GDELT", "Latest GDELT link archive")}>
    <div className="radar-archive-heading">
      <div>
        <span className="radar-kicker">{say(lang, "SOURCES OUVERTES — PREMIER PARCOURS RÉEL", "OPEN DATA — FIRST REAL-DATA PATH")}</span>
        <h3>{say(lang, "Dernière archive GDELT disponible dans cette version",
          "Latest GDELT archive included in this build")}</h3>
      </div>
      <span className="radar-archive-tag">{say(lang, "Pas du direct", "Not live")}</span>
    </div>
    {status === "loading" && <p className="radar-status" role="status">
      {say(lang, "Lecture de l'instantané de sources…", "Reading the source snapshot…")}</p>}
    {status === "missing" && <p className="radar-archive-absence" role="status">
      {say(lang,
        "Aucune archive n'a été intégrée à cette version. Ce n'est pas une absence d'actualité : utilisez la recherche manuelle ci-dessous ou les sources d'origine.",
        "This build contains no source archive. It does not mean there is no news. Use the manual search below or original publishers.")}</p>}
    {status === "error" && <p className="radar-archive-absence" role="alert">
      {say(lang,
        "L'archive livrée est inaccessible ou non conforme. Aucune liste supposée réelle ne sera affichée.",
        "The bundled archive is inaccessible or invalid. No unverified list is represented as real.")}</p>}
    {status === "available" && snapshot && <>
      <p className={stale ? "radar-archive-warning" : "radar-archive-meta"}>
        {say(lang, "Archive fournisseur :", "Provider batch:")} <strong>{formatParis(snapshot.providerBatchSlotUtc, lang)}</strong>
        {" · "}{say(lang, "Collecte :", "Collected:")} {formatParis(snapshot.providerObservedAtUtc, lang)}
        {" · "}{stale
          ? say(lang, "Instantané ancien ou horloge locale non synchronisée : ne pas lire comme l'actualité du moment.",
            "Outdated snapshot or local clock discrepancy: not current news.")
          : say(lang, "Horodatages GDELT uniquement — heure de publication des articles inconnue.",
            "GDELT timestamps only — original publication times unknown.")}
      </p>
      <div className="radar-results-stats">
        <span><strong>{snapshot.stats.codedRows}</strong>{say(lang, "lignes codées", "coded rows")}</span>
        <span><strong>{snapshot.stats.distinctOriginalUrlsFound}</strong>{say(lang,
          "liens HTTPS distincts détectés", "distinct HTTPS links detected")}</span>
        <span><strong>{snapshot.stats.selectedForPreview}</strong>{say(lang,
          "liens examinables ici", "links shown in this build")}</span>
        <span><strong>{snapshot.stats.duplicateReferencesDropped}</strong>{say(lang,
          "références répétées", "repeated references")}</span>
      </div>
      <div className="radar-archive-disclaimer">
        {say(lang,
          "Les « événements » sont des codes automatiques de GDELT, pas des événements confirmés. Les URL ne prouvent ni article accessible, ni identité du média, ni positionnement éditorial, ni indépendance. Géographie en codes FIPS non convertis.",
          "GDELT 'events' are machine-coded mentions, not confirmed events. URLs do not prove accessible articles, media ownership, editorial stance or independent reporting. Geography uses unconverted FIPS codes.")}
      </div>
      <div className="radar-archive-toolbar">
        <label>{say(lang, "Filtrer par domaine, code CAMEO ou géographie FIPS",
          "Filter by domain, CAMEO code or FIPS geography")}
          <input type="search" value={filter} onChange={(e) => {
            setFilter(e.target.value); setExpanded(false); setChosen([]);
          }} placeholder={say(lang, "Ex. site de presse ou code", "E.g. publisher domain or code")} />
        </label>
        <span>{shown.length} / {snapshot.candidates.filter((c) =>
          !filter.trim() || c.outletDomainFromUrl.includes(filter.trim().toLowerCase()) ||
          (c.gdeltActionGeoFipsCode ?? "").toLowerCase() === filter.trim().toLowerCase() ||
          c.gdeltCameoCode.toLowerCase() === filter.trim().toLowerCase()).length}</span>
      </div>
      {selected.length === 2 && <section className="radar-archive-comparison" role="region"
        aria-label={say(lang, "Deux liens de sources confrontés", "Two source links compared")}>
        <h4>{say(lang, "Deux liens — comparaison documentaire limitée",
          "Two links — limited document metadata comparison")}</h4>
        <p>{selected[0].outletDomainFromUrl === selected[1].outletDomainFromUrl
          ? say(lang, "Même domaine. Aucune corroboration supplémentaire prouvée.",
            "Same host. No additional corroboration established.")
          : say(lang, "Domaines différents. Dépêche commune, véracité et concordance NON VÉRIFIÉES.",
            "Different domains. Shared wire, accuracy and agreement NOT VERIFIED.")}</p>
        <div className="radar-comparison-grid">
          {selected.map((item) => <StaticCandidate key={item.url} source={item}
            lang={lang} selected={true} />)}
        </div>
      </section>}
      {shown.length > 0
        ? <div className="radar-archive-grid">{shown.map((item) => <StaticCandidate
            key={item.url} source={item} lang={lang} selected={chosen.includes(item.url)}
            onToggle={() => toggle(item)} disabled={chosen.length >= 2 && !chosen.includes(item.url)} />)}</div>
        : <p className="radar-empty">{say(lang,
            "Aucun lien correspondant dans cet instantané limité — pas une preuve d'absence d'événement.",
            "No matching link in this limited snapshot — not evidence that nothing happened.")}</p>}
      {!expanded && snapshot.candidates.length > 12 && !filter.trim() &&
        <button className="radar-archive-more" type="button" onClick={() => setExpanded(true)}>
          {say(lang, "Afficher tous les liens de l'instantané", "Show all links in this snapshot")}
        </button>}
      <p className="radar-archive-credit">
        <a href={snapshot.providerLink} target="_blank" rel="noopener noreferrer">
          {snapshot.providerAttribution}
        </a>
        {" · "}<a href={snapshot.gdeltDatasetReuseTermsUrl} target="_blank"
          rel="noopener noreferrer">{say(lang, "Conditions des données GDELT", "GDELT data terms")}</a>
        {" · "}{say(lang,
          "Les droits des ARTICLES originaux sont distincts et non vérifiés.",
          "Original PUBLISHER ARTICLE rights are separate and not reviewed.")}
      </p>
    </>}
  </section>;
}
