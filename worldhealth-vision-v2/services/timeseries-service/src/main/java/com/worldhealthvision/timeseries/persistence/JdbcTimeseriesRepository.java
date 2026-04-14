package com.worldhealthvision.timeseries.persistence;

/*
==============================================================================
FICHIER : JdbcTimeseriesRepository.java

A QUOI SERT CE FICHIER ?
------------------------------------------------------------------------------
Porter les requetes SQL explicites du timeseries-service.

Ici on privilegie du JDBC lisible parce que :
- le domaine temporel a besoin de SQL clair
- les requetes latest/provenance doivent rester maitrisables
- on veut assumer le schema canonique, pas le cacher
==============================================================================
*/

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.worldhealthvision.timeseries.api.dto.CountryLatestComparisonResponse;
import com.worldhealthvision.timeseries.api.dto.LatestSourceObservationResponse;
import com.worldhealthvision.timeseries.api.dto.SeriesAvailabilityResponse;
import com.worldhealthvision.timeseries.api.dto.SourceRunSummaryResponse;
import com.worldhealthvision.timeseries.api.dto.TimeseriesObservationResponse;
import com.worldhealthvision.timeseries.api.dto.TimeseriesReadinessResponse;
import com.worldhealthvision.timeseries.api.internal.dto.IngestionObservationBatchRequest;
import com.worldhealthvision.timeseries.api.internal.dto.IngestionObservationWriteRequest;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Types;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;
import org.springframework.jdbc.core.BatchPreparedStatementSetter;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.stereotype.Repository;

@Repository
public class JdbcTimeseriesRepository implements TimeseriesRepository {

    private final JdbcClient jdbcClient;
    private final JdbcTemplate jdbcTemplate;
    private final ObjectMapper objectMapper;

    public JdbcTimeseriesRepository(
            JdbcClient jdbcClient,
            JdbcTemplate jdbcTemplate,
            ObjectMapper objectMapper
    ) {
        this.jdbcClient = jdbcClient;
        this.jdbcTemplate = jdbcTemplate;
        this.objectMapper = objectMapper;
    }

    @Override
    public TimeseriesReadinessResponse getReadiness() {
        String sql = """
                select
                    (select count(*) from timeseries.source_run) as source_run_count,
                    (select count(*) from timeseries.observation) as observation_count,
                    (select count(*) from timeseries.latest_observation) as latest_observation_count
                """;

        return jdbcClient.sql(sql)
                .query((rs, rowNum) -> new TimeseriesReadinessResponse(
                        rs.getInt("source_run_count"),
                        rs.getInt("observation_count"),
                        rs.getInt("latest_observation_count")
                ))
                .single();
    }

    @Override
    public List<TimeseriesObservationResponse> listSeries(
            String countryIso3,
            String indicatorCode,
            String sourceCode,
            String datasetCode,
            String periodGranularity,
            LocalDate fromPeriodStart,
            LocalDate toPeriodStart,
            boolean includeMissing,
            boolean sortDescending,
            int limit
    ) {
        String sql = """
                select
                    lo.source_code,
                    coalesce(s.display_name, lo.source_code) as source_display_name,
                    lo.dataset_code,
                    coalesce(sd.display_name, lo.dataset_code) as dataset_display_name,
                    lo.run_key,
                    lo.country_iso3,
                    coalesce(c.display_name, lo.country_iso3) as country_display_name,
                    lo.indicator_code,
                    coalesce(i.display_name, lo.indicator_code) as indicator_display_name,
                    lo.period_granularity,
                    lo.period_start,
                    lo.period_end,
                    lo.period_label,
                    lo.numeric_value,
                    lo.text_value,
                    lo.value_status,
                    lo.source_published_at,
                    lo.fetched_at_utc
                from timeseries.latest_observation lo
                left join catalog.source s on s.code = lo.source_code
                left join catalog.source_dataset sd on sd.code = lo.dataset_code and sd.source_id = s.id
                left join catalog.country c on c.iso3 = lo.country_iso3
                left join catalog.indicator i on i.code = lo.indicator_code
                where lo.country_iso3 = :countryIso3
                  and lo.indicator_code = :indicatorCode
                  and (cast(:sourceCode as varchar) is null or lo.source_code = :sourceCode)
                  and (cast(:datasetCode as varchar) is null or lo.dataset_code = :datasetCode)
                  and (cast(:periodGranularity as varchar) is null or lo.period_granularity = :periodGranularity)
                  and (cast(:fromPeriodStart as date) is null or lo.period_start >= :fromPeriodStart)
                  and (cast(:toPeriodStart as date) is null or lo.period_start <= :toPeriodStart)
                  and (cast(:includeMissing as boolean) = true or lo.value_status <> 'MISSING')
                """
                + seriesOrderBy(sortDescending)
                + """
                limit :limit
                """;

        return jdbcClient.sql(sql)
                .param("countryIso3", countryIso3)
                .param("indicatorCode", indicatorCode)
                .param("sourceCode", sourceCode)
                .param("datasetCode", datasetCode)
                .param("periodGranularity", periodGranularity)
                .param("fromPeriodStart", fromPeriodStart)
                .param("toPeriodStart", toPeriodStart)
                .param("includeMissing", includeMissing)
                .param("limit", limit)
                .query((rs, rowNum) -> mapObservation(rs))
                .list();
    }

    @Override
    public List<LatestSourceObservationResponse> listLatestBySource(
            String countryIso3,
            String indicatorCode,
            String sourceCode,
            String datasetCode,
            String periodGranularity,
            boolean includeMissing
    ) {
        String sql = """
                with ranked as (
                    select
                        lo.source_code,
                        lo.dataset_code,
                        lo.run_key,
                        lo.country_iso3,
                        lo.indicator_code,
                        lo.period_granularity,
                        lo.period_start,
                        lo.period_end,
                        lo.period_label,
                        lo.numeric_value,
                        lo.text_value,
                        lo.value_status,
                        lo.source_published_at,
                        lo.fetched_at_utc,
                        row_number() over (
                            partition by lo.source_code, lo.dataset_code, lo.period_granularity
                            order by lo.period_start desc, lo.fetched_at_utc desc
                        ) as rn
                    from timeseries.latest_observation lo
                    where lo.country_iso3 = :countryIso3
                      and lo.indicator_code = :indicatorCode
                      and (cast(:sourceCode as varchar) is null or lo.source_code = :sourceCode)
                      and (cast(:datasetCode as varchar) is null or lo.dataset_code = :datasetCode)
                      and (cast(:periodGranularity as varchar) is null or lo.period_granularity = :periodGranularity)
                      and (cast(:includeMissing as boolean) = true or lo.value_status <> 'MISSING')
                )
                select
                    ranked.source_code,
                    coalesce(s.display_name, ranked.source_code) as source_display_name,
                    ranked.dataset_code,
                    coalesce(sd.display_name, ranked.dataset_code) as dataset_display_name,
                    ranked.run_key,
                    ranked.country_iso3,
                    coalesce(c.display_name, ranked.country_iso3) as country_display_name,
                    ranked.indicator_code,
                    coalesce(i.display_name, ranked.indicator_code) as indicator_display_name,
                    ranked.period_granularity,
                    ranked.period_start,
                    ranked.period_end,
                    ranked.period_label,
                    ranked.numeric_value,
                    ranked.text_value,
                    ranked.value_status,
                    ranked.source_published_at,
                    ranked.fetched_at_utc
                from ranked
                left join catalog.source s on s.code = ranked.source_code
                left join catalog.source_dataset sd on sd.code = ranked.dataset_code and sd.source_id = s.id
                left join catalog.country c on c.iso3 = ranked.country_iso3
                left join catalog.indicator i on i.code = ranked.indicator_code
                where ranked.rn = 1
                order by ranked.source_code, ranked.dataset_code, ranked.period_granularity
                """;

        return jdbcClient.sql(sql)
                .param("countryIso3", countryIso3)
                .param("indicatorCode", indicatorCode)
                .param("sourceCode", sourceCode)
                .param("datasetCode", datasetCode)
                .param("periodGranularity", periodGranularity)
                .param("includeMissing", includeMissing)
                .query((rs, rowNum) -> mapLatestSourceObservation(rs))
                .list();
    }

    @Override
    public List<SeriesAvailabilityResponse> listSeriesAvailability(
            String countryIso3,
            String indicatorCode,
            String sourceCode,
            String datasetCode,
            String periodGranularity,
            int limit
    ) {
        String sql = """
                with filtered as (
                    select
                        lo.source_code,
                        lo.dataset_code,
                        lo.country_iso3,
                        lo.indicator_code,
                        lo.period_granularity,
                        lo.period_start,
                        lo.period_end,
                        lo.period_label,
                        lo.numeric_value,
                        lo.text_value,
                        lo.value_status,
                        lo.fetched_at_utc
                    from timeseries.latest_observation lo
                    where lo.country_iso3 = :countryIso3
                      and lo.indicator_code = :indicatorCode
                      and (cast(:sourceCode as varchar) is null or lo.source_code = :sourceCode)
                      and (cast(:datasetCode as varchar) is null or lo.dataset_code = :datasetCode)
                      and (cast(:periodGranularity as varchar) is null or lo.period_granularity = :periodGranularity)
                ),
                aggregated as (
                    select
                        source_code,
                        dataset_code,
                        country_iso3,
                        indicator_code,
                        period_granularity,
                        count(*) filter (where value_status <> 'MISSING') as available_observation_count,
                        count(*) filter (where value_status = 'OBSERVED') as observed_observation_count,
                        count(*) filter (where value_status = 'ESTIMATED') as estimated_observation_count,
                        count(*) filter (where value_status = 'SUPPRESSED') as suppressed_observation_count,
                        count(*) filter (where value_status = 'MISSING') as missing_observation_count,
                        min(period_start) as first_period_start
                    from filtered
                    group by source_code, dataset_code, country_iso3, indicator_code, period_granularity
                ),
                latest_ranked as (
                    select
                        filtered.*,
                        row_number() over (
                            partition by filtered.source_code, filtered.dataset_code, filtered.country_iso3, filtered.indicator_code, filtered.period_granularity
                            order by filtered.period_start desc, filtered.fetched_at_utc desc
                        ) as rn
                    from filtered
                )
                select
                    aggregated.source_code,
                    coalesce(s.display_name, aggregated.source_code) as source_display_name,
                    aggregated.dataset_code,
                    coalesce(sd.display_name, aggregated.dataset_code) as dataset_display_name,
                    aggregated.country_iso3,
                    coalesce(c.display_name, aggregated.country_iso3) as country_display_name,
                    aggregated.indicator_code,
                    coalesce(i.display_name, aggregated.indicator_code) as indicator_display_name,
                    aggregated.period_granularity,
                    aggregated.available_observation_count,
                    aggregated.observed_observation_count,
                    aggregated.estimated_observation_count,
                    aggregated.suppressed_observation_count,
                    aggregated.missing_observation_count,
                    aggregated.first_period_start,
                    latest_ranked.period_start as latest_period_start,
                    latest_ranked.period_end as latest_period_end,
                    latest_ranked.period_label as latest_period_label,
                    latest_ranked.numeric_value as latest_numeric_value,
                    latest_ranked.text_value as latest_text_value,
                    latest_ranked.value_status as latest_value_status,
                    latest_ranked.fetched_at_utc as latest_fetched_at_utc
                from aggregated
                join latest_ranked on latest_ranked.source_code = aggregated.source_code
                  and latest_ranked.dataset_code = aggregated.dataset_code
                  and latest_ranked.country_iso3 = aggregated.country_iso3
                  and latest_ranked.indicator_code = aggregated.indicator_code
                  and latest_ranked.period_granularity = aggregated.period_granularity
                  and latest_ranked.rn = 1
                left join catalog.source s on s.code = aggregated.source_code
                left join catalog.source_dataset sd on sd.code = aggregated.dataset_code and sd.source_id = s.id
                left join catalog.country c on c.iso3 = aggregated.country_iso3
                left join catalog.indicator i on i.code = aggregated.indicator_code
                order by aggregated.source_code, aggregated.dataset_code, aggregated.period_granularity
                limit :limit
                """;

        return jdbcClient.sql(sql)
                .param("countryIso3", countryIso3)
                .param("indicatorCode", indicatorCode)
                .param("sourceCode", sourceCode)
                .param("datasetCode", datasetCode)
                .param("periodGranularity", periodGranularity)
                .param("limit", limit)
                .query((rs, rowNum) -> mapSeriesAvailability(rs))
                .list();
    }

    @Override
    public List<CountryLatestComparisonResponse> listLatestCountryComparison(
            String countryIso3Csv,
            String indicatorCode,
            String sourceCode,
            String datasetCode,
            String periodGranularity,
            boolean includeMissing
    ) {
        String sql = """
                with requested_country as (
                    select distinct trim(value) as country_iso3
                    from unnest(string_to_array(:countryIso3Csv, ',')) as value
                    where trim(value) <> ''
                ),
                ranked as (
                    select
                        lo.country_iso3,
                        lo.indicator_code,
                        lo.source_code,
                        lo.dataset_code,
                        lo.period_granularity,
                        lo.period_start,
                        lo.period_end,
                        lo.period_label,
                        lo.numeric_value,
                        lo.text_value,
                        lo.value_status,
                        lo.source_published_at,
                        lo.fetched_at_utc,
                        row_number() over (
                            partition by lo.country_iso3, lo.source_code, lo.dataset_code, lo.period_granularity
                            order by lo.period_start desc, lo.fetched_at_utc desc
                        ) as rn
                    from timeseries.latest_observation lo
                    join requested_country rc on rc.country_iso3 = lo.country_iso3
                    where lo.indicator_code = :indicatorCode
                      and (cast(:sourceCode as varchar) is null or lo.source_code = :sourceCode)
                      and (cast(:datasetCode as varchar) is null or lo.dataset_code = :datasetCode)
                      and (cast(:periodGranularity as varchar) is null or lo.period_granularity = :periodGranularity)
                      and (cast(:includeMissing as boolean) = true or lo.value_status <> 'MISSING')
                )
                select
                    ranked.country_iso3,
                    coalesce(c.display_name, ranked.country_iso3) as country_display_name,
                    ranked.indicator_code,
                    coalesce(i.display_name, ranked.indicator_code) as indicator_display_name,
                    ranked.source_code,
                    coalesce(s.display_name, ranked.source_code) as source_display_name,
                    ranked.dataset_code,
                    coalesce(sd.display_name, ranked.dataset_code) as dataset_display_name,
                    ranked.period_granularity,
                    ranked.period_start,
                    ranked.period_end,
                    ranked.period_label,
                    ranked.numeric_value,
                    ranked.text_value,
                    ranked.value_status,
                    ranked.source_published_at,
                    ranked.fetched_at_utc
                from ranked
                left join catalog.source s on s.code = ranked.source_code
                left join catalog.source_dataset sd on sd.code = ranked.dataset_code and sd.source_id = s.id
                left join catalog.country c on c.iso3 = ranked.country_iso3
                left join catalog.indicator i on i.code = ranked.indicator_code
                where ranked.rn = 1
                order by ranked.country_iso3, ranked.source_code, ranked.dataset_code, ranked.period_granularity
                """;

        return jdbcClient.sql(sql)
                .param("countryIso3Csv", countryIso3Csv)
                .param("indicatorCode", indicatorCode)
                .param("sourceCode", sourceCode)
                .param("datasetCode", datasetCode)
                .param("periodGranularity", periodGranularity)
                .param("includeMissing", includeMissing)
                .query((rs, rowNum) -> mapCountryLatestComparison(rs))
                .list();
    }

    @Override
    public List<SourceRunSummaryResponse> listSourceRuns(
            String sourceCode,
            String datasetCode,
            String status,
            int limit
    ) {
        String sql = """
                select
                    sr.id,
                    sr.source_code,
                    coalesce(s.display_name, sr.source_code) as source_display_name,
                    sr.dataset_code,
                    coalesce(sd.display_name, sr.dataset_code) as dataset_display_name,
                    sr.run_key,
                    sr.fetched_at_utc,
                    sr.persisted_at_utc,
                    sr.record_count,
                    sr.status
                from timeseries.source_run sr
                left join catalog.source s on s.code = sr.source_code
                left join catalog.source_dataset sd on sd.code = sr.dataset_code and sd.source_id = s.id
                where (cast(:sourceCode as varchar) is null or sr.source_code = :sourceCode)
                  and (cast(:datasetCode as varchar) is null or sr.dataset_code = :datasetCode)
                  and (cast(:status as varchar) is null or sr.status = :status)
                order by sr.fetched_at_utc desc, sr.persisted_at_utc desc
                limit :limit
                """;

        return jdbcClient.sql(sql)
                .param("sourceCode", sourceCode)
                .param("datasetCode", datasetCode)
                .param("status", status)
                .param("limit", limit)
                .query((rs, rowNum) -> mapSourceRun(rs))
                .list();
    }

    @Override
    public UUID upsertSourceRun(IngestionObservationBatchRequest request) {
        Optional<UUID> existingId = jdbcClient.sql("""
                select id
                from timeseries.source_run
                where source_code = :sourceCode
                  and dataset_code = :datasetCode
                  and run_key = :runKey
                """)
                .param("sourceCode", request.sourceCode())
                .param("datasetCode", request.datasetCode())
                .param("runKey", request.runKey())
                .query(UUID.class)
                .optional();

        String notesJson = toJson(request.notes() == null ? Map.of() : request.notes());

        if (existingId.isPresent()) {
            UUID sourceRunId = existingId.get();
            jdbcClient.sql("""
                    update timeseries.source_run
                    set fetched_at_utc = :fetchedAtUtc,
                        bronze_raw_payload_path = :bronzeRawPayloadPath,
                        bronze_normalized_payload_path = :bronzeNormalizedPayloadPath,
                        record_count = :recordCount,
                        status = 'PERSISTED',
                        notes = cast(:notes as jsonb),
                        persisted_at_utc = current_timestamp
                    where id = :id
                    """)
                    .param("fetchedAtUtc", request.fetchedAtUtc())
                    .param("bronzeRawPayloadPath", request.bronzeRawPayloadPath())
                    .param("bronzeNormalizedPayloadPath", request.bronzeNormalizedPayloadPath())
                    .param("recordCount", request.recordCount())
                    .param("notes", notesJson)
                    .param("id", sourceRunId)
                    .update();
            return sourceRunId;
        }

        UUID sourceRunId = UUID.randomUUID();
        jdbcClient.sql("""
                insert into timeseries.source_run (
                    id,
                    source_code,
                    dataset_code,
                    run_key,
                    fetched_at_utc,
                    bronze_raw_payload_path,
                    bronze_normalized_payload_path,
                    record_count,
                    status,
                    notes
                )
                values (
                    :id,
                    :sourceCode,
                    :datasetCode,
                    :runKey,
                    :fetchedAtUtc,
                    :bronzeRawPayloadPath,
                    :bronzeNormalizedPayloadPath,
                    :recordCount,
                    'PERSISTED',
                    cast(:notes as jsonb)
                )
                """)
                .param("id", sourceRunId)
                .param("sourceCode", request.sourceCode())
                .param("datasetCode", request.datasetCode())
                .param("runKey", request.runKey())
                .param("fetchedAtUtc", request.fetchedAtUtc())
                .param("bronzeRawPayloadPath", request.bronzeRawPayloadPath())
                .param("bronzeNormalizedPayloadPath", request.bronzeNormalizedPayloadPath())
                .param("recordCount", request.recordCount())
                .param("notes", notesJson)
                .update();

        return sourceRunId;
    }

    @Override
    public int upsertObservations(UUID sourceRunId, IngestionObservationBatchRequest request) {
        String sql = """
                insert into timeseries.observation (
                    id,
                    source_run_id,
                    source_code,
                    dataset_code,
                    indicator_code,
                    country_iso3,
                    period_granularity,
                    period_start,
                    period_end,
                    period_label,
                    numeric_value,
                    text_value,
                    value_status,
                    source_published_at,
                    source_metadata,
                    quality_flags
                )
                values (
                    ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, cast(? as jsonb), cast(? as jsonb)
                )
                on conflict (source_run_id, indicator_code, country_iso3, period_granularity, period_start)
                do update set
                    period_end = excluded.period_end,
                    period_label = excluded.period_label,
                    numeric_value = excluded.numeric_value,
                    text_value = excluded.text_value,
                    value_status = excluded.value_status,
                    source_published_at = excluded.source_published_at,
                    source_metadata = excluded.source_metadata,
                    quality_flags = excluded.quality_flags,
                    ingested_at = current_timestamp
                """;

        List<IngestionObservationWriteRequest> items = request.items();

        jdbcTemplate.batchUpdate(sql, new BatchPreparedStatementSetter() {
            @Override
            public void setValues(PreparedStatement ps, int i) throws SQLException {
                IngestionObservationWriteRequest item = items.get(i);

                ps.setObject(1, UUID.randomUUID());
                ps.setObject(2, sourceRunId);
                ps.setString(3, request.sourceCode());
                ps.setString(4, request.datasetCode());
                ps.setString(5, item.indicatorCode());
                ps.setString(6, item.countryIso3());
                ps.setString(7, item.periodGranularity());
                ps.setObject(8, item.periodStart());
                ps.setObject(9, item.periodEnd());
                ps.setString(10, item.periodLabel());

                if (item.numericValue() == null) {
                    ps.setNull(11, Types.DOUBLE);
                } else {
                    ps.setDouble(11, item.numericValue());
                }

                ps.setString(12, item.textValue());
                ps.setString(13, item.valueStatus());
                ps.setObject(14, item.sourcePublishedAt());
                ps.setString(15, toJson(item.sourceMetadata() == null ? Map.of() : item.sourceMetadata()));
                ps.setString(16, toJson(item.qualityFlags() == null ? List.of() : item.qualityFlags()));
            }

            @Override
            public int getBatchSize() {
                return items.size();
            }
        });

        return items.size();
    }

    private TimeseriesObservationResponse mapObservation(ResultSet resultSet) throws SQLException {
        return new TimeseriesObservationResponse(
                resultSet.getString("source_code"),
                resultSet.getString("source_display_name"),
                resultSet.getString("dataset_code"),
                resultSet.getString("dataset_display_name"),
                resultSet.getString("run_key"),
                resultSet.getString("country_iso3"),
                resultSet.getString("country_display_name"),
                resultSet.getString("indicator_code"),
                resultSet.getString("indicator_display_name"),
                resultSet.getString("period_granularity"),
                resultSet.getObject("period_start", LocalDate.class),
                resultSet.getObject("period_end", LocalDate.class),
                resultSet.getString("period_label"),
                getNullableDouble(resultSet, "numeric_value"),
                resultSet.getString("text_value"),
                resultSet.getString("value_status"),
                resultSet.getObject("source_published_at", OffsetDateTime.class),
                resultSet.getObject("fetched_at_utc", OffsetDateTime.class)
        );
    }

    private LatestSourceObservationResponse mapLatestSourceObservation(ResultSet resultSet) throws SQLException {
        return new LatestSourceObservationResponse(
                resultSet.getString("source_code"),
                resultSet.getString("source_display_name"),
                resultSet.getString("dataset_code"),
                resultSet.getString("dataset_display_name"),
                resultSet.getString("run_key"),
                resultSet.getString("country_iso3"),
                resultSet.getString("country_display_name"),
                resultSet.getString("indicator_code"),
                resultSet.getString("indicator_display_name"),
                resultSet.getString("period_granularity"),
                resultSet.getObject("period_start", LocalDate.class),
                resultSet.getObject("period_end", LocalDate.class),
                resultSet.getString("period_label"),
                getNullableDouble(resultSet, "numeric_value"),
                resultSet.getString("text_value"),
                resultSet.getString("value_status"),
                resultSet.getObject("source_published_at", OffsetDateTime.class),
                resultSet.getObject("fetched_at_utc", OffsetDateTime.class)
        );
    }

    private SeriesAvailabilityResponse mapSeriesAvailability(ResultSet resultSet) throws SQLException {
        return new SeriesAvailabilityResponse(
                resultSet.getString("source_code"),
                resultSet.getString("source_display_name"),
                resultSet.getString("dataset_code"),
                resultSet.getString("dataset_display_name"),
                resultSet.getString("country_iso3"),
                resultSet.getString("country_display_name"),
                resultSet.getString("indicator_code"),
                resultSet.getString("indicator_display_name"),
                resultSet.getString("period_granularity"),
                resultSet.getInt("available_observation_count"),
                resultSet.getInt("observed_observation_count"),
                resultSet.getInt("estimated_observation_count"),
                resultSet.getInt("suppressed_observation_count"),
                resultSet.getInt("missing_observation_count"),
                resultSet.getObject("first_period_start", LocalDate.class),
                resultSet.getObject("latest_period_start", LocalDate.class),
                resultSet.getObject("latest_period_end", LocalDate.class),
                resultSet.getString("latest_period_label"),
                getNullableDouble(resultSet, "latest_numeric_value"),
                resultSet.getString("latest_text_value"),
                resultSet.getString("latest_value_status"),
                resultSet.getObject("latest_fetched_at_utc", OffsetDateTime.class)
        );
    }

    private CountryLatestComparisonResponse mapCountryLatestComparison(ResultSet resultSet) throws SQLException {
        return new CountryLatestComparisonResponse(
                resultSet.getString("country_iso3"),
                resultSet.getString("country_display_name"),
                resultSet.getString("indicator_code"),
                resultSet.getString("indicator_display_name"),
                resultSet.getString("source_code"),
                resultSet.getString("source_display_name"),
                resultSet.getString("dataset_code"),
                resultSet.getString("dataset_display_name"),
                resultSet.getString("period_granularity"),
                resultSet.getObject("period_start", LocalDate.class),
                resultSet.getObject("period_end", LocalDate.class),
                resultSet.getString("period_label"),
                getNullableDouble(resultSet, "numeric_value"),
                resultSet.getString("text_value"),
                resultSet.getString("value_status"),
                resultSet.getObject("source_published_at", OffsetDateTime.class),
                resultSet.getObject("fetched_at_utc", OffsetDateTime.class)
        );
    }

    private SourceRunSummaryResponse mapSourceRun(ResultSet resultSet) throws SQLException {
        return new SourceRunSummaryResponse(
                resultSet.getObject("id", UUID.class),
                resultSet.getString("source_code"),
                resultSet.getString("source_display_name"),
                resultSet.getString("dataset_code"),
                resultSet.getString("dataset_display_name"),
                resultSet.getString("run_key"),
                resultSet.getObject("fetched_at_utc", OffsetDateTime.class),
                resultSet.getObject("persisted_at_utc", OffsetDateTime.class),
                resultSet.getInt("record_count"),
                resultSet.getString("status")
        );
    }

    private String seriesOrderBy(boolean sortDescending) {
        if (sortDescending) {
            return """
                    order by lo.period_start desc, lo.source_code asc, lo.dataset_code asc
                    """;
        }
        return """
                order by lo.period_start asc, lo.source_code asc, lo.dataset_code asc
                """;
    }

    private Double getNullableDouble(ResultSet resultSet, String columnLabel) throws SQLException {
        double value = resultSet.getDouble(columnLabel);
        if (resultSet.wasNull()) {
            return null;
        }
        return value;
    }

    private String toJson(Object value) {
        try {
            return objectMapper.writeValueAsString(value);
        } catch (JsonProcessingException exception) {
            throw new IllegalArgumentException("Unable to serialize JSON payload for timeseries persistence.", exception);
        }
    }
}
