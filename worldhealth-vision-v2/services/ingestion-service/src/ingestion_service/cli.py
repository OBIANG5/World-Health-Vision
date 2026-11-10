import json
import typer

from ingestion_service.pilots.inflation import DEFAULT_COUNTRIES, run_inflation_pilot
from ingestion_service.runtime import (
    build_imf_weo_service,
    build_numbeo_service,
    build_unodc_service,
    build_worldbank_service,
)
from ingestion_service.settings import get_settings

app = typer.Typer(help="WorldHealth Vision ingestion CLI.")
worldbank_app = typer.Typer(help="World Bank ingestion commands.")
unodc_app = typer.Typer(help="UNODC ingestion commands.")
numbeo_app = typer.Typer(help="Numbeo ingestion commands (clé API requise).")
app.add_typer(worldbank_app, name="worldbank")
app.add_typer(unodc_app, name="unodc")
app.add_typer(numbeo_app, name="numbeo")
pilot_app = typer.Typer(help="Controlled official multi-source evidence pilots.")
app.add_typer(pilot_app, name="pilot")


@worldbank_app.command("fetch-countries")
def fetch_countries():
    manifest = build_worldbank_service().fetch_country_registry()
    typer.echo(manifest.model_dump_json(indent=2))


@worldbank_app.command("fetch-core-indicators")
def fetch_core_indicators():
    manifests = build_worldbank_service().fetch_core_indicators()
    typer.echo(f"runs={len(manifests)}")
    for manifest in manifests:
        typer.echo(manifest.model_dump_json(indent=2))


@unodc_app.command("fetch-homicide-baseline")
def fetch_homicide_baseline():
    """Ingère les données homicide UNODC.

    Requiert l'une des deux sources :
      - Fichier local : définir WHV_INGEST_UNODC_HOMICIDE_EXPORT_PATH vers le
        fichier Excel/CSV exporté depuis https://dataunodc.un.org/dp-intentional-homicide-victims
      - URL de téléchargement : définir WHV_INGEST_UNODC_HOMICIDE_DOWNLOAD_URL
    """
    manifest = build_unodc_service().fetch_homicide_baseline()
    typer.echo(manifest.model_dump_json(indent=2))


@numbeo_app.command("fetch-country-indices")
def fetch_country_indices():
    """Ingère les indices coût de la vie Numbeo (tous pays).

    Requiert la variable d'environnement WHV_INGEST_NUMBEO_API_KEY.
    Obtenir une clé sur https://www.numbeo.com/api/register.jsp

    Indicateurs ingérés :
      WHV.NUMBEO.COST_LIVING_INDEX
      WHV.NUMBEO.RENT_INDEX
      WHV.NUMBEO.CONSUMER_PRICE_RENT_INDEX
      WHV.NUMBEO.GROCERIES_INDEX
      WHV.NUMBEO.RESTAURANT_PRICE_INDEX
      WHV.NUMBEO.LOCAL_PURCHASING_POWER_INDEX
    """
    manifests = build_numbeo_service().fetch_cost_of_living_indices()
    typer.echo(f"runs={len(manifests)}")
    for manifest in manifests:
        typer.echo(manifest.model_dump_json(indent=2))


@pilot_app.command("inflation")
def pilot_inflation(
    countries: str = typer.Option(
        ",".join(DEFAULT_COUNTRIES),
        "--countries",
        help="Comma-separated ISO3 country selection (default FRA,GAB,USA).",
    ),
):
    """Ingest CPI inflation from live WDI and IMF WEO, verify Timescale writes.

    This requires the REAL backend and never uses fabricated demo values.
    The execution is bounded to one indicator and the requested countries.
    Results compare only matching-year OBSERVED observations. Official API
    downloads may take time; do not run in a production request handler.
    """
    iso3s = tuple(x.strip().upper() for x in countries.split(",") if x.strip())
    if not iso3s:
        raise typer.BadParameter("At least one ISO3 country is required.")
    settings = get_settings()
    result = run_inflation_pilot(
        worldbank=build_worldbank_service(),
        imf_weo=build_imf_weo_service(),
        timeseries_base_url=settings.timeseries_base_url,
        countries=iso3s,
    )
    typer.echo(json.dumps(result, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    app()