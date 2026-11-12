import asyncio
from datetime import datetime, timezone

from media_service.creative import build_video_draft
from media_service.models import (
    PrepareDraftRequest,
    RenderJobRef,
    RunQaRequest,
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
    )
    story.qa.audio = "pass"
    story.status = "qa"
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
