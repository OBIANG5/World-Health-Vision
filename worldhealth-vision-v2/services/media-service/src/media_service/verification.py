from __future__ import annotations

import json
from datetime import datetime, timezone

import httpx

from media_service.models import (
    ClaimVerification,
    MediaStory,
    VerificationReport,
    VerifyStoryRequest,
)
from media_service.radar import (
    _extract_output_text,
    _extract_retrieved_urls,
    canonical_url,
)
from media_service.settings import Settings, get_settings


class VerificationConfigurationError(RuntimeError):
    pass


class VerificationProviderError(RuntimeError):
    pass


VERIFICATION_SCHEMA = {
    "type": "object",
    "additionalProperties": False,
    "properties": {
        "claims": {
            "type": "array",
            "items": {
                "type": "object",
                "additionalProperties": False,
                "properties": {
                    "claim": {"type": "string"},
                    "supporting_urls": {
                        "type": "array",
                        "items": {"type": "string"},
                    },
                    "contradicting_urls": {
                        "type": "array",
                        "items": {"type": "string"},
                    },
                    "explanation": {"type": "string"},
                },
                "required": [
                    "claim",
                    "supporting_urls",
                    "contradicting_urls",
                    "explanation",
                ],
            },
        }
    },
    "required": ["claims"],
}


def _dedupe_valid_urls(raw_urls: object, retrieved: set[str]) -> list[str]:
    if not isinstance(raw_urls, list):
        return []

    output: list[str] = []
    seen: set[str] = set()
    for value in raw_urls:
        if not isinstance(value, str):
            continue
        normalized = canonical_url(value)
        if normalized not in retrieved or normalized in seen:
            continue
        seen.add(normalized)
        output.append(normalized)
    return output


def _verification_prompt(story: MediaStory, request: VerifyStoryRequest) -> str:
    existing_sources = "\n".join(
        (
            f"- {source.name}: {source.url} "
            f"(type={source.source_type}, scope={source.scope}, primary={source.is_primary})"
        )
        for source in story.sources
    ) or "- aucune source déjà attachée"

    return f"""
Tu es le module VERIFY de World-Vision.

Vérifie sur le Web LIVE les affirmations factuelles essentielles de cette actualité.
Tu dois distinguer clairement la date de publication, la date de l'événement, les
chiffres, les noms, les lieux, les institutions et les citations factuelles.

Titre:
{story.title}

Résumé:
{story.summary}

Pays:
{story.country_name or story.country_iso3 or "non précisé"}

Sources déjà attachées:
{existing_sources}

Règles:
- identifie au maximum {request.max_claims} affirmations factuelles décisives;
- recherche réellement chaque affirmation sur le Web;
- privilégie source primaire, institution, agence nationale et agence de presse;
- une URL de support ou de contradiction doit avoir été réellement consultée;
- ne fabrique jamais une URL;
- si une affirmation n'est pas confirmable, laisse ses listes de preuves vides;
- si deux sources crédibles se contredisent, indique les deux côtés;
- ne donne pas un verdict global: le serveur World-Vision le calculera;
- réponses et explications en français.
""".strip()


class OpenAIVerificationClient:
    def __init__(self, settings: Settings | None = None) -> None:
        self.settings = settings or get_settings()

    async def verify(
        self,
        story: MediaStory,
        request: VerifyStoryRequest,
    ) -> VerificationReport:
        if not self.settings.openai_api_key:
            raise VerificationConfigurationError(
                "WHV_MEDIA_OPENAI_API_KEY is not configured; VERIFY is disabled."
            )

        body = {
            "model": self.settings.verification_model,
            "reasoning": {"effort": "low"},
            "tools": [
                {
                    "type": "web_search",
                    "search_context_size": "high",
                    "external_web_access": True,
                }
            ],
            "tool_choice": "required",
            "include": ["web_search_call.action.sources"],
            "text": {
                "format": {
                    "type": "json_schema",
                    "name": "world_vision_verify",
                    "description": "Claim-level evidence for a World-Vision news story.",
                    "strict": True,
                    "schema": VERIFICATION_SCHEMA,
                }
            },
            "input": _verification_prompt(story, request),
        }

        headers = {
            "authorization": f"Bearer {self.settings.openai_api_key}",
            "content-type": "application/json",
        }

        try:
            async with httpx.AsyncClient(
                timeout=self.settings.verification_timeout_seconds
            ) as client:
                response = await client.post(
                    "https://api.openai.com/v1/responses",
                    headers=headers,
                    json=body,
                )
                response.raise_for_status()
        except httpx.HTTPError as exc:
            raise VerificationProviderError(
                f"OpenAI VERIFY request failed: {exc}"
            ) from exc

        payload = response.json()
        if payload.get("status") not in {None, "completed"}:
            raise VerificationProviderError(
                f"OpenAI VERIFY response status is {payload.get('status')!r}."
            )

        retrieved_urls = _extract_retrieved_urls(payload)
        retrieved_set = set(retrieved_urls)

        try:
            raw = json.loads(_extract_output_text(payload))
            raw_claims = raw.get("claims", [])
        except (json.JSONDecodeError, TypeError) as exc:
            raise VerificationProviderError(
                "OpenAI VERIFY returned invalid JSON."
            ) from exc

        claims: list[ClaimVerification] = []
        for raw_claim in raw_claims[: request.max_claims]:
            if not isinstance(raw_claim, dict):
                continue

            claim_text = raw_claim.get("claim")
            explanation = raw_claim.get("explanation")
            if not isinstance(claim_text, str) or not claim_text.strip():
                continue
            if not isinstance(explanation, str):
                explanation = ""

            supporting = _dedupe_valid_urls(
                raw_claim.get("supporting_urls"),
                retrieved_set,
            )
            contradicting = _dedupe_valid_urls(
                raw_claim.get("contradicting_urls"),
                retrieved_set,
            )

            if contradicting:
                status = "conflicting"
            elif supporting:
                status = "verified"
            else:
                status = "unresolved"

            claims.append(
                ClaimVerification(
                    claim=claim_text.strip(),
                    status=status,
                    supporting_urls=supporting,
                    contradicting_urls=contradicting,
                    explanation=explanation.strip(),
                )
            )

        support_urls = {
            url
            for claim in claims
            for url in claim.supporting_urls
        }
        primary_urls = {
            canonical_url(source.url)
            for source in story.sources
            if source.is_primary
        }
        has_primary_support = bool(support_urls.intersection(primary_urls))

        conflicting = sum(claim.status == "conflicting" for claim in claims)
        verified = sum(claim.status == "verified" for claim in claims)
        unresolved = sum(claim.status == "unresolved" for claim in claims)

        if conflicting:
            verdict = "conflicting"
        elif claims and unresolved == 0 and (
            len(support_urls) >= 2 or has_primary_support
        ):
            verdict = "verified"
        elif verified:
            verdict = "partially_verified"
        else:
            verdict = "unverified"

        if not claims:
            confidence = 0
        else:
            verified_ratio = verified / len(claims)
            confidence = round(
                verified_ratio * 70
                + min(len(support_urls), 3) * 7
                + (9 if has_primary_support else 0)
            )
            if conflicting:
                confidence = min(confidence, 45)
            confidence = max(0, min(100, confidence))

        previous_version = (
            story.verification_report.version
            if story.verification_report is not None
            else 0
        )

        return VerificationReport(
            version=previous_version + 1,
            checked_at=datetime.now(timezone.utc),
            model=self.settings.verification_model,
            retrieved_urls=retrieved_urls,
            claims=claims,
            distinct_supporting_sources=len(support_urls),
            has_primary_support=has_primary_support,
            verdict=verdict,
            confidence_score=confidence,
        )


VERIFICATION_CLIENT = OpenAIVerificationClient()
