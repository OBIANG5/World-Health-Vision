import json
from pathlib import Path
from datetime import datetime

import requests
import pandas as pd

BASE_URL = "https://api.worldbank.org/v2"


# -----------------------------
# Chemins (robustes)
# -----------------------------
def get_project_root() -> Path:
    """
    Retourne le dossier V0 (racine du projet V0),
    en partant de l'emplacement de ce fichier.
    """
    return Path(__file__).resolve().parents[2]


def get_bronze_dir() -> Path:
    """
    Retourne V0/data/bronze, et crée le dossier s'il n'existe pas.
    """
    p = get_project_root() / "data" / "bronze"
    p.mkdir(parents=True, exist_ok=True)
    return p


def get_config_path() -> Path:
    """
    Retourne le chemin du fichier de config indicators_v0.json
    situé dans le dossier ingestion-service.
    """
    return Path(__file__).parent / "indicators_v0.json"


# -----------------------------
# Lecture config indicateurs
# -----------------------------
def load_indicators() -> list[dict]:
    """
    Lit indicators_v0.json et renvoie une liste de dict:
    [{"code": "...", "name": "..."}, ...]
    """
    config_path = get_config_path()
    with config_path.open("r", encoding="utf-8") as f:
        return json.load(f)


# -----------------------------
# API World Bank (à compléter)
# -----------------------------
def fetch_indicator_all_countries(indicator_code: str) -> list:
    """
    Appelle l'API World Bank pour un indicateur sur tous les pays.
    Retourne le JSON complet (métadonnées + lignes).
    """
    url = f"{BASE_URL}/country/all/indicator/{indicator_code}?format=json&per_page=20000"
    r = requests.get(url, timeout=60)
    r.raise_for_status()
    return r.json()


def to_records(api_json: list, indicator_code: str) -> list[dict]:
    """
    Transforme le JSON World Bank en liste de lignes tabulaires.
    """
    rows = api_json[1]  # les vraies lignes
    records = []

    for e in rows:
        country_iso3 = e.get("countryiso3code")
        year = e.get("date")
        value = e.get("value")

        if country_iso3 is None or year is None:
            continue

        records.append({
            "country_iso3": country_iso3,
            "indicator": indicator_code,
            "year": int(year),
            "value": value
        })

    return records


# -----------------------------
# Programme principal
# -----------------------------
def main():
    bronze_dir = get_bronze_dir()
    indicators = load_indicators()
    run_id = datetime.utcnow().strftime("%Y%m%d_%H%M%S")

    print(f"🚀 Début ingestion V0 | run_id={run_id} | indicateurs={len(indicators)}")
    print(f"📁 Bronze = {bronze_dir.resolve()}")

    # On boucle sur les indicateurs (mais on ne sauvegarde pas encore ici)
    for ind in indicators:
        code = ind["code"]
        name = ind.get("name", "")

        print(f"\n➡️  Indicateur: {code} | {name}")

                # 1) Appel API
        api_json = fetch_indicator_all_countries(code)

        # 2) Sauvegarde JSON brut (preuve / audit)
        # Sous-dossier par source + indicateur
        indicator_dir = bronze_dir / "worldbank" / code
        indicator_dir.mkdir(parents=True, exist_ok=True)

        json_path = indicator_dir / f"{run_id}.json"
        json_path.write_text(json.dumps(api_json), encoding="utf-8")
        print(f"   ✅ JSON brut: {json_path.name}")

        # 3) Transformation tabulaire + sauvegarde CSV
        records = to_records(api_json, code)
        df = pd.DataFrame(records)

        csv_path = indicator_dir / f"{run_id}.csv"
        df.to_csv(csv_path, index=False)
        print(f"   ✅ CSV: {csv_path.name}")

        # 4) Mini stats (pour vérifier que ça a du sens)
        if len(df) > 0:
            print(
                f"   📌 lignes={len(df)} | pays={df['country_iso3'].nunique()} | "
                f"années={df['year'].min()}-{df['year'].max()}"
            )
        else:
            print("   ⚠️  DataFrame vide (API a renvoyé 0 ligne)")



if __name__ == "__main__":
    main()
