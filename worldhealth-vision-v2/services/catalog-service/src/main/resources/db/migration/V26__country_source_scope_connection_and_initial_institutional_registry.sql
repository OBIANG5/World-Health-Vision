-- Country-first source registry foundation for WorldHealth Vision (2026-11-12).
--
-- SOURCE LISTING IS NOT CONNECTIVITY: a verified official website is not an
-- active connector, validated licence, or proof of statistical equivalence.
-- Monies and central banks can have regional jurisdiction (CEMAC/BEAC).
-- We deliberately do not backfill numeric observations or scrape third-party
-- publications in this migration.
--
-- Each organization-country pair is explicit. A CEMAC bank appears as a
-- REGIONAL_OFFICIAL source relevant to six countries, but does NOT prove
-- those six countries have been researched locally.

alter table catalog.country_local_source
  drop constraint if exists country_local_source_source_type_check;

alter table catalog.country_local_source
  add constraint country_local_source_source_type_check
  check (source_type in (
    'NATIONAL_OFFICIAL', 'REGIONAL_OFFICIAL',
    'LOCAL_MEDIA', 'LOCAL_RESEARCH', 'LOCAL_COMMUNITY'
  ));

alter table catalog.country_local_source
  add column if not exists geographic_scope_kind varchar(24) not null
    default 'NATIONAL'
    check (geographic_scope_kind in ('NATIONAL', 'SUBNATIONAL', 'REGIONAL_SHARED')),
  add column if not exists connection_state varchar(32) not null
    default 'CATALOG_ONLY'
    check (connection_state in (
      'CATALOG_ONLY', 'CONNECTOR_IN_REVIEW', 'INGESTION_VERIFIED'
    )),
  add column if not exists review_interval_days integer not null
    default 180
    check (review_interval_days between 7 and 730);

comment on column catalog.country_local_source.connection_state is
  'CATALOG_ONLY means listed, NOT an active collection or time series source';
comment on column catalog.country_local_source.geographic_scope_kind is
  'REGIONAL_SHARED is relevant to multiple countries but not local-country research coverage';
comment on column catalog.country_local_source.review_interval_days is
  'How often an editor should revisit the source, not the publication frequency';

update catalog.country_local_source
set review_interval_days = 90
where country_iso3 = 'GAB' and source_code = 'INSTAT_GABON';

update catalog.country_local_source
set review_interval_days = 60
where country_iso3 = 'GAB' and source_code = 'AGP_GABON';

-- Source provenance checked against the institutions' own websites on
-- November 12, 2026. Do not assume machine-readable formats or re-use rights
-- are available just because an institution offers a portal.
insert into catalog.country_local_source (
  country_iso3, source_code, display_name, organization_name,
  source_role, source_type, homepage_url, evidence_url,
  verification_state, last_reviewed_on, methodology_caveat,
  reuse_rights_note, geographic_scope_kind, connection_state,
  review_interval_days
) values
(
 'FRA','INSEE_FRANCE','Insee','Institut national de la statistique et des études économiques',
 'STATISTICS_OFFICE','NATIONAL_OFFICIAL',
 'https://www.insee.fr/fr/accueil','https://www.insee.fr/fr/information/8184146',
 'VERIFIED_ORGANIZATION',date '2026-11-12',
 'French statistical definitions, territorial coverage and revision vintages must be confirmed for each indicator. The public API catalogue does not mean this project has connected to an API.',
 'Check INSEE/Etalab dataset-specific reuse licence, API access model, attribution and extraction limits before any bulk collection.',
 'NATIONAL','CATALOG_ONLY',120
),
(
 'FRA','BANQUE_DE_FRANCE','Banque de France','Banque de France',
 'CENTRAL_BANK','NATIONAL_OFFICIAL',
 'https://www.banque-france.fr/fr/statistiques',
 'https://webstat.banque-france.fr/fr/',
 'VERIFIED_ORGANIZATION',date '2026-11-12',
 'Some published statistics or exchange-rate series originate from the ECB or other primary institutions. Preserve original publisher and series definitions to avoid false independent confirmation.',
 'Verify Webstat data licence and API terms for each series before automated redistribution.',
 'NATIONAL','CATALOG_ONLY',120
),
(
 'NGA','NBS_NIGERIA','National Bureau of Statistics (Nigeria)','National Bureau of Statistics',
 'STATISTICS_OFFICE','NATIONAL_OFFICIAL',
 'https://www.nigerianstat.gov.ng/',
 'https://www.nigerianstat.gov.ng/index.php',
 'VERIFIED_ORGANIZATION',date '2026-11-12',
 'Nigeria rebased GDP and CPI in 2025. Index-base and sector-weight changes must be preserved before cross-vintage or international comparisons.',
 'Check the NBS publication and open-data reuse conditions before reproducing tables or automated ingestion.',
 'NATIONAL','CATALOG_ONLY',90
),
(
 'NGA','CBN_NIGERIA','Central Bank of Nigeria','Central Bank of Nigeria',
 'CENTRAL_BANK','NATIONAL_OFFICIAL',
 'https://www.cbn.gov.ng/',
 'https://www.cbn.gov.ng/rates/',
 'VERIFIED_ORGANIZATION',date '2026-11-12',
 'The CBN publishes FX, monetary and banking statistics. Confirm reference rates (official, market, mid) and series frequency before comparisons.',
 'Confirm CBN licence and technical access conditions for each dataset.',
 'NATIONAL','CATALOG_ONLY',90
),
(
 'USA','US_CENSUS_BUREAU','U.S. Census Bureau','United States Census Bureau',
 'STATISTICS_OFFICE','NATIONAL_OFFICIAL',
 'https://www.census.gov/',
 'https://www.census.gov/data/developers/data-sets.html',
 'VERIFIED_ORGANIZATION',date '2026-11-12',
 'Different U.S. datasets cover census counts, ACS surveys and population estimates. The latest population estimates may require file downloads instead of the Census Data API; do not infer a common census method.',
 'Verify dataset-specific federal reuse requirements, confidentiality and API usage guidance.',
 'NATIONAL','CATALOG_ONLY',120
),
(
 'USA','US_BEA','U.S. Bureau of Economic Analysis','Bureau of Economic Analysis',
 'STATISTICS_OFFICE','NATIONAL_OFFICIAL',
 'https://www.bea.gov/',
 'https://www.bea.gov/itable/national-gdp-and-personal-income',
 'VERIFIED_ORGANIZATION',date '2026-11-12',
 'GDP advance, second, third and annual revision vintages differ. NIPA, real and nominal measurements and seasonal adjustment must be recorded per data series.',
 'Verify BEA terms for API and attribution, and document any release revision.',
 'NATIONAL','CATALOG_ONLY',120
)
on conflict (country_iso3,source_code) do nothing;

-- BEAC is a COMMON central bank, not six national central banks.
-- The institution officially identifies CMR, CAF, COG, GAB, GNQ and TCD
-- as members. Assigning it to a country does not mean that the country's
-- own statistical office, regulators or local press have been researched.
insert into catalog.country_local_source (
  country_iso3, source_code, display_name, organization_name,
  source_role, source_type, homepage_url, evidence_url,
  verification_state, last_reviewed_on, methodology_caveat,
  reuse_rights_note, geographic_scope_kind, connection_state,
  review_interval_days
)
select
  member.iso3, 'BEAC_CEMAC', 'BEAC — banque centrale commune',
  'Banque des États de l’Afrique Centrale', 'CENTRAL_BANK', 'REGIONAL_OFFICIAL',
  'https://www.beac.int/',
  'https://www.beac.int/economie-stats/statistiques-monetaires/',
  'VERIFIED_ORGANIZATION', date '2026-11-12',
  'Shared CEMAC policy and regional series may not equal Gabon/Cameroon/etc national values. Distinguish member-state rows, aggregate CEMAC indicators, observed data and forecasts.',
  'Review BEAC document and statistics portal redistribution permissions before automated download or media reuse.',
  'REGIONAL_SHARED', 'CATALOG_ONLY', 120
from (values
 ('CMR'),('CAF'),('COG'),('GAB'),('GNQ'),('TCD')
) as member(iso3)
on conflict (country_iso3,source_code) do nothing;
