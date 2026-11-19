#!/usr/bin/env bash
# Host-side guard: intended for a real PRIVATE staging host, not CI's throwaway tag.
# Requires exported variables or a protected env-file loaded by the operator.
# Does not create infrastructure or grant approval to expose public traffic.
set -Eeuo pipefail

fail() { echo "F1.2 host preflight FAILED: $*" >&2; exit 1; }
: "${WHV_DB_PASSWORD_FILE:?WHV_DB_PASSWORD_FILE required}"
: "${WHV_TIMESCALE_IMAGE:?WHV_TIMESCALE_IMAGE required}"
: "${WHV_OIDC_ISSUER_URI:?WHV_OIDC_ISSUER_URI required}"
: "${WHV_BACKUP_DIR:?WHV_BACKUP_DIR required}"

infra_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
source_root="$(cd "$infra_dir/.." && pwd)"

[[ "$WHV_DB_PASSWORD_FILE" == /* ]] || fail "DB secret path must be absolute"
[[ -f "$WHV_DB_PASSWORD_FILE" && -s "$WHV_DB_PASSWORD_FILE" ]] || fail "DB secret file missing/empty"
[[ "$WHV_BACKUP_DIR" == /* ]] || fail "backup directory must be absolute"
[[ -d "$WHV_BACKUP_DIR" && -w "$WHV_BACKUP_DIR" ]] || fail "create a writable backup directory first"

secret_path="$(realpath "$WHV_DB_PASSWORD_FILE")"
backup_path="$(realpath "$WHV_BACKUP_DIR")"
case "$secret_path" in "$source_root"/*) fail "DB secret must never live inside the repository";; esac
case "$backup_path" in "$source_root"/*) fail "backups must never live inside the repository";; esac

# No world-readable secrets. On Linux Docker Compose file-secrets may behave
# like bind mounts: ensure service UID/GID 10001 can actually read the file.
uid="$(stat -c '%u' "$secret_path")"
gid="$(stat -c '%g' "$secret_path")"
raw_mode="$(stat -c '%a' "$secret_path")"
mode=$((8#$raw_mode))
(( (mode & 0007) == 0 )) || fail "DB secret file permits access to other users"
(( (uid == 10001 && (mode & 0400) != 0) ||
   (gid == 10001 && (mode & 0040) != 0) )) ||
  fail "DB secret is not readable by nonroot application UID/GID 10001"
(( $(wc -c < "$secret_path") >= 40 )) || fail "DB secret is too short"

[[ "$WHV_TIMESCALE_IMAGE" =~ @sha256:[a-f0-9]{64}$ ]] ||
  fail "use a reviewed immutable TimescaleDB image digest, not a mutable tag"
[[ "$WHV_OIDC_ISSUER_URI" =~ ^https:// ]] || fail "OIDC issuer must use HTTPS"
if [[ "$WHV_OIDC_ISSUER_URI" =~ (localhost|\.invalid|\.example|127\.0\.0\.1) ]]; then
  fail "test/example issuer cannot be used on a real staging host"
fi

command -v docker >/dev/null || fail "Docker is required"
docker compose -f "$infra_dir/compose.secure-staging.yml" config --quiet >/dev/null ||
  fail "resolved secure-staging Compose rejected"
echo "PASS host preflight: secret, file permissions, digest pin, HTTPS issuer, backup dir."
echo "This is not permission to publish; OIDC connectivity, TLS proxy and restore are separate gates."
