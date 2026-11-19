#!/usr/bin/env python3
"""World-Vision cinematic production gates.

A fail-closed, stdlib-only preflight for the art-directed, immutable shot plan.
This is NOT a fact checker, rights verifier, voice synthesizer or aesthetic judge.
All approvals are recorded claims requiring independently retained evidence.
"""
from __future__ import annotations

import argparse
import hashlib
import json
import re
from pathlib import Path
from typing import Any

SCHEMA = "worldvision-cinematic-director-v1"
VOICE = "fr-FR-VivienneMultilingualNeural"
FPS = 30
GATES = (
    "research", "script", "treatment", "voice", "casting",
    "layouts", "motion", "edit", "sound", "qa", "delivery",
)
SHA = re.compile(r"^[0-9a-f]{64}$")
SHOT_KINDS = {
    "event_footage", "historical_archive", "documentary_context",
    "primary_document", "verified_data_graphic", "conceptual_animation",
}
FUNCTIONS = {"hook", "evidence", "context", "human_impact", "scale", "consequence", "outro"}
RIGHTS = {"owned", "public_domain", "licensed", "documented_permission"}


def digest(text: str) -> str:
    return hashlib.sha256(text.encode("utf-8")).hexdigest()


def valid_sha(value: Any) -> bool:
    return isinstance(value, str) and bool(SHA.fullmatch(value))


def nonempty(value: Any) -> bool:
    return isinstance(value, str) and bool(value.strip())


def https(value: Any) -> bool:
    return isinstance(value, str) and value.startswith("https://") and len(value) > 12


def validate(project: Any, until: str = "delivery") -> dict[str, Any]:
    """Validate all approved upstream gates and everything required up to 'until'.

    Gate order is mandatory. A gate cannot be approved without an independently
    retained artifact fingerprint, an explicit human reviewer and a review ref.
    The validator does not claim to authenticate those manual assertions.
    """
    if until not in GATES:
        raise ValueError("Unknown gate: " + until)
    issues: list[dict[str, str]] = []
    warnings: list[str] = []

    def err(gate: str, code: str, message: str) -> None:
        issues.append({"gate": gate, "code": code, "message": message})

    if not isinstance(project, dict):
        return {"schema": SCHEMA, "until": until, "passed": False,
                "issues": [{"gate": "research", "code": "project_type",
                            "message": "Project must be a JSON object."}], "warnings": []}
    if project.get("schema_version") != SCHEMA:
        err("research", "schema", f"Expected schema_version={SCHEMA}.")
    if not nonempty(project.get("episode_id")):
        err("research", "episode_id", "Immutable episode identifier required.")

    gates = project.get("gates")
    if not isinstance(gates, dict):
        gates = {}
        err("research", "gates", "Explicit per-stage human review ledger required.")

    required = GATES[:GATES.index(until) + 1]
    for gate in required:
        record = gates.get(gate)
        if not isinstance(record, dict) or record.get("status") != "approved":
            err(gate, "approval_missing", f"Gate {gate} has not been approved.")
            continue
        if record.get("reviewer") != "human" or not nonempty(record.get("review_ref")):
            err(gate, "approval_evidence", "Human review reference missing.")
        if not valid_sha(record.get("artifact_sha256")):
            err(gate, "artifact_hash", "Reviewed artifact needs SHA-256.")

    # No future gate may be approved over a missing predecessor.
    for i, gate in enumerate(GATES):
        record = gates.get(gate)
        if isinstance(record, dict) and record.get("status") == "approved":
            for parent in GATES[:i]:
                if not isinstance(gates.get(parent), dict) or gates[parent].get("status") != "approved":
                    err(gate, "gate_order", f"Cannot approve {gate} before {parent}.")
                    break

    facts = project.get("facts", [])
    if "research" in required:
        if not isinstance(facts, list) or not facts:
            err("research", "claims", "At least one explicit factual claim is required.")
            facts = []
        seen_claims: set[str] = set()
        for claim in facts:
            if not isinstance(claim, dict):
                err("research", "claim_type", "Claim must be an object.")
                continue
            cid = claim.get("id")
            if not nonempty(cid) or cid in seen_claims:
                err("research", "claim_id", "Claim IDs must be unique and nonempty.")
            if nonempty(cid):
                seen_claims.add(cid)
            if not nonempty(claim.get("text")):
                err("research", "claim_text", f"Claim {cid}: exact text required.")
            if claim.get("status") != "verified":
                err("research", "unverified_claim", f"Claim {cid}: not verified.")
            sources = claim.get("sources", [])
            if not isinstance(sources, list) or len(set(s for s in sources if isinstance(s, str))) < 2 or not all(https(s) for s in sources):
                err("research", "source_evidence", f"Claim {cid}: two distinct HTTPS evidence URLs required.")
        if not nonempty(project.get("event_date")):
            err("research", "event_date", "Event date or known reporting date required.")

    script = project.get("script", {})
    if "script" in required:
        if not isinstance(script, dict):
            script = {}
        text = script.get("text")
        if not nonempty(text) or not valid_sha(script.get("sha256")) or digest(text) != script.get("sha256"):
            err("script", "script_lock", "Script must match its approved SHA-256 byte-for-byte.")
        if script.get("human_approved") is not True:
            err("script", "script_approval", "Explicit script approval required.")

    treatment = project.get("treatment", {})
    if "treatment" in required:
        if not isinstance(treatment, dict) or not all(nonempty(treatment.get(k)) for k in ("editorial_angle", "emotional_arc", "visual_language", "reference_notes")):
            err("treatment", "treatment_missing", "Angle, emotional arc, visual language and reference notes required.")

    voice = project.get("voice", {})
    if "voice" in required:
        if not isinstance(voice, dict):
            voice = {}
        if voice.get("speaker") != VOICE:
            err("voice", "voice_identity", "Only the user-selected Vivienne voice is allowed.")
        if voice.get("continuous_take") is not True or voice.get("same_episode") is not True:
            err("voice", "voice_continuity", "One continuous, episode-specific narration required.")
        if voice.get("script_sha256") != script.get("sha256") or not valid_sha(voice.get("audio_sha256")):
            err("voice", "voice_lock", "Narration file hash and matching script hash required.")
        if voice.get("audition_approved") is not True or not nonempty(voice.get("audition_ref")):
            err("voice", "voice_audition", "Full-length audition with documented human approval required.")
        if not isinstance(voice.get("duration_frames"), int) or voice["duration_frames"] <= 0:
            err("voice", "voice_duration", "Measured narration duration in integer frames required.")

    shots = project.get("shots", [])
    if "casting" in required:
        if not isinstance(shots, list) or len(shots) < 2:
            err("casting", "shot_count", "At least two art-directed shots required.")
            shots = []
        known_claims = {f.get("id") for f in facts if isinstance(f, dict)}
        ids: set[str] = set()
        footage_assets: set[str] = set()
        for index, shot in enumerate(shots):
            if not isinstance(shot, dict):
                err("casting", "shot_type", f"Shot #{index}: expected object.")
                continue
            sid = shot.get("id")
            if not nonempty(sid) or sid in ids:
                err("casting", "shot_id", f"Shot #{index}: immutable unique ID required.")
            if nonempty(sid):
                ids.add(sid)
            label = f"Shot {sid or index}"
            if shot.get("kind") not in SHOT_KINDS or shot.get("function") not in FUNCTIONS:
                err("casting", "shot_semantics", f"{label}: valid kind and narrative function required.")
            if not nonempty(shot.get("visual_message")) or not nonempty(shot.get("cut_reason")):
                err("casting", "shot_intent", f"{label}: visual meaning and edit reason required.")
            if shot.get("visual_matches_claims") is not True or shot.get("approved_by_human") is not True:
                err("casting", "shot_review", f"{label}: factual correspondence and human visual approval required.")
            refs = shot.get("claim_ids", [])
            if shot.get("function") != "outro" and (not isinstance(refs, list) or not refs or not set(refs).issubset(known_claims)):
                err("casting", "claim_mapping", f"{label}: must cite existing verified claims.")
            kind = shot.get("kind")
            asset = shot.get("asset", {})
            if not isinstance(asset, dict):
                asset = {}
            if not valid_sha(asset.get("sha256")):
                err("casting", "asset_hash", f"{label}: original asset SHA-256 required.")
            if not https(asset.get("provenance_url")):
                err("casting", "provenance", f"{label}: source URL required.")
            if asset.get("rights_status") not in RIGHTS or not nonempty(asset.get("rights_ref")):
                err("casting", "rights", f"{label}: documented reuse rights required.")
            if kind in {"event_footage", "historical_archive", "documentary_context"}:
                if not nonempty(asset.get("date")) or not nonempty(asset.get("location")):
                    err("casting", "spatiotemporal", f"{label}: real footage needs date and place.")
                if kind == "event_footage" and asset.get("date") != project.get("event_date"):
                    err("casting", "false_event_footage", f"{label}: event footage date mismatch.")
            if asset.get("fabricated_event_footage") is True:
                err("casting", "fabrication", f"{label}: fabricated footage cannot depict a real event.")
            if kind in {"event_footage", "historical_archive", "documentary_context"}:
                marker = asset.get("sha256")
                if valid_sha(marker) and marker in footage_assets and shot.get("repeat_justification") is None:
                    err("casting", "repeat_footage", f"{label}: reused footage without narrative justification.")
                if valid_sha(marker):
                    footage_assets.add(marker)
        if shots and not any(isinstance(s, dict) and s.get("function") == "hook" for s in shots):
            err("casting", "missing_hook", "An opening shot must have a purposeful narrative hook.")

    if "layouts" in required:
        for shot in shots:
            if not isinstance(shot, dict):
                continue
            board = shot.get("layout", {})
            if not isinstance(board, dict) or not valid_sha(board.get("sha256")) or board.get("mobile_approved") is not True:
                err("layouts", "mobile_board", f"Shot {shot.get('id')}: approved 1080x1920 mobile artboard missing.")
        if project.get("canvas") != {"width": 1080, "height": 1920, "fps": FPS}:
            err("layouts", "canvas", "Required 1080x1920 at 30fps.")

    if "motion" in required:
        for shot in shots:
            if not isinstance(shot, dict):
                continue
            motion = shot.get("motion", {})
            if not isinstance(motion, dict) or not nonempty(motion.get("intention")) or not nonempty(motion.get("template_id")):
                err("motion", "motion_direction", f"Shot {shot.get('id')}: purposeful motion and template ID required.")
                continue
            if not valid_sha(motion.get("preview_sha256")) or motion.get("mobile_approved") is not True:
                err("motion", "motion_preview", f"Shot {shot.get('id')}: reviewed short animation needed.")

    if "edit" in required:
        expected = 0
        for shot in shots:
            if not isinstance(shot, dict):
                continue
            start, end = shot.get("start_frame"), shot.get("end_frame")
            if not isinstance(start, int) or not isinstance(end, int) or isinstance(start, bool) or isinstance(end, bool) or start != expected or end <= start:
                err("edit", "frame_timeline", f"Shot {shot.get('id')}: noncontiguous or invalid frame timing.")
                break
            expected = end
        voice_frames = voice.get("duration_frames") if isinstance(voice, dict) else None
        if shots and isinstance(voice_frames, int):
            outro = shots[-1].get("end_frame", 0) - shots[-1].get("start_frame", 0) if isinstance(shots[-1], dict) else 0
            if abs(expected - outro - voice_frames) > 3:
                err("edit", "narration_sync", "Visual documentary timeline must match continuous narration; no time-stretch.")
        if expected > FPS * 60:
            err("edit", "runtime", "This short-form profile cannot exceed 60 seconds.")
        for shot in shots:
            if isinstance(shot, dict) and not nonempty(shot.get("cut_reason")):
                err("edit", "cut_without_reason", f"Shot {shot.get('id')}: cut has no editorial purpose.")

    if "sound" in required:
        audio = project.get("audio_master", {})
        if not isinstance(audio, dict) or not valid_sha(audio.get("sha256")):
            err("sound", "audio_master", "Master with SHA-256 required.")
        else:
            lufs, peak = audio.get("integrated_lufs"), audio.get("true_peak_dbtp")
            if not isinstance(lufs, (float, int)) or isinstance(lufs, bool) or not -16 <= lufs <= -11:
                err("sound", "loudness", "Measured integrated loudness outside review envelope [-16,-11] LUFS.")
            if not isinstance(peak, (float, int)) or isinstance(peak, bool) or peak > -1:
                err("sound", "true_peak", "True peak must be <= -1 dBTP.")
            if audio.get("full_listen_approved") is not True:
                err("sound", "listening", "Full-length human listen required.")

    if "qa" in required:
        qa = project.get("quality_review", {})
        if not isinstance(qa, dict):
            qa = {}
        for field in ("every_shot_reviewed", "full_mobile_playback_approved",
                      "subtitle_alignment_approved", "fact_visual_consistency_approved",
                      "no_debug_text_in_pixels"):
            if qa.get(field) is not True:
                err("qa", field, f"Full human/technical QA requirement: {field}.")
        if not valid_sha(qa.get("final_preview_sha256")):
            err("qa", "preview_hash", "QA must refer to exact preview bytes.")

    if "delivery" in required:
        delivery = project.get("delivery", {})
        if not isinstance(delivery, dict):
            delivery = {}
        for key in ("mp4_sha256", "publication_manifest_sha256"):
            if not valid_sha(delivery.get(key)):
                err("delivery", key, f"{key} must identify immutable exported bytes.")
        if delivery.get("human_release_approved") is not True:
            err("delivery", "release_permission", "Human permission is required; a CI pass is not publication consent.")
        if voice.get("licensed_provider_for_publication") is not True:
            err("delivery", "voice_rights", "Narration provider's commercial permissions not evidenced.")
        if delivery.get("outro_original_g0") is not True:
            err("delivery", "g0", "Exact original G0 outro required.")

    if not issues:
        warnings.append("Preflight validates declarations and hashes, not the actual aesthetics, news truth, rights contracts or iPhone playback.")
    return {"schema": SCHEMA, "until": until, "passed": not issues,
            "issues": issues, "warnings": warnings, "checked_gates": list(required)}


def markdown_report(project: dict[str, Any], result: dict[str, Any]) -> str:
    rows = ["# World-Vision — contrôle du conducteur", "",
            f"- Épisode : `{project.get('episode_id', 'absent')}`",
            f"- Dernière étape demandée : **{result['until']}**",
            f"- Verdict structurel : **{'PASS' if result['passed'] else 'BLOCKED'}**",
            "- Ce résultat ne constitue ni une validation esthétique, ni une autorisation de diffusion.", "",
            "## Bloquants", ""]
    rows.extend(f"- **{i['gate']} / {i['code']}** — {i['message']}" for i in result["issues"])
    if not result["issues"]:
        rows.append("- Aucun blocage structurel détecté.")
    rows += ["", "## Tableau des plans", "",
             "| Plan | Images | Rôle | Source | Statut |",
             "|---|---:|---|---|---|"]
    for shot in project.get("shots", []):
        if not isinstance(shot, dict):
            continue
        src = shot.get("asset", {})
        if not isinstance(src, dict):
            src = {}
        frames = f"{shot.get('start_frame', '?')}–{shot.get('end_frame', '?')}"
        rows.append(f"| {shot.get('id', '?')} | {frames} | {shot.get('function', '?')} | "
                    f"{src.get('provenance_url', 'manquante')} | "
                    f"{'verrouillé' if shot.get('approved_by_human') else 'à revoir'} |")
    rows += ["", "## Suite", "", "Examiner chaque preuve dans son outil d'origine, approuver explicitement les changements et ne recalculer que les plans modifiés.", ""]
    return "\n".join(rows)


def main() -> int:
    parser = argparse.ArgumentParser(description="Fail-closed cinematic gate preflight")
    parser.add_argument("manifest", type=Path)
    parser.add_argument("--until", choices=GATES, default="casting")
    parser.add_argument("--report", type=Path, help="Export human-readable storyboard review")
    args = parser.parse_args()
    try:
        project = json.loads(args.manifest.read_text(encoding="utf-8"))
    except (OSError, ValueError) as exc:
        print(json.dumps({"passed": False, "error": str(exc)}, ensure_ascii=False))
        return 2
    result = validate(project, until=args.until)
    print(json.dumps(result, ensure_ascii=False, indent=2))
    if args.report:
        args.report.parent.mkdir(parents=True, exist_ok=True)
        args.report.write_text(markdown_report(project, result), encoding="utf-8")
    return 0 if result["passed"] else 1


if __name__ == "__main__":
    raise SystemExit(main())
