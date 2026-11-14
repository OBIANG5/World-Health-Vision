from __future__ import annotations

import asyncio
import base64
import json
import re
import unicodedata
import wave
from datetime import datetime, timezone
from difflib import SequenceMatcher
from pathlib import Path
from uuid import uuid4

from websockets.asyncio.client import connect

from media_service.models import GenerateVoiceoverRequest, MediaStory, VoiceoverRef
from media_service.settings import Settings, get_settings


class VoiceoverConfigurationError(RuntimeError):
    pass


class VoiceoverProviderError(RuntimeError):
    pass


class VoiceoverQualityError(RuntimeError):
    pass


def _normalize_for_match(value: str) -> str:
    normalized = unicodedata.normalize("NFKD", value)
    normalized = normalized.encode("ascii", "ignore").decode("ascii").lower()
    normalized = re.sub(r"[^a-z0-9]+", " ", normalized)
    return " ".join(normalized.split())


def transcript_match_score(expected: str, actual: str) -> int:
    expected_normalized = _normalize_for_match(expected)
    actual_normalized = _normalize_for_match(actual)
    if not expected_normalized or not actual_normalized:
        return 0
    return round(
        SequenceMatcher(
            None,
            expected_normalized,
            actual_normalized,
        ).ratio()
        * 100
    )


def _safe_filename(story_id: str, draft_version: int) -> str:
    safe_story_id = re.sub(r"[^a-zA-Z0-9_-]+", "-", story_id).strip("-")
    return (
        f"{safe_story_id or 'story'}-draft-v{draft_version}-"
        f"{uuid4().hex[:10]}.wav"
    )


def _write_pcm_wav(
    pcm: bytes,
    path: Path,
    *,
    sample_rate_hz: int = 24000,
) -> float:
    if not pcm:
        raise VoiceoverProviderError("Realtime returned no audio bytes.")

    path.parent.mkdir(parents=True, exist_ok=True)
    with wave.open(str(path), "wb") as output:
        output.setnchannels(1)
        output.setsampwidth(2)
        output.setframerate(sample_rate_hz)
        output.writeframes(pcm)

    return len(pcm) / float(sample_rate_hz * 2)


def _narration_instructions(script: str) -> str:
    return f"""
Tu es la voix off journalistique de World-Vision.
Lis EXACTEMENT le texte entre <script> et </script>, sans ajout, sans retrait,
sans reformulation et sans commentaire avant ou après.
Langue: français.
Ton: journaliste d'actualité sobre, humain, clair, énergique mais jamais dramatique.
Débit: soutenu et naturel pour une vidéo verticale courte.
Prononce distinctement les nombres, noms propres et lieux.
Ne dis jamais les balises.

<script>
{script}
</script>
""".strip()


class OpenAIRealtimeVoiceoverClient:
    def __init__(self, settings: Settings | None = None) -> None:
        self.settings = settings or get_settings()

    async def generate(
        self,
        story: MediaStory,
        request: GenerateVoiceoverRequest,
    ) -> VoiceoverRef:
        if not self.settings.openai_api_key:
            raise VoiceoverConfigurationError(
                "WHV_MEDIA_OPENAI_API_KEY is not configured; AUDIO is disabled."
            )
        if story.video_draft is None:
            raise VoiceoverQualityError(
                "Prepare the final VideoDraft before generating AUDIO."
            )

        script = story.video_draft.voiceover_script.strip()
        if not script:
            raise VoiceoverQualityError("Voice-over script is empty.")

        voice = (request.voice or self.settings.audio_voice).strip()
        if not voice:
            raise VoiceoverQualityError("Voice name is empty.")

        url = (
            "wss://api.openai.com/v1/realtime"
            f"?model={self.settings.audio_model}"
        )
        headers = {
            "Authorization": f"Bearer {self.settings.openai_api_key}",
        }

        pcm = bytearray()
        transcript_chunks: list[str] = []
        final_transcript: str | None = None
        completed = False

        session_update = {
            "type": "session.update",
            "session": {
                "type": "realtime",
                "model": self.settings.audio_model,
                "output_modalities": ["audio"],
                "audio": {
                    "output": {
                        "format": {
                            "type": "audio/pcm",
                            "rate": 24000,
                        },
                        "voice": voice,
                    }
                },
                "instructions": (
                    "You are a precise French news narrator. "
                    "Never add facts or wording that was not supplied."
                ),
            },
        }
        response_create = {
            "type": "response.create",
            "response": {
                "conversation": "none",
                "input": [],
                "output_modalities": ["audio"],
                "instructions": _narration_instructions(script),
            },
        }

        try:
            async with asyncio.timeout(self.settings.audio_timeout_seconds):
                async with connect(
                    url,
                    additional_headers=headers,
                    max_size=None,
                    ping_interval=20,
                    ping_timeout=20,
                    close_timeout=5,
                ) as websocket:
                    await websocket.send(json.dumps(session_update))
                    await websocket.send(json.dumps(response_create))

                    while True:
                        raw_message = await websocket.recv()
                        if not isinstance(raw_message, str):
                            continue
                        event = json.loads(raw_message)
                        event_type = event.get("type")

                        if event_type == "error":
                            error = event.get("error")
                            message = (
                                error.get("message")
                                if isinstance(error, dict)
                                else str(error)
                            )
                            raise VoiceoverProviderError(
                                f"Realtime AUDIO error: {message}"
                            )

                        if event_type == "response.output_audio.delta":
                            delta = event.get("delta")
                            if isinstance(delta, str) and delta:
                                pcm.extend(base64.b64decode(delta))

                        if event_type == "response.output_audio_transcript.delta":
                            delta = event.get("delta")
                            if isinstance(delta, str):
                                transcript_chunks.append(delta)

                        if event_type == "response.output_audio_transcript.done":
                            transcript = event.get("transcript")
                            if isinstance(transcript, str):
                                final_transcript = transcript

                        if event_type == "response.done":
                            response = event.get("response")
                            status = (
                                response.get("status")
                                if isinstance(response, dict)
                                else None
                            )
                            if status != "completed":
                                raise VoiceoverProviderError(
                                    f"Realtime AUDIO response ended with status {status!r}."
                                )
                            completed = True
                            break
        except asyncio.TimeoutError as exc:
            raise VoiceoverProviderError(
                "Realtime AUDIO generation timed out."
            ) from exc
        except VoiceoverProviderError:
            raise
        except Exception as exc:
            raise VoiceoverProviderError(
                f"Realtime AUDIO connection failed: {exc}"
            ) from exc

        if not completed:
            raise VoiceoverProviderError(
                "Realtime AUDIO response did not complete."
            )

        transcript = (
            final_transcript
            or "".join(transcript_chunks).strip()
        )
        if not transcript:
            raise VoiceoverQualityError(
                "Realtime AUDIO did not return a transcript for QA."
            )

        match_score = transcript_match_score(script, transcript)

        filename = _safe_filename(
            story.id,
            story.video_draft.version,
        )
        output_path = Path(self.settings.audio_output_dir) / filename
        duration_sec = _write_pcm_wav(bytes(pcm), output_path)

        duration_fit = (
            duration_sec
            <= story.video_draft.duration_sec + 1.5
        )
        qa_passed = match_score >= 82 and duration_fit

        return VoiceoverRef(
            id=f"voice-{uuid4().hex[:12]}",
            model=self.settings.audio_model,
            voice=voice,
            duration_sec=round(duration_sec, 3),
            generated_at=datetime.now(timezone.utc),
            renderer_url=(
                f"{self.settings.audio_renderer_url_prefix.rstrip('/')}/"
                f"{filename}"
            ),
            transcript=transcript,
            transcript_match_score=match_score,
            duration_fit=duration_fit,
            qa_passed=qa_passed,
        )


VOICEOVER_CLIENT = OpenAIRealtimeVoiceoverClient()
