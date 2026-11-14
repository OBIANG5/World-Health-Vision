#!/usr/bin/env python3
"""Synthetic TEST ONLY; no colors or test fixtures go into a real news report."""
import hashlib,json,subprocess,tempfile,unittest
from pathlib import Path
from assemble import preflight,assemble,Blocked

def run(*a):
    p=subprocess.run(a,capture_output=True,text=True)
    if p.returncode:raise RuntimeError(p.stderr[-1000:])
def sha(p):return hashlib.sha256(p.read_bytes()).hexdigest()

class FastlaneTest(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.tmp=tempfile.TemporaryDirectory();cls.work=Path(cls.tmp.name)
        cls.assets=cls.work/"assets";cls.assets.mkdir()
        scenes=[]
        for name,dur,color,role in [
           ("geography",1.5,"blue","globe"),
           ("test-only-documentary",3.5,"green","documentary"),
           ("signature",3.0,"gray","outro")]:
            video=cls.assets/(name+".mp4")
            run("ffmpeg","-nostdin","-y","-v","error","-f","lavfi","-i",
                f"color=c={color}:s=1080x1920:r=30:d={dur}",
                "-c:v","libx264","-preset","ultrafast","-crf","32",
                "-pix_fmt","yuv420p","-video_track_timescale","15360","-an",str(video))
            scenes.append(dict(
                path=video.name,sha256=sha(video),role=role,
                duration_seconds=dur,approved_by_user=True,
                visual_matches_spoken_fact=True,rights_status="owned",
                provenance_url="https://example.org/synthetic-ci-test",
                is_synthetic_event_footage=False))
        audio=cls.assets/"synthetic-tone.wav"
        run("ffmpeg","-nostdin","-y","-v","error","-f","lavfi","-i",
            "sine=frequency=480:sample_rate=48000:duration=5.0",
            "-af","volume=-10dB","-ac","1",str(audio))
        script="Démonstration strictement technique : aucun de ces plans ne représente une véritable actualité."
        cls.episode={
          "schema_version":1,"stage":"EDITORIALLY_LOCKED",
          "episode_id":"WV999-synthetic-test","locked_script":script,
          "script_sha256":hashlib.sha256(script.encode()).hexdigest(),
          "script_approved_by_user":True,
          "factcheck_sources":["https://example.org/ci-fixture-a","https://example.org/ci-fixture-b"],
          "narration":{"path":audio.name,"sha256":sha(audio),
            "speaker":"fr-FR-VivienneMultilingualNeural",
            "style_reference":"worldvision-vivienne-c52-impact-media",
            "same_story":True,"one_continuous_take":True,
            "approved_by_user":True,"commercial_rights_verified":False},
          "scenes":scenes,"final_mobile_review_approved":False
        }
    @classmethod
    def tearDownClass(cls):cls.tmp.cleanup()
    def test_real_8second_preview(self):
        m=self.work/"episode.json";m.write_text(json.dumps(self.episode))
        result=assemble(m,self.assets,self.work/"out")
        self.assertAlmostEqual(result["duration_seconds"],8.0,delta=.12)
        self.assertEqual(result["nombre_de_plans_verifies"],3)
        self.assertTrue(result["objectif_300_secondes_atteint"])
        self.assertFalse(result["nouvelle_synthese_voix"])
        self.assertFalse(result["video_reencode"])
    def test_script_must_be_immutable(self):
        d=json.loads(json.dumps(self.episode));d["locked_script"]+="!!"
        with self.assertRaisesRegex(Blocked,"réécrit"):preflight(d,self.assets,"preview")
    def test_never_replace_vivienne_speaker(self):
        d=json.loads(json.dumps(self.episode));d["narration"]["speaker"]="fr-FR-HenriNeural"
        with self.assertRaisesRegex(Blocked,"Vivienne"):preflight(d,self.assets,"preview")
    def test_no_unlicensed_footage(self):
        d=json.loads(json.dumps(self.episode));d["scenes"][1]["rights_status"]="unknown"
        with self.assertRaisesRegex(Blocked,"droits"):preflight(d,self.assets,"preview")
    def test_no_unrelated_photo(self):
        d=json.loads(json.dumps(self.episode));d["scenes"][1]["visual_matches_spoken_fact"]=False
        with self.assertRaisesRegex(Blocked,"sans rapport"):preflight(d,self.assets,"preview")
    def test_no_false_rights_for_publish(self):
        with self.assertRaisesRegex(Blocked,"licence commerciale"):preflight(self.episode,self.assets,"publish")
    def test_no_synthetic_false_events(self):
        d=json.loads(json.dumps(self.episode));d["scenes"][1]["is_synthetic_event_footage"]=True
        with self.assertRaisesRegex(Blocked,"Fausse photographie"):preflight(d,self.assets,"preview")
    def test_wrong_timing_never_speeds_up_narration(self):
        d=json.loads(json.dumps(self.episode));d["scenes"][1]["duration_seconds"]=3.0
        with self.assertRaisesRegex(Blocked,"non synchronisé"):preflight(d,self.assets,"preview")

if __name__=="__main__":unittest.main(verbosity=2)
