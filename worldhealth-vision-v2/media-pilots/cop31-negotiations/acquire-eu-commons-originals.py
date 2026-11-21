#!/usr/bin/env python3
"""
World-Vision MEDIA: download two REAL 6000x4000 EU COP31 photographs from the
publicly recorded original URLs on Wikimedia Commons; absolutely no invented
URL, no upscaling, no generative image and no re-dating 10 Nov as 21 Nov.

Source and CC BY 4.0 notice is in reference-assets.json, but Commons pages
explicitly say NOT YET REVIEWED by a license reviewer. Output is INTERNAL
PREPRODUCTION, never a cleared publication master. Rights and embedded people
and third party marks require individual clearance before public use.

Usage: python acquire-eu-commons-originals.py /tmp/cop31-highres
Requirements: Pillow==12.0.0, requests==2.32.5
"""
from __future__ import annotations
import datetime
import hashlib
import io
import json
from pathlib import Path
import sys
from urllib.parse import urlparse, urljoin

import requests
from PIL import Image, ImageDraw, ImageFont, ImageOps

ROOT=Path(__file__).resolve().parent
OUT=Path(sys.argv[1] if len(sys.argv)>1 else "/tmp/cop31-eu-highres").resolve()
MAN=json.loads((ROOT/"reference-assets.json").read_text("utf8"))
FONT="/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf"
FONT_REG="/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf"

def get_original(link,max_bytes=16_000_000):
    url=link
    for _ in range(3):
        u=urlparse(url)
        if u.scheme!="https" or u.hostname!="upload.wikimedia.org":
            raise ValueError("Refusing non-Wikimedia original domain: "+url)
        with requests.get(url,timeout=80,allow_redirects=False,stream=True,headers={
                "User-Agent":"WorldVisionMediaCOP31AttributionAndProvenanceAudit/1.0 (contact via project GitHub)"
            }) as res:
            if res.status_code in (301,302,303,307,308):
                url=urljoin(url,res.headers.get("Location",""))
                continue
            res.raise_for_status()
            b=bytearray()
            for part in res.iter_content(chunk_size=1024*128):
                b.extend(part)
                if len(b)>max_bytes: raise RuntimeError("Original larger than declared safe maximum")
            if not b.startswith(b"\xff\xd8\xff"):
                raise RuntimeError("Original is not valid JPEG bytes")
            return bytes(b),url,res.headers.get("Content-Type","")
    raise RuntimeError("More than two trusted Wikimedia redirects")

def obtain(entry):
    raw,url,typ=get_original(entry["verified_original_url"])
    if len(raw)<entry["expected_min_bytes"]:
        raise RuntimeError("Unexpectedly small source: "+entry["id"])
    im=Image.open(io.BytesIO(raw))
    im.verify()
    with Image.open(io.BytesIO(raw)) as img:
        w,h=img.size
        ex=img.getexif()
        taken=str(ex.get(36867,ex.get(306,"")))
        if (w,h)!=(entry["expected_width"],entry["expected_height"]):
            raise RuntimeError("Incorrect source geometry - no upscaling: "+entry["id"])
        if taken and not taken.startswith("2026:11:10"):
            raise RuntimeError("EXIF photographic date mismatch for 10 November context: "+taken)
    sha=hashlib.sha256(raw).hexdigest()
    dest=OUT/(entry["id"]+".jpg")
    dest.write_bytes(raw)
    return {"id":entry["id"],"original_url":url,
        "commons_file_page":entry["file_page"],
        "original_eu_provider_page":entry["original_provider_page"],
        "bytes":len(raw),"sha256":sha,"width":w,"height":h,
        "exif_datetime_original":taken or "NOT_PRESENT",
        "photo_date":"2026-11-10",
        "author":entry["author"],"copyright":"© European Union, 2026",
        "license_declared":"CC BY 4.0 on the Wikimedia Commons file page, external source reviewer pending",
        "use":"INTERNAL_SOURCE_FRAME_COMPARISON_ONLY",
        "capture_of_21_nov_deadlock":False,
        "public_usage_cleared":False,
        "source_binary_path":dest.name}

def font(size,bold=True):
    return ImageFont.truetype(FONT if bold else FONT_REG,size)

def make_frame(entry,img,which):
    # High-res editorial shot selection: source pixels are downsampled.
    # Date and attribution explicitly say 10 November. 21 Nov is an
    # EXTERNAL reported fact, not the shooting date of these photographs.
    image=Image.new("RGB",(1080,1920),(6,23,36))
    src=Image.open(OUT/entry["source_binary_path"]).convert("RGB")
    src=ImageOps.fit(src,(1080,1390),method=Image.Resampling.LANCZOS,centering=(.5,.48))
    image.paste(src,(0,245))
    d=ImageDraw.Draw(image)
    d.rectangle((0,0,1080,245),fill=(6,23,36))
    d.rectangle((0,1590,1080,1920),fill=(6,23,36))
    d.text((68,72),"COP31   /   ANTALYA",font=font(42),fill=(54,236,218))
    d.text((68,178),"PHOTOGRAPHIE DU 10 NOVEMBRE 2026",font=font(25),fill=(235,240,243))
    d.text((68,1640),("RÉUNION MINISTÉRIELLE" if which==0 else "CHRIS BOWEN · DAN JØRGENSEN"),font=font(38),fill=(245,246,247))
    d.text((68,1712),"© UE 2026 · Necati Savas · CC BY 4.0",font=font(24),fill=(177,205,213))
    d.text((68,1772),"IMAGE DE CONTEXTE · NON PRISE LE 21 NOV.",font=font(23),fill=(255,182,114))
    dest=OUT/(f"eu-original-context-{which+1}-1080x1920.png")
    image.save(dest,optimize=True)
    return {"path":dest.name,"width":1080,"height":1920,
            "sha256":hashlib.sha256(dest.read_bytes()).hexdigest()}

def main():
    OUT.mkdir(parents=True,exist_ok=True)
    entries=MAN.get("public_eu_owned_full_resolution_alternatives",[])
    if len(entries)!=2:
        raise RuntimeError("Expected exactly two known Commons originals; refuse arbitrary search")
    audit={"schema_version":"worldvision-cop31-true-highres-eu-context-v1",
        "status":"REAL_ORIGINALS_VERIFIED_NOT_RIGHTS_CLEARED_NOT_MASTER",
        "checked_at_utc":datetime.datetime.now(datetime.timezone.utc).isoformat(),
        "license_policy":"https://audiovisual.ec.europa.eu/en/conditions-of-use",
        "rights_warning":"Wikimedia file pages are marked license review needed. Additional person, copyright, trademark rights may apply.",
        "photos":[],"mobile_frames":[],"producer_narration_present":False,
        "public_video_rendered":False,"publication_approved":False}
    for i,e in enumerate(entries):
        audit["photos"].append(obtain(e))
        audit["mobile_frames"].append(make_frame(audit["photos"][-1],None,i))
    a,b=(Image.open(OUT/x["path"]).convert("RGB").resize((390,693),Image.Resampling.LANCZOS)
        for x in audit["mobile_frames"])
    sheet=Image.new("RGB",(820,730),(8,25,40))
    sheet.paste(a,(12,12))
    sheet.paste(b,(418,12))
    d=ImageDraw.Draw(sheet)
    d.text((13,706),"REAL EU HIGH-RES ORIGINALS • 10 NOV • NOT 21 NOV",font=font(14),fill=(205,235,237))
    sheet_path=OUT/"eu-originals-mobile-390px.png"
    sheet.save(sheet_path,optimize=True)
    audit["mobile_contact_sha256"]=hashlib.sha256(sheet_path.read_bytes()).hexdigest()
    (OUT/"eu-originals-audit.json").write_text(json.dumps(audit,ensure_ascii=False,indent=2)+"\n","utf8")
    print(json.dumps(audit,ensure_ascii=False,indent=2))
if __name__=="__main__":
    main()
