-- WorldHealth Vision: source-country relationships are first-class.
-- A source's national/local remit is not a lower credibility grade.
-- This migration is research metadata and a documented claim, NOT time-series ingestion.
-- The country registry is populated by an external importer after Flyway.
-- Therefore ISO3 is validated here and the service checks country existence at read time.

create table if not exists catalog.country_local_source (
    country_iso3 varchar(3) not null check (country_iso3 ~ '^[A-Z]{3}$'),
    source_code varchar(64) not null,
    display_name varchar(160) not null,
    organization_name varchar(160) not null,
    source_role varchar(40) not null check (source_role in (
        'STATISTICS_OFFICE', 'CENTRAL_BANK', 'MINISTRY', 'REGULATOR',
        'JUDICIAL_INSTITUTION', 'NEWS_AGENCY', 'LOCAL_NEWSROOM',
        'RESEARCH_INSTITUTION', 'CIVIL_SOCIETY', 'OTHER'
    )),
    source_type varchar(24) not null check (source_type in (
        'NATIONAL_OFFICIAL', 'LOCAL_MEDIA', 'LOCAL_RESEARCH', 'LOCAL_COMMUNITY'
    )),
    homepage_url text not null check (homepage_url ~ '^https://'),
    evidence_url text not null check (evidence_url ~ '^https://'),
    verification_state varchar(32) not null check (verification_state in (
        'VERIFIED_ORGANIZATION', 'REVIEW_REQUIRED'
    )),
    last_reviewed_on date not null,
    methodology_caveat text not null,
    reuse_rights_note text not null,
    constraint country_local_source_pk primary key (country_iso3, source_code)
);
create index if not exists idx_country_local_source_country
    on catalog.country_local_source(country_iso3, source_type, source_role);

create table if not exists catalog.country_documented_release (
    release_code varchar(96) primary key,
    country_iso3 varchar(3) not null,
    source_code varchar(64) not null,
    indicator_code varchar(64) not null references catalog.indicator(code),
    reference_year integer not null check (reference_year between 1900 and 2200),
    value_numeric numeric(24,3) not null,
    unit_label varchar(32) not null,
    population_scope varchar(32) not null check (population_scope in (
        'ALL_RESIDENTS', 'NATIONAL_CITIZENS', 'NOT_APPLICABLE'
    )),
    method_kind varchar(32) not null check (method_kind in (
        'CENSUS', 'SURVEY', 'ADMINISTRATIVE', 'ESTIMATE', 'OTHER'
    )),
    publication_status varchar(40) not null check (publication_status in (
        'PRELIMINARY', 'PRELIMINARY_HOMOLOGATED', 'FINAL', 'REVISED'
    )),
    release_date date not null,
    title text not null,
    primary_evidence_url text not null check (primary_evidence_url ~ '^https://'),
    corroboration_url text check (corroboration_url ~ '^https://'),
    methodology_caveat text not null,
    international_comparison_note text not null,
    verification_status varchar(40) not null default 'DOCUMENTED_NOT_INGESTED'
       check (verification_status in ('DOCUMENTED_NOT_INGESTED', 'INGESTED_VERIFIED')),
    reviewed_on date not null,
    foreign key (country_iso3, source_code)
        references catalog.country_local_source(country_iso3, source_code)
        on update cascade
);
create index if not exists idx_country_documented_release_country
    on catalog.country_documented_release(country_iso3, indicator_code, reference_year desc);

-- Pilot: specific Gabonese institutions with traceable sites, not generic
-- "Africa" sources blindly assumed to represent every national context.
insert into catalog.country_local_source (
    country_iso3, source_code, display_name, organization_name,
    source_role, source_type, homepage_url, evidence_url,
    verification_state, last_reviewed_on, methodology_caveat, reuse_rights_note
) values
(
    'GAB', 'INSTAT_GABON', 'INSTAT Gabon', 'Institut national de la statistique du Gabon',
    'STATISTICS_OFFICE', 'NATIONAL_OFFICIAL',
    'https://new.instatgabon.org/fr', 'https://rgplprovisoire.instatgabon.org/',
    'VERIFIED_ORGANIZATION', date '2026-11-12',
    'National census notices require period, resident/citizen distinction, detailed methodological audit and revision tracking; locality does not guarantee accuracy.',
    'Confirm redistribution licence and rights for underlying datasets before bulk reuse.'
),
(
    'GAB', 'AGP_GABON', 'Agence gabonaise de presse', 'Agence gabonaise de presse',
    'NEWS_AGENCY', 'LOCAL_MEDIA',
    'https://agpgabon.ga/', 'https://agpgabon.ga/rgpl-2026-le-gabon-compte-desormais-3-518-621-habitants/',
    'VERIFIED_ORGANIZATION', date '2026-11-12',
    'Local news is corroborating reporting, not an independent census or second measurement.',
    'Attribution and article reproduction rights must be checked before editorial reuse.'
)
on conflict (country_iso3, source_code) do nothing;

-- The institute publishes a *preliminary* census. An August 27 legal
-- homologation does not silently make the data a final audited statistical series.
-- Do not insert this manually curated claim into timeseries.latest_observation.
insert into catalog.country_documented_release (
    release_code, country_iso3, source_code, indicator_code,
    reference_year, value_numeric, unit_label, population_scope,
    method_kind, publication_status, release_date, title,
    primary_evidence_url, corroboration_url, methodology_caveat,
    international_comparison_note, verification_status, reviewed_on
) values (
    'GAB-RGPL-2026-RESIDENTS', 'GAB', 'INSTAT_GABON', 'SP.POP.TOTL',
    2026, 3518621, 'PEOPLE', 'ALL_RESIDENTS',
    'CENSUS', 'PRELIMINARY_HOMOLOGATED', date '2026-08-27',
    'Recensement général de la population et des logements (RGPL), Gabon 2026',
    'https://rgplprovisoire.instatgabon.org/',
    'https://agpgabon.ga/rgpl-2026-le-gabon-compte-desormais-3-518-621-habitants/',
    'INSTAT identifies the table as preliminary (October 2026). The Constitutional Court homologated the number on 27 August 2026; official reporting mentions difficulties covering some areas. Includes all residents, not just Gabonese citizens.',
    'World Bank WDI SP.POP.TOTL displayed 2,593,130 for 2025 when checked 2026-11-12. This is a different year and method; show both values with their dates, never label the numerical gap a same-year disagreement. International reference: https://data.worldbank.org/indicator/SP.POP.TOTL?locations=GA',
    'DOCUMENTED_NOT_INGESTED', date '2026-11-12'
)
on conflict (release_code) do nothing;
