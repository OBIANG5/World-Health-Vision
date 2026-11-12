from __future__ import annotations

import hashlib
import json
from datetime import datetime, timezone

from media_service.models import (
    MediaStory,
    PreparePublicationRequest,
    PublicationChannel,
    PublicationPackage,
)


class PublicationWorkflowError(RuntimeError):
    pass


def _dedupe_channels(
    channels: list[PublicationChannel],
) -> list[PublicationChannel]:
    output: list[PublicationChannel] = []
    for channel in channels:
        if channel not in output:
            output.append(channel)
    return output


def _source_lines(story: MediaStory) -> list[str]:
    return [
        f"{source.name} — {source.url}"
        for source in story.sources
    ]


def _tiktok_caption(story: MediaStory) -> str:
    if story.creative_package is None:
        raise PublicationWorkflowError(
            "CREATIVE package is required for publication."
        )

    hashtags = " ".join(story.creative_package.hashtags)
    pieces = [
        story.creative_package.caption.strip(),
        hashtags.strip(),
    ]
    return "\n\n".join(piece for piece in pieces if piece)


def _whatsapp_text(story: MediaStory) -> str:
    if story.creative_package is None:
        raise PublicationWorkflowError(
            "CREATIVE package is required for publication."
        )

    sources = "\n".join(
        f"• {line}"
        for line in _source_lines(story)
    )
    disclosure = (
        f"\n\n_{story.voiceover.ai_generated_disclosure}_"
        if story.voiceover is not None
        else ""
    )
    hashtags = " ".join(story.creative_package.hashtags)

    return (
        f"*{story.title}*\n\n"
        f"{story.creative_package.caption}\n\n"
        f"*Sources :*\n{sources}"
        f"{disclosure}"
        + (f"\n\n{hashtags}" if hashtags else "")
    ).strip()


def build_publication_package(
    story: MediaStory,
    request: PreparePublicationRequest,
) -> PublicationPackage:
    if story.status != "publish_ready":
        raise PublicationWorkflowError(
            "Publication package requires status 'publish_ready'."
        )
    if story.qa_report is None or not story.qa_report.all_passed:
        raise PublicationWorkflowError(
            "Publication package requires a successful final QA report."
        )
    if story.render_job is None or story.render_job.status != "completed":
        raise PublicationWorkflowError(
            "Publication package requires a completed final render."
        )
    if not story.render_job.output_url:
        raise PublicationWorkflowError(
            "Publication package requires a render output URL."
        )
    if story.creative_package is None:
        raise PublicationWorkflowError(
            "Publication package requires CREATIVE output."
        )
    if not story.sources:
        raise PublicationWorkflowError(
            "Publication package requires at least one traceable source."
        )

    channels = _dedupe_channels(request.target_channels)
    if not channels:
        raise PublicationWorkflowError(
            "At least one target publication channel is required."
        )

    previous_version = (
        story.publication_package.version
        if story.publication_package is not None
        else 0
    )
    version = previous_version + 1
    source_names = [source.name for source in story.sources]
    source_urls = [source.url for source in story.sources]
    tiktok_caption = _tiktok_caption(story)
    whatsapp_text = _whatsapp_text(story)

    manifest_payload = {
        "story_id": story.id,
        "publication_version": version,
        "target_channels": channels,
        "video_url": story.render_job.output_url,
        "title": story.title,
        "caption": story.creative_package.caption,
        "hashtags": story.creative_package.hashtags,
        "tiktok_caption": tiktok_caption,
        "whatsapp_text": whatsapp_text,
        "source_names": source_names,
        "source_urls": source_urls,
        "ai_disclosure": (
            story.voiceover.ai_generated_disclosure
            if story.voiceover is not None
            else None
        ),
        "creative_version": story.creative_package.version,
        "qa_version": story.qa_report.version,
    }
    manifest_sha256 = hashlib.sha256(
        json.dumps(
            manifest_payload,
            ensure_ascii=False,
            sort_keys=True,
            separators=(",", ":"),
        ).encode("utf-8")
    ).hexdigest()

    return PublicationPackage(
        version=version,
        created_at=datetime.now(timezone.utc),
        story_id=story.id,
        target_channels=channels,
        video_url=story.render_job.output_url,
        title=story.title,
        caption=story.creative_package.caption,
        hashtags=story.creative_package.hashtags,
        tiktok_caption=tiktok_caption,
        whatsapp_text=whatsapp_text,
        source_names=source_names,
        source_urls=source_urls,
        ai_disclosure=manifest_payload["ai_disclosure"],
        creative_version=story.creative_package.version,
        qa_version=story.qa_report.version,
        manifest_sha256=manifest_sha256,
    )
