-- WorldHealthVision — Timeseries V2
-- Index supplémentaire mené par indicator_code sur timeseries.observation.
--
-- Contexte (perf) : le calcul des rangs (analytics-service) interroge la vue
-- timeseries.latest_observation en filtrant par `indicator_code` pour TOUS les
-- pays simultanément. Les index existants (idx_timeseries_observation_series,
-- _source) commencent par country_iso3 / source_code : un filtre
-- « indicator_code = X » sans pays précis ne pouvait donc pas être servi
-- efficacement → parcours séquentiel de observation (~2,9 M lignes) puis
-- fenêtrage complet de la vue, soit ~12 s par requête de rang.
--
-- En menant par indicator_code, Postgres peut pousser ce prédicat sous la
-- fonction de fenêtrage (indicator_code fait partie du PARTITION BY de la vue)
-- et faire un parcours d'intervalle ciblé. Mesuré : requête de rang à froid de
-- ~12 s → ~4 s (puis ~55 ms via le cache applicatif de l'analytics-service).
--
-- IF NOT EXISTS : l'index a pu être créé à chaud (CREATE INDEX CONCURRENTLY)
-- sur l'environnement de dev ; cette migration le rend simplement permanent.
create index if not exists idx_timeseries_observation_indicator_country
    on timeseries.observation (indicator_code, country_iso3, period_granularity, period_start desc);