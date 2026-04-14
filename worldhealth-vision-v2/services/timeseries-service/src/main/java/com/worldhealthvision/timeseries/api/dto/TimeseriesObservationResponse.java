package com.worldhealthvision.timeseries.api.dto;

import java.time.LocalDate;
import java.time.OffsetDateTime;

public record TimeseriesObservationResponse(
        String sourceCode,
        String sourceDisplayName,
        String datasetCode,
        String datasetDisplayName,
        String sourceRunKey,
        String countryIso3,
        String countryDisplayName,
        String indicatorCode,
        String indicatorDisplayName,
        String periodGranularity,
        LocalDate periodStart,
        LocalDate periodEnd,
        String periodLabel,
        Double numericValue,
        String textValue,
        String valueStatus,
        OffsetDateTime sourcePublishedAt,
        OffsetDateTime fetchedAtUtc
) {
}
