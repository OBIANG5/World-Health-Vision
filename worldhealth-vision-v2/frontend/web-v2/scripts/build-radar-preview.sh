#!/usr/bin/env bash
# World-Vision Radar — Vercel PREVIEW build, not production.
# Default: do NOT consume any remote API, do NOT claim a live news feed.
# Opt-in: WHV_RADAR_PREVIEW_FETCH=1 fetches ONE latest official GDELT
# Events archive using the audited R2A/R2B Python client and MD5 gates.
# A provider outage is displayed as "archive unavailable"; never fabricated.
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
INGESTION="$ROOT/../../services/ingestion-service"
SNAPSHOT="$ROOT/public/radar/global-latest.json"
BUILD_DEPS="$ROOT/.radar-preview-python-deps"
cd "$ROOT"
# No stale snapshot may leak across Vercel build-cache reuse.
rm -f -- "$SNAPSHOT"

if [[ "${WHV_RADAR_PREVIEW_FETCH:-0}" == "1" ]]; then
  if [[ -f "$INGESTION/export_gdelt_radar_snapshot.py" ]] && command -v python3 >/dev/null 2>&1; then
    pythonpath="$INGESTION/src"
    if ! python3 -c "import httpx" >/dev/null 2>&1; then
      echo "RADAR_PREVIEW: installing pinned Python HTTP client in isolated temporary build directory."
      if python3 -m pip install --disable-pip-version-check --no-input --quiet \
          --target "$BUILD_DEPS" 'httpx==0.27.2'; then
        pythonpath="$BUILD_DEPS:$pythonpath"
      else
        pythonpath=""
        echo "RADAR_PREVIEW: Python dependency unavailable; no source archive will be supplied."
      fi
    fi
    if [[ -n "$pythonpath" ]]; then
      echo "RADAR_PREVIEW: one bounded GDELT Events fetch, never article bodies."
      if ( cd "$INGESTION" && PYTHONPATH="$pythonpath" \
          python3 export_gdelt_radar_snapshot.py --output "$SNAPSHOT" ); then
        echo "RADAR_PREVIEW: genuine dated archive supplied; NOT a live or verified article feed."
      else
        rm -f -- "$SNAPSHOT"
        echo "RADAR_PREVIEW: provider unavailable; no stale/synthetic data used."
      fi
    fi
  else
    echo "RADAR_PREVIEW: Python or source connector not available in builder; archive omitted."
  fi
else
  echo "RADAR_PREVIEW: opt-in fetch disabled; no remote provider request."
fi

npm run build

# PREVIEW-ONLY robots policy. Never put a global noindex in vercel.json:
# that would unintentionally deindex the international production website
# if this draft branch were ever merged. This script is not the default
# npm run build command, and it runs ONLY for an explicitly selected preview.
node --input-type=module <<'NODE'
import { readFileSync, writeFileSync } from "node:fs";
const path = "dist/index.html";
const html = readFileSync(path, "utf8");
if (!/<head(?:\\s[^>]*)?>/i.test(html)) throw new Error("Missing HTML head in Vite build");
if (/<meta\\s+[^>]*name=["']robots["']/i.test(html)) {
  throw new Error("Existing robots meta must be reviewed; will not silently override");
}
const stamped = html.replace(/<head(\\s[^>]*)?>/i, (tag) =>
  tag + '<meta name="robots" content="noindex, nofollow, noarchive">');
if (stamped === html) throw new Error("Preview robots policy could not be applied");
writeFileSync(path, stamped);
console.log("RADAR_PREVIEW: preview-only robots meta injected in built dist/index.html");
NODE
# Build succeeds with genuinely absent snapshot. This is not a live news feed.
echo "RADAR_PREVIEW: complete; preview-only noindex injected, production untouched."
