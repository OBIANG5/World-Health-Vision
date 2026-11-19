#!/usr/bin/env python3
"""World-Vision: South Sudan elections short. Authentic archives, licensed neural FR narration.
No fabricated event footage. No technical/preview copy in exported pixels.
Run within the existing media-renderer and publish through existing mobile-preview branch.
"""
from __future__ import annotations
import argparse, hashlib, json, math, os, subprocess, sys, wave
from pathlib import Path
import numpy as np
import soundfile as sf
from PIL import Image, ImageDraw, ImageFont, ImageEnhance, ImageFilter, ImageOps

W, H, FPS = 1080, 1920, 30
P = Path(__file__).resolve().parent.parent
OUT = P / "output" / "south-sudan-2026-11-14"
ASSETS = P / "assets" / "south-sudan-2026-11-14"
INK = (3, 18, 40)
WHITE = (248, 252, 255)
CYAN = (88, 218, 238)
SOFT = (186, 219, 229)
RED = (237, 104, 115)
FONT_SHA = "3ae11c49db0455a3cc33e37d380f20fdb8c7f8b41dc07625c177e3d87a9d6ae6"
LOGO_BLOB = "bc80fa70cebd566768bfb1703a0f1f636a78c196"

# Exactly six spoken beats. Dates written out for intelligible French TTS.
LINES = [
    "Imagine un pays indépendant depuis quinze ans, mais qui n'a encore jamais organisé d'élections nationales !",
    "C'est le Soudan du Sud.",
    "Le pays devait enfin voter le vingt-deux décembre. Mais nouveau coup de théâtre : les élections sont repoussées au onze février deux mille vingt-sept !",
    "Aucune raison officielle n'a été donnée.",
    "Pendant ce temps, l'ONU alerte sur les violences et les tensions politiques.",
    "Quinze ans après l'indépendance, les Sud-Soudanais attendent toujours leur premier scrutin national.",
]
EDITORIAL = [
    "Imagine un pays indépendant depuis quinze ans… mais qui n'a encore jamais organisé d'élections nationales !",
    "C'est le Soudan du Sud.",
    "Le pays devait enfin voter le 22 décembre. Mais nouveau coup de théâtre : les élections sont repoussées au 11 février 2027 !",
    "Aucune raison officielle n'a été donnée.",
    "Pendant ce temps, l'ONU alerte sur les violences et les tensions politiques.",
    "Quinze ans après l'indépendance, les Sud-Soudanais attendent toujours leur premier scrutin national.",
]
PHOTO = {
 "crowd_vertical": {"name": "South Sudanese crowd gathers on independence day (5925619257).jpg", "author":"Sarah Taylor/USAID Africa Bureau", "date":"2011-07-09", "license":"Public domain — U.S. federal government", "page":"https://commons.wikimedia.org/wiki/File:South_Sudanese_crowd_gathers_on_independence_day_(5925619257).jpg"},
 "president": {"name":"Salva Kiir Mayardit The South Sudan president.jpg","author":"Evon2023", "date":"2020-10-02", "license":"CC0 1.0", "page":"https://commons.wikimedia.org/wiki/File:Salva_Kiir_Mayardit_The_South_Sudan_president.jpg"},
 "flag_man": {"name":"A South Sudanese man carries the flag (5925642623).jpg", "author":"Sarah Taylor/USAID Africa Bureau", "date":"2011-07-09", "license":"Public domain — U.S. federal government", "page":"https://commons.wikimedia.org/wiki/File:A_South_Sudanese_man_carries_the_flag_(5925642623).jpg"},
 "independence": {"name":"South Sudan independence celebration in Juba.jpg","author":"Sarah Taylor/USAID Africa Bureau", "date":"2011-07-09", "license":"Public domain — U.S. federal government", "page":"https://commons.wikimedia.org/wiki/File:South_Sudan_independence_celebration_in_Juba.jpg"},
}
FONT_FILE = None
FONT_CACHE = {}
def digest(p): return hashlib.sha256(Path(p).read_bytes()).hexdigest()
def font(size, weight=800):
    key = (size, weight)
    if key not in FONT_CACHE:
        f = ImageFont.truetype(str(FONT_FILE),size)
        try: f.set_variation_by_axes([weight])
        except Exception: raise RuntimeError("Manrope variable font missing weight axis")
        FONT_CACHE[key] = f
    return FONT_CACHE[key]
def title(draw, txt, x, y, size, color=WHITE, weight=800):
    f=font(size,weight)
    assert draw.textbbox((0,0),txt,font=f)[2] <= W-x-38, ("Headline doesn't fit",txt)
    draw.text((x,y),txt,fill=color,font=f,stroke_width=0)
def gradients(pic, strength=210):
    lay=Image.new("RGBA",(W,H),(0,0,0,0));d=ImageDraw.Draw(lay)
    for y in range(H):
        top=max(0,1-y/340)
        bottom=max(0,(y-470)/(H-470))
        aa=int(max(top*.70,bottom**1.4)*strength)
        d.line((0,y,W,y),fill=(2,12,29,aa))
    return Image.alpha_composite(pic.convert("RGBA"),lay)
def photo_bg(path, focus=(.50,.48), soften=False):
    im=Image.open(path).convert("RGB")
    assert im.width>=900 and im.height>=650, ("photo too small",im.size)
    im=ImageEnhance.Color(im).enhance(.94)
    im=ImageEnhance.Contrast(im).enhance(1.04)
    target=ImageOps.fit(im,(W,H),Image.Resampling.LANCZOS,centering=focus)
    if soften: target=target.filter(ImageFilter.GaussianBlur(1.3))
    return target
def base_plain():
    # Static, subtle cobalt editorial gradient. No invented country imagery.
    bg=Image.new("RGBA",(W,H),INK+(255,));pix=ImageDraw.Draw(bg)
    for y in range(H):
        c=int(11+29*math.exp(-((y-900)/700)**2))
        pix.line((0,y,W,y),fill=(4,18+c//3,39+c,255))
    return bg
def brand(im,logo):
    d=ImageDraw.Draw(im,"RGBA")
    d.rounded_rectangle((63,73,188,166),radius=13,fill=(255,255,255,244))
    small=logo.copy();small.thumbnail((106,83),Image.Resampling.LANCZOS)
    im.alpha_composite(small,(70+(111-small.width)//2,78+(82-small.height)//2))
    title(d,"WORLD-VISION",217,95,38,WHITE,800)
    d.line((68,204,1011,204),fill=CYAN+(95,),width=2)
def arch(im,txt):
    d=ImageDraw.Draw(im)
    title(d,txt,70,1540,31,SOFT,600)
def render_scene(idx,logo):
    if idx==2:
        im=base_plain()
    else:
        key = ["crowd_vertical","president",None,"flag_man","independence","crowd_vertical"][idx]
        focus = [(.50,.43),(.59,.40),None,(.39,.52),(.49,.50),(.53,.45)][idx]
        im=gradients(photo_bg(ASSETS/(key+".jpg"),focus),235)
    d=ImageDraw.Draw(im,"RGBA")
    if idx==0:
        title(d,"15 ANS",72,970,151,WHITE)
        title(d,"SANS ÉLECTIONS",72,1163,72,WHITE)
        title(d,"NATIONALES",72,1258,94,CYAN)
        arch(im,"ARCHIVES · JUBA, 2011")
    elif idx==1:
        title(d,"LE SOUDAN",74,1065,108,WHITE)
        title(d,"DU SUD",74,1203,157,CYAN)
        title(d,"INDÉPENDANT DEPUIS 2011",75,1410,38,SOFT,700)
        arch(im,"ARCHIVES · SALVA KIIR, 2020")
    elif idx==2:
        title(d,"ÉLECTIONS REPORTÉES",72,365,54,SOFT,700)
        title(d,"22 DÉC. 2026",70,590,94,WHITE)
        d.line((74,720,940,720),fill=RED+(245,),width=10)
        title(d,"NOUVELLE DATE",72,875,50,SOFT,700)
        title(d,"11 FÉV.",70,1000,161,CYAN)
        title(d,"2027",75,1181,192,WHITE)
        d.rounded_rectangle((72,1450,1008,1460),radius=4,fill=CYAN+(155,))
    elif idx==3:
        title(d,"AUCUNE RAISON",72,1105,78,WHITE)
        title(d,"OFFICIELLE",72,1220,105,CYAN)
        title(d,"N'A ÉTÉ DONNÉE",72,1390,49,WHITE)
        arch(im,"ARCHIVES · JUBA, 2011")
    elif idx==4:
        title(d,"L'ONU",72,1090,137,WHITE)
        title(d,"ALERTE",72,1243,145,CYAN)
        title(d,"VIOLENCES · TENSIONS",72,1416,49,WHITE)
        arch(im,"ARCHIVES · JUBA, 2011")
    else:
        title(d,"2011  →  2026",70,980,106,CYAN)
        title(d,"TOUJOURS",68,1132,119,WHITE)
        title(d,"EN ATTENTE",70,1290,102,WHITE)
        arch(im,"ARCHIVES · JUBA, 2011")
    brand(im,logo)
    return im.convert("RGB")
def synth_voice(model,voices):
    from kokoro_onnx import Kokoro
    from misaki.espeak import EspeakG2P
    kokoro=Kokoro(str(model),str(voices))
    g2p=EspeakG2P(language="fr-fr")
    tracks=[]
    for i,txt in enumerate(LINES):
        phonemes,_ = g2p(txt)
        wave_data,rate=kokoro.create(phonemes,"ff_siwis",speed=1.13,is_phonemes=True)
        wave_data=np.asarray(wave_data,dtype=np.float32)
        wave_data=np.concatenate([np.zeros(round(rate*.12),dtype=np.float32),wave_data,np.zeros(round(rate*.20),dtype=np.float32)])
        tracks.append((wave_data,rate))
    total=sum(len(x)/rate for x,rate in tracks)
    ratio=max(1.0,total/28.8)
    if ratio>1.46: raise RuntimeError(f"Voice requires excessive time compression: {total:.2f}s > 42s. Rewrite script with approval.")
    files=[]
    for i,(v,rate) in enumerate(tracks):
        source=OUT/f"voice-original-{i+1}.wav";sf.write(source,v,rate)
        target=OUT/f"voice-{i+1}.wav"
        subprocess.run(["ffmpeg","-y","-v","error","-i",str(source),"-af",f"atempo={ratio:.5f},loudnorm=I=-17:TP=-2:LRA=11","-ar","48000","-ac","1",str(target)],check=True)
        files.append(target)
    return files,ratio
def run(cmd): subprocess.run(cmd,check=True)
def seconds(p):
    d=json.loads(subprocess.check_output(["ffprobe","-v","error","-show_format","-of","json",str(p)]))
    return float(d["format"]["duration"])
def main():
    parser=argparse.ArgumentParser()
    parser.add_argument("--model",required=True)
    parser.add_argument("--voices",required=True)
    parser.add_argument("--font",required=True)
    parser.add_argument("--logo",required=True)
    a=parser.parse_args()
    global FONT_FILE
    FONT_FILE=Path(a.font)
    if digest(FONT_FILE)!=FONT_SHA: raise RuntimeError("Unpinned/inauthentic Manrope font")
    if subprocess.check_output(["git","hash-object",a.logo],text=True).strip()!=LOGO_BLOB: raise RuntimeError("World-Vision official logo changed unexpectedly")
    for k in PHOTO:
        if not (ASSETS/(k+".jpg")).exists(): raise FileNotFoundError("Missing authentic licensed photo "+k)
    OUT.mkdir(parents=True,exist_ok=True)
    logo=Image.open(a.logo).convert("RGBA")
    voice,compression=synth_voice(a.model,a.voices)
    clips=[]
    durations=[]
    for i,wav in enumerate(voice):
        png=OUT/f"scene-{i+1}.png"
        render_scene(i,logo).save(png,optimize=True)
        video=OUT/f"shot-{i+1}.mp4"
        duration=seconds(wav)
        # Subtle 3% camera movement, avoiding effects that distort real photographs.
        filt="[0:v]zoompan=z='min(zoom+0.00009,1.035)':d=1:x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':s=1080x1920:fps=30,format=yuv420p[v]"
        run(["ffmpeg","-y","-v","error","-loop","1","-framerate","30","-i",str(png),"-i",str(wav),
             "-filter_complex",filt,"-map","[v]","-map","1:a","-t",str(duration),
             "-c:v","libx264","-preset","veryfast","-crf","20","-pix_fmt","yuv420p",
             "-c:a","aac","-b:a","160k","-ar","48000","-movflags","+faststart",str(video)])
        clips.append(video);durations.append(seconds(video))
    listfile=OUT/"concat.txt"
    listfile.write_text("".join("file '"+str(p.resolve())+"'\n" for p in clips),encoding="utf-8")
    finished=OUT/"world-vision-soudan-du-sud-elections-v1.mp4"
    run(["ffmpeg","-y","-v","error","-f","concat","-safe","0","-i",str(listfile),"-c","copy","-movflags","+faststart",str(finished)])
    probe=json.loads(subprocess.check_output(["ffprobe","-v","error","-show_streams","-show_format","-of","json",str(finished)]))
    vid=next(x for x in probe["streams"] if x["codec_type"]=="video")
    aud=next(x for x in probe["streams"] if x["codec_type"]=="audio")
    length=float(probe["format"]["duration"])
    assert 0<length<=30.0, f"video exceeds 30 seconds: {length}"
    assert (vid["width"],vid["height"])==(1080,1920) and vid["codec_name"]=="h264"
    assert aud["codec_name"]=="aac"
    review=OUT/"review";review.mkdir(exist_ok=True)
    for i,t in enumerate([.9,length/2,length-.8],1):
        run(["ffmpeg","-y","-v","error","-ss",f"{t:.2f}","-i",str(finished),"-frames:v","1","-vf","scale=540:960",str(review/f"frame-{i}.jpg")])
    from PIL import Image as PILImage
    ims=[PILImage.open(review/f"frame-{i}.jpg") for i in (1,2,3)]
    contact=PILImage.new("RGB",(1620,960))
    for i,im in enumerate(ims):contact.paste(im,(540*i,0))
    contact.save(review/"contact-sheet.jpg",quality=88)
    manifest={
      "episode":"south-sudan-election-delay-2026-11-14","status":"rendered_awaiting_human_artistic_and_vocal_review",
      "user_publication_approval":False,"is_news_footage":False,
      "documentary_method":"authentic archival photographs + original text animation + French synthetic narrator",
      "voice":"Kokoro French ff_siwis / Apache-2.0 model / SIWIS source CC BY 4.0",
      "voice_atempo":round(compression,5),"narration":EDITORIAL,
      "duration_seconds":round(length,3),"scene_durations":durations,
      "frame_rate":FPS,"width":W,"height":H,"video_codec":"h264","audio_codec":"aac",
      "sources":[{"name":"Reuters", "url":"https://www.reuters.com/world/africa/south-sudan-delays-election-february-11-2027-2026-11-14/"},
                 {"name":"AP", "url":"https://apnews.com/article/c62033bb79a606ef8ce7e335cfc8478b"},
                 {"name":"UNMISS 10 November 2026","url":"https://unmiss.unmissions.org/en/press-releases/remarks-by-anita-kiki-gbeho-special-representative-of-the-secretary-general-1"}],
      "photos":PHOTO,
      "photo_sha256":{k:digest(ASSETS/(k+".jpg")) for k in PHOTO},
      "logo_sha256":digest(a.logo),"font_sha256":digest(FONT_FILE),
      "file_sha256":digest(finished),
      "note":"Archival shots explicitly captioned as ARCHIVES; no claim these are video of Nov 2026 electoral decision. No background music. Generated French voice must be listened to and approved."
    }
    (OUT/"manifest.json").write_text(json.dumps(manifest,ensure_ascii=False,indent=2)+"\n",encoding="utf8")
    print(json.dumps({"status":"RENDER_COMPLETE_NOT_ARTISTICALLY_APPROVED","video":str(finished),"duration":length,"sha":digest(finished)},ensure_ascii=False))
if __name__=="__main__":main()
