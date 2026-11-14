from media_service.models import EditorialScoreFactors
from media_service.scoring import compute_editorial_score


def test_editorial_score_is_bounded_and_explainable():
    factors = EditorialScoreFactors(
        freshness=100,
        surprise=100,
        human_impact=100,
        importance=100,
        visual_potential=100,
        numerical_strength=100,
        undercoverage=100,
        francophone_relevance=100,
        africa_relevance=100,
        source_confidence=100,
        urgency=100,
        saturation_penalty=0,
    )

    score = compute_editorial_score(factors)

    assert score.total == 100
    assert score.reasons
    assert score.model_version == "wv-editorial-v0.1"


def test_saturation_reduces_score():
    common = dict(
        freshness=80,
        surprise=80,
        human_impact=80,
        importance=80,
        visual_potential=80,
        numerical_strength=80,
        undercoverage=80,
        francophone_relevance=80,
        africa_relevance=80,
        source_confidence=80,
        urgency=80,
    )
    low_saturation = compute_editorial_score(
        EditorialScoreFactors(**common, saturation_penalty=0)
    )
    high_saturation = compute_editorial_score(
        EditorialScoreFactors(**common, saturation_penalty=100)
    )

    assert high_saturation.total < low_saturation.total
