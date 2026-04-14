package com.worldhealthvision.catalog.bootstrap;

/*
==============================================================================
FICHIER : CurrencyRegistryBootstrap.java

A QUOI SERT CE FICHIER ?
------------------------------------------------------------------------------
Enrichir le registre pays du catalog-service avec une devise primaire courante.

POURQUOI CETTE APPROCHE ?
------------------------------------------------------------------------------
Le projet utilise deja un bootstrap Java pour les pays/regions.
On garde donc la meme philosophie ici :
- eviter un gigantesque SQL seed de devises/mappings
- enrichir de maniere idempotente la base reference
- rester maintenable et versionne dans le repo

RESPONSABILITES
------------------------------------------------------------------------------
- lire les pays deja presents dans catalog.country
- resoudre une devise primaire par pays
- alimenter catalog.currency
- alimenter catalog.country_currency

IMPORTANT
------------------------------------------------------------------------------
Ce bootstrap ne calcule pas de taux FX.
Il prepare seulement la reference statique necessaire aux futurs services.
==============================================================================
*/

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.Currency;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.core.annotation.Order;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

@Component
@Order(20)
public class CurrencyRegistryBootstrap implements ApplicationRunner {

    private static final Logger LOGGER = LoggerFactory.getLogger(CurrencyRegistryBootstrap.class);
    private static final LocalDate DEFAULT_VALID_FROM = LocalDate.of(1900, 1, 1);

    /*
    ----------------------------------------------------------------------------
    Quelques cas ont besoin d’un override explicite :
    - Kosovo (XK)
    - Channel Islands (JG dans le snapshot World Bank)
    - quelques territoires ou la resolution JDK peut etre inegale
    ----------------------------------------------------------------------------
    */
    private static final Map<String, ManualCurrencyOverride> ISO2_OVERRIDES = Map.ofEntries(
            Map.entry("XK", new ManualCurrencyOverride("EUR", "Euro", "€", "978", (short) 2)),
            Map.entry("JG", new ManualCurrencyOverride("GBP", "Pound sterling", "£", "826", (short) 2)),
            Map.entry("CW", new ManualCurrencyOverride("ANG", "Netherlands Antillean guilder", "ƒ", "532", (short) 2)),
            Map.entry("SX", new ManualCurrencyOverride("ANG", "Netherlands Antillean guilder", "ƒ", "532", (short) 2)),
            Map.entry("BQ", new ManualCurrencyOverride("USD", "US Dollar", "$", "840", (short) 2)),
            Map.entry("BL", new ManualCurrencyOverride("EUR", "Euro", "€", "978", (short) 2)),
            Map.entry("MF", new ManualCurrencyOverride("EUR", "Euro", "€", "978", (short) 2))
    );

    private final JdbcTemplate jdbcTemplate;

    public CurrencyRegistryBootstrap(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    @Override
    public void run(ApplicationArguments args) {
        Integer currentPrimaryMappings = jdbcTemplate.queryForObject(
                "select count(*) from catalog.country_currency where valid_to is null and is_primary = true",
                Integer.class
        );

        if (currentPrimaryMappings != null && currentPrimaryMappings > 0) {
            return;
        }

        List<CountrySeed> countries = loadCountriesToEnrich();

        LinkedHashMap<String, CurrencySeed> uniqueCurrencies = new LinkedHashMap<>();
        List<CountryCurrencySeed> countryMappings = new ArrayList<>();
        List<String> unresolvedCountries = new ArrayList<>();

        for (CountrySeed country : countries) {
            CurrencySeed resolvedCurrency = resolveCurrency(country);

            if (resolvedCurrency == null) {
                unresolvedCountries.add(country.iso3() + "(" + country.iso2() + ")");
                continue;
            }

            uniqueCurrencies.putIfAbsent(resolvedCurrency.code(), resolvedCurrency);
            countryMappings.add(new CountryCurrencySeed(
                    country.iso3(),
                    resolvedCurrency.code(),
                    DEFAULT_VALID_FROM,
                    null,
                    true
            ));
        }

        upsertCurrencies(uniqueCurrencies.values());
        upsertCountryMappings(countryMappings);

        LOGGER.info(
                "Currency bootstrap completed: {} currencies, {} country mappings.",
                uniqueCurrencies.size(),
                countryMappings.size()
        );

        if (!unresolvedCountries.isEmpty()) {
            LOGGER.warn(
                    "Currency bootstrap skipped {} unresolved countries: {}",
                    unresolvedCountries.size(),
                    unresolvedCountries
            );
        }
    }

    private List<CountrySeed> loadCountriesToEnrich() {
        String sql = """
                select
                    iso3,
                    iso2,
                    display_name
                from catalog.country
                where is_aggregate = false
                  and is_active = true
                  and iso2 is not null
                order by iso3
                """;

        return jdbcTemplate.query(sql, (rs, rowNum) -> new CountrySeed(
                rs.getString("iso3"),
                rs.getString("iso2"),
                rs.getString("display_name")
        ));
    }

    private CurrencySeed resolveCurrency(CountrySeed country) {
        ManualCurrencyOverride manualOverride = ISO2_OVERRIDES.get(country.iso2());
        if (manualOverride != null) {
            return manualOverride.toSeed();
        }

        try {
            Locale locale = new Locale("", country.iso2());
            Currency currency = Currency.getInstance(locale);

            return new CurrencySeed(
                    currency.getCurrencyCode(),
                    currency.getDisplayName(Locale.ENGLISH),
                    normalizeNullable(currency.getSymbol(Locale.ENGLISH)),
                    formatNumericCode(currency.getNumericCode()),
                    (short) currency.getDefaultFractionDigits(),
                    true
            );
        } catch (IllegalArgumentException exception) {
            LOGGER.debug(
                    "Unable to resolve currency automatically for country {} / {} / {}",
                    country.iso3(),
                    country.iso2(),
                    country.displayName()
            );
            return null;
        }
    }

    private void upsertCurrencies(Iterable<CurrencySeed> currencies) {
        String sql = """
                insert into catalog.currency (
                    code,
                    display_name,
                    symbol,
                    numeric_code,
                    minor_unit,
                    is_active
                )
                values (?, ?, ?, ?, ?, ?)
                on conflict (code) do update
                set display_name = excluded.display_name,
                    symbol = excluded.symbol,
                    numeric_code = excluded.numeric_code,
                    minor_unit = excluded.minor_unit,
                    is_active = excluded.is_active
                """;

        List<Object[]> batchArgs = new ArrayList<>();
        for (CurrencySeed currency : currencies) {
            batchArgs.add(new Object[]{
                    currency.code(),
                    currency.displayName(),
                    currency.symbol(),
                    currency.numericCode(),
                    currency.minorUnit(),
                    currency.active()
            });
        }

        if (!batchArgs.isEmpty()) {
            jdbcTemplate.batchUpdate(sql, batchArgs);
        }
    }

    private void upsertCountryMappings(List<CountryCurrencySeed> mappings) {
        String sql = """
                insert into catalog.country_currency (
                    country_iso3,
                    currency_code,
                    valid_from,
                    valid_to,
                    is_primary
                )
                values (?, ?, ?, ?, ?)
                on conflict (country_iso3, currency_code, valid_from) do update
                set valid_to = excluded.valid_to,
                    is_primary = excluded.is_primary
                """;

        List<Object[]> batchArgs = new ArrayList<>();
        for (CountryCurrencySeed mapping : mappings) {
            batchArgs.add(new Object[]{
                    mapping.countryIso3(),
                    mapping.currencyCode(),
                    mapping.validFrom(),
                    mapping.validTo(),
                    mapping.primary()
            });
        }

        if (!batchArgs.isEmpty()) {
            jdbcTemplate.batchUpdate(sql, batchArgs);
        }
    }

    private String formatNumericCode(int numericCode) {
        if (numericCode <= 0) {
            return null;
        }
        return String.format(Locale.ROOT, "%03d", numericCode);
    }

    private String normalizeNullable(String value) {
        if (value == null) {
            return null;
        }
        String trimmed = value.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }

    private record CountrySeed(
            String iso3,
            String iso2,
            String displayName
    ) {
    }

    private record CurrencySeed(
            String code,
            String displayName,
            String symbol,
            String numericCode,
            short minorUnit,
            boolean active
    ) {
    }

    private record CountryCurrencySeed(
            String countryIso3,
            String currencyCode,
            LocalDate validFrom,
            LocalDate validTo,
            boolean primary
    ) {
    }

    private record ManualCurrencyOverride(
            String code,
            String displayName,
            String symbol,
            String numericCode,
            short minorUnit
    ) {
        private CurrencySeed toSeed() {
            return new CurrencySeed(code, displayName, symbol, numericCode, minorUnit, true);
        }
    }
}