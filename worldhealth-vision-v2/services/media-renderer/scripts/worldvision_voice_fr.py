#!/usr/bin/env python3
"""World-Vision #001 — authentic French neural narration, segment-locked 43 sec.

Editorial script text is compared byte-normalized with accepted SCRIPT_V1.md.
Never synthesize a named leader's voice; use generic Microsoft neural French.
Audio is a REVIEW candidate pending human acceptance; never mark published.
"""
import asyncio,hashlib,json,math,re,subprocess,sys
from pathlib import Path
import edge_tts

ROOT=Path(__file__).resolve().parents[3]
SCRIPT=ROOT/"docs/media/episodes/2026-11-14_trump_xi_putin_shenzhen/SCRIPT_V1.md"
OUT=Path(__file__).resolve().parents[1]/"output/summit-2026/voice"
OUT.mkdir(parents=True,exist_ok=True)
VOICE="fr-FR-HenriNeural"
# These 7 contiguous groups reproduce the accepted French script exactly,
# without adding or removing any words or punctuation.
LINES=[
 ("B01",0.,4.5,"+12%","Trois puissances nucléaires. Une même table. Et une rencontre inédite."),
 ("B02",4.5,12.5,"+8%","Jeudi 19 novembre, Donald Trump, Vladimir Poutine et Xi Jinping doivent se réunir à Shenzhen, en Chine."),
 ("B03",12.5,20.4,"+16%","Au cœur des discussions : réduire les arsenaux nucléaires. Le dernier grand traité entre Washington et Moscou a expiré en février."),
 ("B04",20.4,26.6,"+0%","Trump veut maintenant associer Pékin, qui reste réticent."),
 ("B05",26.6,33.8,"+12%","La guerre en Iran devrait aussi être abordée. Mais selon Washington, pas celle en Ukraine."),
 ("B06",33.8,40.,"+22%","Et attention : aucun accord n’est attendu pour le moment. Alors, véritable tournant diplomatique, ou simple démonstration de puissance ?"),
 ("B07",40.,43.,"+5%","World-Vision. Voir le monde, le comprendre.")
]
def sh(*args):
 return subprocess.check_output(list(map(str,args)),stderr=subprocess.STDOUT).decode("utf8","replace")
def probe_seconds(p):
 return float(json.loads(sh("ffprobe","-v","error","-show_format","-of","json",p))["format"]["duration"])
def digest(p):return hashlib.sha256(Path(p).read_bytes()).hexdigest()
def norm(txt):return " ".join(txt.split())
src=SCRIPT.read_text(encoding="utf-8")
script=src.split("## Script V1 — copie exacte pour narration",1)[1].split("## Sources",1)[0].strip()
assert norm(script)==norm(" ".join(line[4] for line in LINES)), "Editorial SCRIPT_V1 differs. Voice job blocked."
assert abs(sum(end-start for _,start,end,*_ in LINES)-43.)<1e-5
assert all(LINES[i][2]==LINES[i+1][1] for i in range(6))

async def main():
 records=[]
 async def generate(idx,row):
  id,start,end,rate,txt=row
  mp3=OUT/(id+".mp3")
  raw_events=[]
  com=edge_tts.Communicate(txt,VOICE,rate=rate,volume="+0%")
  with mp3.open("wb") as f:
   async for msg in com.stream():
    if msg["type"]=="audio":f.write(msg["data"])
    elif msg["type"]=="WordBoundary":
     raw_events.append({"text":msg.get("text",""),"offset_100ns":msg["offset"],"duration_100ns":msg["duration"]})
  if mp3.stat().st_size<10000:
   raise RuntimeError(f"Voice {id} empty: {mp3.stat().st_size} bytes")
  return id,start,end,rate,txt,mp3,raw_events
 # sequential: do not hammer voice provider and get throttled
 for i,row in enumerate(LINES):
  id,start,end,rate,txt,mp3,events=await generate(i,row)
  original=probe_seconds(mp3);slot=end-start
  # Favor natural speech. If speech is only slightly longer than shot,
  # use tiny ffmpeg atempo adjustment; hard fail for unnatural squeezing.
  desired=slot-0.15
  tempo=max(1.,original/desired)
  if tempo>1.29:
   raise RuntimeError(f"Scene {id}: {original:.2f}s of narration won't fit {slot:.2f}s naturally (tempo={tempo:.3f}); check editorial split instead of unnatural speed")
  target=OUT/(id+"-master.wav")
  ff=["ffmpeg","-y","-v","error","-i",str(mp3),
      "-af",f"atempo={tempo:.5f},aresample=48000,aformat=channel_layouts=stereo,afade=t=in:st=0:d=0.04,apad=pad_dur={slot:.4f},atrim=0:{slot:.4f}",
      "-ac","2","-ar","48000","-c:a","pcm_s16le",str(target)]
  subprocess.run(ff,check=True)
  mastered=probe_seconds(target)
  assert abs(mastered-slot)<.025,(id,mastered,slot)
  print(f"VOICE {id}: {original:.2f}s orig, {slot:.2f}s master, speed x{tempo:.3f}, {len(events)} boundary events",flush=True)
  records.append({"id":id,"start":start,"end":end,"seconds":slot,
   "rate":rate,"source":txt,"original_duration":original,
   "tempo_adjust":tempo,"bytes":mp3.stat().st_size,
   "mp3_sha256":digest(mp3),"words":events})
 concat=OUT/"concat-list.txt"
 concat.write_text("".join("file '"+r["id"]+"-master.wav'\n" for r in records),encoding="utf-8")
 output=OUT/"worldvision-voice-fr-43s-candidate.wav"
 subprocess.run(["ffmpeg","-y","-v","error","-f","concat","-safe","0","-i",str(concat),
                 "-af","loudnorm=I=-16:TP=-1.5:LRA=9",
                 "-ac","2","-ar","48000","-c:a","pcm_s16le",str(output)],check=True)
 duration=probe_seconds(output)
 assert abs(duration-43.)<.035,("Voice total duration",duration)
 # Re-normalize text and output accessible word-boundary timeline (temporarily
 # estimates after atempo, before an editor refines the thirteen caption cues).
 words=[]
 for rec in records:
  for w in rec["words"]:
   a=rec["start"]+w["offset_100ns"]/1e7/rec["tempo_adjust"]
   d=w["duration_100ns"]/1e7/rec["tempo_adjust"]
   words.append({"text":w["text"],"start":round(a,3),"end":round(a+d,3),"segment":rec["id"]})
 record={
  "editorial_script_sha256":digest(SCRIPT),
  "approved_script_unchanged":True,
  "voice":VOICE,"voice_kind":"Microsoft Edge generic French neural TTS, NOT real person",
  "status":"TECHNICAL_VOICE_CANDIDATE_REQUIRES_HUMAN_APPROVAL",
  "published":False,"approved_by_user":False,
  "duration_sec":duration,"sample_rate_hz":48000,"channels":2,
  "sha256":digest(output),"bytes":output.stat().st_size,
  "word_boundaries":words,
  "segments":records,
  "note":"Do not publish or claim user approval. Verify intelligibility and emotional cadence on phone."
 }
 (OUT/"worldvision-voice-fr-43s-candidate.json").write_text(json.dumps(record,ensure_ascii=False,indent=2)+"\n")
 print(json.dumps({k:v for k,v in record.items() if k not in ("segments","word_boundaries")},ensure_ascii=False),flush=True)
asyncio.run(main())
