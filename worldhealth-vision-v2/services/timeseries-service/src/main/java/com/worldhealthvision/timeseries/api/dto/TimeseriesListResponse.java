package com.worldhealthvision.timeseries.api.dto;

import java.util.List;

public record TimeseriesListResponse<T>(
        int count,
        List<T> items
) {
}
