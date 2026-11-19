#!/usr/bin/env python3
"""Bind the 54 exact Analytics economic indicator codes to a synthetic SQL fixture.

No genuine statistical observations or external fetches are ever used.
"""
from __future__ import annotations

import argparse
from pathlib import Path
import re

MARKER = "__WHV_ECONOMIC_INDICATOR_CODES__"
PROFILE_START = "ECONOMIC_LENS_PROFILES: tuple[EconomicLensProfile, ...] = ("
PROFILE_END = "REGIONAL_ECONOMIC_LENS_PROFILES = ECONOMIC_LENS_PROFILES"
CODE_RE = re.compile(r'indicator_code\s*=\s*"([A-Z0-9_.]+)"')


def economic_codes(profile_source: str) -> tuple[str, ...]:
    if profile_source.count(PROFILE_START) != 1 or profile_source.count(PROFILE_END) != 1:
        raise ValueError("Missing/duplicate economic profile source boundary")
    section = profile_source.split(PROFILE_START, 1)[1].split(PROFILE_END, 1)[0]
    codes = tuple(CODE_RE.findall(section))
    if len(codes) != 54 or len(set(codes)) != 54:
        raise ValueError("Expected exactly 54 unique canonical economic indicator codes")
    if "NY.GDP.MKTP.CD" not in codes:
        raise ValueError("GDP indicator needed for reviewed SQL EXPLAIN is missing")
    return codes


def bind_fixture(template: str, codes: tuple[str, ...]) -> str:
    if template.count(MARKER) != 2:
        raise ValueError("Expected two canonical indicator set bindings in SQL template")
    if not codes or any(re.fullmatch(r"[A-Z0-9_.]+", code) is None for code in codes):
        raise ValueError("Unsafe code in synthetic fixture")
    quoted = ", ".join(f"'{code}'" for code in codes)
    return template.replace(MARKER, quoted)


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--profiles", type=Path, required=True)
    parser.add_argument("--template", type=Path, required=True)
    parser.add_argument("--output", type=Path, required=True)
    parser.add_argument("--ci-fixture-only", action="store_true")
    args = parser.parse_args()
    if not args.ci_fixture_only:
        parser.error("Requires explicit disposable --ci-fixture-only")
    codes = economic_codes(args.profiles.read_text(encoding="utf-8"))
    output = bind_fixture(args.template.read_text(encoding="utf-8"), codes)
    args.output.parent.mkdir(parents=True, exist_ok=True)
    args.output.write_text(output, encoding="utf-8")
    print(f"PASS: built synthetic Timeseries SQL fixture for exactly {len(codes)} current economic indicators")


if __name__ == "__main__":
    main()
