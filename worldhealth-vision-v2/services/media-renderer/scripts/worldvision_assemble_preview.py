#!/usr/bin/env python3
"""World-Vision #001 43s documentary review assembly: honest source references.

Uses source SHA-pinned MP4s, real French voice and word-aligned captions.
The unavailable original S02 clip from Canva is explicitly NOT fabricated:
a 0.9s genuine G0 brand card is used ONLY in this review edition.
Do not publish until authentic D00 film and artistic/voice approval are supplied.
"""
import hashlib,json,subprocess,urllib.request
from pathlib import Path

HERE=Path(__file__).resolve()
ROOT=HERE.parents[3]
BASE=HERE.parents[1]
WORK=BASE/"output/summit-2026/assembled-review"
WORK.mkdir(parents=True,exist_ok=True)
PUBLIC="https://raw.githubusercontent.com/OBIANG5/World-Health-Vision/whv-media-studio-browser-preview/media-lab/summit-2026"
FILES=[
 ("01.mp4","hook-v2-clean-manrope-4p5s.mp4","985d5f77f6de53a68fa49e6efc84ad2e37dd7c5c3ed48b6f4e6a492058cb37d2",135),
 ("03.mp4","s03-to-s03b-shenzhen-matchcut-v2-circleopen-7p1s.mp4","8ab698002dfd82375423e6866b5bf0a7e602af5a7bba3a0ebafdce3b9191ef37",213),
 ("04.mp4","segment04-new-start-v3-clean-7p9s.mp4","4fa8aebec451f4edb0d8bd495655b619feaab0d9fb0d517c12e4bd9f88b33e69",237),
 ("05.mp4","segment05-china-xi-6p2s.mp4","2bcbaf543367633c9277e4fb394347ef3fe3dd16630c97652294ad900b90e331",186),
 ("06.mp4","segment06-iran-ukraine-7p2s.mp4","0afb3dffb611415a9651efc9bf5a9f85341d765439d592c8904a71dc7732f572",216),
 ("07.mp4","segment07-no-agreement-6p2s.mp4","4035ab539caf53c85ac36ba43320acdd17b08e8a46eb64c54641c358e050c9b9",186),
 ("08.mp4","segment08-worldvision-outro-3p0s.mp4","646957b11e52b8cb9cf6342762ffed79f272fbc31d965488a8644f25ba22cf58",90)
]
VOICE_SHA="97eb96df880aaf8443f3e484951d1f0ce9e024e544e153f77bf1d3f20a0dd739"
LOGO=BASE/"public/brand/world-vision-official.png"
LOGO_BLOB="bc80fa70cebd566768bfb1703a0f1f636a78c196"
def sh(*cmd):
 subprocess.run(list(map(str,cmd)),check=True)
def out(*cmd):
 return subprocess.check_output(list(map(str,cmd)),text=True)
def sha(p):
 return hashlib.sha256(Path(p).read_bytes()).hexdigest()
def fetch(rel,local,expected):
 p=WORK/local
 if not p.exists() or sha(p)!=expected:
  request=urllib.request.Request(PUBLIC+"/"+rel,headers={"User-Agent":"World-Vision review editor/1.0"})
  with urllib.request.urlopen(request,timeout=180) as result,p.open("wb") as out_f:
   while c:=result.read(1024*1024):out_f.write(c)
 assert sha(p)==expected,("source SHA mismatch",rel,sha(p))
 return p
def probe(p):
 return json.loads(out("ffprobe","-v","error","-show_streams","-show_format","-of","json",p))
assert out("git","hash-object",LOGO).strip()==LOGO_BLOB
for local,remote,digest,frames in FILES:
 p=fetch(remote,local,digest);v=next(x for x in probe(p)["streams"] if x["codec_type"]=="video")
 assert (int(v["width"]),int(v["height"]))==(1080,1920)
 assert int(v["nb_frames"])==frames,(local,frames,v.get("nb_frames"))
voice=fetch("voice/worldvision-voice-fr-43s-candidate.wav","voice.wav",VOICE_SHA)
data=WORK/"voice.json"
req=urllib.request.Request(PUBLIC+"/voice/worldvision-voice-fr-43s-candidate.json",headers={"User-Agent":"World-Vision review editor/1.0"})
data.write_bytes(urllib.request.urlopen(req,timeout=180).read())
assert json.loads(data.read_text())["sha256"]==VOICE_SHA

# Exact original brand G0 is the sole source for temporary 0.9s identity hold.
# Not a reconstruction of the D00-v6 Earth. Review-only and explicitly logged.
card=WORK/"02-BRAND-ONLY-NOT-D00.mp4"
sh("ffmpeg","-y","-v","error","-f","lavfi","-i",
   "color=c=0x031126:s=1080x1920:r=30:d=0.9",
   "-loop","1","-framerate","30","-i",LOGO,
   "-filter_complex","[1:v]scale=430:430:force_original_aspect_ratio=decrease[logo];[0:v][logo]overlay=(W-w)/2:(H-h)/2:shortest=1,format=yuv420p[v]",
   "-map","[v]","-t","0.9","-an","-c:v","libx264","-preset","veryfast",
   "-crf","18","-pix_fmt","yuv420p",card)
assert next(x for x in probe(card)["streams"] if x["codec_type"]=="video")["nb_frames"]=="27"
parts=["01.mp4",card.name,"03.mp4","04.mp4","05.mp4","06.mp4","07.mp4","08.mp4"]
playlist=WORK/"segments.txt"
playlist.write_text("".join("file '"+str(WORK/p)+"'\n" for p in parts),encoding="utf8")
visual=WORK/"visual-unsubtitled.mp4"
sh("ffmpeg","-y","-v","error","-f","concat","-safe","0","-i",playlist,
   "-fps_mode","cfr","-r","30","-an","-c:v","libx264","-preset","medium",
   "-crf","19","-pix_fmt","yuv420p","-movflags","+faststart",visual)

# Source-locked subtitle alignment: direct real neural word boundaries.
stem=WORK/"captions"
sh("python3",BASE/"scripts/worldvision_captions_from_voice.py",
   "--voice-json",data,
   "--component",BASE/"src/WorldVisionSummit2026.tsx",
   "--output-stem",stem)
assert stem.with_suffix(".srt").exists() and stem.with_suffix(".ass").exists()

# Fully original non-melodic underscoring, mathematically synthesized without
# copying any composition (very low below spoken narration).
bed=WORK/"original-ambient.wav"
expression="aevalsrc=(0.004*sin(2*PI*110*t)+0.003*sin(2*PI*164.81*t)+0.002*sin(2*PI*220*t))*(0.83+0.17*sin(2*PI*0.19*t)):s=48000:d=43"
sh("ffmpeg","-y","-v","error","-f","lavfi","-i",expression,"-ac","2",
   "-ar","48000","-c:a","pcm_s16le",bed)
master=WORK/"worldvision-001-43s-voiced-subtitled-review.mp4"
fltr="[0:v]ass="+str(stem.with_suffix(".ass"))+",format=yuv420p[v];[1:a]volume=1.0[n];[2:a]volume=0.35[b];[n][b]amix=inputs=2:duration=first:normalize=0,alimiter=limit=0.95[a]"
sh("ffmpeg","-y","-v","error","-i",visual,"-i",voice,"-i",bed,
   "-filter_complex",fltr,"-map","[v]","-map","[a]","-t","43",
   "-c:v","libx264","-preset","medium","-crf","19","-pix_fmt","yuv420p",
   "-c:a","aac","-b:a","192k","-movflags","+faststart",master)
meta=probe(master)
v=next(x for x in meta["streams"] if x["codec_type"]=="video")
a=next(x for x in meta["streams"] if x["codec_type"]=="audio")
assert v["codec_name"]=="h264" and a["codec_name"]=="aac"
assert v["width"]==1080 and v["height"]==1920
assert int(v["nb_frames"])==1290,(v["nb_frames"],meta["format"]["duration"])
assert abs(float(meta["format"]["duration"])-43)<.07
subs=stem.with_suffix(".srt").read_text()
assert sum("-->" in z for z in subs.splitlines())==13
review=WORK/"review-frames";review.mkdir(exist_ok=True)
moments={"opening":.7,"brand_hold":5.0,"globe":8.0,"city":11.5,
         "new_start":16.4,"china":24.2,"agenda":29.8,
         "conclusion":37.1,"signature":41.8}
for name,sec in moments.items():
 sh("ffmpeg","-y","-v","error","-ss",str(sec),"-i",master,
    "-frames:v","1","-vf","scale=405:720","-q:v","3",review/(name+".jpg"))
shots=["opening","globe","new_start","agenda"]
cmd=["ffmpeg","-y","-v","error"]
for name in shots:cmd+=["-i",str(review/(name+".jpg"))]
cmd+=["-filter_complex","hstack=inputs=4","-q:v","3",str(review/"contact-sheet.jpg")]
sh(*cmd)
report={
 "status":"43S_COMPLETE_REVIEW_NOT_PUBLICATION_MASTER",
 "duration_seconds":43,"frames":1290,"fps":30,"resolution":"1080x1920",
 "source_script_approved_user_copy":True,"voice_fr":True,
 "voice_engine":"fr-FR-HenriNeural","voice_approved_by_user":False,
 "voice_sha256":VOICE_SHA,"subtitle_cues":13,
 "subtitles_matched_to_actual_word_boundaries":True,
 "clean_segment_mp4s":True,
 "music":"original mathematically synthesized quiet atmospheric bed",
 "narrative_source":"2026-11-14 approved SCRIPT_V1.md",
 "publication_authorized":False,"art_approved":False,
 "s02_original_d00_used":False,"s02_actual_status":"original exists as Canva asset VAHa4ZT_ySo, not downloadable via current connector; no fabricated substitute",
 "s02_temporary":"0.9s exact original G0 brand logo card. Replace with exact D00 source film before publication.",
 "component_sources":[{"file":remote,"sha256":dg,"frames":n} for _,remote,dg,n in FILES],
 "sha256":sha(master),"bytes":master.stat().st_size
}
(WORK/"worldvision-001-43s-voiced-subtitled-review.json").write_text(json.dumps(report,ensure_ascii=False,indent=2)+"\n")
print(json.dumps(report,ensure_ascii=False),flush=True)
