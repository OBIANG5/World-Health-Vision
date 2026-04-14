package com.worldhealthvision.timeseries.api.dto;

import java.time.LocalDate;
import java.time.OffsetDateTime;

public record CountryLatestComparisonResponse(
        String countryIso3,
        String countryDisplayName,
        String indicatorCode,
        String indicatorDisplayName,
        String sourceCode,
        String sourceDisplayName,
        String datasetCode,
        String datasetDisplayName,
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
