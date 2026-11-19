package com.worldhealthvision.timeseries.api.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import java.util.List;
import java.time.LocalDate;

public record SeriesBatchRequest(
        @NotBlank @Pattern(regexp = "[A-Za-z]{3}") String countryIso3,
        @NotNull @Size(min = 1, max = 128)
        List<@NotBlank @Pattern(regexp = "[A-Za-z0-9_.]{1,64}") String> indicatorCodes,
        String sourceCode,
        String datasetCode,
        String periodGranularity,
        LocalDate fromPeriodStart,
        LocalDate toPeriodStart,
        boolean includeMissing,
        String sortDirection,
        @Min(1) @Max(1000) int limitPerIndicator
) {}
