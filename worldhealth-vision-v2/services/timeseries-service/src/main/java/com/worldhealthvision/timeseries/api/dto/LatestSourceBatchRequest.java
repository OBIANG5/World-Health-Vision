package com.worldhealthvision.timeseries.api.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import java.util.List;

/** Internal-only, bounded read request; no SQL or public Gateway writes. */
public record LatestSourceBatchRequest(
        @NotBlank @Pattern(regexp = "[A-Za-z]{3}") String countryIso3,
        @NotNull @Size(min = 1, max = 128)
        List<@NotBlank @Pattern(regexp = "[A-Za-z0-9_.]{1,64}") String> indicatorCodes,
        String sourceCode, String datasetCode, String periodGranularity,
        boolean includeMissing
) {}
