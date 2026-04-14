package com.worldhealthvision.timeseries.api.dto;

public record TimeseriesReadinessResponse(
        int sourceRunCount,
        int observationCount,
        int latestObservationCount
) {
}
