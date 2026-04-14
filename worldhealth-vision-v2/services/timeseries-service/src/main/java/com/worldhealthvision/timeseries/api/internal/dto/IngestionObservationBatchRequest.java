package com.worldhealthvision.timeseries.api.internal.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.Map;

public record IngestionObservationBatchRequest(
        @NotBlank String sourceCode,
        @NotBlank String datasetCode,
        @NotBlank String runKey,
        @NotNull OffsetDateTime fetchedAtUtc,
        String bronzeRawPayloadPath,
        String bronzeNormalizedPayloadPath,
        @NotNull @Min(0) Integer recordCount,
        Map<String, Object> notes,
        @NotEmpty List<@Valid IngestionObservationWriteRequest> items
) {
}
