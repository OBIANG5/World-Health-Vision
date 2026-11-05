-- ============================================================
-- V10 : Eurostat indicators — catalog completeness check
-- ============================================================
-- Context:
--   The Eurostat pipeline reuses the same WB/WDI indicator codes
--   (e.g. SL.UEM.TOTL.ZS) because they represent identical concepts.
--   Observations ingested via Eurostat will carry source_code=EUROSTAT
--   in the timeseries store; the catalog entry remains shared.
--
--   Most codes already exist in the catalog via V2/V7/V8.
--   This migration ensures GC.DOD.TOTL.GD.ZS is present, which is
--   referenced by the Eurostat pipeline but may not have been inserted
--   in an earlier migration.
--
--   source_dataset_id = 10000000-0000-0000-0000-000000000001 (WDI)
-- ============================================================

insert into catalog.indicator (
    code,
    display_name,
    topic,
    unit_label,
    description,
    preferred_frequency,
    source_dataset_id,
    is_core,
    methodology_notes
)
values (
    'GC.DOD.TOTL.GD.ZS',
    'General government gross debt (% of GDP)',
    'FISCAL',
    'PERCENT_OF_GDP',
    'Accumulated gross debt of general government (all liabilities requiring future payment of interest and/or principal) as a percentage of GDP. Follows the Maastricht/ESA 2010 definition.',
    'ANNUAL',
    '10000000-0000-0000-0000-000000000001',
    true,
    'WB WDI and Eurostat use the Maastricht definition. IMF GFS may differ slightly due to pension and contingent liability treatment.'
)
on conflict (code) do nothing;