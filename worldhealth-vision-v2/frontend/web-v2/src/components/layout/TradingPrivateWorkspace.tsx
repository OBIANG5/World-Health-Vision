import { useEffect, useMemo, useRef, useState } from "react";
import { useLang } from "../../context/LanguageContext";
import type { ResearchIdentity } from "../../auth/researchIdentity";
import { PrivateCaseApi, PrivateCaseApiError, type PrivateCase, type PrivateCaseSummary } from "../../trading/privateCaseApi";
import type { TradePlan } from "../../trading/tradePlan";

const label = (lang: "fr" | "en", fr: string, en: string) => lang === "fr" ? fr : en;
const friendlyError = (lang: "fr" | "en", error: unknown): string => {
  const code = error instanceof PrivateCaseApiError ? error.code : "unavailable";
  switch (code) {
    case "unauthenticated": return label(lang, "Session absente ou expirée. Aucun dossier n'a été envoyé.", "Session missing or expired. No case was sent.");
    case "forbidden": return label(lang, "Cette session ne possède pas les droits nécessaires.", "This session does not have the required permission.");
    case "missing": return label(lang, "Dossier introuvable dans ce compte. Aucun autre utilisateur ne peut le consulter.", "Case missing in this account. Another user's case cannot be opened.");
    case "stale": return label(lang, "Conflit de version (412) : le serveur a changé. Vos modifications restent dans l'éditeur. Rechargez volontairement la version distante ou créez un nouveau dossier.", "Version conflict (412): server changed. Your edits remain in the editor. Explicitly reload the remote case or create a new one.");
    case "precondition": return label(lang, "Précondition de version requise. Aucun écrasement tenté.", "Version precondition required. No overwrite attempted.");
    case "quota": return label(lang, "Limite de stockage ou de débit atteinte. Aucun dossier effacé.", "Storage or rate limit reached. No case was removed.");
    case "invalid": return label(lang, "Dossier invalide : vérifiez les champs et les sources originales.", "Invalid case: review the fields and original sources.");
    case "offline": return label(lang, "Réseau indisponible. Aucune synchronisation effectuée.", "Network unavailable. Nothing was synchronized.");
    case "untrusted": return label(lang, "Réponse du serveur non conforme. Données distantes ignorées.", "Unexpected server response. Remote data was ignored.");
    default: return label(lang, "Le service distant est indisponible. Votre analyse affichée reste intacte.", "Remote service unavailable. Your open research remains unchanged.");
  }
};

/**
 * Distinct from P0C localStorage. No automatic reads or writes, no local
 * migration on mount, no impersonation, no copying a token to browser storage.
 * A real OIDC session is a hard requirement, not a display-only checkbox.
 */
export default function TradingPrivateWorkspace({ plan, onOpen, identity }: {
  plan: TradePlan;
  onOpen: (newPlan: TradePlan) => void;
  identity: ResearchIdentity | null;
}) {
  const lang = useLang();
  const [remoteCases, setRemoteCases] = useState<PrivateCaseSummary[] | null>(null);
  const [active, setActive] = useState<PrivateCase | null>(null);
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const inFlight = useRef(false);
  const stillMounted = useRef(true);
  const abort = useRef(new AbortController());

  useEffect(() => () => {
    stillMounted.current = false;
    abort.current.abort();
  }, []);

  const api = useMemo(() => identity ?
    new PrivateCaseApi(identity, undefined, abort.current.signal) : null,
    [identity]);

  // Never display stale data from a previous account or imply it is synced.
  if (!identity || !api) {
    return <section className="tvp-remote-workspace" aria-label={label(lang, "Espace privé distant", "Private remote workspace")}>
      <h4>{label(lang, "Espace privé multi-appareils", "Private multi-device workspace")}</h4>
      <p>{label(lang,
        "Le serveur privé a été développé et testé. La connexion OIDC/PKCE n'est pas encore configurée : aucun envoi de vos dossiers, aucune synchronisation et aucun compte fictif.",
        "The private backend has been developed and tested. OIDC/PKCE sign-in is not yet configured: no upload, synchronization or simulated account."
      )}</p>
    </section>;
  }

  async function operation(task: (client: PrivateCaseApi) => Promise<void>) {
    if (!api || inFlight.current) return;
    inFlight.current = true;
    setBusy(true);
    setMessage("");
    try {
      await task(api);
    } catch (error) {
      if (!stillMounted.current) return;
      if (error instanceof PrivateCaseApiError &&
        (error.code === "unauthenticated" || error.code === "forbidden")) {
        setRemoteCases(null);
        setActive(null);
      }
      setMessage(friendlyError(lang, error));
    } finally {
      if (stillMounted.current) setBusy(false);
      inFlight.current = false;
    }
  }

  function refresh() {
    void operation(async (client) => {
      const cases = await client.list();
      if (!stillMounted.current) return;
      setRemoteCases(cases);
      setMessage(label(lang, "Liste distante reçue. Aucun dossier n'a été ouvert ni transféré automatiquement.", "Remote list fetched. No case was automatically opened or uploaded."));
    });
  }

  function openRemote(entry: PrivateCaseSummary) {
    if (!window.confirm(label(lang,
      "Remplacer l'analyse affichée par ce dossier distant ? Les modifications non sauvegardées de l'éditeur pourraient être perdues.",
      "Replace the open research with this remote case? Unsaved editor changes may be lost."
    ))) return;
    void operation(async (client) => {
      const latest = await client.get(entry.id);
      if (!stillMounted.current) return;
      onOpen(latest.plan);
      setActive(latest);
      setTitle(latest.title);
      setMessage(label(lang, "Dossier distant ouvert. Aucun enregistrement automatique.", "Remote case opened. No automatic save."));
    });
  }

  function createRemote() {
    const name = title.trim() || plan.instrument.trim();
    if (!name) {
      setMessage(label(lang, "Donnez un nom au dossier avant l'envoi.", "Name the case before uploading."));
      return;
    }
    if (!window.confirm(label(lang,
      "Envoyer explicitement CETTE analyse sur votre espace privé ? Elle quittera cet appareil. Aucune bibliothèque locale complète ne sera importée.",
      "Explicitly upload THIS analysis to your private workspace? It will leave this device. Your entire local case library will NOT be imported."
    ))) return;
    void operation(async (client) => {
      const created = await client.create(name, plan);
      if (!stillMounted.current) return;
      setActive(created);
      setTitle(created.title);
      setRemoteCases(null); // require explicit refresh: avoid stale partial lists
      setMessage(label(lang, "Nouveau dossier distant enregistré dans ce compte uniquement. La bibliothèque locale est inchangée.", "New remote case saved in this account only. Local library is unchanged."));
    });
  }

  function saveRemote() {
    if (!active) return;
    const name = title.trim();
    if (!name) {
      setMessage(label(lang, "Un titre valide est requis.", "A valid title is required."));
      return;
    }
    if (!window.confirm(label(lang,
      `Enregistrer explicitement une nouvelle version du dossier distant « ${active.title} » (version ${active.version}) ?`,
      `Explicitly save a new remote version of “${active.title}” (version ${active.version})?`
    ))) return;
    const expected = active;
    void operation(async (client) => {
      const saved = await client.update(expected.id, expected.etag, name, plan);
      if (!stillMounted.current) return;
      setActive(saved);
      setRemoteCases(null);
      setMessage(label(lang, `Version ${saved.version} enregistrée sur le serveur.`,
        `Server version ${saved.version} saved.`));
    });
  }

  function deleteRemote() {
    if (!active) return;
    if (!window.confirm(label(lang,
      `Supprimer définitivement le dossier distant « ${active.title} » et tout son historique de ce compte ? L'analyse visible et la bibliothèque locale resteront inchangées.`,
      `Permanently delete remote case “${active.title}” AND its history from this account? Open research and the local library remain unchanged.`
    ))) return;
    const expected = active;
    void operation(async (client) => {
      await client.remove(expected.id, expected.etag);
      if (!stillMounted.current) return;
      setActive(null);
      setRemoteCases(null);
      setMessage(label(lang, "Dossier et historique supprimés du serveur. Analyse affichée conservée en mémoire.", "Remote case and history deleted. Current editor remains in memory."));
    });
  }

  function detachRemote() {
    setActive(null);
    setTitle("");
    setMessage(label(lang, "Dossier distant détaché. L'analyse affichée est conservée, mais n'est plus liée à un dossier distant.", "Remote case detached. Open research stays visible but is no longer linked to a remote case."));
  }

  return <section className="tvp-remote-workspace" aria-label={label(lang, "Espace privé distant", "Private remote workspace")}>
    <h4>{label(lang, "Espace privé multi-appareils", "Private multi-device workspace")}</h4>
    <p className="tvp-storage-note">{label(lang,
      `Session du fournisseur : ${identity.providerLabel}. Chaque opération est volontaire et requiert un jeton d'accès encore valide. Aucun mot de passe ou jeton n'est enregistré dans la bibliothèque locale.`,
      `Provider session: ${identity.providerLabel}. Each action is explicit and requires a valid access token. No password or token is saved in the local library.`
    )}</p>
    <div className="tvp-case-context">
      <label htmlFor="tvp-remote-title">{label(lang, "Titre sur le serveur", "Server case title")}
        <input id="tvp-remote-title" maxLength={120} value={title}
          onChange={(event) => setTitle(event.target.value)}
          placeholder={label(lang, "Ex. Hypothèse EURCAD", "E.g. EURCAD hypothesis")} />
      </label>
      <small>{active ?
        label(lang, `Dossier distant version ${active.version} (modification manuelle)`,
          `Remote case version ${active.version} (manual update)`) :
        label(lang, "Aucun dossier distant lié à l'éditeur", "No remote case attached to this editor")}</small>
    </div>
    <div className="tvp-footer-actions">
      <button type="button" disabled={busy} onClick={refresh}>{label(lang, "Afficher mes dossiers distants", "Show my remote cases")}</button>
      <button type="button" disabled={busy} onClick={createRemote}>{label(lang, "Créer une copie privée sur le serveur", "Create a private server copy")}</button>
      <button type="button" disabled={busy || !active} onClick={saveRemote}>{label(lang, "Enregistrer nouvelle version distante", "Save next remote version")}</button>
      <button type="button" disabled={busy || !active} onClick={detachRemote}>{label(lang, "Détacher", "Detach")}</button>
      <button type="button" className="tvp-case-delete" disabled={busy || !active}
        onClick={deleteRemote}>{label(lang, "Supprimer dossier distant", "Delete remote case")}</button>
    </div>
    {remoteCases && <div className="tvp-library-list">
      <strong>{label(lang, "Dossiers de ce compte", "Cases in this account")} ({remoteCases.length})</strong>
      {remoteCases.length ? remoteCases.map((entry) => <article className="tvp-case-row" key={entry.id}>
        <div>
          <strong>{entry.title}</strong>
          <small>v{entry.version} · {new Date(entry.updatedAt).toLocaleString(lang === "fr" ? "fr-FR" : "en-GB")}</small>
        </div>
        <button type="button" disabled={busy} onClick={() => openRemote(entry)}>{label(lang, "Ouvrir explicitement", "Open explicitly")}</button>
      </article>) : <p>{label(lang, "Aucun dossier distant enregistré.", "No remote cases stored.")}</p>}
    </div>}
    {message && <p role="status" className="tvp-feedback">{message}</p>}
  </section>;
}
