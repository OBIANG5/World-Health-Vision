package com.worldhealthvision.timeseries.persistence;

import com.worldhealthvision.timeseries.api.dto.LatestSourceObservationResponse;
import com.worldhealthvision.timeseries.api.dto.CountryLatestComparisonResponse;
import com.worldhealthvision.timeseries.api.dto.SeriesAvailabilityResponse;
import com.worldhealthvision.timeseries.api.dto.SourceRunSummaryResponse;
import com.worldhealthvision.timeseries.api.dto.SourceDataCoverageResponse;
import com.worldhealthvision.timeseries.api.dto.TimeseriesObservationResponse;
import com.worldhealthvision.timeseries.api.dto.TimeseriesReadinessResponse;
import com.worldhealthvision.timeseries.api.internal.dto.IngestionObservationBatchRequest;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

public interface TimeseriesRepository {

    TimeseriesReadinessResponse getReadiness();

    /** V2 catalog registry + actual available values, one row per registered source. */
    List<SourceDataCoverageResponse> listSourceDataCoverage();

    List<TimeseriesObservationResponse> listSeries(
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
    );

    /** Read historical preview, with ranked LIMIT independently for each code. */
    List<TimeseriesObservationResponse> listSeriesBatch(
            String countryIso3, List<String> indicatorCodes, String sourceCode,
            String datasetCode, String periodGranularity,
            LocalDate fromPeriodStart, LocalDate toPeriodStart,
            boolean includeMissing, boolean sortDescending, int limitPerIndicator
    );

    List<LatestSourceObservationResponse> listLatestBySource(
            String countryIso3,
            String indicatorCode,
            String sourceCode,
            String datasetCode,
            String periodGranularity,
            boolean includeMissing
    );

    /** One SQL window, with independent rank partitions for each indicator. */
    List<LatestSourceObservationResponse> listLatestBySourceBatch(
            String countryIso3, List<String> indicatorCodes, String sourceCode,
            String datasetCode, String periodGranularity, boolean includeMissing
    );

    List<SeriesAvailabilityResponse> listSeriesAvailability(
            String countryIso3,
            String indicatorCode,
            String sourceCode,
            String datasetCode,
            String periodGranularity,
            int limit
    );

    /** Aggregates and orders availability independently for each indicator. */
    List<SeriesAvailabilityResponse> listSeriesAvailabilityBatch(
            String countryIso3, List<String> indicatorCodes, String sourceCode,
            String datasetCode, String periodGranularity, int limitPerIndicator
    );

    List<CountryLatestComparisonResponse> listLatestCountryComparison(
            String countryIso3Csv,
            String indicatorCode,
            String sourceCode,
            String datasetCode,
            String periodGranularity,
            boolean includeMissing
    );

    List<SourceRunSummaryResponse> listSourceRuns(
            String sourceCode,
            String datasetCode,
            String status,
            int limit
    );

    UUID upsertSourceRun(IngestionObservationBatchRequest request);

    int upsertObservations(UUID sourceRunId, IngestionObservationBatchRequest request);
}