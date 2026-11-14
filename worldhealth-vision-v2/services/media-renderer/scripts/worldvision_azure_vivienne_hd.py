#!/usr/bin/env python3
"""OPTIONAL Azure Vivienne Dragon HD audition: same vocal persona, stronger TTS.

Runs ONLY with an authorized Azure Speech resource. Environment:
  AZURE_SPEECH_KEY=...    # GitHub Secret, never committed or printed
  AZURE_SPEECH_REGION=...
All outputs remain review-only; never automatically publish to TikTok.
HD Dragon does NOT support SSML <prosody> or <mstts:express-as> in the
documented model matrix. For French, no unverified style claims are made.
"""
from __future__ import annotations
import argparse
import json
import os
from pathlib import Path

DRAGON="fr-FR-Vivienne:DragonHDLatestNeural"


def synthesize(brief: Path, output: Path):
    import azure.cognitiveservices.speech as speechsdk
    # Never print, return, or persist subscription keys.
    key=os.environ.get("AZURE_SPEECH_KEY","").strip()
    region=os.environ.get("AZURE_SPEECH_REGION","").strip()
    if not key or not region:
        raise RuntimeError("Azure Speech resource not configured. Requires "
                           "AZURE_SPEECH_KEY and AZURE_SPEECH_REGION as secrets.")
    data=json.loads(brief.read_text(encoding="utf8"))
    if data.get("status")!="AUDITION_ONLY" or data.get("publication_authorized") is not False:
        raise ValueError("No editorial or publication mode permitted.")
    script=data.get("script","").strip()
    if len(script)<100:
        raise ValueError("Audition text is incomplete.")
    output.parent.mkdir(parents=True,exist_ok=True)
    config=speechsdk.SpeechConfig(subscription=key,region=region)
    config.speech_synthesis_voice_name=DRAGON
    config.set_speech_synthesis_output_format(
        speechsdk.SpeechSynthesisOutputFormat.Audio24Khz160KBitRateMonoMp3)
    target=speechsdk.audio.AudioOutputConfig(filename=str(output))
    synth=speechsdk.SpeechSynthesizer(speech_config=config,audio_config=target)
    result=synth.speak_text_async(script).get()
    if result.reason!=speechsdk.ResultReason.SynthesizingAudioCompleted:
        if output.exists():
            output.unlink()
        raise RuntimeError("Azure HD synthesis was not completed. Check "
                           "region, voice availability, budget and licensing.")
    if not output.exists() or output.stat().st_size<30000:
        raise RuntimeError("No valid output audio from HD synthesis")
    report={
        "status":"OPTIONAL_HD_AUDITION_ONLY",
        "voice":DRAGON,
        "model_family":"Azure Speech DragonHD",
        "source_text_identical_to_other_auditions":True,
        "audio_bytes":output.stat().st_size,
        "publishing_authorized":False,
        "rights_verified":False,
        "note":"Human listen-test and license verification are still mandatory.",
    }
    output.with_suffix(".json").write_text(
        json.dumps(report,ensure_ascii=False,indent=2)+"\n",encoding="utf8")
    print(json.dumps({"status":report["status"],"voice":DRAGON,
                      "bytes":output.stat().st_size},ensure_ascii=False))


def main():
    p=argparse.ArgumentParser()
    p.add_argument("--brief",type=Path,required=True)
    p.add_argument("--out",type=Path,required=True)
    a=p.parse_args()
    synthesize(a.brief,a.out)


if __name__=="__main__":
    main()
