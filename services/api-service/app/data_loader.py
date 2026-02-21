from pathlib import Path
import pandas as pd


def get_project_root() -> Path:
    # .../V0/services/api-service/app/data_loader.py -> remonte à .../V0
    return Path(__file__).resolve().parents[3]


def get_silver_path() -> Path:
    return get_project_root() / "data" / "silver" / "worldbank_v0_silver.csv"


def load_silver_df() -> pd.DataFrame:
    silver_path = get_silver_path()

    if not silver_path.exists():
        raise FileNotFoundError(f"Silver file not found: {silver_path}")

    df = pd.read_csv(silver_path)

    # sécurité: types attendus
    df["year"] = df["year"].astype(int)
    df["value"] = df["value"].astype(float)

    return df
