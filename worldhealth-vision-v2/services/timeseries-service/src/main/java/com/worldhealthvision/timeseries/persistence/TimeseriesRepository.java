package com.worldhealthvision.timeseries.persistence;

import com.worldhealthvision.timeseries.api.dto.LatestSourceObservationResponse;
import com.worldhealthvision.timeseries.api.dto.CountryLatestComparisonResponse;
import com.worldhealthvision.timeseries.api.dto.SeriesAvailabilityResponse;
import com.worldhealthvision.timeseries.api.dto.SourceRunSummaryResponse;
import com.worldhealthvision.timeseries.api.dto.TimeseriesObservationResponse;
import com.worldhealthvision.timeseries.api.dto.TimeseriesReadinessResponse;
import com.worldhealthvision.timeseries.api.internal.dto.IngestionObservationBatchRequest;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

public interface TimeseriesRepository {

    TimeseriesReadinessResponse getReadiness();

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

    List<LatestSourceObservationResponse> listLatestBySource(
            String countryIso3,
            String indicatorCode,
            String sourceCode,
            String datasetCode,
            String periodGranularity,
            boolean includeMissing
    );

    List<SeriesAvailabilityResponse> listSeriesAvailability(
            String countryIso3,
            String indicatorCode,
            String sourceCode,
            String datasetCode,
            String periodGranularity,
            int limit
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
