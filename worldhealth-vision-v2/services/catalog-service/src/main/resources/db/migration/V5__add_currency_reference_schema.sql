/*
==============================================================================
FICHIER : V5__add_currency_reference_schema.sql

ROLE
------------------------------------------------------------------------------
Ajouter une couche de reference devise dans le catalogue.

POURQUOI CE FICHIER EXISTE ?
------------------------------------------------------------------------------
Le catalog-service connaissait deja :
- pays
- regions
- sources
- datasets
- indicateurs

Mais il manquait une brique essentielle pour la V2 produit :
- la devise de reference d’un pays

Cette information est necessaire pour :
- le convertisseur de monnaie
- le cout relatif
- l'affordability
- les comparaisons pays
- la future fiche pays orientee utilisateur

RESPONSABILITES
------------------------------------------------------------------------------
- creer le master des devises
- creer la table de mapping pays -> devise
- preparer un modele compatible avec l’historique
  (valid_from / valid_to)
- imposer qu’un pays n’ait qu’une devise primaire courante

NON RESPONSABILITES
------------------------------------------------------------------------------
- ce fichier ne remplit pas lui-meme toutes les devises
- ce fichier ne calcule aucun taux FX
- ce fichier ne contient pas la logique de comparaison produit

ORDRE CHRONOLOGIQUE
------------------------------------------------------------------------------
Ce fichier vient apres :
- V1 schema de reference
- V2 seed des sources/indicateurs
- V3 enrichissement des pays
- V4 enrichissement source ONU SDG

Il doit etre applique avant le bootstrap devise Java.
==============================================================================
*/

create table if not exists catalog.currency (
    code char(3) primary key,
    display_name varchar(96) not null,
    symbol varchar(24),
    numeric_code varchar(3),
    minor_unit smallint not null check (minor_unit >= -1 and minor_unit <= 9),
    is_active boolean not null default true,
    created_at timestamptz not null default current_timestamp
);

create table if not exists catalog.country_currency (
    country_iso3 char(3) not null references catalog.country(iso3) on delete cascade,
    currency_code char(3) not null references catalog.currency(code),
    valid_from date not null default date '1900-01-01',
    valid_to date,
    is_primary boolean not null default true,
    created_at timestamptz not null default current_timestamp,
    primary key (country_iso3, currency_code, valid_from),
    check (valid_to is null or valid_to >= valid_from)
);

create index if not exists idx_catalog_country_currency_currency_code
    on catalog.country_currency(currency_code);

create index if not exists idx_catalog_country_currency_country_iso3
    on catalog.country_currency(country_iso3);

create unique index if not exists uq_catalog_country_currency_current_primary
    on catalog.country_currency(country_iso3)
    where is_primary = true and valid_to is null;