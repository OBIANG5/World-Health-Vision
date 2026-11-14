from __future__ import annotations

from media_service.models import EditorialScore, EditorialScoreFactors


WEIGHTS: dict[str, float] = {
    "freshness": 0.13,
    "surprise": 0.08,
    "human_impact": 0.10,
    "importance": 0.11,
    "visual_potential": 0.10,
    "numerical_strength": 0.06,
    "undercoverage": 0.10,
    "francophone_relevance": 0.06,
    "africa_relevance": 0.06,
    "source_confidence": 0.10,
    "urgency": 0.10,
}

SATURATION_WEIGHT = 0.10


def compute_editorial_score(factors: EditorialScoreFactors) -> EditorialScore:
    weighted = sum(getattr(factors, key) * weight for key, weight in WEIGHTS.items())
    weighted -= factors.saturation_penalty * SATURATION_WEIGHT
    total = max(0, min(100, round(weighted)))

    reasons: list[str] = []
    if factors.freshness >= 85:
        reasons.append("Information très récente")
    if factors.undercoverage >= 80:
        reasons.append("Sujet encore peu couvert")
    if factors.visual_potential >= 80:
        reasons.append("Fort potentiel visuel pour une vidéo courte")
    if factors.numerical_strength >= 80:
        reasons.append("Chiffres immédiatement compréhensibles et mémorables")
    if factors.human_impact >= 80:
        reasons.append("Impact humain élevé")
    if factors.source_confidence >= 90:
        reasons.append("Sources solides ou primaires")
    if factors.africa_relevance >= 85:
        reasons.append("Forte pertinence éditoriale Afrique")
    if factors.urgency >= 85:
        reasons.append("Fenêtre de publication courte")
    if factors.saturation_penalty >= 70:
        reasons.append("Attention : sujet déjà très saturé")

    if not reasons:
        reasons.append("Sujet exploitable mais sans avantage éditorial majeur détecté")

    return EditorialScore(total=total, factors=factors, reasons=reasons)
