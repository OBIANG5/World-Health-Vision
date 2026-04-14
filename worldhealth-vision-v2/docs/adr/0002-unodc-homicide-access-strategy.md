# ADR 0002: UNODC Homicide Access Strategy

## Status
Accepted

## Context

`WorldHealth Vision` needs a first serious safety/criminality pillar.
The first source chosen is `UNODC`, starting with intentional homicide as a clearly framed safety baseline.

During implementation, the official public sources were verified:

- UNODC homicide country-data page: `https://dataunodc.un.org/content/homicide-country-data`
- UNODC data search entry for `16.1.1 - Intentional homicide`
- UNODC homicide metadata PDF citing `dp-intentional-homicide-victims`

The public portal is open, but direct scripted access to a stable export URL is not reliable enough yet:

- public pages are heavily portal-driven
- direct workbook URLs can return HTML instead of a file in non-browser access patterns
- this makes a hard-coded live download path too brittle for the ingestion backbone

## Decision

The first `UNODC` ingestion adapter will support:

1. `official local export` as the primary reliable mode
2. `optional direct download URL` as a secondary mode when a stable export URL is confirmed

The ingestion service therefore accepts:

- `WHV_INGEST_UNODC_HOMICIDE_EXPORT_PATH`
- `WHV_INGEST_UNODC_HOMICIDE_DOWNLOAD_URL`

If the remote URL returns HTML instead of a tabular dataset, the adapter fails explicitly and instructs the operator to use the official local export path.

## Consequences

### Positive

- avoids pretending the portal is more machine-stable than it is
- keeps provenance clean because the source remains an official UNODC export
- allows progress on the safety pillar now instead of blocking on portal reverse-engineering
- keeps the adapter ready for a future stable direct-download workflow

### Negative

- the very first runtime validation may require a manually downloaded official export file
- we do not yet have a fully automated end-to-end UNODC pull like World Bank or OECD

## Notes

The first canonical indicator opened through this pillar is:

- `WHV.SAFETY.HOMICIDE.RATE.P100K`

It must always be presented as:

- a `baseline safety signal`
- not a complete crime score
- not a substitute for multi-source safety analysis
