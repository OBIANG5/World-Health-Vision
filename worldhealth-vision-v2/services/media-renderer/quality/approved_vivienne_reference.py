#!/usr/bin/env python3
"""World-Vision C5.2 immutable working-reference verifier.

No TTS synthesis is performed here. This module pins the user-selected
Vivienne audio AND its source metadata so another GitHub branch cannot silently
substitute a different voice, overwrite the approved sample, switch the approved
outro or misrepresent a trial as commercial rights clearance.
"""
from __future__ import annotations
import argparse
import json
import subprocess
from pathlib import Path

BASE=Path(__file__).resolve().parents[4]
PROFILE=Path(__file__).resolve().parents[1]/"nextgen/approved_voice_profile.json"
EXPECTED_ID="fr-FR-VivienneMultilingualNeural"
EXPECTED_VARIANT="c5_broadcast"
EXPECTED_REVIEW_BLOB="cd2254c1557b815fd63a4861af9086d26d960da6"
EXPECTED_RAW_BLOB="b36aca061d634e68be464e805284d3aa1735a5f6"
EXPECTED_SIGNATURE="worldvision-original-g0-graphite.mp4"
EXPECTED_DURATION=14.088

def git_blob_sha(path):
    result=subprocess.run(["git","hash-object",str(path)],capture_output=True,text=True)
    if result.returncode:
        raise ValueError("Unable to verify canonical media blob: "+result.stderr[:180])
    return result.stdout.strip()

def verify(profile_path=PROFILE, *, require_binary=True):
    profile=json.loads(Path(profile_path).read_text(encoding="utf-8"))
    problems=[]
    selected=profile.get("selected_reference",{})
    provenance=profile.get("provenance",{})
    audio=profile.get("canonical_project_assets",{})
    policy=profile.get("policy",{})
    brand=profile.get("branding",{})
    if selected.get("variant_id") != EXPECTED_VARIANT:
        problems.append("Approved voice variant replaced.")
    if selected.get("voice_id")!=EXPECTED_ID:
        problems.append("Forbidden change of Vivienne speaker.")
    if selected.get("rate")!="+8%":
        problems.append("Approved recording rate must remain recorded as +8%.")
    if selected.get("pitch")!="+0Hz":
        problems.append("Approved reference timbre must remain at +0Hz pitch.")
    if abs(selected.get("duration_seconds_approx",0)-EXPECTED_DURATION)>.03:
        problems.append("Approved sample duration changed.")
    if provenance.get("review_git_blob_sha")!=EXPECTED_REVIEW_BLOB:
        problems.append("Source audio content-address does not match selected C5.2.")
    if provenance.get("raw_git_blob_sha")!=EXPECTED_RAW_BLOB:
        problems.append("Original untouched C5.2 audio content-address changed.")
    if policy.get("voice_immutable")!="Do not replace fr-FR-VivienneMultilingualNeural with another TTS speaker":
        problems.append("Voice immutability protection is disabled.")
    for key in ("reference_audio_immutable","read_one_take_per_script",
                "requires_full_human_listening","never_reuse_old_story_narration_as_new_story"):
        if policy.get(key) is not True:problems.append("Voice policy disabled: "+key)
    for key in ("add_artificial_pauses","splice_speech_segments",
                "clip_silences_automatically","commercial_voice_rights_verified",
                "allow_automatic_tiktok_publication"):
        if policy.get(key) is not False:problems.append("Unsafe policy enabled: "+key)
    if policy.get("future_story_rate_percent")!=6 or policy.get("future_story_rate_status")!="PROPOSED_NOT_APPROVED":
        problems.append("Future +6% proposal must not be misrepresented as approved.")
    if brand.get("outro_approved_variant")!=EXPECTED_SIGNATURE:
        problems.append("Approved original G0 steel-light signature replaced.")
    if brand.get("do_not_generate_new_logo") is not True:
        problems.append("New/invented logo forbidden.")
    if profile.get("approved_scope")!="VOICE_STYLE_AND_SAME_EVENT_WORKING_CUT_ONLY":
        problems.append("Incorrect publishing-scope statement.")
    if selected.get("source_event_id")!="wv-002-new-orleans-2026-11-13":
        problems.append("C5.2 may only narrate its original New Orleans event.")
    if selected.get("can_use_for_same_event_working_cut") is not True:
        problems.append("Cannot recover the user's chosen C5.2 for its own story.")
    if selected.get("can_use_as_other_event_narration") is not False:
        problems.append("The C5.2 recording cannot narrate unrelated news.")
    if policy.get("reference_audio_reusable_only_for_same_event_working_cut") is not True:
        problems.append("Same-event audio integrity rule missing.")
    if policy.get("reference_audio_reuse_still_subject_to_commercial_rights") is not True:
        problems.append("Audio rights gate cannot be waived.")
    if not isinstance(selected.get("exact_transcript"),str) or "Mississippi" not in selected["exact_transcript"]:
        problems.append("Exact C5.2 source transcript required.")


    source_report={}
    if require_binary:
        reference=BASE/audio.get("reference_mp3","DOES_NOT_EXIST")
        raw=BASE/audio.get("raw_reference_mp3","DOES_NOT_EXIST")
        report_file=BASE/audio.get("source_report","DOES_NOT_EXIST")
        for name,path,sha in (("master",reference,EXPECTED_REVIEW_BLOB),
                              ("raw",raw,EXPECTED_RAW_BLOB)):
            if not path.is_file() or path.stat().st_size < 50000:
                problems.append("Missing canonical "+name+" MP3 in this branch.")
            elif git_blob_sha(path)!=sha:
                problems.append("CRITICAL: canonical "+name+" MP3 content differs from selected C5.2.")
        if report_file.is_file():
            source_report=json.loads(report_file.read_text(encoding="utf-8"))
            if source_report.get("voice")!=EXPECTED_ID or source_report.get("id")!=EXPECTED_VARIANT:
                problems.append("Source synthesis provenance does not match selected Vivienne.")
            if source_report.get("requested_rate")!="+8%":
                problems.append("Source synthesis rate is inconsistent.")
            if source_report.get("no_audio_splices") is not True:
                problems.append("Approved original source must be a single uninterrupted take.")
            if source_report.get("script") != selected.get("exact_transcript"):
                problems.append("Story transcript differs from the original C5.2 recorded words.")

            if source_report.get("rights_verified") is not False:
                problems.append("Unsupported claim of verified TTS commercial rights.")
        else:
            problems.append("Original C5.2 source audio report missing.")
    return {
        "profile_id":profile.get("profile_id"),
        "status":"BLOCKED" if problems else "REFERENCE_AUTHENTICATED_NOT_PUBLISHING_CLEARED",
        "errors":problems,
        "voice":selected.get("voice_id"),
        "version":selected.get("variant_id"),
        "verified_binary":bool(require_binary),
        "logo":brand.get("outro_approved_variant"),
        "publisher_release_permitted":False,
        "artistic_quality_certified":False,
        "rights_verified":False,
        "future_rate_6_percent_pending_audition":True,
    }

def main():
    p=argparse.ArgumentParser()
    p.add_argument("--profile",type=Path,default=PROFILE)
    p.add_argument("--report",type=Path)
    p.add_argument("--only-metadata",action="store_true",
                   help="Validate profile prior to import, not the MP3 bytes.")
    a=p.parse_args()
    outcome=verify(a.profile,require_binary=not a.only_metadata)
    if a.report:
        a.report.parent.mkdir(parents=True,exist_ok=True)
        a.report.write_text(json.dumps(outcome,ensure_ascii=False,indent=2)+"\n",encoding="utf-8")
    print(json.dumps(outcome,ensure_ascii=False))
    if outcome["errors"]:
        raise SystemExit(1)

if __name__=="__main__":
    main()
