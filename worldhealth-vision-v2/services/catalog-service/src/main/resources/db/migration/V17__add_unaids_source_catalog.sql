-- V17 : UNAIDS AIDSinfo
-- Source : 00000000-0000-0000-0000-000000000017
-- Dataset: 10000000-0000-0000-0000-000000000024

insert into catalog.source (
    id, code, display_name, type, organization_name,
    homepage_url, documentation_url, access_model, license_summary,
    geographic_scope, temporal_granularity, update_cadence, bias_notes, quality_notes
) values (
    '00000000-0000-0000-0000-000000000017',
    'UNAIDS',
    'UNAIDS AIDSinfo',
    'OFFICIAL',
    'Joint United Nations Programme on HIV/AIDS',
    'https://aidsinfo.unaids.org/',
    'https://aidsinfo.unaids.org/',
    'OPEN',
    'Public data. Review UNAIDS terms before redistribution.',
    'GLOBAL',
    'COUNTRY',
    'ANNUAL',
    'HIV estimates use Spectrum modelling. Results may differ from national estimates due to methodological differences.',
    'Gold standard for HIV/AIDS epidemiological data. Published annually since 1990. Peer-reviewed statistical methodology.'
) on conflict (code) do update set display_name=excluded.display_name, is_enabled=true;

insert into catalog.source_dataset (
    id, source_id, code, display_name, description,
    category, default_granularity, default_frequency, documentation_url, license_summary
) values (
    '10000000-0000-0000-0000-000000000024',
    '00000000-0000-0000-0000-000000000017',
    'UNAIDS_AIDSINFO',
    'UNAIDS AIDSinfo HIV Estimates',
    'Country-level HIV prevalence, incidence, people living with HIV and treatment coverage from UNAIDS Spectrum modelling.',
    'HEALTH', 'COUNTRY', 'ANNUAL',
    'https://aidsinfo.unaids.org/',
    'Public UNAIDS statistics.'
) on conflict (source_id, code) do update set display_name=excluded.display_name, is_enabled=true;

insert into catalog.indicator (
    code, display_name, topic, unit_label, description,
    preferred_frequency, source_dataset_id, is_core, methodology_notes
) values
    ('WHV.UNAIDS.HIV.PREVALENCE.ADULT',
     'HIV prevalence, adults 15-49 (%)',
     'HEALTH', 'PERCENT',
     'Estimated percentage of people aged 15-49 living with HIV. Key indicator of epidemic burden.',
     'ANNUAL', '10000000-0000-0000-0000-000000000024', true,
     'UNAIDS Spectrum model estimates. Median estimate with uncertainty bounds. Not directly comparable with national sentinel surveillance.'),
    ('WHV.UNAIDS.ART.COVERAGE',
     'ART coverage among PLHIV (%)',
     'HEALTH', 'PERCENT',
     'Percentage of people living with HIV (PLHIV) receiving antiretroviral therapy (ART). Measures treatment access progress toward the 95-95-95 targets.',
     'ANNUAL', '10000000-0000-0000-0000-000000000024', true,
     'UNAIDS AIDSinfo. Computed as (people on ART) / (estimated PLHIV). Coverage > 100% can occur due to estimation uncertainty.')
on conflict (code) do update set
    display_name=excluded.display_name, topic=excluded.topic,
    unit_label=excluded.unit_label, description=excluded.description,
    source_dataset_id=excluded.source_dataset_id, is_core=excluded.is_core;