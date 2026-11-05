# V2 Roadmap

## Goal

`worldhealth-vision-v2` is the canonical product line for `WorldHealth Vision`.

The target is not a generic dashboard. The target is a professional multi-source
economic intelligence platform that:

- exposes source provenance clearly
- compares imperfect sources honestly
- produces useful country, region, and continent views
- grows toward affordability, travel, and safety use cases

## Canonical Scope

Use these zones as the source of truth:

- `worldhealth-vision-v2/services`
- `worldhealth-vision-v2/frontend/web-v2`
- `worldhealth-vision-v2/infra`
- `worldhealth-vision-v2/docs`
- `worldhealth-vision-v2/notesperso.txt`

Treat these as legacy or reference material:

- repo root `services`, `frontend`, `infra`, `README.md`
- `V0`

`V0` remains the functional proof-of-concept reference.
`worldhealth-vision-v2` remains the active platform.

## Current State

### Solid and already usable

- `catalog-service`
- `timeseries-service`
- `ingestion-service`
- `analytics-service`
- `gateway-service`
- `whv-common-java`
- Docker runtime for the core backend stack
- source families already integrated:
  - `WORLD_BANK`
  - `IMF`
  - `ILOSTAT`
  - `OECD`
  - `UNSD_SDG`
  - `UNODC` local-export path

### Partially complete

- `frontend/web-v2`
- observability validation and dashboards
- Keycloak-backed product security flows
- architecture/security/RGPD documentation
- export surfaces (`CSV`, `PDF`)
- source-family expansion for travel and safety

### Declared but not yet built as real product slices

- `audit-service`
- `jobs-service`
- `user-service`
- `compute-engine-service`

## Guiding Rules

1. No opaque global score too early.
2. Every product-facing signal must preserve provenance.
3. Backend remains the primary quality focus until the product facade is stable.
4. Frontend work must consume real V2 contracts, not placeholder data.
5. New source pillars must be added only when they improve a real user-facing use case.

## Ordered Build Plan

## Phase 1 - Stabilize the Canonical Backend

Objective: make the current V2 backend easier to operate and easier to trust.

Tasks:

- finish runtime validation for every already-coded source in Docker
- validate migrations and startup order end-to-end
- standardize service health/readiness checks
- remove structural drift and duplicate code trees
- document canonical service responsibilities

Exit criteria:

- all active V2 services start cleanly in Compose
- source ingestion runs are repeatable
- no duplicate backend code remains under the frontend tree

## Phase 2 - Finish the Core Product Data Plane

Objective: make the platform reliable as a multi-source evidence system.

Tasks:

- strengthen `timeseries-service` around source-run traceability
- expose evidence metadata consistently on analytics responses
- add missing operational metadata for failed/partial source runs
- define retention and re-run strategy for bronze/staging/canonical layers

Exit criteria:

- every observation can be traced back to a source run
- analytics contracts expose evidence, freshness, and confidence consistently

## Phase 3 - Complete the Economic Product Surface

Objective: finish the first serious user-facing product pillar.

Tasks:

- expand country economic snapshots to the same maturity as region/continent
- deepen `relative-cost` with explicit affordability narratives
- add compare endpoints for product-level country and destination use cases
- add CSV exports for country snapshots, compare views, and source audit views

Exit criteria:

- a country page can be powered from V2 APIs alone
- compare flows are usable without falling back to V0

## Phase 4 - Add the Travel / Affordability Evidence Layer

Objective: move from structural affordability signals toward more decision-ready travel signals.

Priority source families:

1. FX / currency reference and rate history
2. housing affordability complements
3. later, accommodation and local-cost evidence when legal and stable

Tasks:

- finish the catalog currency layer end-to-end
- define the canonical FX ingestion path
- add travel-facing analytics contracts
- keep market and official evidence visibly separated

Exit criteria:

- V2 can explain relative cost, currency context, and affordability together

## Phase 5 - Open the Safety Pillar Carefully

Objective: build safety as a serious product surface, not a shallow crime score.

Current base:

- `WHV.SAFETY.HOMICIDE.RATE.P100K`

Next tasks:

- add `safety baseline snapshot` for country/region/continent
- frame homicide as one baseline signal only
- add a second safety evidence family before claiming broad confidence
- keep explicit methodological warnings on all safety views

Exit criteria:

- safety endpoints expose evidence and caution clearly
- no single-source safety interpretation is presented as full truth

## Phase 6 - Raise the Frontend to the Level of the Backend

Objective: stop treating `web-v2` as a shell and make it consume the real platform.

Tasks:

- wire real country selection to V2 APIs
- replace placeholder drawer blocks with real product sections
- add region/continent switching
- expose source audit and confidence cues in the UI
- preserve the visual identity already started in `EyeLayout`

Exit criteria:

- the V2 frontend becomes the main way to explore V2 backend capabilities

## Phase 7 - Product Operations and Security Hardening

Objective: make the platform operationally credible.

Tasks:

- validate JWT flows against live Keycloak roles/scopes
- define operator workflows for source runs and failures
- build `audit-service` or fold audit traces into an explicit interim design
- add CI/CD, quality gates, and security scanning
- fill `docs/security`, `docs/architecture`, and `docs/rgpd`

Exit criteria:

- deployment, auth, and audit behavior are documented and testable

## Phase 8 - Deferred Advanced Pillars

These remain intentionally deferred until the core product is stable:

- banking-system analysis
- crypto
- advanced ML / predictive AI
- C++ compute engine

These are not rejected. They are sequenced later to protect product coherence.

## Immediate Priority Queue

If work resumes now, the recommended order is:

1. finish backend runtime/documentation stabilization
2. build `safety baseline snapshot`
3. complete the first FX/currency ingestion path
4. wire the V2 frontend country drawer to real APIs
5. add first CSV exports

## Anti-Drift Notes

- Do not add new backend logic under `frontend/web-v2`.
- Do not use root V0 files as the active implementation target.
- Do not introduce new source pillars without a clear product reason.
- Do not let documentation lag indefinitely behind working contracts.