package com.worldhealthvision.gateway.security;

import java.net.URI;
import java.util.List;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnMissingBean;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.oauth2.core.DelegatingOAuth2TokenValidator;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.jwt.JwtClaimValidator;
import org.springframework.security.oauth2.jwt.JwtValidators;
import org.springframework.security.oauth2.jwt.NimbusReactiveJwtDecoder;
import org.springframework.security.oauth2.jwt.ReactiveJwtDecoder;

/**
 * Signed-JWT validation for the international API perimeter.
 *
 * <p>Signature is checked against a trusted JWKS. Timestamp, issuer and
 * audience are checked for EVERY JWT. No "alg=none" or unsigned JWT path.
 * Tests can explicitly use a loopback HTTP JWKS; public deployment cannot.
 */
@Configuration(proxyBeanMethods = false)
public class GatewayJwtDecoderConfiguration {

    @Bean
    @ConditionalOnMissingBean(ReactiveJwtDecoder.class)
    @ConditionalOnProperty(prefix = "whv.security", name = "enabled", havingValue = "true", matchIfMissing = true)
    ReactiveJwtDecoder gatewayJwtDecoder(
            @Value("${whv.security.issuer-uri:}") String issuer,
            @Value("${whv.security.jwk-set-uri:}") String jwkSetUri,
            @Value("${whv.security.audience:}") String audience,
            @Value("${whv.security.allow-insecure-loopback-jwks-for-tests:false}") boolean loopbackTestOnly
    ) {
        if (issuer.isBlank() || audience.isBlank() || jwkSetUri.isBlank()) {
            throw new IllegalStateException(
                    "Secure Gateway requires issuer, JWK set URI and audience; "
                    + "set WHV_SECURITY_ISSUER_URI, WHV_SECURITY_JWK_SET_URI, "
                    + "WHV_SECURITY_AUDIENCE."
            );
        }

        URI issuerLocation = requireSecureUri(issuer, loopbackTestOnly, "issuer");
        URI jwksLocation = requireSecureUri(jwkSetUri, loopbackTestOnly, "JWKS");
        if (loopbackTestOnly && (!isLoopback(issuerLocation) || !isLoopback(jwksLocation))) {
            throw new IllegalStateException("Insecure test JWKS may only use loopback locations.");
        }

        NimbusReactiveJwtDecoder decoder =
                NimbusReactiveJwtDecoder.withJwkSetUri(jwksLocation.toString()).build();
        decoder.setJwtValidator(new DelegatingOAuth2TokenValidator<>(
                JwtValidators.createDefaultWithIssuer(issuerLocation.toString()),
                new JwtClaimValidator<List<String>>("aud",
                        claims -> claims != null && claims.contains(audience))
        ));
        return decoder;
    }

    private static URI requireSecureUri(String source, boolean loopbackTestOnly, String name) {
        URI uri;
        try {
            uri = URI.create(source);
        } catch (IllegalArgumentException invalid) {
            throw new IllegalStateException("Invalid " + name + " URI", invalid);
        }
        if (uri.getHost() == null || uri.getUserInfo() != null || uri.getFragment() != null) {
            throw new IllegalStateException(name + " URI must have a host, no user info or fragment");
        }
        if ("https".equalsIgnoreCase(uri.getScheme())) {
            return uri;
        }
        if (loopbackTestOnly && "http".equalsIgnoreCase(uri.getScheme()) && isLoopback(uri)) {
            return uri;
        }
        throw new IllegalStateException(name + " requires HTTPS; test-only HTTP restricted to loopback");
    }

    private static boolean isLoopback(URI uri) {
        return "127.0.0.1".equals(uri.getHost()) || "[::1]".equals(uri.getHost())
                || "::1".equals(uri.getHost()) || "localhost".equalsIgnoreCase(uri.getHost());
    }
}
