package com.worldhealthvision.timeseries.service;

import java.io.ByteArrayOutputStream;
import java.io.DataOutputStream;
import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.util.HexFormat;

/** DATA-1C-A2B1: signed assertion by a SEPARATE private Bronze witness. */
public record SignedEvidenceAttestation(
        String schema,
        String operation,
        String sourceCode,
        String datasetCode,
        String runKey,
        long fetchedAtEpochSec,
        int fetchedAtNano,
        String originalHttpSha256,
        String normalizedNdjsonSha256,
        String manifestSha256,
        String acquisitionEventId,
        String acquisitionOutcomeSha256,
        String itemsSha256,
        String semanticVerifierVersion,
        String semanticVerifierCodeSha256,
        long issuedAtEpochSec,
        long expiresAtEpochSec,
        String signingPublicKeySha256,
        String signatureBase64
) {
    public byte[] signingPayload() {
        try {
            var target = new ByteArrayOutputStream();
            var writer = new DataOutputStream(target);
            for (String field : new String[] {
                    "WORLD_VISION_BRONZE_WITNESS_V2",
                    schema, operation, sourceCode, datasetCode,
                    runKey, Long.toString(fetchedAtEpochSec), Integer.toString(fetchedAtNano),
                    originalHttpSha256, normalizedNdjsonSha256, manifestSha256,
                    acquisitionEventId, acquisitionOutcomeSha256, itemsSha256,
                    semanticVerifierVersion, semanticVerifierCodeSha256,
                    Long.toString(issuedAtEpochSec), Long.toString(expiresAtEpochSec),
                    signingPublicKeySha256
            }) {
                if (field == null) {
                    throw new IllegalArgumentException("Incomplete evidence attestation");
                }
                byte[] bytes = field.getBytes(StandardCharsets.UTF_8);
                if (bytes.length > 4096) {
                    throw new IllegalArgumentException("Evidence signing field oversized");
                }
                writer.writeInt(bytes.length);
                writer.write(bytes);
            }
            writer.flush();
            return target.toByteArray();
        } catch (IOException exception) {
            throw new IllegalStateException("Evidence signing payload serialization failed", exception);
        }
    }

    /** Digest is server-derived from the exact SIGNED payload, not a client claim. */
    public String signedPayloadSha256() {
        try {
            return HexFormat.of().formatHex(
                    MessageDigest.getInstance("SHA-256").digest(signingPayload()));
        } catch (NoSuchAlgorithmException exception) {
            throw new IllegalStateException("SHA256 unavailable", exception);
        }
    }
}
