package com.worldhealthvision.timeseries.api.internal.dto;

import java.util.UUID;

public record IngestionBatchAcceptedResponse(
        UUID sourceRunId,
        int itemCount,
        int upsertedCount
) {
}
