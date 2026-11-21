package com.worldhealthvision.timeseries;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.worldhealthvision.timeseries.api.internal.dto.IngestionObservationBatchRequest;
import com.worldhealthvision.timeseries.service.CanonicalIngestionFingerprint;
import com.worldhealthvision.timeseries.service.EvidenceItemsFingerprint;
import com.worldhealthvision.timeseries.service.SignedEvidenceAttestation;
import java.time.OffsetDateTime;
import java.util.UUID;
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
import org.testcontainers.containers.PostgreSQLContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;

/**
 * TRUE PostgreSQL16/Flyway + HTTP controller; ALL values synthetic 17.0.
 *
 * Three independent ephemeral Ed25519 signers in memory: reviewer rights,
 * Bronze data witness, geography-specific reviewer. This does NOT claim
 * actual Insee source rights or LIVE provider ingestion. To exercise the
 * read-only API when HTTP ingest is intentionally GEO-DENIED in V6, CI
 * inserts an internally signed synthetic source-run directly into an
 * ephemeral Testcontainers database, never into production.
 */
@Testcontainers
@SpringBootTest
@AutoConfigureMockMvc
class ScopedPublicationIntegrationTest {
    @Container @ServiceConnection
    static PostgreSQLContainer<?> postgres = new PostgreSQLContainer<>("postgres:16-alpine");

    @DynamicPropertySource
    static void threeIndependentEphemeralPublicKeys(DynamicPropertyRegistry props) {
        props.add("whv.timeseries.rights-trust-public-key-base64",
                SignedTestRightsFixture::publicKeyBase64);
        props.add("whv.timeseries.evidence-trust-public-key-base64",
                SignedTestEvidenceFixture::publicKeyBase64);
        props.add("whv.timeseries.scope-trust-public-key-base64",
                SignedScopedTestFixture::publicKeyBase64);
    }

    @Autowired JdbcTemplate sql;
    @Autowired MockMvc mvc;
    @Autowired ObjectMapper json;
    @Autowired EvidenceItemsFingerprint itemsProof;
    @Autowired CanonicalIngestionFingerprint runFingerprint;

    private record SyntheticReview(
            UUID observation, UUID run, UUID scope,
            UUID rights, UUID geography, String indicator,
            String nativeCode, String itemsSha) {}

    private SyntheticReview createSyntheticReview(boolean approveGeography) throws Exception {
        String id = UUID.randomUUID().toString().replace("-","").substring(0,10).toUpperCase();
        String indicator = "SYNTH.GEO." + id;
        String nativeCode = "SYNTH-NATIVE-" + id;
        String runKey = "p2c3c2_" + UUID.randomUUID().toString().replace("-","");
        sql.update("insert into catalog.indicator(code,display_name) values (?,?)",
                indicator, "Synthetic QA only; NOT an actual population series");
        UUID scope = SignedScopedTestFixture.createScope(sql,nativeCode);
        String body = """
            {
             "sourceCode":"WORLD_BANK","datasetCode":"WDI",
             "runKey":"%s","fetchedAtUtc":"2026-11-21T08:00:00Z",
             "bronzeRawPayloadPath":"SYNTHETIC_QA_ONLY/original.json",
             "bronzeNormalizedPayloadPath":"SYNTHETIC_QA_ONLY/normalized.ndjson",
             "recordCount":1,
             "notes":{"httpBodySha256":"%s","syntheticTestOnly":true},
             "items":[{
               "indicatorCode":"%s","countryIso3":"FRA",
               "periodGranularity":"ANNUAL","periodStart":"2024-01-01",
               "periodEnd":"2024-12-31","periodLabel":"2024",
               "numericValue":17.0,"valueStatus":"OBSERVED",
               "sourceMetadata":{
                 "sourceNativeGeographyCode":"%s",
                 "geographicVersion":"2025-A",
                 "geographicReferenceYear":2025,
                 "methodologyCode":"SYNTHETIC_QA_METHOD",
                 "unitCode":"TEST_UNITS",
                 "syntheticTestOnly":true
               },
               "qualityFlags":["SYNTHETIC_ONLY"]
             }]
            }
            """.formatted(runKey,SignedTestRightsFixture.HTTP_SHA,indicator,nativeCode);
        String signed=SignedTestEvidenceFixture.attach(body,json,itemsProof);
        var req=json.readValue(signed,IngestionObservationBatchRequest.class);
        var witness=json.convertValue(req.notes().get("evidenceAttestation"),
                SignedEvidenceAttestation.class);
        UUID run=UUID.randomUUID(), observation=UUID.randomUUID();
        sql.update("""
            insert into timeseries.source_run(
                id,source_code,dataset_code,run_key,fetched_at_utc,
                bronze_raw_payload_path,bronze_normalized_payload_path,
                record_count,status,notes,canonical_batch_sha256,
                evidence_attestation_sha256,attested_items_sha256
            ) values (?,?,?,?,?,?,?,?,'PERSISTED',cast(? as jsonb),?,?,?)
            """,run,req.sourceCode(),req.datasetCode(),req.runKey(),req.fetchedAtUtc(),
                req.bronzeRawPayloadPath(),req.bronzeNormalizedPayloadPath(),
                req.recordCount(),json.writeValueAsString(req.notes()),runFingerprint.calculate(req),
                witness.signedPayloadSha256(),witness.itemsSha256());
        var item=req.items().get(0);
        sql.update("""
            insert into timeseries.observation(
                id,source_run_id,source_code,dataset_code,indicator_code,
                country_iso3,period_granularity,period_start,period_end,period_label,
                numeric_value,text_value,value_status,source_published_at,
                source_metadata,quality_flags
            ) values (?,?,?,?,?,?,?,?,?,?,?,?,?,?,cast(? as jsonb),cast(? as jsonb))
            """,observation,run,req.sourceCode(),req.datasetCode(),item.indicatorCode(),
                item.countryIso3(),item.periodGranularity(),item.periodStart(),
                item.periodEnd(),item.periodLabel(),item.numericValue(),item.textValue(),
                item.valueStatus(),item.sourcePublishedAt(),
                json.writeValueAsString(item.sourceMetadata()),
                json.writeValueAsString(item.qualityFlags()));
        UUID rights=SignedTestRightsFixture.insert(sql,
                SignedTestRightsFixture.defaultDecision("WORLD_BANK","WDI","FRA",indicator));
        sql.update("""
            insert into timeseries.source_run_rights_decision(source_run_id,decision_id)
            values (?,?)
            """,run,rights);
        UUID approvedScope=null;
        if(approveGeography) {
            var scoped=SignedScopedTestFixture.decision(
                    scope,run,witness.itemsSha256(),indicator,nativeCode);
            approvedScope=SignedScopedTestFixture.insert(sql,scoped);
        }
        return new SyntheticReview(observation,run,scope,rights,approvedScope,
                indicator,nativeCode,witness.itemsSha256());
    }

    private String url(){ return "/api/timeseries/countries/FRA/scoped-values"; }

    private int physical(SyntheticReview row) {
        return sql.queryForObject("select count(*) from timeseries.observation where id=?",
                Integer.class,row.observation());
    }

    @Test
    void noSourceOrGeographyGrantIsNeverPublishedEvenThoughPhysicalRowExists() throws Exception {
        var row=createSyntheticReview(false);
        assertEquals(1,physical(row));
        mvc.perform(get(url()).param("indicatorCode",row.indicator()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.count").value(0));
        assertEquals(0,sql.queryForObject(
                "select count(*) from timeseries.latest_observation where id=?",
                Integer.class,row.observation()));
    }

    @Test
    void thirdIndependentSignaturePublishesOnlyProperlyScopedSyntheticValue() throws Exception {
        var row=createSyntheticReview(true);
        mvc.perform(get(url()).param("indicatorCode",row.indicator()))
                .andExpect(status().isOk())
                .andExpect(header().string("Cache-Control","no-store"))
                .andExpect(jsonPath("$.count").value(1))
                .andExpect(jsonPath("$.items[0].numericValue").value(17.0))
                .andExpect(jsonPath("$.items[0].countryIso3Parent").value("FRA"))
                .andExpect(jsonPath("$.items[0].sourceNativeGeographyCode").value(row.nativeCode()))
                .andExpect(jsonPath("$.items[0].geographicVersion").value("2025-A"))
                .andExpect(jsonPath("$.items[0].geographicReferenceYear").value(2025))
                .andExpect(jsonPath("$.items[0].coverageKind").value("PARTIAL_COUNTRY"))
                .andExpect(jsonPath("$.items[0].methodologyCode").value(SignedScopedTestFixture.METHOD))
                .andExpect(jsonPath("$.items[0].unitCode").value(SignedScopedTestFixture.UNIT))
                .andExpect(jsonPath("$.items[0].territorialExclusions[0]").value("FICTIONAL_TEST_REGION"))
                .andExpect(jsonPath("$.items[0].comparabilityStatus").value(
                        "SOURCE_SCOPED_NOT_COUNTRY_EQUIVALENT"))
                .andExpect(jsonPath("$.items[0].attributionText").value(
                        "Synthetic CI fixture only; not source permission"));
        // The country comparison and country coverage must remain EMPTY.
        assertEquals(0,sql.queryForObject(
                "select count(*) from timeseries.latest_observation where id=?",
                Integer.class,row.observation()));
        mvc.perform(get("/api/timeseries/compare/countries/latest")
                .param("countryIso3","FRA").param("indicatorCode",row.indicator()))
                .andExpect(status().isOk()).andExpect(jsonPath("$.count").value(0));
        mvc.perform(get("/api/timeseries/countries/DEU/scoped-values")
                .param("indicatorCode",row.indicator()))
                .andExpect(status().isOk()).andExpect(jsonPath("$.count").value(0));
    }

    @Test
    void revokingGeographicalDecisionRemovesValueWithoutDeletingForensics() throws Exception {
        var row=createSyntheticReview(true);
        mvc.perform(get(url()).param("indicatorCode",row.indicator()))
                .andExpect(status().isOk()).andExpect(jsonPath("$.count").value(1));
        sql.update("""
            insert into timeseries.scoped_publication_revocation(
                decision_id,operator_id,reason_code) values (?,?,?)
            """,row.geography(),"CI_TEST_REVOKER","GEOSCOPE_REVOKED");
        mvc.perform(get(url()).param("indicatorCode",row.indicator()))
                .andExpect(status().isOk()).andExpect(jsonPath("$.count").value(0));
        assertEquals(1,physical(row));
        assertThrows(DataIntegrityViolationException.class,() ->
                sql.update("delete from timeseries.scoped_publication_revocation where decision_id=?",
                        row.geography()));
    }

    @Test
    void revokingOriginalReuseRightsAlsoRemovesTheScopedValue() throws Exception {
        var row=createSyntheticReview(true);
        mvc.perform(get(url()).param("indicatorCode",row.indicator()))
                .andExpect(status().isOk()).andExpect(jsonPath("$.count").value(1));
        sql.update("""
            insert into timeseries.rights_revocation(decision_id,operator_id,reason_code)
            values (?,?,?)
            """,row.rights(),"CI_TEST_REVOKER","SOURCE_REUSE_REVOKED");
        mvc.perform(get(url()).param("indicatorCode",row.indicator()))
                .andExpect(status().isOk()).andExpect(jsonPath("$.count").value(0));
        assertEquals(1,physical(row));
    }

    @Test
    void databaseTamperingOfSignedValueFailsPublicReadTimeWitnessVerification() throws Exception {
        var row=createSyntheticReview(true);
        mvc.perform(get(url()).param("indicatorCode",row.indicator()))
                .andExpect(status().isOk()).andExpect(jsonPath("$.count").value(1));
        sql.update("update timeseries.observation set numeric_value=19.0 where id=?",
                row.observation());
        mvc.perform(get(url()).param("indicatorCode",row.indicator()))
                .andExpect(status().isForbidden());
        assertEquals(1,physical(row));
    }

    @Test
    void tamperedQualityFlagsFailReadTimeSignedBronzeProjection() throws Exception {
        var row=createSyntheticReview(true);
        sql.update("""
            update timeseries.observation
            set quality_flags='["TAMPERED"]'::jsonb where id=?
            """,row.observation());
        mvc.perform(get(url()).param("indicatorCode",row.indicator()))
                .andExpect(status().isForbidden());
    }

    @Test
    void forgedGeoSignatureIsDeniedEvenWithValidRightsAndOriginalSourceProof() throws Exception {
        var row=createSyntheticReview(false);
        var candidate=SignedScopedTestFixture.decision(
                row.scope(),row.run(),row.itemsSha(),row.indicator(),row.nativeCode());
        SignedScopedTestFixture.insertWithSignature(sql,candidate,
                java.util.Base64.getEncoder().encodeToString(new byte[64]));
        mvc.perform(get(url()).param("indicatorCode",row.indicator()))
                .andExpect(status().isForbidden());
    }

    @Test
    void mismatchedSourceRunShaCannotBeLaunderedIntoSignedScope() throws Exception {
        var row=createSyntheticReview(false);
        var decision=SignedScopedTestFixture.decision(
                row.scope(),row.run(),"f".repeat(64),row.indicator(),row.nativeCode());
        assertThrows(DataIntegrityViolationException.class,() ->
                SignedScopedTestFixture.insert(sql,decision));
    }

    @Test
    void twoConflictingSimultaneousActiveGeoReviewsAreNotSilentlyBlended() throws Exception {
        var row=createSyntheticReview(true);
        var second=SignedScopedTestFixture.decision(
                row.scope(),row.run(),row.itemsSha(),row.indicator(),row.nativeCode());
        SignedScopedTestFixture.insert(sql,second);
        mvc.perform(get(url()).param("indicatorCode",row.indicator()))
                .andExpect(status().isForbidden());
    }

    @Test
    void signedGeoReviewHistoryIsAppendOnly() throws Exception {
        var row=createSyntheticReview(true);
        assertThrows(DataIntegrityViolationException.class,() ->
                sql.update("delete from timeseries.scoped_publication_decision where decision_id=?",
                        row.geography()));
        assertThrows(DataIntegrityViolationException.class,() ->
                sql.update("""
                    update timeseries.scoped_publication_decision
                    set scope_metadata_label='COUNTRY_FRA' where decision_id=?
                    """,row.geography()));
        assertEquals(1,physical(row));
    }
}
