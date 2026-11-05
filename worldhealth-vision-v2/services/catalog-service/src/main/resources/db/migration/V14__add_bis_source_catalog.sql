-- ============================================================
-- V14 : BIS — Bank for International Settlements
-- Source UUID : 00000000-0000-0000-0000-000000000015
-- Dataset     : 10000000-0000-0000-0000-000000000021  (BIS_STATISTICS)
-- ============================================================

insert into catalog.source (
    id, code, display_name, type, organization_name,
    homepage_url, documentation_url, access_model, license_summary,
    geographic_scope, temporal_granularity, update_cadence,
    bias_notes, quality_notes
) values (
    '00000000-0000-0000-0000-000000000015',
    'BIS',
    'Bank for International Settlements',
    'OFFICIAL',
    'Bank for International Settlements',
    'https://www.bis.org/',
    'https://stats.bis.org/api/v2/',
    'OPEN',
    'Public SDMX REST API. Review BIS terms before redistribution.',
    'GLOBAL',
    'COUNTRY',
    'PERIODIC',
    'BIS aggregates data from member central banks — coverage is strongest for BIS reporting countries (63 jurisdictions). Non-member countries may have gaps.',
    'Gold standard for banking and credit statistics. Central bank policy rates are authoritative — compiled directly from central banks. Total credit to private sector is the benchmark series used in academic research on financial cycles.'
) on conflict (code) do update set
    display_name        = excluded.display_name,
    type                = excluded.type,
    organization_name   = excluded.organization_name,
    homepage_url        = excluded.homepage_url,
    documentation_url   = excluded.documentation_url,
    access_model        = excluded.access_model,
    license_summary     = excluded.license_summary,
    geographic_scope    = excluded.geographic_scope,
    temporal_granularity = excluded.temporal_granularity,
    update_cadence      = excluded.update_cadence,
    bias_notes          = excluded.bias_notes,
    quality_notes       = excluded.quality_notes,
    is_enabled          = true;

insert into catalog.source_dataset (
    id, source_id, code, display_name, description,
    category, default_granularity, default_frequency,
    documentation_url, license_summary
) values (
    '10000000-0000-0000-0000-000000000021',
    '00000000-0000-0000-0000-000000000015',
    'BIS_STATISTICS',
    'BIS Statistics — Policy Rates & Credit',
    'Central bank policy rates and total credit to private non-financial sector compiled by the BIS from member central banks and national sources.',
    'FINANCIAL',
    'COUNTRY',
    'ANNUAL',
    'https://stats.bis.org/api/v2/',
    'Public BIS statistics. Freely accessible via SDMX REST API.'
) on conflict (source_id, code) do update set
    display_name      = excluded.display_name,
    description       = excluded.description,
    is_enabled        = true;

insert into catalog.indicator (
    code, display_name, topic, unit_label, description,
    preferred_frequency, source_dataset_id, is_core, methodology_notes
) values
    (
        'WHV.BIS.CBPOL.RATE',
        'Central bank policy rate (annual average, %)',
        'MONETARY',
        'PERCENT',
        'Annual average of monthly central bank policy rates. The policy rate is the main instrument used by central banks to signal the monetary policy stance and influence short-term interest rates. Compiled by the BIS from information provided by central banks.',
        'ANNUAL',
        '10000000-0000-0000-0000-000000000021',
        true,
        'BIS WS_CBPOL_D dataset. Monthly observations averaged to annual. Policy rate definitions vary by country (repo rate, discount rate, overnight rate). Not strictly comparable across monetary regimes.'
    ),
    (
        'WHV.BIS.CREDIT.PRIVATE.GDP',
        'Credit to private non-financial sector (% of GDP)',
        'FINANCIAL',
        'PERCENT_OF_GDP',
        'Total credit outstanding to the private non-financial sector as a percentage of GDP. Covers loans from all lenders (banks + non-banks). A key indicator of financial depth and a leading indicator of financial stress when elevated.',
        'ANNUAL',
        '10000000-0000-0000-0000-000000000021',
        true,
        'BIS WS_TC_Q dataset. Q4 observation used for annual value. BIS is the authoritative source for this series — used by IMF, FSB and academic researchers for financial cycle analysis.'
    )
on conflict (code) do update set
    display_name        = excluded.display_name,
    topic               = excluded.topic,
    unit_label          = excluded.unit_label,
    description         = excluded.description,
    preferred_frequency = excluded.preferred_frequency,
    source_dataset_id   = excluded.source_dataset_id,
    is_core             = excluded.is_core,
    methodology_notes   = excluded.methodology_notes;