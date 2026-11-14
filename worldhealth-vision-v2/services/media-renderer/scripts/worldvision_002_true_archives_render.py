#!/usr/bin/env python3
"""WORLD-VISION / REPORTAGE 002 — authentic archive-first 17.1s documentary.

Purposefully NO cartoon reenactment, no topbar(), footer(), toy ships,
fake collision image, anonymous stock credits, or 720p authored canvas.
Every documentary clip is authentic US Coast Guard archival footage,
separately dated; it does NOT depict the Nov 13 2026 incident. These
restrictions are mandatory and visible in output.

Narration is the user's exact approved Vivienne C5.2 (14.088s) and
signature is the original eye/G0 steel-light outro (3.0s), both SHA-checked.
No copyrighted news footage is downloaded or reproduced.
"""
from __future__ import annotations
import argparse
import hashlib
import json
import math
import os
import shutil
import subprocess
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont

W,H,FPS=1080,1920,30
SCENES=[
 {"id":"01","source":"port_ship_source.mp4","start":10.2,"frames":105,
  "heading":["UN NAVIRE-CITERNE","HEURTE UN BATEAU"],"size":69,
  "highlight":1,"date":"Archives USCG · 2014", "focus":.51,
  "provenance_id":350155},
 {"id":"02","source":"river_aerial_source.mp4","start":12.0,"frames":111,
  "heading":["SUR LE MISSISSIPPI","LE BATEAU CHAVIRE"],"size":68,
  "highlight":1,"date":"Archives USCG · 2016", "focus":.54,
  "provenance_id":445860},
 {"id":"03","source":"tanker_context_source.mp4","start":43.0,"frames":135,
  "heading":["32","PERSONNES HOSPITALISÉES"],"size":64,
  "highlight":0,"date":"Archives USCG · autre opération, 2022", "focus":.58,
  "provenance_id":869071},
 {"id":"04","source":"river_aerial_source.mp4","start":22.0,"frames":72,
  "heading":["COMMENT CET ACCIDENT","A-T-IL PU SE PRODUIRE ?"],"size":63,
  "highlight":1,"date":"Archives USCG · 2016", "focus":.53,
  "provenance_id":445860}
]
VOICE_BLOB="cd2254c1557b815fd63a4861af9086d26d960da6"
OUTRO_BLOB="7ba4e883c68704ba457c484f2d1bbf7d3e3f956d"
FONT_DIRS=["/usr/share/fonts/truetype/inter","/usr/share/fonts/opentype/inter",
  "/usr/share/fonts/truetype/dejavu"]
FONT_BOLD=["Inter-Bold.otf","InterDisplay-Bold.otf","Inter-Bold.ttf","DejaVuSans-Bold.ttf"]
FONT_MED=["Inter-Medium.otf","InterDisplay-Medium.otf","Inter-Medium.ttf","DejaVuSans.ttf"]
WHITE=(245,248,250,255)
ICE=(143,219,234,255)
DARK=(3,13,25)

def run(cmd,timeout=180):
 p=subprocess.run([str(x) for x in cmd],text=True,capture_output=True,timeout=timeout)
 if p.returncode:
  raise RuntimeError("FFmpeg or verification failed: "+repr(cmd[:5])+" "+p.stderr[-1700:])
 return p.stdout

def font(size,bold=True):
 for base in FONT_DIRS:
  for name in (FONT_BOLD if bold else FONT_MED):
   fp=Path(base)/name
   if fp.exists():return ImageFont.truetype(str(fp),size)
 raise RuntimeError("No eligible professional typeface installed.")

def gradient_mask(dest,height=1250):
 im=Image.new("L",(W,height))
 px=im.load()
 for y in range(height):
  # Large smooth blend between full-frame defocused footage and sharp
  # footage, rather than a framed card or black upper/lower bar.
  v=min(1,y/160,(height-1-y)/170)
  v=max(0,min(1,v))
  alpha=round(255*v*v*(3-2*v))
  for x in range(W):px[x,y]=alpha
 im.save(dest)

def overlay_scene(dest,scene):
 im=Image.new("RGBA",(W,H),(0,0,0,0))
 d=ImageDraw.Draw(im,"RGBA")
 # No horizontal header, footer, decorative pill, watermark or 'location'
 # card. Background is a continuation of the video frame.
 x=79
 if scene["id"]=="03":
  d.text((x,208),"32",font=font(268),fill=ICE,
       stroke_width=1,stroke_fill=(2,15,30,140))
  d.text((x+7,512),"PERSONNES",font=font(66),fill=WHITE)
  d.text((x+7,602),"HOSPITALISÉES",font=font(66),fill=WHITE)
 else:
  y=218
  for i,line in enumerate(scene["heading"]):
   f=font(scene["size"])
   if d.textbbox((0,0),line,font=f)[2]>W-160:
    raise RuntimeError("Headline exceeds on-screen safe area: "+line)
   d.text((x,y+i*90),line,font=f,
          fill=ICE if i==scene["highlight"] else WHITE,
          stroke_width=1,stroke_fill=(2,15,30,130))
 # Provenance is disclosed *on the footage* without a repeated banner.
 # It is a single small line; we do not pretend it is today's incident.
 d.text((x,1545),scene["date"],font=font(29,bold=False),
        fill=(227,241,249,226),stroke_width=1,
        stroke_fill=(7,20,33,200))
 im.save(dest)

def scene_movie(src,scene,work,mask):
 n=scene["frames"]
 clip=work/("scene_"+scene["id"]+".mp4")
 png=work/("overlay_"+scene["id"]+".png")
 overlay_scene(png,scene)
 # Avoid reference to old 720px raster renderer. Native sharp canvas 1080x1920.
 # TWO uses of the same authentic film: deep blurred environmental background
 # + central high-detail shot feathered into the background. No toy vessels.
 # The 2014 Coast Guard clip contains large editorial credits at the bottom;
 # crop the upper 70% before compositing, not by hiding names with fake stickers.
 source_pre="[0:v]fps=30"+(",crop=iw:ih*0.70:0:0" if scene["id"]=="01" else "")+",split=2[a][b];"
 filt=(
  source_pre
  "[a]scale=1080:1920:force_original_aspect_ratio=increase,"
  "crop=1080:1920,gblur=sigma=34,"
  "eq=brightness=-0.17:contrast=1.10:saturation=0.67[bg];"
  "[b]scale=-2:1250,crop=1080:1250:x=(iw-1080)*"+str(scene["focus"])+":y=0,"
  "eq=brightness=-0.025:contrast=1.055:saturation=0.91[fg];"
  "[1:v]format=gray,scale=1080:1250[alpha];"
  "[fg][alpha]alphamerge[sharp];"
  "[bg][sharp]overlay=x=0:y=385:format=auto[composite];"
  "[2:v]format=rgba,fade=t=in:st=0:d=0.22:alpha=1[words];"
  "[composite][words]overlay=x=0:y=0:format=auto:shortest=1,"
  "format=yuv420p[v]"
 )
 run(["ffmpeg","-y","-hide_banner","-loglevel","error",
      "-ss",str(scene["start"]),"-i",str(src),
      "-loop","1","-framerate","30","-i",str(mask),
      "-loop","1","-framerate","30","-i",str(png),
      "-filter_complex",filt,"-map","[v]","-frames:v",n,"-r","30",
      "-an","-c:v","libx264","-preset","veryfast","-crf","20",
      "-pix_fmt","yuv420p",str(clip)],timeout=260)
 return clip

def file_probe(path):
 return json.loads(run(["ffprobe","-v","error","-show_streams",
   "-show_format","-of","json",str(path)]))

def main():
 parser=argparse.ArgumentParser()
 parser.add_argument("--assets",required=True,type=Path)
 parser.add_argument("--voice",required=True,type=Path)
 parser.add_argument("--outro",required=True,type=Path)
 parser.add_argument("--out",required=True,type=Path)
 parser.add_argument("--work",required=True,type=Path)
 parser.add_argument("--skip-git-check",action="store_true")
 a=parser.parse_args()
 for p in (a.assets,a.voice,a.outro):
  if not p.exists():raise FileNotFoundError(p)
 a.work.mkdir(parents=True,exist_ok=True)
 a.out.parent.mkdir(parents=True,exist_ok=True)
 if not a.skip_git_check:
  for p,expected in ((a.voice,VOICE_BLOB),(a.outro,OUTRO_BLOB)):
   sha=run(["git","hash-object",str(p)]).strip()
   if sha!=expected:raise ValueError("CRITICAL: user-approved binary changed: "+p.name)
 manifest=json.loads((a.assets/"archival-assets-manifest.json").read_text())
 allowed={r["id"] for r in manifest if r["result"]=="OK" and r["public_domain_mark_verified"]}
 if not {350155,445860,869071}.issubset(allowed):
  raise RuntimeError("Refusing montage: official public-domain provenance has not passed.")
 if sum(s["frames"] for s in SCENES)!=423:
  raise RuntimeError("The narration's 14.1s 423-frame timeline was altered.")
 mask=a.work/"soft-blend-mask.png"
 gradient_mask(mask)
 rendered=[]
 for s in SCENES:
  print("RENDER",s["id"],s["heading"],flush=True)
  rendered.append(scene_movie(a.assets/s["source"],s,a.work,mask))
 # Concat same-codec 1080x1920 video, 30 fps, no audio to preserve exact
 # narration without per-phrase splicing. Avoid any seconds of filler.
 concat=a.work/"story-list.txt"
 concat.write_text("".join("file '"+str(p.resolve())+"'\n" for p in rendered))
 story=a.work/"story-only-14s.mp4"
 run(["ffmpeg","-y","-hide_banner","-loglevel","error",
      "-f","concat","-safe","0","-i",str(concat),
      "-c","copy","-an",str(story)],timeout=80)
 # IMPORTANT: the approved outro H.264 stream uses different codec
 # parameter sets. Concatenating with `-c copy` silently produced a file
 # with only 423 video frames, 14.1s, despite an advertised 17.1s container!
 # Decode, concatenate, and REENCODE to enforce exactly 513 frames.
 silent=a.work/"full-silent.mp4"
 run(["ffmpeg","-y","-hide_banner","-loglevel","error",
      "-i",str(story),"-i",str(a.outro),
      "-filter_complex",
      "[0:v]fps=30,format=yuv420p,setpts=PTS-STARTPTS[a];"
      "[1:v]fps=30,format=yuv420p,setpts=PTS-STARTPTS[b];"
      "[a][b]concat=n=2:v=1:a=0,format=yuv420p[v]",
      "-map","[v]","-frames:v","513","-r","30","-an",
      "-c:v","libx264","-preset","veryfast","-crf","19",
      "-pix_fmt","yuv420p",str(silent)],timeout=280)
 # Voice original MP3 exactly — do not synthesize or time-stretch.
 run(["ffmpeg","-y","-hide_banner","-loglevel","error","-i",str(silent),
      "-i",str(a.voice),
      "-filter_complex","[1:a]apad=pad_dur=3.1[a]",
      "-map","0:v:0","-map","[a]","-t","17.1","-c:v","copy",
      "-c:a","aac","-b:a","192k","-ar","48000",
      "-movflags","+faststart","-pix_fmt","yuv420p",str(a.out)],timeout=120)
 actual=file_probe(a.out)
 video=next(s for s in actual["streams"] if s["codec_type"]=="video")
 audio=next(s for s in actual["streams"] if s["codec_type"]=="audio")
 duration=float(actual["format"]["duration"])
 vd=float(video.get("duration") or 0)
 nf=int(video.get("nb_frames") or 0)
 if ((video["width"],video["height"])!=(W,H) or abs(duration-17.1)>.035
      or abs(vd-17.1)>.035 or nf!=513):
  raise RuntimeError(
    f"CRITICAL FINAL QA: expected 513 VIDEO frames and 17.1 VIDEO seconds, "
    f"got frames={nf}, video duration={vd}, container duration={duration}"
  )
 # Chroma safe, avoids media files appearing "impossible de lire" on iOS.
 if not video["codec_name"]=="h264" or not audio["codec_name"]=="aac":
  raise RuntimeError("Mobile incompatibility: require H.264/AAC.")
 r={
   "status":"COMPLETE_PREVIEW_NOT_AUTOMATICALLY_PUBLISHABLE",
   "video_path":str(a.out),"bytes":a.out.stat().st_size,
   "sha256":hashlib.sha256(a.out.read_bytes()).hexdigest(),
   "duration_sec":duration,"width":video["width"],"height":video["height"],
   "frames_expected":513,"fps":30,
   "voice":"exact user-selected Vivienne C5.2 Impact média",
   "voice_duration":14.088,
   "outro":"original approved G0 graphite / steel-light 3 sec",
   "outro_has_narration":False,
   "all_shots_are_actual_2026_collision":False,
   "real_official_footage_only":True,
   "footage_type":"2014/2016/2022 USCG ARCHIVE, explicitly labelled in each shot",
   "publishing_rights_of_voice_verified":False,
   "provenance":manifest,
   "video_visual_quality_approved_by_user":False,
   "no_caricatured_ships":True,"no_generic_header_footer":True,
   "subtitle_overlay":False,
   "note":"This film uses honest historical imagery, NOT the actual impact. User must judge aesthetics. Audio Edge commercial terms still require verification."
 }
 (a.out.parent/"DELIVERY_AUDIT.json").write_text(json.dumps(r,ensure_ascii=False,indent=2)+"\n")
 print(json.dumps({k:r[k] for k in
   ("status","video_path","bytes","duration_sec","width","height","sha256")},ensure_ascii=False))
if __name__=="__main__":
 main()
