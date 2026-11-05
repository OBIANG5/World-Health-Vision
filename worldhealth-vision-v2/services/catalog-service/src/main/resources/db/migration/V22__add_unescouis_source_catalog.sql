-- V22 : UNESCO UIS — Institute for Statistics
-- Source : 00000000-0000-0000-0000-000000000022
-- Dataset: 10000000-0000-0000-0000-000000000029

insert into catalog.source (
    id, code, display_name, type, organization_name,
    homepage_url, documentation_url, access_model, license_summary,
    geographic_scope, temporal_granularity, update_cadence, bias_notes, quality_notes
) values (
    '00000000-0000-0000-0000-000000000022',
    'UNESCO_UIS',
    'UNESCO — Institut de Statistique (UIS)',
    'OFFICIAL',
    'UNESCO Institute for Statistics',
    'https://databankapi.worldbank.org/source/education-statistics-%5e-all-indicators',
    'https://apiportal.uis.unesco.org/',
    'OPEN',
    'Données publiques UNESCO UIS — utilisation libre avec attribution (CC BY 4.0).',
    'GLOBAL',
    'COUNTRY',
    'ANNUAL',
    'Couverture variable selon les pays — les pays à faible revenu rapportent moins régulièrement. '
    'Les taux de scolarisation nets et hors-école peuvent différer légèrement des données Banque Mondiale '
    'en raison des méthodes de collecte et des années de référence.',
    'Référence internationale pour les statistiques d''éducation. '
    'Alimente les indicateurs ODD 4 (éducation de qualité). '
    'Clé API requise — obtenir sur apiportal.uis.unesco.org.'
) on conflict (code) do update set display_name=excluded.display_name, is_enabled=true;

insert into catalog.source_dataset (
    id, source_id, code, display_name, description,
    category, default_granularity, default_frequency, documentation_url, license_summary
) values (
    '10000000-0000-0000-0000-000000000029',
    '00000000-0000-0000-0000-000000000022',
    'UNESCO_UIS_EDUCATION',
    'UNESCO UIS — Statistiques d''éducation',
    'Statistiques d''éducation mondiales de l''UNESCO : taux de scolarisation, '
    'taux hors-école, alphabétisation, dépenses d''éducation pour ~200 pays. '
    'Source officielle des indicateurs ODD 4.',
    'EDUCATION', 'COUNTRY', 'ANNUAL',
    'https://databankapi.worldbank.org/source/education-statistics-%5e-all-indicators',
    'CC BY 4.0 UNESCO UIS.'
) on conflict (source_id, code) do update set display_name=excluded.display_name, is_enabled=true;

insert into catalog.indicator (
    code, display_name, topic, unit_label, description,
    preferred_frequency, source_dataset_id, is_core, methodology_notes
) values
    ('WHV.UNESCO.OOS.PRIMARY',
     'Taux hors-école primaire (%, UNESCO UIS)',
     'EDUCATION', 'PERCENT',
     'Pourcentage d''enfants en âge de scolarisation primaire non scolarisés. '
     'Indicateur ODD 4.1.4 — mesure directe des inégalités d''accès à l''éducation fondamentale.',
     'ANNUAL', '10000000-0000-0000-0000-000000000029', true,
     'UNESCO UIS, dataflow ROFST. Taux net de non-scolarisation pour l''enseignement primaire.'),
    ('WHV.UNESCO.LITERACY',
     'Taux d''alphabétisation adultes (% 15+, UNESCO UIS)',
     'EDUCATION', 'PERCENT',
     'Pourcentage de la population adulte (15 ans et plus) sachant lire et écrire. '
     'Source alternative et complémentaire à l''indicateur Banque Mondiale SE.ADT.LITR.ZS.',
     'ANNUAL', '10000000-0000-0000-0000-000000000029', false,
     'UNESCO UIS, dataflow LITERACY. Enquêtes nationales et estimations modélisées.')
on conflict (code) do update set
    display_name=excluded.display_name, topic=excluded.topic,
    unit_label=excluded.unit_label, description=excluded.description,
    source_dataset_id=excluded.source_dataset_id, is_core=excluded.is_core;