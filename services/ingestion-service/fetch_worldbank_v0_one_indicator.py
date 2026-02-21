import json
import requests
import pandas as pd
from pathlib import Path
from datetime import datetime

BASE_URL = "https://api.worldbank.org/v2"

# Choisis 1 indicateur pour tester (PIB)
INDICATOR_CODE = "NY.GDP.MKTP.CD"

def project_root() -> Path:
    # .../V0/services/ingestion-service/script.py -> remonte à .../V0
    return Path(__file__).resolve().parents[2]

def bronze_dir() -> Path:
    p = project_root() / "data" / "bronze"
    p.mkdir(parents=True, exist_ok=True)
    return p

def fetch_indicator_all_countries(indicator_code: str) -> list:
    url = f"{BASE_URL}/country/all/indicator/{indicator_code}?format=json&per_page=20000"
    r = requests.get(url, timeout=60)
    r.raise_for_status()
    return r.json()

def to_records(api_json: list, indicator_code: str) -> list:
    # api_json[0] = metadata, api_json[1] = rows
    rows = api_json[1]
    records = []
    for e in rows:
        country = e.get("countryiso3code")  # ISO3 (FRA, USA...) souvent plus stable
        year = e.get("date")
        value = e.get("value")
        if country is None or year is None:
            continue
        records.append({
            "country_iso3": country,
            "indicator": indicator_code,
            "year": int(year),
            "value": value
        })
    return records

def main():
    bdir = bronze_dir()
    now = datetime.utcnow().strftime("%Y%m%d_%H%M%S")

    api_json = fetch_indicator_all_countries(INDICATOR_CODE)

    # 1) Sauvegarde du JSON brut (preuve / audit)
    raw_path = bdir / f"worldbank_{INDICATOR_CODE}_{now}.json"
    raw_path.write_text(json.dumps(api_json), encoding="utf-8")
    print(f" JSON brut sauvegardé : {raw_path.resolve()}")

    # 2) Version tabulaire (CSV)
    records = to_records(api_json, INDICATOR_CODE)
    df = pd.DataFrame(records)

    csv_path = bdir / f"worldbank_{INDICATOR_CODE}_{now}.csv"
    df.to_csv(csv_path, index=False)
    print(f" CSV sauvegardé : {csv_path.resolve()}")

    print(f" Lignes: {len(df)} | Pays uniques: {df['country_iso3'].nunique()} | Années: {df['year'].min()}-{df['year'].max()}")

if __name__ == "__main__":
    main()
