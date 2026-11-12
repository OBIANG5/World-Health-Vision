package com.worldhealthvision.catalog.api.dto;

import java.math.BigDecimal;
import java.time.LocalDate;

/**
 * A researched national publication. Explicitly NOT a persisted
 * Timescale observation, and never a same-year comparison by itself.
 */
public record CountryDocumentedReleaseResponse(
        String releaseCode,
        String countryIso3,
        String sourceCode,
        String indicatorCode,
        int referenceYear,
        BigDecimal valueNumeric,
        String unitLabel,
        String populationScope,
        String methodKind,
        String publicationStatus,
        LocalDate releaseDate,
        String title,
        String primaryEvidenceUrl,
        String corroborationUrl,
        String methodologyCaveat,
        String internationalComparisonNote,
        String verificationStatus,
        LocalDate reviewedOn
) {
}
