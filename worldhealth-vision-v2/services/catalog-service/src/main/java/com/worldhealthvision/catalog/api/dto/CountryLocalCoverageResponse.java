package com.worldhealthvision.catalog.api.dto;

import java.time.LocalDate;

/**
 * Geographic applicability is NOT evidence of country-level research.
 * A BEAC-only country has regional context, not a fully researched
 * national statistical office and local media.
 */
public record CountryLocalCoverageResponse(
        String countryIso3,
        String displayName,
        String regionCode,
        int listedSourceCount,
        int nationalOfficialCount,
        int regionalOfficialCount,
        int localMediaCount,
        int localResearchCount,
        int connectedSourceCount,
        int overdueReviewCount,
        LocalDate lastReviewedOn,
        String researchStatus
) {
    public boolean hasCountrySpecificSources() {
        return nationalOfficialCount + localMediaCount + localResearchCount > 0;
    }
}
