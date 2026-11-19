#!/usr/bin/env python3
"""Fail-closed checks on docker compose --format json (the resolved configuration).

Run only against the standalone secure-staging Compose, never a merged stack.
This does NOT replace live penetration tests or a third-party security audit.
"""
from __future__ import annotations

import json
import sys
from pathlib import Path


def require(condition: bool, message: str) -> None:
    if not condition:
        raise SystemExit("SECURITY CONTRACT FAILED: " + message)


def verify(document: dict) -> None:
    services = document["services"]
    expected = {
        "gateway-service", "catalog-service", "timeseries-service",
        "analytics-service", "ingestion-service", "whv-timescaledb",
    }
    require(set(services) == expected, "unexpected service roster or missing service")
    networks = document["networks"]
    private = next((name for name in networks if name.endswith("core_private")), None)
    require(private is not None, "missing core_private network")
    require(networks[private].get("internal") is True, "database network must be internal")

    def nets(service: str) -> set[str]:
        value = services[service]["networks"]
        return set(value if isinstance(value, list) else value.keys())

    db = services["whv-timescaledb"]
    require(not db.get("ports"), "database must not expose a host port")
    require("POSTGRES_PASSWORD" not in db.get("environment", {}),
            "database password may not be embedded into container environment")
    require(db["environment"].get("POSTGRES_PASSWORD_FILE") ==
            "/run/secrets/whv_db_password", "PostgreSQL must use secret file")
    require(any(s.get("source", "") == "whv_db_password"
                for s in db.get("secrets", [])), "database secret is not mounted")
    require(private in nets("whv-timescaledb"), "database not on internal network")
    require(len(nets("whv-timescaledb")) == 1, "database must not join egress network")

    for name, service in services.items():
        ports = service.get("ports", [])
        if name != "gateway-service":
            require(not ports, name + " unexpectedly publishes ports")
        else:
            require(len(ports) == 1, "gateway must expose exactly one loopback port")
            p = ports[0]
            require(p.get("host_ip") == "127.0.0.1", "gateway cannot bind publicly")
            require(int(p.get("target", 0)) == 8080, "wrong internal gateway port")
            require(p.get("protocol", "tcp") == "tcp", "gateway protocol mismatch")
            env = service.get("environment", {})
            require(env.get("WHV_SECURITY_ENABLED") == "true",
                    "JWT must be enabled in secure staging")
            issuer = env.get("WHV_SECURITY_ISSUER_URI") or ""
            require(issuer.startswith("https://"), "OIDC issuer must use HTTPS")
            jwks = env.get("WHV_SECURITY_JWK_SET_URI") or ""
            require(jwks.startswith("https://"), "JWKS endpoint must use HTTPS")
            require(bool(env.get("WHV_SECURITY_AUDIENCE")), "API audience required")
            require(env.get("WHV_SECURITY_ALLOW_INSECURE_LOOPBACK_JWKS_FOR_TESTS") == "false",
                    "test-only HTTP JWKS must be disabled in staging")
        require(private in nets(name), name + " left the private network")

    for name in expected - {"whv-timescaledb"}:
        service = services[name]
        require(service.get("read_only") is True, name + " rootfs must be readonly")
        require(str(service.get("user")) == "10001:10001", name + " must run nonroot")
        require("ALL" in service.get("cap_drop", []), name + " lacks cap_drop")
        require("no-new-privileges:true" in service.get("security_opt", []),
                name + " lacks no-new-privileges")
        require(service.get("tmpfs"), name + " lacks bounded temporary filesystems")

    for name in ("catalog-service", "timeseries-service"):
        service = services[name]
        env = service.get("environment", {})
        require("WHV_DB_PASSWORD" not in env,
                name + " puts the database password in Docker inspect")
        require(any(s.get("source") == "whv_db_password"
                    for s in service.get("secrets", [])),
                name + " missing DB secret mount")
        command = " ".join(service.get("entrypoint", []))
        require("/run/secrets/whv_db_password" in command,
                name + " entrypoint does not read the DB secret")
        require(env.get("MANAGEMENT_ENDPOINT_HEALTH_SHOW_DETAILS") == "never",
                name + " leaks health details")

    require(len(nets("catalog-service")) == 1, "catalog must not have Internet egress")
    require(len(nets("timeseries-service")) == 1, "timeseries must not have Internet egress")
    require(len(nets("analytics-service")) == 1, "analytics must not have Internet egress")
    require(len(nets("gateway-service")) == 2, "gateway needs separate issuer egress")
    require(len(nets("ingestion-service")) == 2, "ingestion needs controlled API egress")

    require("whv_timescaledb_data" in " ".join(
        str(v) for v in db.get("volumes", [])
    ), "database has no persistent storage")
    print("PASS: isolated network, scoped egress, mounted secret, nonroot, loopback gateway.")


if __name__ == "__main__":
    if len(sys.argv) != 2:
        raise SystemExit("Usage: verify_secure_staging.py resolved-compose.json")
    verify(json.loads(Path(sys.argv[1]).read_text(encoding="utf-8")))
