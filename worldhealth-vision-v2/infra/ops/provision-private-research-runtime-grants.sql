-- WORLD-VISION P1A — DBA-reviewed, manual step after Flyway migration.
-- Execute only inside the authorized PostgreSQL 16 instance with a
-- migration/admin identity. Never store plaintext login passwords here.
-- Assign an actual LOGIN role to whv_research_runtime OUTSIDE this repository.
--
-- Migration role owns schema + tables; runtime role can ONLY read/write
-- the two case tables. This privilege role is intentionally NOLOGIN.
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'whv_research_runtime') THEN
        CREATE ROLE whv_research_runtime NOLOGIN;
    END IF;
END
$$;

REVOKE ALL ON SCHEMA trading_private FROM PUBLIC;
REVOKE ALL ON ALL TABLES IN SCHEMA trading_private FROM PUBLIC;
GRANT USAGE ON SCHEMA trading_private TO whv_research_runtime;
REVOKE CREATE ON SCHEMA trading_private FROM whv_research_runtime;
GRANT SELECT, INSERT, UPDATE, DELETE
    ON TABLE trading_private.trade_case, trading_private.trade_case_revision
    TO whv_research_runtime;

-- No grant to PublicReadRoutes, catalog, timeseries, source_runs,
-- internal ingestion, user profile or other tenant resources.
--
-- Independent DBA checks MUST verify the actual LOGIN role's effective
-- privileges and absence of role membership in a public-data owner.
-- No deployment is safe if the runtime account is a superuser, the
-- schema owner or a database-wide read role.
