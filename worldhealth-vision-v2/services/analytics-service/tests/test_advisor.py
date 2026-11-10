"""Tests of the real V2 advisor contract and the no-invented-data rule."""

from types import SimpleNamespace

from analytics_service.advisor import build_advisor_response


def _lens(*, value, code="GROWTH_MOMENTUM", primary="WORLD_BANK"):
    return SimpleNamespace(
        lensCode=code,
        lensDisplayName="Croissance économique",
        signalTone="BALANCED",
        headline="La croissance progresse.",
        latestComparableValue=value,
        latestPeriodLabel="2024",
        unitLabel="PERCENT",
        confidenceLevel="MEDIUM",
        selectedSourceCode=primary,
        sourceAudit=SimpleNamespace(primarySourceCode=primary, evidence=[]),
    )


def _snapshot(lenses, highlights=None):
    return SimpleNamespace(
        country=SimpleNamespace(displayName="France"),
        lenses=lenses,
        highlights=highlights or [],
    )


def test_advisor_never_claims_values_for_empty_timeseries():
    result = build_advisor_response(
        question="Quelle est la croissance ?",
        iso3="FRA",
        lang="fr",
        eco_snapshot=_snapshot([_lens(value=None)]),
        cost_snapshot=None,
    )
    assert result["sourcesUsed"] == []
    assert result["dataPoints"] == 0
    assert "pas encore de données" in result["answer"]
    assert "La croissance progresse" not in result["answer"]


def test_advisor_uses_actual_snapshot_fields_and_provenance():
    result = build_advisor_response(
        question="Comment évolue la croissance économique ?",
        iso3="FRA",
        lang="fr",
        eco_snapshot=_snapshot([_lens(value=2.3)], ["Croissance en hausse."]),
        cost_snapshot=None,
    )
    assert "France" in result["answer"]
    assert "2.30 PERCENT" in result["answer"]
    assert "2024" in result["answer"]
    assert "confiance MEDIUM" in result["answer"]
    assert "Croissance en hausse." in result["answer"]
    assert result["sourcesUsed"] == ["WORLD_BANK"]
    assert result["dataPoints"] == 1


def test_advisor_does_not_invent_sources_when_lens_has_none():
    result = build_advisor_response(
        question="économie",
        iso3="FRA",
        lang="fr",
        eco_snapshot=_snapshot([_lens(value=1.5, primary=None)]),
        cost_snapshot=None,
    )
    assert result["dataPoints"] == 1
    assert result["sourcesUsed"] == []
