package com.worldhealthvision.catalog.bootstrap;

/*
==============================================================================
FICHIER : CatalogCountryRegistryBootstrap.java

A QUOI SERT CE FICHIER ?
------------------------------------------------------------------------------
Charger le registre pays/regions dans la base du catalog-service si celui-ci
est encore vide.

Pourquoi cette approche ?
- eviter un gigantesque SQL seed difficile a maintenir
- versionner un snapshot officiel World Bank dans le repo
- garder un bootstrap idempotent pour les environnements locaux

EVOLUTION
------------------------------------------------------------------------------
On lui donne maintenant un ordre explicite pour que le bootstrap devise
passe APRES le bootstrap pays.
==============================================================================
*/

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.io.IOException;
import java.io.InputStream;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.core.annotation.Order;
import org.springframework.core.io.ClassPathResource;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

@Component
@Order(10)
public class CatalogCountryRegistryBootstrap implements ApplicationRunner {

    private static final String COUNTRY_SEED_RESOURCE = "seed/worldbank-countries.json";

    private final JdbcTemplate jdbcTemplate;
    private final ObjectMapper objectMapper;

    public CatalogCountryRegistryBootstrap(JdbcTemplate jdbcTemplate, ObjectMapper objectMapper) {
        this.jdbcTemplate = jdbcTemplate;
        this.objectMapper = objectMapper;
    }

    @Override
    public void run(ApplicationArguments args) throws Exception {
        Integer countryCount = jdbcTemplate.queryForObject("select count(*) from catalog.country", Integer.class);
        if (countryCount != null && countryCount > 0) {
            return;
        }

        List<WorldBankCountrySeedRecord> countries = loadSeedRecords();
        Map<String, RegionSeed> regions = collectRegions(countries);

        upsertRegions(regions.values());
        upsertCountries(countries);
    }

    private List<WorldBankCountrySeedRecord> loadSeedRecords() throws IOException {
        ClassPathResource resource = new ClassPathResource(COUNTRY_SEED_RESOURCE);
        try (InputStream inputStream = resource.getInputStream()) {
            return objectMapper.readValue(inputStream, new TypeReference<>() {
            });
        }
    }

    private Map<String, RegionSeed> collectRegions(List<WorldBankCountrySeedRecord> countries) {
        Map<String, RegionSeed> regionSeeds = new LinkedHashMap<>();

        for (WorldBankCountrySeedRecord country : countries) {
            if (country.region() != null
                    && hasText(country.region().id())
                    && !"NA".equalsIgnoreCase(country.region().id())) {
                regionSeeds.putIfAbsent(
                        country.region().id(),
                        new RegionSeed(country.region().id(), normalize(country.region().value()), "REGION")
                );
            }

            if (country.adminregion() != null
                    && hasText(country.adminregion().id())
                    && hasText(country.adminregion().value())) {
                regionSeeds.putIfAbsent(
                        country.adminregion().id(),
                        new RegionSeed(country.adminregion().id(), normalize(country.adminregion().value()), "SUBREGION")
                );
            }
        }

        return regionSeeds;
    }

    private void upsertRegions(Iterable<RegionSeed> regions) {
        String sql = """
                insert into catalog.region (code, display_name, type)
                values (?, ?, ?)
                on conflict (code) do update
                set display_name = excluded.display_name,
                    type = excluded.type
                """;

        List<Object[]> batchArgs = new ArrayList<>();
        for (RegionSeed region : regions) {
            batchArgs.add(new Object[]{region.code(), region.displayName(), region.type()});
        }

        if (!batchArgs.isEmpty()) {
            jdbcTemplate.batchUpdate(sql, batchArgs);
        }
    }

    private void upsertCountries(List<WorldBankCountrySeedRecord> countries) {
        String sql = """
                insert into catalog.country (
                    iso3,
                    iso2,
                    display_name,
                    region_code,
                    subregion_code,
                    world_bank_income_group,
                    lending_type,
                    capital_city,
                    latitude,
                    longitude,
                    sovereign_state,
                    is_aggregate,
                    is_active,
                    data_quality_tier
                )
                values (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                on conflict (iso3) do update
                set iso2 = excluded.iso2,
                    display_name = excluded.display_name,
                    region_code = excluded.region_code,
                    subregion_code = excluded.subregion_code,
                    world_bank_income_group = excluded.world_bank_income_group,
                    lending_type = excluded.lending_type,
                    capital_city = excluded.capital_city,
                    latitude = excluded.latitude,
                    longitude = excluded.longitude,
                    sovereign_state = excluded.sovereign_state,
                    is_aggregate = excluded.is_aggregate,
                    is_active = excluded.is_active,
                    data_quality_tier = excluded.data_quality_tier
                """;

        List<Object[]> batchArgs = new ArrayList<>();
        for (WorldBankCountrySeedRecord country : countries) {
            boolean aggregate = country.region() != null && "NA".equalsIgnoreCase(country.region().id());
            short dataQualityTier = (short) (aggregate ? 2 : 1);

            batchArgs.add(new Object[]{
                    normalize(country.id()),
                    normalize(country.iso2Code()),
                    normalize(country.name()),
                    regionCode(country),
                    subregionCode(country),
                    labeledValue(country.incomeLevel()),
                    labeledValue(country.lendingType()),
                    nullable(country.capitalCity()),
                    parseNullableDouble(country.latitude()),
                    parseNullableDouble(country.longitude()),
                    aggregate ? null : normalize(country.name()),
                    aggregate,
                    true,
                    dataQualityTier
            });
        }

        jdbcTemplate.batchUpdate(sql, batchArgs);
    }

    private String regionCode(WorldBankCountrySeedRecord country) {
        if (country.region() == null || !hasText(country.region().id()) || "NA".equalsIgnoreCase(country.region().id())) {
            return null;
        }
        return normalize(country.region().id());
    }

    private String subregionCode(WorldBankCountrySeedRecord country) {
        if (country.adminregion() == null || !hasText(country.adminregion().id())) {
            return null;
        }
        return normalize(country.adminregion().id());
    }

    private String labeledValue(WorldBankCountrySeedRecord.WorldBankLabeledValue value) {
        if (value == null) {
            return null;
        }
        return nullable(value.value());
    }

    private Double parseNullableDouble(String value) {
        if (!hasText(value)) {
            return null;
        }
        return Double.parseDouble(value);
    }

    private String normalize(String value) {
        return value == null ? null : value.trim();
    }

    private String nullable(String value) {
        String normalized = normalize(value);
        return hasText(normalized) ? normalized : null;
    }

    private boolean hasText(String value) {
        return value != null && !value.trim().isEmpty();
    }

    private record RegionSeed(String code, String displayName, String type) {
    }
}