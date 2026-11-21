package com.worldhealthvision.timeseries.service;

import java.io.ByteArrayOutputStream;
import java.io.DataOutputStream;
import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.UUID;

/** Separately signed geography proof: NOT a dataset license, not a national
 * comparability grant and not an ingestion permission. */
public record SignedScopedPublicationDecision(
        UUID decisionId, UUID geographicScopeId, UUID sourceRunId,
        String attestedItemsSha256, String sourceCode, String datasetCode, String indicatorCode, String operation,
        String originalHttpSha256, String sourceMetadataSha256,
        String methodologyCode, String unitCode,
        LocalDate periodStart, LocalDate periodEnd,
        OffsetDateTime validFromUtc, OffsetDateTime validUntilUtc, OffsetDateTime issuedAtUtc,
        String reviewerId, String countersignerId, String scopeMetadataLabel,
        String scopeMetadataUrl, String scopeNativeCode, String scopeNativeVersion, String scopeCountryIso3,
        String scopeCoverageKind, String signingPublicKeySha256, String signatureBase64
) {
    public byte[] signingPayload() {
        try {
            var bytes = new ByteArrayOutputStream();
            var stream = new DataOutputStream(bytes);
            for (String field : new String[] {
                    "WORLD_VISION_SCOPED_PUBLICATION_DECISION_V1",
                    decisionId.toString(), geographicScopeId.toString(),
                    sourceRunId.toString(), attestedItemsSha256, sourceCode, datasetCode, indicatorCode, operation,
                    originalHttpSha256, sourceMetadataSha256, methodologyCode, unitCode,
                    periodStart.toString(), periodEnd.toString(),
                    validFromUtc.toInstant().toString(), validUntilUtc.toInstant().toString(),
                    issuedAtUtc.toInstant().toString(),
                    reviewerId, countersignerId, scopeMetadataLabel,
                    scopeMetadataUrl, scopeNativeCode, scopeNativeVersion, scopeCountryIso3,
                    scopeCoverageKind, signingPublicKeySha256
            }) {
                byte[] encoded = field.getBytes(StandardCharsets.UTF_8);
                if (encoded.length > 16_384) {
                    throw new IllegalArgumentException("Oversized scoped decision field");
                }
                stream.writeInt(encoded.length);
                stream.write(encoded);
            }
            stream.flush();
            return bytes.toByteArray();
        } catch (IOException ex) {
            throw new IllegalStateException("Cannot serialize signed geographic decision", ex);
        }
    }
}
