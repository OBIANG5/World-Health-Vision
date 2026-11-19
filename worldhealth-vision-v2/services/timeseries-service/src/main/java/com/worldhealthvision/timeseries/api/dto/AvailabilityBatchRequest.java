package com.worldhealthvision.timeseries.api.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import java.util.List;

/** Bounded internal read: limit is per indicator, never a global series limit. */
public record AvailabilityBatchRequest(
        @NotBlank @Pattern(regexp = "[A-Za-z]{3}") String countryIso3,
        @NotNull @Size(min = 1, max = 128)
        List<@NotBlank @Pattern(regexp = "[A-Za-z0-9_.]{1,64}") String> indicatorCodes,
        String sourceCode,
        String datasetCode,
        String periodGranularity,
        @Min(1) @Max(500) int limitPerIndicator
) {}
