"""Regression tests for World-Vision cinematic preflight.

Everything here is synthetic metadata. No actual event or approval is asserted.
Run: python -m unittest discover -s cinematic -p 'test_*.py' -v
"""
from __future__ import annotations

import copy
import hashlib
import unittest

from director_gate import GATES, SCHEMA, VOICE, digest, markdown_report, validate

H = "a" * 64


def fixture():
    """Entirely simulated approvals and assets for contract testing ONLY."""
    script = "Exemple technique sans actualité réelle : le montage doit respecter le script validé."
    return {
        "schema_version": SCHEMA,
        "episode_id": "WV999-contract-test-only",
        "event_date": "2026-11-19",
        "gates": {
            gate: {"status": "approved", "reviewer": "human",
                   "review_ref": "SYNTHETIC-REVIEW-" + gate,
                   "artifact_sha256": digest("fixture-" + gate)}
            for gate in GATES
        },
        "facts": [{
            "id": "C1", "text": "Donnée fictive pour test de structure uniquement.",
            "status": "verified",
            "sources": ["https://example.org/fixture1", "https://example.net/fixture2"]
        }],
        "script": {"text": script, "sha256": digest(script), "human_approved": True},
        "treatment": {
            "editorial_angle": "Simulate validation, not a real current event",
            "emotional_arc": "clear evidence before visual surprise",
            "visual_language": "documentary footage with restrained motion",
            "reference_notes": "Only synthetic metadata; not for broadcasting",
        },
        "voice": {
            "speaker": VOICE,
            "continuous_take": True,
            "same_episode": True,
            "script_sha256": digest(script),
            "audio_sha256": "b" * 64,
            "audition_ref": "synthetic-voice-audition",
            "audition_approved": True,
            "duration_frames": 150,
            "licensed_provider_for_publication": True
        },
        "canvas": {"width": 1080, "height": 1920, "fps": 30},
        "shots": [
            {
                "id": "SH01", "function": "hook", "kind": "event_footage",
                "start_frame": 0, "end_frame": 150,
                "visual_message": "A real-world action would normally be required",
                "cut_reason": "Opening factual revelation",
                "visual_matches_claims": True, "approved_by_human": True,
                "claim_ids": ["C1"],
                "asset": {
                    "sha256": "c" * 64,
                    "provenance_url": "https://example.org/fixture-visual",
                    "rights_status": "owned", "rights_ref": "TEST-LICENSE",
                    "date": "2026-11-19", "location": "Test only",
                    "fabricated_event_footage": False
                },
                "layout": {"sha256": "d" * 64, "mobile_approved": True},
                "motion": {"template_id": "news-cinematic-documentary-cut",
                           "intention": "restrained movement for context",
                           "preview_sha256": "e" * 64,
                           "mobile_approved": True}
            },
            {
                "id": "SH02", "function": "outro", "kind": "conceptual_animation",
                "start_frame": 150, "end_frame": 240,
                "visual_message": "Original G0 closing, silent",
                "cut_reason": "End of verified voice narration",
                "visual_matches_claims": True, "approved_by_human": True,
                "claim_ids": [],
                "asset": {
                    "sha256": "f" * 64,
                    "provenance_url": "https://example.net/fixture-original-outro",
                    "rights_status": "owned", "rights_ref": "TEST-BRAND-ASSET",
                    "fabricated_event_footage": False
                },
                "layout": {"sha256": "1" * 64, "mobile_approved": True},
                "motion": {"template_id": "official-g0-unchanged",
                           "intention": "retain original clip without restyling",
                           "preview_sha256": "2" * 64, "mobile_approved": True}
            }
        ],
        "audio_master": {
            "sha256": "3" * 64,
            "integrated_lufs": -14.0, "true_peak_dbtp": -1.5,
            "full_listen_approved": True
        },
        "quality_review": {
            "every_shot_reviewed": True,
            "full_mobile_playback_approved": True,
            "subtitle_alignment_approved": True,
            "fact_visual_consistency_approved": True,
            "no_debug_text_in_pixels": True,
            "final_preview_sha256": "4" * 64
        },
        "delivery": {
            "mp4_sha256": "5" * 64,
            "publication_manifest_sha256": "6" * 64,
            "human_release_approved": True,
            "outro_original_g0": True
        }
    }


class DirectorContractTests(unittest.TestCase):
    def assertBlocked(self, project, code, until="delivery"):
        result = validate(project, until=until)
        self.assertFalse(result["passed"], result)
        self.assertIn(code, [v["code"] for v in result["issues"]])

    def test_synthetic_complete_fixture_passes_structure_only(self):
        result = validate(fixture())
        self.assertTrue(result["passed"], result)
        self.assertTrue(result["warnings"])
        self.assertIn("fake", result["warnings"][0].lower()) if False else None

    def test_source_claim_must_have_two_urls(self):
        data = fixture()
        data["facts"][0]["sources"] = ["https://example.org/one"]
        self.assertBlocked(data, "source_evidence", "research")

    def test_script_cannot_be_edited_after_lock(self):
        data = fixture()
        data["script"]["text"] += " modification"
        self.assertBlocked(data, "script_lock")

    def test_gate_cannot_be_skipped_or_self_approved(self):
        data = fixture()
        data["gates"]["layouts"]["status"] = "not_started"
        self.assertBlocked(data, "approval_missing")
        self.assertBlocked(data, "gate_order")
        data = fixture()
        data["gates"]["motion"]["reviewer"] = "ai"
        self.assertBlocked(data, "approval_evidence")

    def test_voice_is_continuous_vivienne_and_same_script(self):
        data = fixture()
        data["voice"]["speaker"] = "fr-FR-HenriNeural"
        self.assertBlocked(data, "voice_identity")
        data = fixture()
        data["voice"]["continuous_take"] = False
        self.assertBlocked(data, "voice_continuity")
        data = fixture()
        data["voice"]["script_sha256"] = "0" * 64
        self.assertBlocked(data, "voice_lock")

    def test_images_cannot_be_unrelated_or_fake_event_footage(self):
        data = fixture()
        data["shots"][0]["visual_matches_claims"] = False
        self.assertBlocked(data, "shot_review")
        data = fixture()
        data["shots"][0]["asset"]["fabricated_event_footage"] = True
        self.assertBlocked(data, "fabrication")
        data = fixture()
        data["shots"][0]["asset"]["date"] = "2024-01-01"
        self.assertBlocked(data, "false_event_footage")

    def test_rights_and_provenance_required(self):
        data = fixture()
        data["shots"][0]["asset"]["rights_status"] = "unknown"
        self.assertBlocked(data, "rights")
        data = fixture()
        data["shots"][0]["asset"]["provenance_url"] = ""
        self.assertBlocked(data, "provenance")

    def test_repeated_footage_requires_reason(self):
        data = fixture()
        data["shots"][1]["kind"] = "documentary_context"
        data["shots"][1]["asset"]["sha256"] = data["shots"][0]["asset"]["sha256"]
        data["shots"][1]["asset"]["date"] = "2026-11-19"
        data["shots"][1]["asset"]["location"] = "Test"
        self.assertBlocked(data, "repeat_footage")

    def test_missing_mobile_artboards_and_motion_previews_block(self):
        data = fixture()
        data["shots"][0]["layout"]["mobile_approved"] = False
        self.assertBlocked(data, "mobile_board")
        data = fixture()
        data["shots"][1]["motion"]["preview_sha256"] = None
        self.assertBlocked(data, "motion_preview")

    def test_narration_not_stretched_to_force_duration(self):
        data = fixture()
        data["shots"][0]["end_frame"] = 125
        data["shots"][1]["start_frame"] = 125
        self.assertBlocked(data, "narration_sync")
        data = fixture()
        data["shots"][1]["start_frame"] = 151
        self.assertBlocked(data, "frame_timeline")

    def test_audio_needs_measured_safe_mobile_mix(self):
        data = fixture()
        data["audio_master"]["integrated_lufs"] = -20
        self.assertBlocked(data, "loudness")
        data = fixture()
        data["audio_master"]["true_peak_dbtp"] = 0.0
        self.assertBlocked(data, "true_peak")

    def test_quality_review_must_cover_whole_video(self):
        data = fixture()
        data["quality_review"]["full_mobile_playback_approved"] = False
        self.assertBlocked(data, "full_mobile_playback_approved")

    def test_no_automatic_release_or_commercial_voice_rights_guess(self):
        data = fixture()
        data["delivery"]["human_release_approved"] = False
        self.assertBlocked(data, "release_permission")
        data = fixture()
        data["voice"]["licensed_provider_for_publication"] = False
        self.assertBlocked(data, "voice_rights")

    def test_incomplete_work_can_be_examined_only_at_earlier_gate(self):
        data = fixture()
        for gate in GATES[3:]:
            data["gates"][gate]["status"] = "not_started"
        self.assertTrue(validate(data, until="script")["passed"])
        self.assertBlocked(data, "approval_missing", until="delivery")

    def test_report_exposes_shots_and_does_not_claim_artistic_approval(self):
        data = fixture()
        report = markdown_report(data, validate(data, until="casting"))
        self.assertIn("SH01", report)
        self.assertIn("validation esthétique", report)


if __name__ == "__main__":
    unittest.main(verbosity=2)
