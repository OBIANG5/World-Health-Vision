package com.worldhealthvision.research;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.jwt;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.util.UUID;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.JwtRequestPostProcessor;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;
import org.testcontainers.containers.PostgreSQLContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;

/**
 * Real PostgreSQL + Flyway. Mocked JWT identity for ownership tests only;
 * cryptographic tests are separate. No user's actual financial data.
 */
@SpringBootTest(properties = {
    "whv.research.security.issuer=https://identity.tests.invalid/issuer",
    "whv.research.security.jwk-set-uri=https://identity.tests.invalid/jwks",
    "whv.research.security.audience=worldvision-api-ci"
})
@AutoConfigureMockMvc
@Testcontainers
class ResearchWorkspacePostgresIntegrationTest {
    @Container
    static PostgreSQLContainer<?> postgres = new PostgreSQLContainer<>("postgres:16-alpine")
        .withDatabaseName("whv_research")
        .withUsername("research_ci")
        .withPassword("research_ci_test_only");

    @DynamicPropertySource
    static void register(DynamicPropertyRegistry values) {
        values.add("spring.datasource.url", postgres::getJdbcUrl);
        values.add("spring.datasource.username", postgres::getUsername);
        values.add("spring.datasource.password", postgres::getPassword);
    }

    @Autowired MockMvc mvc;
    @Autowired ObjectMapper mapper;

    private JwtRequestPostProcessor user(String subject, String... scopes) {
        var authorities = java.util.Arrays.stream(scopes)
            .map(scope -> new SimpleGrantedAuthority("SCOPE_" + scope)).toList();
        return jwt().jwt(token -> token.issuer("https://identity.tests.invalid/issuer")
                .subject(subject).audience(java.util.List.of("worldvision-api-ci")))
            .authorities(authorities);
    }

    private String sample(String instrument) {
        return """
            {"title":"Private research case","plan":{
              "schemaVersion":1,"instrument":"%s","instrumentKind":"spot",
              "direction":"undecided","mode":"fundamental",
              "fields":{},"evidence":[],"updates":[],"events":[]
            }}
            """.formatted(instrument);
    }

    private MvcResult create(String subject, String instrument) throws Exception {
        return mvc.perform(post("/api/trading/cases").with(user(subject, "trading:write"))
                .contentType(MediaType.APPLICATION_JSON).content(sample(instrument)))
            .andExpect(status().isCreated()).andReturn();
    }

    @Test
    void anonymousOrWrongScopeCannotListCreateOrQueryPrivateDossiers() throws Exception {
        mvc.perform(get("/api/trading/cases")).andExpect(status().isUnauthorized());
        mvc.perform(post("/api/trading/cases").contentType(MediaType.APPLICATION_JSON)
                .content(sample("EURCAD"))).andExpect(status().isUnauthorized());
        mvc.perform(get("/api/trading/cases").with(user("no-scope", "advisor:invoke")))
            .andExpect(status().isForbidden());
        mvc.perform(post("/api/trading/cases").with(user("read-only", "trading:read"))
                .contentType(MediaType.APPLICATION_JSON).content(sample("EURCAD")))
            .andExpect(status().isForbidden());
        mvc.perform(get("/api/trading/transactions").with(user("trader", "trading:read")))
            .andExpect(status().isForbidden());
    }

    @Test
    void twoPrincipalsCannotEnumerateReadChangeOrDeleteEachOthersResearch() throws Exception {
        String ownerA = "owner-a-" + UUID.randomUUID();
        String ownerB = "owner-b-" + UUID.randomUUID();
        MvcResult created = create(ownerA, "AUDCAD");
        JsonNode dossier = mapper.readTree(created.getResponse().getContentAsString());
        String id = dossier.path("id").asText();
        assertThat(created.getResponse().getHeader("ETag")).isEqualTo("\"v1\"");

        mvc.perform(get("/api/trading/cases").with(user(ownerA, "trading:read")))
            .andExpect(status().isOk())
            .andExpect(result -> assertThat(result.getResponse().getContentAsString()).contains(id));

        mvc.perform(get("/api/trading/cases").with(user(ownerB, "trading:read")))
            .andExpect(status().isOk())
            .andExpect(result -> assertThat(result.getResponse().getContentAsString()).doesNotContain(id));

        mvc.perform(get("/api/trading/cases/" + id).with(user(ownerB, "trading:read")))
            .andExpect(status().isNotFound());
        mvc.perform(get("/api/trading/cases/" + id + "/history").with(user(ownerB, "trading:read")))
            .andExpect(status().isNotFound());

        mvc.perform(put("/api/trading/cases/" + id).with(user(ownerB, "trading:write"))
                .header("If-Match", "\"v1\"").contentType(MediaType.APPLICATION_JSON)
                .content(sample("STOLEN")))
            .andExpect(status().isNotFound());
        mvc.perform(delete("/api/trading/cases/" + id).with(user(ownerB, "trading:write"))
                .header("If-Match", "\"v1\""))
            .andExpect(status().isNotFound());

        mvc.perform(get("/api/trading/cases/" + id).with(user(ownerA, "trading:read")))
            .andExpect(status().isOk())
            .andExpect(result -> assertThat(result.getResponse().getContentAsString()).contains("AUDCAD"));
    }

    @Test
    void optimisticConcurrencyAndAppendOnlyRevisionsPreventLostUpdates() throws Exception {
        String subject = "versions-" + UUID.randomUUID();
        MvcResult created = create(subject, "AUDCAD");
        String id = mapper.readTree(created.getResponse().getContentAsString()).path("id").asText();
        mvc.perform(put("/api/trading/cases/" + id).with(user(subject, "trading:write"))
                .contentType(MediaType.APPLICATION_JSON).content(sample("CHFJPY")))
            .andExpect(status().isPreconditionRequired());

        mvc.perform(put("/api/trading/cases/" + id).with(user(subject, "trading:write"))
                .header("If-Match", "\"v0\"")
                .contentType(MediaType.APPLICATION_JSON).content(sample("CHFJPY")))
            .andExpect(status().isBadRequest());

        MvcResult updated = mvc.perform(put("/api/trading/cases/" + id)
                .with(user(subject, "trading:write"))
                .header("If-Match", "\"v1\"")
                .contentType(MediaType.APPLICATION_JSON).content(sample("CHFJPY")))
            .andExpect(status().isOk()).andReturn();
        assertThat(updated.getResponse().getHeader("ETag")).isEqualTo("\"v2\"");

        mvc.perform(put("/api/trading/cases/" + id).with(user(subject, "trading:write"))
                .header("If-Match", "\"v1\"")
                .contentType(MediaType.APPLICATION_JSON).content(sample("STALE")))
            .andExpect(status().isPreconditionFailed());

        mvc.perform(get("/api/trading/cases/" + id + "/history")
                .with(user(subject, "trading:read")))
            .andExpect(status().isOk())
            .andExpect(result -> {
                JsonNode history = mapper.readTree(result.getResponse().getContentAsString());
                assertThat(history.size()).isEqualTo(2);
                assertThat(history.get(0).path("version").asInt()).isEqualTo(2);
                assertThat(history.get(1).path("version").asInt()).isEqualTo(1);
                assertThat(history.get(0).path("plan").path("instrument").asText()).isEqualTo("CHFJPY");
                assertThat(history.get(1).path("plan").path("instrument").asText()).isEqualTo("AUDCAD");
            });

        mvc.perform(delete("/api/trading/cases/" + id).with(user(subject, "trading:write")))
            .andExpect(status().isPreconditionRequired());
        mvc.perform(delete("/api/trading/cases/" + id).with(user(subject, "trading:write"))
                .header("If-Match", "\"v1\""))
            .andExpect(status().isPreconditionFailed());
        mvc.perform(delete("/api/trading/cases/" + id).with(user(subject, "trading:write"))
                .header("If-Match", "\"v2\""))
            .andExpect(status().isNoContent());
        mvc.perform(get("/api/trading/cases/" + id).with(user(subject, "trading:read")))
            .andExpect(status().isNotFound());
    }

    @Test
    void malformedSourceAndUnsupportedTradePayloadNeverEnterDatabase() throws Exception {
        String subject = "rejected-" + UUID.randomUUID();
        mvc.perform(post("/api/trading/cases").with(user(subject, "trading:write"))
                .contentType(MediaType.APPLICATION_JSON).content(
                    sample("EURCAD").replace("\"schemaVersion\":1", "\"schemaVersion\":3")))
            .andExpect(status().isBadRequest());

        String invalidUrl = sample("EURCAD").replace("\"evidence\":[]",
            """
                "evidence":[{"id":"e1","name":"Fake","originalPublisher":"Unknown",
                 "url":"javascript:alert(1)","publishedAt":"2026-11-20",
                 "observation":"Untrusted","perspective":"other","stance":"context"}]
                """.trim());
        mvc.perform(post("/api/trading/cases").with(user(subject, "trading:write"))
                .contentType(MediaType.APPLICATION_JSON).content(invalidUrl))
            .andExpect(status().isBadRequest());
        mvc.perform(get("/api/trading/cases").with(user(subject, "trading:read")))
            .andExpect(status().isOk())
            .andExpect(result -> assertThat(mapper.readTree(result.getResponse()
                .getContentAsString()).size()).isZero());
    }

    @Test
    void healthMayBeAnonymousButMetricsAndPrivateHistoryMayNot() throws Exception {
        mvc.perform(get("/actuator/health")).andExpect(status().isOk());
        mvc.perform(get("/actuator/prometheus")).andExpect(status().isForbidden());
    }
}
