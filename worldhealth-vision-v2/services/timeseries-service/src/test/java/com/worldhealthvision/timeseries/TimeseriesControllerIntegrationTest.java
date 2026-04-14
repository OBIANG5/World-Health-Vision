package com.worldhealthvision.timeseries;

import static org.hamcrest.Matchers.greaterThanOrEqualTo;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.testcontainers.service.connection.ServiceConnection;
import org.springframework.http.MediaType;
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

    @Test
    void shouldAcceptObservationBatchAndExposeBusinessReadEndpoints() throws Exception {
        mockMvc.perform(post("/internal/timeseries/ingestion/observation-batches")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "sourceCode": "WORLD_BANK",
                                  "datasetCode": "WDI",
                                  "runKey": "20260410_010101_ny_gdp_mktp_cd",
                                  "fetchedAtUtc": "2026-04-10T01:01:01Z",
                                  "bronzeRawPayloadPath": "/tmp/worldbank.raw.json",
                                  "bronzeNormalizedPayloadPath": "/tmp/worldbank.normalized.ndjson",
                                  "recordCount": 3,
                                  "notes": {
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
                        .content("""
                                {
                                  "sourceCode": "IMF",
                                  "datasetCode": "IMF_PUBLIC_DATA",
                                  "runKey": "20260410_020202_ny_gdp_mktp_cd",
                                  "fetchedAtUtc": "2026-04-10T02:02:02Z",
                                  "bronzeRawPayloadPath": "/tmp/imf.raw.json",
                                  "bronzeNormalizedPayloadPath": "/tmp/imf.normalized.ndjson",
                                  "recordCount": 1,
                                  "notes": {
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

        mockMvc.perform(get("/api/timeseries/series/availability")
                        .param("countryIso3", "FRA")
                        .param("indicatorCode", "NY.GDP.MKTP.CD"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.count").value(2))
                .andExpect(jsonPath("$.items[0].countryDisplayName").value("France"))
                .andExpect(jsonPath("$.items[0].availableObservationCount").value(greaterThanOrEqualTo(1)));

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
    }
}
