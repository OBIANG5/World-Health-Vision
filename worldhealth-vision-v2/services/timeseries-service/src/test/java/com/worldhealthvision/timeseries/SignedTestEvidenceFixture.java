package com.worldhealthvision.timeseries;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;
import com.worldhealthvision.timeseries.api.internal.dto.IngestionObservationBatchRequest;
import com.worldhealthvision.timeseries.service.EvidenceItemsFingerprint;
import com.worldhealthvision.timeseries.service.SignedEvidenceAttestation;
import java.security.KeyPair;
import java.security.KeyPairGenerator;
import java.security.MessageDigest;
import java.security.Signature;
import java.time.Instant;
import java.util.Base64;
import java.util.HexFormat;

/**
 * Synthetic integration-only evidence proof. The key is an ephemeral
 * second/INDEPENDENT Ed25519 key generated in CI process memory, NEVER saved
 * or available to production. It DOES NOT demonstrate that a real provider's
 * original HTTP bytes exist. The Python private witness supplies that
 * separate real verification in its own tests (research-only issuer).
 */
final class SignedTestEvidenceFixture {
    static final String NORMALIZED_SHA = "c".repeat(64);
    static final String MANIFEST_SHA = "d".repeat(64);
    static final String OUTCOME_SHA = "e".repeat(64);
    static final String EVENT = "f".repeat(32);
    static final String SEMANTIC_SHA = "9".repeat(64);
    static final String SEMANTIC_VERSION = "WORLD_VISION_SEMANTIC_POPULATION_REPLAY_V1";
    private static final KeyPair KEY = generate();

    private SignedTestEvidenceFixture() {}

    private static KeyPair generate() {
        try {
            return KeyPairGenerator.getInstance("Ed25519").generateKeyPair();
        } catch (Exception error) {
            throw new IllegalStateException("No ephemeral test witness signer", error);
        }
    }

    static String publicKeyBase64() {
        return Base64.getEncoder().encodeToString(KEY.getPublic().getEncoded());
    }

    static String attach(
            String json, ObjectMapper mapper, EvidenceItemsFingerprint fingerprint
    ) {
        return attachWithPolicy(json, mapper, fingerprint, "PUBLIC_API_INGEST", 0, 180);
    }

    static String attachWithPolicy(
            String json, ObjectMapper mapper, EvidenceItemsFingerprint fingerprint,
            String operation, long issuedOffsetSeconds, long expiresOffsetSeconds
    ) {
        try {
            ObjectNode root = (ObjectNode) mapper.readTree(json);
            ObjectNode notes = (ObjectNode) root.with("notes");
            notes.put("normalizedNdjsonSha256", NORMALIZED_SHA);
            notes.put("manifestSha256", MANIFEST_SHA);
            notes.put("acquisitionEventId", EVENT);
            notes.put("acquisitionOutcomeSha256", OUTCOME_SHA);
            if (!notes.has("httpBodySha256")) {
                notes.put("httpBodySha256", SignedTestRightsFixture.HTTP_SHA);
            }
            var request = mapper.treeToValue(root, IngestionObservationBatchRequest.class);
            String projection = fingerprint.calculate(request);
            long now = Instant.now().getEpochSecond();
            String publicHash = HexFormat.of().formatHex(
                    MessageDigest.getInstance("SHA-256").digest(KEY.getPublic().getEncoded()));
            var unsigned = new SignedEvidenceAttestation(
                    "WORLD_VISION_BRONZE_WITNESS_V1",
                    operation,
                    request.sourceCode(), request.datasetCode(), request.runKey(),
                    request.fetchedAtUtc().toInstant().getEpochSecond(),
                    request.fetchedAtUtc().toInstant().getNano(),
                    notes.get("httpBodySha256").asText(),
                    NORMALIZED_SHA, MANIFEST_SHA, EVENT, OUTCOME_SHA,
                    projection, SEMANTIC_VERSION, SEMANTIC_SHA,
                    now + issuedOffsetSeconds,
                    now + expiresOffsetSeconds, publicHash, ""
            );
            var signature = Signature.getInstance("Ed25519");
            signature.initSign(KEY.getPrivate());
            signature.update(unsigned.signingPayload());
            var token = new SignedEvidenceAttestation(
                    unsigned.schema(), unsigned.operation(),
                    unsigned.sourceCode(), unsigned.datasetCode(), unsigned.runKey(),
                    unsigned.fetchedAtEpochSec(), unsigned.fetchedAtNano(),
                    unsigned.originalHttpSha256(), unsigned.normalizedNdjsonSha256(),
                    unsigned.manifestSha256(), unsigned.acquisitionEventId(),
                    unsigned.acquisitionOutcomeSha256(), unsigned.itemsSha256(),
                    unsigned.semanticVerifierVersion(), unsigned.semanticVerifierCodeSha256(),
                    unsigned.issuedAtEpochSec(), unsigned.expiresAtEpochSec(),
                    unsigned.signingPublicKeySha256(),
                    Base64.getEncoder().encodeToString(signature.sign())
            );
            notes.set("evidenceAttestation", mapper.valueToTree(token));
            return mapper.writeValueAsString(root);
        } catch (Exception error) {
            throw new IllegalStateException("Cannot construct synthetic test-only source proof", error);
        }
    }
}
