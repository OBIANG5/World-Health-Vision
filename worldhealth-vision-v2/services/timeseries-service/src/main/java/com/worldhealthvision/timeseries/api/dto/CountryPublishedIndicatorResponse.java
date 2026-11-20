package com.worldhealthvision.timeseries.api.dto;

import java.time.LocalDate;

/**
 * Discovery of an indicator actually eligible for public reading in ONE country.
 * Derived only from timeseries.latest_observation (rights + witness filtered),
 * not from the catalog's full indicator list.
 * Counts are observations, not numbers of independent data providers.
 */
public record CountryPublishedIndicatorResponse(
        String indicatorCode,
        String indicatorDisplayName,
        long availableObservationCount,
        long observedObservationCount,
        long estimatedObservationCount,
        long publishedSourceCount,
        LocalDate latestAvailablePeriodStart
) {
}
