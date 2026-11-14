#!/usr/bin/env python3
"""S03 — World-Vision newsroom: physically coherent Earth-turn toward Shenzhen.

Use original D00-v6 eye image in the PREVIOUS S02 brand shot, then the
photographic, properly georeferenced globe in this locator shot. A single fixed
D00 image cannot be rotated into Asia without inventing geography.

Inputs: NASA Blue Marble January topography (global 5400x2700), Natural Earth
country-border GeoJSON, and THE EXACT official World-Vision G0 PNG.
Output: 4.9 s, H264 1080x1920 30fps, accurate city marker; no narration.
"""
from __future__ import annotations
import argparse
import hashlib
import json
import math
import subprocess
from pathlib import Path

import cv2
import numpy as np
from PIL import Image, ImageDraw, ImageFont

W,H,FPS,FRAMES=1080,1920,30,147
CX,CY,R=540,905,461
START_LAT,START_LON=12.0,14.0
TARGET_LAT,TARGET_LON=22.5431,114.0579 # Shenzhen city centre, NOT venue address
DURATION=FRAMES/FPS
BLUE=(2,17,42)
CYAN=np.array([70.,227.,255.])
SHA_LOGO_GIT_BLOB="bc80fa70cebd566768bfb1703a0f1f636a78c196"
TARGET_LABEL="SHENZHEN"

def sha(p):
    return hashlib.sha256(Path(p).read_bytes()).hexdigest()

def ease(t):
    t=np.clip(t,0.,1.)
    return t*t*t*(t*(6*t-15)+10)

def headline_font(size):
    for name in [
        "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf",
        "/usr/share/fonts/truetype/liberation2/LiberationSans-Bold.ttf",
    ]:
        if Path(name).is_file():
            return ImageFont.truetype(name,size)
    raise RuntimeError("No licensed legible font installed")

def canvas_base():
    yy,xx=np.mgrid[0:H,0:W]
    d=np.sqrt(((xx-540)/820)**2+((yy-700)/1500)**2)
    glow=np.exp(-((xx-560)**2/(780**2)+(yy-580)**2/(930**2)))*35
    bg=np.stack([5+glow*.28,17+glow*.53,41+glow],axis=-1)
    bg*=np.clip(1.02-d*.20,.66,1.)[:,:,None]
    bg=np.clip(bg,0,255).astype("uint8")
    rng=np.random.default_rng(20261114)
    for xx,yy in zip(rng.integers(30,W-30,23),rng.integers(160,1650,23)):
        c=int(rng.integers(65,135))
        cv2.circle(bg,(int(xx),int(yy)),1,(c//3,c//2,c),-1,cv2.LINE_AA)
    return bg

def fonttext(base,text,x,y,font,color,spacing=0):
    im=Image.fromarray(base)
    d=ImageDraw.Draw(im)
    if not spacing:
        d.text((x,y),text,font=font,fill=tuple(int(a) for a in color),stroke_width=0)
    else:
        p=x
        for ch in text:
            d.text((p,y),ch,font=font,fill=tuple(int(a) for a in color))
            p+=d.textlength(ch,font=font)+spacing
    return np.array(im, dtype=np.uint8, copy=True)

def text_layer(title,subtitle,badge):
    # Full-frame transparent overlay. Pre-rendered once for smooth animation.
    im=Image.new("RGBA",(W,H),(0,0,0,0))
    d=ImageDraw.Draw(im)
    d.rounded_rectangle((77,1470,1003,1712),radius=22,
        fill=(2,20,44,235),outline=(43,166,216,130),width=2)
    d.rectangle((76,1492,86,1695),fill=(49,223,250,255))
    d.text((116,1503),title,font=headline_font(98),fill=(248,252,255,255))
    d.text((119,1627),subtitle,font=headline_font(39),fill=(84,226,248,255))
    d.text((81,1745),badge,font=headline_font(24),fill=(187,215,229,255))
    d.line((78,1842,1001,1842),fill=(65,158,192,120),width=2)
    return np.asarray(im)

def overlay_rgba(dst,rgba,opacity=1.):
    if opacity<=0:return dst
    a=rgba[:,:,3].astype("float32")[:,:,None]/255*float(opacity)
    dst[:]=np.clip(dst.astype("float32")*(1-a)+rgba[:,:,:3].astype("float32")*a,0,255).astype("uint8")
    return dst

def water_color(rgb):
    """Apply an editorial blue grade while keeping actual NASA land geography."""
    r,g,b=rgb[:,:,0].astype("float32"),rgb[:,:,1].astype("float32"),rgb[:,:,2].astype("float32")
    bright=np.max(rgb,axis=2).astype("float32")
    ocean=np.clip((55-bright)/40,0,1)
    # Black ocean from NASA topography becomes deep sea blue, not black.
    ocean_rgb=np.stack((12+bright*.34,38+bright*.54,104+bright*.73),axis=-1)
    graded=np.stack((r*1.24+4,g*1.37+4,b*1.46+5),axis=-1)
    # Keep genuinely white ice, snow, coastlines; and lush green land.
    return np.clip(graded*(1-ocean[:,:,None])+ocean_rgb*ocean[:,:,None],0,255)

def prep_geometry(geojson_path):
    raw=json.loads(Path(geojson_path).read_text("utf-8"))
    polys=[]
    for feature in raw.get("features",[]):
        geom=feature.get("geometry") or {}
        coordinates=geom.get("coordinates",[])
        if geom.get("type")=="Polygon":
            candidates=coordinates
        elif geom.get("type")=="MultiPolygon":
            candidates=[ring for poly in coordinates for ring in poly]
        else:continue
        for ring in candidates:
            if len(ring)<4:continue
            # For a globe 922 pixels wide, avoid over-drawing unseen subpixel detail.
            stride=max(1,len(ring)//720)
            arr=np.asarray(ring[::stride],dtype="float32")
            if arr.ndim!=2 or arr.shape[1]<2:continue
            if len(arr)<2:continue
            rad=np.deg2rad(arr[:,:2]).astype("float32")
            polys.append((rad[:,0],rad[:,1]))
    if len(polys)<150:
        raise ValueError("World border GeoJSON unexpectedly sparse — refusing fabricated map")
    return polys

def draw_borders(frame,polys,lat0,lon0):
    la=np.deg2rad(lat0);lo=np.deg2rad(lon0)
    co,si=np.cos(la),np.sin(la)
    layer=np.zeros((2*R+1,2*R+1,3),np.uint8)
    for lon,lat in polys:
        dif=lon-lo
        cl=np.cos(lat);sl=np.sin(lat)
        cd=np.cos(dif)
        x=cl*np.sin(dif)
        y=sl*co-cl*cd*si
        z=sl*si+cl*cd*co
        visible=z>0.04
        px=np.rint(R+R*x).astype(np.int32)
        py=np.rint(R-R*y).astype(np.int32)
        ok=visible[:-1]&visible[1:]&(np.abs(np.diff(px))<65)&(np.abs(np.diff(py))<65)
        # Avoid connecting distant features at the horizon or date line.
        starts=np.flatnonzero(ok)
        for idx in starts:
            cv2.line(layer,(int(px[idx]),int(py[idx])),
                     (int(px[idx+1]),int(py[idx+1])),(181,214,232),1,cv2.LINE_AA)
    roi=frame[CY-R:CY+R+1,CX-R:CX+R+1]
    mask=layer[:,:,2]>12
    if np.any(mask):
        roi[mask]=(roi[mask].astype("float32")*.57+layer[mask].astype("float32")*.43).astype("uint8")

def build_logo(g0):
    logo=Image.open(g0).convert("RGB")
    # The original pixels are displayed; only the contain-box size is changed.
    logo.thumbnail((128,85),Image.Resampling.LANCZOS)
    return np.asarray(logo)

def draw_logo(frame,logo):
    x,y=77,81
    h,w=logo.shape[:2]
    cv2.rectangle(frame,(x-4,y-4),(x+w+4,y+h+4),(245,243,239),-1)
    frame[y:y+h,x:x+w]=logo
    # Text is additional programme metadata, not a redraw of the official logo.
    word="WORLD-VISION"
    return fonttext(frame,word,x+w+21,y+19,headline_font(35),(236,249,255),1)

def generate(args):
    texture=np.asarray(Image.open(args.texture).convert("RGB"),dtype=np.uint8)
    if texture.shape[1]<4000 or texture.shape[0]*2!=texture.shape[1]:
        raise ValueError("Expected genuine NASA geographic 2:1 equirectangular texture.")
    geo=prep_geometry(args.geojson)
    logo=build_logo(args.logo)
    base=canvas_base()
    text_plate=text_layer("SHENZHEN","CHINE  •  19 NOVEMBRE 2026","VILLE ANNONCÉE • SOMMET APEC")
    sz=2*R+1
    yy,xx=np.mgrid[-R:R+1,-R:R+1]
    xn=xx.astype("float32")/R
    yn=-yy.astype("float32")/R
    radial=xn*xn+yn*yn
    circle=radial<=1.
    zp=np.sqrt(np.maximum(0,1-radial)).astype("float32")
    # Use only the sphere crop, with cv2.remap of authentic satellite imagery.
    phi=np.deg2rad(TARGET_LAT)
    lam=np.deg2rad(TARGET_LON)
    fin=Path(args.output); fin.parent.mkdir(parents=True,exist_ok=True)
    cmd=["ffmpeg","-y","-hide_banner","-loglevel","error","-f","rawvideo",
         "-pix_fmt","rgb24","-s:v",f"{W}x{H}","-r",str(FPS),"-i","pipe:0",
         "-an","-c:v","libx264","-preset","fast","-crf","17",
         "-pix_fmt","yuv420p","-movflags","+faststart",str(fin)]
    proc=subprocess.Popen(cmd,stdin=subprocess.PIPE,stderr=subprocess.PIPE)
    try:
        for k in range(FRAMES):
            t=k/FPS
            # 1.9s rotation, then hold to let the reader locate Shenzhen.
            p=float(ease((t-.22)/2.12))
            lat0=START_LAT+(TARGET_LAT-START_LAT)*p
            lon0=START_LON+(TARGET_LON-START_LON)*p
            a=np.deg2rad(lat0)
            lo=np.deg2rad(lon0)
            # Vector inverse orthographic camera projection.
            sl=yn*np.cos(a)+zp*np.sin(a)
            latitude=np.arcsin(np.clip(sl,-1,1))
            longitude=lo+np.arctan2(xn,zp*np.cos(a)-yn*np.sin(a))
            mapx=np.mod((longitude+np.pi)/(2*np.pi)*texture.shape[1],texture.shape[1]).astype("float32")
            mapy=np.clip((np.pi/2-latitude)/np.pi*texture.shape[0],0,texture.shape[0]-1).astype("float32")
            sampled=cv2.remap(texture,mapx,mapy,cv2.INTER_LINEAR,borderMode=cv2.BORDER_WRAP)
            earth=water_color(sampled)
            # Gentle directional lighting, no night-time city light fiction.
            shade=np.clip(.66+.45*(zp*.87+(-xn)*.17+(yn)*.14),.56,1.15)
            earth=np.clip(earth*shade[:,:,None],0,255).astype("uint8")
            # Thin cyan edge exactly on the mathematical globe radius.
            rim=np.clip((np.sqrt(radial)-.955)/.045,0,1)
            earth=np.clip(earth+rim[:,:,None]*np.array([12,35,45])[None,None,:],0,255).astype("uint8")
            frame=base.copy()
            dest=frame[CY-R:CY+R+1,CX-R:CX+R+1]
            dest[circle]=earth[circle]
            # Actual border lines, not graphic fabrication of country boundaries.
            draw_borders(frame,geo,lat0,lon0)
            # Atmospheric scattering and halo, in original brand cyan family.
            outer=(np.sqrt(((np.arange(sz)[:,None]-R)**2+
                (np.arange(sz)[None,:]-R)**2))/R)
            halo=np.exp(-((outer-1.0)/.036)**2)*.56
            dest[:]=np.clip(dest.astype("float32")+
                (halo*26)[:,:,None]*np.array([.25,.87,1])[None,None,:],0,255).astype("uint8")
            # Outer rim and double diffuse rings; do not use a cartoon replacement map.
            cv2.circle(frame,(CX,CY),R+2,(24,161,219),3,cv2.LINE_AA)
            ring_y=CY-R-10
            # Target marker's screen position is *calculated* from real lat/lon.
            dlon=lam-lo
            px=np.cos(phi)*np.sin(dlon)
            py=np.sin(phi)*np.cos(a)-np.cos(phi)*np.cos(dlon)*np.sin(a)
            z=np.sin(phi)*np.sin(a)+np.cos(phi)*np.cos(a)*np.cos(dlon)
            if z>0.05 and t>=1.70:
                gx=int(CX+R*px);gy=int(CY-R*py)
                phase=float(np.clip((t-1.70)/.42,0,1))
                pulse=int(24+18*(.5+.5*np.sin(t*8)))
                cv2.circle(frame,(gx,gy),int(pulse*phase),(50,211,248),2,cv2.LINE_AA)
                cv2.circle(frame,(gx,gy),8,(255,255,255),-1,cv2.LINE_AA)
                cv2.circle(frame,(gx,gy),4,(18,161,217),-1,cv2.LINE_AA)
                if t>2.35:
                    q=float(ease((t-2.35)/.45))
                    x2=int(gx+65*q);y2=int(gy-61*q)
                    cv2.line(frame,(gx+13,gy-12),(x2,y2),(93,228,252),2,cv2.LINE_AA)
                    textpos=(min(780,x2+9),y2-27)
                    frame=fonttext(frame,"SHENZHEN",textpos[0],textpos[1],headline_font(29),(255,255,255))
            # Clean headline: no long paragraphs, mobile-safe.
            frame=draw_logo(frame,logo)
            frame=fonttext(frame,"LE MONDE • LOCALISATION",79,259,headline_font(25),(139,218,236),1)
            # A small chart-style left accent, not generic emojis.
            cv2.line(frame,(79,310),(361,310),(68,205,245),3,cv2.LINE_AA)
            if t>2.35:
                overlay_rgba(frame,text_plate,float(ease((t-2.35)/.65)))
            # Minimal sourcing at bottom; editorial date (not actual venue).
            frame=fonttext(frame,"NASA BLUE MARBLE  /  NATURAL EARTH",80,1875,
                           headline_font(18),(116,166,183))
            proc.stdin.write(frame.tobytes())
        proc.stdin.close()
        err=proc.stderr.read().decode("utf-8",errors="replace")
        if proc.wait()!=0:raise RuntimeError("ffmpeg "+err[-2500:])
    finally:
        if proc.poll() is None: proc.kill()
    probe=subprocess.run(
        ["ffprobe","-v","error","-show_format","-show_streams",
         "-of","json",str(fin)],capture_output=True,text=True,check=True)
    meta=json.loads(probe.stdout)
    v=next((x for x in meta["streams"] if x.get("codec_type")=="video"),None)
    if v is None or (v["width"],v["height"])!=(W,H):
        raise RuntimeError("Media QC failed — incorrect video size")
    if abs(float(meta["format"]["duration"])-DURATION)>.05:
        raise RuntimeError("Media QC failed — incorrect duration")
    manifest={
        "status":"TECHNICAL_PREVIEW_REQUIRES_ART_DIRECTION_REVIEW",
        "segment_id":"S03_SHENZHEN",
        "purpose":"real rotating globe positioning Shenzhen city after D00-v6 brand shot",
        "portrait":{"W":W,"H":H,"fps":FPS,"duration_sec":DURATION,"frames":FRAMES},
        "source_texture":"NASA Blue Marble topography, January",
        "source_texture_sha256":sha(args.texture),
        "source_geojson":"Natural Earth country polygons public-domain",
        "source_geojson_sha256":sha(args.geojson),
        "logo_official_git_blob":SHA_LOGO_GIT_BLOB,
        "geography":{"from_lat":START_LAT,"from_lon":START_LON,
           "target_city":"Shenzhen","target_lat":TARGET_LAT,"target_lon":TARGET_LON,
           "precision":"city centre only; meeting street address not announced"},
        "image_reference":"Original D00-v6 must remain as previous S02 brand shot; never claim the NASA texture is the same source image.",
        "source_image_original_sha256":"8d9a9d20f20fbf7757713b6f5eab06590f191166eb779865747f0f59683cfca2",
        "sound":"NO AUDIO - narration added at final mastering",
        "published":False,"approved":False,
        "output_name":fin.name,"sha256":sha(fin),"bytes":fin.stat().st_size,
        "duration":float(meta["format"]["duration"]),
        "verification":{"rendered":True,"geo_marker_mathematical_target":True,
            "legal_danger":"Do not mark the city centre as an exact venue"},
    }
    fin.with_suffix(".json").write_text(json.dumps(manifest,indent=2,ensure_ascii=False)+"\n","utf8")
    print(json.dumps({"output":str(fin),"sha256":manifest["sha256"],
                      "bytes":manifest["bytes"],"duration":DURATION}))
    
if __name__=="__main__":
    p=argparse.ArgumentParser()
    p.add_argument("--texture",type=Path,required=True)
    p.add_argument("--geojson",type=Path,required=True)
    p.add_argument("--logo",type=Path,required=True)
    p.add_argument("--output",type=Path,required=True)
    args=p.parse_args()
    generate(args)
