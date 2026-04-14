create schema if not exists catalog;

create table if not exists catalog.region (
    code varchar(32) primary key,
    display_name varchar(128) not null,
    type varchar(32) not null check (type in ('CONTINENT', 'REGION', 'SUBREGION'))
);

create table if not exists catalog.country (
    iso3 char(3) primary key,
    iso2 char(2),
    display_name varchar(128) not null,
    region_code varchar(32) references catalog.region(code),
    subregion_code varchar(32) references catalog.region(code),
    world_bank_income_group varchar(64),
    sovereign_state varchar(128),
    is_aggregate boolean not null default false,
    is_active boolean not null default true,
    data_quality_tier smallint not null default 1,
    created_at timestamptz not null default current_timestamp
);

create table if not exists catalog.source (
    id uuid primary key,
    code varchar(64) not null unique,
    display_name varchar(160) not null,
    type varchar(32) not null check (type in ('OFFICIAL', 'COMMUNITY', 'ADVISORY', 'MARKET', 'DERIVED', 'RESEARCH')),
    organization_name varchar(160) not null,
    homepage_url varchar(300),
    documentation_url varchar(300),
    access_model varchar(32) not null check (access_model in ('OPEN', 'REGISTRATION', 'LIMITED')),
    license_summary text not null,
    geographic_scope varchar(64) not null,
    temporal_granularity varchar(32) not null,
    update_cadence varchar(64),
    bias_notes text,
    quality_notes text,
    is_enabled boolean not null default true,
    created_at timestamptz not null default current_timestamp
);

create table if not exists catalog.source_dataset (
    id uuid primary key,
    source_id uuid not null references catalog.source(id),
    code varchar(64) not null,
    display_name varchar(160) not null,
    description text,
    category varchar(64) not null,
    default_granularity varchar(32) not null,
    default_frequency varchar(32) not null,
    documentation_url varchar(300),
    license_summary text,
    is_enabled boolean not null default true,
    created_at timestamptz not null default current_timestamp,
    unique (source_id, code)
);

create table if not exists catalog.indicator (
    code varchar(64) primary key,
    display_name varchar(160) not null,
    topic varchar(64) not null,
    unit_label varchar(64) not null,
    description text,
    preferred_frequency varchar(32) not null check (preferred_frequency in ('DAILY', 'MONTHLY', 'QUARTERLY', 'ANNUAL', 'AD_HOC')),
    source_dataset_id uuid references catalog.source_dataset(id),
    is_core boolean not null default false,
    methodology_notes text,
    created_at timestamptz not null default current_timestamp
);
