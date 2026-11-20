#!/usr/bin/env python3
"""
FILM-2B2 — produce an AUDIBLE, explicitly AI-narrated French audition.

Uses an existing open-weight TTS model (Kokoro-82M, French ff_siwis).
Phrases are synthesized separately, so phrase-onset SRT timings derive from
actual PCM audio sample counts, not guesses about spoken pace. This is NOT
forced word-level alignment, an endorsement of the voice, or a release master.

The ambient drone is computed from scratch (no sample library, no NASA sounds,
no commercial recording). Voice and drone are mixed with speech-controlled
ducking, then normalized by the existing FFmpeg loudnorm filter.
"""
import hashlib
import json
import math
import os
import subprocess
import sys
import wave
from pathlib import Path

import numpy as np
import soundfile as sf

ROOT=Path(__file__).resolve().parent
OUT=Path(sys.argv[1]).resolve() if len(sys.argv)>1 else None
if not OUT or not str(OUT).startswith("/tmp/"):
    raise SystemExit("Use a private /tmp/... audio output directory.")
OUT.mkdir(parents=True,exist_ok=True)
TAKE=json.loads((ROOT/"narration.json").read_text(encoding="utf8"))
SR=int(TAKE["sample_rate"])
assert SR==24000 and TAKE["lang_code"]=="f" and TAKE["voice_id"]=="ff_siwis"
assert TAKE["publication_approved"] is False
assert 0.85<=TAKE["speed"]<=1.25
assert len(TAKE["segments"])==7 and {x["scene"] for x in TAKE["segments"]}=={0,1,2,3}

def sha(path):
    h=hashlib.sha256()
    with path.open("rb") as f:
        for buf in iter(lambda:f.read(1024*1024),b""):
            h.update(buf)
    return h.hexdigest()

# Download reference model artifacts via the exact official repository.
# The model's published SHA is checked against its downloaded bytes.
from huggingface_hub import hf_hub_download, model_info
repo=TAKE["model_repository"]
commit=model_info(repo).sha
weights=Path(hf_hub_download(repo_id=repo, filename="kokoro-v1_0.pth"))
voice_blob=Path(hf_hub_download(repo_id=repo, filename="voices/ff_siwis.pt"))
actual_weight_hash=sha(weights)
if actual_weight_hash!=TAKE["model_weights_sha256"]:
    raise RuntimeError("Unapproved Kokoro model drift: "+actual_weight_hash)

import torch
torch.set_num_threads(2)
from kokoro import KPipeline
pipeline=KPipeline(lang_code="f",repo_id=repo)

pieces=[]
timings=[]
cursor=0
pause_samples=round(float(TAKE["default_pause_seconds"])*SR)
for i,entry in enumerate(TAKE["segments"]):
    text=entry["text"].strip()
    if not text or len(text)>125 or any(x in text for x in ("<",">")):
        raise RuntimeError("Invalid spoken phrase "+str(i))
    waveparts=[]
    for _,_,chunk in pipeline(text,voice=TAKE["voice_id"],speed=TAKE["speed"]):
        audio=(chunk.detach().cpu().numpy() if hasattr(chunk,"detach") else np.asarray(chunk))
        audio=np.asarray(audio,dtype=np.float32).flatten()
        if not np.all(np.isfinite(audio)) or not len(audio):
            raise RuntimeError("TTS returned no valid sound at phrase "+str(i))
        waveparts.append(audio)
    if not waveparts:
        raise RuntimeError("No generated audio for phrase "+str(i))
    spoken=np.concatenate(waveparts)
    if len(spoken)<SR//2 or len(spoken)>SR*10:
        raise RuntimeError("Phrase duration is unsafe for 10s caption cue: "+str(i)+" ("+str(len(spoken)/SR)+"s)")
    if float(np.sqrt(np.mean(spoken**2)))<0.0005:
        raise RuntimeError("Neural French TTS produced near silence for phrase "+str(i))
    start=cursor
    pieces.append(spoken)
    cursor+=len(spoken)
    timings.append({"index":i,"scene":entry["scene"],"text":text,
        "start_sample":start,"end_sample":cursor,
        "start_frame":round(start*30/SR),"end_frame":round(cursor*30/SR),
        "duration_seconds":round(len(spoken)/SR,3)})
    if i<len(TAKE["segments"])-1:
        pieces.append(np.zeros(pause_samples,dtype=np.float32))
        cursor+=pause_samples

# A modest tail gives the signature time to land and stops audio cutting on a syllable.
pieces.append(np.zeros(round(0.55*SR),dtype=np.float32))
voice=np.concatenate(pieces).astype(np.float32)
duration=len(voice)/SR
if duration<19 or duration>57:
    raise RuntimeError("Unexpected French narration duration "+str(duration)+" s")
sf.write(OUT/"narration-fr-kokoro-unapproved.wav",voice,SR,subtype="PCM_16")

# Original ambient SOUND DESIGN, not a musical recording or fictitious lunar impacts.
# Soft drone tones plus a low-pass filtered noise bed; no 'impact' sound effects.
t=np.arange(len(voice),dtype=np.float64)/SR
air=np.random.default_rng(seed=20261120).standard_normal(len(voice),dtype=np.float32)
# Frequency-domain lowpass; deterministic, no external audio files or random music service.
freqs=np.fft.rfftfreq(len(voice),d=1/SR)
spectrum=np.fft.rfft(air)
spectrum*=1/np.sqrt(1+(freqs/230)**6)
air=np.fft.irfft(spectrum,n=len(voice)).astype(np.float32)
air/=max(float(np.max(np.abs(air))),1e-9)
drone=(0.010*np.sin(2*np.pi*55.0*t)+
       0.005*np.sin(2*np.pi*(82.41*t+0.09*np.sin(2*np.pi*.045*t)))+
       0.0035*np.sin(2*np.pi*110.0*t)+0.005*air).astype(np.float32)
fadein=np.minimum(1,t/.65)
fadeout=np.minimum(1,np.maximum(0,duration-t)/1.0)
drone*=np.minimum(fadein,fadeout).astype(np.float32)
sf.write(OUT/"worldvision-original-atmosphere.wav",drone,SR,subtype="PCM_16")

# Actual voice-dependent ducking: each 20ms block measures speech RMS.
window=480
padded=np.pad(voice,(0,(-len(voice))%window))
rms=np.sqrt(np.mean(padded.reshape(-1,window)**2,axis=1))
speak=np.clip((rms-.004)/.035,0,1)
duck=1-.70*speak
smooth=np.convolve(duck,np.ones(11)/11,mode="same")
gain=np.interp(np.arange(len(voice))/window,np.arange(len(smooth)),smooth).astype(np.float32)
raw=voice*.92+drone*gain
raw=np.clip(raw,-.99,.99)
sf.write(OUT/"worldvision-raw-mix.wav",raw,SR,subtype="PCM_16")

master=OUT/"worldvision-master-mix.wav"
process=subprocess.run(["ffmpeg","-hide_banner","-y","-loglevel","warning",
    "-i",str(OUT/"worldvision-raw-mix.wav"),"-af",
    "loudnorm=I=-16:TP=-1.5:LRA=10:print_format=json",
    "-ar","24000","-ac","1","-c:a","pcm_s16le",str(master)],
    capture_output=True,text=True,timeout=100)
if process.returncode:
    raise RuntimeError("FFmpeg loudness mastering failed: "+process.stderr[-1500:])
with wave.open(str(master),"rb") as w:
    frames=w.getnframes()
    if w.getframerate()!=SR or w.getnchannels()!=1:
        raise RuntimeError("Wrong mastered voice format")
    if frames/SR<duration-.03 or frames/SR>duration+.10:
        raise RuntimeError("Mastered audio duration does not match voice")
masterdata,_=sf.read(master,dtype="float32")
peak=float(np.max(np.abs(masterdata)))
if not .07<peak<.94:
    raise RuntimeError("Master audio peak suspicious: "+str(peak))

# These are PHRASE boundaries from generated PCM, NOT word-level forced ASR.
result={
 "schema_version":"worldvision-french-voice-audition-v1",
 "audio_master":master.name,"audio_sha256":sha(master),
 "raw_voice_sha256":sha(OUT/"narration-fr-kokoro-unapproved.wav"),
 "original_ambience_sha256":sha(OUT/"worldvision-original-atmosphere.wav"),
 "sample_rate":SR,"duration_samples":len(voice),"duration_seconds":duration,
 "model_repository":repo,"model_commit":commit,
 "model_weights_sha256":actual_weight_hash,"voice_blob_sha256":sha(voice_blob),
 "voice_id":TAKE["voice_id"],"speed":TAKE["speed"],
 "voice_generated_with_ai":True,
 "voice_approved_for_publication":False,
 "voice_commercial_rights_review":"PENDING — Apache-2.0 model and SIWIS/CC BY 4.0 voice origin; credit appropriately.",
 "ambient_track":"ORIGINAL DSP, NOT AN EXISTING SONG, NO FICTITIOUS IMPACT SOUNDS",
 "mixing":"Original low-level ambience, speech-envelope ducking, FFmpeg loudnorm target -16 LUFS/-1.5 dBTP",
 "master_peak_linear":peak,
 "segment_alignment":"speech synthesized separately; phrase-level sample timings only; words not ASR-checked",
 "segments":timings
}
(OUT/"worldvision-narration-timings.json").write_text(json.dumps(result,ensure_ascii=False,indent=2)+"\n",encoding="utf8")
print(json.dumps({"status":"AUDIBLE_INTERNAL_PREVIEW_ONLY","seconds":round(duration,2),"model_sha":actual_weight_hash,
    "voice_sha256":result["audio_sha256"],"segments":len(timings),"peak":round(peak,4)}))
