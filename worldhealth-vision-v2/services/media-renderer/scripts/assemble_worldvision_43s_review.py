#!/usr/bin/env python3
"""World-Vision 001: build an honest 43-second editorial REVIEW, not a final master.

Only S02 original D00-v6 0.9s excerpt is unavailable as bytes (Canva).
The temporary 0.9s G0 holding shot is explicitly declared in the JSON report,
never disguised as original footage. Replaces nothing in true master renderer.
"""
import hashlib,json,subprocess,sys
from pathlib import Path

HERE=Path(__file__).resolve().parent
RENDERER=HERE.parent
SOURCE=RENDERER.parents[1]
ROOT=Path("/tmp/worldvision-43s")
V=ROOT/"videos"
OUT=RENDERER/"output/summit-2026/review-43s"
URL="https://raw.githubusercontent.com/OBIANG5/World-Health-Vision/whv-media-studio-browser-preview/media-lab/summit-2026/"
FILES=[
 ("01-hook.mp4","hook-v2-clean-manrope-4p5s.mp4","985d5f77f6de53a68fa49e6efc84ad2e37dd7c5c3ed48b6f4e6a492058cb37d2",135),
 ("03-globe-city.mp4","s03-to-s03b-shenzhen-matchcut-v2-circleopen-7p1s.mp4","8ab698002dfd82375423e6866b5bf0a7e602af5a7bba3a0ebafdce3b9191ef37",213),
 ("04-newstart.mp4","segment04-new-start-v3-clean-7p9s.mp4","4fa8aebec451f4edb0d8bd495655b619feaab0d9fb0d517c12e4bd9f88b33e69",237),
 ("05-china.mp4","segment05-china-xi-6p2s.mp4","2bcbaf543367633c9277e4fb394347ef3fe3dd16630c97652294ad900b90e331",186),
 ("06-agenda.mp4","segment06-iran-ukraine-7p2s.mp4","0afb3dffb611415a9651efc9bf5a9f85341d765439d592c8904a71dc7732f572",216),
 ("07-uncertainty.mp4","segment07-no-agreement-6p2s.mp4","4035ab539caf53c85ac36ba43320acdd17b08e8a46eb64c54641c358e050c9b9",186),
 ("08-outro.mp4","segment08-worldvision-outro-3p0s.mp4","646957b11e52b8cb9cf6342762ffed79f272fbc31d965488a8644f25ba22cf58",90),
]
AUDIO_SHA="97eb96df880aaf8443f3e484951d1f0ce9e024e544e153f77bf1d3f20a0dd739"
FONT_SHA="3ae11c49db0455a3cc33e37d380f20fdb8c7f8b41dc07625c177e3d87a9d6ae6"
D00_SHA="95c47d1a94a1d0487e5b8f2d4c622bedcf6bad980938947ac003be34a8f8ea2a"

def run(*cmd):
    print("RUN", " ".join(map(str,cmd[:5]))+"…",flush=True)
    subprocess.run([str(i) for i in cmd],check=True)
def capture(*cmd):
    return subprocess.check_output([str(i) for i in cmd]).decode("utf8")
def sha(p):
    return hashlib.sha256(Path(p).read_bytes()).hexdigest()
def grab(src,dst,digest=None):
    dst.parent.mkdir(parents=True,exist_ok=True)
    run("curl","-fL","--retry","5","--retry-all-errors","--max-time","160",src,"-o",dst)
    if digest and sha(dst)!=digest:
        raise RuntimeError(f"Source digest differs for {dst.name}: actual {sha(dst)}")
    print("SHA OK",dst.name,sha(dst),flush=True)
def inspect(p,frames,need_audio=False):
    data=json.loads(capture("ffprobe","-v","error","-show_streams","-show_format","-of","json",p))
    vids=[s for s in data["streams"] if s["codec_type"]=="video"]
    aud=[s for s in data["streams"] if s["codec_type"]=="audio"]
    assert len(vids)==1 and vids[0]["codec_name"]=="h264"
    assert (vids[0]["width"],vids[0]["height"])==(1080,1920)
    assert int(vids[0]["nb_frames"])==frames
    assert len(aud)==int(need_audio)
    assert abs(float(data["format"]["duration"])-frames/30)<.07
    return data

def main():
    for d in (V,OUT,ROOT/"fonts"):d.mkdir(parents=True,exist_ok=True)
    g0=RENDERER/"public/brand/world-vision-official.png"
    assert capture("git","hash-object",g0).strip()=="bc80fa70cebd566768bfb1703a0f1f636a78c196"
    font=ROOT/"fonts/Manrope.ttf"
    grab("https://raw.githubusercontent.com/google/fonts/29b4ec6df2522a8aee279414b78a07910b065874/ofl/manrope/Manrope%5Bwght%5D.ttf",font,FONT_SHA)
    for local,remote,digest,n in FILES:
        p=V/local
        grab(URL+remote,p,digest)
        inspect(p,n)
    grab(URL+"voice/worldvision-voice-fr-43s-candidate.wav",ROOT/"voice.wav",AUDIO_SHA)
    grab(URL+"voice/worldvision-voice-fr-43s-candidate.json",ROOT/"voice.json")
    voice=json.loads((ROOT/"voice.json").read_text())
    assert voice["sha256"]==AUDIO_SHA and voice["duration_sec"]==43.0
    assert len(voice["word_boundaries"])==92 and voice["approved_script_unchanged"]
    assert not voice["approved_by_user"]
    # Transparent handling of the ONLY missing native media asset: 0.9s D00-v6.
    # No fake Earth or synthetic reconstruction. Hold the original World-Vision G0
    # on dark navy for 27 frames, as an explicitly nonpublishable review proxy.
    hold=V/"02-official-g0-hold-9tenths-REVIEW-ONLY.mp4"
    run("ffmpeg","-y","-hide_banner","-loglevel","error","-f","lavfi","-i",
        "color=c=0x031126:s=1080x1920:r=30:d=0.9",
        "-loop","1","-framerate","30","-i",g0,
        "-filter_complex",
        "[1:v]scale=320:-1:flags=lanczos,format=rgba[l];[0:v][l]overlay=(W-w)/2:(H-h)/2:shortest=1,format=yuv420p[v]",
        "-map","[v]","-frames:v","27","-an","-c:v","libx264",
        "-preset","medium","-crf","18","-pix_fmt","yuv420p",
        "-movflags","+faststart",hold)
    inspect(hold,27)
    stem=ROOT/"captions-word-aligned"
    run("python3",HERE/"worldvision_captions_from_voice.py",
        "--voice-json",ROOT/"voice.json",
        "--component",RENDERER/"src/WorldVisionSummit2026.tsx",
        "--output-stem",stem)
    cues=json.loads(stem.with_suffix(".json").read_text())["cues"]
    assert len(cues)==13 and all(c["end"]>c["start"] for c in cues)
    assert all(cues[i]["end"]<cues[i+1]["start"] for i in range(12))
    chapters=[
        ("01-hook.mp4",135),
        (hold.name,27),
        ("03-globe-city.mp4",213),
        ("04-newstart.mp4",237),
        ("05-china.mp4",186),
        ("06-agenda.mp4",216),
        ("07-uncertainty.mp4",186),
        ("08-outro.mp4",90),
    ]
    assert sum(n for _,n in chapters)==1290
    cmd=["ffmpeg","-y","-hide_banner","-loglevel","error"]
    for file,_ in chapters:cmd+=["-i",V/file]
    cmd+=["-i",ROOT/"voice.wav"]
    filter_nodes=[]
    for i,(_,frames) in enumerate(chapters):
        filter_nodes.append(f"[{i}:v]fps=30,trim=end_frame={frames},setpts=PTS-STARTPTS,format=yuv420p[v{i}]")
    joined="".join(f"[v{i}]" for i in range(len(chapters)))
    filter_nodes.append(f"{joined}concat=n=8:v=1:a=0[unsubbed]")
    filter_nodes.append(f"[unsubbed]ass=filename={stem.with_suffix('.ass')}:fontsdir={ROOT/'fonts'},format=yuv420p[video]")
    output=OUT/"worldvision-001-43s-full-edit-review.mp4"
    cmd+=["-filter_complex",";".join(filter_nodes),
          "-map","[video]","-map","8:a:0","-frames:v","1290","-t","43.0",
          "-c:v","libx264","-preset","medium","-crf","18","-pix_fmt","yuv420p",
          "-c:a","aac","-ar","48000","-b:a","192k",
          "-movflags","+faststart",output]
    run(*cmd)
    inspect(output,1290,need_audio=True)
    # Seven verified original source files, one clear temporary S02 brand hold.
    review=OUT/"review-frames"
    review.mkdir(exist_ok=True)
    for at,label in [(1.9,"S01"),(4.8,"S02-hold"),(7.6,"S03"),(11.4,"S03B"),(16.0,"S04"),
                     (23.4,"S05"),(29.9,"S06"),(37.1,"S07"),(41.2,"S08")]:
        run("ffmpeg","-y","-loglevel","error","-ss",at,"-i",output,
            "-frames:v","1","-vf","scale=540:960","-q:v","3",review/(label+".jpg"))
    run("ffmpeg","-y","-loglevel","error",
        "-i",review/"S01.jpg","-i",review/"S04.jpg","-i",review/"S08.jpg",
        "-filter_complex","hstack=inputs=3","-q:v","3",review/"contact-sheet.jpg")
    for extension in (".srt",".ass",".json"):
        (OUT/("captions-word-aligned"+extension)).write_bytes(stem.with_suffix(extension).read_bytes())
    report={
        "id":"WorldVision001",
        "status":"43S_EDIT_COMPLETE_TECHNICAL_REVIEW_NOT_PUBLICATION",
        "review_file":output.name,"sha256":sha(output),"bytes":output.stat().st_size,
        "duration_seconds":43.0,"fps":30,"frames":1290,
        "resolution":[1080,1920],"video_codec":"h264","audio_codec":"aac",
        "voice_sha256":AUDIO_SHA,"voice_kind":voice["voice"],
        "caption_cues":len(cues),"caption_timing":"precise neural WordBoundary metadata",
        "text_verbatim":True,"final_master":False,"publishable":False,
        "artistically_approved":False,"narrator_approved":False,
        "real_s02_original_not_available_as_bytes":True,
        "s02_original_asset_location":"Canva VAHa4ZT_ySo, video original archived, 3.1s",
        "s02_original_clip_required_sha256":D00_SHA,
        "s02_needed_excerpt_start_seconds":0.0,
        "s02_needed_excerpt_duration_seconds":0.9,
        "s02_review_substitute":"Original G0 static hold for 27 frames; NOT the D00-v6 video; blocked from final publication",
        "clips":[{"file":a,"frames":b} for a,b in chapters],
        "must_replace_s02_before_final":True,
        "audio_present":True,"word_boundaries":len(voice["word_boundaries"]),
        "no_fake_news_footage":True,
        "music":"none","note":"Do not publish this proof. Restore exact D00 video and get human art/voice approval."
    }
    (OUT/"worldvision-001-43s-full-edit-review.json").write_text(json.dumps(report,ensure_ascii=False,indent=2)+"\n")
    print("RENDER SUCCESS",json.dumps(report,ensure_ascii=False),flush=True)
if __name__=="__main__":
    main()
