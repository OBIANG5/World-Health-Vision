package com.worldhealthvision.gateway;

import static org.assertj.core.api.Assertions.assertThat;

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
import java.util.List;
import java.util.Map;
import java.util.concurrent.atomic.AtomicInteger;
import org.junit.jupiter.api.AfterAll;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.reactive.AutoConfigureWebTestClient;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.springframework.test.web.reactive.server.WebTestClient;

/**
 * Full Gateway HTTP tests using actual signed RSA JWTs and a real JWKS
 * endpoint on loopback. No mockJwt, no arbitrary trusted X-User header.
 */
@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT, properties = {
    "whv.security.enabled=true",
    "whv.security.public-read-enabled=true",
    "whv.security.oidc-project-roles.enabled=true",
    "whv.security.oidc-project-roles.project-audience=worldvision-project-ci",
    "whv.security.oidc-project-roles.read-role=trading_reader",
    "whv.security.oidc-project-roles.write-role=trading_writer",
    "whv.security.allow-insecure-loopback-jwks-for-tests=true"
})
@AutoConfigureWebTestClient
class GatewayProjectRoleSignedJwtIntegrationTest {
    private static final String AUDIENCE = "worldvision-project-ci";
    private static final String KID = "role-test-ci-only";
    private static HttpServer jwks;
    private static HttpServer research;
    private static KeyPair trusted;
    private static KeyPair attacker;
    private static String issuer;
    private static final AtomicInteger forwarded = new AtomicInteger();

    @Autowired WebTestClient client;

    @DynamicPropertySource
    static synchronized void setup(DynamicPropertyRegistry registry) throws Exception {
        if (jwks == null) {
            KeyPairGenerator gen = KeyPairGenerator.getInstance("RSA");
            gen.initialize(2048);
            trusted = gen.generateKeyPair();
            attacker = gen.generateKeyPair();
            String keys = new JWKSet(new RSAKey.Builder((RSAPublicKey) trusted.getPublic())
                .keyID(KID).build()).toString();
            jwks = HttpServer.create(new InetSocketAddress("127.0.0.1", 0), 0);
            jwks.createContext("/keys", exchange -> respond(exchange, keys));
            jwks.start();
            issuer = "http://127.0.0.1:" + jwks.getAddress().getPort() + "/issuer";
            research = HttpServer.create(new InetSocketAddress("127.0.0.1", 0), 0);
            research.createContext("/api/trading/cases", exchange -> {
                forwarded.incrementAndGet();
                respond(exchange, "{}");
            });
            research.start();
        }
        registry.add("whv.security.issuer-uri", () -> issuer);
        registry.add("whv.security.jwk-set-uri",
            () -> "http://127.0.0.1:" + jwks.getAddress().getPort() + "/keys");
        registry.add("whv.security.audience", () -> AUDIENCE);
        registry.add("WHV_RESEARCH_BASE_URL",
            () -> "http://127.0.0.1:" + research.getAddress().getPort());
    }

    @AfterAll
    static void cleanup() {
        if (jwks != null) jwks.stop(0);
        if (research != null) research.stop(0);
    }

    @Test
    void signedProjectReadRoleAllowsOnlyReadOnItsOwnProject() throws Exception {
        String token = sign(trusted, issuer, AUDIENCE,
            roles("trading_reader"), "openid profile", true);
        int before = forwarded.get();
        client.get().uri("/api/trading/cases")
            .headers(h -> h.setBearerAuth(token))
            .exchange().expectStatus().isOk();
        client.post().uri("/api/trading/cases")
            .headers(h -> h.setBearerAuth(token))
            .bodyValue("{}").exchange().expectStatus().isForbidden();
        assertThat(forwarded.get()).isEqualTo(before + 1);
    }

    @Test
    void signedProjectWriteRoleCannotReadWithoutSeparateReadGrant() throws Exception {
        String token = sign(trusted, issuer, AUDIENCE, roles("trading_writer"), "openid", true);
        int before = forwarded.get();
        client.get().uri("/api/trading/cases")
            .headers(h -> h.setBearerAuth(token))
            .exchange().expectStatus().isForbidden();
        client.post().uri("/api/trading/cases")
            .headers(h -> h.setBearerAuth(token))
            .bodyValue("{}").exchange().expectStatus().isOk();
        assertThat(forwarded.get()).isEqualTo(before + 1);
    }

    @Test
    void issuerAndAudienceWithoutActualRoleNeverGrantAccess() throws Exception {
        int before = forwarded.get();
        for (Map<String, Object> claims : List.<Map<String, Object>>of(
                Map.<String, Object>of(),
                Map.of(OidcProjectRolePermissions.ROLE_CLAIM, Map.of()),
                Map.of(OidcProjectRolePermissions.ROLE_CLAIM,
                    Map.of("trading_reader", Map.of())),
                Map.of(OidcProjectRolePermissions.ROLE_CLAIM,
                    Map.of("trading_reader", "self-asserted")),
                Map.of("roles", List.of("trading_reader")),
                roles("unrelated_role"))) {
            String signed = sign(trusted, issuer, AUDIENCE, claims, "openid profile", true);
            client.get().uri("/api/trading/cases")
                .headers(h -> h.setBearerAuth(signed))
                .exchange().expectStatus().isForbidden();
        }
        assertThat(forwarded.get()).isEqualTo(before);
    }

    @Test
    void forgedSignatureWrongAudienceWrongIssuerAndExpiredRoleTokensAreRejected() throws Exception {
        int before = forwarded.get();
        for (String jwt : List.of(
            sign(attacker, issuer, AUDIENCE, roles("trading_reader"), "openid", true),
            sign(trusted, issuer, "different-project", roles("trading_reader"), "openid", true),
            sign(trusted, "https://attacker.invalid/issuer", AUDIENCE,
                roles("trading_reader"), "openid", true),
            sign(trusted, issuer, AUDIENCE, roles("trading_reader"), "openid", false))) {
            client.get().uri("/api/trading/cases")
                .headers(h -> h.setBearerAuth(jwt))
                .exchange().expectStatus().isUnauthorized();
        }
        assertThat(forwarded.get()).isEqualTo(before);
    }

    @Test
    void noTokenAndUnknownPathsRemainDeniedEvenWithValidProjectGrant() throws Exception {
        int before = forwarded.get();
        client.get().uri("/api/trading/cases").exchange().expectStatus().isUnauthorized();
        String signed = sign(trusted, issuer, AUDIENCE, roles("trading_reader"), "openid", true);
        client.get().uri("/api/trading/cases/admin/steal")
            .headers(h -> h.setBearerAuth(signed))
            .exchange().expectStatus().isForbidden();
        assertThat(forwarded.get()).isEqualTo(before);
    }

    private static Map<String, Object> roles(String roleKey) {
        return Map.of(OidcProjectRolePermissions.ROLE_CLAIM,
            Map.of(roleKey, Map.of("org-2026", "worldvision.example")));
    }

    private static String sign(KeyPair signer, String iss, String aud, Map<String, Object> grants,
            String scope, boolean futureExpiry) throws Exception {
        Instant now = Instant.now();
        JWTClaimsSet.Builder claims = new JWTClaimsSet.Builder()
            .issuer(iss).subject("synthetic-user-a").audience(aud)
            .issueTime(Date.from(now.minusSeconds(30)))
            .notBeforeTime(Date.from(now.minusSeconds(30)))
            .expirationTime(Date.from(now.plusSeconds(futureExpiry ? 3600 : -3600)))
            .claim("scope", scope);
        grants.forEach(claims::claim);
        SignedJWT signed = new SignedJWT(new JWSHeader.Builder(JWSAlgorithm.RS256)
            .keyID(KID).build(), claims.build());
        signed.sign(new RSASSASigner(signer.getPrivate()));
        return signed.serialize();
    }

    private static void respond(HttpExchange exchange, String body) throws IOException {
        byte[] bytes = body.getBytes(StandardCharsets.UTF_8);
        exchange.getResponseHeaders().set("Content-Type", "application/json");
        exchange.sendResponseHeaders(200, bytes.length);
        try (var stream = exchange.getResponseBody()) { stream.write(bytes); }
    }
}
