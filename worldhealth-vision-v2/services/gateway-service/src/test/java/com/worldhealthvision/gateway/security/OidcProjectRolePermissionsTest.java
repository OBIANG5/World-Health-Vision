package com.worldhealthvision.gateway.security;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import com.worldhealthvision.common.security.OidcProjectRolePermissions;
import java.util.List;
import java.util.Map;
import org.junit.jupiter.api.Test;

/** Shared pure policy: project audience alone is never authorization. */
class OidcProjectRolePermissionsTest {
    private final OidcProjectRolePermissions policy =
        new OidcProjectRolePermissions("project-123", "trading_reader", "trading_writer");

    @Test
    void grantRequiresExactAudienceRoleAndNonemptyOrganization() {
        Map<String, Object> claim = Map.of(OidcProjectRolePermissions.ROLE_CLAIM,
            Map.of("trading_reader", Map.of("trusted-org", "organization.example")));
        assertThat(policy.grantedPermissions(List.of("project-123"), claim))
            .containsExactly(OidcProjectRolePermissions.TRADING_READ);
        assertThat(policy.grantedPermissions(List.of("another-project"), claim)).isEmpty();
        assertThat(policy.grantedPermissions(List.of("project-123"), Map.of())).isEmpty();
        assertThat(policy.grantedPermissions(List.of("project-123"), Map.of(
            OidcProjectRolePermissions.ROLE_CLAIM,
            Map.of("trading_reader", Map.of())))).isEmpty();
        assertThat(policy.grantedPermissions(List.of("project-123"), Map.of(
            OidcProjectRolePermissions.ROLE_CLAIM,
            Map.of("trading_reader", "yes")))).isEmpty();
        assertThat(policy.grantedPermissions(List.of("project-123"), Map.of(
            OidcProjectRolePermissions.ROLE_CLAIM,
            Map.of("trading_reader", Map.of("invalid org", "organization.example"))))).isEmpty();
    }

    @Test
    void writeGrantIsNotReadGrantUnlessTheIdentityProviderGrantsBoth() {
        Map<String, Object> both = Map.of(OidcProjectRolePermissions.ROLE_CLAIM,
            Map.of("trading_reader", Map.of("org1", "example.org"),
                "trading_writer", Map.of("org1", "example.org")));
        assertThat(policy.grantedPermissions(List.of("project-123"), both))
            .containsExactlyInAnyOrder(OidcProjectRolePermissions.TRADING_READ,
                OidcProjectRolePermissions.TRADING_WRITE);
        Map<String, Object> onlyWrite = Map.of(OidcProjectRolePermissions.ROLE_CLAIM,
            Map.of("trading_writer", Map.of("org1", "example.org")));
        assertThat(policy.grantedPermissions(List.of("project-123"), onlyWrite))
            .containsExactly(OidcProjectRolePermissions.TRADING_WRITE);
    }

    @Test
    void missingProjectOrAmbiguousRoleConfigurationRefusesStartup() {
        assertThatThrownBy(() -> new OidcProjectRolePermissions(
            "", "trading_reader", "trading_writer")).isInstanceOf(IllegalArgumentException.class);
        assertThatThrownBy(() -> new OidcProjectRolePermissions(
            "project-123", "trading_reader", "trading_reader")).isInstanceOf(IllegalArgumentException.class);
        assertThatThrownBy(() -> new OidcProjectRolePermissions(
            "project-123", "invalid role key", "writer")).isInstanceOf(IllegalArgumentException.class);
    }

    @Test
    void exactRoleNameCannotBeReplacedByAnUntrustedClientSuppliedScopeName() {
        Map<String, Object> wrongRole = Map.of(OidcProjectRolePermissions.ROLE_CLAIM,
            Map.of("trading:read", Map.of("org1", "example.org")));
        assertThat(policy.grantedPermissions(List.of("project-123"), wrongRole)).isEmpty();
    }
}
