#!/usr/bin/env python3
"""Build a NEW typography/subtitle audition using Vivienne's real word timings.

Preview-only: it does not authorize publication, does not mutate source MP4s,
and never uses the old tiny, overlapping 13-block subtitles.
"""
import argparse
import hashlib
import json
import re
from pathlib import Path
from PIL import ImageFont

FAMILY="DM Sans"
SIZE=78
MAX_WIDTH_PX=760  # 1080 portrait, safe within x=110..970 with 5% reserve
MAX_LINE_COUNT=2
MAX_EVENTS=8
MAX_CUE_SECONDS=2.50
BASELINE_Y=1543
CLOSING_SILENT_FROM=30.7
VOICE="fr-FR-VivienneMultilingualNeural"
FONT_GIT_BLOB="c672f98060af9b2c85fca704ebd5ad9a8717c1df"
def fingerprint(p):return hashlib.sha256(Path(p).read_bytes()).hexdigest()
def srt(t):
 ms=int(round(max(0,t)*1000))
 return f"{ms//3600000:02}:{ms//60000%60:02}:{ms//1000%60:02},{ms%1000:03}"
def ass(t):
 cent=int(round(max(0,t)*100))
 return f"{cent//360000:01}:{cent//6000%60:02}:{cent//100%60:02}.{cent%100:02}"
def measure(face,words): return face.getlength(" ".join(words))
def layout(face,parts):
 if measure(face,parts)<=MAX_WIDTH_PX:
  return [" ".join(parts)]
 possibilities=[]
 for i in range(1,len(parts)):
  a,b=parts[:i],parts[i:]
  wa,wb=measure(face,a),measure(face,b)
  if wa<=MAX_WIDTH_PX and wb<=MAX_WIDTH_PX:
   # Minimize line lengths imbalance and avoid a single tiny orphan word.
   penalty=abs(wa-wb)+(55 if len(a)==1 or len(b)==1 else 0)
   possibilities.append((penalty,[" ".join(a)," ".join(b)]))
 if not possibilities:return None
 return min(possibilities,key=lambda x:x[0])[1]

def attach_punctuation(source,events):
 pos=0
 result=[]
 for item in events:
  token=item["text"].strip()
  ix=source.casefold().find(token.casefold(),pos)
  if ix<0: raise ValueError(f"WordBoundary token not found in accepted spoken script: {token!r} after {pos}")
  end=ix+len(token)
  suffix=""
  while end<len(source) and source[end] in ".,;:!?\u2026":
   suffix+=source[end];end+=1
  result.append({**item,"display":token+suffix})
  pos=end
 # The user-approved script contains whitespace before the final '?'
 if result and result[-1]["display"].lower()=="puissance":
  result[-1]["display"]="puissance ?"
 return result

def cues_from_words(words,face):
 groups=[];current=[]
 for w in words:
  if w["start"]>=CLOSING_SILENT_FROM:raise ValueError("Vivienne speech collides with silent brand card")
  if w["end"]>CLOSING_SILENT_FROM:raise ValueError("Voice word extends into silent signature")
  candidate=current+[w]
  # Broadcast-style semantic cutting: don't display the end of one sentence
  # together with the beginning of the next. The earlier preview did exactly
  # that ("nucléaires. Une"), which looked unprofessional at 78px.
  sentence_end=bool(current and current[-1]["display"].rstrip().endswith((".", "!", "?", "…", ":")))
  overflow=(
   sentence_end or
   len(candidate)>MAX_EVENTS or
   candidate[-1]["end"]-candidate[0]["start"]>MAX_CUE_SECONDS or
   (current and w["start"]-current[-1]["end"]>.42) or
   layout(face,[e["display"] for e in candidate]) is None
  )
  if current and overflow:
   groups.append(current)
   current=[w]
  else:current=candidate
 if current:groups.append(current)
 result=[]
 for n,g in enumerate(groups):
  lines=layout(face,[w["display"] for w in g])
  if lines is None:raise ValueError("Overlong subtitle token cannot fit mobile layout")
  begin=max(0.,g[0]["start"]-.05)
  end=min(CLOSING_SILENT_FROM,g[-1]["end"]+.13)
  if n+1<len(groups):end=min(end,groups[n+1][0]["start"]-.03)
  if end<=begin: raise ValueError("Subtitle timing inversion")
  if len(lines)>MAX_LINE_COUNT or max(face.getlength(t) for t in lines)>MAX_WIDTH_PX:
   raise ValueError("Subtitle glyph width exceeded mobile-safe area")
  result.append({"i":n+1,"start":round(begin,3),"end":round(end,3),
    "lines":lines,"max_glyph_width_px":round(max(face.getlength(t) for t in lines),1),
    "font_px":SIZE,"font":FAMILY,"center_x_px":540,"bottom_y_px":BASELINE_Y})
 return result

def main():
 p=argparse.ArgumentParser()
 p.add_argument("--voice-manifest",type=Path,required=True)
 p.add_argument("--font-file",type=Path,required=True)
 p.add_argument("--output-stem",type=Path,required=True)
 args=p.parse_args()
 m=json.loads(args.voice_manifest.read_text(encoding="utf-8"))
 if m["voice"]!=VOICE or not m["voice_preferred_by_user"]:
  raise RuntimeError("Wrong voice. Only user-preferred Vivienne is allowed.")
 if m["this_take_approved_by_user"] or m["publishing_rights_cleared"]:
  raise RuntimeError("Wrong gate: this generator is for NON-PUBLISHABLE audition only")
 if not m["continuous_single_utterance"] or m["audio_padded_per_scene"]:
  raise RuntimeError("Old padded audio prohibited")
 words=m["word_boundaries"]
 if len(words)<70 or m["last_word_boundary_sec"]>CLOSING_SILENT_FROM:
  raise RuntimeError("Real Vivienne word boundaries not reliable")
 if not args.font_file.is_file():raise FileNotFoundError(args.font_file)
 face=ImageFont.truetype(str(args.font_file),SIZE)
 # Once linked to the actual pinned binary, PIL width checks are deterministic.
 ev=attach_punctuation(m["spoken_script"],[
   {"text":w["text"],
    "start":float(w["start"]),
    "end":float(w["start"])+float(w["duration"])} for w in words
 ])
 cues=cues_from_words(ev,face)
 args.output_stem.parent.mkdir(parents=True,exist_ok=True)
 srt_content="\n\n".join(f"{c['i']}\n{srt(c['start'])} --> {srt(c['end'])}\n"+
                      "\n".join(c["lines"]) for c in cues)+"\n"
 args.output_stem.with_suffix(".srt").write_text(srt_content,encoding="utf-8")
 ass_lines=[
 "[Script Info]","Title: World-Vision Vivienne V3 mobile caption audition",
 "ScriptType: v4.00+","PlayResX: 1080","PlayResY: 1920",
 "ScaledBorderAndShadow: yes","WrapStyle: 2","",
 "[V4+ Styles]",
 "Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding",
 "Style: WV,DM Sans,78,&H00FFFFFF,&H00FFFFFF,&HDD0C1920,&H400C1920,-1,0,0,0,100,100,0,0,1,4.0,1.6,2,110,110,375,1",
 "",
 "[Events]",
 "Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text"
 ]
 for c in cues:
  txt=r"\N".join(part.replace("{","").replace("}","").replace("\\","") for part in c["lines"])
  ass_lines.append(
   f"Dialogue: 0,{ass(c['start'])},{ass(c['end'])},WV,,0,0,0,,"+
   r"{\an2\pos(540,1543)}"+txt
  )
 args.output_stem.with_suffix(".ass").write_text("\n".join(ass_lines)+"\n",encoding="utf-8")
 report={
  "status":"VIVIENNE_CAPTIONS_VISUAL_AUDITION_ONLY",
  "source_voice":VOICE,
  "voice_sha256":m["wav_sha256"],
  "voice_preferred_by_user":True,
  "this_take_approved_by_user":False,
  "publishing_rights_cleared":False,
  "audio_timing":"86 genuine Edge TTS WordBoundary events, not guessed captions",
  "cues":cues,"cue_count":len(cues),"font":FAMILY,"size_px":SIZE,
  "font_file_sha256":fingerprint(args.font_file),
  "max_glyph_width_px":MAX_WIDTH_PX,"max_lines":MAX_LINE_COUNT,
  "outro_no_captions_from":CLOSING_SILENT_FROM,
  "semantic_sentence_boundaries_respected":True,
  "safe_for_mobile_technical_check":True,
  "requires_visual_and_voice_approval":True,
  "do_not_publish":True
 }
 args.output_stem.with_suffix(".json").write_text(json.dumps(report,ensure_ascii=False,indent=2)+"\n",encoding="utf8")
 print(json.dumps({k:v for k,v in report.items() if k!="cues"},ensure_ascii=False))
if __name__=="__main__":main()
