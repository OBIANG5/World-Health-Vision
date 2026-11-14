#!/usr/bin/env python3
"""World-Vision voice laboratory: same Vivienne timbre, more deliberate narration.

Experimental auditions only. Neither edge-tts access nor a successful render
establishes commercial rights. Do not use this as an automatic publishing step.
Requires ffmpeg/ffprobe; edge-tts is imported only for 'audition'.
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
VOICE_VARIANTS = {
    # Variations of the SAME voice; never infer that rate/pitch = human emotion.
    "conversational": {"base_rate": 0, "pitch_hz": 0},
    "focused": {"base_rate": 5, "pitch_hz": 0},
}
MAX_SEGMENTS = 12


def run(args, *, check=True):
    return subprocess.run(args, text=True, capture_output=True, check=check)


def probe_duration(path):
    p = run(["ffprobe", "-v", "error", "-show_entries",
             "format=duration", "-of", "default=noprint_wrappers=1:nokey=1",
             str(path)])
    return float(p.stdout.strip())


def sha256(path):
    return hashlib.sha256(Path(path).read_bytes()).hexdigest()


def validate_brief(data):
    if not isinstance(data, dict) or data.get("status") != "AUDITION_ONLY":
        raise ValueError("Brief must be explicitly AUDITION_ONLY.")
    if data.get("publication_authorized") is not False:
        raise ValueError("Voice auditions must never authorize publication.")
    if data.get("voice") != VOICE:
        raise ValueError("Voice must remain the user's preferred Vivienne.")
    segments = data.get("segments")
    if not isinstance(segments, list) or not 2 <= len(segments) <= MAX_SEGMENTS:
        raise ValueError("Expected 2 to 12 editorial beats.")
    for index, item in enumerate(segments, 1):
        if not isinstance(item, dict):
            raise ValueError(f"Beat {index} is not a mapping.")
        text = item.get("text", "")
        if not isinstance(text, str) or not 15 <= len(text) <= 430:
            raise ValueError(f"Beat {index}: text length outside [15,430].")
        if not text.strip() or "\n" in text:
            raise ValueError(f"Beat {index}: use one editorial phrase per beat.")
        delta = item.get("rate_delta_percent", 0)
        pause = item.get("pause_after_ms", 100)
        if type(delta) is not int or not -8 <= delta <= 8:
            raise ValueError(f"Beat {index}: speed variation must be -8..+8%.")
        if type(pause) is not int or not 60 <= pause <= 220:
            raise ValueError(f"Beat {index}: transition pause must be 60..220ms.")
        if not isinstance(item.get("editorial_intent", ""), str):
            raise ValueError(f"Beat {index}: editorial intent required as text.")
    joined = " ".join(x["text"] for x in segments)
    if "Voir le monde, le comprendre" in joined:
        raise ValueError("The final visual brand slogan must never be spoken.")
    return segments


def measure_audio(path, narration_end=None):
    """Objective diagnostics only; cannot grade naturalness or engagement."""
    duration = probe_duration(path)
    end = duration if narration_end is None else min(float(narration_end), duration)
    if end <= 0:
        raise ValueError("Invalid narration end.")
    common = ["ffmpeg", "-hide_banner", "-nostdin", "-v", "info",
              "-i", str(path), "-t", f"{end:.3f}", "-vn"]
    silence = run(common + ["-af", "silencedetect=noise=-38dB:d=0.22",
                            "-f", "null", "-"])
    begins = [float(x) for x in re.findall(r"silence_start:\s*([\d.]+)", silence.stderr)]
    ends = [float(x) for x in re.findall(r"silence_end:\s*([\d.]+)", silence.stderr)]
    pauses = []
    for i, start in enumerate(begins):
        stop = ends[i] if i < len(ends) else end
        if start >= 0.30 and stop <= end - 0.15:
            pauses.append({"start": round(start, 3), "end": round(stop, 3),
                           "seconds": round(stop - start, 3)})
    loud = run(common + ["-af", "loudnorm=I=-16:TP=-2:LRA=9:print_format=json",
                          "-f", "null", "-"])
    # The last JSON block printed by the loudnorm filter is the source measurement.
    blocks = re.findall(r"\{\s*\"input_i\".*?\}", loud.stderr, flags=re.S)
    stats = json.loads(blocks[-1]) if blocks else {}
    lra = float(stats["input_lra"]) if "input_lra" in stats else None
    return {
        "status": "OBJECTIVE_DIAGNOSTICS_NOT_HUMAN_REVIEW",
        "source": str(path),
        "seconds_total": round(duration, 3),
        "seconds_narration_evaluated": round(end, 3),
        "integrated_lufs": float(stats["input_i"]) if "input_i" in stats else None,
        "true_peak_dbtp": float(stats["input_tp"]) if "input_tp" in stats else None,
        "loudness_range_lu": lra,
        "pauses_over_220ms": pauses,
        "pause_count": len(pauses),
        "long_pauses_over_650ms": sum(p["seconds"] > .65 for p in pauses),
        "expression_review_flag": bool(lra is not None and lra < 3),
        "expression_flag_explanation":
            "Low loudness variation is a listening cue, NOT proof of robotic speech.",
        "human_listening_required": True,
        "publishing_authorized": False,
    }


async def synthesize_beat(index, beat, variant, workdir, semaphore):
    import edge_tts  # optional: only auditions require remote TTS
    settings = VOICE_VARIANTS[variant]
    rate_n = settings["base_rate"] + beat.get("rate_delta_percent", 0)
    rate = f"{rate_n:+d}%"
    pitch = f"{settings['pitch_hz']:+d}Hz"
    raw = workdir / f"beat-{index:02d}.mp3"
    boundaries = []
    async with semaphore:
        for attempt in range(3):
            try:
                speaker = edge_tts.Communicate(
                    beat["text"], VOICE, rate=rate, pitch=pitch,
                    boundary="WordBoundary")
                with raw.open("wb") as destination:
                    async for event in speaker.stream():
                        if event["type"] == "audio":
                            destination.write(event["data"])
                        elif event["type"] == "WordBoundary":
                            boundaries.append({
                                "word": event.get("text", ""),
                                "start": event["offset"] / 10_000_000,
                                "duration": event["duration"] / 10_000_000,
                            })
                if raw.stat().st_size < 3500 or not boundaries:
                    raise RuntimeError("Audio or real word boundaries missing")
                break
            except Exception:
                raw.unlink(missing_ok=True)
                boundaries.clear()
                if attempt == 2:
                    raise
                await asyncio.sleep(1 + attempt * 2)
    pcm = workdir / f"beat-{index:02d}.wav"
    run(["ffmpeg", "-y", "-v", "error", "-i", str(raw),
         "-af", "highpass=f=65", "-ar", "48000", "-ac", "1",
         "-c:a", "pcm_s16le", str(pcm)])
    return {"file": pcm, "duration": probe_duration(pcm),
            "boundaries": boundaries, "rate": rate}


async def audition(brief_path, outdir, variant):
    if variant not in VOICE_VARIANTS:
        raise ValueError("Unknown voice audition variant")
    data = json.loads(Path(brief_path).read_text(encoding="utf8"))
    segments = validate_brief(data)
    outdir = Path(outdir)
    outdir.mkdir(parents=True, exist_ok=True)
    work = outdir / f"parts-{variant}"
    work.mkdir(exist_ok=True)
    # TTS is I/O-heavy; bounded parallel segments save time without flooding service.
    semaphore = asyncio.Semaphore(2)
    results = await asyncio.gather(*[
        synthesize_beat(i, s, variant, work, semaphore)
        for i, s in enumerate(segments, 1)
    ])
    # All clips have identical PCM parameters. Pauses are editorial decisions,
    # not 8-second filler. Individual MP3 sources and word timings are preserved.
    silence_files = {}
    concat_paths = []
    timeline, pos = [], 0.0
    for i, (beat, result) in enumerate(zip(segments, results), 1):
        concat_paths.append(result["file"])
        timeline.append({
            "beat": i, "text": beat["text"],
            "editorial_intent": beat.get("editorial_intent", ""),
            "start": round(pos, 3), "duration": round(result["duration"], 3),
            "rate": result["rate"], "word_boundaries": result["boundaries"],
        })
        pos += result["duration"]
        if i < len(results):
            gap = beat.get("pause_after_ms", 100)
            if gap not in silence_files:
                silent = work / f"pause-{gap}ms.wav"
                run(["ffmpeg", "-y", "-v", "error",
                     "-f", "lavfi", "-i", "anullsrc=r=48000:cl=mono",
                     "-t", f"{gap/1000:.3f}",
                     "-c:a", "pcm_s16le", str(silent)])
                silence_files[gap] = silent
            concat_paths.append(silence_files[gap])
            pos += gap / 1000
    listing = work / "concat.txt"
    listing.write_text("".join(f"file '{p.resolve()}'\n" for p in concat_paths))
    raw_wav = outdir / f"vivienne-{variant}-raw.wav"
    final_wav = outdir / f"vivienne-{variant}-review.wav"
    final_mp3 = outdir / f"vivienne-{variant}-review.mp3"
    run(["ffmpeg", "-y", "-v", "error", "-f", "concat", "-safe", "0",
         "-i", str(listing), "-c:a", "pcm_s16le", str(raw_wav)])
    # Level matching makes A/B comparisons fair. It is not a prosody enhancer.
    run(["ffmpeg", "-y", "-v", "error", "-i", str(raw_wav),
         "-af", "loudnorm=I=-16:TP=-2:LRA=9",
         "-ar", "48000", "-ac", "1", "-c:a", "pcm_s16le", str(final_wav)])
    run(["ffmpeg", "-y", "-v", "error", "-i", str(final_wav),
         "-c:a", "libmp3lame", "-b:a", "192k", str(final_mp3)])
    measurements = measure_audio(final_wav)
    manifest = {
        "status": "AUDITION_ONLY_NOT_APPROVED",
        "voice": VOICE,
        "variant": variant, "same_speaker": True,
        "pitch_shift_or_voice_cloning": False,
        "segmented_delivery": True,
        "seams_require_human_review": True,
        "original_brief_sha256": sha256(brief_path),
        "clip_sha256": sha256(final_mp3),
        "audio_assessment": measurements,
        "timeline": timeline,
        "publishing_authorized": False,
        "rights_verified": False,
        "requires_editorial_and_legal_approval": True,
    }
    (outdir / f"vivienne-{variant}-report.json").write_text(
        json.dumps(manifest, ensure_ascii=False, indent=2), encoding="utf8")
    print(json.dumps({"mp3": str(final_mp3),
                      "seconds": measurements["seconds_total"],
                      "pause_count": measurements["pause_count"],
                      "approved": False}, ensure_ascii=False))


def main():
    cli = argparse.ArgumentParser()
    sub = cli.add_subparsers(dest="command", required=True)
    a = sub.add_parser("audit")
    a.add_argument("--audio", required=True)
    a.add_argument("--narration-end", type=float)
    a.add_argument("--report", required=True)
    b = sub.add_parser("audition")
    b.add_argument("--brief", required=True)
    b.add_argument("--out-dir", required=True)
    b.add_argument("--variant", choices=list(VOICE_VARIANTS), required=True)
    args = cli.parse_args()
    if args.command == "audit":
        report = measure_audio(args.audio, args.narration_end)
        Path(args.report).write_text(
            json.dumps(report, ensure_ascii=False, indent=2), encoding="utf8")
        print(json.dumps({
            "pause_count": report["pause_count"],
            "lra": report["loudness_range_lu"],
            "human_review_required": True}, ensure_ascii=False))
    else:
        asyncio.run(audition(args.brief, args.out_dir, args.variant))


if __name__ == "__main__":
    main()
