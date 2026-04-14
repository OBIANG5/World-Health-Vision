package com.worldhealthvision.catalog.api.dto;

public record IndicatorDetailResponse(
        String code,
        String displayName,
        String topic,
        String unitLabel,
        String description,
        String preferredFrequency,
        String sourceDatasetCode,
        boolean core,
        String methodologyNotes
) {
}
