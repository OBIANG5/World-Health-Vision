#!/usr/bin/env python3
"""Preflight for NEXT World-Vision episodes; does not infer image semantics.

The tool can enforce records, layout geometry, and transparent logo hygiene.
It cannot judge whether a photograph is meaningful: editorial acceptance
remains an explicit human gate, never a fabricated computer-vision verdict.
"""
from __future__ import annotations

import argparse
import json
import re
from pathlib import Path

WIDTH, HEIGHT = 1080, 1920
# Conservative editable TikTok-safe envelope, not a platform guarantee.
CONTENT_LEFT, CONTENT_RIGHT = 90, 850
CONTENT_TOP, CONTENT_BOTTOM = 225, 1475
BANNED = ("LE MONDE • LOCALISATION", "LE MONDE - LOCALISATION",
          "PRÉVISUALISATION", "ARCHIVES & MOTION DESIGN")


def rect(item):
    keys = ["x", "y", "width", "height"]
    if not all(k in item for k in keys):
        raise ValueError("Missing rectangle geometry.")
    x, y, w, h = (item[k] for k in keys)
    if any(type(z) is not int for z in (x, y, w, h)) or w <= 0 or h <= 0:
        raise ValueError("Non-positive or non-integer rectangle geometry.")
    return x, y, x + w, y + h


def overlap(a, b):
    ax1, ay1, ax2, ay2 = rect(a)
    bx1, by1, bx2, by2 = rect(b)
    return max(ax1, bx1) < min(ax2, bx2) and max(ay1, by1) < min(ay2, by2)


def logo_tile_diagnostics(path):
    """Read an actual PNG. Detect obvious fully opaque beige/white logo cards."""
    from PIL import Image
    im = Image.open(path).convert("RGBA")
    w, h = im.size
    margin = max(1, min(w, h) // 14)
    pixels = []
    for y in list(range(margin)) + list(range(max(margin, h - margin), h)):
        for x in range(w):
            pixels.append(im.getpixel((x, y)))
    for y in range(margin, max(margin, h - margin)):
        for x in list(range(margin)) + list(range(max(margin, w - margin), w)):
            pixels.append(im.getpixel((x, y)))
    opaque_pale = sum(a >= 245 and min(r, g, b) >= 218 and
                      max(r, g, b) - min(r, g, b) < 33
                      for r, g, b, a in pixels)
    fraction = opaque_pale / max(1, len(pixels))
    return {"width": w, "height": h,
            "opaque_pale_border_fraction": round(fraction, 4),
            "opaque_tile_suspected": fraction > 0.8}


def check(data, *, strict=False, logo_path=None):
    errors, warnings = [], []
    if data.get("format") != {"width": WIDTH, "height": HEIGHT, "fps": 30}:
        errors.append("Export geometry must be 1080x1920@30.")
    if data.get("status") != "EDITORIAL_DRAFT_NOT_PUBLISHABLE":
        errors.append("This pipeline accepts only non-publishable editorial drafts.")
    chapters = data.get("chapters", [])
    if not isinstance(chapters, list) or not 2 <= len(chapters) <= 16:
        errors.append("Expected 2..16 ordered chapters.")
        chapters = []
    for i, scene in enumerate(chapters, 1):
        title = str(scene.get("headline", ""))
        spoken = str(scene.get("spoken", ""))
        category = scene.get("visual_kind")
        if any(word in title.upper() for word in BANNED):
            errors.append(f"Chapter {i}: operational/map label baked into editorial image.")
        if len(spoken) < 20:
            errors.append(f"Chapter {i}: narration missing.")
        if category not in ("documentary_photo", "documentary_video",
                            "verified_map", "editorial_motion", "outro"):
            errors.append(f"Chapter {i}: unsupported visual type {category}.")
        if category in ("documentary_photo", "documentary_video"):
            if not scene.get("subject_shown"):
                errors.append(f"Chapter {i}: explain who/what is ACTUALLY visible.")
            if not scene.get("visual_matches_narration_reason"):
                errors.append(f"Chapter {i}: explain relevance, not visual attractiveness.")
            if scene.get("visual_relevance_verified") is not True:
                (errors if strict else warnings).append(
                    f"Chapter {i}: footage relevance must be human-verified.")
            if not scene.get("source_url") or not scene.get("media_date"):
                errors.append(f"Chapter {i}: photo/video source AND image date required.")
            if not scene.get("rights_status"):
                errors.append(f"Chapter {i}: rights status missing.")
            elif scene["rights_status"] != "CLEARED":
                (errors if strict else warnings).append(
                    f"Chapter {i}: media rights not cleared.")
        if category == "editorial_motion" and scene.get("depicts_real_event"):
            errors.append(f"Chapter {i}: generated motion must not fake event footage.")
        if category == "outro" and spoken.strip():
            errors.append("Brand signature must be silent.")

    # Frame-wise real text rectangles, not merely subtitle count or font size.
    for scene in chapters:
        scene_id = scene.get("id", "unknown")
        occupied = scene.get("title_boxes", [])
        captions = scene.get("caption_boxes", [])
        for typ, boxset in (("title", occupied), ("caption", captions)):
            for box in boxset:
                try:
                    x1, y1, x2, y2 = rect(box)
                except ValueError as exc:
                    errors.append(f"{scene_id}: {exc}")
                    continue
                if not 0 <= x1 < x2 <= WIDTH or not 0 <= y1 < y2 <= HEIGHT:
                    errors.append(f"{scene_id}: {typ} outside image.")
                if typ == "caption" and (x1 < CONTENT_LEFT or x2 > CONTENT_RIGHT or
                                          y1 < CONTENT_TOP or y2 > CONTENT_BOTTOM):
                    errors.append(f"{scene_id}: caption outside reserved UI-safe area.")
                if box.get("font_px", 0) < 46:
                    errors.append(f"{scene_id}: {typ} smaller than 46px.")
        for caption in captions:
            for title in occupied:
                if overlap(caption, title):
                    errors.append(f"{scene_id}: subtitles cover existing titles.")
        for ix, a in enumerate(captions):
            for b in captions[ix + 1:]:
                if overlap(a, b):
                    errors.append(f"{scene_id}: multiple subtitles overlap.")

    brand = data.get("brand", {})
    if brand.get("use_eye_only_transparent_asset") is not True:
        errors.append("Brand must use the transparent eye mark, not the beige logo tile.")
    if brand.get("header_white_tile") is not False:
        errors.append("White logo tile forbidden in the top right header.")
    signature = brand.get("outro_layout", {})
    # Centering is mathematical; no arbitrary 235px icon.
    for key in ("mark", "wordmark", "tagline"):
        item = signature.get(key)
        if not item:
            errors.append(f"Missing outro layout element: {key}.")
            continue
        try:
            x1, y1, x2, y2 = rect(item)
            if abs((x1 + x2) / 2 - WIDTH / 2) > 12:
                errors.append(f"Outro {key} miscentered by more than 12 pixels.")
            if key == "mark" and x2 - x1 < 310:
                errors.append("Outro eye mark too small on 1080px canvas.")
        except ValueError:
            errors.append(f"Malformed outro {key} geometry.")
    if logo_path:
        info = logo_tile_diagnostics(logo_path)
        if info["opaque_tile_suspected"]:
            errors.append("LOGO TILE: near-white/beige opaque frame detected; use alpha.")
    else:
        info = {"not_checked": "No PNG supplied; actual logo asset must be examined."}
        warnings.append("Transparent logo asset NOT inspected.")
    return {"status": "PASS_WITH_HUMAN_REVIEW" if not errors else "BLOCKED",
            "strict": strict, "errors": errors, "warnings": warnings,
            "logo_diagnostics": info,
            "automated_visual_beauty_certified": False,
            "needs_human_visual_signoff": True,
            "publishing_authorized": False}


def main():
    p = argparse.ArgumentParser()
    p.add_argument("--storyboard", type=Path, required=True)
    p.add_argument("--report", type=Path, required=True)
    p.add_argument("--logo", type=Path)
    p.add_argument("--strict", action="store_true")
    args = p.parse_args()
    obj = json.loads(args.storyboard.read_text(encoding="utf8"))
    result = check(obj, strict=args.strict, logo_path=args.logo)
    args.report.parent.mkdir(parents=True, exist_ok=True)
    args.report.write_text(json.dumps(result, ensure_ascii=False, indent=2),
                           encoding="utf8")
    print(json.dumps({"status": result["status"], "errors": result["errors"],
                      "warnings": result["warnings"]}, ensure_ascii=False))
    if result["errors"]:
        raise SystemExit(1)


if __name__ == "__main__":
    main()
