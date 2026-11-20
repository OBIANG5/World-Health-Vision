package com.worldhealthvision.timeseries;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.worldhealthvision.timeseries.api.internal.dto.IngestionObservationBatchRequest;
import com.worldhealthvision.timeseries.service.SignedRightsDecision;
import com.worldhealthvision.timeseries.service.SignedRightsRegistry;
import java.nio.charset.StandardCharsets;
import java.time.OffsetDateTime;
import java.util.UUID;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.Executors;
import java.util.concurrent.TimeUnit;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.testcontainers.service.connection.ServiceConnection;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.MediaType;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.support.TransactionTemplate;
import org.testcontainers.containers.PostgreSQLContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;

/** Only ephemeral, signed CI approvals and synthetic GDP figures, no real license. */
@Testcontainers
@SpringBootTest
@AutoConfigureMockMvc
class SignedRightsRegistryIntegrationTest {
    private static final String ROUTE = "/internal/timeseries/ingestion/observation-batches";
    private static final String KEY = "integration-test-only-not-secret-0123456789abcdef";

    @Container @ServiceConnection
    static PostgreSQLContainer<?> postgres = new PostgreSQLContainer<>("postgres:16-alpine");

    @DynamicPropertySource
    static void ephemeralTestPublicKey(DynamicPropertyRegistry properties) {
        properties.add("whv.timeseries.rights-trust-public-key-base64",
                SignedTestRightsFixture::publicKeyBase64);
    }

    @Autowired JdbcTemplate jdbc;
    @Autowired MockMvc mockMvc;
    @Autowired ObjectMapper mapper;
    @Autowired SignedRightsRegistry rights;
    @Autowired PlatformTransactionManager transactions;

    private String newIndicator() {
        String code = "SYNTH.RIGHTS." + UUID.randomUUID().toString()
                .replace("-", "").substring(0, 12).toUpperCase();
        jdbc.update("""
                insert into catalog.indicator(code,display_name)
                values (?, 'Synthetic test-only indicator')
                """, code);
        return code;
    }

    private String newRunKey() {
        return "rights_ci_" + UUID.randomUUID();
    }

    private String request(String key, String indicator) {
        return """
                {"sourceCode":"WORLD_BANK","datasetCode":"WDI",
                 "runKey":"%s",
                 "fetchedAtUtc":"2026-11-20T08:00:00Z",
                 "bronzeRawPayloadPath":"test-only/fixture.http.json",
                 "bronzeNormalizedPayloadPath":"test-only/fixture.ndjson",
                 "recordCount":1,
                 "notes":{"httpBodySha256":"%s","claim":"SYNTHETIC_REVIEW_ONLY"},
                 "items":[{"indicatorCode":"%s","countryIso3":"FRA",
                           "periodGranularity":"ANNUAL",
                           "periodStart":"2024-01-01","periodEnd":"2024-12-31",
                           "periodLabel":"2024","numericValue":17.0,
                           "valueStatus":"OBSERVED",
                           "sourceMetadata":{"syntheticTestOnly":true},
                           "qualityFlags":[]}]}
                """.formatted(key, SignedTestRightsFixture.HTTP_SHA, indicator);
    }

    private org.springframework.test.web.servlet.request.MockHttpServletRequestBuilder authorizedHeader(
            String body
    ) {
        return post(ROUTE).contentType(MediaType.APPLICATION_JSON)
                .header("X-WHV-Ingestion-Key", KEY).content(body);
    }

    private int countRuns(String runKey) {
        return jdbc.queryForObject("select count(*) from timeseries.source_run where run_key=?",
                Integer.class, runKey);
    }

    @Test
    void noServerSideSignedDecisionMeans403EvenWithValidInternalKeyAndApprovedClaim() throws Exception {
        String ind = newIndicator(), key = newRunKey();
        String body = request(key, ind).replace(
                "\"SYNTHETIC_REVIEW_ONLY\"", "\"APPROVED\"");
        mockMvc.perform(authorizedHeader(body)).andExpect(status().isForbidden());
        assertEquals(0, countRuns(key));
    }

    @Test
    void preciselySignedScopeAllowsOneAtomicSyntheticRunAndLinksReviewEvidence() throws Exception {
        String ind = newIndicator(), key = newRunKey();
        UUID permission = SignedTestRightsFixture.insert(jdbc,
                SignedTestRightsFixture.defaultDecision("WORLD_BANK", "WDI", "FRA", ind));
        String body = request(key, ind);
        String result = mockMvc.perform(authorizedHeader(body))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.upsertedCount").value(1))
                .andReturn().getResponse().getContentAsString();
        String id = mapper.readTree(result).get("sourceRunId").asText();
        assertNotNull(id);
        assertEquals(1, countRuns(key));
        assertEquals(1, jdbc.queryForObject("""
                select count(*) from timeseries.source_run_rights_decision
                where source_run_id=? and decision_id=?
                """, Integer.class, UUID.fromString(id), permission));
        mockMvc.perform(authorizedHeader(body))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.upsertedCount").value(0));
        assertEquals(1, jdbc.queryForObject("""
                select count(*) from timeseries.source_run_rights_decision
                where source_run_id=?
                """, Integer.class, UUID.fromString(id)));
    }

    @Test
    void aGrantForWebDisplayCannotAuthorizePublicApiIngestion() throws Exception {
        String ind = newIndicator(), key = newRunKey();
        SignedTestRightsFixture.insert(jdbc, SignedTestRightsFixture.decision(
                "WORLD_BANK", "WDI", "FRA", ind, SignedTestRightsFixture.HTTP_SHA,
                "PUBLIC_WEB_DISPLAY", OffsetDateTime.parse("2029-12-31T00:00:00Z")));
        mockMvc.perform(authorizedHeader(request(key, ind))).andExpect(status().isForbidden());
        assertEquals(0, countRuns(key));
    }

    @Test
    void sourceBytesCountryPeriodOrIndicatorOutsideReviewCannotBeSilentlyReused() throws Exception {
        String ind = newIndicator();
        SignedTestRightsFixture.insert(jdbc,
                SignedTestRightsFixture.defaultDecision("WORLD_BANK", "WDI", "FRA", ind));
        String baseline = request(newRunKey(), ind);
        for (String variant : new String[] {
                baseline.replace(SignedTestRightsFixture.HTTP_SHA, "c".repeat(64)),
                baseline.replace("\"countryIso3\":\"FRA\"", "\"countryIso3\":\"DEU\""),
                baseline.replace("\"periodStart\":\"2024-01-01\"", "\"periodStart\":\"2030-01-01\"")
                        .replace("\"periodEnd\":\"2024-12-31\"", "\"periodEnd\":\"2030-12-31\"")
                        .replace("\"periodLabel\":\"2024\"", "\"periodLabel\":\"2030\""),
                baseline.replace("\"datasetCode\":\"WDI\"", "\"datasetCode\":\"IMF_PUBLIC_DATA\""),
                baseline.replace("\"indicatorCode\":\"" + ind + "\"",
                        "\"indicatorCode\":\"OTHER.SYNTHETIC\"")
        }) {
            String newKey = newRunKey();
            mockMvc.perform(authorizedHeader(variant.replace(
                    mapper.readTree(baseline).get("runKey").asText(), newKey
            ))).andExpect(status().isForbidden());
            assertEquals(0, countRuns(newKey));
        }
    }

    @Test
    void invalidEd25519SignatureIsNotEquivalentToAPermission() throws Exception {
        String ind = newIndicator(), key = newRunKey();
        SignedRightsDecision d = SignedTestRightsFixture.defaultDecision(
                "WORLD_BANK", "WDI", "FRA", ind);
        // 64 bytes of zeros encode as syntactically valid base64 but do not
        // verify against the committed, ephemeral test trust anchor.
        SignedTestRightsFixture.insertWithSignature(
                jdbc, d, java.util.Base64.getEncoder().encodeToString(new byte[64]));
        mockMvc.perform(authorizedHeader(request(key, ind)))
                .andExpect(status().isForbidden());
        assertEquals(0, countRuns(key));
    }

    @Test
    void expiredReviewFailsClosedAndCannotBeRevivedByPayloadFlag() throws Exception {
        String ind = newIndicator(), key = newRunKey();
        SignedTestRightsFixture.insert(jdbc, SignedTestRightsFixture.decision(
                "WORLD_BANK", "WDI", "FRA", ind, SignedTestRightsFixture.HTTP_SHA,
                "PUBLIC_API_INGEST", OffsetDateTime.parse("2025-02-01T00:00:00Z")));
        mockMvc.perform(authorizedHeader(request(key, ind).replace(
                "\"SYNTHETIC_REVIEW_ONLY\"", "\"APPROVED\"")))
                .andExpect(status().isForbidden());
        assertEquals(0, countRuns(key));
    }

    @Test
    void revokedOrContradictorySignedReviewIsBlockedWithoutErasingHistory() throws Exception {
        String ind = newIndicator(), key = newRunKey();
        UUID decision = SignedTestRightsFixture.insert(jdbc,
                SignedTestRightsFixture.defaultDecision("WORLD_BANK", "WDI", "FRA", ind));
        mockMvc.perform(authorizedHeader(request(key, ind))).andExpect(status().isOk());
        assertEquals(1, countRuns(key));
        // The public API is allowed to read a signed valid observation.
        mockMvc.perform(get("/api/timeseries/series")
                        .param("countryIso3", "FRA")
                        .param("indicatorCode", ind)
                        .param("sourceCode", "WORLD_BANK"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.count").value(1));
        jdbc.update("""
                insert into timeseries.rights_revocation(decision_id,operator_id,reason_code)
                values (?, 'CI_REVOKER', 'SYNTHETIC_REVIEW_WITHDRAWN')
                """, decision);
        // Replays must re-evaluate the CURRENT decision, even if source
        // run identity and its immutable hash are unchanged.
        mockMvc.perform(authorizedHeader(request(key, ind)))
                .andExpect(status().isForbidden());
        // Revocation must take effect on PUBLIC READS, not just future writes.
        mockMvc.perform(get("/api/timeseries/series")
                        .param("countryIso3", "FRA")
                        .param("indicatorCode", ind)
                        .param("sourceCode", "WORLD_BANK"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.count").value(0));
        mockMvc.perform(get("/api/timeseries/source-runs")
                        .param("sourceCode", "WORLD_BANK")
                        .param("datasetCode", "WDI"))
                .andExpect(status().isOk());
        assertEquals(1, jdbc.queryForObject("""
                select count(*) from timeseries.observation o
                join timeseries.source_run sr on sr.id=o.source_run_id
                where sr.run_key=?
                """, Integer.class, key));
        assertEquals(1, countRuns(key));
        assertEquals(1, jdbc.queryForObject("""
                select count(*) from timeseries.source_run_rights_decision
                where decision_id=?
                """, Integer.class, decision));
        assertThrows(DataIntegrityViolationException.class, () -> jdbc.update("""
                update timeseries.rights_decision set attribution_text='FORGED'
                where decision_id=?
                """, decision));
        assertThrows(DataIntegrityViolationException.class, () -> jdbc.update("""
                delete from timeseries.rights_revocation where decision_id=?
                """, decision));
    }

    @Test
    void twoOverlappingSignedApprovalsAreAmbiguousAndMustNotBeBlended() throws Exception {
        String ind = newIndicator(), key = newRunKey();
        SignedTestRightsFixture.insert(jdbc,
                SignedTestRightsFixture.defaultDecision("WORLD_BANK", "WDI", "FRA", ind));
        SignedTestRightsFixture.insert(jdbc,
                SignedTestRightsFixture.decision("WORLD_BANK", "WDI", "FRA", ind,
                        SignedTestRightsFixture.HTTP_SHA, "PUBLIC_API_INGEST",
                        OffsetDateTime.parse("2028-12-31T00:00:00Z")));
        mockMvc.perform(authorizedHeader(request(key, ind)))
                .andExpect(status().isForbidden());
        assertEquals(0, countRuns(key));
    }

    @Test
    void revokerWaitsForIngestApprovalRowLockThenFutureIngestIsDenied() throws Exception {
        String ind = newIndicator(), key = newRunKey();
        UUID id = SignedTestRightsFixture.insert(jdbc,
                SignedTestRightsFixture.defaultDecision("WORLD_BANK", "WDI", "FRA", ind));
        var dto = mapper.readValue(request(key, ind), IngestionObservationBatchRequest.class);
        CountDownLatch reviewLocked = new CountDownLatch(1);
        CountDownLatch releaseReview = new CountDownLatch(1);
        CountDownLatch revokerStarted = new CountDownLatch(1);
        try (var pool = Executors.newFixedThreadPool(2)) {
            var currentIngest = pool.submit(() -> {
                new TransactionTemplate(transactions).executeWithoutResult(status -> {
                    var approved = rights.requireCurrentPublicIngestRights(dto);
                    assertEquals(1, approved.size());
                    reviewLocked.countDown();
                    try {
                        assertTrue(releaseReview.await(8, TimeUnit.SECONDS));
                    } catch (InterruptedException e) {
                        Thread.currentThread().interrupt();
                        throw new RuntimeException(e);
                    }
                    rights.recheckReplay(approved);
                });
                return 1;
            });
            assertTrue(reviewLocked.await(8, TimeUnit.SECONDS));
            var revoker = pool.submit(() -> {
                revokerStarted.countDown();
                return jdbc.update("""
                        insert into timeseries.rights_revocation (
                            decision_id,operator_id,reason_code
                        ) values (?, 'CI_SERIALIZER', 'SYNTHETIC_REVOKED_IN_RACE')
                        """, id);
            });
            assertTrue(revokerStarted.await(8, TimeUnit.SECONDS));
            Thread.sleep(120);
            assertFalse(revoker.isDone(), "Revoker must block until ingest releases same row lock");
            releaseReview.countDown();
            assertEquals(1, currentIngest.get(8, TimeUnit.SECONDS));
            assertEquals(1, revoker.get(8, TimeUnit.SECONDS));
        }
        mockMvc.perform(authorizedHeader(request(key, ind)))
                .andExpect(status().isForbidden());
        assertEquals(0, countRuns(key));
    }

    @Test
    void oldUnattestedSourceRunsRemainStoredButInvisibleInPublicResponses() throws Exception {
        String indicator = newIndicator(), key = newRunKey();
        UUID runId = UUID.randomUUID();
        // Simulate V1 archive data with no signed grant and no rights link.
        jdbc.update("""
                insert into timeseries.source_run (
                    id, source_code, dataset_code, run_key, fetched_at_utc,
                    record_count, status, notes
                ) values (?, 'WORLD_BANK', 'WDI', ?, ?, 1, 'PERSISTED',
                          '{"httpBodySha256":"bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb"}'::jsonb)
                """, runId, key, OffsetDateTime.parse("2026-11-20T00:00:00Z"));
        jdbc.update("""
                insert into timeseries.observation (
                    id,source_run_id,source_code,dataset_code,indicator_code,
                    country_iso3,period_granularity,period_start,period_end,
                    period_label,numeric_value,value_status
                ) values (?, ?, 'WORLD_BANK', 'WDI', ?, 'FRA', 'ANNUAL',
                          '2024-01-01', '2024-12-31', '2024', 17.0, 'OBSERVED')
                """, UUID.randomUUID(), runId, indicator);
        assertEquals(1, jdbc.queryForObject("""
                select count(*) from timeseries.observation where source_run_id=?
                """, Integer.class, runId));
        mockMvc.perform(get("/api/timeseries/series")
                        .param("countryIso3", "FRA")
                        .param("indicatorCode", indicator))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.count").value(0));
        var publicRuns = mapper.readTree(mockMvc.perform(get("/api/timeseries/source-runs")
                        .param("sourceCode", "WORLD_BANK")
                        .param("datasetCode", "WDI"))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString());
        for (var item : publicRuns.get("items")) {
            assertFalse(item.get("runKey").asText().equals(key),
                    "Unreviewed historical source-run must not leak through public provenance listing");
        }
    }

    @Test
    void noConfiguredTrustAnchorCannotTurnUnsignedClaimsIntoAPermission() throws Exception {
        String ind = newIndicator();
        SignedRightsDecision d = SignedTestRightsFixture.defaultDecision(
                "WORLD_BANK", "WDI", "FRA", ind);
        var noTrust = new com.worldhealthvision.timeseries.service.RightsSignatureVerifier("");
        assertThrows(com.worldhealthvision.timeseries.service.RightsAuthorizationException.class,
                () -> noTrust.requireAuthentic(d));
        assertThrows(IllegalStateException.class,
                () -> new com.worldhealthvision.timeseries.service.RightsSignatureVerifier(
                        "malformed-not-an-ed25519-public-key"));
    }

}
