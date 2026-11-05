-- V19 : AfDB — African Development Bank Open Data Portal
-- Source : 00000000-0000-0000-0000-000000000019
-- Dataset: 10000000-0000-0000-0000-000000000026

insert into catalog.source (
    id, code, display_name, type, organization_name,
    homepage_url, documentation_url, access_model, license_summary,
    geographic_scope, temporal_granularity, update_cadence, bias_notes, quality_notes
) values (
    '00000000-0000-0000-0000-000000000019',
    'AFDB',
    'African Development Bank — Open Data Portal',
    'OFFICIAL',
    'African Development Bank Group',
    'https://dataportal.opendataforafrica.org/',
    'https://dataportal.opendataforafrica.org/',
    'OPEN',
    'Public access. Review AfDB terms before redistribution.',
    'REGIONAL',
    'COUNTRY',
    'ANNUAL',
    'Coverage limited to African countries. Some indicators have gaps for fragile states. May differ from World Bank due to different primary data sources.',
    'Authoritative regional source for Africa-specific development indicators. Complementary to World Bank WDI for African coverage.'
) on conflict (code) do update set display_name=excluded.display_name, is_enabled=true;

insert into catalog.source_dataset (
    id, source_id, code, display_name, description,
    category, default_granularity, default_frequency, documentation_url, license_summary
) values (
    '10000000-0000-0000-0000-000000000026',
    '00000000-0000-0000-0000-000000000019',
    'AFDB_ADI',
    'AfDB African Development Indicators',
    'Macroeconomic, social and infrastructure indicators for 54 African countries from the African Development Bank.',
    'MACROECONOMIC', 'COUNTRY', 'ANNUAL',
    'https://dataportal.opendataforafrica.org/',
    'Public AfDB Open Data access.'
) on conflict (source_id, code) do update set display_name=excluded.display_name, is_enabled=true;

insert into catalog.indicator (
    code, display_name, topic, unit_label, description,
    preferred_frequency, source_dataset_id, is_core, methodology_notes
) values
    ('WHV.AFDB.GDP.GROWTH',
     'GDP growth (annual %, AfDB)',
     'ECONOMY', 'PERCENT',
     'Annual GDP growth rate for African countries as reported by the AfDB. Cross-validates World Bank and IMF figures for the continent.',
     'ANNUAL', '10000000-0000-0000-0000-000000000026', true,
     'AfDB Open Data. Based on national accounts from African member countries. May be more current than World Bank for some countries.'),
    ('WHV.AFDB.FDI.GDP',
     'FDI net inflows (% of GDP, AfDB)',
     'ECONOMY', 'PERCENT_OF_GDP',
     'Foreign direct investment net inflows as a percentage of GDP for African countries. AfDB data often has more granular Africa coverage than World Bank.',
     'ANNUAL', '10000000-0000-0000-0000-000000000026', true,
     'AfDB Open Data. Balance of payments basis. Data compiled from UNCTAD, IMF BOP statistics and national central banks.')
on conflict (code) do update set
    display_name=excluded.display_name, topic=excluded.topic,
    unit_label=excluded.unit_label, description=excluded.description,
    source_dataset_id=excluded.source_dataset_id, is_core=excluded.is_core;