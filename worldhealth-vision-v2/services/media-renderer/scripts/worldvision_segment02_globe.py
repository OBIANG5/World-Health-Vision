#!/usr/bin/env python3
"""Film 02 World-Vision: cinematic move on the ORIGINAL D00-v6 art.

IMPORTANT: no reconstructed globe, no fake geographical rotation.
Render: python scripts/worldvision_segment02_globe.py --source <original.png> --out <clip.mp4>
Needs Pillow, numpy, opencv-python-headless, ffmpeg, ffprobe.
The exact approved-direction image MUST match EXPECTED_SHA.
"""
import argparse
import hashlib
import json
import math
import subprocess
from pathlib import Path
import cv2
import numpy as np
from PIL import Image

EXPECTED_SHA = "8d9a9d20f20fbf7757713b6f5eab06590f191166eb779865747f0f59683cfca2"
WIDTH, HEIGHT, FPS, FRAMES = 1080, 1920, 30, 93
SOURCE_EYE_CENTER = (543, 695)
CAMERA_SCALE = 1.125

def sha256(p: Path) -> str:
    h = hashlib.sha256()
    with p.open("rb") as f:
        for c in iter(lambda: f.read(1024 * 1024), b""):
            h.update(c)
    return h.hexdigest()

def build_plate(source: Path) -> np.ndarray:
    im = Image.open(source).convert("RGB")
    if im.size != (1086, 1448):
        raise ValueError("Unexpected D00 geometry; refusing an alternate image")
    nw = round(im.width * CAMERA_SCALE)
    nh = round(im.height * CAMERA_SCALE)
    shot = np.asarray(im.resize((nw, nh), Image.Resampling.LANCZOS), dtype=np.uint8)
    x = round(WIDTH / 2 - SOURCE_EYE_CENTER[0] * CAMERA_SCALE)
    y = round(HEIGHT / 2 - SOURCE_EYE_CENTER[1] * CAMERA_SCALE)
    yy, xx = np.mgrid[0:HEIGHT, 0:WIDTH]
    r = np.sqrt(((xx - WIDTH/2)/(WIDTH/2))**2 + ((yy - HEIGHT/2)/(HEIGHT/2))**2)
    lum = np.clip(1 - 0.30*r, 0.55, 1)
    stage = np.stack([3*lum + 1, 14*lum + 2, 38*lum + 1], -1).astype(np.uint8)
    ox0, oy0 = max(0, x), max(0, y)
    ox1, oy1 = min(WIDTH, x+nw), min(HEIGHT, y+nh)
    src = shot[oy0-y:oy1-y, ox0-x:ox1-x]
    h = src.shape[0]
    alpha = np.minimum(
        np.clip(np.arange(h, dtype=np.float32)/55, 0, 1),
        np.clip((h-1-np.arange(h, dtype=np.float32))/55, 0, 1)
    )[:, None, None]
    stage[oy0:oy1, ox0:ox1] = (
        stage[oy0:oy1, ox0:ox1].astype(np.float32)*(1-alpha)
        + src.astype(np.float32)*alpha
    ).astype(np.uint8)
    return stage

def render(source: Path, output: Path):
    if sha256(source) != EXPECTED_SHA:
        raise SystemExit("D00-v6 SHA mismatch. No substituted/reconstructed Earth.")
    output.parent.mkdir(parents=True, exist_ok=True)
    plate = build_plate(source)
    hsv = cv2.cvtColor(plate, cv2.COLOR_RGB2HSV)
    mask = np.clip((hsv[:, :, 1].astype(np.float32)-105)/100, 0, 1)
    blue = np.clip(
        (plate[:, :, 2].astype(np.float32)-plate[:, :, 0].astype(np.float32)-35)/95,
        0, 1)
    cyan = np.clip(
        (plate[:, :, 1].astype(np.float32)-plate[:, :, 0].astype(np.float32)-10)/100,
        0, 1)
    zone = np.minimum(1, np.abs(np.arange(HEIGHT)[:, None]-960)/570)
    glowmask = (mask*blue*cyan*zone).astype(np.float32)

    cmd = ["ffmpeg", "-y", "-hide_banner", "-loglevel", "error",
           "-f", "rawvideo", "-pixel_format", "rgb24",
           "-video_size", f"{WIDTH}x{HEIGHT}", "-framerate", str(FPS),
           "-i", "pipe:0", "-an", "-c:v", "libx264", "-preset", "medium",
           "-crf", "17", "-pix_fmt", "yuv420p", "-r", str(FPS),
           "-movflags", "+faststart", str(output)]
    proc = subprocess.Popen(cmd, stdin=subprocess.PIPE, stderr=subprocess.PIPE)
    assert proc.stdin is not None
    try:
        for i in range(FRAMES):
            t = i/(FRAMES-1)
            ease = t*t*(3-2*t)
            scale = 1+0.023*ease
            warp = cv2.getRotationMatrix2D((WIDTH/2, HEIGHT/2), 0, scale)
            frame = cv2.warpAffine(
                plate, warp, (WIDTH, HEIGHT), flags=cv2.INTER_CUBIC,
                borderMode=cv2.BORDER_CONSTANT, borderValue=(4, 15, 38))
            amp = (math.sin(math.pi*(t*.85+.07))**2)*8
            if amp > 0:
                mm = cv2.warpAffine(
                    glowmask, warp, (WIDTH, HEIGHT), flags=cv2.INTER_LINEAR)
                c = np.array([.30, .75, 1], dtype=np.float32)[None, None, :]
                frame = np.clip(
                    frame.astype(np.float32)+amp*mm[:, :, None]*c,
                    0, 255).astype(np.uint8)
            proc.stdin.write(frame.tobytes())
        proc.stdin.close()
        error = proc.stderr.read().decode("utf-8", errors="replace")
        if proc.wait() != 0:
            raise RuntimeError(error[-3000:])
    finally:
        if proc.poll() is None:
            proc.kill()
    probe = subprocess.run(
        ["ffprobe", "-v", "error", "-show_entries",
         "format=duration,size:stream=width,height,codec_name,r_frame_rate",
         "-of", "json", str(output)],
        capture_output=True, text=True, check=True)
    metadata = json.loads(probe.stdout)
    manifest = {
        "segment_id": "S02_D00-v6_EYE_GLOBE",
        "role": "brand-identity-bridge",
        "source_original_filename": source.name,
        "source_sha256": EXPECTED_SHA,
        "output_filename": output.name,
        "output_sha256": sha256(output),
        "frame_count": FRAMES, "fps": FPS, "width": WIDTH, "height": HEIGHT,
        "audio": "NOT_INCLUDED: mix only after final voice selection",
        "brand": "ORIGINAL D00-v6 image: no redrawn globe",
        "motion": "2.3% optical-centered dolly-in plus subtle atmospheric pulse",
        "shot_note": "Camera push only. NOT an actual rotation toward Shenzhen.",
        "approved_for_publication": False,
        "qa_status": "TECHNICAL_PROBE_ONLY; ART_DIRECTION_REVIEW_REQUIRED",
        "probe": metadata,
    }
    output.with_suffix(".manifest.json").write_text(
        json.dumps(manifest, indent=2, ensure_ascii=False)+"\n", encoding="utf-8")
    print(json.dumps({
        "path": str(output), "sha256": manifest["output_sha256"],
        "duration": metadata["format"]["duration"],
    }, indent=2))

if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--source", required=True, type=Path)
    parser.add_argument("--out", required=True, type=Path)
    args = parser.parse_args()
    render(args.source, args.out)
