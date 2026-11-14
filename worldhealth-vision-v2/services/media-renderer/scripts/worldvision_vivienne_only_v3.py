#!/usr/bin/env python3
"""World-Vision Vivienne V3 — SAME REAL VOICE, four naturally continuous takes.

The previous V2 'silence surgery' removed 2.008s from a ~15.4s Vivienne
performance and the user heard unnatural edit seams. V3 does NOT trim,
rebuild, splice, time-stretch, add pauses or stitch TTS utterances.
One complete input text -> one continuous TTS response -> one raw MP3.

Use actual editorial language as the driver for intonation, not trivial 5%
speed-only adjustments. The voice is LOCKED in every audition. No alternative
speaker or silent fallback is permitted.

No voice is authorized for commercial publication by this program.
"""
from __future__ import annotations

import argparse
import asyncio
import hashlib
import json
import re
import subprocess
from pathlib import Path

VOICE = "fr-FR-VivienneMultilingualNeural"
EXPECTED_IDS = ("a_naturelle", "b_retenue", "c_impact", "d_pedagogique")


def sha256(path):
    return hashlib.sha256(Path(path).read_bytes()).hexdigest()


def cmd(argv):
    result = subprocess.run(argv, text=True, capture_output=True)
    if result.returncode:
        raise RuntimeError("Process failed: " + str(argv[:4]) + ": " + result.stderr[-1200:])
    return result


def duration(path):
    return float(cmd(["ffprobe", "-v", "error", "-show_entries", "format=duration",
                      "-of", "default=noprint_wrappers=1:nokey=1", str(path)]).stdout)


def validate(brief):
    if brief.get("voice") != VOICE:
        raise ValueError("Identity lock: only Vivienne is allowed.")
    if brief.get("status") != "AUDITION_ONLY" or brief.get("publication_authorized") is not False:
        raise ValueError("Commercial/export publishing is never authorized.")
    variants = brief.get("variants")
    if not isinstance(variants, list) or tuple(v.get("id") for v in variants) != EXPECTED_IDS:
        raise ValueError("Four named same-Vivienne variants required.")
    if len(set(x["script"] for x in variants)) != 4:
        raise ValueError("Each version must contain a meaningful editorial rewrite.")
    for variant in variants:
        script = variant.get("script", "")
        if not isinstance(script, str) or not 150 <= len(script) <= 600:
            raise ValueError("Invalid continuous script length.")
        if "\n" in script:
            raise ValueError("No per-phrase lines to concatenate.")
        if len(re.findall(r"[.!?…]", script)) < 4:
            raise ValueError("Natural full-utterance punctuation expected.")
        if not re.fullmatch(r"[+-]\d{1,2}%", variant.get("rate", "")):
            raise ValueError("Invalid neural rate.")
        rate = int(variant["rate"][:-1])
        if not -10 <= rate <= 10:
            raise ValueError("Do not force robotic rate extremes.")
        if variant.get("pitch") != "+0Hz":
            raise ValueError("Changing pitch is not permitted in Vivienne identity trials.")
        for token in ("La Nouvelle-Orléans", "Trente-deux"):
            if token not in script and not (token=="La Nouvelle-Orléans" and "à La Nouvelle-Orléans" in script):
                raise ValueError("Essential fact missing in "+variant["id"]+": "+token)
        if "Voir le monde, le comprendre" in script:
            raise ValueError("Never narrate the silent outro.")
    return variants


async def synthesize(variant, output):
    import edge_tts
    output.mkdir(parents=True, exist_ok=True)
    raw = output / (variant["id"] + "-raw-service.mp3")
    words = []
    for attempt in range(3):
        try:
            words.clear()
            worker = edge_tts.Communicate(
                variant["script"], VOICE, rate=variant["rate"],
                pitch=variant["pitch"], volume="+0%",
                boundary="WordBoundary",
            )
            with raw.open("wb") as f:
                async for event in worker.stream():
                    if event["type"] == "audio":
                        f.write(event["data"])
                    elif event["type"] == "WordBoundary":
                        words.append({
                            "text": event.get("text", ""),
                            "start_s": round(event.get("offset", 0) / 1e7, 3),
                            "duration_s": round(event.get("duration", 0) / 1e7, 3),
                        })
            if raw.stat().st_size < 55000 or len(words) < 40:
                raise RuntimeError("Incomplete service response.")
            return raw, words
        except Exception:
            raw.unlink(missing_ok=True)
            if attempt == 2:
                raise
            await asyncio.sleep((attempt + 1) * 1.3)
    raise RuntimeError("Speech synthesis unsuccessful")


def analyze_pauses(path):
    proc = cmd(["ffmpeg", "-hide_banner", "-nostdin", "-v", "info",
                "-i", str(path), "-af", "silencedetect=noise=-37dB:d=0.20",
                "-f", "null", "-"])
    starts = [float(v) for v in re.findall(r"silence_start:\s*([\d.]+)", proc.stderr)]
    ends = [float(v) for v in re.findall(r"silence_end:\s*([\d.]+)", proc.stderr)]
    # Exclude start/end padding: only question-worthy interior gaps are listed.
    audio_end = duration(path)
    silences = [{"start_s": round(a, 3), "end_s": round(ends[i], 3),
                 "duration_s": round(ends[i]-a, 3)}
                for i, a in enumerate(starts) if i < len(ends)
                and a > .25 and ends[i] < audio_end - .22]
    return {"pauses_over_200ms": silences,
            "pauses_over_450ms": [x for x in silences if x["duration_s"] > .45],
            "automatic_pause_cuts": 0,
            "silences_preserved_without_editing": True}


def finish_audio(raw, output_file):
    # Intentional: ZERO silence edits, ZERO arbitrary trim, ZERO tempo/pitch
    # manipulation. Convert raw stream to podcast-comparable level only.
    # A raw untouched master is always available alongside the filtered copy.
    cmd(["ffmpeg", "-y", "-v", "error", "-i", str(raw),
         "-af", "highpass=f=65,loudnorm=I=-16:TP=-2:LRA=9",
         "-ar", "48000", "-ac", "1", "-c:a", "libmp3lame", "-b:a",
         "192k", str(output_file)])


async def main_async(args):
    brief = json.loads(args.brief.read_text(encoding="utf8"))
    variants = validate(brief)
    variant = next(v for v in variants if v["id"] == args.variant)
    out = args.out
    out.mkdir(parents=True, exist_ok=True)
    raw, words = await synthesize(variant, out)
    mastered = out / (variant["id"] + "-review-only.mp3")
    finish_audio(raw, mastered)
    gaps = analyze_pauses(mastered)
    report = {
        "id": variant["id"],
        "display_label": variant["label"],
        "voice": VOICE,
        "same_voice_as_previous_user_approval": True,
        "new_voice_substituted": False,
        "one_uninterrupted_tts_request": True,
        "single_continuous_audio_output": True,
        "audio_spliced": False,
        "filler_pauses_inserted": False,
        "silences_cut_automatically": False,
        "audio_timestretched": False,
        "punctuation_editorial_rewrite": True,
        "rate": variant["rate"],
        "pitch": variant["pitch"],
        "editorial_intent": variant["interpretation"],
        "source_brief_sha256": sha256(args.brief),
        "source_words": len(words),
        "raw_mp3_sha256": sha256(raw),
        "review_mp3_sha256": sha256(mastered),
        "raw_duration_sec": round(duration(raw), 3),
        "review_duration_sec": round(duration(mastered), 3),
        "gaps": gaps,
        "rights_verified": False,
        "publishing_authorized": False,
        "human_listening_required": True,
        "automatic_emotion_verification": False,
        "note": "Naturalness cannot be certified by waveform statistics. Listening required.",
    }
    (out / (variant["id"] + "-report.json")).write_text(
        json.dumps(report, ensure_ascii=False, indent=2)+"\n", encoding="utf8")
    print(json.dumps({
        "variant": variant["id"], "voice": VOICE,
        "seconds": report["review_duration_sec"],
        "pauses_over_450ms": len(gaps["pauses_over_450ms"]),
        "silence_cuts": 0,
        "approved": False,
    }, ensure_ascii=False), flush=True)


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--variant", required=True, choices=EXPECTED_IDS)
    parser.add_argument("--brief", type=Path, required=True)
    parser.add_argument("--out", type=Path, required=True)
    args = parser.parse_args()
    asyncio.run(main_async(args))


if __name__ == "__main__":
    main()
