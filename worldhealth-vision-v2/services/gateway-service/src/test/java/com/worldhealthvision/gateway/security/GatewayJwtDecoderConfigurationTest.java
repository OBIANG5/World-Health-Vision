package com.worldhealthvision.gateway.security;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import org.junit.jupiter.api.Test;

/**
 * Negative tests for the actual production decoder wiring, not a mock.
 * The JWT key endpoint is NOT contacted at construction time.
 */
class GatewayJwtDecoderConfigurationTest {
    private final GatewayJwtDecoderConfiguration configuration = new GatewayJwtDecoderConfiguration();

    @Test
    void refusesMissingIssuerAudienceOrJwks() {
        assertThatThrownBy(() -> configuration.gatewayJwtDecoder(
                "", "https://id.example.org/jwks", "worldvision-api", false))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("requires issuer");
        assertThatThrownBy(() -> configuration.gatewayJwtDecoder(
                "https://id.example.org/issuer", "", "worldvision-api", false))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("requires issuer");
        assertThatThrownBy(() -> configuration.gatewayJwtDecoder(
                "https://id.example.org/issuer", "https://id.example.org/jwks", " ", false))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("requires issuer");
    }

    @Test
    void refusesRemotePlaintextJwksEvenWhenTestSwitchIsRequested() {
        assertThatThrownBy(() -> configuration.gatewayJwtDecoder(
                "https://id.example.org/issuer", "http://remote.example.org/jwks",
                "worldvision-api", true))
                .isInstanceOf(IllegalStateException.class);
    }

    @Test
    void refusesLoopbackPlaintextUnlessTestSwitchIsExplicit() {
        assertThatThrownBy(() -> configuration.gatewayJwtDecoder(
                "http://127.0.0.1:9900/issuer", "http://127.0.0.1:9900/keys",
                "worldvision-ci", false))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("HTTPS");
    }

    @Test
    void refusesAmbiguousIssuerWithUserinfoOrFragments() {
        assertThatThrownBy(() -> configuration.gatewayJwtDecoder(
                "https://person:password@id.example.org/issuer",
                "https://id.example.org/jwks", "worldvision-api", false))
                .isInstanceOf(IllegalStateException.class);
        assertThatThrownBy(() -> configuration.gatewayJwtDecoder(
                "https://id.example.org/issuer#fragment",
                "https://id.example.org/jwks", "worldvision-api", false))
                .isInstanceOf(IllegalStateException.class);
    }

    @Test
    void permitsExplicitHttpsAndLoopbackOnlyForIntegrationTests() {
        assertThat(configuration.gatewayJwtDecoder(
                "https://id.example.org/issuer", "https://id.example.org/jwks",
                "worldvision-api", false)).isNotNull();
        assertThat(configuration.gatewayJwtDecoder(
                "http://127.0.0.1:9900/issuer", "http://127.0.0.1:9900/jwks",
                "worldvision-ci", true)).isNotNull();
    }
}
