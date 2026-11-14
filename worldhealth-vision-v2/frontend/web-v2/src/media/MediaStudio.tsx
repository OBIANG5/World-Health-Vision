import { useEffect, useMemo, useState, type ReactNode } from "react";
import "./MediaStudio.css";
import ProductionJourney from "./ProductionJourney";
import ReviewStudio from "./ReviewStudio";
import type {
  EditorialScoreFactors,
  MediaDashboard,
  MediaStory,
  RadarScanHistoryItem,
  RadarScanResult,
  RadarSchedulerStatus,
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
  const [screen, setScreen] = useState<"journey" | "review" | "desk">(() => {
    const param = new URLSearchParams(window.location.search).get("screen");
    return param === "desk" || param === "review" ? param : "journey";
  });
  const previewMode = import.meta.env.VITE_WHV_PREVIEW_MODE === "true";
  const [previewRelease, setPreviewRelease] = useState<string | null>(null);
  useEffect(() => {
    if (!previewMode) return;
    const controller = new AbortController();
    fetch("./preview-deployment.json", {cache:"no-store",signal:controller.signal})
      .then(async (response) => response.ok ? response.json() : null)
      .then((meta:unknown) => {
        if (meta && typeof meta === "object" && "source_commit" in meta) {
          const commit = (meta as {source_commit?:unknown}).source_commit;
          if (typeof commit === "string" && /^[a-f0-9]{40}$/.test(commit)) setPreviewRelease(commit);
        }
      }).catch(() => undefined);
    return () => controller.abort();
  }, [previewMode]);
  const [stories, setStories] = useState<MediaStory[]>([]);
  const [dashboard, setDashboard] = useState<MediaDashboard>(emptyDashboard());
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [filter, setFilter] = useState<"all" | "priority" | "production" | "ready">("all");
  const [loading, setLoading] = useState(true);
  const [actionBusy, setActionBusy] = useState(false);
  const [radarBusy, setRadarBusy] = useState(false);
  const [radarHours, setRadarHours] = useState(6);
  const [radarCountry, setRadarCountry] = useState("");
  const [radarResult, setRadarResult] = useState<RadarScanResult | null>(null);
  const [radarHistory, setRadarHistory] = useState<RadarScanHistoryItem[]>([]);
  const [schedulerStatus, setSchedulerStatus] = useState<RadarSchedulerStatus | null>(null);
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
      const [storiesResponse, dashboardResponse, schedulerResponse, historyResponse] = await Promise.all([
        fetch(`${API_ROOT}/stories`),
        fetch(`${API_ROOT}/dashboard`),
        fetch(`${API_ROOT}/radar/scheduler`),
        fetch(`${API_ROOT}/radar/scans/history?limit=5`),
      ]);
      if (!storiesResponse.ok || !dashboardResponse.ok) {
        throw new Error("Le Media Studio ne répond pas correctement.");
      }

      const nextStories = (await storiesResponse.json()) as MediaStory[];
      const nextDashboard = (await dashboardResponse.json()) as MediaDashboard;
      setStories(nextStories);
      setDashboard(nextDashboard);

      if (schedulerResponse.ok) {
        setSchedulerStatus(
          (await schedulerResponse.json()) as RadarSchedulerStatus,
        );
      } else {
        setSchedulerStatus(null);
      }

      if (historyResponse.ok) {
        setRadarHistory(
          (await historyResponse.json()) as RadarScanHistoryItem[],
        );
      } else {
        setRadarHistory([]);
      }

      setSelectedId((current) => current ?? (previewMode ? nextStories.find((item) => item.video_draft)?.id : null) ?? nextStories[0]?.id ?? null);
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
    action: "approve" | "reject" | "request_changes" | "approve_preview" | "mark_publish_ready",
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

  async function discoverAssets(story: MediaStory) {
    setActionBusy(true);
    setError(null);
    try {
      const response = await fetch(
        `${API_ROOT}/stories/${story.id}/assets/discover`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ limit_per_scene: 4 }),
        },
      );
      if (!response.ok) {
        let detail = await response.text();
        try {
          const parsed = JSON.parse(detail) as { detail?: string };
          detail = parsed.detail ?? detail;
        } catch {
          // Keep raw body.
        }
        throw new Error(`Recherche médias impossible (HTTP ${response.status}) : ${detail}`);
      }
      await load();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : String(caught));
    } finally {
      setActionBusy(false);
    }
  }

  async function selectAsset(
    story: MediaStory,
    sceneOrder: number,
    assetId: string,
  ) {
    setActionBusy(true);
    setError(null);
    try {
      const response = await fetch(
        `${API_ROOT}/stories/${story.id}/assets/select`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            scene_order: sceneOrder,
            asset_id: assetId,
          }),
        },
      );
      if (!response.ok) {
        let detail = await response.text();
        try {
          const parsed = JSON.parse(detail) as { detail?: string };
          detail = parsed.detail ?? detail;
        } catch {
          // Keep raw body.
        }
        throw new Error(`Sélection média impossible (HTTP ${response.status}) : ${detail}`);
      }
      const updated = (await response.json()) as MediaStory;
      setStories((items) =>
        items.map((item) => (item.id === updated.id ? updated : item)),
      );
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : String(caught));
    } finally {
      setActionBusy(false);
    }
  }

  async function prepareDraft(story: MediaStory) {
    setActionBusy(true);
    setError(null);
    try {
      const response = await fetch(`${API_ROOT}/stories/${story.id}/draft/prepare`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      if (!response.ok) {
        const detail = await response.text();
        throw new Error(`Draft impossible (HTTP ${response.status}) : ${detail}`);
      }
      await load();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : String(caught));
    } finally {
      setActionBusy(false);
    }
  }

  async function generateVoiceover(story: MediaStory) {
    setActionBusy(true);
    setError(null);
    try {
      const response = await fetch(
        `${API_ROOT}/stories/${story.id}/audio/generate`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({}),
        },
      );
      if (!response.ok) {
        let detail = await response.text();
        try {
          const parsed = JSON.parse(detail) as { detail?: string };
          detail = parsed.detail ?? detail;
        } catch {
          // Keep raw body.
        }
        throw new Error(`AUDIO impossible (HTTP ${response.status}) : ${detail}`);
      }
      await load();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : String(caught));
    } finally {
      setActionBusy(false);
    }
  }

  async function launchRender(story: MediaStory) {
    setActionBusy(true);
    setError(null);
    try {
      const response = await fetch(`${API_ROOT}/stories/${story.id}/render-preview`, {
        method: "POST",
      });
      if (!response.ok) {
        const detail = await response.text();
        throw new Error(`Rendu impossible (HTTP ${response.status}) : ${detail}`);
      }
      await load();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : String(caught));
    } finally {
      setActionBusy(false);
    }
  }

  async function syncRender(story: MediaStory) {
    setActionBusy(true);
    setError(null);
    try {
      const response = await fetch(
        `${API_ROOT}/stories/${story.id}/render-preview/sync`,
        { method: "POST" },
      );
      if (!response.ok) {
        const detail = await response.text();
        throw new Error(`Synchronisation impossible (HTTP ${response.status}) : ${detail}`);
      }
      await load();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : String(caught));
    } finally {
      setActionBusy(false);
    }
  }

  async function retryRender(story: MediaStory) {
    setActionBusy(true);
    setError(null);
    try {
      const response = await fetch(
        `${API_ROOT}/stories/${story.id}/render-preview/retry`,
        { method: "POST" },
      );
      if (!response.ok) {
        let detail = await response.text();
        try {
          const parsed = JSON.parse(detail) as { detail?: string };
          detail = parsed.detail ?? detail;
        } catch {
          // Keep raw body.
        }
        throw new Error(`Relance rendu impossible (HTTP ${response.status}) : ${detail}`);
      }
      await load();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : String(caught));
    } finally {
      setActionBusy(false);
    }
  }

  async function verifyStory(story: MediaStory) {
    setActionBusy(true);
    setError(null);
    try {
      const response = await fetch(`${API_ROOT}/stories/${story.id}/verify`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ max_claims: 6 }),
      });
      if (!response.ok) {
        let detail = await response.text();
        try {
          const parsed = JSON.parse(detail) as { detail?: string };
          detail = parsed.detail ?? detail;
        } catch {
          // Keep raw body.
        }
        throw new Error(`Vérification impossible (HTTP ${response.status}) : ${detail}`);
      }
      await load();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : String(caught));
    } finally {
      setActionBusy(false);
    }
  }

  async function generateCreative(story: MediaStory) {
    setActionBusy(true);
    setError(null);
    try {
      const response = await fetch(
        `${API_ROOT}/stories/${story.id}/creative/generate`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            target_duration_sec: story.target_duration_sec || 15,
            max_hooks: 3,
          }),
        },
      );
      if (!response.ok) {
        let detail = await response.text();
        try {
          const parsed = JSON.parse(detail) as { detail?: string };
          detail = parsed.detail ?? detail;
        } catch {
          // Keep raw body.
        }
        throw new Error(`CREATIVE impossible (HTTP ${response.status}) : ${detail}`);
      }
      await load();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : String(caught));
    } finally {
      setActionBusy(false);
    }
  }

  async function runPublicationQa(story: MediaStory) {
    setActionBusy(true);
    setError(null);
    try {
      const response = await fetch(
        `${API_ROOT}/stories/${story.id}/qa/run`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ check_spelling: true }),
        },
      );
      if (!response.ok) {
        let detail = await response.text();
        try {
          const parsed = JSON.parse(detail) as { detail?: string };
          detail = parsed.detail ?? detail;
        } catch {
          // Keep raw body.
        }
        throw new Error(`QA impossible (HTTP ${response.status}) : ${detail}`);
      }
      await load();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : String(caught));
    } finally {
      setActionBusy(false);
    }
  }

  async function preparePublication(story: MediaStory) {
    setActionBusy(true);
    setError(null);
    try {
      const response = await fetch(
        `${API_ROOT}/stories/${story.id}/publication/prepare`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            target_channels: ["tiktok", "whatsapp"],
          }),
        },
      );
      if (!response.ok) {
        let detail = await response.text();
        try {
          const parsed = JSON.parse(detail) as { detail?: string };
          detail = parsed.detail ?? detail;
        } catch {
          // Keep raw body.
        }
        throw new Error(`Package publication impossible (HTTP ${response.status}) : ${detail}`);
      }
      await load();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : String(caught));
    } finally {
      setActionBusy(false);
    }
  }

  async function launchTikTokCleanExport(story: MediaStory) {
    setActionBusy(true);
    setError(null);
    try {
      const response = await fetch(
        `${API_ROOT}/stories/${story.id}/publication/exports/tiktok`,
        { method: "POST" },
      );
      if (!response.ok) {
        let detail = await response.text();
        try {
          const parsed = JSON.parse(detail) as { detail?: string };
          detail = parsed.detail ?? detail;
        } catch {
          // Keep raw body.
        }
        throw new Error(`Export TikTok impossible (HTTP ${response.status}) : ${detail}`);
      }
      await load();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : String(caught));
    } finally {
      setActionBusy(false);
    }
  }

  async function syncTikTokCleanExport(story: MediaStory) {
    setActionBusy(true);
    setError(null);
    try {
      const response = await fetch(
        `${API_ROOT}/stories/${story.id}/publication/exports/tiktok/sync`,
        { method: "POST" },
      );
      if (!response.ok) {
        let detail = await response.text();
        try {
          const parsed = JSON.parse(detail) as { detail?: string };
          detail = parsed.detail ?? detail;
        } catch {
          // Keep raw body.
        }
        throw new Error(`Synchronisation TikTok impossible (HTTP ${response.status}) : ${detail}`);
      }
      await load();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : String(caught));
    } finally {
      setActionBusy(false);
    }
  }

  async function retryTikTokCleanExport(story: MediaStory) {
    setActionBusy(true);
    setError(null);
    try {
      const response = await fetch(
        `${API_ROOT}/stories/${story.id}/publication/exports/tiktok/retry`,
        { method: "POST" },
      );
      if (!response.ok) {
        let detail = await response.text();
        try {
          const parsed = JSON.parse(detail) as { detail?: string };
          detail = parsed.detail ?? detail;
        } catch {
          // Keep raw body.
        }
        throw new Error(`Relance TikTok impossible (HTTP ${response.status}) : ${detail}`);
      }
      await load();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : String(caught));
    } finally {
      setActionBusy(false);
    }
  }

  async function runRadar() {
    setRadarBusy(true);
    setError(null);
    try {
      const country = radarCountry.trim().toUpperCase();
      if (country && country.length !== 3) {
        throw new Error("Le filtre pays doit être un code ISO3 de 3 lettres, par exemple GAB ou COD.");
      }

      const response = await fetch(`${API_ROOT}/radar/scans`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          hours: radarHours,
          country_iso3: country || null,
          max_candidates: 12,
        }),
      });

      if (!response.ok) {
        let detail = await response.text();
        try {
          const parsed = JSON.parse(detail) as { detail?: string };
          detail = parsed.detail ?? detail;
        } catch {
          // Keep raw body.
        }
        throw new Error(`RADAR indisponible (HTTP ${response.status}) : ${detail}`);
      }

      const result = (await response.json()) as RadarScanResult;
      setRadarResult(result);
      await load();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : String(caught));
    } finally {
      setRadarBusy(false);
    }
  }

  function openReviewGate(gate: "identite" | "direction" | "script" | "medias" | "voix" | "animation" | "montage" | "publication" | "video") {
    const url = new URL(window.location.href);
    url.searchParams.set("gate", gate);
    window.history.replaceState({}, "", url.pathname + url.search + url.hash);
    changeScreen("review");
  }

  function changeScreen(next: "journey" | "review" | "desk") {
    setScreen(next);
    const url = new URL(window.location.href);
    if (next === "desk" || next === "review") {
      url.searchParams.set("screen", next);
    } else {
      url.searchParams.delete("screen");
    }
    window.history.replaceState({}, "", url.pathname + url.search + url.hash);
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

        <div
          className={`wv-media-live ${schedulerStatus?.enabled ? "auto" : "manual"}`}
          title={
            schedulerStatus
              ? `Redis: ${schedulerStatus.redis_connected ? "OK" : "indisponible"} · dernier état: ${schedulerStatus.last_run_status ?? "aucun"}`
              : "État du scheduler indisponible"
          }
        >
          <span className="wv-media-live-dot" />
          {previewMode ? "ARCHIVE · RÉELLE" : schedulerStatus?.enabled ? "RADAR AUTO" : "RADAR MANUEL"}
        </div>

        <nav className="wv-media-viewnav" aria-label="Espace Media Studio">
          <button type="button" className={screen === "journey" ? "active" : ""}
            onClick={() => changeScreen("journey")}>◈ Parcours vidéo</button>
          <button type="button" className={screen === "review" ? "active" : ""}
            onClick={() => changeScreen("review")}>★ Noter & valider</button>
          <button type="button" className={screen === "desk" ? "active" : ""}
            onClick={() => changeScreen("desk")}>▤ Control Room</button>
        </nav>
      </header>

      {previewMode && <div className="wv-media-version-strip" role="status">
        <span>APERCU STATIQUE · VERSION DU SITE : <strong>{previewRelease ? previewRelease.slice(0,12) : "lecture de la version…"}</strong></span>
        <span>La nouvelle étape est <strong>Direction artistique · Globe</strong> (six plans).</span>
        <a href="https://github.com/OBIANG5/World-Health-Vision/tree/whv-media-studio-browser-preview"
           target="_blank" rel="noreferrer">Vérifier les fichiers publiés sur GitHub ↗</a>
        <a href="https://github.com/OBIANG5/World-Health-Vision/issues/11"
           target="_blank" rel="noreferrer">Historique intégral & reprise du projet ↗</a>
      </div>}
      {screen === "review" ? (
        <ReviewStudio
          story={selected}
          previewMode={previewMode}
          onOpenJourney={() => changeScreen("journey")}
        />
      ) : screen === "journey" ? (
        <ProductionJourney
          story={selected}
          stories={stories}
          selectedId={selectedId}
          onSelectStory={setSelectedId}
          previewMode={previewMode}
          busy={actionBusy || radarBusy}
          onOpenControlRoom={() => changeScreen("desk")}
          onOpenReview={openReviewGate}
          onVerify={verifyStory}
          onDecision={decision}
          onGenerateCreative={generateCreative}
          onDiscoverAssets={discoverAssets}
          onPrepareDraft={prepareDraft}
          onGenerateVoiceover={generateVoiceover}
          onLaunchRender={launchRender}
          onSyncRender={syncRender}
          onRunQa={runPublicationQa}
          onPreparePublication={preparePublication}
          onLaunchTikTokCleanExport={launchTikTokCleanExport}
          onSyncTikTokCleanExport={syncTikTokCleanExport}
        />
      ) : (
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

          <section className="wv-media-radar-box">
            <div className="wv-media-radar-head">
              <div>
                <span className="wv-media-radar-kicker">WORLD-VISION RADAR</span>
                <h2>Scanner les meilleures actualités du Web</h2>
                <p>
                  Le scan recherche des sources récentes, conserve les URL réellement consultées
                  et n’ajoute à la newsroom que les candidats ayant une provenance retrouvée.
                </p>
              </div>
              <div className="wv-media-radar-status-stack">
                <div className="wv-media-radar-badge">LIVE WEB</div>
                <div
                  className={`wv-media-scheduler-badge ${schedulerStatus?.enabled ? "enabled" : "disabled"}`}
                >
                  {schedulerStatus?.enabled
                    ? `AUTO · ${Math.round(schedulerStatus.interval_seconds / 60)} min`
                    : "AUTO DÉSACTIVÉ"}
                </div>
              </div>
            </div>

            {schedulerStatus && (
              <div className="wv-media-scheduler-line">
                <span>
                  Redis {schedulerStatus.redis_connected ? "✓" : "✕"}
                </span>
                <span>
                  Heartbeat {schedulerStatus.heartbeat_at ? dateLabel(schedulerStatus.heartbeat_at) : "—"}
                </span>
                <span>
                  Dernier passage {schedulerStatus.last_run_at ? dateLabel(schedulerStatus.last_run_at) : "—"}
                </span>
                <span>
                  État {schedulerStatus.last_run_status ?? "jamais lancé"}
                </span>
                {schedulerStatus.last_error && (
                  <span className="error">Erreur : {schedulerStatus.last_error}</span>
                )}
              </div>
            )}

            <div className="wv-media-radar-controls">
              <label>
                Fenêtre
                <select
                  value={radarHours}
                  onChange={(event) => setRadarHours(Number(event.target.value))}
                  disabled={radarBusy}
                >
                  <option value={1}>1 heure</option>
                  <option value={3}>3 heures</option>
                  <option value={6}>6 heures</option>
                  <option value={12}>12 heures</option>
                  <option value={24}>24 heures</option>
                  <option value={48}>48 heures</option>
                </select>
              </label>

              <label>
                Pays ISO3 <span>(optionnel)</span>
                <input
                  value={radarCountry}
                  onChange={(event) => setRadarCountry(event.target.value.toUpperCase().slice(0, 3))}
                  placeholder="MONDE"
                  maxLength={3}
                  disabled={radarBusy}
                />
              </label>

              <button
                className="wv-media-radar-run"
                onClick={() => void runRadar()}
                disabled={radarBusy}
              >
                {radarBusy ? "Scan en cours…" : "⌁ Scanner le Web"}
              </button>
            </div>

            {radarResult && (
              <div className="wv-media-radar-result">
                <div>
                  <strong>{radarResult.candidates_accepted}</strong>
                  <span>candidats acceptés</span>
                </div>
                <div>
                  <strong>{radarResult.stories_created.length}</strong>
                  <span>nouveaux sujets</span>
                </div>
                <div>
                  <strong>{radarResult.stories_deduplicated.length}</strong>
                  <span>doublons évités</span>
                </div>
                <div>
                  <strong>{radarResult.retrieved_urls.length}</strong>
                  <span>URL consultées</span>
                </div>
                <small>
                  Scan {radarResult.scan_id} · {radarResult.model}
                </small>
              </div>
            )}

            {radarHistory.length > 0 && (
              <div className="wv-media-radar-history">
                <div className="wv-media-radar-history-title">
                  <span>Derniers scans enregistrés</span>
                  <small>{radarHistory.length} affichés</small>
                </div>
                {radarHistory.map((scan) => (
                  <div className="wv-media-radar-history-row" key={scan.scan_id}>
                    <div className="wv-media-radar-history-identity">
                      <strong>{dateLabel(scan.requested_at)}</strong>
                      <span>
                        {scan.country_iso3 ?? "MONDE"} · fenêtre {scan.hours}h · {scan.model}
                      </span>
                    </div>
                    <div className="wv-media-radar-history-metrics">
                      <span><b>{scan.candidates_accepted}</b> retenus</span>
                      <span><b>{scan.stories_created.length}</b> créés</span>
                      <span><b>{scan.stories_deduplicated.length}</b> doublons</span>
                      <span><b>{scan.retrieved_urls.length}</b> URL</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

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
              onVerify={verifyStory}
              onGenerateCreative={generateCreative}
              onDiscoverAssets={discoverAssets}
              onSelectAsset={selectAsset}
              onSelectHook={selectHook}
              onPrepareDraft={prepareDraft}
              onGenerateVoiceover={generateVoiceover}
              onLaunchRender={launchRender}
              onSyncRender={syncRender}
              onRetryRender={retryRender}
              onRunQa={runPublicationQa}
              onPreparePublication={preparePublication}
              onLaunchTikTokCleanExport={launchTikTokCleanExport}
              onSyncTikTokCleanExport={syncTikTokCleanExport}
              onRetryTikTokCleanExport={retryTikTokCleanExport}
            />
          ) : (
            <div className="wv-media-empty">Sélectionne une actualité.</div>
          )}
        </aside>
      </main>
      )}
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
  onVerify,
  onGenerateCreative,
  onDiscoverAssets,
  onSelectAsset,
  onSelectHook,
  onPrepareDraft,
  onGenerateVoiceover,
  onLaunchRender,
  onSyncRender,
  onRetryRender,
  onRunQa,
  onPreparePublication,
  onLaunchTikTokCleanExport,
  onSyncTikTokCleanExport,
  onRetryTikTokCleanExport,
}: {
  story: MediaStory;
  busy: boolean;
  onDecision: (
    story: MediaStory,
    action: "approve" | "reject" | "request_changes" | "approve_preview" | "mark_publish_ready",
  ) => Promise<void>;
  onVerify: (story: MediaStory) => Promise<void>;
  onGenerateCreative: (story: MediaStory) => Promise<void>;
  onDiscoverAssets: (story: MediaStory) => Promise<void>;
  onSelectAsset: (
    story: MediaStory,
    sceneOrder: number,
    assetId: string,
  ) => Promise<void>;
  onSelectHook: (story: MediaStory, hookId: string) => Promise<void>;
  onPrepareDraft: (story: MediaStory) => Promise<void>;
  onGenerateVoiceover: (story: MediaStory) => Promise<void>;
  onLaunchRender: (story: MediaStory) => Promise<void>;
  onSyncRender: (story: MediaStory) => Promise<void>;
  onRetryRender: (story: MediaStory) => Promise<void>;
  onRunQa: (story: MediaStory) => Promise<void>;
  onPreparePublication: (story: MediaStory) => Promise<void>;
  onLaunchTikTokCleanExport: (story: MediaStory) => Promise<void>;
  onSyncTikTokCleanExport: (story: MediaStory) => Promise<void>;
  onRetryTikTokCleanExport: (story: MediaStory) => Promise<void>;
}) {
  const scoreEntries = Object.entries(story.score.factors) as [
    keyof EditorialScoreFactors,
    number,
  ][];

  const requiredAssetScenes =
    story.creative_package?.scene_plan.filter((scene) =>
      ["real_photo", "real_video"].includes(scene.visual_kind),
    ) ?? [];
  const selectionByScene = new Map(
    (story.asset_bundle?.selections ?? []).map((selection) => [
      selection.scene_order,
      selection,
    ]),
  );
  const selectedAssetByScene = new Map(
    (story.asset_bundle?.selections ?? []).map((selection) => [
      selection.scene_order,
      selection.asset_id,
    ]),
  );
  const assetById = new Map(
    (story.asset_bundle?.assets ?? []).map((asset) => [asset.id, asset]),
  );
  const assetsResolved =
    requiredAssetScenes.length === 0 ||
    (story.asset_bundle?.unresolved_scene_orders.length ?? requiredAssetScenes.length) === 0;
  const tiktokExport = story.channel_exports.find(
    (item) => item.channel === "tiktok",
  );

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

      {story.verification_report && (
        <section className="wv-media-panel">
          <div className="wv-media-panel-title">
            <span>Rapport VERIFY · v{story.verification_report.version}</span>
            <small>
              {story.verification_report.distinct_supporting_sources} preuves distinctes · confiance {story.verification_report.confidence_score}%
            </small>
          </div>

          <div className="wv-media-verification-summary">
            <span className={`verdict verdict-${story.verification_report.verdict}`}>
              {story.verification_report.verdict === "verified"
                ? "✓ Vérifié"
                : story.verification_report.verdict === "conflicting"
                  ? "⚠ Contradiction"
                  : story.verification_report.verdict === "partially_verified"
                    ? "◐ Partiellement vérifié"
                    : "○ Non vérifié"}
            </span>
            <span>
              {story.verification_report.has_primary_support
                ? "source primaire confirmante"
                : "pas de source primaire confirmante détectée"}
            </span>
          </div>

          <div className="wv-media-claim-list">
            {story.verification_report.claims.map((claim, index) => (
              <div
                className={`wv-media-claim claim-${claim.status}`}
                key={`${claim.claim}-${index}`}
              >
                <div className="wv-media-claim-head">
                  <strong>{claim.claim}</strong>
                  <span>{claim.status}</span>
                </div>
                <p>{claim.explanation}</p>
                <div className="wv-media-evidence-links">
                  {claim.supporting_urls.map((url) => (
                    <a key={`support-${url}`} href={url} target="_blank" rel="noreferrer">
                      ✓ preuve ↗
                    </a>
                  ))}
                  {claim.contradicting_urls.map((url) => (
                    <a
                      className="contradiction"
                      key={`contradict-${url}`}
                      href={url}
                      target="_blank"
                      rel="noreferrer"
                    >
                      ⚠ contradiction ↗
                    </a>
                  ))}
                  {claim.supporting_urls.length === 0 &&
                    claim.contradicting_urls.length === 0 && (
                      <span>aucune URL récupérée ne confirme encore ce fait</span>
                    )}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {story.creative_package && (
        <section className="wv-media-panel">
          <div className="wv-media-panel-title">
            <span>CREATIVE · v{story.creative_package.version}</span>
            <small>
              {story.creative_package.model} · {story.creative_package.target_duration_sec}s
            </small>
          </div>

          <div className="wv-media-creative-angle">
            <span>ANGLE</span>
            <strong>{story.creative_package.angle}</strong>
            <small>
              claims {story.creative_package.angle_claim_indexes.join(", ")}
            </small>
          </div>

          <div className="wv-media-creative-script">
            {story.creative_package.script_segments.map((segment, index) => (
              <div key={`${segment.text}-${index}`}>
                <span>{index + 1}</span>
                <p>{segment.text}</p>
                <small>claims {segment.claim_indexes.join(", ")}</small>
              </div>
            ))}
          </div>

          <div className="wv-media-creative-caption">
            <span>LÉGENDE</span>
            <p>{story.creative_package.caption}</p>
            <div>
              {story.creative_package.hashtags.map((tag) => (
                <small key={tag}>{tag}</small>
              ))}
            </div>
          </div>
        </section>
      )}

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

      {story.creative_package && requiredAssetScenes.length > 0 && (
        <section className="wv-media-panel">
          <div className="wv-media-panel-title">
            <span>ASSETS · médias sous licence</span>
            <small>
              {story.asset_bundle
                ? `v${story.asset_bundle.version} · ${story.asset_bundle.unresolved_scene_orders.length} scène(s) à résoudre`
                : "Wikimedia Commons · provenance + droits"}
            </small>
          </div>

          {!story.asset_bundle ? (
            <div className="wv-media-assets-empty">
              Les scènes photo/vidéo ont besoin de médias réels traçables avant le storyboard final.
            </div>
          ) : (
            <div className="wv-media-asset-scenes">
              {requiredAssetScenes.map((scene) => {
                const selectedSelection = selectionByScene.get(scene.order);
                const selectedAssetId = selectedAssetByScene.get(scene.order);
                const selectedAsset = selectedAssetId
                  ? assetById.get(selectedAssetId)
                  : undefined;
                const expectedAssetKind =
                  scene.visual_kind === "real_video" ? "video" : "image";
                const candidates = story.asset_bundle?.assets.filter(
                  (asset) =>
                    asset.query === scene.asset_query &&
                    asset.kind === expectedAssetKind,
                ) ?? [];
                const unresolved =
                  story.asset_bundle?.unresolved_scene_orders.includes(scene.order) ?? true;

                return (
                  <div className="wv-media-asset-scene" key={scene.order}>
                    <div className="wv-media-asset-scene-head">
                      <div>
                        <strong>Scène {scene.order} · {scene.purpose}</strong>
                        <span>{scene.asset_query ?? "recherche média automatique"}</span>
                      </div>
                      <span className={unresolved ? "pending" : "ready"}>
                        {unresolved ? "DROITS À RÉSOUDRE" : "✓ PRÊT"}
                      </span>
                    </div>

                    {selectedAsset && (
                      <div className="wv-media-selected-asset">
                        <span>Actuel</span>
                        <strong>{selectedAsset.title}</strong>
                        <small>{selectedAsset.attribution}</small>
                        {selectedSelection && (
                          <div className="wv-media-selected-score">
                            <strong>{selectedSelection.selection_score}/100</strong>
                            <span>{selectedSelection.selection_reason}</span>
                          </div>
                        )}
                      </div>
                    )}

                    <div className="wv-media-asset-grid">
                      {candidates.map((asset) => {
                        const selected = selectedAssetId === asset.id;
                        const canUse = asset.rights_status === "approved";
                        return (
                          <div
                            className={`wv-media-asset-card ${selected ? "selected" : ""}`}
                            key={asset.id}
                          >
                            <div className="wv-media-asset-thumb">
                              <img
                                src={asset.thumbnail_url ?? asset.media_url}
                                alt={asset.title}
                                loading="lazy"
                              />
                              <span className={`rights-${asset.rights_status}`}>
                                {asset.rights_status === "approved"
                                  ? "LICENCE OK"
                                  : asset.rights_status === "review_required"
                                    ? "REVUE DROITS"
                                    : "REFUSÉ"}
                              </span>
                            </div>
                            <div className="wv-media-asset-copy">
                              <div className="wv-media-asset-kind">
                                {asset.kind === "video" ? "VIDÉO" : "PHOTO"}
                              </div>
                              <strong>{asset.title}</strong>
                              <span>{asset.author ?? "Auteur non renseigné"}</span>
                              <span>{asset.license_name ?? "Licence non renseignée"}</span>
                              {(asset.width || asset.height || asset.size_bytes) && (
                                <span>
                                  {asset.width && asset.height
                                    ? `${asset.width}×${asset.height}`
                                    : "dimensions inconnues"}
                                  {asset.size_bytes
                                    ? ` · ${(asset.size_bytes / 1_000_000).toFixed(1)} Mo`
                                    : ""}
                                </span>
                              )}
                              <small>{asset.rights_note}</small>
                            </div>
                            <div className="wv-media-asset-card-actions">
                              <a
                                href={asset.source_page_url}
                                target="_blank"
                                rel="noreferrer"
                              >
                                Source ↗
                              </a>
                              <button
                                disabled={busy || !canUse || selected}
                                onClick={() =>
                                  void onSelectAsset(story, scene.order, asset.id)
                                }
                              >
                                {selected
                                  ? "✓ Sélectionné"
                                  : canUse
                                    ? "Utiliser"
                                    : "Revue requise"}
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {candidates.length === 0 && (
                      <div className="wv-media-assets-empty">
                        Aucun média candidat pour cette scène. Relance la recherche ou utilise une scène typographique.
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </section>
      )}

      {story.video_draft && (
        <section className="wv-media-panel">
          <div className="wv-media-panel-title">
            <span>Draft vidéo · v{story.video_draft.version}</span>
            <small>
              {story.video_draft.duration_sec}s · {story.video_draft.width}×{story.video_draft.height} · {story.video_draft.rendering_engine}
            </small>
          </div>

          <div className="wv-media-draft-script">
            <span>VOIX OFF</span>
            <p>{story.video_draft.voiceover_script}</p>
          </div>

          <div className="wv-media-scenes">
            {story.video_draft.scenes.map((scene) => (
              <div className="wv-media-scene" key={scene.id}>
                <div className="wv-media-scene-time">
                  <strong>{scene.order}</strong>
                  <span>{scene.start_sec.toFixed(1)}s → {(scene.start_sec + scene.duration_sec).toFixed(1)}s</span>
                </div>
                <div className="wv-media-scene-copy">
                  <small>{scene.purpose} · {scene.visual_kind}</small>
                  <strong>{scene.on_screen_text}</strong>
                  {scene.asset_url ? (
                    <span>Asset : {scene.asset_license ?? "licence"} · {scene.asset_attribution ?? "attribution"}</span>
                  ) : scene.asset_query ? (
                    <span>Recherche média : {scene.asset_query}</span>
                  ) : null}
                </div>
              </div>
            ))}
          </div>

          <div className="wv-media-source-line">{story.video_draft.source_line}</div>
        </section>
      )}

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

      {story.voiceover && (
        <section className="wv-media-panel">
          <div className="wv-media-panel-title">
            <span>AUDIO · voix off IA</span>
            <small>
              {story.voiceover.model} · {story.voiceover.voice} · {story.voiceover.duration_sec.toFixed(1)}s
            </small>
          </div>

          <div className="wv-media-audio-status">
            <span className={story.voiceover.qa_passed ? "pass" : "fail"}>
              {story.voiceover.qa_passed ? "✓ QA AUDIO OK" : "⚠ QA AUDIO ÉCHEC"}
            </span>
            <span>
              Concordance script {story.voiceover.transcript_match_score}%
            </span>
            <span>
              Durée {story.voiceover.duration_fit ? "compatible" : "trop longue"}
            </span>
          </div>

          <div className="wv-media-audio-transcript">
            <span>TRANSCRIPTION DE CONTRÔLE</span>
            <p>{story.voiceover.transcript}</p>
          </div>

          <div className="wv-media-ai-disclosure">
            {story.voiceover.ai_generated_disclosure}
          </div>
        </section>
      )}

      {story.render_job && (
        <section className="wv-media-panel">
          <div className="wv-media-panel-title">
            <span>Aperçu Remotion</span>
            <small>{story.render_job.status} · {Math.round(story.render_job.progress * 100)}%</small>
          </div>

          <div className="wv-media-render-progress">
            <div style={{ width: `${Math.round(story.render_job.progress * 100)}%` }} />
          </div>

          <div className="wv-media-render-runtime">
            <span>
              tentative {story.render_job.attempts ?? 0}/{story.render_job.max_attempts ?? 3}
            </span>
            <span>
              persistance {story.render_job.recovered_at ? "récupérée après redémarrage" : "active"}
            </span>
            {story.render_job.recovered_at && (
              <span>reprise {dateLabel(story.render_job.recovered_at)}</span>
            )}
          </div>

          {story.render_job.output_probe && (
            <div className="wv-media-render-probe">
              <span>{story.render_job.output_probe.width}×{story.render_job.output_probe.height}</span>
              <span>{story.render_job.output_probe.fps.toFixed(2)} fps</span>
              <span>{story.render_job.output_probe.duration_sec.toFixed(2)}s</span>
              <span>{(story.render_job.output_probe.video_codec ?? "codec").toUpperCase()}</span>
              <span>
                {story.render_job.output_probe.has_audio
                  ? `audio ${story.render_job.output_probe.audio_codec ?? "présent"}`
                  : "sans audio"}
              </span>
              {story.render_job.output_probe.audio_sample_rate_hz && (
                <span>
                  {(story.render_job.output_probe.audio_sample_rate_hz / 1000).toFixed(0)} kHz
                </span>
              )}
              {story.render_job.output_probe.integrated_lufs != null && (
                <span>
                  {story.render_job.output_probe.integrated_lufs.toFixed(1)} LUFS
                </span>
              )}
              {story.render_job.output_probe.true_peak_dbfs != null && (
                <span>
                  TP {story.render_job.output_probe.true_peak_dbfs.toFixed(1)} dB
                </span>
              )}
              {story.render_job.output_probe.loudness_range_lu != null && (
                <span>
                  LRA {story.render_job.output_probe.loudness_range_lu.toFixed(1)} LU
                </span>
              )}
              <span>
                {(story.render_job.output_probe.size_bytes / 1_000_000).toFixed(2)} Mo
              </span>
              {story.render_job.output_probe.integrated_lufs != null && (
                <span>
                  {story.render_job.output_probe.integrated_lufs.toFixed(1)} LUFS
                </span>
              )}
              {story.render_job.output_probe.true_peak_dbfs != null && (
                <span>
                  pic {story.render_job.output_probe.true_peak_dbfs.toFixed(1)} dBTP
                </span>
              )}
              {story.render_job.output_probe.loudness_range_lu != null && (
                <span>
                  LRA {story.render_job.output_probe.loudness_range_lu.toFixed(1)} LU
                </span>
              )}
            </div>
          )}

          {story.render_job.error && (
            <div className="wv-media-render-error">{story.render_job.error}</div>
          )}

          {story.render_job.status === "failed" && (
            <button
              type="button"
              className="wv-media-inline-action primary"
              disabled={
                busy ||
                (story.render_job.attempts ?? 0) >=
                  (story.render_job.max_attempts ?? 3)
              }
              onClick={() => void onRetryRender(story)}
            >
              {(story.render_job.attempts ?? 0) >=
              (story.render_job.max_attempts ?? 3)
                ? "Limite de relance atteinte"
                : "↻ Relancer le même job"}
            </button>
          )}

          {story.render_job.output_url && (
            <div className="wv-media-preview-frame">
              <video
                controls
                playsInline
                preload="metadata"
                src={story.render_job.output_url}
              />
            </div>
          )}
        </section>
      )}

      {story.qa_report && (
        <section className="wv-media-panel">
          <div className="wv-media-panel-title">
            <span>Rapport QA · v{story.qa_report.version}</span>
            <small>
              {story.qa_report.all_passed
                ? "8/8 contrôles validés"
                : `${story.qa_report.issues.length} problème(s)`}
              {story.qa_report.language_model
                ? ` · ${story.qa_report.language_model}`
                : ""}
            </small>
          </div>

          <div
            className={`wv-media-qa-report-summary ${
              story.qa_report.all_passed ? "pass" : "fail"
            }`}
          >
            {story.qa_report.all_passed
              ? "✓ Le contenu peut passer à l’étape prêt à publier."
              : "⚠ Le contenu reste bloqué tant que ces problèmes ne sont pas corrigés."}
          </div>

          {story.qa_report.issues.length > 0 && (
            <div className="wv-media-qa-issues">
              {story.qa_report.issues.map((issue, index) => (
                <div className="wv-media-qa-issue" key={`${issue.check}-${index}`}>
                  <div>
                    <strong>{issue.check.replace("_", " ")}</strong>
                    <span>{issue.severity}</span>
                  </div>
                  <p>{issue.message}</p>
                  {issue.original_text && issue.suggested_text && (
                    <div className="wv-media-qa-correction">
                      <span>« {issue.original_text} »</span>
                      <strong>→ « {issue.suggested_text} »</strong>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      {story.publication_package && (
        <section className="wv-media-panel">
          <div className="wv-media-panel-title">
            <span>Publication Package · v{story.publication_package.version}</span>
            <small>
              CREATIVE v{story.publication_package.creative_version} · QA v{story.publication_package.qa_version}
            </small>
          </div>

          <div className="wv-media-publication-manifest">
            <div>
              <span>MANIFESTE SHA-256</span>
              <code>{story.publication_package.manifest_sha256}</code>
            </div>
            <div>
              <span>FICHIER MP4 · SHA-256 · {story.publication_package.video_render_profile ?? "profil historique"}</span>
              {story.publication_package.video_sha256
                ? <code style={{ overflowWrap: "anywhere" }}>{story.publication_package.video_sha256}</code>
                : <small>Ancien manifeste non lié aux octets du MP4 : préparer une nouvelle version avant toute publication.</small>}
            </div>
            <a
              href={story.publication_package.video_url}
              target="_blank"
              rel="noreferrer"
            >
              MP4 final ↗
            </a>
          </div>

          <div className="wv-media-publication-channels">
            {story.publication_package.target_channels.map((channel) => {
              const receipt = story.publication_receipts.find(
                (item) => item.channel === channel,
              );
              return (
                <div key={channel}>
                  <strong>{channel}</strong>
                  <span className={receipt ? "published" : "pending"}>
                    {receipt ? "✓ reçu enregistré" : "en attente de publication réelle"}
                  </span>
                </div>
              );
            })}
          </div>

          {story.publication_package.target_channels.includes("tiktok") && (
            <div className="wv-media-tiktok-export">
              <div className="wv-media-tiktok-export-head">
                <div>
                  <span>EXPORT TIKTOK API CLEAN</span>
                  <strong>Sans branding applicatif · sources et disclosure conservées</strong>
                </div>
                <span className={
                  tiktokExport?.render_job.status === "completed"
                    ? "ready"
                    : tiktokExport
                      ? "pending"
                      : "missing"
                }>
                  {tiktokExport?.render_job.status === "completed"
                    ? "✓ PRÊT"
                    : tiktokExport
                      ? tiktokExport.render_job.status.toUpperCase()
                      : "À GÉNÉRER"}
                </span>
              </div>

              {tiktokExport ? (
                <>
                  <div className="wv-media-render-progress">
                    <div
                      style={{
                        width: `${Math.round(tiktokExport.render_job.progress * 100)}%`,
                      }}
                    />
                  </div>

                  <div className="wv-media-tiktok-export-meta">
                    <span>Profil {tiktokExport.render_profile}</span>
                    <span>
                      manifeste {tiktokExport.canonical_manifest_sha256.slice(0, 12)}…
                    </span>
                    {tiktokExport.render_job.output_sha256 && (
                      <span>
                        MP4 {tiktokExport.render_job.output_sha256.slice(0, 12)}…
                      </span>
                    )}
                  </div>

                  {tiktokExport.render_job.error && (
                    <div className="wv-media-render-error">
                      {tiktokExport.render_job.error}
                    </div>
                  )}

                  {tiktokExport.render_job.output_url ? (
                    <div className="wv-media-tiktok-export-ready">
                      <video
                        controls
                        playsInline
                        preload="metadata"
                        src={tiktokExport.render_job.output_url}
                      />
                      <a
                        href={tiktokExport.render_job.output_url}
                        target="_blank"
                        rel="noreferrer"
                      >
                        Ouvrir le MP4 clean ↗
                      </a>
                    </div>
                  ) : tiktokExport.render_job.status === "failed" ? (
                    <button
                      type="button"
                      className="wv-media-inline-action primary"
                      disabled={
                        busy ||
                        (tiktokExport.render_job.attempts ?? 0) >=
                          (tiktokExport.render_job.max_attempts ?? 3)
                      }
                      onClick={() => void onRetryTikTokCleanExport(story)}
                    >
                      {(tiktokExport.render_job.attempts ?? 0) >=
                      (tiktokExport.render_job.max_attempts ?? 3)
                        ? "Limite de relance atteinte"
                        : "↻ Relancer l’export TikTok"}
                    </button>
                  ) : (
                    <button
                      type="button"
                      className="wv-media-inline-action"
                      disabled={busy}
                      onClick={() => void onSyncTikTokCleanExport(story)}
                    >
                      ↻ Actualiser l’export
                    </button>
                  )}
                </>
              ) : (
                <button
                  type="button"
                  className="wv-media-inline-action primary"
                  disabled={busy}
                  onClick={() => void onLaunchTikTokCleanExport(story)}
                >
                  ▶ Générer l’export TikTok clean
                </button>
              )}
            </div>
          )}

          <div className="wv-media-publication-copy">
            <div>
              <span>TIKTOK</span>
              <p>{story.publication_package.tiktok_caption}</p>
              <button
                type="button"
                onClick={() =>
                  void navigator.clipboard?.writeText(
                    story.publication_package?.tiktok_caption ?? "",
                  )
                }
              >
                Copier
              </button>
            </div>
            <div>
              <span>WHATSAPP</span>
              <p>{story.publication_package.whatsapp_text}</p>
              <button
                type="button"
                onClick={() =>
                  void navigator.clipboard?.writeText(
                    story.publication_package?.whatsapp_text ?? "",
                  )
                }
              >
                Copier
              </button>
            </div>
          </div>

          {story.publication_package.ai_disclosure && (
            <div className="wv-media-ai-disclosure">
              {story.publication_package.ai_disclosure}
            </div>
          )}
        </section>
      )}

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
          <Qa label="Intégrité MP4" value={story.qa.render_integrity} />
        </div>
      </section>

      <div className="wv-media-actions">
        {story.status === "candidate" && (
          <>
            {story.verification_status !== "verified" ? (
              <>
                <button
                  className="wv-media-action primary"
                  disabled={busy}
                  onClick={() => void onVerify(story)}
                >
                  ⌕ Vérifier les faits
                </button>
                <div className="wv-media-action-hint">
                  La validation éditoriale est bloquée jusqu’à un verdict VERIFY « vérifié ».
                </div>
              </>
            ) : (
              <button
                className="wv-media-action primary"
                disabled={busy}
                onClick={() => void onDecision(story, "approve")}
              >
                ✓ Valider l’idée
              </button>
            )}
            <button
              className="wv-media-action secondary"
              disabled={busy}
              onClick={() => void onDecision(story, "request_changes")}
            >
              ↻ Demander un autre angle
            </button>
            <button
              className="wv-media-action danger"
              disabled={busy}
              onClick={() => void onDecision(story, "reject")}
            >
              Refuser
            </button>
          </>
        )}

        {story.status === "changes_requested" && (
          <>
            {story.verification_status !== "verified" ? (
              <button
                className="wv-media-action primary"
                disabled={busy}
                onClick={() => void onVerify(story)}
              >
                ⌕ Revérifier les faits
              </button>
            ) : (
              <button
                className="wv-media-action primary"
                disabled={busy}
                onClick={() => void onDecision(story, "approve")}
              >
                ✓ Revalider l’angle
              </button>
            )}
            <button
              className="wv-media-action danger"
              disabled={busy}
              onClick={() => void onDecision(story, "reject")}
            >
              Refuser
            </button>
          </>
        )}

        {story.status === "approved" && (
          <>
            {!story.creative_package ? (
              <>
                <button
                  className="wv-media-action primary"
                  disabled={busy}
                  onClick={() => void onGenerateCreative(story)}
                >
                  ✦ Générer angle + script CREATIVE
                </button>
                <div className="wv-media-action-hint">
                  CREATIVE utilisera uniquement les claims VERIFY confirmés.
                </div>
              </>
            ) : (
              <>
                {requiredAssetScenes.length > 0 && !story.asset_bundle ? (
                  <>
                    <button
                      className="wv-media-action primary"
                      disabled={busy || !story.selected_hook_id}
                      onClick={() => void onDiscoverAssets(story)}
                    >
                      ◫ Rechercher les médias sous licence
                    </button>
                    <div className="wv-media-action-hint">
                      {story.selected_hook_id
                        ? "ASSETS cherchera les médias réels et conservera licence + attribution."
                        : "Choisis d’abord un hook CREATIVE, puis recherche les médias."}
                    </div>
                  </>
                ) : (
                  <>
                    <button
                      className="wv-media-action primary"
                      disabled={busy || !story.selected_hook_id || !assetsResolved}
                      onClick={() => void onPrepareDraft(story)}
                      title={
                        !story.selected_hook_id
                          ? "Choisis d’abord un hook CREATIVE."
                          : !assetsResolved
                            ? "Résous les droits médias avant le storyboard."
                            : undefined
                      }
                    >
                      ▶ Préparer le storyboard vidéo
                    </button>
                    {!story.selected_hook_id && (
                      <div className="wv-media-action-hint">
                        Choisis l’un des hooks CREATIVE ci-dessus avant le storyboard.
                      </div>
                    )}
                  </>
                )}
                <button
                  className="wv-media-action secondary"
                  disabled={busy}
                  onClick={() => void onGenerateCreative(story)}
                >
                  ↻ Régénérer CREATIVE
                </button>
              </>
            )}
            <button
              className="wv-media-action secondary"
              disabled={busy}
              onClick={() => void onDecision(story, "request_changes")}
            >
              Demander une correction
            </button>
            <button
              className="wv-media-action danger"
              disabled={busy}
              onClick={() => void onDecision(story, "reject")}
            >
              Refuser
            </button>
          </>
        )}

        {story.status === "scripting" && (
          <>
            {!story.voiceover ? (
              <>
                <button
                  className="wv-media-action primary"
                  disabled={busy || !story.video_draft}
                  onClick={() => void onGenerateVoiceover(story)}
                >
                  ◉ Générer la voix off IA
                </button>
                <div className="wv-media-action-hint">
                  AUDIO lira le script approuvé, puis comparera sa transcription au texte avant d’autoriser le rendu.
                </div>
              </>
            ) : story.qa.audio === "pass" ? (
              <>
                <button
                  className="wv-media-action primary"
                  disabled={busy || !story.video_draft}
                  onClick={() => void onLaunchRender(story)}
                >
                  ▶ Lancer l’aperçu Remotion
                </button>
                <button
                  className="wv-media-action secondary"
                  disabled={busy}
                  onClick={() => void onGenerateVoiceover(story)}
                >
                  ↻ Régénérer la voix off
                </button>
              </>
            ) : (
              <>
                <div className="wv-media-action-hint">
                  La voix off a échoué au contrôle AUDIO. Le rendu reste bloqué pour éviter une narration différente du script approuvé.
                </div>
                <button
                  className="wv-media-action primary"
                  disabled={busy}
                  onClick={() => void onGenerateVoiceover(story)}
                >
                  ↻ Régénérer AUDIO
                </button>
              </>
            )}
            <button
              className="wv-media-action secondary"
              disabled={busy}
              onClick={() => void onDecision(story, "request_changes")}
            >
              Demander une correction
            </button>
            <button
              className="wv-media-action danger"
              disabled={busy}
              onClick={() => void onDecision(story, "reject")}
            >
              Refuser
            </button>
          </>
        )}

        {story.status === "rendering" && (
          <>
            <div className="wv-media-progress-note">
              Rendu en cours : {Math.round((story.render_job?.progress ?? 0) * 100)}%.
            </div>
            <button
              className="wv-media-action primary"
              disabled={busy}
              onClick={() => void onSyncRender(story)}
            >
              ↻ Actualiser le rendu
            </button>
            <button
              className="wv-media-action secondary"
              disabled={busy}
              onClick={() => void onDecision(story, "request_changes")}
            >
              Arrêter et corriger
            </button>
          </>
        )}

        {story.status === "assets" && (
          <>
            <div className="wv-media-progress-note">
              {assetsResolved
                ? "Tous les médias requis ont une sélection aux droits approuvés."
                : `Il reste ${story.asset_bundle?.unresolved_scene_orders.length ?? 0} scène(s) média à résoudre.`}
            </div>
            <button
              className="wv-media-action primary"
              disabled={busy || !story.selected_hook_id || !assetsResolved}
              onClick={() => void onPrepareDraft(story)}
            >
              ▶ Préparer le storyboard avec ces médias
            </button>
            <button
              className="wv-media-action secondary"
              disabled={busy}
              onClick={() => void onDiscoverAssets(story)}
            >
              ↻ Relancer la recherche médias
            </button>
            <button
              className="wv-media-action danger"
              disabled={busy}
              onClick={() => void onDecision(story, "reject")}
            >
              Refuser
            </button>
          </>
        )}

        {story.status === "preview_ready" && (
          <>
            <button
              className="wv-media-action primary"
              disabled={busy}
              onClick={() => void onDecision(story, "approve_preview")}
            >
              ✓ Valider le montage → QA
            </button>
            <button
              className="wv-media-action secondary"
              disabled={busy}
              onClick={() => void onDecision(story, "request_changes")}
            >
              Demander une nouvelle version
            </button>
          </>
        )}

        {story.status === "qa" && (
          <>
            {!story.qa_report || !story.qa_report.all_passed ? (
              <>
                <div className="wv-media-progress-note">
                  Montage validé. Lance le QA final : faits, orthographe, safe zones, logo, sources, droits, audio et intégrité réelle du MP4.
                </div>
                <button
                  className="wv-media-action primary"
                  disabled={busy}
                  onClick={() => void onRunQa(story)}
                >
                  ◎ Lancer le QA final
                </button>
                {story.qa_report && (
                  <button
                    className="wv-media-action secondary"
                    disabled={busy}
                    onClick={() => void onRunQa(story)}
                  >
                    ↻ Relancer le QA
                  </button>
                )}
              </>
            ) : (
              <>
                <div className="wv-media-progress-note">
                  Les 8 contrôles QA sont au vert. Cette version peut être marquée prête à publier.
                </div>
                <button
                  className="wv-media-action primary"
                  disabled={busy}
                  onClick={() => void onDecision(story, "mark_publish_ready")}
                >
                  ✓ Marquer prêt à publier
                </button>
              </>
            )}
            <button
              className="wv-media-action secondary"
              disabled={busy}
              onClick={() => void onDecision(story, "request_changes")}
            >
              Demander une correction
            </button>
          </>
        )}

        {story.status === "publish_ready" && (
          <>
            {!story.publication_package ? (
              <>
                <div className="wv-media-progress-note">
                  Le contenu est prêt. Prépare maintenant le manifeste canonique TikTok + WhatsApp avant toute publication externe.
                </div>
                <button
                  className="wv-media-action primary"
                  disabled={busy}
                  onClick={() => void onPreparePublication(story)}
                >
                  ⇧ Préparer le package de publication
                </button>
              </>
            ) : (
              <>
                <div className="wv-media-progress-note">
                  Package prêt. Le statut restera « prêt à publier » jusqu’à réception de preuves de publication pour tous les canaux demandés.
                </div>
                <button
                  className="wv-media-action secondary"
                  disabled={busy}
                  onClick={() => void onPreparePublication(story)}
                >
                  ↻ Régénérer le package
                </button>
              </>
            )}
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
