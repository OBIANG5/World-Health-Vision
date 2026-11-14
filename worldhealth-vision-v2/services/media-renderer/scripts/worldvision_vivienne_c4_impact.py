#!/usr/bin/env python3
"""Vivienne Impact C4 — acoustic targeted natural-flow diagnosis.

Do not change or clone the speaker. Render one full Edge-TTS utterance,
uninterrupted, preserving all syllables and service-native silences.
Variation comes from editorial syntax and punctuation, not cuts or fake SSML
emotion controls. The raw MP3 and minimally leveled review MP3 are retained.

WordBoundary timing diagnostics are heuristics, not perceptual evaluations.
No commercial publication authorization is granted.
"""
from __future__ import annotations
import argparse
import asyncio
import hashlib
import json
import re
import subprocess
from pathlib import Path
import worldvision_vivienne_only_v3 as v3

VOICE="fr-FR-VivienneMultilingualNeural"
IDS=("c4_reference","c4_flow","c4_newsroom","c4_empathy")
TARGETS=("mississippi","hôpital","hopital","hospitalisées","hospitalisees")


def validate(brief):
    assert brief["source_voice"]==VOICE, "Only authentic Vivienne permitted"
    assert brief["source_model_locked"] is True
    assert brief["approved_parent_version"]=="c_impact"
    assert brief["approved_final_signature"]=="worldvision-original-g0-graphite.mp4"
    assert brief["status"]=="AUDITION_ONLY" and brief["publication_authorized"] is False
    variants=brief["variants"]
    assert tuple(v["id"] for v in variants)==IDS
    assert len({v["script"] for v in variants})==len(IDS)
    for var in variants:
        assert var["pitch"]=="+0Hz", "Do not move the tone of Vivienne"
        assert var["rate"] in ("+6%","+7%","+8%")
        text=var["script"]
        assert "Mississippi" in text and "Trente-deux" in text
        assert "hôpital" in text and "La Nouvelle-Orléans" in text
        assert len(text)>=180 and text.count(".")>=2
        assert "Voir le monde, le comprendre" not in text
        assert "droits vérifiés" not in text
    return variants


def target_diagnostics(words):
    result=[]
    for idx,item in enumerate(words):
        term=re.sub(r"[^a-zàâéèêëîïôûùüÿç-]","",item["text"].lower())
        if term not in TARGETS:
            continue
        start=item["start_s"]
        ending=start+item["duration_s"]
        prev=words[idx-1] if idx>0 else None
        next_=words[idx+1] if idx+1<len(words) else None
        result.append({
            "target":item["text"],"word_start":start,
            "word_end":round(ending,3),
            "previous_word":prev["text"] if prev else None,
            "next_word":next_["text"] if next_ else None,
            "word_boundary_gap_before_sec":round(start-(prev["start_s"]+prev["duration_s"]),3) if prev else None,
            "word_boundary_gap_after_sec":round(next_["start_s"]-ending,3) if next_ else None,
            "target_phoneme_naturalness_verified":False,
        })
    return result


def raw_acoustic_pauses(path, sample_min=.12):
    p=subprocess.run(["ffmpeg","-hide_banner","-nostdin","-v","info","-i",str(path),
        "-af",f"silencedetect=noise=-37dB:d={sample_min}","-f","null","-"],
        text=True,capture_output=True,check=True)
    starts=[float(v) for v in re.findall(r"silence_start:\s*([\d.]+)",p.stderr)]
    ends=[float(v) for v in re.findall(r"silence_end:\s*([\d.]+)",p.stderr)]
    duration=v3.duration(path)
    return [
        {"start":round(a,3),"end":round(ends[i],3),"duration":round(ends[i]-a,3)}
        for i,a in enumerate(starts) if i<len(ends) and a>.18 and ends[i]<duration-.18
    ]


async def make(brief_path,variant_id,out):
    meta=json.loads(brief_path.read_text(encoding="utf8"))
    variants=validate(meta)
    entry=next(v for v in variants if v["id"]==variant_id)
    out.mkdir(parents=True,exist_ok=True)
    # Same fixed selected voice and exact full-take service pipeline as V3.
    raw, words = await v3.synthesize(entry,out)
    review=out/(variant_id+"-review-only.mp3")
    v3.finish_audio(raw,review)
    diagnostics=target_diagnostics(words)
    if not any("mississippi" in x["target"].lower() for x in diagnostics):
        raise RuntimeError("Mississippi did not appear in real WordBoundary data")
    if not any("hôpital" in x["target"].lower() for x in diagnostics):
        raise RuntimeError("Hôpital did not appear in real WordBoundary data")
    pauses=raw_acoustic_pauses(raw)
    enriched=[]
    for target in diagnostics:
        near=[p for p in pauses if abs(p["start"]-target["word_end"])<=.65]
        enriched.append({**target,"acoustic_pauses_near_end":near})
    report={
        "id":variant_id,
        "label":entry["label"],
        "voice":VOICE,
        "requested_speaker_is_preserved":True,
        "voice_changed":False,
        "same_model_as_C_impact":True,
        "rate":entry["rate"],
        "pitch":entry["pitch"],
        "script":entry["script"],
        "source_text_sha256":hashlib.sha256(entry["script"].encode()).hexdigest(),
        "method":"ONE CONTINUOUS SYNTHESIS; NO SENTENCE STITCHING; NO SILENCE CUTS",
        "raw_sec":round(v3.duration(raw),3),
        "review_sec":round(v3.duration(review),3),
        "audio_spliced":False,
        "sound_removed":False,
        "filler_pauses_added":False,
        "word_count":len(words),
        "relevant_word_measurements":enriched,
        "raw_pauses_over_120ms":pauses,
        "long_raw_pauses_over_450ms":sum(x["duration"]>.45 for x in pauses),
        "rights_verified":False,"publishing_authorized":False,
        "listener_review_required":True,
        "notes":"WordBoundary gaps do not prove natural intonation. Compare target words in context by ear, raw vs leveled.",
    }
    (out/(variant_id+"-report.json")).write_text(json.dumps(report,ensure_ascii=False,indent=2)+"\n",encoding="utf8")
    print(json.dumps({"id":variant_id,"voice":VOICE,"duration":report["review_sec"],
        "long_pauses":report["long_raw_pauses_over_450ms"],
        "words":len(words),"targets":enriched},ensure_ascii=False),flush=True)


def main():
    p=argparse.ArgumentParser()
    p.add_argument("--variant",required=True,choices=IDS)
    p.add_argument("--brief",type=Path,required=True)
    p.add_argument("--out",type=Path,required=True)
    a=p.parse_args()
    asyncio.run(make(a.brief,a.variant,a.out))


if __name__=="__main__":
    main()
