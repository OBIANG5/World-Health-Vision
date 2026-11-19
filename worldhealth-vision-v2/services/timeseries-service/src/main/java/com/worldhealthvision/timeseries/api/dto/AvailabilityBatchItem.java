package com.worldhealthvision.timeseries.api.dto;

import java.util.List;

/** Every indicator contains its own complete sorted availability list. */
public record AvailabilityBatchItem(
        String indicatorCode, int count, List<SeriesAvailabilityResponse> items
) {}
