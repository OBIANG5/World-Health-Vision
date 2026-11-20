package com.worldhealthvision.timeseries;

import com.worldhealthvision.timeseries.service.SignedRightsDecision;
import java.nio.charset.StandardCharsets;
import java.security.KeyPair;
import java.security.KeyPairGenerator;
import java.security.MessageDigest;
import java.security.Signature;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.Base64;
import java.util.HexFormat;
import java.util.UUID;
import org.springframework.jdbc.core.JdbcTemplate;

/**
 * TEST-ONLY ephemeral Ed25519 signer. Generates a random key in CI process
 * memory. The private key is NEVER committed, exported, logged or configured
 * in the application. Grants refer to wholly synthetic FRA/DEU observations:
 * they are NOT licenses for actual World Bank or IMF information.
 */
final class SignedTestRightsFixture {
    static final String HTTP_SHA = "b".repeat(64);
    static final String LICENSE_SHA = "a".repeat(64);
    private static final KeyPair KEY = generate();
    private static final String PUBLIC_SHA = digest(KEY.getPublic().getEncoded());

    private SignedTestRightsFixture() {}

    private static KeyPair generate() {
        try {
            var generator = KeyPairGenerator.getInstance("Ed25519");
            return generator.generateKeyPair();
        } catch (Exception ex) {
            throw new IllegalStateException("Cannot construct ephemeral CI test key", ex);
        }
    }

    static String publicKeyBase64() {
        return Base64.getEncoder().encodeToString(KEY.getPublic().getEncoded());
    }

    private static String digest(byte[] bytes) {
        try {
            return HexFormat.of().formatHex(
                    MessageDigest.getInstance("SHA-256").digest(bytes));
        } catch (Exception ex) {
            throw new IllegalStateException(ex);
        }
    }

    static SignedRightsDecision decision(
            String source, String dataset, String country, String indicator,
            String httpSha, String operation, OffsetDateTime validUntil
    ) {
        UUID id = UUID.randomUUID();
        return new SignedRightsDecision(
                id, source, dataset, country, indicator, operation, httpSha,
                LocalDate.parse("2020-01-01"), LocalDate.parse("2027-12-31"),
                OffsetDateTime.parse("2025-01-01T00:00:00Z"), validUntil,
                OffsetDateTime.parse("2024-12-01T00:00:00Z"),
                "CI_REVIEWER_SYNTHETIC", "CI_COUNTERSIGNER_SYNTHETIC",
                "CI_SYNTHETIC_NO_PROVIDER_LICENSE",
                "https://example.invalid/synthetic-source-license",
                LICENSE_SHA, "Synthetic CI fixture only; not source permission",
                PUBLIC_SHA, ""
        );
    }

    static SignedRightsDecision defaultDecision(
            String source, String dataset, String country, String indicator
    ) {
        var base = decision(source, dataset, country, indicator, HTTP_SHA,
                "PUBLIC_API_INGEST", OffsetDateTime.parse("2029-12-31T00:00:00Z"));
        var stableId = UUID.nameUUIDFromBytes(
                ("CI_ONLY/" + source + "/" + dataset + "/" + country + "/" + indicator)
                        .getBytes(StandardCharsets.UTF_8));
        return new SignedRightsDecision(
                stableId, base.sourceCode(), base.datasetCode(), base.countryIso3(),
                base.indicatorCode(), base.operation(), base.originalHttpSha256(),
                base.periodStart(), base.periodEnd(), base.validFromUtc(),
                base.validUntilUtc(), base.issuedAtUtc(), base.reviewerId(),
                base.countersignerId(), base.licenseIdentifier(), base.licenseUrl(),
                base.licenseTextSha256(), base.attributionText(),
                base.signingPublicKeySha256(), ""
        );
    }

    static String sign(SignedRightsDecision unsigned) {
        try {
            Signature signature = Signature.getInstance("Ed25519");
            signature.initSign(KEY.getPrivate());
            signature.update(unsigned.signingPayload());
            return Base64.getEncoder().encodeToString(signature.sign());
        } catch (Exception ex) {
            throw new IllegalStateException("Cannot sign synthetic test rights", ex);
        }
    }

    static UUID insert(JdbcTemplate db, SignedRightsDecision unsigned) {
        return insertWithSignature(db, unsigned, sign(unsigned));
    }

    static UUID insertWithSignature(
            JdbcTemplate db, SignedRightsDecision d, String signature
    ) {
        db.update("""
                insert into timeseries.rights_decision (
                    decision_id, source_code, dataset_code, country_iso3,
                    indicator_code, operation, original_http_sha256,
                    period_start, period_end, valid_from_utc, valid_until_utc,
                    issued_at_utc, reviewer_id, countersigner_id,
                    license_identifier, license_url, license_text_sha256,
                    attribution_text, signing_public_key_sha256, signature_base64
                ) values (
                    ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?,
                    ?, ?, ?, ?, ?, ?, ?, ?, ?
                )
                on conflict (decision_id) do nothing
                """, d.id(), d.sourceCode(), d.datasetCode(), d.countryIso3(),
                d.indicatorCode(), d.operation(), d.originalHttpSha256(),
                d.periodStart(), d.periodEnd(), d.validFromUtc(), d.validUntilUtc(),
                d.issuedAtUtc(), d.reviewerId(), d.countersignerId(),
                d.licenseIdentifier(), d.licenseUrl(), d.licenseTextSha256(),
                d.attributionText(), d.signingPublicKeySha256(), signature);
        return d.id();
    }

    static void authorizeExistingSyntheticFixtures(JdbcTemplate db) {
        insert(db, defaultDecision("WORLD_BANK", "WDI", "FRA", "NY.GDP.MKTP.CD"));
        insert(db, defaultDecision("WORLD_BANK", "WDI", "DEU", "NY.GDP.MKTP.CD"));
        insert(db, defaultDecision("WORLD_BANK", "WDI", "FRA", "SP.POP.TOTL"));
        insert(db, defaultDecision("IMF", "IMF_PUBLIC_DATA", "FRA", "NY.GDP.MKTP.CD"));
    }
}
