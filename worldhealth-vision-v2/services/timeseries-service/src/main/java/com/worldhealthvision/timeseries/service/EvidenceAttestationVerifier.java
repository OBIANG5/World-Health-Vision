package com.worldhealthvision.timeseries.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.worldhealthvision.timeseries.api.internal.dto.IngestionObservationBatchRequest;
import java.nio.charset.StandardCharsets;
import java.security.KeyFactory;
import java.security.MessageDigest;
import java.security.PublicKey;
import java.security.Signature;
import java.security.spec.X509EncodedKeySpec;
import java.time.Instant;
import java.util.Base64;
import java.util.HexFormat;
import java.util.Map;
import java.util.Set;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

/**
 * Independent source-evidence signature verification in the receiver.
 *
 * A caller's X-WHV-Ingestion-Key authenticates a legacy transport only; it
 * cannot mint a Bronze attestation. The Ed25519 private witness key is held
 * out of process and NEVER on Timeseries. No trust anchor means DENY ALL
 * public writes; the old public reads are handled by their SQL rights gate.
 *
 * The witness must attest ACTUAL verified Bronze raw/normalized/manifest
 * bytes and journal SUCCESS. Java re-derives the SHA of every submitted
 * observation including values, metadata and flags. Signed SHA alone never
 * proves source ownership: witness trust and source audit remain necessary.
 */
@Component
public final class EvidenceAttestationVerifier {
    private static final String SCHEMA = "WORLD_VISION_BRONZE_WITNESS_V2";
    private static final String SEMANTIC_VERSION = "WORLD_VISION_SEMANTIC_POPULATION_REPLAY_V1";
    private static final String OPERATION = "PUBLIC_API_INGEST";
    private static final Set<String> FIELDS = Set.of(
            "schema", "operation", "sourceCode", "datasetCode", "runKey",
            "fetchedAtEpochSec", "fetchedAtNano", "originalHttpSha256", "normalizedNdjsonSha256",
            "manifestSha256", "acquisitionEventId", "acquisitionOutcomeSha256",
            "itemsSha256", "semanticVerifierVersion", "semanticVerifierCodeSha256",
            "issuedAtEpochSec", "expiresAtEpochSec",
            "signingPublicKeySha256", "signatureBase64"
    );

    private final PublicKey trustKey;
    private final String trustKeySha256;
    private final String trustedSemanticCodeSha256;
    private final ObjectMapper mapper;
    private final EvidenceItemsFingerprint projection;

    public EvidenceAttestationVerifier(
            @Value("${whv.timeseries.evidence-trust-public-key-base64:}") String configuredPublicKey,
            @Value("${whv.timeseries.semantic-replay-code-sha256:}") String configuredSemanticCodeSha256,
            ObjectMapper mapper, EvidenceItemsFingerprint projection
    ) {
        this.mapper = mapper;
        this.trustedSemanticCodeSha256 = configuredSemanticCodeSha256 == null
                ? "" : configuredSemanticCodeSha256;
        if (!trustedSemanticCodeSha256.isBlank()
                && !trustedSemanticCodeSha256.matches("[0-9a-f]{64}")) {
            throw new IllegalStateException("Invalid pinned independent semantic verifier SHA");
        }
        this.projection = projection;
        if (configuredPublicKey == null || configuredPublicKey.isBlank()) {
            trustKey = null;
            trustKeySha256 = null;
            return;
        }
        try {
            byte[] encoded = Base64.getDecoder().decode(configuredPublicKey);
            if (encoded.length < 32 || encoded.length > 256) {
                throw new IllegalArgumentException("Invalid witness trust key size");
            }
            trustKey = KeyFactory.getInstance("Ed25519")
                    .generatePublic(new X509EncodedKeySpec(encoded));
            trustKeySha256 = HexFormat.of().formatHex(
                    MessageDigest.getInstance("SHA-256").digest(encoded));
        } catch (Exception exception) {
            throw new IllegalStateException("Invalid server-provisioned witness trust anchor", exception);
        }
    }

    public SignedEvidenceAttestation requireSourceProof(
            IngestionObservationBatchRequest request
    ) {
        if (trustKey == null || trustKeySha256 == null
                || !trustedSemanticCodeSha256.matches("[0-9a-f]{64}")
                || request.notes() == null
                || !(request.notes().get("evidenceAttestation") instanceof Map<?, ?> raw)
                || !raw.keySet().equals(FIELDS)) {
            throw new EvidenceAttestationException();
        }
        try {
            SignedEvidenceAttestation token = mapper.convertValue(raw, SignedEvidenceAttestation.class);
            if (request.recordCount() == null
                    || request.recordCount() != request.items().size()) {
                throw new EvidenceAttestationException();
            }
            long now = Instant.now().getEpochSecond();
            if (!SCHEMA.equals(token.schema())
                    || !OPERATION.equals(token.operation())
                    || !request.sourceCode().equals(token.sourceCode())
                    || !request.datasetCode().equals(token.datasetCode())
                    || !request.runKey().equals(token.runKey())
                    || request.fetchedAtUtc().toInstant().getEpochSecond() != token.fetchedAtEpochSec()
                    || request.fetchedAtUtc().toInstant().getNano() != token.fetchedAtNano()
                    || !trustKeySha256.equals(token.signingPublicKeySha256())
                    || !equalsHex(request.notes().get("httpBodySha256"), token.originalHttpSha256(), 64)
                    || !equalsHex(request.notes().get("normalizedNdjsonSha256"), token.normalizedNdjsonSha256(), 64)
                    || !equalsHex(request.notes().get("manifestSha256"), token.manifestSha256(), 64)
                    || !equalsHex(request.notes().get("acquisitionEventId"), token.acquisitionEventId(), 32)
                    || !equalsHex(request.notes().get("acquisitionOutcomeSha256"), token.acquisitionOutcomeSha256(), 64)
                    || !token.itemsSha256().matches("[a-f0-9]{64}")
                    || !token.itemsSha256().equals(projection.calculate(request))
                    || !SEMANTIC_VERSION.equals(token.semanticVerifierVersion())
                    || !trustedSemanticCodeSha256.equals(token.semanticVerifierCodeSha256())
                    || token.issuedAtEpochSec() > now + 5
                    || token.issuedAtEpochSec() < now - 600
                    || token.expiresAtEpochSec() <= now
                    || token.expiresAtEpochSec() - token.issuedAtEpochSec() > 600
                    || token.expiresAtEpochSec() <= token.issuedAtEpochSec()) {
                throw new EvidenceAttestationException();
            }

            byte[] signature = Base64.getDecoder().decode(token.signatureBase64());
            if (signature.length != 64) {
                throw new EvidenceAttestationException();
            }
            Signature check = Signature.getInstance("Ed25519");
            check.initVerify(trustKey);
            check.update(token.signingPayload());
            if (!check.verify(signature)) {
                throw new EvidenceAttestationException();
            }
            return token;
        } catch (EvidenceAttestationException denied) {
            throw denied;
        } catch (Exception unexpected) {
            // Never forward reflection, cryptography, bad metadata or stack
            // traces to an untrusted HTTP client.
            throw new EvidenceAttestationException();
        }
    }

    private static boolean equalsHex(Object supplied, String expected, int size) {
        return supplied instanceof String actual
                && expected != null
                && actual.matches("[a-f0-9]{" + size + "}")
                && actual.equals(expected);
    }
}
