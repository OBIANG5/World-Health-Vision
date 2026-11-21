package com.worldhealthvision.research.security;

import com.worldhealthvision.common.security.OidcProjectRolePermissions;
import java.util.LinkedHashSet;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationConverter;
import org.springframework.security.oauth2.server.resource.authentication.JwtGrantedAuthoritiesConverter;

/**
 * Independently apply the same opt-in signed project role policy at the
 * private storage service; trusting the Gateway's decision alone is unsafe.
 */
@Configuration(proxyBeanMethods = false)
public class ResearchProjectRoleAuthorities {
    @Bean
    @ConditionalOnProperty(prefix = "whv.research.security.oidc-project-roles",
        name = "enabled", havingValue = "true")
    JwtAuthenticationConverter projectRoleJwtConverter(
            @Value("${whv.research.security.audience:}") String requiredAudience,
            @Value("${whv.research.security.oidc-project-roles.project-audience:}") String projectAudience,
            @Value("${whv.research.security.oidc-project-roles.read-role:}") String readRole,
            @Value("${whv.research.security.oidc-project-roles.write-role:}") String writeRole) {
        if (!requiredAudience.equals(projectAudience)) {
            throw new IllegalStateException(
                "Research JWT required audience must exactly match the configured OIDC project audience");
        }
        OidcProjectRolePermissions policy =
            new OidcProjectRolePermissions(projectAudience, readRole, writeRole);
        JwtGrantedAuthoritiesConverter standard = new JwtGrantedAuthoritiesConverter();
        JwtAuthenticationConverter converter = new JwtAuthenticationConverter();
        converter.setJwtGrantedAuthoritiesConverter(jwt -> {
            LinkedHashSet<GrantedAuthority> grants = new LinkedHashSet<>();
            // When the provider-specific project-role gate is ON, signed
            // self-requested trading scopes must NEVER bypass user role grants.
            // Unrelated legacy authorities retain their existing behavior.
            for (GrantedAuthority granted : standard.convert(jwt)) {
                if (!granted.getAuthority().equals("SCOPE_trading:read")
                    && !granted.getAuthority().equals("SCOPE_trading:write")) {
                    grants.add(granted);
                }
            }
            for (String permission : policy.grantedPermissions(jwt.getAudience(), jwt.getClaims())) {
                grants.add(new SimpleGrantedAuthority("SCOPE_" + permission));
            }
            return grants;
        });
        return converter;
    }
}
