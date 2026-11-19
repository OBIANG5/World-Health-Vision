package com.worldhealthvision.timeseries.api.dto;

import java.util.List;

/** A historical series exactly as a GET for this indicator would return. */
public record SeriesHistoryBatchItem(
        String indicatorCode, int count, List<TimeseriesObservationResponse> items
) {}
