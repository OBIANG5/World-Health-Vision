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
