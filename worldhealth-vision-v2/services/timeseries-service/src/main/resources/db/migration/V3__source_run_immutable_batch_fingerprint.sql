-- DATA-1C-A/B1: a source run's first accepted request becomes immutable.
-- This is deliberately nullable: historical V1 runs lack a canonical fingerprint
-- and cannot be retroactively declared verified without rechecking raw evidence.
-- Replays of legacy rows must fail closed with a conflict, not silently rewrite.
alter table timeseries.source_run
    add column if not exists canonical_batch_sha256 char(64);

alter table timeseries.source_run
    add constraint ck_source_run_canonical_batch_sha256
    check (
        canonical_batch_sha256 is null
        or canonical_batch_sha256 ~ '^[a-f0-9]{64}$'
    );

comment on column timeseries.source_run.canonical_batch_sha256 is
'Immutable SHA-256 of canonical normalized ingestion request. NULL for historical non-attested runs; no automatic backfill. Distinct from HTTP raw entity SHA-256 and acquisition event ID.';
