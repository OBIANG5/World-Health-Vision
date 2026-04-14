create schema if not exists timeseries;

create table if not exists timeseries.source_run (
    id uuid primary key,
    source_code varchar(64) not null references catalog.source(code),
    dataset_code varchar(64) not null,
    run_key varchar(128) not null,
    fetched_at_utc timestamptz not null,
    persisted_at_utc timestamptz not null default current_timestamp,
    bronze_raw_payload_path text,
    bronze_normalized_payload_path text,
    record_count integer not null default 0 check (record_count >= 0),
    status varchar(16) not null check (status in ('PERSISTED', 'PARTIAL', 'FAILED')),
    notes jsonb not null default '{}'::jsonb,
    created_at timestamptz not null default current_timestamp,
    unique (source_code, dataset_code, run_key)
);

create index if not exists idx_timeseries_source_run_lookup
    on timeseries.source_run (source_code, dataset_code, fetched_at_utc desc);

create table if not exists timeseries.observation (
    id uuid primary key,
    source_run_id uuid not null references timeseries.source_run(id) on delete cascade,
    source_code varchar(64) not null references catalog.source(code),
    dataset_code varchar(64) not null,
    indicator_code varchar(64) not null references catalog.indicator(code),
    country_iso3 char(3) not null references catalog.country(iso3),
    period_granularity varchar(16) not null check (period_granularity in ('DAILY', 'MONTHLY', 'QUARTERLY', 'ANNUAL', 'AD_HOC')),
    period_start date not null,
    period_end date not null,
    period_label varchar(32) not null,
    numeric_value double precision,
    text_value text,
    value_status varchar(16) not null check (value_status in ('OBSERVED', 'MISSING', 'SUPPRESSED', 'ESTIMATED')),
    source_published_at timestamptz,
    source_metadata jsonb not null default '{}'::jsonb,
    quality_flags jsonb not null default '[]'::jsonb,
    ingested_at timestamptz not null default current_timestamp,
    created_at timestamptz not null default current_timestamp,
    check (period_end >= period_start),
    check (
        (value_status = 'OBSERVED' and (numeric_value is not null or text_value is not null))
        or (value_status <> 'OBSERVED')
    ),
    unique (source_run_id, indicator_code, country_iso3, period_granularity, period_start)
);

create index if not exists idx_timeseries_observation_series
    on timeseries.observation (country_iso3, indicator_code, period_granularity, period_start desc);

create index if not exists idx_timeseries_observation_source
    on timeseries.observation (source_code, dataset_code, indicator_code, country_iso3, period_granularity, period_start desc);

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
) ranked
where ranked.rn = 1;
