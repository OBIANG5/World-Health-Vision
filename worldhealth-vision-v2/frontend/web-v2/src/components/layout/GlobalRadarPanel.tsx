import { useEffect, useRef, useState, type FormEvent } from "react";
import { createPortal } from "react-dom";
import { useLang } from "../../context/LanguageContext";
import {
  GDELT_PROVIDER_PAGE, RADAR_CLIENT_MIN_INTERVAL_MS,
  RADAR_FETCH_TIMEOUT_MS, SOURCE_COUNTRIES,
  compareDiscoveryCandidates, searchGdeltDocuments, validRadarSearch,
  RadarRequestError,
  type RadarCandidate, type RadarResult, type RadarSearch,
  type RadarSourceCountry, type RadarTimeWindow,
} from "../../radar/gdeltDoc";

const copy = (lang: "fr" | "en", fr: string, en: string) => lang === "fr" ? fr : en;
const displayTime = (value: string | null, lang: "fr" | "en") => value
  ? new Intl.DateTimeFormat(lang === "fr" ? "fr-FR" : "en-GB", {
      dateStyle: "medium", timeStyle: "short", timeZone: "Europe/Paris",
    }).format(new Date(value)) + " (Paris)"
  : copy(lang, "Non fourni par GDELT", "Not provided by GDELT");
const initialQuery: RadarSearch = { subject: "", outletCountry: "", window: "1d" };

function statusText(lang: "fr" | "en", status: RadarRequestError["code"] | "short_gap" | "timeout" | "unexpected") {
  switch (status) {
    case "invalid": return copy(lang,
      "Requête invalide : 3 à 90 caractères, sans commandes ni opérateurs avancés.",
      "Invalid query: 3–90 characters, without advanced commands or operators.");
    case "throttled": return copy(lang,
      "GDELT limite temporairement l'accès. Aucun résultat n'est inventé. Réessayez manuellement plus tard.",
      "GDELT is rate-limiting access. No results are fabricated. Retry manually later.");
    case "unavailable": return copy(lang,
      "GDELT ne répond pas normalement. État indisponible, pas « zéro actualité ».",
      "GDELT is unavailable. This does not mean there is no news.");
    case "bad_response": return copy(lang,
      "GDELT a renvoyé une réponse vide, tronquée ou de format inattendu. Résultats non exploitables.",
      "GDELT returned empty, truncated or unexpected data. No usable results.");
    case "network": return copy(lang,
      "Connexion impossible, accès du navigateur refusé ou réseau indisponible. Vérifiez directement GDELT.",
      "Network failure, blocked browser access or unreachable provider. Verify GDELT directly.");
    case "short_gap": return copy(lang,
      "Évitez les appels répétés : attendez quelques secondes avant une nouvelle recherche.",
      "Avoid repeated requests: leave a few seconds between searches.");
    case "timeout": return copy(lang,
      "GDELT n'a pas répondu dans le délai prévu. Aucune réponse ancienne présentée comme actuelle.",
      "GDELT did not respond within the time limit. No stale response is presented as current.");
    default: return copy(lang,
      "La recherche n'a pas abouti. Aucune information publiée sans preuve.",
      "Search could not complete. No information is published without evidence.");
  }
}
function CandidateTile({ item, lang, selected, onToggle, disabled }: {
  item: RadarCandidate;
  lang: "fr" | "en";
  selected: boolean;
  onToggle?: () => void;
  disabled?: boolean;
}) {
  return <article className="radar-candidate" data-source-domain={item.outletDomain}>
    <div className="radar-candidate-top">
      <span className="radar-candidate-domain">{item.outletDomain}</span>
      <span className="radar-candidate-state">{copy(lang, "Signal non vérifié", "Unverified discovery")}</span>
    </div>
    <h3>{item.title}</h3>
    <dl className="radar-candidate-meta">
      <div><dt>{copy(lang, "Origine du média déclarée", "GDELT outlet origin")}</dt>
        <dd>{item.outletCountry ?? copy(lang, "Inconnue", "Unknown")}</dd></div>
      <div><dt>{copy(lang, "Langue déclarée", "GDELT language")}</dt>
        <dd>{item.language ?? copy(lang, "Inconnue", "Unknown")}</dd></div>
      <div><dt>{copy(lang, "Date de repérage GDELT", "GDELT seen date")}</dt>
        <dd>{displayTime(item.gdeltSeenAt, lang)}</dd></div>
    </dl>
    <div className="radar-candidate-actions">
      {onToggle && <button type="button" onClick={onToggle} disabled={disabled}
          className={selected ? "radar-pick active" : "radar-pick"}
          aria-pressed={selected}>
        {selected ? copy(lang, "Retirer de la comparaison", "Remove from comparison")
          : copy(lang, "Comparer cette source", "Compare this source")}
      </button>}
      <a href={item.originalUrl} target="_blank" rel="noopener noreferrer" className="radar-original">
        {copy(lang, "Ouvrir l'article original", "Open original article")}
        <span aria-hidden="true">↗</span>
      </a>
    </div>
  </article>;
}

/**
 * R1 intentionally has no persistence, no background polling, no full article
 * scraping, no click interception and no automatic editorial publication.
 * This is LIVE discovery only if a real GDELT request succeeds.
 */
export default function GlobalRadarPanel({ onClose }: { onClose: () => void }) {
  const lang = useLang();
  const panelRef = useRef<HTMLElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const previousFocus = useRef<HTMLElement | null>(null);
  const inFlight = useRef<AbortController | null>(null);
  const lastAttempt = useRef(0);
  const requestGeneration = useRef(0);
  const [query, setQuery] = useState<RadarSearch>(initialQuery);
  const [result, setResult] = useState<RadarResult | null>(null);
  const [chosen, setChosen] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>("");
  const [feedback, setFeedback] = useState("");

  useEffect(() => {
    previousFocus.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const oldOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    searchRef.current?.focus();
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") { event.preventDefault(); onClose(); return; }
      if (event.key !== "Tab") return;
      const controls = [...(panelRef.current?.querySelectorAll<HTMLElement>(
        "button:not([disabled]), input:not([disabled]), select:not([disabled]), a[href]",
      ) ?? [])].filter((node) => node.getClientRects().length > 0);
      if (!controls.length) return;
      if (event.shiftKey && document.activeElement === controls[0]) {
        event.preventDefault(); controls[controls.length - 1].focus();
      } else if (!event.shiftKey && document.activeElement === controls[controls.length - 1]) {
        event.preventDefault(); controls[0].focus();
      }
    }
    document.addEventListener("keydown", onKeyDown);
    return () => {
      requestGeneration.current += 1;
      inFlight.current?.abort();
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = oldOverflow;
      previousFocus.current?.focus();
    };
  }, [onClose]);

  async function handleSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFeedback("");
    if (!validRadarSearch(query)) {
      setError(statusText(lang, "invalid"));
      return;
    }
    const now = Date.now();
    if (lastAttempt.current !== 0 && now - lastAttempt.current < RADAR_CLIENT_MIN_INTERVAL_MS) {
      setError(statusText(lang, "short_gap"));
      return;
    }
    lastAttempt.current = now;
    const generation = ++requestGeneration.current;
    inFlight.current?.abort();
    const controller = new AbortController();
    inFlight.current = controller;
    setLoading(true);
    setError("");
    setResult(null); // Never show old results under a newly submitted query.
    setChosen([]);
    let timedOut = false;
    const timer = window.setTimeout(() => { timedOut = true; controller.abort(); }, RADAR_FETCH_TIMEOUT_MS);
    try {
      const found = await searchGdeltDocuments({ ...query }, { signal: controller.signal });
      if (generation !== requestGeneration.current) return;
      setResult(found);
      setFeedback(copy(lang,
        "Recherche exécutée à la demande. Les mentions restent à vérifier dans chaque publication originale.",
        "Explicit search completed. Verify each mention against its original publication."));
    } catch (cause) {
      if (generation !== requestGeneration.current) return;
      const category = timedOut ? "timeout"
        : cause instanceof RadarRequestError ? cause.code
          : controller.signal.aborted ? "timeout" : "unexpected";
      setError(statusText(lang, category));
    } finally {
      window.clearTimeout(timer);
      if (generation === requestGeneration.current) {
        setLoading(false);
        inFlight.current = null;
      }
    }
  }
  function toggleArticle(item: RadarCandidate) {
    setChosen((old) => old.includes(item.id) ? old.filter((id) => id !== item.id)
      : old.length >= 2 ? old : [...old, item.id]);
  }
  const chosenItems = result?.candidates.filter((item) => chosen.includes(item.id))
    .sort((a, b) => chosen.indexOf(a.id) - chosen.indexOf(b.id)) ?? [];
  const assessment = chosenItems.length === 2
    ? compareDiscoveryCandidates(chosenItems[0], chosenItems[1]) : null;
  const uniqueDomains = new Set(result?.candidates.map((item) => item.outletDomain) ?? []).size;
  const uniqueCountries = new Set(result?.candidates.map((item) => item.outletCountry)
    .filter((value): value is string => Boolean(value)) ?? []).size;

  return createPortal(
    <div className="radar-backdrop" onMouseDown={(event) => {
      if (event.target === event.currentTarget) onClose();
    }}>
      <section className="radar-dialog" role="dialog" aria-modal="true"
        aria-label={copy(lang, "Global Radar — recherche de sources", "Global Radar — source discovery")}
        ref={panelRef} tabIndex={-1}>
        <header className="radar-header">
          <div>
            <span className="radar-kicker">WORLD-VISION · GLOBAL RADAR · GDELT DOC 2.0</span>
            <h2>{copy(lang, "Découvrir les publications. Confronter les sources.",
              "Discover coverage. Compare sources.")}</h2>
            <p>{copy(lang,
              "Recherche de mentions réelles, sans présumer la vérité d'un événement ni l'indépendance des publications.",
              "Search actual coverage without assuming an event is true or that reporting is independent.")}</p>
          </div>
          <button type="button" className="radar-close" onClick={onClose}
            aria-label={copy(lang, "Fermer Global Radar", "Close Global Radar")}>×</button>
        </header>
        <div className="radar-disclosure">
          <strong>{copy(lang, "Premier parcours pilote, sans collecte en arrière-plan", "First pilot, no background collection")}</strong>
          <p>{copy(lang,
            "GDELT repère des articles mais ne vérifie pas leurs affirmations. Les dates GDELT ne prouvent pas l'heure de publication originale. Les pays désignent l'origine des médias, pas forcément le lieu du fait. Les liens pointent vers des éditeurs externes.",
            "GDELT discovers articles but does not fact-check their claims. GDELT dates do not attest the original publication time. Country refers to outlet origin, not necessarily event location. Links open external publisher sites.")}</p>
        </div>
        <form className="radar-form" onSubmit={handleSearch}>
          <label className="radar-search-field">
            {copy(lang, "Sujet à rechercher dans les médias indexés", "Topic to search in indexed news")}
            <input ref={searchRef} type="search" minLength={3} maxLength={90}
              required autoComplete="off" value={query.subject}
              onChange={(e) => setQuery((old) => ({ ...old, subject: e.target.value }))}
              placeholder={copy(lang, "Ex. Gabon, BCE, sécheresse, élections", "E.g. Gabon, central bank, drought, elections")} />
          </label>
          <div className="radar-form-controls">
            <label>{copy(lang, "Origine DU MÉDIA (facultatif)", "OUTLET origin (optional)")}
              <select value={query.outletCountry} onChange={(e) => setQuery((old) =>
                ({ ...old, outletCountry: e.target.value as RadarSourceCountry }))}>
                {SOURCE_COUNTRIES.map((item) => <option value={item.value} key={item.value}>
                  {item[lang]}</option>)}
              </select>
            </label>
            <label>{copy(lang, "Fenêtre de recherche glissante", "Rolling search window")}
              <select value={query.window} onChange={(e) => setQuery((old) =>
                ({ ...old, window: e.target.value as RadarTimeWindow }))}>
                <option value="1d">{copy(lang, "Dernières 24 h", "Last 24 hours")}</option>
                <option value="3d">{copy(lang, "Derniers 3 jours", "Last 3 days")}</option>
                <option value="7d">{copy(lang, "Derniers 7 jours", "Last 7 days")}</option>
              </select>
            </label>
            <button type="submit" disabled={loading}>
              {loading ? copy(lang, "Recherche en cours…", "Searching…") :
                copy(lang, "Rechercher les sources", "Search sources")}
            </button>
          </div>
          <small>{copy(lang,
            "Une requête volontaire, jusqu'à 40 liens, sans sauvegarde, sans traçage du sujet dans l'URL World-Vision. Les restrictions du fournisseur peuvent limiter les résultats.",
            "One explicit request, up to 40 links, no storage, no query added to the World-Vision URL. Provider limits can restrict results.")}</small>
        </form>
        <main className="radar-content">
          {loading && <p className="radar-status" role="status">
            {copy(lang, "Interrogation de GDELT DOC en cours…", "Requesting GDELT DOC…")}</p>}
          {error && <div className="radar-error" role="alert">
            {error}
            <a href={GDELT_PROVIDER_PAGE} target="_blank" rel="noopener noreferrer">
              {copy(lang, "Documentation officielle", "Official documentation")}</a>
          </div>}
          {result && <>
            <div className="radar-result-heading">
              <div>
                <span className="radar-kicker">{copy(lang, "RÉSULTATS DE DÉCOUVERTE UNIQUEMENT", "DISCOVERY RESULTS ONLY")}</span>
                <h3>{copy(lang, "Couverture repérée", "Discovered coverage")}</h3>
                <p>{copy(lang, "Recherche", "Query")}: <strong>{result.query.subject}</strong>
                  {" · "}{result.query.outletCountry || copy(lang, "toutes origines indexées", "all indexed origins")}
                  {" · "}{result.query.window} · {displayTime(result.retrievedAt, lang)}</p>
              </div>
              <div className="radar-results-stats">
                <span><strong>{result.candidates.length}</strong>{copy(lang, "liens distincts", "distinct links")}</span>
                <span><strong>{uniqueDomains}</strong>{copy(lang, "domaines observés", "observed domains")}</span>
                <span><strong>{uniqueCountries}</strong>{copy(lang, "pays de médias déclarés", "declared outlet countries")}</span>
              </div>
            </div>
            {(result.duplicatesDropped > 0 || result.malformedDropped > 0) && <p className="radar-filter-note">
              {result.duplicatesDropped} {copy(lang, "URL en double écartées", "duplicate URLs excluded")}
              {" · "}{result.malformedDropped} {copy(lang,
                "liens invalides/incomplets écartés", "invalid/incomplete links excluded")}</p>}
            {result.candidates.length === 0
              ? <div className="radar-empty">
                  <strong>{copy(lang, "Aucune publication exploitable dans cette réponse.", "No usable publication in this response.")}</strong>
                  <p>{copy(lang,
                    "Cela ne prouve pas qu'aucun événement n'existe. Essayez une autre formulation, période ou origine; la couverture de GDELT est partielle.",
                    "This does not prove that nothing happened. Try another topic, window or outlet origin; GDELT coverage is incomplete.")}</p>
                </div>
              : <>
                  <div className="radar-compare-guide">
                    <strong>{copy(lang, "Confronter deux publications", "Inspect two publications side by side")}</strong>
                    <span>{copy(lang,
                      "Sélectionnez librement 2 liens. Deux sites distincts ne prouvent ni deux enquêtes indépendantes, ni deux faits concordants.",
                      "Select any 2 links. Different domains do not prove independent reporting or matching facts.")}</span>
                    <small>{chosen.length}/2</small>
                  </div>
                  {chosenItems.length === 2 && assessment && <section className="radar-comparison" aria-label={copy(lang,
                    "Comparaison des métadonnées", "Metadata comparison")}>
                    <h4>{copy(lang, "Comparaison des origines et des dates — pas des affirmations",
                      "Compare origins and dates — not claims")}</h4>
                    <p className="radar-warning">{assessment.sameHost
                      ? copy(lang,
                        "MÊME DOMAINE : aucune confirmation éditoriale supplémentaire établie.",
                        "SAME DOMAIN: no additional editorial corroboration established.")
                      : copy(lang,
                        "DOMAINES DIFFÉRENTS : indépendance, reprises de dépêches et contradiction NON ÉVALUÉES.",
                        "DIFFERENT DOMAINS: independence, syndicated copy and disagreement NOT ASSESSED.")}</p>
                    <div className="radar-comparison-grid">
                      {chosenItems.map((item) => <CandidateTile key={item.id} item={item}
                        lang={lang} selected={true} />)}
                    </div>
                    <p className="radar-comparison-caveat">{copy(lang,
                      "Pour comparer les faits, lire les articles originaux, vérifier les auteurs/dépêches, versions, déclarations, preuves primaires et corrections. Cette étape n'est pas automatisée.",
                      "To compare facts, review original texts, authors/wires, revisions, claims, primary evidence and corrections. This step is not automated.")}</p>
                  </section>}
                  <div className="radar-candidates">
                    {result.candidates.map((item) => <CandidateTile key={item.id} item={item}
                      lang={lang} selected={chosen.includes(item.id)}
                      disabled={chosen.length >= 2 && !chosen.includes(item.id)}
                      onToggle={() => toggleArticle(item)} />)}
                  </div>
                </>}
          </>}
          {!result && !error && !loading && <div className="radar-empty">
            <strong>{copy(lang, "Aucun article affiché avant une recherche réelle.", "No article displayed before a real search.")}</strong>
            <p>{copy(lang,
              "Recherchez un sujet puis contrôlez les publications. Global Radar n'utilise ni fausse liste préchargée, ni résumé IA fabriqué.",
              "Search a topic and inspect publishers. Global Radar uses no fabricated preloaded list or AI-generated article summary.")}</p>
          </div>}
          {feedback && <p className="radar-status" role="status">{feedback}</p>}
        </main>
        <footer className="radar-footer">
          <span>{copy(lang,
            "R1 : recherche GDELT en direct si accessible · comparateur de MÉTADONNÉES · aucune preuve validée · aucun abonnement.",
            "R1: live GDELT if reachable · METADATA comparison · no facts verified · no subscription.")}</span>
          <button type="button" onClick={onClose}>{copy(lang, "Fermer", "Close")}</button>
        </footer>
      </section>
    </div>,
    document.body,
  );
}
