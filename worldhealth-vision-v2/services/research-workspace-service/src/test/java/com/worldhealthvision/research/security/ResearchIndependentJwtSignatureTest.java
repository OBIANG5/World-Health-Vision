package com.worldhealthvision.research.security;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import com.nimbusds.jose.JWSAlgorithm;
import com.nimbusds.jose.JWSHeader;
import com.nimbusds.jose.crypto.RSASSASigner;
import com.nimbusds.jose.jwk.JWKSet;
import com.nimbusds.jose.jwk.RSAKey;
import com.nimbusds.jwt.JWTClaimsSet;
import com.nimbusds.jwt.SignedJWT;
import com.sun.net.httpserver.HttpServer;
import java.net.InetSocketAddress;
import java.nio.charset.StandardCharsets;
import java.security.KeyPair;
import java.security.KeyPairGenerator;
import java.security.interfaces.RSAPublicKey;
import java.time.Instant;
import java.util.Date;
import org.junit.jupiter.api.Test;
import org.springframework.security.oauth2.jwt.JwtDecoder;

/** No mockJwt(): decode actual RSA signatures against loopback JWKS. */
class ResearchIndependentJwtSignatureTest {
    private static final String KID = "private-research-ci-2026";

    @Test
    void issuerAudienceSubjectSignatureAndExpiryMustAllBeValid() throws Exception {
        KeyPairGenerator gen = KeyPairGenerator.getInstance("RSA");
        gen.initialize(2048);
        KeyPair trusted = gen.generateKeyPair();
        KeyPair attacker = gen.generateKeyPair();
        String jwksJson = new JWKSet(new RSAKey.Builder((RSAPublicKey) trusted.getPublic())
            .keyID(KID).build()).toString();

        HttpServer keys = HttpServer.create(new InetSocketAddress("127.0.0.1", 0), 0);
        keys.createContext("/keys", exchange -> {
            byte[] payload = jwksJson.getBytes(StandardCharsets.UTF_8);
            exchange.getResponseHeaders().set("Content-Type", "application/json");
            exchange.sendResponseHeaders(200, payload.length);
            try (var stream = exchange.getResponseBody()) { stream.write(payload); }
        });
        keys.start();
        try {
            String issuer = "http://127.0.0.1:" + keys.getAddress().getPort() + "/issuer";
            String url = "http://127.0.0.1:" + keys.getAddress().getPort() + "/keys";
            JwtDecoder decoder = new ResearchJwtSecurity()
                .researchJwtDecoder(issuer, url, "worldvision-ci", true);
            assertThat(decoder.decode(sign(trusted, issuer, "worldvision-ci", "trader-a", -60, 3600))
                .getSubject()).isEqualTo("trader-a");

            assertThatThrownBy(() -> decoder.decode(
                sign(trusted, issuer, "wrong-audience", "trader-a", -60, 3600)))
                .isInstanceOf(Exception.class);
            assertThatThrownBy(() -> decoder.decode(
                sign(trusted, "https://malicious.test/issuer", "worldvision-ci", "trader-a", -60, 3600)))
                .isInstanceOf(Exception.class);
            assertThatThrownBy(() -> decoder.decode(
                sign(trusted, issuer, "worldvision-ci", "", -60, 3600)))
                .isInstanceOf(Exception.class);
            assertThatThrownBy(() -> decoder.decode(
                sign(trusted, issuer, "worldvision-ci", "trader-a", -7200, -3600)))
                .isInstanceOf(Exception.class);
            assertThatThrownBy(() -> decoder.decode(
                sign(attacker, issuer, "worldvision-ci", "trader-a", -60, 3600)))
                .isInstanceOf(Exception.class);
            assertThatThrownBy(() -> decoder.decode("eyJhbGciOiJub25lIn0.eyJzdWIiOiJhZG1pbiJ9."))
                .isInstanceOf(Exception.class);
        } finally {
            keys.stop(0);
        }
    }

    @Test
    void productionSecurityRefusesUnconfiguredOrInsecureIssuerAndJwks() {
        var config = new ResearchJwtSecurity();
        assertThatThrownBy(() -> config.researchJwtDecoder("", "", "", false))
            .isInstanceOf(IllegalStateException.class);
        assertThatThrownBy(() -> config.researchJwtDecoder(
            "http://localhost/issuer", "http://localhost/keys", "worldvision", false))
            .isInstanceOf(IllegalStateException.class);
        assertThatThrownBy(() -> config.researchJwtDecoder(
            "https://issuer.example", "http://evil.example/jwks", "worldvision", true))
            .isInstanceOf(IllegalStateException.class);
    }

    private static String sign(KeyPair key, String issuer, String audience, String subject,
            long issuedOffsetSeconds, long expiryOffsetSeconds) throws Exception {
        Instant now = Instant.now();
        JWTClaimsSet claims = new JWTClaimsSet.Builder()
            .issuer(issuer).subject(subject).audience(audience)
            .issueTime(Date.from(now.plusSeconds(issuedOffsetSeconds)))
            .notBeforeTime(Date.from(now.plusSeconds(issuedOffsetSeconds)))
            .expirationTime(Date.from(now.plusSeconds(expiryOffsetSeconds)))
            .claim("scope", "trading:read trading:write").build();
        SignedJWT jwt = new SignedJWT(new JWSHeader.Builder(JWSAlgorithm.RS256)
            .keyID(KID).build(), claims);
        jwt.sign(new RSASSASigner(key.getPrivate()));
        return jwt.serialize();
    }
}
