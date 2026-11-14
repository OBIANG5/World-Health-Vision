#!/usr/bin/env python3
"""WORLD-VISION / SUD-SOUDAN / ÉDITORIAL V3 — 14 NOVEMBRE 2026
Invariants:
  * Script: EXACTLY the owner-reviewed original; SHA-256 hard-pinned.
  * Intro: reuse, byte-validated, first 3 seconds of owner-liked V2 globe.
  * Voice: Vivienne, chosen by owner; REVIEW AUDIO, not presumed commercial license.
  * No blocky beige cards, no permanent white-logo badge, no QA caption.
  * Authentic archive photos; original non-reportage graphics marked in manifest.
  * Clip selection follows narration beats; final audio is one uninterrupted track.
"""
from __future__ import annotations
import argparse, asyncio, hashlib, io, json, math, subprocess, wave
from pathlib import Path
import numpy as np
from PIL import Image, ImageDraw, ImageFont, ImageOps, ImageEnhance, ImageFilter
import edge_tts

W,H,FPS=1080,1920,30
ROOT=Path(__file__).resolve().parent.parent
A=ROOT/"assets"/"south-sudan-2026-11-14"
OUT=ROOT/"output"/"south-sudan-editorial-v3"
SCRIPT_FILE=ROOT.parents[1]/"docs/media/episodes/2026-11-14_south_sudan_elections/SCRIPT_LOCK_V3.json"
SCRIPT_EXPECTED_SHA="a5104cedab538771d1c649da242c7b32b4f438514a4230d3e5bb31628139afb9"
V2_EXPECTED_SHA="512a77a8de55fa05cf24904568577c653d9d1ef8586827b89150b077086d6295"
LOGO_GIT_BLOB="bc80fa70cebd566768bfb1703a0f1f636a78c196"
VOICE="fr-FR-VivienneMultilingualNeural"
NO_COMMERCIAL_LICENSE_ASSUMED=True

BACKGROUND=(12,19,23)
CHALK=(247,244,234)
GOLD=(243,191,73)       # meaningful accent from the national flag's gold star
WHITE=(254,253,247)
SECOND=(198,202,202)
BIG=None; SMALL=None

def run(args):
    return subprocess.run([str(x) for x in args],check=True,capture_output=True,text=True).stdout
def sha(p):return hashlib.sha256(Path(p).read_bytes()).hexdigest()
def probe(p):
    return json.loads(run(["ffprobe","-v","error","-show_streams","-show_format","-of","json",str(p)]))
def duration(p):return float(probe(p)["format"]["duration"])
def read_script():
    payload=json.loads(SCRIPT_FILE.read_text(encoding="utf-8"))
    lines=payload["script_lines"]
    joined="\n".join(lines)
    actual=hashlib.sha256(joined.encode("utf-8")).hexdigest()
    assert actual==SCRIPT_EXPECTED_SHA==payload["joined_sha256_utf8_lf"],("SCRIPT LOCK VIOLATED",actual)
    assert payload["status"]=="LOCKED_WORD_FOR_WORD"
    return lines
def getfont(path,size,weight=500):
    face=ImageFont.truetype(str(path),size)
    try:
        ax=face.get_variation_axes()
        vals=[]
        for item in ax:
            name=str(item.get("name","")).lower()
            if "weight" in name:
                proposed=weight
            elif "optical" in name or "opsz" in name:
                proposed=size
            else: proposed=item["default"]
            vals.append(max(item["minimum"],min(item["maximum"],proposed)))
        face.set_variation_by_axes(vals)
    except OSError:
        raise RuntimeError("Required font variation could not be applied")
    except AttributeError:
        pass
    return face
def face(txt,size,which="display",weight=500,maxwidth=920):
    path=BIG if which=="display" else SMALL
    for s in range(size,25,-2):
        f=getfont(path,s,weight)
        width=ImageDraw.Draw(Image.new("RGB",(10,10))).textbbox((0,0),txt,font=f)[2]
        if width<=maxwidth:return f
    raise RuntimeError("Headline overflow: "+txt)
def write(d,txt,x,y,size,color=CHALK,which="display",weight=550,maxwidth=None):
    f=face(txt,size,which,weight,maxwidth or (W-x-75))
    d.text((x,y),txt,font=f,fill=color,stroke_width=0)
def solid_gradient(photo,top=False):
    """Optical gradient is part of the photo, never a decorative translucent card."""
    layer=Image.new("RGBA",(W,H))
    d=ImageDraw.Draw(layer)
    for y in range(H):
        low=np.clip((y-920)/750,0,1)
        upper=np.clip((280-y)/280,0,1) if top else 0
        alpha=int(232*low**1.35+165*upper)
        d.line((0,y,W,y),fill=(6,12,16,min(255,alpha)))
    return Image.alpha_composite(photo.convert("RGBA"),layer).convert("RGB")
def photograph(name,focus=(.50,.50),sat=.97):
    p=A/name
    im=Image.open(p).convert("RGB")
    if im.width<1000 or im.height<700:raise ValueError("Documentary photograph too small: "+name)
    im=ImageEnhance.Color(im).enhance(sat)
    im=ImageEnhance.Contrast(im).enhance(1.04)
    return ImageOps.fit(im,(W,H),method=Image.Resampling.LANCZOS,centering=focus)
def note_title(im,lines,light=CHALK,topline=None,accent_line=None):
    """Consistent editorial baseline grid. One information hierarchy per frame."""
    im=solid_gradient(im,top=bool(topline))
    d=ImageDraw.Draw(im)
    if topline:
        write(d,topline,88,178,29,WHITE,"body",640)
    n=len(lines)
    y={1:1390,2:1262,3:1125}[n]
    for k,s in enumerate(lines):
        color=GOLD if accent_line is not None and k==accent_line else light
        # Responsive typography: display serif at usable optical size, never giant isolated numerals.
        size=105 if len(s)<13 else 92 if len(s)<18 else 75
        write(d,s,85,y+k*135,size,color,"display",610)
    return im
def scene_png(kind,logo):
    if kind=="independence":
        im=photograph("flag_juba_hires.jpg",(.48,.40))
        im=note_title(im,["2011.", "UN PAYS NAÎT."],topline="JUBA · 9 JUILLET 2011")
    elif kind=="country":
        im=photograph("president.jpg",(.59,.37))
        im=note_title(im,["SOUDAN", "DU SUD."],topline="LE PAYS DE SALVA KIIR")
    elif kind=="original_date":
        im=photograph("crowd_vertical.jpg",(.47,.42))
        im=note_title(im,["22 DÉCEMBRE", "2026."],topline="LA DATE INITIALE")
    elif kind=="new_date":
        im=photograph("flag_juba_hires.jpg",(.67,.44),.83)
        im=note_title(im,["11 FÉVRIER", "2027."],topline="LE SCRUTIN EST REPORTÉ",accent_line=1)
    elif kind=="reason":
        # Original editorial illustration from photographic color fields, NOT
        # simulated actual ballot footage. No fake election-day photographs.
        im=photograph("flag_man.jpg",(.49,.42),.75)
        im=note_title(im,["AUCUN MOTIF", "OFFICIEL."],topline="LE REPORT EST CONFIRMÉ")
    elif kind=="un":
        im=photograph("independence.jpg",(.49,.44),.86)
        im=note_title(im,["L'ONU", "ALERTE."],topline="VIOLENCES ET TENSIONS")
    elif kind=="outro":
        im=photograph("flag_juba_hires.jpg",(.36,.50),.9)
        im=note_title(im,["LE PREMIER VOTE", "SE FAIT ATTENDRE."],topline="QUINZE ANS APRÈS L'INDÉPENDANCE")
        # Exact approved G0 bitmap. Keep its own background as part of asset;
        # no added plaque, no slogan read aloud, and no unrelated ornament.
        g=logo.copy()
        g.thumbnail((66,54),Image.Resampling.LANCZOS)
        im=im.convert("RGBA");im.alpha_composite(g,(86,1661))
        d=ImageDraw.Draw(im)
        write(d,"WORLD-VISION",167,1661,34,CHALK,"body",730)
        im=im.convert("RGB")
    else:raise KeyError(kind)
    result=OUT/(kind+".png")
    im.save(result,optimize=True)
    return result

def decode_mp3(path):
    return np.frombuffer(subprocess.check_output([
        "ffmpeg","-v","error","-i",str(path),"-f","f32le","-ac","1","-ar","48000","pipe:1"
    ]),dtype=np.float32).copy()
def trim_ends(samples):
    # Short-window RMS avoids truncating French unstressed syllables.
    window=480 # 10 ms
    smooth=np.convolve(samples[::10]**2,np.ones(100,dtype=np.float32)/100,mode="same")**.5
    hit=np.where(smooth>0.0018)[0]
    if len(hit)<120:raise RuntimeError("TTS output appears silent")
    lo=max(0,int(hit[0]*10)-int(.08*48000))
    hi=min(len(samples),int(hit[-1]*10)+int(.12*48000))
    return samples[lo:hi]
async def voices(lines):
    for i,line in enumerate(lines):
        # No rewrite. The editorial text itself is spoken. Vivienne is a
        # selected creative reference, not an authorized commercial voice.
        mp3=OUT/f"raw-narration-{i+1:02d}.mp3"
        await edge_tts.Communicate(line,voice=VOICE,rate="+4%",pitch="+0Hz").save(str(mp3))
        if mp3.stat().st_size<5000:raise RuntimeError("Missing voice, segment "+str(i))
def make_audio(lines):
    asyncio.run(voices(lines))
    segments=[]
    for i in range(len(lines)):
        arr=trim_ends(decode_mp3(OUT/f"raw-narration-{i+1:02d}.mp3"))
        segments.append(arr)
    gaps=[.075]*(len(lines)-1)
    merged=[]
    for i,s in enumerate(segments):
        merged.append(s)
        if i<len(gaps):merged.append(np.zeros(round(gaps[i]*48000),dtype=np.float32))
    sound=np.concatenate(merged)
    # Surgical time alignment is permitted without changing words or pitch,
    # but an excessive ratio blocks a new master instead of making Vivienne robotic.
    original_duration=len(sound)/48000
    factor=max(1.0,original_duration/29.45)
    if factor>1.07:raise RuntimeError(f"Voice too long ({original_duration:.2f}s), requires rewrite approval; refuse machine-gun tempo")
    wav=OUT/"speech-raw.wav"
    import soundfile as sf
    sf.write(wav,sound,48000,subtype="PCM_24")
    final=OUT/"vivienne-editorial-review.wav"
    sh=["ffmpeg","-y","-v","error","-i",str(wav),"-af",
        f"atempo={factor:.5f},loudnorm=I=-16:TP=-1.5:LRA=9",
        "-ar","48000","-ac","1",str(final)]
    run(sh)
    times=[len(s)/48000/factor for s in segments]
    pauses=[g/factor for g in gaps]
    return final,times,pauses,original_duration,factor
def photo_film(image,secs,dst,zoom):
    frames=max(1,round(secs*FPS))
    # Encode exact frame count rather than relying on -t approximations.
    expr=f"zoompan=z='min(zoom+{zoom:.7f},1.035)':d=1:x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':s=1080x1920:fps=30"
    run(["ffmpeg","-y","-v","error","-loop","1","-framerate","30","-i",str(image),
         "-vf",expr+",format=yuv420p","-frames:v",str(frames),
         "-c:v","libx264","-preset","veryfast","-crf","18",
         "-pix_fmt","yuv420p",str(dst)])
    return dst,frames/FPS
def make_visuals(voicetimes,pauses,logo,globe):
    # First scene is exactly the approved three-second geographical V2 movie.
    allclips=[]
    first=OUT/"segment-00-globe.mp4"
    run(["ffmpeg","-y","-v","error","-i",str(globe),"-t","3.0","-an","-c:v",
         "libx264","-preset","fast","-crf","17","-pix_fmt","yuv420p",str(first)])
    allclips.append((first,3.0,"approved_globe"))
    # Visual boundaries use actual spoken segments, *not* substitute narrations.
    def film(kind,seconds,zoom=.00009):
        p=scene_png(kind,logo)
        c=OUT/f"segment-{len(allclips):02d}-{kind}.mp4"
        result,d=photo_film(p,seconds,c,zoom)
        allclips.append((result,d,kind))
    t0=voicetimes[0]+pauses[0]
    if t0<3.2:raise RuntimeError("Original hook unexpectedly too short to show 3 second globe")
    film("independence",t0-3.0,.000085)
    film("country",voicetimes[1]+pauses[1],.000060)
    # At the exact semantic beat, change from original election date to
    # postponed date. A factual graphic, not a giant beige presentation slide.
    t=voicetimes[2]+pauses[2]
    film("original_date",t*.43,.00010)
    film("new_date",t*.57,.00012)
    film("reason",voicetimes[3]+pauses[3],.000065)
    film("un",voicetimes[4]+pauses[4],.000075)
    film("outro",voicetimes[5],.000060)
    return allclips
def check_audio(path,length):
    # No dead air near first 1.5 s, no long silences caused by scene boundaries.
    p=subprocess.run(["ffmpeg","-hide_banner","-i",str(path),"-af",
       "silencedetect=noise=-36dB:d=0.48","-f","null","-"],
       capture_output=True,text=True)
    markers=[x for x in p.stderr.splitlines() if "silence_duration:" in x]
    if markers:raise RuntimeError("Audio has >480ms dead zone: "+"; ".join(markers[:5]))
def main():
    ap=argparse.ArgumentParser()
    ap.add_argument("--headfont",type=Path,required=True)
    ap.add_argument("--bodyfont",type=Path,required=True)
    ap.add_argument("--logo",type=Path,required=True)
    ap.add_argument("--v2-reference",type=Path,required=True)
    args=ap.parse_args()
    global BIG,SMALL
    BIG=args.headfont;SMALL=args.bodyfont
    for f in [BIG,SMALL,args.logo,args.v2_reference]:
        if not f.is_file():raise FileNotFoundError(str(f))
    assert sha(args.v2_reference)==V2_EXPECTED_SHA,"User-approved V2 geographic globe is modified/missing"
    assert run(["git","hash-object",str(args.logo)]).strip()==LOGO_GIT_BLOB,"Official G0 logo mismatch"
    if not A.joinpath("flag_juba_hires.jpg").exists():raise FileNotFoundError("New 2160px Juba flag photo not downloaded")
    O=OUT;O.mkdir(parents=True,exist_ok=True)
    lines=read_script()
    audio,segments,pauses,orig,ratefactor=make_audio(lines)
    logo=Image.open(args.logo).convert("RGBA")
    shots=make_visuals(segments,pauses,logo,args.v2_reference)
    concatfile=OUT/"concat.txt"
    concatfile.write_text("".join(f"file '{p.resolve()}'\n" for p,sec,key in shots),encoding="utf8")
    picture=OUT/"mute-v3.mp4"
    run(["ffmpeg","-y","-v","error","-f","concat","-safe","0","-i",str(concatfile),
         "-an","-c:v","libx264","-preset","fast","-crf","18",
         "-r","30","-pix_fmt","yuv420p","-movflags","+faststart",str(picture)])
    total=min(duration(picture),duration(audio))
    final=OUT/"world-vision-soudan-du-sud-v3-vivienne-review.mp4"
    run(["ffmpeg","-y","-v","error","-i",str(picture),"-i",str(audio),
        "-map","0:v:0","-map","1:a:0","-t",f"{total:.4f}",
        "-c:v","copy","-c:a","aac","-b:a","192k","-ar","48000",
        "-movflags","+faststart",str(final)])
    props=probe(final); vv=next(x for x in props["streams"] if x["codec_type"]=="video")
    aa=next(x for x in props["streams"] if x["codec_type"]=="audio")
    dur=float(props["format"]["duration"])
    assert dur<=30.0 and dur>19.0,("Bad duration",dur)
    assert vv["codec_name"]=="h264" and (vv["width"],vv["height"])==(W,H)
    assert aa["codec_name"]=="aac"
    check_audio(audio,dur)
    pic=OUT/"review";pic.mkdir(exist_ok=True)
    stamps=[.65,1.62,2.75]+[round(dur*f,3) for f in (.18,.30,.42,.56,.72,.95)]
    ims=[]
    for i,t in enumerate(stamps):
        out=pic/f"shot-{i+1:02d}.jpg"
        run(["ffmpeg","-y","-v","error","-ss",f"{t:.3f}","-i",str(final),
            "-vf","scale=320:569","-frames:v","1",str(out)])
        ims.append(Image.open(out).convert("RGB"))
    contact=Image.new("RGB",(320*3,569*3),CHALK)
    for i,im in enumerate(ims):contact.paste(im,((i%3)*320,(i//3)*569))
    contact.save(pic/"contact-sheet.jpg",quality=90)
    record={
      "episode":"south-sudan-first-national-election-delay-V3",
      "status":"REVIEW_ONLY_NO_PUBLICATION",
      "script_lock_sha256":SCRIPT_EXPECTED_SHA,
      "script_full_exact":lines,
      "voice":"fr-FR-VivienneMultilingualNeural",
      "voice_reference":"https://raw.githack.com/OBIANG5/World-Health-Vision/whv-media-studio-browser-preview/media-lab/south-sudan-editorial-v2/voice-auditions/vivienne.mp3",
      "voice_approved_as_preference":True,"voice_approved_as_final_master":False,
      "voice_commercial_license_verified":False,
      "audio_source":"Edge Neural unofficial preview only, never a promise of usage rights",
      "voice_original_duration_sec":round(orig,3),"voice_final_atempo":round(ratefactor,5),
      "visuals":[{"type":kind,"seconds":round(sec,3)} for p,sec,kind in shots],
      "documentary_media":[
        {"file":"flag_juba_hires.jpg","caption":"Juba 9 July 2011","author":"U.S. Department of State / Jenn Warren","license":"public domain US federal government","url":"https://commons.wikimedia.org/wiki/File:Flag_of_South_Sudan_in_to_the_Independence_Day.jpg"},
        {"file":"crowd_vertical.jpg","caption":"Juba 9 July 2011","license":"US Government public domain"},
        {"file":"president.jpg","caption":"Portrait Salva Kiir, 2020","license":"CC0 1.0"},
        {"file":"flag_man.jpg","caption":"South Sudan 9 July 2011","license":"US Government public domain"},
        {"file":"independence.jpg","caption":"South Sudan 9 July 2011","license":"US Government public domain"}
      ],
      "separate_ai_illustration_in_canva":{"asset_id":"MAHa5KhTKE0","title":"Conceptual election ballot box","integrated_into_video":False,"not_real_event":True},
      "geography":{"video_reference_sha256":V2_EXPECTED_SHA,"target_city":"Juba","region":"South Sudan"},
      "video_sha256":sha(final),"duration_seconds":round(dur,3),
      "resolution":"1080x1920","fps":FPS,"video_codec":"h264","audio_codec":"aac",
      "technical_qa_passed":True,"artistic_user_approval":False,"publication_authorized":False
    }
    (OUT/"manifest.json").write_text(json.dumps(record,ensure_ascii=False,indent=2)+"\n",encoding="utf8")
    print(json.dumps({"file":str(final),"duration":round(dur,3),"voice":VOICE,
      "sha":record["video_sha256"],"segments":len(shots),"script_sha":SCRIPT_EXPECTED_SHA},ensure_ascii=False))
if __name__=="__main__":main()
