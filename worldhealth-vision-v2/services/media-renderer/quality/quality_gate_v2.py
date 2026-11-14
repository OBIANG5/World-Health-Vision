#!/usr/bin/env python3
"""World-Vision audiovisual quality gates V2 — fail closed on known bad patterns.

A green codec check is only TECHNICAL evidence; human taste remains a separate
explicit approval. No release job may assume approval from a successful render.
"""
from __future__ import annotations

import argparse
import hashlib
import json
import re
import subprocess
import sys
from pathlib import Path

HERE=Path(__file__).resolve().parent
CONTRACT=HERE/"production_contract_v2.json"
SCENE_FILE=HERE.parent/"src/WorldVisionEditorialV2.tsx"

def ensure(condition,message):
    if not condition:
        raise AssertionError("QUALITY GATE BLOCKED: "+message)

def sha(file):
    return hashlib.sha256(Path(file).read_bytes()).hexdigest()

def qa_static(source,contract):
    # Read the actual time geometry from source, not a flattering document.
    found=[
      {"id":m[0],"start":int(m[1]),"end":int(m[2])}
      for m in re.findall(r'\{id:"([^"]+)", start:(\d+), end:(\d+)\}',source)
    ]
    expected=contract["timeline"]["scenes"]
    ensure(found==expected,f"Timeline does not match editorial contract: {found}")
    ensure(found[0]["id"]=="leaders" and found[1]["id"]=="globe",
           "Leaders must CUT DIRECTLY to moving globe; never add a G0-only intertitle")
    ensure(found[1]["end"]-found[2]["start"]==15,
           "Globe→real city must overlap exactly 15 frames (0.5 sec), no double-opacity logos")
    ensure(found[-1]["end"]==contract["timeline"]["frames"]==1263,
           "Invalid total frame count")
    ensure(all(s["end"]>s["start"] for s in found),"Zero/negative-length scene")
    ensure(all(found[k+1]["start"]<=found[k]["end"] for k in range(len(found)-1)),
           "Black gaps between consecutive scenes are forbidden")
    ensure(all(found[k+1]["start"]==found[k]["end"] for k in range(len(found)-1) if k!=1),
           "Scene boundary gap or unintended overlap")
    ensure("segment03-shenzhen-july-v3-clean-4p9s.mp4" in source,
           "The user-approved geographic globe is missing")
    ensure("BarlowCondensed-Bold.ttf" in source and "DMSans-variable.ttf" in source,
           "V2 typography requires Barlow Condensed headlines and DM Sans supporting")
    ensure('whiteSpace:"nowrap"' in source,
           "News titles must not unexpectedly wrap and collide with following headings")
    top_match=re.search(r'<Title top=\{(\d+)\} size=\{(\d+)\}>TROIS DIRIGEANTS\.\s*</Title>\s*<Title top=\{(\d+)\} size=\{(\d+)\}',source)
    ensure(top_match is not None,"Headline composition layout unexpectedly changed; inspect before rendering")
    if top_match:
        y1,z1,y2,z2=map(int,top_match.groups())
        ensure(y2-y1>=z1+25 and y2+z2<=1330 and max(z1,z2)<=122,
               "Headline collision risk; leave at least one font-height plus 25px")
    ensure('height:680' in source and 'shenzhen-city-2025.jpg' in source,
           "Shenzhen true skyline must be reframed at a sensible documentary aspect ratio")
    ensure("world-vision-official.png" in source,"G0 exact brand file missing")
    ensure('const Globe:' in source and 'const EditorialLeaders:' in source,
           "Required scenes missing")
    ensure('const Signature:' in source,"Visual-only signature missing")
    for bad in ("Barcode:React", "ProgressBar:", "previewWatermark", "PRÉVISUALISATION SANS VOIX",
                "ARCHIVES & MOTION DESIGN", "02-BRAND-ONLY-NOT-D00.mp4",
                "WorldVisionSummit2026.tsx", "HenriNeural"):
        ensure(bad not in source,f"Rejected component or operational text reintroduced: {bad}")
    # No transient debug / timer text masquerading as editorial copy.
    for expression in ("GÉOPOLITIQUE / 14 NOV. 2026", "S04 / 07,9 S",
                       "QA PASSED", "RÉVISION TECHNIQUE", "00:43"):
        ensure(expression not in source,f"Baked-in production label: {expression}")
    assert contract["visuals"]["prohibit_progress_bars"]
    assert contract["audio"]["do_not_read_logo_or_slogan_in_outro"]
    assert contract["audio"]["do_not_pad_scenes_to_fixed_length"]
    ensure(not re.search(r'<Barcode\b|<ProgressBar\b|height:\s*[23],\s*background.*progress',source),
           "Progress / footer bar visible in exported pixels")
    return {"timeline":found,"duration_sec":contract["timeline"]["frames"]/30}

def qa_voice(report,contract):
    voice=json.loads(Path(report).read_text(encoding="utf-8"))
    reject=contract["audio"]["rejected_voice"]
    rejected_sha=contract["audio"]["rejected_voice_sha256"]
    ensure(voice.get("voice")!=reject and voice.get("voice_kind")!=reject,
           "User has rejected Henri neural voice as robotic")
    for key in ("sha256","audio_sha256"):
        ensure(voice.get(key)!=rejected_sha,
               "Exact rejected synthetic narration has been submitted again")
    ensure(voice.get("approved_by_user") is True,
           "No voice approval: audio cannot be baked into a publishable video")
    ensure(voice.get("source_type") in ("human_recording","human_approved_voice"),
           "Voice provenance must be recorded human or explicitly auditioned+approved")
    last=float(voice.get("last_spoken_timestamp_sec",100))
    ensure(last<=39.1,"No spoken World-Vision slogan at final signature")
    ensure(not voice.get("audio_padded_per_scene",False),
           "Padding voice blocks to match fixed scene lengths causes artificial silence")
    ensure(voice.get("objective_silence_qc_passed") is True,
           "Real continuous audio must pass a silence/breath QA")
    return voice

def qa_release(contract,voice_report):
    assert qa_voice(voice_report,contract)
    not_approved=[key for key,value in contract["signoff"].items() if value is not True]
    ensure(not not_approved,
           "Human/editorial/signature gates incomplete: "+", ".join(not_approved))
    return True

def qa_video(path,expected_frames):
    data=json.loads(subprocess.check_output(
        ["ffprobe","-v","error","-show_format","-show_streams","-of","json",str(path)]
    ))
    video=next((s for s in data["streams"] if s["codec_type"]=="video"),None)
    ensure(video is not None,"No video track")
    ensure(video["codec_name"]=="h264","Video must use H.264, not an unknown container")
    ensure((video["width"],video["height"])==(1080,1920),"Requires true 1080x1920 vertical")
    ensure(int(video.get("nb_frames",-1))==expected_frames,
           f"Expected {expected_frames} frames, got {video.get('nb_frames')}")
    ensure(abs(float(data["format"]["duration"])-expected_frames/30)<.07,
           "Duration drift or dropped frames")
    ensure(not any(s["codec_type"]=="audio" for s in data["streams"]),
           "Unapproved audio must NOT be present in editorial visual test exports")
    return {"sha256":sha(path),"bytes":Path(path).stat().st_size,
            "frames":expected_frames,"duration":expected_frames/30}

def main():
    cli=argparse.ArgumentParser()
    cli.add_argument("--mode",choices=["source","pilot","visual","release"],default="source")
    cli.add_argument("--video",type=Path)
    cli.add_argument("--voice-report",type=Path)
    args=cli.parse_args()
    contract=json.loads(CONTRACT.read_text(encoding="utf8"))
    info=qa_static(SCENE_FILE.read_text(encoding="utf8"),contract)
    if args.mode in ("pilot","visual"):
        ensure(args.video is not None,"Video proof required")
        info["video"]=qa_video(args.video,348 if args.mode=="pilot" else 1263)
    elif args.mode=="release":
        ensure(args.video is not None and args.voice_report is not None,
               "Both final video and independently approved narration required")
        qa_release(contract,args.voice_report)
        # The signed master is allowed to contain audio; needs a dedicated
        # technical output validator, deliberately NOT the silent visual check.
        ensure(False,"No public release pipeline has been commissioned yet")
    print(json.dumps({"status":"TECHNICAL_QA_PASS_NOT_ARTISTIC_APPROVAL","mode":args.mode,
                      "project":"World-Vision Editorial V2","details":info},ensure_ascii=False))
if __name__=="__main__":
    try: main()
    except (AssertionError,ValueError,subprocess.CalledProcessError) as exc:
        print(str(exc),file=sys.stderr)
        raise SystemExit(2)
