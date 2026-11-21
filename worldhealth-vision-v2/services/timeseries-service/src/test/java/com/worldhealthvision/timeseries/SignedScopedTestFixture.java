package com.worldhealthvision.timeseries;

import com.worldhealthvision.timeseries.service.SignedScopedPublicationDecision;
import java.security.KeyPair;
import java.security.KeyPairGenerator;
import java.security.MessageDigest;
import java.security.Signature;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.Base64;
import java.util.Collections;
import java.util.HexFormat;
import java.util.UUID;
import org.springframework.jdbc.core.JdbcTemplate;

/**
 * ONLY ephemeral CI geographic signer; deliberately separate from the
 * institutional licensing and original Bronze witness Ed25519 signers.
 * NO actual Insee values, rights, signatures or territorial approvals.
 */
final class SignedScopedTestFixture {
    private static final KeyPair KEY = generate();
    static final String META_SHA = "a".repeat(64);
    static final String LABEL = "SYNTHETIC TEST ONLY — France excluding fictional territory";
    static final String URL = "https://example.invalid/synthetic-geographic-metadata";
    static final String METHOD = "SYNTHETIC_QA_METHOD";
    static final String UNIT = "TEST_UNITS";
    static final String VERSION = "2025-A";
    private static final String KEY_SHA = hash(KEY.getPublic().getEncoded());

    private SignedScopedTestFixture() {}

    private static KeyPair generate() {
        try {
            return KeyPairGenerator.getInstance("Ed25519").generateKeyPair();
        } catch (Exception ex) {
            throw new IllegalStateException("Cannot generate test-only geography key", ex);
        }
    }

    private static String hash(byte[] data) {
        try {
            return HexFormat.of().formatHex(
                    MessageDigest.getInstance("SHA-256").digest(data));
        } catch (Exception ex) {
            throw new IllegalStateException(ex);
        }
    }

    static String publicKeyBase64() {
        return Base64.getEncoder().encodeToString(KEY.getPublic().getEncoded());
    }

    static UUID createScope(JdbcTemplate db, String nativeCode) {
        UUID id = UUID.randomUUID();
        db.update("""
                insert into timeseries.geographic_scope_registry (
                    id, source_code, dataset_code, native_geo_code,
                    native_geo_version, geo_reference_year, country_iso3,
                    coverage_kind, display_label, territorial_exclusions,
                    source_metadata_url, source_metadata_sha256
                ) values (
                    ?, 'WORLD_BANK','WDI', ?, ?, 2025, 'FRA',
                    'PARTIAL_COUNTRY', ?, '["FICTIONAL_TEST_REGION"]'::jsonb, ?, ?
                )
                """, id, nativeCode, VERSION, LABEL, URL, META_SHA);
        return id;
    }

    static SignedScopedPublicationDecision decision(
            UUID scopeId, UUID runId, String itemsSha, String indicator, String nativeCode) {
        return new SignedScopedPublicationDecision(
                UUID.randomUUID(), scopeId, runId, itemsSha,
                "WORLD_BANK", "WDI", indicator, "PUBLIC_SCOPED_WEB_DISPLAY",
                SignedTestRightsFixture.HTTP_SHA, META_SHA,
                METHOD, UNIT,
                LocalDate.parse("2024-01-01"), LocalDate.parse("2024-12-31"),
                OffsetDateTime.parse("2026-01-01T00:00:00Z"),
                OffsetDateTime.parse("2029-12-31T00:00:00Z"),
                OffsetDateTime.parse("2025-12-01T00:00:00Z"),
                "CI_GEO_REVIEWER_ONLY", "CI_GEO_COUNTERSIGNER_ONLY",
                LABEL, URL, nativeCode, VERSION, "FRA", "PARTIAL_COUNTRY",
                KEY_SHA, ""
        );
    }

    static String sign(SignedScopedPublicationDecision decision) {
        try {
            Signature signer = Signature.getInstance("Ed25519");
            signer.initSign(KEY.getPrivate());
            signer.update(decision.signingPayload());
            return Base64.getEncoder().encodeToString(signer.sign());
        } catch (Exception ex) {
            throw new IllegalStateException("Synthetic geography signature failure", ex);
        }
    }

    static UUID insert(JdbcTemplate db, SignedScopedPublicationDecision d) {
        return insertWithSignature(db, d, sign(d));
    }

    static UUID insertWithSignature(JdbcTemplate db, SignedScopedPublicationDecision d, String sig) {
        String columns = """
                decision_id, geographic_scope_id, source_run_id,
                attested_items_sha256, source_code, dataset_code,
                indicator_code, operation, original_http_sha256,
                source_metadata_sha256, methodology_code, unit_code,
                period_start, period_end, valid_from_utc, valid_until_utc,
                issued_at_utc, reviewer_id, countersigner_id,
                scope_metadata_label, scope_metadata_url,
                scope_native_code, scope_native_version, scope_country_iso3,
                scope_coverage_kind, signing_public_key_sha256, signature_base64
                """;
        String placeholders = String.join(",", Collections.nCopies(27, "?"));
        db.update("insert into timeseries.scoped_publication_decision (" + columns +
                ") values (" + placeholders + ")",
                d.decisionId(), d.geographicScopeId(), d.sourceRunId(),
                d.attestedItemsSha256(), d.sourceCode(), d.datasetCode(),
                d.indicatorCode(), d.operation(), d.originalHttpSha256(),
                d.sourceMetadataSha256(), d.methodologyCode(), d.unitCode(),
                d.periodStart(), d.periodEnd(), d.validFromUtc(), d.validUntilUtc(),
                d.issuedAtUtc(), d.reviewerId(), d.countersignerId(),
                d.scopeMetadataLabel(), d.scopeMetadataUrl(), d.scopeNativeCode(),
                d.scopeNativeVersion(), d.scopeCountryIso3(), d.scopeCoverageKind(),
                d.signingPublicKeySha256(), sig
        );
        return d.decisionId();
    }
}
