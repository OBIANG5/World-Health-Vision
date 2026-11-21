-- Dedicated private schema. Never publish tables through PublicReadRoutes
-- or the public country/Timeseries statistic access paths.
CREATE TABLE trading_private.trade_case (
    id UUID PRIMARY KEY,
    principal_issuer TEXT NOT NULL,
    principal_subject TEXT NOT NULL,
    title VARCHAR(120) NOT NULL,
    plan JSONB NOT NULL,
    version BIGINT NOT NULL DEFAULT 1 CHECK (version > 0),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT trade_case_nonempty_title CHECK (length(btrim(title)) > 0),
    CONSTRAINT trade_case_json_object CHECK (jsonb_typeof(plan) = 'object')
);
CREATE INDEX trade_case_principal_updated_idx
    ON trading_private.trade_case
    (principal_issuer, principal_subject, updated_at DESC, id);
CREATE TABLE trading_private.trade_case_revision (
    case_id UUID NOT NULL REFERENCES trading_private.trade_case(id) ON DELETE CASCADE,
    version BIGINT NOT NULL CHECK (version > 0),
    title VARCHAR(120) NOT NULL,
    plan JSONB NOT NULL,
    saved_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    PRIMARY KEY (case_id, version),
    CONSTRAINT trade_revision_json_object CHECK (jsonb_typeof(plan) = 'object')
);
-- Defense-in-depth: every query must explicitly scope by authenticated
-- issuer + subject. A separate least-privilege research DB role is
-- required for staging. RLS policies are a separate reviewed change.
REVOKE ALL ON SCHEMA trading_private FROM PUBLIC;
REVOKE ALL ON ALL TABLES IN SCHEMA trading_private FROM PUBLIC;
