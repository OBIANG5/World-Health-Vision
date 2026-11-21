import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useLang } from "../../context/LanguageContext";
import {
  STAGES, independentSourceCount, newTradePlan, reviewPlan, reviewRisk,
  stageMissing, validEvidence,
  type Direction, type Evidence, type EvidencePerspective, type EvidenceStance,
  type RouteMode, type StageField, type TradePlan,
} from "../../trading/tradePlan";
import TradingResearchPanel from "./TradingResearchPanel";
import TradingCaseLibrary from "./TradingCaseLibrary";
import TradingPrivateWorkspace from "./TradingPrivateWorkspace";
import { researchIdentityNotConfigured } from "../../auth/researchIdentity";
import "../../styles/trading-process.css";

const copy = (lang: "fr" | "en", fr: string, en: string) => lang === "fr" ? fr : en;
const perspectiveLabels: Record<EvidencePerspective, { fr: string; en: string }> = {
  national: { fr: "Locale / nationale", en: "Local / national" },
  regional: { fr: "Régionale", en: "Regional" },
  international: { fr: "Internationale", en: "International" },
  field: { fr: "Terrain / observation", en: "Field / observation" },
  media: { fr: "Presse / analyse", en: "Press / analysis" },
  market: { fr: "Marché / intermédiaire", en: "Market / intermediary" },
  other: { fr: "Autre", en: "Other" },
};
const stanceLabels: Record<EvidenceStance, { fr: string; en: string }> = {
  supports: { fr: "Étaye", en: "Supports" },
  challenges: { fr: "Contredit / nuance", en: "Challenges / qualifies" },
  context: { fr: "Contexte", en: "Context" },
};
function emptyEvidence(): Evidence {
  return { id: "", name: "", originalPublisher: "", url: "", publishedAt: "", perspective: "other", stance: "context", observation: "" };
}
function blankAllowed(value: string): boolean { return value.trim().length > 0; }
function FieldEditor({ item, lang, value, onChange }: {
  item: StageField; lang: "fr" | "en"; value: string; onChange: (value: string) => void;
}) {
  const label = item.label[lang];
  const id = "trading-field-" + item.key;
  return <label className="tvp-field" htmlFor={id}>
    <span>{label}{item.required && <span aria-hidden="true"> *</span>}</span>
    {item.kind === "select" ? (
      <select id={id} value={value} onChange={(event) => onChange(event.target.value)}>
        <option value="">{copy(lang, "Choisir / ne pas présumer", "Choose / do not assume")}</option>
        {item.options?.map(({ value: option, label: text }) => <option value={option} key={option}>{text[lang]}</option>)}
      </select>
    ) : item.kind === "textarea" || !item.kind ? (
      <textarea id={id} rows={3} value={value} maxLength={8000}
        onChange={(event) => onChange(event.target.value)} />
    ) : (
      <input id={id} type={item.kind === "number" ? "number" : item.kind}
        inputMode={item.kind === "number" ? "decimal" : undefined}
        step={item.kind === "number" ? "any" : undefined}
        value={value} maxLength={item.kind === "text" ? 120 : undefined}
        onChange={(event) => onChange(event.target.value)} />
    )}
    {item.hint && <small>{item.hint[lang]}</small>}
  </label>;
}

export default function TradingProcessPanel({ onClose }: { onClose: () => void }) {
  const lang = useLang();
  const [plan, setPlan] = useState<TradePlan>(newTradePlan);
  const [stepIndex, setStepIndex] = useState(0);
  const [showEvidence, setShowEvidence] = useState(false);
  const [showResearch, setShowResearch] = useState(false);
  const [evidenceDraft, setEvidenceDraft] = useState<Evidence>(emptyEvidence);
  const [feedback, setFeedback] = useState("");
  // Opening a remote dossier detaches any local file association and vice versa.
  // React keys also guarantee private UI state does not persist across accounts.
  const [localReset, setLocalReset] = useState(0);
  const [remoteReset, setRemoteReset] = useState(0);
  const dialog = useRef<HTMLElement>(null);
  const firstFocus = useRef<HTMLButtonElement>(null);
  const stage = STAGES[stepIndex];
  const risk = useMemo(() => reviewRisk(plan), [plan]);
  const review = useMemo(() => reviewPlan(plan), [plan]);

  useEffect(() => {
    const oldOverflow = document.body.style.overflow;
    const previousFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    document.body.style.overflow = "hidden";
    firstFocus.current?.focus();
    const keydown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
      if (event.key !== "Tab") return;
      const candidates = Array.from(dialog.current?.querySelectorAll<HTMLElement>(
        "button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), a[href]"
      ) ?? []);
      if (candidates.length < 1) return;
      const first = candidates[0], last = candidates[candidates.length - 1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    };
    document.addEventListener("keydown", keydown);
    return () => { document.body.style.overflow = oldOverflow; document.removeEventListener("keydown", keydown); previousFocus?.focus(); };
  }, [onClose]);

  const setField = (key: string, value: string) =>
    setPlan((current) => ({ ...current, fields: { ...current.fields, [key]: value } }));

  const addEvidence = () => {
    if (!validEvidence(evidenceDraft)) {
      setFeedback(copy(lang, "Source incomplète : éditeur original, nom, URL HTTPS, date et observation nécessaires.", "Incomplete evidence: original publisher, name, HTTPS URL, date and observation required."));
      return;
    }
    const entry: Evidence = { ...evidenceDraft, id: crypto.randomUUID?.() ?? String(Date.now()) };
    setPlan((current) => ({ ...current, evidence: [...current.evidence.slice(0, 49), entry] }));
    setEvidenceDraft(emptyEvidence());
    setFeedback(copy(lang, "Source ajoutée ; vérifiez aussi ses limites et son indépendance.", "Source added; also verify its limitations and independence."));
  };
  const completion = Math.round(review.completed / STAGES.length * 100);
  return createPortal(
    <div className="tvp-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
      <section ref={dialog} className="tvp-dialog" role="dialog" aria-modal="true"
        aria-label={copy(lang, "Trading-Vision · Processus de décision", "Trading-Vision · Decision process")} tabIndex={-1}>
        <header className="tvp-header">
          <div>
            <span className="tvp-kicker">WORLD-VISION · TRADING-VISION</span>
            <h2>{copy(lang, "Atelier de prise de trade", "Trade decision workspace")}</h2>
            <p>{copy(lang, "7 étapes · Une thèse documentée, pas un signal automatique.", "7 stages · An evidenced thesis, not an automatic signal.")}</p>
          </div>
          <button type="button" ref={firstFocus} className="tvp-close" onClick={onClose}
            aria-label={copy(lang, "Fermer", "Close")}>×</button>
        </header>
        <div className="tvp-disclaimer" role="note">
          {copy(lang,
            "Version pilote : aucun cours commercial copié, aucun flux de marché ni compte courtier connecté. Le processus guide une analyse personnelle, sans conseil de trading ni transmission d'ordre. Les chiffres sont saisis par l'utilisateur.",
            "Pilot: no copied commercial course, live market feed or connected brokerage. This guides user research, not trading advice or order submission. All figures are user-entered.")}
        </div>
        <div className="tvp-identity">
          <label>
            {copy(lang, "Instrument / paire et fournisseur exact", "Instrument / pair and exact provider")}
            <input value={plan.instrument} maxLength={140} onChange={(e) => setPlan((p) => ({ ...p, instrument: e.target.value }))}
              placeholder={copy(lang, "Ex. EURGBP — préciser le contrat", "E.g. EURGBP — specify the contract")} />
          </label>
          <label>
            {copy(lang, "Nature du contrat", "Contract type")}
            <select value={plan.instrumentKind} onChange={(e) => setPlan((p) => ({ ...p, instrumentKind: e.target.value }))}>
              <option value="">{copy(lang, "À préciser", "To specify")}</option>
              <option value="spot">Spot</option><option value="cfd">CFD</option><option value="future">Future</option>
              <option value="equity">{copy(lang, "Action", "Stock")}</option><option value="other">{copy(lang, "Autre contrat", "Other contract")}</option>
            </select>
          </label>
          <label>
            {copy(lang, "Sens de l'hypothèse", "Hypothesized direction")}
            <select value={plan.direction} onChange={(e) => setPlan((p) => ({ ...p, direction: e.target.value as Direction }))}>
              <option value="undecided">{copy(lang, "Non décidé", "Undecided")}</option>
              <option value="long">{copy(lang, "Achat envisagé", "Long considered")}</option>
              <option value="short">{copy(lang, "Vente envisagée", "Short considered")}</option>
            </select>
          </label>
          <label>
            {copy(lang, "Parcours pédagogique", "Learning path")}
            <select value={plan.mode} onChange={(e) => setPlan((p) => ({ ...p, mode: e.target.value as RouteMode }))}>
              <option value="fundamental">{copy(lang, "Macro puis technique (principal)", "Macro then price action (primary)")}</option>
              <option value="technical_exception">{copy(lang, "Exception technique, explicitement justifiée", "Technical exception, explained")}</option>
            </select>
          </label>
        </div>
        <div className="tvp-progress" role="status">
          <div><strong>{review.completed}/7</strong> {copy(lang, "étapes documentées", "stages documented")}</div>
          <div className="tvp-progressbar" role="progressbar" aria-valuemin={0} aria-valuemax={100}
            aria-valuenow={completion} aria-label={copy(lang, "Progression du dossier", "Dossier progress")}>
            <span style={{ width: completion + "%" }} />
          </div>
          <small>{review.limitations.length
            ? copy(lang, "Dossier incomplet ou preuves insuffisantes : aucune conclusion d'exécution.", "Incomplete dossier or insufficient evidence: no execution conclusion.")
            : copy(lang, "Dossier renseigné pour revue humaine ; aucune prise de position autorisée par l'outil.", "Dossier documented for human review; the tool authorizes no order.")}</small>
        </div>
        <div className="tvp-workspace">
          <nav className="tvp-stages" aria-label={copy(lang, "Étapes du processus", "Process stages")}>
            {STAGES.map((item, index) => {
              const isComplete = stageMissing(plan, item).length === 0;
              return <button type="button" key={item.id} className={"tvp-stage" + (stepIndex === index && !showEvidence && !showResearch ? " active" : "")}
                aria-current={stepIndex === index && !showEvidence && !showResearch ? "step" : undefined} onClick={() => { setStepIndex(index); setShowEvidence(false); setShowResearch(false); }}>
                <span aria-hidden="true">{isComplete ? "✓" : String(index + 1).padStart(2, "0")}</span>
                <strong>{item.title[lang].split(" · ")[1]}</strong>
              </button>;
            })}
            <button type="button" className={"tvp-stage" + (showEvidence ? " active" : "")}
              onClick={() => { setShowEvidence(true); setShowResearch(false); }}>
              <span aria-hidden="true">◎</span><strong>{copy(lang, "Registre des preuves", "Evidence registry")}</strong>
            </button>
            <button type="button" className={"tvp-stage" + (showResearch ? " active" : "")}
              onClick={() => { setShowResearch(true); setShowEvidence(false); }}>
              <span aria-hidden="true">↻</span><strong>{copy(lang, "Suivi et annonces", "Thesis & events")}</strong>
            </button>
          </nav>
          <main className="tvp-main">
            {showResearch ? (
              <TradingResearchPanel plan={plan} onChange={setPlan}/>
            ) : showEvidence ? (
              <>
                <div className="tvp-section-title">
                  <small>{copy(lang, "SOURCES ET POINTS DE VUE", "SOURCES AND PERSPECTIVES")}</small>
                  <h3>{copy(lang, "Registre des preuves", "Evidence registry")}</h3>
                  <p>{copy(lang, "Ne comptez pas plusieurs reprises de la même dépêche ou du même chiffre comme confirmations indépendantes.", "Do not count multiple copies of the same report or figure as independent corroboration.")}</p>
                </div>
                <div className="tvp-evidence-stats">
                  <strong>{plan.evidence.filter(validEvidence).length} {copy(lang, "sources décrites", "sources described")}</strong>
                  <strong>{independentSourceCount(plan.evidence)} {copy(lang, "éditeurs originaux déclarés", "claimed original publishers")}</strong>
                </div>
                {plan.evidence.map((entry) => <article className="tvp-evidence-card" key={entry.id}>
                  <div className="tvp-evidence-card-head">
                    <strong>{entry.name}</strong>
                    <button type="button" onClick={() => setPlan((p) => ({ ...p, evidence: p.evidence.filter((source) => source.id !== entry.id) }))}>
                      {copy(lang, "Supprimer", "Remove")}
                    </button>
                  </div>
                  <p>{entry.originalPublisher} · {perspectiveLabels[entry.perspective][lang]} · {stanceLabels[entry.stance][lang]} · {entry.publishedAt}</p>
                  <p>{entry.observation}</p>
                  <a href={entry.url} target="_blank" rel="noopener noreferrer">{copy(lang, "Consulter l'original", "View original")}</a>
                </article>)}
                <div className="tvp-evidence-entry">
                  <h4>{copy(lang, "Ajouter une source documentée", "Add documented evidence")}</h4>
                  <label>{copy(lang, "Nom de la publication / série", "Publication / series name")}
                    <input value={evidenceDraft.name} maxLength={240}
                      onChange={(e) => setEvidenceDraft((p) => ({ ...p, name: e.target.value }))}/></label>
                  <label>{copy(lang, "Éditeur ORIGINAL, pas le site qui le recopie", "ORIGINAL publisher, not a republishing website")}
                    <input value={evidenceDraft.originalPublisher} maxLength={240}
                      onChange={(e) => setEvidenceDraft((p) => ({ ...p, originalPublisher: e.target.value }))}/></label>
                  <label>URL HTTPS
                    <input type="url" value={evidenceDraft.url} maxLength={1800} placeholder="https://"
                      onChange={(e) => setEvidenceDraft((p) => ({ ...p, url: e.target.value }))}/></label>
                  <label>{copy(lang, "Date de publication", "Publication date")}
                    <input type="date" value={evidenceDraft.publishedAt}
                      onChange={(e) => setEvidenceDraft((p) => ({ ...p, publishedAt: e.target.value }))}/></label>
                  <label>{copy(lang, "Origine", "Perspective")}
                    <select value={evidenceDraft.perspective}
                      onChange={(e) => setEvidenceDraft((p) => ({ ...p, perspective: e.target.value as EvidencePerspective }))}>
                      {Object.entries(perspectiveLabels).map(([key, title]) =>
                        <option value={key} key={key}>{title[lang]}</option>)}
                    </select></label>
                  <label>{copy(lang, "Relation avec la thèse", "Relation to thesis")}
                    <select value={evidenceDraft.stance}
                      onChange={(e) => setEvidenceDraft((p) => ({ ...p, stance: e.target.value as EvidenceStance }))}>
                      {Object.entries(stanceLabels).map(([key, title]) =>
                        <option value={key} key={key}>{title[lang]}</option>)}
                    </select></label>
                  <label>{copy(lang, "Ce que dit effectivement cette source et ses limites", "Actual source claim and its limits")}
                    <textarea rows={3} maxLength={2500} value={evidenceDraft.observation}
                      onChange={(e) => setEvidenceDraft((p) => ({ ...p, observation: e.target.value }))}/></label>
                  <button className="tvp-primary" type="button" onClick={addEvidence} disabled={plan.evidence.length >= 50}>
                    {copy(lang, "Ajouter au dossier", "Add to dossier")}
                  </button>
                </div>
              </>
            ) : (
              <>
                <div className="tvp-section-title">
                  <small>{copy(lang, "PROCESSUS DE PRISE DE TRADE · RECHERCHE", "TRADE DECISION PROCESS · RESEARCH")}</small>
                  <h3>{stage.title[lang]}</h3>
                  <p>{stage.question[lang]}</p>
                </div>
                {stepIndex === 0 && <div className="tvp-note">
                  {copy(lang, "Route principale : analyser les deux côtés de la paire et ce que le marché avait déjà anticipé. L'exception technique existe dans le cours, mais elle doit être justifiée et n'est pas un raccourci vers un ordre.", "Main path: analyze both sides of the pair and what the market had already priced in. A documented technical exception exists, but is not a shortcut to an order.")}
                </div>}
                {stepIndex === 1 && <div className="tvp-note">
                  {copy(lang, "Les niveaux de stop et objectif doivent être justifiés par la structure AVANT de regarder leur ratio. Les quatre confluences apparaissent comme repère pédagogique, pas comme quatre preuves économiques indépendantes.", "Stop and target must be justified by structure BEFORE calculating the ratio. Four confluences are a teaching reference, not four independent economic proofs.")}
                </div>}
                <div className="tvp-fields">
                  {stage.fields.map((item) => <FieldEditor key={item.key} item={item} lang={lang}
                    value={plan.fields[item.key] ?? ""} onChange={(value) => setField(item.key, value)} />)}
                </div>
                {(stepIndex === 1 || stepIndex === 2) && <div className="tvp-risk">
                  <h4>{copy(lang, "Contrôle mathématique, pas signal d'entrée", "Mathematical check, not an entry signal")}</h4>
                  <div className="tvp-metrics">
                    <span>{copy(lang, "Risque / rendement brut", "Gross reward / risk")}
                      <strong>{risk.ratio !== null ? "1 : " + risk.ratio.toFixed(2) : "—"}</strong></span>
                    <span>{copy(lang, "Budget de perte prévu", "Planned loss budget")}
                      <strong>{risk.plannedRiskBudget !== null ? risk.plannedRiskBudget.toLocaleString(lang) + " " + plan.fields.accountCurrency : "—"}</strong></span>
                  </div>
                  <p>{copy(lang, "Ratio calculé sans spread, financement, slippage ni risque de gap. Pas de taille de position automatique : spécification du contrat et valeur du point non vérifiées. R max et son pourcentage ne sont PAS des pourcentages du capital.", "Ratio excludes spread, financing, slippage and gap risk. No automated position sizing: contract specification and point value are unverified. R max and its fraction are NOT percentages of capital.")}</p>
                  {risk.geometryNote === "invalid" && <p className="tvp-warning">{copy(lang, "Direction, entrée, stop et cible sont géométriquement incohérents.", "Direction, entry, stop and target are geometrically inconsistent.")}</p>}
                  {risk.riskNote === "invalid" && <p className="tvp-warning">{copy(lang, "R max positif, devise et fraction entre 0 et 100 % requis.", "Positive R max, account currency and fraction between 0 and 100% required.")}</p>}
                </div>}
                {stepIndex === 6 && <div className="tvp-note">
                  {copy(lang, "Même si le dossier est complet, aucune connexion à un courtier et aucune transmission d'ordre. Un cours daté, un prix de démonstration ou un ordre planifié ne constituent jamais une exécution.", "Even with a complete dossier, no brokerage is connected and no order is transmitted. A dated quote, sample price or planned order is never an executed trade.")}
                </div>}
                <div className="tvp-step-footer">
                  <span>{stageMissing(plan, stage).length === 0
                    ? copy(lang, "Étape documentée (à vérifier humainement)", "Stage documented (human verification required)")
                    : copy(lang, "Reste à documenter : ", "Still missing: ") + stageMissing(plan, stage).length}</span>
                  <button className="tvp-primary" type="button" onClick={() => {
                    if (stepIndex < STAGES.length - 1) setStepIndex(stepIndex + 1); else setShowEvidence(true);
                  }}>{stepIndex === STAGES.length - 1 ? copy(lang, "Revoir les preuves", "Review evidence") : copy(lang, "Étape suivante", "Next stage")}</button>
                </div>
              </>
            )}
          </main>
        </div>
        <footer className="tvp-footer">
          <TradingCaseLibrary key={"local-" + localReset} plan={plan} onLoad={(value) => {
            setPlan(value);
            setStepIndex(0);
            setShowEvidence(false);
            setShowResearch(false);
            setEvidenceDraft(emptyEvidence());
            setFeedback("");
            setRemoteReset((previous) => previous + 1);
          }} />
          <TradingPrivateWorkspace
            key={"remote-" + remoteReset + "-" + (researchIdentityNotConfigured?.sessionInstanceId ?? "disconnected")}
            identity={researchIdentityNotConfigured}
            plan={plan}
            onOpen={(value) => {
              setPlan(value);
              setStepIndex(0);
              setShowEvidence(false);
              setShowResearch(false);
              setEvidenceDraft(emptyEvidence());
              setFeedback("");
              setLocalReset((previous) => previous + 1);
            }}
          />
          {blankAllowed(feedback) && <p className="tvp-feedback" role="status">{feedback}</p>}
        </footer>
      </section>
    </div>, document.body
  );
}
