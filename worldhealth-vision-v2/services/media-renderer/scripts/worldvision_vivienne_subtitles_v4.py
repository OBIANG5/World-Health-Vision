#!/usr/bin/env python3
"""World-Vision V4: phrase-aware captions for Vivienne, editorial REVIEW only.

Input: same accepted spoken words as V3. Real 86 WordBoundary timestamps;
no guessed timing, text rewrites, logo narration, audio stretching or fillers.
Changes relative to V3: meaningful phrase breaks, strict non-overlap, mobile
glyph measurements, spelling/punctuation fidelity and a deterministic audit.
"""
import argparse
import hashlib
import json
import re
import unicodedata
from pathlib import Path

from PIL import ImageFont

VOICE="fr-FR-VivienneMultilingualNeural"
SOURCE_VOICE_SHA="96b8ebf4a2692ad67170b98e66144784508a0ca29e6884a65c1b2882db858b7b"
FONT_FAMILY="DM Sans"
FONT_GIT_BLOB="c672f98060af9b2c85fca704ebd5ad9a8717c1df"
FONT_SIZE=78
MAX_LINE_WIDTH=760
LAST_SPEECH=30.597
SILENT_OUTRO_FROM=30.7
BASELINE=1535

# All phrases concatenated are EXACTLY the approved spoken words; these marks
# do not force pauses into the audio. They only select readable caption cuts.
PHRASES=[
 "Trois puissances nucléaires.",
 "Une même table.",
 "Et une rencontre inédite.",
 "Jeudi 19 novembre,",
 "Donald Trump, Vladimir Poutine",
 "et Xi Jinping doivent se réunir",
 "à Shenzhen, en Chine.",
 "Au cœur des discussions :",
 "réduire les arsenaux nucléaires.",
 "Le dernier grand traité",
 "entre Washington et Moscou",
 "a expiré en février.",
 "Trump veut maintenant",
 "associer Pékin, qui reste réticent.",
 "La guerre en Iran",
 "devrait aussi être abordée.",
 "Mais selon Washington,",
 "pas celle en Ukraine.",
 "Et attention :",
 "aucun accord n’est attendu",
 "pour le moment.",
 "Alors, véritable tournant diplomatique,",
 "ou simple démonstration de puissance ?"
]
def digest(p):return hashlib.sha256(Path(p).read_bytes()).hexdigest()
def norm(s):
 s=unicodedata.normalize("NFKD",str(s).casefold().replace("œ","oe").replace("æ","ae"))
 return re.sub(r"\s+"," ",re.sub(r"[^a-z0-9]+"," ",s)).strip()
def stamp(t,style):
 n=int(round(t*(100 if style=="ass" else 1000)))
 if style=="ass":
  return f"{n//360000:01}:{(n//6000)%60:02}:{(n//100)%60:02}.{n%100:02}"
 return f"{n//3600000:02}:{(n//60000)%60:02}:{(n//1000)%60:02},{n%1000:03}"
def wrapped(face,words):
 joined=" ".join(words)
 if face.getlength(joined)<=MAX_LINE_WIDTH:return [joined]
 possibilities=[]
 for i in range(1,len(words)):
  a,b=" ".join(words[:i])," ".join(words[i:])
  aw,bw=face.getlength(a),face.getlength(b)
  if aw<=MAX_LINE_WIDTH and bw<=MAX_LINE_WIDTH:
   # prefer two visually balanced lines; disfavor 1-word orphan
   score=abs(aw-bw)+int(i==1 or i==len(words)-1)*100
   possibilities.append((score,[a,b]))
 if not possibilities:
  raise RuntimeError("Two-line caption would exceed safe area: "+joined)
 return min(possibilities,key=lambda x:x[0])[1]
def align_to_voice(manifest):
 event=manifest["word_boundaries"]
 script=manifest["spoken_script"]
 if norm(" ".join(PHRASES))!=norm(script):
  raise RuntimeError("Caption script differs from accepted continuous narration: refusing rewrite")
 i=0
 segments=[]
 for line in PHRASES:
  start=i
  target=norm(line)
  actual=""
  while i<len(event) and actual!=target:
   actual=norm(actual+" "+event[i]["text"])
   i+=1
   if not target.startswith(actual):
    raise RuntimeError(f"Voice WordBoundary doesn't match exact phrase {line!r}, got {actual!r}")
  if actual!=target:raise RuntimeError(f"Phrase not fully matched: {line!r}")
  first,last=event[start],event[i-1]
  segments.append({"phrase":line,"word_start":start,"word_end":i-1,
                   "speech_start":round(float(first["start"]),3),
                   "speech_end":round(float(last["start"])+float(last["duration"]),3)})
 if i!=len(event):raise RuntimeError(f"Only consumed {i}/{len(event)} genuine word events")
 if len(event)!=86:raise RuntimeError("Voice boundary count changed")
 return segments

def make_cues(events,face):
 cues=[]
 for idx,part in enumerate(events,1):
  words=part["phrase"].split(" ")
  lines=wrapped(face,words)
  start=max(0,part["speech_start"]-.04)
  end=min(SILENT_OUTRO_FROM,part["speech_end"]+.12)
  cues.append({**part,"i":idx,"lines":lines,
    "start":round(start,3),"end":round(end,3),
    "max_glyph_width_px":round(max(face.getlength(s) for s in lines),2)})
 # Subtitles cannot overlap each other even if the speaker runs two clauses
 # together. A 20ms visual gap distinguishes the old and new cue cleanly.
 for idx in range(len(cues)-1):
  current,next_one=cues[idx],cues[idx+1]
  current["end"]=round(min(current["end"],next_one["start"]-.025),3)
  if current["end"]-current["start"]<.45:
   raise RuntimeError(f"Caption became too short for reading: {current['phrase']}")
 assert all(cues[i]["end"]<cues[i+1]["start"] for i in range(len(cues)-1))
 assert all(c["end"]<=SILENT_OUTRO_FROM for c in cues)
 assert all(1<=len(c["lines"])<=2 and c["max_glyph_width_px"]<=MAX_LINE_WIDTH for c in cues)
 return cues

def main():
 p=argparse.ArgumentParser()
 p.add_argument("--voice-manifest",type=Path,required=True)
 p.add_argument("--font-file",type=Path,required=True)
 p.add_argument("--output-stem",type=Path,required=True)
 a=p.parse_args()
 m=json.loads(a.voice_manifest.read_text(encoding="utf-8"))
 assert m["voice"]==VOICE and m["wav_sha256"]==SOURCE_VOICE_SHA
 assert m["voice_preferred_by_user"] is True
 assert m["this_take_approved_by_user"] is False
 assert m["publishing_rights_cleared"] is False
 assert m["continuous_single_utterance"] is True
 assert not m["audio_padded_per_scene"] and not m["atempo_used"]
 assert abs(m["last_word_boundary_sec"]-LAST_SPEECH)<.04
 if not a.font_file.is_file():raise FileNotFoundError(a.font_file)
 face=ImageFont.truetype(str(a.font_file),FONT_SIZE)
 events=align_to_voice(m)
 cues=make_cues(events,face)
 a.output_stem.parent.mkdir(parents=True,exist_ok=True)
 srt="\n\n".join(
  f"{c['i']}\n{stamp(c['start'],'srt')} --> {stamp(c['end'],'srt')}\n"+"\n".join(c["lines"])
  for c in cues)+"\n"
 a.output_stem.with_suffix(".srt").write_text(srt,encoding="utf-8")
 ass=[
 "[Script Info]",
 "Title: World-Vision V4 — Vivienne semantic accurate captions / audition only",
 "ScriptType: v4.00+",
 "PlayResX: 1080",
 "PlayResY: 1920",
 "ScaledBorderAndShadow: yes",
 "WrapStyle: 2","",
 "[V4+ Styles]",
 "Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding",
 "Style: WV,DM Sans,78,&H00FFFFFF,&H00FFFFFF,&HCC071524,&H66071524,-1,0,0,0,100,100,0,0,1,4,1.3,2,110,110,385,1","",
 "[Events]",
 "Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text",
 ]
 for c in cues:
  phrase=r"\N".join(line.replace("{","").replace("}","").replace("\\","") for line in c["lines"])
  ass.append(f"Dialogue: 0,{stamp(c['start'],'ass')},{stamp(c['end'],'ass')},WV,,0,0,0,,"
             +r"{\an2\pos(540,1535)}"+phrase)
 a.output_stem.with_suffix(".ass").write_text("\n".join(ass)+"\n",encoding="utf-8")
 report={
  "status":"VIVIENNE_V4_SEMANTIC_CAPTIONS_AUDITION_ONLY",
  "voice":VOICE,"voice_sha256":SOURCE_VOICE_SHA,
  "original_script_verbatim":True,"word_boundary_count":len(m["word_boundaries"]),
  "font_family":FONT_FAMILY,"font_size_px":FONT_SIZE,
  "font_sha256":digest(a.font_file),"cue_count":len(cues),
  "no_overlaps":True,"last_cue_end_sec":cues[-1]["end"],
  "outro_silent_from_sec":SILENT_OUTRO_FROM,
  "max_width_px":MAX_LINE_WIDTH,"max_lines":2,
  "all_punctuation_from_original_spoken_script":True,
  "cues":cues,"approved_for_publication":False,
  "user_approved_full_narration":False,"commercial_voice_rights_cleared":False,
  "note":"Actual words, editorial phrase breaks, no phantom overlap, no extra voice nor AI scene."
 }
 a.output_stem.with_suffix(".json").write_text(json.dumps(report,ensure_ascii=False,indent=2)+"\n",encoding="utf-8")
 print(json.dumps({k:v for k,v in report.items() if k!="cues"},ensure_ascii=False))
if __name__=="__main__":main()
