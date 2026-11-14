#!/usr/bin/env python3
"""Acquire only official DVIDS government footage individually marked PUBLIC DOMAIN.

Never acquire the commercial bystander video of the actual 13 Nov collision.
Files below are historical, contextual archival images ONLY. Every extracted
clip carries date/source metadata, must be labelled as ARCHIVES in the film.
"""
from __future__ import annotations
import json
import re
import subprocess
import sys
from pathlib import Path
import requests

SOURCES=[
 {"id":445860,"date":"2016-01-11","where":"Mississippi near Baton Rouge, Louisiana",
  "role":"Mississippi aerial", "suffix":"river_aerial"},
 {"id":350155,"date":"2014-07-10","where":"Port of New Orleans",
  "role":"Maritime commercial ship inspection", "suffix":"port_ship"},
 {"id":869071,"date":"2022-12-20","where":"Southwest Pass, Louisiana",
  "role":"Coast Guard tanker medevac (separate event!)", "suffix":"tanker_context"},
]
def run(argv,timeout=220):
 p=subprocess.run(argv,text=True,capture_output=True,timeout=timeout)
 if p.returncode:raise RuntimeError("command failed: "+repr(argv[:5])+" "+p.stderr[-1000:])
 return p.stdout

def main(dest):
 dest.mkdir(parents=True,exist_ok=True)
 manifest=[]
 for info in SOURCES:
  id=info["id"]
  url=f"https://www.dvidshub.net/video/{id}"
  print("Fetching official DVIDS",id,flush=True)
  try:
   response=requests.get(url,headers={"User-Agent":"Mozilla/5.0"},timeout=18)
   response.raise_for_status()
   if not re.search(r"PUBLIC DOMAIN",response.text,re.I):
    raise RuntimeError("DVIDS public-domain mark absent; skipping")
   asset=dest/(info["suffix"]+"_source.mp4")
   run(["yt-dlp","--no-playlist","--socket-timeout","12","--retries","2",
        "-f","best[height<=1080]/best",
        "--merge-output-format","mp4","-o",str(asset),url],timeout=300)
   if not asset.exists() or asset.stat().st_size<40000:raise RuntimeError("Empty video")
   metadata=json.loads(run(["ffprobe","-v","error","-show_streams","-show_format",
        "-of","json",str(asset)]))
   v=next(s for s in metadata["streams"] if s["codec_type"]=="video")
   # Create small decoder-friendly review strip; not the final creative cut.
   proxy=dest/(info["suffix"]+"_review.mp4")
   run(["ffmpeg","-y","-hide_banner","-loglevel","error","-i",str(asset),
        "-t","18","-an","-vf","fps=15,scale=960:-2",
        "-c:v","libx264","-preset","veryfast","-crf","26","-pix_fmt","yuv420p",
        str(proxy)],timeout=200)
   # Sample actual first 17s in a compact contact sheet via tile, not fabricated images
   contact=dest/(info["suffix"]+"_contact.jpg")
   run(["ffmpeg","-y","-hide_banner","-loglevel","error","-i",str(proxy),
      "-vf","fps=1/3,scale=320:-1,tile=3x2:margin=8:padding=7",
      "-frames:v","1",str(contact)],timeout=120)
   rec={**info,"official_page":url,"public_domain_mark_verified":True,
        "resolution":[v.get("width"),v.get("height")],
        "duration":float(metadata["format"]["duration"]),
        "raw_bytes":asset.stat().st_size,
        "review_clip":proxy.name,"contact_sheet":contact.name,
        "source_date_must_be_on_screen":True,
        "is_actual_2026_collision_footage":False,"result":"OK"}
  except Exception as exc:
   rec={**info,"official_page":url,"result":"FAIL","reason":str(exc)[:360],
         "public_domain_mark_verified":False}
   print("SKIP",id,str(exc)[:150],flush=True)
  manifest.append(rec)
 (dest/"archival-assets-manifest.json").write_text(
  json.dumps(manifest,ensure_ascii=False,indent=2)+"\n",encoding="utf8")
 print(json.dumps([{k:v for k,v in i.items() if k in
   ("id","result","resolution","duration","raw_bytes","reason")} for i in manifest],indent=2))
 if sum(x["result"]=="OK" for x in manifest)<2:
  raise SystemExit("Need at least two authentic public-domain video assets. No simulated collision fallback.")
if __name__=="__main__":
 main(Path(sys.argv[1]))
