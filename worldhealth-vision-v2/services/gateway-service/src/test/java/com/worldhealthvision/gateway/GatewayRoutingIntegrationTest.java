package com.worldhealthvision.gateway;

import static org.assertj.core.api.Assertions.assertThat;

import com.sun.net.httpserver.HttpExchange;
import com.sun.net.httpserver.HttpHandler;
import com.sun.net.httpserver.HttpServer;
import java.io.IOException;
import java.net.InetSocketAddress;
import java.nio.charset.StandardCharsets;
import java.util.concurrent.atomic.AtomicReference;
import org.junit.jupiter.api.AfterAll;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.reactive.AutoConfigureWebTestClient;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.springframework.test.web.reactive.server.WebTestClient;

@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@AutoConfigureWebTestClient
class GatewayRoutingIntegrationTest {

    private static HttpServer catalogServer;
    private static HttpServer timeseriesServer;
    private static HttpServer analyticsServer;

    private static final AtomicReference<String> lastCatalogMethod = new AtomicReference<>();
    private static final AtomicReference<String> lastCatalogPath = new AtomicReference<>();
    private static final AtomicReference<String> lastCatalogQuery = new AtomicReference<>();

    private static final AtomicReference<String> lastTimeseriesMethod = new AtomicReference<>();
    private static final AtomicReference<String> lastTimeseriesPath = new AtomicReference<>();
    private static final AtomicReference<String> lastTimeseriesQuery = new AtomicReference<>();

    private static final AtomicReference<String> lastAnalyticsMethod = new AtomicReference<>();
    private static final AtomicReference<String> lastAnalyticsPath = new AtomicReference<>();
    private static final AtomicReference<String> lastAnalyticsQuery = new AtomicReference<>();

    @Autowired
    private WebTestClient webTestClient;

    @DynamicPropertySource
    static void registerProperties(DynamicPropertyRegistry registry) throws IOException {
        ensureStubServersStarted();
        registry.add("WHV_CATALOG_BASE_URL", () -> "http://localhost:" + catalogServer.getAddress().getPort());
        registry.add("WHV_TIMESERIES_BASE_URL", () -> "http://localhost:" + timeseriesServer.getAddress().getPort());
        registry.add("WHV_ANALYTICS_BASE_URL", () -> "http://localhost:" + analyticsServer.getAddress().getPort());
    }

    @BeforeEach
    void resetCapturedRequests() {
        lastCatalogMethod.set(null);
        lastCatalogPath.set(null);
        lastCatalogQuery.set(null);
        lastTimeseriesMethod.set(null);
        lastTimeseriesPath.set(null);
        lastTimeseriesQuery.set(null);
        lastAnalyticsMethod.set(null);
        lastAnalyticsPath.set(null);
        lastAnalyticsQuery.set(null);
    }

    @AfterAll
    static void stopStubServers() {
        if (catalogServer != null) {
            catalogServer.stop(0);
        }
        if (timeseriesServer != null) {
            timeseriesServer.stop(0);
        }
        if (analyticsServer != null) {
            analyticsServer.stop(0);
        }
    }

    @Test
    void shouldProxyCatalogReadRequestsAndStripCookieHeaders() {
        webTestClient.get()
                .uri("/api/catalog/readiness")
                .exchange()
                .expectStatus().isOk()
                .expectHeader().doesNotExist("Set-Cookie")
                .expectBody()
                .jsonPath("$.service").isEqualTo("catalog")
                .jsonPath("$.forwardedPath").isEqualTo("/api/catalog/readiness")
                .jsonPath("$.forwardedMethod").isEqualTo("GET");

        assertThat(lastCatalogMethod.get()).isEqualTo("GET");
        assertThat(lastCatalogPath.get()).isEqualTo("/api/catalog/readiness");
        assertThat(lastCatalogQuery.get()).isNull();
    }

    @Test
    void shouldProxyTimeseriesReadRequestsWithQueryString() {
        webTestClient.get()
                .uri("/api/timeseries/series/availability?countryIso3=FRA&indicatorCode=NY.GDP.MKTP.CD&sourceCode=WORLD_BANK")
                .exchange()
                .expectStatus().isOk()
                .expectBody()
                .jsonPath("$.service").isEqualTo("timeseries")
                .jsonPath("$.forwardedPath").isEqualTo("/api/timeseries/series/availability")
                .jsonPath("$.forwardedQuery").isEqualTo("countryIso3=FRA&indicatorCode=NY.GDP.MKTP.CD&sourceCode=WORLD_BANK")
                .jsonPath("$.forwardedMethod").isEqualTo("GET");

        assertThat(lastTimeseriesMethod.get()).isEqualTo("GET");
        assertThat(lastTimeseriesPath.get()).isEqualTo("/api/timeseries/series/availability");
        assertThat(lastTimeseriesQuery.get()).contains("indicatorCode=NY.GDP.MKTP.CD");
    }

    @Test
    void shouldProxyAnalyticsReadRequests() {
        webTestClient.get()
                .uri("/api/analytics/readiness")
                .exchange()
                .expectStatus().isOk()
                .expectHeader().doesNotExist("Set-Cookie")
                .expectBody()
                .jsonPath("$.service").isEqualTo("analytics")
                .jsonPath("$.forwardedPath").isEqualTo("/api/analytics/readiness")
                .jsonPath("$.forwardedMethod").isEqualTo("GET");

        assertThat(lastAnalyticsMethod.get()).isEqualTo("GET");
        assertThat(lastAnalyticsPath.get()).isEqualTo("/api/analytics/readiness");
    }

    @Test
    void shouldRewriteProductFacadeToAnalyticsCountryIndicatorOverview() {
        webTestClient.get()
                .uri("/api/product/countries/FRA/indicators/NY.GDP.MKTP.CD/overview?sourceCode=WORLD_BANK")
                .exchange()
                .expectStatus().isOk()
                .expectBody()
                .jsonPath("$.service").isEqualTo("analytics")
                .jsonPath("$.forwardedPath").isEqualTo("/api/analytics/countries/FRA/indicators/NY.GDP.MKTP.CD/overview")
                .jsonPath("$.forwardedQuery").isEqualTo("sourceCode=WORLD_BANK");

        assertThat(lastAnalyticsPath.get()).isEqualTo("/api/analytics/countries/FRA/indicators/NY.GDP.MKTP.CD/overview");
        assertThat(lastAnalyticsQuery.get()).isEqualTo("sourceCode=WORLD_BANK");
    }

    @Test
    void shouldRewriteProductCountryOverviewToAnalyticsService() {
        webTestClient.get()
                .uri("/api/product/countries/FRA/overview?indicatorCode=NY.GDP.MKTP.CD")
                .exchange()
                .expectStatus().isOk()
                .expectBody()
                .jsonPath("$.service").isEqualTo("analytics")
                .jsonPath("$.forwardedPath").isEqualTo("/api/analytics/countries/FRA/overview")
                .jsonPath("$.forwardedQuery").isEqualTo("indicatorCode=NY.GDP.MKTP.CD");

        assertThat(lastAnalyticsPath.get()).isEqualTo("/api/analytics/countries/FRA/overview");
    }

    @Test
    void shouldRewriteProductCountryEconomicSnapshotToAnalyticsService() {
        webTestClient.get()
                .uri("/api/product/countries/FRA/economic-snapshot?periodGranularity=ANNUAL")
                .exchange()
                .expectStatus().isOk()
                .expectBody()
                .jsonPath("$.service").isEqualTo("analytics")
                .jsonPath("$.forwardedPath").isEqualTo("/api/analytics/countries/FRA/economic-snapshot")
                .jsonPath("$.forwardedQuery").isEqualTo("periodGranularity=ANNUAL");

        assertThat(lastAnalyticsPath.get()).isEqualTo("/api/analytics/countries/FRA/economic-snapshot");
    }

    @Test
    void shouldRewriteProductCountryRelativeCostSnapshotToAnalyticsService() {
        webTestClient.get()
                .uri("/api/product/countries/FRA/relative-cost-snapshot?periodGranularity=QUARTERLY")
                .exchange()
                .expectStatus().isOk()
                .expectBody()
                .jsonPath("$.service").isEqualTo("analytics")
                .jsonPath("$.forwardedPath").isEqualTo("/api/analytics/countries/FRA/relative-cost-snapshot")
                .jsonPath("$.forwardedQuery").isEqualTo("periodGranularity=QUARTERLY");

        assertThat(lastAnalyticsPath.get()).isEqualTo("/api/analytics/countries/FRA/relative-cost-snapshot");
    }

    @Test
    void shouldRewriteProductCountrySourceAuditToAnalyticsService() {
        webTestClient.get()
                .uri("/api/product/countries/FRA/indicators/NY.GDP.MKTP.CD/source-audit?sourceCode=WORLD_BANK")
                .exchange()
                .expectStatus().isOk()
                .expectBody()
                .jsonPath("$.service").isEqualTo("analytics")
                .jsonPath("$.forwardedPath").isEqualTo("/api/analytics/countries/FRA/indicators/NY.GDP.MKTP.CD/source-audit")
                .jsonPath("$.forwardedQuery").isEqualTo("sourceCode=WORLD_BANK");

        assertThat(lastAnalyticsPath.get()).isEqualTo("/api/analytics/countries/FRA/indicators/NY.GDP.MKTP.CD/source-audit");
    }

    @Test
    void shouldRewriteProductRegionOverviewToAnalyticsService() {
        webTestClient.get()
                .uri("/api/product/regions/EUROPE/overview?indicatorCode=NY.GDP.MKTP.CD")
                .exchange()
                .expectStatus().isOk()
                .expectBody()
                .jsonPath("$.service").isEqualTo("analytics")
                .jsonPath("$.forwardedPath").isEqualTo("/api/analytics/regions/EUROPE/overview")
                .jsonPath("$.forwardedQuery").isEqualTo("indicatorCode=NY.GDP.MKTP.CD");

        assertThat(lastAnalyticsPath.get()).isEqualTo("/api/analytics/regions/EUROPE/overview");
    }

    @Test
    void shouldRewriteProductRegionEconomicSnapshotToAnalyticsService() {
        webTestClient.get()
                .uri("/api/product/regions/EUROPE/economic-snapshot?periodGranularity=ANNUAL")
                .exchange()
                .expectStatus().isOk()
                .expectBody()
                .jsonPath("$.service").isEqualTo("analytics")
                .jsonPath("$.forwardedPath").isEqualTo("/api/analytics/regions/EUROPE/economic-snapshot")
                .jsonPath("$.forwardedQuery").isEqualTo("periodGranularity=ANNUAL");

        assertThat(lastAnalyticsPath.get()).isEqualTo("/api/analytics/regions/EUROPE/economic-snapshot");
    }

    @Test
    void shouldRewriteProductRegionRelativeCostSnapshotToAnalyticsService() {
        webTestClient.get()
                .uri("/api/product/regions/EUROPE/relative-cost-snapshot?periodGranularity=QUARTERLY")
                .exchange()
                .expectStatus().isOk()
                .expectBody()
                .jsonPath("$.service").isEqualTo("analytics")
                .jsonPath("$.forwardedPath").isEqualTo("/api/analytics/regions/EUROPE/relative-cost-snapshot")
                .jsonPath("$.forwardedQuery").isEqualTo("periodGranularity=QUARTERLY");

        assertThat(lastAnalyticsPath.get()).isEqualTo("/api/analytics/regions/EUROPE/relative-cost-snapshot");
    }

    @Test
    void shouldRewriteProductContinentIndicatorOverviewToAnalyticsService() {
        webTestClient.get()
                .uri("/api/product/continents/EUROPE/indicators/NY.GDP.MKTP.CD/overview")
                .exchange()
                .expectStatus().isOk()
                .expectBody()
                .jsonPath("$.service").isEqualTo("analytics")
                .jsonPath("$.forwardedPath").isEqualTo("/api/analytics/continents/EUROPE/indicators/NY.GDP.MKTP.CD/overview");

        assertThat(lastAnalyticsPath.get()).isEqualTo("/api/analytics/continents/EUROPE/indicators/NY.GDP.MKTP.CD/overview");
    }

    @Test
    void shouldRewriteProductContinentSourceAuditToAnalyticsService() {
        webTestClient.get()
                .uri("/api/product/continents/EUROPE/indicators/NY.GDP.MKTP.CD/source-audit")
                .exchange()
                .expectStatus().isOk()
                .expectBody()
                .jsonPath("$.service").isEqualTo("analytics")
                .jsonPath("$.forwardedPath").isEqualTo("/api/analytics/continents/EUROPE/indicators/NY.GDP.MKTP.CD/source-audit");

        assertThat(lastAnalyticsPath.get()).isEqualTo("/api/analytics/continents/EUROPE/indicators/NY.GDP.MKTP.CD/source-audit");
    }

    @Test
    void shouldRewriteProductContinentRelativeCostSnapshotToAnalyticsService() {
        webTestClient.get()
                .uri("/api/product/continents/EUROPE/relative-cost-snapshot")
                .exchange()
                .expectStatus().isOk()
                .expectBody()
                .jsonPath("$.service").isEqualTo("analytics")
                .jsonPath("$.forwardedPath").isEqualTo("/api/analytics/continents/EUROPE/relative-cost-snapshot");

        assertThat(lastAnalyticsPath.get()).isEqualTo("/api/analytics/continents/EUROPE/relative-cost-snapshot");
    }

    @Test
    void shouldNotExposeInternalTimeseriesEndpoints() {
        webTestClient.post()
                .uri("/internal/timeseries/ingestion/observation-batches")
                .bodyValue("{}")
                .exchange()
                .expectStatus().isNotFound();

        assertThat(lastTimeseriesMethod.get()).isNull();
    }

    @Test
    void shouldKeepPublicRoutesReadOnlyForNow() {
        webTestClient.post()
                .uri("/api/timeseries/series")
                .bodyValue("{}")
                .exchange()
                .expectStatus().isNotFound();

        assertThat(lastTimeseriesMethod.get()).isNull();
    }

    private static synchronized void ensureStubServersStarted() throws IOException {
        if (catalogServer != null && timeseriesServer != null && analyticsServer != null) {
            return;
        }

        catalogServer = HttpServer.create(new InetSocketAddress(0), 0);
        catalogServer.createContext("/api/catalog/", new JsonEchoHandler(
                "catalog",
                lastCatalogMethod,
                lastCatalogPath,
                lastCatalogQuery
        ));
        catalogServer.start();

        timeseriesServer = HttpServer.create(new InetSocketAddress(0), 0);
        timeseriesServer.createContext("/api/timeseries/", new JsonEchoHandler(
                "timeseries",
                lastTimeseriesMethod,
                lastTimeseriesPath,
                lastTimeseriesQuery
        ));
        timeseriesServer.start();

        analyticsServer = HttpServer.create(new InetSocketAddress(0), 0);
        analyticsServer.createContext("/api/analytics/", new JsonEchoHandler(
                "analytics",
                lastAnalyticsMethod,
                lastAnalyticsPath,
                lastAnalyticsQuery
        ));
        analyticsServer.start();
    }

    private record JsonEchoHandler(
            String serviceName,
            AtomicReference<String> methodCapture,
            AtomicReference<String> pathCapture,
            AtomicReference<String> queryCapture
    ) implements HttpHandler {

        @Override
        public void handle(HttpExchange exchange) throws IOException {
            methodCapture.set(exchange.getRequestMethod());
            pathCapture.set(exchange.getRequestURI().getPath());
            queryCapture.set(exchange.getRequestURI().getRawQuery());

            String body = """
                    {
                      "service": "%s",
                      "forwardedMethod": "%s",
                      "forwardedPath": "%s",
                      "forwardedQuery": %s
                    }
                    """.formatted(
                    serviceName,
                    exchange.getRequestMethod(),
                    exchange.getRequestURI().getPath(),
                    exchange.getRequestURI().getRawQuery() == null
                            ? "null"
                            : "\"" + exchange.getRequestURI().getRawQuery() + "\""
            );

            byte[] response = body.getBytes(StandardCharsets.UTF_8);
            exchange.getResponseHeaders().add("Content-Type", "application/json");
            exchange.getResponseHeaders().add("Set-Cookie", "backend-cookie=should-not-leak");
            exchange.sendResponseHeaders(200, response.length);
            exchange.getResponseBody().write(response);
            exchange.close();
        }
    }
}
