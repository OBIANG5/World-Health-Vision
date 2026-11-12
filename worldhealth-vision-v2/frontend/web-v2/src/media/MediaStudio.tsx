import { useEffect, useMemo, useState, type ReactNode } from "react";
import "./MediaStudio.css";
import type {
  EditorialScoreFactors,
  MediaDashboard,
  MediaStory,
  StoryStatus,
} from "./types";

const API_ROOT = "/api/media";

const STATUS_LABELS: Record<StoryStatus, string> = {
  detected: "Détecté",
  verifying: "Vérification",
  candidate: "À valider",
  approved: "Validé",
  scripting: "Script",
  assets: "Médias",
  rendering: "Rendu",
  qa: "Contrôle",
  preview_ready: "Aperçu prêt",
  changes_requested: "À corriger",
  publish_ready: "Prêt à publier",
  published: "Publié",
  rejected: "Refusé",
};

const FACTOR_LABELS: Record<keyof EditorialScoreFactors, string> = {
  freshness: "Fraîcheur",
  surprise: "Surprise",
  human_impact: "Impact humain",
  importance: "Importance",
  visual_potential: "Potentiel visuel",
  numerical_strength: "Force des chiffres",
  undercoverage: "Sous-couverture",
  francophone_relevance: "Pertinence francophone",
  africa_relevance: "Pertinence Afrique",
  source_confidence: "Confiance sources",
  urgency: "Urgence",
  saturation_penalty: "Saturation",
};

const PRODUCTION_STATUSES: StoryStatus[] = [
  "approved",
  "scripting",
  "assets",
  "rendering",
  "qa",
  "changes_requested",
];

function scoreTone(score: number) {
  if (score >= 90) return "hot";
  if (score >= 80) return "strong";
  if (score >= 65) return "medium";
  return "low";
}

function flagFromIso3(iso3?: string | null) {
  const flags: Record<string, string> = {
    GAB: "🇬🇦",
    COD: "🇨🇩",
    FRA: "🇫🇷",
    USA: "🇺🇸",
    UKR: "🇺🇦",
    NGA: "🇳🇬",
  };
  return (iso3 && flags[iso3]) || "🌍";
}

function dateLabel(value: string) {
  return new Intl.DateTimeFormat("fr-FR", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

function emptyDashboard(): MediaDashboard {
  return {
    total: 0,
    detected: 0,
    verifying: 0,
    candidates: 0,
    in_production: 0,
    preview_ready: 0,
    publish_ready: 0,
    published: 0,
    rejected: 0,
    top_score: 0,
  };
}

export default function MediaStudio() {
  const [stories, setStories] = useState<MediaStory[]>([]);
  const [dashboard, setDashboard] = useState<MediaDashboard>(emptyDashboard());
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [filter, setFilter] = useState<"all" | "priority" | "production" | "ready">("all");
  const [loading, setLoading] = useState(true);
  const [actionBusy, setActionBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selected = useMemo(
    () => stories.find((story) => story.id === selectedId) ?? stories[0] ?? null,
    [stories, selectedId],
  );

  const visibleStories = useMemo(() => {
    if (filter === "priority") return stories.filter((story) => story.score.total >= 85);
    if (filter === "production") {
      return stories.filter((story) => PRODUCTION_STATUSES.includes(story.status));
    }
    if (filter === "ready") {
      return stories.filter((story) =>
        ["preview_ready", "publish_ready"].includes(story.status),
      );
    }
    return stories;
  }, [stories, filter]);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const [storiesResponse, dashboardResponse] = await Promise.all([
        fetch(`${API_ROOT}/stories`),
        fetch(`${API_ROOT}/dashboard`),
      ]);
      if (!storiesResponse.ok || !dashboardResponse.ok) {
        throw new Error("Le Media Studio ne répond pas correctement.");
      }

      const nextStories = (await storiesResponse.json()) as MediaStory[];
      const nextDashboard = (await dashboardResponse.json()) as MediaDashboard;
      setStories(nextStories);
      setDashboard(nextDashboard);
      setSelectedId((current) => current ?? nextStories[0]?.id ?? null);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : String(caught));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  async function decision(
    story: MediaStory,
    action: "approve" | "reject" | "request_changes" | "mark_publish_ready",
  ) {
    setActionBusy(true);
    setError(null);
    try {
      const response = await fetch(`${API_ROOT}/stories/${story.id}/decision`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      if (!response.ok) {
        const detail = await response.text();
        throw new Error(`Action impossible (HTTP ${response.status}) : ${detail}`);
      }
      await load();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : String(caught));
    } finally {
      setActionBusy(false);
    }
  }

  async function selectHook(story: MediaStory, hookId: string) {
    setActionBusy(true);
    setError(null);
    try {
      const response = await fetch(`${API_ROOT}/stories/${story.id}/hooks/select`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ hook_id: hookId }),
      });
      if (!response.ok) {
        throw new Error(`Hook non enregistré (HTTP ${response.status})`);
      }
      const updated = (await response.json()) as MediaStory;
      setStories((items) => items.map((item) => (item.id === updated.id ? updated : item)));
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : String(caught));
    } finally {
      setActionBusy(false);
    }
  }

  return (
    <div className="wv-media-shell">
      <header className="wv-media-topbar">
        <div className="wv-media-brand">
          <div>
            <div className="wv-media-wordmark">WORLD-VISION</div>
            <div className="wv-media-brand-sub">MEDIA CONTROL ROOM · FR</div>
          </div>
        </div>

        <div className="wv-media-live">
          <span className="wv-media-live-dot" />
          RADAR PILOTE
        </div>

        <a className="wv-media-back" href="/">
          ← Logiciel principal
        </a>
      </header>

      <main className="wv-media-layout">
        <section className="wv-media-main">
          <div className="wv-media-hero">
            <div>
              <div className="wv-media-kicker">RÉDACTION AUTOMATISÉE · PHASE 1</div>
              <h1>Détecter vite. Vérifier mieux. Publier avant les autres.</h1>
              <p>
                Ce premier vertical slice classe les actualités, conserve leurs sources et
                te laisse choisir l’angle avant toute production.
              </p>
            </div>
            <div className="wv-media-hero-score">
              <span>TOP SCORE</span>
              <strong>{dashboard.top_score}</strong>
              <small>/100</small>
            </div>
          </div>

          <div className="wv-media-stats">
            <Stat label="Détectés" value={dashboard.total} />
            <Stat label="À valider" value={dashboard.candidates} />
            <Stat label="En production" value={dashboard.in_production} />
            <Stat label="Aperçus prêts" value={dashboard.preview_ready} />
            <Stat label="Prêts à publier" value={dashboard.publish_ready} />
            <Stat label="Publiés" value={dashboard.published} />
          </div>

          <div className="wv-media-toolbar">
            <div className="wv-media-tabs">
              <FilterButton active={filter === "all"} onClick={() => setFilter("all")}>Tout</FilterButton>
              <FilterButton active={filter === "priority"} onClick={() => setFilter("priority")}>🔥 Priorité</FilterButton>
              <FilterButton active={filter === "production"} onClick={() => setFilter("production")}>Production</FilterButton>
              <FilterButton active={filter === "ready"} onClick={() => setFilter("ready")}>À relire</FilterButton>
            </div>
            <button className="wv-media-refresh" onClick={() => void load()} disabled={loading}>
              {loading ? "Actualisation…" : "↻ Actualiser"}
            </button>
          </div>

          {error && (
            <div className="wv-media-error">
              <strong>Media Studio :</strong> {error}
            </div>
          )}

          <div className="wv-media-story-list">
            {visibleStories.map((story) => (
              <button
                key={story.id}
                className={`wv-media-story-card ${selected?.id === story.id ? "selected" : ""}`}
                onClick={() => setSelectedId(story.id)}
              >
                <div className="wv-media-story-score" data-tone={scoreTone(story.score.total)}>
                  <strong>{story.score.total}</strong>
                  <span>/100</span>
                </div>
                <div className="wv-media-story-body">
                  <div className="wv-media-story-meta">
                    <span>{flagFromIso3(story.country_iso3)} {story.country_name ?? "Monde"}</span>
                    <span>•</span>
                    <span>{story.category}</span>
                    <span>•</span>
                    <span>{dateLabel(story.detected_at)}</span>
                  </div>
                  <h2>{story.title}</h2>
                  <p>{story.summary}</p>
                  <div className="wv-media-story-chips">
                    <span className={`wv-media-status status-${story.status}`}>
                      {STATUS_LABELS[story.status]}
                    </span>
                    <span>{story.sources.length} sources</span>
                    <span>{story.assets.photos + story.assets.videos} médias</span>
                    <span>Confiance {story.confidence_score}%</span>
                  </div>
                </div>
                <div className="wv-media-story-arrow">›</div>
              </button>
            ))}

            {!loading && visibleStories.length === 0 && (
              <div className="wv-media-empty">Aucun sujet dans cette vue.</div>
            )}
          </div>
        </section>

        <aside className="wv-media-inspector">
          {selected ? (
            <StoryInspector
              story={selected}
              busy={actionBusy}
              onDecision={decision}
              onSelectHook={selectHook}
            />
          ) : (
            <div className="wv-media-empty">Sélectionne une actualité.</div>
          )}
        </aside>
      </main>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="wv-media-stat">
      <strong>{value}</strong>
      <span>{label}</span>
    </div>
  );
}

function FilterButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button className={`wv-media-tab ${active ? "active" : ""}`} onClick={onClick}>
      {children}
    </button>
  );
}

function StoryInspector({
  story,
  busy,
  onDecision,
  onSelectHook,
}: {
  story: MediaStory;
  busy: boolean;
  onDecision: (
    story: MediaStory,
    action: "approve" | "reject" | "request_changes" | "mark_publish_ready",
  ) => Promise<void>;
  onSelectHook: (story: MediaStory, hookId: string) => Promise<void>;
}) {
  const scoreEntries = Object.entries(story.score.factors) as [
    keyof EditorialScoreFactors,
    number,
  ][];

  return (
    <>
      <div className="wv-media-inspector-head">
        <div>
          <span className="wv-media-inspector-country">
            {flagFromIso3(story.country_iso3)} {story.country_name ?? "Monde"}
          </span>
          <h2>{story.title}</h2>
        </div>
        <div className="wv-media-big-score" data-tone={scoreTone(story.score.total)}>
          {story.score.total}
        </div>
      </div>

      <div className="wv-media-inspector-summary">{story.summary}</div>

      <section className="wv-media-panel">
        <div className="wv-media-panel-title">
          <span>Pourquoi ce score ?</span>
          <small>{story.score.model_version}</small>
        </div>
        <div className="wv-media-score-grid">
          {scoreEntries.map(([key, value]) => (
            <div className="wv-media-factor" key={key}>
              <div>
                <span>{FACTOR_LABELS[key]}</span>
                <strong>{value}</strong>
              </div>
              <div className="wv-media-factor-track">
                <div
                  className={key === "saturation_penalty" ? "penalty" : ""}
                  style={{ width: `${value}%` }}
                />
              </div>
            </div>
          ))}
        </div>
        <ul className="wv-media-reasons">
          {story.score.reasons.map((reason) => <li key={reason}>{reason}</li>)}
        </ul>
      </section>

      <section className="wv-media-panel">
        <div className="wv-media-panel-title">
          <span>Sources & vérification</span>
          <span className={`wv-media-verify verify-${story.verification_status}`}>
            {story.verification_status === "verified" ? "✓ Vérifié" : story.verification_status}
          </span>
        </div>
        <div className="wv-media-source-list">
          {story.sources.map((source) => (
            <a key={source.id} href={source.url} target="_blank" rel="noreferrer">
              <div>
                <strong>{source.name}</strong>
                <span>
                  {source.scope === "local" ? "Source locale" : source.scope}
                  {source.is_primary ? " · primaire" : ""}
                </span>
              </div>
              <span>↗</span>
            </a>
          ))}
        </div>
      </section>

      <section className="wv-media-panel">
        <div className="wv-media-panel-title">
          <span>Hooks proposés</span>
          <small>{story.target_duration_sec}s cible</small>
        </div>
        <div className="wv-media-hooks">
          {[...story.hooks].sort((a, b) => b.score - a.score).map((hook) => {
            const isSelected = story.selected_hook_id === hook.id;
            return (
              <button
                key={hook.id}
                className={`wv-media-hook ${isSelected ? "selected" : ""}`}
                onClick={() => void onSelectHook(story, hook.id)}
                disabled={busy}
              >
                <span className="wv-media-hook-score">{hook.score}</span>
                <span className="wv-media-hook-text">
                  <strong>{hook.text}</strong>
                  <small>{hook.rationale}</small>
                </span>
                <span>{isSelected ? "✓" : "○"}</span>
              </button>
            );
          })}
        </div>
      </section>

      <section className="wv-media-panel">
        <div className="wv-media-panel-title">
          <span>Inventaire médias</span>
          <small>droits à vérifier avant rendu</small>
        </div>
        <div className="wv-media-assets">
          <span><strong>{story.assets.photos}</strong> photos</span>
          <span><strong>{story.assets.videos}</strong> vidéos</span>
          <span><strong>{story.assets.official_documents}</strong> docs officiels</span>
          <span><strong>{story.assets.maps_or_charts}</strong> cartes / graphiques</span>
        </div>
      </section>

      <section className="wv-media-panel">
        <div className="wv-media-panel-title">
          <span>Contrôle qualité</span>
          <small>{dateLabel(story.updated_at)}</small>
        </div>
        <div className="wv-media-qa">
          <Qa label="Faits" value={story.qa.facts} />
          <Qa label="Orthographe" value={story.qa.spelling} />
          <Qa label="Safe zones TikTok" value={story.qa.safe_zones} />
          <Qa label="Logo" value={story.qa.logo_integrity} />
          <Qa label="Sources affichées" value={story.qa.source_display} />
          <Qa label="Droits" value={story.qa.rights} />
          <Qa label="Audio" value={story.qa.audio} />
        </div>
      </section>

      <div className="wv-media-actions">
        {story.status === "candidate" && (
          <>
            <button className="wv-media-action primary" disabled={busy} onClick={() => void onDecision(story, "approve")}>
              ✓ Valider l’idée
            </button>
            <button className="wv-media-action secondary" disabled={busy} onClick={() => void onDecision(story, "request_changes")}>
              ↻ Autre angle
            </button>
            <button className="wv-media-action danger" disabled={busy} onClick={() => void onDecision(story, "reject")}>
              Refuser
            </button>
          </>
        )}

        {story.status !== "candidate" && story.status !== "rejected" && story.status !== "published" && (
          <>
            <button className="wv-media-action primary" disabled={busy} onClick={() => void onDecision(story, "mark_publish_ready")}>
              ✓ Marquer prêt à publier
            </button>
            <button className="wv-media-action secondary" disabled={busy} onClick={() => void onDecision(story, "request_changes")}>
              Demander une correction
            </button>
          </>
        )}

        {story.status === "rejected" && (
          <div className="wv-media-rejected-note">Sujet refusé pour le moment.</div>
        )}
      </div>
    </>
  );
}

function Qa({
  label,
  value,
}: {
  label: string;
  value: "pending" | "pass" | "fail";
}) {
  return (
    <div className={`wv-media-qa-row qa-${value}`}>
      <span>{label}</span>
      <strong>{value === "pass" ? "OK" : value === "fail" ? "ÉCHEC" : "EN ATTENTE"}</strong>
    </div>
  );
}
