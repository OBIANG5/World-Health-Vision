-- DATA-1C-A2: zero approvals are seeded. All pre-existing data remains
-- historical; NO license is inferred from an existing catalog source/run.
-- PUBLIC_API_INGEST means material becomes eligible for public API reading.
-- This table is a verified reviewer decision, not an official provider license.
create table timeseries.rights_decision (
    decision_id uuid primary key,
    source_code varchar(64) not null,
    dataset_code varchar(64) not null,
    country_iso3 char(3) not null,
    indicator_code varchar(64) not null,
    operation varchar(64) not null check (operation in (
        'PRIVATE_ARCHIVE', 'PUBLIC_WEB_DISPLAY', 'PUBLIC_API_INGEST',
        'API_REDISTRIBUTION', 'COMMERCIAL_REUSE', 'DERIVED_DATASET'
    )),
    original_http_sha256 char(64) not null
        check (original_http_sha256 ~ '^[a-f0-9]{64}$'),
    period_start date not null,
    period_end date not null,
    valid_from_utc timestamptz not null,
    valid_until_utc timestamptz not null,
    issued_at_utc timestamptz not null,
    reviewer_id varchar(128) not null,
    countersigner_id varchar(128) not null,
    license_identifier varchar(128) not null,
    license_url varchar(1024) not null,
    license_text_sha256 char(64) not null
        check (license_text_sha256 ~ '^[a-f0-9]{64}$'),
    attribution_text varchar(1024) not null,
    signing_public_key_sha256 char(64) not null
        check (signing_public_key_sha256 ~ '^[a-f0-9]{64}$'),
    signature_base64 varchar(128) not null,
    created_at_utc timestamptz not null default clock_timestamp(),
    check (period_end >= period_start),
    check (valid_from_utc < valid_until_utc),
    check (issued_at_utc <= valid_from_utc),
    check (reviewer_id <> countersigner_id),
    check (length(btrim(reviewer_id)) > 0 and length(btrim(countersigner_id)) > 0),
    check (length(btrim(license_identifier)) > 0 and length(btrim(attribution_text)) > 0),
    check (license_url like 'https://%')
);

create index idx_rights_decision_scope
    on timeseries.rights_decision (
        source_code, dataset_code, country_iso3, indicator_code, operation,
        original_http_sha256
    );

-- A revocation is ADDITIVE; never flip a mutable boolean on a signed approval.
create table timeseries.rights_revocation (
    decision_id uuid primary key references timeseries.rights_decision(decision_id),
    revoked_at_utc timestamptz not null default clock_timestamp(),
    operator_id varchar(128) not null,
    reason_code varchar(64) not null,
    check (length(btrim(operator_id)) > 0 and length(btrim(reason_code)) > 0)
);

-- This link explains *which* independently signed permissions were checked
-- for each persisted source run; different countries/indicators can have
-- separate permissions. No silent rights backfill for older source runs.
create table timeseries.source_run_rights_decision (
    source_run_id uuid not null references timeseries.source_run(id),
    decision_id uuid not null references timeseries.rights_decision(decision_id),
    linked_at_utc timestamptz not null default clock_timestamp(),
    primary key (source_run_id, decision_id)
);

create index idx_run_rights_decision_lookup
    on timeseries.source_run_rights_decision(decision_id, source_run_id);

-- A replica or retry cannot mutate a signed grant, tombstone or linked proof.
create function timeseries.reject_rights_record_modification()
returns trigger language plpgsql as $$
begin
    raise exception 'Rights history is append only' using errcode = '23514';
end;
$$;
create trigger rights_decision_no_rewrite
before update or delete on timeseries.rights_decision
for each row execute function timeseries.reject_rights_record_modification();
create trigger rights_revocation_no_rewrite
before update or delete on timeseries.rights_revocation
for each row execute function timeseries.reject_rights_record_modification();
create trigger source_run_rights_no_rewrite
before update or delete on timeseries.source_run_rights_decision
for each row execute function timeseries.reject_rights_record_modification();

-- DB-side TOCTOU barrier: a revoker MUST take the SAME FOR UPDATE row lock
-- held by the ingestion's approval lookup, and then insert the tombstone.
-- Under READ COMMITTED the ingest checks for revocation in a *new SQL
-- statement after acquiring the lock*. Either ingest commits before the
-- revocation or it sees the committed tombstone and rejects, never midway.
create function timeseries.serialize_rights_revocation()
returns trigger language plpgsql as $$
begin
    perform 1
    from timeseries.rights_decision
    where decision_id = new.decision_id
    for update;
    if not found then
        raise exception 'Cannot revoke unknown rights decision' using errcode = '23503';
    end if;
    return new;
end;
$$;
create trigger rights_revocation_lock_parent
before insert on timeseries.rights_revocation
for each row execute function timeseries.serialize_rights_revocation();

comment on table timeseries.rights_decision is
'Independent externally Ed25519-signed, time/territory/indicator/HTTP-SHA-scoped reviewer decisions; no grants seeded.';
comment on table timeseries.rights_revocation is
'Append-only revocations acquire FOR UPDATE on decision to serialize with ingest commit.';


-- DATA-1C-A2 public read gate. A previously approved value is NOT still
-- publishable after license revocation/expiry. The old physical source_run
-- and observation remain stored for forensic/legal historical review.
-- The changed latest_observation view is used by business read endpoints
-- and source-data coverage; this is a deliberate fail-closed migration.
-- No timeseries values or source rows are destructively migrated.
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
    where exists (
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
