import { useState } from "react";
import type { TradePlan } from "../../trading/tradePlan";
import {
  attachEventResult, eventArithmeticDelta, prepareMacroEvent, recordThesisUpdate,
  wasPreparedBeforeEvent, type NewEventPreparation, type NewEventResult, type NewThesisUpdate,
  type ThesisDisposition,
} from "../../trading/tradeResearch";
import { useLang } from "../../context/LanguageContext";

const txt = (fr: string, en: string, lang: "fr" | "en") => lang === "fr" ? fr : en;
const zeroRevision = (): NewThesisUpdate => ({ event: "", newInformation: "", conclusion: "", disposition: "watch" });
const zeroEvent = (): NewEventPreparation => ({
  title: "", scheduledAt: "", expected: "", previous: "", unit: "",
  expectationPublisher: "", expectationSourceUrl: "", expectationAsOf: "",
  higherScenario: "", lowerScenario: "",
});
const zeroResult = (): NewEventResult => ({ actual: "", publishedAt: "", originalUrl: "", reaction: "", comparabilityReviewed: false });
function timestamp(value: string, lang: "fr" | "en") {
  const d = new Date(value);
  return Number.isFinite(d.getTime()) ? d.toLocaleString(lang === "fr" ? "fr-FR" : "en-GB") : "—";
}
function isoFromLocal(value: string): string {
  if (!value) return "";
  const d = new Date(value);
  return Number.isFinite(d.getTime()) ? d.toISOString() : "";
}
const uuid = () => crypto.randomUUID?.() ?? String(Date.now());

export default function TradingResearchPanel({ plan, onChange }: {
  plan: TradePlan; onChange: (next: TradePlan) => void;
}) {
  const lang = useLang();
  const [tab, setTab] = useState<"updates" | "events">("updates");
  const [update, setUpdate] = useState<NewThesisUpdate>(zeroRevision);
  const [event, setEvent] = useState<NewEventPreparation>(zeroEvent);
  const [result, setResult] = useState<NewEventResult>(zeroResult);
  const [activeResultId, setActiveResultId] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const updates = plan.updates ?? [], events = plan.events ?? [];

  function addUpdate() {
    if (updates.length >= 30) { setMessage(txt("Maximum de 30 versions dans ce pilote. Exportez le dossier.", "Maximum 30 versions in this pilot. Export your dossier.", lang)); return; }
    const record = recordThesisUpdate(plan, update, new Date().toISOString(), uuid());
    if (!record) { setMessage(txt("Indiquez l'événement, l'information nouvelle et la décision documentée.", "Enter the event, new information and documented decision.", lang)); return; }
    onChange({ ...plan, updates: [...updates, record] });
    setUpdate(zeroRevision());
    setMessage(txt("Version archivée avec les éléments du dossier actuel et l'heure locale du navigateur.", "Revision archived with current dossier context and browser timestamp.", lang));
  }
  function addEvent() {
    if (events.length >= 30) { setMessage(txt("Maximum de 30 annonces dans ce pilote. Exportez le dossier.", "Maximum 30 events in this pilot. Export your dossier.", lang)); return; }
    const input = {
      ...event,
      scheduledAt: isoFromLocal(event.scheduledAt),
      expectationAsOf: isoFromLocal(event.expectationAsOf),
    };
    const prepared = prepareMacroEvent(input, new Date().toISOString(), uuid());
    if (!prepared) { setMessage(txt("Précisez annonce, date, unité, prévision sourcée avec URL HTTPS, date de connaissance et deux scénarios.", "Include event, date, unit, sourced expectation with HTTPS URL, knowledge date and both scenarios.", lang)); return; }
    onChange({ ...plan, events: [...events, prepared] });
    setEvent(zeroEvent());
    setMessage(wasPreparedBeforeEvent(prepared)
      ? txt("Préparation enregistrée avant l'heure prévue ; non certifiée par un serveur.", "Preparation recorded before scheduled time; not server-attested.", lang)
      : txt("Reconstruction rétrospective : ne pas présenter comme une prévision créée avant l'annonce.", "Retrospective reconstruction: do not present as an ex-ante forecast.", lang));
  }
  function addResult(id: string) {
    const item = events.find((entry) => entry.id === id);
    if (!item) return;
    const input = { ...result, publishedAt: isoFromLocal(result.publishedAt) };
    const updated = attachEventResult(item, input);
    if (!updated) {
      setMessage(txt("Résultat non recevable : valeur, date après l'annonce, URL HTTPS originale et réaction nécessaires. Impossible de publier un résultat futur.", "Invalid result: value, post-event publication date, original HTTPS URL and reaction required. Future results cannot be recorded.", lang));
      return;
    }
    onChange({ ...plan, events: events.map((entry) => entry.id === id ? updated : entry) });
    setResult(zeroResult());
    setActiveResultId(null);
    setMessage(txt("Résultat saisi par l'utilisateur. La différence numérique ne constitue pas une interprétation de marché.", "User-entered result saved. Numeric difference is not a market interpretation.", lang));
  }
  return (
    <section className="tvp-research" aria-label={txt("Journal de recherche DataAnalyse", "DataAnalyse-inspired research journal", lang)}>
      <div className="tvp-section-title">
        <small>{txt("RECHERCHE · INSPIRATION DU PROCESSUS DATANALYSE", "RESEARCH · DATANALYSE PROCESS INSPIRED", lang)}</small>
        <h3>{txt("Suivi de thèses et annonces économiques", "Thesis tracking and macro events", lang)}</h3>
        <p>{txt(
          "Le service du professeur suit des idées pendant plusieurs jours, prépare les annonces et compare le résultat aux attentes. Cet outil conserve vos propres recherches ; il ne reproduit pas les fiches payantes.",
          "The professor's service follows ideas across days, prepares releases and compares outcomes with expectations. This tool stores your own research; it does not reproduce paywalled reports.",
          lang,
        )}</p>
      </div>
      <div className="tvp-note">{txt(
        "Toutes les dates de saisie proviennent du navigateur et ne prouvent pas qu'une information était connue à cette date. Aucun résultat n'est téléchargé automatiquement. Une fiche reste une hypothèse, pas un ordre.",
        "Record timestamps come from the browser, not an attested source of what was known at that time. No result is fetched automatically. A research note is not an order.",
        lang,
      )}</div>
      <div className="tvp-research-tabs" role="group" aria-label={txt("Outils de suivi", "Research tools", lang)}>
        <button type="button" className={tab === "updates" ? "active" : ""} aria-pressed={tab === "updates"} onClick={() => setTab("updates")}>
          {txt("Évolution d'une thèse", "Thesis revisions", lang)} ({updates.length})
        </button>
        <button type="button" className={tab === "events" ? "active" : ""} aria-pressed={tab === "events"} onClick={() => setTab("events")}>
          {txt("Annonces avant / après", "Events before / after", lang)} ({events.length})
        </button>
      </div>
      {tab === "updates" ? (
        <>
          <div className="tvp-evidence-entry">
            <h4>{txt("Enregistrer une nouvelle décision ou réévaluation", "Record a new decision or re-evaluation", lang)}</h4>
            <label>{txt("Événement / raison de la revue", "Event / review trigger", lang)}
              <input value={update.event} maxLength={500} onChange={(e) => setUpdate((p) => ({ ...p, event: e.target.value }))} /></label>
            <label>{txt("Décision actuelle", "Current disposition", lang)}
              <select value={update.disposition} onChange={(e) => setUpdate((p) => ({ ...p, disposition: e.target.value as ThesisDisposition }))}>
                <option value="watch">{txt("Surveiller, ne pas forcer", "Watch, do not force", lang)}</option>
                <option value="reconsider">{txt("Réexaminer la thèse", "Reconsider thesis", lang)}</option>
                <option value="reject">{txt("Refuser / invalider", "Reject / invalidate", lang)}</option>
              </select></label>
            <label>{txt("Nouvelle information (source et date dans le registre)", "New information (source and date in evidence registry)", lang)}
              <textarea rows={3} maxLength={2000} value={update.newInformation}
                onChange={(e) => setUpdate((p) => ({ ...p, newInformation: e.target.value }))} /></label>
            <label>{txt("Ce qui change, ce qui reste vrai, prochaine condition", "What changed, what remains and next condition", lang)}
              <textarea rows={3} maxLength={2000} value={update.conclusion}
                onChange={(e) => setUpdate((p) => ({ ...p, conclusion: e.target.value }))} /></label>
            <button type="button" className="tvp-primary" onClick={addUpdate}>
              {txt("Figer cette version du dossier", "Snapshot this dossier revision", lang)}
            </button>
          </div>
          {updates.length === 0 && <p className="tvp-empty">{txt(
            "Aucun suivi enregistré. Exemple d'usage : une thèse reste valable mais une annonce ou le prix impose d'attendre, plutôt que d'ouvrir une position.",
            "No updates yet. For example, a thesis may remain valid while new data or price structure calls for waiting instead of entering.",
            lang,
          )}</p>}
          {[...updates].reverse().map((item) => (
            <article className="tvp-evidence-card" key={item.id}>
              <div className="tvp-evidence-card-head">
                <strong>{item.event}</strong><span>{timestamp(item.recordedAt, lang)}</span>
              </div>
              <p>{item.disposition === "reject" ? txt("Non-trade / invalidation", "No trade / invalidation", lang)
                : item.disposition === "reconsider" ? txt("Réexamen", "Re-evaluation", lang)
                : txt("Surveillance", "Monitoring", lang)}</p>
              <p><strong>{txt("Nouveau", "New", lang)} :</strong> {item.newInformation}</p>
              <p><strong>{txt("Décision", "Decision", lang)} :</strong> {item.conclusion}</p>
              <details className="tvp-history-details"><summary>{txt("Voir les éléments figés lors de cette version", "View archived dossier context", lang)}</summary>
                <p>{txt("Instrument", "Instrument", lang)} : {item.snapshot.instrument || "—"} · {item.snapshot.direction}</p>
                <p>{txt("Thèse initiale", "Original thesis", lang)} : {item.snapshot.theme || "—"}</p>
                <p>{txt("Attentes et nouveau fait", "Expectations and catalyst", lang)} : {item.snapshot.pricedIn || "—"} / {item.snapshot.catalyst || "—"}</p>
                <p>{txt("Setup", "Setup", lang)} : {item.snapshot.setup || "—"}</p>
                <p>{txt("Entrée/stop/cible ENVISAGÉS", "PLANNED entry/stop/target", lang)} : {item.snapshot.initialEntry || "—"} / {item.snapshot.initialStop || "—"} / {item.snapshot.initialTarget || "—"}</p>
                <p>{txt("Éditeurs d'origine déclarés", "Claimed original publishers", lang)} : {item.snapshot.originalPublishers.join(", ") || "—"}</p>
              </details>
            </article>
          ))}
        </>
      ) : (
        <>
          <div className="tvp-evidence-entry">
            <h4>{txt("Préparer une annonce AVANT son résultat", "Prepare a release BEFORE its outcome", lang)}</h4>
            <label>{txt("Annonce, pays et indicateur", "Release, country and indicator", lang)}
              <input maxLength={240} value={event.title} onChange={(e) => setEvent((p) => ({ ...p, title: e.target.value }))} /></label>
            <label>{txt("Date et heure prévues de l'annonce", "Scheduled release date/time", lang)}
              <input type="datetime-local" value={event.scheduledAt} onChange={(e) => setEvent((p) => ({ ...p, scheduledAt: e.target.value }))} /></label>
            <label>{txt("Attente/consensus déclarés (une source, pas vérité)", "Stated expectation/consensus (one source, not truth)", lang)}
              <input maxLength={100} value={event.expected} onChange={(e) => setEvent((p) => ({ ...p, expected: e.target.value }))} /></label>
            <label>{txt("Publication précédente, si disponible", "Previous reading, if available", lang)}
              <input maxLength={100} value={event.previous} onChange={(e) => setEvent((p) => ({ ...p, previous: e.target.value }))} /></label>
            <label>{txt("Unité et définition (%, bp, milliers…)", "Unit and definition (%, bp, thousands…)", lang)}
              <input maxLength={60} value={event.unit} onChange={(e) => setEvent((p) => ({ ...p, unit: e.target.value }))} /></label>
            <label>{txt("Éditeur original de la prévision", "Original publisher of expectation", lang)}
              <input maxLength={240} value={event.expectationPublisher}
                onChange={(e) => setEvent((p) => ({ ...p, expectationPublisher: e.target.value }))} /></label>
            <label>{txt("URL HTTPS de la prévision", "Expectation source HTTPS URL", lang)}
              <input type="url" maxLength={1800} value={event.expectationSourceUrl}
                onChange={(e) => setEvent((p) => ({ ...p, expectationSourceUrl: e.target.value }))} /></label>
            <label>{txt("Date et heure auxquelles la prévision était connue", "Date/time expectation was known", lang)}
              <input type="datetime-local" value={event.expectationAsOf}
                onChange={(e) => setEvent((p) => ({ ...p, expectationAsOf: e.target.value }))} /></label>
            <label>{txt("Scénario si chiffre supérieur aux attentes", "Scenario if number exceeds expectations", lang)}
              <textarea rows={3} maxLength={2000} value={event.higherScenario}
                onChange={(e) => setEvent((p) => ({ ...p, higherScenario: e.target.value }))}/></label>
            <label>{txt("Scénario si chiffre inférieur aux attentes", "Scenario if number misses expectations", lang)}
              <textarea rows={3} maxLength={2000} value={event.lowerScenario}
                onChange={(e) => setEvent((p) => ({ ...p, lowerScenario: e.target.value }))}/></label>
            <button type="button" className="tvp-primary" onClick={addEvent}>{txt("Figer la préparation", "Freeze preparation", lang)}</button>
          </div>
          {events.length === 0 && <p className="tvp-empty">{txt("Aucune annonce enregistrée. Les attentes et leurs sources doivent être notées avant de regarder la valeur publiée.", "No events recorded. Record expectations with sources before consulting released values.", lang)}</p>}
          {[...events].reverse().map((item) => {
            const delta = eventArithmeticDelta(item);
            return <article key={item.id} className="tvp-evidence-card">
              <div className="tvp-evidence-card-head"><strong>{item.title}</strong><span>{timestamp(item.scheduledAt, lang)}</span></div>
              <p>{wasPreparedBeforeEvent(item)
                ? txt("Préparation saisie avant l'annonce (horloge navigateur non attestée)", "Prepared before scheduled release (browser clock unverified)", lang)
                : txt("RECONSTRUCTION RÉTROSPECTIVE — pas une prévision ex ante", "RETROSPECTIVE RECONSTRUCTION — not an ex-ante forecast", lang)}</p>
              <p>{txt("Attente", "Expectation", lang)} : {item.expected} {item.unit} · {txt("Précédent", "Previous", lang)} : {item.previous || "—"}</p>
              <p>{txt("Source", "Source", lang)} : {item.expectationPublisher} · <a href={item.expectationSourceUrl} rel="noopener noreferrer" target="_blank">{txt("Document", "Document", lang)}</a></p>
              <details className="tvp-history-details"><summary>{txt("Voir les scénarios préparés", "View prepared scenarios", lang)}</summary>
                <p>{txt("Au-dessus", "Above", lang)} : {item.higherScenario}</p>
                <p>{txt("En-dessous", "Below", lang)} : {item.lowerScenario}</p>
                <p>{txt("Préparation enregistrée", "Preparation recorded", lang)} : {timestamp(item.preparedAt, lang)}</p>
                <p>{txt("Attente connue au plus tard", "Expectation known by", lang)} : {timestamp(item.expectationAsOf, lang)}</p>
              </details>
              {item.result ? (
                <>
                  <p>{txt("Résultat SAISI et non vérifié automatiquement", "USER-ENTERED result, not automatically verified", lang)} : {item.result.actual} {item.unit}</p>
                  <p>{txt("Écart arithmétique vs attente", "Arithmetic difference vs expectation", lang)} : {delta !== null ? delta.toLocaleString(lang === "fr" ? "fr-FR" : "en-GB") + " " + item.unit : txt("Non calculable — périmètre non confirmé ou données non numériques", "Not calculable — scope unverified or nonnumeric inputs", lang)}</p>
                  <p>{item.result.reaction} · <a href={item.result.originalUrl} rel="noopener noreferrer" target="_blank">{txt("Source du résultat", "Result source", lang)}</a></p>
                </>
              ) : (
                <>
                  <p>{txt("Résultat non renseigné : aucun chiffre ni réaction supposés.", "Result not entered: no value or market reaction assumed.", lang)}</p>
                  <button type="button" onClick={() => { setActiveResultId(item.id); setResult(zeroResult()); }}>
                    {txt("Documenter le résultat", "Document release result", lang)}
                  </button>
                  {activeResultId === item.id && <div className="tvp-result-entry">
                    <label>{txt("Valeur officielle / publiée (même unité)", "Released value (same unit)", lang)}
                      <input value={result.actual} onChange={(e) => setResult((p) => ({ ...p, actual: e.target.value }))}/></label>
                    <label>{txt("Date et heure de publication", "Release publication date/time", lang)}
                      <input type="datetime-local" value={result.publishedAt} onChange={(e) => setResult((p) => ({ ...p, publishedAt: e.target.value }))}/></label>
                    <label>{txt("URL HTTPS du résultat original", "Original result HTTPS URL", lang)}
                      <input type="url" value={result.originalUrl} onChange={(e) => setResult((p) => ({ ...p, originalUrl: e.target.value }))}/></label>
                    <label>{txt("Réaction observée / absence de réaction et limites", "Observed reaction / no reaction and caveats", lang)}
                      <textarea rows={3} value={result.reaction} onChange={(e) => setResult((p) => ({ ...p, reaction: e.target.value }))}/></label>
                    <label className="tvp-comparability">
                      <input type="checkbox" checked={result.comparabilityReviewed}
                        onChange={(e) => setResult((p) => ({ ...p, comparabilityReviewed: e.target.checked }))} />
                      <span>{txt("J'ai vérifié que prévision et résultat couvrent le même indicateur, territoire, période, unité et définition. Autoriser seulement alors l'écart arithmétique.", "I verified that forecast and outcome refer to the same indicator, territory, period, unit and definition. Only then calculate their numeric difference.", lang)}</span>
                    </label>
                    <button type="button" className="tvp-primary" onClick={() => addResult(item.id)}>{txt("Ajouter le résultat sourcé", "Attach sourced result", lang)}</button>
                  </div>}
                </>
              )}
            </article>;
          })}
        </>
      )}
      {message && <p className="tvp-feedback" role="status">{message}</p>}
    </section>
  );
}
