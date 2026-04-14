package com.worldhealthvision.timeseries.service;

import com.worldhealthvision.timeseries.api.dto.LatestSourceObservationResponse;
import com.worldhealthvision.timeseries.api.dto.CountryLatestComparisonResponse;
import com.worldhealthvision.timeseries.api.dto.SeriesAvailabilityResponse;
import com.worldhealthvision.timeseries.api.dto.SourceRunSummaryResponse;
import com.worldhealthvision.timeseries.api.dto.TimeseriesListResponse;
import com.worldhealthvision.timeseries.api.dto.TimeseriesObservationResponse;
import com.worldhealthvision.timeseries.api.dto.TimeseriesReadinessResponse;
import com.worldhealthvision.timeseries.persistence.TimeseriesRepository;
import java.time.LocalDate;
import java.util.List;
import java.util.stream.Collectors;
import org.springframework.stereotype.Service;

@Service
public class TimeseriesQueryService {

    private final TimeseriesRepository timeseriesRepository;

    public TimeseriesQueryService(TimeseriesRepository timeseriesRepository) {
        this.timeseriesRepository = timeseriesRepository;
    }

    public TimeseriesReadinessResponse getReadiness() {
        return timeseriesRepository.getReadiness();
    }

    public TimeseriesListResponse<TimeseriesObservationResponse> listSeries(
            String countryIso3,
            String indicatorCode,
            String sourceCode,
            String datasetCode,
            String periodGranularity,
            LocalDate fromPeriodStart,
            LocalDate toPeriodStart,
            boolean includeMissing,
            String sortDirection,
            int limit
    ) {
        validatePeriodBounds(fromPeriodStart, toPeriodStart);
        List<TimeseriesObservationResponse> items = timeseriesRepository.listSeries(
                normalizeRequiredCode(countryIso3),
                normalizeRequiredCode(indicatorCode),
                normalizeOptionalCode(sourceCode),
                normalizeOptionalCode(datasetCode),
                normalizeOptionalCode(periodGranularity),
                fromPeriodStart,
                toPeriodStart,
                includeMissing,
                isDescendingSort(sortDirection),
                limit
        );
        return new TimeseriesListResponse<>(items.size(), items);
    }

    public TimeseriesListResponse<LatestSourceObservationResponse> listLatestBySource(
            String countryIso3,
            String indicatorCode,
            String sourceCode,
            String datasetCode,
            String periodGranularity,
            boolean includeMissing
    ) {
        List<LatestSourceObservationResponse> items = timeseriesRepository.listLatestBySource(
                normalizeRequiredCode(countryIso3),
                normalizeRequiredCode(indicatorCode),
                normalizeOptionalCode(sourceCode),
                normalizeOptionalCode(datasetCode),
                normalizeOptionalCode(periodGranularity),
                includeMissing
        );
        return new TimeseriesListResponse<>(items.size(), items);
    }

    public TimeseriesListResponse<SeriesAvailabilityResponse> listSeriesAvailability(
            String countryIso3,
            String indicatorCode,
            String sourceCode,
            String datasetCode,
            String periodGranularity,
            int limit
    ) {
        List<SeriesAvailabilityResponse> items = timeseriesRepository.listSeriesAvailability(
                normalizeRequiredCode(countryIso3),
                normalizeRequiredCode(indicatorCode),
                normalizeOptionalCode(sourceCode),
                normalizeOptionalCode(datasetCode),
                normalizeOptionalCode(periodGranularity),
                limit
        );
        return new TimeseriesListResponse<>(items.size(), items);
    }

    public TimeseriesListResponse<CountryLatestComparisonResponse> listLatestCountryComparison(
            List<String> countryIso3,
            String indicatorCode,
            String sourceCode,
            String datasetCode,
            String periodGranularity,
            boolean includeMissing
    ) {
        if (countryIso3 == null || countryIso3.isEmpty()) {
            throw new IllegalArgumentException("At least one countryIso3 value is required.");
        }
        if (countryIso3.size() > 500) {
            throw new IllegalArgumentException("countryIso3 comparison is limited to 500 countries per request.");
        }

        String countryIso3Csv = countryIso3.stream()
                .map(this::normalizeRequiredCode)
                .distinct()
                .collect(Collectors.joining(","));

        List<CountryLatestComparisonResponse> items = timeseriesRepository.listLatestCountryComparison(
                countryIso3Csv,
                normalizeRequiredCode(indicatorCode),
                normalizeOptionalCode(sourceCode),
                normalizeOptionalCode(datasetCode),
                normalizeOptionalCode(periodGranularity),
                includeMissing
        );
        return new TimeseriesListResponse<>(items.size(), items);
    }

    public TimeseriesListResponse<SourceRunSummaryResponse> listSourceRuns(
            String sourceCode,
            String datasetCode,
            String status,
            int limit
    ) {
        List<SourceRunSummaryResponse> items = timeseriesRepository.listSourceRuns(
                normalizeOptionalCode(sourceCode),
                normalizeOptionalCode(datasetCode),
                normalizeOptionalCode(status),
                limit
        );
        return new TimeseriesListResponse<>(items.size(), items);
    }

    private String normalizeRequiredCode(String value) {
        if (value == null || value.isBlank()) {
            throw new IllegalArgumentException("Required code parameter cannot be blank.");
        }
        return value.trim().toUpperCase();
    }

    private String normalizeOptionalCode(String value) {
        if (value == null || value.isBlank()) {
            return null;
        }
        return value.trim().toUpperCase();
    }

    private boolean isDescendingSort(String sortDirection) {
        if (sortDirection == null || sortDirection.isBlank()) {
            return false;
        }

        String normalizedSortDirection = sortDirection.trim().toUpperCase();
        return switch (normalizedSortDirection) {
            case "ASC" -> false;
            case "DESC" -> true;
            default -> throw new IllegalArgumentException("sortDirection must be ASC or DESC.");
        };
    }

    private void validatePeriodBounds(LocalDate fromPeriodStart, LocalDate toPeriodStart) {
        if (fromPeriodStart != null && toPeriodStart != null && fromPeriodStart.isAfter(toPeriodStart)) {
            throw new IllegalArgumentException("fromPeriodStart cannot be after toPeriodStart.");
        }
    }
}
