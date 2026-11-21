/**
 * Trading-Vision P1B1: a narrow capability boundary for a FUTURE validated
 * OIDC Authorization Code + PKCE login. No access token is read from cookies,
 * localStorage, sessionStorage, URL params, messages, or user input here.
 *
 * Only a reviewed OIDC session adapter may furnish this capability in P1B2.
 * Until an actual trusted issuer/client/audience is configured, the app passes
 * null and ALL cloud actions remain disabled. This is NOT a login SDK.
 */
export interface ResearchIdentity {
  /** An expired or missing session MUST return null; never an opaque user ID. */
  accessToken(): Promise<string | null>;
  /** Human-readable provider display name, not a security principal. */
  providerLabel: string;
}

/** No fallback credentials, fake connected user or anonymous cloud request. */
export const researchIdentityNotConfigured: ResearchIdentity | null = null;
