#!/usr/bin/env python3
"""
World-Vision MEDIA — reproduce the OWNER-REQUESTED Artemis II 8.235s visual
review WITHOUT the previous, unapproved Kokoro narration.

This is not a new news report, not a C5.2 narration, and not a public master.
It preserves the H.264 source VIDEO stream byte-for-byte (FFmpeg stream copy)
and deliberately maps only a NEW, original, generated soundtrack. Never maps
the source audio. Only NASA-origin images already present inside a previously
provenanced P0.6 Remotion source film. This program generates no NASA footage.

Usage:
  python3 export_visual_only.py --source /tmp/p06/artemis2-semantic-internal.mp4 \
    --output /tmp/review/artemis2-visual-no-voice.mp4 \
    --expected-sha256 dec6af52661fdd45c879406c11d0a438455ffa884658dd0cb739dc134572880c

Dependencies (CI pin to versions tested): numpy 2.3.5, soundfile 0.13.1, FFmpeg.
"""
import argparse
import hashlib
import json
import pathlib
import subprocess
import sys
import tempfile

import numpy as np
import soundfile as sf


def run(cmd):
    return subprocess.run(cmd, check=True, capture_output=True, text=True).stdout


def digest(path):
    h = hashlib.sha256()
    with path.open("rb") as f:
        while block := f.read(1024 * 1024):
            h.update(block)
    return h.hexdigest()


def probe(path):
    return json.loads(run([
        "ffprobe", "-v", "error", "-show_entries",
        "format=duration:stream=codec_name,codec_type,width,height,nb_frames,r_frame_rate,sample_rate",
        "-of", "json", str(path)
    ]))


def test_spec(p):
    video = [s for s in p["streams"] if s["codec_type"] == "video"]
    if len(video) != 1:
        raise ValueError("Expected exactly one video stream")
    v = video[0]
    if (v["codec_name"] != "h264" or v["width"] != 1080
            or v["height"] != 1920 or v["r_frame_rate"] != "30/1"
            or int(v.get("nb_frames", -1)) != 247):
        raise ValueError("Unexpected input frames, codec, resolution or fps")
    duration = float(p["format"]["duration"])
    if not 8.20 <= duration < 8.40:
        raise ValueError("Unexpected story length")
    return duration


def soundtrack(seconds, audio_path):
    rate = 48000
    samples = int(np.ceil(rate * seconds))
    t = np.arange(samples, dtype=np.float64) / rate
    rng = np.random.default_rng(20261121)
    base = (
        .075 * np.sin(2 * np.pi * 51 * t + .2 * np.sin(2 * np.pi * .07 * t))
        + .025 * np.sin(2 * np.pi * 103 * t)
        + .015 * np.sin(2 * np.pi * 146 * t)
    )
    noise = rng.standard_normal(samples)
    freq = np.fft.rfftfreq(samples, 1 / rate)
    noise_spec = np.fft.rfft(noise) * np.exp(-.5 * (freq / 680) ** 2)
    texture = np.fft.irfft(noise_spec, n=samples)
    texture *= .025 / max(float(np.max(np.abs(texture))), 1e-9)
    wave = (base + texture) * (.35 + .25 * np.sin(2 * np.pi * .12 * t - 1))
    # Non-diegetic transitions only; NOT simulated recorded impact sounds.
    for onset, pitch in [(2.18, 650.), (4.26, 850.)]:
        u = t - onset
        valid = (u >= 0) & (u < .62)
        envelope = np.zeros(samples)
        envelope[valid] = np.sin(np.pi * u[valid] / .62) ** 1.8
        wave += .13 * envelope * np.sin(2 * np.pi * (pitch * u + 340 * u * u))
    u = np.maximum(0, t - 4.33)
    wave += .027 * (1 - np.exp(-2 * u)) * np.sin(
        2 * np.pi * (220 * t + .03 * np.sin(2 * np.pi * .3 * t))
    )
    wave *= np.minimum(1, np.maximum(0, t / .12))
    wave *= np.minimum(1, np.maximum(0, (seconds - t) / .34))
    peak = float(np.max(np.abs(wave)))
    if peak > .55:
        wave *= .55 / peak
    sf.write(str(audio_path), wave, rate, subtype="PCM_16")


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--source", type=pathlib.Path, required=True)
    ap.add_argument("--output", type=pathlib.Path, required=True)
    ap.add_argument("--expected-sha256", type=str, required=True)
    args = ap.parse_args()
    src = args.source.resolve()
    dst = args.output.resolve()
    if (not src.is_file() or src.suffix.lower() != ".mp4"
            or dst.suffix.lower() != ".mp4" or src == dst or dst.exists()
            or not len(args.expected_sha256) == 64):
        raise ValueError("Invalid or already existing video input/output")
    expected = args.expected_sha256.lower()
    actual = digest(src)
    if actual != expected:
        raise ValueError(f"Unrecognized source film: SHA256 {actual}")
    duration = test_spec(probe(src))
    dst.parent.mkdir(parents=True, exist_ok=True)
    with tempfile.TemporaryDirectory(prefix="worldvision-artemis2-visual-") as tmp:
        sfx = pathlib.Path(tmp) / "original-sfx.wav"
        soundtrack(duration, sfx)
        # IMPORTANT: explicitly maps 0:v:0 and NEW audio 1:a:0, NEVER source 0:a.
        subprocess.run([
            "ffmpeg", "-hide_banner", "-loglevel", "error", "-y",
            "-i", str(src), "-i", str(sfx),
            "-map", "0:v:0", "-map", "1:a:0",
            "-c:v", "copy", "-c:a", "aac", "-b:a", "192k",
            "-ar", "48000", "-ac", "2", "-movflags", "+faststart",
            "-shortest",
            "-metadata", "title=World-Vision / Artemis II / revue visuelle interne",
            "-metadata", "comment=NASA source images; no narrator; generated non-diegetic sound; not for publication",
            str(dst),
        ], check=True)
        out = probe(dst)
        test_spec(out)
        tracks = [s for s in out["streams"] if s["codec_type"] == "audio"]
        if len(tracks) != 1 or tracks[0]["codec_name"] != "aac":
            raise ValueError("Output must have ONLY the newly generated AAC sound")
        if not 48000 == int(tracks[0]["sample_rate"]):
            raise ValueError("Output audio sample rate altered")
        report = {
            "status": "OWNER_REQUESTED_VISUAL_REVIEW_ONLY_NOT_PUBLICATION",
            "episode": "NASA Artemis II — five reported lunar flashes, April 6 2026",
            "script_source": "media-voice-pilots/artemis2/narration.json, first two sentences",
            "source_video_sha256": actual,
            "output_sha256": digest(dst),
            "original_audio_explicitly_discarded": True,
            "contains_previous_kokoro_narration": False,
            "contains_new_vivienne_c52_narration": False,
            "selected_voice_for_next_proper_render": {
                "profile": "Vivienne C5.2 — Impact média",
                "id": "fr-FR-VivienneMultilingualNeural",
                "speaking_rate": "+8%",
                "new_take_of_exact_script": "MISSING",
            },
            "sound": "fully original mathematical non-diegetic soundtrack and transitions",
            "video_pixels": "source H264 stream copied unchanged; no new impact photographs generated",
            "visual_beats": ["5 ÉCLAIRS SIGNALÉS", "DERRIÈRE LA LUNE", "LE RAPPORT DE LA NASA"],
            "evidence": "NASA original source stills and annotated visualization; visualization is NOT an impact photograph",
            "publication_authorized": False,
            "voice_rights_verified": False,
            "nasa_asset_rights_review_completed": False,
            "frame_count": 247,
            "fps": 30,
            "duration_seconds": duration,
            "notes": [
                "Old captions are preserved for VISUAL inspection, not timed to future C5.2.",
                "This video is an interim sample; full-film production requires approved voice, script and rights.",
                "No footage, music samples or actual lunar impact sounds were manufactured.",
            ],
        }
        manifest = dst.with_name(dst.name + ".report.json")
        manifest.write_text(json.dumps(report, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
        print(json.dumps(report, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    try:
        main()
    except (ValueError, subprocess.CalledProcessError, OSError) as error:
        print(f"VISUAL REVIEW EXPORT REFUSED: {error}", file=sys.stderr)
        sys.exit(1)
