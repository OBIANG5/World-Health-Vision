package com.worldhealthvision.timeseries.api.dto;

import java.util.List;

/** A complete per-indicator response preserving original source ordering. */
public record LatestSourceBatchItem(
        String indicatorCode, int count, List<LatestSourceObservationResponse> items
) {}
