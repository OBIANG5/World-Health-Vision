#!/usr/bin/env python3
"""World-Vision | Guinea / Balato / Siguiri, 14 Nov 2026.
Production: locked user-selected text, scene-driven premium photo documentary,
real NASA/Natural Earth geography, real licensed but labelled illustrative photos,
Vivienne slower and more deliberate than the user's rejected S Sudan speed.
Important: this script creates a REVIEW candidate, never publication authorization.
"""
from __future__ import annotations
import argparse, asyncio, hashlib, json, math, re, subprocess
from pathlib import Path
import cv2
import numpy as np
import soundfile as sf
from PIL import Image, ImageDraw, ImageFont, ImageOps, ImageEnhance, ImageFilter
import edge_tts

W,H,FPS=1080,1920,30
GW,GH=810,1440
CX,CY,RR=GW//2,565,365
ROOT=Path(__file__).resolve().parent.parent
DOCS=ROOT.parents[1]/"docs/media/episodes/2026-11-14_guinee_siguiri"
A=ROOT/"assets"/"guinee-siguiri-2026-11-14"
OUT=ROOT/"output"/"guinee-siguiri-v1"
SCRIPT_SHA="0d0e268a9f189b9ae4b1714e89dbd67872444340ebce9c64260ee3f440cde8ac"
VOICE="fr-FR-VivienneMultilingualNeural"
LOGO_BLOB="bc80fa70cebd566768bfb1703a0f1f636a78c196"
GOLD=(238,193,97);PAPER=(244,240,226);WHITE=(255,254,247)
INK=(9,17,22); MUTED=(187,200,204);RED=(239,106,90)
S_GREEN=(26,81,66)
SIGUIRI=(11.42282,-9.16852)
BALATO=(11.57162,-9.32061)
CAM_START=(8.,-67.) # Atlantic, arrives at Guinea.
CAM_TARGET=(11.53,-9.28)
HEAD=None;BODY=None
script_lines=[]
def execute(cmd):
    return subprocess.run([str(s) for s in cmd],check=True,capture_output=True,text=True).stdout
def digest(path): return hashlib.sha256(Path(path).read_bytes()).hexdigest()
def probe(path):
    return json.loads(execute(["ffprobe","-v","error","-show_streams","-show_format","-of","json",str(path)]))
def seconds(path): return float(probe(path)["format"]["duration"])
def load_script():
    obj=json.loads((DOCS/"SCRIPT_LOCK_V1.json").read_text(encoding="utf8"))
    lines=obj["script_lines"]
    actual=hashlib.sha256("\n".join(lines).encode("utf8")).hexdigest()
    assert actual==obj["sha256_utf8_joined_with_lf"]==SCRIPT_SHA,("SCRIPT CHANGED",actual)
    assert obj["status"]=="USER_SELECTED_LOCKED_VERBATIM"
    assert len(lines)==10
    return lines
def font(sz,bold=True):
    p=HEAD if bold else BODY
    f=ImageFont.truetype(str(p),sz)
    try:
        axis=f.get_variation_axes()
        a=[]
        for x in axis:
            n=x["name"].decode("utf8",errors="replace").lower() if isinstance(x["name"],bytes) else str(x["name"]).lower()
            v=(690 if bold else 520) if "weight" in n else sz if "optical" in n else x["default"]
            a.append(max(x["minimum"],min(x["maximum"],v)))
        f.set_variation_by_axes(a)
    except (AttributeError,OSError):
        pass
    return f
def label(d,txt,x,y,size=35,color=WHITE,bold=False,maxw=None):
    limit=maxw or W-x-78
    for s in range(size,17,-2):
        f=font(s,bold)
        bbox=d.textbbox((0,0),txt,font=f)
        if bbox[2]-bbox[0]<=limit:
            d.text((x,y),txt,font=f,fill=color,stroke_width=0)
            return s
    raise ValueError("Overlong or unreadable text: "+txt)
def background(name,focus=(.5,.5),tone=1.0):
    im=Image.open(A/name).convert("RGB")
    if im.width<430 or im.height<275:raise RuntimeError("Source photo too small to include at all")
    im=ImageEnhance.Color(im).enhance(tone)
    im=ImageEnhance.Contrast(im).enhance(1.055)
    return ImageOps.fit(im,(W,H),Image.Resampling.LANCZOS,centering=focus)
def shade(im,top=False):
    ov=Image.new("RGBA",(W,H));d=ImageDraw.Draw(ov)
    for y in range(H):
        lo=np.clip((y-720)/(H-720),0,1)
        hi=np.clip((360-y)/360,0,1) if top else 0.
        alpha=int(237*(lo**1.20)+145*hi)
        d.line((0,y,W,y),fill=INK+(min(245,alpha),))
    return Image.alpha_composite(im.convert("RGBA"),ov).convert("RGB")
def headline(im,top,lines,accent=-1,small=None):
    im=shade(im,top=True);d=ImageDraw.Draw(im)
    label(d,top,74,210,29,MUTED,False)
    yy=1112 if len(lines)>=3 else 1220
    for i,line in enumerate(lines):
        label(d,line,76,yy+i*112,108 if len(line)<15 else 90,GOLD if i==accent else PAPER,True)
    if small:
        label(d,small,80,1556,27,MUTED,False)
    return im

def country_outline(data,iso="GIN"):
    obj=json.loads(Path(data).read_text(encoding="utf8"))
    output=[]
    for f in obj.get("features",[]):
        p=f.get("properties") or {}
        # Natural Earth country name and ISO 3166-1 Alpha-3.
        is_country = p.get("ISO3166-1-Alpha-3")==iso or p.get("ADMIN")=="Guinea" or p.get("name")=="Guinea"
        if not is_country: continue
        g=f.get("geometry") or {}
        polys=([g.get("coordinates")[0]] if g.get("type")=="Polygon" else
               [poly[0] for poly in g.get("coordinates",[])] if g.get("type")=="MultiPolygon" else [])
        for poly in polys:output.append(np.asarray(poly,dtype=np.float64))
    if not output:raise RuntimeError("Geographical GIN country polygon not found; refusing fake border")
    return output

def globe(texture,geo):
    out=OUT/"globe-guinee.mp4"
    tex=np.array(Image.open(texture).convert("RGB"),dtype=np.uint8)
    if tex.shape[:2]!=(2700,5400):raise RuntimeError("NASA original globe texture not 5400x2700")
    borders=country_outline(geo)
    yy,xx=np.mgrid[-RR:RR+1,-RR:RR+1]
    xn=xx/RR;yn=-yy/RR
    radial=xn*xn+yn*yn;mask=radial<=1
    zz=np.sqrt(np.maximum(0,1-radial))
    rr=np.sqrt(radial)
    plate=Image.new("RGB",(GW,GH),INK)
    d=ImageDraw.Draw(plate)
    hf=ImageFont.truetype(str(HEAD),64)
    sf1=ImageFont.truetype(str(BODY),33)
    d.text((57,1050),"GUINÉE.",font=hf,fill=PAPER)
    d.text((57,1181),"10 MORTS",font=ImageFont.truetype(str(HEAD),70),fill=WHITE)
    d.text((57,1262),"13 BLESSÉS",font=ImageFont.truetype(str(HEAD),61),fill=GOLD)
    d.text((59,1368),"BALATO · PRÈS DE SIGUIRI",font=ImageFont.truetype(str(BODY),20),fill=MUTED)
    base=np.asarray(plate,dtype=np.uint8)
    cmd=["ffmpeg","-y","-v","error","-f","rawvideo","-pix_fmt","rgb24",
         "-s",f"{GW}x{GH}","-r",str(FPS),"-i","pipe:0",
         "-vf",f"scale={W}:{H}:flags=lanczos",
         "-c:v","libx264","-preset","veryfast","-crf","18","-pix_fmt","yuv420p",str(out)]
    child=subprocess.Popen(cmd,stdin=subprocess.PIPE,stderr=subprocess.PIPE)
    try:
        for k in range(90):
            t=k/(FPS-1)/3
            p=np.clip(t,0,1);p=p*p*(3-2*p)
            la=CAM_START[0]+(CAM_TARGET[0]-CAM_START[0])*p
            lo=CAM_START[1]+(CAM_TARGET[1]-CAM_START[1])*p
            a=np.deg2rad(la);b=np.deg2rad(lo)
            ll=np.arcsin(np.clip(yn*np.cos(a)+zz*np.sin(a),-1,1))
            ln=b+np.arctan2(xn,zz*np.cos(a)-yn*np.sin(a))
            mx=np.mod((ln+np.pi)/(2*np.pi)*tex.shape[1],tex.shape[1]).astype(np.float32)
            my=np.clip((np.pi/2-ll)/np.pi*tex.shape[0],0,tex.shape[0]-1).astype(np.float32)
            sphere=cv2.remap(tex,mx,my,cv2.INTER_LINEAR,borderMode=cv2.BORDER_WRAP)
            sun=np.clip(.6+.52*(zz*.85-xn*.21+yn*.08),.46,1.15)
            sphere=np.clip(sphere*sun[:,:,None],0,255).astype(np.uint8)
            frame=base.copy()
            roi=frame[CY-RR:CY+RR+1,CX-RR:CX+RR+1]
            roi[mask]=sphere[mask]
            rim=np.exp(-((rr-1)/.028)**2)
            roi[:]=np.clip(roi.astype(np.float32)+rim[:,:,None]*np.array([12,28,28]),0,255).astype(np.uint8)
            if t>.47:
                alpha=(np.clip((t-.47)/.2,0,1))**2
                for poly in borders:
                    lons=np.deg2rad(poly[:,0]);lats=np.deg2rad(poly[:,1])
                    dx=lons-b
                    ax=np.cos(lats)*np.sin(dx)
                    ay=np.sin(lats)*np.cos(a)-np.cos(lats)*np.cos(dx)*np.sin(a)
                    z=np.sin(lats)*np.sin(a)+np.cos(lats)*np.cos(dx)*np.cos(a)
                    coords=np.column_stack((np.rint(CX+RR*ax),np.rint(CY-RR*ay))).astype(np.int32)
                    for j in range(len(poly)-1):
                        if z[j]>.1 and z[j+1]>.1 and np.linalg.norm(coords[j]-coords[j+1])<70:
                            cv2.line(frame,tuple(coords[j]),tuple(coords[j+1]),(91,196,244),max(1,int(2.5*alpha)),cv2.LINE_AA)
                for location,radn in [(SIGUIRI,5),(BALATO,8)]:
                    alat,alon=np.deg2rad(location)
                    dd=alon-b
                    px=CX+RR*np.cos(alat)*np.sin(dd)
                    py=CY-RR*(np.sin(alat)*np.cos(a)-np.cos(alat)*np.cos(dd)*np.sin(a))
                    if 0<px<GW and 0<py<GH:
                        cv2.circle(frame,(int(px),int(py)),radn,(238,193,97),-1,cv2.LINE_AA)
            child.stdin.write(frame.tobytes())
        child.stdin.close()
        err=child.stderr.read().decode(errors="replace")
        if child.wait():raise RuntimeError(err[-1500:])
    finally:
        if child.poll() is None:child.kill()
    return out

def geography(geo):
    background=Image.new("RGB",(W,H),INK)
    d=ImageDraw.Draw(background)
    borders=country_outline(geo)
    # All points projected consistently onto one accurate GIN country shape.
    bounds=(-15.4,-7.5,7.1,12.8) # lon min/max and lat min/max
    def xy(lat,lon):
        return (int(130+(lon-bounds[0])/(bounds[1]-bounds[0])*800),
                int(475+(bounds[3]-lat)/(bounds[3]-bounds[2])*850))
    for poly in borders:
        pts=[xy(lat,lon) for lon,lat in poly]
        d.polygon(pts,fill=(26,62,55),outline=(79,139,118),width=4)
    for lat,lon in [SIGUIRI,BALATO]:
        x,y=xy(lat,lon);d.ellipse((x-12,y-12,x+12,y+12),fill=GOLD)
        d.ellipse((x-25,y-25,x+25,y+25),outline=WHITE,width=3)
    label(d,"NORD-EST DE LA GUINÉE",80,225,37,MUTED,False)
    label(d,"BALATO",78,1455,107,PAPER,True)
    label(d,"PRÈS DE SIGUIRI",81,1593,39,GOLD,False)
    return background

def board(kind,geo,logo):
    if kind=="gold":
        # Illustrative modern West African soil mining, never Balato footage.
        im=headline(background("red_soil_illustration.jpg",(.48,.45),.90),
                    "ORPAILLAGE · CONTEXTE",["UN DRAME", "AUTOUR DE L'OR."],accent=1)
    elif kind=="location":
        im=geography(geo)
    elif kind=="ban":
        im=headline(background("river_illustration.jpg",(.52,.50),.92),
                    "INTERDICTION · 2 NOVEMBRE",["9 JOURS", "PLUS TARD."],accent=0)
    elif kind=="confront":
        im=headline(background("red_soil_illustration.jpg",(.61,.55),.67),
                    "BALATO · 11 NOVEMBRE",["DES", "BARRICADES.", "PUIS DES TIRS."],accent=2)
    elif kind=="foreign":
        im=Image.new("RGB",(W,H),INK);d=ImageDraw.Draw(im)
        label(d,"BILAN PROVISOIRE",83,258,36,MUTED,False)
        label(d,"5",72,490,410,GOLD,True)
        label(d,"DES 10 MORTS",90,1120,93,PAPER,True)
        label(d,"SONT ÉTRANGERS",89,1240,72,PAPER,True)
        label(d,"IDENTITÉS NON ÉTABLIES",88,1420,29,MUTED,False)
    elif kind=="why":
        im=headline(background("river_illustration.jpg",(.48,.47),.66),
                    "LES QUESTIONS DERRIÈRE LE DRAME",["POURQUOI", "UNE TELLE", "TENSION ?"],accent=2)
    elif kind=="river":
        im=headline(background("river_illustration.jpg",(.58,.5),1),
                    "DÉGRADATIONS DÉNONCÉES",["DES TERRES.", "DES RIVIÈRES."],accent=1)
    elif kind=="families":
        # Legitimate Siguiri picture is tiny; inset the original documentary
        # at less than 2x instead of faking a sharp 4K full-screen source.
        im=background("red_soil_illustration.jpg",(.55,.46),.78).filter(ImageFilter.GaussianBlur(15))
        im=shade(im,True)
        original=Image.open(A/"woman_siguiri_usaid.jpg").convert("RGB")
        image=ImageOps.contain(original,(815,650),Image.Resampling.LANCZOS)
        x=(W-image.width)//2;y=435
        im.paste(image,(x,y))
        d=ImageDraw.Draw(im)
        d.rectangle((x-3,y-3,x+image.width+3,y+image.height+3),outline=(232,226,213),width=3)
        label(d,"UNE ORPAILLEUSE À SIGUIRI · PHOTO USAID",75,250,29,WHITE,False)
        label(d,"DES FAMILLES",76,1254,91,PAPER,True)
        label(d,"EN DÉPENDENT.",76,1381,78,GOLD,True)
    elif kind=="question":
        im=Image.new("RGB",(W,H),INK)
        d=ImageDraw.Draw(im)
        label(d,"L'ENQUÊTE DOIT ÉTABLIR LES FAITS",76,380,34,MUTED,False)
        label(d,"QUI A",76,755,144,PAPER,True)
        label(d,"TIRÉ LE",76,926,144,PAPER,True)
        label(d,"PREMIER ?",76,1107,118,GOLD,True)
    elif kind=="justice":
        im=Image.new("RGB",(W,H),INK)
        d=ImageDraw.Draw(im)
        label(d,"BALATO · GUINÉE",87,320,35,MUTED,False)
        label(d,"UNE ENQUÊTE",83,765,107,PAPER,True)
        label(d,"EST OUVERTE.",83,902,103,GOLD,True)
        # Original logo only, no created plaque and no fake brand logo.
        mark=logo.copy();mark.thumbnail((75,75),Image.Resampling.LANCZOS)
        im=im.convert("RGBA");im.alpha_composite(mark,(92,1454))
        d=ImageDraw.Draw(im)
        label(d,"WORLD-VISION",185,1472,36,PAPER,True)
        im=im.convert("RGB")
    else:raise KeyError(kind)
    out=OUT/(kind+".png")
    im.save(out,optimize=True)
    return out
def raw_pcm(mp3):
    p=subprocess.run(["ffmpeg","-v","error","-i",str(mp3),"-ac","1","-ar","48000",
        "-f","f32le","pipe:1"],stdout=subprocess.PIPE,stderr=subprocess.PIPE,check=True)
    return np.frombuffer(p.stdout,dtype=np.float32).copy()
def strip_silence(x):
    # Preserve fricatives and natural phrase endings; trim only Edge buffer.
    step=480
    arr=np.array([np.sqrt(np.mean(x[i:i+step]**2)) for i in range(0,len(x),step)])
    hit=np.where(arr>.0012)[0]
    if len(hit)<12:raise RuntimeError("No audible voice segment")
    a=max(0,int(hit[0]*step)-int(.065*48000))
    b=min(len(x),int(hit[-1]*step)+int(.115*48000))
    return x[a:b]
async def get_takes(lines):
    alltracks=[];spk=[]
    for i,line in enumerate(lines):
        pieces=re.split(r"(?<=[.!?])\s+",line)
        assert " ".join(pieces)==line,"Split changed the locked script!"
        takes=[]
        for j,piece in enumerate(pieces):
            # Human newsreader pace: hook articulate, emotionally difficult
            # details deliberately slow. No mechanical speedups.
            r="-35%" if i in (0,3) else "-40%" if i in (4,8,9) else "-38%"
            dst=OUT/f"vivienne-{i:02d}-{j:02d}.mp3"
            await edge_tts.Communicate(piece,VOICE,rate=r,pitch="+0Hz").save(str(dst))
            if dst.stat().st_size<3400:raise RuntimeError(f"Invalid voice: {i}/{j}")
            takes.append(dst)
        alltracks.append(takes)
    return alltracks
def build_voice(lines):
    tracks=asyncio.run(get_takes(lines))
    whole=[]
    event_durations=[]
    pauses=[]
    for i,takes in enumerate(tracks):
        for j,t in enumerate(takes):
            whole.append(strip_silence(raw_pcm(t)))
            gap=.12 if j<len(takes)-1 else (.28 if i in (0,4,8) else .16)
            if i==len(tracks)-1:gap=.08
            whole.append(np.zeros(round(48000*gap),dtype=np.float32))
        event_durations.append(sum(len(part)/48000 for part in whole[len(whole)-2*len(takes):]))
    full=np.concatenate(whole)
    orig=OUT/"vivienne-original.wav";sf.write(orig,full,48000,subtype="PCM_24")
    adjusted=OUT/"vivienne-review.wav"
    execute(["ffmpeg","-y","-v","error","-i",str(orig),
             "-af","loudnorm=I=-16:TP=-1.5:LRA=10","-ar","48000","-ac","1",str(adjusted)])
    dur=seconds(adjusted)
    wpm=sum(len(re.findall(r"\b[\w’-]+\b",s)) for s in lines)*60/dur
    assert 100<=wpm<=167,f"Voice too fast or slow: {wpm:.1f} words/min"
    assert dur<=59.5,("Voice exceeds permitted duration; refuse to rewrite",dur)
    return adjusted,event_durations,dur,wpm
def render_still(path,length,out):
    n=max(1,round(FPS*length))
    # Optical movement on real still only: conservative 3% movement, not flashy.
    vf="zoompan=z='min(zoom+0.00012,1.04)':d=1:x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':s=1080x1920:fps=30,format=yuv420p"
    execute(["ffmpeg","-y","-v","error","-loop","1","-framerate","30","-i",str(path),
             "-vf",vf,"-frames:v",str(n),"-c:v","libx264","-preset","veryfast",
             "-crf","18","-pix_fmt","yuv420p",str(out)])
    return n/FPS
def clip_plan(events,voice_seconds,geo,logo):
    opening=globe(A/"nasa-earth-5400.jpg",geo)
    photos=[];plan=[]
    def make(kind,s):
        p=board(kind,geo,logo)
        dst=OUT/f"shot-{len(photos):02d}-{kind}.mp4"
        actual=render_still(p,max(.2,s),dst)
        photos.append(dst);plan.append({"visual":kind,"seconds":actual})
    photos.append(opening);plan.append({"visual":"globe_guinea_verified_geography","seconds":3.})
    # First 3s preserve every syllable; remainder of first narration on new real
    # photo board. No duplicated scene or text on top of title.
    if events[0]<=3.1: raise RuntimeError("Opening narration too short for a legible 3s geographical locator")
    make("gold",events[0]-3)
    steps=["location","ban","confront","foreign","why","river","families","question","justice"]
    for kind,duration in zip(steps,events[1:]):make(kind,duration)
    return photos,plan
def audio_gate(wav):
    job=subprocess.run(["ffmpeg","-hide_banner","-i",str(wav),"-af",
            "silencedetect=noise=-37dB:d=0.85","-f","null","-"],capture_output=True,text=True)
    hits=[ln for ln in job.stderr.splitlines() if "silence_duration:" in ln]
    if hits:raise RuntimeError("Silence >850ms in spoken master: "+"; ".join(hits[:3]))
def main():
    parser=argparse.ArgumentParser()
    parser.add_argument("--texture",type=Path,required=True)
    parser.add_argument("--geojson",type=Path,required=True)
    parser.add_argument("--headfont",type=Path,required=True)
    parser.add_argument("--bodyfont",type=Path,required=True)
    parser.add_argument("--logo",type=Path,required=True)
    a=parser.parse_args()
    global HEAD,BODY
    HEAD,BODY=a.headfont,a.bodyfont
    OUT.mkdir(parents=True,exist_ok=True)
    for p in [HEAD,BODY,a.texture,a.geojson,a.logo,
              A/"woman_siguiri_usaid.jpg",A/"siguiri_village_usaid.jpg",
              A/"red_soil_illustration.jpg",A/"river_illustration.jpg"]:
        if not p.exists():raise FileNotFoundError(str(p))
    assert execute(["git","hash-object",str(a.logo)]).strip()==LOGO_BLOB,"Original World-Vision logo changed"
    lines=load_script()
    wav,durations,total,wpm=build_voice(lines)
    audio_gate(wav)
    logo=Image.open(a.logo).convert("RGBA")
    clips,plans=clip_plan(durations,total,a.geojson,logo)
    listfile=OUT/"files.txt"
    listfile.write_text("".join("file '"+str(c.resolve())+"'\n" for c in clips),encoding="utf8")
    mute=OUT/"silent-film.mp4"
    execute(["ffmpeg","-y","-v","error","-f","concat","-safe","0","-i",str(listfile),
             "-r","30","-c:v","libx264","-preset","veryfast","-crf","18","-pix_fmt","yuv420p",
             "-movflags","+faststart",str(mute)])
    final=OUT/"world-vision-guinee-siguiri-v1-vivienne-review.mp4"
    # Voice continuous: no discontinuities created at video cut boundaries.
    execute(["ffmpeg","-y","-v","error","-i",str(mute),"-i",str(wav),
             "-map","0:v:0","-map","1:a:0","-t",f"{min(seconds(mute),total):.3f}",
             "-c:v","copy","-c:a","aac","-b:a","192k","-ar","48000",
             "-movflags","+faststart",str(final)])
    p=probe(final)
    vv=next(x for x in p["streams"] if x["codec_type"]=="video")
    aa=next(x for x in p["streams"] if x["codec_type"]=="audio")
    elapsed=float(p["format"]["duration"])
    assert 15<elapsed<=60,(elapsed,"Bad duration")
    assert vv["width"]==W and vv["height"]==H and vv["codec_name"]=="h264"
    assert aa["codec_name"]=="aac"
    review=OUT/"review";review.mkdir(exist_ok=True)
    stamps=[.48,1.55,2.62]+[round(elapsed*t,3) for t in (.16,.29,.41,.58,.75,.94)]
    contact=Image.new("RGB",(320*3,569*3),INK)
    for i,t in enumerate(stamps):
        frame=review/f"frame-{i+1:02d}.jpg"
        execute(["ffmpeg","-y","-v","error","-ss",f"{min(t,elapsed-.1):.3f}",
                 "-i",str(final),"-vf","scale=320:569","-frames:v","1",str(frame)])
        im=Image.open(frame).convert("RGB")
        contact.paste(im,((i%3)*320,(i//3)*569))
    contact.save(review/"contact-sheet.jpg",quality=91)
    manifest={
      "episode":"Guinea-Siguiri-Balato-11-Nov-2026","state":"REVIEW_ONLY_NOT_LICENSED_FOR_COMMERCIAL_TTS",
      "script_sha256":SCRIPT_SHA,"script_verbatim":lines,
      "voice":"fr-FR-VivienneMultilingualNeural","voice_rate":"slow split-prosody -35% to -40%",
      "voice_words_per_minute":round(wpm,2),"voice_no_time_stretch":True,
      "voice_commercial_license_verified":False,"publication_authorized":False,
      "duration_seconds":round(elapsed,3),"audio_duration_seconds":round(total,3),
      "video_sha256":digest(final),"resolution":"1080x1920","fps":FPS,
      "video_codec":"h264","audio_codec":"aac",
      "image_status":"Archival Siguiri USAID photographs and geographically disclosed non-Guinea illustration only; no Balato battle footage",
      "geography":{"Balato":{"lat":BALATO[0],"lon":BALATO[1]},
                   "Siguiri":{"lat":SIGUIRI[0],"lon":SIGUIRI[1]},
                   "globe":"NASA Blue Marble July + Natural Earth exact Guinea polygon"},
      "visual_timeline":plans,
      "sources":[
        {"kind":"news","url":"https://www.reuters.com/world/africa/10-killed-clashes-guinea-after-artisanal-mining-ban-2026-11-13/"},
        {"kind":"official","url":"https://gouvernement.gov.gn/wp-content/uploads/2026/11/COMMUNIQUE-NA%C2%B0-008-MATD-CAB-2026-DU-GOUVERNEMENT-RELATIF-AUX-EVENEMENTS-SURVENUS-LE-11-NOVEMBRE-2026-A-BALATO-PREFECTURE-DE-KINTINIAN-DU-12112026.pdf"},
        {"kind":"news","url":"https://apnews.com/article/3bf55251d4da7159b04e031c8783d7a4"},
        {"kind":"authentic_archival_photo","name":"Guinea Siguiri miner woman, 2000","license":"US Federal Government PD (USAID)","url":"https://commons.wikimedia.org/wiki/File:Guinea_Siguiri_miner_woman.jpg"},
        {"kind":"authentic_archival_photo","name":"Guinea Siguiri village, published 2006","license":"US Federal Government PD (USAID)","url":"https://commons.wikimedia.org/wiki/File:Guinea_Siguiri_village.jpg"},
        {"kind":"illustration_not_guinea","name":"Aerial view of red soil extraction","creator":"Umar Yakubu, via Pexels","license":"Pexels License","url":"https://www.pexels.com/photo/aerial-view-of-red-soil-extraction-scene-31570538/"},
        {"kind":"illustration_not_guinea","name":"Aerial river excavation (Paraguay)","creator":"Perrito doggy Fotos y videos variados, via Pexels","license":"Pexels License","url":"https://www.pexels.com/photo/aerial-view-of-a-river-with-excavators-digging-sand-and-clay-deposits-on-its-banks-17165570/"}
      ],
      "photo_sha256":{f:digest(A/f) for f in ["woman_siguiri_usaid.jpg","siguiri_village_usaid.jpg","red_soil_illustration.jpg","river_illustration.jpg"]},
      "headfont_sha256":digest(HEAD),"bodyfont_sha256":digest(BODY),
      "official_logo_sha256":digest(a.logo),"narration_audition_required":True,"artistic_approval":False
    }
    (OUT/"manifest.json").write_text(json.dumps(manifest,ensure_ascii=False,indent=2)+"\n",encoding="utf8")
    print(json.dumps({"status":"TECH_RENDER_CANDIDATE","duration":round(elapsed,3),
       "voice_wpm":round(wpm,2),"file_sha":manifest["video_sha256"],
       "script_sha":SCRIPT_SHA,"video":str(final)},ensure_ascii=False))
if __name__=="__main__":main()
