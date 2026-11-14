#!/usr/bin/env python3
"""World-Vision episode preflight — objective checks with honest human review gate.

A storyboard can pass structural checks but cannot be publishable while
footage licenses, accurate image/audio matching, rights, and final mobile
review are outstanding. This tool NEVER 'certifies beautiful images'.
"""
from __future__ import annotations
import argparse
import json
import math
from pathlib import Path

WIDTH=1080
HEIGHT=1920
ALLOWED_KINDS={"documentary_photo","documentary_video","editorial_motion","outro"}
PROHIBITED_TITLES={
    "LE MONDE LOCALISATION","LE MONDE • LOCALISATION","PRÉVISUALISATION",
    "ARCHIVES & MOTION DESIGN"
}
REQUIRED_HUMAN_CHECKS=(
    "rights_cleared","footage_review_complete",
    "voice_for_this_new_story_approved","final_1080p_preview_checked",
    "full_audio_listened_on_mobile","captions_and_text_overlap_checked",
    "actual_render_screenshots_reviewed","factual_release_check"
)

def as_rectangle(box):
    return box["x"],box["y"],box["x"]+box["width"],box["y"]+box["height"]

def intersect(a,b):
    ax,ay,ar,ab=as_rectangle(a)
    bx,by,br,bb=as_rectangle(b)
    return max(ax,bx)<min(ar,br) and max(ay,by)<min(ab,bb)

def check(episode,profile):
    errors=[]
    blocking=[]
    notes=[]
    selected=profile.get("selected_reference",{})
    rendition=episode.get("render",{})
    editorial=episode.get("editorial",{})
    typo=episode.get("typography",{})
    qa=episode.get("qa",{})
    if [1080,1920]!=rendition.get("size") or rendition.get("fps")!=30:
        errors.append("Vertical output must be native 1080x1920, 30fps.")
    if episode.get("status")!="PREPRODUCTION_NOT_READY_FOR_PUBLISHING":
        errors.append("This job cannot claim to be publishable.")
    if editorial.get("proposed_audio_profile")!=profile.get("profile_id"):
        errors.append("Approved C5.2 profile not bound to episode.")
    if editorial.get("voice_model")!="fr-FR-VivienneMultilingualNeural":
        errors.append("Unauthorized narrator substituted.")
    if editorial.get("no_reuse_of_C52_audio_on_new_news") is not True:
        errors.append("Reusing old story MP3 to narrate new news is forbidden.")
    if editorial.get("produced_new_narration") is not False:
        notes.append("Narration status updated; verify output and sign off before final render.")
    if editorial.get("proposed_speed_approved") is not True:
        blocking.append("Future speed change (proposed +6%) not approved by user.")
    if editorial.get("source_narration_requires_human_approval") is not True:
        errors.append("Narration release gate was disabled.")
    # The selected C5.2 MP3 ALREADY narrates the New Orleans collision.
    # It can be reused for that same event, never dubbed over new news.
    if editorial.get("existing_selected_C52_recording_available"):
        if episode.get("episode_id")!=selected.get("source_event_id"):
            errors.append("Approved C5.2 only narrates its original New Orleans event.")
        if editorial.get("narration_draft")!=selected.get("exact_transcript"):
            errors.append("Visual plan narration is not the actual C5.2 recording transcript.")
        if editorial.get("selected_audio_source")!=profile["canonical_project_assets"]["reference_mp3"]:
            errors.append("Episode attempts to use a different or nonexistent voice master.")
        if abs(editorial.get("selected_audio_seconds",0)-selected.get("duration_seconds_approx",0))>.04:
            errors.append("Approved C5.2 reference duration mismatch.")
        if not editorial.get("audio_approved_for_story_working_cut"):
            errors.append("Selected sample must be explicitly authorized as working cut.")
        if editorial.get("future_speed_change_approved") is not False:
            errors.append("Future +6% hypothesis cannot overwrite selected +8% C5.2.")
        fps=rendition.get("fps",30)
        audio_duration=editorial.get("selected_audio_seconds",0)
        expected_outro_start=math.ceil(audio_duration*fps)/fps
        expected_total_frames=math.ceil(audio_duration*fps)+round(3*fps)
        if abs(rendition.get("outro_start_seconds",0)-expected_outro_start)>.01:
            errors.append("Outro timing must begin exactly when selected C5.2 speech ends.")
        if rendition.get("total_frames")!=expected_total_frames:
            errors.append("Invalid render length: would reintroduce extended silence or cut the outro.")
        if rendition.get("narration_audio_file")!=editorial.get("selected_audio_source"):
            errors.append("Renderer not bound to verified voice MP3.")

    if rendition.get("brand_outro")!="worldvision-original-g0-graphite.mp4":
        errors.append("Approved steel-light original G0 outro was replaced.")
    if rendition.get("brand_mark")!="official_original_eye_transparent":
        errors.append("Official transparent eye mark missing.")
    if rendition.get("brand_outro_silent") is not True:
        errors.append("Outro must be silent.")
    if typo.get("font_family")!="DM Sans":
        errors.append("Episode requires previously selected premium DM Sans typography.")
    if typo.get("captions_can_overlap_titles") is not False:
        errors.append("Captions may never cover editorial text.")
    if typo.get("subtitle_mode")!="DISABLED_PENDING_PROPER_SAFE_AREA_COMPOSITION":
        notes.append("Subtitle composition requires separate on-screen QA.")
    facts=episode.get("story_facts",{})
    sources=facts.get("sources",[])
    if len(sources)<2:
        errors.append("At least two verified independent editorial sources required.")
    if facts.get("unconfirmed") is None:
        errors.append("Unconfirmed facts must be explicitly listed to prevent fabrication.")
    scenes=episode.get("shots",[])
    if not 4<=len(scenes)<=16:
        errors.append("Expected 4–16 meaningful storyboard scenes.")
    if scenes:
        start=0.0
        for i,s in enumerate(scenes,1):
            label=s.get("id",f"shot-{i}")
            t=s.get("sec",[])
            if len(t)!=2 or not all(isinstance(v,(int,float)) for v in t) or t[1]<=t[0]:
                errors.append(f"{label}: invalid scene timecode")
                continue
            if abs(t[0]-start)>.03:
                errors.append(f"{label}: scene timeline discontinuity or overlap")
            start=t[1]
            kind=s.get("kind")
            if kind not in ALLOWED_KINDS:
                errors.append(f"{label}: unknown image type")
            if not s.get("visual_match_reason") or len(s["visual_match_reason"])<30:
                errors.append(f"{label}: meaningful visual→voice explanation required")
            if not s.get("motion_intent") or len(s["motion_intent"])<35:
                errors.append(f"{label}: animation must communicate the story")
            if s.get("screen_title","").upper() in PROHIBITED_TITLES:
                errors.append(f"{label}: operational label or amateur title forbidden")
            if kind in ("documentary_video","documentary_photo"):
                if not s.get("visual_subject_required") or not s.get("source_url"):
                    errors.append(f"{label}: no verified real-event visual subject or source")
                if not s.get("asset_date"):
                    errors.append(f"{label}: must date actual photo/video")
                if s.get("rights_status")!="CLEARED":
                    blocking.append(f"{label}: original footage license not cleared")
                if s.get("planned_visual_asset") is None:
                    blocking.append(f"{label}: no actual authorized visual asset")
                if s.get("visual_verified_against_audio") is not True:
                    blocking.append(f"{label}: human has not checked relevance to spoken narration")
            if kind=="editorial_motion" and not s.get("planned_visual_asset"):
                errors.append(f"{label}: Remotion graphic has no clear plan")
            if kind=="outro":
                if i!=len(scenes):
                    errors.append("Outro must be last")
                if s.get("spoken_excerpt","").strip():
                    errors.append("Outro must never be voiced")
                if abs((t[1]-t[0])-3.0)>.03:
                    errors.append("User-approved brand outro must last 3 sec")
                if s.get("planned_visual_asset")!=rendition.get("brand_outro"):
                    errors.append("Outro asset is not approved original G0 graphic")
            for boxkey in ("title_box","caption_box"):
                box=s.get(boxkey)
                if box is None:continue
                try:
                    x1,y1,x2,y2=as_rectangle(box)
                    if not 0<=x1<x2<=WIDTH or not 0<=y1<y2<=HEIGHT:
                        errors.append(f"{label}: {boxkey} outside canvas")
                except (KeyError,TypeError,ValueError):
                    errors.append(f"{label}: {boxkey} geometry invalid")
            if s.get("title_box") and s.get("caption_box") and intersect(s["title_box"],s["caption_box"]):
                errors.append(f"{label}: subtitle/title pixel overlap")
        if start>30.1:
            errors.append("Episode too long for user's desired short TikTok format")
    for f in REQUIRED_HUMAN_CHECKS:
        if qa.get(f) is not True:
            blocking.append("Not yet approved by human: "+f)
    for f in ("ready_to_export","ready_to_publish"):
        if qa.get(f) is not False:
            errors.append("Premature output/release claim: "+f)
    return {
        "status":"BLOCKED" if errors or blocking else "PASS_HUMAN_SIGNOFF_RECORDED",
        "structural_errors":errors,
        "real_world_release_blockers":blocking,
        "warnings":notes,
        "number_of_shots":len(scenes),
        "frame_count_target":int((scenes[-1]["sec"][1] if scenes else 0)*rendition.get("fps",30)),
        "aesthetic_quality_certified":False,
        "commercial_rights_certified":False,
        "publishing_authorized":False,
        "human_review_mandatory":True,
    }

def main():
    p=argparse.ArgumentParser()
    p.add_argument("--episode",type=Path,required=True)
    p.add_argument("--profile",type=Path,required=True)
    p.add_argument("--report",type=Path,required=True)
    p.add_argument("--expect-blocked",action="store_true",
                   help="Preproduction CI passes only when exactly the intended gates are still closed.")
    a=p.parse_args()
    episode=json.loads(a.episode.read_text(encoding="utf-8"))
    profile=json.loads(a.profile.read_text(encoding="utf-8"))
    result=check(episode,profile)
    a.report.parent.mkdir(parents=True,exist_ok=True)
    a.report.write_text(json.dumps(result,ensure_ascii=False,indent=2)+"\n",encoding="utf-8")
    print(json.dumps(result,ensure_ascii=False))
    if a.expect_blocked:
        if result["status"]!="BLOCKED" or result["structural_errors"]:
            raise SystemExit("Expected blocked due to unlicensed footage/unapproved voice, but without structural bugs.")
    elif result["status"]!="PASS_HUMAN_SIGNOFF_RECORDED":
        raise SystemExit("Release remains blocked.")

if __name__=="__main__":
    main()
