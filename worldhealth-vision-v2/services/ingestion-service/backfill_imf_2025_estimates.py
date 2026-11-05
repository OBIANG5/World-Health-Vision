"""Backfill IMF WEO 2025 ESTIMATE observations from already-downloaded bronze files.

Re-processes the 6 bronze raw JSON files to extract the year (LATEST_ACTUAL_ANNUAL_DATA + 1)
for every country and publishes it to the timeseries service with value_status=ESTIMATED.

No network download required — uses what is already in data/bronze/imf/imf_public_data/.

Usage (from the ingestion-service root):
    .venv/Scripts/python backfill_imf_2025_estimates.py
"""

import json
import re
import sys
from datetime import UTC, datetime
from pathlib import Path

import httpx

# ---------------------------------------------------------------------------
# Config
# ---------------------------------------------------------------------------

TIMESERIES_BASE = "http://localhost:8083"
CATALOG_BASE = "http://localhost:8082"
BRONZE_DIR = Path(__file__).parent / "src" / "data" / "bronze" / "imf" / "imf_public_data"

# Maps raw file suffix -> WHV indicator code (must match catalog)
INDICATOR_MAP: dict[str, str] = {
    "ngdp_rpch":  "NY.GDP.MKTP.KD.ZG",   # GDP growth (real %)
    "ngdpd":      "NY.GDP.MKTP.CD",       # GDP nominal USD
    "ngdpdpc":    "NY.GDP.PCAP.CD",       # GDP per capita USD
    "pcpipch":    "FP.CPI.TOTL.ZG",       # Inflation CPI %
    "lur":        "SL.UEM.TOTL.ZS",       # Unemployment %
    "bca_ngdpd":  "BN.CAB.XOKA.GD.ZS",   # Current account % GDP
}

SCALE_MULTIPLIERS: dict[str, float] = {
    "NY.GDP.MKTP.CD":    1_000_000_000,   # billions -> USD
    "NY.GDP.PCAP.CD":    1_000,            # thousands -> USD
    "NY.GDP.MKTP.KD.ZG": 1.0,
    "FP.CPI.TOTL.ZG":    1.0,
    "SL.UEM.TOTL.ZS":    1.0,
    "BN.CAB.XOKA.GD.ZS": 1.0,
}

# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def get_valid_iso3s() -> set[str]:
    """Query the catalog to get all valid country ISO3 codes."""
    try:
        resp = httpx.get(f"{CATALOG_BASE}/api/catalog/countries", timeout=15)
        resp.raise_for_status()
        data = resp.json()
        # Response: {"count": N, "items": [{iso3, displayName, ...}, ...]}
        items = data.get("items", data) if isinstance(data, dict) else data
        iso3s = {c["iso3"] for c in items if isinstance(c, dict) and c.get("iso3")}
        print(f"  Catalog: {len(iso3s)} valid countries loaded")
        return iso3s
    except Exception as exc:
        print(f"  WARNING: Could not fetch valid ISO3s from catalog: {exc}")
        print("  Proceeding without country filter (may cause FK errors)")
        return set()


def _parse_int(v) -> int | None:
    if v is None or v == "":
        return None
    if isinstance(v, (int, float)):
        return int(v)
    cleaned = str(v).strip().upper()
    if cleaned.isdigit():
        return int(cleaned)
    m = re.search(r"(\d{4})", cleaned)
    return int(m.group(1)) if m else None


def _parse_float(v) -> float | None:
    if v is None or v == "":
        return None
    try:
        return float(v)
    except (TypeError, ValueError):
        return None


def _period(year: int):
    return {
        "periodGranularity": "ANNUAL",
        "periodStart": f"{year}-01-01",
        "periodEnd":   f"{year}-12-31",
        "periodLabel": str(year),
    }


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------

def main():
    run_ts = datetime.now(UTC).strftime("%Y%m%d_%H%M%S")
    total_published = 0
    total_skipped = 0

    # Load valid ISO3s from catalog to avoid FK violations
    valid_iso3s = get_valid_iso3s()

    for raw_file in sorted(BRONZE_DIR.glob("*.raw.json")):
        # Determine indicator from filename — longest key first to avoid
        # "ngdpd" matching inside "ngdpdpc" or "bca_ngdpd"
        suffix = None
        for key in sorted(INDICATOR_MAP.keys(), key=len, reverse=True):
            if key in raw_file.stem:
                suffix = key
                break
        if suffix is None:
            print(f"  No indicator mapping for {raw_file.name} — skipped")
            continue

        indicator_code = INDICATOR_MAP[suffix]
        multiplier = SCALE_MULTIPLIERS.get(indicator_code, 1.0)

        data = json.loads(raw_file.read_text(encoding="utf-8"))
        rows = data.get("items", [])
        source = data.get("source", {})
        published_at = source.get("downloadedAtUtc") or datetime.now(UTC).isoformat()

        items: list[dict] = []
        file_estimate_year: int | None = None
        filtered_out = 0

        for row in rows:
            country_iso3 = row.get("COUNTRY.ID")
            if not country_iso3 or len(country_iso3) != 3 or not country_iso3.isalpha():
                continue

            # Skip countries not in our catalog (would cause FK violation)
            if valid_iso3s and country_iso3 not in valid_iso3s:
                filtered_out += 1
                continue

            latest_actual = _parse_int(row.get("LATEST_ACTUAL_ANNUAL_DATA"))
            if latest_actual is None:
                continue

            estimate_year = latest_actual + 1
            if file_estimate_year is None:
                file_estimate_year = estimate_year

            raw_val = row.get(str(estimate_year))
            val = _parse_float(raw_val)
            if val is None:
                total_skipped += 1
                continue

            items.append({
                "indicatorCode": indicator_code,
                "countryIso3": country_iso3,
                **_period(estimate_year),
                "numericValue": val * multiplier,
                "valueStatus": "ESTIMATED",
                "sourcePublishedAt": published_at,
                "sourceMetadata": {
                    "sourcePeriodLabel": str(estimate_year),
                    "sourceYear": str(estimate_year),
                    "latestActualAnnualData": latest_actual,
                    "backfillScript": "backfill_imf_2025_estimates.py",
                    "bronzeFile": raw_file.name,
                },
                "qualityFlags": [],
            })

        if not items:
            print(f"  {indicator_code}: no estimate data found (filtered_out={filtered_out})")
            continue

        if filtered_out:
            print(f"  {indicator_code}: {filtered_out} countries filtered (not in catalog)")

        run_key = f"{run_ts}_backfill_estimate_{suffix}"
        payload = {
            "sourceCode": "IMF",
            "datasetCode": "IMF_PUBLIC_DATA",
            "runKey": run_key,
            "fetchedAtUtc": datetime.now(UTC).isoformat(),
            "bronzeRawPayloadPath": str(raw_file),
            "bronzeNormalizedPayloadPath": None,
            "recordCount": len(items),
            "notes": {
                "backfill": True,
                "estimateYear": file_estimate_year,
                "indicatorCode": indicator_code,
                "sourceFile": raw_file.name,
            },
            "items": items,
        }

        print(f"  {indicator_code} ({len(items)} countries) -> publishing ...", end="", flush=True)
        try:
            resp = httpx.post(
                f"{TIMESERIES_BASE}/internal/timeseries/ingestion/observation-batches",
                json=payload,
                timeout=60,
            )
            resp.raise_for_status()
            result = resp.json()
            inserted = result.get("inserted", result.get("upserted", "?"))
            print(f" OK {inserted} upserted")
            total_published += len(items)
        except Exception as exc:
            print(f" FAIL {exc}")
            if hasattr(exc, "response") and exc.response is not None:
                print(f"     Response: {exc.response.text[:2000]}")

    print(f"\nDone. {total_published} ESTIMATE observations published, {total_skipped} skipped (no value).")


if __name__ == "__main__":
    main()