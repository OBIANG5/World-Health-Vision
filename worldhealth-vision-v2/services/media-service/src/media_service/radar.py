from __future__ import annotations

import json
from dataclasses import dataclass
from urllib.parse import urlsplit, urlunsplit
from uuid import uuid4

import httpx
from pydantic import ValidationError

from media_service.models import RadarCandidate, RadarScanRequest
from media_service.settings import Settings, get_settings
from media_service.source_registry import priority_sources, resolve_source


class RadarConfigurationError(RuntimeError):
    pass


class RadarProviderError(RuntimeError):
    pass


@dataclass(frozen=True)
class RadarDiscovery:
    scan_id: str
    query: str
    model: str
    retrieved_urls: list[str]
    raw_candidate_count: int
    candidates: list[RadarCandidate]
    rejected_without_retrieved_source: int


RADAR_SCHEMA = {
    "type": "object",
    "additionalProperties": False,
    "properties": {
        "candidates": {
            "type": "array",
            "items": {
                "type": "object",
                "additionalProperties": False,
                "properties": {
                    "title": {"type": "string"},
                    "summary": {"type": "string"},
                    "category": {"type": "string"},
                    "country_iso3": {"type": ["string", "null"]},
                    "country_name": {"type": ["string", "null"]},
                    "region": {"type": ["string", "null"]},
                    "breaking": {"type": "boolean"},
                    "event_at": {"type": ["string", "null"]},
                    "confidence_score": {"type": "integer"},
                    "sources": {
                        "type": "array",
                        "items": {
                            "type": "object",
                            "additionalProperties": False,
                            "properties": {
                                "name": {"type": "string"},
                                "url": {"type": "string"},
                                "source_type": {
                                    "type": "string",
                                    "enum": [
                                        "institution",
                                        "press_agency",
                                        "media",
                                        "social",
                                        "research",
                                        "other",
                                    ],
                                },
                                "scope": {
                                    "type": "string",
                                    "enum": ["local", "regional", "international"],
                                },
                                "country_iso3": {"type": ["string", "null"]},
                                "is_primary": {"type": "boolean"},
                                "published_at": {"type": ["string", "null"]},
                                "note": {"type": "string"},
                            },
                            "required": [
                                "name",
                                "url",
                                "source_type",
                                "scope",
                                "country_iso3",
                                "is_primary",
                                "published_at",
                                "note",
                            ],
                        },
                    },
                    "factors": {
                        "type": "object",
                        "additionalProperties": False,
                        "properties": {
                            "freshness": {"type": "integer"},
                            "surprise": {"type": "integer"},
                            "human_impact": {"type": "integer"},
                            "importance": {"type": "integer"},
                            "visual_potential": {"type": "integer"},
                            "numerical_strength": {"type": "integer"},
                            "undercoverage": {"type": "integer"},
                            "francophone_relevance": {"type": "integer"},
                            "africa_relevance": {"type": "integer"},
                            "source_confidence": {"type": "integer"},
                            "urgency": {"type": "integer"},
                            "saturation_penalty": {"type": "integer"},
                        },
                        "required": [
                            "freshness",
                            "surprise",
                            "human_impact",
                            "importance",
                            "visual_potential",
                            "numerical_strength",
                            "undercoverage",
                            "francophone_relevance",
                            "africa_relevance",
                            "source_confidence",
                            "urgency",
                            "saturation_penalty",
                        ],
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
                            },
                            "required": ["text", "score", "rationale"],
                        },
                    },
                },
                "required": [
                    "title",
                    "summary",
                    "category",
                    "country_iso3",
                    "country_name",
                    "region",
                    "breaking",
                    "event_at",
                    "confidence_score",
                    "sources",
                    "factors",
                    "hooks",
                ],
            },
        }
    },
    "required": ["candidates"],
}


def canonical_url(url: str) -> str:
    raw = url.strip()
    try:
        parsed = urlsplit(raw)
        host = (parsed.hostname or "").lower().removeprefix("www.")
        port_value = parsed.port
    except ValueError:
        return raw

    if not host:
        return raw

    port = f":{port_value}" if port_value else ""
    path = parsed.path.rstrip("/") or "/"
    return urlunsplit((parsed.scheme.lower() or "https", host + port, path, "", ""))


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

    text = "".join(chunks).strip()
    if not text:
        raise RadarProviderError("OpenAI response did not contain structured output text.")
    return text


def _extract_retrieved_urls(payload: dict) -> list[str]:
    urls: set[str] = set()

    for item in payload.get("output", []):
        if not isinstance(item, dict):
            continue

        if item.get("type") == "web_search_call":
            action = item.get("action")
            if isinstance(action, dict):
                for source in action.get("sources", []) or []:
                    if isinstance(source, dict) and isinstance(source.get("url"), str):
                        urls.add(canonical_url(source["url"]))

        if item.get("type") == "message":
            for part in item.get("content", []) or []:
                if not isinstance(part, dict):
                    continue
                for annotation in part.get("annotations", []) or []:
                    if not isinstance(annotation, dict):
                        continue
                    citation = annotation.get("url_citation")
                    if isinstance(citation, dict) and isinstance(citation.get("url"), str):
                        urls.add(canonical_url(citation["url"]))
                    elif annotation.get("type") == "url_citation" and isinstance(
                        annotation.get("url"), str
                    ):
                        urls.add(canonical_url(annotation["url"]))

    return sorted(urls)


def _build_prompt(request: RadarScanRequest) -> str:
    country = request.country_iso3.upper() if request.country_iso3 else None
    preferred = priority_sources(country)
    source_lines = "\n".join(
        f"- {entry.name}: {entry.domain} ({entry.scope}, priorité {entry.priority})"
        for entry in preferred
    )

    scope_line = (
        f"Concentre le scan sur le pays ISO3 {country}, sans ignorer un événement "
        "international qui affecte directement ce pays."
        if country
        else "Scanne le monde entier, avec une attention renforcée à l'Afrique et au monde francophone."
    )

    return f"""
Tu es le moteur RADAR de World-Vision, média d'actualité francophone.
Recherche sur le web LIVE les meilleures idées de vidéos d'actualité publiées ou
significativement mises à jour au cours des {request.hours} dernières heures.

{scope_line}

Objectif éditorial:
- détecter des informations importantes AVANT qu'elles soient saturées;
- privilégier les sources primaires, agences nationales, institutions locales et agences de presse;
- inclure les grandes breaking news internationales quand elles sont réellement majeures;
- rechercher aussi des sujets africains ou locaux très forts mais sous-couverts;
- favoriser les sujets avec un chiffre, une image, une vidéo ou un contraste immédiatement compréhensible;
- ne jamais fabriquer un fait, une date, un chiffre, une URL ou une source;
- ne jamais confondre date de publication et date de l'événement;
- produire les textes et hooks en français.

Sources prioritaires déjà connues (liste non exhaustive):
{source_lines}

Retourne au maximum {request.max_candidates} candidats, classés du plus intéressant au moins intéressant.
Pour chaque source, donne l'URL EXACTE réellement consultée pendant la recherche.
Pour les facteurs de score, donne des valeurs de 0 à 100.
Le facteur saturation_penalty est élevé si le sujet est déjà omniprésent dans les flux.
Propose jusqu'à 3 hooks par sujet; ils doivent être courts, factuels, parlants et non trompeurs.
""".strip()


class OpenAIRadarClient:
    def __init__(self, settings: Settings | None = None) -> None:
        self.settings = settings or get_settings()

    async def scan(self, request: RadarScanRequest) -> RadarDiscovery:
        if not self.settings.openai_api_key:
            raise RadarConfigurationError(
                "WHV_MEDIA_OPENAI_API_KEY is not configured; live RADAR is disabled."
            )

        scan_id = f"radar-{uuid4().hex[:12]}"
        prompt = _build_prompt(request)
        body = {
            "model": self.settings.radar_model,
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
                    "name": "world_vision_radar",
                    "description": "World-Vision ranked breaking-news candidates.",
                    "strict": True,
                    "schema": RADAR_SCHEMA,
                }
            },
            "input": prompt,
        }

        headers = {
            "authorization": f"Bearer {self.settings.openai_api_key}",
            "content-type": "application/json",
        }

        try:
            async with httpx.AsyncClient(timeout=self.settings.radar_timeout_seconds) as client:
                response = await client.post(
                    "https://api.openai.com/v1/responses",
                    headers=headers,
                    json=body,
                )
                response.raise_for_status()
        except httpx.HTTPError as exc:
            raise RadarProviderError(f"OpenAI RADAR request failed: {exc}") from exc

        payload = response.json()
        if payload.get("status") not in {None, "completed"}:
            raise RadarProviderError(
                f"OpenAI RADAR response status is {payload.get('status')!r}."
            )

        retrieved_urls = _extract_retrieved_urls(payload)
        retrieved_set = set(retrieved_urls)

        try:
            raw = json.loads(_extract_output_text(payload))
            raw_candidates = raw.get("candidates", [])
        except (json.JSONDecodeError, TypeError) as exc:
            raise RadarProviderError("OpenAI RADAR returned invalid JSON.") from exc

        accepted: list[RadarCandidate] = []
        rejected = 0

        for raw_candidate in raw_candidates[: request.max_candidates]:
            if not isinstance(raw_candidate, dict):
                continue

            validated_sources: list[dict] = []
            for source in raw_candidate.get("sources", []) or []:
                if not isinstance(source, dict) or not isinstance(source.get("url"), str):
                    continue

                normalized = canonical_url(source["url"])
                if normalized not in retrieved_set:
                    continue

                registered = resolve_source(source["url"])
                if registered:
                    source = {
                        **source,
                        "name": registered.name,
                        "source_type": registered.source_type,
                        "scope": registered.scope,
                        "country_iso3": registered.country_iso3 or source.get("country_iso3"),
                    }
                validated_sources.append(source)

            if not validated_sources:
                rejected += 1
                continue

            raw_candidate["sources"] = validated_sources
            try:
                candidate = RadarCandidate.model_validate(raw_candidate)
            except ValidationError:
                continue

            accepted.append(candidate)

        return RadarDiscovery(
            scan_id=scan_id,
            query=prompt,
            model=self.settings.radar_model,
            retrieved_urls=retrieved_urls,
            raw_candidate_count=len(raw_candidates),
            candidates=accepted,
            rejected_without_retrieved_source=rejected,
        )


RADAR_CLIENT = OpenAIRadarClient()
