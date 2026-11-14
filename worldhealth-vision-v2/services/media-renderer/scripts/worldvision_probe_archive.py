#!/usr/bin/env python3
"""Inspect public-domain DVIDS source *without* borrowing commercial news footage.

No license forms, credentials, scraping of paywalled sources, or invented
original incident shots. Audit exact DVIDS metadata before attempting a
publicly accessible 720/1080p MP4 download.
"""
from __future__ import annotations
import html
import json
import re
import shutil
import subprocess
import sys
from pathlib import Path
from urllib.parse import urljoin
import requests
from bs4 import BeautifulSoup

SOURCES = [
    {"id":347862,"role":"New Orleans waterway / Coast Guard operations","date":"2014-07-02"},
    {"id":445860,"role":"Aerial real Mississippi, Louisiana","date":"2016-01-11"},
    {"id":314204,"role":"New Orleans Coast Guard response boat","date":"2009-05-07"},
]
BASE="https://www.dvidshub.net/video/"
HEADERS={"User-Agent":"Mozilla/5.0 (compatible; WorldVisionMediaQA/1.0)"}

def analyze(info,outdir):
    n=info["id"]
    url=f"{BASE}{n}"
    result={"id":n,"url":url,"role":info["role"],"archive_date":info["date"],
            "status":"FAILED","public_domain_verified":False,"candidates":[]}
    for suffix in ("",f"/download/popup/{n}"):
        pass
    try:
        page=requests.get(url,timeout=18,headers=HEADERS)
        page.raise_for_status()
        soup=BeautifulSoup(page.text,"html.parser")
        page_text=soup.get_text(" ",strip=True)
        result["public_domain_verified"]=bool(re.search(r"PUBLIC DOMAIN",page_text,re.I))
        result["title"]=soup.title.get_text(" ",strip=True) if soup.title else ""
        result["status"]="PAGE_OK" if result["public_domain_verified"] else "RIGHTS_NOT_CONFIRMED"
        # Try download popup and embedded player as legally public distribution points.
        for address in (f"https://www.dvidshub.net/download/popup/{n}",
                        f"https://www.dvidshub.net/video/embed/{n}"):
            try:
                r=requests.get(address,timeout=15,headers=HEADERS)
                if not r.ok:continue
                for link in re.findall(r'["\\x27]([^"\\x27<>\\s]+\\.(?:mp4|m3u8)(?:\\?[^"\\x27<>\\s]+)?)',r.text,re.I):
                    resolved=urljoin(address,html.unescape(link))
                    if resolved not in result["candidates"]:result["candidates"].append(resolved)
                if len(r.text)<120000:
                    (outdir/f"dvids_{n}_{'player' if 'embed' in address else 'popup'}.html").write_text(r.text,encoding="utf8")
            except requests.RequestException:
                pass
    except requests.RequestException as e:
        result["error"]=type(e).__name__+":"+str(e)[:100]
        return result
    if not result["public_domain_verified"]:return result
    # yt-dlp generic extractor may resolve DVIDS's publicly embedded player.
    urls=[url,f"https://www.dvidshub.net/video/embed/{n}"]
    if shutil.which("yt-dlp"):
        for u in urls:
            try:
                p=subprocess.run(["yt-dlp","--no-playlist","--socket-timeout","12",
                      "--retries","1","--skip-download","--dump-single-json",u],
                      capture_output=True,text=True,timeout=50)
                if p.returncode==0:
                    metadata=json.loads(p.stdout)
                    formats=metadata.get("formats",[])
                    result["yt_dlp"]={"title":metadata.get("title"),
                      "format_count":len(formats),"extractor":metadata.get("extractor"),
                      "formats":[{"format_id":f.get("format_id"),
                        "ext":f.get("ext"),"height":f.get("height"),
                        "url":f.get("url","")[:160]} for f in formats[-10:]]}
                    break
                result["yt_dlp_error"]=p.stderr[-700:]
            except Exception as e:
                result["yt_dlp_error"]=str(e)[:250]
    return result

def main():
    outdir=Path(sys.argv[1])
    outdir.mkdir(parents=True,exist_ok=True)
    records=[analyze(i,outdir) for i in SOURCES]
    (outdir/"source-probe.json").write_text(json.dumps(records,indent=2,ensure_ascii=False)+"\n")
    print(json.dumps([{k:v for k,v in r.items() if k not in ("candidates",)}
      |{"candidates_count":len(r["candidates"])} for r in records],indent=2))
if __name__=="__main__":
    main()
