package com.worldhealthvision.catalog.api.dto;

public record SourceDatasetDetailResponse(
        String sourceCode,
        String code,
        String displayName,
        String description,
        String category,
        String defaultGranularity,
        String defaultFrequency,
        String documentationUrl,
        String licenseSummary,
        boolean enabled
) {
}
