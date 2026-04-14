package com.worldhealthvision.catalog.api.dto;

public record CatalogReadinessResponse(
        int sourceCount,
        int datasetCount,
        int indicatorCount,
        int regionCount,
        int countryCount
) {
}
