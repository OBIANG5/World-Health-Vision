package com.worldhealthvision.gateway;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.security.test.web.reactive.server.SecurityMockServerConfigurers.mockJwt;

import com.sun.net.httpserver.HttpExchange;
import com.sun.net.httpserver.HttpServer;
import java.io.IOException;
import java.net.InetSocketAddress;
import java.nio.charset.StandardCharsets;
import java.util.concurrent.atomic.AtomicInteger;
import org.junit.jupiter.api.AfterAll;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.reactive.AutoConfigureWebTestClient;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.context.annotation.Bean;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.jwt.ReactiveJwtDecoder;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.springframework.test.web.reactive.server.WebTestClient;
import reactor.core.publisher.Mono;

/**
 * Public international facts remain anonymous, operator/personal APIs do not.
 * Upstream HTTP servers are deliberately local fake endpoints: these tests
 * verify routing/authentication only and make no claims of live data coverage.
 */
@SpringBootTest(
        webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT,
        properties = {
                "whv.security.enabled=true",
                "whv.security.public-read-enabled=true"
        }
)
@AutoConfigureWebTestClient
class GatewayPublicReadIntegrationTest {

    private static HttpServer catalog;
    private static HttpServer timeseries;
    private static HttpServer analytics;
    private static final AtomicInteger requests = new AtomicInteger();

    @Autowired
    private WebTestClient client;

    @DynamicPropertySource
    static void upstreams(DynamicPropertyRegistry registry) throws IOException {
        if (catalog == null) {
            catalog = createServer("/api/catalog/");
            timeseries = createServer("/api/timeseries/");
            analytics = createServer("/api/analytics/");
        }
        registry.add("WHV_CATALOG_BASE_URL", () -> baseUrl(catalog));
        registry.add("WHV_TIMESERIES_BASE_URL", () -> baseUrl(timeseries));
        registry.add("WHV_ANALYTICS_BASE_URL", () -> baseUrl(analytics));
    }

    @BeforeEach
    void resetCounter() {
        requests.set(0);
    }

    @AfterAll
    static void stopServers() {
        for (HttpServer server : new HttpServer[] {catalog, timeseries, analytics}) {
            if (server != null) {
                server.stop(0);
            }
        }
    }

    @Test
    void globalCountryAndLocalEvidenceAreAnonymous() {
        client.get().uri("/api/catalog/countries?limit=2")
                .exchange().expectStatus().isOk();
        client.get().uri("/api/catalog/countries/GAB/local-context")
                .exchange().expectStatus().isOk();
        client.get().uri("/api/catalog/local-sources/coverage?limit=50")
                .exchange().expectStatus().isOk();
        client.get().uri("/api/catalog/sources")
                .exchange().expectStatus().isOk();
        assertThat(requests.get()).isEqualTo(4);
    }

    @Test
    void historicalSeriesAndAuditedProductFacadesAreAnonymous() {
        client.get().uri("/api/timeseries/series/availability?countryIso3=JPN&indicatorCode=NY.GDP.MKTP.CD")
                .exchange().expectStatus().isOk();
        client.get().uri("/api/timeseries/sources/coverage")
                .exchange().expectStatus().isOk();
        client.get().uri("/api/product/countries/GAB/national-comparisons")
                .exchange().expectStatus().isOk()
                .expectBody().jsonPath("$.forwarded")
                .isEqualTo("/api/analytics/countries/GAB/national-comparisons");
        client.get().uri("/api/analytics/countries/FRA/indicators/NY.GDP.MKTP.CD/source-audit")
                .exchange().expectStatus().isOk();
        client.get().uri("/api/product/continents/AFRICA/economic-snapshot")
                .exchange().expectStatus().isOk();
        assertThat(requests.get()).isEqualTo(5);
    }

    @Test
    void operationalEndpointsAndUndocumentedFutureRoutesStayClosed() {
        String[] forbidden = {
                "/api/timeseries/source-runs",
                "/api/timeseries/readiness",
                "/api/catalog/readiness",
                "/api/analytics/readiness",
                "/api/analytics/new-personal-profile",
                "/api/product/users/current",
                "/api/users/me",
                "/actuator/prometheus",
                "/actuator/info"
        };
        // Spring Security returns 401 to anonymous callers even when the
        // rule is denyAll; an authenticated caller receives 403 instead.
        for (String uri : forbidden) {
            client.get().uri(uri).exchange().expectStatus().isUnauthorized();
            client.mutateWith(mockJwt()).get().uri(uri)
                    .exchange().expectStatus().isForbidden();
        }
        assertThat(requests.get()).isZero();
    }

    @Test
    void anonymousAdvisorIsRejectedButAuthenticatedPostCanReachOnlyAdvisor() {
        client.post().uri("/api/analytics/advisor/chat")
                .header("Content-Type", "application/json")
                .bodyValue("{\"question\":\"What is the inflation in Gabon?\",\"iso3\":\"GAB\"}")
                .exchange().expectStatus().isUnauthorized();
        assertThat(requests.get()).isZero();

        client.mutateWith(mockJwt().authorities(
                        new org.springframework.security.core.authority.SimpleGrantedAuthority("SCOPE_advisor:invoke")))
                .post().uri("/api/analytics/advisor/chat")
                .header("Content-Type", "application/json")
                .bodyValue("{\"question\":\"What is the inflation in Gabon?\",\"iso3\":\"GAB\"}")
                .exchange().expectStatus().isOk();
        assertThat(requests.get()).isEqualTo(1);
    }

    @Test
    void evenAuthenticatedUsersCannotCallInternalWriteEndpoints() {
        client.mutateWith(mockJwt()).post().uri("/internal/timeseries/ingestion/observation-batches")
                .bodyValue("{}").exchange().expectStatus().isForbidden();
        client.mutateWith(mockJwt()).post().uri("/api/timeseries/series")
                .bodyValue("{}").exchange().expectStatus().isForbidden();
        client.mutateWith(mockJwt()).get().uri("/api/timeseries/source-runs")
                .exchange().expectStatus().isForbidden();
        client.mutateWith(mockJwt()).get().uri("/api/users/me")
                .exchange().expectStatus().isForbidden();
        assertThat(requests.get()).isZero();
    }

    @Test
    void publicHealthProbeIsNotADataOrMetricsBackdoor() {
        client.get().uri("/actuator/health")
                .exchange().expectStatus().isOk()
                .expectBody()
                .jsonPath("$.status").exists()
                .jsonPath("$.components").doesNotExist()
                .jsonPath("$.details").doesNotExist();
        client.get().uri("/actuator/prometheus").exchange().expectStatus().isUnauthorized();
        client.mutateWith(mockJwt()).get().uri("/actuator/prometheus")
                .exchange().expectStatus().isForbidden();
        assertThat(requests.get()).isZero();
    }

    private static HttpServer createServer(String contextPath) throws IOException {
        HttpServer server = HttpServer.create(new InetSocketAddress("127.0.0.1", 0), 0);
        server.createContext(contextPath, GatewayPublicReadIntegrationTest::respond);
        server.start();
        return server;
    }

    private static String baseUrl(HttpServer server) {
        return "http://127.0.0.1:" + server.getAddress().getPort();
    }

    private static void respond(HttpExchange exchange) throws IOException {
        requests.incrementAndGet();
        String body = "{\"forwarded\":\"" + exchange.getRequestURI().getPath() + "\"}";
        byte[] bytes = body.getBytes(StandardCharsets.UTF_8);
        exchange.getResponseHeaders().set("Content-Type", "application/json");
        exchange.sendResponseHeaders(200, bytes.length);
        try (var stream = exchange.getResponseBody()) {
            stream.write(bytes);
        }
    }

    @TestConfiguration
    static class StubIdentityConfig {
        @Bean
        ReactiveJwtDecoder reactiveJwtDecoder() {
            return value -> Mono.just(Jwt.withTokenValue(value)
                    .header("alg", "none")
                    .subject("ci-only-user")
                    .claim("scope", "read")
                    .build());
        }
    }
}
