create schema if not exists catalog;

create table if not exists catalog.source (
    id uuid primary key,
    code varchar(64) not null unique,
    display_name varchar(160) not null
);

create table if not exists catalog.source_dataset (
    id uuid primary key,
    source_id uuid not null references catalog.source(id),
    code varchar(64) not null,
    display_name varchar(160) not null,
    unique (source_id, code)
);

create table if not exists catalog.country (
    iso3 char(3) primary key,
    display_name varchar(128) not null
);

create table if not exists catalog.indicator (
    code varchar(64) primary key,
    display_name varchar(160) not null
);

insert into catalog.source (id, code, display_name) values
    ('00000000-0000-0000-0000-000000000001', 'WORLD_BANK', 'World Bank'),
    ('00000000-0000-0000-0000-000000000002', 'IMF', 'International Monetary Fund')
on conflict (code) do nothing;

insert into catalog.source_dataset (id, source_id, code, display_name) values
    ('10000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', 'WDI', 'World Development Indicators'),
    ('10000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000002', 'IMF_PUBLIC_DATA', 'IMF Public Data')
on conflict (source_id, code) do nothing;

insert into catalog.country (iso3, display_name) values
    ('FRA', 'France'),
    ('DEU', 'Germany')
on conflict (iso3) do nothing;

insert into catalog.indicator (code, display_name) values
    ('NY.GDP.MKTP.CD', 'GDP (current US$)')
on conflict (code) do nothing;
