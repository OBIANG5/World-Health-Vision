-- V21 : UNCTAD — United Nations Conference on Trade and Development
-- Source : 00000000-0000-0000-0000-000000000021
-- Dataset: 10000000-0000-0000-0000-000000000028

insert into catalog.source (
    id, code, display_name, type, organization_name,
    homepage_url, documentation_url, access_model, license_summary,
    geographic_scope, temporal_granularity, update_cadence, bias_notes, quality_notes
) values (
    '00000000-0000-0000-0000-000000000021',
    'UNCTAD',
    'CNUCED — Conférence des Nations Unies sur le Commerce et le Développement',
    'OFFICIAL',
    'United Nations Conference on Trade and Development',
    'https://unctadstat.unctad.org/',
    'https://unctadstat.unctad.org/EN/APIGuide.html',
    'OPEN',
    'Données publiques CNUCED — utilisation libre avec attribution.',
    'GLOBAL',
    'COUNTRY',
    'ANNUAL',
    'Les statistiques IDE peuvent inclure des révisions significatives sur plusieurs années. '
    'Légèrement différentes des données Banque Mondiale en raison des méthodes de collecte.',
    'Référence ONU pour les statistiques de commerce et d''investissement direct étranger. '
    'Couvre ~200 pays et territoires depuis 1970 pour les IDE.'
) on conflict (code) do update set display_name=excluded.display_name, is_enabled=true;

insert into catalog.source_dataset (
    id, source_id, code, display_name, description,
    category, default_granularity, default_frequency, documentation_url, license_summary
) values (
    '10000000-0000-0000-0000-000000000028',
    '00000000-0000-0000-0000-000000000021',
    'UNCTAD_STATS',
    'UNCTADstat — Statistiques Commerce et Investissement',
    'Base de données statistiques de la CNUCED couvrant les flux d''IDE, '
    'le commerce de marchandises et de services, et les indicateurs macroéconomiques '
    'pour ~200 économies depuis 1970.',
    'MACROECONOMIC', 'COUNTRY', 'ANNUAL',
    'https://unctadstat.unctad.org/',
    'Accès public CNUCED.'
) on conflict (source_id, code) do update set display_name=excluded.display_name, is_enabled=true;

insert into catalog.indicator (
    code, display_name, topic, unit_label, description,
    preferred_frequency, source_dataset_id, is_core, methodology_notes
) values
    ('WHV.UNCTAD.FDI.INFLOWS',
     'IDE entrants (CNUCED, M USD)',
     'ECONOMY', 'USD_MILLIONS',
     'Flux d''investissements directs étrangers entrants en millions USD selon la CNUCED. '
     'Référence internationale pour les statistiques IDE — complémentaire aux données '
     'Banque Mondiale (BX.KLT.DINV.WD.GD.ZS exprimées en % PIB).',
     'ANNUAL', '10000000-0000-0000-0000-000000000028', true,
     'CNUCED UNCTADstat, dataset US_FdiFlowsCountry. Balance des paiements, norme FMI BPM6.')
on conflict (code) do update set
    display_name=excluded.display_name, topic=excluded.topic,
    unit_label=excluded.unit_label, description=excluded.description,
    source_dataset_id=excluded.source_dataset_id, is_core=excluded.is_core;