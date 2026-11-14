#!/usr/bin/env python3
"""GitHub CI tests for user-locked C5.2 voice and authentic approved brand."""
import copy
import json
import sys
import tempfile
import unittest
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
sys.path.insert(0,str(ROOT/"quality"))
import approved_vivienne_reference as lock
PROFILE=ROOT/"nextgen/approved_voice_profile.json"

class VoiceLockTests(unittest.TestCase):
    def setUp(self):
        self.profile=json.loads(PROFILE.read_text(encoding="utf8"))
    def check(self,p):
        with tempfile.TemporaryDirectory() as d:
            f=Path(d)/"p.json"
            f.write_text(json.dumps(p,ensure_ascii=False),encoding="utf8")
            return lock.verify(f,require_binary=False)
    def test_approved_C52_metadata(self):
        r=self.check(self.profile)
        self.assertEqual(r["status"],"REFERENCE_AUTHENTICATED_NOT_PUBLISHING_CLEARED")
        self.assertFalse(r["publisher_release_permitted"])
        self.assertFalse(r["rights_verified"])
        self.assertFalse(r["artistic_quality_certified"])
        self.assertEqual(r["voice"],"fr-FR-VivienneMultilingualNeural")
        self.assertEqual(r["version"],"c5_broadcast")
    def test_wrong_voice_blocked(self):
        p=copy.deepcopy(self.profile)
        p["selected_reference"]["voice_id"]="fr-FR-DeniseNeural"
        self.assertEqual(self.check(p)["status"],"BLOCKED")
    def test_wrong_master_blob_blocked(self):
        p=copy.deepcopy(self.profile)
        p["provenance"]["review_git_blob_sha"]="0"*40
        self.assertEqual(self.check(p)["status"],"BLOCKED")
    def test_wrong_signature_blocked(self):
        p=copy.deepcopy(self.profile)
        p["branding"]["outro_approved_variant"]="worldvision-original-g0-midnight.mp4"
        self.assertEqual(self.check(p)["status"],"BLOCKED")
    def test_falsely_approving_future_rate_blocked(self):
        p=copy.deepcopy(self.profile)
        p["policy"]["future_story_rate_status"]="APPROVED"
        self.assertEqual(self.check(p)["status"],"BLOCKED")
    def test_unlicensed_publishing_is_forbidden(self):
        p=copy.deepcopy(self.profile)
        p["policy"]["commercial_voice_rights_verified"]=True
        self.assertEqual(self.check(p)["status"],"BLOCKED")
        p=copy.deepcopy(self.profile)
        p["policy"]["allow_automatic_tiktok_publication"]=True
        self.assertEqual(self.check(p)["status"],"BLOCKED")
    def test_exact_mp3s_after_import(self):
        root=ROOT/"public/voice"
        master=root/"vivienne-c52-impact-media-reference.mp3"
        raw=root/"vivienne-c52-impact-media-raw.mp3"
        if not master.exists() or not raw.exists():
            self.skipTest("Binary reference import runs in a later CI job")
        r=lock.verify(PROFILE,require_binary=True)
        self.assertEqual(r["status"],"REFERENCE_AUTHENTICATED_NOT_PUBLISHING_CLEARED",r["errors"])
if __name__=="__main__":
    unittest.main()
