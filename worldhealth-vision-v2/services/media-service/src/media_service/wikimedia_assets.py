from __future__ import annotations

import hashlib
import html
import re
from datetime import datetime, timezone
from urllib.parse import quote

import httpx

from media_service.models import MediaAsset
from media_service.settings import Settings, get_settings


COMMONS_API = "https://commons.wikimedia.org/w/api.php"


class AssetProviderError(RuntimeError):
    pass


def _metadata_value(metadata: dict, key: str) -> str | None:
    raw = metadata.get(key)
    if not isinstance(raw, dict):
        return None
    value = raw.get("value")
    if not isinstance(value, str):
        return None
    cleaned = html.unescape(re.sub(r"<[^>]+>", " ", value))
    cleaned = " ".join(cleaned.split()).strip()
    return cleaned or None


def _rights_status(
    license_name: str | None,
    license_url: str | None,
) -> tuple[str, str]:
    normalized = (license_name or "").strip().lower()
    url = (license_url or "").strip().lower()

    if "public domain" in normalized or "publicdomain" in url:
        return (
            "approved",
            "Domaine public détecté dans les métadonnées Commons.",
        )

    if "cc0" in normalized or "/publicdomain/zero/" in url:
        return (
            "approved",
            "CC0 détecté ; attribution conservée malgré l'absence d'obligation.",
        )

    if (
        ("cc by" in normalized and "by-sa" not in normalized)
        or ("/by/" in url and "/by-sa/" not in url)
    ):
        return (
            "approved",
            "Licence Creative Commons BY détectée ; attribution obligatoire conservée.",
        )

    if "by-sa" in normalized or "/by-sa/" in url:
        return (
            "review_required",
            "Licence CC BY-SA : vérifier les obligations ShareAlike avant publication.",
        )

    if "gfdl" in normalized or "gnu free documentation" in normalized:
        return (
            "review_required",
            "Licence GFDL : revue juridique/éditoriale requise avant réutilisation vidéo.",
        )

    return (
        "review_required",
        "Licence non reconnue comme automatiquement réutilisable ; revue requise.",
    )


def _asset_id(media_url: str) -> str:
    return "asset-" + hashlib.sha256(media_url.encode("utf-8")).hexdigest()[:16]


def parse_commons_search_response(
    payload: dict,
    *,
    query: str,
) -> list[MediaAsset]:
    pages = payload.get("query", {}).get("pages", [])
    if isinstance(pages, dict):
        pages = list(pages.values())
    if not isinstance(pages, list):
        return []

    assets: list[MediaAsset] = []
    for page in pages:
        if not isinstance(page, dict):
            continue
        title = page.get("title")
        imageinfo = page.get("imageinfo")
        if not isinstance(title, str) or not isinstance(imageinfo, list) or not imageinfo:
            continue

        info = imageinfo[0]
        if not isinstance(info, dict):
            continue
        media_url = info.get("url")
        if not isinstance(media_url, str) or not media_url.startswith("https://"):
            continue

        mime = info.get("mime")
        if isinstance(mime, str) and not mime.startswith("image/"):
            continue

        metadata = info.get("extmetadata")
        if not isinstance(metadata, dict):
            metadata = {}

        license_name = _metadata_value(metadata, "LicenseShortName")
        license_url = _metadata_value(metadata, "LicenseUrl")
        author = _metadata_value(metadata, "Artist") or _metadata_value(metadata, "Credit")
        rights_status, rights_note = _rights_status(license_name, license_url)

        page_slug = quote(title.replace(" ", "_"), safe=":_()-")
        source_page_url = f"https://commons.wikimedia.org/wiki/{page_slug}"
        thumbnail = info.get("thumburl")
        thumbnail_url = (
            thumbnail
            if isinstance(thumbnail, str) and thumbnail.startswith("https://")
            else None
        )

        attribution_parts = [
            part
            for part in [
                author,
                license_name,
                "Wikimedia Commons",
            ]
            if part
        ]

        assets.append(
            MediaAsset(
                id=_asset_id(media_url),
                provider="wikimedia_commons",
                title=title.removeprefix("File:"),
                kind="image",
                source_page_url=source_page_url,
                media_url=media_url,
                thumbnail_url=thumbnail_url,
                mime_type=mime if isinstance(mime, str) else None,
                author=author,
                license_name=license_name,
                license_url=license_url,
                attribution=" · ".join(attribution_parts),
                rights_status=rights_status,
                rights_note=rights_note,
                query=query,
                discovered_at=datetime.now(timezone.utc),
            )
        )

    return assets


class WikimediaCommonsClient:
    def __init__(self, settings: Settings | None = None) -> None:
        self.settings = settings or get_settings()

    async def search_images(
        self,
        query: str,
        *,
        limit: int = 4,
    ) -> list[MediaAsset]:
        cleaned_query = " ".join(query.split()).strip()
        if not cleaned_query:
            return []

        params = {
            "action": "query",
            "format": "json",
            "formatversion": "2",
            "generator": "search",
            "gsrsearch": cleaned_query,
            "gsrnamespace": "6",
            "gsrlimit": str(max(1, min(limit, 8))),
            "prop": "imageinfo",
            "iiprop": "url|mime|mediatype|extmetadata",
            "iiurlwidth": "1080",
            "iiextmetadatalanguage": "fr",
            "iiextmetadatafilter": (
                "LicenseShortName|LicenseUrl|Artist|Credit|ImageDescription|"
                "UsageTerms|Copyrighted"
            ),
        }
        headers = {
            "User-Agent": (
                "World-Vision-Media-Studio/0.1 "
                "(newsroom asset provenance connector)"
            )
        }

        try:
            async with httpx.AsyncClient(timeout=20.0, follow_redirects=True) as client:
                response = await client.get(
                    COMMONS_API,
                    params=params,
                    headers=headers,
                )
                response.raise_for_status()
        except httpx.HTTPError as exc:
            raise AssetProviderError(
                f"Wikimedia Commons asset search failed: {exc}"
            ) from exc

        return parse_commons_search_response(
            response.json(),
            query=cleaned_query,
        )


WIKIMEDIA_CLIENT = WikimediaCommonsClient()
