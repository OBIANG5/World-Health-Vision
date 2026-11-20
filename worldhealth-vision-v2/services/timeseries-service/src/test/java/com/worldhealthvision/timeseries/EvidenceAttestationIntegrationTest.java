package com.worldhealthvision.timeseries;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;
import com.worldhealthvision.timeseries.api.internal.dto.IngestionObservationBatchRequest;
import com.worldhealthvision.timeseries.service.EvidenceAttestationException;
import com.worldhealthvision.timeseries.service.EvidenceAttestationVerifier;
import com.worldhealthvision.timeseries.service.EvidenceItemsFingerprint;
import java.util.UUID;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.testcontainers.service.connection.ServiceConnection;
import org.springframework.http.MediaType;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.springframework.test.web.servlet.MockMvc;
import org.testcontainers.containers.PostgreSQLContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;

/** Tests actual protected receiver with two DIFFERENT ephemeral public keys. */
@Testcontainers
@SpringBootTest
@AutoConfigureMockMvc
class EvidenceAttestationIntegrationTest {
    private static final String ENDPOINT = "/internal/timeseries/ingestion/observation-batches";
    private static final String KEY = "integration-test-only-not-secret-0123456789abcdef";

    @Container @ServiceConnection
    static PostgreSQLContainer<?> postgres = new PostgreSQLContainer<>("postgres:16-alpine");

    @DynamicPropertySource
    static void twoIndependentTrustKeys(DynamicPropertyRegistry props) {
        props.add("whv.timeseries.rights-trust-public-key-base64",
                SignedTestRightsFixture::publicKeyBase64);
        props.add("whv.timeseries.evidence-trust-public-key-base64",
                SignedTestEvidenceFixture::publicKeyBase64);
    }

    @Autowired MockMvc mockMvc;
    @Autowired ObjectMapper mapper;
    @Autowired EvidenceItemsFingerprint projection;
    @Autowired JdbcTemplate jdbc;

    private String freshIndicator() {
        String code = "SYNTH.EVIDENCE." + UUID.randomUUID().toString()
                .replace("-", "").substring(0, 10).toUpperCase();
        jdbc.update("""
                insert into catalog.indicator(code,display_name)
                values (?, 'SYNTHETIC EVIDENCE TEST ONLY')
                """, code);
        SignedTestRightsFixture.insert(jdbc,
                SignedTestRightsFixture.defaultDecision(
                        "WORLD_BANK", "WDI", "FRA", code
                ));
        return code;
    }

    private String runKey() { return "evidence_" + UUID.randomUUID(); }

    private String request(String key, String indicator) {
        return """
                {"sourceCode":"WORLD_BANK","datasetCode":"WDI",
                 "runKey":"%s",
                 "fetchedAtUtc":"2026-11-20T09:17:42.123456Z",
                 "bronzeRawPayloadPath":"synthetic-private/original.http.json",
                 "bronzeNormalizedPayloadPath":"synthetic-private/normalized.ndjson",
                 "recordCount":1,
                 "notes":{"httpBodySha256":"%s","syntheticTestOnly":true},
                 "items":[{"indicatorCode":"%s","countryIso3":"FRA",
                           "periodGranularity":"ANNUAL",
                           "periodStart":"2024-01-01","periodEnd":"2024-12-31",
                           "periodLabel":"2024","numericValue":17.0,
                           "valueStatus":"OBSERVED","sourceMetadata":{
                               "syntheticTestOnly":true,"sourceYear":"2024"
                           },"qualityFlags":["SYNTHETIC_ONLY"]}]}
                """.formatted(key, SignedTestRightsFixture.HTTP_SHA, indicator);
    }

    private org.springframework.test.web.servlet.request.MockHttpServletRequestBuilder direct(String body) {
        return post(ENDPOINT).header("X-WHV-Ingestion-Key", KEY)
                .contentType(MediaType.APPLICATION_JSON).content(body);
    }

    private String signed(String body) {
        return SignedTestEvidenceFixture.attach(body, mapper, projection);
    }

    private int saved(String key) {
        return jdbc.queryForObject(
                "select count(*) from timeseries.source_run where run_key=?",
                Integer.class, key);
    }

    @Test
    void validLegalGrantAndValidInternalKeyStillCannotPublishWithoutIndependentWitness() throws Exception {
        String ind=freshIndicator(), key=runKey();
        mockMvc.perform(direct(request(key,ind))).andExpect(status().isForbidden());
        assertEquals(0, saved(key));
    }

    @Test
    void syntheticTwoSignaturesAndFullValueHashPermitExactlyOneVersion() throws Exception {
        String ind=freshIndicator(), key=runKey();
        String body=signed(request(key,ind));
        mockMvc.perform(direct(body)).andExpect(status().isOk())
                .andExpect(jsonPath("$.upsertedCount").value(1));
        assertEquals(1, saved(key));
        Integer attestCount=jdbc.queryForObject("""
                select count(*) from timeseries.source_run
                where run_key=? and evidence_attestation_sha256 is not null
                  and attested_items_sha256 is not null
                """, Integer.class, key);
        assertEquals(1, attestCount);

        // Reissue SAME verified observation proof at a different token time;
        // token signature differs but the stable canonical batch identity does
        // not. Replay must be a read-only 200 and no provenance re-writing.
        String refreshed=SignedTestEvidenceFixture.attachWithPolicy(
                request(key,ind),mapper,projection,"PUBLIC_API_INGEST",-1,180);
        assertNotEquals(body,refreshed);
        mockMvc.perform(direct(refreshed)).andExpect(status().isOk())
                .andExpect(jsonPath("$.upsertedCount").value(0));
        assertEquals(1,saved(key));
        mockMvc.perform(get("/api/timeseries/series")
                .param("countryIso3","FRA").param("indicatorCode",ind))
                .andExpect(status().isOk()).andExpect(jsonPath("$.count").value(1));
    }

    @Test
    void signedButResearchOnlyOrExpiredCannotAuthorizePublicIngest() throws Exception {
        String ind=freshIndicator(), key=runKey();
        var baseline=request(key,ind);
        String research=SignedTestEvidenceFixture.attachWithPolicy(
                baseline,mapper,projection,"PRIVATE_RESEARCH_VALIDATION",0,120);
        mockMvc.perform(direct(research)).andExpect(status().isForbidden());
        String expired=SignedTestEvidenceFixture.attachWithPolicy(
                baseline,mapper,projection,"PUBLIC_API_INGEST",-400,-120);
        mockMvc.perform(direct(expired)).andExpect(status().isForbidden());
        assertEquals(0,saved(key));
    }

    @Test
    void postSigningChangeOfValueMetadataQualityEventOrTimestampIsDenied() throws Exception {
        String ind=freshIndicator(),key=runKey();
        String valid=signed(request(key,ind));
        for(String fieldMutation: new String[] {
                valid.replace("\"numericValue\":17.0","\"numericValue\":18.0"),
                valid.replace("\"sourceYear\":\"2024\"","\"sourceYear\":\"2025\""),
                valid.replace("\"qualityFlags\":[\"SYNTHETIC_ONLY\"]",
                        "\"qualityFlags\":[\"MISLEADING\"]"),
                valid.replace("\"countryIso3\":\"FRA\"","\"countryIso3\":\"DEU\""),
                valid.replace("\"httpBodySha256\":\""+SignedTestRightsFixture.HTTP_SHA+"\"",
                        "\"httpBodySha256\":\""+"0".repeat(64)+"\""),
                valid.replace("\"acquisitionEventId\":\""+SignedTestEvidenceFixture.EVENT+"\"",
                        "\"acquisitionEventId\":\""+"0".repeat(32)+"\""),
                valid.replace("\"fetchedAtUtc\":\"2026-11-20T09:17:42.123456Z\"",
                        "\"fetchedAtUtc\":\"2026-11-20T09:17:43.123456Z\""),
                valid.replace("\"recordCount\":1","\"recordCount\":2")
        }) {
            assertNotEquals(valid,fieldMutation,"Mutation fixture must actually differ");
            mockMvc.perform(direct(fieldMutation)).andExpect(status().isForbidden());
        }
        assertEquals(0,saved(key));
    }

    @Test
    void requestCannotSupplyItsOwnSignatureOrPublisherTrustAnchor() throws Exception {
        String ind=freshIndicator(), key=runKey();
        ObjectNode payload=(ObjectNode)mapper.readTree(signed(request(key,ind)));
        ObjectNode notes=(ObjectNode)payload.get("notes");
        ObjectNode proof=(ObjectNode)notes.get("evidenceAttestation");
        proof.put("signatureBase64", java.util.Base64.getEncoder()
                .encodeToString(new byte[64]));
        mockMvc.perform(direct(mapper.writeValueAsString(payload)))
                .andExpect(status().isForbidden());
        String json=signed(request(runKey(),ind));
        ObjectNode invalid=(ObjectNode)mapper.readTree(json);
        ((ObjectNode)((ObjectNode)invalid.get("notes"))
                .get("evidenceAttestation")).put("signingPublicKeySha256", "f".repeat(64));
        mockMvc.perform(direct(mapper.writeValueAsString(invalid)))
                .andExpect(status().isForbidden());
        assertEquals(0,saved(key));
    }

    @Test
    void missingServerTrustAnchorRejectsEvenSyntacticallyValidProof() throws Exception {
        String ind=freshIndicator(), key=runKey();
        var disabled=new EvidenceAttestationVerifier("", "", mapper, projection);
        var parsed=mapper.readValue(signed(request(key,ind)),
                IngestionObservationBatchRequest.class);
        assertThrows(EvidenceAttestationException.class,
                () -> disabled.requireSourceProof(parsed));
        assertEquals(0,saved(key));
    }

    @Test
    void validEd25519ButUnapprovedParserVersionOrImplementationIsDeniedBeforeSql() throws Exception {
        String indicator = freshIndicator(), key = runKey();
        String base = request(key, indicator);
        String wrongCode = SignedTestEvidenceFixture.attachWithParser(
                base, mapper, projection, "PUBLIC_API_INGEST",
                0, 180, SignedTestEvidenceFixture.SEMANTIC_VERSION,
                "8".repeat(64)
        );
        mockMvc.perform(direct(wrongCode)).andExpect(status().isForbidden());

        String wrongVersion = SignedTestEvidenceFixture.attachWithParser(
                base, mapper, projection, "PUBLIC_API_INGEST",
                0, 180, "WORLD_VISION_SEMANTIC_POPULATION_REPLAY_V0",
                SignedTestEvidenceFixture.SEMANTIC_SHA
        );
        mockMvc.perform(direct(wrongVersion)).andExpect(status().isForbidden());
        assertEquals(0, saved(key));
    }

    @Test
    void noReviewedSemanticCodeShaInReceiverMustDenyEvenWithBothValidSignatures() throws Exception {
        String indicator = freshIndicator(), key = runKey();
        String attested = signed(request(key, indicator));
        var blocked = new EvidenceAttestationVerifier(
                SignedTestEvidenceFixture.publicKeyBase64(), "", mapper, projection
        );
        var dto = mapper.readValue(attested, IngestionObservationBatchRequest.class);
        assertThrows(EvidenceAttestationException.class, () -> blocked.requireSourceProof(dto));
        assertThrows(IllegalStateException.class, () ->
                new EvidenceAttestationVerifier(
                        SignedTestEvidenceFixture.publicKeyBase64(),
                        "invalid-hash", mapper, projection
                )
        );
        assertEquals(0, saved(key));
    }

    @Test
    void priorV1SchemaCannotBeReplayedAsV2WitnessOrOverridePinning() throws Exception {
        String indicator = freshIndicator(), key = runKey();
        String signedV2 = signed(request(key, indicator));
        String invalidV1 = signedV2.replace(
                "WORLD_VISION_BRONZE_WITNESS_V2",
                "WORLD_VISION_BRONZE_WITNESS_V1"
        );
        mockMvc.perform(direct(invalidV1)).andExpect(status().isForbidden());
        assertEquals(0, saved(key));
    }

}
