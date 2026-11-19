package com.worldhealthvision.timeseries.api.dto;

import java.util.List;
public record SeriesBatchItem(
        String indicatorCode, int count, List<TimeseriesObservationResponse> items
) {}
