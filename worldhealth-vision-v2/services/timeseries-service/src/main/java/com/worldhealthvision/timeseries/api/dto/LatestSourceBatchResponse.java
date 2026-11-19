package com.worldhealthvision.timeseries.api.dto;

import java.util.List;

public record LatestSourceBatchResponse(int count, List<LatestSourceBatchItem> items) {}
