-- V8 : Indicateurs économiques et de santé manquants
-- Requis par les profils analytics (product_profiles.py) :
-- FDI, FBCF, finances publiques (recettes/dépenses), mortalité infantile, médecins.

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
        'BX.KLT.DINV.WD.GD.ZS',
        'Foreign direct investment, net inflows (% of GDP)',
        'INVESTMENT',
        'PERCENT_OF_GDP',
        'Net inflows of foreign direct investment as a share of GDP. Captures capital attracted from abroad for long-term productive investment.',
        'ANNUAL',
        '10000000-0000-0000-0000-000000000001',
        true,
        'Volatile series — a single large deal can dominate a year. Use 3-year rolling average for trend analysis. Special purpose entities (Ireland, Luxembourg) distort raw values. Cross-reference with UNCTAD World Investment Report.'
    ),
    (
        'NE.GDI.FTOT.ZS',
        'Gross fixed capital formation (% of GDP)',
        'INVESTMENT',
        'PERCENT_OF_GDP',
        'Total gross fixed capital formation as a share of GDP. Measures investment in durable assets — machinery, buildings, infrastructure — that drive future productive capacity.',
        'ANNUAL',
        '10000000-0000-0000-0000-000000000001',
        true,
        'Includes both public and private investment. High values in emerging economies often reflect infrastructure catch-up. Compare with depreciation rates for net investment picture.'
    ),
    (
        'GC.REV.TOTL.GD.ZS',
        'Revenue, excluding grants (% of GDP)',
        'FISCAL',
        'PERCENT_OF_GDP',
        'General government total revenue (taxes, non-tax revenue) as a share of GDP, excluding grants. Measures the fiscal capacity of the state.',
        'ANNUAL',
        '10000000-0000-0000-0000-000000000001',
        true,
        'Coverage and definition vary across countries — some include social security contributions, others do not. Cross-reference with IMF GFS for internationally comparable fiscal aggregates.'
    ),
    (
        'GC.XPN.TOTL.GD.ZS',
        'Expense (% of GDP)',
        'FISCAL',
        'PERCENT_OF_GDP',
        'General government total expense (current and capital) as a share of GDP. Indicates the scope of government spending relative to the economy.',
        'ANNUAL',
        '10000000-0000-0000-0000-000000000001',
        true,
        'Does not distinguish between productive capital spending and recurrent consumption. Combine with revenue and debt data for a complete fiscal picture.'
    ),
    (
        'SP.DYN.IMRT.IN',
        'Mortality rate, infant (per 1,000 live births)',
        'HEALTH',
        'RATE_PER_1000',
        'Number of deaths of infants under one year of age per 1,000 live births. One of the most sensitive indicators of a population''s health, nutrition, and access to medical care.',
        'ANNUAL',
        '10000000-0000-0000-0000-000000000001',
        true,
        'UNICEF and WHO estimates may differ from national civil registry data. Changes in registration completeness can create apparent breaks in series. Use alongside under-5 mortality for a fuller child health picture.'
    ),
    (
        'SH.MED.PHYS.ZS',
        'Physicians (per 1,000 people)',
        'HEALTH',
        'RATE_PER_1000',
        'Number of practicing physicians per 1,000 inhabitants. Proxy for access to medical care and health system capacity.',
        'ANNUAL',
        '10000000-0000-0000-0000-000000000001',
        true,
        'WHO data. Definition of "physician" varies by country (some include all licensed, others only active). Coverage is often infrequent — many countries report every 3–5 years. Combine with hospital bed density for system capacity assessment.'
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