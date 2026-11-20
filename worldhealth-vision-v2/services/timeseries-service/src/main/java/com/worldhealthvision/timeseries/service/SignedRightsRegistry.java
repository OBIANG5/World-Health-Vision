package com.worldhealthvision.timeseries.service;

import com.worldhealthvision.timeseries.api.internal.dto.IngestionObservationBatchRequest;
import com.worldhealthvision.timeseries.api.internal.dto.IngestionObservationWriteRequest;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Set;
import java.util.UUID;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.stereotype.Component;

/**
 * Server-owned, POSITIVE and signature-checked license decision. There are
 * NO built-in grants, including World Bank, IBGE or noncommercial datasets.
 *
 * Exact scope: source, dataset, country, indicator, requested public/API
 * operation, exact original HTTP byte SHA and entire observation time span.
 * The source's asserted hash is NOT proof the bytes exist in the Bronze store:
 * that cross-service attestation is separately needed in DATA-1C-B2.
 *
 * Lock ordering is stable across an observation batch. Every selected grant
 * is SELECT ... FOR UPDATE until the enclosing @Transactional ingestion
 * commits; rights_revocation's DB trigger acquires the SAME lock before its
 * append-only tombstone. Checking tombstones happens only AFTER the lock in
 * a separate READ COMMITTED statement (new snapshot).
 */
@Component
public final class SignedRightsRegistry {
    private static final String PUBLIC_OPERATION = "PUBLIC_API_INGEST";
    private final JdbcClient database;
    private final RightsSignatureVerifier verifier;

    public SignedRightsRegistry(JdbcClient database, RightsSignatureVerifier verifier) {
        this.database = database;
        this.verifier = verifier;
    }

    private record Scope(String country, String indicator, LocalDate start, LocalDate end) {}

    public List<UUID> requireCurrentPublicIngestRights(IngestionObservationBatchRequest request) {
        // The claimed original HTTP SHA from the source manifest is necessary
        // but NEVER sufficient. A matching signed provider/reviewer decision is
        // required, and the receiver still blocks the unreviewed BRA pilot.
        Object shaField = request.notes() == null ? null : request.notes().get("httpBodySha256");
        if (!(shaField instanceof String httpSha)
                || !httpSha.matches("[a-f0-9]{64}")) {
            throw new RightsAuthorizationException();
        }

        List<Scope> scopes = request.items().stream()
                .map(i -> new Scope(
                        i.countryIso3(), i.indicatorCode(), i.periodStart(), i.periodEnd()
                ))
                .distinct()
                .sorted(Comparator.comparing(Scope::country)
                        .thenComparing(Scope::indicator)
                        .thenComparing(Scope::start)
                        .thenComparing(Scope::end))
                .toList();
        if (scopes.size() > 256 || scopes.isEmpty()) {
            throw new RightsAuthorizationException();
        }
        Set<UUID> approved = new LinkedHashSet<>();
        for (Scope scope : scopes) {
            // No wildcard country or indicator. A signatory must have
            // explicitly reviewed this concrete source/country/indicator.
            // Lock all candidate grants to serialize concurrent revocations.
            List<SignedRightsDecision> candidates = database.sql("""
                    select *
                    from timeseries.rights_decision
                    where source_code = :source
                      and dataset_code = :dataset
                      and country_iso3 = :country
                      and indicator_code = :indicator
                      and operation = :operation
                      and original_http_sha256 = :sourceSha
                      and period_start <= :periodStart
                      and period_end >= :periodEnd
                      and valid_from_utc <= clock_timestamp()
                      and valid_until_utc > clock_timestamp()
                    order by decision_id
                    for update
                    """)
                    .param("source", request.sourceCode())
                    .param("dataset", request.datasetCode())
                    .param("country", scope.country())
                    .param("indicator", scope.indicator())
                    .param("operation", PUBLIC_OPERATION)
                    .param("sourceSha", httpSha)
                    .param("periodStart", scope.start())
                    .param("periodEnd", scope.end())
                    .query(this::mapDecision).list();

            SignedRightsDecision selected = null;
            for (var candidate : candidates) {
                // Verify AFTER locking: the old grant may have been revoked
                // while this transaction was waiting to acquire its lock.
                boolean revoked = Boolean.TRUE.equals(database.sql("""
                        select exists (
                            select 1 from timeseries.rights_revocation
                            where decision_id = :id
                        )
                        """).param("id", candidate.id())
                        .query(Boolean.class).single());
                if (revoked) continue;
                verifier.requireAuthentic(candidate);
                if (selected != null) {
                    // Fail closed for two equally applicable active grants:
                    // no implicit priority, supersession or license blending.
                    throw new RightsAuthorizationException();
                }
                selected = candidate;
            }
            if (selected == null) {
                throw new RightsAuthorizationException();
            }
            approved.add(selected.id());
        }
        return List.copyOf(approved);
    }

    /**
     * Called after writing observations but before the SAME SQL transaction
     * commits. Recheck validity and revocation with a FRESH READ COMMITTED
     * snapshot; locks from requireCurrentPublicIngestRights are still held.
     */
    public void recheckAndLink(UUID sourceRunId, List<UUID> decisionIds) {
        recheck(decisionIds, sourceRunId);
    }

    public void recheckReplay(List<UUID> decisionIds) {
        recheck(decisionIds, null);
    }

    private void recheck(List<UUID> decisionIds, UUID sourceRunId) {
        if (decisionIds == null || decisionIds.isEmpty()) {
            throw new RightsAuthorizationException();
        }
        for (UUID decision : decisionIds) {
            Boolean valid = database.sql("""
                    select (
                        valid_from_utc <= clock_timestamp()
                        and valid_until_utc > clock_timestamp()
                        and not exists(
                            select 1 from timeseries.rights_revocation
                            where decision_id = :decision
                        )
                    )
                    from timeseries.rights_decision
                    where decision_id = :decision
                    """)
                    .param("decision", decision)
                    .query(Boolean.class).optional().orElse(false);
            if (!Boolean.TRUE.equals(valid)) {
                throw new RightsAuthorizationException();
            }
            // New source_run rights links are inserted in the SAME atomic
            // transaction as source_run and observations. An ordinary replay
            // still checks authorization but never rewrites historical links.
            if (sourceRunId != null) {
                database.sql("""
                        insert into timeseries.source_run_rights_decision(
                            source_run_id, decision_id
                        ) values (:sourceRunId, :decision)
                        """)
                        .param("sourceRunId", sourceRunId)
                        .param("decision", decision)
                        .update();
            }
        }
    }

    private SignedRightsDecision mapDecision(ResultSet rs, int row) throws SQLException {
        return new SignedRightsDecision(
                rs.getObject("decision_id", UUID.class),
                rs.getString("source_code"),
                rs.getString("dataset_code"),
                rs.getString("country_iso3").trim(),
                rs.getString("indicator_code"),
                rs.getString("operation"),
                rs.getString("original_http_sha256").trim(),
                rs.getObject("period_start", LocalDate.class),
                rs.getObject("period_end", LocalDate.class),
                rs.getObject("valid_from_utc", OffsetDateTime.class),
                rs.getObject("valid_until_utc", OffsetDateTime.class),
                rs.getObject("issued_at_utc", OffsetDateTime.class),
                rs.getString("reviewer_id"),
                rs.getString("countersigner_id"),
                rs.getString("license_identifier"),
                rs.getString("license_url"),
                rs.getString("license_text_sha256").trim(),
                rs.getString("attribution_text"),
                rs.getString("signing_public_key_sha256").trim(),
                rs.getString("signature_base64")
        );
    }
}
