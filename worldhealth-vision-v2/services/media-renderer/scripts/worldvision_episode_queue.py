#!/usr/bin/env python3
"""World-Vision three-episode pipeline: isolated, concurrent PRE-PRODUCTION.

This is a scheduler for editorial preparation, not a fake multi-film renderer.
It safely splits independent episodes into manifests so future GitHub Actions
jobs can run in parallel. Footage rights and user's voice approval remain
mandatory before full Remotion exports or publication.
"""
from __future__ import annotations
import argparse
import hashlib
import json
import re
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path

NAME = re.compile(r"^WV\d{3}-[a-z0-9-]{4,60}$")


def digest(payload):
    return hashlib.sha256(json.dumps(payload, sort_keys=True).encode()).hexdigest()


def validate(queue):
    if queue.get("status") != "EDITORIAL_DISCOVERY_ONLY":
        raise ValueError("Only review-stage discovery queues can be prepared.")
    cfg = queue.get("user_locked", {})
    assert cfg["voice"] == "fr-FR-VivienneMultilingualNeural"
    assert cfg["other_voice_models_allowed"] is False
    assert cfg["outro_background"] == "graphite (acier clair)"
    assert cfg["original_published_film_immutable"] is True
    episodes = queue.get("candidates")
    if not isinstance(episodes, list) or len(episodes) != 3:
        raise ValueError("Exactly three independent candidate episodes required.")
    ids = [s.get("id") for s in episodes]
    if len(set(ids)) != len(ids) or any(not NAME.fullmatch(x or "") for x in ids):
        raise ValueError("Episode slugs must be unique, stable and filesystem safe.")
    for ep in episodes:
        if not ep["sources"] or not all(s.startswith("https://") for s in ep["sources"]):
            raise ValueError("An episode without verifiable sources cannot progress.")
        if not ep["facts"] or not ep["editorial_hook"]:
            raise ValueError("Episode lacks verified factual/script basis.")
        if ep.get("ready_to_publish") is not False:
            raise ValueError("Preproduction must never falsely clear release.")
        if ep["rights_gate"] != "BLOCKED":
            raise ValueError("Footage rights gate must remain blocked until genuine licenses exist.")
        if any(a.get("used_in_render", False) for a in ep.get("asset_leads", [])):
            raise ValueError("Never claim unlicensed footage has been used.")
    return episodes


def prepare(episode, root, common):
    target = root / episode["id"]
    target.mkdir(parents=True, exist_ok=True)
    required = [
        "user_voice_acceptance",
        "license_and_attribution_for_each_footage",
        "publication_day_factcheck",
        "editorial_storyboard_signoff",
        "mobile_full_video_listening",
        "captions_no_title_collision",
    ]
    output = {
        "id": episode["id"],
        "stage": "SOURCE_AND_STORYBOARD_PREPARATION",
        "priority_rank": episode["rank"],
        "title": episode["working_title"],
        "editorial_hook": episode["editorial_hook"],
        "sourced_facts": episode["facts"],
        "sources": episode["sources"],
        "asset_leads": episode.get("asset_leads", []),
        "motion": episode.get("motion_plan", []),
        "source_queue_digest": digest(episode),
        "voice": common["voice"],
        "voice_selected_by_user": True,
        "approved_voice_take": None,
        "outro_background": common["outro_background"],
        "signature_review_link": common["outro_reference"],
        "video_render_permitted": False,
        "TikTok_publication_permitted": False,
        "required_signoffs": required,
        "isolation": "ONE_EPISODE_ONE_OUTPUT_FOLDER",
        "next_action": "Secure footage permissions and validate A/B/C/D Vivienne V3 auditions."
    }
    path = target / "preproduction.json"
    path.write_text(json.dumps(output, ensure_ascii=False, indent=2)+"\n", encoding="utf8")
    return {"id": episode["id"], "stage": output["stage"], "path": str(path),
            "render_permitted": False}


def main():
    p = argparse.ArgumentParser()
    p.add_argument("--queue", type=Path, required=True)
    p.add_argument("--output", type=Path, required=True)
    p.add_argument("--workers", type=int, default=3)
    args = p.parse_args()
    if not 1 <= args.workers <= 3:
        raise ValueError("Parallel preparation workers must be in [1,3].")
    queue = json.loads(args.queue.read_text(encoding="utf8"))
    episodes = validate(queue)
    args.output.mkdir(parents=True, exist_ok=True)
    with ThreadPoolExecutor(max_workers=args.workers) as pool:
        futures = [pool.submit(prepare, e, args.output, queue["user_locked"]) for e in episodes]
        results = [f.result() for f in futures]
    overall = {
        "status": "THREE_EPISODES_PREPRODUCTION_ONLY",
        "episodes": results,
        "workers_used": args.workers,
        "production_released": False,
        "heavy_full_renders_started": 0,
        "rights_clearance_completed": False,
    }
    (args.output / "queue-summary.json").write_text(
        json.dumps(overall, ensure_ascii=False, indent=2)+"\n", encoding="utf8")
    print(json.dumps(overall, ensure_ascii=False))


if __name__ == "__main__":
    main()
