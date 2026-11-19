#!/usr/bin/env bash
# A disposable restore test. NEVER restores over the live whv database.
# Usage: restore-drill.sh /absolute/path/whv_*.dump [probe_table]
set -Eeuo pipefail
umask 077
if [[ $# -lt 1 || $# -gt 2 ]]; then
  echo "Usage: $0 backup.dump [simple_public_table_name]" >&2
  exit 2
fi
backup="$1"
probe="${2:-}"
[[ -f "$backup" && -s "$backup" && -f "$backup.sha256" ]] || {
  echo "Backup and SHA256 sidecar are required" >&2
  exit 2
}
if [[ -n "$probe" && ! "$probe" =~ ^[a-z_][a-z0-9_]*$ ]]; then
  echo "Probe table must be a simple lowercase SQL identifier" >&2
  exit 2
fi
sha256sum --check --status "$backup.sha256" || {
  echo "Backup SHA256 mismatch" >&2
  exit 1
}
infra_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
compose_file="$infra_dir/compose.secure-staging.yml"
drill_db="whv_restore_drill_$(date -u +%Y%m%d%H%M%S)_$$"
created=0

cleanup() {
  if [[ "$created" == 1 ]]; then
    # A failed restore must never leave a "restoring" database in use.
    docker compose -f "$compose_file" exec -T whv-timescaledb sh -eu -c '
      export PGPASSWORD="$(cat "$POSTGRES_PASSWORD_FILE")"
      psql -v ON_ERROR_STOP=1 -U "$POSTGRES_USER" -d "$1" \
        -c "SELECT timescaledb_post_restore();" >/dev/null 2>&1 || true
      dropdb --if-exists --force -U "$POSTGRES_USER" "$1" >/dev/null 2>&1 || true
    ' sh "$drill_db" || true
  fi
}
trap cleanup EXIT

docker compose -f "$compose_file" exec -T whv-timescaledb sh -eu -c '
  export PGPASSWORD="$(cat "$POSTGRES_PASSWORD_FILE")"
  exec createdb -U "$POSTGRES_USER" --template=template0 "$1"
' sh "$drill_db"
created=1

# TimescaleDB requires pre/post restore maintenance when restoring hypertables.
docker compose -f "$compose_file" exec -T whv-timescaledb sh -eu -c '
  export PGPASSWORD="$(cat "$POSTGRES_PASSWORD_FILE")"
  psql -v ON_ERROR_STOP=1 -U "$POSTGRES_USER" -d "$1" \
    -c "CREATE EXTENSION IF NOT EXISTS timescaledb;" \
    -c "SELECT timescaledb_pre_restore();"
' sh "$drill_db"

docker compose -f "$compose_file" exec -T whv-timescaledb sh -eu -c '
  export PGPASSWORD="$(cat "$POSTGRES_PASSWORD_FILE")"
  exec pg_restore --exit-on-error --no-owner --no-acl \
    -U "$POSTGRES_USER" -d "$1"
' sh "$drill_db" < "$backup"

docker compose -f "$compose_file" exec -T whv-timescaledb sh -eu -c '
  export PGPASSWORD="$(cat "$POSTGRES_PASSWORD_FILE")"
  psql -v ON_ERROR_STOP=1 -U "$POSTGRES_USER" -d "$1" \
    -c "SELECT timescaledb_post_restore();"
' sh "$drill_db"

if [[ -n "$probe" ]]; then
  # Safe because the probe name is restricted to a lowercase identifier.
  row_count="$(docker compose -f "$compose_file" exec -T whv-timescaledb sh -eu -c '
    export PGPASSWORD="$(cat "$POSTGRES_PASSWORD_FILE")"
    psql -v ON_ERROR_STOP=1 -At -U "$POSTGRES_USER" -d "$1" \
      -c "SELECT COUNT(*) FROM public.$2;"
  ' sh "$drill_db" "$probe" | tr -d '\r')"
  if [[ "$row_count" != 1 ]]; then
    echo "Restored probe '$probe' expected one row, found '$row_count'" >&2
    exit 1
  fi
fi
echo "PASS: backup checksum, TimescaleDB restore, verification and isolated cleanup."
