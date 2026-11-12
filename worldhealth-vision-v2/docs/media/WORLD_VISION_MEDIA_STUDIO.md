# World-Vision Media Studio

## Implementation status — 2026-11-12

Implemented on `feature/world-vision-media-studio`:

- canonical V2 `media-service` (FastAPI), Control Room and gateway integration;
- PostgreSQL newsroom persistence with JSONB story state and idempotent RADAR scan audit history;
- Redis-backed distributed RADAR scheduler with lock, heartbeat and five-minute production cadence;
- live OpenAI web-search RADAR with retrieved-URL grounding, deduplication and explainable editorial scoring;
- canonical country/local-source enrichment through `catalog-service`, with code fallback only when the catalogue has no entry;
- claim-level VERIFY reports with supporting/contradicting URLs and a hard approval gate for unverified stories;
- human editorial approval before production;
- claim-grounded CREATIVE packages: angle, hooks, narration segments, caption, hashtags and scene plan;
- rights-aware ASSETS discovery through Wikimedia Commons with author, licence, attribution and explicit review states;
- automatic blocking of final drafts when a real-media scene has unresolved rights;
- renderer-ready `VideoDraft` (1080x1920, 30 fps, timed scenes) with selected licensed imagery;
- OpenAI Realtime voice-over generation using PCM 24 kHz, WAV persistence, transcript comparison, duration QA and visible AI disclosure;
- asynchronous Remotion renderer with queue, progress, H.264 output, real imagery, attribution, narration and browser range streaming;
- final explainable QA report for facts, spelling, safe-zone preflight, logo/design-system integrity, source display, rights and audio;
- canonical Publication Package for TikTok + WhatsApp text/video/source metadata with SHA-256 manifest;
- proof-based publication receipts: a story cannot become `published` until all requested channels have real receipt evidence;
- Prometheus monitoring and six-job CI covering media service, PostgreSQL integration, renderer, frontend, gateway and Compose;
- draft pull request #5 used as a non-merge validation surface.

Deliberately not implemented yet:

- official authenticated TikTok publishing connector;
- official WhatsApp Channel publishing connector;
- broader production-scale country source packs beyond the current canonical catalogue coverage;
- automated acquisition/licensing of arbitrary news video footage (ASSETS currently automates rights-aware Wikimedia image discovery);
- music beds and final broadcast-style loudness normalization;
- pixel-level computer-vision QA of rendered frames (current safe-zone/logo checks are deterministic structural preflight plus fixed Remotion contracts);
- autonomous publishing without human approval or explicit channel allow-lists.

The Remotion composition is now a **functional newsroom renderer**, not only a placeholder:
licensed selected images, attribution and validated AI narration can be embedded in the final preview. Unsupported or unresolved media are never silently fabricated.

---

## Goal

Build a semi-automated newsroom capable of detecting, ranking, verifying, producing and preparing one short-form French news video per hour, with human approval gates before publication.

This module is isolated from the core World-Vision product while remaining integration-ready.

## Product principles

1. Country-first: prioritize national institutions, local agencies and local media, then compare with international sources.
2. Source-first: no factual claim without provenance.
3. Speed with verification: breaking-news speed must never bypass basic factual checks.
4. Human-in-the-loop: ideas, scripts and final previews can be approved, rejected or revised.
5. Reproducible production: videos are generated from reusable code-based templates, not hand-edited one by one.
6. Mobile-first: TikTok/Reels/Shorts safe zones, 9:16 output, readable typography.
7. Rights-aware: every visual/audio asset stores source and licence metadata.
8. Learning loop: every rejection or correction becomes a production rule.

## Pipeline

RADAR -> VERIFY -> SCORE -> NEWSROOM -> APPROVAL -> CREATIVE -> ASSETS -> STUDIO -> AUDIO -> PREVIEW -> QA -> PACKAGE -> PUBLISH

### RADAR
Continuously ingest:
- international agencies and major outlets
- African and national press agencies
- ministries, central banks, statistics offices, courts and public institutions
- trusted local media
- selected social signals for discovery only

### VERIFY
Store:
- original URL/source
- publication time
- event time
- country
- source type
- primary/secondary source status
- confirmations
- contradictions
- confidence score

### SCORE
Score each candidate for:
- freshness
- surprise
- human impact
- importance
- visual potential
- numerical impact
- undercoverage
- relevance to French-speaking audiences
- relevance to Africa
- source confidence
- competition/saturation
- urgency

Output: 0-100 editorial opportunity score.

### NEWSROOM
Dashboard states:
- detected
- verifying
- candidate
- approved
- scripting
- assets
- rendering
- QA
- preview ready
- changes requested
- publish ready
- published
- rejected

### CREATIVE
Generate:
- 3 hooks
- recommended angle
- 10-30 second target duration
- on-screen copy
- voice-over
- scene list
- TikTok caption
- hashtags
- source line

### ASSETS
Collect:
- real photos/video where rights permit
- official maps/charts/documents
- icons and reusable graphics
- generated visuals only when appropriate
- licence/source metadata for every asset

### STUDIO
Implemented foundation:
- Remotion as the primary code-based renderer;
- reusable World-Vision scene components;
- 1080x1920 / 30 fps default;
- selected licensed imagery with attribution;
- validated AI narration mixed into the MP4;
- H.264 output and browser range streaming.

FFmpeg remains the target for future loudness normalization and richer media preparation.

### QA
Automated checks:
- factual/source completeness
- names, dates and numbers
- spelling
- TikTok safe zones
- overflow/overlap
- logo integrity
- readability on phone
- duration
- audio loudness
- licence metadata
- duplicate/repetitive hook detection

### APPROVAL
Human controls:
- approve idea
- reject
- request another angle
- edit hook/script
- swap asset
- approve preview
- request revision
- mark publish-ready

## First vertical slice

Build one complete real-news workflow before full automation:

1. Manually ingest one current story.
2. Save source metadata.
3. Compute editorial score.
4. Show it in the newsroom dashboard.
5. Generate 3 hooks and a short script.
6. Select assets.
7. Render one 9:16 World-Vision video.
8. Run QA.
9. Show preview with Approve / Revise / Reject.
10. Store the final package and publication metadata.

## Architecture target

- frontend/web-v2/src/media/ : editorial control room UI
- services/media-service/ : newsroom state, provenance, scoring and approvals
- services/media-service/ : newsroom state, RADAR, VERIFY, scoring, CREATIVE, ASSETS, AUDIO, QA, publication manifests and approvals
- services/media-renderer/ : Remotion worker and media/audio serving
- services/catalog-service/ : canonical country/local-source catalogue
- services/ingestion-service/ : structured-data ingestion and future additional source connectors
- future publisher adapters : official authenticated TikTok / WhatsApp integrations
- infra/ : PostgreSQL, Redis scheduler/locks, persistent media volumes, monitoring and workers

## Automation strategy

Do not make Make.com the core engine.

Use:
- World-Vision backend for state, logic and audit trail
- workers/queues for scheduled processing
- OpenAI APIs for research assistance, ranking, writing and visual generation where appropriate
- Make for peripheral integrations and notifications
- official platform APIs for publishing when available and approved

## Initial publication policy

Phase 1 (current): generate a canonical, QA-approved publication package and publish externally only after human approval; record proof receipts per channel.
Phase 2: one-click publishing through official authenticated platform APIs, with the same package hash and receipt model.
Phase 3: optional auto-publishing only for explicitly whitelisted formats, channels and confidence/QA thresholds.

## Success criteria for Phase 1

- one story can move from live discovery to `publish_ready` through guarded transitions;
- all factual claims retain source evidence;
- score is explainable;
- real-media rights and attribution are retained;
- AI narration is transcript-checked and disclosed;
- video output is 1080x1920 / 30 fps;
- TikTok-safe structural preflight is enforced;
- final QA produces an explainable report;
- publication text/video/sources are frozen into a SHA-256 manifest;
- `published` requires proof receipts for every target channel;
- the full branch remains green across the six CI validation jobs.
