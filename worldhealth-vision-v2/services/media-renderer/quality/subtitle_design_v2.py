#!/usr/bin/env python3
"""Editorial subtitles v2, only AFTER an independently approved human/natural voice.

This deliberately refuses the former Edge Henri voice and old 13 tiny captions.
The output is ASS/SRT. Source segment MP4s remain untouched.
"""
import argparse,json,re,unicodedata
from pathlib import Path

HERE=Path(__file__).resolve().parent
CONTRACT=json.loads((HERE/"production_contract_v2.json").read_text(encoding="utf-8"))
FONT="DM Sans"
STYLE_SIZE=78
MAX_CHARS=29
MAX_WORDS=8
MAX_SECONDS=2.65
SCREEN_BOTTOM=1535

def clean(s):
 s=unicodedata.normalize("NFKD",s.lower())
 return "".join(ch for ch in s if ch.isalnum() and not unicodedata.combining(ch))
def stamp(t,ass=False):
 t=max(0,t)
 h=int(t//3600);m=int(t//60)%60;sec=int(t)%60
 ms=round((t-int(t))*1000)
 if ms==1000:sec+=1;ms=0
 if ass:return f"{h}:{m:02}:{sec:02}.{int(round(ms/10)):02}"
 return f"{h:02}:{m:02}:{sec:02},{ms:03}"
def wrap(words):
 # Balanced 2-line splitting, no one-word orphan, no line >29 characters.
 whole=" ".join(words)
 if len(whole)<=MAX_CHARS:return [whole]
 options=[]
 for i in range(2,len(words)-1):
  a=" ".join(words[:i]);b=" ".join(words[i:])
  if len(a)<=MAX_CHARS and len(b)<=MAX_CHARS:
   options.append((abs(len(a)-len(b)),[a,b]))
 if not options:raise RuntimeError("Subtitle phrase too long, must split into smaller cues: "+whole)
 return min(options,key=lambda x:x[0])[1]
def make_cues(word_events):
 cues=[];active=[]
 for idx,w in enumerate(word_events):
  if w["start"]>=39.1:break
  if w["end"]>39.1:raise RuntimeError("Voice exceeds start of silent visual signature")
  txt=w["text"].strip()
  if not txt:continue
  candidate=active+[w]
  length=len(" ".join(z["text"].strip() for z in candidate))
  timed=candidate[-1]["end"]-candidate[0]["start"]
  longgap=bool(active and w["start"]-active[-1]["end"]>=.40)
  if active and (length>2*MAX_CHARS-6 or len(candidate)>MAX_WORDS
                 or timed>MAX_SECONDS or longgap):
   cues.append(active)
   active=[w]
  else:
   active=candidate
 if active:cues.append(active)
 # Strict readability constraints, not just codec completion.
 out=[]
 for n,words in enumerate(cues):
  for w in words:
   if len(w["text"])>MAX_CHARS:
    raise RuntimeError("Abnormally long speech word: "+w["text"])
  lines=wrap([w["text"].strip() for w in words])
  start=max(0.,words[0]["start"]-.06)
  end=min(39.10,words[-1]["end"]+.11)
  if n+1<len(cues):
   end=min(end,cues[n+1][0]["start"]-.04)
  if end<=start:raise RuntimeError("Invalid subtitle duration")
  out.append({"id":n+1,"start":round(start,3),"end":round(end,3),
              "lines":lines,"font":FONT,"font_px":STYLE_SIZE,"bottom_y_px":SCREEN_BOTTOM,
              "safe_for_mobile":True})
 return out
def main():
 p=argparse.ArgumentParser()
 p.add_argument("--voice-manifest",type=Path,required=True)
 p.add_argument("--output-stem",type=Path,required=True)
 args=p.parse_args()
 v=json.loads(args.voice_manifest.read_text(encoding="utf-8"))
 if v.get("voice")=="fr-FR-HenriNeural" or v.get("sha256")==CONTRACT["audio"]["rejected_voice_sha256"]:
  raise RuntimeError("Rejected robotic narrator cannot be used for V2 subtitles.")
 if not v.get("approved_by_user"):
  raise RuntimeError("No human-approved voice. Do not bake V2 captions.")
 if v.get("audio_padded_per_scene"):
  raise RuntimeError("Per-scene TTS apad/atrim is not allowed.")
 words=v.get("word_boundaries",[])
 if len(words)<40:raise RuntimeError("Missing precise speech word alignment.")
 cues=make_cues(words)
 assert all(len(c["lines"])<=2 and max(map(len,c["lines"]))<=MAX_CHARS for c in cues)
 assert all(1300<=c["bottom_y_px"]<=1565 and c["font_px"]>=70 for c in cues)
 args.output_stem.parent.mkdir(parents=True,exist_ok=True)
 srt=[]
 for c in cues:
  srt.append(f"{c['id']}\n{stamp(c['start'])} --> {stamp(c['end'])}\n"+
             "\n".join(c["lines"])+"\n")
 args.output_stem.with_suffix(".srt").write_text("\n".join(srt),encoding="utf-8")
 ass="""[Script Info]
Title: World-Vision editorial V2 subtitles
ScriptType: v4.00+
PlayResX: 1080
PlayResY: 1920
ScaledBorderAndShadow: yes
WrapStyle: 2

[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding
Style: World,DM Sans,78,&H00FFFFFF,&H00FFFFFF,&HCC071524,&H66071524,-1,0,0,0,100,100,0,0,1,4,1.3,2,110,110,370,1

[Events]
Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text
"""
 for c in cues:
  ass+=("Dialogue: 0,"+stamp(c["start"],True)+","+stamp(c["end"],True)+
        ",World,,0,0,0,,{\\an2\\pos(540,1535)}" +
        r"\N".join(x.replace("{","").replace("}","") for x in c["lines"])+"\n")
 args.output_stem.with_suffix(".ass").write_text(ass,encoding="utf-8")
 report={"status":"VOICE_APPROVED_CAPTIONS_TECHNICAL_READY_ONLY",
         "speaker_approved":True,"font":FONT,"font_px":STYLE_SIZE,
         "cues":cues,"max_lines":2,"max_line_chars":29,"mobile_safe_bottom_px":355,
         "source_voice_sha256":v.get("sha256"),
         "outro_has_no_captions":True,"requires_visual_review":True}
 args.output_stem.with_suffix(".json").write_text(json.dumps(report,ensure_ascii=False,indent=2)+"\n")
 print(f"Generated {len(cues)} readable 2-line maximum subtitles for an approved voice.")
if __name__=="__main__":main()
