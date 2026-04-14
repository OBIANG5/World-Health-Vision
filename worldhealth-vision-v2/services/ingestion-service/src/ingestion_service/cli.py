import typer

from ingestion_service.runtime import build_worldbank_service

app = typer.Typer(help="WorldHealth Vision ingestion CLI.")
worldbank_app = typer.Typer(help="World Bank ingestion commands.")
app.add_typer(worldbank_app, name="worldbank")


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


if __name__ == "__main__":
    app()
