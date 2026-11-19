package com.worldhealthvision.timeseries.service;

import com.worldhealthvision.timeseries.api.dto.LatestSourceObservationResponse;
import com.worldhealthvision.timeseries.api.dto.CountryLatestComparisonResponse;
import com.worldhealthvision.timeseries.api.dto.SeriesAvailabilityResponse;
import com.worldhealthvision.timeseries.api.dto.SourceRunSummaryResponse;
import com.worldhealthvision.timeseries.api.dto.SourceDataCoverageResponse;
import com.worldhealthvision.timeseries.api.dto.TimeseriesListResponse;
import com.worldhealthvision.timeseries.api.dto.TimeseriesObservationResponse;
import com.worldhealthvision.timeseries.api.dto.TimeseriesReadinessResponse;
import com.worldhealthvision.timeseries.persistence.TimeseriesRepository;
import java.time.LocalDate;
import java.util.List;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.LinkedHashSet;
import java.util.Locale;
import java.util.Map;
import java.util.Set;
import java.util.regex.Pattern;
import com.worldhealthvision.timeseries.api.dto.LatestSourceBatchResponse;
import com.worldhealthvision.timeseries.api.dto.AvailabilityBatchResponse;
import com.worldhealthvision.timeseries.api.dto.AvailabilityBatchItem;
import com.worldhealthvision.timeseries.api.dto.LatestSourceBatchItem;
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

    public TimeseriesListResponse<SourceDataCoverageResponse> listSourceDataCoverage() {
        List<SourceDataCoverageResponse> rows = timeseriesRepository.listSourceDataCoverage();
        return new TimeseriesListResponse<>(rows.size(), rows);
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

    private static final Pattern BATCH_CODE = Pattern.compile("[A-Z0-9_.]{1,64}");

    public LatestSourceBatchResponse listLatestBySourceBatch(
            String countryIso3, List<String> indicatorCodes,
            String sourceCode, String datasetCode,
            String periodGranularity, boolean includeMissing
    ) {
        if (countryIso3 == null || !countryIso3.trim().toUpperCase(Locale.ROOT).matches("[A-Z]{3}")) {
            throw new IllegalArgumentException("Batch countryIso3 must be an ISO3 code.");
        }
        if (indicatorCodes == null || indicatorCodes.isEmpty() || indicatorCodes.size() > 128) {
            throw new IllegalArgumentException("Batch requires 1 to 128 indicator codes.");
        }
        Set<String> distinct = new LinkedHashSet<>();
        for (String code : indicatorCodes) {
            if (code == null || !BATCH_CODE.matcher(code.trim().toUpperCase(Locale.ROOT)).matches()
                    || !distinct.add(code.trim().toUpperCase(Locale.ROOT))) {
                throw new IllegalArgumentException("Invalid or duplicated indicator code.");
            }
        }
        List<String> requested = new ArrayList<>(distinct);
        List<LatestSourceObservationResponse> rows = timeseriesRepository.listLatestBySourceBatch(
                countryIso3.trim().toUpperCase(Locale.ROOT), requested,
                normalizeOptionalCode(sourceCode), normalizeOptionalCode(datasetCode),
                normalizeOptionalCode(periodGranularity), includeMissing
        );

        // No global LIMIT. A code with no observations gets an empty list just
        // as the existing GET does, rather than a fabricated zero or HTTP 404.
        Map<String, List<LatestSourceObservationResponse>> groups = new LinkedHashMap<>();
        for (String code : requested) {
            groups.put(code, new ArrayList<>());
        }
        for (LatestSourceObservationResponse row : rows) {
            List<LatestSourceObservationResponse> group = groups.get(row.indicatorCode());
            if (group == null) {
                throw new IllegalStateException("Batch SQL returned unrequested indicator.");
            }
            group.add(row);
        }
        List<LatestSourceBatchItem> items = requested.stream()
                .map(code -> new LatestSourceBatchItem(code, groups.get(code).size(), groups.get(code)))
                .toList();
        return new LatestSourceBatchResponse(items.size(), items);
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

    public AvailabilityBatchResponse listSeriesAvailabilityBatch(
            String countryIso3, List<String> indicatorCodes, String sourceCode,
            String datasetCode, String periodGranularity, int limitPerIndicator
    ) {
        if (countryIso3 == null || !countryIso3.trim().toUpperCase(Locale.ROOT).matches("[A-Z]{3}")) {
            throw new IllegalArgumentException("Country must be an ISO3 code.");
        }
        if (indicatorCodes == null || indicatorCodes.isEmpty() || indicatorCodes.size() > 128) {
            throw new IllegalArgumentException("Availability batch requires 1 to 128 indicators.");
        }
        if (limitPerIndicator < 1 || limitPerIndicator > 500
                || (long) indicatorCodes.size() * limitPerIndicator > 10_000L) {
            throw new IllegalArgumentException("Availability batch exceeds bounded output budget.");
        }
        Set<String> codes = new LinkedHashSet<>();
        for (String raw : indicatorCodes) {
            if (raw == null) {
                throw new IllegalArgumentException("Null indicator code.");
            }
            String code = raw.trim().toUpperCase(Locale.ROOT);
            if (!BATCH_CODE.matcher(code).matches() || !codes.add(code)) {
                throw new IllegalArgumentException("Malformed or duplicate indicator.");
            }
        }
        List<String> requested = new ArrayList<>(codes);
        List<SeriesAvailabilityResponse> rows = timeseriesRepository.listSeriesAvailabilityBatch(
                countryIso3.trim().toUpperCase(Locale.ROOT), requested,
                normalizeOptionalCode(sourceCode), normalizeOptionalCode(datasetCode),
                normalizeOptionalCode(periodGranularity), limitPerIndicator
        );
        Map<String, List<SeriesAvailabilityResponse>> grouped = new LinkedHashMap<>();
        for (String code : requested) grouped.put(code, new ArrayList<>());
        for (SeriesAvailabilityResponse row : rows) {
            List<SeriesAvailabilityResponse> bucket = grouped.get(row.indicatorCode());
            if (bucket == null) {
                throw new IllegalStateException("Unexpected indicator returned by SQL.");
            }
            bucket.add(row);
        }
        List<AvailabilityBatchItem> groups = requested.stream()
                .map(code -> new AvailabilityBatchItem(code, grouped.get(code).size(), grouped.get(code)))
                .toList();
        return new AvailabilityBatchResponse(groups.size(), groups);
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