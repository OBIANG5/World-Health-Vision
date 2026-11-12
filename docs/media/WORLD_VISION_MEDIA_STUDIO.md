# World-Vision Media Studio

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

RADAR -> VERIFY -> SCORE -> NEWSROOM -> CREATIVE -> ASSETS -> STUDIO -> QA -> APPROVAL -> PUBLISH

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
Initial recommendation:
- Remotion as primary renderer
- FFmpeg for encoding, audio normalization and media preparation
- reusable World-Vision scene components
- 1080x1920 / 30 fps default

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

- frontend/media-studio/ : editorial control room UI
- services/media-radar/ : ingestion, dedupe, source metadata
- services/media-editorial/ : verification, scoring, script generation
- services/media-renderer/ : Remotion/FFmpeg rendering
- services/media-publisher/ : platform adapters, initially disabled/manual
- data/media/ : schemas, source registry, country source packs
- infra/media/ : queues, scheduler, object storage and workers

## Automation strategy

Do not make Make.com the core engine.

Use:
- World-Vision backend for state, logic and audit trail
- workers/queues for scheduled processing
- OpenAI APIs for research assistance, ranking, writing and visual generation where appropriate
- Make for peripheral integrations and notifications
- official platform APIs for publishing when available and approved

## Initial publication policy

Phase 1: manual publishing after final approval.
Phase 2: one-click publishing where official APIs allow.
Phase 3: optional auto-publishing only for explicitly whitelisted formats and confidence thresholds.

## Success criteria for Phase 1

- one story can move from source to approved preview
- all claims retain source provenance
- score is explainable
- video output is 1080x1920
- TikTok-safe composition
- preview can be approved/rejected from the dashboard
- corrections persist as reusable rules
