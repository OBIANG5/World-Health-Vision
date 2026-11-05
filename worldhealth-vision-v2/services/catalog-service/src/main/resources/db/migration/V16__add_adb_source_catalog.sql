-- V16 : ADB — Asian Development Bank KIDB
-- Source : 00000000-0000-0000-0000-000000000016
-- Dataset: 10000000-0000-0000-0000-000000000023

insert into catalog.source (
    id, code, display_name, type, organization_name,
    homepage_url, documentation_url, access_model, license_summary,
    geographic_scope, temporal_granularity, update_cadence, bias_notes, quality_notes
) values (
    '00000000-0000-0000-0000-000000000016',
    'ADB_KIDB',
    'ADB Key Indicators Database',
    'OFFICIAL',
    'Asian Development Bank',
    'https://kidb.adb.org/',
    'https://kidb.adb.org/kidb/',
    'OPEN',
    'Public access. Review ADB terms before redistribution.',
    'REGIONAL',
    'COUNTRY',
    'ANNUAL',
    'Coverage limited to ADB member economies (Asia-Pacific). Data may differ from World Bank for methodological reasons.',
    'Authoritative source for Asia-Pacific regional development data. Useful for cross-validating World Bank figures for the region.'
) on conflict (code) do update set display_name=excluded.display_name, is_enabled=true;

insert into catalog.source_dataset (
    id, source_id, code, display_name, description,
    category, default_granularity, default_frequency, documentation_url, license_summary
) values (
    '10000000-0000-0000-0000-000000000023',
    '00000000-0000-0000-0000-000000000016',
    'ADB_KIDB',
    'ADB Key Indicators Database',
    'GDP, poverty, trade and social indicators for ADB member economies in Asia-Pacific.',
    'MACROECONOMIC', 'COUNTRY', 'ANNUAL',
    'https://kidb.adb.org/kidb/',
    'Public ADB KIDB access.'
) on conflict (source_id, code) do update set display_name=excluded.display_name, is_enabled=true;

insert into catalog.indicator (
    code, display_name, topic, unit_label, description,
    preferred_frequency, source_dataset_id, is_core, methodology_notes
) values
    ('WHV.ADB.GDP.GROWTH', 'GDP growth rate (%, ADB)', 'ECONOMY', 'PERCENT',
     'Annual GDP growth rate for ADB economies. Cross-validates World Bank growth figures for Asia-Pacific.',
     'ANNUAL', '10000000-0000-0000-0000-000000000023', true,
     'ADB KIDB. May use national methodology differing from World Bank.'),
    ('WHV.ADB.POVERTY.HEADCOUNT', 'Poverty headcount ratio at $2.15/day (%, ADB)', 'SOCIAL',
     'PERCENT',
     'Share of population living on less than USD 2.15 per day (2017 PPP). ADB estimate for Asia-Pacific countries.',
     'ANNUAL', '10000000-0000-0000-0000-000000000023', true,
     'ADB KIDB poverty estimates. Based on household surveys; coverage varies by country.')
on conflict (code) do update set
    display_name=excluded.display_name, topic=excluded.topic,
    unit_label=excluded.unit_label, description=excluded.description,
    source_dataset_id=excluded.source_dataset_id, is_core=excluded.is_core;