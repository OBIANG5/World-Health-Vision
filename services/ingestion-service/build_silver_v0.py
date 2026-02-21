from pathlib import Path
import pandas as pd


def get_project_root() -> Path:
    return Path(__file__).resolve().parents[2]


def bronze_worldbank_dir() -> Path:
    return get_project_root() / "data" / "bronze" / "worldbank"


def silver_dir() -> Path:
    p = get_project_root() / "data" / "silver"
    p.mkdir(parents=True, exist_ok=True)
    return p


def load_all_bronze_csvs() -> pd.DataFrame:
    frames = []

    for indicator_dir in bronze_worldbank_dir().iterdir():
        if not indicator_dir.is_dir():
            continue

        for csv_file in indicator_dir.glob("*.csv"):
            df = pd.read_csv(csv_file)

            frames.append(df)

    return pd.concat(frames, ignore_index=True)


def clean_silver(df: pd.DataFrame) -> pd.DataFrame:
    # Supprimer lignes sans valeur
    df = df.dropna(subset=["value"])

    # Types propres
    df["year"] = df["year"].astype(int)
    df["value"] = df["value"].astype(float)

    # Limiter les années (sécurité)
    df = df[(df["year"] >= 1960) & (df["year"] <= 2024)]

    # Ordonner
    df = df.sort_values(["country_iso3", "indicator", "year"])

    return df


def main():
    print("🔧 Construction SILVER V0...")

    df_bronze = load_all_bronze_csvs()
    print(f"📥 Lignes Bronze chargées : {len(df_bronze)}")

    df_silver = clean_silver(df_bronze)
    print(f"✨ Lignes Silver après nettoyage : {len(df_silver)}")

    output = silver_dir() / "worldbank_v0_silver.csv"
    df_silver.to_csv(output, index=False)

    print(f"✅ Silver sauvegardé : {output.resolve()}")
    print(
        f"📌 Pays: {df_silver['country_iso3'].nunique()} | "
        f"Indicateurs: {df_silver['indicator'].nunique()} | "
        f"Années: {df_silver['year'].min()}-{df_silver['year'].max()}"
    )


if __name__ == "__main__":
    main()
