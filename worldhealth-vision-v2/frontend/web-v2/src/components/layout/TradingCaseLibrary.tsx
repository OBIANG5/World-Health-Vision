import { useEffect, useState, type ChangeEvent } from "react";
import { useLang } from "../../context/LanguageContext";
import { newTradePlan, reviewPlan, type TradePlan } from "../../trading/tradePlan";
import {
  CASE_LIBRARY_KEY, LEGACY_DRAFT_KEY, MAX_CASES, MAX_IMPORT_CHARS, MAX_LIBRARY_CHARS,
  emptyCaseLibrary, parseImportedTradePlan, prepareSavedCase, putSavedCase,
  readCaseLibrary, removeSavedCase, type CaseLibrary, type SavedTradeCase,
} from "../../trading/tradeCaseLibrary";

const t = (lang: "fr" | "en", fr: string, en: string) => lang === "fr" ? fr : en;
const timeString = (iso: string, lang: "fr" | "en") => new Date(iso).toLocaleString(lang === "fr" ? "fr-FR" : "en-GB");
const uuid = () => crypto.randomUUID?.() ?? `case_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;

/**
 * User-initiated, per-device research workspace.
 * Never reads or persists confidential plans until a direct user action.
 * Older single-draft data remains available for explicit migration.
 */
export default function TradingCaseLibrary({ plan, onLoad }: {
  plan: TradePlan;
  onLoad: (value: TradePlan) => void;
}) {
  const lang = useLang();
  const [library, setLibrary] = useState<CaseLibrary | null>(null);
  const [open, setOpen] = useState(false);
  const [corrupt, setCorrupt] = useState(false);
  const [externalChange, setExternalChange] = useState(false);
  const [caseId, setCaseId] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [savedTitle, setSavedTitle] = useState("");
  const [savedFingerprint, setSavedFingerprint] = useState(() => JSON.stringify(newTradePlan()));
  const [savedRecordFingerprint, setSavedRecordFingerprint] = useState<string | null>(null);
  const [message, setMessage] = useState("");

  useEffect(() => {
    const changed = (event: StorageEvent) => {
      if (event.key === CASE_LIBRARY_KEY || event.key === null) setExternalChange(true);
    };
    window.addEventListener("storage", changed);
    return () => window.removeEventListener("storage", changed);
  }, []);

  const dirty = JSON.stringify(plan) !== savedFingerprint || title !== savedTitle;
  const summary = reviewPlan(plan);
  function readStorage(): CaseLibrary | null {
    try {
      const parsed = readCaseLibrary(localStorage.getItem(CASE_LIBRARY_KEY));
      if (parsed.status === "corrupt") {
        setCorrupt(true);
        setMessage(t(lang,
          "Bibliothèque illisible ou version inconnue : aucune donnée n'a été écrasée. Exportez le stockage brut avant une éventuelle réparation.",
          "Unreadable library or unknown version: nothing was overwritten. Export the raw data before attempting recovery.",
        ));
        return null;
      }
      setCorrupt(false);
      return parsed.library;
    } catch {
      setMessage(t(lang, "Stockage du navigateur indisponible. Utilisez l'export JSON.", "Browser storage is unavailable. Use JSON export."));
      return null;
    }
  }
  function showLibrary() {
    const read = readStorage();
    if (read) {
      setLibrary(read);
      setExternalChange(false);
      setMessage("");
    }
    setOpen(true);
  }
  function saveCase() {
    // Refresh immediately before a write. A stale tab must not overwrite
    // an updated case without an explicit subsequent user decision.
    const latest = readStorage();
    if (!latest) return;
    if (externalChange) {
      setLibrary(latest);
      setMessage(t(lang,
        "Une autre page a modifié la bibliothèque. Vérifiez les dossiers et rechargez la liste avant de sauvegarder.",
        "Another page changed the library. Review the entries and refresh the list before saving.",
      ));
      return;
    }
    const current = caseId ? latest.cases.find((item) => item.id === caseId) : undefined;
    if (caseId && !current) {
      setMessage(t(lang, "Ce dossier a disparu du stockage. Sauvegarde refusée pour éviter une résurrection involontaire.", "This case no longer exists in storage. Save rejected to prevent an unintended restore."));
      return;
    }
    if (current && JSON.stringify(current) !== savedRecordFingerprint) {
      setLibrary(latest);
      setMessage(t(lang, "Conflit : ce dossier a changé depuis son ouverture. Chargez la version récente ou dupliquez votre dossier.", "Conflict: this case changed since opening. Load the newest version or duplicate your research."));
      return;
    }
    const id = current?.id ?? uuid();
    const name = title.trim() || plan.instrument.trim() || t(lang, "Thèse sans titre", "Untitled thesis");
    const next = prepareSavedCase(id, name, plan, new Date().toISOString(), current?.createdAt);
    if (!next) {
      setMessage(t(lang, "Dossier invalide ou trop volumineux. Vérifiez les sources/annonces et exportez vos données.", "Case is invalid or too large. Check evidence and events and export your data."));
      return;
    }
    const updated = putSavedCase(latest, next);
    if (!updated) {
      setMessage(t(lang,
        `Limite atteinte : ${MAX_CASES} dossiers, ou bibliothèque trop volumineuse. Rien n'a été supprimé. Exportez ou retirez un ancien dossier manuellement.`,
        `Capacity reached: ${MAX_CASES} cases or library too large. Nothing was deleted. Export or remove an old case manually.`,
      ));
      return;
    }
    try {
      localStorage.setItem(CASE_LIBRARY_KEY, JSON.stringify(updated));
      setLibrary(updated);
      setCaseId(id);
      setTitle(name);
      setSavedTitle(name);
      setSavedFingerprint(JSON.stringify(plan));
      setSavedRecordFingerprint(JSON.stringify(next));
      setExternalChange(false);
      setCorrupt(false);
      setMessage(t(lang, "Dossier sauvegardé SUR CET APPAREIL uniquement, sans chiffrement ni synchronisation.", "Case saved ON THIS DEVICE only, without encryption or synchronization."));
    } catch {
      setMessage(t(lang, "Échec de stockage (quota ou mode privé). Rien n'a été supprimé. Exportez un fichier JSON.", "Storage failed (quota or private mode). Nothing was deleted. Export a JSON file."));
    }
  }
  function loadCase(entry: SavedTradeCase, asCopy = false) {
    if (dirty && !window.confirm(t(lang,
      "Remplacer l'analyse ouverte ? Les modifications non sauvegardées seront perdues.",
      "Replace the open analysis? Unsaved changes will be lost.",
    ))) return;
    const current = readStorage();
    if (!current) return;
    const fresh = current.cases.find((item) => item.id === entry.id);
    if (!fresh) {
      setMessage(t(lang, "Ce dossier n'existe plus. Liste actualisée.", "This case no longer exists. The list was refreshed."));
      setLibrary(current);
      return;
    }
    onLoad(fresh.plan);
    if (asCopy) {
      setCaseId(null);
      setTitle(fresh.title + t(lang, " — copie", " — copy"));
      setSavedTitle("");
      setSavedFingerprint("");
      setSavedRecordFingerprint(null);
      setMessage(t(lang, "Copie de travail créée. Enregistrez-la sous un nouveau dossier.", "Working copy created. Save it as a new case."));
    } else {
      setCaseId(fresh.id);
      setTitle(fresh.title);
      setSavedTitle(fresh.title);
      setSavedFingerprint(JSON.stringify(fresh.plan));
      setSavedRecordFingerprint(JSON.stringify(fresh));
      setMessage(t(lang, "Dossier ouvert. Les modifications futures ne sont pas sauvegardées automatiquement.", "Case opened. Future edits are not automatically saved."));
    }
    setLibrary(current);
    setExternalChange(false);
    setOpen(false);
  }
  function newCase() {
    if (dirty && !window.confirm(t(lang, "Créer une nouvelle analyse ? Les changements non sauvegardés seront perdus.", "Start a new analysis? Unsaved changes will be lost."))) return;
    const next = newTradePlan();
    onLoad(next);
    setCaseId(null);
    setTitle("");
    setSavedTitle("");
    setSavedFingerprint(JSON.stringify(next));
    setSavedRecordFingerprint(null);
    setOpen(false);
    setMessage(t(lang, "Nouveau dossier vierge, non sauvegardé.", "New blank unsaved dossier."));
  }
  function removeCase(entry: SavedTradeCase) {
    if (!window.confirm(t(lang, `Supprimer définitivement sur cet appareil « ${entry.title} » ? Cette action est irréversible.`,
      `Permanently remove "${entry.title}" from this device? This cannot be undone.`))) return;
    const latest = readStorage();
    if (!latest) return;
    const current = latest.cases.find((item) => item.id === entry.id);
    if (!current) { setLibrary(latest); return; }
    if (JSON.stringify(current) !== JSON.stringify(entry)) {
      setLibrary(latest);
      setMessage(t(lang, "Le dossier a changé dans une autre page : suppression refusée. Rechargez la bibliothèque.", "Case changed in another tab: deletion rejected. Refresh library."));
      return;
    }
    const updated = removeSavedCase(latest, entry.id);
    try {
      localStorage.setItem(CASE_LIBRARY_KEY, JSON.stringify(updated));
      setLibrary(updated);
      if (caseId === entry.id) {
        setCaseId(null);
        setSavedTitle("");
        setSavedFingerprint("");
        setSavedRecordFingerprint(null);
      }
      setMessage(t(lang, "Dossier supprimé du stockage local. L'analyse affichée reste intacte.", "Case removed from local storage. The open research remains unchanged."));
    } catch {
      setMessage(t(lang, "Suppression non enregistrée : stockage indisponible.", "Deletion not saved: storage unavailable."));
    }
  }
  function download(content: string, name: string, mime: string) {
    const url = URL.createObjectURL(new Blob([content], { type: mime }));
    const link = document.createElement("a");
    link.href = url;
    link.download = name;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  }
  function exportCase() {
    download(JSON.stringify({
      ...plan, exportedAt: new Date().toISOString(),
      disclaimer: "User-authored research only. No market feed, brokerage order, or server-attested timestamp.",
    }, null, 2), "world-vision-trade-plan.json", "application/json");
    setMessage(t(lang, "Dossier courant exporté. Aucun envoi à un serveur.", "Current case exported. Nothing was sent to a server."));
  }
  async function importFile(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    if (file.size > MAX_IMPORT_CHARS) {
      setMessage(t(lang, "Fichier trop volumineux. Import refusé.", "File too large. Import rejected."));
      return;
    }
    if (dirty && !window.confirm(t(lang, "Importer ce dossier et remplacer l'analyse non sauvegardée ?", "Import this dossier and replace unsaved research?"))) return;
    try {
      const imported = parseImportedTradePlan(await file.text());
      if (!imported) {
        setMessage(t(lang, "Format inconnu ou dossier invalide : aucune donnée importée.", "Unknown format or invalid dossier: no data imported."));
        return;
      }
      onLoad(imported);
      setCaseId(null);
      setTitle(imported.instrument || t(lang, "Analyse importée", "Imported research"));
      setSavedTitle("");
      setSavedFingerprint("");
      setSavedRecordFingerprint(null);
      setOpen(false);
      setMessage(t(lang, "Dossier importé dans l'éditeur seulement. Cliquez sur Enregistrer pour le conserver.", "Case imported into the editor only. Click Save to preserve it."));
    } catch {
      setMessage(t(lang, "Fichier illisible ou import non pris en charge.", "Unreadable file or unsupported import."));
    }
  }
  function loadLegacy() {
    if (dirty && !window.confirm(t(lang, "Remplacer l'analyse ouverte par l'ancien brouillon ?", "Replace open research with the older draft?"))) return;
    try {
      const raw = localStorage.getItem(LEGACY_DRAFT_KEY);
      const imported = raw && parseImportedTradePlan(raw);
      if (!imported) { setMessage(t(lang, "Aucun ancien brouillon valide.", "No valid legacy draft.")); return; }
      onLoad(imported);
      setCaseId(null);
      setTitle(imported.instrument || t(lang, "Ancien brouillon", "Legacy draft"));
      setSavedTitle("");
      setSavedFingerprint("");
      setSavedRecordFingerprint(null);
      setOpen(false);
      setMessage(t(lang, "Ancien brouillon retrouvé, sans effacer l'original. Enregistrez ce dossier si vous voulez le conserver dans la bibliothèque.", "Legacy draft recovered without deleting the original. Save to add it to the library."));
    } catch {
      setMessage(t(lang, "Ancien brouillon non accessible.", "Legacy draft unavailable."));
    }
  }
  function exportCorruptRaw() {
    try {
      const raw = localStorage.getItem(CASE_LIBRARY_KEY);
      if (raw === null) return;
      download(raw, "world-vision-corrupted-library-recovery.txt", "text/plain");
      setMessage(t(lang, "Copie brute enregistrée. Ne publiez pas ce fichier : il peut contenir vos analyses privées.", "Raw copy saved. Do not publish it: it may contain private research."));
    } catch {
      setMessage(t(lang, "Récupération impossible sur cet appareil.", "Recovery unavailable on this device."));
    }
  }
  function resetCorrupt() {
    if (!corrupt) return;
    if (!window.confirm(t(lang,
      "La bibliothèque illisible sera effacée de CET APPAREIL. Avez-vous téléchargé la copie brute ? Cette opération est irréversible.",
      "The unreadable library will be erased from THIS DEVICE. Did you download the raw copy? This cannot be undone.",
    ))) return;
    try {
      localStorage.removeItem(CASE_LIBRARY_KEY);
      setLibrary(emptyCaseLibrary());
      setCorrupt(false);
      setExternalChange(false);
      setCaseId(null);
      setSavedRecordFingerprint(null);
      setMessage(t(lang, "Bibliothèque locale réinitialisée. Le dossier actuellement ouvert n'a pas été effacé.", "Local library reset. The currently open dossier was not cleared."));
    } catch {
      setMessage(t(lang, "Réinitialisation impossible : stockage indisponible.", "Cannot reset: storage unavailable."));
    }
  }

  return <div className="tvp-library-root">
    <div className="tvp-case-context">
      <label htmlFor="tvp-case-title">{t(lang, "Nom du dossier de recherche", "Research case title")}
        <input id="tvp-case-title" maxLength={120} value={title}
          onChange={(event) => setTitle(event.target.value)}
          placeholder={t(lang, "Ex. EURCAD · divergence de politique monétaire", "E.g. EURCAD · central bank divergence")}/>
      </label>
      <span className="tvp-case-state">{caseId
        ? dirty ? t(lang, "Modifications non enregistrées", "Unsaved changes") : t(lang, "Dossier enregistré", "Saved case")
        : t(lang, "Analyse non enregistrée", "Unsaved research")}
        {" · "}{summary.completed}/7 {t(lang, "étapes renseignées", "stages documented")}
      </span>
    </div>
    <div className="tvp-footer-actions">
      <button type="button" onClick={saveCase}>{t(lang, "Enregistrer le dossier", "Save case")}</button>
      <button type="button" onClick={showLibrary} aria-expanded={open}>{t(lang, "Mes dossiers", "My cases")}</button>
      <button type="button" onClick={newCase}>{t(lang, "Nouvelle analyse", "New analysis")}</button>
      <button type="button" onClick={exportCase}>{t(lang, "Exporter JSON", "Export JSON")}</button>
      <label className="tvp-import-label">{t(lang, "Importer JSON", "Import JSON")}
        <input type="file" accept=".json,application/json" onChange={importFile} aria-label={t(lang, "Importer un dossier JSON", "Import a JSON case")}/>
      </label>
      <button type="button" onClick={loadLegacy}>{t(lang, "Récupérer ancien brouillon", "Recover older draft")}</button>
    </div>
    {externalChange && <p className="tvp-case-alert" role="alert">{t(lang,
      "Bibliothèque modifiée dans un autre onglet. Vérifiez les versions avant toute sauvegarde.",
      "Library changed in another tab. Check versions before saving.",
    )}</p>}
    {open && <section className="tvp-library-list" aria-label={t(lang, "Dossiers enregistrés localement", "Locally saved research cases")}>
      <div className="tvp-library-title">
        <div>
          <strong>{t(lang, "Bibliothèque locale", "Local case library")}</strong>
          <p>{t(lang, "Votre appareil seulement, sans chiffrement ni synchronisation.", "Only on this device, unencrypted and not synchronized.")}</p>
        </div>
        <button type="button" onClick={showLibrary}>{t(lang, "Actualiser", "Refresh")}</button>
        <button type="button" onClick={() => setOpen(false)}>{t(lang, "Fermer la liste", "Close list")}</button>
      </div>
      {corrupt ? <div className="tvp-case-alert" role="alert">
        <p>{t(lang, "Bibliothèque locale illisible : aucune sauvegarde ni suppression automatique.", "Local library unreadable: no automatic save or deletion.")}</p>
        <button type="button" onClick={exportCorruptRaw}>{t(lang, "Exporter les données brutes", "Export raw recovery data")}</button>
        <button type="button" onClick={resetCorrupt}>{t(lang, "Réinitialiser après sauvegarde", "Reset after backup")}</button>
      </div> : library?.cases.length ? (
        [...library.cases].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)).map((entry) => (
          <article className="tvp-case-row" key={entry.id}>
            <div>
              <strong>{entry.title}</strong>
              <small>{entry.plan.instrument || "—"} · {entry.plan.direction} · {timeString(entry.updatedAt, lang)}
                {" · "}{reviewPlan(entry.plan).completed}/7</small>
            </div>
            <div>
              <button type="button" onClick={() => loadCase(entry)}>{t(lang, "Ouvrir", "Open")}</button>
              <button type="button" onClick={() => loadCase(entry, true)}>{t(lang, "Dupliquer", "Duplicate")}</button>
              <button type="button" className="tvp-case-delete" onClick={() => removeCase(entry)}>{t(lang, "Supprimer", "Delete")}</button>
            </div>
          </article>
        ))
      ) : <p>{t(lang, "Aucun dossier enregistré. L'enregistrement est toujours une action volontaire.", "No saved cases. Saving is always a deliberate action.")}</p>}
      {!corrupt && <small>{library?.cases.length ?? 0}/{MAX_CASES} {t(lang, "dossiers", "cases")} · {t(lang, "capacité maximale", "max capacity")} {Math.round(MAX_LIBRARY_CHARS/1_000_000*10)/10} Mo</small>}
    </section>}
    <p className="tvp-storage-note">{t(lang,
      "Aucune sauvegarde automatique : vos modifications se perdent si vous fermez sans enregistrer. Le navigateur peut effacer ce stockage. Évitez les données personnelles, secrets et stratégies confidentielles sur un appareil partagé. L'export vous appartient.",
      "No autosave: changes disappear if you close without saving. The browser can delete local storage. Avoid personal data, secrets or confidential strategies on shared devices. You control the export.",
    )}</p>
    {message && <p className="tvp-feedback" role="status">{message}</p>}
  </div>;
}
