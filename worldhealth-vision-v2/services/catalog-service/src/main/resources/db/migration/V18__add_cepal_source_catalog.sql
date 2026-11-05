-- V18 : CEPAL/ECLAC CEPALSTAT
-- Source : 00000000-0000-0000-0000-000000000018
-- Dataset: 10000000-0000-0000-0000-000000000025

insert into catalog.source (
    id, code, display_name, type, organization_name,
    homepage_url, documentation_url, access_model, license_summary,
    geographic_scope, temporal_granularity, update_cadence, bias_notes, quality_notes
) values (
    '00000000-0000-0000-0000-000000000018',
    'CEPAL',
    'CEPAL/ECLAC CEPALSTAT',
    'OFFICIAL',
    'UN Economic Commission for Latin America and the Caribbean',
    'https://estadisticas.cepal.org/cepalstat/',
    'https://estadisticas.cepal.org/cepalstat/',
    'OPEN',
    'Public data. Review CEPAL terms before redistribution.',
    'REGIONAL',
    'COUNTRY',
    'ANNUAL',
    'Poverty estimates use national methodologies which differ from World Bank $2.15/day international line — not directly comparable.',
    'Authoritative source for LAC region. Poverty data uses national income lines, providing contextually relevant measurements for the region.'
) on conflict (code) do update set display_name=excluded.display_name, is_enabled=true;

insert into catalog.source_dataset (
    id, source_id, code, display_name, description,
    category, default_granularity, default_frequency, documentation_url, license_summary
) values (
    '10000000-0000-0000-0000-000000000025',
    '00000000-0000-0000-0000-000000000018',
    'CEPAL_CEPALSTAT',
    'CEPAL CEPALSTAT Statistical Database',
    'Poverty, inequality, social protection and macroeconomic indicators for Latin America and the Caribbean.',
    'SOCIAL', 'COUNTRY', 'ANNUAL',
    'https://estadisticas.cepal.org/cepalstat/',
    'Public CEPAL statistics.'
) on conflict (source_id, code) do update set display_name=excluded.display_name, is_enabled=true;

insert into catalog.indicator (
    code, display_name, topic, unit_label, description,
    preferred_frequency, source_dataset_id, is_core, methodology_notes
) values
    ('WHV.CEPAL.POVERTY.RATE',
     'Poverty headcount ratio, national line (%, CEPAL)',
     'SOCIAL', 'PERCENT',
     'Percentage of population below the national poverty line. CEPAL methodology uses country-specific income thresholds — more contextually relevant for LAC than international $2.15/day line.',
     'ANNUAL', '10000000-0000-0000-0000-000000000025', true,
     'CEPAL CEPALSTAT. National poverty lines vary by country — not internationally comparable. Based on household survey microdata.'),
    ('WHV.CEPAL.EXTREME.POVERTY',
     'Extreme poverty headcount ratio, national line (%, CEPAL)',
     'SOCIAL', 'PERCENT',
     'Percentage of population below the national extreme poverty (indigence) line. Captures the most severe deprivation.',
     'ANNUAL', '10000000-0000-0000-0000-000000000025', true,
     'CEPAL CEPALSTAT. Country-specific lines. Coverage varies — not all countries reported every year.')
on conflict (code) do update set
    display_name=excluded.display_name, topic=excluded.topic,
    unit_label=excluded.unit_label, description=excluded.description,
    source_dataset_id=excluded.source_dataset_id, is_core=excluded.is_core;