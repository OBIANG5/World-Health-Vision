package com.worldhealthvision.gateway.security;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "whv.security")
public record GatewaySecurityProperties(
        boolean enabled
) {
}
