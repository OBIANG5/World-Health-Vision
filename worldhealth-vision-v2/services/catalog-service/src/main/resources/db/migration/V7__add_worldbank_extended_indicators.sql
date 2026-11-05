-- V7 : Extension du catalogue World Bank Development Indicators (WDI)
-- Ajout de 8 indicateurs clés pour un profil économique complet :
-- Inégalités (Gini), numérique (Internet), finances publiques (dette, exports, imports,
-- dépenses santé, dépenses éducation) et environnement (CO2).
-- Tous rattachés au dataset WDI existant (10000000-0000-0000-0000-000000000001).

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
        'SI.POV.GINI',
        'Gini index (World Bank estimate)',
        'SOCIAL',
        'INDEX_0_100',
        'Measures income inequality on a scale from 0 (perfect equality) to 100 (maximum inequality).',
        'ANNUAL',
        '10000000-0000-0000-0000-000000000001',
        true,
        'Coverage varies significantly by country and year — many countries publish Gini only every 3–5 years. Do not extrapolate between survey years. Cross-validate with income quintile ratios when available.'
    ),
    (
        'IT.NET.USER.ZS',
        'Individuals using the Internet (% of population)',
        'DIGITAL',
        'PERCENT',
        'Percentage of individuals who have used the Internet from any location in the last 3 months.',
        'ANNUAL',
        '10000000-0000-0000-0000-000000000001',
        true,
        'ITU-defined metric. Captures adoption breadth but not quality, speed, or affordability of access.'
    ),
    (
        'GC.DOD.TOTL.GD.ZS',
        'General government gross debt (% of GDP)',
        'FISCAL',
        'PERCENT_OF_GDP',
        'General government gross debt as a share of GDP. Covers central and sub-national governments plus social security funds.',
        'ANNUAL',
        '10000000-0000-0000-0000-000000000001',
        true,
        'Definitions vary between IMF and World Bank. High debt is not inherently dangerous — context (currency denomination, creditor structure) matters. Cross-reference with IMF WEO for sovereign risk analysis.'
    ),
    (
        'NE.EXP.GNFS.ZS',
        'Exports of goods and services (% of GDP)',
        'EXTERNAL_BALANCE',
        'PERCENT_OF_GDP',
        'Value of all goods and other market services exported as a share of GDP.',
        'ANNUAL',
        '10000000-0000-0000-0000-000000000001',
        true,
        'Useful for measuring trade openness and export dependency. Small open economies (Singapore, Luxembourg) will naturally show very high values. Read alongside imports for trade balance context.'
    ),
    (
        'NE.IMP.GNFS.ZS',
        'Imports of goods and services (% of GDP)',
        'EXTERNAL_BALANCE',
        'PERCENT_OF_GDP',
        'Value of all goods and other market services imported as a share of GDP.',
        'ANNUAL',
        '10000000-0000-0000-0000-000000000001',
        true,
        'High import dependence can indicate domestic consumption strength or structural vulnerability. Read alongside exports and current account balance.'
    ),
    (
        'SH.XPD.CHEX.GD.ZS',
        'Current health expenditure (% of GDP)',
        'SOCIAL',
        'PERCENT_OF_GDP',
        'Total current health expenditure by public and private actors as a share of GDP.',
        'ANNUAL',
        '10000000-0000-0000-0000-000000000001',
        true,
        'Includes public and private health spending. Does not include capital formation. High spending does not guarantee good outcomes — efficiency and coverage metrics are required for full health system assessment.'
    ),
    (
        'SE.XPD.TOTL.GD.ZS',
        'Government expenditure on education (% of GDP)',
        'SOCIAL',
        'PERCENT_OF_GDP',
        'General government total expenditure on education, expressed as a share of GDP.',
        'ANNUAL',
        '10000000-0000-0000-0000-000000000001',
        true,
        'Public education commitment proxy. Private spending not included. Cross-reference with PISA or TIMSS scores for quality-of-outcome context.'
    ),
    (
        'EN.ATM.CO2E.PC',
        'CO2 emissions (metric tons per capita)',
        'ENVIRONMENT',
        'TONS_PER_PERSON',
        'Carbon dioxide emissions per capita from burning of fossil fuels and manufacture of cement.',
        'ANNUAL',
        '10000000-0000-0000-0000-000000000001',
        false,
        'Per-capita framing adjusts for country size. Does not include land-use emissions or imports of carbon-intensive goods. Cross-validate with IEA or Our World in Data for more granular energy breakdown.'
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