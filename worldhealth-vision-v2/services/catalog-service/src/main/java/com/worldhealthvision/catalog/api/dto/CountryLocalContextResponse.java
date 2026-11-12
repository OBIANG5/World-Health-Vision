package com.worldhealthvision.catalog.api.dto;

import java.util.List;

/**
 * National evidence is surfaced next to international data, not collapsed
 * into a fake canonical observation or privileged source ranking.
 */
public record CountryLocalContextResponse(
        String countryIso3,
        int localSourceCount,
        List<CountryLocalSourceResponse> localSources,
        int documentedReleaseCount,
        List<CountryDocumentedReleaseResponse> documentedReleases
) {
}
