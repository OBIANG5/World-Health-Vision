package com.worldhealthvision.catalog.api.dto;

public record SourceSummaryResponse(
        String code,
        String displayName,
        String type,
        String organizationName,
        boolean enabled
) {
}
