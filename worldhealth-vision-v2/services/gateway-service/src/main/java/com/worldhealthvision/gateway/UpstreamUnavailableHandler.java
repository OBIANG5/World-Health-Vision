package com.worldhealthvision.gateway;

import static org.springframework.cloud.gateway.support.ServerWebExchangeUtils.GATEWAY_ROUTE_ATTR;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.net.ConnectException;
import java.net.SocketTimeoutException;
import java.net.UnknownHostException;
import java.time.Instant;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.concurrent.TimeoutException;
import org.springframework.core.Ordered;
import org.springframework.http.CacheControl;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ServerWebExchange;
import org.springframework.web.server.WebExceptionHandler;
import reactor.core.publisher.Mono;

/**
 * Stable public contract for network-level UPSTREAM outages, before Spring's
 * default 500 handler. Does not swallow application errors, authorization errors,
 * or a valid 4xx/5xx returned by the upstream application.
 *
 * Gateway routes are identified by Spring Cloud Gateway, not by a user header.
 * Do not report downstream hostnames, exception text, credentials or route IDs.
 * No synthetic statistics or fallback facts are returned.
 */
@Component
public final class UpstreamUnavailableHandler implements WebExceptionHandler, Ordered {
    private static final Logger LOG = LoggerFactory.getLogger(UpstreamUnavailableHandler.class);
    private final ObjectMapper mapper;

    public UpstreamUnavailableHandler(ObjectMapper mapper) {
        this.mapper = mapper;
    }

    @Override
    public int getOrder() {
        return -2; // Earlier than DefaultErrorWebExceptionHandler (-1).
    }

    @Override
    public Mono<Void> handle(ServerWebExchange exchange, Throwable failure) {
        boolean routed = exchange.getAttribute(GATEWAY_ROUTE_ATTR) != null;
        boolean networkFailure = isNetworkAvailabilityFailure(failure);
        if (routed && !networkFailure) {
            // Debug the CLASS chain only; never log full messages, tokens, body,
            // URL, country, user or secret. Helps catch new Netty wrapper types.
            LOG.warn("Unmapped routed gateway exception classes: {}", exceptionClasses(failure));
        }
        if (exchange.getResponse().isCommitted() || !routed || !networkFailure) {
            return Mono.error(failure);
        }

        // Never leak upstream availability failures into permanent caches.
        var response = exchange.getResponse();
        response.setStatusCode(HttpStatus.SERVICE_UNAVAILABLE);
        response.getHeaders().setContentType(MediaType.APPLICATION_JSON);
        response.getHeaders().setCacheControl(CacheControl.noStore().getHeaderValue());
        response.getHeaders().set("Retry-After", "5");

        Map<String, Object> body = new LinkedHashMap<>();
        body.put("error", "UPSTREAM_UNAVAILABLE");
        body.put("message", "A required data service is temporarily unavailable.");
        body.put("retryable", true);
        body.put("requestId", exchange.getRequest().getId());
        body.put("timestampUtc", Instant.now().toString());
        try {
            byte[] data = mapper.writeValueAsBytes(body);
            return response.writeWith(Mono.just(response.bufferFactory().wrap(data)));
        } catch (JsonProcessingException exception) {
            return Mono.error(exception);
        }
    }

    private static String exceptionClasses(Throwable error) {
        StringBuilder result = new StringBuilder();
        Throwable current = error;
        for (int i = 0; i < 8 && current != null; i++, current = current.getCause()) {
            if (i > 0) result.append(" > ");
            result.append(current.getClass().getSimpleName());
        }
        return result.toString();
    }

    private static boolean isNetworkAvailabilityFailure(Throwable error) {
        Throwable current = error;
        for (int depth = 0; depth < 12 && current != null; depth++) {
            if (current instanceof UnknownHostException
                    || current instanceof ConnectException
                    || current instanceof SocketTimeoutException
                    || current instanceof TimeoutException
                    || "ConnectTimeoutException".equals(current.getClass().getSimpleName())
                    || "ReadTimeoutException".equals(current.getClass().getSimpleName())
                    || "PrematureCloseException".equals(current.getClass().getSimpleName())) {
                return true;
            }
            current = current.getCause();
        }
        return false;
    }
}
