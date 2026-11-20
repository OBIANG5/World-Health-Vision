package com.worldhealthvision.timeseries;

import static org.hamcrest.Matchers.greaterThanOrEqualTo;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.BeforeEach;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import com.fasterxml.jackson.databind.ObjectMapper;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.testcontainers.service.connection.ServiceConnection;
import org.springframework.http.MediaType;
import io.micrometer.core.instrument.MeterRegistry;
import io.micrometer.core.instrument.Timer;
import org.springframework.jdbc.core.JdbcTemplate;
import java.util.UUID;
import org.springframework.test.web.servlet.MockMvc;
import org.testcontainers.containers.PostgreSQLContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;

@Testcontainers
@SpringBootTest
@AutoConfigureMockMvc
class TimeseriesControllerIntegrationTest {

    @Container
    @ServiceConnection
    static PostgreSQLContainer<?> postgres = new PostgreSQLContainer<>("postgres:16-alpine");

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private JdbcTemplate jdbcTemplate;

    @DynamicPropertySource
    static void signedReviewTrustAnchor(DynamicPropertyRegistry registry) {
        registry.add("whv.timeseries.rights-trust-public-key-base64",
                SignedTestRightsFixture::publicKeyBase64);
    }

    @BeforeEach
    void syntheticReviewDecisions() {
        SignedTestRightsFixture.authorizeExistingSyntheticFixtures(jdbcTemplate);
    }


    @Autowired
    private MeterRegistry meterRegistry;

    @Test
    void shouldAcceptObservationBatchAndExposeBusinessReadEndpoints() throws Exception {
        // The isolated timeseries test bootstraps only two registry sources,
        // unlike the full V2 catalog's 22. Add one intentionally un-ingested
        // source to verify that registration is not mistaken for data.
        jdbcTemplate.update("""
                insert into catalog.source (id, code, display_name)
                values (?, 'EMPTY_TEST_SOURCE', 'Unpopulated integration source')
                on conflict (code) do nothing
                """, UUID.randomUUID());

        mockMvc.perform(post("/internal/timeseries/ingestion/observation-batches")
                        .contentType(MediaType.APPLICATION_JSON)
                        .header("X-WHV-Ingestion-Key", "integration-test-only-not-secret-0123456789abcdef")
                        .content("""
                                {
                                  "sourceCode": "WORLD_BANK",
                                  "datasetCode": "WDI",
                                  "runKey": "20260410_010101_ny_gdp_mktp_cd",
                                  "fetchedAtUtc": "2026-04-10T01:01:01Z",
                                  "bronzeRawPayloadPath": "/tmp/worldbank.raw.json",
                                  "bronzeNormalizedPayloadPath": "/tmp/worldbank.normalized.ndjson",
                                  "recordCount": 3,
                                  "notes": {"httpBodySha256":"bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb",
                                    "indicatorName": "GDP (current US$)"
                                  },
                                  "items": [
                                    {
                                      "indicatorCode": "NY.GDP.MKTP.CD",
                                      "countryIso3": "FRA",
                                      "periodGranularity": "ANNUAL",
                                      "periodStart": "2023-01-01",
                                      "periodEnd": "2023-12-31",
                                      "periodLabel": "2023",
                                      "numericValue": 3049012345678.0,
                                      "valueStatus": "OBSERVED",
                                      "sourceMetadata": {
                                        "sourcePeriod": "2023"
                                      },
                                      "qualityFlags": []
                                    },
                                    {
                                      "indicatorCode": "NY.GDP.MKTP.CD",
                                      "countryIso3": "FRA",
                                      "periodGranularity": "ANNUAL",
                                      "periodStart": "2024-01-01",
                                      "periodEnd": "2024-12-31",
                                      "periodLabel": "2024",
                                      "numericValue": 3150012345678.0,
                                      "valueStatus": "OBSERVED",
                                      "sourceMetadata": {
                                        "sourcePeriod": "2024"
                                      },
                                      "qualityFlags": []
                                    },
                                    {
                                      "indicatorCode": "NY.GDP.MKTP.CD",
                                      "countryIso3": "DEU",
                                      "periodGranularity": "ANNUAL",
                                      "periodStart": "2024-01-01",
                                      "periodEnd": "2024-12-31",
                                      "periodLabel": "2024",
                                      "numericValue": 4520012345678.0,
                                      "valueStatus": "OBSERVED",
                                      "sourceMetadata": {
                                        "sourcePeriod": "2024"
                                      },
                                      "qualityFlags": []
                                    }
                                  ]
                                }
                                """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.itemCount").value(3))
                .andExpect(jsonPath("$.upsertedCount").value(3));

        mockMvc.perform(post("/internal/timeseries/ingestion/observation-batches")
                        .contentType(MediaType.APPLICATION_JSON)
                        .header("X-WHV-Ingestion-Key", "integration-test-only-not-secret-0123456789abcdef")
                        .content("""
                                {
                                  "sourceCode": "IMF",
                                  "datasetCode": "IMF_PUBLIC_DATA",
                                  "runKey": "20260410_020202_ny_gdp_mktp_cd",
                                  "fetchedAtUtc": "2026-04-10T02:02:02Z",
                                  "bronzeRawPayloadPath": "/tmp/imf.raw.json",
                                  "bronzeNormalizedPayloadPath": "/tmp/imf.normalized.ndjson",
                                  "recordCount": 1,
                                  "notes": {"httpBodySha256":"bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb",
                                    "indicatorName": "GDP (current US$)"
                                  },
                                  "items": [
                                    {
                                      "indicatorCode": "NY.GDP.MKTP.CD",
                                      "countryIso3": "FRA",
                                      "periodGranularity": "ANNUAL",
                                      "periodStart": "2024-01-01",
                                      "periodEnd": "2024-12-31",
                                      "periodLabel": "2024",
                                      "numericValue": 3137012345678.0,
                                      "valueStatus": "ESTIMATED",
                                      "sourceMetadata": {
                                        "sourcePeriod": "2024"
                                      },
                                      "qualityFlags": [
                                        "MODELLED_RELEASE"
                                      ]
                                    }
                                  ]
                                }
                                """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.itemCount").value(1))
                .andExpect(jsonPath("$.upsertedCount").value(1));

        mockMvc.perform(get("/api/timeseries/readiness"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.sourceRunCount").value(greaterThanOrEqualTo(2)))
                .andExpect(jsonPath("$.observationCount").value(greaterThanOrEqualTo(4)));

        // Registry entries without actual data must remain visibly empty.
        // World Bank has three observed values across two countries; IMF has
        // a single estimate; OECD is registered but not yet ingested.
        mockMvc.perform(get("/api/timeseries/sources/coverage"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.count").value(greaterThanOrEqualTo(3)))
                .andExpect(jsonPath("$.items[?(@.sourceCode == 'WORLD_BANK')].observedRecordCount")
                        .value(org.hamcrest.Matchers.hasItem(3)))
                .andExpect(jsonPath("$.items[?(@.sourceCode == 'WORLD_BANK')].observedNumericCount")
                        .value(org.hamcrest.Matchers.hasItem(3)))
                .andExpect(jsonPath("$.items[?(@.sourceCode == 'WORLD_BANK')].coveredCountryCount")
                        .value(org.hamcrest.Matchers.hasItem(2)))
                .andExpect(jsonPath("$.items[?(@.sourceCode == 'WORLD_BANK')].latestAvailablePeriodStart")
                        .value(org.hamcrest.Matchers.hasItem("2024-01-01")))
                .andExpect(jsonPath("$.items[?(@.sourceCode == 'IMF')].estimatedRecordCount")
                        .value(org.hamcrest.Matchers.hasItem(1)))
                .andExpect(jsonPath("$.items[?(@.sourceCode == 'IMF')].observedRecordCount")
                        .value(org.hamcrest.Matchers.hasItem(0)))
                .andExpect(jsonPath("$.items[?(@.sourceCode == 'EMPTY_TEST_SOURCE')].observedRecordCount")
                        .value(org.hamcrest.Matchers.hasItem(0)))
                .andExpect(jsonPath("$.items[?(@.sourceCode == 'EMPTY_TEST_SOURCE')].estimatedRecordCount")
                        .value(org.hamcrest.Matchers.hasItem(0)));



        mockMvc.perform(get("/api/timeseries/series")
                        .param("countryIso3", "FRA")
                        .param("indicatorCode", "NY.GDP.MKTP.CD")
                        .param("sourceCode", "WORLD_BANK")
                        .param("fromPeriodStart", "2024-01-01")
                        .param("sortDirection", "DESC"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.count").value(1))
                .andExpect(jsonPath("$.items[0].sourceCode").value("WORLD_BANK"))
                .andExpect(jsonPath("$.items[0].sourceDisplayName").value("World Bank"))
                .andExpect(jsonPath("$.items[0].datasetDisplayName").value("World Development Indicators"))
                .andExpect(jsonPath("$.items[0].countryDisplayName").value("France"))
                .andExpect(jsonPath("$.items[0].indicatorDisplayName").value("GDP (current US$)"))
                .andExpect(jsonPath("$.items[0].periodLabel").value("2024"));

        mockMvc.perform(get("/api/timeseries/series/latest")
                        .param("countryIso3", "FRA")
                        .param("indicatorCode", "NY.GDP.MKTP.CD"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.count").value(2))
                .andExpect(jsonPath("$.items[0].countryDisplayName").value("France"));


        // Batch has independent rank partitions. GDP retains World Bank and IMF
        // while the second code has no observations and returns a true empty list.
        String baselineLatest = mockMvc.perform(get("/api/timeseries/series/latest")
                        .param("countryIso3", "FRA")
                        .param("indicatorCode", "NY.GDP.MKTP.CD"))
                .andExpect(status().isOk()).andReturn().getResponse().getContentAsString();
        String batchLatest = mockMvc.perform(post("/internal/timeseries/series/latest/batch")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                            {"countryIso3":"fra",
                             "indicatorCodes":["SP.POP.TOTL","NY.GDP.MKTP.CD"],
                             "includeMissing":false}
                            """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.count").value(2))
                .andExpect(jsonPath("$.items[0].indicatorCode").value("SP.POP.TOTL"))
                .andExpect(jsonPath("$.items[0].count").value(0))
                .andExpect(jsonPath("$.items[1].indicatorCode").value("NY.GDP.MKTP.CD"))
                .andExpect(jsonPath("$.items[1].count").value(2))
                .andReturn().getResponse().getContentAsString();
        ObjectMapper mapper = new ObjectMapper();
        var oldNodes = mapper.readTree(baselineLatest).get("items");
        var batchNodes = mapper.readTree(batchLatest).get("items").get(1).get("items");
        assertEquals(oldNodes, batchNodes,
                "Every field, source-run, period, estimated flag and per-source sorting must match.");

        String filteredLegacy = mockMvc.perform(get("/api/timeseries/series/latest")
                        .param("countryIso3", "FRA")
                        .param("indicatorCode", "NY.GDP.MKTP.CD")
                        .param("sourceCode", "IMF")
                        .param("periodGranularity", "ANNUAL"))
                .andExpect(status().isOk()).andReturn().getResponse().getContentAsString();
        String filteredBatch = mockMvc.perform(post("/internal/timeseries/series/latest/batch")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                            {"countryIso3":"FRA","indicatorCodes":["NY.GDP.MKTP.CD"],
                             "sourceCode":"IMF","periodGranularity":"ANNUAL","includeMissing":false}
                            """))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();
        assertEquals(mapper.readTree(filteredLegacy).get("items"),
                     mapper.readTree(filteredBatch).get("items").get(0).get("items"),
                     "Filtered estimated-source projection and provenance must be unchanged.");

        mockMvc.perform(get("/api/timeseries/series/availability")
                        .param("countryIso3", "FRA")
                        .param("indicatorCode", "NY.GDP.MKTP.CD"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.count").value(2))
                .andExpect(jsonPath("$.items[0].countryDisplayName").value("France"))
                .andExpect(jsonPath("$.items[0].availableObservationCount").value(greaterThanOrEqualTo(1)));


        String oldAvailability = mockMvc.perform(get("/api/timeseries/series/availability")
                        .param("countryIso3", "FRA")
                        .param("indicatorCode", "NY.GDP.MKTP.CD")
                        .param("limit", "1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.count").value(1))
                .andReturn().getResponse().getContentAsString();
        String batchedAvailability = mockMvc.perform(
                        post("/internal/timeseries/series/availability/batch")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                            {"countryIso3":"FRA",
                             "indicatorCodes":["SP.POP.TOTL","NY.GDP.MKTP.CD"],
                             "limitPerIndicator":1}
                            """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.count").value(2))
                .andExpect(jsonPath("$.items[0].indicatorCode").value("SP.POP.TOTL"))
                .andExpect(jsonPath("$.items[0].count").value(0))
                .andExpect(jsonPath("$.items[1].indicatorCode").value("NY.GDP.MKTP.CD"))
                .andExpect(jsonPath("$.items[1].count").value(1))
                .andReturn().getResponse().getContentAsString();
        var jsonOldAvail = mapper.readTree(oldAvailability);
        var jsonNewAvail = mapper.readTree(batchedAvailability);
        assertEquals(jsonOldAvail.get("items"), jsonNewAvail.get("items").get(1).get("items"),
                "Availability batch must preserve status counts, dates, latest values and per-indicator limit.");

        String oldImfAvail = mockMvc.perform(get("/api/timeseries/series/availability")
                        .param("countryIso3", "FRA")
                        .param("indicatorCode", "NY.GDP.MKTP.CD")
                        .param("sourceCode", "IMF"))
                .andExpect(status().isOk()).andReturn().getResponse().getContentAsString();
        String newImfAvail = mockMvc.perform(post("/internal/timeseries/series/availability/batch")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                            {"countryIso3":"FRA","indicatorCodes":["NY.GDP.MKTP.CD"],
                             "sourceCode":"IMF","limitPerIndicator":100}
                            """))
                .andExpect(status().isOk()).andReturn().getResponse().getContentAsString();
        assertEquals(mapper.readTree(oldImfAvail).get("items"),
                     mapper.readTree(newImfAvail).get("items").get(0).get("items"),
                     "IMF estimated provenance/period counts must match exactly.");

        mockMvc.perform(get("/api/timeseries/compare/countries/latest")
                        .param("countryIso3", "FRA", "DEU")
                        .param("indicatorCode", "NY.GDP.MKTP.CD")
                        .param("sourceCode", "WORLD_BANK"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.count").value(2))
                .andExpect(jsonPath("$.items[0].indicatorDisplayName").value("GDP (current US$)"));

        mockMvc.perform(get("/api/timeseries/source-runs"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.count").value(greaterThanOrEqualTo(2)))
                .andExpect(jsonPath("$.items[0].sourceDisplayName").exists())

                .andExpect(jsonPath("$.items[0].datasetDisplayName").exists());

        // Two POPULATED indicators and unequal source histories. Insert only
        // AFTER all legacy readiness / coverage assertions above.
        jdbcTemplate.update("""
                insert into catalog.indicator (code, display_name)
                values ('SP.POP.TOTL', 'Synthetic population for test')
                on conflict (code) do nothing
                """);
        mockMvc.perform(post("/internal/timeseries/ingestion/observation-batches")
                        .contentType(MediaType.APPLICATION_JSON)
                        .header("X-WHV-Ingestion-Key", "integration-test-only-not-secret-0123456789abcdef")
                        .content("""
                            {
                              "sourceCode":"WORLD_BANK","datasetCode":"WDI",
                              "runKey":"20260411_010101_synthetic_pop_history",
                              "fetchedAtUtc":"2026-04-11T01:01:01Z",
                              "bronzeRawPayloadPath":"/tmp/pop.synthetic.raw",
                              "bronzeNormalizedPayloadPath":"/tmp/pop.synthetic.ndjson",
                              "recordCount":4,
                              "notes":{"httpBodySha256":"bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb","syntheticTestOnly":true},
                              "items":[
                                {"indicatorCode":"SP.POP.TOTL","countryIso3":"FRA",
                                 "periodGranularity":"ANNUAL","periodStart":"2022-01-01",
                                 "periodEnd":"2022-12-31","periodLabel":"2022",
                                 "numericValue":22.0,"valueStatus":"OBSERVED",
                                 "sourceMetadata":{"syntheticTestOnly":true},"qualityFlags":[]},
                                {"indicatorCode":"SP.POP.TOTL","countryIso3":"FRA",
                                 "periodGranularity":"ANNUAL","periodStart":"2023-01-01",
                                 "periodEnd":"2023-12-31","periodLabel":"2023",
                                 "numericValue":23.0,"valueStatus":"ESTIMATED",
                                 "sourceMetadata":{"syntheticTestOnly":true},"qualityFlags":[]},
                                {"indicatorCode":"SP.POP.TOTL","countryIso3":"FRA",
                                 "periodGranularity":"ANNUAL","periodStart":"2024-01-01",
                                 "periodEnd":"2024-12-31","periodLabel":"2024",
                                 "numericValue":null,"valueStatus":"MISSING",
                                 "sourceMetadata":{"syntheticTestOnly":true},"qualityFlags":[]},
                                {"indicatorCode":"SP.POP.TOTL","countryIso3":"FRA",
                                 "periodGranularity":"MONTHLY","periodStart":"2024-01-01",
                                 "periodEnd":"2024-01-31","periodLabel":"2024-01",
                                 "numericValue":24.0,"valueStatus":"OBSERVED",
                                 "sourceMetadata":{"syntheticTestOnly":true},"qualityFlags":[]}
                              ]
                            }
                            """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.itemCount").value(4));

        // Explicitly test independent LIMIT and deterministic same-date tie
        // order (2024 ANNUAL and MONTHLY), both ASC/DESC, and includeMissing.
        for (String direction : new String[]{"ASC", "DESC"}) {
            for (boolean includeMissing : new boolean[]{false, true}) {
                for (int limit : new int[]{1, 2, 5}) {
                    assertHistoricalBatchEqualsIndividual(
                            direction, includeMissing, limit,
                            null, null, null, null);
                }
            }
        }
        // Nonuniform source and period filters; a missing code is an empty group.
        assertHistoricalBatchEqualsIndividual("DESC", true, 2, "IMF", null, null, null);
        assertHistoricalBatchEqualsIndividual("DESC", true, 2, null, "MONTHLY", null, null);
        assertHistoricalBatchEqualsIndividual(
                "ASC", true, 2, null, "ANNUAL", "2022-01-01", "2023-01-01");
    }

    private void assertHistoricalBatchEqualsIndividual(
            String direction, boolean includeMissing, int limit,
            String source, String granularity, String fromDate, String toDate
    ) throws Exception {
        var request = new java.util.LinkedHashMap<String, Object>();
        request.put("countryIso3", "FRA");
        request.put("indicatorCodes", java.util.List.of(
                "NY.GDP.MKTP.CD", "SP.POP.TOTL", "SYNTHETIC.NO.OBSERVATION"
        ));
        request.put("includeMissing", includeMissing);
        request.put("sortDirection", direction);
        request.put("limitPerIndicator", limit);
        if (source != null) request.put("sourceCode", source);
        if (granularity != null) request.put("periodGranularity", granularity);
        if (fromDate != null) request.put("fromPeriodStart", fromDate);
        if (toDate != null) request.put("toPeriodStart", toDate);
        ObjectMapper mapper = new ObjectMapper();
        String batchedJson = mockMvc.perform(post("/internal/timeseries/series/history/batch")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(mapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.count").value(3))
                .andExpect(jsonPath("$.items[2].count").value(0))
                .andReturn().getResponse().getContentAsString();
        var groups = mapper.readTree(batchedJson).get("items");
        var requested = java.util.List.of(
                "NY.GDP.MKTP.CD", "SP.POP.TOTL", "SYNTHETIC.NO.OBSERVATION"
        );
        for (int i = 0; i < requested.size(); i++) {
            var get = get("/api/timeseries/series")
                    .param("countryIso3", "FRA")
                    .param("indicatorCode", requested.get(i))
                    .param("includeMissing", Boolean.toString(includeMissing))
                    .param("sortDirection", direction)
                    .param("limit", Integer.toString(limit));
            if (source != null) get.param("sourceCode", source);
            if (granularity != null) get.param("periodGranularity", granularity);
            if (fromDate != null) get.param("fromPeriodStart", fromDate);
            if (toDate != null) get.param("toPeriodStart", toDate);
            var legacy = mapper.readTree(mockMvc.perform(get)
                    .andExpect(status().isOk()).andReturn().getResponse().getContentAsString());
            assertEquals(requested.get(i), groups.get(i).get("indicatorCode").asText());
            assertEquals(legacy.get("count").asInt(), groups.get(i).get("count").asInt());
            assertEquals(legacy.get("items"), groups.get(i).get("items"),
                    "Source runs, years, observed/estimated/missing values and ordering must be identical");
            assertTrue(groups.get(i).get("count").asInt() <= limit,
                    "Per-indicator SQL LIMIT must hold regardless of source-count");
        }
    }

    @Test
    void shouldRejectHistoricalBatchInvalidAndOverBudgetRequests() throws Exception {
        for (String bad : new String[]{
                "{\"countryIso3\":\"FRA\",\"indicatorCodes\":[],\"limitPerIndicator\":1}",
                "{\"countryIso3\":\"FR\",\"indicatorCodes\":[\"NY.GDP.MKTP.CD\"],\"limitPerIndicator\":1}",
                "{\"countryIso3\":\"FRA\",\"indicatorCodes\":[\"A\",\"a\"],\"limitPerIndicator\":1}",
                "{\"countryIso3\":\"FRA\",\"indicatorCodes\":[\"INVALID;DROP\"],\"limitPerIndicator\":1}",
                "{\"countryIso3\":\"FRA\",\"indicatorCodes\":[null],\"limitPerIndicator\":1}",
                "{\"countryIso3\":\"FRA\",\"indicatorCodes\":[\"A\"],\"limitPerIndicator\":0}",
                "{\"countryIso3\":\"FRA\",\"indicatorCodes\":[\"A\"],\"limitPerIndicator\":1001}",
                "{\"countryIso3\":\"FRA\",\"indicatorCodes\":[\"A\"],\"limitPerIndicator\":1,\"sortDirection\":\"BAD\"}",
                "{\"countryIso3\":\"FRA\",\"indicatorCodes\":[\"A\"],\"limitPerIndicator\":1,\"fromPeriodStart\":\"2024-01-01\",\"toPeriodStart\":\"2023-01-01\"}"
        }) {
            mockMvc.perform(post("/internal/timeseries/series/history/batch")
                    .contentType(MediaType.APPLICATION_JSON).content(bad))
                    .andExpect(status().isBadRequest());
        }
        StringBuilder huge = new StringBuilder(
                "{\"countryIso3\":\"FRA\",\"limitPerIndicator\":600,\"indicatorCodes\":["
        );
        for (int i = 0; i < 128; i++) {
            if (i > 0) huge.append(",");
            huge.append("\"TEST.IND.").append(i).append("\"");
        }
        huge.append("]}");
        mockMvc.perform(post("/internal/timeseries/series/history/batch")
                .contentType(MediaType.APPLICATION_JSON).content(huge.toString()))
                .andExpect(status().isBadRequest());
    }
    @Test
    void shouldRejectMalformedDuplicateAndOversizedInternalLatestBatch() throws Exception {
        for (String payload : new String[]{
                "{\"countryIso3\":\"FRA\",\"indicatorCodes\":[]}",
                "{\"countryIso3\":\"FRA\",\"indicatorCodes\":[\"NY.GDP.MKTP.CD\",\"ny.gdp.mktp.cd\"]}",
                "{\"countryIso3\":\"FR\",\"indicatorCodes\":[\"NY.GDP.MKTP.CD\"]}",
                "{\"countryIso3\":\"FRA\",\"indicatorCodes\":[\"INVALID;DROP\"]}",
                "{\"countryIso3\":\"FRA\",\"indicatorCodes\":[null]}",
                "{\"countryIso3\":\"FRA\",\"indicatorCodes\":null}",
                "{\"indicatorCodes\":[\"NY.GDP.MKTP.CD\"]}"
        }) {
            mockMvc.perform(post("/internal/timeseries/series/latest/batch")
                    .contentType(MediaType.APPLICATION_JSON).content(payload))
                    .andExpect(status().isBadRequest());
        }
        StringBuilder overLimit = new StringBuilder("{\"countryIso3\":\"FRA\",\"indicatorCodes\":[");
        for (int i = 0; i < 129; i++) {
            if (i > 0) overLimit.append(",");
            overLimit.append("\"TEST.CODE.").append(i).append("\"");
        }
        overLimit.append("]}");
        mockMvc.perform(post("/internal/timeseries/series/latest/batch")
                .contentType(MediaType.APPLICATION_JSON).content(overLimit.toString()))
                .andExpect(status().isBadRequest());
    }

    @Test
    void shouldRejectMalformedDuplicateAndUnboundedAvailabilityBatch() throws Exception {
        for (String bad : new String[] {
                "{\"countryIso3\":\"FRA\",\"indicatorCodes\":[],\"limitPerIndicator\":1}",
                "{\"countryIso3\":\"FRA\",\"indicatorCodes\":[\"NY.GDP.MKTP.CD\",\"ny.gdp.mktp.cd\"],\"limitPerIndicator\":10}",
                "{\"countryIso3\":\"FR\",\"indicatorCodes\":[\"NY.GDP.MKTP.CD\"],\"limitPerIndicator\":10}",
                "{\"countryIso3\":\"FRA\",\"indicatorCodes\":[\"NY.GDP.MKTP.CD\"],\"limitPerIndicator\":0}",
                "{\"countryIso3\":\"FRA\",\"indicatorCodes\":[\"NY.GDP.MKTP.CD\"],\"limitPerIndicator\":501}",
                "{\"countryIso3\":\"FRA\",\"indicatorCodes\":[\"INVALID;DROP\"],\"limitPerIndicator\":1}",
                "{\"countryIso3\":\"FRA\",\"indicatorCodes\":[null],\"limitPerIndicator\":1}"
        }) {
            mockMvc.perform(post("/internal/timeseries/series/availability/batch")
                    .contentType(MediaType.APPLICATION_JSON).content(bad))
                    .andExpect(status().isBadRequest());
        }
        StringBuilder oversized = new StringBuilder("{\"countryIso3\":\"FRA\",\"limitPerIndicator\":100,\"indicatorCodes\":[");
        for (int i = 0; i < 128; i++) {
            if (i != 0) oversized.append(",");
            oversized.append("\"TEST.CODE.").append(i).append("\"");
        }
        oversized.append("]}");
        mockMvc.perform(post("/internal/timeseries/series/availability/batch")
                .contentType(MediaType.APPLICATION_JSON).content(oversized.toString()))
                .andExpect(status().isBadRequest());
    }

    @Test
    void shouldMeasureOnlyFixedCardinalityJdbcBatchOperations() throws Exception {
        // No synthetic data required: empty grouped results still execute the
        // actual JDBC path and must be observed without geo/source labels.
        var codes = java.util.List.of("NY.GDP.MKTP.CD", "SP.POP.TOTL");
        for (String route : java.util.List.of(
                "/internal/timeseries/series/latest/batch",
                "/internal/timeseries/series/availability/batch",
                "/internal/timeseries/series/history/batch"
        )) {
            var request = new java.util.LinkedHashMap<String, Object>();
            request.put("countryIso3", "FRA");
            request.put("indicatorCodes", codes);
            if (route.endsWith("/availability/batch")) {
                request.put("limitPerIndicator", 100);
            } else if (route.endsWith("/history/batch")) {
                request.put("sortDirection", "DESC");
                request.put("limitPerIndicator", 96);
            }
            mockMvc.perform(post(route).contentType(MediaType.APPLICATION_JSON)
                    .content(new ObjectMapper().writeValueAsString(request)))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.count").value(2));
        }
        for (String operation : java.util.List.of("latest", "availability", "history")) {
            Timer timer = meterRegistry.find("whv.timeseries.batch.jdbc")
                    .tag("operation", operation).timer();
            assertTrue(timer != null && timer.count() > 0,
                    "Every private JDBC batch must have a fixed operation timer.");
            assertEquals(java.util.Set.of("operation"),
                    timer.getId().getTags().stream()
                            .map(io.micrometer.core.instrument.Tag::getKey)
                            .collect(java.util.stream.Collectors.toSet()),
                    "Never attach country, source, dataset, user or SQL to a JDBC timer.");
        }
    }

}