#!/usr/bin/env python3
import json
import sys
import unittest
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
sys.path.insert(0,str(ROOT/"scripts"))
import worldvision_vivienne_only_v3 as v

class VivienneV3Test(unittest.TestCase):
    def setUp(self):
        self.brief=json.loads((ROOT/"nextgen/vivienne_v3_brief.json").read_text())
    def test_only_original_voice_and_four_distinct_takes(self):
        self.assertEqual(v.VOICE,"fr-FR-VivienneMultilingualNeural")
        self.assertEqual(len(v.validate(self.brief)),4)
        self.assertEqual(len(set(x["script"] for x in self.brief["variants"])),4)
    def test_never_substitute_another_speaker(self):
        self.brief["voice"]="fr-FR-DeniseNeural"
        with self.assertRaises(ValueError):v.validate(self.brief)
    def test_never_publish_from_audition(self):
        self.brief["publication_authorized"]=True
        with self.assertRaises(ValueError):v.validate(self.brief)
    def test_no_tts_audio_stitching_or_silence_surgery(self):
        source=(ROOT/"scripts/worldvision_vivienne_only_v3.py").read_text()
        for banned in ["anullsrc","tighten_gap_wav","atrim","atempo","asetpts",
                       "adelay","concat_paths","silence_removal","silenceremove="]:
            self.assertNotIn(banned,source)
        self.assertIn("one_uninterrupted_tts_request",source)
        self.assertIn("audio_spliced",source)
        self.assertIn("silences_cut_automatically",source)
    def test_factual_baseline_and_narration_no_fake_slogan(self):
        for x in v.validate(self.brief):
            self.assertTrue("Trente-deux" in x["script"])
            self.assertNotIn("Voir le monde, le comprendre.",x["script"])
    def test_no_nonzero_pitch(self):
        self.brief["variants"][0]["pitch"]="+5Hz"
        with self.assertRaises(ValueError):v.validate(self.brief)

if __name__=="__main__":
    unittest.main()
