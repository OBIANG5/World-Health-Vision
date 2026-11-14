#!/usr/bin/env python3
"""Analyze a DRY voice recording before music: detect padding and unwanted dead air.

This is an objective QC report, NOT a substitute for listening to the voice.
Analyzing music-mixed audio would hide narration gaps, so this tool demands
the voice-only WAV, not a completed video.
"""
import argparse,json,re,subprocess,sys
from pathlib import Path

def main():
 ap=argparse.ArgumentParser()
 ap.add_argument("dry_voice_wav",type=Path)
 ap.add_argument("--limit",type=float,default=.65)
 ap.add_argument("--end-of-narration",type=float,default=39.10)
 ap.add_argument("--report",type=Path,required=True)
 args=ap.parse_args()
 p=args.dry_voice_wav
 if not p.is_file() or p.suffix.lower()!=".wav":
  raise RuntimeError("Submit real, dry voice WAV, no MP3/mp4/mixed background.")
 info=json.loads(subprocess.check_output(["ffprobe","-v","error","-show_format","-show_streams","-of","json",str(p)]))
 if not any(z["codec_type"]=="audio" for z in info["streams"]):
  raise RuntimeError("No audio stream")
 command=["ffmpeg","-hide_banner","-v","info","-i",str(p),
          "-af","silencedetect=noise=-35dB:d=0.32","-f","null","-"]
 proc=subprocess.run(command,stdout=subprocess.PIPE,stderr=subprocess.PIPE,text=True)
 if proc.returncode!=0:raise RuntimeError(proc.stderr[-1500:])
 starts=[float(v) for v in re.findall(r"silence_start:\s*([0-9.]+)",proc.stderr)]
 ends=[float(v) for v in re.findall(r"silence_end:\s*([0-9.]+)",proc.stderr)]
 dur=float(info["format"]["duration"])
 spans=[]
 for i,a in enumerate(starts):
  b=ends[i] if i<len(ends) else dur
  spans.append({"start":round(a,3),"end":round(b,3),"seconds":round(b-a,3)})
 interior=[s for s in spans if s["start"]>.5 and s["end"]<args.end_of_narration and s["seconds"]>args.limit]
 # Need a natural pause before silent closing logo. Last spoken content must
 # be extracted from the dry track by ear; this heuristic only catches gross gaps.
 status="PASS_OBJECTIVE_ONLY" if not interior else "FAIL_LONG_ARTIFICIAL_PAUSES"
 report={"status":status,"wav":p.name,"duration":dur,
         "threshold_dB":-35,"threshold_seconds":args.limit,
         "reference_timeline_final_logo_start":args.end_of_narration,
         "silences":spans,"unacceptable_interior_gaps":interior,
         "requires_human_listening":True,
         "do_not_publish_from_automated_audio_qc":True}
 args.report.parent.mkdir(parents=True,exist_ok=True)
 args.report.write_text(json.dumps(report,ensure_ascii=False,indent=2)+"\n")
 print(json.dumps(report,ensure_ascii=False))
 if interior:raise SystemExit(2)
if __name__=="__main__":
 main()
