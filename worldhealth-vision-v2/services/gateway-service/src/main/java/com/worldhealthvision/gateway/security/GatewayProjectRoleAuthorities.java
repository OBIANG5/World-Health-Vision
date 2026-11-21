package com.worldhealthvision.gateway.security;

import com.worldhealthvision.common.security.OidcProjectRolePermissions;
import java.util.LinkedHashSet;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.oauth2.server.resource.authentication.JwtGrantedAuthoritiesConverter;
import org.springframework.security.oauth2.server.resource.authentication.ReactiveJwtAuthenticationConverter;
import reactor.core.publisher.Flux;

/**
 * Explicit opt-in: map verified JWT project roles to the existing Trading
 * scopes. Never enabled by default. JWT validation still happens FIRST.
 * A project audience without a signed user role never grants permission.
 */
@Configuration(proxyBeanMethods = false)
public class GatewayProjectRoleAuthorities {
    @Bean
    @ConditionalOnProperty(prefix = "whv.security.oidc-project-roles",
        name = "enabled", havingValue = "true")
    ReactiveJwtAuthenticationConverter projectRoleJwtConverter(
            @Value("${whv.security.audience:}") String requiredAudience,
            @Value("${whv.security.oidc-project-roles.project-audience:}") String projectAudience,
            @Value("${whv.security.oidc-project-roles.read-role:}") String readRole,
            @Value("${whv.security.oidc-project-roles.write-role:}") String writeRole) {
        if (!requiredAudience.equals(projectAudience)) {
            throw new IllegalStateException(
                "Gateway JWT required audience must exactly match the configured OIDC project audience");
        }
        OidcProjectRolePermissions policy =
            new OidcProjectRolePermissions(projectAudience, readRole, writeRole);
        JwtGrantedAuthoritiesConverter standard = new JwtGrantedAuthoritiesConverter();
        ReactiveJwtAuthenticationConverter converter = new ReactiveJwtAuthenticationConverter();
        converter.setJwtGrantedAuthoritiesConverter(jwt -> {
            LinkedHashSet<GrantedAuthority> grants = new LinkedHashSet<>(standard.convert(jwt));
            for (String permission : policy.grantedPermissions(jwt.getAudience(), jwt.getClaims())) {
                grants.add(new SimpleGrantedAuthority("SCOPE_" + permission));
            }
            return Flux.fromIterable(grants);
        });
        return converter;
    }
}
