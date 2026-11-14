#!/usr/bin/env python3
"""Align exactly 13 validated World-Vision subtitle blocks to actual speech metadata.

Extracts script-locked caption strings directly from Remotion source.
Uses precise Microsoft WordBoundary offsets, not arbitrary EDL windows.
Outputs both SRT for accessibility and ASS for final 1080x1920 burned captions.
"""
import argparse,json,re,unicodedata
from pathlib import Path

def squash(s):
 s=unicodedata.normalize("NFKD",s.lower())
 return "".join(c for c in s if c.isalnum() and not unicodedata.combining(c))
def stamp(v,ass=False):
 v=max(0.,v)
 h=int(v//3600);m=int((v%3600)//60);s=v%60
 if ass:return f"{h}:{m:02d}:{s:05.2f}"
 return f"{h:02d}:{m:02d}:{int(s):02d},{int(round((s-int(s))*1000)):03d}"
def wrap(s,width=38):
 pieces=[];line=""
 for word in s.split():
  if line and len(line)+1+len(word)>width:
   pieces.append(line);line=word
  else:line=(line+" "+word).strip()
 if line:pieces.append(line)
 return pieces
def main():
 ap=argparse.ArgumentParser()
 ap.add_argument("--voice-json",type=Path,required=True)
 ap.add_argument("--component",type=Path,required=True)
 ap.add_argument("--output-stem",type=Path,required=True)
 a=ap.parse_args()
 voice=json.loads(a.voice_json.read_text())
 src=a.component.read_text()
 cues=[dict(provisional_start=float(x),provisional_end=float(y),text=z)
       for x,y,z in re.findall(r'\{start:([0-9.]+),end:([0-9.]+),t:"([^"]+)"\}',src)]
 if len(cues)!=13:raise RuntimeError("Expected exactly thirteen approved subtitle phrases")
 target=squash(" ".join(c["text"] for c in cues))
 chars=0
 for cue in cues:
  cue["at"]=chars
  chars+=len(squash(cue["text"]))
  cue["end_at"]=chars
 assert chars==len(target)
 # Validate that every speech boundary appears sequentially in unchanged script
 # including grouped numerals like "Jeudi 19 novembre".
 words=[]
 cursor=0
 for event in voice["word_boundaries"]:
  item=squash(event["text"])
  if not item:continue
  start=target.find(item,cursor)
  if start<0:
   raise RuntimeError(f"Speech metadata not consistent with exact script at {cursor}: {event['text']!r}")
  if start!=cursor:
   raise RuntimeError(f"Unmatched text between word events at {cursor},next {start}")
  end=start+len(item)
  words.append(dict(at=start,end_at=end,start=event["start"],end=event["end"],text=event["text"]))
  cursor=end
 if cursor!=len(target):
  raise RuntimeError("Audio missing end words in exact user-approved text")
 for cue in cues:
  associated=[w for w in words if w["at"]<cue["end_at"] and w["end_at"]>cue["at"]]
  if not associated:raise RuntimeError("No speech for caption "+cue["text"])
  cue["start"]=max(0.,associated[0]["start"]-.045)
  cue["end"]=min(43.,associated[-1]["end"]+.10)
 # No overlap. Preserve no captions in natural silence.
 for j in range(len(cues)-1):
  if cues[j]["end"]>=cues[j+1]["start"]:
   cues[j]["end"]=max(cues[j]["start"]+.07,cues[j+1]["start"]-.03)
 for cue in cues:
  assert 0<=cue["start"]<cue["end"]<=43.
 a.output_stem.parent.mkdir(parents=True,exist_ok=True)
 srt=[]
 for i,c in enumerate(cues):
  srt.append(f"{i+1}\n{stamp(c['start'])} --> {stamp(c['end'])}\n"
             +"\n".join(wrap(c["text"],38))+"\n")
 a.output_stem.with_suffix(".srt").write_text("\n".join(srt)+"\n",encoding="utf8")
 ass_header="""[Script Info]
Title: World-Vision #001 approved script word-synced
ScriptType: v4.00+
PlayResX: 1080
PlayResY: 1920
ScaledBorderAndShadow: yes
WrapStyle: 2

[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding
Style: News,Manrope,48,&H00FFFFFF,&H000000FF,&HBB081326,&H66031424,-1,0,0,0,100,100,0,0,1,3.0,0.4,2,110,110,265,1

[Events]
Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text
"""
 rows=[]
 for cue in cues:
  # The globe→city contains its own location title in the lower thirds:
  # during these shots put narration near top below the official logo.
  at=cue["provisional_start"]
  pos=r"{\an8\pos(540,292)}" if 4.5<=at<12.5 else r"{\an2\pos(540,1664)}"
  lines=[x.replace("{","").replace("}","") for x in wrap(cue["text"],34)]
  text=pos+r"\N".join(lines)
  rows.append(f"Dialogue: 0,{stamp(cue['start'],True)},{stamp(cue['end'],True)},News,,0,0,0,,{text}")
 a.output_stem.with_suffix(".ass").write_text(ass_header+"\n".join(rows)+"\n",encoding="utf8")
 audit={"id":"WorldVision001","script_verbatim":True,"speech_time_aligned":True,
        "voice_sha256":voice["sha256"],"cues":cues,
        "cue_count":len(cues),"captions_clean_plate":False,
        "usage":"Burn ONLY on assembled 43s master preview, never individual segment MP4s."}
 a.output_stem.with_suffix(".json").write_text(json.dumps(audit,ensure_ascii=False,indent=2)+"\n")
 print("Aligned "+str(len(cues))+" user-approved caption phrases to "+str(len(words))+" speech events")
if __name__=="__main__":
 main()
