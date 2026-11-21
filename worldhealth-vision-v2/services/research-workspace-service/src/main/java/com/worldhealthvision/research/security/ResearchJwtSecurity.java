package com.worldhealthvision.research.security;

import java.net.URI;
import java.util.List;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.oauth2.core.DelegatingOAuth2TokenValidator;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.jwt.JwtClaimValidator;
import org.springframework.security.oauth2.jwt.JwtDecoder;
import org.springframework.security.oauth2.jwt.JwtValidators;
import org.springframework.security.oauth2.jwt.NimbusJwtDecoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationConverter;
import org.springframework.security.config.http.SessionCreationPolicy;

/**
 * Independent JWT signature, issuer, audience, subject and expiry checks.
 * Internal network location and Gateway headers NEVER grant identity.
 * Only a signed bearer token yields the authenticated owner.
 */
@Configuration(proxyBeanMethods = false)
@EnableWebSecurity
public class ResearchJwtSecurity {

    @Bean
    SecurityFilterChain researchSecurityFilterChain(HttpSecurity http,
            ObjectProvider<JwtAuthenticationConverter> projectRoles) throws Exception {
        return http
            .csrf(csrf -> csrf.disable())
            .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
            .authorizeHttpRequests(auth -> auth
                .requestMatchers(HttpMethod.GET, "/actuator/health").permitAll()
                .requestMatchers("/actuator/**").denyAll()
                .requestMatchers(HttpMethod.GET, "/api/trading/cases", "/api/trading/cases/*",
                    "/api/trading/cases/*/history").hasAuthority("SCOPE_trading:read")
                .requestMatchers(HttpMethod.POST, "/api/trading/cases").hasAuthority("SCOPE_trading:write")
                .requestMatchers(HttpMethod.PUT, "/api/trading/cases/*").hasAuthority("SCOPE_trading:write")
                .requestMatchers(HttpMethod.DELETE, "/api/trading/cases/*").hasAuthority("SCOPE_trading:write")
                .anyRequest().denyAll())
            .oauth2ResourceServer(oauth -> oauth.jwt(jwt ->
                projectRoles.ifAvailable(jwt::jwtAuthenticationConverter)))
            .build();
    }

    @Bean
    JwtDecoder researchJwtDecoder(
        @Value("${whv.research.security.issuer:}") String issuer,
        @Value("${whv.research.security.jwk-set-uri:}") String jwks,
        @Value("${whv.research.security.audience:}") String audience,
        @Value("${whv.research.security.allow-loopback-test-jwks:false}") boolean loopbackOnly
    ) {
        if (issuer.isBlank() || jwks.isBlank() || audience.isBlank()) {
            throw new IllegalStateException(
                "Private Research Workspace requires signed JWT issuer, JWKS URL and API audience");
        }
        URI issuerUri = checkedUri(issuer, loopbackOnly);
        URI keysUri = checkedUri(jwks, loopbackOnly);
        if (loopbackOnly && (!isLoopback(issuerUri) || !isLoopback(keysUri))) {
            throw new IllegalStateException("Test-only insecure JWKS requires loopback issuer and keys");
        }
        NimbusJwtDecoder decoder = NimbusJwtDecoder.withJwkSetUri(keysUri.toString()).build();
        decoder.setJwtValidator(new DelegatingOAuth2TokenValidator<>(
            JwtValidators.createDefaultWithIssuer(issuerUri.toString()),
            new JwtClaimValidator<List<String>>("aud", value -> value != null && value.contains(audience)),
            new JwtClaimValidator<String>("sub", value -> value != null && !value.isBlank())
        ));
        return decoder;
    }

    private static URI checkedUri(String value, boolean loopbackOnly) {
        URI result;
        try {
            result = URI.create(value);
        } catch (IllegalArgumentException invalid) {
            throw new IllegalStateException("Invalid identity-provider URI", invalid);
        }
        if (result.getHost() == null || result.getUserInfo() != null || result.getFragment() != null) {
            throw new IllegalStateException("Identity-provider URI requires a host, no credentials and no fragment");
        }
        if ("https".equalsIgnoreCase(result.getScheme())) return result;
        if (loopbackOnly && "http".equalsIgnoreCase(result.getScheme()) && isLoopback(result)) return result;
        throw new IllegalStateException("Private research identity-provider URIs require HTTPS");
    }

    private static boolean isLoopback(URI uri) {
        return "127.0.0.1".equals(uri.getHost()) ||
            "localhost".equalsIgnoreCase(uri.getHost()) || "::1".equals(uri.getHost());
    }
}
