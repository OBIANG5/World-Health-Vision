alter table catalog.country
    add column if not exists lending_type varchar(64),
    add column if not exists capital_city varchar(128),
    add column if not exists latitude double precision,
    add column if not exists longitude double precision;
