from media_service.store import build_seed_story
from media_service.verification import adjudicate_verification


def test_verify_rejects_hallucinated_evidence_urls():
    story = build_seed_story()

    report = adjudicate_verification(
        story=story,
        raw_claims=[
            {
                "claim": "Le chiffre officiel est de 3 518 621 habitants.",
                "supporting_urls": ["https://invented.example/fake"],
                "contradicting_urls": [],
                "explanation": "Le modèle a proposé une URL non récupérée.",
            }
        ],
        retrieved_urls=["https://agpgabon.ga/autre-page"],
        model="test-model",
    )

    assert report.claims[0].status == "unresolved"
    assert report.claims[0].supporting_urls == []
    assert report.verdict == "unverified"
    assert report.confidence_score == 0


def test_verify_requires_two_supporting_sources_when_no_primary_source_matches():
    story = build_seed_story().model_copy(
        update={
            "sources": [
                source.model_copy(update={"is_primary": False})
                for source in build_seed_story().sources
            ]
        }
    )

    urls = [
        "https://agpgabon.ga/confirmation",
        "https://reuters.com/world/confirmation",
    ]
    report = adjudicate_verification(
        story=story,
        raw_claims=[
            {
                "claim": "Le chiffre officiel est confirmé.",
                "supporting_urls": urls,
                "contradicting_urls": [],
                "explanation": "Deux sources concordent.",
            }
        ],
        retrieved_urls=urls,
        model="test-model",
    )

    assert report.verdict == "verified"
    assert report.distinct_supporting_sources == 2
    assert report.has_primary_support is False


def test_verify_accepts_one_matching_primary_source_for_a_fully_confirmed_claim():
    story = build_seed_story()
    primary_url = "https://courconstitutionnelle.ga/"

    report = adjudicate_verification(
        story=story,
        raw_claims=[
            {
                "claim": "La Cour constitutionnelle a homologué le résultat.",
                "supporting_urls": [primary_url],
                "contradicting_urls": [],
                "explanation": "La source institutionnelle primaire confirme.",
            }
        ],
        retrieved_urls=["https://courconstitutionnelle.ga/"],
        model="test-model",
    )

    assert report.verdict == "verified"
    assert report.has_primary_support is True


def test_verify_conflict_overrides_support_and_caps_confidence():
    story = build_seed_story()
    support = "https://agpgabon.ga/confirmation"
    contradiction = "https://reuters.com/world/contradiction"

    report = adjudicate_verification(
        story=story,
        raw_claims=[
            {
                "claim": "Le chiffre contesté est exact.",
                "supporting_urls": [support],
                "contradicting_urls": [contradiction],
                "explanation": "Deux sources crédibles divergent.",
            }
        ],
        retrieved_urls=[support, contradiction],
        model="test-model",
    )

    assert report.claims[0].status == "conflicting"
    assert report.verdict == "conflicting"
    assert report.confidence_score <= 45
