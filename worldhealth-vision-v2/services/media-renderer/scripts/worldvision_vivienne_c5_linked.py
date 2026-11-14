#!/usr/bin/env python3
"""World-Vision Vivienne C5: no punctuation after identified robotic words.

Precisely the SAME voice/model as user's approved C Impact. One whole
utterance per take. No splice, no silence cut, no artificial filler pause.
This probes a different LINGUISTIC CONTEXT, which can alter native
TTS prosody. It does not assert human perceptual quality.
"""
from __future__ import annotations
import argparse
import asyncio
import json
import re
from pathlib import Path
import worldvision_vivienne_only_v3 as v3
import worldvision_vivienne_c4_impact as c4

VOICE="fr-FR-VivienneMultilingualNeural"
IDS=("c5_linked","c5_broadcast")


def validate(data):
    if data.get("status")!="AUDITION_ONLY" or data.get("publication_authorized") is not False:
        raise ValueError("Only private audition mode supported.")
    if data.get("voice")!=VOICE:
        raise ValueError("Only original Vivienne C Impact is allowed.")
    if tuple(v["id"] for v in data.get("variants",[]))!=IDS:
        raise ValueError("Two fixed script alternatives required.")
    for v in data["variants"]:
        if v.get("pitch")!="+0Hz" or v.get("rate")!="+8%":
            raise ValueError("Keep same exact C Impact baseline rate and pitch.")
        s=v["script"]
        if not 240 <= len(s) <= 450:
            raise ValueError("Unexpected script length.")
        if "Mississippi" not in s or "hôpital" not in s:
            raise ValueError("Both target words required.")
        if re.search(r"Mississippi\s*[,;.!?…:]",s):
            raise ValueError("Mississippi must be carried into next word naturally.")
        if re.search(r"hôpital\s*[,;.!?…:]",s):
            raise ValueError("hôpital must be carried into next word naturally.")
        if "Trente-deux" not in s:
            raise ValueError("Do not omit verified casualty number.")
    return data["variants"]


async def run(variant_id,source,out):
    data=json.loads(source.read_text(encoding="utf-8"))
    variants=validate(data)
    variant=next(x for x in variants if x["id"]==variant_id)
    out.mkdir(parents=True,exist_ok=True)
    raw,words=await v3.synthesize(variant,out)
    mastered=out/(variant_id+"-review-only.mp3")
    v3.finish_audio(raw,mastered)
    targets=c4.target_diagnostics(words)
    if not any("mississippi" in x["target"].lower() for x in targets):
        raise RuntimeError("No WordBoundary timing for Mississippi")
    if not any("hôpital" in x["target"].lower() for x in targets):
        raise RuntimeError("No WordBoundary timing for l'hôpital")
    pauses=c4.raw_acoustic_pauses(raw)
    for item in targets:
        item["acoustic_pauses_near_target"]=[
            p for p in pauses if abs(p["start"]-item["word_end"])<.6]
    report={
        "id":variant_id, "voice":VOICE,
        "same_persona_and_model_as_approved_impact_C":True,
        "requested_rate":variant["rate"],"script":variant["script"],
        "raw_seconds":round(v3.duration(raw),3),
        "review_seconds":round(v3.duration(mastered),3),
        "no_new_speaker":True,"no_audio_splices":True,
        "no_silence_cuts":True,"no_filler_pauses":True,
        "word_count":len(words),"target_diagnostics":targets,
        "raw_long_pauses_over_450ms":sum(p["duration"]>.45 for p in pauses),
        "artistic_naturalness_verified":False,
        "publishing_authorized":False,
        "rights_verified":False,
        "comment":"Word gaps cannot prove naturalness. Listen to full syllables in context.",
    }
    (out/(variant_id+"-report.json")).write_text(
        json.dumps(report,ensure_ascii=False,indent=2)+"\n",encoding="utf-8")
    print(json.dumps({"id":variant_id,"voice":VOICE,
        "duration":report["review_seconds"],"target":targets},
        ensure_ascii=False),flush=True)


def main():
    p=argparse.ArgumentParser()
    p.add_argument("--variant",choices=IDS,required=True)
    p.add_argument("--brief",type=Path,required=True)
    p.add_argument("--out",type=Path,required=True)
    a=p.parse_args()
    asyncio.run(run(a.variant,a.brief,a.out))


if __name__=="__main__":
    main()
