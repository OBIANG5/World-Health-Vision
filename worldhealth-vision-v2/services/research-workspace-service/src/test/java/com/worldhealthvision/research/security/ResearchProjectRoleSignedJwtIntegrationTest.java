package com.worldhealthvision.research.security;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.nimbusds.jose.JWSAlgorithm;
import com.nimbusds.jose.JWSHeader;
import com.nimbusds.jose.crypto.RSASSASigner;
import com.nimbusds.jose.jwk.JWKSet;
import com.nimbusds.jose.jwk.RSAKey;
import com.nimbusds.jwt.JWTClaimsSet;
import com.nimbusds.jwt.SignedJWT;
import com.sun.net.httpserver.HttpExchange;
import com.sun.net.httpserver.HttpServer;
import com.worldhealthvision.common.security.OidcProjectRolePermissions;
import java.io.IOException;
import java.net.InetSocketAddress;
import java.nio.charset.StandardCharsets;
import java.security.KeyPair;
import java.security.KeyPairGenerator;
import java.security.interfaces.RSAPublicKey;
import java.time.Instant;
import java.util.Date;
import java.util.Map;
import java.util.UUID;
import org.junit.jupiter.api.AfterAll;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.springframework.test.web.servlet.MockMvc;
import org.testcontainers.containers.PostgreSQLContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;

/**
 * Independent private service, REAL signed JWTs and REAL PostgreSQL/Flyway.
 * These tests do not trust the Gateway, mockJwt or a client-selected user ID.
 */
@SpringBootTest(properties = {
    "whv.research.security.oidc-project-roles.enabled=true",
    "whv.research.security.oidc-project-roles.project-audience=worldvision-project-ci",
    "whv.research.security.oidc-project-roles.read-role=trading_reader",
    "whv.research.security.oidc-project-roles.write-role=trading_writer",
    "whv.research.security.allow-loopback-test-jwks=true"
})
@AutoConfigureMockMvc
@Testcontainers
class ResearchProjectRoleSignedJwtIntegrationTest {
    private static final String AUDIENCE = "worldvision-project-ci";
    private static final String KID = "research-roles-ci-only";
    private static HttpServer keys;
    private static KeyPair trusted;
    private static KeyPair adversary;
    private static String issuer;

    @Container
    static PostgreSQLContainer<?> postgres = new PostgreSQLContainer<>("postgres:16-alpine")
        .withDatabaseName("role_ci")
        .withUsername("research_ci")
        .withPassword("ci_only");

    @Autowired MockMvc mvc;
    @Autowired ObjectMapper mapper;

    @DynamicPropertySource
    static synchronized void config(DynamicPropertyRegistry registry) throws Exception {
        if (keys == null) {
            KeyPairGenerator gen = KeyPairGenerator.getInstance("RSA");
            gen.initialize(2048);
            trusted = gen.generateKeyPair();
            adversary = gen.generateKeyPair();
            String jwks = new JWKSet(new RSAKey.Builder((RSAPublicKey) trusted.getPublic())
                .keyID(KID).build()).toString();
            keys = HttpServer.create(new InetSocketAddress("127.0.0.1", 0), 0);
            keys.createContext("/keys", exchange -> respond(exchange, jwks));
            keys.start();
            issuer = "http://127.0.0.1:" + keys.getAddress().getPort() + "/issuer";
        }
        registry.add("spring.datasource.url", postgres::getJdbcUrl);
        registry.add("spring.datasource.username", postgres::getUsername);
        registry.add("spring.datasource.password", postgres::getPassword);
        registry.add("whv.research.security.issuer", () -> issuer);
        registry.add("whv.research.security.jwk-set-uri",
            () -> "http://127.0.0.1:" + keys.getAddress().getPort() + "/keys");
        registry.add("whv.research.security.audience", () -> AUDIENCE);
    }

    @AfterAll
    static void stopKeys() {
        if (keys != null) keys.stop(0);
    }

    @Test
    void authenticatedRoleMustMatchOperationAndOwnerIsAlwaysJwtIssuerAndSubject()
            throws Exception {
        String userA = "a-" + UUID.randomUUID();
        String userB = "b-" + UUID.randomUUID();
        String readA = signed(trusted, issuer, AUDIENCE, userA, role("trading_reader"), "openid");
        String writeA = signed(trusted, issuer, AUDIENCE, userA, role("trading_writer"), "openid");
        String readB = signed(trusted, issuer, AUDIENCE, userB, role("trading_reader"), "openid");

        mvc.perform(get("/api/trading/cases").header("Authorization", "Bearer " + readA))
            .andExpect(status().isOk());
        mvc.perform(post("/api/trading/cases")
                .header("Authorization", "Bearer " + readA)
                .contentType(MediaType.APPLICATION_JSON).content(sample()))
            .andExpect(status().isForbidden());
        var response = mvc.perform(post("/api/trading/cases")
                .header("Authorization", "Bearer " + writeA)
                .contentType(MediaType.APPLICATION_JSON).content(sample()))
            .andExpect(status().isCreated()).andReturn();
        JsonNode created = mapper.readTree(response.getResponse().getContentAsString());
        String id = created.path("id").asText();
        assertThat(id).isNotBlank();
        mvc.perform(get("/api/trading/cases/" + id)
                .header("Authorization", "Bearer " + readA))
            .andExpect(status().isOk());
        mvc.perform(get("/api/trading/cases/" + id)
                .header("Authorization", "Bearer " + readB))
            .andExpect(status().isNotFound());
        mvc.perform(get("/api/trading/cases").header("Authorization", "Bearer " + readB))
            .andExpect(status().isOk())
            .andExpect(result -> assertThat(mapper.readTree(result.getResponse()
                .getContentAsString()).size()).isZero());
        mvc.perform(get("/api/trading/cases/" + id)
                .header("Authorization", "Bearer " + writeA))
            .andExpect(status().isForbidden()); // write role alone is NOT read
    }

    @Test
    void validJwtWithProjectAudienceButNoUserGrantCannotReadOrWrite() throws Exception {
        String user = "no-grants-" + UUID.randomUUID();
        for (Map<String, Object> grants : java.util.List.of(
                Map.<String, Object>of(),
                Map.of(OidcProjectRolePermissions.ROLE_CLAIM, Map.of()),
                Map.of(OidcProjectRolePermissions.ROLE_CLAIM,
                    Map.of("trading_reader", Map.of())),
                Map.of("roles", java.util.List.of("trading_reader")))) {
            String bearer = signed(trusted, issuer, AUDIENCE, user, grants, "openid");
            mvc.perform(get("/api/trading/cases")
                    .header("Authorization", "Bearer " + bearer))
                .andExpect(status().isForbidden());
            mvc.perform(post("/api/trading/cases")
                    .header("Authorization", "Bearer " + bearer)
                    .contentType(MediaType.APPLICATION_JSON).content(sample()))
                .andExpect(status().isForbidden());
        }
    }

    @Test
    void independentlyRejectsWrongIssuerAudienceForgedJwtAndMissingToken()
            throws Exception {
        mvc.perform(get("/api/trading/cases")).andExpect(status().isUnauthorized());
        String sub = "forged-" + UUID.randomUUID();
        for (String jwt : java.util.List.of(
            signed(adversary, issuer, AUDIENCE, sub, role("trading_reader"), "openid"),
            signed(trusted, issuer, "another-project", sub, role("trading_reader"), "openid"),
            signed(trusted, "https://attacker.invalid", AUDIENCE,
                sub, role("trading_reader"), "openid"))) {
            mvc.perform(get("/api/trading/cases")
                    .header("Authorization", "Bearer " + jwt))
                .andExpect(status().isUnauthorized());
        }
    }

    @Test
    void legacyExplicitScopeStillWorksWhenProjectRoleOptionIsEnabled() throws Exception {
        String jwt = signed(trusted, issuer, AUDIENCE, "legacy-" + UUID.randomUUID(),
            Map.of(), "trading:read");
        mvc.perform(get("/api/trading/cases").header("Authorization", "Bearer " + jwt))
            .andExpect(status().isOk());
    }

    private static String sample() {
        return """
            {"title":"Research only","plan":{"schemaVersion":1,"instrument":"SYNTHETIC",
              "instrumentKind":"spot","direction":"undecided","mode":"fundamental",
              "fields":{},"evidence":[],"updates":[],"events":[]}}
            """;
    }

    private static Map<String, Object> role(String role) {
        return Map.of(OidcProjectRolePermissions.ROLE_CLAIM,
            Map.of(role, Map.of("org-2026", "worldvision.example")));
    }

    private static String signed(KeyPair key, String iss, String aud, String sub,
            Map<String, Object> grants, String scope) throws Exception {
        Instant now = Instant.now();
        JWTClaimsSet.Builder builder = new JWTClaimsSet.Builder()
            .issuer(iss).subject(sub).audience(aud)
            .issueTime(Date.from(now.minusSeconds(40)))
            .notBeforeTime(Date.from(now.minusSeconds(40)))
            .expirationTime(Date.from(now.plusSeconds(3600))).claim("scope", scope);
        grants.forEach(builder::claim);
        SignedJWT jwt = new SignedJWT(new JWSHeader.Builder(JWSAlgorithm.RS256)
            .keyID(KID).build(), builder.build());
        jwt.sign(new RSASSASigner(key.getPrivate()));
        return jwt.serialize();
    }

    private static void respond(HttpExchange exchange, String body) throws IOException {
        byte[] bytes = body.getBytes(StandardCharsets.UTF_8);
        exchange.getResponseHeaders().add("Content-Type", "application/json");
        exchange.sendResponseHeaders(200, bytes.length);
        try (var output = exchange.getResponseBody()) { output.write(bytes); }
    }
}
