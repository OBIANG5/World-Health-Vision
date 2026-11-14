#!/usr/bin/env python3
import copy,json,sys,unittest
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
sys.path.insert(0,str(ROOT/"scripts"))
import worldvision_vivienne_c5_linked as v5
class V5Tests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.brief=json.loads((ROOT/"nextgen/vivienne_c5_linked_brief.json").read_text())
    def test_only_exact_C_voice_rate_and_linked_target_words(self):
        self.assertEqual(v5.VOICE,"fr-FR-VivienneMultilingualNeural")
        self.assertEqual(len(v5.validate(self.brief)),2)
        for v in self.brief["variants"]:
            self.assertEqual(v["rate"],"+8%")
            self.assertEqual(v["pitch"],"+0Hz")
    def test_no_voice_swap(self):
        x=copy.deepcopy(self.brief);x["voice"]="fr-FR-DeniseNeural"
        with self.assertRaises(ValueError):v5.validate(x)
    def test_no_target_word_final_punctuation(self):
        x=copy.deepcopy(self.brief)
        x["variants"][0]["script"]=x["variants"][0]["script"].replace(
            "Mississippi où","Mississippi. Où")
        with self.assertRaises(ValueError):v5.validate(x)
    def test_no_publication(self):
        x=copy.deepcopy(self.brief);x["publication_authorized"]=True
        with self.assertRaises(ValueError):v5.validate(x)
    def test_only_full_utterance_synthesis(self):
        s=(ROOT/"scripts/worldvision_vivienne_c5_linked.py").read_text()
        for k in ["tighten_gap_wav","atrim","silenceremove","anullsrc"]:
            self.assertNotIn(k,s)
if __name__=="__main__":unittest.main()
