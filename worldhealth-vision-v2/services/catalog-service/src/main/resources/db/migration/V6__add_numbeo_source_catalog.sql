-- V6 : Enregistrement de la source Numbeo (données terrain coût de la vie)
-- Numbeo est une source de type MARKET : prix crowdsourcés, clé API requise.

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
) values (
    '00000000-0000-0000-0000-000000000012',
    'NUMBEO',
    'Numbeo',
    'MARKET',
    'Numbeo',
    'https://www.numbeo.com/',
    'https://www.numbeo.com/api/doc.jsp',
    'REGISTRATION',
    'Commercial API — review Numbeo terms of service before redistribution. Index methodology documented at numbeo.com/cost-of-living/cpi_explained.jsp.',
    'GLOBAL',
    'COUNTRY',
    'PERIODIC',
    'Crowd-sourced pricing data. Coverage and contributor density vary by country and city. High-income urban areas typically have denser contributions. Indices are relative to New York City = 100 which is itself a variable benchmark.',
    'Useful terrain signal for cost-of-living comparisons and travel planning. Cross-validate with official CPI or OECD price-level data for quantitative economic claims. Not a substitute for national statistics.'
)
on conflict (code) do update
set
    display_name      = excluded.display_name,
    type              = excluded.type,
    organization_name = excluded.organization_name,
    homepage_url      = excluded.homepage_url,
    documentation_url = excluded.documentation_url,
    access_model      = excluded.access_model,
    license_summary   = excluded.license_summary,
    geographic_scope  = excluded.geographic_scope,
    temporal_granularity = excluded.temporal_granularity,
    update_cadence    = excluded.update_cadence,
    bias_notes        = excluded.bias_notes,
    quality_notes     = excluded.quality_notes,
    is_enabled        = true;

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
) values (
    '10000000-0000-0000-0000-000000000015',
    '00000000-0000-0000-0000-000000000012',
    'NUMBEO_INDICES',
    'Numbeo Cost of Living Indices',
    'Country-level cost of living, rent, groceries, restaurant and purchasing-power indices compared to New York City (NYC = 100). Derived from crowd-sourced price submissions.',
    'PRICES',
    'COUNTRY',
    'ANNUAL',
    'https://www.numbeo.com/api/doc.jsp',
    'Commercial API — review Numbeo terms of service before redistribution.'
)
on conflict (source_id, code) do update
set
    display_name       = excluded.display_name,
    description        = excluded.description,
    category           = excluded.category,
    default_granularity = excluded.default_granularity,
    default_frequency  = excluded.default_frequency,
    documentation_url  = excluded.documentation_url,
    license_summary    = excluded.license_summary,
    is_enabled         = true;

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
) values
    (
        'WHV.NUMBEO.COST_LIVING_INDEX',
        'Cost of Living Index (Numbeo, NYC=100)',
        'PRICES',
        'INDEX_NYC_100',
        'Overall consumer cost of living compared to New York City = 100. Excludes rent.',
        'ANNUAL',
        '10000000-0000-0000-0000-000000000015',
        false,
        'Relative index crowd-sourced from user submissions. NYC is the reference city (= 100). Always cross-validate with official CPI when making economic comparisons.'
    ),
    (
        'WHV.NUMBEO.RENT_INDEX',
        'Rent Index (Numbeo, NYC=100)',
        'HOUSING',
        'INDEX_NYC_100',
        'Rental cost index compared to New York City = 100. Based on reported apartment rents.',
        'ANNUAL',
        '10000000-0000-0000-0000-000000000015',
        false,
        'Crowd-sourced rent data. Coverage is denser in large cities than in rural areas. NYC is the reference (= 100).'
    ),
    (
        'WHV.NUMBEO.CONSUMER_PRICE_RENT_INDEX',
        'Consumer Price Plus Rent Index (Numbeo, NYC=100)',
        'PRICES',
        'INDEX_NYC_100',
        'Combined consumer price and rent index compared to New York City = 100.',
        'ANNUAL',
        '10000000-0000-0000-0000-000000000015',
        false,
        'Composite of cost-of-living and rent indices. Useful for overall affordability comparisons when both living costs and rent are relevant.'
    ),
    (
        'WHV.NUMBEO.GROCERIES_INDEX',
        'Groceries Index (Numbeo, NYC=100)',
        'PRICES',
        'INDEX_NYC_100',
        'Groceries and food prices index compared to New York City = 100.',
        'ANNUAL',
        '10000000-0000-0000-0000-000000000015',
        false,
        'Crowd-sourced supermarket prices. Reflects urban grocery costs; less representative of rural or informal-market purchasing patterns.'
    ),
    (
        'WHV.NUMBEO.RESTAURANT_PRICE_INDEX',
        'Restaurant Price Index (Numbeo, NYC=100)',
        'PRICES',
        'INDEX_NYC_100',
        'Restaurant and dining-out prices compared to New York City = 100.',
        'ANNUAL',
        '10000000-0000-0000-0000-000000000015',
        false,
        'Covers meals in inexpensive and mid-range restaurants. Useful as a terrain signal for business travel per-diem benchmarking.'
    ),
    (
        'WHV.NUMBEO.LOCAL_PURCHASING_POWER_INDEX',
        'Local Purchasing Power Index (Numbeo, NYC=100)',
        'LABOR',
        'INDEX_NYC_100',
        'Relative purchasing power of a typical local salary compared to New York City = 100.',
        'ANNUAL',
        '10000000-0000-0000-0000-000000000015',
        false,
        'Derived from reported local salaries adjusted by local cost of living. Not directly comparable to GDP per capita or official wage statistics.'
    )
on conflict (code) do update
set
    display_name        = excluded.display_name,
    topic               = excluded.topic,
    unit_label          = excluded.unit_label,
    description         = excluded.description,
    preferred_frequency = excluded.preferred_frequency,
    source_dataset_id   = excluded.source_dataset_id,
    is_core             = excluded.is_core,
    methodology_notes   = excluded.methodology_notes;