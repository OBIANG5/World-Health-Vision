#!/usr/bin/env python3
"""World-Vision Guinée V3: replace 13 weak V2 visual beats with 2024 Guinea
documentary photography and official government document, while preserving
the owner's approved globe, exact worker-video beat, branded endcard, and
the *unchanged audio stream* from their last full report.
No footage here pretends to show 11 November 2026 clashes.
"""
from __future__ import annotations
import argparse, hashlib, json, math, subprocess
from pathlib import Path
import numpy as np
from PIL import Image, ImageDraw, ImageFont, ImageOps, ImageEnhance, ImageFilter

W,H,FPS=1080,1920,30
NAVY=(6,17,21)
WHITE=(247,248,240)
GOLD=(247,195,91)
MUTED=(203,216,219)
ACCENT=(30,131,147)
APPROVED_TEXT_SHA="0d0e268a9f189b9ae4b1714e89dbd67872444340ebce9c64260ee3f440cde8ac"
SOURCE_TIMELINE=["globe_guinea_verified_geography","gold_panning_video","location",
"ban","ban_context","confront","foreign","foreign_context","why","river",
"river_close","families","worker_illustration","question","justice",
"worldvision_owner_uploaded_blue_signature_video"]
RETAIN={0,12,15}
TEXT_LINES=[
"Dix morts. Treize blessés. En Guinée, une opération contre l’orpaillage illégal a tourné au drame.",
"Tout se joue à Balato, près de Siguiri.",
"Neuf jours après l’interdiction de l’exploitation illégale, une patrouille vient contrôler son application.",
"Des barricades bloquent la route. Puis, des tirs éclatent.",
"Mais le bilan révèle un autre choc : cinq des personnes tuées sont étrangères. Leurs identités restent inconnues.",
"Pourquoi une telle tension ?",
"L’État accuse l’exploitation illégale de détruire les terres et de polluer les rivières.",
"Pourtant, pour des milliers de familles, l’orpaillage est un moyen de vivre.",
"Et une question reste entière : qui a tiré le premier ?",
"Une enquête est ouverte pour établir les responsabilités."
]
def run(cmd,capture=True):
    q=subprocess.run([str(v) for v in cmd],check=True,stdout=subprocess.PIPE if capture else None,stderr=subprocess.PIPE,text=True)
    return q.stdout or ""
def video_probe(p):
    return json.loads(run(["ffprobe","-v","error","-show_format","-show_streams","-of","json",str(p)]))
def sha(p):
    h=hashlib.sha256()
    with open(p,"rb") as f:
        for part in iter(lambda:f.read(1024*1024),b""):h.update(part)
    return h.hexdigest()
def image_fitted(path,focus=(.5,.5),tone=1.0):
    im=Image.open(path).convert("RGB")
    if min(im.size)<1000:raise RuntimeError("V3 photo fails minimum high-res source")
    im=ImageEnhance.Color(im).enhance(tone)
    im=ImageEnhance.Contrast(im).enhance(1.045)
    return ImageOps.fit(im,(W,H),Image.Resampling.LANCZOS,centering=focus)
def darken(im,strength=.78):
    ov=Image.new("RGBA",(W,H),(0,0,0,0))
    draw=ImageDraw.Draw(ov)
    for y in range(H):
        u=min(1,max(0,(y-615)/1000))
        shadow=int(216*strength*(u**1.23))
        if y<360:shadow=max(shadow,int(95*strength*(1-y/360.)))
        if shadow:draw.line((0,y,W,y),fill=NAVY+(shadow,))
    return Image.alpha_composite(im.convert("RGBA"),ov).convert("RGB")
def tinted(im,alpha=0.2):
    return Image.blend(im,Image.new("RGB",(W,H),NAVY),alpha)
class Paint:
    def __init__(self,head,body):
        self.head=Path(head);self.body=Path(body)
    def font(self,size,bold=True):
        f=ImageFont.truetype(str(self.head if bold else self.body),size)
        try:
            axs=f.get_variation_axes()
            vals=[]
            for x in axs:
                n=x["name"].decode(errors="ignore").lower() if isinstance(x["name"],bytes) else str(x["name"]).lower()
                v=(700 if bold else 500) if "weight" in n else size if "optical" in n else x["default"]
                vals.append(max(x["minimum"],min(x["maximum"],v)))
            f.set_variation_by_axes(vals)
        except (ValueError,AttributeError,OSError):pass
        return f
    def text(self,draw,string,x,y,size=70,color=WHITE,bold=True,maxw=925):
        for z in range(size,19,-2):
            font=self.font(z,bold)
            box=draw.textbbox((0,0),string,font=font)
            if box[2]-box[0]<=maxw:
                draw.text((x,y),string,font=font,fill=color,stroke_width=0)
                return
        raise RuntimeError("Unfittable onscreen text "+string)
def title(im,paint,eyebrow,heading,sub=None,focus=(.5,.5),size=106):
    im=darken(im)
    d=ImageDraw.Draw(im)
    # Editorial information, no "ILLUSTRATION", "QA", test versions or logo.
    if eyebrow:paint.text(d,eyebrow,74,232,29,MUTED,False)
    y=1228 if len(heading)<3 else 1120
    for line in heading:
        paint.text(d,line,74,y,size,GOLD if (line in ["13 BLESSÉS","5 SUR 10","PUIS DES TIRS.","NON IDENTIFIÉES","LE PREMIER ?","EST OUVERTE."]) else WHITE,True)
        y+=130 if size>=96 else 116
    if sub:paint.text(d,sub,75,1585,32,MUTED,False)
    return im
def make_map_photo(photo,paint,geo):
    im=darken(photo,.63)
    # Source: actual 2024 Guinea field photograph + sourced Natural Earth.
    d=ImageDraw.Draw(im)
    d.rounded_rectangle((95,410,970,1270),radius=25,fill=(5,19,21),outline=(72,113,115),width=3)
    obj=json.loads(Path(geo).read_text())
    feat=next(f for f in obj["features"] if (f.get("properties") or {}).get("ISO3166-1-Alpha-3")=="GIN")
    g=feat["geometry"]
    poly=g["coordinates"][0] if g["type"]=="Polygon" else max((p[0] for p in g["coordinates"]),key=len)
    lon=[p[0] for p in poly];lat=[p[1] for p in poly]
    lonmin,lonmax=min(lon),max(lon);latmin,latmax=min(lat),max(lat)
    def proj(ll,lo):
        return (int(220+(lo-lonmin)/(lonmax-lonmin)*640),int(513+(latmax-ll)/(latmax-latmin)*640))
    pts=[proj(a,b) for b,a in poly]
    d.polygon(pts,fill=(22,79,62),outline=(113,190,154),width=6)
    for name,ll,lo in [("SIGUIRI",11.42282,-9.16852),("BALATO",11.57162,-9.32061)]:
        x,y=proj(ll,lo)
        d.ellipse((x-13,y-13,x+13,y+13),fill=GOLD)
        d.ellipse((x-27,y-27,x+27,y+27),outline=GOLD,width=3)
    paint.text(d,"BALATO",76,1315,128,WHITE,True)
    paint.text(d,"PRÈS DE SIGUIRI",80,1453,45,GOLD,False)
    return im
def show_document(background,document,paint,eyebrow,heading,sub=None,lower=False,mode="front"):
    im=tinted(darken(background,.74),.24)
    # Show different authentic sections, not the same entire white page three times.
    page=Image.open(document).convert("RGB")
    if mode=="front":
        doc_w,doc_h,center,x,y=800,1060,(.5,.30),140,270
    elif mode=="casualties":
        doc_w,doc_h,center,x,y=890,575,(.5,.69),95,580
    elif mode=="investigation":
        doc_w,doc_h,center,x,y=880,770,(.5,.64),100,500
    else:raise RuntimeError("Unknown official-document mode "+mode)
    crop=ImageOps.fit(page,(doc_w,doc_h),Image.Resampling.LANCZOS,centering=center)
    crop=ImageEnhance.Contrast(crop).enhance(1.12)
    shadow=Image.new("RGBA",(doc_w+34,doc_h+34),(0,0,0,0))
    d=ImageDraw.Draw(shadow)
    d.rounded_rectangle((12,12,doc_w+22,doc_h+22),radius=14,fill=(0,0,0,175))
    im.paste(shadow,(x-17,y-17),shadow)
    im.paste(crop,(x,y))
    im=darken(im,.45)
    d=ImageDraw.Draw(im)
    if eyebrow:paint.text(d,eyebrow,75,222,28,MUTED,False)
    y0=1375
    for i,line in enumerate(heading):
        paint.text(d,line,76,y0+i*115,94,GOLD if i==len(heading)-1 else WHITE,True)
    if sub:paint.text(d,sub,78,1698,28,MUTED,False)
    return im
def new_scene(index,assets,paint,geo):
    base=assets
    if index==1:
        return title(image_fitted(base/"01.jpg",(.65,.49),1.08),paint,
             "GUINÉE · ORPAILLAGE",["10 MORTS.","13 BLESSÉS."],"BILAN PROVISOIRE · 11 NOVEMBRE 2026",size=114)
    if index==2:
        return make_map_photo(image_fitted(base/"05.jpg",(.62,.48),.84),paint,geo)
    if index==3:
        return title(image_fitted(base/"01.jpg",(.21,.60),1.04),paint,
              "02 NOVEMBRE 2026",["ORPAILLAGE","INTERDIT."],size=104)
    if index==4:
        return title(image_fitted(base/"04.jpg",(.52,.50),1.05),paint,
              "HAUTE-GUINÉE",["NEUF JOURS","PLUS TARD."],size=104)
    if index==5:
        return show_document(image_fitted(base/"01.jpg",(.58,.52),.7),
             base/"official_statement.jpg",paint,"COMMUNIQUÉ OFFICIEL",
             ["BARRICADES.","PUIS DES TIRS."])
    if index==6:
        return title(image_fitted(base/"05.jpg",(.54,.47),.82),paint,
              "LE BILAN RÉVÈLE AUTRE CHOSE",["5 SUR 10","SONT ÉTRANGERS."],size=100)
    if index==7:
        return show_document(image_fitted(base/"04.jpg",(.44,.5),.74),
             base/"official_statement.jpg",paint,"BILAN OFFICIEL",
             ["IDENTITÉS","NON IDENTIFIÉES"],lower=True,mode="casualties")
    if index==8:
        return title(image_fitted(base/"02.jpg",(.57,.47),.88),paint,
              "LA QUESTION RESTE ENTIÈRE",["POURQUOI","UNE TELLE TENSION ?"],size=99)
    if index==9:
        return title(image_fitted(base/"05.jpg",(.44,.47),.82),paint,
              "LES CONSÉQUENCES DÉNONCÉES",["DES TERRES","DÉGRADÉES."],size=103)
    if index==10:
        return title(image_fitted(base/"04.jpg",(.42,.47),1.0),paint,
              "L'EXPLOITATION AFFECTE",["LES COURS","D’EAU."],size=112)
    if index==11:
        return title(image_fitted(base/"03.jpg",(.43,.31),1.02),paint,
              "DERRIÈRE LA RUÉE VERS L'OR",["DES FAMILLES","EN DÉPENDENT."],size=103)
    if index==13:
        return show_document(image_fitted(base/"01.jpg",(.45,.54),.70),
               base/"official_statement_page2.jpg",paint,"UNE QUESTION SANS RÉPONSE",
               ["QUI A TIRÉ","LE PREMIER ?"],mode="investigation")
    if index==14:
        return title(image_fitted(base/"04.jpg",(.51,.52),.78),paint,
              "BALATO · GUINÉE",["UNE ENQUÊTE","EST OUVERTE."],size=104)
    raise KeyError("No replacement for index "+str(index))
def still_video(plate,n,out):
    # Professional subtle move, not a static PPT card.
    # A 1.0 -> 1.04 optical push creates depth without distortions.
    vf=("zoompan=z='min(zoom+0.00025,1.043)':d=1:"
        "x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':"
        "s=1080x1920:fps=30,format=yuv420p")
    run(["ffmpeg","-y","-v","error","-loop","1","-r","30","-i",plate,
         "-vf",vf,"-frames:v",n,"-an","-c:v","libx264",
         "-preset","veryfast","-crf","18","-pix_fmt","yuv420p",out])
def old_video(source,n0,n1,out):
    # Exact frame range from original to keep globe and worker and blue endcard.
    vf=f"trim=start_frame={n0}:end_frame={n1},setpts=PTS-STARTPTS,fps=30,format=yuv420p"
    run(["ffmpeg","-y","-v","error","-i",source,"-vf",vf,
         "-frames:v",n1-n0,"-an","-c:v","libx264","-preset","veryfast",
         "-crf","18","-pix_fmt","yuv420p",out])
def main():
    p=argparse.ArgumentParser()
    for n in ["reference","reference_manifest","assets","geojson","headfont","bodyfont","out"]:p.add_argument("--"+n,required=True,type=Path)
    a=p.parse_args()
    out=a.out;out.mkdir(parents=True,exist_ok=True)
    rev=out/"review";rev.mkdir(exist_ok=True)
    orig=json.loads(a.reference_manifest.read_text(encoding="utf8"))
    assert orig["script_sha256"]==APPROVED_TEXT_SHA
    assert hashlib.sha256("\n".join(TEXT_LINES).encode("utf8")).hexdigest()==APPROVED_TEXT_SHA,"USER SCRIPT DRIFT"
    assert len(orig["visual_timeline"])==16
    old=orig["visual_timeline"]
    assert [x["visual"] for x in old]==SOURCE_TIMELINE
    psrc=video_probe(a.reference)
    refvid=next(s for s in psrc["streams"] if s["codec_type"]=="video")
    assert (refvid["width"],refvid["height"])==(W,H)
    refdur=float(psrc["format"]["duration"])
    assert abs(refdur-orig["duration_seconds"])<.15
    pnt=Paint(a.headfont,a.bodyfont)
    shotfiles=[];ledger=[];position=0
    for i,old_scene in enumerate(old):
        frames=int(round(float(old_scene["seconds"])*FPS))
        if frames<25:raise RuntimeError("Frame count too short")
        outname=out/f"shot-{i:02d}.mp4"
        if i in RETAIN:
            old_video(a.reference,position,position+frames,outname)
            kind="original_approved_github_v2_video"
        else:
            plate=new_scene(i,a.assets,pnt,a.geojson)
            picture=out/f"plate-{i:02d}.jpg"
            plate.save(picture,quality=93,subsampling=0)
            still_video(picture,frames,outname)
            kind="licensed_authentic_2024_guinea_photo_or_official_statement"
        shotfiles.append(outname)
        ledger.append({"index":i,"start":position/FPS,"duration_seconds":frames/FPS,
                      "original_visual":old_scene["visual"],"source_type":kind,
                      "retained_from_v2":i in RETAIN})
        position+=frames
    assert position==round(refdur*FPS),f"Frame duration mismatch {position} vs {refdur}"
    lst=out/"sequence.ffconcat"
    lst.write_text("".join("file '"+str(x.resolve())+"'\n" for x in shotfiles))
    merged=out/"v3-silent-video.mp4"
    run(["ffmpeg","-y","-v","error","-f","concat","-safe","0","-i",lst,
         "-c:v","libx264","-preset","veryfast","-crf","18","-r","30",
         "-pix_fmt","yuv420p","-movflags","+faststart",merged])
    final=out/"worldvision-guinee-siguiri-v3-visuels-refaits-voix-identique.mp4"
    # ZERO TTS generation. Map EXACT AAC elementary stream from last owner V2.
    run(["ffmpeg","-y","-v","error","-i",merged,"-i",a.reference,
         "-map","0:v:0","-map","1:a:0","-c:v","copy","-c:a","copy",
         "-t",f"{position/FPS:.6f}","-movflags","+faststart",final])
    parsed=video_probe(final)
    duration=float(parsed["format"]["duration"])
    assert abs(duration-refdur)<.12,(duration,refdur)
    assert len([x for x in parsed["streams"] if x["codec_type"]=="audio"])==1
    # Compare compressed audio bitstream - must match owner V2 exactly.
    original_aac=out/"v2-original.aac";new_aac=out/"v3-original.aac"
    for src,dst in [(a.reference,original_aac),(final,new_aac)]:
        run(["ffmpeg","-y","-v","error","-i",src,"-map","0:a:0",
             "-c:a","copy","-f","adts",dst])
    assert sha(original_aac)==sha(new_aac),"Audio drift from approved V2 master"
    # 16 true frames reveal every decision, original and replacements.
    contact=Image.new("RGB",(315*4,560*4),NAVY)
    for i,sc in enumerate(ledger):
        stamp=sc["start"]+sc["duration_seconds"]/2
        imagepath=rev/f"shot-{i+1:02d}.jpg"
        run(["ffmpeg","-y","-v","error","-ss",f"{stamp:.3f}","-i",final,
             "-vf","scale=315:560","-frames:v",1,imagepath])
        im=Image.open(imagepath).convert("RGB")
        contact.paste(im,((i%4)*315,(i//4)*560))
    contact.save(rev/"contact-sheet-16.jpg",quality=89)
    source_credits=[]
    for n in range(1,6):
        img=a.assets/f"{n:02d}.jpg"
        source_credits.append({"file":img.name,"sha256":sha(img),
          "captured":"2024-07-21","country":"Guinea",
          "author":"LincolnGN / Wikimedia Commons (EXIF lists Henri)",
          "license":"Creative Commons Attribution-ShareAlike 4.0 International",
          "url":f"https://commons.wikimedia.org/wiki/File:Les_Orpailleurs_du_Quotidien_{n:02d}.jpg",
          "modified":"Cropped, adjusted color, editorial typography and slow camera push; not footage from 2026"})
    statement={
      "file":"official_statement.jpg","sha256":sha(a.assets/"official_statement.jpg"),
      "file_page2":"official_statement_page2.jpg","sha256_page2":sha(a.assets/"official_statement_page2.jpg"),
      "publisher":"Ministère de l’Administration du Territoire et de la Décentralisation, République de Guinée",
      "publication_date":"2026-11-12",
      "url":"https://gouvernement.gov.gn/wp-content/uploads/2026/11/COMMUNIQUE-NA%C2%B0-008-MATD-CAB-2026-DU-GOUVERNEMENT-RELATIF-AUX-EVENEMENTS-SURVENUS-LE-11-NOVEMBRE-2026-A-BALATO-PREFECTURE-DE-KINTINIAN-DU-12112026.pdf",
      "derivation":"Extracted first page from official government PDF, cropped on real communiqué"
    }
    manifest={
      "episode":"Guinea Balato / Siguiri 2026-11-11",
      "version":"V3 AUTHENTIC GUINEA VISUAL REBUILD",
      "voice":"Vivienne — EXACT ORIGINAL V2 AAC STREAM (no synthesis, no splicing or tempo changes)",
      "source_master":str(a.reference.name),
      "source_video_sha256":sha(a.reference),
      "script_sha256":APPROVED_TEXT_SHA,"script_verbatim":TEXT_LINES,
      "audio_bitstream_identical_to_v2":True,
      "audio_adts_sha256":sha(new_aac),
      "duration_seconds":duration,
      "video_sha256":sha(final),
      "retained_visual_indices":sorted(RETAIN),
      "all_other_visuals_replaced":True,
      "replaced_visual_count":13,
      "total_visual_count":16,
      "ledger":ledger,
      "geography":"Accurate NASA/Natural Earth original V2 globe and a new photography-backed Guinea locator",
      "new_documentary_sources":source_credits,
      "new_official_document":statement,
      "provenance":"All added photographs were actually taken in Guinea in July 2024; they show gold panning context, NOT the deadly Balato clashes of 11 November 2026.",
      "cc_by_sa_4_0_reuse_notice":"The edited photographic assets are used under CC BY-SA 4.0. Attribution, adaptation disclosure, license link and share-alike obligations must accompany publication. Verify applicability to combined video with rights holder/legal review.",
      "owner_approved_shots_preserved":"0: globe; 12: worker real motion; 15: owner's last blue closing signature, unchanged from V2",
      "license_for_voice_commercial_use_verified":False,
      "user_artistic_approval":False,"authorized_for_publication":False
    }
    (out/"manifest.json").write_text(json.dumps(manifest,indent=2,ensure_ascii=False)+"\n",encoding="utf8")
    print(json.dumps({"result":"V3 VISUAL REBUILD 13/16 scenes changed","file":str(final),
        "duration":round(duration,3),"audio_bitlevel_identical":True,
        "video_sha256":manifest["video_sha256"]},ensure_ascii=False))
if __name__=="__main__":main()
