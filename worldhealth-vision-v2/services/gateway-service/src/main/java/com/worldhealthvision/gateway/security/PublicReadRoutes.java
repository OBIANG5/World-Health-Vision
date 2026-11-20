package com.worldhealthvision.gateway.security;

/**
 * Public, anonymous, GET-only V2 data APIs.
 *
 * <p>Every path in this allow-list corresponds to a CURRENT documented V2 read endpoint.
 * Do not replace these with /api/** wildcards: future personal data, ingestion-run
 * metadata or operator endpoints must not accidentally become public.
 *
 * <p>The upstream Gateway route predicates enforce GET and these patterns define
 * the authentication boundary. A new international data product requires explicit
 * review and tests before entering this list.
 */
final class PublicReadRoutes {

    private PublicReadRoutes() {
    }

    static final String[] PATHS = {
            // Geographic reference data, provenance and official institution catalogue
            "/api/catalog/regions",
            "/api/catalog/regions/*",
            "/api/catalog/countries",
            "/api/catalog/countries/*",
            "/api/catalog/countries/*/local-context",
            "/api/catalog/local-sources/coverage",
            "/api/catalog/currencies",
            "/api/catalog/currencies/*",
            "/api/catalog/indicators",
            "/api/catalog/indicators/*",
            "/api/catalog/sources",
            "/api/catalog/sources/*",
            "/api/catalog/datasets",
            "/api/catalog/sources/*/datasets",
            "/api/catalog/sources/*/datasets/*",

            // Only published, source-stamped observations, availability and comparisons.
            // Exclude /api/timeseries/source-runs (operator information) and /readiness.
            "/api/timeseries/sources/coverage",
            // Public counts only; the underlying SQL view already filters
            // unlicensed, revoked and not-attested series.
            "/api/timeseries/countries/*/published-coverage",
            "/api/timeseries/countries/*/published-indicators",
            "/api/timeseries/series",
            "/api/timeseries/series/latest",
            "/api/timeseries/series/availability",
            "/api/timeseries/compare/countries/latest",

            // Existing read-only, data-grounded analytics. No future wildcard routes.
            "/api/analytics/countries/*/overview",
            "/api/analytics/countries/*/economic-snapshot",
            "/api/analytics/countries/*/relative-cost-snapshot",
            "/api/analytics/countries/*/national-comparisons",
            "/api/analytics/countries/*/indicators/*/overview",
            "/api/analytics/countries/*/indicators/*/source-audit",
            "/api/analytics/countries/*/indicators/*/rank",
            "/api/analytics/countries/*/indicators/*/forecast",
            "/api/analytics/regions/*/overview",
            "/api/analytics/regions/*/economic-snapshot",
            "/api/analytics/regions/*/relative-cost-snapshot",
            "/api/analytics/regions/*/indicators/*/overview",
            "/api/analytics/regions/*/indicators/*/source-audit",
            "/api/analytics/continents/*/overview",
            "/api/analytics/continents/*/economic-snapshot",
            "/api/analytics/continents/*/relative-cost-snapshot",
            "/api/analytics/continents/*/indicators/*/overview",
            "/api/analytics/continents/*/indicators/*/source-audit",
            "/api/analytics/compare/countries/latest",

            // Product-facing facade used by the international public site.
            "/api/product/countries/*/overview",
            "/api/product/countries/*/economic-snapshot",
            "/api/product/countries/*/relative-cost-snapshot",
            "/api/product/countries/*/national-comparisons",
            "/api/product/countries/*/indicators/*/overview",
            "/api/product/countries/*/indicators/*/source-audit",
            "/api/product/countries/*/indicators/*/rank",
            "/api/product/compare/countries/latest",
            "/api/product/regions/*/overview",
            "/api/product/regions/*/economic-snapshot",
            "/api/product/regions/*/relative-cost-snapshot",
            "/api/product/regions/*/indicators/*/overview",
            "/api/product/regions/*/indicators/*/source-audit",
            "/api/product/continents/*/overview",
            "/api/product/continents/*/economic-snapshot",
            "/api/product/continents/*/relative-cost-snapshot",
            "/api/product/continents/*/indicators/*/overview",
            "/api/product/continents/*/indicators/*/source-audit"
    };
}
