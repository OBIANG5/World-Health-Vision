package com.worldhealthvision.common.security;

import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.regex.Pattern;

/**
 * Fail-closed mapping of a verified provider's project role claim to
 * permissions understood by World-Vision's API.
 *
 * IMPORTANT: This class DOES NOT validate the JWT. Call it only after
 * signature, timestamp, issuer and audience have been verified by the
 * Spring Security resource-server decoder. Both Gateway and Workspace
 * independently validate that token before invoking this mapper.
 *
 * ZITADEL's project role map has the shape:
 *   "urn:zitadel:iam:org:project:roles": {
 *      "trading_reader": {"<trusted-org-id>": "<trusted-org-domain>"}
 *   }
 * The project audience alone is NOT an authorization grant.
 */
public final class OidcProjectRolePermissions {
    public static final String ROLE_CLAIM = "urn:zitadel:iam:org:project:roles";
    public static final String TRADING_READ = "trading:read";
    public static final String TRADING_WRITE = "trading:write";
    private static final Pattern SAFE_KEY = Pattern.compile("[A-Za-z0-9_.:-]{1,128}");

    private final String projectAudience;
    private final String readRole;
    private final String writeRole;

    /**
     * All three must be configured with approved values from a real identity
     * project; misconfiguration fails application startup rather than opening
     * the routes or falling back to unauthenticated access.
     */
    public OidcProjectRolePermissions(String projectAudience, String readRole, String writeRole) {
        if (!safe(projectAudience) || !safe(readRole) || !safe(writeRole)
                || readRole.equals(writeRole)) {
            throw new IllegalArgumentException(
                "OIDC project role mode requires project audience and two distinct explicit role names");
        }
        this.projectAudience = projectAudience;
        this.readRole = readRole;
        this.writeRole = writeRole;
    }

    public Set<String> grantedPermissions(List<String> audience, Map<String, Object> jwtClaims) {
        if (audience == null || !audience.contains(projectAudience) || jwtClaims == null) {
            return Set.of();
        }
        Object raw = jwtClaims.get(ROLE_CLAIM);
        if (!(raw instanceof Map<?, ?> projectRoles)) {
            return Set.of();
        }
        Set<String> granted = new LinkedHashSet<>();
        if (grantedRole(projectRoles, readRole)) granted.add(TRADING_READ);
        if (grantedRole(projectRoles, writeRole)) granted.add(TRADING_WRITE);
        return Set.copyOf(granted);
    }

    private static boolean grantedRole(Map<?, ?> projectRoles, String roleName) {
        Object value = projectRoles.get(roleName);
        if (!(value instanceof Map<?, ?> organizations) || organizations.isEmpty()) {
            return false;
        }
        // A bare role label, empty map, arbitrary list or malformed object is
        // NEVER a signed user grant. Require a non-empty organization grant.
        for (Map.Entry<?, ?> entry : organizations.entrySet()) {
            if (entry.getKey() instanceof String organizationId && safe(organizationId)
                    && entry.getValue() instanceof String organizationDomain
                    && !organizationDomain.isBlank() && organizationDomain.length() <= 255) {
                return true;
            }
        }
        return false;
    }

    private static boolean safe(String value) {
        return value != null && SAFE_KEY.matcher(value).matches();
    }
}
