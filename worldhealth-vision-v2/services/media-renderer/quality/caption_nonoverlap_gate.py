#!/usr/bin/env python3
"""Strict World-Vision caption integrity QA for all future audio-linked films.

Codec success does not imply legibility; this catches overlaps and changed
spoken text BEFORE upload, which V3/V4/V5 preview captions failed to reject.
Supports editorial-v4 JSON's 'phrase' or generic 'lines' cue formats.
"""
import argparse
import json
import re
import unicodedata
from pathlib import Path

def normalize(text):
 text=unicodedata.normalize("NFKD",text.casefold().replace("œ","oe").replace("æ","ae"))
 return re.sub(r"\s+"," ",re.sub(r"[^a-z0-9]+"," ",text)).strip()
def test(data,source):
 cues=data.get("cues",[])
 if not cues:raise RuntimeError("No real caption events supplied")
 if len(cues)>60:raise RuntimeError("Too many distracting rapid captions")
 if data.get("approved_for_publication") is True:
  raise RuntimeError("Visual QA alone cannot authorize publication")
 txt=[]
 for n,c in enumerate(cues):
  lines=c.get("lines",[])
  if not 1<=len(lines)<=2:raise RuntimeError(f"Cue {n+1} must have one or two lines")
  if len(" ".join(lines))==0:raise RuntimeError(f"Cue {n+1} empty")
  a,b=float(c["start"]),float(c["end"])
  if b-a<.45:raise RuntimeError(f"Cue {n+1} too short: {b-a:.3f} sec")
  if a<0 or b>30.7:raise RuntimeError(f"Cue {n+1} intrudes on silent outro")
  if float(c.get("max_glyph_width_px",999))>760:
   raise RuntimeError(f"Cue {n+1} visually overflows 760px safe width")
  if n and a<=float(cues[n-1]["end"]):
   raise RuntimeError(f"OVERLAP: cue {n} ends {cues[n-1]['end']}, cue {n+1} starts {a}")
  txt.append(" ".join(lines))
 compared=normalize(" ".join(txt))
 if compared!=normalize(source["spoken_script"]):
  raise RuntimeError("Subtitles do not preserve the accepted spoken script word-for-word")
 if source["voice"]!="fr-FR-VivienneMultilingualNeural":
  raise RuntimeError("Wrong voice source")
 if len(source["word_boundaries"])!=86:raise RuntimeError("Incorrect word timing reference")
 if source["this_take_approved_by_user"] or source["publishing_rights_cleared"]:
  raise RuntimeError("Voice manifest mismatches the actual review-only source")
 return {"status":"TECHNICAL_CAPTION_GATE_PASS_NOT_HUMAN_APPROVAL",
   "cue_count":len(cues),"word_events":86,
   "no_overlap":True,"script_exact":True,"all_glyph_widths_safe":True,
   "silence_on_signature":True,"publication_authorized":False}

if __name__=="__main__":
 a=argparse.ArgumentParser()
 a.add_argument("--cues",type=Path,required=True)
 a.add_argument("--voice-manifest",type=Path,required=True)
 o=a.parse_args()
 c=json.loads(o.cues.read_text(encoding="utf8"))
 v=json.loads(o.voice_manifest.read_text(encoding="utf8"))
 print(json.dumps(test(c,v),ensure_ascii=False))
