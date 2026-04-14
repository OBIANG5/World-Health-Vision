package com.worldhealthvision.timeseries.api.internal.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.Map;

public record IngestionObservationWriteRequest(
        @NotBlank String indicatorCode,
        @NotBlank String countryIso3,
        @NotBlank String periodGranularity,
        @NotNull LocalDate periodStart,
        @NotNull LocalDate periodEnd,
        @NotBlank String periodLabel,
        Double numericValue,
        String textValue,
        @NotBlank String valueStatus,
        OffsetDateTime sourcePublishedAt,
        Map<String, Object> sourceMetadata,
        List<String> qualityFlags
) {
}
