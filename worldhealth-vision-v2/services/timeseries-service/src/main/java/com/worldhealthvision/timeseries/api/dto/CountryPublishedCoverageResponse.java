package com.worldhealthvision.timeseries.api.dto;

import java.time.LocalDate;
import java.time.OffsetDateTime;

/**
 * A PUBLIC, verifiable answer to: "What does World-Vision REALLY have
 * for this country?" Counts come exclusively from latest_observation,
 * already restricted by signed source rights, live revocations and verified
 * Bronze witnesses. Catalog registration != connected/publishable data.
 *
 * Zero means there are no eligible observations IN THIS DATABASE at query
 * time; it does NOT mean no statistics exist in the world.
 */
public record CountryPublishedCoverageResponse(
        String countryIso3,
        String coverageStatus,
        long availableObservationCount,
        long observedObservationCount,
        long estimatedObservationCount,
        long publishedIndicatorCount,
        long publishedSourceCount,
        LocalDate latestAvailablePeriodStart,
        OffsetDateTime latestSourceFetchedAtUtc
) {
}
