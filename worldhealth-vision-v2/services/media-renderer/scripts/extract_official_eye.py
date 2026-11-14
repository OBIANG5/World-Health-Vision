#!/usr/bin/env python3
"""Pixel-preserving transparent extraction of the APPROVED World-Vision G0 eye.

Never draw or invent a replacement logo. Source is the original, versioned:
  public/brand/world-vision-official.png (Git blob bc80fa70cebd...)
Output contains the very same logo pixels with only warm/off-white paper
removed. If the original artwork or mask assumptions change, fail explicitly.
Pillow only; no network call and no generative model.
"""
from __future__ import annotations
import argparse
import hashlib
import json
from pathlib import Path
from PIL import Image

DEFAULT_ROOT = Path(__file__).resolve().parents[1]
DEFAULT_SOURCE = DEFAULT_ROOT / "public/brand/world-vision-official.png"
DEFAULT_OUTPUT = DEFAULT_ROOT / "public/brand/world-vision-eye-original-transparent.png"


def sha(path: Path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


def extract(source: Path, output: Path, report: Path):
    source = source.resolve()
    if source == output.resolve():
        raise ValueError("Never overwrite the official original logo.")
    original = Image.open(source).convert("RGB")
    if original.width < 600 or original.height < 400:
        raise ValueError("Original G0 resolution unexpectedly small.")
    # Approved logo is blue/navy; background is warm off-white/beige.
    # Blue-vs-warm chromatic difference is isolated without generating any
    # invented eye outline, globe or landmass. Anti-aliased edges are retained.
    alpha = Image.new("L", original.size)
    src = original.load()
    dst = alpha.load()
    count = 0
    for y in range(original.height):
        for x in range(original.width):
            r, g, b = src[x, y]
            blue_strength = min(b - r, b - g)
            opacity = max(0, min(255, round((blue_strength + 3) * 255 / 28)))
            dst[x, y] = opacity
            count += opacity >= 128
    bbox = alpha.point(lambda p: 255 if p >= 20 else 0).getbbox()
    if not bbox:
        raise ValueError("No blue eye found in original artwork.")
    pad = max(12, round(min(original.size) * .018))
    left, top, right, bottom = bbox
    bounds = (max(0, left-pad), max(0, top-pad),
              min(original.width, right+pad), min(original.height, bottom+pad))
    width, height = right - left, bottom - top
    if not (.9 <= width / height <= 2.7):
        raise ValueError(f"Unusual source logo aspect ratio {width / height:.2f}")
    ratio_covered = count / (original.width * original.height)
    if ratio_covered < .045 or ratio_covered > .55:
        raise ValueError(f"Unexpected logo coverage: {ratio_covered:.3%}")
    rgba = original.convert("RGBA")
    rgba.putalpha(alpha)
    rgba = rgba.crop(bounds)
    output.parent.mkdir(parents=True, exist_ok=True)
    rgba.save(output, optimize=True)
    report.parent.mkdir(parents=True, exist_ok=True)
    result = {
        "status": "ORIGINAL_LOGO_PIXEL_EXTRACTION_FOR_REVIEW_ONLY",
        "source_path": str(source),
        "source_sha256": sha(source),
        "source_size": list(original.size),
        "detected_blue_bbox": list(bbox),
        "output_bbox_source_coords": list(bounds),
        "pixel_coverage_ratio": round(ratio_covered, 4),
        "output_path": str(output),
        "output_sha256": sha(output),
        "output_size": list(rgba.size),
        "same_original_logo_art": True,
        "new_logo_generated": False,
        "background_removed_programmatically": True,
        "needs_visual_review": True,
    }
    report.write_text(json.dumps(result, ensure_ascii=False, indent=2), encoding="utf8")
    print(json.dumps(result, ensure_ascii=False))


def main():
    p = argparse.ArgumentParser()
    p.add_argument("--source", type=Path, default=DEFAULT_SOURCE)
    p.add_argument("--output", type=Path, default=DEFAULT_OUTPUT)
    p.add_argument("--report", type=Path, default=DEFAULT_ROOT / "output/nextgen/logo-extraction.json")
    a = p.parse_args()
    extract(a.source, a.output, a.report)


if __name__ == "__main__":
    main()
