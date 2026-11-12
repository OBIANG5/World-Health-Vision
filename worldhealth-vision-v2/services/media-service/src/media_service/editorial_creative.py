from __future__ import annotations

import json
from datetime import datetime, timezone

import httpx

from media_service.models import (
    CreativePackage,
    CreativeScenePlan,
    CreativeScriptSegment,
    GenerateCreativeRequest,
    HookOption,
    MediaStory,
)
from media_service.settings import Settings, get_settings


class CreativeConfigurationError(RuntimeError):
    pass


class CreativeProviderError(RuntimeError):
    pass


class CreativeGroundingError(RuntimeError):
    pass


CREATIVE_SCHEMA = {
    "type": "object",
    "additionalProperties": False,
    "properties": {
        "angle": {"type": "string"},
        "angle_claim_indexes": {
            "type": "array",
            "items": {"type": "integer"},
        },
        "hooks": {
            "type": "array",
            "items": {
                "type": "object",
                "additionalProperties": False,
                "properties": {
                    "text": {"type": "string"},
                    "score": {"type": "integer"},
                    "rationale": {"type": "string"},
                    "claim_indexes": {
                        "type": "array",
                        "items": {"type": "integer"},
                    },
                },
                "required": [
                    "text",
                    "score",
                    "rationale",
                    "claim_indexes",
                ],
            },
        },
        "script_segments": {
            "type": "array",
            "items": {
                "type": "object",
                "additionalProperties": False,
                "properties": {
                    "text": {"type": "string"},
                    "claim_indexes": {
                        "type": "array",
                        "items": {"type": "integer"},
                    },
                },
                "required": ["text", "claim_indexes"],
            },
        },
        "caption": {"type": "string"},
        "caption_claim_indexes": {
            "type": "array",
            "items": {"type": "integer"},
        },
        "hashtags": {
            "type": "array",
            "items": {"type": "string"},
        },
        "scene_plan": {
            "type": "array",
            "items": {
                "type": "object",
                "additionalProperties": False,
                "properties": {
                    "purpose": {"type": "string"},
                    "on_screen_text": {"type": "string"},
                    "visual_kind": {
                        "type": "string",
                        "enum": [
                            "real_photo",
                            "real_video",
                            "map",
                            "chart",
                            "document",
                            "typography",
                            "source_card",
                        ],
                    },
                    "asset_query": {"type": ["string", "null"]},
                    "claim_indexes": {
                        "type": "array",
                        "items": {"type": "integer"},
                    },
                },
                "required": [
                    "purpose",
                    "on_screen_text",
                    "visual_kind",
                    "asset_query",
                    "claim_indexes",
                ],
            },
        },
    },
    "required": [
        "angle",
        "angle_claim_indexes",
        "hooks",
        "script_segments",
        "caption",
        "caption_claim_indexes",
        "hashtags",
        "scene_plan",
    ],
}


def _extract_output_text(payload: dict) -> str:
    direct = payload.get("output_text")
    if isinstance(direct, str) and direct.strip():
        return direct

    chunks: list[str] = []
    for item in payload.get("output", []):
        if not isinstance(item, dict) or item.get("type") != "message":
            continue
        for part in item.get("content", []):
            if isinstance(part, dict) and part.get("type") == "output_text":
                text = part.get("text")
                if isinstance(text, str):
                    chunks.append(text)

    value = "".join(chunks).strip()
    if not value:
        raise CreativeProviderError(
            "OpenAI CREATIVE response did not contain structured output text."
        )
    return value


def _verified_claim_numbers(story: MediaStory) -> set[int]:
    report = story.verification_report
    if report is None:
        return set()
    return {
        index
        for index, claim in enumerate(report.claims, start=1)
        if claim.status == "verified"
    }


def _normalize_claim_indexes(
    raw: object,
    allowed: set[int],
) -> list[int]:
    if not isinstance(raw, list):
        return []

    output: list[int] = []
    for value in raw:
        if not isinstance(value, int):
            continue
        if value not in allowed or value in output:
            continue
        output.append(value)
    return output


def _creative_prompt(
    story: MediaStory,
    request: GenerateCreativeRequest,
) -> str:
    if story.verification_report is None:
        raise CreativeGroundingError("VERIFY report is required before CREATIVE.")

    verified_claims = [
        (index, claim)
        for index, claim in enumerate(story.verification_report.claims, start=1)
        if claim.status == "verified"
    ]
    if not verified_claims:
        raise CreativeGroundingError(
            "CREATIVE requires at least one verified claim."
        )

    claim_lines = "\n".join(
        (
            f"[{index}] {claim.claim}\n"
            f"    preuves: {', '.join(claim.supporting_urls) or 'aucune'}"
        )
        for index, claim in verified_claims
    )

    return f"""
Tu es le module CREATIVE de World-Vision.
Tu transformes UNIQUEMENT des faits déjà vérifiés en contenu vidéo vertical court.

Titre de travail:
{story.title}

Pays / zone:
{story.country_name or story.country_iso3 or story.region or "Monde"}

Catégorie:
{story.category}

Claims VERIFY autorisés:
{claim_lines}

Contraintes absolues:
- n'ajoute AUCUN fait qui n'est pas présent dans les claims ci-dessus;
- chaque angle, hook, segment de voix off, légende et scène factuelle doit citer
  les numéros de claims qui l'autorisent;
- les claim_indexes sont numérotés à partir de 1 et doivent correspondre
  exactement à la liste ci-dessus;
- pas de dramatisation trompeuse, pas de faux chiffre, pas de fausse citation;
- le hook doit être fort mais factuel;
- français naturel, très lisible à l'écran;
- durée cible: {request.target_duration_sec} secondes;
- maximum {request.max_hooks} hooks;
- voix off compacte: environ 2,2 à 2,6 mots par seconde;
- 3 à 5 scènes, dont la dernière peut être une source_card;
- asset_query décrit ce qu'il faudrait chercher comme média réel, sans inventer
  qu'un média existe ni donner une fausse URL;
- hashtags sobres, maximum 8.

Retourne uniquement le JSON demandé.
""".strip()


def adjudicate_creative(
    *,
    story: MediaStory,
    raw: dict,
    request: GenerateCreativeRequest,
    model: str,
) -> CreativePackage:
    if story.verification_status != "verified":
        raise CreativeGroundingError(
            "Story must be verified before CREATIVE."
        )

    allowed = _verified_claim_numbers(story)
    if not allowed:
        raise CreativeGroundingError(
            "No verified claims are available for CREATIVE."
        )

    previous_version = (
        story.creative_package.version
        if story.creative_package is not None
        else 0
    )
    version = previous_version + 1

    angle = raw.get("angle")
    if not isinstance(angle, str) or not angle.strip():
        raise CreativeGroundingError("Creative angle is empty.")
    angle_claim_indexes = _normalize_claim_indexes(
        raw.get("angle_claim_indexes"),
        allowed,
    )
    if not angle_claim_indexes:
        raise CreativeGroundingError(
            "Creative angle is not grounded in a verified claim."
        )

    hooks: list[HookOption] = []
    raw_hooks = raw.get("hooks")
    if isinstance(raw_hooks, list):
        for raw_hook in raw_hooks[: request.max_hooks]:
            if not isinstance(raw_hook, dict):
                continue
            text = raw_hook.get("text")
            rationale = raw_hook.get("rationale")
            score = raw_hook.get("score")
            indexes = _normalize_claim_indexes(
                raw_hook.get("claim_indexes"),
                allowed,
            )
            if (
                not isinstance(text, str)
                or not text.strip()
                or not isinstance(rationale, str)
                or not isinstance(score, int)
                or not indexes
            ):
                continue
            hooks.append(
                HookOption(
                    id=f"creative-v{version}-hook-{len(hooks) + 1}",
                    text=text.strip(),
                    score=max(0, min(100, score)),
                    rationale=rationale.strip(),
                    claim_indexes=indexes,
                )
            )

    if not hooks:
        raise CreativeGroundingError(
            "No grounded creative hook was produced."
        )

    script_segments: list[CreativeScriptSegment] = []
    raw_segments = raw.get("script_segments")
    if isinstance(raw_segments, list):
        for segment in raw_segments:
            if not isinstance(segment, dict):
                continue
            text = segment.get("text")
            indexes = _normalize_claim_indexes(
                segment.get("claim_indexes"),
                allowed,
            )
            if not isinstance(text, str) or not text.strip() or not indexes:
                continue
            script_segments.append(
                CreativeScriptSegment(
                    text=text.strip(),
                    claim_indexes=indexes,
                )
            )

    if not script_segments:
        raise CreativeGroundingError(
            "No grounded voice-over segment was produced."
        )

    script_words = sum(
        len(segment.text.split())
        for segment in script_segments
    )
    max_words = max(20, round(request.target_duration_sec * 2.8))
    if script_words > max_words:
        raise CreativeGroundingError(
            f"Voice-over is too long: {script_words} words for "
            f"{request.target_duration_sec}s target."
        )

    caption = raw.get("caption")
    if not isinstance(caption, str) or not caption.strip():
        raise CreativeGroundingError("Creative caption is empty.")
    caption_claim_indexes = _normalize_claim_indexes(
        raw.get("caption_claim_indexes"),
        allowed,
    )
    if not caption_claim_indexes:
        raise CreativeGroundingError(
            "Creative caption is not grounded in a verified claim."
        )

    hashtags: list[str] = []
    raw_hashtags = raw.get("hashtags")
    if isinstance(raw_hashtags, list):
        for value in raw_hashtags[:8]:
            if not isinstance(value, str):
                continue
            cleaned = value.strip().replace(" ", "")
            if not cleaned:
                continue
            if not cleaned.startswith("#"):
                cleaned = "#" + cleaned
            if cleaned not in hashtags:
                hashtags.append(cleaned)

    scene_plan: list[CreativeScenePlan] = []
    raw_scenes = raw.get("scene_plan")
    if isinstance(raw_scenes, list):
        for raw_scene in raw_scenes[:5]:
            if not isinstance(raw_scene, dict):
                continue
            purpose = raw_scene.get("purpose")
            on_screen_text = raw_scene.get("on_screen_text")
            visual_kind = raw_scene.get("visual_kind")
            asset_query = raw_scene.get("asset_query")
            indexes = _normalize_claim_indexes(
                raw_scene.get("claim_indexes"),
                allowed,
            )
            if not isinstance(purpose, str) or not purpose.strip():
                continue
            if not isinstance(on_screen_text, str) or not on_screen_text.strip():
                continue
            if visual_kind not in {
                "real_photo",
                "real_video",
                "map",
                "chart",
                "document",
                "typography",
                "source_card",
            }:
                continue
            if visual_kind != "source_card" and not indexes:
                continue
            if asset_query is not None and not isinstance(asset_query, str):
                asset_query = None

            scene_plan.append(
                CreativeScenePlan(
                    order=len(scene_plan) + 1,
                    purpose=purpose.strip(),
                    on_screen_text=on_screen_text.strip(),
                    visual_kind=visual_kind,
                    asset_query=(
                        asset_query.strip()
                        if isinstance(asset_query, str) and asset_query.strip()
                        else None
                    ),
                    claim_indexes=indexes,
                )
            )

    if len(scene_plan) < 2:
        raise CreativeGroundingError(
            "At least two valid creative scenes are required."
        )

    return CreativePackage(
        version=version,
        created_at=datetime.now(timezone.utc),
        model=model,
        angle=angle.strip(),
        angle_claim_indexes=angle_claim_indexes,
        target_duration_sec=request.target_duration_sec,
        hooks=hooks,
        script_segments=script_segments,
        caption=caption.strip(),
        caption_claim_indexes=caption_claim_indexes,
        hashtags=hashtags,
        scene_plan=scene_plan,
    )


class OpenAICreativeClient:
    def __init__(self, settings: Settings | None = None) -> None:
        self.settings = settings or get_settings()

    async def generate(
        self,
        story: MediaStory,
        request: GenerateCreativeRequest,
    ) -> CreativePackage:
        if not self.settings.openai_api_key:
            raise CreativeConfigurationError(
                "WHV_MEDIA_OPENAI_API_KEY is not configured; CREATIVE is disabled."
            )

        prompt = _creative_prompt(story, request)
        body = {
            "model": self.settings.creative_model,
            "reasoning": {"effort": "low"},
            "text": {
                "format": {
                    "type": "json_schema",
                    "name": "world_vision_creative",
                    "description": (
                        "Claim-grounded creative package for a verified "
                        "World-Vision short news video."
                    ),
                    "strict": True,
                    "schema": CREATIVE_SCHEMA,
                }
            },
            "input": prompt,
        }
        headers = {
            "authorization": f"Bearer {self.settings.openai_api_key}",
            "content-type": "application/json",
        }

        try:
            async with httpx.AsyncClient(
                timeout=self.settings.creative_timeout_seconds
            ) as client:
                response = await client.post(
                    "https://api.openai.com/v1/responses",
                    headers=headers,
                    json=body,
                )
                response.raise_for_status()
        except httpx.HTTPError as exc:
            raise CreativeProviderError(
                f"OpenAI CREATIVE request failed: {exc}"
            ) from exc

        payload = response.json()
        if payload.get("status") not in {None, "completed"}:
            raise CreativeProviderError(
                f"OpenAI CREATIVE response status is {payload.get('status')!r}."
            )

        try:
            raw = json.loads(_extract_output_text(payload))
        except (json.JSONDecodeError, TypeError) as exc:
            raise CreativeProviderError(
                "OpenAI CREATIVE returned invalid JSON."
            ) from exc

        if not isinstance(raw, dict):
            raise CreativeProviderError(
                "OpenAI CREATIVE output must be a JSON object."
            )

        return adjudicate_creative(
            story=story,
            raw=raw,
            request=request,
            model=self.settings.creative_model,
        )


CREATIVE_CLIENT = OpenAICreativeClient()
