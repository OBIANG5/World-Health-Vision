#!/bin/sh
set -eu

python -m media_service.migrate

exec "$@"
