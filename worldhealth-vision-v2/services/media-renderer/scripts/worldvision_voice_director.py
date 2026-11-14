#!/usr/bin/env python3
"""World-Vision — continuous Vivienne audition and word-aligned video timing.
No separate stitched speech segments, no forced speed-up, no arbitrary silences.
REVIEW voice output ONLY; never infer commercial rights from edge-tts access.
"""
import asyncio, json, re, subprocess
from pathlib import Path
import numpy as np
import soundfile as sf
import edge_tts

def words(s):
    return len(re.findall(r"\b[\w’-]+\b",s))
def cmd(xs):
    return subprocess.run([str(x) for x in xs],check=True,capture_output=True,text=True).stdout
def decode_mp3(p):
    q=subprocess.run(["ffmpeg","-v","error","-i",str(p),"-f","f32le","-ar","48000","-ac","1","pipe:1"],
                     capture_output=True,check=True)
    return np.frombuffer(q.stdout,np.float32).copy()
def trim_tts_padding(raw):
    step=480
    rms=np.array([np.sqrt(np.mean(raw[i:i+step]**2)) for i in range(0,len(raw),step)])
    nonzero=np.flatnonzero(rms>.00095)
    if len(nonzero)<120:raise RuntimeError("Voice is silent or too short")
    st=max(0,int(nonzero[0]*step)-int(.075*48000))
    en=min(len(raw),int(nonzero[-1]*step)+int(.14*48000))
    return raw[st:en],st/48000.
async def once(text,rate,out,voice):
    data=bytearray();events=[]
    speech=edge_tts.Communicate(text,voice=voice,rate=rate,pitch="+0Hz")
    async for part in speech.stream():
        if part.get("type")=="audio":data.extend(part["data"])
        elif part.get("type")=="WordBoundary":
            events.append((part["offset"]/10_000_000.,
                           part.get("duration",0)/10_000_000.,
                           str(part.get("text",""))))
    out.write_bytes(data)
    if out.stat().st_size<10000:raise RuntimeError("TTS returned missing voice audio")
    return events
def line_durations(events,lines,length,shift):
    counts=np.array([words(t) for t in lines],dtype=float)
    if len(events) >= .75*sum(counts):
        cuts=[0.]
        for i in range(len(lines)-1):
            progress=sum(counts[:i+1])/sum(counts)
            idx=min(len(events)-1,max(0,round(progress*len(events))-1))
            t=events[idx][0]+events[idx][1]-shift
            cuts.append(max(cuts[-1]+.4,min(length-.4,t)))
        cuts.append(length)
    else:
        cuts=[0.]+(np.cumsum(counts)/sum(counts)*length).tolist()
    intervals=np.diff(cuts)
    if np.any(intervals<.35):
        raise RuntimeError("Word boundary segmentation is inconsistent")
    return intervals.tolist()
def produce(lines,voice,out,script_sha,desired_wpm=151.):
    out=Path(out);out.mkdir(parents=True,exist_ok=True)
    text=" ".join(lines)  # Identical words and punctuation, no changes to approved text
    candidates=[]
    for name,rate in [("A","-12%"),("B","-5%"),("C","+0%")]:
        mp3=out/f"vivienne-full-take-{name}.mp3"
        events=asyncio.run(once(text,rate,mp3,voice))
        raw,shift=trim_tts_padding(decode_mp3(mp3))
        duration=len(raw)/48000.
        wpm=sum(words(t) for t in lines)*60./duration
        aud=out/f"vivienne-audition-{name}.wav"
        sf.write(aud,raw,48000,subtype="PCM_24")
        candidates.append(dict(name=name,rate=rate,wpm=wpm,duration=duration,events=events,raw=raw,shift=shift,aud=aud))
    eligible=[c for c in candidates if 139<=c["wpm"]<=166 and c["duration"]<=55.4]
    if not eligible:
        raise RuntimeError("No one-take Vivienne candidate with desired natural rate: "+
          str([(x["rate"],round(x["wpm"],1)) for x in candidates]))
    best=min(eligible,key=lambda c:abs(c["wpm"]-desired_wpm))
    master=out/"vivienne-continuous-normalized.wav"
    cmd(["ffmpeg","-y","-v","error","-i",best["aud"],"-af","loudnorm=I=-16:TP=-2:LRA=9",
         "-ac","1","-ar","48000",master])
    length=float(json.loads(cmd(["ffprobe","-v","error","-show_format","-of","json",master]))["format"]["duration"])
    cuts=line_durations(best["events"],lines,length,best["shift"])
    report={
       "voice":voice,"selected":best["name"],"selected_rate":best["rate"],
       "selected_wpm":round(best["wpm"],2),"selected_duration":round(length,3),
       "technique":"Single full script utterance, no sentence cuts or splices, normalized volume only",
       "tempo_warping":False,"script_sha256":script_sha,
       "auditions":[{"name":c["name"],"rate":c["rate"],"wpm":round(c["wpm"],2),
                     "duration":round(c["duration"],3),
                     "file":c["aud"].name} for c in candidates],
       "commercial_license_confirmed":False,"human_artistic_approval":False
    }
    (out/"vivienne-auditions.json").write_text(json.dumps(report,ensure_ascii=False,indent=2)+"\n")
    return master,cuts,length,best["wpm"],report
