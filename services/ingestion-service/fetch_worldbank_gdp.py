import requests
import pandas as pd
from pathlib import Path

# -----------------------------
# Configuration
# -----------------------------

COUNTRY_CODE = "FR"  # France
INDICATOR_CODE = "NY.GDP.MKTP.CD"  # PIB (current US$)
BASE_URL = "https://api.worldbank.org/v2"

# -----------------------------
# Appel API World Bank
# -----------------------------

url = f"{BASE_URL}/country/{COUNTRY_CODE}/indicator/{INDICATOR_CODE}?format=json&per_page=1000"

response = requests.get(url)
response.raise_for_status()  # stoppe le script si erreur HTTP

data = response.json()

# -----------------------------
# Transformation des données
# -----------------------------

records = []

for entry in data[1]:
    records.append({
        "country": COUNTRY_CODE,
        "indicator": INDICATOR_CODE,
        "year": int(entry["date"]),
        "value": entry["value"]
    })

df = pd.DataFrame(records)

# -----------------------------
# Sauvegarde en Bronze
# -----------------------------

project_root = Path(__file__).resolve().parents[2]  # remonte de ingestion-service -> services -> V0
bronze_path = project_root / "data" / "bronze"
bronze_path.mkdir(parents=True, exist_ok=True)

output_file = bronze_path / "gdp_france_worldbank.csv"
df.to_csv(output_file, index=False)

print(f"Données sauvegardées dans {output_file.resolve()}")
