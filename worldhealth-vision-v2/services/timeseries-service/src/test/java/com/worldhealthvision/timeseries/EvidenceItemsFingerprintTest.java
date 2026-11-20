package com.worldhealthvision.timeseries;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotEquals;

import com.worldhealthvision.timeseries.api.internal.dto.IngestionObservationBatchRequest;
import com.worldhealthvision.timeseries.api.internal.dto.IngestionObservationWriteRequest;
import com.worldhealthvision.timeseries.service.EvidenceItemsFingerprint;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.Map;
import org.junit.jupiter.api.Test;

/**
 * Immutable cross-language vector: Python evidence_items_fingerprint.items_sha256
 * MUST return exactly the same SHA for the synthetic projection. Pure no-DB.
 */
class EvidenceItemsFingerprintTest {
    private static final String GOLDEN = "cd3c0117ff783f8f0c18aa6075eb8062ffb60f68ab44544edc6268ae79a7fb4d";

    private IngestionObservationBatchRequest request(double value) {
        var item = new IngestionObservationWriteRequest(
                "SYNTH.RIGHTS.GDP", "FRA", "ANNUAL",
                LocalDate.parse("2024-01-01"), LocalDate.parse("2024-12-31"),
                "2024", value, null, "OBSERVED", null,
                Map.of(
                        "sourcePeriodLabel", "2024",
                        "sourceYear", "2024",
                        "syntheticTestOnly", true
                ), List.of("SYNTHETIC_ONLY")
        );
        return new IngestionObservationBatchRequest(
                "WORLD_BANK", "WDI", "fake_ci_2024",
                OffsetDateTime.parse("2026-11-20T08:00:00Z"),
                "test.raw", "test.normalized", 1, Map.of(), List.of(item));
    }

    @Test
    void javaAndPythonAgreeOnExactTypedBytes() {
        var hash = new EvidenceItemsFingerprint();
        assertEquals(GOLDEN, hash.calculate(request(17.0)));
        assertNotEquals(GOLDEN, hash.calculate(request(18.0)));
    }
}
