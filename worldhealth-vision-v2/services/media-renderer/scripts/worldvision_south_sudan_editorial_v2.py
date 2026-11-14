#!/usr/bin/env python3
"""World-Vision / South Sudan / Editorial V2.
Authentic NASA globe rotating to South Sudan; genuine licensed archival stills.
Completely different typography & visual grammar from V1: Archivo Black +
Inter, full-bleed photographic scenes, one clear visual beat per scene, no
debug copy, no decorative rules, no persistent corner logo or archive footer.
Narrator candidate via Microsoft Edge Neural: EDITORIAL REVIEW ONLY; a
separately licensed voice is mandatory before public commercial distribution.
"""
from __future__ import annotations
import argparse, asyncio, hashlib, json, math, os, re, shutil, subprocess
from pathlib import Path
import cv2
import numpy as np
from PIL import Image,ImageDraw,ImageFont,ImageOps,ImageEnhance,ImageFilter
from edge_tts import Communicate

WIDTH,HEIGHT,FPS=1080,1920,30
GW,GH=810,1440
CX,CY,RR=GW//2,615,322
ROOT=Path(__file__).resolve().parent.parent
A=ROOT/"assets"/"south-sudan-2026-11-14"
O=ROOT/"output"/"south-sudan-editorial-v2"
C=(9,19,26); PAPER=(246,243,232); ACCENT=(255,104,79)
DARKBLUE=(9,37,51); DIM=(188,202,203); WHITE=(255,255,255)
TARGET=(4.8594,31.5713)  # Geographical locator for capital Juba, South Sudan.
START=(5.,-37.)          # Atlantic-facing Earth, genuine 69-degree turn.
SCRIPT=[
 "Quinze ans d'indépendance. Zéro élection nationale.",
 "Au Soudan du Sud, indépendant depuis deux mille onze, le premier scrutin se fait toujours attendre.",
 "Les citoyens devaient élire leur président et leurs députés le vingt-deux décembre.",
 "Mais nouveau report : le vote est désormais fixé au onze février deux mille vingt-sept.",
 "La commission électorale ne donne aucune raison officielle. L'ONU alerte sur les violences et les tensions politiques.",
 "Quinze ans après sa naissance, le pays attend toujours ses premières élections nationales."
]
ON_SCREEN=[
 ("15 ANS.", "ZÉRO ÉLECTION.", "SOUDAN DU SUD"),
 ("2011.", "L'INDÉPENDANCE.", "JUBA • 2011"),
 ("LE PREMIER", "SCRUTIN ATTENDU.", "PRÉSIDENTIELLE + LÉGISLATIVES"),
 ("11 FÉVRIER", "2027.", "AU LIEU DU 22 DÉCEMBRE 2026"),
 ("AUCUNE RAISON", "OFFICIELLE.", "DES TENSIONS SIGNALÉES PAR L'ONU"),
 ("15 ANS.", "TOUJOURS EN ATTENTE.", "LE PREMIER VOTE NATIONAL")
]
ARCHIVE=[
 None,
 "crowd_vertical.jpg",
 "president.jpg",
 None,
 "flag_man.jpg",
 "independence.jpg"
]
FONT_HEAVY=None
FONT_NEWS=None
def sh(cmd,verbose=False):
    x=subprocess.run(cmd,check=True,stdout=None if verbose else subprocess.PIPE,
                     stderr=None if verbose else subprocess.PIPE,text=True)
    return x.stdout
def sha(p):return hashlib.sha256(Path(p).read_bytes()).hexdigest()
def ffprobe(path):
    return json.loads(sh(["ffprobe","-v","error","-show_streams","-show_format","-of","json",str(path)]))
def dur(path):return float(ffprobe(path)["format"]["duration"])
def ft(size,heavy=True):
    f=ImageFont.truetype(str(FONT_HEAVY if heavy else FONT_NEWS),size)
    return f
def fit_text(text,font_path,max_width,start,lower=23):
    for s in range(start,lower-1,-2):
        f=ImageFont.truetype(str(font_path),s)
        if ImageDraw.Draw(Image.new("RGB",(10,10))).textbbox((0,0),text,font=f)[2]<=max_width:
            return f
    raise ValueError("Title too long to fit: "+text)
def write(d,txt,x,y,size,color,heavy=True,maxw=None):
    f=fit_text(txt,FONT_HEAVY if heavy else FONT_NEWS,maxw or (WIDTH-x-64),size)
    d.text((x,y),txt,font=f,fill=color,stroke_width=0)
def gradient_photo(src):
    original=Image.open(src).convert("RGB")
    original=ImageEnhance.Contrast(original).enhance(1.08)
    original=ImageEnhance.Color(original).enhance(1.03)
    # More image than V1: make picture dominate the frame.
    pic=ImageOps.fit(original,(WIDTH,HEIGHT),Image.Resampling.LANCZOS,centering=(.50,.42))
    rgba=pic.convert("RGBA")
    over=Image.new("RGBA",(WIDTH,HEIGHT),(0,0,0,0))
    d=ImageDraw.Draw(over)
    for y in range(HEIGHT):
        alpha=int(226*np.clip((y-800)/850,0,1)**1.42)
        if y>1670:alpha=max(alpha,190)
        d.line((0,y,WIDTH,y),fill=(5,14,20,alpha))
    return Image.alpha_composite(rgba,over).convert("RGB")
def photo_card(index):
    idx=index
    im=gradient_photo(A/ARCHIVE[idx])
    d=ImageDraw.Draw(im)
    upper,lower,tag=ON_SCREEN[idx]
    # The image itself supplies the movement and most of the color. The headline
    # floats on a natural lower gradient; no framed box and no clipped stripes.
    write(d,upper,68,1304,98,PAPER)
    write(d,lower,68,1437,80,PAPER)
    # Tiny contextual place/date at TOP, not an archival production footer.
    if idx==1:
        write(d,"JUBA · 2011",70,74,30,WHITE,False)
    if idx==2:
        write(d,"SOUDAN DU SUD",70,74,30,WHITE,False)
    if idx==4:
        write(d,"SOUDAN DU SUD",70,74,30,WHITE,False)
    if idx==5:
        write(d,"2011 → 2026",70,74,30,WHITE,False)
    return im
def date_card():
    im=Image.new("RGB",(WIDTH,HEIGHT),PAPER)
    d=ImageDraw.Draw(im)
    # A striking clean typographic newspaper dateline, not the previous dark
    # blue line boxes and strike-through UI.
    d.rounded_rectangle((68,220,409,277),radius=23,fill=(21,43,54))
    write(d,"DÉCISION OFFICIELLE",84,229,24,WHITE,False)
    write(d,"REPORTÉ.",65,485,109,C)
    write(d,"11",57,677,310,ACCENT)
    write(d,"FÉVRIER",70,1076,109,C)
    write(d,"2027",66,1230,157,C)
    write(d,"Initialement prévu le 22 décembre 2026",70,1541,33,C,False)
    return im
def brand_end(im,logo):
    # The original approved PNG is reserved for the discreet closing signature:
    # the opening contains NO hard white logo plaque.
    im=im.convert("RGBA")
    d=ImageDraw.Draw(im)
    d.rounded_rectangle((61,1730,1015,1841),radius=22,fill=(248,247,242,234))
    logo=logo.copy();logo.thumbnail((88,80),Image.Resampling.LANCZOS)
    im.alpha_composite(logo,(78+(90-logo.width)//2,1746+(78-logo.height)//2))
    d=ImageDraw.Draw(im)
    write(d,"WORLD-VISION",194,1752,53,C)
    return im.convert("RGB")
def easy(x):
    x=np.clip(x,0,1);return x*x*(3-2*x)
def south_sudan_polygon(geo):
    raw=json.loads(Path(geo).read_text())
    arr=[]
    for feature in raw.get("features",[]):
        props=feature.get("properties") or {}
        n=" ".join(str(v) for v in props.values())
        if not ("South Sudan" in n or props.get("ISO3166-1-Alpha-3")=="SSD"):
            continue
        geom=feature.get("geometry") or {}
        coords=geom.get("coordinates") or []
        if geom.get("type")=="Polygon": outers=[coords[0]]
        elif geom.get("type")=="MultiPolygon":outers=[p[0] for p in coords]
        else: continue
        for poly in outers:
            arr.append(np.asarray(poly,dtype=np.float64))
    if not arr:raise ValueError("SSD polygon absent; cannot fabricate country geometry")
    return arr
def globe_clip(texture,geo,logo,seconds=3.0):
    tex=np.asarray(Image.open(texture).convert("RGB"),dtype=np.uint8)
    if tex.shape[:2]!=(2700,5400):raise ValueError("NASA authentic equirectangular required")
    polygons=south_sudan_polygon(geo)
    yy,xx=np.mgrid[-RR:RR+1,-RR:RR+1]
    xn=(xx/RR).astype(np.float32);yn=(-yy/RR).astype(np.float32)
    radial=xn*xn+yn*yn
    circle=radial<=1
    zz=np.sqrt(np.maximum(0,1-radial)).astype(np.float32)
    rr=np.sqrt(radial).astype(np.float32)
    # Base: midnight neutral ink. No starfield, no rings, no UI lines.
    base=np.empty((GH,GW,3),np.uint8);base[:]=C
    top=base.copy()
    textplate=Image.fromarray(top,"RGB")
    d=ImageDraw.Draw(textplate)
    # Typeface stays consistently different from the rejected Manrope.
    d.text((56,79),"LE MONDE EN 30 SECONDES",font=fit_text("LE MONDE EN 30 SECONDES",FONT_NEWS,698,28),fill=(205,215,213))
    d.text((55,1165),"SOUDAN DU SUD",font=fit_text("SOUDAN DU SUD",FONT_HEAVY,720,70),fill=PAPER)
    d.text((55,1281),"15 ANS. ZÉRO ÉLECTION.",font=fit_text("15 ANS. ZÉRO ÉLECTION.",FONT_HEAVY,715,44),fill=ACCENT)
    plate=np.asarray(textplate,dtype=np.uint8)
    out=O/"globe-opening-v2.mp4"
    frames=round(seconds*FPS)
    cmd=["ffmpeg","-y","-v","error","-f","rawvideo","-pix_fmt","rgb24",
         "-s",f"{GW}x{GH}","-r",str(FPS),"-i","pipe:0",
         "-vf",f"scale={WIDTH}:{HEIGHT}:flags=lanczos",
         "-c:v","libx264","-preset","veryfast","-crf","18","-pix_fmt","yuv420p","-movflags","+faststart",str(out)]
    proc=subprocess.Popen(cmd,stdin=subprocess.PIPE,stderr=subprocess.PIPE)
    try:
        for k in range(frames):
            t=k/FPS
            p=float(easy((t-.10)/2.10))
            lat=START[0]+(TARGET[0]-START[0])*p
            lon=START[1]+(TARGET[1]-START[1])*p
            a=math.radians(lat); lo=math.radians(lon)
            latitude=np.arcsin(np.clip(yn*math.cos(a)+zz*math.sin(a),-1,1))
            longitude=lo+np.arctan2(xn,zz*math.cos(a)-yn*math.sin(a))
            mapx=np.mod((longitude+math.pi)/(2*math.pi)*tex.shape[1],tex.shape[1]).astype(np.float32)
            mapy=np.clip((math.pi/2-latitude)/math.pi*tex.shape[0],0,tex.shape[0]-1).astype(np.float32)
            earth=cv2.remap(tex,mapx,mapy,cv2.INTER_LINEAR,borderMode=cv2.BORDER_WRAP)
            shade=np.clip(.60+.52*(zz*.84-xn*.21+yn*.10),.48,1.13)
            earth=np.clip(earth*shade[:,:,None],0,255).astype(np.uint8)
            frame=plate.copy()
            roi=frame[CY-RR:CY+RR+1,CX-RR:CX+RR+1]
            roi[circle]=earth[circle]
            # Physically based atmosphere close to limb, no circular neon lines.
            limb=np.exp(-((rr-1.0)/.027)**2)
            roi[:]=np.clip(roi.astype(np.float32)+limb[:,:,None]*np.array([8,26,38]),0,255).astype(np.uint8)
            # Geographic outline, true SSD polygon. Material only during arrival.
            if t>1.45:
                alpha=float(easy((t-1.45)/.55))
                for poly in polygons:
                    lons=np.deg2rad(poly[:,0]);lats=np.deg2rad(poly[:,1])
                    dif=lons-lo
                    px=np.cos(lats)*np.sin(dif)
                    py=np.sin(lats)*math.cos(a)-np.cos(lats)*np.cos(dif)*math.sin(a)
                    z=np.sin(lats)*math.sin(a)+np.cos(lats)*np.cos(dif)*math.cos(a)
                    mapped=np.column_stack((np.rint(CX+RR*px),np.rint(CY-RR*py))).astype(np.int32)
                    for j in range(len(poly)-1):
                        if z[j]>.12 and z[j+1]>.12 and np.linalg.norm(mapped[j]-mapped[j+1])<65:
                            cv2.line(frame,tuple(mapped[j]),tuple(mapped[j+1]),(255,190,133),max(1,int(3*alpha)),cv2.LINE_AA)
                # Accurately projected Juba marker; point represents national capital.
                lt,ln=map(math.radians,TARGET)
                dx=ln-lo
                gx=CX+RR*math.cos(lt)*math.sin(dx)
                gy=CY-RR*(math.sin(lt)*math.cos(a)-math.cos(lt)*math.cos(dx)*math.sin(a))
                if 0<=gx<GW and 0<=gy<GH:
                    cv2.circle(frame,(int(gx),int(gy)),6,ACCENT,-1,cv2.LINE_AA)
                    cv2.circle(frame,(int(gx),int(gy)),13,(247,236,214),2,cv2.LINE_AA)
            proc.stdin.write(frame.tobytes())
        proc.stdin.close()
        error=proc.stderr.read().decode(errors="replace")
        if proc.wait():raise RuntimeError(error[-2000:])
    finally:
        if proc.poll() is None:proc.kill()
    return out
async def synth_voice(txt,voice,path):
    obj=Communicate(txt,voice,rate="+13%",pitch="+0Hz")
    await obj.save(str(path))
async def generate_voice(voice):
    parts=[]
    for i,s in enumerate(SCRIPT):
        dst=O/f"voice-{i+1:02d}.mp3"
        await synth_voice(s,voice,dst)
        if dst.stat().st_size<6000:raise RuntimeError("Missing realistic speech: "+str(dst))
        parts.append(dst)
    return parts
def make_one_png(index,logo):
    png=O/f"card-{index+1:02d}.png"
    img=date_card() if index==3 else photo_card(index)
    if index==5:img=brand_end(img,logo)
    img.save(png,optimize=True)
    return png
def main():
    global FONT_HEAVY,FONT_NEWS
    ap=argparse.ArgumentParser()
    ap.add_argument("--texture",required=True,type=Path)
    ap.add_argument("--geojson",required=True,type=Path)
    ap.add_argument("--logo",required=True,type=Path)
    ap.add_argument("--headfont",required=True,type=Path)
    ap.add_argument("--bodyfont",required=True,type=Path)
    ap.add_argument("--voice",default="fr-FR-RemyMultilingualNeural")
    args=ap.parse_args()
    FONT_HEAVY=args.headfont;FONT_NEWS=args.bodyfont
    for f in [args.texture,args.geojson,args.logo,args.headfont,args.bodyfont]:
        if not f.is_file():raise FileNotFoundError(str(f))
    if sh(["git","hash-object",str(args.logo)]).strip()!="bc80fa70cebd566768bfb1703a0f1f636a78c196":
        raise RuntimeError("Official blue eye globe logo is not the accepted original")
    for item in ARCHIVE[1:]:
        if item and not (A/item).is_file():raise FileNotFoundError(str(A/item))
    O.mkdir(parents=True,exist_ok=True)
    voice_parts=asyncio.run(generate_voice(args.voice))
    lengths=[dur(p) for p in voice_parts]
    assert sum(lengths)<=29.9,(sum(lengths),lengths)
    # Globe starts at exactly frame zero; the chosen opening phrase is constrained
    # to 3s max. ffmpeg time-stretches only when required by the voice timings.
    logo=Image.open(args.logo).convert("RGBA")
    g=globe_clip(args.texture,args.geojson,logo,seconds=3.0)
    merged=[]
    for i,(speech,sec) in enumerate(zip(voice_parts,lengths)):
        still=None if i==0 else make_one_png(i,logo)
        out=O/f"scene-{i+1:02d}.mp4"
        if i==0:
            # Narration trimmed to opening 3s, or compressed within a safe 1.18x.
            atempo=max(1.0,sec/3.0)
            if atempo>1.18:raise RuntimeError("Opening narration too long for 3sec globe. Need a tighter spoken hook")
            ff_filter=f"[1:a]atempo={atempo:.5f},apad=pad_dur=0.2,atrim=0:3[a]"
            cmd=["ffmpeg","-y","-v","error","-i",str(g),"-i",str(speech),"-filter_complex",ff_filter,
                 "-map","0:v","-map","[a]","-t","3","-c:v","copy","-c:a","aac","-b:a","160k","-ar","48000",str(out)]
        else:
            target=sec
            z=f"zoompan=z='min(zoom+0.00017,1.065)':d=1:x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':s=1080x1920:fps=30,format=yuv420p"
            cmd=["ffmpeg","-y","-v","error","-loop","1","-framerate","30","-i",str(still),"-i",str(speech),
                 "-filter_complex","[0:v]"+z+"[v]","-map","[v]","-map","1:a","-t",str(target),
                 "-c:v","libx264","-preset","veryfast","-crf","19","-pix_fmt","yuv420p",
                 "-c:a","aac","-b:a","160k","-ar","48000","-movflags","+faststart",str(out)]
        sh(cmd)
        merged.append(out)
    listfile=O/"list.txt"
    listfile.write_text("".join("file '"+str(f.resolve())+"'\n" for f in merged),encoding="utf8")
    full=O/"world-vision-soudan-du-sud-editorial-v2.mp4"
    sh(["ffmpeg","-y","-v","error","-f","concat","-safe","0","-i",str(listfile),
        "-c","copy","-movflags","+faststart",str(full)])
    info=ffprobe(full)
    v=next(s for s in info["streams"] if s["codec_type"]=="video")
    a=next(s for s in info["streams"] if s["codec_type"]=="audio")
    total=float(info["format"]["duration"])
    assert (v["width"],v["height"])==(WIDTH,HEIGHT)
    assert v["codec_name"]=="h264" and a["codec_name"]=="aac"
    assert total<=30.,f"More than 30s: {total}"
    review=O/"review";review.mkdir(exist_ok=True)
    stamps=[.7,1.8,2.8,4.2,8.5,13.3,17.8,22.6,total-.6]
    for i,t in enumerate(stamps):
        sh(["ffmpeg","-y","-v","error","-ss",str(max(0,min(total-.1,t))),
            "-i",str(full),"-vf","scale=270:480","-frames:v","1",str(review/f"frame-{i+1:02d}.jpg")])
    montage=Image.new("RGB",(270*3,480*3),PAPER)
    for i in range(9):montage.paste(Image.open(review/f"frame-{i+1:02d}.jpg"),((i%3)*270,(i//3)*480))
    montage.save(review/"contact-sheet.jpg",quality=90)
    manifest={
     "episode":"south-sudan-first-national-elections-delay-v2",
     "duration_seconds":total,"output_video_sha256":sha(full),
     "voice_provider":"Microsoft Edge Neural via edge-tts; UNLICENSED for commercial use until enterprise licensing or equivalent cleared",
     "voice":args.voice,"voice_takes":SCRIPT,"spoken_track_lengths":lengths,
     "comment":"Non-publicable, user artistic and vocal approval pending. No cloned voices.",
     "storyboard_text":ON_SCREEN,"font_heading":"Archivo Black","font_secondary":"Inter",
     "font_sha256":{"head":sha(args.headfont),"body":sha(args.bodyfont)},
     "image_method":"real public-domain/CC0 historical photographs. Photos are NOT images of 2026 election announcement.",
     "geography":{"target_city":"Juba","lat":TARGET[0],"lon":TARGET[1],"texture":"NASA Blue Marble July","country_outline":"Natural Earth SSD"},
     "photo_sources":[
       "https://commons.wikimedia.org/wiki/File:South_Sudanese_crowd_gathers_on_independence_day_(5925619257).jpg",
       "https://commons.wikimedia.org/wiki/File:Salva_Kiir_Mayardit_The_South_Sudan_president.jpg",
       "https://commons.wikimedia.org/wiki/File:A_South_Sudanese_man_carries_the_flag_(5925642623).jpg",
       "https://commons.wikimedia.org/wiki/File:South_Sudan_independence_celebration_in_Juba.jpg"
     ],
     "news_sources":["https://www.reuters.com/world/africa/south-sudan-delays-election-february-11-2027-2026-11-14/","https://apnews.com/article/c62033bb79a606ef8ce7e335cfc8478b"],
     "original_logo_sha256":sha(args.logo),"logo_position":"only final closing signature, NEVER top white badge",
     "no_debug_captions":True,"no_archive_footer":True,"has_french_audio":True,
     "publication_authorized":False
    }
    (O/"manifest.json").write_text(json.dumps(manifest,ensure_ascii=False,indent=2)+"\n",encoding="utf8")
    print(json.dumps({"video":str(full),"duration":round(total,3),"sha":sha(full),"voice":args.voice}))
if __name__=="__main__":main()
