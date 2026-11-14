#!/usr/bin/env python3
"""World-Vision 001 — S03B authentic Shenzhen city reveal / clean plate.

Render a 2.7-second documentary photograph shot. True 2025 photograph,
photographer Renek78, CC0-1.0. This is a city illustration, NEVER a claim
that the 19 November 2026 summit is taking place at a pictured building.

No baked-in debug captions, filenames, QA labels, production dates or
provisional subtitles. Audio will be mixed at the final master stage.
"""
import argparse, hashlib, json, math, subprocess
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont, ImageEnhance, ImageChops, ImageFilter
import numpy as np

W,H,FPS,FRAMES=1080,1920,30,81
SECONDS=FRAMES/FPS
INK=(3,17,38)
CYAN=(76,221,248)
WHITE=(247,251,255)
PALE=(173,226,240)
FONT_SHA256="3ae11c49db0455a3cc33e37d380f20fdb8c7f8b41dc07625c177e3d87a9d6ae6"
LOGO_GIT_BLOB="bc80fa70cebd566768bfb1703a0f1f636a78c196"
IMAGE_SOURCE="https://commons.wikimedia.org/wiki/File:02_View_from_Lianhuashan,_Shenzhen_in_2025.jpg"
IMAGE_CREDIT="Renek78, 13 septembre 2025, vue depuis Lianhuashan, Shenzhen"
IMAGE_LICENSE="CC0 1.0 https://creativecommons.org/publicdomain/zero/1.0/"
FONTS={}
FONT_FILE=None

def sha(path): return hashlib.sha256(Path(path).read_bytes()).hexdigest()
def ease(x):
    x=max(0.,min(1.,x))
    return x*x*(3.-2.*x)
def out(x):
    x=max(0.,min(1.,x))
    return 1.-(1.-x)**3
def font(size,weight=700):
    key=(size,weight)
    if key not in FONTS:
        face=ImageFont.truetype(str(FONT_FILE), size)
        face.set_variation_by_axes([weight])
        FONTS[key]=face
    return FONTS[key]
def text(layer, words, x, y, size, color=WHITE, weight=700, opacity=1., tracking=0):
    """Alpha-composite Manrope text, with real variable weights."""
    opacity=max(0.,min(1.,opacity))
    if opacity<.004: return
    temp=Image.new("RGBA", (W,H))
    d=ImageDraw.Draw(temp)
    fill=(*color,int(255*opacity))
    face=font(size,weight)
    if not tracking:
        d.text((int(x),int(y)),words,font=face,fill=fill,
               stroke_width=0,anchor="lt")
    else:
        xx=float(x)
        for char in words:
            d.text((int(xx),int(y)),char,font=face,fill=fill,
                   stroke_width=0,anchor="lt")
            xx+=d.textlength(char,font=face)+tracking
    layer.alpha_composite(temp)

def background():
    yy,xx=np.mgrid[0:H,0:W].astype("float32")
    glow=np.exp(-(((xx-690)/650)**2+((yy-800)/720)**2))*.67
    lower=np.exp(-(((xx-290)/850)**2+((yy-1640)/600)**2))*.25
    arr=np.empty((H,W,3),dtype=np.uint8)
    for k,(a,b) in enumerate([(6,4),(31,20),(63,30)]):
        arr[:,:,k]=np.clip(INK[k]+a*glow+b*lower,0,255)
    bg=Image.fromarray(arr,"RGB").convert("RGBA")
    d=ImageDraw.Draw(bg,"RGBA")
    d.line((78,269,1004,269),fill=(*PALE,56),width=2)
    return bg
BASE=background()
PX,PY,PW,PH=53,342,974,940
def prepare_picture(path):
    raw=Image.open(path)
    assert raw.format=="JPEG", "Authentic Commons JPEG required"
    assert raw.width>=3500 and raw.height>=1900,raw.size
    raw=raw.convert("RGB")
    raw=ImageEnhance.Contrast(raw).enhance(1.055)
    raw=ImageEnhance.Color(raw).enhance(.94)
    # Full-height center crop around Futian's recognizable Civic Centre and
    # Ping An tower; never distort buildings or invent additional details.
    crop_width=int(raw.height*PW/PH*1.16)
    center_x=int(raw.width*.61)
    left=max(0,min(raw.width-crop_width,center_x-crop_width//2))
    raw=raw.crop((left,0,left+crop_width,raw.height))
    # Render once at overscan resolution; subsequent motion uses lossless crop.
    return raw.resize((1126,1087),Image.Resampling.LANCZOS).convert("RGBA")

def prep_logo(path):
    img=Image.open(path).convert("RGBA")
    img.thumbnail((112,77),Image.Resampling.LANCZOS)
    return img

def picture_at(t, picture):
    # Natural 1x playback: slow 2.7s photographic dolly and sideways slide.
    travel=out(t/SECONDS)
    ox=int(65*(1-travel)+34*travel)
    oy=int(56*(1-travel)+33*travel)
    tile=picture.crop((ox,oy,ox+PW,oy+PH))
    # Round only the image itself. The frame remains simple & understated.
    mask=Image.new("L",(PW,PH),0)
    md=ImageDraw.Draw(mask)
    md.rounded_rectangle((0,0,PW-1,PH-1),radius=22,fill=255)
    # Zoom outward from the location pin: circular reveal lasting 0.53 sec.
    if t<.56:
        r=25+1000*out(t/.55)
        aperture=Image.new("L",(PW,PH),0)
        ImageDraw.Draw(aperture).ellipse((PW*.5-r,PH*.51-r,PW*.5+r,PH*.51+r),fill=255)
        mask=ImageChops.multiply(mask,aperture)
    return tile,mask

def one_frame(t, logo, photo):
    im=BASE.copy()
    d=ImageDraw.Draw(im,"RGBA")
    # A single short arrival pulse follows the end of the geographic locator.
    p=out(t/.55)
    d.ellipse((PX-6,PY-6,PX+PW+6,PY+PH+6),
              outline=(*CYAN,int(15+55*p)),width=2)
    tile,mask=picture_at(t,photo)
    im.paste(tile,(PX,PY),mask)
    # Photo gently falls into the navy environment rather than a hard card edge.
    fade=Image.new("RGBA",(PW,260),(3,17,38,0))
    fd=ImageDraw.Draw(fade)
    for n in range(260):
        a=int(165*(n/259)**1.7)
        fd.line((0,n,PW,n),fill=(3,17,38,a))
    im.alpha_composite(fade,(PX,PY+PH-260))
    # Branding is an exact asset, never a redrawn eye or globe.
    d=ImageDraw.Draw(im,"RGBA")
    d.rounded_rectangle((74,82,206,178),radius=11,fill=(247,248,247,255))
    im.alpha_composite(logo,(86+(107-logo.width)//2,91+(77-logo.height)//2))
    text(im,"WORLD-VISION",235,110,35,WHITE,800)
    # Only editorial copy, visually distinct from operational metadata.
    text(im,"EN CHINE",80,285,25,PALE,600, out((t-.12)/.46),tracking=2)
    q=out((t-.44)/.61)
    text(im,"SHENZHEN",74,1304+int((1-q)*39),126,WHITE,800,q)
    d=ImageDraw.Draw(im,"RGBA")
    line=out((t-1.04)/.48)
    d.rounded_rectangle((79,1469,79+int(233*line),1475),radius=3,fill=(*CYAN,int(225*line)))
    b=out((t-1.20)/.49)
    text(im,"19 NOVEMBRE 2026",80,1518+int((1-b)*23),47,CYAN,700,b)
    c=out((t-1.48)/.42)
    text(im,"RENCONTRE ANNONCÉE",81,1608+int((1-c)*16),27,PALE,500,c,tracking=1.6)
    # This screen intentionally has NO text below y=1690, keeping the mobile safe-zone clear.
    return im.convert("RGB")

def main():
    parser=argparse.ArgumentParser()
    parser.add_argument("--photo",required=True,type=Path)
    parser.add_argument("--logo",required=True,type=Path)
    parser.add_argument("--font",required=True,type=Path)
    parser.add_argument("--output",required=True,type=Path)
    args=parser.parse_args()
    for p in (args.photo,args.logo,args.font):
        if not p.is_file():
            raise FileNotFoundError("Missing mandatory original asset "+str(p))
    global FONT_FILE
    FONT_FILE=args.font
    if sha(args.font)!=FONT_SHA256:
        raise RuntimeError("Manrope font not authentic; refusing fallback")
    # Logo authenticity is also checked with git hash-object in CI.
    logo=prep_logo(args.logo)
    photo=prepare_picture(args.photo)
    args.output.parent.mkdir(parents=True,exist_ok=True)
    cmd=["ffmpeg","-y","-hide_banner","-loglevel","error",
         "-f","rawvideo","-pix_fmt","rgb24","-s",f"{W}x{H}",
         "-r",str(FPS),"-i","pipe:0","-an","-c:v","libx264",
         "-preset","medium","-crf","17","-pix_fmt","yuv420p",
         "-movflags","+faststart",str(args.output)]
    proc=subprocess.Popen(cmd,stdin=subprocess.PIPE,stderr=subprocess.PIPE)
    try:
        for k in range(FRAMES):
            proc.stdin.write(one_frame(k/FPS,logo,photo).tobytes())
        proc.stdin.close()
        error=proc.stderr.read().decode(errors="replace")
        if proc.wait()!=0: raise RuntimeError(error)
    finally:
        if proc.poll() is None: proc.kill()
    probe=json.loads(subprocess.check_output(
        ["ffprobe","-v","error","-show_streams","-show_format",
         "-of","json",str(args.output)]))
    streams=probe["streams"]
    v=next(x for x in streams if x["codec_type"]=="video")
    assert v["codec_name"]=="h264"
    assert (int(v["width"]),int(v["height"]))==(W,H)
    assert int(v["nb_frames"])==FRAMES
    assert abs(float(probe["format"]["duration"])-SECONDS)<.04
    assert not any(x["codec_type"]=="audio" for x in streams)
    report={
      "id":"S03B",
      "duration_seconds":SECONDS,"frames":FRAMES,"fps":FPS,
      "width":W,"height":H,"codec":"h264",
      "source_photo_page":IMAGE_SOURCE,
      "photographer":"Renek78",
      "original_photo_date":"2025-09-13",
      "photo_viewpoint":"Lianhuashan Park, Shenzhen, China",
      "photo_viewpoint_coordinates":[22.555601,114.054405],
      "license":IMAGE_LICENSE,"attribution_for_publication":IMAGE_CREDIT,
      "license_note":"CC0 permits adaptation and commercial use; source reference retained.",
      "is_photo_of_meeting":False,"is_photo_of_meeting_venue":False,
      "no_synthetic_building":True,
      "photo_sha256":sha(args.photo),"font_sha256":sha(args.font),
      "logo_sha256":sha(args.logo),
      "sha256":sha(args.output),"bytes":args.output.stat().st_size,
      "audio_present":False,
      "clean_plate":True,"production_labels_embedded":False,
      "user_art_approved":False,"publication_authorized":False,
      "note":"Photograph of the city only. 2026 summit is announced, not filmed."
    }
    args.output.with_suffix(".json").write_text(
       json.dumps(report,ensure_ascii=False,indent=2)+"\n",encoding="utf8")
    print(json.dumps(report,ensure_ascii=False))
if __name__=="__main__":
    main()
