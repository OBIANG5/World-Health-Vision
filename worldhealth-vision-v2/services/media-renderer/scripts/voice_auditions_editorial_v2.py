#!/usr/bin/env python3
"""World-Vision V2 — multiple NATURAL-PACE French voice audition clips.

Never reuse rejected 'Henri', never stretch / pad a speaker to video duration.
This generates dry speech-only candidates for subjective listening and only
the owner can select an APPROVED voice. No video, captions or publishing.
"""
import asyncio,hashlib,json,re,subprocess
from pathlib import Path
import edge_tts

ROOT=Path(__file__).resolve().parents[3]
SCRIPT=ROOT/"docs/media/episodes/2026-11-14_trump_xi_putin_shenzhen/SCRIPT_V1.md"
OUT=Path(__file__).resolve().parents[1]/"output/editorial-v2/voice-auditions"
OUT.mkdir(parents=True,exist_ok=True)
EXCERPT=(
 "Trois puissances nucléaires. Une même table. Et une rencontre inédite. "
 "Jeudi 19 novembre, Donald Trump, Vladimir Poutine et Xi Jinping "
 "doivent se réunir à Shenzhen, en Chine."
)
PREFER=[
 "fr-FR-RemyMultilingualNeural",
 "fr-FR-VivienneMultilingualNeural",
 "fr-FR-DeniseNeural",
 "fr-FR-EloiseNeural",
 "fr-FR-HenriNeural", # explicitly excluded below, as a guard
]
REJECTED={"fr-FR-HenriNeural"}
def sha(p):return hashlib.sha256(Path(p).read_bytes()).hexdigest()
def duration(p):
 j=json.loads(subprocess.check_output(["ffprobe","-v","error","-show_format","-of","json",str(p)]))
 return float(j["format"]["duration"])

async def main():
 source=SCRIPT.read_text(encoding="utf8")
 approved=source.split("## Script V1 — copie exacte pour narration",1)[1].split("## Sources",1)[0]
 def norm(t):return " ".join(t.split())
 if norm(EXCERPT) not in norm(approved):
  raise RuntimeError("Script changed: no audition may paraphrase or fabricate content")
 voices=await edge_tts.list_voices()
 found={v["ShortName"]:v for v in voices}
 names=[n for n in PREFER if n in found and n not in REJECTED]
 if len(names)<2:
  raise RuntimeError("Fewer than two genuine non-rejected French voices available; do not produce a fake comparison")
 results=[]
 for idx,name in enumerate(names[:4],1):
  # Never fake acting with a speed multiplier. Choose 1x natural speech,
  # then ask user to compare tone, articulation and emotional balance.
  tag=f"A{idx:02d}"
  file=OUT/f"{tag}-dry-fr-voice-audition.mp3"
  generator=edge_tts.Communicate(EXCERPT,voice=name,rate="+0%",volume="+0%",pitch="+0Hz")
  with file.open("wb") as output:
   async for packet in generator.stream():
    if packet["type"]=="audio":output.write(packet["data"])
  if file.stat().st_size<12000:raise RuntimeError("Invalid TTS output, not an audition")
  seconds=duration(file)
  if seconds<5 or seconds>30:raise RuntimeError(f"Unnatural duration for audition {name}: {seconds}")
  # Convert to linear dry PCM to detect actual long silence. NO apad / atrim.
  dry=OUT/f"{tag}-dry-fr-voice-audition.wav"
  subprocess.run(["ffmpeg","-y","-v","error","-i",str(file),
                  "-c:a","pcm_s16le","-ac","1","-ar","48000",str(dry)],check=True)
  result={"code":tag,"voice":name,"display_name":found[name].get("FriendlyName",name),
          "gender_metadata":found[name].get("Gender"),
          "duration_seconds":seconds,"rate":"+0% (native, unaccelerated)",
          "script_unmodified":True,"no_padding":True,"no_synthetic_music":True,
          "no_user_approval":True,"voice_approved":False,
          "mp3_file":file.name,"wav_file":dry.name,
          "sha256_mp3":sha(file),"bytes_mp3":file.stat().st_size}
  results.append(result)
  print(json.dumps(result,ensure_ascii=False),flush=True)
 manifest={"project":"World-Vision Editorial V2",
           "status":"CANDIDATES_FOR_AUDITION_ONLY_NEVER_APPROVED_AUTOMATICALLY",
           "script_sha256":sha(SCRIPT),"sample_script":EXCERPT,
           "available_voices":len(names),"rejected_voice":"fr-FR-HenriNeural",
           "comparison_criteria":["authentic journalist timbre","calm but expressive","French diction","no robotic rhythm","natural micro-pauses"],
           "all_at_native_speed":True,"no_per_scene_padding":True,
           "sources":"Microsoft Edge neural voice catalog, not the voice of the named politicians",
           "approved_by_user":False,"candidates":results}
 (OUT/"voice-auditions.json").write_text(json.dumps(manifest,ensure_ascii=False,indent=2)+"\n")
 print("Auditions only, not approved and not ready for a release.")
if __name__=="__main__":
 asyncio.run(main())
