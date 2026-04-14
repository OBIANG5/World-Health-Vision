package com.worldhealthvision.catalog.api.dto;

public record SourceDatasetSummaryResponse(
        String sourceCode,
        String code,
        String displayName,
        String category,
        String defaultGranularity,
        String defaultFrequency,
        boolean enabled
) {
}
