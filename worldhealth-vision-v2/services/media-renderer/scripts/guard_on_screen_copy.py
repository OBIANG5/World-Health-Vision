#!/usr/bin/env python3
"""Reject internal production language before any World-Vision clip is rendered.

Checks literal copy passed into drawing functions, not arbitrary strings in
comments, docs, manifests, or output file paths. Metadata stays outside MP4.
Run for each standalone Python clip and in CI before every render.
"""
import ast
import re
import sys
from pathlib import Path

FORBIDDEN = (
    r"PR[ÉE]VISUALISATION",
    r"PREVIEW",
    r"SANS VOIX",
    r"MOTION DESIGN",
    r"CLIP DE TEST",
    r"VID[ÉE]O DE TEST",
    r"RENDER",
    r"VERSION DE TRAVAIL",
    r"VERSION TEST",
    r"QA[ -]?PASSED",
    r"TECHNICAL",
    r"NON APPROUV[ÉE]",
    r"\bS0[1-9]\s*/",
    r"\bS0[1-9]\s*[-–]\s*",
)
PATTERN = re.compile("|".join(FORBIDDEN),re.IGNORECASE)
DRAW_FUNCS = {"tx", "lab", "fonttext", "text_layer", "text", "multiline_text", "draw_text"}
ERRORS = []

def check(path):
    src=Path(path).read_text(encoding="utf8")
    tree=ast.parse(src, filename=str(path))
    for node in ast.walk(tree):
        if not isinstance(node,ast.Call):
            continue
        name=(node.func.id if isinstance(node.func,ast.Name)
              else node.func.attr if isinstance(node.func,ast.Attribute) else "")
        if name not in DRAW_FUNCS:
            continue
        for arg in node.args:
            if isinstance(arg,ast.Constant) and isinstance(arg.value,str):
                if PATTERN.search(arg.value):
                    ERRORS.append(f"{path}:{node.lineno}: operational text burnt into pixels: {arg.value!r}")
    if "DejaVuSans" in src:
        ERRORS.append(f"{path}: workstation fallback DejaVu font is forbidden by World-Vision style rules")
    if "worldvision_segment04_new_start.py" in str(path):
        required={"Manrope", "FONT_PATH", "archive_credit_for_caption"}
        for key in required:
            if key not in src: ERRORS.append(f"{path}: required premium font or external credit missing: {key}")

if __name__ == "__main__":
    if len(sys.argv)<2:
        raise SystemExit("Usage: guard_on_screen_copy.py PATH [PATH ...]")
    for source in sys.argv[1:]:
        check(source)
    if ERRORS:
        print("\n".join("BLOCKED: "+e for e in ERRORS), file=sys.stderr)
        raise SystemExit(1)
    print("PASS: no production labels or fallback fonts in active clip drawing commands")
