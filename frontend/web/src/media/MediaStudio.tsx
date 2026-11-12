import { useEffect, useMemo, useState } from "react";
import "./MediaStudio.css";
import type {
  EditorialScoreFactors,
  MediaDashboard,
  MediaStory,
  StoryStatus,
} from "./types";

const API_BASE = "http://127.0.0.1:8000";

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

function dateLabel(value: string) {
  const date = new Date(value);
  return new Intl.DateTimeFormat("fr-FR", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function elapsedLabel(value: string) {
  const delta = Math.max(0, Date.now() - new Date(value).getTime());
  const minutes = Math.floor(delta / 60000);
  if (minutes < 1) return "à l'instant";
  if (minutes < 60) return `il y a ${minutes} min`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `il y a ${hours} h`;
  const days = Math.floor(hours / 24);
  return `il y a ${days} j`;
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
    [stories, selectedId]
  );

  const visibleStories = useMemo(() => {
    if (filter === "priority") return stories.filter((story) => story.score.total >= 85);
    if (filter === "production") {
      return stories.filter((story) => PRODUCTION_STATUSES.includes(story.status));
    }
    if (filter === "ready") {
      return stories.filter((story) =>
        ["preview_ready", "publish_ready"].includes(story.status)
      );
    }
    return stories;
  }, [stories, filter]);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const [storiesResponse, dashboardResponse] = await Promise.all([
        fetch(`${API_BASE}/media/stories`),
        fetch(`${API_BASE}/media/dashboard`),
      ]);

      if (!storiesResponse.ok || !dashboardResponse.ok) {
        throw new Error("Le backend Media Studio ne répond pas correctement.");
      }

      const nextStories = (await storiesResponse.json()) as MediaStory[];
      const nextDashboard = (await dashboardResponse.json()) as MediaDashboard;

      setStories(nextStories);
      setDashboard(nextDashboard);
      setSelectedId((current) => current ?? nextStories[0]?.id ?? null);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function decision(
    story: MediaStory,
    action: "approve" | "reject" | "request_changes" | "mark_publish_ready"
  ) {
    setActionBusy(true);
    setError(null);
    try {
      const response = await fetch(`${API_BASE}/media/stories/${story.id}/decision`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      if (!response.ok) throw new Error(`Action impossible (HTTP ${response.status})`);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setActionBusy(false);
    }
  }

  async function selectHook(story: MediaStory, hookId: string) {
    setActionBusy(true);
    setError(null);
    try {
      const response = await fetch(`${API_BASE}/media/stories/${story.id}/hooks/select`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ hook_id: hookId }),
      });
      if (!response.ok) throw new Error(`Hook non enregistré (HTTP ${response.status})`);
      const updated = (await response.json()) as MediaStory;
      setStories((items) => items.map((item) => (item.id === updated.id ? updated : item)));
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setActionBusy(false);
    }
  }

  return (
    <div className="media-shell">
      <header className="media-topbar">
        <div className="media-brand">
          <div className="media-eye" aria-hidden="true">◉</div>
          <div>
            <div className="media-brand-line">WORLD-VISION</div>
            <div className="media-brand-sub">MEDIA CONTROL ROOM · FR</div>
          </div>
        </div>

        <div className="media-live">
          <span className="media-live-dot" />
          RADAR EN VEILLE
        </div>

        <a className="media-back" href="/">
          ← Logiciel principal
        </a>
      </header>

      <main className="media-layout">
        <section className="media-main">
          <div className="media-hero">
            <div>
              <div className="media-kicker">RÉDACTION AUTOMATISÉE · PHASE 1</div>
              <h1>Détecter vite. Vérifier mieux. Publier avant les autres.</h1>
              <p>
                Le système classe les actualités par potentiel éditorial, garde leurs sources
                et te laisse valider chaque étape avant production.
              </p>
            </div>
            <div className="media-hero-score">
              <span>TOP SCORE</span>
              <strong>{dashboard.top_score}</strong>
              <small>/100</small>
            </div>
          </div>

          <div className="media-stats">
            <Stat label="Détectés" value={dashboard.total} />
            <Stat label="À valider" value={dashboard.candidates} />
            <Stat label="En production" value={dashboard.in_production} />
            <Stat label="Aperçus prêts" value={dashboard.preview_ready} />
            <Stat label="Prêts à publier" value={dashboard.publish_ready} />
            <Stat label="Publiés" value={dashboard.published} />
          </div>

          <div className="media-toolbar">
            <div className="media-tabs">
              <FilterButton active={filter === "all"} onClick={() => setFilter("all")}>
                Tout
              </FilterButton>
              <FilterButton active={filter === "priority"} onClick={() => setFilter("priority")}>
                🔥 Priorité
              </FilterButton>
              <FilterButton active={filter === "production"} onClick={() => setFilter("production")}>
                Production
              </FilterButton>
              <FilterButton active={filter === "ready"} onClick={() => setFilter("ready")}>
                À relire
              </FilterButton>
            </div>

            <button className="media-refresh" onClick={load} disabled={loading}>
              {loading ? "Actualisation…" : "↻ Actualiser"}
            </button>
          </div>

          {error && (
            <div className="media-error">
              <strong>Connexion Media Studio :</strong> {error}
            </div>
          )}

          <div className="media-story-list">
            {visibleStories.map((story) => (
              <button
                key={story.id}
                className={`media-story-card ${selected?.id === story.id ? "selected" : ""}`}
                onClick={() => setSelectedId(story.id)}
              >
                <div className="media-story-score" data-tone={scoreTone(story.score.total)}>
                  <strong>{story.score.total}</strong>
                  <span>/100</span>
                </div>

                <div className="media-story-body">
                  <div className="media-story-meta">
                    <span>{flagFromIso3(story.country_iso3)} {story.country_name ?? "Monde"}</span>
                    <span>•</span>
                    <span>{story.category}</span>
                    <span>•</span>
                    <span>{elapsedLabel(story.detected_at)}</span>
                  </div>
                  <h2>{story.title}</h2>
                  <p>{story.summary}</p>
                  <div className="media-story-chips">
                    <span className={`media-status status-${story.status}`}>
                      {STATUS_LABELS[story.status]}
                    </span>
                    <span>{story.sources.length} sources</span>
                    <span>{story.assets.photos + story.assets.videos} médias</span>
                    <span>Confiance {story.confidence_score}%</span>
                  </div>
                </div>

                <div className="media-story-arrow">›</div>
              </button>
            ))}

            {!loading && visibleStories.length === 0 && (
              <div className="media-empty">Aucun sujet dans cette vue.</div>
            )}
          </div>
        </section>

        <aside className="media-inspector">
          {!selected ? (
            <div className="media-empty">Sélectionne une actualité.</div>
          ) : (
            <StoryInspector
              story={selected}
              busy={actionBusy}
              onDecision={decision}
              onSelectHook={selectHook}
            />
          )}
        </aside>
      </main>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="media-stat">
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
  children: React.ReactNode;
}) {
  return (
    <button className={`media-tab ${active ? "active" : ""}`} onClick={onClick}>
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
    action: "approve" | "reject" | "request_changes" | "mark_publish_ready"
  ) => Promise<void>;
  onSelectHook: (story: MediaStory, hookId: string) => Promise<void>;
}) {
  const scoreEntries = Object.entries(story.score.factors) as [
    keyof EditorialScoreFactors,
    number
  ][];

  return (
    <>
      <div className="media-inspector-head">
        <div>
          <span className="media-inspector-country">
            {flagFromIso3(story.country_iso3)} {story.country_name ?? "Monde"}
          </span>
          <h2>{story.title}</h2>
        </div>
        <div className="media-big-score" data-tone={scoreTone(story.score.total)}>
          {story.score.total}
        </div>
      </div>

      <div className="media-inspector-summary">{story.summary}</div>

      <section className="media-panel">
        <div className="media-panel-title">
          <span>Pourquoi ce score ?</span>
          <small>{story.score.model_version}</small>
        </div>
        <div className="media-score-grid">
          {scoreEntries.map(([key, value]) => (
            <div className="media-factor" key={key}>
              <div>
                <span>{FACTOR_LABELS[key]}</span>
                <strong>{value}</strong>
              </div>
              <div className="media-factor-track">
                <div
                  className={key === "saturation_penalty" ? "penalty" : ""}
                  style={{ width: `${value}%` }}
                />
              </div>
            </div>
          ))}
        </div>
        <ul className="media-reasons">
          {story.score.reasons.map((reason) => (
            <li key={reason}>{reason}</li>
          ))}
        </ul>
      </section>

      <section className="media-panel">
        <div className="media-panel-title">
          <span>Sources & vérification</span>
          <span className={`verify verify-${story.verification_status}`}>
            {story.verification_status === "verified" ? "✓ Vérifié" : story.verification_status}
          </span>
        </div>
        <div className="media-source-list">
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

      <section className="media-panel">
        <div className="media-panel-title">
          <span>Hooks proposés</span>
          <small>{story.target_duration_sec}s cible</small>
        </div>
        <div className="media-hooks">
          {story.hooks
            .slice()
            .sort((a, b) => b.score - a.score)
            .map((hook) => {
              const selected = story.selected_hook_id === hook.id;
              return (
                <button
                  key={hook.id}
                  className={`media-hook ${selected ? "selected" : ""}`}
                  onClick={() => onSelectHook(story, hook.id)}
                  disabled={busy}
                >
                  <span className="media-hook-score">{hook.score}</span>
                  <span className="media-hook-text">
                    <strong>{hook.text}</strong>
                    <small>{hook.rationale}</small>
                  </span>
                  <span>{selected ? "✓" : "○"}</span>
                </button>
              );
            })}
        </div>
      </section>

      <section className="media-panel">
        <div className="media-panel-title">
          <span>Inventaire médias</span>
          <small>droits à vérifier avant rendu</small>
        </div>
        <div className="media-assets">
          <span><strong>{story.assets.photos}</strong> photos</span>
          <span><strong>{story.assets.videos}</strong> vidéos</span>
          <span><strong>{story.assets.official_documents}</strong> docs officiels</span>
          <span><strong>{story.assets.maps_or_charts}</strong> cartes / graphiques</span>
        </div>
      </section>

      <section className="media-panel">
        <div className="media-panel-title">
          <span>Contrôle qualité</span>
          <small>{dateLabel(story.updated_at)}</small>
        </div>
        <div className="media-qa">
          <Qa label="Faits" value={story.qa.facts} />
          <Qa label="Orthographe" value={story.qa.spelling} />
          <Qa label="Safe zones TikTok" value={story.qa.safe_zones} />
          <Qa label="Logo" value={story.qa.logo_integrity} />
          <Qa label="Sources affichées" value={story.qa.source_display} />
          <Qa label="Droits" value={story.qa.rights} />
          <Qa label="Audio" value={story.qa.audio} />
        </div>
      </section>

      <div className="media-actions">
        {story.status === "candidate" && (
          <>
            <button
              className="media-action primary"
              disabled={busy}
              onClick={() => onDecision(story, "approve")}
            >
              ✓ Valider l'idée
            </button>
            <button
              className="media-action secondary"
              disabled={busy}
              onClick={() => onDecision(story, "request_changes")}
            >
              ↻ Autre angle
            </button>
            <button
              className="media-action danger"
              disabled={busy}
              onClick={() => onDecision(story, "reject")}
            >
              Refuser
            </button>
          </>
        )}

        {story.status !== "candidate" && story.status !== "rejected" && (
          <>
            <button
              className="media-action primary"
              disabled={busy}
              onClick={() => onDecision(story, "mark_publish_ready")}
            >
              ✓ Marquer prêt à publier
            </button>
            <button
              className="media-action secondary"
              disabled={busy}
              onClick={() => onDecision(story, "request_changes")}
            >
              Demander une correction
            </button>
          </>
        )}

        {story.status === "rejected" && (
          <div className="media-rejected-note">Sujet refusé pour le moment.</div>
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
    <div className={`media-qa-row qa-${value}`}>
      <span>{label}</span>
      <strong>{value === "pass" ? "OK" : value === "fail" ? "ÉCHEC" : "EN ATTENTE"}</strong>
    </div>
  );
}
