package com.worldhealthvision.timeseries.api.dto;

import java.util.List;

public record AvailabilityBatchResponse(int count, List<AvailabilityBatchItem> items) {}
