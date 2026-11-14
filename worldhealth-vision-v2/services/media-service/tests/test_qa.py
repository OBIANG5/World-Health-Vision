import asyncio
from datetime import datetime, timezone

from media_service.creative import build_video_draft
from media_service.models import (
    PrepareDraftRequest,
    RenderJobRef,
    RenderProbe,
    RunQaRequest,
    VoiceoverRef,
)
from media_service.qa import (
    evaluate_structural_qa,
    run_publication_qa,
)
from media_service.store import build_seed_story


class CleanLanguageQa:
    model_name = "test-language-qa"

    async def check(self, story):
        return []


def qa_ready_seed_story():
    story = build_seed_story()
    story.selected_hook_id = story.hooks[0].id
    story.video_draft = build_video_draft(story, PrepareDraftRequest())
    story.render_job = RenderJobRef(
        id="render-qa-test",
        story_id=story.id,
        status="completed",
        progress=1,
        created_at=datetime.now(timezone.utc),
        updated_at=datetime.now(timezone.utc),
        output_url="/api/media-renderer/renders/render-qa-test.mp4",
        output_sha256="a" * 64,
        output_probe=RenderProbe(
            format_name="mov,mp4,m4a,3gp,3g2,mj2",
            size_bytes=1_100_000,
            duration_sec=story.video_draft.duration_sec,
            video_codec="h264",
            width=story.video_draft.width,
            height=story.video_draft.height,
            fps=float(story.video_draft.fps),
            pixel_format="yuv420p",
            video_bit_rate=850_000,
            has_audio=False,
        ),
    )
    story.qa.audio = "pass"
    story.status = "qa"
    return story


def attach_test_voiceover(story):
    story.voiceover = VoiceoverRef(
        id="voice-qa-test",
        model="test-audio",
        voice="marin",
        duration_sec=min(10.0, story.video_draft.duration_sec),
        generated_at=datetime.now(timezone.utc),
        renderer_url="/api/media-renderer/audio/voice-qa-test.wav",
        transcript=story.video_draft.voiceover_script,
        transcript_match_score=100,
        duration_fit=True,
        qa_passed=True,
    )
    story.render_job.output_probe = story.render_job.output_probe.model_copy(
        update={
            "has_audio": True,
            "audio_codec": "aac",
            "audio_sample_rate_hz": 48_000,
            "audio_channels": 2,
            "integrated_lufs": -16.0,
            "true_peak_dbfs": -1.5,
            "loudness_range_lu": 5.0,
        }
    )
    story.qa.audio = "pass"
    return story


def test_structural_qa_passes_fixed_design_source_card_and_safe_zones():
    story = qa_ready_seed_story()

    state, issues = evaluate_structural_qa(story)

    assert state.facts == "pass"
    assert state.rights == "pass"
    assert state.audio == "pass"
    assert state.safe_zones == "pass"
    assert state.logo_integrity == "pass"
    assert state.source_display == "pass"
    assert state.render_integrity == "pass"
    assert not [
        issue
        for issue in issues
        if issue.check in {
            "facts",
            "rights",
            "audio",
            "safe_zones",
            "logo_integrity",
            "source_display",
            "render_integrity",
        }
    ]


def test_structural_qa_rejects_text_that_exceeds_safe_copy_limit():
    story = qa_ready_seed_story()
    story.video_draft.scenes[0].on_screen_text = "mot " * 80

    state, issues = evaluate_structural_qa(story)

    assert state.safe_zones == "fail"
    assert any(issue.check == "safe_zones" for issue in issues)


def test_publication_qa_marks_all_checks_pass_when_language_is_clean():
    story = qa_ready_seed_story()

    state, report = asyncio.run(
        run_publication_qa(
            story,
            RunQaRequest(check_spelling=True),
            language_client=CleanLanguageQa(),
        )
    )

    assert state.spelling == "pass"
    assert report.all_passed is True
    assert report.language_model == "test-language-qa"
    assert report.issues == []



def test_structural_qa_rejects_bad_encoded_render_geometry():
    story = qa_ready_seed_story()
    story.render_job.output_probe = story.render_job.output_probe.model_copy(
        update={
            "width": 720,
            "height": 1280,
            "fps": 29.0,
        }
    )

    state, issues = evaluate_structural_qa(story)

    assert state.render_integrity == "fail"
    assert any(
        issue.check == "render_integrity"
        and "width" in issue.message
        and "height" in issue.message
        and "fps" in issue.message
        for issue in issues
    )



def test_structural_qa_rejects_out_of_range_final_loudness():
    story = attach_test_voiceover(qa_ready_seed_story())
    story.render_job.output_probe = story.render_job.output_probe.model_copy(
        update={
            "integrated_lufs": -20.5,
            "true_peak_dbfs": -0.4,
            "loudness_range_lu": 15.0,
        }
    )

    state, issues = evaluate_structural_qa(story)

    assert state.audio == "fail"
    assert any(
        issue.check == "audio"
        and "loudness" in issue.message.lower()
        for issue in issues
    )


def test_structural_qa_accepts_normalized_final_loudness():
    story = attach_test_voiceover(qa_ready_seed_story())

    state, issues = evaluate_structural_qa(story)

    assert state.audio == "pass"
    assert not [
        issue
        for issue in issues
        if issue.check == "audio"
    ]



def test_structural_qa_rejects_wrong_final_audio_delivery_format():
    story = attach_test_voiceover(qa_ready_seed_story())
    story.render_job.output_probe = story.render_job.output_probe.model_copy(
        update={
            "audio_codec": "mp3",
            "audio_sample_rate_hz": 44_100,
        }
    )

    state, issues = evaluate_structural_qa(story)

    assert state.audio == "fail"
    assert any(
        issue.check == "audio"
        and "aac" in issue.message.lower()
        and "48000" in issue.message
        for issue in issues
    )
