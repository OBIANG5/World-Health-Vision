-- DATA-1C-A2B1: source runs created before a verified private evidence witness
-- must NOT silently become public. No backfill and no fake source attestation.
alter table timeseries.source_run
    add column evidence_attestation_sha256 char(64);
alter table timeseries.source_run
    add column attested_items_sha256 char(64);
alter table timeseries.source_run
    add constraint ck_source_run_evidence_attestation_sha256
    check (evidence_attestation_sha256 is null or evidence_attestation_sha256 ~ '^[a-f0-9]{64}$');
alter table timeseries.source_run
    add constraint ck_source_run_attested_items_sha256
    check (attested_items_sha256 is null or attested_items_sha256 ~ '^[a-f0-9]{64}$');

comment on column timeseries.source_run.evidence_attestation_sha256 is
'Server-derived SHA of witness-signed payload; NULL for pre-A2B runs without verified original Bronze evidence.';
comment on column timeseries.source_run.attested_items_sha256 is
'Independent receiver recomputation over all submitted normalized values, metadata and quality flags.';

-- Not a general rewrite of the earlier V4 view: keep its existing rights,
-- revocation and source-version selection criteria, adding a positive witness
-- requirement to EVERY public observation. Old runs stay stored privately.
create or replace view timeseries.latest_observation as
with ranked as (
    select
        o.id, o.source_run_id, o.source_code, o.dataset_code,
        o.indicator_code, o.country_iso3, o.period_granularity,
        o.period_start, o.period_end, o.period_label, o.numeric_value,
        o.text_value, o.value_status, o.source_published_at, o.source_metadata,
        o.quality_flags, o.ingested_at,
        sr.run_key, sr.fetched_at_utc, sr.persisted_at_utc,
        row_number() over (
            partition by o.source_code, o.dataset_code, o.indicator_code,
                         o.country_iso3, o.period_granularity, o.period_start
            order by sr.fetched_at_utc desc, sr.persisted_at_utc desc, o.ingested_at desc
        ) rn
    from timeseries.observation o
    join timeseries.source_run sr on sr.id = o.source_run_id
    where sr.evidence_attestation_sha256 is not null
      and sr.attested_items_sha256 is not null
      and sr.notes -> 'evidenceAttestation' ->> 'itemsSha256' = sr.attested_items_sha256
      and exists (
        select 1 from timeseries.source_run_rights_decision linked
        join timeseries.rights_decision rights on linked.decision_id = rights.decision_id
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
            select 1 from timeseries.rights_revocation revoked
            where revoked.decision_id = rights.decision_id
          )
      )
) select
    id, source_run_id, source_code, dataset_code, indicator_code,
    country_iso3, period_granularity, period_start, period_end,
    period_label, numeric_value, text_value, value_status, source_published_at,
    source_metadata, quality_flags, ingested_at, run_key, fetched_at_utc,
    persisted_at_utc
from ranked where rn = 1;
