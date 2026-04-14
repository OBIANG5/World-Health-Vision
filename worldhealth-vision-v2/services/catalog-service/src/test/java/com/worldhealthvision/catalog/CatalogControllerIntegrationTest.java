package com.worldhealthvision.catalog;

import static org.hamcrest.Matchers.greaterThanOrEqualTo;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.testcontainers.service.connection.ServiceConnection;
import org.springframework.test.web.servlet.MockMvc;
import org.testcontainers.containers.PostgreSQLContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;

@Testcontainers
@SpringBootTest
@AutoConfigureMockMvc
class CatalogControllerIntegrationTest {

    @Container
    @ServiceConnection
    static PostgreSQLContainer<?> postgres = new PostgreSQLContainer<>("postgres:16-alpine");

    @Autowired
    private MockMvc mockMvc;

    @Test
    void shouldExposeReadinessForSeededCatalog() throws Exception {
        mockMvc.perform(get("/api/catalog/readiness"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.sourceCount").value(greaterThanOrEqualTo(10)))
                .andExpect(jsonPath("$.indicatorCount").value(greaterThanOrEqualTo(8)))
                .andExpect(jsonPath("$.regionCount").value(greaterThanOrEqualTo(6)));
    }

    @Test
    void shouldExposeSeededSources() throws Exception {
        mockMvc.perform(get("/api/catalog/sources"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.count").value(greaterThanOrEqualTo(10)));
    }

    @Test
    void shouldExposeSeededIndicators() throws Exception {
        mockMvc.perform(get("/api/catalog/indicators?coreOnly=true"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.count").value(greaterThanOrEqualTo(8)));
    }

    @Test
    void shouldExposeSourceDatasets() throws Exception {
        mockMvc.perform(get("/api/catalog/datasets?sourceCode=WORLD_BANK"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.count").value(greaterThanOrEqualTo(2)));
    }

    @Test
    void shouldExposeCountryDetailsFromWorldBankRegistryWithCurrency() throws Exception {
        mockMvc.perform(get("/api/catalog/countries/FRA"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.iso3").value("FRA"))
                .andExpect(jsonPath("$.displayName").value("France"))
                .andExpect(jsonPath("$.capitalCity").value("Paris"))
                .andExpect(jsonPath("$.currencyCode").value("EUR"))
                .andExpect(jsonPath("$.currencyName").value("Euro"));
    }

    @Test
    void shouldExposeCountrySummaryWithCurrency() throws Exception {
        mockMvc.perform(get("/api/catalog/countries?search=FRA"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.count").value(greaterThanOrEqualTo(1)))
                .andExpect(jsonPath("$.items[0].iso3").value("FRA"))
                .andExpect(jsonPath("$.items[0].currencyCode").value("EUR"));
    }

    @Test
    void shouldExposeCurrencyCatalog() throws Exception {
        mockMvc.perform(get("/api/catalog/currencies/EUR"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value("EUR"))
                .andExpect(jsonPath("$.displayName").value("Euro"))
                .andExpect(jsonPath("$.countryCount").value(greaterThanOrEqualTo(1)));
    }
}