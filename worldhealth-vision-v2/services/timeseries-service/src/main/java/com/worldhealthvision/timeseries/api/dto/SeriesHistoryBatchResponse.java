package com.worldhealthvision.timeseries.api.dto;

import java.util.List;

/** Complete request-ordered groups, with explicit empty lists for absent series. */
public record SeriesHistoryBatchResponse(int count, List<SeriesHistoryBatchItem> items) {}
