import pytest

from media_service.creative import build_video_draft
from media_service.editorial_creative import (
    CreativeGroundingError,
    adjudicate_creative,
)
from media_service.models import (
    ClaimVerification,
    GenerateCreativeRequest,
    PrepareDraftRequest,
    VerificationReport,
)
from media_service.store import build_seed_story


def verified_story():
    seed = build_seed_story()
    report = VerificationReport(
        version=1,
        checked_at=seed.updated_at,
        model="test-verify",
        retrieved_urls=[
            "https://courconstitutionnelle.ga/",
            "https://agpgabon.ga/confirmation",
        ],
        claims=[
            ClaimVerification(
                claim="Le recensement établit 3 518 621 habitants.",
                status="verified",
                supporting_urls=["https://courconstitutionnelle.ga/"],
                contradicting_urls=[],
                explanation="Source institutionnelle confirmante.",
            ),
            ClaimVerification(
                claim="Le chiffre a été homologué le 27 août 2026.",
                status="verified",
                supporting_urls=["https://agpgabon.ga/confirmation"],
                contradicting_urls=[],
                explanation="Agence nationale confirmante.",
            ),
        ],
        distinct_supporting_sources=2,
        has_primary_support=True,
        verdict="verified",
        confidence_score=96,
    )
    return seed.model_copy(
        update={
            "verification_status": "verified",
            "verification_report": report,
            "confidence_score": 96,
            "status": "approved",
        },
        deep=True,
    )


def valid_raw_creative():
    return {
        "angle": "Le nouveau chiffre officiel change l’échelle démographique du Gabon.",
        "angle_claim_indexes": [1, 2],
        "hooks": [
            {
                "text": "🇬🇦 3,5 millions : le nouveau chiffre officiel du Gabon.",
                "score": 96,
                "rationale": "Le chiffre est immédiat et vérifié.",
                "claim_indexes": [1],
            },
            {
                "text": "🇬🇦 Le chiffre homologué le 27 août change le portrait démographique.",
                "score": 91,
                "rationale": "Met en avant la date et la portée.",
                "claim_indexes": [1, 2],
            },
        ],
        "script_segments": [
            {
                "text": "Le recensement établit désormais la population à 3 518 621 habitants.",
                "claim_indexes": [1],
            },
            {
                "text": "Ce chiffre a été homologué le 27 août 2026.",
                "claim_indexes": [2],
            },
        ],
        "caption": "Le Gabon dispose d’un nouveau chiffre de population homologué.",
        "caption_claim_indexes": [1, 2],
        "hashtags": ["Gabon", "#Afrique", "Actualité"],
        "scene_plan": [
            {
                "purpose": "hook",
                "on_screen_text": "3,5 MILLIONS",
                "visual_kind": "typography",
                "asset_query": "Gabon population recensement",
                "claim_indexes": [1],
            },
            {
                "purpose": "explain",
                "on_screen_text": "HOMOLOGUÉ LE 27 AOÛT 2026",
                "visual_kind": "document",
                "asset_query": "Gabon recensement document officiel",
                "claim_indexes": [2],
            },
            {
                "purpose": "source_and_brand",
                "on_screen_text": "Sources",
                "visual_kind": "source_card",
                "asset_query": None,
                "claim_indexes": [],
            },
        ],
    }


def test_creative_package_keeps_only_verified_claim_references():
    story = verified_story()
    raw = valid_raw_creative()
    raw["hooks"][0]["claim_indexes"] = [1, 999]

    package = adjudicate_creative(
        story=story,
        raw=raw,
        request=GenerateCreativeRequest(target_duration_sec=15),
        model="test-creative",
    )

    assert package.hooks[0].claim_indexes == [1]
    assert package.angle_claim_indexes == [1, 2]
    assert package.caption_claim_indexes == [1, 2]
    assert package.hashtags == ["#Gabon", "#Afrique", "#Actualité"]


def test_creative_rejects_ungrounded_angle():
    story = verified_story()
    raw = valid_raw_creative()
    raw["angle_claim_indexes"] = [999]

    with pytest.raises(CreativeGroundingError):
        adjudicate_creative(
            story=story,
            raw=raw,
            request=GenerateCreativeRequest(target_duration_sec=15),
            model="test-creative",
        )


def test_creative_rejects_excessive_voiceover_length():
    story = verified_story()
    raw = valid_raw_creative()
    raw["script_segments"] = [
        {
            "text": " ".join(["mot"] * 100),
            "claim_indexes": [1],
        }
    ]

    with pytest.raises(CreativeGroundingError, match="too long"):
        adjudicate_creative(
            story=story,
            raw=raw,
            request=GenerateCreativeRequest(target_duration_sec=15),
            model="test-creative",
        )


def test_video_draft_uses_creative_package_and_selected_hook():
    story = verified_story()
    package = adjudicate_creative(
        story=story,
        raw=valid_raw_creative(),
        request=GenerateCreativeRequest(target_duration_sec=15),
        model="test-creative",
    )
    story.creative_package = package
    story.hooks = package.hooks
    story.selected_hook_id = package.hooks[0].id
    story.target_duration_sec = package.target_duration_sec

    draft = build_video_draft(story, PrepareDraftRequest())

    assert draft.hook_id == package.hooks[0].id
    assert draft.duration_sec == 15
    assert draft.scenes[0].on_screen_text == package.hooks[0].text
    assert draft.scenes[-1].visual_kind == "source_card"
    assert draft.scenes[-1].on_screen_text.startswith("Sources :")
    assert "3 518 621" in draft.voiceover_script
