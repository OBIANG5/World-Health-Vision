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
import java.io.IOException;
import java.net.InetSocketAddress;
import java.nio.charset.StandardCharsets;
import java.security.KeyPair;
import java.security.KeyPairGenerator;
import java.security.interfaces.RSAPublicKey;
import java.time.Instant;
import java.util.Date;
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
 * End-to-end JWT cryptographic tests. No mockJwt() and no fake JWT decoder.
 *
 * <p>A temporary RSA signing identity and HTTP JWKS exist ONLY on loopback.
 * They must never be configured on a real host. The production decoder reads
 * JWKS from a trusted HTTPS issuer and validates signature, issuer, audience
 * and lifetime. We also test least-privileged Advisor scopes.
 */
@SpringBootTest(
        webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT,
        properties = {
                "whv.security.enabled=true",
                "whv.security.public-read-enabled=true",
                "whv.security.allow-insecure-loopback-jwks-for-tests=true"
        }
)
@AutoConfigureWebTestClient
class GatewaySignedJwtIntegrationTest {

    private static final String AUDIENCE = "worldvision-international-api";
    private static final String KID = "worldvision-ci-only-key";
    private static HttpServer jwks;
    private static HttpServer analytics;
    private static KeyPair trustedKey;
    private static KeyPair attackerKey;
    private static String issuer;
    private static final AtomicInteger forwarded = new AtomicInteger();

    @Autowired
    private WebTestClient client;

    @DynamicPropertySource
    static synchronized void configure(DynamicPropertyRegistry registry) throws Exception {
        if (jwks == null) {
            KeyPairGenerator generator = KeyPairGenerator.getInstance("RSA");
            generator.initialize(2048);
            trustedKey = generator.generateKeyPair();
            attackerKey = generator.generateKeyPair();

            RSAKey publicJwk = new RSAKey.Builder((RSAPublicKey) trustedKey.getPublic())
                    .keyID(KID).build();
            String jwksJson = new JWKSet(publicJwk).toString();

            jwks = HttpServer.create(new InetSocketAddress("127.0.0.1", 0), 0);
            jwks.createContext("/keys", exchange -> json(exchange, jwksJson));
            jwks.start();
            issuer = "http://127.0.0.1:" + jwks.getAddress().getPort() + "/issuer";

            analytics = HttpServer.create(new InetSocketAddress("127.0.0.1", 0), 0);
            analytics.createContext("/api/analytics/", exchange -> {
                forwarded.incrementAndGet();
                json(exchange, "{\"ok\":true}");
            });
            analytics.start();
        }
        registry.add("whv.security.issuer-uri", () -> issuer);
        registry.add("whv.security.jwk-set-uri",
                () -> "http://127.0.0.1:" + jwks.getAddress().getPort() + "/keys");
        registry.add("whv.security.audience", () -> AUDIENCE);
        registry.add("WHV_ANALYTICS_BASE_URL",
                () -> "http://127.0.0.1:" + analytics.getAddress().getPort());
    }

    @AfterAll
    static void cleanup() {
        if (jwks != null) {
            jwks.stop(0);
        }
        if (analytics != null) {
            analytics.stop(0);
        }
    }

    @Test
    void validSignedRsaTokenWithExpectedAudienceReachesProductFacade() throws Exception {
        int before = forwarded.get();
        client.get().uri("/api/product/countries/GAB/overview")
                .headers(h -> h.setBearerAuth(token(issuer, AUDIENCE, "read", 0, 3600, trustedKey)))
                .exchange().expectStatus().isOk();
        assertThat(forwarded.get()).isEqualTo(before + 1);
    }

    @Test
    void wrongAudienceIsRejectedBeforeForwarding() throws Exception {
        reject(token(issuer, "some-other-service", "read", 0, 3600, trustedKey));
    }

    @Test
    void wrongIssuerIsRejectedBeforeForwarding() throws Exception {
        reject(token("https://attacker.example/issuer", AUDIENCE, "read", 0, 3600, trustedKey));
    }

    @Test
    void expiredJwtIsRejectedBeforeForwarding() throws Exception {
        reject(token(issuer, AUDIENCE, "read", -7200, -3600, trustedKey));
    }

    @Test
    void notYetValidJwtIsRejectedBeforeForwarding() throws Exception {
        reject(token(issuer, AUDIENCE, "read", 3600, 7200, trustedKey));
    }

    @Test
    void forgedSignatureWithMatchingKidIsRejectedBeforeForwarding() throws Exception {
        reject(token(issuer, AUDIENCE, "read", 0, 3600, attackerKey));
    }

    @Test
    void malformedTokenAndNonJwtAreRejected() {
        reject("not-a-jwt");
        reject("eyJhbGciOiJub25lIn0.eyJzdWIiOiJhZG1pbiJ9.");
    }

    @Test
    void advisorRequiresBothCryptographicIdentityAndExplicitScope() throws Exception {
        int before = forwarded.get();
        String readOnly = token(issuer, AUDIENCE, "read", 0, 3600, trustedKey);
        client.post().uri("/api/analytics/advisor/chat")
                .headers(h -> h.setBearerAuth(readOnly))
                .header("Content-Type", "application/json")
                .bodyValue("{\"question\":\"Explain an economic indicator\"}")
                .exchange().expectStatus().isForbidden();
        assertThat(forwarded.get()).isEqualTo(before);

        String advisor = token(issuer, AUDIENCE, "advisor:invoke", 0, 3600, trustedKey);
        client.post().uri("/api/analytics/advisor/chat")
                .headers(h -> h.setBearerAuth(advisor))
                .header("Content-Type", "application/json")
                .bodyValue("{\"question\":\"Explain an economic indicator\"}")
                .exchange().expectStatus().isOk();
        assertThat(forwarded.get()).isEqualTo(before + 1);
    }

    @Test
    void validJwtStillCannotCallOperatorAndFuturePersonalRoutes() throws Exception {
        String bearer = token(issuer, AUDIENCE, "advisor:invoke", 0, 3600, trustedKey);
        int before = forwarded.get();
        client.get().uri("/api/timeseries/source-runs")
                .headers(h -> h.setBearerAuth(bearer))
                .exchange().expectStatus().isForbidden();
        client.get().uri("/api/users/me")
                .headers(h -> h.setBearerAuth(bearer))
                .exchange().expectStatus().isForbidden();
        assertThat(forwarded.get()).isEqualTo(before);
    }

    @Test
    void publicCountryRemainsAnonymousButAdvisorDoesNot() {
        // No upstream catalogue stub in this class; the PUBLIC authentication
        // boundary can be checked by asserting it is not a 401 response.
        client.get().uri("/api/product/countries/GAB/overview")
                .exchange().expectStatus().is5xxServerError();
        client.post().uri("/api/analytics/advisor/chat")
                .header("Content-Type", "application/json")
                .bodyValue("{}").exchange().expectStatus().isUnauthorized();
    }

    private void reject(String jwt) {
        int before = forwarded.get();
        client.get().uri("/api/product/countries/GAB/overview")
                .headers(h -> h.setBearerAuth(jwt))
                .exchange().expectStatus().isUnauthorized();
        assertThat(forwarded.get()).isEqualTo(before);
    }

    private static String token(String iss, String aud, String scope,
            long startOffsetSeconds, long expiryOffsetSeconds, KeyPair signer) throws Exception {
        Instant now = Instant.now();
        JWTClaimsSet claims = new JWTClaimsSet.Builder()
                .issuer(iss)
                .audience(aud)
                .subject("worldvision-ci-user")
                .issueTime(Date.from(now))
                .notBeforeTime(Date.from(now.plusSeconds(startOffsetSeconds)))
                .expirationTime(Date.from(now.plusSeconds(expiryOffsetSeconds)))
                .claim("scope", scope)
                .build();
        SignedJWT signed = new SignedJWT(
                new JWSHeader.Builder(JWSAlgorithm.RS256).keyID(KID).build(), claims);
        signed.sign(new RSASSASigner(signer.getPrivate()));
        return signed.serialize();
    }

    private static void json(HttpExchange exchange, String body) throws IOException {
        byte[] bytes = body.getBytes(StandardCharsets.UTF_8);
        exchange.getResponseHeaders().set("Content-Type", "application/json");
        exchange.sendResponseHeaders(200, bytes.length);
        try (var out = exchange.getResponseBody()) {
            out.write(bytes);
        }
    }
}
