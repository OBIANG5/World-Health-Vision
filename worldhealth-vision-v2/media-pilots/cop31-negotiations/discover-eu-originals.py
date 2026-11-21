#!/usr/bin/env python3
"""
World-Vision COP31: legal public-download discovery, not a website scraper.

Visit TWO exact official EU Audiovisual Service photo detail URLs. Follow
only HTTPS redirects between the EU site and its observed CloudFront frontend,
never login, submit forms, guess CDN filenames, or reverse-engineer APIs.
Inspect HTML for publicly offered FULL/ORIGINAL/HIGH resolution links.
Download only a visible Download anchor whose resolved URL remains on a
first-party EU host. Extract SHA256, JPEG dimensions, EXIF date and terms.
If the site is JS-only or there is no first-party public original link,
keep the material BLOCKED and record the documented manual EU Download path.
No preview is marked "high res" by upscaling. No photo is licensed solely
because an HTTP request returned 200.

USAGE: python discover-eu-originals.py /tmp/cop31-eu-originals
Only public HTML and audit JSON are retained. Never publish downloaded bytes.
"""
from __future__ import annotations
import datetime
import hashlib
import json
from html.parser import HTMLParser
import io
from pathlib import Path
import re
import sys
from urllib.parse import urljoin, urlparse
import requests
from PIL import Image, ExifTags

HERE=Path(__file__).resolve().parent
OUT=Path(sys.argv[1] if len(sys.argv)>1 else "/tmp/worldvision-cop31-eu-hd").resolve()
MAN=json.loads((HERE/"reference-assets.json").read_text("utf8"))
ITEM_ROOT="https://audiovisual.ec.europa.eu/en/media/photo/"
ALLOWED_HTML={"audiovisual.ec.europa.eu","d2y8tayny4ld8y.cloudfront.net"}
ALLOWED_FILES={"audiovisual.ec.europa.eu","ec.europa.eu"}
HEADERS={"User-Agent":"WorldVisionMediaEditorialAssetReview/1.0"}
MAX_HTML=2_000_000
MAX_IMAGE=25_000_000

class LinkReader(HTMLParser):
    def __init__(self):
        super().__init__()
        self.links=[]
        self.current=None
    def handle_starttag(self,tag,attrs):
        attrs=dict(attrs)
        if tag=="a":
            self.current={"href":attrs.get("href",""),"text":"","title":attrs.get("title",""),
                "download":attrs.get("download",""),"class":attrs.get("class","")}
    def handle_data(self,data):
        if self.current is not None:
            self.current["text"]+=data
    def handle_endtag(self,tag):
        if tag=="a" and self.current:
            self.links.append(self.current)
            self.current=None

def official_get(url, allowed_hosts, max_length):
    session=requests.Session()
    for _ in range(4):
        u=urlparse(url)
        if u.scheme!="https" or u.hostname not in allowed_hosts:
            raise ValueError(f"Non-allowlisted URL host/redirect: {url}")
        r=session.get(url,timeout=40,headers=HEADERS,allow_redirects=False,stream=True)
        if r.status_code in (301,302,303,307,308):
            target=r.headers.get("Location","")
            if not target: raise ValueError("Redirect lacks Location")
            url=urljoin(url,target)
            continue
        r.raise_for_status()
        result=bytearray()
        for chunk in r.iter_content(1024*128):
            result.extend(chunk)
            if len(result)>max_length: raise ValueError("Response too large")
        return bytes(result),url,r.headers.get("Content-Type","")
    raise RuntimeError("Too many redirects")

def discover(entry):
    original_url=ITEM_ROOT+entry["collection"]+"/"+entry["image_ref"]
    result={
        "id":entry["id"],"eu_collection":entry["collection"],"eu_photo_ref":entry["image_ref"],
        "individual_page_url":original_url,
        "already_verified_preview_url":entry["image_url"],
        "must_show_date_as":"EU archive metadata 16 Nov 2026; NOT ongoing talks 21 Nov" if entry["collection"]=="P-070944" else "EU illustration archive 14 Nov 2026; confirm exact file metadata",
        "full_resolution_production_master_cleared":False,
        "individual_rights_verified":False,
        "license_policy":"https://audiovisual.ec.europa.eu/en/conditions-of-use",
        "source_of_high_res_url":"PUBLIC_DOWNLOAD_BUTTON_REQUIRED_NO_INVENTED_URL",
        "status":"PENDING",
        "public_candidate_links":[]
    }
    try:
        raw,final_url,typ=official_get(original_url,ALLOWED_HTML,MAX_HTML)
        result.update({"page_http":200,"page_final_url":final_url,
            "page_sha256":hashlib.sha256(raw).hexdigest(),
            "page_bytes":len(raw),"page_content_type":typ})
        if "text/html" not in typ.lower() and not raw.lstrip().lower().startswith(b"<!doctype"):
            result["status"]="MANUAL_ACCESS_REQUIRED_UNEXPECTED_FORMAT"
            return result
        doc=raw.decode("utf-8","replace")
        reader=LinkReader()
        reader.feed(doc)
        for link in reader.links:
            context=" ".join([link["text"],link["title"],link["download"],link["class"]]).lower()
            href=link["href"]
            if not href: continue
            resolved=urljoin(final_url,href)
            u=urlparse(resolved)
            # Only surface first-party file links already PRESENT IN HTML.
            if u.scheme!="https" or u.hostname not in ALLOWED_FILES: continue
            matches_hires=bool(re.search(r"(download|original|hi[- ]?res|high[- ]?res|full[- ]?size|large|hd|jpeg|\.jpg)",context))
            if not matches_hires: continue
            result["public_candidate_links"].append({"href_as_offered":href,
                "resolved_url":resolved,"context":context[:190]})
        result["public_candidate_links"]=result["public_candidate_links"][:25]
        explicit=[
            c for c in result["public_candidate_links"]
            if re.search(r"(download|original|high[- ]?res|full[- ]?size)",c["context"])
            and re.search(r"\.(jpe?g)(?:[?#]|$)",c["resolved_url"],re.I)
        ]
        if not explicit:
            result["status"]="NO_EXPLICIT_PUBLIC_HD_JPEG_LINK_IN_STATIC_HTML"
            result["manual_next_step"]="Official FAQ: open photo thumbnail -> metadata page -> blue Download; do not invent a CDN URL or evade login."
            return result
        result["status"]="PUBLIC_LINK_FOUND_NOT_YET_RIGHTS_APPROVED"
        for c in explicit[:3]:
            try:
                data,source,kind=official_get(c["resolved_url"],ALLOWED_FILES,MAX_IMAGE)
                if not data.startswith(b"\xff\xd8\xff"): raise ValueError("Not a JPEG")
                with Image.open(io.BytesIO(data)) as im:
                    w,h=im.size
                    exif=im.getexif()
                    dt=exif.get(36867,exif.get(306,None))
                c.update({"actual_download_sha256":hashlib.sha256(data).hexdigest(),
                    "downloaded_bytes":len(data),"dimensions":[w,h],
                    "exif_original_datetime":str(dt) if dt else None})
                if max(w,h)>=1600 and min(w,h)>=1000:
                    result["status"]="PUBLIC_HIGH_RES_OBTAINED_RIGHTS_AND_PHOTOGRAPHER_STILL_PENDING"
                else:
                    c["insufficient_resolution_for_1080px_vertical_crop"]=True
            except Exception as ex:
                c["download_error"]=str(ex)[:230]
        return result
    except Exception as ex:
        result["status"]="MANUAL_ACCESS_REQUIRED"
        result["error"]=str(ex)[:360]
        result["manual_next_step"]="Follow official EU FAQ and blue Download button; no source URL fabrication, no account bypass."
        return result

def main():
    OUT.mkdir(parents=True,exist_ok=True)
    selected=[x for x in MAN["eu_image_candidates"] if x["collection"]=="P-070944"]
    if len(selected)!=2:raise ValueError("Expected 2 editorially selected EU portraits/negotiation frames")
    report={
        "schema_version":"worldvision-cop31-eu-original-discovery-v1",
        "status":"FACTUAL_AND_RIGHTS_PREPRODUCTION_ONLY_NOT_PUBLICATION",
        "checked_at_utc":datetime.datetime.now(datetime.timezone.utc).isoformat(),
        "official_help":"https://audiovisual.ec.europa.eu/en/faq",
        "official_legal_terms":"https://audiovisual.ec.europa.eu/en/conditions-of-use",
        "files":[discover(x) for x in selected],
        "notes":[
           "No credentials used. No guessed original URLs. No circumvented access.",
           "The original photo's copyright, individual photographer credit, exact capture date and third-party rights must still be validated.",
           "The two photo items have archive metadata 16/11/2026, NEVER caption as photographed during 21/11 deadlock.",
           "Only public source bytes were downloaded transiently; binary images not bundled or published.",
           "If blocked: acquire the file normally via official EU Download button, preserve its full original URL, SHA, metadata and rights before using on a monetized World-Vision master."
        ],
        "new_vivienne_c52_take_recorded":False,
        "public_master_created":False,
        "publication_approved":False
    }
    (OUT/"eu-photo-originals-discovery.json").write_text(json.dumps(report,indent=2,ensure_ascii=False)+"\n","utf8")
    print(json.dumps(report,ensure_ascii=False,indent=2))
if __name__=="__main__":
    main()
