-- WORLD-VISION PRODUCT-P2C3C / Issue #112 / international data truth.
-- GOAL: source-native geography != ISO3 country. Insee provider metadata
-- explicitly says FEHM = France hors Mayotte while an API observation uses
-- GEO=2025-FRANCE-F, statistical period 2023. This is NOT all of FRA.
--
-- This migration is ADDITIVE, NO historic observations are reinterpreted,
-- NO real Insee data, country mappings, rights, signatures or numeric values
-- are seeded. Any future scope-bearing series stays OUT of national read
-- APIs until a separately reviewed scope-aware public contract exists.
-- Legacy unscoped signed synthetic fixtures remain visible by prior rules.
--
-- Source-native scope catalog exists independently of catalog.country.
-- A country hint is only the parent country associated with the scope;
-- it is NOT an assertion of whole-country equivalent coverage.
create table timeseries.geographic_scope_registry (
    id uuid primary key,
    source_code varchar(64) not null
        check (source_code ~ '^[A-Z0-9][A-Z0-9_.-]{0,63}$'),
    dataset_code varchar(64) not null
        check (dataset_code ~ '^[A-Z0-9][A-Z0-9_.-]{0,63}$'),
    native_geo_code varchar(96) not null
        check (native_geo_code ~ '^[A-Za-z0-9_.-]{1,96}$'),
    -- A source may use a non-numeric administrative/geospatial release,
    -- e.g. 2025A or ADMIN_V4. It is NOT necessarily a calendar year.
    native_geo_version varchar(64) not null
        check (native_geo_version ~ '^[A-Za-z0-9][A-Za-z0-9_.-]{0,63}
    coverage_kind varchar(32) not null check (coverage_kind in (
        'FULL_COUNTRY_CLAIM_UNREVIEWED', 'PARTIAL_COUNTRY',
        'SUBNATIONAL', 'MULTINATIONAL', 'UNKNOWN'
    )),
    -- Multiple parent countries cannot be flattened into one ISO3.
    check (coverage_kind in ('MULTINATIONAL','UNKNOWN') or country_iso3 is not null),
    display_label varchar(256) not null check (length(btrim(display_label)) > 0),
    territorial_exclusions jsonb not null default '[]'::jsonb
        check (jsonb_typeof(territorial_exclusions) = 'array'),
    territorial_inclusions jsonb not null default '[]'::jsonb
        check (jsonb_typeof(territorial_inclusions) = 'array'),
    source_metadata_url varchar(1024) not null
        check (source_metadata_url like 'https://%'),
    source_metadata_sha256 char(64) not null
        check (source_metadata_sha256 ~ '^[a-f0-9]{64}$'),
    review_status varchar(24) not null default 'RESEARCH_ONLY'
        check (review_status = 'RESEARCH_ONLY'),
    recorded_at_utc timestamptz not null default clock_timestamp(),
    unique (source_code, dataset_code, native_geo_code, native_geo_version)
);

comment on table timeseries.geographic_scope_registry is
'Immutable private source-native geography provenance. Country ISO3 is ONLY a parent hint. No signed equivalence or PUBLIC rights are granted by registering a scope.';

-- Defensive dataset-scoped policy. Also applies to SOURCE-CODE FORGERY
-- because the known Insee dataset is denied even if called WORLD_BANK.
-- This is a review HOLD, not a rights or geography license.
create table timeseries.geographic_dataset_policy (
    source_code varchar(64) not null,
    dataset_code varchar(64) not null,
    policy varchar(32) not null check (policy = 'SCOPE_REVIEW_HOLD'),
    reason_code varchar(64) not null,
    created_at_utc timestamptz not null default clock_timestamp(),
    primary key (source_code, dataset_code)
);
insert into timeseries.geographic_dataset_policy (
    source_code, dataset_code, policy, reason_code
) values
    ('*', 'DS_POPULATIONS_REFERENCE', 'SCOPE_REVIEW_HOLD', 'INSEE_FEHM_NOT_FRA'),
    ('*', 'DS_POPULATIONS_REFERENCE_CATALOG', 'SCOPE_REVIEW_HOLD', 'INSEE_FEHM_NOT_FRA');

-- This column is assigned by the DATABASE from the *already witness-signed*
-- source_metadata fields, never accepted as a raw client-supplied UUID.
-- Preexisting rows intentionally keep NULL, preserving P2C2 semantics.
alter table timeseries.observation
    add column geographic_scope_id uuid references timeseries.geographic_scope_registry(id);

create index idx_observation_geographic_scope on timeseries.observation(geographic_scope_id);

-- No mutation, deletion, retroactive approval, or replacing FEHM by FRA
-- without a new source record and explicit migration/review process.
create function timeseries.reject_geographic_scope_history_rewrite()
returns trigger language plpgsql as $$
begin
    raise exception 'Geographic source history is append only' using errcode = '23514';
end;
$$;

create trigger scope_registry_append_only
before update or delete on timeseries.geographic_scope_registry
for each row execute function timeseries.reject_geographic_scope_history_rewrite();

create trigger dataset_scope_policy_append_only
before update or delete on timeseries.geographic_dataset_policy
for each row execute function timeseries.reject_geographic_scope_history_rewrite();

-- Scopes are not ISO3 values. The canonical source-code/year fields travel
-- inside source_metadata which the trusted independent Bronze witness
-- already fingerprints. Recalculate the FK from the registry at INSERT.
-- If only a hint is present, fail CLOSED. If the approved native code is
-- absent, fail CLOSED. If source/dataset differs, fail CLOSED. This remains
-- a PRIVATE typed scope; the public national view below will suppress it.
create function timeseries.bind_source_native_geographic_scope()
returns trigger language plpgsql as $$
declare
    native_code text;
    vintage_txt text;
    reference_year_txt text;
    matched_id uuid;
    matched_country char(3);
    matched_reference_year integer;
    has_scope_signal boolean;
begin
    if exists (
        select 1 from timeseries.geographic_dataset_policy p
        where p.dataset_code = new.dataset_code
          and p.source_code in ('*', new.source_code)
          and p.policy = 'SCOPE_REVIEW_HOLD'
    ) then
        raise exception 'Source dataset geography requires independent review'
            using errcode = '23514';
    end if;
    if new.source_metadata is null
       or jsonb_typeof(new.source_metadata) <> 'object' then
        raise exception 'Source geography metadata must be a JSON object'
            using errcode = '23514';
    end if;
    has_scope_signal := new.geographic_scope_id is not null
      or new.source_metadata ?| array[
        'sourceNativeGeographyCode', 'geographicVersion',
        'geographicReferenceYear', 'geographicScopeId',
        'countryIso3Candidate', 'geoFilter', 'sourceGeographyCode',
        'geoReferenceYear'
      ];
    if not has_scope_signal then
        new.geographic_scope_id := null;
        return new;
    end if;
    native_code := new.source_metadata ->> 'sourceNativeGeographyCode';
    vintage_txt := new.source_metadata ->> 'geographicVersion';
    reference_year_txt := new.source_metadata ->> 'geographicReferenceYear';
    if native_code is null or native_code !~ '^[A-Za-z0-9_.-]{1,96}
    if matched_id is null then
        raise exception 'Geographic scope has no immutable source evidence'
            using errcode = '23514';
    end if;
    if matched_reference_year is distinct from
       (case when reference_year_txt is not null then reference_year_txt::integer
             else null end) then
        raise exception 'Geographic reference year differs from source registry'
            using errcode = '23514';
    end if;
    if matched_country is distinct from new.country_iso3 then
        raise exception 'Source geography cannot be mapped to a different ISO country'
            using errcode = '23514';
    end if;
    if new.geographic_scope_id is not null
       and new.geographic_scope_id <> matched_id then
        raise exception 'Client geographic scope UUID contradicts verified registry'
            using errcode = '23514';
    end if;
    new.geographic_scope_id := matched_id;
    return new;
end;
$$;

create trigger enforce_source_native_scope_on_observation
before insert or update on timeseries.observation
for each row execute function timeseries.bind_source_native_geographic_scope();

-- Shared public national eligibility function. It does not grant rights;
-- it is an ADDITIONAL geography-denial gate applied ON TOP OF rights,
-- revocation and independently witnessed provenance of V5.
-- No migration backfills a geographic scope or asserts ISO3 equivalence.
create function timeseries.national_scope_read_eligible(
    source_code varchar,
    dataset_code varchar,
    geographic_scope_id uuid,
    source_metadata jsonb
)
returns boolean language sql stable as $$
    select geographic_scope_id is null
       and not (coalesce(source_metadata, '{}'::jsonb) ?| array[
         'sourceNativeGeographyCode', 'geographicVersion',
         'geographicReferenceYear', 'geographicScopeId',
         'countryIso3Candidate', 'geoFilter', 'sourceGeographyCode',
         'geoReferenceYear'
       ])
       and not exists (
           select 1 from timeseries.geographic_dataset_policy p
           where p.dataset_code = $2
             and p.source_code in ('*', $1)
             and p.policy = 'SCOPE_REVIEW_HOLD'
       );
$$;

comment on function timeseries.national_scope_read_eligible(varchar,varchar,uuid,jsonb) is
'False for any documented partial/unknown scope or policy-held dataset. Not a signed geography equivalence, not rights approval.';

-- The national read API view keeps the EXACT original V5 rights/revocation
-- and independent witness checks; we only add the NEGATIVE geography
-- predicate at the observation-level base query.

create or replace view timeseries.latest_observation as
select
    ranked.id,
    ranked.source_run_id,
    ranked.source_code,
    ranked.dataset_code,
    ranked.indicator_code,
    ranked.country_iso3,
    ranked.period_granularity,
    ranked.period_start,
    ranked.period_end,
    ranked.period_label,
    ranked.numeric_value,
    ranked.text_value,
    ranked.value_status,
    ranked.source_published_at,
    ranked.source_metadata,
    ranked.quality_flags,
    ranked.ingested_at,
    ranked.run_key,
    ranked.fetched_at_utc,
    ranked.persisted_at_utc
from (
    select
        o.id,
        o.source_run_id,
        o.source_code,
        o.dataset_code,
        o.indicator_code,
        o.country_iso3,
        o.period_granularity,
        o.period_start,
        o.period_end,
        o.period_label,
        o.numeric_value,
        o.text_value,
        o.value_status,
        o.source_published_at,
        o.source_metadata,
        o.quality_flags,
        o.ingested_at,
        sr.run_key,
        sr.fetched_at_utc,
        sr.persisted_at_utc,
        row_number() over (
            partition by
                o.source_code,
                o.dataset_code,
                o.indicator_code,
                o.country_iso3,
                o.period_granularity,
                o.period_start
            order by
                sr.fetched_at_utc desc,
                sr.persisted_at_utc desc,
                o.ingested_at desc,
                o.id desc
        ) as rn
    from timeseries.observation o
    join timeseries.source_run sr on sr.id = o.source_run_id
    -- Source history can remain stored after revocation, but current public
    -- reads MUST show only versions linked to STILL-VALID reviewed rights.
    -- Historical V1/V2 rows without signed rights links are not auto-approved.
    where timeseries.national_scope_read_eligible(
        o.source_code, o.dataset_code, o.geographic_scope_id, o.source_metadata
    )
      and sr.evidence_attestation_sha256 is not null
      and sr.attested_items_sha256 is not null
      and sr.notes -> 'evidenceAttestation' ->> 'itemsSha256' = sr.attested_items_sha256
      and exists (
        select 1
        from timeseries.source_run_rights_decision linked
        join timeseries.rights_decision rights
          on rights.decision_id = linked.decision_id
        where linked.source_run_id = sr.id
          and rights.source_code = o.source_code
          and rights.dataset_code = o.dataset_code
          and rights.country_iso3 = o.country_iso3
          and rights.indicator_code = o.indicator_code
          and rights.operation = 'PUBLIC_API_INGEST'
          and rights.original_http_sha256 = sr.notes ->> 'httpBodySha256'
          and rights.period_start <= o.period_start
          and rights.period_end >= o.period_end
          and rights.valid_from_utc <= statement_timestamp()
          and rights.valid_until_utc > statement_timestamp()
          and not exists (
              select 1
              from timeseries.rights_revocation revoked
              where revoked.decision_id = rights.decision_id
          )
    )
) ranked
where ranked.rn = 1;
),
    geo_reference_year integer
        check (geo_reference_year between 1800 and 2200),
    -- Null for genuinely cross-border / yet-unassigned source scopes.
    -- The country link here is a PARENT HINT, never national equivalence.
    country_iso3 char(3) references catalog.country(iso3),
    coverage_kind varchar(32) not null check (coverage_kind in (
        'FULL_COUNTRY_CLAIM_UNREVIEWED', 'PARTIAL_COUNTRY',
        'SUBNATIONAL', 'MULTINATIONAL', 'UNKNOWN'
    )),
    display_label varchar(256) not null check (length(btrim(display_label)) > 0),
    territorial_exclusions jsonb not null default '[]'::jsonb
        check (jsonb_typeof(territorial_exclusions) = 'array'),
    territorial_inclusions jsonb not null default '[]'::jsonb
        check (jsonb_typeof(territorial_inclusions) = 'array'),
    source_metadata_url varchar(1024) not null
        check (source_metadata_url like 'https://%'),
    source_metadata_sha256 char(64) not null
        check (source_metadata_sha256 ~ '^[a-f0-9]{64}$'),
    review_status varchar(24) not null default 'RESEARCH_ONLY'
        check (review_status = 'RESEARCH_ONLY'),
    recorded_at_utc timestamptz not null default clock_timestamp(),
    unique (source_code, dataset_code, native_geo_code, geo_reference_year)
);

comment on table timeseries.geographic_scope_registry is
'Immutable private source-native geography provenance. Country ISO3 is ONLY a parent hint. No signed equivalence or PUBLIC rights are granted by registering a scope.';

-- Defensive dataset-scoped policy. Also applies to SOURCE-CODE FORGERY
-- because the known Insee dataset is denied even if called WORLD_BANK.
-- This is a review HOLD, not a rights or geography license.
create table timeseries.geographic_dataset_policy (
    source_code varchar(64) not null,
    dataset_code varchar(64) not null,
    policy varchar(32) not null check (policy = 'SCOPE_REVIEW_HOLD'),
    reason_code varchar(64) not null,
    created_at_utc timestamptz not null default clock_timestamp(),
    primary key (source_code, dataset_code)
);
insert into timeseries.geographic_dataset_policy (
    source_code, dataset_code, policy, reason_code
) values
    ('*', 'DS_POPULATIONS_REFERENCE', 'SCOPE_REVIEW_HOLD', 'INSEE_FEHM_NOT_FRA'),
    ('*', 'DS_POPULATIONS_REFERENCE_CATALOG', 'SCOPE_REVIEW_HOLD', 'INSEE_FEHM_NOT_FRA');

-- This column is assigned by the DATABASE from the *already witness-signed*
-- source_metadata fields, never accepted as a raw client-supplied UUID.
-- Preexisting rows intentionally keep NULL, preserving P2C2 semantics.
alter table timeseries.observation
    add column geographic_scope_id uuid references timeseries.geographic_scope_registry(id);

create index idx_observation_geographic_scope on timeseries.observation(geographic_scope_id);

-- No mutation, deletion, retroactive approval, or replacing FEHM by FRA
-- without a new source record and explicit migration/review process.
create function timeseries.reject_geographic_scope_history_rewrite()
returns trigger language plpgsql as $$
begin
    raise exception 'Geographic source history is append only' using errcode = '23514';
end;
$$;

create trigger scope_registry_append_only
before update or delete on timeseries.geographic_scope_registry
for each row execute function timeseries.reject_geographic_scope_history_rewrite();

create trigger dataset_scope_policy_append_only
before update or delete on timeseries.geographic_dataset_policy
for each row execute function timeseries.reject_geographic_scope_history_rewrite();

-- Scopes are not ISO3 values. The canonical source-code/year fields travel
-- inside source_metadata which the trusted independent Bronze witness
-- already fingerprints. Recalculate the FK from the registry at INSERT.
-- If only a hint is present, fail CLOSED. If the approved native code is
-- absent, fail CLOSED. If source/dataset differs, fail CLOSED. This remains
-- a PRIVATE typed scope; the public national view below will suppress it.
create function timeseries.bind_source_native_geographic_scope()
returns trigger language plpgsql as $$
declare
    native_code text;
    vintage_txt text;
    matched_id uuid;
    matched_country char(3);
    has_scope_signal boolean;
begin
    if exists (
        select 1 from timeseries.geographic_dataset_policy p
        where p.dataset_code = new.dataset_code
          and p.source_code in ('*', new.source_code)
          and p.policy = 'SCOPE_REVIEW_HOLD'
    ) then
        raise exception 'Source dataset geography requires independent review'
            using errcode = '23514';
    end if;
    if new.source_metadata is null
       or jsonb_typeof(new.source_metadata) <> 'object' then
        raise exception 'Source geography metadata must be a JSON object'
            using errcode = '23514';
    end if;
    has_scope_signal := new.geographic_scope_id is not null
      or new.source_metadata ?| array[
        'sourceNativeGeographyCode', 'geographicReferenceYear',
        'geographicScopeId', 'countryIso3Candidate', 'geoFilter',
        'sourceGeographyCode', 'geoReferenceYear'
      ];
    if not has_scope_signal then
        new.geographic_scope_id := null;
        return new;
    end if;
    native_code := new.source_metadata ->> 'sourceNativeGeographyCode';
    vintage_txt := new.source_metadata ->> 'geographicReferenceYear';
    if native_code is null or native_code !~ '^[A-Za-z0-9_.-]{1,96}$'
       or vintage_txt is null or vintage_txt !~ '^(19|20)[0-9]{2}$' then
        raise exception 'Source-native geography and vintage must be explicit'
            using errcode = '23514';
    end if;
    select s.id, s.country_iso3 into matched_id, matched_country
    from timeseries.geographic_scope_registry s
    where s.source_code = new.source_code
      and s.dataset_code = new.dataset_code
      and s.native_geo_code = native_code
      and s.geo_reference_year = vintage_txt::integer;
    if matched_id is null then
        raise exception 'Geographic scope has no immutable source evidence'
            using errcode = '23514';
    end if;
    if matched_country is distinct from new.country_iso3 then
        raise exception 'Source geography cannot be mapped to a different ISO country'
            using errcode = '23514';
    end if;
    if new.geographic_scope_id is not null
       and new.geographic_scope_id <> matched_id then
        raise exception 'Client geographic scope UUID contradicts verified registry'
            using errcode = '23514';
    end if;
    new.geographic_scope_id := matched_id;
    return new;
end;
$$;

create trigger enforce_source_native_scope_on_observation
before insert or update on timeseries.observation
for each row execute function timeseries.bind_source_native_geographic_scope();

-- Shared public national eligibility function. It does not grant rights;
-- it is an ADDITIONAL geography-denial gate applied ON TOP OF rights,
-- revocation and independently witnessed provenance of V5.
-- No migration backfills a geographic scope or asserts ISO3 equivalence.
create function timeseries.national_scope_read_eligible(
    source_code varchar,
    dataset_code varchar,
    geographic_scope_id uuid,
    source_metadata jsonb
)
returns boolean language sql stable as $$
    select geographic_scope_id is null
       and not (coalesce(source_metadata, '{}'::jsonb) ?| array[
         'sourceNativeGeographyCode', 'geographicReferenceYear',
         'geographicScopeId', 'countryIso3Candidate', 'geoFilter',
         'sourceGeographyCode', 'geoReferenceYear'
       ])
       and not exists (
           select 1 from timeseries.geographic_dataset_policy p
           where p.dataset_code = $2
             and p.source_code in ('*', $1)
             and p.policy = 'SCOPE_REVIEW_HOLD'
       );
$$;

comment on function timeseries.national_scope_read_eligible(varchar,varchar,uuid,jsonb) is
'False for any documented partial/unknown scope or policy-held dataset. Not a signed geography equivalence, not rights approval.';

-- The national read API view keeps the EXACT original V5 rights/revocation
-- and independent witness checks; we only add the NEGATIVE geography
-- predicate at the observation-level base query.

create or replace view timeseries.latest_observation as
select
    ranked.id,
    ranked.source_run_id,
    ranked.source_code,
    ranked.dataset_code,
    ranked.indicator_code,
    ranked.country_iso3,
    ranked.period_granularity,
    ranked.period_start,
    ranked.period_end,
    ranked.period_label,
    ranked.numeric_value,
    ranked.text_value,
    ranked.value_status,
    ranked.source_published_at,
    ranked.source_metadata,
    ranked.quality_flags,
    ranked.ingested_at,
    ranked.run_key,
    ranked.fetched_at_utc,
    ranked.persisted_at_utc
from (
    select
        o.id,
        o.source_run_id,
        o.source_code,
        o.dataset_code,
        o.indicator_code,
        o.country_iso3,
        o.period_granularity,
        o.period_start,
        o.period_end,
        o.period_label,
        o.numeric_value,
        o.text_value,
        o.value_status,
        o.source_published_at,
        o.source_metadata,
        o.quality_flags,
        o.ingested_at,
        sr.run_key,
        sr.fetched_at_utc,
        sr.persisted_at_utc,
        row_number() over (
            partition by
                o.source_code,
                o.dataset_code,
                o.indicator_code,
                o.country_iso3,
                o.period_granularity,
                o.period_start
            order by
                sr.fetched_at_utc desc,
                sr.persisted_at_utc desc,
                o.ingested_at desc,
                o.id desc
        ) as rn
    from timeseries.observation o
    join timeseries.source_run sr on sr.id = o.source_run_id
    -- Source history can remain stored after revocation, but current public
    -- reads MUST show only versions linked to STILL-VALID reviewed rights.
    -- Historical V1/V2 rows without signed rights links are not auto-approved.
    where timeseries.national_scope_read_eligible(
        o.source_code, o.dataset_code, o.geographic_scope_id, o.source_metadata
    )
      and sr.evidence_attestation_sha256 is not null
      and sr.attested_items_sha256 is not null
      and sr.notes -> 'evidenceAttestation' ->> 'itemsSha256' = sr.attested_items_sha256
      and exists (
        select 1
        from timeseries.source_run_rights_decision linked
        join timeseries.rights_decision rights
          on rights.decision_id = linked.decision_id
        where linked.source_run_id = sr.id
          and rights.source_code = o.source_code
          and rights.dataset_code = o.dataset_code
          and rights.country_iso3 = o.country_iso3
          and rights.indicator_code = o.indicator_code
          and rights.operation = 'PUBLIC_API_INGEST'
          and rights.original_http_sha256 = sr.notes ->> 'httpBodySha256'
          and rights.period_start <= o.period_start
          and rights.period_end >= o.period_end
          and rights.valid_from_utc <= statement_timestamp()
          and rights.valid_until_utc > statement_timestamp()
          and not exists (
              select 1
              from timeseries.rights_revocation revoked
              where revoked.decision_id = rights.decision_id
          )
    )
) ranked
where ranked.rn = 1;

       or vintage_txt is null or vintage_txt !~ '^[A-Za-z0-9][A-Za-z0-9_.-]{0,63}
    if matched_id is null then
        raise exception 'Geographic scope has no immutable source evidence'
            using errcode = '23514';
    end if;
    if matched_country is distinct from new.country_iso3 then
        raise exception 'Source geography cannot be mapped to a different ISO country'
            using errcode = '23514';
    end if;
    if new.geographic_scope_id is not null
       and new.geographic_scope_id <> matched_id then
        raise exception 'Client geographic scope UUID contradicts verified registry'
            using errcode = '23514';
    end if;
    new.geographic_scope_id := matched_id;
    return new;
end;
$$;

create trigger enforce_source_native_scope_on_observation
before insert or update on timeseries.observation
for each row execute function timeseries.bind_source_native_geographic_scope();

-- Shared public national eligibility function. It does not grant rights;
-- it is an ADDITIONAL geography-denial gate applied ON TOP OF rights,
-- revocation and independently witnessed provenance of V5.
-- No migration backfills a geographic scope or asserts ISO3 equivalence.
create function timeseries.national_scope_read_eligible(
    source_code varchar,
    dataset_code varchar,
    geographic_scope_id uuid,
    source_metadata jsonb
)
returns boolean language sql stable as $$
    select geographic_scope_id is null
       and not (coalesce(source_metadata, '{}'::jsonb) ?| array[
         'sourceNativeGeographyCode', 'geographicReferenceYear',
         'geographicScopeId', 'countryIso3Candidate', 'geoFilter',
         'sourceGeographyCode', 'geoReferenceYear'
       ])
       and not exists (
           select 1 from timeseries.geographic_dataset_policy p
           where p.dataset_code = $2
             and p.source_code in ('*', $1)
             and p.policy = 'SCOPE_REVIEW_HOLD'
       );
$$;

comment on function timeseries.national_scope_read_eligible(varchar,varchar,uuid,jsonb) is
'False for any documented partial/unknown scope or policy-held dataset. Not a signed geography equivalence, not rights approval.';

-- The national read API view keeps the EXACT original V5 rights/revocation
-- and independent witness checks; we only add the NEGATIVE geography
-- predicate at the observation-level base query.

create or replace view timeseries.latest_observation as
select
    ranked.id,
    ranked.source_run_id,
    ranked.source_code,
    ranked.dataset_code,
    ranked.indicator_code,
    ranked.country_iso3,
    ranked.period_granularity,
    ranked.period_start,
    ranked.period_end,
    ranked.period_label,
    ranked.numeric_value,
    ranked.text_value,
    ranked.value_status,
    ranked.source_published_at,
    ranked.source_metadata,
    ranked.quality_flags,
    ranked.ingested_at,
    ranked.run_key,
    ranked.fetched_at_utc,
    ranked.persisted_at_utc
from (
    select
        o.id,
        o.source_run_id,
        o.source_code,
        o.dataset_code,
        o.indicator_code,
        o.country_iso3,
        o.period_granularity,
        o.period_start,
        o.period_end,
        o.period_label,
        o.numeric_value,
        o.text_value,
        o.value_status,
        o.source_published_at,
        o.source_metadata,
        o.quality_flags,
        o.ingested_at,
        sr.run_key,
        sr.fetched_at_utc,
        sr.persisted_at_utc,
        row_number() over (
            partition by
                o.source_code,
                o.dataset_code,
                o.indicator_code,
                o.country_iso3,
                o.period_granularity,
                o.period_start
            order by
                sr.fetched_at_utc desc,
                sr.persisted_at_utc desc,
                o.ingested_at desc,
                o.id desc
        ) as rn
    from timeseries.observation o
    join timeseries.source_run sr on sr.id = o.source_run_id
    -- Source history can remain stored after revocation, but current public
    -- reads MUST show only versions linked to STILL-VALID reviewed rights.
    -- Historical V1/V2 rows without signed rights links are not auto-approved.
    where timeseries.national_scope_read_eligible(
        o.source_code, o.dataset_code, o.geographic_scope_id, o.source_metadata
    )
      and sr.evidence_attestation_sha256 is not null
      and sr.attested_items_sha256 is not null
      and sr.notes -> 'evidenceAttestation' ->> 'itemsSha256' = sr.attested_items_sha256
      and exists (
        select 1
        from timeseries.source_run_rights_decision linked
        join timeseries.rights_decision rights
          on rights.decision_id = linked.decision_id
        where linked.source_run_id = sr.id
          and rights.source_code = o.source_code
          and rights.dataset_code = o.dataset_code
          and rights.country_iso3 = o.country_iso3
          and rights.indicator_code = o.indicator_code
          and rights.operation = 'PUBLIC_API_INGEST'
          and rights.original_http_sha256 = sr.notes ->> 'httpBodySha256'
          and rights.period_start <= o.period_start
          and rights.period_end >= o.period_end
          and rights.valid_from_utc <= statement_timestamp()
          and rights.valid_until_utc > statement_timestamp()
          and not exists (
              select 1
              from timeseries.rights_revocation revoked
              where revoked.decision_id = rights.decision_id
          )
    )
) ranked
where ranked.rn = 1;
),
    geo_reference_year integer
        check (geo_reference_year between 1800 and 2200),
    -- Null for genuinely cross-border / yet-unassigned source scopes.
    -- The country link here is a PARENT HINT, never national equivalence.
    country_iso3 char(3) references catalog.country(iso3),
    coverage_kind varchar(32) not null check (coverage_kind in (
        'FULL_COUNTRY_CLAIM_UNREVIEWED', 'PARTIAL_COUNTRY',
        'SUBNATIONAL', 'MULTINATIONAL', 'UNKNOWN'
    )),
    display_label varchar(256) not null check (length(btrim(display_label)) > 0),
    territorial_exclusions jsonb not null default '[]'::jsonb
        check (jsonb_typeof(territorial_exclusions) = 'array'),
    territorial_inclusions jsonb not null default '[]'::jsonb
        check (jsonb_typeof(territorial_inclusions) = 'array'),
    source_metadata_url varchar(1024) not null
        check (source_metadata_url like 'https://%'),
    source_metadata_sha256 char(64) not null
        check (source_metadata_sha256 ~ '^[a-f0-9]{64}$'),
    review_status varchar(24) not null default 'RESEARCH_ONLY'
        check (review_status = 'RESEARCH_ONLY'),
    recorded_at_utc timestamptz not null default clock_timestamp(),
    unique (source_code, dataset_code, native_geo_code, geo_reference_year)
);

comment on table timeseries.geographic_scope_registry is
'Immutable private source-native geography provenance. Country ISO3 is ONLY a parent hint. No signed equivalence or PUBLIC rights are granted by registering a scope.';

-- Defensive dataset-scoped policy. Also applies to SOURCE-CODE FORGERY
-- because the known Insee dataset is denied even if called WORLD_BANK.
-- This is a review HOLD, not a rights or geography license.
create table timeseries.geographic_dataset_policy (
    source_code varchar(64) not null,
    dataset_code varchar(64) not null,
    policy varchar(32) not null check (policy = 'SCOPE_REVIEW_HOLD'),
    reason_code varchar(64) not null,
    created_at_utc timestamptz not null default clock_timestamp(),
    primary key (source_code, dataset_code)
);
insert into timeseries.geographic_dataset_policy (
    source_code, dataset_code, policy, reason_code
) values
    ('*', 'DS_POPULATIONS_REFERENCE', 'SCOPE_REVIEW_HOLD', 'INSEE_FEHM_NOT_FRA'),
    ('*', 'DS_POPULATIONS_REFERENCE_CATALOG', 'SCOPE_REVIEW_HOLD', 'INSEE_FEHM_NOT_FRA');

-- This column is assigned by the DATABASE from the *already witness-signed*
-- source_metadata fields, never accepted as a raw client-supplied UUID.
-- Preexisting rows intentionally keep NULL, preserving P2C2 semantics.
alter table timeseries.observation
    add column geographic_scope_id uuid references timeseries.geographic_scope_registry(id);

create index idx_observation_geographic_scope on timeseries.observation(geographic_scope_id);

-- No mutation, deletion, retroactive approval, or replacing FEHM by FRA
-- without a new source record and explicit migration/review process.
create function timeseries.reject_geographic_scope_history_rewrite()
returns trigger language plpgsql as $$
begin
    raise exception 'Geographic source history is append only' using errcode = '23514';
end;
$$;

create trigger scope_registry_append_only
before update or delete on timeseries.geographic_scope_registry
for each row execute function timeseries.reject_geographic_scope_history_rewrite();

create trigger dataset_scope_policy_append_only
before update or delete on timeseries.geographic_dataset_policy
for each row execute function timeseries.reject_geographic_scope_history_rewrite();

-- Scopes are not ISO3 values. The canonical source-code/year fields travel
-- inside source_metadata which the trusted independent Bronze witness
-- already fingerprints. Recalculate the FK from the registry at INSERT.
-- If only a hint is present, fail CLOSED. If the approved native code is
-- absent, fail CLOSED. If source/dataset differs, fail CLOSED. This remains
-- a PRIVATE typed scope; the public national view below will suppress it.
create function timeseries.bind_source_native_geographic_scope()
returns trigger language plpgsql as $$
declare
    native_code text;
    vintage_txt text;
    matched_id uuid;
    matched_country char(3);
    has_scope_signal boolean;
begin
    if exists (
        select 1 from timeseries.geographic_dataset_policy p
        where p.dataset_code = new.dataset_code
          and p.source_code in ('*', new.source_code)
          and p.policy = 'SCOPE_REVIEW_HOLD'
    ) then
        raise exception 'Source dataset geography requires independent review'
            using errcode = '23514';
    end if;
    if new.source_metadata is null
       or jsonb_typeof(new.source_metadata) <> 'object' then
        raise exception 'Source geography metadata must be a JSON object'
            using errcode = '23514';
    end if;
    has_scope_signal := new.geographic_scope_id is not null
      or new.source_metadata ?| array[
        'sourceNativeGeographyCode', 'geographicReferenceYear',
        'geographicScopeId', 'countryIso3Candidate', 'geoFilter',
        'sourceGeographyCode', 'geoReferenceYear'
      ];
    if not has_scope_signal then
        new.geographic_scope_id := null;
        return new;
    end if;
    native_code := new.source_metadata ->> 'sourceNativeGeographyCode';
    vintage_txt := new.source_metadata ->> 'geographicReferenceYear';
    if native_code is null or native_code !~ '^[A-Za-z0-9_.-]{1,96}$'
       or vintage_txt is null or vintage_txt !~ '^(19|20)[0-9]{2}$' then
        raise exception 'Source-native geography and vintage must be explicit'
            using errcode = '23514';
    end if;
    select s.id, s.country_iso3 into matched_id, matched_country
    from timeseries.geographic_scope_registry s
    where s.source_code = new.source_code
      and s.dataset_code = new.dataset_code
      and s.native_geo_code = native_code
      and s.geo_reference_year = vintage_txt::integer;
    if matched_id is null then
        raise exception 'Geographic scope has no immutable source evidence'
            using errcode = '23514';
    end if;
    if matched_country is distinct from new.country_iso3 then
        raise exception 'Source geography cannot be mapped to a different ISO country'
            using errcode = '23514';
    end if;
    if new.geographic_scope_id is not null
       and new.geographic_scope_id <> matched_id then
        raise exception 'Client geographic scope UUID contradicts verified registry'
            using errcode = '23514';
    end if;
    new.geographic_scope_id := matched_id;
    return new;
end;
$$;

create trigger enforce_source_native_scope_on_observation
before insert or update on timeseries.observation
for each row execute function timeseries.bind_source_native_geographic_scope();

-- Shared public national eligibility function. It does not grant rights;
-- it is an ADDITIONAL geography-denial gate applied ON TOP OF rights,
-- revocation and independently witnessed provenance of V5.
-- No migration backfills a geographic scope or asserts ISO3 equivalence.
create function timeseries.national_scope_read_eligible(
    source_code varchar,
    dataset_code varchar,
    geographic_scope_id uuid,
    source_metadata jsonb
)
returns boolean language sql stable as $$
    select geographic_scope_id is null
       and not (coalesce(source_metadata, '{}'::jsonb) ?| array[
         'sourceNativeGeographyCode', 'geographicReferenceYear',
         'geographicScopeId', 'countryIso3Candidate', 'geoFilter',
         'sourceGeographyCode', 'geoReferenceYear'
       ])
       and not exists (
           select 1 from timeseries.geographic_dataset_policy p
           where p.dataset_code = $2
             and p.source_code in ('*', $1)
             and p.policy = 'SCOPE_REVIEW_HOLD'
       );
$$;

comment on function timeseries.national_scope_read_eligible(varchar,varchar,uuid,jsonb) is
'False for any documented partial/unknown scope or policy-held dataset. Not a signed geography equivalence, not rights approval.';

-- The national read API view keeps the EXACT original V5 rights/revocation
-- and independent witness checks; we only add the NEGATIVE geography
-- predicate at the observation-level base query.

create or replace view timeseries.latest_observation as
select
    ranked.id,
    ranked.source_run_id,
    ranked.source_code,
    ranked.dataset_code,
    ranked.indicator_code,
    ranked.country_iso3,
    ranked.period_granularity,
    ranked.period_start,
    ranked.period_end,
    ranked.period_label,
    ranked.numeric_value,
    ranked.text_value,
    ranked.value_status,
    ranked.source_published_at,
    ranked.source_metadata,
    ranked.quality_flags,
    ranked.ingested_at,
    ranked.run_key,
    ranked.fetched_at_utc,
    ranked.persisted_at_utc
from (
    select
        o.id,
        o.source_run_id,
        o.source_code,
        o.dataset_code,
        o.indicator_code,
        o.country_iso3,
        o.period_granularity,
        o.period_start,
        o.period_end,
        o.period_label,
        o.numeric_value,
        o.text_value,
        o.value_status,
        o.source_published_at,
        o.source_metadata,
        o.quality_flags,
        o.ingested_at,
        sr.run_key,
        sr.fetched_at_utc,
        sr.persisted_at_utc,
        row_number() over (
            partition by
                o.source_code,
                o.dataset_code,
                o.indicator_code,
                o.country_iso3,
                o.period_granularity,
                o.period_start
            order by
                sr.fetched_at_utc desc,
                sr.persisted_at_utc desc,
                o.ingested_at desc,
                o.id desc
        ) as rn
    from timeseries.observation o
    join timeseries.source_run sr on sr.id = o.source_run_id
    -- Source history can remain stored after revocation, but current public
    -- reads MUST show only versions linked to STILL-VALID reviewed rights.
    -- Historical V1/V2 rows without signed rights links are not auto-approved.
    where timeseries.national_scope_read_eligible(
        o.source_code, o.dataset_code, o.geographic_scope_id, o.source_metadata
    )
      and sr.evidence_attestation_sha256 is not null
      and sr.attested_items_sha256 is not null
      and sr.notes -> 'evidenceAttestation' ->> 'itemsSha256' = sr.attested_items_sha256
      and exists (
        select 1
        from timeseries.source_run_rights_decision linked
        join timeseries.rights_decision rights
          on rights.decision_id = linked.decision_id
        where linked.source_run_id = sr.id
          and rights.source_code = o.source_code
          and rights.dataset_code = o.dataset_code
          and rights.country_iso3 = o.country_iso3
          and rights.indicator_code = o.indicator_code
          and rights.operation = 'PUBLIC_API_INGEST'
          and rights.original_http_sha256 = sr.notes ->> 'httpBodySha256'
          and rights.period_start <= o.period_start
          and rights.period_end >= o.period_end
          and rights.valid_from_utc <= statement_timestamp()
          and rights.valid_until_utc > statement_timestamp()
          and not exists (
              select 1
              from timeseries.rights_revocation revoked
              where revoked.decision_id = rights.decision_id
          )
    )
) ranked
where ranked.rn = 1;

       or (reference_year_txt is not null
           and reference_year_txt !~ '^(18|19|20|21)[0-9]{2}
    if matched_id is null then
        raise exception 'Geographic scope has no immutable source evidence'
            using errcode = '23514';
    end if;
    if matched_country is distinct from new.country_iso3 then
        raise exception 'Source geography cannot be mapped to a different ISO country'
            using errcode = '23514';
    end if;
    if new.geographic_scope_id is not null
       and new.geographic_scope_id <> matched_id then
        raise exception 'Client geographic scope UUID contradicts verified registry'
            using errcode = '23514';
    end if;
    new.geographic_scope_id := matched_id;
    return new;
end;
$$;

create trigger enforce_source_native_scope_on_observation
before insert or update on timeseries.observation
for each row execute function timeseries.bind_source_native_geographic_scope();

-- Shared public national eligibility function. It does not grant rights;
-- it is an ADDITIONAL geography-denial gate applied ON TOP OF rights,
-- revocation and independently witnessed provenance of V5.
-- No migration backfills a geographic scope or asserts ISO3 equivalence.
create function timeseries.national_scope_read_eligible(
    source_code varchar,
    dataset_code varchar,
    geographic_scope_id uuid,
    source_metadata jsonb
)
returns boolean language sql stable as $$
    select geographic_scope_id is null
       and not (coalesce(source_metadata, '{}'::jsonb) ?| array[
         'sourceNativeGeographyCode', 'geographicReferenceYear',
         'geographicScopeId', 'countryIso3Candidate', 'geoFilter',
         'sourceGeographyCode', 'geoReferenceYear'
       ])
       and not exists (
           select 1 from timeseries.geographic_dataset_policy p
           where p.dataset_code = $2
             and p.source_code in ('*', $1)
             and p.policy = 'SCOPE_REVIEW_HOLD'
       );
$$;

comment on function timeseries.national_scope_read_eligible(varchar,varchar,uuid,jsonb) is
'False for any documented partial/unknown scope or policy-held dataset. Not a signed geography equivalence, not rights approval.';

-- The national read API view keeps the EXACT original V5 rights/revocation
-- and independent witness checks; we only add the NEGATIVE geography
-- predicate at the observation-level base query.

create or replace view timeseries.latest_observation as
select
    ranked.id,
    ranked.source_run_id,
    ranked.source_code,
    ranked.dataset_code,
    ranked.indicator_code,
    ranked.country_iso3,
    ranked.period_granularity,
    ranked.period_start,
    ranked.period_end,
    ranked.period_label,
    ranked.numeric_value,
    ranked.text_value,
    ranked.value_status,
    ranked.source_published_at,
    ranked.source_metadata,
    ranked.quality_flags,
    ranked.ingested_at,
    ranked.run_key,
    ranked.fetched_at_utc,
    ranked.persisted_at_utc
from (
    select
        o.id,
        o.source_run_id,
        o.source_code,
        o.dataset_code,
        o.indicator_code,
        o.country_iso3,
        o.period_granularity,
        o.period_start,
        o.period_end,
        o.period_label,
        o.numeric_value,
        o.text_value,
        o.value_status,
        o.source_published_at,
        o.source_metadata,
        o.quality_flags,
        o.ingested_at,
        sr.run_key,
        sr.fetched_at_utc,
        sr.persisted_at_utc,
        row_number() over (
            partition by
                o.source_code,
                o.dataset_code,
                o.indicator_code,
                o.country_iso3,
                o.period_granularity,
                o.period_start
            order by
                sr.fetched_at_utc desc,
                sr.persisted_at_utc desc,
                o.ingested_at desc,
                o.id desc
        ) as rn
    from timeseries.observation o
    join timeseries.source_run sr on sr.id = o.source_run_id
    -- Source history can remain stored after revocation, but current public
    -- reads MUST show only versions linked to STILL-VALID reviewed rights.
    -- Historical V1/V2 rows without signed rights links are not auto-approved.
    where timeseries.national_scope_read_eligible(
        o.source_code, o.dataset_code, o.geographic_scope_id, o.source_metadata
    )
      and sr.evidence_attestation_sha256 is not null
      and sr.attested_items_sha256 is not null
      and sr.notes -> 'evidenceAttestation' ->> 'itemsSha256' = sr.attested_items_sha256
      and exists (
        select 1
        from timeseries.source_run_rights_decision linked
        join timeseries.rights_decision rights
          on rights.decision_id = linked.decision_id
        where linked.source_run_id = sr.id
          and rights.source_code = o.source_code
          and rights.dataset_code = o.dataset_code
          and rights.country_iso3 = o.country_iso3
          and rights.indicator_code = o.indicator_code
          and rights.operation = 'PUBLIC_API_INGEST'
          and rights.original_http_sha256 = sr.notes ->> 'httpBodySha256'
          and rights.period_start <= o.period_start
          and rights.period_end >= o.period_end
          and rights.valid_from_utc <= statement_timestamp()
          and rights.valid_until_utc > statement_timestamp()
          and not exists (
              select 1
              from timeseries.rights_revocation revoked
              where revoked.decision_id = rights.decision_id
          )
    )
) ranked
where ranked.rn = 1;
),
    geo_reference_year integer
        check (geo_reference_year between 1800 and 2200),
    -- Null for genuinely cross-border / yet-unassigned source scopes.
    -- The country link here is a PARENT HINT, never national equivalence.
    country_iso3 char(3) references catalog.country(iso3),
    coverage_kind varchar(32) not null check (coverage_kind in (
        'FULL_COUNTRY_CLAIM_UNREVIEWED', 'PARTIAL_COUNTRY',
        'SUBNATIONAL', 'MULTINATIONAL', 'UNKNOWN'
    )),
    display_label varchar(256) not null check (length(btrim(display_label)) > 0),
    territorial_exclusions jsonb not null default '[]'::jsonb
        check (jsonb_typeof(territorial_exclusions) = 'array'),
    territorial_inclusions jsonb not null default '[]'::jsonb
        check (jsonb_typeof(territorial_inclusions) = 'array'),
    source_metadata_url varchar(1024) not null
        check (source_metadata_url like 'https://%'),
    source_metadata_sha256 char(64) not null
        check (source_metadata_sha256 ~ '^[a-f0-9]{64}$'),
    review_status varchar(24) not null default 'RESEARCH_ONLY'
        check (review_status = 'RESEARCH_ONLY'),
    recorded_at_utc timestamptz not null default clock_timestamp(),
    unique (source_code, dataset_code, native_geo_code, geo_reference_year)
);

comment on table timeseries.geographic_scope_registry is
'Immutable private source-native geography provenance. Country ISO3 is ONLY a parent hint. No signed equivalence or PUBLIC rights are granted by registering a scope.';

-- Defensive dataset-scoped policy. Also applies to SOURCE-CODE FORGERY
-- because the known Insee dataset is denied even if called WORLD_BANK.
-- This is a review HOLD, not a rights or geography license.
create table timeseries.geographic_dataset_policy (
    source_code varchar(64) not null,
    dataset_code varchar(64) not null,
    policy varchar(32) not null check (policy = 'SCOPE_REVIEW_HOLD'),
    reason_code varchar(64) not null,
    created_at_utc timestamptz not null default clock_timestamp(),
    primary key (source_code, dataset_code)
);
insert into timeseries.geographic_dataset_policy (
    source_code, dataset_code, policy, reason_code
) values
    ('*', 'DS_POPULATIONS_REFERENCE', 'SCOPE_REVIEW_HOLD', 'INSEE_FEHM_NOT_FRA'),
    ('*', 'DS_POPULATIONS_REFERENCE_CATALOG', 'SCOPE_REVIEW_HOLD', 'INSEE_FEHM_NOT_FRA');

-- This column is assigned by the DATABASE from the *already witness-signed*
-- source_metadata fields, never accepted as a raw client-supplied UUID.
-- Preexisting rows intentionally keep NULL, preserving P2C2 semantics.
alter table timeseries.observation
    add column geographic_scope_id uuid references timeseries.geographic_scope_registry(id);

create index idx_observation_geographic_scope on timeseries.observation(geographic_scope_id);

-- No mutation, deletion, retroactive approval, or replacing FEHM by FRA
-- without a new source record and explicit migration/review process.
create function timeseries.reject_geographic_scope_history_rewrite()
returns trigger language plpgsql as $$
begin
    raise exception 'Geographic source history is append only' using errcode = '23514';
end;
$$;

create trigger scope_registry_append_only
before update or delete on timeseries.geographic_scope_registry
for each row execute function timeseries.reject_geographic_scope_history_rewrite();

create trigger dataset_scope_policy_append_only
before update or delete on timeseries.geographic_dataset_policy
for each row execute function timeseries.reject_geographic_scope_history_rewrite();

-- Scopes are not ISO3 values. The canonical source-code/year fields travel
-- inside source_metadata which the trusted independent Bronze witness
-- already fingerprints. Recalculate the FK from the registry at INSERT.
-- If only a hint is present, fail CLOSED. If the approved native code is
-- absent, fail CLOSED. If source/dataset differs, fail CLOSED. This remains
-- a PRIVATE typed scope; the public national view below will suppress it.
create function timeseries.bind_source_native_geographic_scope()
returns trigger language plpgsql as $$
declare
    native_code text;
    vintage_txt text;
    matched_id uuid;
    matched_country char(3);
    has_scope_signal boolean;
begin
    if exists (
        select 1 from timeseries.geographic_dataset_policy p
        where p.dataset_code = new.dataset_code
          and p.source_code in ('*', new.source_code)
          and p.policy = 'SCOPE_REVIEW_HOLD'
    ) then
        raise exception 'Source dataset geography requires independent review'
            using errcode = '23514';
    end if;
    if new.source_metadata is null
       or jsonb_typeof(new.source_metadata) <> 'object' then
        raise exception 'Source geography metadata must be a JSON object'
            using errcode = '23514';
    end if;
    has_scope_signal := new.geographic_scope_id is not null
      or new.source_metadata ?| array[
        'sourceNativeGeographyCode', 'geographicReferenceYear',
        'geographicScopeId', 'countryIso3Candidate', 'geoFilter',
        'sourceGeographyCode', 'geoReferenceYear'
      ];
    if not has_scope_signal then
        new.geographic_scope_id := null;
        return new;
    end if;
    native_code := new.source_metadata ->> 'sourceNativeGeographyCode';
    vintage_txt := new.source_metadata ->> 'geographicReferenceYear';
    if native_code is null or native_code !~ '^[A-Za-z0-9_.-]{1,96}$'
       or vintage_txt is null or vintage_txt !~ '^(19|20)[0-9]{2}$' then
        raise exception 'Source-native geography and vintage must be explicit'
            using errcode = '23514';
    end if;
    select s.id, s.country_iso3 into matched_id, matched_country
    from timeseries.geographic_scope_registry s
    where s.source_code = new.source_code
      and s.dataset_code = new.dataset_code
      and s.native_geo_code = native_code
      and s.geo_reference_year = vintage_txt::integer;
    if matched_id is null then
        raise exception 'Geographic scope has no immutable source evidence'
            using errcode = '23514';
    end if;
    if matched_country is distinct from new.country_iso3 then
        raise exception 'Source geography cannot be mapped to a different ISO country'
            using errcode = '23514';
    end if;
    if new.geographic_scope_id is not null
       and new.geographic_scope_id <> matched_id then
        raise exception 'Client geographic scope UUID contradicts verified registry'
            using errcode = '23514';
    end if;
    new.geographic_scope_id := matched_id;
    return new;
end;
$$;

create trigger enforce_source_native_scope_on_observation
before insert or update on timeseries.observation
for each row execute function timeseries.bind_source_native_geographic_scope();

-- Shared public national eligibility function. It does not grant rights;
-- it is an ADDITIONAL geography-denial gate applied ON TOP OF rights,
-- revocation and independently witnessed provenance of V5.
-- No migration backfills a geographic scope or asserts ISO3 equivalence.
create function timeseries.national_scope_read_eligible(
    source_code varchar,
    dataset_code varchar,
    geographic_scope_id uuid,
    source_metadata jsonb
)
returns boolean language sql stable as $$
    select geographic_scope_id is null
       and not (coalesce(source_metadata, '{}'::jsonb) ?| array[
         'sourceNativeGeographyCode', 'geographicReferenceYear',
         'geographicScopeId', 'countryIso3Candidate', 'geoFilter',
         'sourceGeographyCode', 'geoReferenceYear'
       ])
       and not exists (
           select 1 from timeseries.geographic_dataset_policy p
           where p.dataset_code = $2
             and p.source_code in ('*', $1)
             and p.policy = 'SCOPE_REVIEW_HOLD'
       );
$$;

comment on function timeseries.national_scope_read_eligible(varchar,varchar,uuid,jsonb) is
'False for any documented partial/unknown scope or policy-held dataset. Not a signed geography equivalence, not rights approval.';

-- The national read API view keeps the EXACT original V5 rights/revocation
-- and independent witness checks; we only add the NEGATIVE geography
-- predicate at the observation-level base query.

create or replace view timeseries.latest_observation as
select
    ranked.id,
    ranked.source_run_id,
    ranked.source_code,
    ranked.dataset_code,
    ranked.indicator_code,
    ranked.country_iso3,
    ranked.period_granularity,
    ranked.period_start,
    ranked.period_end,
    ranked.period_label,
    ranked.numeric_value,
    ranked.text_value,
    ranked.value_status,
    ranked.source_published_at,
    ranked.source_metadata,
    ranked.quality_flags,
    ranked.ingested_at,
    ranked.run_key,
    ranked.fetched_at_utc,
    ranked.persisted_at_utc
from (
    select
        o.id,
        o.source_run_id,
        o.source_code,
        o.dataset_code,
        o.indicator_code,
        o.country_iso3,
        o.period_granularity,
        o.period_start,
        o.period_end,
        o.period_label,
        o.numeric_value,
        o.text_value,
        o.value_status,
        o.source_published_at,
        o.source_metadata,
        o.quality_flags,
        o.ingested_at,
        sr.run_key,
        sr.fetched_at_utc,
        sr.persisted_at_utc,
        row_number() over (
            partition by
                o.source_code,
                o.dataset_code,
                o.indicator_code,
                o.country_iso3,
                o.period_granularity,
                o.period_start
            order by
                sr.fetched_at_utc desc,
                sr.persisted_at_utc desc,
                o.ingested_at desc,
                o.id desc
        ) as rn
    from timeseries.observation o
    join timeseries.source_run sr on sr.id = o.source_run_id
    -- Source history can remain stored after revocation, but current public
    -- reads MUST show only versions linked to STILL-VALID reviewed rights.
    -- Historical V1/V2 rows without signed rights links are not auto-approved.
    where timeseries.national_scope_read_eligible(
        o.source_code, o.dataset_code, o.geographic_scope_id, o.source_metadata
    )
      and sr.evidence_attestation_sha256 is not null
      and sr.attested_items_sha256 is not null
      and sr.notes -> 'evidenceAttestation' ->> 'itemsSha256' = sr.attested_items_sha256
      and exists (
        select 1
        from timeseries.source_run_rights_decision linked
        join timeseries.rights_decision rights
          on rights.decision_id = linked.decision_id
        where linked.source_run_id = sr.id
          and rights.source_code = o.source_code
          and rights.dataset_code = o.dataset_code
          and rights.country_iso3 = o.country_iso3
          and rights.indicator_code = o.indicator_code
          and rights.operation = 'PUBLIC_API_INGEST'
          and rights.original_http_sha256 = sr.notes ->> 'httpBodySha256'
          and rights.period_start <= o.period_start
          and rights.period_end >= o.period_end
          and rights.valid_from_utc <= statement_timestamp()
          and rights.valid_until_utc > statement_timestamp()
          and not exists (
              select 1
              from timeseries.rights_revocation revoked
              where revoked.decision_id = rights.decision_id
          )
    )
) ranked
where ranked.rn = 1;
) then
        raise exception 'Source-native geography and version must be explicit'
            using errcode = '23514';
    end if;
    select s.id, s.country_iso3, s.geo_reference_year
      into matched_id, matched_country, matched_reference_year
    from timeseries.geographic_scope_registry s
    where s.source_code = new.source_code
      and s.dataset_code = new.dataset_code
      and s.native_geo_code = native_code
      and s.native_geo_version = vintage_txt;
    if matched_id is null then
        raise exception 'Geographic scope has no immutable source evidence'
            using errcode = '23514';
    end if;
    if matched_country is distinct from new.country_iso3 then
        raise exception 'Source geography cannot be mapped to a different ISO country'
            using errcode = '23514';
    end if;
    if new.geographic_scope_id is not null
       and new.geographic_scope_id <> matched_id then
        raise exception 'Client geographic scope UUID contradicts verified registry'
            using errcode = '23514';
    end if;
    new.geographic_scope_id := matched_id;
    return new;
end;
$$;

create trigger enforce_source_native_scope_on_observation
before insert or update on timeseries.observation
for each row execute function timeseries.bind_source_native_geographic_scope();

-- Shared public national eligibility function. It does not grant rights;
-- it is an ADDITIONAL geography-denial gate applied ON TOP OF rights,
-- revocation and independently witnessed provenance of V5.
-- No migration backfills a geographic scope or asserts ISO3 equivalence.
create function timeseries.national_scope_read_eligible(
    source_code varchar,
    dataset_code varchar,
    geographic_scope_id uuid,
    source_metadata jsonb
)
returns boolean language sql stable as $$
    select geographic_scope_id is null
       and not (coalesce(source_metadata, '{}'::jsonb) ?| array[
         'sourceNativeGeographyCode', 'geographicReferenceYear',
         'geographicScopeId', 'countryIso3Candidate', 'geoFilter',
         'sourceGeographyCode', 'geoReferenceYear'
       ])
       and not exists (
           select 1 from timeseries.geographic_dataset_policy p
           where p.dataset_code = $2
             and p.source_code in ('*', $1)
             and p.policy = 'SCOPE_REVIEW_HOLD'
       );
$$;

comment on function timeseries.national_scope_read_eligible(varchar,varchar,uuid,jsonb) is
'False for any documented partial/unknown scope or policy-held dataset. Not a signed geography equivalence, not rights approval.';

-- The national read API view keeps the EXACT original V5 rights/revocation
-- and independent witness checks; we only add the NEGATIVE geography
-- predicate at the observation-level base query.

create or replace view timeseries.latest_observation as
select
    ranked.id,
    ranked.source_run_id,
    ranked.source_code,
    ranked.dataset_code,
    ranked.indicator_code,
    ranked.country_iso3,
    ranked.period_granularity,
    ranked.period_start,
    ranked.period_end,
    ranked.period_label,
    ranked.numeric_value,
    ranked.text_value,
    ranked.value_status,
    ranked.source_published_at,
    ranked.source_metadata,
    ranked.quality_flags,
    ranked.ingested_at,
    ranked.run_key,
    ranked.fetched_at_utc,
    ranked.persisted_at_utc
from (
    select
        o.id,
        o.source_run_id,
        o.source_code,
        o.dataset_code,
        o.indicator_code,
        o.country_iso3,
        o.period_granularity,
        o.period_start,
        o.period_end,
        o.period_label,
        o.numeric_value,
        o.text_value,
        o.value_status,
        o.source_published_at,
        o.source_metadata,
        o.quality_flags,
        o.ingested_at,
        sr.run_key,
        sr.fetched_at_utc,
        sr.persisted_at_utc,
        row_number() over (
            partition by
                o.source_code,
                o.dataset_code,
                o.indicator_code,
                o.country_iso3,
                o.period_granularity,
                o.period_start
            order by
                sr.fetched_at_utc desc,
                sr.persisted_at_utc desc,
                o.ingested_at desc,
                o.id desc
        ) as rn
    from timeseries.observation o
    join timeseries.source_run sr on sr.id = o.source_run_id
    -- Source history can remain stored after revocation, but current public
    -- reads MUST show only versions linked to STILL-VALID reviewed rights.
    -- Historical V1/V2 rows without signed rights links are not auto-approved.
    where timeseries.national_scope_read_eligible(
        o.source_code, o.dataset_code, o.geographic_scope_id, o.source_metadata
    )
      and sr.evidence_attestation_sha256 is not null
      and sr.attested_items_sha256 is not null
      and sr.notes -> 'evidenceAttestation' ->> 'itemsSha256' = sr.attested_items_sha256
      and exists (
        select 1
        from timeseries.source_run_rights_decision linked
        join timeseries.rights_decision rights
          on rights.decision_id = linked.decision_id
        where linked.source_run_id = sr.id
          and rights.source_code = o.source_code
          and rights.dataset_code = o.dataset_code
          and rights.country_iso3 = o.country_iso3
          and rights.indicator_code = o.indicator_code
          and rights.operation = 'PUBLIC_API_INGEST'
          and rights.original_http_sha256 = sr.notes ->> 'httpBodySha256'
          and rights.period_start <= o.period_start
          and rights.period_end >= o.period_end
          and rights.valid_from_utc <= statement_timestamp()
          and rights.valid_until_utc > statement_timestamp()
          and not exists (
              select 1
              from timeseries.rights_revocation revoked
              where revoked.decision_id = rights.decision_id
          )
    )
) ranked
where ranked.rn = 1;
),
    geo_reference_year integer
        check (geo_reference_year between 1800 and 2200),
    -- Null for genuinely cross-border / yet-unassigned source scopes.
    -- The country link here is a PARENT HINT, never national equivalence.
    country_iso3 char(3) references catalog.country(iso3),
    coverage_kind varchar(32) not null check (coverage_kind in (
        'FULL_COUNTRY_CLAIM_UNREVIEWED', 'PARTIAL_COUNTRY',
        'SUBNATIONAL', 'MULTINATIONAL', 'UNKNOWN'
    )),
    display_label varchar(256) not null check (length(btrim(display_label)) > 0),
    territorial_exclusions jsonb not null default '[]'::jsonb
        check (jsonb_typeof(territorial_exclusions) = 'array'),
    territorial_inclusions jsonb not null default '[]'::jsonb
        check (jsonb_typeof(territorial_inclusions) = 'array'),
    source_metadata_url varchar(1024) not null
        check (source_metadata_url like 'https://%'),
    source_metadata_sha256 char(64) not null
        check (source_metadata_sha256 ~ '^[a-f0-9]{64}$'),
    review_status varchar(24) not null default 'RESEARCH_ONLY'
        check (review_status = 'RESEARCH_ONLY'),
    recorded_at_utc timestamptz not null default clock_timestamp(),
    unique (source_code, dataset_code, native_geo_code, geo_reference_year)
);

comment on table timeseries.geographic_scope_registry is
'Immutable private source-native geography provenance. Country ISO3 is ONLY a parent hint. No signed equivalence or PUBLIC rights are granted by registering a scope.';

-- Defensive dataset-scoped policy. Also applies to SOURCE-CODE FORGERY
-- because the known Insee dataset is denied even if called WORLD_BANK.
-- This is a review HOLD, not a rights or geography license.
create table timeseries.geographic_dataset_policy (
    source_code varchar(64) not null,
    dataset_code varchar(64) not null,
    policy varchar(32) not null check (policy = 'SCOPE_REVIEW_HOLD'),
    reason_code varchar(64) not null,
    created_at_utc timestamptz not null default clock_timestamp(),
    primary key (source_code, dataset_code)
);
insert into timeseries.geographic_dataset_policy (
    source_code, dataset_code, policy, reason_code
) values
    ('*', 'DS_POPULATIONS_REFERENCE', 'SCOPE_REVIEW_HOLD', 'INSEE_FEHM_NOT_FRA'),
    ('*', 'DS_POPULATIONS_REFERENCE_CATALOG', 'SCOPE_REVIEW_HOLD', 'INSEE_FEHM_NOT_FRA');

-- This column is assigned by the DATABASE from the *already witness-signed*
-- source_metadata fields, never accepted as a raw client-supplied UUID.
-- Preexisting rows intentionally keep NULL, preserving P2C2 semantics.
alter table timeseries.observation
    add column geographic_scope_id uuid references timeseries.geographic_scope_registry(id);

create index idx_observation_geographic_scope on timeseries.observation(geographic_scope_id);

-- No mutation, deletion, retroactive approval, or replacing FEHM by FRA
-- without a new source record and explicit migration/review process.
create function timeseries.reject_geographic_scope_history_rewrite()
returns trigger language plpgsql as $$
begin
    raise exception 'Geographic source history is append only' using errcode = '23514';
end;
$$;

create trigger scope_registry_append_only
before update or delete on timeseries.geographic_scope_registry
for each row execute function timeseries.reject_geographic_scope_history_rewrite();

create trigger dataset_scope_policy_append_only
before update or delete on timeseries.geographic_dataset_policy
for each row execute function timeseries.reject_geographic_scope_history_rewrite();

-- Scopes are not ISO3 values. The canonical source-code/year fields travel
-- inside source_metadata which the trusted independent Bronze witness
-- already fingerprints. Recalculate the FK from the registry at INSERT.
-- If only a hint is present, fail CLOSED. If the approved native code is
-- absent, fail CLOSED. If source/dataset differs, fail CLOSED. This remains
-- a PRIVATE typed scope; the public national view below will suppress it.
create function timeseries.bind_source_native_geographic_scope()
returns trigger language plpgsql as $$
declare
    native_code text;
    vintage_txt text;
    matched_id uuid;
    matched_country char(3);
    has_scope_signal boolean;
begin
    if exists (
        select 1 from timeseries.geographic_dataset_policy p
        where p.dataset_code = new.dataset_code
          and p.source_code in ('*', new.source_code)
          and p.policy = 'SCOPE_REVIEW_HOLD'
    ) then
        raise exception 'Source dataset geography requires independent review'
            using errcode = '23514';
    end if;
    if new.source_metadata is null
       or jsonb_typeof(new.source_metadata) <> 'object' then
        raise exception 'Source geography metadata must be a JSON object'
            using errcode = '23514';
    end if;
    has_scope_signal := new.geographic_scope_id is not null
      or new.source_metadata ?| array[
        'sourceNativeGeographyCode', 'geographicReferenceYear',
        'geographicScopeId', 'countryIso3Candidate', 'geoFilter',
        'sourceGeographyCode', 'geoReferenceYear'
      ];
    if not has_scope_signal then
        new.geographic_scope_id := null;
        return new;
    end if;
    native_code := new.source_metadata ->> 'sourceNativeGeographyCode';
    vintage_txt := new.source_metadata ->> 'geographicReferenceYear';
    if native_code is null or native_code !~ '^[A-Za-z0-9_.-]{1,96}$'
       or vintage_txt is null or vintage_txt !~ '^(19|20)[0-9]{2}$' then
        raise exception 'Source-native geography and vintage must be explicit'
            using errcode = '23514';
    end if;
    select s.id, s.country_iso3 into matched_id, matched_country
    from timeseries.geographic_scope_registry s
    where s.source_code = new.source_code
      and s.dataset_code = new.dataset_code
      and s.native_geo_code = native_code
      and s.geo_reference_year = vintage_txt::integer;
    if matched_id is null then
        raise exception 'Geographic scope has no immutable source evidence'
            using errcode = '23514';
    end if;
    if matched_country is distinct from new.country_iso3 then
        raise exception 'Source geography cannot be mapped to a different ISO country'
            using errcode = '23514';
    end if;
    if new.geographic_scope_id is not null
       and new.geographic_scope_id <> matched_id then
        raise exception 'Client geographic scope UUID contradicts verified registry'
            using errcode = '23514';
    end if;
    new.geographic_scope_id := matched_id;
    return new;
end;
$$;

create trigger enforce_source_native_scope_on_observation
before insert or update on timeseries.observation
for each row execute function timeseries.bind_source_native_geographic_scope();

-- Shared public national eligibility function. It does not grant rights;
-- it is an ADDITIONAL geography-denial gate applied ON TOP OF rights,
-- revocation and independently witnessed provenance of V5.
-- No migration backfills a geographic scope or asserts ISO3 equivalence.
create function timeseries.national_scope_read_eligible(
    source_code varchar,
    dataset_code varchar,
    geographic_scope_id uuid,
    source_metadata jsonb
)
returns boolean language sql stable as $$
    select geographic_scope_id is null
       and not (coalesce(source_metadata, '{}'::jsonb) ?| array[
         'sourceNativeGeographyCode', 'geographicReferenceYear',
         'geographicScopeId', 'countryIso3Candidate', 'geoFilter',
         'sourceGeographyCode', 'geoReferenceYear'
       ])
       and not exists (
           select 1 from timeseries.geographic_dataset_policy p
           where p.dataset_code = $2
             and p.source_code in ('*', $1)
             and p.policy = 'SCOPE_REVIEW_HOLD'
       );
$$;

comment on function timeseries.national_scope_read_eligible(varchar,varchar,uuid,jsonb) is
'False for any documented partial/unknown scope or policy-held dataset. Not a signed geography equivalence, not rights approval.';

-- The national read API view keeps the EXACT original V5 rights/revocation
-- and independent witness checks; we only add the NEGATIVE geography
-- predicate at the observation-level base query.

create or replace view timeseries.latest_observation as
select
    ranked.id,
    ranked.source_run_id,
    ranked.source_code,
    ranked.dataset_code,
    ranked.indicator_code,
    ranked.country_iso3,
    ranked.period_granularity,
    ranked.period_start,
    ranked.period_end,
    ranked.period_label,
    ranked.numeric_value,
    ranked.text_value,
    ranked.value_status,
    ranked.source_published_at,
    ranked.source_metadata,
    ranked.quality_flags,
    ranked.ingested_at,
    ranked.run_key,
    ranked.fetched_at_utc,
    ranked.persisted_at_utc
from (
    select
        o.id,
        o.source_run_id,
        o.source_code,
        o.dataset_code,
        o.indicator_code,
        o.country_iso3,
        o.period_granularity,
        o.period_start,
        o.period_end,
        o.period_label,
        o.numeric_value,
        o.text_value,
        o.value_status,
        o.source_published_at,
        o.source_metadata,
        o.quality_flags,
        o.ingested_at,
        sr.run_key,
        sr.fetched_at_utc,
        sr.persisted_at_utc,
        row_number() over (
            partition by
                o.source_code,
                o.dataset_code,
                o.indicator_code,
                o.country_iso3,
                o.period_granularity,
                o.period_start
            order by
                sr.fetched_at_utc desc,
                sr.persisted_at_utc desc,
                o.ingested_at desc,
                o.id desc
        ) as rn
    from timeseries.observation o
    join timeseries.source_run sr on sr.id = o.source_run_id
    -- Source history can remain stored after revocation, but current public
    -- reads MUST show only versions linked to STILL-VALID reviewed rights.
    -- Historical V1/V2 rows without signed rights links are not auto-approved.
    where timeseries.national_scope_read_eligible(
        o.source_code, o.dataset_code, o.geographic_scope_id, o.source_metadata
    )
      and sr.evidence_attestation_sha256 is not null
      and sr.attested_items_sha256 is not null
      and sr.notes -> 'evidenceAttestation' ->> 'itemsSha256' = sr.attested_items_sha256
      and exists (
        select 1
        from timeseries.source_run_rights_decision linked
        join timeseries.rights_decision rights
          on rights.decision_id = linked.decision_id
        where linked.source_run_id = sr.id
          and rights.source_code = o.source_code
          and rights.dataset_code = o.dataset_code
          and rights.country_iso3 = o.country_iso3
          and rights.indicator_code = o.indicator_code
          and rights.operation = 'PUBLIC_API_INGEST'
          and rights.original_http_sha256 = sr.notes ->> 'httpBodySha256'
          and rights.period_start <= o.period_start
          and rights.period_end >= o.period_end
          and rights.valid_from_utc <= statement_timestamp()
          and rights.valid_until_utc > statement_timestamp()
          and not exists (
              select 1
              from timeseries.rights_revocation revoked
              where revoked.decision_id = rights.decision_id
          )
    )
) ranked
where ranked.rn = 1;
