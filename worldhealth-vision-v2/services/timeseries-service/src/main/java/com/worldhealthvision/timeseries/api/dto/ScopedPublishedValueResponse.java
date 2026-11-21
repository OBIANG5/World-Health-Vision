package com.worldhealthvision.timeseries.api.dto;

import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.List;

/** Independent scoped value. Not a national total or comparable ISO3 value. */
public record ScopedPublishedValueResponse(
        String sourceCode, String datasetCode, String indicatorCode,
        String countryIso3Parent, String sourceNativeGeographyCode,
        String geographicVersion, Integer geographicReferenceYear,
        String scopeDisplayLabel, String coverageKind,
        List<String> territorialExclusions,
        LocalDate periodStart, LocalDate periodEnd, String periodLabel,
        Double numericValue, String valueStatus, String methodologyCode,
        String unitCode, String attributionText, String sourceMetadataUrl,
        OffsetDateTime fetchedAtUtc, String comparabilityStatus
) {}
