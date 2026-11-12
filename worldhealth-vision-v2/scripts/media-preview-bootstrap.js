/*
 * Static public PREVIEW only. This file is copied into the generated preview
 * artifact, not loaded by the production V2 frontend.
 * All stories are intentionally fictional. No live scanner, renderer or publisher.
 */
(() => {
  "use strict";
  const stamp = "2026-11-12T18:00:00Z";
  const factors = {
    freshness: 94, surprise: 86, human_impact: 77, importance: 90,
    visual_potential: 81, numerical_strength: 74, undercoverage: 82,
    francophone_relevance: 87, africa_relevance: 91, source_confidence: 75,
    urgency: 83, saturation_penalty: 12,
  };
  const qa = {
    facts: "pending", spelling: "pending", safe_zones: "pending",
    logo_integrity: "pending", source_display: "pending",
    rights: "pending", audio: "pending", notes: [],
  };
  const demoSource = {
    id: "demo-source", name: "Référence de démonstration (NON journalistique)",
    url: "https://www.iana.org/domains/reserved",
    source_type: "other", scope: "international", is_primary: false,
    published_at: null,
    note: "Lien vers les domaines réservés pour les exemples, et non une preuve.",
  };
  const hooks = (prefix) => [
    {id: "hook-1", text: prefix + " : ce qu'il faut vérifier", score: 91,
      rationale: "Formulation prudente en attente de confirmation.", claim_indexes: []},
    {id: "hook-2", text: "Que savons-nous réellement de ce sujet fictif ?", score: 85,
      rationale: "Met l'accent sur les sources et les incertitudes.", claim_indexes: []},
    {id: "hook-3", text: "Trois questions pour comprendre ce scénario simulé", score: 80,
      rationale: "Accroche pédagogique.", claim_indexes: []},
  ];
  function makeStory(id, title, summary, country, name, score, status) {
    return {
      id, slug: id, status, title, summary, category: "DÉMONSTRATION",
      language: "fr", country_iso3: country, country_name: name,
      region: null, breaking: false, detected_at: stamp, event_at: stamp,
      updated_at: stamp, verification_status: "unverified",
      confidence_score: 0, verification_report: null, sources: [],
      score: {
        total: score, factors: {...factors},
        reasons: [
          "Score EXEMPLE pour illustrer le tri éditorial (aucune analyse réelle).",
          "Les informations montrées ne correspondent à aucune actualité.",
        ],
        model_version: "demo-fictif-v1",
      },
      hooks: hooks("EXEMPLE"), selected_hook_id: null, creative_package: null,
      script: null, video_draft: null, voiceover: null, render_job: null,
      target_duration_sec: 20,
      assets: {photos: 0, videos: 0, official_documents: 0, maps_or_charts: 0},
      asset_bundle: null, qa: {...qa}, qa_report: null,
      publication_package: null, channel_exports: [],
      publication_receipts: [], approval_note: null,
    };
  }
  const stories = [
    makeStory(
      "demo-radar-001",
      "[DÉMO FICTIVE] Une annonce économique à vérifier",
      "Sujet inventé pour explorer le classement, les sources et le processus de validation.",
      "GAB", "Gabon", 92, "candidate",
    ),
    makeStory(
      "demo-studio-002",
      "[DÉMO FICTIVE] Un scénario de reportage local",
      "Exemple pédagogique pour visualiser le script, le storyboard et les contrôles.",
      "COD", "République démocratique du Congo", 87, "scripting",
    ),
    makeStory(
      "demo-radar-003",
      "[DÉMO FICTIVE] Une découverte scientifique imaginaire",
      "Aucune découverte réelle n'est annoncée : cette carte sert uniquement à tester l'interface.",
      "FRA", "France", 72, "detected",
    ),
  ];
  const studio = stories[1];
  studio.sources = [{...demoSource}];
  studio.verification_status = "unverified";
  studio.hooks = hooks("SCÉNARIO");
  studio.selected_hook_id = "hook-1";
  studio.creative_package = {
    version: 1, created_at: stamp, model: "exemple-statique",
    angle: "Comprendre les faits avant d'affirmer", angle_claim_indexes: [],
    target_duration_sec: 18, hooks: studio.hooks,
    script_segments: [
      {text: "Ceci est une démonstration de la rédaction World-Vision.", claim_indexes: []},
      {text: "En production, chaque phrase doit être vérifiée par ses sources.", claim_indexes: []},
      {text: "La validation humaine reste obligatoire avant publication.", claim_indexes: []},
    ],
    caption: "DÉMO FICTIVE : aucun événement réel ni vidéo publiée.",
    caption_claim_indexes: [], hashtags: ["#Demo", "#WorldVision"],
    scene_plan: [
      {order: 1, purpose: "hook", on_screen_text: "DÉMONSTRATION",
        visual_kind: "typography", asset_query: null, claim_indexes: []},
      {order: 2, purpose: "explanation", on_screen_text: "Vérifier les sources",
        visual_kind: "typography", asset_query: null, claim_indexes: []},
      {order: 3, purpose: "source_and_brand", on_screen_text: "Validation humaine",
        visual_kind: "source_card", asset_query: null, claim_indexes: []},
    ],
  };
  studio.video_draft = {
    version: 1, created_at: stamp, format: "9:16", width: 1080, height: 1920,
    fps: 30, duration_sec: 18, rendering_engine: "remotion",
    design_system_id: "world-vision-v1", safe_zone_profile: "tiktok-v1",
    hook_id: "hook-1", voiceover_script:
      "Ceci est une démonstration de la rédaction World-Vision. Les sources doivent être vérifiées.",
    source_line: "SOURCE : simulation, aucune actualité réelle",
    scenes: [
      {id: "scene-1", order: 1, start_sec: 0, duration_sec: 5,
        purpose: "hook", on_screen_text: "DÉMONSTRATION",
        visual_kind: "typography", source_ids: []},
      {id: "scene-2", order: 2, start_sec: 5, duration_sec: 8,
        purpose: "explanation", on_screen_text: "Vérifier avant de publier",
        visual_kind: "typography", source_ids: []},
      {id: "scene-3", order: 3, start_sec: 13, duration_sec: 5,
        purpose: "source_and_brand", on_screen_text: "Validation humaine obligatoire",
        visual_kind: "source_card", source_ids: []},
    ],
  };

  const nativeFetch = window.fetch.bind(window);
  function json(body, status = 200) {
    return Promise.resolve(new Response(JSON.stringify(body), {
      status, headers: {"content-type": "application/json; charset=utf-8"},
    }));
  }
  window.fetch = (input, init) => {
    const target = typeof input === "string" ? input : input.url;
    const url = new URL(target, window.location.href);
    if (!url.pathname.startsWith("/api/media/")) return nativeFetch(input, init);
    const method = (init && init.method || (input.method || "GET")).toUpperCase();
    if (url.pathname === "/api/media/stories" && method === "GET") {
      return json(stories);
    }
    if (url.pathname === "/api/media/dashboard" && method === "GET") {
      return json({
        total: stories.length,
        detected: stories.filter(s => s.status === "detected").length,
        verifying: 0, candidates: stories.filter(s => s.status === "candidate").length,
        in_production: stories.filter(s => s.status === "scripting").length,
        preview_ready: 0, publish_ready: 0, published: 0, rejected: 0,
        top_score: Math.max(...stories.map(s => s.score.total)),
      });
    }
    if (url.pathname === "/api/media/radar/scheduler" && method === "GET") {
      return json({
        enabled: false, interval_seconds: 300, scan_hours: 6,
        max_candidates: 12, redis_connected: false, lock_held: false,
        last_run_status: "DÉMONSTRATION : aucun radar actif",
      });
    }
    if (url.pathname === "/api/media/radar/scans/history" && method === "GET") {
      return json([]);
    }
    const hookMatch = url.pathname.match(/^\/api\/media\/stories\/([^/]+)\/hooks\/select$/);
    if (method === "POST" && hookMatch) {
      const story = stories.find(s => s.id === hookMatch[1]);
      if (!story) return json({detail: "Sujet introuvable."}, 404);
      try {
        const data = JSON.parse(init.body || "{}");
        if (!story.hooks.some(h => h.id === data.hook_id)) {
          return json({detail: "Accroche inconnue."}, 400);
        }
        story.selected_hook_id = data.hook_id;
        return json(story);
      } catch {
        return json({detail: "Requête invalide."}, 400);
      }
    }
    return json({
      detail: "Mode démonstration statique : aucune recherche, génération, validation ou publication réelle. Un serveur World-Vision est nécessaire.",
    }, 409);
  };
  function showNotice() {
    if (document.querySelector("#wv-media-demo-notice")) return;
    const banner = document.createElement("div");
    banner.id = "wv-media-demo-notice";
    banner.setAttribute("role", "status");
    banner.textContent = "APERÇU MOBILE · DONNÉES FICTIVES · aucune veille ou publication en direct";
    banner.style.cssText = [
      "position:fixed", "inset:0 0 auto", "z-index:999999",
      "background:#17375b", "color:white", "padding:11px 12px",
      "font:700 12px/1.35 system-ui,sans-serif", "text-align:center",
      "box-shadow:0 2px 16px rgba(0,0,0,.2)",
    ].join(";");
    document.body.style.paddingTop = "42px";
    document.body.appendChild(banner);
  }
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", showNotice, {once: true});
  } else {
    showNotice();
  }
})();
