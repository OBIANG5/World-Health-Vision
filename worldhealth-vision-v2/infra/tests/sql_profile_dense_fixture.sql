-- World-Vision V2 F1.2b.2c-2B
-- SYNTHETIC PERFORMANCE FIXTURE ONLY. NEVER APPLY TO A REAL DATASET.
-- CI uses disposable TimescaleDB with no host DB port. All observations below
-- contain an explicit synthetic marker; none are real country statistics.
-- This template must be rendered by sql_profile_build_fixture.py before psql.
-- Deterministic size: 12 countries x 54 indicators x 4 sources x 24 years
-- x 2 source-run revisions = 124,416 raw observations, 62,208 latest views.
\set ON_ERROR_STOP on
BEGIN;

DO $guard$
BEGIN
  IF current_database() <> 'whv' OR current_user <> 'whv_user' THEN
    RAISE EXCEPTION 'Synthetic fixture requires isolated whv DB as whv_user';
  END IF;
  IF (SELECT count(*) FROM timeseries.observation) <> 0
     OR (SELECT count(*) FROM timeseries.source_run) <> 0 THEN
    RAISE EXCEPTION 'Refuse to seed nonempty timeseries tables';
  END IF;
  IF (SELECT count(*) FROM catalog.indicator
      WHERE code IN (__WHV_ECONOMIC_INDICATOR_CODES__)) <> 54 THEN
    RAISE EXCEPTION 'One or more of the canonical economic profiles is missing from Catalog';
  END IF;
  IF (SELECT count(*) FROM catalog.source_dataset sd
       JOIN catalog.source s ON s.id=sd.source_id
       WHERE (s.code,sd.code) IN (
           ('WORLD_BANK','WDI'),
           ('IMF','IMF_PUBLIC_DATA'),
           ('OECD','OECD_PUBLIC_DATA'),
           ('EUROSTAT','EUROSTAT_PUBLIC_DATA'))) <> 4 THEN
    RAISE EXCEPTION 'Canonical source/dataset registry lacks fixture pairs';
  END IF;
END
$guard$;

INSERT INTO catalog.country (iso3, iso2, display_name)
VALUES
 ('FRA','FR','France'), ('GAB','GA','Gabon'), ('CIV','CI','Côte d’Ivoire'),
 ('DEU','DE','Germany'), ('USA','US','United States'), ('BRA','BR','Brazil'),
 ('IND','IN','India'), ('CHN','CN','China'), ('JPN','JP','Japan'),
 ('ZAF','ZA','South Africa'), ('AUS','AU','Australia'), ('CAN','CA','Canada')
ON CONFLICT (iso3) DO NOTHING;

WITH source_pairs (source_code, dataset_code, ordinal) AS (
    VALUES
      ('WORLD_BANK','WDI',1),
      ('IMF','IMF_PUBLIC_DATA',2),
      ('OECD','OECD_PUBLIC_DATA',3),
      ('EUROSTAT','EUROSTAT_PUBLIC_DATA',4)
)
INSERT INTO timeseries.source_run (
    id, source_code, dataset_code, run_key, fetched_at_utc,
    persisted_at_utc, record_count, status, notes
)
SELECT md5('whv-sql-fixture-run|'||sp.source_code||'|'||rev.rev)::uuid,
       sp.source_code, sp.dataset_code,
       'WHV_SYNTHETIC_SQL_PROFILE_R'||rev.rev,
       make_timestamptz(2026, 1 + rev.rev, 1, 0, 0, 0, 'UTC'),
       make_timestamptz(2026, 1 + rev.rev, 2, 0, 0, 0, 'UTC'),
       12 * 54 * 24, 'PERSISTED',
       jsonb_build_object('fixture','WHV_SQL_PROFILE_SYNTHETIC','revision',rev.rev)
FROM source_pairs sp CROSS JOIN (VALUES (1),(2)) rev(rev);

WITH
 source_pairs (source_code, dataset_code, ordinal) AS (
    VALUES
      ('WORLD_BANK','WDI',1),
      ('IMF','IMF_PUBLIC_DATA',2),
      ('OECD','OECD_PUBLIC_DATA',3),
      ('EUROSTAT','EUROSTAT_PUBLIC_DATA',4)
 ),
 countries (iso3, ordinal) AS (
    VALUES
      ('FRA',1),('GAB',2),('CIV',3),('DEU',4),
      ('USA',5),('BRA',6),('IND',7),('CHN',8),
      ('JPN',9),('ZAF',10),('AUS',11),('CAN',12)
 ),
 indicators AS (
    SELECT code, row_number() OVER (ORDER BY code)::integer AS ordinal
    FROM (SELECT code FROM catalog.indicator
          WHERE code IN (__WHV_ECONOMIC_INDICATOR_CODES__)) t
 ),
 years AS (SELECT generate_series(2000,2023)::integer AS yr),
 revisions AS (SELECT generate_series(1,2)::integer AS rev),
 fixture AS (
    SELECT
        sp.source_code,sp.dataset_code,sp.ordinal AS source_ord,
        c.iso3,c.ordinal AS country_ord,
        i.code AS indicator_code,i.ordinal AS indicator_ord,
        y.yr,r.rev,
        sr.id AS run_id,
        sr.fetched_at_utc,
        CASE
          WHEN (y.yr + i.ordinal + sp.ordinal) % 29 = 0 THEN 'MISSING'
          WHEN (y.yr + i.ordinal + sp.ordinal) % 31 = 0 THEN 'SUPPRESSED'
          WHEN (y.yr + i.ordinal + sp.ordinal) % 7 = 0 THEN 'ESTIMATED'
          ELSE 'OBSERVED'
        END AS value_status
    FROM source_pairs sp
    JOIN timeseries.source_run sr
      ON sr.source_code=sp.source_code AND sr.dataset_code=sp.dataset_code
     AND sr.run_key LIKE 'WHV_SYNTHETIC_SQL_PROFILE_R%'
    JOIN revisions r ON sr.run_key = 'WHV_SYNTHETIC_SQL_PROFILE_R'||r.rev
    CROSS JOIN countries c
    CROSS JOIN indicators i
    CROSS JOIN years y
 )
INSERT INTO timeseries.observation (
   id, source_run_id, source_code, dataset_code,
   indicator_code,country_iso3,period_granularity,period_start,period_end,
   period_label,numeric_value,text_value,value_status,source_published_at,
   source_metadata,quality_flags,ingested_at
)
SELECT
   md5('whv-sql-fixture-observation|'||source_code||'|'||iso3||'|'||
       indicator_code||'|'||yr||'|'||rev)::uuid,
   run_id,source_code,dataset_code,indicator_code,iso3,
   'ANNUAL',make_date(yr,1,1),make_date(yr,12,31),yr::varchar,
   CASE WHEN value_status IN ('MISSING','SUPPRESSED') THEN NULL
        ELSE (country_ord * 1000 + indicator_ord * 10 + source_ord +
              (yr - 1999) * 0.25 + rev * 0.01)::double precision END,
   NULL,value_status,fetched_at_utc,
   jsonb_build_object('synthetic_fixture','WHV_SQL_PROFILE_SYNTHETIC','revision',rev),
   '["SYNTHETIC_TEST_ONLY"]'::jsonb,
   fetched_at_utc
FROM fixture;

DO $assert$
DECLARE
 n_observations bigint;
 n_latest bigint;
 n_sources bigint;
 n_edited bigint;
BEGIN
 SELECT count(*) INTO n_observations FROM timeseries.observation
   WHERE source_metadata->>'synthetic_fixture'='WHV_SQL_PROFILE_SYNTHETIC';
 IF n_observations <> 124416 THEN
   RAISE EXCEPTION 'Wrong synthetic observation count %; expected 124416',n_observations;
 END IF;
 SELECT count(*) INTO n_latest FROM timeseries.latest_observation;
 IF n_latest <> 62208 THEN
   RAISE EXCEPTION 'Latest-revision view count %; expected 62208',n_latest;
 END IF;
 SELECT count(*) INTO n_sources FROM timeseries.source_run
   WHERE run_key LIKE 'WHV_SYNTHETIC_SQL_PROFILE_R%';
 IF n_sources <> 8 THEN
   RAISE EXCEPTION 'Expected 8 synthetic source runs, got %',n_sources;
 END IF;
 SELECT count(*) INTO n_edited FROM timeseries.latest_observation
   WHERE run_key = 'WHV_SYNTHETIC_SQL_PROFILE_R2';
 IF n_edited <> n_latest THEN
   RAISE EXCEPTION 'Latest-revision selection failed: % / %',n_edited,n_latest;
 END IF;
 IF NOT EXISTS (SELECT 1 FROM timeseries.latest_observation
   WHERE country_iso3='FRA' AND value_status='ESTIMATED') THEN
   RAISE EXCEPTION 'Synthetic estimated values absent';
 END IF;
 IF NOT EXISTS (SELECT 1 FROM timeseries.latest_observation
   WHERE country_iso3='FRA' AND value_status='MISSING') THEN
   RAISE EXCEPTION 'Synthetic missing values absent';
 END IF;
 RAISE NOTICE 'SYNTHETIC_ONLY: raw=%, latest=%, source_runs=%, all_latest_run_R2=%',
   n_observations,n_latest,n_sources,n_edited;
END
$assert$;
COMMIT;
ANALYZE timeseries.observation;
ANALYZE timeseries.source_run;
-- Application-level values are never exported or interpreted as official data.
