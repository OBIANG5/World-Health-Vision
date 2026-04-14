package com.worldhealthvision.timeseries.api.dto;

import java.time.LocalDate;
import java.time.OffsetDateTime;

public record SeriesAvailabilityResponse(
        String sourceCode,
        String sourceDisplayName,
        String datasetCode,
        String datasetDisplayName,
        String countryIso3,
        String countryDisplayName,
        String indicatorCode,
        String indicatorDisplayName,
        String periodGranularity,
        int availableObservationCount,
        int observedObservationCount,
        int estimatedObservationCount,
        int suppressedObservationCount,
        int missingObservationCount,
        LocalDate firstPeriodStart,
        LocalDate latestPeriodStart,
        LocalDate latestPeriodEnd,
        String latestPeriodLabel,
        Double latestNumericValue,
        String latestTextValue,
        String latestValueStatus,
        OffsetDateTime latestFetchedAtUtc
) {
}
