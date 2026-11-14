#!/usr/bin/env python3
"""Regression tests: World-Vision content QA must reject old visual mistakes."""
import copy,json,sys,unittest
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
sys.path.insert(0,str(ROOT/"quality"))
import worldvision_episode_acceptance as q

class EpisodeAcceptanceTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.episode=json.loads((ROOT/"nextgen/new_orleans_episode_review.json").read_text(encoding="utf-8"))
        cls.profile=json.loads((ROOT/"nextgen/approved_voice_profile.json").read_text(encoding="utf-8"))
    def result(self,overrides=None):
        obj=copy.deepcopy(self.episode)
        if overrides:
            overrides(obj)
        return q.check(obj,self.profile)
    def test_actual_plan_is_not_falsely_cleared(self):
        v=self.result()
        self.assertEqual(v["status"],"BLOCKED")
        self.assertEqual(v["structural_errors"],[])
        self.assertEqual(v["number_of_shots"],6)
        self.assertGreater(len(v["real_world_release_blockers"]),5)
        self.assertFalse(v["aesthetic_quality_certified"])
        self.assertFalse(v["publishing_authorized"])
    def test_no_random_voice(self):
        def mutate(e):e["editorial"]["voice_model"]="fr-FR-DeniseNeural"
        self.assertIn("Unauthorized narrator substituted.",self.result(mutate)["structural_errors"])
    def test_no_invented_logo(self):
        def mutate(e):e["render"]["brand_outro"]="new-worldvision-ai-logo.mp4"
        self.assertIn("Approved steel-light original G0 outro was replaced.",self.result(mutate)["structural_errors"])
    def test_no_unrelated_photo_without_provenance(self):
        def mutate(e):
            e["shots"][0]["source_url"]=None
            e["shots"][0]["visual_subject_required"]=""
        self.assertTrue(any("real-event visual subject" in s for s in self.result(mutate)["structural_errors"]))
    def test_no_titles_over_subtitles(self):
        def mutate(e):e["shots"][0]["caption_box"]=dict(e["shots"][0]["title_box"])
        self.assertTrue(any("subtitle/title pixel overlap" in s for s in self.result(mutate)["structural_errors"]))
    def test_no_operational_map_label(self):
        def mutate(e):e["shots"][0]["screen_title"]="LE MONDE LOCALISATION"
        self.assertTrue(any("operational label" in s for s in self.result(mutate)["structural_errors"]))
    def test_no_fake_license_to_use_protected_news_video(self):
        self.assertTrue(any("license not cleared" in s for s in self.result()["real_world_release_blockers"]))
    def test_no_fake_reuse_of_old_news_voice(self):
        def mutate(e):e["editorial"]["no_reuse_of_C52_audio_on_new_news"]=False
        self.assertTrue(any("Reusing old story MP3" in s for s in self.result(mutate)["structural_errors"]))
    def test_no_hollow_motion(self):
        def mutate(e):e["shots"][2]["motion_intent"]="Zoom."
        self.assertTrue(any("animation must communicate" in s for s in self.result(mutate)["structural_errors"]))
    def test_explicit_silent_outro_at_end(self):
        def mutate(e):e["shots"][-1]["spoken_excerpt"]="Voir le monde, le comprendre."
        self.assertIn("Outro must never be voiced",self.result(mutate)["structural_errors"])
if __name__=="__main__":unittest.main()
