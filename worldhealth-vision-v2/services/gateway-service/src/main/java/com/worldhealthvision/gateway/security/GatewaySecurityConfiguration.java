package com.worldhealthvision.gateway.security;

import static org.springframework.http.HttpMethod.GET;
import static org.springframework.http.HttpMethod.POST;

import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.web.server.ServerHttpSecurity;
import org.springframework.security.web.server.SecurityWebFilterChain;

/**
 * Fail-closed Gateway access policy for World-Vision's international products.
 * Public-read is a conscious opt-in: never expose all /api/** just because the
 * application has a public homepage.
 */
@Configuration
@EnableConfigurationProperties(GatewaySecurityProperties.class)
public class GatewaySecurityConfiguration {

    // Local development/test mode only. NEVER enabled by omission in production.
    @Bean
    @ConditionalOnProperty(prefix = "whv.security", name = "enabled", havingValue = "false")
    SecurityWebFilterChain localDevelopmentSecurityWebFilterChain(ServerHttpSecurity http) {
        return http
                .csrf(ServerHttpSecurity.CsrfSpec::disable)
                .authorizeExchange(exchanges -> exchanges.anyExchange().permitAll())
                .build();
    }

    @Bean
    @ConditionalOnProperty(prefix = "whv.security", name = "enabled", havingValue = "true", matchIfMissing = true)
    SecurityWebFilterChain securedSecurityWebFilterChain(
            ServerHttpSecurity http,
            GatewaySecurityProperties properties
    ) {
        return http
                .csrf(ServerHttpSecurity.CsrfSpec::disable)
                .authorizeExchange(exchanges -> {
                    // Only readiness is public: never expose info/prometheus/details
                    // through the public edge. Scrape metrics privately.
                    exchanges.pathMatchers(GET, "/actuator/health").permitAll();
                    exchanges.pathMatchers("/actuator/**").denyAll();

                    // Same reviewed list in both modes. No accidental new endpoints
                    // turn public when a future service adds a personal/user route.
                    if (properties.publicReadEnabled()) {
                        exchanges.pathMatchers(GET, PublicReadRoutes.PATHS).permitAll();
                    } else {
                        exchanges.pathMatchers(GET, PublicReadRoutes.PATHS).authenticated();
                    }

                    // Personal Trading research is NEVER in PublicReadRoutes.
                    // JWT signature, issuer, audience and scope are verified here;
                    // the upstream private service independently verifies again.
                    exchanges.pathMatchers(GET, "/api/trading/cases",
                            "/api/trading/cases/*", "/api/trading/cases/*/history")
                        .hasAuthority("SCOPE_trading:read");
                    exchanges.pathMatchers(POST, "/api/trading/cases")
                        .hasAuthority("SCOPE_trading:write");
                    exchanges.pathMatchers(org.springframework.http.HttpMethod.PUT,
                            "/api/trading/cases/*")
                        .hasAuthority("SCOPE_trading:write");
                    exchanges.pathMatchers(org.springframework.http.HttpMethod.DELETE,
                            "/api/trading/cases/*")
                        .hasAuthority("SCOPE_trading:write");

                    // Advisor requests are not public anonymous operations. Add a
                    // real per-user quota and rate limiting before Internet launch.
                    exchanges.pathMatchers(POST, "/api/analytics/advisor/chat").hasAuthority("SCOPE_advisor:invoke");

                    // No ingestion mutation, source-run metadata, future personal
                    // endpoints, arbitrary POST, WebSocket or unspecified routes.
                    exchanges.anyExchange().denyAll();
                })
                .oauth2ResourceServer(oauth2 -> oauth2.jwt(Customizer.withDefaults()))
                .build();
    }
}
