package com.worldhealthvision.timeseries.service;

import java.io.ByteArrayOutputStream;
import java.io.DataOutputStream;
import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.UUID;

/**
 * DATA-1C-A2. EXACT signed bytes of a scope-limited reviewer decision.
 * Deterministic length-prefixed UTF-8 (not a locale-sensitive SQL/JSON dump).
 * This is evidence of review/authenticity, NOT independent proof of a provider
 * license; rights must be reviewed by authorized humans before signing.
 */
public record SignedRightsDecision(
        UUID id,
        String sourceCode,
        String datasetCode,
        String countryIso3,
        String indicatorCode,
        String operation,
        String originalHttpSha256,
        LocalDate periodStart,
        LocalDate periodEnd,
        OffsetDateTime validFromUtc,
        OffsetDateTime validUntilUtc,
        OffsetDateTime issuedAtUtc,
        String reviewerId,
        String countersignerId,
        String licenseIdentifier,
        String licenseUrl,
        String licenseTextSha256,
        String attributionText,
        String signingPublicKeySha256,
        String signatureBase64
) {
    public byte[] signingPayload() {
        try {
            ByteArrayOutputStream target = new ByteArrayOutputStream();
            DataOutputStream output = new DataOutputStream(target);
            for (String field : new String[] {
                    "WORLD_VISION_SIGNED_RIGHTS_DECISION_V1",
                    id.toString(), sourceCode, datasetCode, countryIso3, indicatorCode,
                    operation, originalHttpSha256,
                    periodStart.toString(), periodEnd.toString(),
                    validFromUtc.toInstant().toString(),
                    validUntilUtc.toInstant().toString(),
                    issuedAtUtc.toInstant().toString(),
                    reviewerId, countersignerId, licenseIdentifier, licenseUrl,
                    licenseTextSha256, attributionText, signingPublicKeySha256
            }) {
                byte[] bytes = field.getBytes(StandardCharsets.UTF_8);
                if (bytes.length > 16_384) {
                    throw new IllegalArgumentException("Rights decision field exceeds bounded size");
                }
                output.writeInt(bytes.length);
                output.write(bytes);
            }
            output.flush();
            return target.toByteArray();
        } catch (IOException exception) {
            throw new IllegalStateException("Cannot encode signed rights decision", exception);
        }
    }
}
