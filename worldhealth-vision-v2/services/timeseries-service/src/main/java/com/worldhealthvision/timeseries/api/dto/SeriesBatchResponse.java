package com.worldhealthvision.timeseries.api.dto;

import java.util.List;
public record SeriesBatchResponse(int count, List<SeriesBatchItem> items) {}
