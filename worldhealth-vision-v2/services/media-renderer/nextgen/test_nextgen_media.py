#!/usr/bin/env python3
"""Fast, offline, stable regression suite; no paid TTS or full Remotion render."""
import copy
import json
import shutil
import subprocess
import sys
import tempfile
import unittest
from pathlib import Path

BASE = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(BASE / "scripts"))
sys.path.insert(0, str(BASE / "quality"))
import worldvision_voice_lab as voice
import worldvision_nextgen_gate as visual


class NextGenMediaGates(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.voice_example = json.loads(
            (BASE / "nextgen/audition_demo.json").read_text(encoding="utf8"))
        cls.visual_example = json.loads(
            (BASE / "nextgen/storyboard_demo.json").read_text(encoding="utf8"))

    def test_valid_editorial_voice_brief(self):
        self.assertEqual(len(voice.validate_brief(self.voice_example)), 3)
        self.assertEqual(voice.VOICE, "fr-FR-VivienneMultilingualNeural")

    def test_disallow_voice_change_and_fake_approval(self):
        x = copy.deepcopy(self.voice_example)
        x["voice"] = "fr-FR-HenriNeural"
        with self.assertRaises(ValueError):
            voice.validate_brief(x)
        x = copy.deepcopy(self.voice_example)
        x["publication_authorized"] = True
        with self.assertRaises(ValueError):
            voice.validate_brief(x)

    def test_no_outro_slogan_spoken(self):
        x = copy.deepcopy(self.voice_example)
        x["segments"][1]["text"] += " Voir le monde, le comprendre."
        with self.assertRaises(ValueError):
            voice.validate_brief(x)

    def test_speed_and_pacing_safeguards(self):
        x = copy.deepcopy(self.voice_example)
        x["segments"][0]["rate_delta_percent"] = 32
        with self.assertRaises(ValueError):
            voice.validate_brief(x)
        x = copy.deepcopy(self.voice_example)
        x["segments"][0]["pause_after_ms"] = 2800
        with self.assertRaises(ValueError):
            voice.validate_brief(x)

    def test_good_layout_still_requires_human_signoff(self):
        result = visual.check(self.visual_example)
        self.assertEqual(result["status"], "PASS_WITH_HUMAN_REVIEW")
        self.assertFalse(result["publishing_authorized"])
        self.assertFalse(result["automated_visual_beauty_certified"])

    def test_collision_is_blocking(self):
        x = copy.deepcopy(self.visual_example)
        x["chapters"][0]["caption_boxes"][0]["y"] = 800
        result = visual.check(x)
        self.assertIn("subtitles cover existing titles",
                      " ".join(result["errors"]))

    def test_banned_map_label_and_pale_logo(self):
        x = copy.deepcopy(self.visual_example)
        x["chapters"][1]["headline"] = "LE MONDE • LOCALISATION"
        self.assertEqual(visual.check(x)["status"], "BLOCKED")
        with tempfile.TemporaryDirectory() as d:
            try:
                from PIL import Image
            except ImportError:
                self.skipTest("Pillow not installed")
            path = Path(d) / "opaque.png"
            Image.new("RGBA", (280, 280), (242, 238, 231, 255)).save(path)
            result = visual.check(self.visual_example, logo_path=path)
            self.assertTrue(result["logo_diagnostics"]["opaque_tile_suspected"])
            self.assertEqual(result["status"], "BLOCKED")

    def test_documentary_images_need_subject_date_source_and_rights(self):
        x = copy.deepcopy(self.visual_example)
        x["chapters"][0]["visual_kind"] = "documentary_photo"
        r = visual.check(x)
        self.assertEqual(r["status"], "BLOCKED")
        self.assertIn("photo/video source", " ".join(r["errors"]))

    @unittest.skipUnless(shutil.which("ffmpeg") and shutil.which("ffprobe"),
                         "FFmpeg needed for measured-audio smoke test")
    def test_real_audio_metric_extraction(self):
        with tempfile.TemporaryDirectory() as d:
            wav = Path(d) / "tone.wav"
            subprocess.run(
                ["ffmpeg", "-y", "-v", "error", "-f", "lavfi",
                 "-i", "sine=frequency=420:duration=1.5",
                 "-ar", "48000", str(wav)], check=True)
            r = voice.measure_audio(wav)
            self.assertAlmostEqual(r["seconds_total"], 1.5, places=1)
            self.assertIsNotNone(r["integrated_lufs"])
            self.assertIsNotNone(r["loudness_range_lu"])
            self.assertTrue(r["human_listening_required"])
            self.assertFalse(r["publishing_authorized"])


if __name__ == "__main__":
    unittest.main()
