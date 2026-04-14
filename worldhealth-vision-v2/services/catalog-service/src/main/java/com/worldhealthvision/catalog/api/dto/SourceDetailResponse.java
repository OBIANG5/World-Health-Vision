package com.worldhealthvision.catalog.api.dto;

public record SourceDetailResponse(
        String code,
        String displayName,
        String type,
        String organizationName,
        String homepageUrl,
        String documentationUrl,
        String accessModel,
        String licenseSummary,
        String geographicScope,
        String temporalGranularity,
        String updateCadence,
        String biasNotes,
        String qualityNotes,
        boolean enabled
) {
}
