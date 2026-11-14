#!/usr/bin/env python3
"""World-Vision FASTLANE: montage SEULEMENT, une fois éditorial/assets/voix validés.

Script, vrais plans licenciés, globe NASA/geo, voix Vivienne pour CE sujet et
signature animée sont déjà prêts et fingerprintés AVANT le départ du montage.
N'effectue aucune recherche, synthèse, génération d'image ou retouche créative.
"""
from __future__ import annotations
import argparse,hashlib,json,math,re,subprocess,sys,time
from pathlib import Path

VOICE="fr-FR-VivienneMultilingualNeural"
STYLE="worldvision-vivienne-c52-impact-media"
MAX_SECONDS=60.0
class Blocked(ValueError):pass

def cmd(args,timeout=180):
    r=subprocess.run([str(x) for x in args],capture_output=True,timeout=timeout)
    if r.returncode:raise Blocked(r.stderr.decode(errors="replace")[-1400:])
    return r.stdout.decode(errors="replace")

def sha(p):
    h=hashlib.sha256()
    with Path(p).open("rb") as f:
        for part in iter(lambda:f.read(1<<20),b""):h.update(part)
    return h.hexdigest()

def probe(p):
    return json.loads(cmd(["ffprobe","-v","error","-show_streams","-show_format","-of","json",p],30))

def stream(obj,kind):
    return next((x for x in obj["streams"] if x["codec_type"]==kind),None)

def duration(obj):return float(obj["format"]["duration"])

def asset(root,item):
    rel=item.get("path")
    if not isinstance(rel,str) or not rel or rel.startswith(("http:","https:","/")):
        raise Blocked(f"Chemin non local ou non préparé : {rel!r}")
    p=(root.resolve()/rel).resolve()
    if not p.is_relative_to(root.resolve()) or not p.is_file():
        raise Blocked("Asset absent ou hors dossier : "+rel)
    if not re.fullmatch("[0-9a-f]{64}",str(item.get("sha256",""))) or sha(p)!=item["sha256"]:
        raise Blocked("Empreinte SHA-256 différente de l'asset approuvé : "+rel)
    return p

def preflight(package,root,mode):
    if package.get("schema_version")!=1 or package.get("stage")!="EDITORIALLY_LOCKED":
        raise Blocked("Le sujet/script/plan visuel ne sont pas encore validés.")
    if not re.fullmatch(r"WV\d{3}-[a-z0-9-]{4,55}",package.get("episode_id","")):
        raise Blocked("Identifiant épisode incorrect.")
    script=package.get("locked_script")
    if not isinstance(script,str) or len(script)<15 or not package.get("script_approved_by_user"):
        raise Blocked("Pas de script utilisateur validé.")
    if hashlib.sha256(script.encode("utf-8")).hexdigest()!=package.get("script_sha256"):
        raise Blocked("STOP : le script a été réécrit sans autorisation.")
    if len(package.get("factcheck_sources",[]))<2 or not all(x.startswith("https://") for x in package["factcheck_sources"]):
        raise Blocked("Au moins deux sources éditoriales vérifiables.")
    voice=package.get("narration",{})
    if voice.get("speaker")!=VOICE or voice.get("style_reference")!=STYLE:
        raise Blocked("Mauvais timbre : Vivienne C5.2 est la référence sonore.")
    if not all(voice.get(k) for k in ("same_story","one_continuous_take","approved_by_user")):
        raise Blocked("Il faut une prise continue approuvée pour CETTE actualité.")
    if mode=="publish" and not voice.get("commercial_rights_verified"):
        raise Blocked("Diffusion bloquée : licence commerciale de la voix non vérifiée.")
    a=asset(root,voice)
    if stream(probe(a),"audio") is None:raise Blocked("Voix absente du fichier.")
    voice_len=duration(probe(a))
    if not 5<=voice_len<=57:raise Blocked("Durée de voix non compatible avec moins de 60s.")
    scenes=package.get("scenes",[])
    if not 3<=len(scenes)<=18 or scenes[0].get("role")!="globe" or scenes[-1].get("role")!="outro":
        raise Blocked("Globe d'ouverture, plans de reportage et vraie signature finale indispensables.")
    files,formats=[],[]
    for i,s in enumerate(scenes):
        if not s.get("approved_by_user") or not s.get("visual_matches_spoken_fact"):
            raise Blocked(f"Plan {i} non approuvé ou sans rapport avec les paroles.")
        if not s.get("provenance_url","").startswith("https://") or s.get("rights_status") not in ("licensed","public_domain","owned"):
            raise Blocked(f"Plan {i} sans source et droits adéquats.")
        if s.get("is_synthetic_event_footage"):
            raise Blocked("Fausse photographie ou scène d'actualité générée interdite.")
        f=asset(root,s)
        obj=probe(f);v=stream(obj,"video")
        if not v or v["codec_name"]!="h264" or v.get("pix_fmt")!="yuv420p":
            raise Blocked(f"Plan {i} non pré-encodé H.264/yuv420p.")
        if (int(v["width"]),int(v["height"]))!=(1080,1920):
            raise Blocked(f"Plan {i} non vertical 1080x1920.")
        n,d=(int(x) for x in v["avg_frame_rate"].split("/"))
        if not d or abs(n/d-30)>.05:raise Blocked(f"Plan {i} pas à 30 images/seconde.")
        if stream(obj,"audio"):raise Blocked(f"Plan {i} contient un son parasite. Supprimer AVANT montage.")
        if abs(duration(obj)-float(s.get("duration_seconds",0)))>.067:
            raise Blocked(f"Plan {i} non synchronisé avec la durée approuvée.")
        if s["role"]=="outro" and abs(duration(obj)-3)>.067:
            raise Blocked("La véritable animation de logo doit durer 3 secondes.")
        if "'" in str(f):raise Blocked("Nom de fichier contenant apostrophe non pris en charge.")
        files.append(f)
        formats.append((v["codec_name"],v.get("profile"),v.get("pix_fmt"),v.get("time_base")))
    if len(set(formats))!=1:
        raise Blocked("Timebase/profile vidéos différents. Pré-normaliser AVANT le montage rapide.")
    visual=sum(float(s["duration_seconds"]) for s in scenes[:-1])
    if abs(visual-voice_len)>.12:
        raise Blocked(f"Images {visual:.3f}s != voix {voice_len:.3f}s. Ajuster storyboard, ne pas déformer Vivienne.")
    total=visual+3
    if total>MAX_SECONDS+.05:raise Blocked("Montage trop long. Faire approuver une réduction de texte.")
    if mode=="publish" and not package.get("final_mobile_review_approved"):
        raise Blocked("Visionnage humain sur téléphone non confirmé.")
    return files,a,total

def measure_audio(p):
    r=subprocess.run(["ffmpeg","-nostdin","-hide_banner","-i",str(p),"-map","0:a:0",
       "-af","loudnorm=I=-14:TP=-1.5:LRA=8:print_format=json","-f","null","-"],
       capture_output=True,text=True,timeout=80)
    if r.returncode:raise Blocked("Mesure audio échouée.")
    vals=re.findall(r'\{\s*"input_i".*?\}',r.stderr,re.S)
    if not vals:raise Blocked("Pas de mesure sonore valide.")
    data=json.loads(vals[-1])
    return float(data["input_i"]),float(data["input_tp"])

def screenshots(master,scenes,out):
    from PIL import Image
    out.mkdir(exist_ok=True)
    cols=min(4,len(scenes));rows=math.ceil(len(scenes)/cols)
    sheet=Image.new("RGB",(240*cols,427*rows),(11,25,32))
    acc=0
    for i,s in enumerate(scenes):
        sec=float(s["duration_seconds"])
        frame=out/f"plan-{i:02d}.jpg"
        cmd(["ffmpeg","-y","-v","error","-ss",f"{acc+sec/2:.3f}",
             "-i",master,"-frames:v","1","-vf","scale=240:427",frame],30)
        with Image.open(frame) as im:
            sheet.paste(im.convert("RGB"),((i%cols)*240,(i//cols)*427))
        acc+=sec
    sheet.save(out/"planche-controle.jpg",quality=86)
    return len(scenes)

def assemble(pkg_path,root,out,mode="preview"):
    start=time.perf_counter()
    pkg=json.loads(pkg_path.read_text(encoding="utf-8"))
    files,voice,seconds=preflight(pkg,root,mode)
    out.mkdir(parents=True,exist_ok=True)
    playlist=out/"plans.ffconcat"
    playlist.write_text("ffconcat version 1.0\n"+"".join("file '"+str(f)+"'\n" for f in files),encoding="utf-8")
    silent=out/"plans-sans-son.mp4"
    cmd(["ffmpeg","-y","-nostdin","-v","error","-f","concat","-safe","0",
         "-i",playlist,"-map","0:v:0","-c:v","copy","-an","-movflags","+faststart",silent])
    master=out/"worldvision-apercu.mp4"
    cmd(["ffmpeg","-y","-nostdin","-v","error","-i",silent,"-i",voice,
         "-map","0:v:0","-map","1:a:0","-c:v","copy","-c:a","aac","-b:a","192k",
         "-ar","48000","-ac","1","-af","highpass=f=70,loudnorm=I=-14:TP=-1.5:LRA=8",
         "-t",f"{seconds:.5f}","-movflags","+faststart",master])
    meta=probe(master);v=stream(meta,"video");a=stream(meta,"audio")
    if not v or not a or (int(v["width"]),int(v["height"]))!=(1080,1920) or a["codec_name"]!="aac":
        raise Blocked("Format de sortie non conforme.")
    if abs(duration(meta)-seconds)>.13:raise Blocked("Durée finale modifiée.")
    lufs,peak=measure_audio(master)
    if not -15.7<=lufs<=-12 or peak>-1:raise Blocked(f"Son téléphone non conforme : {lufs:.1f} LUFS et {peak:.1f} dBTP.")
    frames=screenshots(master,pkg["scenes"],out/"controle")
    elapsed=time.perf_counter()-start
    report={
      "result":"APERÇU_TECHNIQUE_A_VALIDER" if mode=="preview" else "PRET_POUR_VALIDATION_DU_PROPRIETAIRE",
      "episode_id":pkg["episode_id"],"montage_seconds":round(elapsed,2),
      "objectif_300_secondes_atteint":elapsed<300,"temps_preproduction_exclu":True,
      "voice_reference":STYLE,"speaker":VOICE,"nouvelle_synthese_voix":False,
      "video_reencode":False,"nombre_de_plans_verifies":frames,
      "duration_seconds":round(duration(meta),3),"lufs":round(lufs,2),"true_peak_dbtp":round(peak,2),
      "script_sha256":pkg["script_sha256"],"mp4_sha256":sha(master),
      "licence_voix_commerciale_verifiee":bool(pkg["narration"].get("commercial_rights_verified")),
      "beauty_and_emotion_human_review_required":True
    }
    (out/"rapport.json").write_text(json.dumps(report,indent=2,ensure_ascii=False)+"\n",encoding="utf-8")
    print(json.dumps(report,ensure_ascii=False))
    return report

def main():
    p=argparse.ArgumentParser()
    p.add_argument("--manifest",type=Path,required=True)
    p.add_argument("--assets",type=Path,required=True)
    p.add_argument("--output",type=Path,required=True)
    p.add_argument("--mode",choices=["preview","publish"],default="preview")
    x=p.parse_args()
    try:assemble(x.manifest,x.assets,x.output,x.mode)
    except (Blocked,KeyError,FileNotFoundError,subprocess.TimeoutExpired) as e:
        print("MONTAGE BLOQUÉ :",str(e),file=sys.stderr)
        raise SystemExit(1)

if __name__=="__main__":main()
