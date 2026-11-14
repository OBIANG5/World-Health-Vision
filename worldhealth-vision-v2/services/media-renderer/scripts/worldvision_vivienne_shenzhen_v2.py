#!/usr/bin/env python3
"""World-Vision n°001 — user-preferred Vivienne neural VOICE AUDITION.

V2 creates one continuous spoken performance, never a series of paragraphs
artificially padded or shortened to fill old scene durations. The visible end
card is intentionally silent. The resulting audio is REVIEW ONLY; edge-tts
does not establish a commercial redistribution license.
"""
import asyncio
import hashlib
import json
import re
import subprocess
from pathlib import Path
import edge_tts

ROOT=Path(__file__).resolve().parents[3]
SCRIPT=ROOT/"docs/media/episodes/2026-11-14_trump_xi_putin_shenzhen/SCRIPT_V1.md"
VOICE_DOC=ROOT/"docs/media/VOICE_REFERENCE.md"
OUT=Path(__file__).resolve().parents[1]/"output/editorial-v2/voice-vivienne"
VOICE="fr-FR-VivienneMultilingualNeural"
RATE="+11%"
PITCH="+0Hz"
OUTRO="World-Vision. Voir le monde, le comprendre."

def sha(path): return hashlib.sha256(Path(path).read_bytes()).hexdigest()
def probe_duration(path):
    raw=subprocess.check_output(
        ["ffprobe","-v","error","-show_format","-of","json",str(path)]
    )
    return float(json.loads(raw)["format"]["duration"])
def fail(msg): raise RuntimeError("VIVIENNE AUDITION BLOCKED: "+msg)

def spoken_editorial():
    body=SCRIPT.read_text(encoding="utf-8").split(
        "## Script V1 — copie exacte pour narration",1)[1].split(
        "## Sources vérifiées",1)[0].strip()
    paras=[p.strip() for p in re.split(r"\n\s*\n",body) if p.strip()]
    if len(paras)!=7 or paras[-1]!=OUTRO:
        fail("Source script shape or silent-outro signature changed. Review editorial master.")
    spoken=" ".join(paras[:-1])
    if OUTRO.lower() in spoken.lower():
        fail("World-Vision and its slogan must never be spoken at the end.")
    if spoken.count("Xi Jinping")!=1 or spoken.count("Shenzhen")!=1:
        fail("Named-entity editorial text modified")
    if spoken.count("aucun accord")!=1 or spoken.count("Iran")!=1 or spoken.count("Ukraine")!=1:
        fail("Critical editorial wording missing")
    # All punctuation and facts remain from the user-accepted script except
    # explicit removal of the last spoken brand signature.
    return spoken,paras

async def synthesize(spoken):
    OUT.mkdir(parents=True,exist_ok=True)
    raw=OUT/"vivienne-shenzhen-v2-unpadded-raw.mp3"
    words=[]
    stream=edge_tts.Communicate(spoken,VOICE,rate=RATE,pitch=PITCH,
                                volume="+0%",boundary="WordBoundary")
    with raw.open("wb") as f:
        async for entry in stream.stream():
            if entry["type"]=="audio":
                f.write(entry["data"])
            elif entry["type"]=="WordBoundary":
                words.append({
                  "text":entry.get("text",""),
                  "start":round(entry["offset"]/10_000_000,3),
                  "duration":round(entry["duration"]/10_000_000,3)
                })
    if raw.stat().st_size<140000:
        fail("Incomplete or missing real audio source")
    return raw,words

def render_audio(raw):
    wav=OUT/"vivienne-shenzhen-v2-continuous-review.wav"
    mp3=OUT/"vivienne-shenzhen-v2-continuous-review.mp3"
    sample=OUT/"vivienne-shenzhen-v2-first-12s.mp3"
    # ONE pass over uninterrupted narration. No apad, atrim, scene-stretch,
    # atempo or artificial voice shortening. Normalize for audible A/B tests.
    subprocess.run(["ffmpeg","-y","-v","error","-i",str(raw),"-vn",
                    "-af","loudnorm=I=-16:TP=-2:LRA=7",
                    "-ar","48000","-ac","2","-c:a","pcm_s16le",str(wav)],check=True)
    subprocess.run(["ffmpeg","-y","-v","error","-i",str(wav),"-vn",
                    "-c:a","libmp3lame","-b:a","192k",str(mp3)],check=True)
    subprocess.run(["ffmpeg","-y","-v","error","-i",str(wav),"-t","12","-vn",
                    "-c:a","libmp3lame","-b:a","192k",str(sample)],check=True)
    return wav,mp3,sample

def analyze_pauses(wav):
    p=subprocess.run(["ffmpeg","-hide_banner","-v","info","-i",str(wav),
                     "-af","silencedetect=noise=-35dB:d=0.32",
                     "-f","null","-"],stdout=subprocess.PIPE,
                     stderr=subprocess.PIPE,text=True,check=True)
    starts=[float(x) for x in re.findall(r"silence_start:\s*([0-9.]+)",p.stderr)]
    ends=[float(x) for x in re.findall(r"silence_end:\s*([0-9.]+)",p.stderr)]
    duration=probe_duration(wav)
    spans=[{"start":round(start,3),"end":round((ends[i] if i<len(ends) else duration),3),
            "duration":round((ends[i] if i<len(ends) else duration)-start,3)}
           for i,start in enumerate(starts)]
    interior=[x for x in spans if x["start"]>.5 and
              x["end"]<duration-.5 and x["duration"]>.65]
    return spans,interior

async def main():
    if VOICE not in VOICE_DOC.read_text(encoding="utf-8"):
        fail("Canonical GitHub reference does not name Vivienne")
    spoken,paragraphs=spoken_editorial()
    raw,words=await synthesize(spoken)
    wav,mp3,sample=render_audio(raw)
    duration=probe_duration(wav)
    silences,gaps=analyze_pauses(wav)
    last_word=max((z["start"]+z["duration"] for z in words),default=0.)
    # Metadata is grounded in actual word positions and audio samples.
    # Failed pacing does not get silently "fixed"; keep the audition audible.
    timing_fits=last_word<=39.10 and duration<=39.10
    report={
      "id":"world-vision-001-shenzhen-vivienne-v2",
      "status":"USER_PREFERRED_VOICE_AUDITION_ONLY_NOT_MASTER",
      "voice":VOICE,"rate":RATE,"pitch":PITCH,
      "voice_preferred_by_user":True,
      "this_take_approved_by_user":False,
      "approved_by_user":False,
      "source_type":"edge-tts-noncommercial-audition",
      "publishing_rights_cleared":False,
      "commercial_use_authorized":False,
      "license_notice":"Edge TTS invocation does not itself prove commercial speech rights; use authorized Azure Speech terms/licensing before publication.",
      "editorial_source":"SCRIPT_V1.md",
      "script_file_sha256":sha(SCRIPT),
      "spoken_script":spoken,
      "verbatim_except_silent_outro":True,
      "full_script_paragraphs":paragraphs,
      "silent_outro":OUTRO,
      "outro_read_aloud":False,
      "continuous_single_utterance":True,
      "audio_padded_per_scene":False,
      "atempo_used":False,
      "silence_inserted_artificially":False,
      "audio_duration_sec":round(duration,3),
      "last_word_boundary_sec":round(last_word,3),
      "visual_outro_start_sec":39.1,
      "fits_visual_script_without_timestretch":timing_fits,
      "word_boundaries":words,
      "word_boundaries_available":len(words)>40,
      "silence_threshold_db":-35,
      "silence_limit_sec":.65,
      "silences":silences,
      "long_noneditorial_pauses":gaps,
      "objective_silence_qc_passed":len(gaps)==0,
      "wav_sha256":sha(wav),"mp3_sha256":sha(mp3),
      "sample_mp3_sha256":sha(sample),
      "wav_bytes":wav.stat().st_size,
      "mp3_bytes":mp3.stat().st_size,
      "audition_reference":"https://raw.githack.com/OBIANG5/World-Health-Vision/whv-media-studio-browser-preview/media-lab/south-sudan-editorial-v2/voice-auditions/vivienne.mp3",
      "needs_full_listening":True,
      "requires_explicit_final_voice_approval":True,
      "recommended_next_step":"Listen to Vivienne for the complete Shenzhen script before aligning visual cuts and subtitles. Never publish this edge-tts preview."
    }
    (OUT/"vivienne-shenzhen-v2-manifest.json").write_text(
      json.dumps(report,ensure_ascii=False,indent=2)+"\n",encoding="utf-8")
    print(json.dumps({k:v for k,v in report.items()
                      if k not in ("spoken_script","full_script_paragraphs",
                                   "word_boundaries","silences")},
                     ensure_ascii=False),flush=True)
    if not report["word_boundaries_available"]:
        print("WARNING: real word-boundary metadata missing; subtitles are BLOCKED")
    if not timing_fits:
        print(f"WARNING: actual spoken track {duration:.2f}s does not fit 39.1s; visual edit must adapt, no fake speed-up.")
    if gaps:
        print(f"WARNING: {len(gaps)} natural or service-induced pause(s) exceed 0.65s; audition before choosing edits.")

if __name__=="__main__":
    asyncio.run(main())
