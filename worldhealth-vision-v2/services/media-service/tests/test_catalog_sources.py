from media_service.catalog_client import CatalogLocalSource
from media_service.models import RadarScanRequest
from media_service.radar import (
    _build_prompt,
    _catalog_source_is_primary,
    _catalog_source_type,
    _match_catalog_source,
)


def catalog_source(**overrides):
    values = {
        "countryIso3": "GAB",
        "sourceCode": "INSTAT_GABON",
        "displayName": "INSTAT Gabon",
        "organizationName": "Institut national de la statistique du Gabon",
        "sourceRole": "STATISTICS_OFFICE",
        "sourceType": "NATIONAL_OFFICIAL",
        "homepageUrl": "https://new.instatgabon.org/fr",
        "evidenceUrl": "https://rgplprovisoire.instatgabon.org/",
        "verificationState": "VERIFIED_ORGANIZATION",
        "lastReviewedOn": "2026-11-12",
        "methodologyCaveat": "Vérifier période et méthode.",
        "reuseRightsNote": "Vérifier les droits avant redistribution.",
    }
    values.update(overrides)
    return CatalogLocalSource.model_validate(values)


def test_catalog_official_source_is_primary_institution():
    source = catalog_source()

    assert _catalog_source_type(source) == "institution"
    assert _catalog_source_is_primary(source) is True


def test_catalog_news_agency_maps_to_press_agency_not_primary():
    source = catalog_source(
        sourceCode="AGP_GABON",
        displayName="Agence gabonaise de presse",
        organizationName="Agence gabonaise de presse",
        sourceRole="NEWS_AGENCY",
        sourceType="LOCAL_MEDIA",
        homepageUrl="https://agpgabon.ga/",
        evidenceUrl="https://agpgabon.ga/actualite/test",
    )

    assert _catalog_source_type(source) == "press_agency"
    assert _catalog_source_is_primary(source) is False


def test_catalog_source_matches_same_domain_article():
    source = catalog_source(
        sourceCode="AGP_GABON",
        displayName="Agence gabonaise de presse",
        organizationName="Agence gabonaise de presse",
        sourceRole="NEWS_AGENCY",
        sourceType="LOCAL_MEDIA",
        homepageUrl="https://agpgabon.ga/",
        evidenceUrl="https://agpgabon.ga/actualite/test",
    )

    matched = _match_catalog_source(
        "https://www.agpgabon.ga/politique/une-actualite",
        [source],
    )

    assert matched is not None
    assert matched.source_code == "AGP_GABON"


def test_catalog_source_requiring_review_is_not_trusted_for_enrichment():
    source = catalog_source(verificationState="REVIEW_REQUIRED")

    assert _match_catalog_source(
        "https://new.instatgabon.org/fr/actualite",
        [source],
    ) is None


def test_targeted_radar_prompt_prefers_verified_catalog_sources():
    verified = catalog_source()
    review_required = catalog_source(
        sourceCode="PENDING",
        displayName="Source en révision",
        organizationName="Source en révision",
        verificationState="REVIEW_REQUIRED",
        homepageUrl="https://pending.example.org/",
        evidenceUrl="https://pending.example.org/evidence",
    )

    prompt = _build_prompt(
        RadarScanRequest(hours=3, country_iso3="GAB", max_candidates=12),
        [verified, review_required],
    )

    assert "INSTAT Gabon" in prompt
    assert "catalogue V2 vérifié" in prompt
    assert "Source en révision" not in prompt
    assert "pending.example.org" not in prompt
