import { useEffect, useRef, useState, type ChangeEvent } from "react";
import { useLang } from "../../context/LanguageContext";
import {
  FX_CURRENCIES, FX_MACRO_KEY, FX_PAIRS, MAX_MACRO_DESK_BYTES,
  MAX_MACRO_IMPORT_BYTES, MAX_MACRO_SOURCES, MAX_MACRO_VERSIONS,
  appendMacroSnapshot, emptyMacroDesk, latestMacroSnapshot, pairBySymbol,
  pairCoverage, parseMacroDesk, validFxSnapshot, validFxSource,
  type FxCurrency, type FxMacroDesk, type FxMacroSnapshot,
  type FxMacroSource, type FxPair, type FxView, type FxSourcePerspective,
  type FxSourceStance,
} from "../../trading/fxMacroDesk";

const tr = (lang: "fr" | "en", fr: string, en: string) => lang === "fr" ? fr : en;
const stamp = (iso: string, lang: "fr" | "en") =>
  new Date(iso).toLocaleString(lang === "fr" ? "fr-FR" : "en-GB");
const blankSource = (): FxMacroSource => ({
  name: "", originalPublisher: "", url: "", publishedAt: "",
  perspective: "national", stance: "context", observation: "",
});
type Draft = Pick<FxMacroSnapshot, "asOf" | "view" | "policyTheme" | "marketExpectations" |
  "nextCatalyst" | "contradictions" | "sources">;
const blankDraft = (): Draft => ({
  asOf: new Date().toISOString().slice(0, 10),
  view: "unclear", policyTheme: "", marketExpectations: "",
  nextCatalyst: "", contradictions: "", sources: [],
});
const fromSnapshot = (item: FxMacroSnapshot | null): Draft => item
  ? { asOf: item.asOf, view: item.view, policyTheme: item.policyTheme,
      marketExpectations: item.marketExpectations, nextCatalyst: item.nextCatalyst,
      contradictions: item.contradictions, sources: [...item.sources] }
  : blankDraft();
const uniqueId = () => crypto.randomUUID?.() ?? "macro_" + Date.now().toString(36) +
  "_" + Math.random().toString(36).slice(2, 8);

export default function TradingMacroDesk({ onStartPair }: {
  onStartPair: (pair: FxPair, desk: FxMacroDesk) => void;
}) {
  const lang = useLang();
  const [desk, setDesk] = useState<FxMacroDesk | null>(null);
  const [corrupt, setCorrupt] = useState(false);
  const [externalChange, setExternalChange] = useState(false);
  const [currency, setCurrency] = useState<FxCurrency>("EUR");
  const [pairSymbol, setPairSymbol] = useState<string>("EURGBP");
  const [draft, setDraft] = useState<Draft>(blankDraft);
  const [draftDirty, setDraftDirty] = useState(false);
  const [source, setSource] = useState<FxMacroSource>(blankSource);
  const [message, setMessage] = useState("");
  const checkpoint = useRef<string | null>(null);

  useEffect(() => {
    function changed(event: StorageEvent) {
      if (event.key === FX_MACRO_KEY || event.key === null) setExternalChange(true);
    }
    window.addEventListener("storage", changed);
    return () => window.removeEventListener("storage", changed);
  }, []);

  function readSaved() {
    if (draftDirty && !window.confirm(tr(lang,
      "Relire le stockage effacera les notes non enregistrées de cette édition. Continuer ?",
      "Reloading storage will discard unsaved draft notes. Continue?"))) return;
    try {
      const raw = localStorage.getItem(FX_MACRO_KEY);
      const parsed = parseMacroDesk(raw);
      if (parsed.status === "corrupt") {
        setCorrupt(true);
        setDesk(null);
        setMessage(tr(lang,
          "Données Macro Desk incompatibles ou illisibles. Rien n'a été supprimé. Exportez la copie brute avant toute réparation.",
          "Incompatible or unreadable Macro Desk. Nothing was deleted. Export raw data before any repair."));
        return;
      }
      checkpoint.current = raw;
      setDesk(parsed.desk);
      setCorrupt(false);
      setExternalChange(false);
      setDraft(fromSnapshot(latestMacroSnapshot(parsed.desk, currency)));
      setDraftDirty(false);
      setSource(blankSource());
      setMessage(tr(lang,
        "Bibliothèque locale ouverte volontairement. Aucune récupération automatique, aucun serveur contacté.",
        "Local library explicitly opened. No automatic recovery and no server request."));
    } catch {
      setDesk(null);
      setMessage(tr(lang, "Stockage navigateur indisponible. Aucune modification effectuée.",
        "Browser storage unavailable. No changes were made."));
    }
  }
  function changeCurrency(next: FxCurrency) {
    if (draftDirty && !window.confirm(tr(lang,
      "Changer de devise ? Les notes non sauvegardées de cette édition seront perdues.",
      "Change currency? Unsaved edits in this draft will be discarded."))) return;
    setCurrency(next);
    setDraft(fromSnapshot(desk ? latestMacroSnapshot(desk, next) : null));
    setDraftDirty(false);
    setSource(blankSource());
    setMessage("");
  }
  function change<K extends keyof Draft>(key: K, value: Draft[K]) {
    setDraft((before) => ({ ...before, [key]: value }));
    setDraftDirty(true);
  }
  function addSource() {
    if (!validFxSource(source, draft.asOf)) {
      setMessage(tr(lang,
        "Source rejetée : titre, éditeur ORIGINAL, HTTPS, date de publication au plus tard à la date de contexte et observation requis.",
        "Source rejected: title, ORIGINAL publisher, HTTPS, publication date no later than the research cut-off and observation required."));
      return;
    }
    if (draft.sources.length >= MAX_MACRO_SOURCES ||
      draft.sources.some((item) => item.url.toLowerCase() === source.url.toLowerCase())) {
      setMessage(tr(lang, "Maximum quatre sources différentes par version; aucune URL dupliquée.",
        "Maximum four distinct URLs per revision; duplicates rejected."));
      return;
    }
    change("sources", [...draft.sources, { ...source }]);
    setSource(blankSource());
    setMessage("");
  }
  function save() {
    if (!desk) return;
    if (!draftDirty) {
      setMessage(tr(lang, "Aucun changement nouveau à enregistrer.", "No new changes to save."));
      return;
    }
    const snapshot: FxMacroSnapshot = {
      ...draft, currency, recordedAt: new Date().toISOString(), id: uniqueId(),
    };
    if (!validFxSnapshot(snapshot)) {
      setMessage(tr(lang,
        "Version non enregistrée : complétez les quatre analyses, une source originale datée, sa date de connaissance et vérifiez les limites de taille.",
        "Revision not saved: complete all four research notes, a dated original source and as-of date, and check size limits."));
      return;
    }
    const updated = appendMacroSnapshot(desk, snapshot);
    if (!updated) {
      setMessage(tr(lang,
        "Capacité ou historique maximal atteint : aucune ancienne version n'est supprimée automatiquement. Exportez la bibliothèque JSON.",
        "Capacity or version limit reached: no older version is automatically deleted. Export the JSON library."));
      return;
    }
    try {
      const live = localStorage.getItem(FX_MACRO_KEY);
      if (externalChange || live !== checkpoint.current) {
        setExternalChange(true);
        setMessage(tr(lang,
          "Conflit : un autre onglet a changé la bibliothèque. Enregistrement refusé; exportez vos notes ou rechargez volontairement.",
          "Conflict: another tab changed the library. Save refused; export your notes or explicitly reload."));
        return;
      }
      const raw = JSON.stringify(updated);
      if (new TextEncoder().encode(raw).length > MAX_MACRO_DESK_BYTES) return;
      localStorage.setItem(FX_MACRO_KEY, raw);
      checkpoint.current = raw;
      setDesk(updated);
      setDraftDirty(false);
      setMessage(tr(lang,
        "Version ajoutée SANS modifier l'historique, SUR CET APPAREIL seulement. Horodatage navigateur non certifié.",
        "Revision appended WITHOUT changing history, ON THIS DEVICE only. Browser timestamp not attested."));
    } catch {
      setMessage(tr(lang, "Enregistrement refusé : stockage local indisponible ou quota. Les données n'ont pas été effacées.",
        "Save refused: local storage unavailable or quota reached. No data was erased."));
    }
  }
  function download(content: string, filename: string, type: string) {
    const url = URL.createObjectURL(new Blob([content], { type }));
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = filename;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(url);
  }
  function exportDesk() {
    if (!desk) return;
    download(JSON.stringify(desk, null, 2), "world-vision-fx-macro-desk.json", "application/json");
    setMessage(tr(lang, "Copie JSON locale exportée, sans transfert réseau. Conservez ce fichier en lieu sûr.",
      "Local JSON exported without a network request. Keep this file secure."));
  }
  function exportRaw() {
    try {
      const raw = localStorage.getItem(FX_MACRO_KEY);
      if (raw !== null) download(raw, "world-vision-macro-desk-raw-recovery.txt", "text/plain");
    } catch { setMessage(tr(lang, "Impossible d'accéder au stockage brut.", "Cannot access raw storage.")); }
  }
  function clearCorrupt() {
    if (!corrupt || !window.confirm(tr(lang,
      "Effacer définitivement la bibliothèque ILLISIBLE de cet appareil après export de sauvegarde ? Aucune récupération possible.",
      "Permanently delete the UNREADABLE library from this device after exporting a backup? No recovery is possible."))) return;
    try {
      localStorage.removeItem(FX_MACRO_KEY);
      checkpoint.current = null;
      setDesk(emptyMacroDesk());
      setCorrupt(false);
      setExternalChange(false);
      setDraft(blankDraft());
      setDraftDirty(false);
      setMessage(tr(lang, "Nouvelle bibliothèque vide; ancien stockage effacé uniquement sur cet appareil.",
        "New empty library; old storage cleared on this device only."));
    } catch { setMessage(tr(lang, "Impossible de réinitialiser.", "Cannot reset.")); }
  }
  async function importFile(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file || !desk) return;
    if (file.size > MAX_MACRO_IMPORT_BYTES) {
      setMessage(tr(lang, "Import trop volumineux; aucune donnée remplacée.", "Import too large; nothing replaced."));
      return;
    }
    if (draftDirty) {
      setMessage(tr(lang, "Enregistrez ou abandonnez votre brouillon avant l'import.", "Save or discard your draft before importing."));
      return;
    }
    try {
      const text = await file.text();
      const parsed = parseMacroDesk(text);
      if (parsed.status === "corrupt") {
        setMessage(tr(lang, "Format JSON inconnu ou endommagé. Aucun import.", "Unknown or damaged JSON format. Nothing imported."));
        return;
      }
      if (Object.keys(desk.assessments).length > 0) {
        setMessage(tr(lang,
          "Import bloqué : la bibliothèque locale contient déjà des historiques. Exportez-les avant d'envisager une fusion contrôlée; aucun écrasement.",
          "Import blocked: the local library already has history. Export it before a controlled merge; no overwrite."));
        return;
      }
      if (!window.confirm(tr(lang,
        "Importer cette bibliothèque vérifiée dans le stockage VIDE de CET APPAREIL ? Aucun serveur n'est impliqué.",
        "Import this validated library into EMPTY storage on THIS DEVICE? No server is involved."))) return;
      const current = localStorage.getItem(FX_MACRO_KEY);
      if (externalChange || current !== checkpoint.current) {
        setExternalChange(true);
        setMessage(tr(lang, "Conflit de stockage, import annulé.", "Storage conflict, import cancelled."));
        return;
      }
      const value = JSON.stringify(parsed.desk);
      localStorage.setItem(FX_MACRO_KEY, value);
      checkpoint.current = value;
      setDesk(parsed.desk);
      setDraft(fromSnapshot(latestMacroSnapshot(parsed.desk, currency)));
      setDraftDirty(false);
      setMessage(tr(lang, "Bibliothèque importée après confirmation, sans effacer une collection existante.",
        "Library imported after confirmation without overwriting an existing collection."));
    } catch {
      setMessage(tr(lang, "Import impossible. Aucune donnée effacée.", "Import failed. No data was removed."));
    }
  }
  const pair = pairBySymbol(pairSymbol) ?? FX_PAIRS[0];
  const coverage = desk ? pairCoverage(desk, pair) : null;
  const saved = desk ? desk.assessments[currency] ?? [] : [];
  const documented = desk ? FX_CURRENCIES.filter((ccy) => latestMacroSnapshot(desk, ccy)).length : 0;

  return <section className="tvp-macro" aria-label={tr(lang, "Macro Desk huit devises", "Eight-currency Macro Desk")}>
    <div className="tvp-section-title">
      <small>MACRO DESK · G10 FX · {FX_CURRENCIES.length} / {FX_PAIRS.length}</small>
      <h3>{tr(lang, "Huit économies, 28 paires, une comparaison sourcée", "Eight economies, 28 pairs, sourced comparison")}</h3>
      <p>{tr(lang,
        "Renseignez vous-même les banques centrales, attentes, nouveaux faits et contradictions. Les 28 combinaisons sont affichées, sans score automatique ni sélection d'opportunités.",
        "Enter central-bank context, expectations, new developments and counterevidence yourself. All 28 combinations are shown, without automatic ranking or trading opportunities.")}</p>
    </div>
    <div className="tvp-note">{tr(lang,
      "Aucune donnée temps réel, prix, prévision commerciale, conseil ou exécution. Sources/horodatages déclarés par l'utilisateur et non vérifiés par le serveur. Aucune synchronisation de ce poste de travail.",
      "No live data, prices, commercial forecasts, advice or execution. Sources/timestamps are user-declared and not server-attested. This desk is not synchronized.")}</div>
    {desk === null ? <div className="tvp-macro-intro">
      <p>{tr(lang,
        "Le poste de travail ne lit pas votre stockage privé avant votre choix. Ouvrir une bibliothèque absente crée seulement une vue vide, sans sauvegarde automatique.",
        "This desk does not read private storage until you choose to. Opening a missing library displays an empty view without autosaving.")}</p>
      <button className="tvp-primary" type="button" onClick={readSaved}>
        {tr(lang, "Ouvrir volontairement mon Macro Desk local", "Explicitly open my local Macro Desk")}</button>
      {corrupt && <div className="tvp-case-alert" role="alert">
        <button type="button" onClick={exportRaw}>{tr(lang, "Sauvegarder les données brutes", "Export raw recovery data")}</button>
        <button type="button" onClick={clearCorrupt}>{tr(lang, "Réinitialiser après sauvegarde", "Reset after backup")}</button>
      </div>}
    </div> : <>
      <div className="tvp-macro-toolbar">
        <strong>{documented}/8 {tr(lang, "devises documentées", "currencies documented")}</strong>
        <button type="button" onClick={readSaved}>{tr(lang, "Relire le stockage", "Reload storage")}</button>
        <button type="button" onClick={exportDesk}>{tr(lang, "Exporter le journal JSON", "Export JSON journal")}</button>
        <label className="tvp-import-label">{tr(lang, "Importer dans bibliothèque vide", "Import into empty library")}
          <input type="file" accept=".json,application/json" onChange={importFile}
            aria-label={tr(lang, "Importer le journal Macro Desk JSON", "Import Macro Desk JSON journal")} />
        </label>
      </div>
      {externalChange && <p className="tvp-case-alert" role="alert">{tr(lang,
        "Bibliothèque modifiée dans un autre onglet. Toute écriture est refusée avant rechargement explicite. Copiez les notes non sauvegardées d'abord.",
        "Library changed in another tab. Writes are blocked until explicit reload. Copy unsaved notes first.")}</p>}
      <h4>{tr(lang, "01 · Contexte économique par devise", "01 · Currency-level economic context")}</h4>
      <div className="tvp-macro-currencies" role="group" aria-label={tr(lang, "Choisir une devise", "Select currency")}>
        {FX_CURRENCIES.map((ccy) => <button type="button" key={ccy}
            className={ccy === currency ? "active" : ""} aria-pressed={ccy === currency}
            onClick={() => changeCurrency(ccy)}>
          <strong>{ccy}</strong><small>{desk.assessments[ccy]?.length ?? 0} {tr(lang, "versions", "versions")}</small>
        </button>)}
      </div>
      <div className="tvp-macro-editor">
        <div className="tvp-macro-editor-heading">
          <strong>{currency} · {tr(lang, "nouvelle version de recherche", "new research revision")}</strong>
          <span>{saved.length}/{MAX_MACRO_VERSIONS} {tr(lang, "versions figées", "frozen revisions")}</span>
        </div>
        <div className="tvp-macro-form">
          <label>{tr(lang, "Date de connaissance déclarée (as-of, non certifiée)", "User-declared knowledge cut-off (not verified)")}
            <input id="tvp-macro-asof" type="date" value={draft.asOf} onChange={(e) => change("asOf", e.target.value)} /></label>
          <label>{tr(lang, "Lecture humaine (PAS un signal)", "Human interpretation (NOT a signal)")}
            <select id="tvp-macro-view" value={draft.view} onChange={(e) => change("view", e.target.value as FxView)}>
              <option value="unclear">{tr(lang, "Indéterminée", "Unclear")}</option>
              <option value="resilient">{tr(lang, "Résilience discutée", "Resilience hypothesis")}</option>
              <option value="fragile">{tr(lang, "Fragilité discutée", "Fragility hypothesis")}</option>
              <option value="mixed">{tr(lang, "Mixte / contradictoire", "Mixed / contradictory")}</option>
            </select></label>
          <label>{tr(lang, "Thème macro et politique monétaire", "Macro theme and monetary policy")}
            <textarea id="tvp-macro-theme" maxLength={1000} rows={3} value={draft.policyTheme}
              onChange={(e) => change("policyTheme", e.target.value)} /></label>
          <label>{tr(lang, "Ce que les acteurs attendaient avant le fait", "What participants expected before the development")}
            <textarea id="tvp-macro-expectations" maxLength={1000} rows={3} value={draft.marketExpectations}
              onChange={(e) => change("marketExpectations", e.target.value)} /></label>
          <label>{tr(lang, "Catalyseur à surveiller et condition de réévaluation", "Catalyst to monitor and reevaluation condition")}
            <textarea id="tvp-macro-catalyst" maxLength={1000} rows={3} value={draft.nextCatalyst}
              onChange={(e) => change("nextCatalyst", e.target.value)} /></label>
          <label>{tr(lang, "Contradictions / limites des sources", "Contrary evidence / source limitations")}
            <textarea id="tvp-macro-contradictions" maxLength={1000} rows={3} value={draft.contradictions}
              onChange={(e) => change("contradictions", e.target.value)} /></label>
        </div>
        <div className="tvp-macro-sources">
          <h5>{tr(lang, "Sources originales datées de cette version", "Dated original references for this revision")}</h5>
          {draft.sources.map((entry, index) => <div key={entry.url} className="tvp-macro-source">
            <strong>{entry.originalPublisher} · {entry.publishedAt}</strong>
            <a href={entry.url} target="_blank" rel="noopener noreferrer">{entry.name}</a>
            <span>{entry.perspective} · {entry.stance}</span>
            <p>{entry.observation}</p>
            <button type="button" onClick={() => change("sources", draft.sources.filter((_, i) => i !== index))}>
              {tr(lang, "Retirer de cette nouvelle version", "Remove from this new revision")}</button>
          </div>)}
          {draft.sources.length < MAX_MACRO_SOURCES && <div className="tvp-macro-source-form">
            <label>{tr(lang, "Document / publication", "Document / publication")}
              <input maxLength={180} value={source.name} onChange={(e) => setSource((s) => ({ ...s, name: e.target.value }))} /></label>
            <label>{tr(lang, "Éditeur d'origine (pas l'agrégateur)", "Original publisher (not aggregator)")}
              <input maxLength={180} value={source.originalPublisher}
                onChange={(e) => setSource((s) => ({ ...s, originalPublisher: e.target.value }))} /></label>
            <label>{tr(lang, "URL HTTPS de l'original", "Original HTTPS URL")}
              <input type="url" maxLength={1800} value={source.url}
                onChange={(e) => setSource((s) => ({ ...s, url: e.target.value }))} /></label>
            <label>{tr(lang, "Date de publication", "Publication date")}
              <input type="date" value={source.publishedAt}
                onChange={(e) => setSource((s) => ({ ...s, publishedAt: e.target.value }))} /></label>
            <label>{tr(lang, "Perspective de la source", "Source perspective")}
              <select value={source.perspective} onChange={(e) =>
                setSource((s) => ({ ...s, perspective: e.target.value as FxSourcePerspective }))}>
                <option value="national">{tr(lang, "Locale / nationale", "Local / national")}</option>
                <option value="regional">{tr(lang, "Régionale", "Regional")}</option>
                <option value="international">{tr(lang, "Internationale", "International")}</option>
                <option value="field">{tr(lang, "Terrain", "Field")}</option>
                <option value="media">{tr(lang, "Média / analyse", "Media / analysis")}</option>
                <option value="market">{tr(lang, "Marché / intermédiaire", "Market / intermediary")}</option>
                <option value="other">{tr(lang, "Autre", "Other")}</option>
              </select></label>
            <label>{tr(lang, "Rôle de la source", "Evidence stance")}
              <select value={source.stance} onChange={(e) =>
                setSource((s) => ({ ...s, stance: e.target.value as FxSourceStance }))}>
                <option value="context">{tr(lang, "Contexte", "Context")}</option>
                <option value="supports">{tr(lang, "Étaye", "Supports")}</option>
                <option value="challenges">{tr(lang, "Nuance / contredit", "Challenges")}</option>
              </select></label>
            <label className="tvp-macro-wide">{tr(lang, "Observation précise attribuée à cette source", "Specific observation attributed to this source")}
              <textarea rows={2} maxLength={500} value={source.observation}
                onChange={(e) => setSource((s) => ({ ...s, observation: e.target.value }))} /></label>
            <button className="tvp-primary" type="button" onClick={addSource}>
              {tr(lang, "Ajouter la source au brouillon", "Add source to draft")}</button>
          </div>}
        </div>
        <div className="tvp-macro-actions">
          <button type="button" className="tvp-primary" disabled={!draftDirty || externalChange || saved.length >= MAX_MACRO_VERSIONS}
            onClick={save}>{tr(lang, "Figer une nouvelle version sur cet appareil", "Freeze new revision on this device")}</button>
          <small>{tr(lang,
            "Aucun écrasement historique. Les modifications ne sont pas automatiquement enregistrées.",
            "History is never overwritten. Draft changes are not automatically saved.")}</small>
        </div>
        {saved.length > 0 && <details className="tvp-macro-history">
          <summary>{tr(lang, "Historique immuable de cette devise", "Immutable currency revision history")} ({saved.length})</summary>
          {[...saved].reverse().map((entry) => <article key={entry.id}>
            <strong>{stamp(entry.recordedAt, lang)} · as-of {entry.asOf} · {entry.view}</strong>
            <p>{entry.policyTheme}</p><p>{entry.marketExpectations}</p>
            <p>{entry.contradictions}</p>
            <small>{entry.sources.map((s) => s.originalPublisher).join(", ")}</small>
          </article>)}
        </details>}
      </div>
      <div className="tvp-macro-pair-section">
        <h4>{tr(lang, "02 · Les 28 combinaisons sans classement", "02 · All 28 combinations, unranked")}</h4>
        <p>{tr(lang,
          "Une paire n'est documentée que si ses deux devises le sont. Deux éditeurs déclarés ne constituent pas automatiquement deux preuves indépendantes. Les dates différentes sont signalées.",
          "A pair has context only if both currencies are documented. Two named publishers are not automatically independent evidence. Differing information dates are flagged.")}</p>
        <div className="tvp-macro-pairs" role="group" aria-label={tr(lang, "Choisir une des 28 paires", "Select one of 28 pairs")}>
          {FX_PAIRS.map((item) => {
            const state = pairCoverage(desk, item);
            return <button type="button" key={item.symbol}
                className={pairSymbol === item.symbol ? "active" : ""}
                aria-pressed={pairSymbol === item.symbol}
                onClick={() => setPairSymbol(item.symbol)}>
              <strong>{item.base}/{item.quote}</strong>
              <small>{state.complete ? "2/2" : state.base === "absent" && state.quote === "absent" ? "0/2" : "1/2"}</small>
            </button>;
          })}
        </div>
        <div className="tvp-macro-pair-detail">
          <h5>{pair.base}/{pair.quote} · {tr(lang, "confrontation de contextes", "side-by-side contexts")}</h5>
          <p>{coverage?.complete
            ? coverage.sameAsOf
              ? tr(lang, "Deux contextes documentés pour la même date déclarée.", "Two documented contexts with the same declared as-of date.")
              : tr(lang, "Dates de contexte DIFFÉRENTES : comparaison temporelle fragile, vérifiez avant analyse.", "DIFFERENT context dates: weak chronological comparability, review before analysis.")
            : tr(lang, "Documentation incomplète : aucune déduction macro sur cette paire.", "Insufficient documentation: no macro inference from this pair.")}</p>
          <div className="tvp-macro-dual">
            {([pair.base, pair.quote] as FxCurrency[]).map((ccy) => {
              const item = latestMacroSnapshot(desk, ccy);
              return <article key={ccy}>
                <h5>{ccy}</h5>
                {item ? <>
                  <small>as-of {item.asOf} · {item.view}</small>
                  <p><strong>{tr(lang, "Thème", "Theme")}:</strong> {item.policyTheme}</p>
                  <p><strong>{tr(lang, "Attentes", "Expectations")}:</strong> {item.marketExpectations}</p>
                  <p><strong>{tr(lang, "Contre-arguments", "Counterevidence")}:</strong> {item.contradictions}</p>
                  <small>{item.sources.length} {tr(lang, "sources déclarées", "declared sources")} ·
                    {new Set(item.sources.map((s) => s.originalPublisher.toLowerCase())).size}
                    {" "}{tr(lang, "éditeurs originaux déclarés", "declared original publishers")}</small>
                </> : <p>{tr(lang, "Aucune recherche enregistrée.", "No research saved.")}</p>}
              </article>;
            })}
          </div>
          <button type="button" className="tvp-primary" onClick={() => {
            if (!window.confirm(tr(lang,
              "Créer une NOUVELLE analyse MTA pour " + pair.symbol +
              " ? L'analyse actuellement ouverte sera remplacée sans sauvegarde automatique. Les sources existantes du Macro Desk sont COPIÉES, pas synchronisées; direction indécise.",
              "Create a NEW MTA dossier for " + pair.symbol +
              "? Current open research will be replaced without autosave. Existing Macro Desk sources are COPIED, not synchronized; direction stays undecided."))) return;
            onStartPair(pair, desk);
          }}>{tr(lang, "Créer un nouveau dossier MTA à partir de cette paire", "Start a new MTA dossier from this pair")}</button>
          <small>{tr(lang,
            "Aucune indication de long/short, d'entrée, stop, taille de position ou d'exécution.",
            "No long/short signal, entry, stop, position size or execution.")}</small>
        </div>
      </div>
      <small className="tvp-macro-footnote">{tr(lang,
        "Stockage local non chiffré et effaçable par le navigateur. Maximum huit versions par devise; exporter avant saturation. Aucune source téléchargée ou vérifiée automatiquement.",
        "Local storage is unencrypted and may be cleared by the browser. Eight revisions maximum per currency; export before capacity is reached. No source is automatically downloaded or verified.")}</small>
    </>}
    {message && <p className="tvp-feedback" role="status">{message}</p>}
  </section>;
}
