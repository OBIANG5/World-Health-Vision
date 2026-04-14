package com.worldhealthvision.catalog.persistence;

/*
==============================================================================
FICHIER : JdbcCatalogRepository.java

A QUOI SERT CE FICHIER ?
------------------------------------------------------------------------------
Implementer les lectures SQL du catalog-service en JDBC explicite.

Pourquoi JDBC explicite ici ?
- le domaine est reference-first
- les requetes sont simples mais doivent rester transparentes
- on veut eviter de masquer les details SQL trop tot

EVOLUTION V5
------------------------------------------------------------------------------
On enrichit maintenant les requetes pays avec la devise courante, et on ajoute
des lectures dediees au catalogue des devises.
==============================================================================
*/

import com.worldhealthvision.catalog.api.dto.CatalogReadinessResponse;
import com.worldhealthvision.catalog.api.dto.CountryDetailResponse;
import com.worldhealthvision.catalog.api.dto.CountrySummaryResponse;
import com.worldhealthvision.catalog.api.dto.CurrencyDetailResponse;
import com.worldhealthvision.catalog.api.dto.CurrencySummaryResponse;
import com.worldhealthvision.catalog.api.dto.IndicatorDetailResponse;
import com.worldhealthvision.catalog.api.dto.IndicatorSummaryResponse;
import com.worldhealthvision.catalog.api.dto.RegionSummaryResponse;
import com.worldhealthvision.catalog.api.dto.SourceDatasetDetailResponse;
import com.worldhealthvision.catalog.api.dto.SourceDatasetSummaryResponse;
import com.worldhealthvision.catalog.api.dto.SourceDetailResponse;
import com.worldhealthvision.catalog.api.dto.SourceSummaryResponse;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.util.List;
import java.util.Optional;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.stereotype.Repository;

@Repository
public class JdbcCatalogRepository implements CatalogRepository {

    private final JdbcClient jdbcClient;

    public JdbcCatalogRepository(JdbcClient jdbcClient) {
        this.jdbcClient = jdbcClient;
    }

    @Override
    public CatalogReadinessResponse getReadiness() {
        String sql = """
                select
                    (select count(*) from catalog.source) as source_count,
                    (select count(*) from catalog.source_dataset) as dataset_count,
                    (select count(*) from catalog.indicator) as indicator_count,
                    (select count(*) from catalog.region) as region_count,
                    (select count(*) from catalog.country) as country_count
                """;

        return jdbcClient.sql(sql)
                .query((rs, rowNum) -> new CatalogReadinessResponse(
                        rs.getInt("source_count"),
                        rs.getInt("dataset_count"),
                        rs.getInt("indicator_count"),
                        rs.getInt("region_count"),
                        rs.getInt("country_count")
                ))
                .single();
    }

    @Override
    public List<RegionSummaryResponse> listRegions() {
        String sql = """
                select
                    r.code,
                    r.display_name,
                    r.type,
                    count(c.iso3) filter (where c.is_aggregate = false) as country_count,
                    count(c.iso3) filter (where c.is_aggregate = true) as aggregate_count
                from catalog.region r
                left join catalog.country c
                    on c.region_code = r.code
                    or c.subregion_code = r.code
                group by r.code, r.display_name, r.type
                order by
                    case r.type
                        when 'CONTINENT' then 1
                        when 'REGION' then 2
                        when 'SUBREGION' then 3
                        else 99
                    end,
                    r.display_name
                """;

        return jdbcClient.sql(sql)
                .query((rs, rowNum) -> new RegionSummaryResponse(
                        rs.getString("code"),
                        rs.getString("display_name"),
                        rs.getString("type"),
                        rs.getInt("country_count"),
                        rs.getInt("aggregate_count")
                ))
                .list();
    }

    @Override
    public Optional<RegionSummaryResponse> findRegionByCode(String code) {
        String sql = """
                with region_match as (
                    select code, display_name, type
                    from catalog.region
                    where code = :code
                )
                select
                    rm.code,
                    rm.display_name,
                    rm.type,
                    count(c.iso3) filter (where c.is_aggregate = false) as country_count,
                    count(c.iso3) filter (where c.is_aggregate = true) as aggregate_count
                from region_match rm
                left join catalog.country c
                    on c.region_code = rm.code
                    or c.subregion_code = rm.code
                group by rm.code, rm.display_name, rm.type
                """;

        return jdbcClient.sql(sql)
                .param("code", code)
                .query((rs, rowNum) -> new RegionSummaryResponse(
                        rs.getString("code"),
                        rs.getString("display_name"),
                        rs.getString("type"),
                        rs.getInt("country_count"),
                        rs.getInt("aggregate_count")
                ))
                .optional();
    }

    @Override
    public List<CountrySummaryResponse> listCountries(
            boolean includeAggregates,
            boolean activeOnly,
            String regionCode,
            String search,
            int limit
    ) {
        String sql = """
                select
                    c.iso3,
                    c.iso2,
                    c.display_name,
                    c.region_code,
                    region.display_name as region_name,
                    c.subregion_code,
                    subregion.display_name as subregion_name,
                    curr.code as currency_code,
                    curr.display_name as currency_name,
                    curr.symbol as currency_symbol,
                    c.is_aggregate,
                    c.is_active
                from catalog.country c
                left join catalog.region region on region.code = c.region_code
                left join catalog.region subregion on subregion.code = c.subregion_code
                left join catalog.country_currency cc
                    on cc.country_iso3 = c.iso3
                   and cc.is_primary = true
                   and cc.valid_to is null
                left join catalog.currency curr on curr.code = cc.currency_code
                where (:includeAggregates = true or c.is_aggregate = false)
                  and (:activeOnly = false or c.is_active = true)
                  and (cast(:regionCode as varchar) is null
                       or c.region_code = cast(:regionCode as varchar)
                       or c.subregion_code = cast(:regionCode as varchar))
                  and (
                        cast(:search as varchar) is null
                        or upper(c.display_name) like cast(:search as varchar)
                        or upper(c.iso3) like cast(:search as varchar)
                        or upper(coalesce(c.iso2, '')) like cast(:search as varchar)
                  )
                order by c.display_name
                limit :limit
                """;

        return jdbcClient.sql(sql)
                .param("includeAggregates", includeAggregates)
                .param("activeOnly", activeOnly)
                .param("regionCode", regionCode)
                .param("search", search)
                .param("limit", limit)
                .query((rs, rowNum) -> new CountrySummaryResponse(
                        rs.getString("iso3"),
                        rs.getString("iso2"),
                        rs.getString("display_name"),
                        rs.getString("region_code"),
                        rs.getString("region_name"),
                        rs.getString("subregion_code"),
                        rs.getString("subregion_name"),
                        rs.getString("currency_code"),
                        rs.getString("currency_name"),
                        rs.getString("currency_symbol"),
                        rs.getBoolean("is_aggregate"),
                        rs.getBoolean("is_active")
                ))
                .list();
    }

    @Override
    public Optional<CountryDetailResponse> findCountryByIso3(String iso3) {
        String sql = """
                select
                    c.iso3,
                    c.iso2,
                    c.display_name,
                    c.region_code,
                    region.display_name as region_name,
                    c.subregion_code,
                    subregion.display_name as subregion_name,
                    c.world_bank_income_group,
                    c.lending_type,
                    c.capital_city,
                    c.latitude,
                    c.longitude,
                    c.sovereign_state,
                    curr.code as currency_code,
                    curr.display_name as currency_name,
                    curr.symbol as currency_symbol,
                    curr.minor_unit as currency_minor_unit,
                    c.is_aggregate,
                    c.is_active,
                    c.data_quality_tier
                from catalog.country c
                left join catalog.region region on region.code = c.region_code
                left join catalog.region subregion on subregion.code = c.subregion_code
                left join catalog.country_currency cc
                    on cc.country_iso3 = c.iso3
                   and cc.is_primary = true
                   and cc.valid_to is null
                left join catalog.currency curr on curr.code = cc.currency_code
                where c.iso3 = :iso3
                """;

        return jdbcClient.sql(sql)
                .param("iso3", iso3)
                .query((rs, rowNum) -> new CountryDetailResponse(
                        rs.getString("iso3"),
                        rs.getString("iso2"),
                        rs.getString("display_name"),
                        rs.getString("region_code"),
                        rs.getString("region_name"),
                        rs.getString("subregion_code"),
                        rs.getString("subregion_name"),
                        rs.getString("world_bank_income_group"),
                        rs.getString("lending_type"),
                        rs.getString("capital_city"),
                        getNullableDouble(rs, "latitude"),
                        getNullableDouble(rs, "longitude"),
                        rs.getString("sovereign_state"),
                        rs.getString("currency_code"),
                        rs.getString("currency_name"),
                        rs.getString("currency_symbol"),
                        getNullableShort(rs, "currency_minor_unit"),
                        rs.getBoolean("is_aggregate"),
                        rs.getBoolean("is_active"),
                        rs.getShort("data_quality_tier")
                ))
                .optional();
    }

    @Override
    public List<CurrencySummaryResponse> listCurrencies(boolean activeOnly, String search, int limit) {
        String sql = """
                select
                    cur.code,
                    cur.display_name,
                    cur.symbol,
                    cur.numeric_code,
                    cur.minor_unit,
                    cur.is_active,
                    count(distinct cc.country_iso3) filter (
                        where cc.valid_to is null and cc.is_primary = true
                    ) as country_count
                from catalog.currency cur
                left join catalog.country_currency cc
                    on cc.currency_code = cur.code
                   and cc.valid_to is null
                   and cc.is_primary = true
                where (:activeOnly = false or cur.is_active = true)
                  and (
                        cast(:search as varchar) is null
                        or upper(cur.code) like cast(:search as varchar)
                        or upper(cur.display_name) like cast(:search as varchar)
                        or upper(coalesce(cur.symbol, '')) like cast(:search as varchar)
                  )
                group by
                    cur.code,
                    cur.display_name,
                    cur.symbol,
                    cur.numeric_code,
                    cur.minor_unit,
                    cur.is_active
                order by cur.display_name
                limit :limit
                """;

        return jdbcClient.sql(sql)
                .param("activeOnly", activeOnly)
                .param("search", search)
                .param("limit", limit)
                .query((rs, rowNum) -> new CurrencySummaryResponse(
                        rs.getString("code"),
                        rs.getString("display_name"),
                        rs.getString("symbol"),
                        rs.getString("numeric_code"),
                        rs.getShort("minor_unit"),
                        rs.getBoolean("is_active"),
                        rs.getInt("country_count")
                ))
                .list();
    }

    @Override
    public Optional<CurrencyDetailResponse> findCurrencyByCode(String code) {
        String sql = """
                select
                    cur.code,
                    cur.display_name,
                    cur.symbol,
                    cur.numeric_code,
                    cur.minor_unit,
                    cur.is_active,
                    count(distinct cc.country_iso3) filter (
                        where cc.valid_to is null and cc.is_primary = true
                    ) as country_count
                from catalog.currency cur
                left join catalog.country_currency cc
                    on cc.currency_code = cur.code
                   and cc.valid_to is null
                   and cc.is_primary = true
                where cur.code = :code
                group by
                    cur.code,
                    cur.display_name,
                    cur.symbol,
                    cur.numeric_code,
                    cur.minor_unit,
                    cur.is_active
                """;

        return jdbcClient.sql(sql)
                .param("code", code)
                .query((rs, rowNum) -> new CurrencyDetailResponse(
                        rs.getString("code"),
                        rs.getString("display_name"),
                        rs.getString("symbol"),
                        rs.getString("numeric_code"),
                        rs.getShort("minor_unit"),
                        rs.getBoolean("is_active"),
                        rs.getInt("country_count")
                ))
                .optional();
    }

    @Override
    public List<IndicatorSummaryResponse> listIndicators(boolean coreOnly) {
        String sql = """
                select code, display_name, topic, unit_label, is_core
                from catalog.indicator
                where (:coreOnly = false or is_core = true)
                order by display_name
                """;

        return jdbcClient.sql(sql)
                .param("coreOnly", coreOnly)
                .query((rs, rowNum) -> new IndicatorSummaryResponse(
                        rs.getString("code"),
                        rs.getString("display_name"),
                        rs.getString("topic"),
                        rs.getString("unit_label"),
                        rs.getBoolean("is_core")
                ))
                .list();
    }

    @Override
    public Optional<IndicatorDetailResponse> findIndicatorByCode(String code) {
        String sql = """
                select
                    i.code,
                    i.display_name,
                    i.topic,
                    i.unit_label,
                    i.description,
                    i.preferred_frequency,
                    sd.code as source_dataset_code,
                    i.is_core,
                    i.methodology_notes
                from catalog.indicator i
                left join catalog.source_dataset sd on sd.id = i.source_dataset_id
                where i.code = :code
                """;

        return jdbcClient.sql(sql)
                .param("code", code)
                .query((rs, rowNum) -> new IndicatorDetailResponse(
                        rs.getString("code"),
                        rs.getString("display_name"),
                        rs.getString("topic"),
                        rs.getString("unit_label"),
                        rs.getString("description"),
                        rs.getString("preferred_frequency"),
                        rs.getString("source_dataset_code"),
                        rs.getBoolean("is_core"),
                        rs.getString("methodology_notes")
                ))
                .optional();
    }

    @Override
    public List<SourceSummaryResponse> listSources(boolean enabledOnly) {
        String sql = """
                select code, display_name, type, organization_name, is_enabled
                from catalog.source
                where (:enabledOnly = false or is_enabled = true)
                order by display_name
                """;

        return jdbcClient.sql(sql)
                .param("enabledOnly", enabledOnly)
                .query((rs, rowNum) -> new SourceSummaryResponse(
                        rs.getString("code"),
                        rs.getString("display_name"),
                        rs.getString("type"),
                        rs.getString("organization_name"),
                        rs.getBoolean("is_enabled")
                ))
                .list();
    }

    @Override
    public Optional<SourceDetailResponse> findSourceByCode(String code) {
        String sql = """
                select
                    code,
                    display_name,
                    type,
                    organization_name,
                    homepage_url,
                    documentation_url,
                    access_model,
                    license_summary,
                    geographic_scope,
                    temporal_granularity,
                    update_cadence,
                    bias_notes,
                    quality_notes,
                    is_enabled
                from catalog.source
                where code = :code
                """;

        return jdbcClient.sql(sql)
                .param("code", code)
                .query((rs, rowNum) -> new SourceDetailResponse(
                        rs.getString("code"),
                        rs.getString("display_name"),
                        rs.getString("type"),
                        rs.getString("organization_name"),
                        rs.getString("homepage_url"),
                        rs.getString("documentation_url"),
                        rs.getString("access_model"),
                        rs.getString("license_summary"),
                        rs.getString("geographic_scope"),
                        rs.getString("temporal_granularity"),
                        rs.getString("update_cadence"),
                        rs.getString("bias_notes"),
                        rs.getString("quality_notes"),
                        rs.getBoolean("is_enabled")
                ))
                .optional();
    }

    @Override
    public List<SourceDatasetSummaryResponse> listSourceDatasets(boolean enabledOnly, String sourceCode) {
        String sql = """
                select
                    s.code as source_code,
                    sd.code,
                    sd.display_name,
                    sd.category,
                    sd.default_granularity,
                    sd.default_frequency,
                    sd.is_enabled
                from catalog.source_dataset sd
                join catalog.source s on s.id = sd.source_id
                where (:enabledOnly = false or sd.is_enabled = true)
                  and (:sourceCode is null or s.code = :sourceCode)
                order by s.display_name, sd.display_name
                """;

        return jdbcClient.sql(sql)
                .param("enabledOnly", enabledOnly)
                .param("sourceCode", sourceCode)
                .query((rs, rowNum) -> new SourceDatasetSummaryResponse(
                        rs.getString("source_code"),
                        rs.getString("code"),
                        rs.getString("display_name"),
                        rs.getString("category"),
                        rs.getString("default_granularity"),
                        rs.getString("default_frequency"),
                        rs.getBoolean("is_enabled")
                ))
                .list();
    }

    @Override
    public Optional<SourceDatasetDetailResponse> findSourceDataset(String sourceCode, String datasetCode) {
        String sql = """
                select
                    s.code as source_code,
                    sd.code,
                    sd.display_name,
                    sd.description,
                    sd.category,
                    sd.default_granularity,
                    sd.default_frequency,
                    sd.documentation_url,
                    sd.license_summary,
                    sd.is_enabled
                from catalog.source_dataset sd
                join catalog.source s on s.id = sd.source_id
                where s.code = :sourceCode
                  and sd.code = :datasetCode
                """;

        return jdbcClient.sql(sql)
                .param("sourceCode", sourceCode)
                .param("datasetCode", datasetCode)
                .query((rs, rowNum) -> new SourceDatasetDetailResponse(
                        rs.getString("source_code"),
                        rs.getString("code"),
                        rs.getString("display_name"),
                        rs.getString("description"),
                        rs.getString("category"),
                        rs.getString("default_granularity"),
                        rs.getString("default_frequency"),
                        rs.getString("documentation_url"),
                        rs.getString("license_summary"),
                        rs.getBoolean("is_enabled")
                ))
                .optional();
    }

    private Double getNullableDouble(ResultSet resultSet, String columnLabel) throws SQLException {
        double value = resultSet.getDouble(columnLabel);
        if (resultSet.wasNull()) {
            return null;
        }
        return value;
    }

    private Short getNullableShort(ResultSet resultSet, String columnLabel) throws SQLException {
        short value = resultSet.getShort(columnLabel);
        if (resultSet.wasNull()) {
            return null;
        }
        return value;
    }
}