package com.worldhealthvision.timeseries.service;

import java.security.KeyFactory;
import java.security.MessageDigest;
import java.security.PublicKey;
import java.security.Signature;
import java.security.spec.X509EncodedKeySpec;
import java.time.OffsetDateTime;
import java.util.Base64;
import java.util.HexFormat;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

/** Independent externally provisioned geography Ed25519 PUBLIC key.
 * The service never receives a private signer key or trusts client keys. */
@Component
public final class ScopedPublicationSignatureVerifier {
    private final PublicKey trustedKey;
    private final String trustedKeySha256;

    public ScopedPublicationSignatureVerifier(
            @Value("$" + "{whv.timeseries.scope-trust-public-key-base64:}") String keyBase64
    ) {
        if (keyBase64 == null || keyBase64.isBlank()) {
            trustedKey = null;
            trustedKeySha256 = null;
            return;
        }
        try {
            byte[] key = Base64.getDecoder().decode(keyBase64);
            if (key.length < 32 || key.length > 256) {
                throw new IllegalArgumentException("Invalid scope trust anchor length");
            }
            trustedKey = KeyFactory.getInstance("Ed25519")
                    .generatePublic(new X509EncodedKeySpec(key));
            trustedKeySha256 = HexFormat.of().formatHex(
                    MessageDigest.getInstance("SHA-256").digest(key));
        } catch (Exception error) {
            throw new IllegalStateException(
                    "Configured scope public Ed25519 trust anchor is invalid", error);
        }
    }

    public boolean isConfigured() {
        return trustedKey != null && trustedKeySha256 != null;
    }

    public void requireAuthentic(SignedScopedPublicationDecision decision) {
        if (!isConfigured()
                || !trustedKeySha256.equals(decision.signingPublicKeySha256())
                || !"PUBLIC_SCOPED_WEB_DISPLAY".equals(decision.operation())
                || !decision.attestedItemsSha256().matches("[a-f0-9]{64}")
                || !decision.originalHttpSha256().matches("[a-f0-9]{64}")
                || !decision.sourceMetadataSha256().matches("[a-f0-9]{64}")
                || !decision.reviewerId().matches("[A-Za-z0-9_.:@-]{1,128}")
                || !decision.countersignerId().matches("[A-Za-z0-9_.:@-]{1,128}")
                || decision.reviewerId().equals(decision.countersignerId())
                || !decision.scopeCountryIso3().matches("[A-Z]{3}")
                || !decision.scopeNativeCode().matches("[A-Za-z0-9_.-]{1,96}")
                || !decision.scopeNativeVersion().matches("[A-Za-z0-9][A-Za-z0-9_.-]{0,63}")
                || !decision.methodologyCode().matches("[A-Za-z0-9_.-]{1,96}")
                || !decision.unitCode().matches("[A-Za-z0-9_.-]{1,64}")
                || !("PARTIAL_COUNTRY".equals(decision.scopeCoverageKind())
                     || "SUBNATIONAL".equals(decision.scopeCoverageKind()))
                || decision.scopeMetadataLabel().isBlank()
                || decision.scopeMetadataLabel().length() > 256
                || !decision.scopeMetadataUrl().startsWith("https://")
                || decision.scopeMetadataUrl().length() > 1024
                || decision.periodStart().isAfter(decision.periodEnd())
                || !decision.validFromUtc().isBefore(decision.validUntilUtc())
                || decision.issuedAtUtc().isAfter(decision.validFromUtc())
                || decision.validUntilUtc().isBefore(OffsetDateTime.now())) {
            throw new ScopedPublicationAuthorizationException();
        }
        try {
            byte[] sig = Base64.getDecoder().decode(decision.signatureBase64());
            if (sig.length != 64) throw new ScopedPublicationAuthorizationException();
            Signature check = Signature.getInstance("Ed25519");
            check.initVerify(trustedKey);
            check.update(decision.signingPayload());
            if (!check.verify(sig)) throw new ScopedPublicationAuthorizationException();
        } catch (ScopedPublicationAuthorizationException e) {
            throw e;
        } catch (Exception ignored) {
            throw new ScopedPublicationAuthorizationException();
        }
    }
}
