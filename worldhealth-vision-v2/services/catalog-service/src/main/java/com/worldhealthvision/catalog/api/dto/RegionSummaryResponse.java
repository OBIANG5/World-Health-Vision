package com.worldhealthvision.catalog.api.dto;

public record RegionSummaryResponse(
        String code,
        String displayName,
        String type,
        int countryCount,
        int aggregateCount
) {
}
