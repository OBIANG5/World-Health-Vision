from __future__ import annotations

from dataclasses import dataclass
from urllib.parse import urlparse


@dataclass(frozen=True)
class SourceRegistryEntry:
    id: str
    name: str
    domain: str
    source_type: str
    scope: str
    country_iso3: str | None
    priority: int
    is_primary: bool = False
    note: str = ""


# Seed registry only. The production objective is a country-by-country registry
# maintained independently from code. These entries are intentionally limited to
# sources whose identity/domain has already been verified during project work.
SEED_SOURCES: tuple[SourceRegistryEntry, ...] = (
    SourceRegistryEntry(
        id="reuters",
        name="Reuters",
        domain="reuters.com",
        source_type="press_agency",
        scope="international",
        country_iso3=None,
        priority=100,
        note="International wire service; priority source for breaking verification.",
    ),
    SourceRegistryEntry(
        id="ap",
        name="Associated Press",
        domain="apnews.com",
        source_type="press_agency",
        scope="international",
        country_iso3=None,
        priority=98,
        note="International wire service.",
    ),
    SourceRegistryEntry(
        id="france24",
        name="France 24",
        domain="france24.com",
        source_type="media",
        scope="international",
        country_iso3=None,
        priority=86,
        note="International francophone news source.",
    ),
    SourceRegistryEntry(
        id="rfi",
        name="RFI",
        domain="rfi.fr",
        source_type="media",
        scope="international",
        country_iso3=None,
        priority=88,
        note="Francophone international source with strong African coverage.",
    ),
    SourceRegistryEntry(
        id="agp-gabon",
        name="Agence Gabonaise de Presse (AGP)",
        domain="agpgabon.ga",
        source_type="press_agency",
        scope="local",
        country_iso3="GAB",
        priority=100,
        note="National Gabonese press agency.",
    ),
    SourceRegistryEntry(
        id="cour-constitutionnelle-gabon",
        name="Cour constitutionnelle du Gabon",
        domain="courconstitutionnelle.ga",
        source_type="institution",
        scope="local",
        country_iso3="GAB",
        priority=100,
        is_primary=True,
        note="Primary Gabonese constitutional institution.",
    ),
    SourceRegistryEntry(
        id="acp-rdc",
        name="Agence Congolaise de Presse (ACP)",
        domain="acp.cd",
        source_type="press_agency",
        scope="local",
        country_iso3="COD",
        priority=100,
        note="National press agency of the Democratic Republic of the Congo.",
    ),
    SourceRegistryEntry(
        id="aip-civ",
        name="Agence Ivoirienne de Presse (AIP)",
        domain="aip.ci",
        source_type="press_agency",
        scope="local",
        country_iso3="CIV",
        priority=100,
        note="National press agency of Côte d'Ivoire.",
    ),
    SourceRegistryEntry(
        id="aps-senegal",
        name="Agence de Presse Sénégalaise (APS)",
        domain="aps.sn",
        source_type="press_agency",
        scope="local",
        country_iso3="SEN",
        priority=100,
        note="National press agency of Senegal.",
    ),
)


_BY_DOMAIN = {entry.domain: entry for entry in SEED_SOURCES}


def normalized_domain(url: str) -> str:
    host = (urlparse(url).hostname or "").lower()
    return host.removeprefix("www.")


def resolve_source(url: str) -> SourceRegistryEntry | None:
    domain = normalized_domain(url)
    direct = _BY_DOMAIN.get(domain)
    if direct:
        return direct

    for registered_domain, entry in _BY_DOMAIN.items():
        if domain.endswith("." + registered_domain):
            return entry
    return None


def priority_sources(country_iso3: str | None = None) -> list[SourceRegistryEntry]:
    iso3 = country_iso3.upper() if country_iso3 else None
    entries = [
        entry
        for entry in SEED_SOURCES
        if entry.country_iso3 is None or entry.country_iso3 == iso3
    ]
    return sorted(entries, key=lambda entry: entry.priority, reverse=True)
