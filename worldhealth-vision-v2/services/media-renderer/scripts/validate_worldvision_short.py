#!/usr/bin/env python3
"""Reusable documentary short quality gate for WORLD-VISION.
This automated gate does NOT grade human creativity. It blocks objective repeats
of previous failed exports: rewritten scripts, too-fast narration, fake sourcing,
ever-longer static cards, missing audio, invalid size and format.
"""
from __future__ import annotations
import argparse,hashlib,json,subprocess
from pathlib import Path

def check(manifest:Path,video:Path,review:Path,
          expected_script_sha:str|None=None,max_seconds:float=60,
          min_wpm:float=105,max_wpm:float=160,max_card_seconds:float=6.5):
    obj=json.loads(manifest.read_text(encoding="utf8"))
    errors=[]
    assert_fail=lambda t:errors.append(t)
    script=obj.get("script_verbatim") or obj.get("script_full_exact")
    if not isinstance(script,list) or not script:assert_fail("No immutable original script_lines")
    else:
        sha=hashlib.sha256("\n".join(script).encode()).hexdigest()
        if sha!=obj.get("script_sha256",obj.get("script_lock_sha256")):assert_fail("Manifest text and script hash diverge")
        if expected_script_sha and sha!=expected_script_sha:assert_fail("Owner-selected script was modified")
    if not obj.get("voice"):assert_fail("Voice id absent")
    if not obj.get("voice_commercial_license_verified") and obj.get("publication_authorized"):
        assert_fail("Cannot mark publication authorized when TTS rights are unverified")
    wpm=float(obj.get("voice_words_per_minute",0))
    if not min_wpm<=wpm<=max_wpm:assert_fail(f"Narration {wpm:.1f} WPM out of reviewed range [{min_wpm},{max_wpm}]")
    if not obj.get("voice_no_time_stretch"):assert_fail("Narration underwent artificial time stretch")
    clips=obj.get("visual_timeline") or []
    if not clips:assert_fail("Visual scene ledger absent")
    else:
        if abs(clips[0].get("seconds",0)-3.0)>.05:assert_fail("Missing first three seconds of geographic opening")
        prolonged=[(c.get("visual"),c.get("seconds")) for c in clips if float(c.get("seconds",0))>max_card_seconds]
        if prolonged:assert_fail(f"Long static scene(s) without visual re-hook: {prolonged}")
        if any(float(c.get("seconds",0))<.28 for c in clips):assert_fail("Flickering scene shorter than 0.28 seconds")
    sources=obj.get("sources") or []
    if len(sources)<3:assert_fail("Insufficient source provenance")
    for s in sources:
        if not (s.get("url","").startswith("https://")):assert_fail("Unverifiable source url")
        if s.get("kind") in ("illustration_not_guinea","generative_illustration") and not s.get("license"):
            assert_fail("Illustrative image has no documented license")
    if "image_status" not in obj:assert_fail("No unambiguous archive/illustration disclaimer in manifest")
    if not video.is_file() or video.stat().st_size<200000:assert_fail("No real exported MP4")
    else:
        try:
            p=subprocess.run(["ffprobe","-v","error","-show_streams","-show_format","-of","json",str(video)],
                capture_output=True,text=True,check=True)
            data=json.loads(p.stdout)
            v=next(x for x in data["streams"] if x["codec_type"]=="video")
            a=next(x for x in data["streams"] if x["codec_type"]=="audio")
            length=float(data["format"]["duration"])
            if not (0<length<=max_seconds):assert_fail("Video length out of bound")
            if (v.get("width"),v.get("height"))!=(1080,1920):assert_fail("Wrong vertical frame size")
            if v.get("codec_name")!="h264" or a.get("codec_name")!="aac":assert_fail("Wrong codecs")
            if abs(length-float(obj.get("duration_seconds",0)))>0.5:assert_fail("Manifest length not measured from actual MP4")
            hash_video=hashlib.sha256(video.read_bytes()).hexdigest()
            if hash_video!=obj.get("video_sha256",obj.get("output_video_sha256")):assert_fail("Video SHA-256 not reproducible")
        except Exception as exc:assert_fail("Could not probe video: "+repr(exc))
    if not (review/"contact-sheet.jpg").is_file():assert_fail("Review contact-sheet absent")
    if len(list(review.glob("frame-*.jpg")))<9:assert_fail("Nine independent review frames absent")
    if errors:
        print(json.dumps({"status":"FAIL","blockers":errors},ensure_ascii=False,indent=2))
        raise SystemExit(1)
    print(json.dumps({"status":"TECHNICAL_PASS_ARTISTIC_REVIEW_STILL_REQUIRED",
        "duration":obj["duration_seconds"],"wpm":wpm,"shots":len(clips),
        "voice_licensing_verified":bool(obj.get("voice_commercial_license_verified")),
        "auto_publish":False},ensure_ascii=False,indent=2))

if __name__=="__main__":
    p=argparse.ArgumentParser()
    p.add_argument("--manifest",required=True,type=Path)
    p.add_argument("--video",required=True,type=Path)
    p.add_argument("--review",required=True,type=Path)
    p.add_argument("--expected-script-sha",default=None)
    p.add_argument("--max-seconds",type=float,default=60)
    p.add_argument("--min-wpm",type=float,default=105)
    p.add_argument("--max-wpm",type=float,default=160)
    p.add_argument("--max-card-seconds",type=float,default=6.5)
    a=p.parse_args()
    check(a.manifest,a.video,a.review,a.expected_script_sha,
          a.max_seconds,a.min_wpm,a.max_wpm,a.max_card_seconds)
