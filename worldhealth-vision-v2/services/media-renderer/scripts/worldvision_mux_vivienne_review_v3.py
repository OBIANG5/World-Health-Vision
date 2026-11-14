#!/usr/bin/env python3
"""Assemble user-chosen Vivienne audio into the authentic World-Vision V3 film.

This is a REVIEW, not a publishable master: Vivienne is an Edge TTS audition,
the full take needs artistic approval, and commercial rights are not cleared.
The unchanged final G0 has no spoken tagline. No padding between scenes.
"""
import argparse
import hashlib
import json
import subprocess
from pathlib import Path

EXPECTED_GLOBE="59028e59f40585ed30419a56b083386e492d5cd37920f022f5e3b5301f9423fe"
EXPECTED_VOICE_WAV="96b8ebf4a2692ad67170b98e66144784508a0ca29e6884a65c1b2882db858b7b"
VOICE_NAME="fr-FR-VivienneMultilingualNeural"
MASTER_FRAMES=1011
FPS=30
SIGNATURE_START=30.7
MASTER_SECONDS=33.7

def sha(path):
    return hashlib.sha256(Path(path).read_bytes()).hexdigest()

def probe(path):
    return json.loads(subprocess.check_output(
        ["ffprobe","-v","error","-show_format","-show_streams","-of","json",str(path)]))

def validate(picture,wav,manifest):
    info=json.loads(Path(manifest).read_text(encoding="utf-8"))
    assert info["voice"]==VOICE_NAME
    assert info["voice_preferred_by_user"] is True
    assert info["this_take_approved_by_user"] is False
    assert info["publishing_rights_cleared"] is False
    assert info["outro_read_aloud"] is False
    assert info["continuous_single_utterance"] is True
    assert info["audio_padded_per_scene"] is False
    assert info["atempo_used"] is False
    assert info["wav_sha256"]==EXPECTED_VOICE_WAV==sha(wav)
    assert info["last_word_boundary_sec"]<=SIGNATURE_START
    assert info["long_noneditorial_pauses"]==[], "Pause QC failed for continuous Vivienne"
    assert 30<=info["audio_duration_sec"]<31.5
    m=probe(picture)
    v=next(s for s in m["streams"] if s["codec_type"]=="video")
    assert v["codec_name"]=="h264" and (v["width"],v["height"])==(1080,1920)
    assert int(v["nb_frames"])==MASTER_FRAMES
    assert not any(s["codec_type"]=="audio" for s in m["streams"])
    assert abs(float(m["format"]["duration"])-MASTER_SECONDS)<.07
    return info

def main():
    p=argparse.ArgumentParser()
    p.add_argument("--picture",type=Path,required=True)
    p.add_argument("--voice-wav",type=Path,required=True)
    p.add_argument("--voice-manifest",type=Path,required=True)
    p.add_argument("--output",type=Path,required=True)
    args=p.parse_args()
    meta=validate(args.picture,args.voice_wav,args.voice_manifest)
    args.output.parent.mkdir(parents=True,exist_ok=True)
    # 100% real voice at 1x. The only added silence is the intentional VISUAL
    # closing identity: 30.7–33.7s. No voice per-scene filler or TTS stretching.
    cmd=[
     "ffmpeg","-y","-hide_banner","-loglevel","error",
     "-i",str(args.picture),"-i",str(args.voice_wav),
     "-filter_complex","[1:a]apad=whole_dur=33.7[a]",
     "-map","0:v:0","-map","[a]",
     "-c:v","copy","-c:a","aac","-b:a","192k","-ar","48000",
     "-t",str(MASTER_SECONDS),"-movflags","+faststart",str(args.output)
    ]
    subprocess.run(cmd,check=True)
    out=probe(args.output)
    v=next(s for s in out["streams"] if s["codec_type"]=="video")
    a=next(s for s in out["streams"] if s["codec_type"]=="audio")
    assert (v["width"],v["height"])==(1080,1920)
    assert v["codec_name"]=="h264" and int(v["nb_frames"])==MASTER_FRAMES
    assert a["codec_name"]=="aac" and a["sample_rate"]=="48000"
    assert abs(float(out["format"]["duration"])-MASTER_SECONDS)<.07
    report={
      "project":"World-Vision n°001 Shenzhen",
      "status":"VIVIENNE_EDIT_REVIEW_ART_APPROVAL_REQUIRED",
      "title":"Shenzhen — Trump/Poutine/Xi, announced future meeting",
      "video_type":"technical audiovisual review, not publishable final master",
      "rendered_frames":MASTER_FRAMES,"fps":FPS,"seconds":MASTER_SECONDS,
      "width":1080,"height":1920,
      "voice":VOICE_NAME,
      "voice_rate":"+11%","source_voice_seconds":meta["audio_duration_sec"],
      "last_word_seconds":meta["last_word_boundary_sec"],
      "voice_intentionally_silent_after_seconds":SIGNATURE_START,
      "original_slogan_spoken":False,
      "padding_inside_narration":False,
      "video_voice_retime_applied":False,
      "music":"none yet (rights and mix not approved)",
      "subtitle_status":"pending improved readable DM Sans style after actual voice audit",
      "original_globe_sha256":EXPECTED_GLOBE,
      "whole_take_approved_by_user":False,
      "public_commercial_rights_cleared":False,
      "publishing_authorized":False,
      "source_picture_sha256":sha(args.picture),
      "source_voice_sha256":sha(args.voice_wav),
      "final_review_sha256":sha(args.output),
      "bytes":args.output.stat().st_size,
      "qa_note":"AAC silent ending is intentional; no arbitrary gaps between VO scene blocks. Inspect and listen to full video before artistic signoff."
    }
    args.output.with_suffix(".json").write_text(json.dumps(report,ensure_ascii=False,indent=2)+"\n",encoding="utf-8")
    print(json.dumps(report,ensure_ascii=False),flush=True)

if __name__=="__main__":
    main()
