package com.worldhealthvision.gateway;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.security.test.web.reactive.server.SecurityMockServerConfigurers.mockJwt;

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
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.context.annotation.Bean;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.jwt.ReactiveJwtDecoder;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.springframework.test.web.reactive.server.WebTestClient;
import reactor.core.publisher.Mono;

@SpringBootTest(
        webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT,
        properties = "whv.security.enabled=true"
)
@AutoConfigureWebTestClient
class GatewaySecurityIntegrationTest {

    private static HttpServer analyticsServer;
    private static final AtomicReference<String> lastAnalyticsPath = new AtomicReference<>();

    @Autowired
    private WebTestClient webTestClient;

    @DynamicPropertySource
    static void registerProperties(DynamicPropertyRegistry registry) throws IOException {
        ensureAnalyticsServerStarted();
        registry.add("WHV_ANALYTICS_BASE_URL", () -> "http://localhost:" + analyticsServer.getAddress().getPort());
    }

    @BeforeEach
    void resetCapturedRequests() {
        lastAnalyticsPath.set(null);
    }

    @AfterAll
    static void stopAnalyticsServer() {
        if (analyticsServer != null) {
            analyticsServer.stop(0);
        }
    }

    @Test
    void shouldRequireAuthenticationForProductFacadeRoutes() {
        webTestClient.get()
                .uri("/api/product/countries/FRA/overview")
                .exchange()
                .expectStatus().isUnauthorized();

        assertThat(lastAnalyticsPath.get()).isNull();
    }

    @Test
    void shouldAllowAuthenticatedAccessToProductFacadeRoutes() {
        webTestClient.mutateWith(mockJwt())
                .get()
                .uri("/api/product/countries/FRA/overview")
                .exchange()
                .expectStatus().isOk()
                .expectBody()
                .jsonPath("$.forwardedPath").isEqualTo("/api/analytics/countries/FRA/overview");

        assertThat(lastAnalyticsPath.get()).isEqualTo("/api/analytics/countries/FRA/overview");
    }

    private static synchronized void ensureAnalyticsServerStarted() throws IOException {
        if (analyticsServer != null) {
            return;
        }

        analyticsServer = HttpServer.create(new InetSocketAddress(0), 0);
        analyticsServer.createContext("/api/analytics/", new AnalyticsEchoHandler());
        analyticsServer.start();
    }

    private static final class AnalyticsEchoHandler implements HttpHandler {
        @Override
        public void handle(HttpExchange exchange) throws IOException {
            lastAnalyticsPath.set(exchange.getRequestURI().getPath());
            String body = """
                    {
                      "forwardedPath": "%s"
                    }
                    """.formatted(exchange.getRequestURI().getPath());
            byte[] response = body.getBytes(StandardCharsets.UTF_8);
            exchange.getResponseHeaders().add("Content-Type", "application/json");
            exchange.sendResponseHeaders(200, response.length);
            exchange.getResponseBody().write(response);
            exchange.close();
        }
    }

    @TestConfiguration
    static class SecurityTestConfiguration {

        @Bean
        ReactiveJwtDecoder reactiveJwtDecoder() {
            return token -> Mono.just(
                    Jwt.withTokenValue(token)
                            .header("alg", "none")
                            .subject("test-user")
                            .claim("scope", "read")
                            .build()
            );
        }
    }
}
