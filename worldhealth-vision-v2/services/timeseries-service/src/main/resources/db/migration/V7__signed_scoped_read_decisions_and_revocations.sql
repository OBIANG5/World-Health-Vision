-- WORLD-VISION / P2C3C2 / Issue #114 / SCOPED != NATIONAL.
-- Signed geography review is DISTINCT from a signed dataset reuse license.
-- ZERO real provider approvals, data, source values, geography mappings,
-- public scope grants or secret private signing keys are seeded.
-- The existing V6 national view and hold on Insee FEHM DO NOT CHANGE.
--
-- The source metadata URL and immutable raw SHA in geographic_scope_registry
-- only identify source evidence; they NEVER self-authorize any public display.
create table timeseries.scoped_publication_decision (
    decision_id uuid primary key,
    geographic_scope_id uuid not null
        references timeseries.geographic_scope_registry(id),
    source_code varchar(64) not null,
    dataset_code varchar(64) not null,
    indicator_code varchar(64) not null,
    operation varchar(48) not null
        check (operation = 'PUBLIC_SCOPED_WEB_DISPLAY'),
    original_http_sha256 char(64) not null
        check (original_http_sha256 ~ '^[a-f0-9]{64}$'),
    source_metadata_sha256 char(64) not null
        check (source_metadata_sha256 ~ '^[a-f0-9]{64}$'),
    methodology_code varchar(96) not null
        check (methodology_code ~ '^[A-Za-z0-9_.-]{1,96}$'),
    unit_code varchar(64) not null
        check (unit_code ~ '^[A-Za-z0-9_.-]{1,64}$'),
    period_start date not null,
    period_end date not null,
    valid_from_utc timestamptz not null,
    valid_until_utc timestamptz not null,
    issued_at_utc timestamptz not null,
    reviewer_id varchar(128) not null,
    countersigner_id varchar(128) not null,
    scope_metadata_label varchar(256) not null,
    scope_native_code varchar(96) not null,
    scope_native_version varchar(64) not null,
    scope_country_iso3 char(3) not null,
    scope_coverage_kind varchar(32) not null,
    signing_public_key_sha256 char(64) not null
        check (signing_public_key_sha256 ~ '^[a-f0-9]{64}$'),
    signature_base64 varchar(128) not null,
    created_at_utc timestamptz not null default clock_timestamp(),
    check (period_start <= period_end),
    check (valid_from_utc < valid_until_utc),
    check (issued_at_utc <= valid_from_utc),
    check (reviewer_id <> countersigner_id),
    check (length(btrim(reviewer_id)) > 0),
    check (length(btrim(countersigner_id)) > 0),
    check (length(btrim(scope_metadata_label)) > 0),
    check (scope_coverage_kind in ('PARTIAL_COUNTRY', 'SUBNATIONAL'))
);

create index idx_scoped_decision_source
    on timeseries.scoped_publication_decision(
      source_code, dataset_code, indicator_code, geographic_scope_id,
      original_http_sha256
    );

create table timeseries.scoped_publication_revocation (
    decision_id uuid primary key
        references timeseries.scoped_publication_decision(decision_id),
    revoked_at_utc timestamptz not null default clock_timestamp(),
    operator_id varchar(128) not null check(length(btrim(operator_id)) > 0),
    reason_code varchar(64) not null check(length(btrim(reason_code)) > 0)
);

-- Preserve reviewer history and revocations forever. Never UPDATE a signed
-- claim or delete a tombstone. Replacement requires new decision ID and proof.
create trigger scoped_decision_no_rewrite
before update or delete on timeseries.scoped_publication_decision
for each row execute function timeseries.reject_rights_record_modification();

create trigger scoped_revocation_no_rewrite
before update or delete on timeseries.scoped_publication_revocation
for each row execute function timeseries.reject_rights_record_modification();

-- Revoke with parent-row lock, matching the original signed-rights pattern.
-- Query endpoints always recheck tombstones and expiry per request, no cache.
create function timeseries.serialize_scoped_publication_revocation()
returns trigger language plpgsql as $$
begin
    perform 1 from timeseries.scoped_publication_decision
    where decision_id = new.decision_id for update;
    if not found then
        raise exception 'Cannot revoke unknown geography publication decision'
        using errcode = '23503';
    end if;
    return new;
end;
$$;

create trigger scoped_revocation_parent_lock
before insert on timeseries.scoped_publication_revocation
for each row execute function timeseries.serialize_scoped_publication_revocation();

comment on table timeseries.scoped_publication_decision is
'Independent Ed25519 geography review. Never creates a source license, national comparability, ingestion authorization, or verified original Bronze evidence by itself.';
comment on table timeseries.scoped_publication_revocation is
'Additive revocation; every scoped public read rechecks validity and linked signed source-reuse rights.';

-- The following are crucial invariant checks. Even a DB operator who can
-- INSERT a row must not claim a different source, scope or country from the
-- immutable geographic_scope_registry. Signature verification takes place
-- AGAIN in Java on EVERY public scoped read, using a separately provisioned
-- Ed25519 trust anchor. These checks are NOT a replacement for it.
create function timeseries.reject_inconsistent_scoped_claim()
returns trigger language plpgsql as $$
declare
    source_scope timeseries.geographic_scope_registry%rowtype;
begin
    select * into source_scope
    from timeseries.geographic_scope_registry
    where id = new.geographic_scope_id;
    if not found
       or source_scope.source_code <> new.source_code
       or source_scope.dataset_code <> new.dataset_code
       or source_scope.country_iso3 is distinct from new.scope_country_iso3
       or source_scope.native_geo_code <> new.scope_native_code
       or source_scope.native_geo_version <> new.scope_native_version
       or source_scope.source_metadata_sha256 <> new.source_metadata_sha256
       or source_scope.display_label <> new.scope_metadata_label
       or source_scope.coverage_kind <> new.scope_coverage_kind
       or source_scope.review_status <> 'RESEARCH_ONLY'
    then
        raise exception 'Scoped geography claim contradicts independently archived source scope'
        using errcode = '23514';
    end if;
    if exists (
        select 1 from timeseries.geographic_dataset_policy h
        where h.dataset_code=new.dataset_code
          and h.source_code in ('*',new.source_code)
          and h.policy='SCOPE_REVIEW_HOLD'
    ) then
        raise exception 'Geographic scope dataset remains under independent review HOLD'
        using errcode = '23514';
    end if;
    return new;
end;
$$;

create trigger scoped_decision_source_consistency
before insert on timeseries.scoped_publication_decision
for each row execute function timeseries.reject_inconsistent_scoped_claim();
