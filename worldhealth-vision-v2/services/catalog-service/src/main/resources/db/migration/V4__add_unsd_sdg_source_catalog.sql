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
    '00000000-0000-0000-0000-000000000011',
    'UNSD_SDG',
    'UNSD SDG API',
    'OFFICIAL',
    'United Nations Statistics Division',
    'https://unstats.un.org/',
    'https://unstats.un.org/unsd/api/',
    'OPEN',
    'Official public API from the United Nations Statistics Division. The published catalogue notes the API is under development; review source terms before redistribution.',
    'GLOBAL',
    'COUNTRY',
    'PERIODIC',
    'API is official but documented as a test/development API, so operational stability should be monitored.',
    'Useful as an official automation fallback when portal-style dataset exports are not machine-stable enough.'
)
on conflict (code) do update
set
    display_name = excluded.display_name,
    type = excluded.type,
    organization_name = excluded.organization_name,
    homepage_url = excluded.homepage_url,
    documentation_url = excluded.documentation_url,
    access_model = excluded.access_model,
    license_summary = excluded.license_summary,
    geographic_scope = excluded.geographic_scope,
    temporal_granularity = excluded.temporal_granularity,
    update_cadence = excluded.update_cadence,
    bias_notes = excluded.bias_notes,
    quality_notes = excluded.quality_notes,
    is_enabled = true;

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
    '10000000-0000-0000-0000-000000000014',
    '00000000-0000-0000-0000-000000000011',
    'UNSD_SDG_GLOBAL_DATA',
    'UNSD SDG Global Data',
    'Official Sustainable Development Goal API series published by the United Nations Statistics Division.',
    'SAFETY',
    'COUNTRY',
    'ANNUAL',
    'https://unstats.un.org/unsd/api/',
    'Official public SDG API from the United Nations Statistics Division.'
)
on conflict (source_id, code) do update
set
    display_name = excluded.display_name,
    description = excluded.description,
    category = excluded.category,
    default_granularity = excluded.default_granularity,
    default_frequency = excluded.default_frequency,
    documentation_url = excluded.documentation_url,
    license_summary = excluded.license_summary,
    is_enabled = true;
