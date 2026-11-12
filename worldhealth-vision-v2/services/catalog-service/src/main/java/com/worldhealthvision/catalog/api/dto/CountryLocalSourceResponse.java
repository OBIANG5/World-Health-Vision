package com.worldhealthvision.catalog.api.dto;

import java.time.LocalDate;

/**
 * Country-specific official or journalistic provenance, not an ingestion status.
 * Verified organization != verified values, licensing or methodological validity.
 */
public record CountryLocalSourceResponse(
        String countryIso3,
        String sourceCode,
        String displayName,
        String organizationName,
        String sourceRole,
        String sourceType,
        String homepageUrl,
        String evidenceUrl,
        String verificationState,
        LocalDate lastReviewedOn,
        String methodologyCaveat,
        String reuseRightsNote
) {
}
