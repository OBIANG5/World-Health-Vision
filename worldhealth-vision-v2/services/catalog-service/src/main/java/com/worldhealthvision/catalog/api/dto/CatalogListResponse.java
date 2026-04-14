package com.worldhealthvision.catalog.api.dto;

import java.util.List;

public record CatalogListResponse<T>(
        int count,
        List<T> items
) {
}
