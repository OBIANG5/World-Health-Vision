-- ============================================================
-- V15 : IMF IFS — International Financial Statistics
-- Source: IMF already exists (00000000-0000-0000-0000-000000000002)
-- New dataset : 10000000-0000-0000-0000-000000000022  (IMF_IFS)
-- ============================================================

insert into catalog.source_dataset (
    id, source_id, code, display_name, description,
    category, default_granularity, default_frequency,
    documentation_url, license_summary
) values (
    '10000000-0000-0000-0000-000000000022',
    '00000000-0000-0000-0000-000000000002',
    'IMF_IFS',
    'IMF International Financial Statistics',
    'Core balance of payments, monetary, financial and international reserves data compiled by the IMF from member country reports.',
    'FINANCIAL',
    'COUNTRY',
    'ANNUAL',
    'https://datahelp.imf.org/knowledgebase/articles/838041',
    'Public data via SDMX JSON API. Review IMF terms before redistribution.'
) on conflict (source_id, code) do update set
    display_name      = excluded.display_name,
    description       = excluded.description,
    is_enabled        = true;

insert into catalog.indicator (
    code, display_name, topic, unit_label, description,
    preferred_frequency, source_dataset_id, is_core, methodology_notes
) values
    (
        'WHV.IFS.RESERVES.XAU.USD',
        'International reserves excluding gold (USD millions)',
        'FINANCIAL',
        'USD_MILLIONS',
        'Total official reserve assets held by monetary authorities, excluding gold. Comprises foreign currency assets, SDR holdings and reserve position in the IMF. Key indicator of external financial resilience.',
        'ANNUAL',
        '10000000-0000-0000-0000-000000000022',
        true,
        'IMF IFS series RAXG_USD. Reported by member country monetary authorities to IMF. SDR values converted at year-end SDR/USD rate.'
    ),
    (
        'WHV.IFS.BROAD.MONEY.GDP',
        'Broad money M2 (% of GDP)',
        'MONETARY',
        'PERCENT_OF_GDP',
        'Broad money (M2) as a percentage of GDP. Measures the depth and development of the financial system. High values typically indicate a developed financial sector; very rapid growth can signal monetary imbalances.',
        'ANNUAL',
        '10000000-0000-0000-0000-000000000022',
        true,
        'IMF IFS series FMBM_XDC_R_B (broad money to GDP ratio). Definitions of M2 vary by country; some countries report M3. Comparison across countries should account for definitional differences.'
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