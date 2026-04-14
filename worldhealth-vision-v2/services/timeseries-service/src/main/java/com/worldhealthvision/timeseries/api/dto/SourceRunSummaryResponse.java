package com.worldhealthvision.timeseries.api.dto;

import java.time.OffsetDateTime;
import java.util.UUID;

public record SourceRunSummaryResponse(
        UUID id,
        String sourceCode,
        String sourceDisplayName,
        String datasetCode,
        String datasetDisplayName,
        String runKey,
        OffsetDateTime fetchedAtUtc,
        OffsetDateTime persistedAtUtc,
        int recordCount,
        String status
) {
}
