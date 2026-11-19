package com.worldhealthvision.catalog.api.dto;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import java.util.List;

/** Internal-only bounded request. Duplicate normalized codes rejected in service. */
public record IndicatorBatchRequest(
        @NotNull @Size(min = 1, max = 128)
        List<@NotBlank @Pattern(regexp = "[a-zA-Z0-9_.]{1,64}") String> codes
) { }
