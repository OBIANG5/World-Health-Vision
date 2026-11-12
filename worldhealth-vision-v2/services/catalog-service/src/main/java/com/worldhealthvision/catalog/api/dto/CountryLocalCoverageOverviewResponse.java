package com.worldhealthvision.catalog.api.dto;

import java.util.List;

/**
 * Counts are computed against the real, nonaggregate country registry.
 * "Catalogued" != "complete", and "connected" != "listed".
 * Country items are paginated; summary counts apply to the entire
 * requested region rather than just the current page.
 */
public record CountryLocalCoverageOverviewResponse(
        int totalCountryCount,
        int countriesWithCountrySpecificSources,
        int countriesNotResearchedLocally,
        int countriesWithRegionalReferencesOnly,
        int cataloguedSourceLinks,
        int verifiedIngestionLinks,
        int overdueReviewLinks,
        int matchingCountryCount,
        int offset,
        int limit,
        int returnedCount,
        String coverageInterpretation,
        List<CountryLocalCoverageResponse> items
) {
}
