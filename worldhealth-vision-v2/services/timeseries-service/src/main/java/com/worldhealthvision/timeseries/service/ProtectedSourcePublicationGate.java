package com.worldhealthvision.timeseries.service;

import com.worldhealthvision.timeseries.api.internal.dto.IngestionObservationBatchRequest;
import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import java.util.Set;
import org.springframework.stereotype.Component;

/**
 * Explicit DENY for the still-private IBGE/WDI research pilot, at the
 * Timeseries RECEIVER and not merely at the Python producer. This is an
 * interim negative gate, NOT a worldwide rights-grant registry.
 *
 * A caller cannot lift this gate by posting "APPROVED" in self-provided
 * notes; approval requires a future signed and revocable policy outside
 * the ingestion payload.
 */
@Component
public final class ProtectedSourcePublicationGate {
    private static final Set<String> BLOCKED_SOURCE_CODES = Set.of("IBGE");
    private static final Set<String> BLOCKED_DATASET_CODES = Set.of(
            "CENSO2022_4714",
            "CENSO2022_4714_METADATA",
            "CENSO2022_4714_PERIODS",
            "WDI_POP_TOTAL_BRA_2022",
            // Insee Melodi P2C3: the catalog's official territory is FEHM
            // (France hors Mayotte), not unqualified ISO3 FRA. No public
            // Timeseries country mapping exists yet. Public ingest stays
            // DENIED irrespective of reviewer notes or transport signature.
            // Unblock only after a reviewed, schema-backed geography scope
            // model, correct attribution/rights and signed provenance.
            "DS_POPULATIONS_REFERENCE",
            "DS_POPULATIONS_REFERENCE_CATALOG"
    );
    private static final Set<String> UNPUBLISHABLE_STATUSES = Set.of(
            "BRONZE_ONLY_UNREVIEWED", "REVIEW_REQUIRED",
            "NEEDS_PROVIDER_CLARIFICATION", "EXPIRED", "REVOKED",
            "DENIED", "NOT_ATTEMPTED", "BLOCKED"
    );

    public void requirePublishable(IngestionObservationBatchRequest request) {
        if (BLOCKED_SOURCE_CODES.contains(request.sourceCode())
                || BLOCKED_DATASET_CODES.contains(request.datasetCode())
                || request.datasetCode().startsWith("CENSO2022_4714")
                || request.datasetCode().startsWith("WDI_POP_TOTAL_BRA_2022")) {
            throw new ProtectedResearchPublicationException();
        }
        // Even a forged provider or dataset code cannot smuggle this research
        // observation into an internal ingestion path.
        for (var item : request.items()) {
            if (item.indicatorCode().startsWith("IBGE.CENSUS2022.RESIDENT_POP")
                || ("BRA".equals(item.countryIso3())
                    && "SP.POP.TOTL".equals(item.indicatorCode())
                    && !item.periodStart().isAfter(LocalDate.of(2022, 12, 31))
                    && !item.periodEnd().isBefore(LocalDate.of(2022, 1, 1)))) {
                throw new ProtectedResearchPublicationException();
            }
            if (hasBlockedState(item.sourceMetadata()) || containsBlockedFlag(item.qualityFlags())) {
                throw new ProtectedResearchPublicationException();
            }
        }
        if (hasBlockedState(request.notes())) {
            throw new ProtectedResearchPublicationException();
        }
    }

    private boolean containsBlockedFlag(List<String> flags) {
        if (flags == null) return false;
        return flags.stream().anyMatch(flag ->
                flag != null && (flag.equals("REUSE_RIGHTS_REVIEW_REQUIRED")
                    || flag.equals("IBGE_RIGHTS_NOT_GRANTED")
                    || flag.equals("NOT_AUTHORIZED_FOR_PUBLICATION")));
    }

    private boolean hasBlockedState(Map<String, Object> metadata) {
        if (metadata == null) return false;
        for (String key : List.of(
                "licenseReviewStatus", "rightsReviewStatus", "publicationStatus",
                "timeseriesPublication", "reuseRights", "rightsStatus", "commercialReuseAdvice"
        )) {
            Object value = metadata.get(key);
            if (value instanceof String text
                    && UNPUBLISHABLE_STATUSES.contains(text.strip().toUpperCase(java.util.Locale.ROOT))) {
                return true;
            }
        }
        return false;
    }
}
