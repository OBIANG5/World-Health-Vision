-- V9 : Source WHO Global Health Observatory (GHO)
-- Source UUID : 00000000-0000-0000-0000-000000000013
-- Datasets   : WHO_GHO_LIFE_EXPECTANCY (UUID ...0016), WHO_GHO_HEALTH_EXPENDITURE (...0017),
--              WHO_GHO_INFANT_MORTALITY (...0018), WHO_GHO_HEALTH_WORKFORCE (...0019)
-- Les indicateurs SP.DYN.LE00.IN, SH.XPD.CHEX.GD.ZS, SP.DYN.IMRT.IN, SH.MED.PHYS.ZS
-- existent déjà dans le catalog (source_dataset_id = WDI).
-- Le timeseries stockera des observations WHO_GHO pour ces mêmes codes indicator,
-- permettant la comparaison multi-sources dans analytics.

insert into catalog.source (
    id, code, display_name, type, organization_name, homepage_url, documentation_url,
    access_model, license_summary, geographic_scope, temporal_granularity, update_cadence,
    bias_notes, quality_notes
) values (
    '00000000-0000-0000-0000-000000000013',
    'WHO_GHO',
    'WHO Global Health Observatory',
    'OFFICIAL',
    'World Health Organization',
    'https://www.who.int/data/gho',
    'https://www.who.int/data/gho/info/gho-odata-api',
    'OPEN',
    'Public OData API. Review WHO terms before redistribution.',
    'GLOBAL',
    'COUNTRY',
    'PERIODIC',
    'WHO uses model-based estimates reconciling civil registration, surveys and censuses. May diverge from WB for countries with incomplete vital registration systems.',
    'Gold standard for global health data. Strong country coverage, especially for lower-income countries where national data is sparse.'
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
    id, source_id, code, display_name, description, category,
    default_granularity, default_frequency, documentation_url, license_summary
) values
    (
        '10000000-0000-0000-0000-000000000016',
        '00000000-0000-0000-0000-000000000013',
        'WHO_GHO_LIFE_EXPECTANCY',
        'WHO GHO — Life Expectancy',
        'Life expectancy at birth estimates from the WHO Global Health Observatory.',
        'HEALTH', 'COUNTRY', 'ANNUAL',
        'https://www.who.int/data/gho/data/indicators/indicator-details/GHO/life-expectancy-at-birth-(years)',
        'Public WHO OData API access.'
    ),
    (
        '10000000-0000-0000-0000-000000000017',
        '00000000-0000-0000-0000-000000000013',
        'WHO_GHO_HEALTH_EXPENDITURE',
        'WHO Global Health Expenditure Database',
        'Current health expenditure as a share of GDP from the WHO Global Health Expenditure Database (GHED).',
        'HEALTH', 'COUNTRY', 'ANNUAL',
        'https://www.who.int/data/gho/data/themes/topics/health-financing',
        'Public WHO OData API access.'
    ),
    (
        '10000000-0000-0000-0000-000000000018',
        '00000000-0000-0000-0000-000000000013',
        'WHO_GHO_INFANT_MORTALITY',
        'WHO GHO — Child Mortality',
        'Infant and child mortality estimates from the WHO / IGME joint methodology.',
        'HEALTH', 'COUNTRY', 'ANNUAL',
        'https://www.who.int/data/gho/data/indicators/indicator-details/GHO/infant-mortality-rate-(probability-of-dying-between-birth-and-age-1-per-1000-live-births)',
        'Public WHO OData API access.'
    ),
    (
        '10000000-0000-0000-0000-000000000019',
        '00000000-0000-0000-0000-000000000013',
        'WHO_GHO_HEALTH_WORKFORCE',
        'WHO GHO — Health Workforce',
        'Health workforce density indicators from the WHO National Health Workforce Accounts.',
        'HEALTH', 'COUNTRY', 'ANNUAL',
        'https://www.who.int/data/gho/data/themes/topics/health-workforce',
        'Public WHO OData API access.'
    )
on conflict (source_id, code) do update set
    display_name        = excluded.display_name,
    description         = excluded.description,
    category            = excluded.category,
    default_granularity = excluded.default_granularity,
    default_frequency   = excluded.default_frequency,
    documentation_url   = excluded.documentation_url,
    license_summary     = excluded.license_summary,
    is_enabled          = true;