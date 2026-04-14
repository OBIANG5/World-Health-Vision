# ADR 0001 - Source Pillar Sequencing After ILOSTAT

## Status
Accepted

## Date
2026-04-11

## Context
`WorldHealth Vision` is being built as a multi-source economic intelligence platform.
At this stage, the backend already has:

- `World Bank` for baseline macro structure
- `IMF` for a second macro voice and source divergence
- `ILOSTAT` to strengthen labour-market reality beyond macro aggregates

The next source pillar must be chosen carefully because it shapes the product's next real user value.
The two candidates are:

- `OECD`
- `UNODC`

## Decision
We choose `OECD` as the next source pillar to implement after the current ILOSTAT expansion.

`UNODC` remains important, but it is intentionally sequenced after OECD.

## Rationale

### Why OECD now
- It reinforces the current product core: economic clarity, affordability, purchasing power, housing and price pressure.
- It deepens the most immediate user-facing use cases already identified for the product:
  - understanding a country's economic reality
  - comparing destinations
  - reading cost pressure and quality-of-life context
  - supporting future travel and currency decision tools
- It fits the existing analytics architecture cleanly:
  - macro snapshots
  - source divergence
  - confidence/freshness
  - country/region/continent views
- It keeps the product focused on a coherent economic narrative before opening a broader safety narrative.

### Why not UNODC yet
- `UNODC` opens a new product pillar: safety/criminality.
- Safety should not be represented from a single homicide dataset alone.
- A serious safety pillar will need multiple families of evidence, for example:
  - official crime data
  - travel advisories
  - governance/rule-of-law context
  - later, perception or field-level complements
- Implementing UNODC too early would create a risk of over-signalling confidence on a sensitive domain before the evidence stack is mature enough.

## Consequences

### Immediate next implementation target
The next source-family implementation after ILOSTAT should focus on OECD indicators related to:

1. price pressure and household affordability
2. purchasing power / comparative living standards
3. housing or cost-of-living signals when coverage is strong enough

### Product sequencing
The source pillar order is now:

1. World Bank
2. IMF
3. ILOSTAT
4. OECD
5. UNODC

## Notes
This is a sequencing decision, not a rejection of UNODC.
UNODC becomes the next priority after OECD once the safety pillar is ready to be implemented with multiple source families and clear methodological framing.
