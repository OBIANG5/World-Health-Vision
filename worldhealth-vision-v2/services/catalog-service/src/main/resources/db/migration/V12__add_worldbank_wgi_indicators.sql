-- ============================================================
-- V12 : World Bank WGI — Worldwide Governance Indicators
-- ============================================================
-- Context:
--   The WGI source_dataset already exists:
--     UUID = 10000000-0000-0000-0000-000000000002  (WGI dataset)
--   This migration adds the six standard WGI estimate indicators.
--   The ".EST" suffix follows WB convention for the point estimate
--   (as opposed to ".NO.SRC", ".PER.RNK", etc.).
-- ============================================================

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
        'RL.EST',
        'Rule of Law (WGI estimate)',
        'GOVERNANCE',
        'WGI_SCORE',
        'Perceptions of the extent to which agents have confidence in and abide by the rules of society, including the quality of contract enforcement, property rights, the police and courts, as well as the likelihood of crime and violence. Score ranges from approximately -2.5 (weak) to 2.5 (strong).',
        'ANNUAL',
        '10000000-0000-0000-0000-000000000002',
        true,
        'World Bank Worldwide Governance Indicators. Aggregates expert surveys, citizen surveys and NGO assessments. Estimate (mean) of the governance indicator in standard normal units.'
    ),
    (
        'CC.EST',
        'Control of Corruption (WGI estimate)',
        'GOVERNANCE',
        'WGI_SCORE',
        'Perceptions of the extent to which public power is exercised for private gain, including both petty and grand forms of corruption, as well as "capture" of the state by elites and private interests. Score ranges from approximately -2.5 to 2.5.',
        'ANNUAL',
        '10000000-0000-0000-0000-000000000002',
        true,
        'World Bank Worldwide Governance Indicators. Combines corruption-specific surveys and expert assessments from multiple data sources.'
    ),
    (
        'GE.EST',
        'Government Effectiveness (WGI estimate)',
        'GOVERNANCE',
        'WGI_SCORE',
        'Perceptions of the quality of public services, the quality of the civil service and the degree of its independence from political pressures, the quality of policy formulation and implementation, and the credibility of the government''s commitment to such policies. Score ranges from approximately -2.5 to 2.5.',
        'ANNUAL',
        '10000000-0000-0000-0000-000000000002',
        true,
        'World Bank Worldwide Governance Indicators. Aggregated governance perception data from multiple independent sources.'
    ),
    (
        'PV.EST',
        'Political Stability No Violence (WGI estimate)',
        'GOVERNANCE',
        'WGI_SCORE',
        'Perceptions of the likelihood of political instability and/or politically-motivated violence, including terrorism. Score ranges from approximately -2.5 to 2.5.',
        'ANNUAL',
        '10000000-0000-0000-0000-000000000002',
        true,
        'World Bank Worldwide Governance Indicators. Based on surveys of households, firms and country experts.'
    ),
    (
        'VA.EST',
        'Voice and Accountability (WGI estimate)',
        'GOVERNANCE',
        'WGI_SCORE',
        'Perceptions of the extent to which a country''s citizens are able to participate in selecting their government, as well as freedom of expression, freedom of association, and a free media. Score ranges from approximately -2.5 to 2.5.',
        'ANNUAL',
        '10000000-0000-0000-0000-000000000002',
        true,
        'World Bank Worldwide Governance Indicators. Aggregated from multiple data sources measuring political rights and civil liberties.'
    ),
    (
        'RQ.EST',
        'Regulatory Quality (WGI estimate)',
        'GOVERNANCE',
        'WGI_SCORE',
        'Perceptions of the ability of the government to formulate and implement sound policies and regulations that permit and promote private sector development. Score ranges from approximately -2.5 to 2.5.',
        'ANNUAL',
        '10000000-0000-0000-0000-000000000002',
        true,
        'World Bank Worldwide Governance Indicators. Covers regulatory burden, price controls, trade policy and business environment assessments.'
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