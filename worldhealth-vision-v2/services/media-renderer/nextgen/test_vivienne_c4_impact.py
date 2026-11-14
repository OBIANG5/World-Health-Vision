#!/usr/bin/env python3
import copy
import json
import sys
import unittest
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
sys.path.insert(0,str(ROOT/"scripts"))
import worldvision_vivienne_c4_impact as c4

class VivienneC4Tests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.brief=json.loads((ROOT/"nextgen/vivienne_c4_impact_brief.json").read_text(encoding="utf8"))
    def test_approved_C_only_with_four_rewrites(self):
        b=self.brief
        self.assertEqual(c4.VOICE,"fr-FR-VivienneMultilingualNeural")
        self.assertEqual(b["approved_parent_version"],"c_impact")
        self.assertEqual(len(c4.validate(b)),4)
        self.assertEqual(b["approved_final_signature"],"worldvision-original-g0-graphite.mp4")
    def test_refuse_wrong_voice_or_brand_or_publication(self):
        for k,val in (("source_voice","fr-FR-DeniseNeural"),("approved_final_signature","midnight"),
                      ("publication_authorized",True)):
            b=copy.deepcopy(self.brief)
            b[k]=val
            with self.assertRaises(AssertionError):
                c4.validate(b)
    def test_mississippi_and_hospital_lexical_targets(self):
        words=[{"text":"Mississippi,","start_s":1.0,"duration_s":.30},
               {"text":"et","start_s":1.36,"duration_s":.09},
               {"text":"l'hôpital,","start_s":2.0,"duration_s":.40},
               {"text":"mais","start_s":2.43,"duration_s":.15}]
        output=c4.target_diagnostics(words)
        self.assertEqual(len(output),2)
        self.assertEqual(output[0]["next_word"],"et")
        self.assertEqual(output[1]["next_word"],"mais")
        self.assertAlmostEqual(output[1]["word_boundary_gap_after_sec"],.03)
        self.assertFalse(output[0]["target_phoneme_naturalness_verified"])
    def test_scripts_do_not_end_on_problematic_word(self):
        for item in c4.validate(self.brief):
            s=item["script"]
            self.assertNotIn("Mississippi.",s)
            self.assertNotIn("hôpital.",s)
            self.assertNotIn("hospitalisées.",s)
    def test_no_surgery_or_voice_override(self):
        src=(ROOT/"scripts/worldvision_vivienne_c4_impact.py").read_text()
        for token in ("tighten_gap_wav(", "silenceremove=", "anullsrc", "atempo=", "concat.txt",
                      "fr-FR-DeniseNeural", "fr-FR-CoralieNeural"):
            self.assertNotIn(token,src)
if __name__=="__main__":
    unittest.main()
