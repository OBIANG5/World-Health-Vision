package com.worldhealthvision.timeseries;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.worldhealthvision.timeseries.api.TimeseriesInternalIngestionController;
import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import java.util.concurrent.Executors;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.testcontainers.service.connection.ServiceConnection;
import org.springframework.http.MediaType;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;
import org.testcontainers.containers.PostgreSQLContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;

/**
 * DATA-1C-A1 real PostgreSQL 16/Flyway + MockMvc, exclusively SYNTHETIC FRA GDP.
 * No actual IBGE/WDI figure, token, export or production write.
 */
@Testcontainers
@SpringBootTest
@AutoConfigureMockMvc
class TimeseriesSourceRunSafetyIntegrationTest {
    private static final String ROUTE = "/internal/timeseries/ingestion/observation-batches";
    private static final String KEY = "integration-test-only-not-secret-0123456789abcdef";

    @Container
    @ServiceConnection
    static PostgreSQLContainer<?> postgres = new PostgreSQLContainer<>("postgres:16-alpine");

    @Autowired MockMvc mockMvc;
    @Autowired JdbcTemplate jdbc;
    @Autowired ObjectMapper mapper;

    private String runKey() {
        return "safe_" + UUID.randomUUID();
    }

    private String sample(String key) {
        return """
            {
              "sourceCode":"WORLD_BANK","datasetCode":"WDI",
              "runKey":"%s",
              "fetchedAtUtc":"2026-11-19T20:00:00Z",
              "bronzeRawPayloadPath":"private/test.raw",
              "bronzeNormalizedPayloadPath":"private/test.normalized",
              "recordCount":1,
              "notes":{"syntheticTestOnly":true,"runScope":"FRA-GDP"},
              "items":[{
                "indicatorCode":"NY.GDP.MKTP.CD","countryIso3":"FRA",
                "periodGranularity":"ANNUAL","periodStart":"2024-01-01",
                "periodEnd":"2024-12-31","periodLabel":"2024",
                "numericValue":123.0,"valueStatus":"OBSERVED",
                "sourceMetadata":{"syntheticTestOnly":true},
                "qualityFlags":[]
              }]
            }
            """.formatted(key);
    }

    private org.springframework.test.web.servlet.request.MockHttpServletRequestBuilder authenticated(String json) {
        return post(ROUTE).header("X-WHV-Ingestion-Key", KEY)
                .contentType(MediaType.APPLICATION_JSON).content(json);
    }

    private int runCount(String key) {
        return jdbc.queryForObject(
                "select count(*) from timeseries.source_run where run_key = ?",
                Integer.class, key
        );
    }

    @Test
    void missingOrWrongInternalSecretNeverWrites() throws Exception {
        String key = runKey();
        String body = sample(key);
        mockMvc.perform(post(ROUTE).contentType(MediaType.APPLICATION_JSON).content(body))
                .andExpect(status().isForbidden());
        mockMvc.perform(post(ROUTE)
                        .header("X-WHV-Ingestion-Key", "wrong-and-not-a-key")
                        .contentType(MediaType.APPLICATION_JSON).content(body))
                .andExpect(status().isForbidden());
        assertEquals(0, runCount(key));

        // No environment secret must disable the receiver, even when a caller
        // supplies a header. Check default configuration without any DB write.
        TimeseriesInternalIngestionController disabled =
                new TimeseriesInternalIngestionController(null, "");
        assertEquals(503, disabled.ingestObservationBatch(KEY, null).getStatusCode().value());
    }

    @Test
    void officialPrivateResearchCannotBeSmuggledByAnyCallerFlag() throws Exception {
        String base = sample(runKey());
        List<String> forbidden = List.of(
            base.replace("\"sourceCode\":\"WORLD_BANK\"", "\"sourceCode\":\"IBGE\""),
            base.replace("\"datasetCode\":\"WDI\"", "\"datasetCode\":\"CENSO2022_4714\""),
            base.replace("\"datasetCode\":\"WDI\"", "\"datasetCode\":\"WDI_POP_TOTAL_BRA_2022\""),
            base.replace("\"indicatorCode\":\"NY.GDP.MKTP.CD\"", "\"indicatorCode\":\"IBGE.CENSUS2022.RESIDENT_POP\""),
            base.replace("\"countryIso3\":\"FRA\"", "\"countryIso3\":\"BRA\"")
                .replace("\"indicatorCode\":\"NY.GDP.MKTP.CD\"", "\"indicatorCode\":\"SP.POP.TOTL\"")
                .replace("\"periodStart\":\"2024-01-01\"", "\"periodStart\":\"2022-01-01\"")
                .replace("\"periodEnd\":\"2024-12-31\"", "\"periodEnd\":\"2022-12-31\""),
            base.replace("\"notes\":{\"syntheticTestOnly\":true,\"runScope\":\"FRA-GDP\"}",
                "\"notes\":{\"licenseReviewStatus\":\"REVIEW_REQUIRED\",\"claim\":\"APPROVED\"}"),
            base.replace("\"qualityFlags\":[]", "\"qualityFlags\":[\"REUSE_RIGHTS_REVIEW_REQUIRED\"]"),
            base.replace("\"sourceMetadata\":{\"syntheticTestOnly\":true}",
                "\"sourceMetadata\":{\"reuseRights\":\"NEEDS_PROVIDER_CLARIFICATION\"}")
        );
        for (String body : forbidden) {
            String response = mockMvc.perform(authenticated(body))
                    .andExpect(status().isForbidden())
                    .andReturn().getResponse().getContentAsString();
            assertTrue(!response.contains("123.0"), "No source numeric payload in error");
        }
        assertEquals(0, runCount(mapper.readTree(base).get("runKey").asText()));
    }

    @Test
    void exactReplayIsReadOnlyAndRevisedSameRunKeyIsConflict() throws Exception {
        String key = runKey();
        String initial = sample(key);
        String id = mapper.readTree(mockMvc.perform(authenticated(initial))
                        .andExpect(status().isOk())
                        .andExpect(jsonPath("$.upsertedCount").value(1))
                        .andReturn().getResponse().getContentAsString())
                .get("sourceRunId").asText();
        String evidenceBefore = snapshot(key);
        String replayId = mapper.readTree(mockMvc.perform(authenticated(initial))
                        .andExpect(status().isOk())
                        .andExpect(jsonPath("$.upsertedCount").value(0))
                        .andReturn().getResponse().getContentAsString())
                .get("sourceRunId").asText();
        assertEquals(id, replayId);
        assertEquals(evidenceBefore, snapshot(key),
                "Identical replay may NOT advance timestamps, change values or run notes");
        assertEquals(1, runCount(key));

        String forged = initial.replace("123.0", "124.0");
        mockMvc.perform(authenticated(forged)).andExpect(status().isConflict());
        assertEquals(evidenceBefore, snapshot(key));
        assertEquals(1, runCount(key));

        String newVersion = initial.replace(key, runKey()).replace("123.0", "124.0");
        String newId = mapper.readTree(mockMvc.perform(authenticated(newVersion))
                        .andExpect(status().isOk())
                        .andExpect(jsonPath("$.upsertedCount").value(1))
                        .andReturn().getResponse().getContentAsString())
                .get("sourceRunId").asText();
        assertNotEquals(id, newId);
        assertEquals(1, runCount(key));
    }

    private String snapshot(String key) {
        return jdbc.queryForObject("""
            select sr.fetched_at_utc::text || '|' || sr.persisted_at_utc::text
              || '|' || sr.notes::text || '|' || sr.canonical_batch_sha256::text
              || '|' || o.ingested_at::text || '|' || o.numeric_value::text
            from timeseries.source_run sr
            join timeseries.observation o on o.source_run_id = sr.id
            where sr.run_key = ?
            """, String.class, key);
    }

    @Test
    void historicalUnfingerprintedSourceRunNeverReceivesFalseAttestation() throws Exception {
        String key = runKey();
        jdbc.update("""
            insert into timeseries.source_run (
                id, source_code, dataset_code, run_key,
                fetched_at_utc, record_count, status
            ) values (?, 'WORLD_BANK', 'WDI', ?, ?, 0, 'PERSISTED')
            """, UUID.randomUUID(), key, OffsetDateTime.parse("2026-11-19T00:00:00Z"));
        mockMvc.perform(authenticated(sample(key))).andExpect(status().isConflict());
        Integer nullProof = jdbc.queryForObject("""
            select count(*) from timeseries.source_run
            where run_key = ? and canonical_batch_sha256 is null
            """, Integer.class, key);
        assertEquals(1, nullProof);
    }

    @Test
    void concurrentIdenticalSubmissionsHaveOneWriteAndOnlyReadOnlyReplays() throws Exception {
        String key = runKey();
        String payload = sample(key);
        try (var executor = Executors.newFixedThreadPool(4)) {
            List<java.util.concurrent.Future<Integer>> results = new ArrayList<>();
            for (int n = 0; n < 5; n++) {
                results.add(executor.submit(() -> {
                    MvcResult response = mockMvc.perform(authenticated(payload))
                            .andExpect(status().isOk()).andReturn();
                    return mapper.readTree(response.getResponse().getContentAsString())
                            .get("upsertedCount").asInt();
                }));
            }
            int inserted = 0;
            for (var future : results) {
                inserted += future.get();
            }
            assertEquals(1, inserted, "Exactly one request may create observations");
            assertEquals(1, runCount(key));
            assertEquals(1, jdbc.queryForObject("""
                    select count(*) from timeseries.observation o
                    join timeseries.source_run sr on sr.id = o.source_run_id
                    where sr.run_key = ?
                    """, Integer.class, key));
        }
    }
}
