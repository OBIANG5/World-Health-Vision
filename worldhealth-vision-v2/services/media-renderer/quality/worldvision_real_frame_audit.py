#!/usr/bin/env python3
"""World-Vision true-frame contact-sheet audit for mobile-first visual approval.

Samples ACTUAL frames extracted from the encoded MP4 via ffmpeg. This checks
dimensions, timing, visible near-blank frames and unexpected prolonged stills.
It cannot certify cinematic quality, semantic image relevance, readable
typography, factual accuracy, licenses or subjective beauty: a real person
MUST inspect the full-resolution frames and listen to the finished video.

No fake screenshots, no generative AI, and no OCR guesses.
"""
from __future__ import annotations
import argparse
import json
import math
import subprocess
from pathlib import Path
from PIL import Image,ImageDraw,ImageFont,ImageStat,ImageChops

def command(args):
    p=subprocess.run(args,capture_output=True,text=True)
    if p.returncode!=0:
        raise RuntimeError("Media process failed: "+p.stderr[-1500:])
    return p.stdout

def inspect_media(path):
    obj=json.loads(command(["ffprobe","-v","error","-show_format","-show_streams",
                            "-of","json",str(path)]))
    video=next((s for s in obj["streams"] if s.get("codec_type")=="video"),None)
    audio=[s for s in obj["streams"] if s.get("codec_type")=="audio"]
    if not video:raise ValueError("Video stream missing.")
    n,d=(int(z) for z in video.get("avg_frame_rate","0/1").split("/"))
    fps=n/d if d else 0.0
    total=float(video.get("duration") or obj.get("format",{}).get("duration") or 0)
    return {"width":video.get("width"),"height":video.get("height"),
            "fps":round(fps,5),"duration_sec":round(total,3),
            "has_audio":bool(audio),"video_codec":video.get("codec_name"),
            "audio_codecs":[x.get("codec_name") for x in audio]}

def times(duration,count=10):
    if duration<=0:raise ValueError("Cannot sample nonpositive duration.")
    if not 3<=count<=32:raise ValueError("Sample count must be 3..32.")
    # Spread snapshots through the whole film and INCLUDE the ending.
    return [round(min(max(.03,duration-.06),duration*(i+.5)/count),3)
            for i in range(count)]

def bright_and_motion_stats(photos):
    stats=[]
    movement=[]
    previous=None
    for image in photos:
        thumb=image.convert("RGB")
        gray=thumb.convert("L")
        sc=ImageStat.Stat(gray)
        mean=sc.mean[0]
        standard=sc.stddev[0]
        stats.append({"mean_luma":round(mean,2),
                      "luma_contrast":round(standard,2),
                      "possibly_blank":bool(mean<5 and standard<6)})
        if previous:
            delta=ImageChops.difference(previous,gray)
            d=ImageStat.Stat(delta).mean[0]
            movement.append(round(d,3))
        previous=gray
    return stats,movement

def build_report(video,output,count=10,require_silent=False,strict=True):
    media=Path(video)
    if not media.is_file():raise FileNotFoundError(media)
    info=inspect_media(media)
    errors=[]
    warnings=[]
    if strict and (info["width"]!=1080 or info["height"]!=1920):
        errors.append("Final render must be true 1080x1920.")
    if strict and abs(info["fps"]-30)>.1:
        errors.append("Final render must be 30fps.")
    if require_silent and info["has_audio"]:
        errors.append("Approved brand outro must contain no sound.")
    stamp=times(info["duration_sec"],count)
    frames=[]
    for t in stamp:
        # Seek before input for efficiency, but decode actual on-screen frames.
        p=subprocess.run(["ffmpeg","-nostdin","-hide_banner","-loglevel","error",
                          "-ss",str(t),"-i",str(media),"-frames:v","1",
                          "-f","image2pipe","-vcodec","png","-"],
                          stdout=subprocess.PIPE,stderr=subprocess.PIPE)
        if p.returncode:
            raise RuntimeError(f"Failed extracting real frame at {t}s: "+p.stderr.decode(errors='replace')[-400:])
        import io
        im=Image.open(io.BytesIO(p.stdout))
        im.load()
        frames.append(im.convert("RGB"))
    samples,motion=bright_and_motion_stats([im.resize((180,320)) for im in frames])
    blanks=[round(t,3) for t,s in zip(stamp,samples) if s["possibly_blank"]]
    if blanks:
        errors.append("Near-black/blank candidate frames; inspect timestamps: "+str(blanks))
    if motion and sum(x<.3 for x in motion)>len(motion)*.7:
        warnings.append("Most sampled frames have almost no motion; inspect shot rhythm and static areas.")
    # Contact sheet is a candidate preview, not a replacement for a real playback.
    columns=4
    tile_width,tile_height=204,400
    rows=math.ceil(len(frames)/columns)
    sheet=Image.new("RGB",(columns*tile_width,rows*tile_height),(11,23,40))
    draw=ImageDraw.Draw(sheet)
    try:
        font=ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf",16)
    except OSError:
        font=ImageFont.load_default()
    for i,(im,t) in enumerate(zip(frames,stamp)):
        x=(i%columns)*tile_width
        y=(i//columns)*tile_height
        thumb=im.resize((180,320),Image.Resampling.LANCZOS)
        sheet.paste(thumb,(x+12,y+26))
        draw.text((x+12,y+5),f"{t:.2f}s  #{i+1}",font=font,fill=(229,245,250))
        draw.text((x+12,y+350),
                  f"Luma {samples[i]['mean_luma']:.0f}  C {samples[i]['luma_contrast']:.0f}",
                  font=font,fill=(177,209,224))
    output=Path(output)
    output.mkdir(parents=True,exist_ok=True)
    jpg=output/"real-frames-contact-sheet.jpg"
    sheet.save(jpg,quality=88,optimize=True)
    report={
        "status":"OBJECTIVE_BLOCKERS" if errors else "READY_FOR_HUMAN_VISUAL_REVIEW",
        "source":str(media),
        "media":info,
        "sample_count":len(frames),
        "actual_frame_times_sec":stamp,
        "objective_errors":errors,
        "warnings":warnings,
        "near_black_candidate_times":blanks,
        "inter_sample_movement":motion,
        "contact_sheet":str(jpg),
        "true_video_frames_extracted":True,
        "needs_human_aesthetic_review":True,
        "needs_human_typography_review":True,
        "needs_human_brand_outro_review":True,
        "needs_full_audio_listening":True,
        "copyrights_and_sources_not_checked_by_this_tool":True,
        "publishing_authorized":False,
    }
    (output/"real-frame-qa.json").write_text(
        json.dumps(report,ensure_ascii=False,indent=2)+"\n",encoding="utf8")
    return report

def main():
    p=argparse.ArgumentParser()
    p.add_argument("--video",type=Path,required=True)
    p.add_argument("--out",type=Path,required=True)
    p.add_argument("--count",type=int,default=10)
    p.add_argument("--require-silent",action="store_true")
    a=p.parse_args()
    r=build_report(a.video,a.out,a.count,a.require_silent)
    print(json.dumps({"status":r["status"],"media":r["media"],
        "errors":r["objective_errors"],"contact_sheet":r["contact_sheet"]},ensure_ascii=False))
    if r["objective_errors"]:raise SystemExit(1)

if __name__=="__main__":
    main()
