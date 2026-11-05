-- V20 : ECB — European Central Bank Statistical Data Warehouse
-- Source : 00000000-0000-0000-0000-000000000020
-- Dataset: 10000000-0000-0000-0000-000000000027

insert into catalog.source (
    id, code, display_name, type, organization_name,
    homepage_url, documentation_url, access_model, license_summary,
    geographic_scope, temporal_granularity, update_cadence, bias_notes, quality_notes
) values (
    '00000000-0000-0000-0000-000000000020',
    'ECB',
    'Banque centrale européenne — Entrepôt de données statistiques',
    'OFFICIAL',
    'European Central Bank',
    'https://data.ecb.europa.eu/',
    'https://data-api.ecb.europa.eu/',
    'OPEN',
    'Accès public. Données © BCE — utilisation autorisée avec mention de la source.',
    'REGIONAL',
    'COUNTRY',
    'MONTHLY',
    'Couverture limitée aux pays de l''UE/UEM et quelques partenaires EEE. '
    'Données HICP harmonisées entre États membres — comparables mais légèrement différentes des indices nationaux.',
    'Référence absolue pour l''inflation et les taux d''intérêt en zone euro. '
    'Données mensuelles agrégées en annuel dans WHV. SDMX-JSON 1.0.'
) on conflict (code) do update set display_name=excluded.display_name, is_enabled=true;

insert into catalog.source_dataset (
    id, source_id, code, display_name, description,
    category, default_granularity, default_frequency, documentation_url, license_summary
) values (
    '10000000-0000-0000-0000-000000000027',
    '00000000-0000-0000-0000-000000000020',
    'ECB_STATISTICS',
    'ECB Statistical Data Warehouse',
    'Statistiques monétaires, financières et macroéconomiques de la zone euro et des États membres de l''UE. '
    'Couvre l''inflation HICP, les taux d''intérêt, les rendements obligataires souverains et les agrégats monétaires.',
    'MACROECONOMIC', 'COUNTRY', 'ANNUAL',
    'https://data-api.ecb.europa.eu/',
    'Accès public ECB SDW.'
) on conflict (source_id, code) do update set display_name=excluded.display_name, is_enabled=true;

insert into catalog.indicator (
    code, display_name, topic, unit_label, description,
    preferred_frequency, source_dataset_id, is_core, methodology_notes
) values
    ('WHV.ECB.HICP.ANNUAL',
     'Inflation HICP (% annuel, BCE)',
     'ECONOMY', 'PERCENT',
     'Indice harmonisé des prix à la consommation, variation annuelle. '
     'Mesure de référence de l''inflation utilisée par la BCE pour sa politique monétaire. '
     'Comparable entre tous les États membres de l''UE.',
     'ANNUAL', '10000000-0000-0000-0000-000000000027', true,
     'BCE SDW, dataflow ICP. Série mensuelle M.*.N.000000.4.ANR agrégée en moyenne annuelle dans WHV.'),
    ('WHV.ECB.BOND.YIELD.10Y',
     'Rendement obligataire souverain 10 ans (%, BCE)',
     'ECONOMY', 'PERCENT',
     'Rendement des obligations d''État à long terme (10 ans) pour les pays de l''UE/UEM. '
     'Indicateur clé du coût de financement public et de la prime de risque souverain.',
     'ANNUAL', '10000000-0000-0000-0000-000000000027', true,
     'BCE SDW, dataflow IRS. Série mensuelle M.*.L.L40.CI.0.EUR.N.Z agrégée en moyenne annuelle.')
on conflict (code) do update set
    display_name=excluded.display_name, topic=excluded.topic,
    unit_label=excluded.unit_label, description=excluded.description,
    source_dataset_id=excluded.source_dataset_id, is_core=excluded.is_core;