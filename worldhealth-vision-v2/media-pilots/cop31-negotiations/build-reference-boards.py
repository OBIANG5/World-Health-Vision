#!/usr/bin/env python3
"""
COP31 negotiated-draft media audit and EDITORIAL STATIC STORYBOARD.
Fetches EXACT official URLs from reference-assets.json; no URL rewriting,
no generative faces, no fabricated document excerpts and no publication.
Each file gets a SHA256, measured dimensions and a separate rights caveat.

The 1080x1920 PNGs are internal compositional drafts, NOT licensed master
images. The JPEGs are official EU medium-resolution PREVIEWS only.
Output thumbnail 390px to test TikTok legibility before real video rendering.

Dependencies: Python 3.11; Pillow, requests, PyMuPDF.
"""
import hashlib
import io
import json
import os
import pathlib
import sys
import textwrap
from urllib.parse import urlparse
import requests
import fitz
from PIL import Image, ImageDraw, ImageFont, ImageEnhance, ImageOps

ROOT = pathlib.Path(__file__).resolve().parent
OUT = pathlib.Path(sys.argv[1] if len(sys.argv) > 1 else "/tmp/cop31-reference").resolve()
MANIFEST = json.loads((ROOT / "reference-assets.json").read_text("utf-8"))
SOURCE = OUT / "sources"
W, H = 1080, 1920
NAVY = (4, 19, 34)
INK = (245, 249, 251)
MUTED = (174, 196, 208)
CYAN = (48, 224, 214)
AMBER = (255, 174, 104)
FONT = "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf"
BOLD = "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf"

def font(sz, bold=False):
    p=BOLD if bold else FONT
    return ImageFont.truetype(p,sz)

def sha(b):
    return hashlib.sha256(b).hexdigest()

def fetch(url, destination, max_bytes, kind):
    parsed = urlparse(url)
    if (parsed.scheme != "https" or parsed.hostname not in
        ("unfccc.int","ec.europa.eu")):
        raise ValueError("Source domain not in exact official allowlist: "+url)
    # HTTP redirects to other domains are not automatically trusted.
    result=requests.get(url,timeout=55,allow_redirects=False,headers={"User-Agent":"WorldVisionEditorialSourceVerification/1.0"})
    if result.status_code in (301,302,303,307,308):
        raise RuntimeError("Official URL redirected; requires manual audit: "+str(result.headers.get("Location")))
    result.raise_for_status()
    data=result.content
    if len(data)<2500 or len(data)>max_bytes:
        raise RuntimeError("Unexpected source size for "+url+": "+str(len(data)))
    if kind=="PDF" and not data.startswith(b"%PDF-"):
        raise RuntimeError("Official original is not PDF: "+url)
    if kind=="JPEG" and not data.startswith(b"\xff\xd8\xff"):
        raise RuntimeError("Official preview is not JPEG: "+url)
    destination.write_bytes(data)
    return {"url":url,"path":str(destination.relative_to(OUT)),"sha256":sha(data),
            "bytes":len(data),"content_type_reported":result.headers.get("Content-Type","unknown")}

def fit_crop(im,box):
    w,h=box[2]-box[0],box[3]-box[1]
    return ImageOps.fit(im.convert("RGB"),(w,h),method=Image.Resampling.LANCZOS,centering=(.5,.45))

def panel(draw, x0,y0,x1,y1, fill=(12,37,53),outline=(28,74,88),radius=28):
    draw.rounded_rectangle((x0,y0,x1,y1),radius=radius,fill=fill,outline=outline,width=3)

def copy_text(draw,xy,value,sz,color=INK,bold=True,spacing=11):
    draw.multiline_text(xy,value,font=font(sz,bold),fill=color,spacing=spacing)

def source_strip(draw,label,y):
    draw.rectangle((76,y,1004,y+5),fill=(23,75,88))
    copy_text(draw,(82,y+23),label,22,MUTED,False)

def source_pdf_crop(pdf_path,page_number,normalized_rect):
    doc=fitz.open(pdf_path)
    page=doc[page_number-1]
    a=page.rect
    x0,y0,x1,y1=normalized_rect
    clip=fitz.Rect(a.width*x0,a.height*y0,a.width*x1,a.height*y1)
    pix=page.get_pixmap(matrix=fitz.Matrix(2.4,2.4),clip=clip,alpha=False)
    return Image.open(io.BytesIO(pix.tobytes("png"))).convert("RGB"),page.get_text()

def create_hook(pdf,cop_sign, output):
    image=Image.new("RGB",(W,H),NAVY)
    d=ImageDraw.Draw(image)
    copy_text(d,(80,175),"COP31  /  ANTALYA",36,CYAN)
    # Strong factual hook in very large type; NOT a fabricated original document screenshot.
    copy_text(d,(77,286),"FOSSILES :\nLE PASSAGE\nA DISPARU",91,INK,True,10)
    copy_text(d,(82,650),"PROJETS DU 16  →  19 NOVEMBRE",35,AMBER)
    panel(d,72,772,1008,1363)
    copy_text(d,(105,805),"16 NOV.   ·   SOURCE OFFICIELLE",30,CYAN)
    copy_text(d,(104,888),"SORTIE DES\nÉNERGIES FOSSILES",64,INK,True,12)
    copy_text(d,(105,1070),"SYNTHÈSE ÉDITORIALE WORLD-VISION",22,MUTED,False)
    # Authentic source remains unmodified. Its small print is not the primary
    # mobile message; paraphrase above is deliberately a separate editorial layer.
    crop,_=source_pdf_crop(pdf,8,(.17,.66,.88,.83))
    target=ImageOps.contain(crop,(854,190),Image.Resampling.LANCZOS)
    background=Image.new("RGB",(866,202),(239,241,240))
    background.paste(target,((866-target.width)//2,(202-target.height)//2))
    image.paste(background,(107,1135))
    d=ImageDraw.Draw(image)
    copy_text(d,(85,1431),"19 NOV. : LE NOUVEAU PROJET\nNE REPREND PLUS CE PASSAGE",42,INK)
    copy_text(d,(86,1570),"Projet de négociation  ·  PAS un accord signé",25,AMBER,False)
    source_strip(d,"CCNUCC · textes préparatoires du 16 et 19/11/2026",1662)
    image.save(output,optimize=True)

def create_negotiation(photo,participant_photo,output):
    image=Image.new("RGB",(W,H),NAVY)
    d=ImageDraw.Draw(image)
    copy_text(d,(80,179),"COP31  /  ANTALYA",36,CYAN)
    copy_text(d,(80,280),"UN ACCORD\nOU RIEN ?",91,INK)
    panel(d,68,578,1012,1440)
    # Main: genuine COP31 participant image. Inset: genuine negotiation-room context.
    portrait=fit_crop(participant_photo,(88,607,992,1289))
    image.paste(ImageEnhance.Contrast(portrait).enhance(1.05),(88,607))
    room=fit_crop(photo,(560,1043,974,1258))
    image.paste(room,(560,1043))
    d=ImageDraw.Draw(image)
    d.rounded_rectangle((552,1035,981,1265),radius=10,outline=CYAN,width=4)
    d.rectangle((88,1289,992,1386),fill=(8,33,46))
    copy_text(d,(113,1302),"IMAGES DE RÉUNIONS COP31 · UE",27,INK)
    copy_text(d,(112,1349),"Date exacte de vue : à confirmer",22,MUTED,False)
    copy_text(d,(82,1490),"SAMEDI 21 :\nNÉGOCIATIONS PROLONGÉES",41,INK)
    source_strip(d,"Statut : Reuters, 21/11 · photos d'illustration UE",1664)
    image.save(output,optimize=True)

def mobile_contact(paths,target):
    names=["OUVERTURE · PREUVE","RE-HOOK · NÉGOCIATIONS"]
    sheet=Image.new("RGB",(2*390+3*22,750),(16,28,42))
    draw=ImageDraw.Draw(sheet)
    for i,p in enumerate(paths):
        s=Image.open(p).convert("RGB").resize((390,693),Image.Resampling.LANCZOS)
        sheet.paste(s,(22+i*412,20))
        draw.text((25+i*412,716),names[i],font=font(16,True),fill=(230,244,247))
    sheet.save(target,optimize=True)

def main():
    OUT.mkdir(parents=True,exist_ok=True)
    SOURCE.mkdir(parents=True,exist_ok=True)
    audit={"kind":"COP31_REFERENCE_ASSETS_AND_EDITORIAL_FRAMES_ONLY",
           "status":"INTERNAL_PREPRODUCTION_NOT_PUBLICATION",
           "individual_rights_cleared":False,
           "original_high_resolution_acquired":False,
           "draft_script_approved":False,"vivienne_c52_recorded":False,
           "public_video_generated":False,
           "assets":[],"documents":[],"frames":[]}
    for entry in MANIFEST["primary_documents"]:
        path=SOURCE/(entry["id"]+".pdf")
        obj=fetch(entry["url"],path,18_000_000,"PDF")
        doc=fitz.open(path)
        if len(doc)!=entry["expected_pages"]:
            raise RuntimeError("Original official PDF changed page count, needs editorial revalidation "+entry["id"])
        obj.update({"id":entry["id"],"pages":len(doc),"status":"official_draft_not_adopted"})
        audit["documents"].append(obj)
    pics={}
    for entry in MANIFEST["eu_image_candidates"]:
        path=SOURCE/(entry["id"]+".jpg")
        obj=fetch(entry["image_url"],path,12_000_000,"JPEG")
        with Image.open(path) as im:
            im.verify()
        with Image.open(path) as im:
            width,height=im.size
        obj.update({"id":entry["id"],"width":width,"height":height,
                    "source_collection":entry["collection"],"image_ref":entry["image_ref"],
                    "exact_photo_date":entry["exact_shooting_date"],
                    "rights_status":"INDIVIDUAL_REVIEW_REQUIRED",
                    "use":"PREVIEW_ONLY_NOT_MASTER",
                    "vertical_1080p_suitable":False if width<1080 or height<1080 else None})
        audit["assets"].append(obj)
        pics[entry["id"]]=Image.open(path).convert("RGB")
    hook=OUT/"direction-a-hook-1080x1920.png"
    negotiation=OUT/"direction-b-negotiation-1080x1920.png"
    create_hook(SOURCE/"C16.pdf",pics["EU-COP31-ANTALYA-SIGN"],hook)
    create_negotiation(pics["EU-COP31-MEETING-WIDE"],pics["EU-COP31-HOEKSTRA-SIDE"],negotiation)
    sheet=OUT/"contact-sheet-390px.png"
    mobile_contact([hook,negotiation],sheet)
    for p in (hook,negotiation,sheet):
        with Image.open(p) as img:
            audit["frames"].append({"name":p.name,"sha256":sha(p.read_bytes()),"size":list(img.size),
                    "visual_policy":"EDITORIAL STORYBOARD ONLY; NOT A NEWS PHOTO OR PUBLIC MASTER"})
    audit["production_blockers"]=[
        "Individual EU photo terms, person/third-party logo rights, photographer and EXACT date require file-level review.",
        "Only MED previews sourced; need true high-resolution files, not interpolation.",
        "Final COP31 conference outcome still open; update before script lock/voice synthesis.",
        "Current font on draft boards is DejaVu Sans. Actual World-Vision film requires DM Sans.",
        "This film has no confirmed Vivienne C5.2 +8% new narration, no captions and no H264 master."
    ]
    (OUT/"audit.json").write_text(json.dumps(audit,ensure_ascii=False,indent=2)+"\n","utf-8")
    print(json.dumps({"ready":True,"assets":audit["assets"],"frames":audit["frames"]},ensure_ascii=False,indent=2))
if __name__=="__main__":
    try:
        main()
    except Exception as e:
        print("COP31 PREPROD REFUSED: "+repr(e),file=sys.stderr)
        sys.exit(1)
