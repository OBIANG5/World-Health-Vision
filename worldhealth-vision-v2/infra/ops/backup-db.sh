#!/usr/bin/env bash
# Consistent logical backup of the V2 TimescaleDB staging database.
# A backup is not a recovery plan until restore-drill.sh has succeeded.
set -Eeuo pipefail
umask 077

infra_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
compose_file="$infra_dir/compose.secure-staging.yml"
: "${WHV_BACKUP_DIR:?Specify an absolute backup directory outside the checkout}"
if [[ "$WHV_BACKUP_DIR" != /* ]]; then
  echo "WHV_BACKUP_DIR must be absolute" >&2
  exit 2
fi
if ! command -v docker >/dev/null; then
  echo "Docker Compose is required for this backup" >&2
  exit 2
fi
mkdir -p -- "$WHV_BACKUP_DIR"
backup="$WHV_BACKUP_DIR/whv_$(date -u +%Y%m%dT%H%M%SZ)_$$.dump"
temporary="$(mktemp "$WHV_BACKUP_DIR/.whv-incomplete-XXXXXXXX")"
cleanup() { rm -f -- "$temporary"; }
trap cleanup EXIT

# pg_dump produces a consistent snapshot even while other transactions run.
# The credentials remain inside the DB container's secret volume.
docker compose -f "$compose_file" exec -T whv-timescaledb sh -eu -c '
  export PGPASSWORD="$(cat "$POSTGRES_PASSWORD_FILE")"
  exec pg_dump -U "$POSTGRES_USER" -d "$POSTGRES_DB" \
    --format=custom --no-owner --no-acl
' > "$temporary"

if [[ ! -s "$temporary" ]]; then
  echo "Backup produced an empty file" >&2
  exit 1
fi

# Ensure the archive header and TOC are readable before writing the final name.
docker compose -f "$compose_file" exec -T whv-timescaledb \
  pg_restore --list < "$temporary" >/dev/null
chmod 0600 "$temporary"
mv -- "$temporary" "$backup"
sha256sum "$backup" | awk '{print $1}' > "$backup.sha256"
chmod 0600 "$backup.sha256"
echo "Backup validated locally: $backup"
echo "IMPORTANT: perform restore drill and encrypted off-host copies separately."
