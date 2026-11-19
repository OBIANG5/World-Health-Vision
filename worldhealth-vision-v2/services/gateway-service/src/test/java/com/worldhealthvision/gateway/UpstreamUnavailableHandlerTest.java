package com.worldhealthvision.gateway;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.springframework.cloud.gateway.support.ServerWebExchangeUtils.GATEWAY_ROUTE_ATTR;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.net.ConnectException;
import java.net.UnknownHostException;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;
import org.springframework.mock.http.server.reactive.MockServerHttpRequest;
import org.springframework.mock.web.server.MockServerWebExchange;

class UpstreamUnavailableHandlerTest {
    private final ObjectMapper mapper = new ObjectMapper();
    private final UpstreamUnavailableHandler handler = new UpstreamUnavailableHandler(mapper);

    @Test
    void onlyRoutedConnectivityFailureReturnsUncacheable503WithoutInternalDetails() throws Exception {
        var exchange = MockServerWebExchange.from(
                MockServerHttpRequest.get("/api/product/countries/FRA/economic-snapshot")
        );
        exchange.getAttributes().put(GATEWAY_ROUTE_ATTR, new Object());
        var failure = new IllegalStateException("wrapper",
                new ConnectException("private-db.internal:5432 token=do-not-expose"));

        handler.handle(exchange, failure).block();

        assertThat(exchange.getResponse().getStatusCode()).isEqualTo(HttpStatus.SERVICE_UNAVAILABLE);
        assertThat(exchange.getResponse().getHeaders().getCacheControl()).contains("no-store");
        assertThat(exchange.getResponse().getHeaders().getFirst("Retry-After")).isEqualTo("5");

        String body = exchange.getResponse().getBodyAsString().block();
        JsonNode data = mapper.readTree(body);
        assertThat(data.get("error").asText()).isEqualTo("UPSTREAM_UNAVAILABLE");
        assertThat(data.get("retryable").asBoolean()).isTrue();
        assertThat(data.hasNonNull("requestId")).isTrue();
        assertThat(body).doesNotContain("private-db", "token=", "5432", "ConnectException");
        assertThat(data.has("statistics")).isFalse();
    }

    @Test
    void dockerDnsDisappearanceIsARealUpstreamOutageNotAnApplicationError() throws Exception {
        var exchange = MockServerWebExchange.from(
                MockServerHttpRequest.get("/api/product/countries/FRA/economic-snapshot")
        );
        exchange.getAttributes().put(GATEWAY_ROUTE_ATTR, new Object());
        // The disposable Compose test stops Analytics, which removes its DNS
        // address from Docker's internal resolver before routing is attempted.
        var failure = new UnknownHostException("analytics-service");
        handler.handle(exchange, failure).block();

        assertThat(exchange.getResponse().getStatusCode())
                .isEqualTo(HttpStatus.SERVICE_UNAVAILABLE);
        String body = exchange.getResponse().getBodyAsString().block();
        assertThat(mapper.readTree(body).get("error").asText())
                .isEqualTo("UPSTREAM_UNAVAILABLE");
        assertThat(body).doesNotContain("analytics-service");
    }

    @Test
    void nonRoutedErrorsAreNotReclassified() {
        var exchange = MockServerWebExchange.from(MockServerHttpRequest.get("/api/anything"));
        ConnectException error = new ConnectException("local-error");
        assertThatThrownBy(() -> handler.handle(exchange, error).block())
                .hasCauseInstanceOf(ConnectException.class)
                .hasMessageContaining("local-error");
        assertThat(exchange.getResponse().getStatusCode()).isNull();
    }

    @Test
    void ApplicationErrorsAreNotTurnedIntoFakeOutage() {
        var exchange = MockServerWebExchange.from(MockServerHttpRequest.get("/api/product/countries/FRA/overview"));
        exchange.getAttributes().put(GATEWAY_ROUTE_ATTR, new Object());
        IllegalArgumentException error = new IllegalArgumentException("bad request");
        assertThatThrownBy(() -> handler.handle(exchange, error).block())
                .isInstanceOf(IllegalArgumentException.class);
        assertThat(exchange.getResponse().getStatusCode()).isNull();
    }
}
