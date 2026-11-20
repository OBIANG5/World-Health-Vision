package com.worldhealthvision.timeseries.service;

import java.security.KeyFactory;
import java.security.MessageDigest;
import java.security.PublicKey;
import java.security.Signature;
import java.security.spec.X509EncodedKeySpec;
import java.util.Base64;
import java.util.HexFormat;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

/**
 * Only a server-provisioned, out-of-band Ed25519 trust anchor is accepted.
 * A caller's submitted key, "APPROVED" string or dataset metadata can never
 * authorize its own publishing. An unsigned registry row is never trusted.
 *
 * Empty key = read-only Timeseries service, all NEW data publication denied.
 * No signing private key exists in the service; rotation requires reviewed
 * change management, not a token provided by an ingestion caller.
 */
@Component
public final class RightsSignatureVerifier {
    private final PublicKey verificationKey;
    private final String trustedKeySha256;

    public RightsSignatureVerifier(
            @Value("${whv.timeseries.rights-trust-public-key-base64:}") String encodedPublicKey
    ) {
        if (encodedPublicKey == null || encodedPublicKey.isBlank()) {
            verificationKey = null;
            trustedKeySha256 = null;
            return;
        }
        try {
            byte[] decoded = Base64.getDecoder().decode(encodedPublicKey);
            if (decoded.length < 32 || decoded.length > 256) {
                throw new IllegalArgumentException("Invalid trust anchor length");
            }
            verificationKey = KeyFactory.getInstance("Ed25519")
                    .generatePublic(new X509EncodedKeySpec(decoded));
            trustedKeySha256 = HexFormat.of().formatHex(
                    MessageDigest.getInstance("SHA-256").digest(decoded));
        } catch (Exception exception) {
            throw new IllegalStateException(
                    "Configured rights verifier trust anchor is invalid; refusing to start.", exception);
        }
    }

    public void requireAuthentic(SignedRightsDecision decision) {
        if (verificationKey == null || trustedKeySha256 == null
                || !trustedKeySha256.equals(decision.signingPublicKeySha256())
                || decision.reviewerId().isBlank()
                || decision.countersignerId().isBlank()
                || decision.reviewerId().equals(decision.countersignerId())
                || !decision.operation().equals("PUBLIC_API_INGEST")
                || !decision.originalHttpSha256().matches("[0-9a-f]{64}")
                || !decision.licenseTextSha256().matches("[0-9a-f]{64}")
                || !decision.licenseUrl().startsWith("https://")
                || decision.licenseIdentifier().isBlank()
                || decision.attributionText().isBlank()) {
            throw new RightsAuthorizationException();
        }
        try {
            byte[] signatureBytes = Base64.getDecoder().decode(decision.signatureBase64());
            if (signatureBytes.length != 64) {
                throw new RightsAuthorizationException();
            }
            Signature verifier = Signature.getInstance("Ed25519");
            verifier.initVerify(verificationKey);
            verifier.update(decision.signingPayload());
            if (!verifier.verify(signatureBytes)) {
                throw new RightsAuthorizationException();
            }
        } catch (RightsAuthorizationException rejected) {
            throw rejected;
        } catch (Exception exception) {
            // Do not reveal a signature, license text, key, or data to clients.
            throw new RightsAuthorizationException();
        }
    }
}
