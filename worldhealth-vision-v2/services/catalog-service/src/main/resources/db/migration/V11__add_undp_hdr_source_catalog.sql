-- ============================================================
-- V11 : UNDP Human Development Report — source + dataset + indicators
-- ============================================================
-- New UUIDs allocated:
--   Source  : 00000000-0000-0000-0000-000000000014  (UNDP_HDR)
--   Dataset : 10000000-0000-0000-0000-000000000020  (UNDP_HDR_COMPOSITE)
-- ============================================================

-- 1. Source record
insert into catalog.source (
    id,
    code,
    display_name,
    type,
    organization_name,
    homepage_url,
    documentation_url,
    access_model,
    license_summary,
    geographic_scope,
    temporal_granularity,
    update_cadence,
    bias_notes,
    quality_notes
)
values (
    '00000000-0000-0000-0000-000000000014',
    'UNDP_HDR',
    'UNDP Human Development Report',
    'OFFICIAL',
    'United Nations Development Programme',
    'https://hdr.undp.org/',
    'https://hdr.undp.org/data-center/documentation-and-downloads',
    'OPEN',
    'Public dataset. Review UNDP terms before redistribution.',
    'GLOBAL',
    'COUNTRY',
    'ANNUAL',
    'HDI is a composite of health, education and income. Methodological updates across years affect cross-year comparability. Country coverage varies by data availability.',
    'Gold standard for human development measurement. Published annually since 1990. Peer-reviewed methodology documented in technical notes.'
)
on conflict (code) do update set
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

-- 2. Source dataset record
insert into catalog.source_dataset (
    id,
    source_id,
    code,
    display_name,
    description,
    category,
    default_granularity,
    default_frequency,
    documentation_url,
    license_summary
)
values (
    '10000000-0000-0000-0000-000000000020',
    '00000000-0000-0000-0000-000000000014',
    'UNDP_HDR_COMPOSITE',
    'UNDP HDR Composite Indices',
    'HDI, GII, IHDI and related composite indices from the Human Development Report complete time-series dataset.',
    'HUMAN_DEVELOPMENT',
    'COUNTRY',
    'ANNUAL',
    'https://hdr.undp.org/data-center/documentation-and-downloads',
    'Public dataset documented and maintained by UNDP.'
)
on conflict (source_id, code) do update set
    display_name      = excluded.display_name,
    description       = excluded.description,
    is_enabled        = true;

-- 3. Indicator records
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
values
    (
        'WHV.HDR.HDI.INDEX',
        'Human Development Index (HDI)',
        'HUMAN_DEVELOPMENT',
        'INDEX_0_1',
        'Composite index measuring average achievement in three key dimensions of human development: a long and healthy life, access to knowledge and a decent standard of living. Ranges from 0 (lowest) to 1 (highest).',
        'ANNUAL',
        '10000000-0000-0000-0000-000000000020',
        true,
        'Geometric mean of normalised indices for life expectancy, education (mean and expected years of schooling) and GNI per capita (PPP$). UNDP revises the methodology periodically; historical series are backdated accordingly.'
    ),
    (
        'WHV.HDR.GII.INDEX',
        'Gender Inequality Index (GII)',
        'HUMAN_DEVELOPMENT',
        'INDEX_0_1',
        'Composite index reflecting gender-based inequalities in three dimensions: reproductive health, empowerment and labour-market participation. A value of 0 indicates full equality; 1 indicates maximum inequality.',
        'ANNUAL',
        '10000000-0000-0000-0000-000000000020',
        true,
        'Based on maternal mortality ratio, adolescent birth rate, share of parliamentary seats held by women, population with at least some secondary education and labour force participation rate. Geometric mean of arithmetic means of dimension indices.'
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