package com.worldhealthvision.timeseries.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.SerializationFeature;
import com.worldhealthvision.timeseries.api.internal.dto.IngestionObservationBatchRequest;
import com.worldhealthvision.timeseries.api.internal.dto.IngestionObservationWriteRequest;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.util.Comparator;
import java.util.HexFormat;
import java.util.HashSet;
import java.util.Set;
import org.springframework.stereotype.Component;

/**
 * DATA-1C-A1: deterministic digest of ALL accepted request fields.
 * The SHA is identity for the normalized ingestion request, NOT a signature,
 * an original HTTP response hash, evidence of source rights or approval.
 */
@Component
public final class CanonicalIngestionFingerprint {
    private final ObjectMapper canonicalMapper;

    public CanonicalIngestionFingerprint(ObjectMapper objectMapper) {
        canonicalMapper = objectMapper.copy()
                .configure(SerializationFeature.ORDER_MAP_ENTRIES_BY_KEYS, true);
    }

    public String calculate(IngestionObservationBatchRequest request) {
        Comparator<IngestionObservationWriteRequest> order = Comparator
                .comparing(IngestionObservationWriteRequest::indicatorCode)
                .thenComparing(IngestionObservationWriteRequest::countryIso3)
                .thenComparing(IngestionObservationWriteRequest::periodGranularity)
                .thenComparing(IngestionObservationWriteRequest::periodStart);
        var sorted = request.items().stream().sorted(order).toList();
        // A source run cannot carry conflicting observations under one
        // Timeseries unique key. Refuse instead of silently overwriting.
        Set<String> uniqueKeys = new HashSet<>();
        for (var item : sorted) {
            String key = item.indicatorCode() + "/" + item.countryIso3()
                    + "/" + item.periodGranularity() + "/" + item.periodStart();
            if (!uniqueKeys.add(key)) {
                throw new IllegalArgumentException("Duplicate observation identity in source batch.");
            }
        }
        var canonical = new IngestionObservationBatchRequest(
                request.sourceCode(), request.datasetCode(), request.runKey(),
                request.fetchedAtUtc(), request.bronzeRawPayloadPath(),
                request.bronzeNormalizedPayloadPath(), request.recordCount(),
                notesWithoutExpiringWitness(request.notes()), sorted
        );
        try {
            byte[] payload = canonicalMapper.writeValueAsBytes(canonical);
            return HexFormat.of().formatHex(MessageDigest.getInstance("SHA-256").digest(payload));
        } catch (JsonProcessingException | NoSuchAlgorithmException exc) {
            throw new IllegalStateException("Cannot determine canonical source run identity.", exc);
        }
    }
    private static java.util.Map<String, Object> notesWithoutExpiringWitness(
            java.util.Map<String, Object> notes
    ) {
        if (notes == null || notes.isEmpty()) return java.util.Map.of();
        var copy = new java.util.HashMap<>(notes);
        // Same source bytes + same values => same identity after witness
        // rotates or expires. Every replay still verifies fresh signature.
        copy.remove("evidenceAttestation");
        return copy;
    }

}
