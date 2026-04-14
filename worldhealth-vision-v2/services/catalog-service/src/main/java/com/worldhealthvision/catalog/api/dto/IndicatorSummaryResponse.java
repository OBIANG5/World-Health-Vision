package com.worldhealthvision.catalog.api.dto;

public record IndicatorSummaryResponse(
        String code,
        String displayName,
        String topic,
        String unitLabel,
        boolean core
) {
}
