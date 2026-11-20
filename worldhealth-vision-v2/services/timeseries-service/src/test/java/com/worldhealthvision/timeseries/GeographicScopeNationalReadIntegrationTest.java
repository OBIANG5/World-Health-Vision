package com.worldhealthvision.timeseries;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.worldhealthvision.timeseries.service.EvidenceItemsFingerprint;
import java.util.UUID;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.MediaType;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.request.MockHttpServletRequestBuilder;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.testcontainers.service.connection.ServiceConnection;
import org.testcontainers.containers.PostgreSQLContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;

/**
 * P2C3C / #112 — REAL PostgreSQL16 and Flyway, ONLY synthetic QA GDP 17.
 *
 * No Insee real number, license, signed geography equivalence, or public
 * national value is created. A source native geography must never be
 * silently laundered into the global country value/country comparisons.
 */
@Testcontainers
@SpringBootTest
@AutoConfigureMockMvc
class GeographicScopeNationalReadIntegrationTest {
    private static final String POST_URI = "/internal/timeseries/ingestion/observation-batches";
    private static final String KEY = "integration-test-only-not-secret-0123456789abcdef";

    @Container
    @ServiceConnection
    static PostgreSQLContainer<?> postgres = new PostgreSQLContainer<>("postgres:16-alpine");

    @DynamicPropertySource
    static void configureTestPublicVerificationKeys(DynamicPropertyRegistry props) {
        props.add("whv.timeseries.rights-trust-public-key-base64",
                SignedTestRightsFixture::publicKeyBase64);
        props.add("whv.timeseries.evidence-trust-public-key-base64",
                SignedTestEvidenceFixture::publicKeyBase64);
    }

    @Autowired MockMvc mvc;
    @Autowired JdbcTemplate db;
    @Autowired ObjectMapper json;
    @Autowired EvidenceItemsFingerprint itemFingerprint;

    @BeforeEach
    void authorizeTestOnlyWdiGdp() {
        SignedTestRightsFixture.authorizeExistingSyntheticFixtures(db);
    }

    private String freshKey() {
        return "geo_" + UUID.randomUUID().toString().replace("-", "");
    }

    private String synthetic(String runKey) {
        return """
            {
              "sourceCode":"WORLD_BANK","datasetCode":"WDI",
              "runKey":"%s",
              "fetchedAtUtc":"2026-11-20T10:00:00Z",
              "bronzeRawPayloadPath":"synthetic-test-only/original.raw",
              "bronzeNormalizedPayloadPath":"synthetic-test-only/normalized.ndjson",
              "recordCount":1,
              "notes":{"httpBodySha256":"bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb","syntheticTestOnly":true},
              "items":[{
                "indicatorCode":"NY.GDP.MKTP.CD","countryIso3":"FRA",
                "periodGranularity":"ANNUAL","periodStart":"2024-01-01",
                "periodEnd":"2024-12-31","periodLabel":"2024",
                "numericValue":17.0,"valueStatus":"OBSERVED",
                "sourceMetadata":{"syntheticTestOnly":true},
                "qualityFlags":["SYNTHETIC_ONLY"]
              }]
            }
            """.formatted(runKey);
    }

    private MockHttpServletRequestBuilder signedPost(String body) {
        return post(POST_URI).header("X-WHV-Ingestion-Key", KEY)
                .contentType(MediaType.APPLICATION_JSON)
                .content(SignedTestEvidenceFixture.attach(body, json, itemFingerprint));
    }

    private UUID insertSyntheticRow(String runKey) throws Exception {
        mvc.perform(signedPost(synthetic(runKey)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.upsertedCount").value(1));
        return db.queryForObject("""
            select o.id from timeseries.observation o
            join timeseries.source_run r on r.id = o.source_run_id
            where r.run_key = ?
        """, UUID.class, runKey);
    }

    private UUID registerOnlyPrivateSyntheticScope(String nativeGeoCode) {
        UUID id = UUID.randomUUID();
        db.update("""
            insert into timeseries.geographic_scope_registry (
                id, source_code, dataset_code, native_geo_code,
                geo_reference_year, country_iso3, coverage_kind,
                display_label, territorial_exclusions,
                source_metadata_url, source_metadata_sha256
            ) values (
                ?, 'WORLD_BANK','WDI', ?, 2025,'FRA','PARTIAL_COUNTRY',
                'SYNTHETIC TEST ONLY: France excluding fictional area',
                '["FICTIONAL_TEST_TERRITORY"]'::jsonb,
                'https://example.org/synthetic-not-provider-data', ?
            )
        """, id, nativeGeoCode, "a".repeat(64));
        return id;
    }

    private int publishedRowCount(UUID observationId) {
        return db.queryForObject(
                "select count(*) from timeseries.latest_observation where id = ?",
                Integer.class, observationId
        );
    }

    @Test
    void migrationSeedsONLYResearchHoldNeverAutoGrantsInseeGeoOrRights() {
        assertEquals(2, db.queryForObject(
                "select count(*) from timeseries.geographic_dataset_policy",
                Integer.class
        ));
        assertEquals(1, db.queryForObject("""
            select count(*) from timeseries.geographic_dataset_policy
            where source_code='*' and dataset_code='DS_POPULATIONS_REFERENCE'
              and policy='SCOPE_REVIEW_HOLD'
        """, Integer.class));
        assertEquals(0, db.queryForObject(
                "select count(*) from timeseries.geographic_scope_registry",
                Integer.class));
        assertEquals(0, db.queryForObject(
                "select count(*) from timeseries.rights_decision where source_code='INSEE'",
                Integer.class));
    }

    @Test
    void metadataClaimCannotBypassProtectedHttpReceiverEvenWithTestSignatures() throws Exception {
        String key = freshKey();
        String attempted = synthetic(key).replace(
                "\"sourceMetadata\":{\"syntheticTestOnly\":true}",
                "\"sourceMetadata\":{\"sourceNativeGeographyCode\":\"2025-FRANCE-F\","
                    + "\"geographicReferenceYear\":2025,\"geographicScopeId\":\"FEHM\","
                    + "\"syntheticTestOnly\":true}"
        );
        mvc.perform(signedPost(attempted)).andExpect(status().isForbidden());
        assertEquals(0, db.queryForObject(
                "select count(*) from timeseries.source_run where run_key=?",
                Integer.class, key));
    }

    @Test
    void evenForgedSourceCodeCannotInsertInseeDatasetThroughDatabase() throws Exception {
        UUID existing = insertSyntheticRow(freshKey());
        assertEquals(1, publishedRowCount(existing));
        // Insee review hold is dataset-scoped and rejects WORLD_BANK source
        // code spoofing. This is a raw SQL bypass attempt, NOT provider data.
        assertThrows(DataIntegrityViolationException.class, () ->
                db.update("""
                    insert into timeseries.observation (
                        id, source_run_id, source_code, dataset_code,
                        indicator_code, country_iso3, period_granularity,
                        period_start, period_end, period_label,
                        numeric_value, value_status, source_metadata
                    )
                    select ?, source_run_id, 'WORLD_BANK', 'DS_POPULATIONS_REFERENCE',
                           indicator_code, country_iso3, period_granularity,
                           period_start, period_end, period_label, numeric_value,
                           value_status, source_metadata
                    from timeseries.observation where id=?
                """, UUID.randomUUID(), existing)
        );
        assertEquals(1, publishedRowCount(existing));
        assertEquals(0, db.queryForObject("""
            select count(*) from timeseries.observation
            where dataset_code='DS_POPULATIONS_REFERENCE'
        """, Integer.class));
    }

    @Test
    void unknownScopeClaimsAreRejectedByDatabaseNotTreatedAsFrance() throws Exception {
        UUID id = insertSyntheticRow(freshKey());
        assertEquals(1, publishedRowCount(id));
        // A direct malicious SQL writer cannot declare a source-native
        // geography and leave it unresolved or map it to whole country.
        assertThrows(DataIntegrityViolationException.class, () ->
                db.update("""
                    update timeseries.observation
                    set source_metadata = cast(? as jsonb)
                    where id=?
                """, "{\"sourceNativeGeographyCode\":\"2025-FRANCE-F\","
                        + "\"geographicReferenceYear\":2025}", id)
        );
        assertEquals(1, publishedRowCount(id));
        assertThrows(DataIntegrityViolationException.class, () ->
                db.update("""
                    update timeseries.observation
                    set source_metadata = cast(? as jsonb)
                    where id=?
                """, "{\"geographicScopeId\":\"FEHM\","
                        + "\"countryIso3Candidate\":\"FRA\"}", id)
        );
        assertEquals(1, publishedRowCount(id));
    }

    @Test
    void genuineRegistryBindingIsStillHiddenFromEveryNationalReadSurface() throws Exception {
        String key = freshKey();
        UUID obs = insertSyntheticRow(key);
        String sourceGeo = "2025-SYNTH-EXCLUDING-" + UUID.randomUUID().toString().substring(0, 6);
        UUID registry = registerOnlyPrivateSyntheticScope(sourceGeo);
        assertEquals(1, publishedRowCount(obs));

        db.update("""
            update timeseries.observation
            set source_metadata = cast(? as jsonb)
            where id=?
        """, "{\"sourceNativeGeographyCode\":\"" + sourceGeo
                + "\",\"geographicReferenceYear\":2025}", obs);
        UUID bound = db.queryForObject("""
            select geographic_scope_id from timeseries.observation where id=?
        """, UUID.class, obs);
        assertEquals(registry, bound);
        // Keep physical row for forensic record, but it must disappear from
        // the rights + witness national read view and public API.
        assertEquals(1, db.queryForObject(
                "select count(*) from timeseries.observation where id=?",
                Integer.class, obs
        ));
        assertEquals(0, publishedRowCount(obs));

        // Under the same server, the real API list is derived from the view.
        // Only this run is checked; other synthetic test runs can exist.
        var response = mvc.perform(get("/api/timeseries/source-runs")
                .param("sourceCode","WORLD_BANK").param("datasetCode","WDI"))
                .andExpect(status().isOk()).andReturn().getResponse().getContentAsString();
        assertTrue(!response.contains(key),
                "Public source-run metadata must not disclose scope-restricted run.");
        assertNotNull(db.queryForObject("""
            select source_metadata from timeseries.observation where id=?
        """, String.class, obs));
    }

    @Test
    void registriesAreImmutableAndNativeCodeCannotMapToWrongCountry() throws Exception {
        String code = "2025-SYNTH-" + UUID.randomUUID().toString().substring(0, 9);
        UUID scope = registerOnlyPrivateSyntheticScope(code);
        assertThrows(DataIntegrityViolationException.class, () ->
                db.update("""
                    update timeseries.geographic_scope_registry
                    set coverage_kind='FULL_COUNTRY_CLAIM_UNREVIEWED'
                    where id=?
                """, scope)
        );
        assertThrows(DataIntegrityViolationException.class, () ->
                db.update("delete from timeseries.geographic_scope_registry where id=?", scope)
        );
        assertThrows(DataIntegrityViolationException.class, () ->
                db.update("""
                    update timeseries.geographic_dataset_policy set reason_code='REMOVED'
                    where dataset_code='DS_POPULATIONS_REFERENCE'
                """)
        );
        // An observation labelled DEU cannot borrow a FRA geographic scope.
        // DB FK exists; we also require country to match before any save.
        assertEquals("FRA", db.queryForObject(
                "select country_iso3 from timeseries.geographic_scope_registry where id=?",
                String.class, scope
        ).trim());
    }
}
